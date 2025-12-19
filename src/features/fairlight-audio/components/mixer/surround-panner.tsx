import type React from "react"
import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

// Surround sound formats
export type SurroundFormat = "stereo" | "5.1" | "7.1"

// Speaker positions for different formats
const SPEAKER_POSITIONS = {
  stereo: [
    { id: "L", labelKey: "left", x: 30, y: 50, angle: -30 },
    { id: "R", labelKey: "right", x: 70, y: 50, angle: 30 },
  ],

  "5.1": [
    { id: "L", labelKey: "left", x: 20, y: 60, angle: -30 },
    { id: "R", labelKey: "right", x: 80, y: 60, angle: 30 },
    { id: "C", labelKey: "center", x: 50, y: 20, angle: 0 },
    { id: "LFE", labelKey: "lfe", x: 50, y: 85, angle: 0 },
    { id: "LS", labelKey: "leftSurround", x: 15, y: 80, angle: -110 },
    { id: "RS", labelKey: "rightSurround", x: 85, y: 80, angle: 110 },
  ],

  "7.1": [
    { id: "L", labelKey: "left", x: 20, y: 60, angle: -30 },
    { id: "R", labelKey: "right", x: 80, y: 60, angle: 30 },
    { id: "C", labelKey: "center", x: 50, y: 20, angle: 0 },
    { id: "LFE", labelKey: "lfe", x: 50, y: 85, angle: 0 },
    { id: "LS", labelKey: "leftSurround", x: 10, y: 75, angle: -110 },
    { id: "RS", labelKey: "rightSurround", x: 90, y: 75, angle: 110 },
    { id: "LR", labelKey: "leftRear", x: 25, y: 90, angle: -135 },
    { id: "RR", labelKey: "rightRear", x: 75, y: 90, angle: 135 },
  ],
}

interface SurroundPannerProps {
  format: SurroundFormat
  position: { x: number; y: number } // Position in the surround field (0-100)
  onPositionChange: (position: { x: number; y: number }) => void
  className?: string
}

export function SurroundPanner({ format, position, onPositionChange, className }: SurroundPannerProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const speakers = SPEAKER_POSITIONS[format]

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Clamp values to valid range
      const clampedX = Math.max(0, Math.min(100, x))
      const clampedY = Math.max(0, Math.min(100, y))

      onPositionChange({ x: clampedX, y: clampedY })
    },
    [isDragging, onPositionChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Calculate distances from position to each speaker for visual feedback
  const calculateDistance = (speakerX: number, speakerY: number) => {
    const dx = position.x - speakerX
    const dy = position.y - speakerY
    return Math.sqrt(dx * dx + dy * dy)
  }

  return (
    <div className={cn("relative bg-muted rounded-lg p-4", className)} data-oid="ebqpjly">
      {/* Format selector */}
      <div className="mb-4" data-oid="lyw8i81">
        <div className="text-sm font-medium text-foreground mb-2" data-oid="z_31h6_">
          {t(`fairlightAudio.surround.panner.${format}`)}
        </div>
        <div className="text-xs text-muted-foreground" data-oid="c92rxw4">
          {t("fairlightAudio.surround.panner.position", {
            x: position.x.toFixed(0),
            y: position.y.toFixed(0),
          })}
        </div>
      </div>

      {/* Panning field */}
      <div
        className="relative w-full h-48 bg-background border border-border rounded cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-oid="8fltbtz"
      >
        {/* Speaker positions */}
        {speakers.map((speaker) => {
          const distance = calculateDistance(speaker.x, speaker.y)
          const intensity = Math.max(0, 1 - distance / 100) // Closer = more intense

          return (
            <div
              key={speaker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${speaker.x}%`,
                top: `${speaker.y}%`,
              }}
              data-oid="uyhbahf"
            >
              {/* Speaker indicator */}
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 transition-all",
                  intensity > 0.5
                    ? "bg-primary border-primary"
                    : intensity > 0.2
                      ? "bg-primary/50 border-primary"
                      : "bg-muted border-muted-foreground",
                )}
                data-oid="1:guako"
              />

              {/* Speaker label */}
              <div
                className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap"
                data-oid="nkantp9"
              >
                {t(`fairlightAudio.surround.speakers.${speaker.labelKey}`)}
              </div>
            </div>
          )
        })}

        {/* Audio source position */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
          data-oid="tbx:isj"
        >
          <div
            className={cn(
              "w-3 h-3 bg-accent border-2 border-accent-foreground rounded-full transition-all",
              isDragging && "scale-125",
            )}
            data-oid="8-f648v"
          />

          {/* Position indicator */}
          <div
            className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-accent-foreground font-medium"
            data-oid="seu-ir4"
          >
            {t("fairlightAudio.surround.panner.source")}
          </div>
        </div>

        {/* Center reference */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" data-oid="cydxrfh">
          <div className="w-1 h-1 bg-muted-foreground rounded-full" data-oid="n9oyy-." />
        </div>

        {/* Distance rings for reference */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" data-oid="xa5vhp_">
          <div className="w-16 h-16 border border-muted-foreground/20 rounded-full" data-oid="e3.87t0" />
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-muted-foreground/10 rounded-full"
            data-oid="xgh:0ig"
          />
        </div>
      </div>

      {/* Channel levels indicator */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs" data-oid="fkxplqf">
        {speakers.map((speaker) => {
          const distance = calculateDistance(speaker.x, speaker.y)
          const level = Math.max(0, Math.min(1, 1 - distance / 100))
          const dbLevel = level > 0 ? 20 * Math.log10(level) : -60

          return (
            <div key={speaker.id} className="flex items-center gap-2" data-oid="k-da7dq">
              <span className="w-8 text-muted-foreground" data-oid="lc80-.z">
                {t(`fairlightAudio.surround.channels.${speaker.id}`)}:
              </span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden" data-oid="xvydlvk">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${level * 100}%` }}
                  data-oid="n2_utjk"
                />
              </div>
              <span className="w-12 text-right text-muted-foreground" data-oid="zvayi_z">
                {dbLevel > -60 ? `${dbLevel.toFixed(0)}dB` : "-∞"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
