import { Button } from '@/components/ui/button'

interface FormActionsProps {
  isSubmitting?: boolean
  isEditing?: boolean
  onCancel: () => void
  submitLabel?: string
  editLabel?: string
  createLabel?: string
}

export function FormActions({
  isSubmitting = false,
  isEditing = false,
  onCancel,
  submitLabel,
  editLabel = 'Aggiorna',
  createLabel = 'Crea'
}: FormActionsProps) {
  const label = submitLabel ?? (isEditing ? editLabel : createLabel)

  return (
    <div className="flex gap-2 pt-4">
      <Button type="submit" disabled={isSubmitting} className="flex-1">
        {isSubmitting ? 'Salvataggio...' : label}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel}>
        Annulla
      </Button>
    </div>
  )
}
