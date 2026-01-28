import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2"
import {
  generateClientCard,
  formatDate,
  type Client,
  type GoalHistory,
  type Session,
  type Gym,
} from "../_shared/client-card.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-helix-api-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

// ============================================
// Types
// ============================================

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id: string | number
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id: string | number | null
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

interface ResourceContent {
  uri: string
  mimeType: string
  text: string
}

interface PromptMessage {
  role: "user" | "assistant"
  content: {
    type: "text"
    text: string
  }
}

// ============================================
// Authentication
// ============================================

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
}

async function authenticateRequest(req: Request): Promise<{ userId: string; supabase: SupabaseClient } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  console.log("[AUTH] Starting authentication...")

  // Try API key first (X-Helix-API-Key header)
  const apiKey = req.headers.get("X-Helix-API-Key")
  if (apiKey) {
    console.log("[AUTH] Found X-Helix-API-Key header")
    const hashedKey = await hashApiKey(apiKey)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await adminClient
      .from("coach_ai_settings")
      .select("user_id")
      .eq("helix_mcp_api_key_hash", hashedKey)
      .single()

    if (data && !error) {
      console.log("[AUTH] API key valid, user_id:", data.user_id)
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      return { userId: data.user_id, supabase }
    }
    console.log("[AUTH] API key invalid:", error?.message)
  }

  // Fall back to Bearer token (Authorization header)
  const authHeader = req.headers.get("Authorization")
  console.log("[AUTH] Authorization header present:", !!authHeader)

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7)
    console.log("[AUTH] Bearer token length:", token.length)
    console.log("[AUTH] Token prefix:", token.substring(0, 50) + "...")

    // Try to validate with getUser(token) - works for OAuth access tokens
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log("[AUTH] Trying getUser(token) with service role...")
    const { data: { user }, error } = await adminClient.auth.getUser(token)

    if (user && !error) {
      console.log("[AUTH] OAuth token valid! user_id:", user.id)
      return { userId: user.id, supabase: adminClient }
    }
    console.log("[AUTH] getUser(token) failed:", error?.message, error?.status)

    // If that fails, try the old method with header-based auth
    console.log("[AUTH] Trying header-based auth...")
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: user2 }, error: error2 } = await supabase.auth.getUser()
    if (user2 && !error2) {
      console.log("[AUTH] Header-based auth valid! user_id:", user2.id)
      return { userId: user2.id, supabase }
    }
    console.log("[AUTH] Header-based auth failed:", error2?.message, error2?.status)
  }

  console.log("[AUTH] All authentication methods failed")
  return null
}

// ============================================
// Helper Functions
// ============================================

async function fetchClientWithDetails(supabase: SupabaseClient, userId: string, clientId: string) {
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("user_id", userId)
    .single()

  if (error || !client) return null

  const { data: goals } = await supabase
    .from("goal_history")
    .select("*")
    .eq("client_id", clientId)
    .order("started_at", { ascending: false })

  const { data: sessions } = await supabase
    .from("sessions")
    .select(`
      *,
      gym:gyms(*),
      exercises:session_exercises(
        *,
        exercise:exercises(*)
      )
    `)
    .eq("client_id", clientId)
    .order("session_date", { ascending: false })

  return { client, goals: goals || [], sessions: sessions || [] }
}

// ============================================
// MCP Protocol Implementation
// ============================================

const SERVER_INFO = {
  name: "helix-fitness-coach",
  version: "1.0.0",
}

const CAPABILITIES = {
  resources: { listChanged: false },
  tools: {},
  prompts: { listChanged: false },
}

// Resource definitions
function getResourceTemplates() {
  return [
    { uri: "helix://clients", name: "clients-list", description: "Lista clienti", mimeType: "application/json" },
    { uriTemplate: "helix://clients/{clientId}", name: "client-detail", description: "Dettaglio cliente", mimeType: "application/json" },
    { uriTemplate: "helix://clients/{clientId}/card", name: "client-card", description: "Scheda cliente markdown", mimeType: "text/markdown" },
    { uriTemplate: "helix://clients/{clientId}/goals", name: "client-goals", description: "Obiettivi cliente", mimeType: "application/json" },
    { uriTemplate: "helix://clients/{clientId}/sessions", name: "client-sessions", description: "Sessioni cliente", mimeType: "application/json" },
    { uri: "helix://gyms", name: "gyms-list", description: "Lista palestre", mimeType: "application/json" },
    { uriTemplate: "helix://gyms/{gymId}", name: "gym-detail", description: "Dettaglio palestra", mimeType: "application/json" },
    { uri: "helix://exercises", name: "exercises-list", description: "Lista esercizi", mimeType: "application/json" },
    { uriTemplate: "helix://exercises/{exerciseId}", name: "exercise-detail", description: "Dettaglio esercizio", mimeType: "application/json" },
    { uriTemplate: "helix://exercises/{exerciseId}/lumio", name: "exercise-lumio", description: "Scheda Lumio", mimeType: "text/markdown" },
    { uri: "helix://exercises/tags", name: "exercise-tags", description: "Lista tag esercizi", mimeType: "application/json" },
    { uri: "helix://sessions", name: "sessions-list", description: "Lista sessioni", mimeType: "application/json" },
    { uri: "helix://sessions/planned", name: "sessions-planned", description: "Sessioni pianificate", mimeType: "application/json" },
    { uriTemplate: "helix://sessions/date/{date}", name: "sessions-by-date", description: "Sessioni per data", mimeType: "application/json" },
    { uriTemplate: "helix://sessions/{sessionId}", name: "session-detail", description: "Dettaglio sessione", mimeType: "application/json" },
    { uri: "helix://coach/summary", name: "coach-summary", description: "Riepilogo coach", mimeType: "application/json" },
    { uri: "helix://today", name: "today-sessions", description: "Sessioni di oggi", mimeType: "application/json" },
  ]
}

