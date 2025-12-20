export interface Client {
  id: string
  user_id: string
  first_name: string
  last_name: string
  birth_date: string | null
  age_years: number | null
  current_goal: string | null
  physical_notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientInsert {
  first_name: string
  last_name: string
  birth_date?: string | null
  age_years?: number | null
  current_goal?: string | null
  physical_notes?: string | null
}

export interface ClientUpdate extends Partial<ClientInsert> {}

export interface GoalHistory {
  id: string
  client_id: string
  goal: string
  started_at: string
  ended_at: string | null
}

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  category: string | null
  description: string | null
  created_at: string
}

export interface TrainingSession {
  id: string
  client_id: string
  session_date: string
  notes: string | null
  created_at: string
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string | null
  exercise_name: string
  sets: number | null
  reps: string | null
  weight: string | null
  notes: string | null
  order_index: number
}

export interface AIGeneratedPlan {
  id: string
  client_id: string
  generated_at: string
  ai_provider: 'claude' | 'openai'
  prompt_used: string | null
  plan_content: string
  accepted: boolean
}

// Extended types with relations
export interface ClientWithSessions extends Client {
  training_sessions?: TrainingSession[]
}

export interface TrainingSessionWithExercises extends TrainingSession {
  session_exercises?: SessionExercise[]
  client?: Client
}

export interface SessionExerciseWithDetails extends SessionExercise {
  exercise?: Exercise
}
