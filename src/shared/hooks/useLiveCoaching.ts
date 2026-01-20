import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/shared/lib/supabase'
import type {
  SessionWithDetails,
  SessionExerciseUpdate,
  SessionExerciseWithDetails,
  ExerciseWithDetails,
} from '@/shared/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useLiveCoaching() {
  const [sessions, setSessions] = useState<SessionWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)

  // Helper to wrap DB operations with save status tracking
  const withSaveTracking = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    // Clear any pending "saved" timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    setSaveStatus('saving')
    setSaveError(null)

    try {
      const result = await operation()
      setSaveStatus('saved')
      // Auto-hide "saved" status after 2 seconds
      saveTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus('idle')
      }, 2000)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto'
      setSaveStatus('error')
      setSaveError(message)
      return null
    }
  }, [])

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
          exercise:exercises(
            *,
            lumio_card:lumio_cards(*, repository:lumio_repositories(*))
          )
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

      const result = await withSaveTracking(async () => {
        const { error: updateError } = await supabase
          .from('session_exercises')
          .update(updates)
          .eq('id', exerciseId)

        if (updateError) {
          throw new Error(updateError.message)
        }
        return true
      })

      if (result === null) {
        setError(saveError)
        return false
      }

      return true
    },
    [withSaveTracking, saveError]
  )

  // Change exercise to a different one from catalog (optimistic update)
  const changeExercise = useCallback(
    async (
      sessionId: string,
      exerciseId: string,
      newExercise: ExerciseWithDetails
    ): Promise<boolean> => {
      // Optimistic update
      setSessions((prev) =>
        prev.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                exercises: session.exercises?.map((ex) =>
                  ex.id === exerciseId
                    ? { ...ex, exercise_id: newExercise.id, exercise: newExercise }
                    : ex
                ),
              }
            : session
        )
      )

      const result = await withSaveTracking(async () => {
        const { error: updateError } = await supabase
          .from('session_exercises')
          .update({ exercise_id: newExercise.id })
          .eq('id', exerciseId)

        if (updateError) {
          throw new Error(updateError.message)
        }

        return true
      })

      if (result === null) {
        setError(saveError)
        return false
      }

      return true
    },
    [withSaveTracking, saveError]
  )

  // Select a specific exercise (change current_exercise_index)
  const selectExercise = useCallback(
    async (sessionId: string, index: number): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      // Clamp index to valid range
      const maxIndex = (session.exercises?.length || 1) - 1
      const safeIndex = Math.max(0, Math.min(index, maxIndex))

      // Optimistic update
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, current_exercise_index: safeIndex } : s
        )
      )

      const result = await withSaveTracking(async () => {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({ current_exercise_index: safeIndex })
          .eq('id', sessionId)

        if (updateError) {
          throw new Error(updateError.message)
        }

        return true
      })

      if (result === null) {
        setError(saveError)
        return false
      }

      return true
    },
    [sessions, withSaveTracking, saveError]
  )

  // Complete exercise and advance to next (optimistic update)
  // Auto-completes session if ALL exercises are completed/skipped
  const completeExercise = useCallback(
    async (sessionId: string, exerciseId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      const completedAt = new Date().toISOString()
      const currentIndex = session.current_exercise_index
      const maxIndex = (session.exercises?.length || 1) - 1
      const newIndex = Math.min(currentIndex + 1, maxIndex)

      // Check if ALL exercises will be completed/skipped after this update
      const allDone = session.exercises?.every(
        (ex) => ex.id === exerciseId || ex.completed || ex.skipped
      )

      // Optimistic update - mark exercise as completed (also clears skipped)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                exercises: s.exercises?.map((ex) =>
                  ex.id === exerciseId
                    ? { ...ex, completed: true, skipped: false, completed_at: completedAt }
                    : ex
                ),
                current_exercise_index: newIndex,
                status: allDone ? 'completed' as const : s.status,
              }
            : s
        )
      )

      const result = await withSaveTracking(async () => {
        // Update exercise as completed (clear skipped flag)
        const { error: exerciseError } = await supabase
          .from('session_exercises')
          .update({ completed: true, skipped: false, completed_at: completedAt })
          .eq('id', exerciseId)

        if (exerciseError) {
          throw new Error(exerciseError.message)
        }

        // Update session current_exercise_index (and status if all done)
        const sessionUpdate: { current_exercise_index: number; status?: string } = {
          current_exercise_index: newIndex,
        }
        if (allDone) {
          sessionUpdate.status = 'completed'
        }

        const { error: sessionError } = await supabase
          .from('sessions')
          .update(sessionUpdate)
          .eq('id', sessionId)

        if (sessionError) {
          throw new Error(sessionError.message)
        }

        return true
      })

      if (result === null) {
        setError(saveError)
        return false
      }

      return true
    },
    [sessions, withSaveTracking, saveError]
  )

  // Skip exercise and mark it as skipped
  // Auto-completes session if ALL exercises are completed/skipped
  const skipExercise = useCallback(
    async (sessionId: string, exerciseId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      const currentIndex = session.current_exercise_index
      const maxIndex = (session.exercises?.length || 1) - 1
      const newIndex = Math.min(currentIndex + 1, maxIndex)

      // Check if ALL exercises will be completed/skipped after this update
      const allDone = session.exercises?.every(
        (ex) => ex.id === exerciseId || ex.completed || ex.skipped
      )

      // Optimistic update - mark exercise as skipped (also clears completed)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                exercises: s.exercises?.map((ex) =>
                  ex.id === exerciseId
                    ? { ...ex, skipped: true, completed: false, completed_at: null }
                    : ex
                ),
                current_exercise_index: newIndex,
                status: allDone ? 'completed' as const : s.status,
              }
            : s
        )
      )

      const result = await withSaveTracking(async () => {
        // Update exercise as skipped (clear completed flag)
        const { error: exerciseError } = await supabase
          .from('session_exercises')
          .update({ skipped: true, completed: false, completed_at: null })
          .eq('id', exerciseId)

        if (exerciseError) {
          throw new Error(exerciseError.message)
        }

        // Update session current_exercise_index (and status if all done)
        const sessionUpdate: { current_exercise_index: number; status?: string } = {
          current_exercise_index: newIndex,
        }
        if (allDone) {
          sessionUpdate.status = 'completed'
        }

        const { error: updateError } = await supabase
          .from('sessions')
          .update(sessionUpdate)
          .eq('id', sessionId)

        if (updateError) {
          throw new Error(updateError.message)
        }

        return true
      })

      if (result === null) {
        setError(saveError)
        return false
      }

      return true
    },
    [sessions, withSaveTracking, saveError]
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

  // Add a new exercise at current position (becomes the new current exercise)
  const addExerciseToSession = useCallback(
    async (
      sessionId: string,
      exercise: ExerciseWithDetails
    ): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session) return false

      const currentIndex = session.current_exercise_index

      // Create new session exercise at current position
      const { data: newExerciseData, error: insertError } = await supabase
        .from('session_exercises')
        .insert({
          session_id: sessionId,
          exercise_id: exercise.id,
          order_index: currentIndex,
          sets: null,
          reps: null,
          weight_kg: null,
          duration_seconds: null,
          notes: null,
          completed: false,
          skipped: false,
        })
        .select()
        .single()

      if (insertError || !newExerciseData) {
        setError(insertError?.message || 'Errore durante l\'aggiunta dell\'esercizio')
        return false
      }

      // Increment order_index for exercises at current position and after
      for (const ex of session.exercises || []) {
        if (ex.order_index >= currentIndex) {
          await supabase
            .from('session_exercises')
            .update({ order_index: ex.order_index + 1 })
            .eq('id', ex.id)
        }
      }

      // Optimistic update - new exercise becomes current
      const newSessionExercise: SessionExerciseWithDetails = {
        ...newExerciseData,
        exercise: exercise,
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s

          // Shift exercises at current position and after
          const updatedExercises = (s.exercises || []).map((ex) => ({
            ...ex,
            order_index: ex.order_index >= currentIndex ? ex.order_index + 1 : ex.order_index,
          }))

          // Insert new exercise and sort by order_index
          const allExercises = [...updatedExercises, newSessionExercise].sort(
            (a, b) => a.order_index - b.order_index
          )

          return {
            ...s,
            exercises: allExercises,
          }
        })
      )

      return true
    },
    [sessions]
  )

  // Delete exercise from session
  const deleteExerciseFromSession = useCallback(
    async (sessionId: string, exerciseId: string): Promise<boolean> => {
      const session = sessions.find((s) => s.id === sessionId)
      if (!session || !session.exercises) return false

      const exerciseIndex = session.exercises.findIndex((e) => e.id === exerciseId)
      if (exerciseIndex === -1) return false

      // Don't allow deleting if it's the only exercise
      if (session.exercises.length <= 1) {
        setError('Non puoi eliminare l\'ultimo esercizio della sessione')
        return false
      }

      const result = await withSaveTracking(async () => {
        // Delete the exercise from database
        const { error: deleteError } = await supabase
          .from('session_exercises')
          .delete()
          .eq('id', exerciseId)

        if (deleteError) {
          throw new Error(deleteError.message)
        }

        return true
      })

      if (result === null) {
        return false
      }

      // Calculate new index:
      // - If deleting the last exercise, select the previous one
      // - Otherwise, keep the same index (next exercise slides into place)
      const isLastExercise = exerciseIndex === session.exercises.length - 1
      const currentIndex = session.current_exercise_index
      let newIndex: number

      if (isLastExercise && currentIndex === exerciseIndex) {
        // Deleting the last exercise which is also current: go to previous
        newIndex = Math.max(0, currentIndex - 1)
      } else if (exerciseIndex < currentIndex) {
        // Deleting an exercise before current: adjust index down
        newIndex = currentIndex - 1
      } else {
        // Deleting current or after: keep same index (next slides in)
        newIndex = Math.min(currentIndex, session.exercises.length - 2)
      }

      // Optimistic update - remove exercise and set new index
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s

          const newExercises = s.exercises?.filter((e) => e.id !== exerciseId) || []

          // Reindex exercises
          const reindexedExercises = newExercises.map((ex, idx) => ({
            ...ex,
            order_index: idx,
          }))

          return {
            ...s,
            exercises: reindexedExercises,
            current_exercise_index: newIndex,
          }
        })
      )

      // Update current_exercise_index in database
      if (newIndex !== session.current_exercise_index) {
        await supabase
          .from('sessions')
          .update({ current_exercise_index: newIndex })
          .eq('id', sessionId)
      }

      return true
    },
    [sessions, withSaveTracking]
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
    saveStatus,
    saveError,
    fetchSessionsForDate,
    updateExerciseOnTheFly,
    changeExercise,
    selectExercise,
    completeExercise,
    skipExercise,
    previousExercise,
    finishSession,
    finishAllSessions,
    replanSession,
    addExerciseToSession,
    deleteExerciseFromSession,
    getCurrentExercise,
    getNextExercise,
    isSessionComplete,
  }
}
