import { useCallback, useState } from "react"

import { cn } from "@/lib/utils"

interface ParameterSliderProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  defaultValue?: number
  disabled?: boolean
  className?: string
  showValue?: boolean
  formatValue?: (value: number) => string
}

export function ParameterSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  defaultValue,
  disabled = false,
  className,
  showValue = true,
  formatValue = (v) => v.toString(),
}: ParameterSliderProps) {
  const [isDragging, setIsDragging] = useState(false)

  // Вычисляем процент для позиции слайдера
  const percentage = ((value - min) / (max - min)) * 100

  // Определяем цвет слайдера в зависимости от значения
  const getSliderColor = useCallback(() => {
    if (defaultValue !== undefined) {
      if (value === defaultValue) return "bg-muted-foreground"
      if (value > defaultValue) return "bg-blue-500"
      return "bg-orange-500"
    }
    return "bg-blue-500"
  }, [value, defaultValue])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value))
    },
    [onChange],
  )

  const handleDoubleClick = useCallback(() => {
    if (defaultValue !== undefined && !disabled) {
      onChange(defaultValue)
    }
  }, [defaultValue, disabled, onChange])

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm text-foreground/90">{label}</label>
        {showValue && (
          <span className="text-xs text-muted-foreground min-w-[3rem] text-right">{formatValue(value)}</span>
        )}
      </div>

      <div className="relative group">
        {/* Фоновый трек */}
        <div className="absolute inset-y-0 w-full h-2 bg-muted rounded-lg" onDoubleClick={handleDoubleClick} />

        {/* Заполненная часть */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 h-2 rounded-lg transition-all",
            getSliderColor(),
            isDragging ? "transition-none" : "transition-all duration-100",
          )}
          style={{ width: `${percentage}%` }}
        />

        {/* Центральная метка (если есть defaultValue) */}
        {defaultValue !== undefined && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 bg-border"
            style={{ left: `${((defaultValue - min) / (max - min)) * 100}%` }}
          />
        )}

        {/* Невидимый input range для взаимодействия */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          disabled={disabled}
          className={cn(
            "relative w-full h-2 appearance-none bg-transparent cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-lg",
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:w-4",
            "[&::-webkit-slider-thumb]:h-4",
            "[&::-webkit-slider-thumb]:bg-foreground",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:appearance-none",
            "[&::-moz-range-thumb]:w-4",
            "[&::-moz-range-thumb]:h-4",
            "[&::-moz-range-thumb]:bg-foreground",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:shadow-md",
            "[&::-moz-range-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:transition-transform",
            "[&::-moz-range-thumb]:hover:scale-110",
            "[&::-moz-range-thumb]:border-0",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />

        {/* Подсказка при наведении */}
        {!disabled && defaultValue !== undefined && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-xs text-popover-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-border">
            Double-click to reset
          </div>
        )}
      </div>
    </div>
  )
}
