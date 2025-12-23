import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  SessionWithDetails,
  SessionExerciseUpdate,
  SessionExerciseWithDetails,
} from '@/types'

export function useLiveCoaching() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all sessions for a specific date (both planned and completed)
  const fetchSessionsForDate = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select(`
        *,
        client:clients(*),
        gym:gyms(*),
        exercises:session_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('session_date', date)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setSessions([])
    } else {
      // Sort exercises by order_index
      const sessionsWithSortedExercises = (data || []).map((session) => ({
        ...session,
        exercises: session.exercises?.sort(
          (a: SessionExerciseWithDetails, b: SessionExerciseWithDetails) =>
            a.order_index - b.order_index
        ),
      }))
      setSessions(sessionsWithSortedExercises)
    }

    setLoading(false)
  }, [])

  // Update exercise parameters on the fly (optimistic update)
  const updateExerciseOnTheFly = useCallback(
    async (
      sessionId: string,
      exerciseId: string,
      updates: SessionExerciseUpdate
    ): Promise<boolean> => {
      // Optimistic update
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                exercises: session.exercises?.map((ex) =>
                  ex.id === exerciseId ? { ...ex, ...updates } : ex
                ),
              }
            : session
        )
      )

      const { error: updateError } = await supabase
        .from('session_exercises')
        .update(updates)
        .eq('id', exerciseId)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      return true
    },
    []
  )

  // Complete exercise and advance to next (optimistic update)
  // Auto-completes session if this was the last exercise
  const completeExercise = useCallback(
    async (sessionId: string, exerciseId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      const completedAt = new Date().toISOString()
      const newIndex = session.current_exercise_index + 1
      const isLastExercise = newIndex >= (session.exercises?.length || 0)

      // Optimistic update - mark exercise as completed
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                exercises: s.exercises?.map((ex) =>
                  ex.id === exerciseId
                    ? { ...ex, completed: true, completed_at: completedAt }
                    : ex
                ),
                current_exercise_index: newIndex,
                status: isLastExercise ? 'completed' as const : s.status,
              }
            : s
        )
      )

      // Update exercise as completed
      const { error: exerciseError } = await supabase
        .from('session_exercises')
        .update({ completed: true, completed_at: completedAt })
        .eq('id', exerciseId)

      if (exerciseError) {
        setError(exerciseError.message)
        return false
      }

      // Update session current_exercise_index (and status if last exercise)
      const sessionUpdate: { current_exercise_index: number; status?: string } = {
        current_exercise_index: newIndex,
      }
      if (isLastExercise) {
        sessionUpdate.status = 'completed'
      }

      const { error: sessionError } = await supabase
        .from('sessions')
        .update(sessionUpdate)
        .eq('id', sessionId)

      if (sessionError) {
        setError(sessionError.message)
        return false
      }

      return true
    },
    [sessions]
  )

  // Skip exercise and mark it as skipped
  // Auto-completes session if this was the last exercise
  const skipExercise = useCallback(
    async (sessionId: string, exerciseId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      const newIndex = session.current_exercise_index + 1
      const isLastExercise = newIndex >= (session.exercises?.length || 0)

      // Optimistic update - mark exercise as skipped
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                exercises: s.exercises?.map((ex) =>
                  ex.id === exerciseId ? { ...ex, skipped: true } : ex
                ),
                current_exercise_index: newIndex,
                status: isLastExercise ? 'completed' as const : s.status,
              }
            : s
        )
      )

      // Update exercise as skipped
      const { error: exerciseError } = await supabase
        .from('session_exercises')
        .update({ skipped: true })
        .eq('id', exerciseId)

      if (exerciseError) {
        setError(exerciseError.message)
        return false
      }

      // Update session current_exercise_index (and status if last exercise)
      const sessionUpdate: { current_exercise_index: number; status?: string } = {
        current_exercise_index: newIndex,
      }
      if (isLastExercise) {
        sessionUpdate.status = 'completed'
      }

      const { error: updateError } = await supabase
        .from('sessions')
        .update(sessionUpdate)
        .eq('id', sessionId)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      return true
    },
    [sessions]
  )

  // Go back to previous exercise
  const previousExercise = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session || session.current_exercise_index <= 0) return false

      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, current_exercise_index: s.current_exercise_index - 1 }
            : s
        )
      )

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ current_exercise_index: session.current_exercise_index - 1 })
        .eq('id', sessionId)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      return true
    },
    [sessions]
  )

  // Finish session - change status to completed
  const finishSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: 'completed' as const } : s
        )
      )

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      return true
    },
    []
  )

  // Finish all sessions for the day
  const finishAllSessions = useCallback(async (): Promise<boolean> => {
    const sessionIds = sessions.filter((s) => s.status === 'planned').map((s) => s.id)
    if (sessionIds.length === 0) return true

    // Optimistic update
    setSessions((prev) =>
      prev.map((s) =>
        sessionIds.includes(s.id) ? { ...s, status: 'completed' as const } : s
      )
    )

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .in('id', sessionIds)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    return true
  }, [sessions])

  // Replan a completed session (reset to planned state)
  const replanSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      // Optimistic update - reset session and exercises
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: 'planned' as const,
                current_exercise_index: 0,
                exercises: s.exercises?.map((ex) => ({
                  ...ex,
                  completed: false,
                  completed_at: null,
                  skipped: false,
                })),
              }
            : s
        )
      )

      // Update session status and reset index
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ status: 'planned', current_exercise_index: 0 })
        .eq('id', sessionId)

      if (sessionError) {
        setError(sessionError.message)
        return false
      }

      // Reset all exercises completed status
      const exerciseIds = session.exercises?.map((e) => e.id) || []
      if (exerciseIds.length > 0) {
        const { error: exercisesError } = await supabase
          .from('session_exercises')
          .update({ completed: false, completed_at: null, skipped: false })
          .in('id', exerciseIds)

        if (exercisesError) {
          setError(exercisesError.message)
          return false
        }
      }

      return true
    },
    [sessions]
  )

  // Get current exercise for a session
  const getCurrentExercise = useCallback(
    (sessionId: string): SessionExerciseWithDetails | null => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session || !session.exercises) return null
      return session.exercises[session.current_exercise_index] || null
    },
    [sessions]
  )

  // Get next exercise for a session
  const getNextExercise = useCallback(
    (sessionId: string): SessionExerciseWithDetails | null => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session || !session.exercises) return null
      return session.exercises[session.current_exercise_index + 1] || null
    },
    [sessions]
  )

  // Check if session is complete (all exercises done)
  const isSessionComplete = useCallback(
    (sessionId: string): boolean => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session || !session.exercises) return false
      return session.current_exercise_index >= session.exercises.length
    },
    [sessions]
  )

  return {
    sessions,
    loading,
    error,
    fetchSessionsForDate,
    updateExerciseOnTheFly,
    completeExercise,
    skipExercise,
    previousExercise,
    finishSession,
    finishAllSessions,
    replanSession,
    getCurrentExercise,
    getNextExercise,
    isSessionComplete,
  }
}
