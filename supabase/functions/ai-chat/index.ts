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
  clientContext: {
    firstName: string
    lastName: string
    age: number | null
    physicalNotes: string | null
    currentGoal: string | null
    recentSessions: Array<{
      date: string
      gymName: string | null
      exercises: Array<{
        name: string
        sets?: number | null
        reps?: number | null
        weight_kg?: number | null
        duration_seconds?: number | null
      }>
    }>
  }
  availableExercises: string[]
  availableGyms: Array<{ id: string; name: string }>
  aiSettings: AISettings
}

function buildSystemPrompt(context: RequestBody["clientContext"], exercises: string[], gyms: Array<{ id: string; name: string }>): string {
  const gymList = gyms.map(g => g.name).join(", ") || "Nessuna palestra registrata"
  const exerciseList = exercises.slice(0, 50).join(", ") // Limit to avoid token overflow

  let recentSessionsText = "Nessuna sessione precedente"
  if (context.recentSessions && context.recentSessions.length > 0) {
    recentSessionsText = context.recentSessions.map((s, i) => {
      const exercisesDesc = s.exercises.map(e => {
        let desc = e.name
        if (e.sets && e.reps) desc += ` ${e.sets}x${e.reps}`
        if (e.weight_kg) desc += ` ${e.weight_kg}kg`
        if (e.duration_seconds) desc += ` ${Math.round(e.duration_seconds / 60)}min`
        return desc
      }).join(", ")
      return `${i + 1}. ${s.date}${s.gymName ? ` @ ${s.gymName}` : ""}: ${exercisesDesc}`
    }).join("\n")
  }

  return `Sei un assistente esperto per personal trainer e istruttori di pilates. Aiuti i coach a pianificare sessioni di allenamento per i loro clienti.

CLIENTE ATTUALE:
- Nome: ${context.firstName} ${context.lastName}
- Età: ${context.age ? `${context.age} anni` : "non specificata"}
- Note fisiche: ${context.physicalNotes || "nessuna"}
- Obiettivo attuale: ${context.currentGoal || "non specificato"}

SESSIONI RECENTI:
${recentSessionsText}

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
5. Adatta l'intensità e il volume all'età e alle condizioni fisiche del cliente
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

    const body: RequestBody = await req.json()
    const { messages, clientContext, availableExercises, availableGyms, aiSettings } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
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

    // Build system prompt and prepend to messages
    const systemPrompt = buildSystemPrompt(clientContext, availableExercises, availableGyms)
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
