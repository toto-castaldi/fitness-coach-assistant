import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CardActionsProps {
  onEdit?: (e: React.MouseEvent) => void
  onDelete?: (e: React.MouseEvent) => void
  showDelete?: boolean
  children?: React.ReactNode
}

export function CardActions({ onEdit, onDelete, showDelete = true, children }: CardActionsProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(e)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(e)
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {onEdit && (
        <Button variant="ghost" size="icon" onClick={handleEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      {showDelete && onDelete && (
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
      {children}
    </div>
  )
}
