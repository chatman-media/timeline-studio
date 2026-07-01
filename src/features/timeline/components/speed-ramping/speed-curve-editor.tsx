import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { ChevronDown, Gauge, Lock, Plus, RotateCcw, Trash2, Unlock } from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

import { useSpeedRamping } from "../../hooks/speed-ramping/use-speed-ramping"
import type { SpeedInterpolationType } from "../../types/speed-ramping"
import { SPEED_RAMPING_PRESETS } from "../../types/speed-ramping"

interface SpeedCurveEditorProps {
  clipId: string
  clipDuration: number
  pixelsPerSecond: number
  height?: number
  className?: string
  onClose?: () => void
}

const interpolationTypes: { value: SpeedInterpolationType; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease In" },
  { value: "ease-out", label: "Ease Out" },
  { value: "ease-in-out", label: "Ease In-Out" },
  { value: "hold", label: "Hold" },
]

export function SpeedCurveEditor({
  clipId,
  clipDuration,
  pixelsPerSecond,
  height = 120,
  className,
  onClose,
}: SpeedCurveEditorProps) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    getConfig,
    addKeyframe,
    updateKeyframe,
    removeKeyframe,
    applyPreset,
    resetToConstantSpeed,
    getSpeedCurveData,
  } = useSpeedRamping()

  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedKeyframe, setDraggedKeyframe] = useState<string | null>(null)

  const config = getConfig(clipId)
  const keyframes = config?.keyframes || []
  const width = clipDuration * pixelsPerSecond

  // Рисование кривой скорости
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx || !config) return

    // Очищаем canvas
    ctx.clearRect(0, 0, width, height)

    // Рисуем сетку
    ctx.strokeStyle = "rgba(100, 100, 100, 0.2)"
    ctx.lineWidth = 1

    // Горизонтальные линии (скорость)
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Вертикальные линии (время)
    const timeStep = 1 // 1 секунда
    for (let t = 0; t <= clipDuration; t += timeStep) {
      const x = t * pixelsPerSecond
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    // Рисуем линию 1.0x (нормальная скорость)
    ctx.strokeStyle = "rgba(100, 100, 100, 0.5)"
    ctx.setLineDash([5, 5])
    const normalY = height - height / 4 // 1.0 на шкале 0-4x
    ctx.beginPath()
    ctx.moveTo(0, normalY)
    ctx.lineTo(width, normalY)
    ctx.stroke()
    ctx.setLineDash([])

    // Рисуем кривую скорости
    const curveData = getSpeedCurveData(clipId, Math.floor(width))
    if (curveData.length > 0) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.beginPath()

      curveData.forEach((point, index) => {
        const x = point.time * pixelsPerSecond
        const y = height - (point.speed / 4) * height // Масштабируем 0-4x к высоте

        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    // Рисуем keyframes
    keyframes.forEach((keyframe) => {
      const x = keyframe.time * pixelsPerSecond
      const y = height - (keyframe.value / 4) * height

      // Кружок keyframe
      ctx.fillStyle = selectedKeyframe === keyframe.id ? "#3b82f6" : "#6b7280"
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Иконка блокировки
      if (keyframe.isLocked) {
        ctx.fillStyle = "#ef4444"
        ctx.font = "10px sans-serif"
        ctx.fillText("🔒", x - 5, y - 10)
      }
    })
  }, [config, keyframes, width, height, selectedKeyframe, getSpeedCurveData, clipId, clipDuration, pixelsPerSecond])

  // Обработка клика для добавления keyframe
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDragging) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Проверяем, не кликнули ли на существующий keyframe
      const clickedKeyframe = keyframes.find((kf) => {
        const kfX = kf.time * pixelsPerSecond
        const kfY = height - (kf.value / 4) * height
        const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2)
        return distance <= 8
      })

      if (clickedKeyframe) {
        setSelectedKeyframe(clickedKeyframe.id)
      } else {
        // Добавляем новый keyframe
        const time = x / pixelsPerSecond
        const value = (1 - y / height) * 4 // Инвертируем Y и масштабируем к 0-4x

        if (time >= 0 && time <= clipDuration && value >= 0.1 && value <= 4) {
          addKeyframe(clipId, time, value, "ease")
        }
      }
    },
    [isDragging, keyframes, pixelsPerSecond, height, clipDuration, clipId, addKeyframe],
  )

  // Начало перетаскивания keyframe
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Находим keyframe под курсором
      const keyframe = keyframes.find((kf) => {
        const kfX = kf.time * pixelsPerSecond
        const kfY = height - (kf.value / 4) * height
        const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2)
        return distance <= 8
      })

      if (keyframe && !keyframe.isLocked) {
        setIsDragging(true)
        setDraggedKeyframe(keyframe.id)
        setSelectedKeyframe(keyframe.id)
      }
    },
    [keyframes, pixelsPerSecond, height],
  )

  // Перетаскивание keyframe
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedKeyframe || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const time = Math.max(0, Math.min(clipDuration, x / pixelsPerSecond))
      const value = Math.max(0.1, Math.min(4, (1 - y / height) * 4))

      updateKeyframe(clipId, draggedKeyframe, { time, value })
    },
    [isDragging, draggedKeyframe, clipDuration, pixelsPerSecond, height, clipId, updateKeyframe],
  )

  // Окончание перетаскивания
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDraggedKeyframe(null)
  }, [])

  // Глобальные обработчики для перетаскивания
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Удаление выбранного keyframe
  const handleDeleteKeyframe = useCallback(() => {
    if (selectedKeyframe) {
      removeKeyframe(clipId, selectedKeyframe)
      setSelectedKeyframe(null)
    }
  }, [selectedKeyframe, clipId, removeKeyframe])

  // Изменение типа интерполяции
  const handleInterpolationChange = useCallback(
    (interpolation: SpeedInterpolationType) => {
      if (selectedKeyframe) {
        updateKeyframe(clipId, selectedKeyframe, { interpolation })
      }
    },
    [selectedKeyframe, clipId, updateKeyframe],
  )

  // Блокировка/разблокировка keyframe
  const handleToggleLock = useCallback(() => {
    if (selectedKeyframe) {
      const keyframe = keyframes.find((kf) => kf.id === selectedKeyframe)
      if (keyframe) {
        updateKeyframe(clipId, selectedKeyframe, {
          isLocked: !keyframe.isLocked,
        })
      }
    }
  }, [selectedKeyframe, keyframes, clipId, updateKeyframe])

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-background border rounded-lg overflow-hidden", className)}
      data-oid="blpme8g"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50" data-oid="39kgxbx">
        <div className="flex items-center gap-2" data-oid="qfxpqx6">
          <Gauge className="h-4 w-4 text-muted-foreground" data-oid="uiv.n2o" />
          <span className="text-sm font-medium" data-oid="wy2ct4y">
            {t("timeline.speedRamping.title", "Speed Ramping")}
          </span>

          {/* Presets */}
          <DropdownMenu data-oid="zw_gxfc">
            <DropdownMenuTrigger asChild data-oid="z5o0pmp">
              <Button variant="ghost" size="sm" data-oid=".0i7f42">
                {t("timeline.speedRamping.presets", "Presets")}
                <ChevronDown className="h-3 w-3 ml-1" data-oid="9v-g19s" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent data-oid="8.hbue3">
              {["basic", "creative", "sport", "cinematic"].map((category) => (
                <React.Fragment key={category}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground" data-oid="ij91p0i">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                  {SPEED_RAMPING_PRESETS.filter((preset) => preset.category === category).map((preset) => (
                    <DropdownMenuItem key={preset.id} onClick={() => applyPreset(clipId, preset.id)} data-oid="src67cp">
                      {preset.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator data-oid="tua.nrm" />
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1" data-oid="kyqqmp:">
          {/* Selected keyframe controls */}
          {selectedKeyframe && (
            <>
              <DropdownMenu data-oid="cy.h5d5">
                <DropdownMenuTrigger asChild data-oid="rupa7zt">
                  <Button variant="ghost" size="sm" data-oid="n_p.7yt">
                    {interpolationTypes.find(
                      (t) => t.value === keyframes.find((kf) => kf.id === selectedKeyframe)?.interpolation,
                    )?.label || "Linear"}
                    <ChevronDown className="h-3 w-3 ml-1" data-oid="2934id3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent data-oid="6j0ouvc">
                  {interpolationTypes.map((type) => (
                    <DropdownMenuItem
                      key={type.value}
                      onClick={() => handleInterpolationChange(type.value)}
                      data-oid="x-ye.b4"
                    >
                      {type.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider data-oid="xlr4gyy">
                <Tooltip data-oid=":xxixnc">
                  <TooltipTrigger asChild data-oid="jw5iv67">
                    <Button variant="ghost" size="sm" onClick={handleToggleLock} data-oid="d22subl">
                      {keyframes.find((kf) => kf.id === selectedKeyframe)?.isLocked ? (
                        <Lock className="h-4 w-4" data-oid="ym95eou" />
                      ) : (
                        <Unlock className="h-4 w-4" data-oid="9rzpdgr" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent data-oid="2ew:22r">
                    {keyframes.find((kf) => kf.id === selectedKeyframe)?.isLocked ? "Unlock" : "Lock"} keyframe
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider data-oid="i2ifuaq">
                <Tooltip data-oid="x32mq05">
                  <TooltipTrigger asChild data-oid="5b5k02v">
                    <Button variant="ghost" size="sm" onClick={handleDeleteKeyframe} data-oid="kpsjd.r">
                      <Trash2 className="h-4 w-4" data-oid="5h.jjtb" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent data-oid="drp4:d6">
                    {t("timeline.speedRamping.deleteKeyframe", "Delete keyframe")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          <TooltipProvider data-oid="2:-:irs">
            <Tooltip data-oid="0ku3n11">
              <TooltipTrigger asChild data-oid="tdlguov">
                <Button variant="ghost" size="sm" onClick={() => resetToConstantSpeed(clipId, 1.0)} data-oid="5zt892o">
                  <RotateCcw className="h-4 w-4" data-oid="26xh3ja" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="yh77yw4">
                {t("timeline.speedRamping.resetToNormalSpeed", "Reset to normal speed")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} data-oid="l2gcxj0">
              ✕
            </Button>
          )}
        </div>
      </div>

      {/* Canvas for curve */}
      <div className="relative p-4" style={{ height: `${height + 32}px` }} data-oid="8kklk.j">
        {/* Y-axis labels */}
        <div
          className="absolute left-0 top-4 bottom-4 w-8 flex flex-col justify-between text-xs text-muted-foreground"
          data-oid="bioh0wt"
        >
          <span data-oid="q.xxi_9">4x</span>
          <span data-oid="t8l5fbf">3x</span>
          <span data-oid="s.uuid6">2x</span>
          <span data-oid="b-0kpx.">1x</span>
          <span data-oid="og-ax07">0x</span>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          data-testid="speed-curve-canvas"
          width={width}
          height={height}
          className="absolute left-10 cursor-crosshair"
          style={{ width: `${width}px`, height: `${height}px` }}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          data-oid="z-1j__t"
        />

        {/* Instructions */}
        {keyframes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground" data-oid="iv3zqr-">
            <div className="text-center" data-oid="bhnxg16">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" data-oid="x36saxq" />
              <p className="text-sm" data-oid="1qsfwwd">
                {t("timeline.speedRamping.clickToAddKeyframes", "Click to add speed keyframes")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
