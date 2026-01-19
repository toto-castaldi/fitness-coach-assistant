import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardActions } from '@/components/shared'
import { toast } from 'sonner'
import type { ExerciseWithDetails } from '@/types'

interface ExerciseCardProps {
  exercise: ExerciseWithDetails
  onEdit: (exercise: ExerciseWithDetails) => void
  onDelete: (exercise: ExerciseWithDetails) => void
  onClick?: (exercise: ExerciseWithDetails) => void
  onTagClick?: (tag: string) => void
  onViewBlocks?: (exercise: ExerciseWithDetails) => void
}

export function ExerciseCard({ exercise, onEdit, onDelete, onClick, onTagClick, onViewBlocks }: ExerciseCardProps) {
  const navigate = useNavigate()
  const titleRef = useRef<HTMLHeadingElement>(null)

  const handleCardClick = () => {
    onClick?.(exercise)
  }

  const handleIconClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/sessions?exercise=${exercise.id}`)
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const el = titleRef.current
    if (el && el.scrollWidth > el.clientWidth) {
      toast(exercise.name)
    }
  }

  const hasLumioCard = !!exercise.lumio_card

  return (
    <Card
      className={onClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}
      onClick={onClick ? handleCardClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="rounded-full bg-primary/10 p-2 cursor-pointer hover:bg-primary/20 active:bg-primary/30 transition-colors"
              onClick={handleIconClick}
              title="Vedi sessioni con questo esercizio"
            >
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                ref={titleRef}
                className="font-semibold truncate cursor-pointer active:text-primary"
                onClick={handleTitleClick}
              >{exercise.name}</h3>
              {hasLumioCard && (
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewBlocks?.(exercise)
                    }}
                    className={`flex items-center gap-1 text-primary ${onViewBlocks ? 'hover:text-primary/80 cursor-pointer' : ''}`}
                    title="Scheda Lumio"
                  >
                    <FileText className="h-3 w-3" />
                    Scheda Lumio
                  </button>
                </div>
              )}
            </div>
          </div>
          <CardActions
            onEdit={() => onEdit(exercise)}
            onDelete={() => onDelete(exercise)}
            showDelete={!exercise.sessionsCount}
          />
        </div>

        {exercise.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {exercise.description}
          </p>
        )}

        {exercise.tags && exercise.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {exercise.tags.slice(0, 5).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className={`text-xs ${onTagClick ? 'cursor-pointer hover:bg-secondary/80' : ''}`}
                onClick={onTagClick ? (e) => {
                  e.stopPropagation()
                  onTagClick(tag.tag)
                } : undefined}
              >
                {tag.tag}
              </Badge>
            ))}
            {exercise.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{exercise.tags.length - 5}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
