import { Building2, Check, X, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlanExerciseRow } from './PlanExerciseRow'
import type { TrainingPlan, Gym } from '@/types'

interface PlanPreviewProps {
  plan: TrainingPlan
  gyms: Gym[]
  onAccept: (gymId?: string) => void
  onReject: () => void
  onContinueChat: () => void
  loading?: boolean
}

export function PlanPreview({
  plan,
  gyms,
  onAccept,
  onReject,
  onContinueChat,
  loading,
}: PlanPreviewProps) {
  // Try to match gym by name
  const matchedGym = plan.gym_name
    ? gyms.find(g => g.name.toLowerCase() === plan.gym_name?.toLowerCase())
    : null

  const handleAccept = () => {
    onAccept(matchedGym?.id)
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Check className="h-5 w-5 text-primary" />
          Piano Proposto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gym */}
        {plan.gym_name && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{plan.gym_name}</span>
            {!matchedGym && (
              <span className="text-xs text-amber-600">(palestra non trovata)</span>
            )}
          </div>
        )}

        {/* Exercises */}
        <div className="bg-background rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">
            Esercizi ({plan.exercises.length})
          </h4>
          <div className="max-h-64 overflow-y-auto">
            {plan.exercises.map((exercise, index) => (
              <PlanExerciseRow
                key={index}
                exercise={exercise}
                index={index}
                matched={true} // TODO: check against exercise catalog
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        {plan.notes && (
          <div className="text-sm text-muted-foreground bg-background rounded-lg p-3">
            <strong>Note:</strong> {plan.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Accetta e Crea Sessione
          </Button>
          <Button
            variant="outline"
            onClick={onContinueChat}
            disabled={loading}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Modifica
          </Button>
          <Button
            variant="ghost"
            onClick={onReject}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Scarta
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
