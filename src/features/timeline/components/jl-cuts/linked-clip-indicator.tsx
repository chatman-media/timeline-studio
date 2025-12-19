import { Link2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface LinkedClipIndicatorProps {
  isLinked: boolean
  className?: string
}

export function LinkedClipIndicator({ isLinked, className }: LinkedClipIndicatorProps) {
  if (!isLinked) return null

  return (
    <div
      className={cn("absolute bottom-0 right-0 m-1", "bg-primary/10 border border-primary/30 rounded p-0.5", className)}
      data-oid="5rcjw4:"
    >
      <Link2 className="h-3 w-3 text-primary" data-testid="link2-icon" data-oid="0lmwdb4" />
    </div>
  )
}
