import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface TrainingPlanExercise {
  exercise_name: string
  sets?: number | null
  reps?: number | null
  weight_kg?: number | null
  duration_seconds?: number | null
  notes?: string | null
}

interface TrainingPlan {
  gym_name?: string | null
  session_date: string
  exercises: TrainingPlanExercise[]
  notes?: string | null
}

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface AISettings {
  provider: "openai" | "anthropic"
  model: string
  apiKey: string
}

interface RequestBody {
  messages: ChatMessage[]
  clientId: string
  aiSettings: AISettings
}

interface Client {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  age_years: number | null
  gender: "male" | "female" | null
  physical_notes: string | null
}

interface GoalHistory {
  id: string
  goal: string
  started_at: string
}

interface Exercise {
  name: string
}

interface SessionExercise {
  order_index: number
  sets: number | null
  reps: number | null
  weight_kg: number | null
  duration_seconds: number | null
  notes: string | null
  completed: boolean
  skipped: boolean
  exercise: Exercise | null
}

interface Gym {
  id: string
  name: string
}

interface Session {
  id: string
  session_date: string
  status: "planned" | "completed"
  gym_id: string | null
  gym: Gym | null
  exercises: SessionExercise[]
}

// Helper functions for generating client card markdown
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatExerciseDetails(exercise: SessionExercise): string {
  const parts: string[] = []
  if (exercise.sets) parts.push(`${exercise.sets} serie`)
  if (exercise.reps) parts.push(`${exercise.reps} reps`)
  if (exercise.weight_kg) parts.push(`${exercise.weight_kg} kg`)
  if (exercise.duration_seconds) {
    const mins = Math.floor(exercise.duration_seconds / 60)
    const secs = exercise.duration_seconds % 60
    parts.push(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`)
  }
  return parts.length > 0 ? ` - ${parts.join(", ")}` : ""
}

function generateClientCard(
  client: Client,
  goals: GoalHistory[],
  sessions: Session[]
): string {
  const displayAge = client.birth_date
    ? calculateAge(client.birth_date)
    : client.age_years

  let md = ""

  // Nome
  md += `# ${client.first_name} ${client.last_name}\n\n`

  // Dati anagrafici
  md += `## Dati Anagrafici\n\n`
  if (displayAge) {
    md += `- **Eta**: ${displayAge} anni\n`
  }
  if (client.birth_date) {
    md += `- **Data di nascita**: ${formatDate(client.birth_date)}\n`
  }
  if (client.gender) {
    md += `- **Genere**: ${client.gender === "male" ? "Maschio" : "Femmina"}\n`
  }
  md += "\n"

  // Anamnesi
  md += `## Anamnesi\n\n`
  if (client.physical_notes) {
    md += `${client.physical_notes}\n\n`
  } else {
    md += `_Nessuna nota fisica registrata._\n\n`
  }

  // Storia obiettivi (gia ordinati in ordine decrescente)
  md += `## Storia Obiettivi\n\n`
  if (goals.length > 0) {
    goals.forEach((goal, index) => {
      const isCurrent = index === 0
      const startDate = formatDate(goal.started_at)
      md += `${index + 1}. ${isCurrent ? "**[ATTUALE]** " : ""}${goal.goal} _(dal ${startDate})_\n`
    })
  } else {
    md += `_Nessun obiettivo registrato._\n`
  }
  md += "\n"

  // Sessioni (gia ordinate in ordine decrescente)
  md += `## Sessioni\n\n`
  if (sessions.length > 0) {
    sessions.forEach((session) => {
      const sessionDate = formatDate(session.session_date)
      const status = session.status === "completed" ? "Completata" : "Pianificata"
      const gymName = session.gym?.name || "Nessuna palestra"

      md += `### ${sessionDate} - ${status}\n\n`
      md += `**Palestra**: ${gymName}\n\n`

      if (session.exercises && session.exercises.length > 0) {
        const sortedExercises = [...session.exercises].sort(
          (a, b) => a.order_index - b.order_index
        )
        sortedExercises.forEach((ex, i) => {
          const exerciseName = ex.exercise?.name || "Esercizio sconosciuto"
          const details = formatExerciseDetails(ex)
          const statusIcon = ex.completed ? "[x]" : ex.skipped ? "[s]" : "[ ]"
          md += `${i + 1}. ${statusIcon} ${exerciseName}${details}\n`
          if (ex.notes) {
            md += `   - _${ex.notes}_\n`
          }
        })
      } else {
        md += `_Nessun esercizio in questa sessione._\n`
      }
      md += "\n"
    })
  } else {
    md += `_Nessuna sessione registrata._\n`
  }

  return md
}

function buildSystemPrompt(clientCard: string, exercises: string[], gyms: Array<{ id: string; name: string }>): string {
  const gymList = gyms.map(g => g.name).join(", ") || "Nessuna palestra registrata"
  const exerciseList = exercises.slice(0, 50).join(", ") // Limit to avoid token overflow

  return `Sei un assistente esperto per personal trainer e istruttori di pilates. Aiuti i coach a pianificare sessioni di allenamento per i loro clienti.

SCHEDA CLIENTE:
${clientCard}

PALESTRE DISPONIBILI:
${gymList}

ESERCIZI DISPONIBILI (esempi):
${exerciseList}

ISTRUZIONI:
1. Rispondi sempre in italiano
2. Quando proponi un piano di allenamento, descrivi prima gli esercizi in modo conversazionale
3. Quando il coach conferma il piano, rispondi con un blocco JSON strutturato nel formato:
\`\`\`training_plan
{
  "gym_name": "nome palestra o null",
  "session_date": "YYYY-MM-DD",
  "exercises": [
    {
      "exercise_name": "Nome Esercizio",
      "sets": 3,
      "reps": 12,
      "weight_kg": null,
      "duration_seconds": null,
      "notes": "note opzionali"
    }
  ],
  "notes": "note generali sessione"
}
\`\`\`
4. Usa solo esercizi dalla lista disponibile quando possibile, altrimenti suggerisci nuovi esercizi descrivendoli
5. Adatta l'intensita e il volume all'eta e alle condizioni fisiche del cliente
6. Considera l'obiettivo del cliente nella scelta degli esercizi
7. Proponi progressione rispetto alle sessioni precedenti quando appropriato`
}

async function callOpenAI(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  // Newer models (o1, o3, etc.) use max_completion_tokens instead of max_tokens
  const isReasoningModel = model.startsWith('o1') || model.startsWith('o3')

  const requestBody: Record<string, unknown> = {
    model: model,
    messages: messages,
  }

  if (isReasoningModel) {
    requestBody.max_completion_tokens = 16000
    // Reasoning models don't support temperature
  } else {
    requestBody.max_tokens = 2000
    requestBody.temperature = 0.7
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

async function callAnthropic(messages: ChatMessage[], apiKey: string, model: string): Promise<string> {
  // Extract system message
  const systemMessage = messages.find(m => m.role === "system")?.content || ""
  const chatMessages = messages.filter(m => m.role !== "system")

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 2000,
      system: systemMessage,
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.content[0]?.text || ""
}

function extractTrainingPlan(content: string): TrainingPlan | null {
  const planMatch = content.match(/```training_plan\s*([\s\S]*?)\s*```/)
  if (!planMatch) return null

  try {
    const plan = JSON.parse(planMatch[1])
    // Validate required fields
    if (!plan.session_date || !Array.isArray(plan.exercises)) {
      return null
    }
    return plan as TrainingPlan
  } catch {
    return null
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const body: RequestBody = await req.json()
    const { messages, clientId, aiSettings } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!clientId) {
      return new Response(JSON.stringify({ error: "clientId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!aiSettings || !aiSettings.apiKey) {
      return new Response(JSON.stringify({ error: "API key non configurata. Vai nelle impostazioni per configurare la tua API key." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Fetch goals (ordered by started_at descending)
    const { data: goals } = await supabase
      .from("goal_history")
      .select("*")
      .eq("client_id", clientId)
      .order("started_at", { ascending: false })

    // Fetch sessions with details
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

    // Fetch available exercises
    const { data: exercises } = await supabase
      .from("exercises")
      .select("name")
      .order("name")

    // Fetch available gyms
    const { data: gyms } = await supabase
      .from("gyms")
      .select("id, name")
      .order("name")

    // Generate client card markdown
    const clientCard = generateClientCard(
      client as Client,
      (goals || []) as GoalHistory[],
      (sessions || []) as Session[]
    )

    // Build system prompt with client card
    const systemPrompt = buildSystemPrompt(
      clientCard,
      (exercises || []).map(e => e.name),
      gyms || []
    )

    const fullMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ]

    // Call AI provider based on settings
    let responseContent: string

    if (aiSettings.provider === "anthropic") {
      responseContent = await callAnthropic(fullMessages, aiSettings.apiKey, aiSettings.model)
    } else {
      responseContent = await callOpenAI(fullMessages, aiSettings.apiKey, aiSettings.model)
    }

    // Check if response contains a training plan
    const plan = extractTrainingPlan(responseContent)

    return new Response(JSON.stringify({
      message: responseContent,
      plan: plan,
      provider: aiSettings.provider,
      model: aiSettings.model,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error) {
    console.error("AI Chat Error:", error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
