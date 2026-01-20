import { Button } from '@/shared/components/ui/button'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ParameterControlProps {
  label: string
  value: number | null
  unit?: string
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  readOnly?: boolean
  className?: string
}

export function ParameterControl({
  label,
  value,
  unit,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  readOnly = false,
  className,
}: ParameterControlProps) {
  const handleDecrement = () => {
    if (onChange && value !== null && value > min) {
      onChange(Math.max(min, value - step))
    }
  }

  const handleIncrement = () => {
    if (onChange) {
      const newValue = (value ?? 0) + step
      if (newValue <= max) {
        onChange(newValue)
      }
    }
  }

  const displayValue = value ?? '-'

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <span className="text-xs text-gray-300 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-2">
        {!readOnly && (
          <Button
            onClick={handleDecrement}
            disabled={value === null || value <= min}
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
          >
            <Minus className="w-5 h-5" />
          </Button>
        )}
        <span
          className={cn(
            'text-2xl font-bold min-w-[3rem] text-center',
            readOnly ? 'text-gray-300' : 'text-white'
          )}
        >
          {displayValue}
          {unit && value !== null && (
            <span className="text-sm ml-1">{unit}</span>
          )}
        </span>
        {!readOnly && (
          <Button
            onClick={handleIncrement}
            disabled={value !== null && value >= max}
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-full border-gray-500 bg-gray-700 text-white hover:bg-gray-600"
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
