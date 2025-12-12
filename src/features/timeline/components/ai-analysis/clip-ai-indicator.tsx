/**
 * Clip AI Indicator - Простая заглушка
 */

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

import type { TimelineClip } from "@/features/timeline/types"

interface ClipAIIndicatorProps {
  clip: TimelineClip
  className?: string
}

export function ClipAIIndicator({ clip, className }: ClipAIIndicatorProps) {
  // Показываем индикатор только если у клипа есть медиафайл
  if (!clip.mediaFile) {
    return null
  }

  return (
    <div className={cn("opacity-50", className)}>
      <Sparkles className="h-3 w-3 text-blue-500" />
    </div>
  )
}
