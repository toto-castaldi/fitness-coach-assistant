import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LumioLocalCardViewer } from '@/components/lumio'
import type { ExerciseWithDetails, LumioLocalCardWithRepository } from '@/types'

interface ExerciseDetailModalProps {
  exercise: ExerciseWithDetails
  onClose: () => void
}

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  // Cast lumio_card to include repository data
  const lumioCard = exercise.lumio_card as LumioLocalCardWithRepository | null
  const hasLumioCard = !!lumioCard

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold truncate pr-4">{exercise.name}</h1>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {exercise.description && !hasLumioCard && (
          <p className="text-muted-foreground">{exercise.description}</p>
        )}

        {exercise.tags && exercise.tags.length > 0 && !hasLumioCard && (
          <div className="flex flex-wrap gap-2">
            {exercise.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Lumio Card View */}
        {hasLumioCard && lumioCard && (
          <LumioLocalCardViewer card={lumioCard} />
        )}

        {/* No content available */}
        {!hasLumioCard && !exercise.description && (
          <p className="text-center text-muted-foreground py-8">
            Nessuna descrizione disponibile per questo esercizio
          </p>
        )}
      </div>
    </div>
  )
}
