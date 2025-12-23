import { ChevronUp, ChevronDown, Trash2, Minus, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import type { SessionExerciseWithDetails, SessionExerciseUpdate } from '@/types'

interface SessionExerciseCardProps {
  exercise: SessionExerciseWithDetails
  index: number
  isFirst: boolean
  isLast: boolean
  onUpdate: (id: string, updates: SessionExerciseUpdate) => void
  onRemove: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export function SessionExerciseCard({
  exercise,
  index,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SessionExerciseCardProps) {
  const handleNumberChange = (
    field: 'sets' | 'reps' | 'weight_kg' | 'duration_seconds',
    delta: number
  ) => {
    const currentValue = exercise[field] || 0
    const newValue = Math.max(0, currentValue + delta)
    onUpdate(exercise.id, { [field]: newValue || null })
  }

  const handleInputChange = (
    field: 'sets' | 'reps' | 'weight_kg' | 'duration_seconds',
    value: string
  ) => {
    const numValue = parseFloat(value)
    onUpdate(exercise.id, { [field]: isNaN(numValue) ? null : numValue })
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
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Move buttons */}
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={isFirst}
              onClick={() => onMoveUp(exercise.id)}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={isLast}
              onClick={() => onMoveDown(exercise.id)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Index */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
            {index + 1}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Exercise name */}
            <h4 className="font-semibold">{exercise.exercise?.name}</h4>

            {/* Controls grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Sets */}
              <div className="space-y-1">
                <Label className="text-xs">Serie</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('sets', -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={exercise.sets || ''}
                    onChange={(e) => handleInputChange('sets', e.target.value)}
                    className="h-8 w-14 text-center px-1"
                    min="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('sets', 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Reps */}
              <div className="space-y-1">
                <Label className="text-xs">Ripetizioni</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('reps', -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={exercise.reps || ''}
                    onChange={(e) => handleInputChange('reps', e.target.value)}
                    className="h-8 w-14 text-center px-1"
                    min="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('reps', 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('weight_kg', -0.5)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    step="0.5"
                    value={exercise.weight_kg || ''}
                    onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                    className="h-8 w-14 text-center px-1"
                    min="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('weight_kg', 0.5)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <Label className="text-xs">Durata (sec)</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('duration_seconds', -10)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    step="10"
                    value={exercise.duration_seconds || ''}
                    onChange={(e) => handleInputChange('duration_seconds', e.target.value)}
                    className="h-8 w-14 text-center px-1"
                    min="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleNumberChange('duration_seconds', 10)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Duration display */}
            {exercise.duration_seconds && exercise.duration_seconds > 0 && (
              <p className="text-xs text-muted-foreground">
                = {formatDuration(exercise.duration_seconds)}
              </p>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs">Note</Label>
              <Textarea
                placeholder="es: focus sulla fase eccentrica..."
                value={exercise.notes || ''}
                onChange={(e) => onUpdate(exercise.id, { notes: e.target.value || null })}
                className="min-h-[60px] text-sm"
              />
            </div>

            {/* Skipped toggle */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor={`skipped-${exercise.id}`} className="text-xs text-muted-foreground">
                Saltato
              </Label>
              <Switch
                id={`skipped-${exercise.id}`}
                checked={exercise.skipped || false}
                onCheckedChange={(checked) => onUpdate(exercise.id, { skipped: checked })}
              />
            </div>
          </div>

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(exercise.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