// Tool definitions
function getToolDefinitions() {
  return [
    // ===== READ TOOLS (for Claude Web compatibility) =====
    {
      name: "list_clients",
      description: "Elenca tutti i clienti del coach con i loro dati base",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "get_client",
      description: "Ottiene i dettagli completi di un cliente specifico",
      inputSchema: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "ID del cliente" },
        },
        required: ["client_id"],
      },
    },
    {
      name: "list_exercises",
      description: "Elenca tutti gli esercizi disponibili (default + custom)",
      inputSchema: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Filtra per tag (opzionale)" },
        },
        required: [],
      },
    },
    {
      name: "list_sessions",
      description: "Elenca le sessioni di allenamento",
      inputSchema: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "Filtra per cliente (opzionale)" },
          date: { type: "string", description: "Filtra per data YYYY-MM-DD (opzionale)" },
          status: { type: "string", enum: ["planned", "completed"], description: "Filtra per stato (opzionale)" },
        },
        required: [],
      },
    },
    {
      name: "get_session",
      description: "Ottiene i dettagli completi di una sessione con esercizi",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione" },
        },
        required: ["session_id"],
      },
    },
    {
      name: "list_gyms",
      description: "Elenca tutte le palestre del coach",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "get_coach_summary",
      description: "Ottiene un riepilogo generale: conteggi clienti, sessioni, palestre e sessioni di oggi",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    // ===== WRITE TOOLS =====
    {
      name: "create_session",
      description: "Crea una nuova sessione di allenamento",
      inputSchema: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "ID del cliente" },
          session_date: { type: "string", description: "Data sessione (YYYY-MM-DD)" },
          gym_id: { type: "string", description: "ID della palestra (opzionale)" },
          notes: { type: "string", description: "Note sulla sessione" },
        },
        required: ["client_id", "session_date"],
      },
    },
    {
      name: "update_session",
      description: "Modifica una sessione esistente",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione" },
          session_date: { type: "string", description: "Nuova data (YYYY-MM-DD)" },
          gym_id: { type: "string", description: "Nuovo ID palestra" },
          notes: { type: "string", description: "Nuove note" },
          status: { type: "string", enum: ["planned", "completed"], description: "Nuovo stato" },
        },
        required: ["session_id"],
      },
    },
    {
      name: "delete_session",
      description: "Elimina una sessione",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione da eliminare" },
        },
        required: ["session_id"],
      },
    },
    {
      name: "complete_session",
      description: "Marca una sessione come completata",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione" },
        },
        required: ["session_id"],
      },
    },
    {
      name: "duplicate_session",
      description: "Duplica una sessione con nuova data",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione da duplicare" },
          new_date: { type: "string", description: "Data per la nuova sessione (YYYY-MM-DD)" },
          new_client_id: { type: "string", description: "ID cliente diverso (opzionale)" },
        },
        required: ["session_id", "new_date"],
      },
    },
    {
      name: "add_session_exercise",
      description: "Aggiunge un esercizio a una sessione",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione" },
          exercise_id: { type: "string", description: "ID dell'esercizio" },
          order_index: { type: "number", description: "Posizione nell'ordine" },
          sets: { type: "number", description: "Numero di serie" },
          reps: { type: "number", description: "Numero di ripetizioni" },
          weight_kg: { type: "number", description: "Peso in kg" },
          duration_seconds: { type: "number", description: "Durata in secondi" },
          notes: { type: "string", description: "Note sull'esercizio" },
          is_group: { type: "boolean", description: "Esercizio di gruppo" },
        },
        required: ["session_id", "exercise_id"],
      },
    },
    {
      name: "update_session_exercise",
      description: "Modifica i parametri di un esercizio in una sessione",
      inputSchema: {
        type: "object",
        properties: {
          session_exercise_id: { type: "string", description: "ID dell'esercizio nella sessione" },
          sets: { type: "number", description: "Numero di serie" },
          reps: { type: "number", description: "Numero di ripetizioni" },
          weight_kg: { type: "number", description: "Peso in kg" },
          duration_seconds: { type: "number", description: "Durata in secondi" },
          notes: { type: "string", description: "Note" },
          completed: { type: "boolean", description: "Completato" },
          skipped: { type: "boolean", description: "Saltato" },
          is_group: { type: "boolean", description: "Esercizio di gruppo" },
        },
        required: ["session_exercise_id"],
      },
    },
    {
      name: "remove_session_exercise",
      description: "Rimuove un esercizio da una sessione",
      inputSchema: {
        type: "object",
        properties: {
          session_exercise_id: { type: "string", description: "ID dell'esercizio nella sessione" },
        },
        required: ["session_exercise_id"],
      },
    },
    {
      name: "reorder_session_exercises",
      description: "Riordina gli esercizi in una sessione",
      inputSchema: {
        type: "object",
        properties: {
          session_id: { type: "string", description: "ID della sessione" },
          exercise_ids: { type: "array", items: { type: "string" }, description: "Array di ID esercizi nell'ordine desiderato" },
        },
        required: ["session_id", "exercise_ids"],
      },
    },
    {
      name: "create_training_plan",
      description: "Crea una sessione completa da un piano di allenamento AI",
      inputSchema: {
        type: "object",
        properties: {
          client_id: { type: "string", description: "ID del cliente" },
          session_date: { type: "string", description: "Data sessione (YYYY-MM-DD)" },
          gym_id: { type: "string", description: "ID della palestra" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                exercise_name: { type: "string", description: "Nome dell'esercizio" },
                sets: { type: "number" },
                reps: { type: "number" },
                weight_kg: { type: "number" },
                duration_seconds: { type: "number" },
                notes: { type: "string" },
                is_group: { type: "boolean" },
              },
              required: ["exercise_name"],
            },
            description: "Lista esercizi del piano",
          },
          notes: { type: "string", description: "Note generali sulla sessione" },
        },
        required: ["client_id", "session_date", "exercises"],
      },
    },
  ]
}

// Prompt definitions
function getPromptDefinitions() {
  return [
    {
      name: "plan-session",
      description: "Genera un piano di allenamento per un cliente",
      arguments: [
        { name: "client_id", description: "ID del cliente", required: true },
        { name: "focus_areas", description: "Aree di focus (es: gambe, core)", required: false },
        { name: "session_date", description: "Data sessione (default: oggi)", required: false },
      ],
    },
    {
      name: "weekly-plan",
      description: "Pianifica più sessioni per una settimana",
      arguments: [
        { name: "client_id", description: "ID del cliente", required: true },
        { name: "start_date", description: "Data inizio settimana (YYYY-MM-DD)", required: true },
        { name: "sessions_count", description: "Numero di sessioni (1-7)", required: true },
      ],
    },
    {
      name: "session-review",
      description: "Analizza una sessione completata",
      arguments: [
        { name: "session_id", description: "ID della sessione da analizzare", required: true },
      ],
    },
    {
      name: "daily-briefing",
      description: "Riepilogo delle sessioni del giorno",
      arguments: [
        { name: "date", description: "Data (default: oggi)", required: false },
      ],
    },
  ]
}

