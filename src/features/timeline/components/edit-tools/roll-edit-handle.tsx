import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { GripVertical } from "lucide-react"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import type { TimelineClip } from "../../types"
import { EDIT_MODES } from "../../types/edit-modes"

interface RollEditHandleProps {
  leftClip: TimelineClip
  rightClip: TimelineClip
  isHovered: boolean
  isActive: boolean
  timeScale: number
  onRollStart?: (mouseX: number) => void
}

export function RollEditHandle({
  leftClip,
  rightClip,
  isHovered,
  isActive,
  timeScale,
  onRollStart,
}: RollEditHandleProps) {
  const { editMode } = useEditModeContext()

  // Only show handle in roll mode when clips are adjacent
  if (editMode !== EDIT_MODES.ROLL || !isHovered) {
    return null
  }

  // Check if clips are adjacent
  const leftEnd = leftClip.startTime + leftClip.duration
  const rightStart = rightClip.startTime
  const gap = Math.abs(rightStart - leftEnd)

  // Only show for adjacent clips (small gap tolerance)
  if (gap > 0.001) {
    return null
  }

  const handlePosition = leftEnd * timeScale

  return (
    <TooltipProvider delayDuration={0} data-oid="5o7iap8">
      <Tooltip data-oid="3jzqt-k">
        <TooltipTrigger asChild data-oid="w::hgp9">
          <div
            className={cn(
              "absolute top-0 bottom-0 w-4 -translate-x-1/2",
              "flex items-center justify-center cursor-ew-resize z-20",
              "transition-all duration-150",
            )}
            style={{
              left: `${handlePosition}px`,
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              onRollStart?.(e.clientX)
            }}
            data-oid="vit4gub"
          >
            {/* Handle background */}
            <div
              className={cn(
                "absolute inset-0 bg-purple-500/20 rounded",
                "border-x-2 border-purple-500",
                isActive && "bg-purple-500/40",
              )}
              data-oid="jr-qf0s"
            />

            {/* Handle icon */}
            <div className="relative z-10" data-oid="y022xqw">
              <GripVertical className="w-4 h-4 text-purple-500" data-oid="_wc090e" />
            </div>

            {/* Visual indicators */}
            {isActive && (
              <>
                {/* Left clip indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 right-full mr-1" data-oid="14cm9qc">
                  <div className="w-8 h-0.5 bg-purple-500/50" data-oid="vytucz3" />
                </div>

                {/* Right clip indicator */}
                <div className="absolute top-1/2 -translate-y-1/2 left-full ml-1" data-oid="vwheyi4">
                  <div className="w-8 h-0.5 bg-purple-500/50" data-oid="6jnxqd0" />
                </div>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white" data-oid="s6f_u:m">
          <p className="text-sm" data-oid="qfoj5hr">
            Roll Edit (W)
          </p>
          <p className="text-xs opacity-80" data-oid="2.chgdo">
            Drag to adjust edit point
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
