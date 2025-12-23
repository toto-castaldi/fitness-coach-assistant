import { useRef, useEffect } from 'react'
import { CheckCircle2, Circle, SkipForward } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { LiveExerciseControl } from './LiveExerciseControl'
import type { SessionWithDetails, SessionExerciseUpdate, SessionExerciseWithDetails } from '@/types'

interface LiveClientCardProps {
  session: SessionWithDetails
  isComplete: boolean
  onUpdateExercise: (updates: SessionExerciseUpdate) => void
  onCompleteExercise: () => void
  onSkipExercise: (exerciseId: string) => void
}

export function LiveClientCard({
  session,
  isComplete,
  onUpdateExercise,
  onCompleteExercise,
  onSkipExercise,
}: LiveClientCardProps) {
  const totalExercises = session.exercises?.length || 0
  const currentIndex = session.current_exercise_index
  const progressPercent = totalExercises > 0 ? (currentIndex / totalExercises) * 100 : 0
  const currentExerciseRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current exercise when index changes
  useEffect(() => {
    if (currentExerciseRef.current) {
      currentExerciseRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [currentIndex])

  const formatExercisePreview = (exercise: SessionExerciseWithDetails): string => {
    const parts: string[] = []
    if (exercise.sets) parts.push(`${exercise.sets}x`)
    if (exercise.reps) parts.push(`${exercise.reps}`)
    if (exercise.weight_kg) parts.push(`${exercise.weight_kg}kg`)
    if (exercise.duration_seconds) {
      const mins = Math.floor(exercise.duration_seconds / 60)
      const secs = exercise.duration_seconds % 60
      parts.push(mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`)
    }
    return parts.join(' ')
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        {/* Client name */}
        <CardTitle className="text-xl">
          {session.client?.first_name} {session.client?.last_name}
        </CardTitle>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{currentIndex}/{totalExercises}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto pb-4">
        {session.exercises && session.exercises.length > 0 ? (
          /* Vertical list of all exercises */
          <div className="space-y-3">
            {session.exercises.map((exercise, index) => {
              const isCurrent = !isComplete && index === currentIndex
              const isCompleted = exercise.completed
              const isSkipped = exercise.skipped
              const isFuture = index > currentIndex && !isComplete

              return (
                <div
                  key={exercise.id}
                  ref={isCurrent ? currentExerciseRef : null}
                >
                  {isCurrent ? (
                    /* Current exercise - full controls */
                    <LiveExerciseControl
                      exercise={exercise}
                      onUpdate={onUpdateExercise}
                      onComplete={onCompleteExercise}
                      onSkip={() => onSkipExercise(exercise.id)}
                    />
                  ) : (
                    /* Completed, skipped, or future exercise - compact view */
                    <div
                      className={`rounded-lg p-3 flex items-center gap-3 ${
                        isCompleted
                          ? 'bg-green-50 dark:bg-green-950/30'
                          : isSkipped
                          ? 'bg-orange-50 dark:bg-orange-950/30'
                          : 'bg-muted/30'
                      }`}
                    >
                      {/* Status icon */}
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : isSkipped ? (
                        <SkipForward className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                      )}

                      {/* Exercise info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          isCompleted ? 'text-green-700 dark:text-green-400' :
                          isSkipped ? 'text-orange-700 dark:text-orange-400' :
                          isFuture ? 'text-muted-foreground' : ''
                        }`}>
                          {exercise.exercise?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatExercisePreview(exercise)}
                        </p>
                        {exercise.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            {exercise.notes}
                          </p>
                        )}
                      </div>

                      {/* Index */}
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* No exercises state */
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-8">
            <p>Nessun esercizio in questa sessione</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
