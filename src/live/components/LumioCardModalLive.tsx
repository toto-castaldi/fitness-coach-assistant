import { X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LumioLocalCardViewer } from '@/components/lumio/LumioLocalCardViewer'
import type { LumioLocalCardWithRepository } from '@/shared/types'

interface LumioCardModalLiveProps {
  open: boolean
  exerciseName: string
  lumioCard: LumioLocalCardWithRepository | null
  onClose: () => void
}

export function LumioCardModalLive({
  open,
  exerciseName,
  lumioCard,
  onClose
}: LumioCardModalLiveProps) {
  if (!open || !lumioCard) return null

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-950">
        <h1 className="text-xl font-semibold text-white truncate pr-4">{exerciseName}</h1>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Content - scrollabile */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-900">
        <LumioLocalCardViewer card={lumioCard} className="text-white" />
      </div>
    </div>
  )
}
