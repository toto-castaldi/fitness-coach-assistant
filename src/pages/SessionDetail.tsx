import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, Building2, User, Edit2, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SessionForm } from '@/components/sessions/SessionForm'
import { SessionExerciseCard } from '@/components/sessions/SessionExerciseCard'
import { ExercisePicker } from '@/components/sessions/ExercisePicker'
import { useSessions } from '@/hooks/useSessions'
import { useClients } from '@/hooks/useClients'
import { useGyms } from '@/hooks/useGyms'
import { useExercises } from '@/hooks/useExercises'
import { formatDate } from '@/lib/utils'
import type { SessionWithDetails, SessionInsert, SessionExerciseUpdate, SessionExerciseWithDetails, ExerciseWithDetails } from '@/types'

export function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    getSession,
    updateSession,
    addExercise,
    updateExercise,
    removeExercise,
    reorderExercises,
    error,
  } = useSessions()
  const { clients } = useClients()
  const { gyms } = useGyms()
  const { exercises: catalogExercises, refetch: refetchExercises } = useExercises()

  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  useEffect(() => {
    if (id) {
      loadSession(id)
    }
  }, [id])

  const loadSession = async (sessionId: string) => {
    setLoading(true)
    const data = await getSession(sessionId)
    setSession(data)
    setLoading(false)
  }

  const handleUpdateSession = async (data: SessionInsert) => {
    if (!id) return
    setIsSubmitting(true)
    const result = await updateSession(id, data)
    setIsSubmitting(false)
    if (result) {
      await loadSession(id)
      setIsEditing(false)
    }
  }

  // Optimistic update for status toggle
  const handleToggleStatus = (completed: boolean) => {
    if (!session || !id) return
    const newStatus = completed ? 'completed' : 'planned'

    // Update local state immediately
    setSession({ ...session, status: newStatus })

    // Save to DB in background
    updateSession(id, { status: newStatus })
  }

  // Add exercise - needs to wait for ID from DB
  const handleAddExercise = async (exercise: ExerciseWithDetails) => {
    if (!id || !session) return

    const result = await addExercise({
      session_id: id,
      exercise_id: exercise.id,
    })

    if (result) {
      // Add to local state with the new ID
      const newExercise: SessionExerciseWithDetails = {
        id: result.id,
        session_id: id,
        exercise_id: exercise.id,
        order_index: session.exercises?.length || 0,
        sets: null,
        reps: null,
        weight_kg: null,
        duration_seconds: null,
        notes: null,
        completed: false,
        completed_at: null,
        skipped: false,
        is_group: false,
        exercise: exercise,
      }

      setSession({
        ...session,
        exercises: [...(session.exercises || []), newExercise],
      })
    }

    setShowExercisePicker(false)
  }

  // Optimistic update for exercise fields
  const handleUpdateExercise = (exerciseId: string, updates: SessionExerciseUpdate) => {
    if (!session?.exercises) return

    // Update local state immediately
    setSession({
      ...session,
      exercises: session.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updates } : ex
      ),
    })

    // Save to DB in background
    updateExercise(exerciseId, updates)
  }

  // Change exercise to a different one from catalog
  const handleChangeExercise = (exerciseId: string, newExercise: ExerciseWithDetails) => {
    if (!session?.exercises) return

    // Update local state immediately with new exercise
    setSession({
      ...session,
      exercises: session.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, exercise_id: newExercise.id, exercise: newExercise }
          : ex
      ),
    })

    // Save to DB in background
    updateExercise(exerciseId, { exercise_id: newExercise.id })
  }

  // Optimistic update for remove
  const handleRemoveExercise = (exerciseId: string) => {
    if (!session?.exercises) return

    // Update local state immediately
    setSession({
      ...session,
      exercises: session.exercises.filter(ex => ex.id !== exerciseId),
    })

    // Save to DB in background
    removeExercise(exerciseId)
  }

  // Optimistic update for move up
  const handleMoveUp = (exerciseId: string) => {
    if (!session?.exercises || !id) return
    const exercises = [...session.exercises]
    const currentIndex = exercises.findIndex(e => e.id === exerciseId)
    if (currentIndex <= 0) return

    // Swap in local state
    ;[exercises[currentIndex - 1], exercises[currentIndex]] = [exercises[currentIndex], exercises[currentIndex - 1]]

    // Update order_index
    const reordered = exercises.map((ex, idx) => ({ ...ex, order_index: idx }))

    // Update local state immediately
    setSession({ ...session, exercises: reordered })

    // Save to DB in background
    reorderExercises(id, reordered.map(e => e.id))
  }

  // Optimistic update for move down
  const handleMoveDown = (exerciseId: string) => {
    if (!session?.exercises || !id) return
    const exercises = [...session.exercises]
    const currentIndex = exercises.findIndex(e => e.id === exerciseId)
    if (currentIndex < 0 || currentIndex >= exercises.length - 1) return

    // Swap in local state
    ;[exercises[currentIndex], exercises[currentIndex + 1]] = [exercises[currentIndex + 1], exercises[currentIndex]]

    // Update order_index
    const reordered = exercises.map((ex, idx) => ({ ...ex, order_index: idx }))

    // Update local state immediately
    setSession({ ...session, exercises: reordered })

    // Save to DB in background
    reorderExercises(id, reordered.map(e => e.id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Sessione non trovata</p>
        <Button variant="link" onClick={() => navigate('/sessions')}>
          Torna alle sessioni
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/sessions')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {session.client?.first_name} {session.client?.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(session.session_date)}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Session Info or Edit Form */}
      {isEditing ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Modifica Sessione</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SessionForm
              session={session}
              clients={clients}
              gyms={gyms}
              onSubmit={handleUpdateSession}
              onCancel={() => setIsEditing(false)}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>
                  {session.client?.first_name} {session.client?.last_name}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(session.session_date)}</span>
            </div>

            {session.gym && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{session.gym.name}</span>
              </div>
            )}

            {session.notes && (
              <p className="text-sm text-muted-foreground pt-2 border-t">
                {session.notes}
              </p>
            )}

            {/* Status Toggle */}
            <div className="flex items-center justify-between pt-3 border-t">
              <Label htmlFor="status-toggle" className="text-sm font-medium">
                Completata
              </Label>
              <Switch
                id="status-toggle"
                checked={session.status === 'completed'}
                onCheckedChange={handleToggleStatus}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              Esercizi ({session.exercises?.length || 0})
            </h2>
            {(session.exercises?.filter(e => e.is_group).length || 0) > 0 && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {session.exercises?.filter(e => e.is_group).length} di gruppo
              </span>
            )}
          </div>
          <Button size="sm" onClick={() => setShowExercisePicker(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi
          </Button>
        </div>

        {session.exercises && session.exercises.length > 0 ? (
          <div className="space-y-3">
            {session.exercises.map((exercise, index) => (
              <SessionExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                isFirst={index === 0}
                isLast={index === session.exercises!.length - 1}
                catalogExercises={catalogExercises}
                onRefreshExercises={refetchExercises}
                onUpdate={handleUpdateExercise}
                onChangeExercise={handleChangeExercise}
                onRemove={handleRemoveExercise}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nessun esercizio in questa sessione.</p>
            <p className="text-sm">Aggiungi esercizi dal catalogo.</p>
          </div>
        )}
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <ExercisePicker
          exercises={catalogExercises}
          onSelect={handleAddExercise}
          onClose={() => setShowExercisePicker(false)}
          onRefresh={refetchExercises}
        />
      )}
    </div>
  )
}
