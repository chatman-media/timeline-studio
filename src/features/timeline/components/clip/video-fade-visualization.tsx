/**
 * Video Fade Visualization
 * Компонент для визуализации fade in/out на клипе
 */

import { memo, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { TimelineClip } from "../../types"

interface VideoFadeVisualizationProps {
  clip: TimelineClip
  width: number
  height: number
  pixelsPerSecond: number
  className?: string
}

export const VideoFadeVisualization = memo(function VideoFadeVisualization({
  clip,
  width,
  height,
  pixelsPerSecond,
  className,
}: VideoFadeVisualizationProps) {
  const fadeInWidth = useMemo(() => {
    if (!clip.fadeIn?.duration) return 0
    return Math.min(clip.fadeIn.duration * pixelsPerSecond, width)
  }, [clip.fadeIn, pixelsPerSecond, width])

  const fadeOutWidth = useMemo(() => {
    if (!clip.fadeOut?.duration) return 0
    return Math.min(clip.fadeOut.duration * pixelsPerSecond, width)
  }, [clip.fadeOut, pixelsPerSecond, width])

  const fadeInPath = useMemo(() => {
    if (!fadeInWidth) return ""

    const type = clip.fadeIn?.type || "linear"
    const points: string[] = []
    const steps = Math.min(fadeInWidth, 50) // Максимум 50 точек для производительности

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * fadeInWidth
      const progress = i / steps
      let y = height

      switch (type) {
        case "linear":
          y = height * (1 - progress)
          break
        case "exponential":
          y = height * (1 - progress ** 2)
          break
        case "logarithmic":
          y = height * (1 - (1 - (1 - progress) ** 2))
          break
        case "cosine":
          y = height * (1 - (1 - Math.cos(progress * Math.PI)) / 2)
          break
        case "ease-in":
          y = height * (1 - progress * progress)
          break
        case "ease-out":
          y = height * (1 - (1 - (1 - progress) * (1 - progress)))
          break
        case "ease-in-out":
          y = height * (1 - (progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2))
          break
      }

      points.push(`${x},${y}`)
    }

    return `M0,${height} ${points.join(" ")} L${fadeInWidth},0 L${fadeInWidth},${height} Z`
  }, [fadeInWidth, height, clip.fadeIn?.type])

  const fadeOutPath = useMemo(() => {
    if (!fadeOutWidth) return ""

    const type = clip.fadeOut?.type || "linear"
    const points: string[] = []
    const steps = Math.min(fadeOutWidth, 50)
    const startX = width - fadeOutWidth

    for (let i = 0; i <= steps; i++) {
      const x = startX + (i / steps) * fadeOutWidth
      const progress = i / steps
      let y = 0

      switch (type) {
        case "linear":
          y = height * progress
          break
        case "exponential":
          y = height * progress ** 2
          break
        case "logarithmic":
          y = height * (1 - (1 - progress) ** 2)
          break
        case "cosine":
          y = height * ((1 - Math.cos(progress * Math.PI)) / 2)
          break
        case "ease-in":
          y = height * (progress * progress)
          break
        case "ease-out":
          y = height * (1 - (1 - progress) * (1 - progress))
          break
        case "ease-in-out":
          y = height * (progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2)
          break
      }

      points.push(`${x},${y}`)
    }

    return `M${startX},0 ${points.join(" ")} L${width},${height} L${startX},${height} Z`
  }, [fadeOutWidth, width, height, clip.fadeOut?.type])

  if (!clip.fadeIn && !clip.fadeOut) return null

  return (
    <svg
      className={cn("absolute inset-0 pointer-events-none", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      data-oid="i_69ma5"
    >
      {fadeInPath && <path d={fadeInPath} fill="url(#fadeInGradient)" opacity={0.6} data-oid="_kijfjq" />}
      {fadeOutPath && <path d={fadeOutPath} fill="url(#fadeOutGradient)" opacity={0.6} data-oid="x7892qx" />}

      <defs data-oid="s684hvt">
        <linearGradient id="fadeInGradient" x1="0%" y1="0%" x2="100%" y2="0%" data-oid="_tk93lq">
          <stop offset="0%" stopColor="black" stopOpacity="0.8" data-oid="4k3_2q2" />
          <stop offset="100%" stopColor="black" stopOpacity="0" data-oid="vf5g9wy" />
        </linearGradient>
        <linearGradient id="fadeOutGradient" x1="0%" y1="0%" x2="100%" y2="0%" data-oid="tmfg3x-">
          <stop offset="0%" stopColor="black" stopOpacity="0" data-oid="cv_oj3h" />
          <stop offset="100%" stopColor="black" stopOpacity="0.8" data-oid="-ky4:i5" />
        </linearGradient>
      </defs>
    </svg>
  )
})
