import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  showAddButton?: boolean
  addButtonLabel?: string
  onAdd?: () => void
  children?: React.ReactNode
}

export function PageHeader({
  title,
  showAddButton = false,
  addButtonLabel = 'Nuovo',
  onAdd,
  children
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {children}
        {showAddButton && onAdd && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" />
            {addButtonLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
