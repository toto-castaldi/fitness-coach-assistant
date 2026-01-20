import { Cloud, CloudOff, Check, Loader2 } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { SaveStatus } from '@/shared/hooks/useLiveCoaching'

interface SaveIndicatorProps {
  status: SaveStatus
  className?: string
}

export function SaveIndicator({ status, className }: SaveIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
      case 'saved':
        return <Check className="w-5 h-5 text-green-400" />
      case 'error':
        return <CloudOff className="w-5 h-5 text-red-400" />
      default:
        return <Cloud className="w-5 h-5 text-gray-500" />
    }
  }

  const getText = () => {
    switch (status) {
      case 'saving':
        return 'Salvataggio...'
      case 'saved':
        return 'Salvato'
      case 'error':
        return 'Errore'
      default:
        return ''
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-sm transition-opacity',
        status === 'idle' && 'opacity-0',
        className
      )}
    >
      {getIcon()}
      <span
        className={cn(
          status === 'saving' && 'text-blue-400',
          status === 'saved' && 'text-green-400',
          status === 'error' && 'text-red-400'
        )}
      >
        {getText()}
      </span>
    </div>
  )
}
