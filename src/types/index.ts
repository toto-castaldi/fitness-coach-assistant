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

export interface GoalInsert {
  client_id: string
  goal: string
  started_at?: string
}

export interface Exercise {
  id: string
  user_id: string | null
  name: string
  description: string | null
  created_at: string
}

export interface ExerciseBlock {
  id: string
  exercise_id: string
  image_url: string | null
  description: string | null
  order_index: number
  created_at: string
}

export interface ExerciseBlockInsert {
  image_url?: string | null
  description?: string | null
  order_index?: number
}

export interface ExerciseTag {
  id: string
  exercise_id: string
  tag: string
  created_at: string
}

export interface ExerciseInsert {
  name: string
  description?: string | null
}

export interface ExerciseUpdate extends Partial<ExerciseInsert> {}

export interface ExerciseWithDetails extends Exercise {
  blocks?: ExerciseBlock[]
  tags?: ExerciseTag[]
}
