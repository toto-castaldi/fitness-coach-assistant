import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { ParameterControl } from './ParameterControl'
import { cn } from '@/shared/lib/utils'
import type { SessionExerciseWithDetails } from '@/shared/types'
import { Check, SkipForward } from 'lucide-react'

interface ExerciseCardProps {
  exercise: SessionExerciseWithDetails
  isCurrentExercise: boolean
  onClick?: () => void
  onUpdateSets?: (value: number | null) => void
  onUpdateReps?: (value: number | null) => void
  onUpdateWeight?: (value: number | null) => void
  onUpdateDuration?: (value: number | null) => void
  onUpdateNotes?: (value: string) => void
}

export function ExerciseCard({
  exercise,
  isCurrentExercise,
  onClick,
  onUpdateSets,
  onUpdateReps,
  onUpdateWeight,
  onUpdateDuration,
  onUpdateNotes,
}: ExerciseCardProps) {
  const exerciseInfo = exercise.exercise
  const isCompleted = exercise.completed
  const isSkipped = exercise.skipped

  // Determina lo stato dell'esercizio
  const getCardStyles = () => {
    if (isCompleted) {
      // Completato - verde
      return 'bg-emerald-900/30 border-emerald-600 border-2'
    }
    if (isSkipped) {
      // Saltato - ambra
      return 'bg-amber-900/30 border-amber-600 border-2'
    }
    if (isCurrentExercise) {
      // Corrente - stesso sfondo, nessun bordo speciale
      return 'bg-gray-800 border-gray-700'
    }
    // Da fare - neutro
    return 'bg-gray-800 border-gray-700'
  }

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer w-[320px] h-full',
        getCardStyles(),
        !isCurrentExercise && !isCompleted && !isSkipped && 'hover:bg-gray-750'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col">
        {/* 1. Nome - h-[32px] */}
        <div className="h-[32px] flex items-start justify-between">
          <h3 className="text-lg font-semibold text-white truncate flex-1">
            {exerciseInfo?.name || 'Esercizio'}
          </h3>
          {isCompleted && (
            <Badge className="bg-emerald-600 ml-2 flex-shrink-0 p-1">
              <Check className="w-4 h-4" />
            </Badge>
          )}
          {isSkipped && (
            <Badge className="bg-amber-600 ml-2 flex-shrink-0 p-1">
              <SkipForward className="w-4 h-4" />
            </Badge>
          )}
        </div>

        {/* 2. Descrizione - h-[60px] */}
        <div className="h-[60px] mt-2">
          <p className="text-sm text-gray-400 line-clamp-3">
            {exerciseInfo?.description || '\u00A0'}
          </p>
        </div>

        {/* 3. Serie e Reps - h-[70px] */}
        <div className="h-[70px] mt-4 grid grid-cols-2 gap-4">
          <ParameterControl
            label="Serie"
            value={exercise.sets}
            onChange={isCurrentExercise ? onUpdateSets : undefined}
            readOnly={!isCurrentExercise}
            min={1}
            max={20}
          />
          <ParameterControl
            label="Reps"
            value={exercise.reps}
            onChange={isCurrentExercise ? onUpdateReps : undefined}
            readOnly={!isCurrentExercise}
            min={1}
            max={100}
          />
        </div>

        {/* 4. Peso e Durata - h-[70px] */}
        <div className="h-[70px] mt-4 grid grid-cols-2 gap-4">
          <ParameterControl
            label="Peso"
            value={exercise.weight_kg}
            unit="kg"
            onChange={isCurrentExercise ? onUpdateWeight : undefined}
            readOnly={!isCurrentExercise}
            min={0}
            max={500}
            step={0.5}
          />
          <ParameterControl
            label="Durata"
            value={exercise.duration_seconds}
            unit="s"
            onChange={isCurrentExercise ? onUpdateDuration : undefined}
            readOnly={!isCurrentExercise}
            min={0}
            max={3600}
            step={10}
          />
        </div>

        {/* 5. Note - flex-1 (riempie lo spazio restante) */}
        <div className="flex-1 mt-4 min-h-[60px]">
          {isCurrentExercise ? (
            <Textarea
              value={exercise.notes || ''}
              onChange={(e) => onUpdateNotes?.(e.target.value)}
              placeholder="Note esercizio..."
              className="h-full resize-none bg-gray-700 border-gray-600 text-white text-sm"
            />
          ) : (
            <p className="text-sm text-gray-500 italic line-clamp-3">
              {exercise.notes || '\u00A0'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
