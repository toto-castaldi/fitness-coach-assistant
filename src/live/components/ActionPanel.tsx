import { Button } from '@/shared/components/ui/button'
import { Check, SkipForward, Plus, Trash2, Target } from 'lucide-react'

interface ActionPanelProps {
  onComplete: () => void
  onSkip: () => void
  onCenter: () => void
  onAdd?: () => void
  onDelete?: () => void
  disabled?: boolean
}

export function ActionPanel({
  onComplete,
  onSkip,
  onCenter,
  onAdd,
  onDelete,
  disabled = false,
}: ActionPanelProps) {
  return (
    <div className="flex flex-col gap-4 w-24">
      {/* Complete Button - emerald come esercizi completati */}
      <Button
        onClick={onComplete}
        disabled={disabled}
        size="xl"
        className="h-20 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Check className="w-8 h-8" />
        <span className="text-xs">OK</span>
      </Button>

      {/* Skip Button - amber come esercizi saltati */}
      <Button
        onClick={onSkip}
        disabled={disabled}
        size="xl"
        className="h-20 flex-col gap-2 bg-amber-600 hover:bg-amber-700 text-white"
      >
        <SkipForward className="w-8 h-8" />
        <span className="text-xs">SALTA</span>
      </Button>

      {/* Center Button - gray come esercizi da fare */}
      <Button
        onClick={onCenter}
        disabled={disabled}
        size="xl"
        className="h-20 flex-col gap-2 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
      >
        <Target className="w-8 h-8" />
        <span className="text-xs">PROSSIMO</span>
      </Button>

      {/* Add Button */}
      {onAdd && (
        <Button
          onClick={onAdd}
          disabled={disabled}
          size="xl"
          variant="outline"
          className="h-20 flex-col gap-2 border-gray-600"
        >
          <Plus className="w-8 h-8" />
          <span className="text-xs">AGGIUNGI</span>
        </Button>
      )}

      {/* Delete Button */}
      {onDelete && (
        <Button
          onClick={onDelete}
          disabled={disabled}
          size="xl"
          variant="destructive"
          className="h-20 flex-col gap-2"
        >
          <Trash2 className="w-8 h-8" />
          <span className="text-xs">ELIMINA</span>
        </Button>
      )}
    </div>
  )
}
