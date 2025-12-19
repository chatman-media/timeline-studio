/**
 * Clip AI Indicator - Простая заглушка
 */

import { Sparkles } from "lucide-react"
import type { TimelineClip } from "@/features/timeline/types"
import { cn } from "@/lib/utils"

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
    <div className={cn("opacity-50", className)} data-oid=".qr5wl7">
      <Sparkles className="h-3 w-3 text-blue-500" data-oid=":o82tqa" />
    </div>
  )
}