// ============================================
// Resource Handlers
// ============================================

async function readResource(uri: string, supabase: SupabaseClient, userId: string): Promise<ResourceContent[]> {
  const url = new URL(uri)
  const path = url.pathname

  // helix://clients
  if (uri === "helix://clients") {
    const { data, error } = await supabase
      .from("clients")
      .select("id, first_name, last_name, age_years, birth_date, gender, current_goal")
      .eq("user_id", userId)
      .order("last_name")

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://clients/{id}
  const clientDetailMatch = uri.match(/^helix:\/\/clients\/([^\/]+)$/)
  if (clientDetailMatch) {
    const clientId = clientDetailMatch[1]
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("user_id", userId)
      .single()

    if (error) throw new Error(`Cliente non trovato: ${clientId}`)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }]
  }

  // helix://clients/{id}/card
  const clientCardMatch = uri.match(/^helix:\/\/clients\/([^\/]+)\/card$/)
  if (clientCardMatch) {
    const clientId = clientCardMatch[1]
    const result = await fetchClientWithDetails(supabase, userId, clientId)
    if (!result) throw new Error(`Cliente non trovato: ${clientId}`)

    const markdown = generateClientCard(
      result.client as Client,
      result.goals as GoalHistory[],
      result.sessions as Session[],
      { includeName: true, includeGymDescription: true }
    )
    return [{ uri, mimeType: "text/markdown", text: markdown }]
  }

  // helix://clients/{id}/goals
  const clientGoalsMatch = uri.match(/^helix:\/\/clients\/([^\/]+)\/goals$/)
  if (clientGoalsMatch) {
    const clientId = clientGoalsMatch[1]
    const { data, error } = await supabase
      .from("goal_history")
      .select("*")
      .eq("client_id", clientId)
      .order("started_at", { ascending: false })

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://clients/{id}/sessions
  const clientSessionsMatch = uri.match(/^helix:\/\/clients\/([^\/]+)\/sessions$/)
  if (clientSessionsMatch) {
    const clientId = clientSessionsMatch[1]
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, session_date, status, notes,
        gym:gyms(id, name),
        exercises:session_exercises(
          id, order_index, sets, reps, weight_kg, duration_seconds, notes, completed, skipped, is_group,
          exercise:exercises(id, name)
        )
      `)
      .eq("client_id", clientId)
      .order("session_date", { ascending: false })

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://gyms
  if (uri === "helix://gyms") {
    const { data, error } = await supabase
      .from("gyms")
      .select("*")
      .eq("user_id", userId)
      .order("name")

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://gyms/{id}
  const gymDetailMatch = uri.match(/^helix:\/\/gyms\/([^\/]+)$/)
  if (gymDetailMatch) {
    const gymId = gymDetailMatch[1]
    const { data, error } = await supabase
      .from("gyms")
      .select("*")
      .eq("id", gymId)
      .eq("user_id", userId)
      .single()

    if (error) throw new Error(`Palestra non trovata: ${gymId}`)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }]
  }

  // helix://exercises
  if (uri === "helix://exercises") {
    const { data, error } = await supabase
      .from("exercises")
      .select(`
        id, name, description, lumio_card_id,
        exercise_tags(tag)
      `)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("name")

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://exercises/tags
  if (uri === "helix://exercises/tags") {
    const { data, error } = await supabase
      .from("exercise_tags")
      .select("tag")

    if (error) throw new Error(error.message)
    const uniqueTags = [...new Set((data || []).map(d => d.tag))].sort()
    return [{ uri, mimeType: "application/json", text: JSON.stringify(uniqueTags, null, 2) }]
  }

  // helix://exercises/{id}
  const exerciseDetailMatch = uri.match(/^helix:\/\/exercises\/([^\/]+)$/)
  if (exerciseDetailMatch && exerciseDetailMatch[1] !== "tags") {
    const exerciseId = exerciseDetailMatch[1]
    const { data, error } = await supabase
      .from("exercises")
      .select(`
        *,
        exercise_tags(tag),
        lumio_card:lumio_cards(id, title, content, frontmatter)
      `)
      .eq("id", exerciseId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .single()

    if (error) throw new Error(`Esercizio non trovato: ${exerciseId}`)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }]
  }

  // helix://exercises/{id}/lumio
  const exerciseLumioMatch = uri.match(/^helix:\/\/exercises\/([^\/]+)\/lumio$/)
  if (exerciseLumioMatch) {
    const exerciseId = exerciseLumioMatch[1]
    const { data: exercise, error } = await supabase
      .from("exercises")
      .select("lumio_card_id, lumio_card:lumio_cards(content)")
      .eq("id", exerciseId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .single()

    if (error) throw new Error(`Esercizio non trovato: ${exerciseId}`)

    const lumioCard = exercise?.lumio_card as { content: string } | null
    if (!lumioCard) {
      return [{ uri, mimeType: "text/plain", text: "Nessuna scheda Lumio associata a questo esercizio." }]
    }
    return [{ uri, mimeType: "text/markdown", text: lumioCard.content }]
  }

  // helix://sessions
  if (uri === "helix://sessions") {
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, session_date, status, notes,
        client:clients!inner(id, first_name, last_name, user_id),
        gym:gyms(id, name)
      `)
      .eq("client.user_id", userId)
      .order("session_date", { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://sessions/planned
  if (uri === "helix://sessions/planned") {
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, session_date, status, notes,
        client:clients!inner(id, first_name, last_name, user_id),
        gym:gyms(id, name)
      `)
      .eq("client.user_id", userId)
      .eq("status", "planned")
      .order("session_date", { ascending: true })

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://sessions/date/{date}
  const sessionsByDateMatch = uri.match(/^helix:\/\/sessions\/date\/([^\/]+)$/)
  if (sessionsByDateMatch) {
    const date = sessionsByDateMatch[1]
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, session_date, status, notes,
        client:clients!inner(id, first_name, last_name, user_id),
        gym:gyms(id, name),
        exercises:session_exercises(
          id, order_index, sets, reps, weight_kg, duration_seconds, notes, completed, skipped, is_group,
          exercise:exercises(id, name)
        )
      `)
      .eq("client.user_id", userId)
      .eq("session_date", date)

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  // helix://sessions/{id}
  const sessionDetailMatch = uri.match(/^helix:\/\/sessions\/([^\/]+)$/)
  if (sessionDetailMatch && sessionDetailMatch[1] !== "planned" && sessionDetailMatch[1] !== "date") {
    const sessionId = sessionDetailMatch[1]
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        client:clients!inner(id, first_name, last_name, user_id),
        gym:gyms(*),
        exercises:session_exercises(
          *,
          exercise:exercises(id, name, description)
        )
      `)
      .eq("id", sessionId)
      .eq("client.user_id", userId)
      .single()

    if (error) throw new Error(`Sessione non trovata: ${sessionId}`)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }]
  }

  // helix://coach/summary
  if (uri === "helix://coach/summary") {
    const [clientsRes, sessionsRes, gymsRes, exercisesRes] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("sessions").select("id, client:clients!inner(user_id)", { count: "exact" }).eq("client.user_id", userId),
      supabase.from("gyms").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("exercises").select("id", { count: "exact" }).or(`user_id.eq.${userId},user_id.is.null`),
    ])

    return [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify({
        clients_count: clientsRes.count || 0,
        sessions_count: sessionsRes.count || 0,
        gyms_count: gymsRes.count || 0,
        exercises_count: exercisesRes.count || 0,
      }, null, 2),
    }]
  }

  // helix://today
  if (uri === "helix://today") {
    const today = new Date().toISOString().split("T")[0]
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        id, session_date, status, notes,
        client:clients!inner(id, first_name, last_name, user_id),
        gym:gyms(id, name),
        exercises:session_exercises(
          id, order_index, sets, reps, weight_kg, duration_seconds, completed, skipped, is_group,
          exercise:exercises(id, name)
        )
      `)
      .eq("client.user_id", userId)
      .eq("session_date", today)

    if (error) throw new Error(error.message)
    return [{ uri, mimeType: "application/json", text: JSON.stringify(data || [], null, 2) }]
  }

  throw new Error(`Resource not found: ${uri}`)
}

// ============================================
// Tool Handlers
// ============================================

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<{ content: Array<{ type: string; text: string }> }> {
  switch (name) {
    // ===== READ TOOLS =====
    case "list_clients": {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, birth_date, gender, physical_notes")
        .eq("user_id", userId)
        .order("last_name")

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      const clientsList = data.map((c: Client) => ({
        id: c.id,
        nome: `${c.first_name} ${c.last_name}`,
        data_nascita: c.birth_date,
        genere: c.gender,
      }))

      return { content: [{ type: "text", text: JSON.stringify(clientsList, null, 2) }] }
    }

    case "get_client": {
      const { client_id } = args as { client_id: string }

      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", client_id)
        .eq("user_id", userId)
        .single()

      if (error || !client) {
        return { content: [{ type: "text", text: "Errore: Cliente non trovato" }] }
      }

      // Get goals
      const { data: goals } = await supabase
        .from("goal_history")
        .select("*")
        .eq("client_id", client_id)
        .order("started_at", { ascending: false })

      return { content: [{ type: "text", text: JSON.stringify({ ...client, goals }, null, 2) }] }
    }

    case "list_exercises": {
      const { tag } = args as { tag?: string }

      let query = supabase
        .from("exercises")
        .select("id, name, description, tags:exercise_tags(tag)")
        .or(`user_id.is.null,user_id.eq.${userId}`)

      const { data, error } = await query

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      let exercises = data.map((e: { id: string; name: string; description: string | null; tags: Array<{ tag: string }> }) => ({
        id: e.id,
        nome: e.name,
        descrizione: e.description,
        tags: e.tags?.map((t: { tag: string }) => t.tag) || [],
      }))

      // Filter by tag if specified
      if (tag) {
        exercises = exercises.filter((e: { tags: string[] }) => e.tags.includes(tag))
      }

      return { content: [{ type: "text", text: JSON.stringify(exercises, null, 2) }] }
    }

    case "list_sessions": {
      const { client_id, date, status } = args as { client_id?: string; date?: string; status?: string }

      let query = supabase
        .from("sessions")
        .select(`
          id, session_date, status, notes,
          client:clients(id, first_name, last_name),
          gym:gyms(id, name)
        `)

      // Filter by client's user_id through join
      query = query.eq("clients.user_id", userId)

      if (client_id) {
        query = query.eq("client_id", client_id)
      }
      if (date) {
        query = query.eq("session_date", date)
      }
      if (status) {
        query = query.eq("status", status)
      }

      const { data, error } = await query.order("session_date", { ascending: false }).limit(50)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      const sessions = data?.filter((s: { client: Client | null }) => s.client !== null).map((s: { id: string; session_date: string; status: string; notes: string | null; client: { first_name: string; last_name: string } | null; gym: { name: string } | null }) => ({
        id: s.id,
        data: s.session_date,
        stato: s.status,
        cliente: s.client ? `${s.client.first_name} ${s.client.last_name}` : null,
        palestra: s.gym?.name || null,
        note: s.notes,
      }))

      return { content: [{ type: "text", text: JSON.stringify(sessions, null, 2) }] }
    }

    case "get_session": {
      const { session_id } = args as { session_id: string }

      const { data: session, error } = await supabase
        .from("sessions")
        .select(`
          *,
          client:clients(*),
          gym:gyms(*),
          exercises:session_exercises(
            *,
            exercise:exercises(id, name, description)
          )
        `)
        .eq("id", session_id)
        .single()

      if (error || !session) {
        return { content: [{ type: "text", text: "Errore: Sessione non trovata" }] }
      }

      // Verify ownership
      if ((session.client as Client)?.user_id !== userId) {
        return { content: [{ type: "text", text: "Errore: Non autorizzato" }] }
      }

      return { content: [{ type: "text", text: JSON.stringify(session, null, 2) }] }
    }

    case "list_gyms": {
      const { data, error } = await supabase
        .from("gyms")
        .select("id, name, address, description")
        .eq("user_id", userId)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    }

    case "get_coach_summary": {
      const today = new Date().toISOString().split("T")[0]

      const [clientsRes, sessionsRes, gymsRes, todayRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("sessions").select("id, clients!inner(user_id)", { count: "exact" }).eq("clients.user_id", userId),
        supabase.from("gyms").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("sessions").select("id, session_date, status, clients!inner(first_name, last_name, user_id)").eq("clients.user_id", userId).eq("session_date", today),
      ])

      const summary = {
        totale_clienti: clientsRes.count || 0,
        totale_sessioni: sessionsRes.count || 0,
        totale_palestre: gymsRes.count || 0,
        sessioni_oggi: todayRes.data?.map((s: { id: string; session_date: string; status: string; clients: { first_name: string; last_name: string } }) => ({
          id: s.id,
          cliente: `${s.clients.first_name} ${s.clients.last_name}`,
          stato: s.status,
        })) || [],
      }

      return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] }
    }

    // ===== WRITE TOOLS =====
    case "create_session": {
      const { client_id, session_date, gym_id, notes } = args as {
        client_id: string
        session_date: string
        gym_id?: string
        notes?: string
      }

      // Verify client belongs to user
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .select("id")
        .eq("id", client_id)
        .eq("user_id", userId)
        .single()

      if (clientErr || !client) {
        return { content: [{ type: "text", text: "Errore: Cliente non trovato o non autorizzato" }] }
      }

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          client_id,
          session_date,
          gym_id: gym_id || null,
          notes: notes || null,
          status: "planned",
        })
        .select("id")
        .single()

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: `Sessione creata con successo. ID: ${data.id}` }] }
    }

    case "update_session": {
      const { session_id, session_date, gym_id, notes, status } = args as {
        session_id: string
        session_date?: string
        gym_id?: string
        notes?: string
        status?: string
      }

      const updates: Record<string, unknown> = {}
      if (session_date !== undefined) updates.session_date = session_date
      if (gym_id !== undefined) updates.gym_id = gym_id
      if (notes !== undefined) updates.notes = notes
      if (status !== undefined) updates.status = status

      const { error } = await supabase
        .from("sessions")
        .update(updates)
        .eq("id", session_id)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: `Sessione ${session_id} aggiornata con successo.` }] }
    }

    case "delete_session": {
      const { session_id } = args as { session_id: string }

      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", session_id)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: `Sessione ${session_id} eliminata con successo.` }] }
    }

    case "complete_session": {
      const { session_id } = args as { session_id: string }

      const { error } = await supabase
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", session_id)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: `Sessione ${session_id} completata.` }] }
    }

    case "duplicate_session": {
      const { session_id, new_date, new_client_id } = args as {
        session_id: string
        new_date: string
        new_client_id?: string
      }

      // Fetch original session
      const { data: original, error: fetchErr } = await supabase
        .from("sessions")
        .select(`
          client_id, gym_id, notes,
          exercises:session_exercises(exercise_id, order_index, sets, reps, weight_kg, duration_seconds, notes, is_group)
        `)
        .eq("id", session_id)
        .single()

      if (fetchErr || !original) {
        return { content: [{ type: "text", text: "Errore: Sessione non trovata" }] }
      }

      // Create new session
      const { data: newSession, error: createErr } = await supabase
        .from("sessions")
        .insert({
          client_id: new_client_id || original.client_id,
          gym_id: original.gym_id,
          session_date: new_date,
          notes: original.notes,
          status: "planned",
        })
        .select("id")
        .single()

      if (createErr || !newSession) {
        return { content: [{ type: "text", text: `Errore: ${createErr?.message}` }] }
      }

      // Copy exercises
      const exercises = original.exercises as Array<{
        exercise_id: string
        order_index: number
        sets: number | null
        reps: number | null
        weight_kg: number | null
        duration_seconds: number | null
        notes: string | null
        is_group: boolean
      }>

      if (exercises && exercises.length > 0) {
        const newExercises = exercises.map(ex => ({
          session_id: newSession.id,
          exercise_id: ex.exercise_id,
          order_index: ex.order_index,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg,
          duration_seconds: ex.duration_seconds,
          notes: ex.notes,
          completed: false,
          skipped: false,
          is_group: ex.is_group,
        }))

        await supabase.from("session_exercises").insert(newExercises)
      }

      return { content: [{ type: "text", text: `Sessione duplicata con successo. Nuova sessione ID: ${newSession.id}` }] }
    }

    case "add_session_exercise": {
      const { session_id, exercise_id, order_index, sets, reps, weight_kg, duration_seconds, notes, is_group } = args as {
        session_id: string
        exercise_id: string
        order_index?: number
        sets?: number
        reps?: number
        weight_kg?: number
        duration_seconds?: number
        notes?: string
        is_group?: boolean
      }

      // Get max order_index if not provided
      let finalOrderIndex = order_index
      if (finalOrderIndex === undefined) {
        const { data: existing } = await supabase
          .from("session_exercises")
          .select("order_index")
          .eq("session_id", session_id)
          .order("order_index", { ascending: false })
          .limit(1)

        finalOrderIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0
      }

      const { data, error } = await supabase
        .from("session_exercises")
        .insert({
          session_id,
          exercise_id,
          order_index: finalOrderIndex,
          sets: sets || null,
          reps: reps || null,
          weight_kg: weight_kg || null,
          duration_seconds: duration_seconds || null,
          notes: notes || null,
          completed: false,
          skipped: false,
          is_group: is_group || false,
        })
        .select("id")
        .single()

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: `Esercizio aggiunto alla sessione. ID: ${data.id}` }] }
    }

    case "update_session_exercise": {
      const { session_exercise_id, sets, reps, weight_kg, duration_seconds, notes, completed, skipped, is_group } = args as {
        session_exercise_id: string
        sets?: number
        reps?: number
        weight_kg?: number
        duration_seconds?: number
        notes?: string
        completed?: boolean
        skipped?: boolean
        is_group?: boolean
      }

      const updates: Record<string, unknown> = {}
      if (sets !== undefined) updates.sets = sets
      if (reps !== undefined) updates.reps = reps
      if (weight_kg !== undefined) updates.weight_kg = weight_kg
      if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds
      if (notes !== undefined) updates.notes = notes
      if (completed !== undefined) updates.completed = completed
      if (skipped !== undefined) updates.skipped = skipped
      if (is_group !== undefined) updates.is_group = is_group

      const { error } = await supabase
        .from("session_exercises")
        .update(updates)
        .eq("id", session_exercise_id)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: `Esercizio ${session_exercise_id} aggiornato.` }] }
    }

    case "remove_session_exercise": {
      const { session_exercise_id } = args as { session_exercise_id: string }

      const { error } = await supabase
        .from("session_exercises")
        .delete()
        .eq("id", session_exercise_id)

      if (error) {
        return { content: [{ type: "text", text: `Errore: ${error.message}` }] }
      }

      return { content: [{ type: "text", text: "Esercizio rimosso dalla sessione." }] }
    }

    case "reorder_session_exercises": {
      const { session_id, exercise_ids } = args as { session_id: string; exercise_ids: string[] }

      // Update each exercise with new order_index
      const updates = exercise_ids.map((id, index) =>
        supabase
          .from("session_exercises")
          .update({ order_index: index })
          .eq("id", id)
          .eq("session_id", session_id)
      )

      await Promise.all(updates)

      return { content: [{ type: "text", text: "Esercizi riordinati con successo." }] }
    }

    case "create_training_plan": {
      const { client_id, session_date, gym_id, exercises, notes } = args as {
        client_id: string
        session_date: string
        gym_id?: string
        exercises: Array<{
          exercise_name: string
          sets?: number
          reps?: number
          weight_kg?: number
          duration_seconds?: number
          notes?: string
          is_group?: boolean
        }>
        notes?: string
      }

      // Verify client belongs to user
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .select("id")
        .eq("id", client_id)
        .eq("user_id", userId)
        .single()

      if (clientErr || !client) {
        return { content: [{ type: "text", text: "Errore: Cliente non trovato o non autorizzato" }] }
      }

      // Create session
      const { data: session, error: sessionErr } = await supabase
        .from("sessions")
        .insert({
          client_id,
          session_date,
          gym_id: gym_id || null,
          notes: notes || null,
          status: "planned",
        })
        .select("id")
        .single()

      if (sessionErr || !session) {
        return { content: [{ type: "text", text: `Errore creazione sessione: ${sessionErr?.message}` }] }
      }

      // Match exercises by name and create session_exercises
      const exerciseResults: string[] = []

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i]

        // Find exercise by name (case-insensitive)
        const { data: foundExercise } = await supabase
          .from("exercises")
          .select("id, name")
          .or(`user_id.eq.${userId},user_id.is.null`)
          .ilike("name", ex.exercise_name)
          .limit(1)

        if (foundExercise && foundExercise.length > 0) {
          await supabase
            .from("session_exercises")
            .insert({
              session_id: session.id,
              exercise_id: foundExercise[0].id,
              order_index: i,
              sets: ex.sets || null,
              reps: ex.reps || null,
              weight_kg: ex.weight_kg || null,
              duration_seconds: ex.duration_seconds || null,
              notes: ex.notes || null,
              completed: false,
              skipped: false,
              is_group: ex.is_group || false,
            })
          exerciseResults.push(`✓ ${ex.exercise_name}`)
        } else {
          exerciseResults.push(`✗ ${ex.exercise_name} (non trovato)`)
        }
      }

      return {
        content: [{
          type: "text",
          text: `Piano creato con successo!\n\nSessione ID: ${session.id}\nData: ${session_date}\n\nEsercizi:\n${exerciseResults.join("\n")}`,
        }],
      }
    }

    default:
      return { content: [{ type: "text", text: `Tool sconosciuto: ${name}` }] }
  }
}

