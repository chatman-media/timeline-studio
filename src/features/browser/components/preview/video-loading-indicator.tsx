import { Loader2 } from "lucide-react"
import { memo } from "react"

import { cn } from "@/lib/utils"

interface VideoLoadingIndicatorProps {
  isLoading: boolean
  loadProgress: number
  bufferProgress: number
  size?: number
  className?: string
}

export const VideoLoadingIndicator = memo(function VideoLoadingIndicator({
  isLoading,
  size = 150,
  className,
}: Omit<VideoLoadingIndicatorProps, "loadProgress" | "bufferProgress">) {
  if (!isLoading) return null

  return (
    <div className={cn("absolute inset-0 flex items-center justify-center bg-black/10", className)} data-oid="ff99769">
      <Loader2 className="animate-spin text-white/60" size={size > 100 ? 20 : 14} data-oid="g1enm-n" />
    </div>
  )
})
