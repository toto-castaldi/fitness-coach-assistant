// Shared module for generating client card markdown
// Used by helix-mcp (MCP server) and client-export Edge Functions

export interface Client {
  id: string
  first_name: string
  last_name: string
  birth_date: string | null
  age_years: number | null
  gender: "male" | "female" | null
  physical_notes: string | null
}

export interface GoalHistory {
  id: string
  goal: string
  started_at: string
}

export interface Exercise {
  name: string
}

export interface SessionExercise {
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

export interface Gym {
  id: string
  name: string
  address: string | null
  description: string | null
}

export interface Session {
  id: string
  session_date: string
  status: "planned" | "completed"
  gym_id: string | null
  gym: Gym | null
  exercises: SessionExercise[]
}

export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatExerciseDetails(exercise: SessionExercise): string {
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

export interface GenerateClientCardOptions {
  includeName?: boolean
  includeGymDescription?: boolean
}

export function generateClientCard(
  client: Client,
  goals: GoalHistory[],
  sessions: Session[],
  options: GenerateClientCardOptions = {}
): string {
  const { includeName = true, includeGymDescription = true } = options
  const displayAge = client.birth_date
    ? calculateAge(client.birth_date)
    : client.age_years

  let md = ""

  // Nome (opzionale)
  if (includeName) {
    md += `# ${client.first_name} ${client.last_name}\n\n`
  }

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
      md += `**Palestra**: ${gymName}\n`
      if (session.gym?.address) {
        md += `**Indirizzo**: ${session.gym.address}\n`
      }
      if (includeGymDescription && session.gym?.description) {
        md += `**Dettagli**: ${session.gym.description}\n`
      }
      md += "\n"

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
    md += `_Nessuna sessione registrata._\n`
  }

  return md
}