// ============================================
// Prompt Handlers
// ============================================

async function getPrompt(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient,
  userId: string
): Promise<{ messages: PromptMessage[] }> {
  switch (name) {
    case "plan-session": {
      const { client_id, focus_areas, session_date } = args as {
        client_id: string
        focus_areas?: string
        session_date?: string
      }

      const result = await fetchClientWithDetails(supabase, userId, client_id)
      if (!result) throw new Error(`Cliente non trovato: ${client_id}`)

      const clientCard = generateClientCard(
        result.client as Client,
        result.goals as GoalHistory[],
        result.sessions as Session[],
        { includeName: false, includeGymDescription: true }
      )

      // Fetch exercises
      const { data: exercises } = await supabase
        .from("exercises")
        .select("name, exercise_tags(tag)")
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order("name")

      // Fetch gyms
      const { data: gyms } = await supabase
        .from("gyms")
        .select("name, address")
        .eq("user_id", userId)

      const date = session_date || new Date().toISOString().split("T")[0]
      const focusText = focus_areas ? `\n\nFOCUS RICHIESTO: ${focus_areas}` : ""

      const exerciseList = (exercises || [])
        .slice(0, 50)
        .map(e => {
          const tags = (e.exercise_tags as Array<{ tag: string }>)?.map(t => t.tag).join(", ")
          return `- ${e.name}${tags ? ` [${tags}]` : ""}`
        })
        .join("\n")

      const gymList = (gyms || [])
        .map(g => `- ${g.name}${g.address ? ` (${g.address})` : ""}`)
        .join("\n") || "Nessuna palestra registrata"

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Sei un personal trainer esperto. Pianifica una sessione di allenamento.

SCHEDA CLIENTE:
${clientCard}

DATA SESSIONE: ${date}${focusText}

ESERCIZI DISPONIBILI:
${exerciseList}

PALESTRE DISPONIBILI:
${gymList}

Crea un piano di allenamento dettagliato considerando:
1. Obiettivo attuale del cliente
2. Storico sessioni precedenti
3. Condizioni fisiche (anamnesi)
4. Progressione rispetto alle sessioni passate

Proponi la lista degli esercizi con serie, ripetizioni, pesi e note.
Quando il piano e' confermato, usa il tool "create_training_plan" per crearlo in Helix.`,
          },
        }],
      }
    }

    case "weekly-plan": {
      const { client_id, start_date, sessions_count } = args as {
        client_id: string
        start_date: string
        sessions_count: string | number
      }

      const result = await fetchClientWithDetails(supabase, userId, client_id)
      if (!result) throw new Error(`Cliente non trovato: ${client_id}`)

      const clientCard = generateClientCard(
        result.client as Client,
        result.goals as GoalHistory[],
        result.sessions as Session[],
        { includeName: false }
      )

      const { data: exercises } = await supabase
        .from("exercises")
        .select("name")
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order("name")
        .limit(50)

      const exerciseNames = (exercises || []).map(e => e.name).join(", ")

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Sei un personal trainer esperto. Pianifica ${sessions_count} sessioni di allenamento per la settimana che inizia il ${start_date}.

SCHEDA CLIENTE:
${clientCard}

ESERCIZI DISPONIBILI: ${exerciseNames}

Crea un piano settimanale bilanciato che:
1. Alterna gruppi muscolari
2. Include recupero adeguato
3. Progredisce rispetto alle sessioni precedenti
4. Considera l'obiettivo del cliente

Per ogni sessione specifica: data, esercizi, serie, ripetizioni, pesi e note.`,
          },
        }],
      }
    }

    case "session-review": {
      const { session_id } = args as { session_id: string }

      const { data: session, error } = await supabase
        .from("sessions")
        .select(`
          *,
          client:clients!inner(id, first_name, last_name, current_goal, user_id),
          gym:gyms(name),
          exercises:session_exercises(
            sets, reps, weight_kg, duration_seconds, notes, completed, skipped,
            exercise:exercises(name)
          )
        `)
        .eq("id", session_id)
        .eq("client.user_id", userId)
        .single()

      if (error || !session) throw new Error(`Sessione non trovata: ${session_id}`)

      const exerciseDetails = (session.exercises as Array<{
        sets: number | null
        reps: number | null
        weight_kg: number | null
        duration_seconds: number | null
        notes: string | null
        completed: boolean
        skipped: boolean
        exercise: { name: string } | null
      }>).map(ex => {
        const status = ex.skipped ? "[SALTATO]" : ex.completed ? "[COMPLETATO]" : "[NON COMPLETATO]"
        const details = [
          ex.sets && `${ex.sets} serie`,
          ex.reps && `${ex.reps} reps`,
          ex.weight_kg && `${ex.weight_kg}kg`,
          ex.duration_seconds && `${ex.duration_seconds}s`,
        ].filter(Boolean).join(", ")
        return `- ${ex.exercise?.name || "Sconosciuto"} ${status}: ${details}${ex.notes ? ` (${ex.notes})` : ""}`
      }).join("\n")

      const clientInfo = session.client as { first_name: string; last_name: string; current_goal: string | null }

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Analizza questa sessione di allenamento completata e fornisci feedback.

CLIENTE: ${clientInfo.first_name} ${clientInfo.last_name}
OBIETTIVO: ${clientInfo.current_goal || "Non specificato"}
DATA: ${session.session_date}
PALESTRA: ${(session.gym as { name: string } | null)?.name || "Non specificata"}

ESERCIZI:
${exerciseDetails}

NOTE SESSIONE: ${session.notes || "Nessuna"}

Fornisci:
1. Valutazione generale della sessione
2. Analisi degli esercizi completati vs saltati
3. Suggerimenti per la prossima sessione
4. Eventuali progressioni consigliate`,
          },
        }],
      }
    }

    case "daily-briefing": {
      const { date } = args as { date?: string }
      const targetDate = date || new Date().toISOString().split("T")[0]

      const { data: sessions } = await supabase
        .from("sessions")
        .select(`
          id, session_date, status, notes,
          client:clients!inner(first_name, last_name, current_goal, user_id),
          gym:gyms(name, address),
          exercises:session_exercises(
            exercise:exercises(name)
          )
        `)
        .eq("client.user_id", userId)
        .eq("session_date", targetDate)

      if (!sessions || sessions.length === 0) {
        return {
          messages: [{
            role: "user",
            content: {
              type: "text",
              text: `Nessuna sessione pianificata per ${targetDate}.

Vuoi che ti aiuti a pianificare qualche sessione?`,
            },
          }],
        }
      }

      const sessionsList = sessions.map(s => {
        const client = s.client as { first_name: string; last_name: string; current_goal: string | null }
        const gym = s.gym as { name: string; address: string | null } | null
        const exercises = (s.exercises as Array<{ exercise: { name: string } | null }>)
          .map(e => e.exercise?.name)
          .filter(Boolean)
          .join(", ")

        return `- **${client.first_name} ${client.last_name}** (${s.status})
  Obiettivo: ${client.current_goal || "Non specificato"}
  Palestra: ${gym?.name || "Non specificata"}
  Esercizi: ${exercises || "Nessuno"}`
      }).join("\n\n")

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `Ecco il briefing per ${targetDate}:

${sessions.length} sessioni pianificate:

${sessionsList}

Fornisci:
1. Priorita del giorno
2. Suggerimenti per ottimizzare il tempo
3. Eventuali note preparatorie per ogni cliente`,
          },
        }],
      }
    }

    default:
      throw new Error(`Prompt sconosciuto: ${name}`)
  }
}

