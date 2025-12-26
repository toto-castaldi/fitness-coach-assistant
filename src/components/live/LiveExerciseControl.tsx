import { useState } from 'react'
import { Minus, Plus, Check, SkipForward, RefreshCw, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ExercisePicker } from '@/components/sessions/ExercisePicker'
import { ExerciseDetailModal } from './ExerciseDetailModal'
import type { SessionExerciseWithDetails, SessionExerciseUpdate, ExerciseWithDetails } from '@/types'

interface LiveExerciseControlProps {
  exercise: SessionExerciseWithDetails
  catalogExercises?: ExerciseWithDetails[]
  onUpdate: (updates: SessionExerciseUpdate) => void
  onChangeExercise?: (newExercise: ExerciseWithDetails) => void
  onComplete: () => void
  onSkip: () => void
}

export function LiveExerciseControl({
  exercise,
  catalogExercises = [],
  onUpdate,
  onChangeExercise,
  onComplete,
  onSkip,
}: LiveExerciseControlProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  // Find the full exercise details from catalog
  const fullExercise = catalogExercises.find(e => e.id === exercise.exercise_id)

  const handleNumberChange = (
    field: 'sets' | 'reps' | 'weight_kg' | 'duration_seconds',
    delta: number
  ) => {
    const currentValue = exercise[field] || 0
    const newValue = Math.max(0, currentValue + delta)
    onUpdate({ [field]: newValue || null })
  }

  const handleInputChange = (
    field: 'sets' | 'reps' | 'weight_kg' | 'duration_seconds',
    value: string
  ) => {
    const numValue = parseFloat(value)
    onUpdate({ [field]: isNaN(numValue) ? null : numValue })
  }

  const formatDuration = (seconds: number): string => {
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
    }
    return `${seconds}s`
  }


  return (
    <Card className="border-2 border-primary">
      <CardContent className="p-4 space-y-4">
        {/* Exercise name with actions */}
        <div className="flex items-center justify-between gap-2">
          {/* View detail button */}
          {fullExercise && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setShowDetail(true)}
            >
              <Eye className="h-5 w-5" />
            </Button>
          )}

          {/* Exercise name - clickable to change */}
          <button
            type="button"
            onClick={() => onChangeExercise && setShowPicker(true)}
            className={`flex-1 text-center ${onChangeExercise ? 'hover:text-primary transition-colors cursor-pointer group' : ''}`}
            disabled={!onChangeExercise}
          >
            <h3 className="text-xl font-bold inline-flex items-center justify-center gap-2">
              {exercise.exercise?.name}
              {onChangeExercise && (
                <RefreshCw className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </h3>
          </button>

          {/* Spacer for alignment when no detail button */}
          {fullExercise ? (
            <div className="w-10 flex-shrink-0" />
          ) : (
            <div className="w-10 flex-shrink-0" />
          )}
        </div>

        {/* Notes - editable */}
        <Textarea
          placeholder="Note per questo esercizio..."
          value={exercise.notes || ''}
          onChange={(e) => onUpdate({ notes: e.target.value || null })}
          className="min-h-[50px] text-sm resize-none"
        />

        {/* Controls grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Sets */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Serie</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('sets', -1)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                value={exercise.sets || ''}
                onChange={(e) => handleInputChange('sets', e.target.value)}
                className="h-12 text-center text-lg font-semibold"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('sets', 1)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Reps */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ripetizioni</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('reps', -1)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                value={exercise.reps || ''}
                onChange={(e) => handleInputChange('reps', e.target.value)}
                className="h-12 text-center text-lg font-semibold"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('reps', 1)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Peso (kg)</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('weight_kg', -0.5)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                step="0.5"
                value={exercise.weight_kg || ''}
                onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                className="h-12 text-center text-lg font-semibold"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('weight_kg', 0.5)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Durata {exercise.duration_seconds ? `(${formatDuration(exercise.duration_seconds)})` : ''}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('duration_seconds', -10)}
              >
                <Minus className="h-5 w-5" />
              </Button>
              <Input
                type="number"
                step="10"
                value={exercise.duration_seconds || ''}
                onChange={(e) => handleInputChange('duration_seconds', e.target.value)}
                className="h-12 text-center text-lg font-semibold"
                min="0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-12 w-12"
                onClick={() => handleNumberChange('duration_seconds', 10)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 h-14"
            onClick={onSkip}
          >
            <SkipForward className="h-5 w-5 mr-2" />
            Salta
          </Button>
          <Button
            className="flex-[2] h-14 text-lg"
            onClick={onComplete}
          >
            <Check className="h-6 w-6 mr-2" />
            Completato
          </Button>
        </div>

        {/* Exercise Picker Modal */}
        {showPicker && onChangeExercise && (
          <ExercisePicker
            exercises={catalogExercises}
            onSelect={(newExercise) => {
              onChangeExercise(newExercise)
              setShowPicker(false)
            }}
            onClose={() => setShowPicker(false)}
          />
        )}

        {/* Exercise Detail Modal */}
        {showDetail && fullExercise && (
          <ExerciseDetailModal
            exercise={fullExercise}
            onClose={() => setShowDetail(false)}
          />
        )}
      </CardContent>
    </Card>
  )
}
