import { Volume2, VolumeX } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import type { AudioClip } from "../../services/audio-clip-editor"

interface AudioClipProps {
  clip: AudioClip
  pixelsPerSecond: number
  trackHeight: number
  isSelected: boolean
  onSelect: () => void
  onPositionChange: (newStartTime: number) => void
  onDurationChange: (newDuration: number) => void
  waveformData?: Float32Array
}

export function AudioClipComponent({
  clip,
  pixelsPerSecond,
  trackHeight,
  isSelected,
  onSelect,
  onPositionChange,
  onDurationChange,
  waveformData,
}: AudioClipProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [initialStartTime, setInitialStartTime] = useState(0)
  const [initialDuration, setInitialDuration] = useState(0)

  const clipWidth = clip.duration * pixelsPerSecond
  const clipX = clip.startTime * pixelsPerSecond

  // Рисуем waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Устанавливаем размер canvas
    canvas.width = clipWidth
    canvas.height = trackHeight - 4

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем waveform
    ctx.fillStyle = "#3b82f6"
    ctx.strokeStyle = "#60a5fa"
    ctx.lineWidth = 1

    const samples = waveformData.length
    // const step = Math.max(1, Math.floor(samples / canvas.width))
    const centerY = canvas.height / 2

    ctx.beginPath()
    ctx.moveTo(0, centerY)

    for (let x = 0; x < canvas.width; x++) {
      const sampleIndex = Math.floor((x / canvas.width) * samples)
      const value = waveformData[sampleIndex] || 0
      const y = centerY - value * centerY * 0.8
      ctx.lineTo(x, y)
    }

    // Зеркалим для нижней части
    for (let x = canvas.width - 1; x >= 0; x--) {
      const sampleIndex = Math.floor((x / canvas.width) * samples)
      const value = waveformData[sampleIndex] || 0
      const y = centerY + value * centerY * 0.8
      ctx.lineTo(x, y)
    }

    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Рисуем fade in/out
    if (clip.fadeIn > 0) {
      const fadeInWidth = clip.fadeIn * pixelsPerSecond
      const gradient = ctx.createLinearGradient(0, 0, fadeInWidth, 0)
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, fadeInWidth, canvas.height)
    }

    if (clip.fadeOut > 0) {
      const fadeOutWidth = clip.fadeOut * pixelsPerSecond
      const fadeOutStart = canvas.width - fadeOutWidth
      const gradient = ctx.createLinearGradient(fadeOutStart, 0, canvas.width, 0)
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)")
      ctx.fillStyle = gradient
      ctx.fillRect(fadeOutStart, 0, fadeOutWidth, canvas.height)
    }
  }, [clipWidth, trackHeight, waveformData, clip.fadeIn, clip.fadeOut, pixelsPerSecond])

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | "resize-left" | "resize-right") => {
    e.preventDefault()
    e.stopPropagation()

    onSelect()

    if (action === "drag") {
      setIsDragging(true)
    } else {
      setIsResizing(action === "resize-left" ? "left" : "right")
    }

    setDragStartX(e.clientX)
    setInitialStartTime(clip.startTime)
    setInitialDuration(clip.duration)

    // Добавляем глобальные обработчики
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - dragStartX
    const deltaTime = deltaX / pixelsPerSecond

    if (isDragging) {
      const newStartTime = Math.max(0, initialStartTime + deltaTime)
      onPositionChange(newStartTime)
    } else if (isResizing === "left") {
      const newStartTime = Math.max(0, initialStartTime + deltaTime)
      const newDuration = Math.max(0.1, initialDuration - deltaTime)
      onPositionChange(newStartTime)
      onDurationChange(newDuration)
    } else if (isResizing === "right") {
      const newDuration = Math.max(0.1, initialDuration + deltaTime)
      onDurationChange(newDuration)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(null)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      className={cn(
        "absolute top-1 rounded overflow-hidden cursor-move transition-all",
        "bg-zinc-800 border",
        isSelected ? "border-blue-500 shadow-lg" : "border-zinc-700",
        isDragging || isResizing ? "opacity-80" : "",
      )}
      style={{
        left: `${clipX}px`,
        width: `${clipWidth}px`,
        height: `${trackHeight - 8}px`,
      }}
      onMouseDown={(e) => handleMouseDown(e, "drag")}
      data-oid="932ds2i"
    >
      {/* Левый край для изменения размера */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/50"
        onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        data-oid="w3mdnys"
      />

      {/* Правый край для изменения размера */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/50"
        onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        data-oid="a5o589v"
      />

      {/* Waveform */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" data-oid="c8c4jf4" />

      {/* Информация о клипе */}
      <div
        className="absolute top-1 left-2 right-2 flex items-center justify-between pointer-events-none"
        data-oid="-81og.8"
      >
        <span className="text-xs text-white/80 truncate" data-oid="-n.99.k">
          {clip.id.split("_")[0]}
        </span>
        <div className="flex items-center gap-1" data-oid="l5p5:5:">
          {clip.gain === 0 ? (
            <VolumeX className="w-3 h-3 text-red-400" data-oid="lsrwif1" />
          ) : (
            <Volume2 className="w-3 h-3 text-white/60" data-oid=".njwa_:" />
          )}
        </div>
      </div>

      {/* Индикаторы fade */}
      {clip.fadeIn > 0 && (
        <div
          className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-white/60 pointer-events-none"
          data-oid="6j5u:b:"
        >
          ↗ {clip.fadeIn.toFixed(1)}s
        </div>
      )}
      {clip.fadeOut > 0 && (
        <div
          className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-white/60 pointer-events-none"
          data-oid=":jtq6kh"
        >
          {clip.fadeOut.toFixed(1)}s ↘
        </div>
      )}
    </div>
  )
}
