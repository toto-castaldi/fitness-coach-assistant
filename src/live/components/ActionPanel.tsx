import { Button } from '@/shared/components/ui/button'
import { Check, SkipForward, Plus, Trash2, Target, RefreshCw, Info } from 'lucide-react'

interface ActionPanelProps {
  onComplete: () => void
  onSkip: () => void
  onCenter: () => void
  onDelete: () => void
  onChange?: () => void
  onInfo?: () => void
  onAdd?: () => void
  disabled?: boolean
  hasLumioCard?: boolean
}

export function ActionPanel({
  onComplete,
  onSkip,
  onCenter,
  onDelete,
  onChange,
  onInfo,
  onAdd,
  disabled = false,
  hasLumioCard = false,
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

      {/* Delete Button - rose/red distintivo */}
      <Button
        onClick={onDelete}
        disabled={disabled}
        size="xl"
        className="h-20 flex-col gap-2 bg-rose-600 hover:bg-rose-700 text-white"
      >
        <Trash2 className="w-8 h-8" />
        <span className="text-xs">ELIMINA</span>
      </Button>

      {/* Change Button - viola per modifica esercizio */}
      {onChange && (
        <Button
          onClick={onChange}
          disabled={disabled}
          size="xl"
          className="h-20 flex-col gap-2 bg-violet-600 hover:bg-violet-700 text-white"
        >
          <RefreshCw className="w-8 h-8" />
          <span className="text-xs">MODIFICA</span>
        </Button>
      )}

      {/* Info Button - sky/azzurro per scheda Lumio */}
      {onInfo && (
        <Button
          onClick={onInfo}
          disabled={disabled || !hasLumioCard}
          size="xl"
          className={`h-20 flex-col gap-2 text-white ${
            hasLumioCard && !disabled
              ? "bg-sky-600 hover:bg-sky-700"
              : "bg-sky-600/50 cursor-not-allowed opacity-50"
          }`}
        >
          <Info className="w-8 h-8" />
          <span className="text-xs">INFO</span>
        </Button>
      )}

      {/* Add Button - cyan/blue per azione positiva di aggiunta */}
      {onAdd && (
        <Button
          onClick={onAdd}
          disabled={disabled}
          size="xl"
          className="h-20 flex-col gap-2 bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-8 h-8" />
          <span className="text-xs">AGGIUNGI</span>
        </Button>
      )}
    </div>
  )
}
