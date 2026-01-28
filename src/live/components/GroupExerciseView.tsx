import { useMemo } from 'react'
import { toast } from 'sonner'
import { GroupExerciseCard } from './GroupExerciseCard'
import type { SessionWithDetails, Client, ExerciseWithDetails } from '@/shared/types'

interface Participant {
  sessionExerciseId: string
  client: Client
  completed: boolean
  skipped: boolean
}

interface GroupedExercise {
  exerciseId: string
  exerciseName: string
  exercise: ExerciseWithDetails
  participants: Participant[]
  allCompleted: boolean
  someCompleted: boolean
}

interface GroupExerciseViewProps {
  sessions: SessionWithDetails[]
  currentDate: string
  onCompleteGroup: (exerciseId: string, exerciseName: string) => Promise<string[]>
  onSkipParticipant: (sessionExerciseId: string) => Promise<boolean>
  onUndoComplete: (exerciseIds: string[]) => Promise<void>
}

export function GroupExerciseView({
  sessions,
  currentDate: _currentDate,
  onCompleteGroup,
  onSkipParticipant,
  onUndoComplete,
}: GroupExerciseViewProps) {
  // Aggregate group exercises by exercise_id
  const groupedExercises = useMemo((): GroupedExercise[] => {
    const grouped = new Map<string, GroupedExercise>()

    for (const session of sessions) {
      if (!session.client) continue

      for (const ex of session.exercises || []) {
        if (!ex.is_group || !ex.exercise) continue

        const exerciseId = ex.exercise_id
        if (!grouped.has(exerciseId)) {
          grouped.set(exerciseId, {
            exerciseId,
            exerciseName: ex.exercise.name || 'Esercizio',
            exercise: ex.exercise,
            participants: [],
            allCompleted: true,
            someCompleted: false,
          })
        }

        const group = grouped.get(exerciseId)!
        group.participants.push({
          sessionExerciseId: ex.id,
          client: session.client,
          completed: ex.completed,
          skipped: ex.skipped,
        })

        if (!ex.completed && !ex.skipped) group.allCompleted = false
        if (ex.completed) group.someCompleted = true
      }
    }

    // Sort: incomplete first, then by exercise name
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.allCompleted !== b.allCompleted) return a.allCompleted ? 1 : -1
      return a.exerciseName.localeCompare(b.exerciseName)
    })
  }, [sessions])

  const handleCompleteAll = async (exerciseId: string, exerciseName: string) => {
    const updatedIds = await onCompleteGroup(exerciseId, exerciseName)

    if (updatedIds.length > 0) {
      toast.success(`${exerciseName} completato per tutti`, {
        duration: 4000,
        action: {
          label: 'Annulla',
          onClick: async () => {
            await onUndoComplete(updatedIds)
            toast.info('Completamento annullato')
          }
        }
      })
    }
  }

  const handleSkipParticipant = async (sessionExerciseId: string, clientName: string) => {
    const success = await onSkipParticipant(sessionExerciseId)
    if (success) {
      toast.success(`${clientName} salta questo esercizio`)
    }
  }

  if (groupedExercises.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">Nessun esercizio di gruppo</p>
          <p className="text-sm mt-2">Gli esercizi di gruppo appariranno qui</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groupedExercises.map((group) => (
        <GroupExerciseCard
          key={group.exerciseId}
          exerciseId={group.exerciseId}
          exerciseName={group.exerciseName}
          exercise={group.exercise}
          participants={group.participants}
          allCompleted={group.allCompleted}
          someCompleted={group.someCompleted}
          onCompleteAll={() => handleCompleteAll(group.exerciseId, group.exerciseName)}
          onSkipParticipant={handleSkipParticipant}
        />
      ))}
    </div>
  )
}