// ============================================
// JSON-RPC Handler
// ============================================

async function handleJsonRpc(
  request: JsonRpcRequest,
  supabase: SupabaseClient,
  userId: string
): Promise<JsonRpcResponse> {
  const { id, method, params } = request

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            serverInfo: SERVER_INFO,
            capabilities: CAPABILITIES,
          },
        }

      case "initialized":
        return { jsonrpc: "2.0", id, result: {} }

      case "resources/list":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resources: getResourceTemplates().map(r => ({
              uri: r.uri || r.uriTemplate,
              name: r.name,
              description: r.description,
              mimeType: r.mimeType,
            })),
          },
        }

      case "resources/read": {
        const uri = (params as { uri: string })?.uri
        if (!uri) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing uri parameter" },
          }
        }
        const contents = await readResource(uri, supabase, userId)
        return { jsonrpc: "2.0", id, result: { contents } }
      }

      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: getToolDefinitions() },
        }

      case "tools/call": {
        const toolName = (params as { name: string })?.name
        const toolArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {}
        if (!toolName) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing tool name" },
          }
        }
        const result = await executeTool(toolName, toolArgs, supabase, userId)
        return { jsonrpc: "2.0", id, result }
      }

      case "prompts/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { prompts: getPromptDefinitions() },
        }

      case "prompts/get": {
        const promptName = (params as { name: string })?.name
        const promptArgs = (params as { arguments?: Record<string, unknown> })?.arguments || {}
        if (!promptName) {
          return {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: "Missing prompt name" },
          }
        }
        const result = await getPrompt(promptName, promptArgs, supabase, userId)
        return { jsonrpc: "2.0", id, result }
      }

      case "ping":
        return { jsonrpc: "2.0", id, result: {} }

      default:
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        }
    }
  } catch (error) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32000,
        message: error instanceof Error ? error.message : "Unknown error",
      },
    }
  }
}

