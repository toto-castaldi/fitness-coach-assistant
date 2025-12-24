import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

interface RequestBody {
  clientId: string
  gymId?: string
}

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

function generateMarkdown(
  client: Client,
  goals: GoalHistory[],
  sessions: Session[],
  selectedGym: Gym | null
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
  md += `## Sessioni${selectedGym ? ` - ${selectedGym.name}` : ""}\n\n`
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
          // Per sessioni completate: ✓ per completato, X per saltato
          // Per sessioni pianificate: nessun simbolo
          let statusIcon = ""
          if (session.status === "completed") {
            statusIcon = ex.skipped ? "X " : "✓ "
          }
          md += `${i + 1}. ${statusIcon}${exerciseName}${details}\n`
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
    md += `_Nessuna sessione registrata${selectedGym ? ` per ${selectedGym.name}` : ""}._\n`
  }

  return md
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
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
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
    const { clientId, gymId } = body

    if (!clientId) {
      return new Response(JSON.stringify({ error: "clientId is required" }), {
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
      return new Response(
        JSON.stringify({ error: "Client not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Fetch goals (ordered by started_at descending)
    const { data: goals } = await supabase
      .from("goal_history")
      .select("*")
      .eq("client_id", clientId)
      .order("started_at", { ascending: false })

    // Fetch sessions with details
    let sessionsQuery = supabase
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

    if (gymId) {
      sessionsQuery = sessionsQuery.eq("gym_id", gymId)
    }

    const { data: sessions } = await sessionsQuery

    // Get selected gym info if filtering
    let selectedGym: Gym | null = null
    if (gymId) {
      const { data: gymData } = await supabase
        .from("gyms")
        .select("*")
        .eq("id", gymId)
        .single()
      selectedGym = gymData
    }

    // Generate markdown
    const markdown = generateMarkdown(
      client as Client,
      (goals || []) as GoalHistory[],
      (sessions || []) as Session[],
      selectedGym
    )

    return new Response(
      JSON.stringify({
        markdown,
        filename: `${client.last_name}_${client.first_name}_scheda.md`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Client Export Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
