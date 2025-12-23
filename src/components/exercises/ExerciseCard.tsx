import { useRef } from 'react'
import { Dumbbell, Edit2, Trash2, Tag, Image } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ExerciseWithDetails } from '@/types'

interface ExerciseCardProps {
  exercise: ExerciseWithDetails
  onEdit: (exercise: ExerciseWithDetails) => void
  onDelete: (exercise: ExerciseWithDetails) => void
  onClick?: (exercise: ExerciseWithDetails) => void
}

export function ExerciseCard({ exercise, onEdit, onDelete, onClick }: ExerciseCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  const handleCardClick = () => {
    onClick?.(exercise)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(exercise)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(exercise)
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Show toast only if text is truncated
    const el = titleRef.current
    if (el && el.scrollWidth > el.clientWidth) {
      toast(exercise.name)
    }
  }

  const blocksCount = exercise.blocks?.length || 0
  const tagsCount = exercise.tags?.length || 0

  return (
    <Card
      className={onClick ? "cursor-pointer hover:bg-accent/50 transition-colors" : ""}
      onClick={onClick ? handleCardClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="rounded-full bg-primary/10 p-2">
              <Dumbbell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                ref={titleRef}
                className="font-semibold truncate cursor-pointer active:text-primary"
                onClick={handleTitleClick}
              >{exercise.name}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {blocksCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Image className="h-3 w-3" />
                    {blocksCount} {blocksCount === 1 ? 'blocco' : 'blocchi'}
                  </span>
                )}
                {tagsCount > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tagsCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditClick}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {exercise.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {exercise.description}
          </p>
        )}

        {exercise.tags && exercise.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {exercise.tags.slice(0, 5).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
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