// ============================================
// OAuth 2.1 Support for Claude Web
// ============================================

function getProtectedResourceMetadata(): Response {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!

  // RFC 9728 Protected Resource Metadata
  // https://datatracker.ietf.org/doc/html/rfc9728
  const metadata = {
    // The resource identifier (this MCP server)
    resource: `${supabaseUrl}/functions/v1/helix-mcp`,

    // Authorization servers that can issue tokens for this resource
    // Supabase OAuth 2.1 Server endpoint
    authorization_servers: [`${supabaseUrl}/auth/v1`],

    // How bearer tokens can be sent
    bearer_methods_supported: ["header"],

    // Scopes this resource understands
    scopes_supported: ["openid", "email", "profile"],

    // Resource documentation (optional)
    resource_documentation: "https://helix.toto-castaldi.com",

    // Human-readable name
    resource_name: "Helix Fitness Coach MCP",
  }

  console.log("[OAUTH] Protected Resource Metadata:", JSON.stringify(metadata, null, 2))

  return new Response(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Also add Cache-Control for discovery
      "Cache-Control": "max-age=3600",
    },
  })
}

function unauthorizedWithOAuthHint(): Response {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const metadataUrl = `${supabaseUrl}/functions/v1/helix-mcp/.well-known/oauth-protected-resource`

  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32000,
        message: "Unauthorized - Invalid API key or token",
      },
    }),
    {
      status: 401,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${metadataUrl}"`,
      },
    }
  )
}

