import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  Exercise,
  ExerciseWithDetails,
  ExerciseInsert,
  ExerciseUpdate,
  LumioLocalCardWithRepository
} from '@/types'

export function useExercises() {
  const [exercises, setExercises] = useState<ExerciseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch only user's exercises (not default ones)
    const { data: exercisesData, error: fetchError } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', user?.id)
      .order('name', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    if (!exercisesData || exercisesData.length === 0) {
      setExercises([])
      setLoading(false)
      return
    }

    // Fetch tags, session references with status and lumio cards for all exercises
    const exerciseIds = exercisesData.map(e => e.id)
    const lumioCardIds = exercisesData
      .map(e => e.lumio_card_id)
      .filter((id): id is string => id !== null)

    const [tagsResult, sessionsResult, lumioCardsResult] = await Promise.all([
      supabase
        .from('exercise_tags')
        .select('*')
        .in('exercise_id', exerciseIds),
      supabase
        .from('session_exercises')
        .select('exercise_id, sessions!inner(status)')
        .in('exercise_id', exerciseIds),
      lumioCardIds.length > 0
        ? supabase
            .from('lumio_cards')
            .select('*, repository:lumio_repositories(*)')
            .in('id', lumioCardIds)
        : Promise.resolve({ data: [] as LumioLocalCardWithRepository[], error: null })
    ])

    const tagsMap = new Map<string, typeof tagsResult.data>()
    const sessionsCountMap = new Map<string, number>()
    const plannedSessionsCountMap = new Map<string, number>()
    const lumioCardsMap = new Map<string, LumioLocalCardWithRepository>()

    tagsResult.data?.forEach(tag => {
      const existing = tagsMap.get(tag.exercise_id) || []
      tagsMap.set(tag.exercise_id, [...existing, tag])
    })

    sessionsResult.data?.forEach((ref) => {
      const exerciseId = ref.exercise_id as string
      // sessions comes as object from !inner join
      const session = ref.sessions as unknown as { status: string }

      const count = sessionsCountMap.get(exerciseId) || 0
      sessionsCountMap.set(exerciseId, count + 1)

      // Count planned sessions
      if (session?.status === 'planned') {
        const plannedCount = plannedSessionsCountMap.get(exerciseId) || 0
        plannedSessionsCountMap.set(exerciseId, plannedCount + 1)
      }
    })

    lumioCardsResult.data?.forEach(card => {
      lumioCardsMap.set(card.id, card as LumioLocalCardWithRepository)
    })

    const exercisesWithDetails: ExerciseWithDetails[] = exercisesData.map(exercise => ({
      ...exercise,
      tags: tagsMap.get(exercise.id) || [],
      sessionsCount: sessionsCountMap.get(exercise.id) || 0,
      plannedSessionsCount: plannedSessionsCountMap.get(exercise.id) || 0,
      lumio_card: exercise.lumio_card_id ? lumioCardsMap.get(exercise.lumio_card_id) || null : null
    }))

    // Sort exercises:
    // 1. Exercises in at least one planned session
    // 2. Exercises with no session assignments
    // 3. Remaining (exercises only in completed sessions)
    exercisesWithDetails.sort((a, b) => {
      const aPlanned = (a.plannedSessionsCount || 0) > 0
      const bPlanned = (b.plannedSessionsCount || 0) > 0
      const aNoSessions = (a.sessionsCount || 0) === 0
      const bNoSessions = (b.sessionsCount || 0) === 0

      // Priority: planned > no sessions > completed only
      const aPriority = aPlanned ? 0 : aNoSessions ? 1 : 2
      const bPriority = bPlanned ? 0 : bNoSessions ? 1 : 2

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      // Same priority: sort alphabetically by name
      return a.name.localeCompare(b.name)
    })

    setExercises(exercisesWithDetails)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const createExercise = async (
    exercise: ExerciseInsert,
    tags: string[]
  ): Promise<ExerciseWithDetails | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Utente non autenticato')
      return null
    }

    // Create exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .insert({ ...exercise, user_id: user.id })
      .select()
      .single()

    if (exerciseError) {
      setError(exerciseError.message)
      return null
    }

    // Create tags
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        exercise_id: exerciseData.id,
        tag
      }))

      const { error: tagsError } = await supabase
        .from('exercise_tags')
        .insert(tagsToInsert)

      if (tagsError) {
        setError(tagsError.message)
      }
    }

    await fetchExercises()
    return exerciseData
  }

  const updateExercise = async (
    id: string,
    exercise: ExerciseUpdate,
    tags: string[]
  ): Promise<Exercise | null> => {
    // Update exercise
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .update(exercise)
      .eq('id', id)
      .select()
      .single()

    if (exerciseError) {
      setError(exerciseError.message)
      return null
    }

    // Delete existing tags and recreate
    await supabase.from('exercise_tags').delete().eq('exercise_id', id)

    // Recreate tags
    if (tags.length > 0) {
      const tagsToInsert = tags.map(tag => ({
        exercise_id: id,
        tag
      }))

      await supabase.from('exercise_tags').insert(tagsToInsert)
    }

    await fetchExercises()
    return exerciseData
  }

  const deleteExercise = async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setExercises(prev => prev.filter(e => e.id !== id))
    return true
  }

  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>()
    exercises.forEach(ex => {
      ex.tags?.forEach(t => tagSet.add(t.tag))
    })
    return Array.from(tagSet).sort()
  }, [exercises])

  return {
    exercises,
    loading,
    error,
    createExercise,
    updateExercise,
    deleteExercise,
    getAllTags,
    refetch: fetchExercises,
  }
}
