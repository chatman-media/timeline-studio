import { useCallback, useEffect, useRef, useState } from "react"

import type { ColorWheelType, RGBValue } from "../../types/color-grading"

interface ColorWheelProps {
  type: ColorWheelType
  label: string
  value: RGBValue
  onChange: (value: RGBValue) => void
  size?: number
  disabled?: boolean
}

export function ColorWheel({ type, label, value, onChange, size = 80, disabled = false }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Преобразуем RGB значения (-1 to 1) в позицию на колесе
  const rgbToPosition = useCallback(
    (rgb: RGBValue): { x: number; y: number } => {
      const angle = Math.atan2(rgb.g, rgb.r)
      const radius = Math.sqrt(rgb.r * rgb.r + rgb.g * rgb.g) * (size / 2)

      return {
        x: size / 2 + radius * Math.cos(angle),
        y: size / 2 + radius * Math.sin(angle),
      }
    },
    [size],
  )

  // Преобразуем позицию на колесе в RGB значения
  const positionToRgb = useCallback(
    (x: number, y: number): RGBValue => {
      const centerX = size / 2
      const centerY = size / 2
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxRadius = size / 2

      // Ограничиваем позицию внутри круга
      const normalizedDistance = Math.min(distance / maxRadius, 1)
      const angle = Math.atan2(dy, dx)

      // Преобразуем полярные координаты в RGB
      const r = normalizedDistance * Math.cos(angle)
      const g = normalizedDistance * Math.sin(angle)
      const b = value.b // Blue остается без изменений для 2D колеса

      return { r, g, b }
    },
    [size, value.b],
  )

  // Рисуем цветовое колесо
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2 - 2

    // Очищаем canvas
    ctx.clearRect(0, 0, size, size)

    // Рисуем цветовое колесо используя радиальный градиент
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180
      const endAngle = (angle * Math.PI) / 180

      // HSL to RGB конверсия для цветового колеса
      const hue = angle
      const saturation = 100
      const lightness = 50 + (type === "lift" ? -20 : type === "gain" ? 20 : 0)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      // Создаем радиальный градиент от центра к краю
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, `hsl(${hue}, 0%, ${lightness}%)`)
      gradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness}%)`)

      ctx.fillStyle = gradient
      ctx.fill()
    }

    // Добавляем центральный градиент для смешивания
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    centerGradient.addColorStop(
      0,
      `rgba(${type === "lift" ? "0,0,0" : type === "gain" ? "255,255,255" : "128,128,128"}, 0.3)`,
    )
    centerGradient.addColorStop(1, "rgba(0,0,0,0)")

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = centerGradient
    ctx.fill()

    // Рисуем границу
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = "#464647"
    ctx.lineWidth = 2
    ctx.stroke()
  }, [size, type])

  // Обработка клика и перетаскивания
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setIsDragging(true)
      onChange(positionToRgb(x, y))
    },
    [disabled, onChange, positionToRgb],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || disabled) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      onChange(positionToRgb(x, y))
    },
    [isDragging, disabled, onChange, positionToRgb],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Глобальные обработчики событий
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const position = rgbToPosition(value)

  return (
    <div className="text-center space-y-2">
      <label className="text-xs font-medium text-foreground/90">{label}</label>

      <div
        ref={containerRef}
        className="relative mx-auto cursor-pointer"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        {/* Canvas для цветового колеса */}
        <canvas ref={canvasRef} width={size} height={size} className="absolute inset-0" />

        {/* Индикатор текущей позиции */}
        <div
          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          <div className="w-full h-full bg-foreground rounded-full border-2 border-background shadow-md" />
        </div>
      </div>

      {/* Численные значения */}
      <div className="grid grid-cols-3 gap-1 text-xs font-mono tabular-nums">
        <div className="text-muted-foreground">
          R:{" "}
          <span className="text-red-400">
            {value.r >= 0 ? "+" : ""}
            {value.r.toFixed(2)}
          </span>
        </div>
        <div className="text-muted-foreground">
          G:{" "}
          <span className="text-green-400">
            {value.g >= 0 ? "+" : ""}
            {value.g.toFixed(2)}
          </span>
        </div>
        <div className="text-muted-foreground">
          B:{" "}
          <span className="text-blue-400">
            {value.b >= 0 ? "+" : ""}
            {value.b.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  )
}
