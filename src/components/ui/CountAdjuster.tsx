import { Minus, Plus } from 'lucide-react'
import { Button } from './Button'

interface CountAdjusterProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function CountAdjuster ({
  value,
  onChange,
  disabled = false,
}: CountAdjusterProps) {
  const nextDecrease = Math.max(0, value - 1)
  const nextIncrease = value + 1

  return (
    <div className="inline-flex items-center rounded-md border bg-background">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || value <= 0}
        onClick={() => onChange(nextDecrease)}
        className="h-8 w-8 p-0 rounded-r-none"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-10 text-center text-sm font-medium">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => onChange(nextIncrease)}
        className="h-8 w-8 p-0 rounded-l-none"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
