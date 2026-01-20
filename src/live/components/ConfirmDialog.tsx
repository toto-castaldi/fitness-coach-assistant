import { Button } from '@/shared/components/ui/button'
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
        <p className="text-gray-300 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-500 text-white border border-gray-500"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
