import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LiveClientCard } from './LiveClientCard'
import type { SessionWithDetails, SessionExerciseUpdate, ExerciseWithDetails } from '@/types'

interface LiveDashboardProps {
  sessions: SessionWithDetails[]
  catalogExercises: ExerciseWithDetails[]
  initialClientIndex?: number
  onClientIndexChange?: (index: number) => void
  onRefreshExercises?: () => void
  onUpdateExercise: (sessionId: string, exerciseId: string, updates: SessionExerciseUpdate) => void
  onChangeExercise: (sessionId: string, exerciseId: string, newExercise: ExerciseWithDetails) => void
  onCompleteExercise: (sessionId: string, exerciseId: string) => void
  onSkipExercise: (sessionId: string, exerciseId: string) => void
  onSelectExercise: (sessionId: string, index: number) => void
  onAddExercise: (sessionId: string, exercise: ExerciseWithDetails) => void
}

export function LiveDashboard({
  sessions,
  catalogExercises,
  initialClientIndex = 0,
  onClientIndexChange,
  onRefreshExercises,
  onUpdateExercise,
  onChangeExercise,
  onCompleteExercise,
  onSkipExercise,
  onSelectExercise,
  onAddExercise,
}: LiveDashboardProps) {
  const [currentClientIndex, setCurrentClientIndex] = useState(initialClientIndex)

  // Sync with initialClientIndex when it changes
  useEffect(() => {
    setCurrentClientIndex(initialClientIndex)
  }, [initialClientIndex])

  // Notify parent when index changes
  const handleIndexChange = (newIndex: number) => {
    setCurrentClientIndex(newIndex)
    onClientIndexChange?.(newIndex)
  }

  // Ensure index is within bounds
  const safeIndex = Math.min(currentClientIndex, sessions.length - 1)
  const currentSession = sessions[safeIndex]

  if (!currentSession) return null

  const goToPrevious = () => {
    if (safeIndex > 0) {
      handleIndexChange(safeIndex - 1)
    }
  }

  const goToNext = () => {
    if (safeIndex < sessions.length - 1) {
      handleIndexChange(safeIndex + 1)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Client tabs/indicators */}
      {sessions.length > 1 && (
        <div className="flex items-center justify-center gap-2 py-3 bg-muted/30 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={safeIndex === 0}
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Dots indicator */}
          <div className="flex gap-2">
            {sessions.map((session, index) => (
              <button
                key={session.id}
                onClick={() => handleIndexChange(index)}
                className={`h-2 rounded-full transition-all ${
                  index === safeIndex
                    ? 'bg-primary w-6'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                }`}
                title={`${session.client?.first_name} ${session.client?.last_name}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={safeIndex === sessions.length - 1}
            onClick={goToNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Current client card */}
      <div className="flex-1 overflow-hidden p-4">
        <LiveClientCard
          session={currentSession}
          catalogExercises={catalogExercises}
          onRefreshExercises={onRefreshExercises}
          onUpdateExercise={(exerciseId, updates) =>
            onUpdateExercise(currentSession.id, exerciseId, updates)
          }
          onChangeExercise={(exerciseId, newExercise) =>
            onChangeExercise(currentSession.id, exerciseId, newExercise)
          }
          onCompleteExercise={(exerciseId) =>
            onCompleteExercise(currentSession.id, exerciseId)
          }
          onSkipExercise={(exerciseId) => onSkipExercise(currentSession.id, exerciseId)}
          onSelectExercise={(index) => onSelectExercise(currentSession.id, index)}
          onAddExercise={(newExercise) => onAddExercise(currentSession.id, newExercise)}
        />
      </div>
    </div>
  )
}
