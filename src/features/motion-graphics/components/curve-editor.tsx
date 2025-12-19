/**
 * Curve Editor Component
 * Visual keyframe editing with bezier curves
 */

import { Grid, Lock, Maximize2, Pause, Play, SkipBack, SkipForward, Unlock } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

import { interpolateKeyframes } from "../services/interpolation"

import type { AnimationCurve, InterpolationType, Keyframe } from "../types/keyframe"

interface CurveEditorProps {
  curves: AnimationCurve[]
  currentTime: number
  duration: number
  onTimeChange: (time: number) => void
  onKeyframeAdd: (curveId: string, time: number, value: number) => void
  onKeyframeUpdate: (curveId: string, keyframeId: string, updates: Partial<Keyframe>) => void
  onKeyframeDelete: (curveId: string, keyframeId: string) => void
  onCurveSelect: (curveId: string) => void
  selectedCurveId?: string
  height?: number
  snapToGrid?: boolean
  gridSize?: number
}

export function CurveEditor({
  curves,
  currentTime,
  duration,
  onTimeChange,
  onKeyframeAdd,
  onKeyframeUpdate,
  onKeyframeDelete: _onKeyframeDelete,
  onCurveSelect,
  selectedCurveId,
  height = 400,
  snapToGrid = false,
  gridSize = 1,
}: CurveEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [draggedKeyframe, setDraggedKeyframe] = useState<{
    curveId: string
    keyframeId: string
    startX: number
    startY: number
  } | null>(null)
  const [showGrid, setShowGrid] = useState(true)
  const [selectedInterpolation, setSelectedInterpolation] = useState<InterpolationType>("bezier")

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return

    const startTime = Date.now()
    const startCurrentTime = currentTime

    const animate = () => {
      if (!isPlaying) return

      const elapsed = (Date.now() - startTime) / 1000
      const newTime = (startCurrentTime + elapsed) % duration
      onTimeChange(newTime)

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)

    return () => {
      setIsPlaying(false)
    }
  }, [isPlaying, currentTime, duration, onTimeChange])

  // Draw curves
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Apply transforms
    ctx.save()
    ctx.translate(panX, panY)
    ctx.scale(zoom, zoom)

    // Draw grid
    if (showGrid) {
      drawGrid(ctx, width, height, zoom)
    }

    // Draw curves
    curves.forEach((curve) => {
      if (curve.visible) {
        drawCurve(ctx, curve, width, height, curve.propertyId === selectedCurveId)
      }
    })

    // Draw current time indicator
    drawTimeIndicator(ctx, currentTime, duration, width, height)

    ctx.restore()
  }, [curves, currentTime, duration, zoom, panX, panY, showGrid, selectedCurveId])

  // Mouse handling
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = (e.clientX - rect.left - panX) / zoom
      const y = (e.clientY - rect.top - panY) / zoom

      // Check if clicking on a keyframe
      for (const curve of curves) {
        if (!curve.visible) continue

        for (const keyframe of curve.keyframes) {
          const kfX = (keyframe.time / duration) * canvas.width
          const kfY = canvas.height / 2 - (keyframe.value as number) * 100

          if (Math.abs(x - kfX) < 10 && Math.abs(y - kfY) < 10) {
            setDraggedKeyframe({
              curveId: curve.propertyId,
              keyframeId: keyframe.id,
              startX: x,
              startY: y,
            })
            onCurveSelect(curve.propertyId)
            return
          }
        }
      }

      // If not on keyframe, add new keyframe
      const time = (x / canvas.width) * duration
      const value = -(y - canvas.height / 2) / 100

      if (selectedCurveId && time >= 0 && time <= duration) {
        const snappedTime = snapToGrid ? Math.round(time / gridSize) * gridSize : time
        onKeyframeAdd(selectedCurveId, snappedTime, value)
      }
    },
    [curves, duration, zoom, panX, panY, snapToGrid, gridSize, selectedCurveId, onKeyframeAdd, onCurveSelect],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedKeyframe || !canvasRef.current) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - panX) / zoom
      const y = (e.clientY - rect.top - panY) / zoom

      const time = (x / canvasRef.current.width) * duration
      const value = -(y - canvasRef.current.height / 2) / 100

      const snappedTime = snapToGrid ? Math.round(time / gridSize) * gridSize : time

      onKeyframeUpdate(draggedKeyframe.curveId, draggedKeyframe.keyframeId, {
        time: Math.max(0, Math.min(duration, snappedTime)),
        value,
      })
    },
    [draggedKeyframe, duration, zoom, panX, panY, snapToGrid, gridSize, onKeyframeUpdate],
  )

  const handleMouseUp = useCallback(() => {
    setDraggedKeyframe(null)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((z) => Math.max(0.1, Math.min(10, z * delta)))
  }, [])

  return (
    <Card className="p-4" data-oid="9hfw01c">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4" data-oid="ja6czre">
        <Button size="sm" variant="ghost" onClick={() => setIsPlaying(!isPlaying)} data-oid="zrubl8m">
          {isPlaying ? (
            <Pause className="h-4 w-4" data-oid="o835qv." />
          ) : (
            <Play className="h-4 w-4" data-oid="wvqf1mf" />
          )}
        </Button>

        <Button size="sm" variant="ghost" onClick={() => onTimeChange(0)} data-oid="8seph7g">
          <SkipBack className="h-4 w-4" data-oid="67--hui" />
        </Button>

        <Button size="sm" variant="ghost" onClick={() => onTimeChange(duration)} data-oid="umiyogw">
          <SkipForward className="h-4 w-4" data-oid="lbapasz" />
        </Button>

        <div className="h-4 w-px bg-border" data-oid="t_acqx6" />

        <Button size="sm" variant="ghost" onClick={() => setShowGrid(!showGrid)} data-oid="r06rn5a">
          <Grid className="h-4 w-4" data-oid="787w..p" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setZoom(1)
            setPanX(0)
            setPanY(0)
          }}
          data-oid="weha1i2"
        >
          <Maximize2 className="h-4 w-4" data-oid="zin1gpo" />
        </Button>

        <div className="h-4 w-px bg-border" data-oid=":t2g2mt" />

        <Select
          value={selectedInterpolation}
          onValueChange={(v) => setSelectedInterpolation(v as InterpolationType)}
          data-oid="8wgkni7"
        >
          <SelectTrigger className="w-32 h-8" data-oid="jyoybf:">
            <SelectValue data-oid="f__z-8a" />
          </SelectTrigger>
          <SelectContent data-oid="63qoyhr">
            <SelectItem value="linear" data-oid="7f-0zgr">
              Linear
            </SelectItem>
            <SelectItem value="bezier" data-oid="3w-urnj">
              Bezier
            </SelectItem>
            <SelectItem value="hold" data-oid="a-wml9g">
              Hold
            </SelectItem>
            <SelectItem value="ease" data-oid="0417:0n">
              Ease
            </SelectItem>
            <SelectItem value="ease-in" data-oid="dpg.2-x">
              Ease In
            </SelectItem>
            <SelectItem value="ease-out" data-oid="x7_eu2x">
              Ease Out
            </SelectItem>
            <SelectItem value="ease-in-out" data-oid=".bsuyl4">
              Ease In Out
            </SelectItem>
            <SelectItem value="bounce" data-oid="k1a4ftp">
              Bounce
            </SelectItem>
            <SelectItem value="elastic" data-oid="g4ifbrl">
              Elastic
            </SelectItem>
            <SelectItem value="back" data-oid=":d3tj1e">
              Back
            </SelectItem>
            <SelectItem value="expo" data-oid="je-i.r2">
              Expo
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" data-oid="i-v10dt" />

        <Slider
          value={[zoom]}
          onValueChange={([v]) => setZoom(v)}
          min={0.1}
          max={10}
          step={0.1}
          className="w-32"
          data-oid="f8x5abm"
        />
      </div>

      {/* Canvas */}
      <div className="relative overflow-hidden rounded-md bg-muted" data-oid="rgxbdv9">
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          data-oid="_mq4lh-"
        />

        {/* Time scrubber */}
        <input
          type="range"
          value={currentTime}
          onChange={(e) => onTimeChange(Number.parseFloat(e.target.value))}
          min={0}
          max={duration}
          step={0.01}
          className="absolute bottom-0 left-0 right-0 w-full"
          data-oid="6da5s8m"
        />
      </div>

      {/* Curve list */}
      <div className="mt-4 space-y-2" data-oid="1056w26">
        {curves.map((curve) => (
          <div
            key={curve.propertyId}
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted ${
              curve.propertyId === selectedCurveId ? "bg-muted" : ""
            }`}
            onClick={() => onCurveSelect(curve.propertyId)}
            data-oid="r0dpoot"
          >
            <div className="w-4 h-4 rounded" style={{ backgroundColor: curve.color }} data-oid="0m:zvh7" />
            <span className="text-sm flex-1" data-oid="7_--nu6">
              Property {curve.propertyId}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                // Toggle visibility
              }}
              data-oid="vbtn36l"
            >
              {curve.visible ? (
                <Unlock className="h-3 w-3" data-oid="px94knu" />
              ) : (
                <Lock className="h-3 w-3" data-oid="fmj1xep" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}

// Helper functions
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, zoom: number) {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
  ctx.lineWidth = 1

  // Vertical lines (time)
  const timeStep = 50 * zoom
  for (let x = 0; x < width; x += timeStep) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Horizontal lines (value)
  const valueStep = 50 * zoom
  for (let y = 0; y < height; y += valueStep) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Center lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"
  ctx.beginPath()
  ctx.moveTo(0, height / 2)
  ctx.lineTo(width, height / 2)
  ctx.stroke()
}

function drawCurve(
  ctx: CanvasRenderingContext2D,
  curve: AnimationCurve,
  width: number,
  height: number,
  isSelected: boolean,
) {
  if (curve.keyframes.length < 2) return

  ctx.strokeStyle = isSelected ? curve.color : `${curve.color}80`
  ctx.lineWidth = isSelected ? 2 : 1

  ctx.beginPath()

  // Draw curve segments
  for (let i = 0; i < curve.keyframes.length - 1; i++) {
    const kf1 = curve.keyframes[i]
    const kf2 = curve.keyframes[i + 1]

    const x1 = (kf1.time / curve.keyframes[curve.keyframes.length - 1].time) * width
    const y1 = height / 2 - (kf1.value as number) * 100
    const x2 = (kf2.time / curve.keyframes[curve.keyframes.length - 1].time) * width
    const y2 = height / 2 - (kf2.value as number) * 100

    if (i === 0) {
      ctx.moveTo(x1, y1)
    }

    if (kf1.interpolation === "hold") {
      ctx.lineTo(x2, y1)
      ctx.lineTo(x2, y2)
    } else if (kf1.interpolation === "bezier" && kf1.easeOut && kf2.easeIn) {
      // Draw bezier curve
      const cp1x = x1 + (x2 - x1) * kf1.easeOut[0]
      const cp1y = y1 + (y2 - y1) * kf1.easeOut[1]
      const cp2x = x1 + (x2 - x1) * kf2.easeIn[0]
      const cp2y = y1 + (y2 - y1) * kf2.easeIn[1]

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2)
    } else {
      // Draw interpolated line
      const steps = 20
      for (let j = 0; j <= steps; j++) {
        const t = j / steps
        const time = kf1.time + (kf2.time - kf1.time) * t
        const value = interpolateKeyframes(kf1, kf2, time) as number
        const x = (time / curve.keyframes[curve.keyframes.length - 1].time) * width
        const y = height / 2 - value * 100

        if (j === 0 && i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
    }
  }

  ctx.stroke()

  // Draw keyframes
  curve.keyframes.forEach((kf) => {
    const x = (kf.time / curve.keyframes[curve.keyframes.length - 1].time) * width
    const y = height / 2 - (kf.value as number) * 100

    ctx.fillStyle = kf.selected ? "#fff" : curve.color
    ctx.beginPath()
    ctx.arc(x, y, kf.selected ? 6 : 4, 0, Math.PI * 2)
    ctx.fill()

    if (kf.selected) {
      ctx.strokeStyle = curve.color
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })
}

function drawTimeIndicator(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  duration: number,
  width: number,
  height: number,
) {
  const x = (currentTime / duration) * width

  ctx.strokeStyle = "#ef4444"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, height)
  ctx.stroke()
}
