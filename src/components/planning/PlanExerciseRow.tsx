import { Dumbbell, Clock, AlertCircle } from 'lucide-react'
import type { TrainingPlanExercise } from '@/types'

interface PlanExerciseRowProps {
  exercise: TrainingPlanExercise
  index: number
  matched?: boolean
}

function formatDuration(seconds: number): string {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`
  }
  return `${seconds}s`
}

export function PlanExerciseRow({ exercise, index, matched = true }: PlanExerciseRowProps) {
  const hasSetReps = exercise.sets || exercise.reps
  const hasDuration = exercise.duration_seconds

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{exercise.exercise_name}</span>
          {!matched && (
            <span title="Esercizio non trovato nel catalogo">
              <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5">
          {hasSetReps && (
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {exercise.sets && `${exercise.sets} serie`}
              {exercise.sets && exercise.reps && ' × '}
              {exercise.reps && `${exercise.reps} rep`}
              {exercise.weight_kg && ` @ ${exercise.weight_kg}kg`}
            </span>
          )}
          {hasDuration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(exercise.duration_seconds!)}
            </span>
          )}
        </div>
        {exercise.notes && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            {exercise.notes}
          </p>
        )}
      </div>
    </div>
  )
}