// ============================================
// Main Handler
// ============================================

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)

  // ===== DEBUG: Log every request =====
  console.log("========== INCOMING REQUEST ==========")
  console.log("[REQ] Method:", req.method)
  console.log("[REQ] URL:", req.url)
  console.log("[REQ] Pathname:", url.pathname)
  console.log("[REQ] Search:", url.search)

  // Log all headers
  console.log("[REQ] Headers:")
  req.headers.forEach((value, key) => {
    // Mask sensitive values
    if (key.toLowerCase() === "authorization") {
      const masked = value.substring(0, 20) + "..." + (value.length > 20 ? `(${value.length} chars)` : "")
      console.log(`  ${key}: ${masked}`)
    } else if (key.toLowerCase() === "x-helix-api-key") {
      console.log(`  ${key}: ***masked*** (${value.length} chars)`)
    } else {
      console.log(`  ${key}: ${value}`)
    }
  })
  console.log("======================================")

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log("[CORS] Preflight request - returning 200")
    return new Response(null, { headers: corsHeaders })
  }

  // Handle Protected Resource Metadata (RFC 9728)
  // Claude Web uses this for OAuth discovery
  if (req.method === "GET" && url.pathname.endsWith("/.well-known/oauth-protected-resource")) {
    console.log("[OAUTH] Protected Resource Metadata request")
    const response = getProtectedResourceMetadata()
    console.log("[OAUTH] Returning metadata")
    return response
  }

  // Handle OAuth Authorization Server Metadata (RFC 8414)
  // Claude may request this on our server instead of the actual auth server
  // We proxy the Supabase Auth metadata
  if (req.method === "GET" && url.pathname.endsWith("/.well-known/oauth-authorization-server")) {
    console.log("[OAUTH] Authorization Server Metadata request - proxying from Supabase")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!

    try {
      // Fetch the actual OAuth metadata from Supabase Auth
      const metadataResponse = await fetch(`${supabaseUrl}/auth/v1/.well-known/openid-configuration`)
      const metadata = await metadataResponse.json()

      console.log("[OAUTH] Proxied Supabase Auth metadata")
      return new Response(JSON.stringify(metadata, null, 2), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    } catch (error) {
      console.error("[OAUTH] Failed to fetch Supabase metadata:", error)
      return new Response(JSON.stringify({
        error: "Failed to fetch authorization server metadata"
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }
  }

  // Handle token introspection or other OAuth endpoints that might be called
  if (req.method === "GET" && !url.pathname.includes("/.well-known/")) {
    console.log("[GET] Non-wellknown GET request - might be health check")
    // Could be a health check from Claude
    return new Response(JSON.stringify({
      status: "ok",
      server: "helix-mcp",
      version: "1.0.0"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }

  try {
    // Try to read body for logging
    let bodyText = ""
    try {
      bodyText = await req.text()
      console.log("[REQ] Body:", bodyText.substring(0, 500) + (bodyText.length > 500 ? "..." : ""))
    } catch {
      console.log("[REQ] Body: (could not read)")
    }

    // Authenticate request
    const auth = await authenticateRequest(req)
    if (!auth) {
      console.log("[AUTH] Authentication failed - returning 401 with OAuth hint")
      return unauthorizedWithOAuthHint()
    }

    const { userId, supabase } = auth
    console.log("[AUTH] Authenticated as user:", userId)

    // Parse JSON-RPC request
    const body = JSON.parse(bodyText) as JsonRpcRequest
    console.log("[RPC] Method:", body.method)
    console.log("[RPC] ID:", body.id)

    // Handle request
    const response = await handleJsonRpc(body, supabase, userId)
    console.log("[RPC] Response sent for method:", body.method)

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("[ERROR] MCP Server Error:", error)
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: error instanceof Error ? error.message : "Parse error",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
