import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface DeleteConfirmDialogProps {
  itemName: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ itemName, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-4">
        <p className="mb-4">
          Eliminare <strong>{itemName}</strong>?
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={onConfirm}>
            Elimina
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annulla
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
