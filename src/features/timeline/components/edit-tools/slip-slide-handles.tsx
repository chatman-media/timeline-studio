import { Maximize2, MoveHorizontal } from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import type { TimelineClip } from "../../types"
import { EDIT_MODES } from "../../types/edit-modes"

interface SlipSlideHandlesProps {
  clip: TimelineClip
  isHovered: boolean
  isActive: boolean
  timeScale: number
  onSlipStart?: (mouseX: number) => void
  onSlideStart?: (mouseX: number) => void
}

export function SlipSlideHandles({
  clip,
  isHovered,
  isActive,
  timeScale,
  onSlipStart,
  onSlideStart,
}: SlipSlideHandlesProps) {
  const { editMode } = useEditModeContext()

  // Only show handles in slip or slide mode when hovering
  if (!isHovered || (editMode !== EDIT_MODES.SLIP && editMode !== EDIT_MODES.SLIDE)) {
    return null
  }

  const clipWidth = clip.duration * timeScale
  const clipLeft = clip.startTime * timeScale

  // Slip mode - show media boundaries
  if (editMode === EDIT_MODES.SLIP) {
    const mediaDuration = clip.mediaDuration || clip.duration
    const totalMediaWidth = mediaDuration * timeScale
    const offsetPixels = clip.offset * timeScale

    return (
      <>
        {/* Media extent indicators */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: `${clipLeft - offsetPixels}px`,
            width: `${totalMediaWidth}px`,
          }}
        >
          {/* Left media boundary */}
          {offsetPixels > 0 && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500/50" />}

          {/* Right media boundary */}
          {mediaDuration - clip.offset - clip.duration > 0 && (
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500/50" />
          )}

          {/* Available media indicator */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-blue-500/20 rounded-full" />
        </div>

        {/* Slip handle */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500",
                  "flex items-center justify-center cursor-ew-resize",
                  "transition-all duration-150",
                  isActive && "bg-blue-500/40 scale-110",
                )}
                style={{
                  left: `${clipLeft + clipWidth / 2}px`,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  onSlipStart?.(e.clientX)
                }}
              >
                <MoveHorizontal className="w-6 h-6 text-blue-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white">
              <p className="text-sm">Slip Edit (Y)</p>
              <p className="text-xs opacity-80">Drag to slip media content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    )
  }

  // Slide mode - show adjacent clip relationships
  if (editMode === EDIT_MODES.SLIDE) {
    return (
      <>
        {/* Slide direction indicators */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: `${clipLeft}px`,
            width: `${clipWidth}px`,
          }}
        >
          {/* Left arrow */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full">
            <div className="w-8 h-0.5 bg-green-500/50" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 
              border-t-4 border-t-transparent
              border-r-4 border-r-green-500/50
              border-b-4 border-b-transparent"
            />
          </div>

          {/* Right arrow */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            <div className="w-8 h-0.5 bg-green-500/50" />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 
              border-t-4 border-t-transparent
              border-l-4 border-l-green-500/50
              border-b-4 border-b-transparent"
            />
          </div>
        </div>

        {/* Slide handle */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                  "w-12 h-12 rounded-full bg-green-500/20 border-2 border-green-500",
                  "flex items-center justify-center cursor-ew-resize",
                  "transition-all duration-150",
                  isActive && "bg-green-500/40 scale-110",
                )}
                style={{
                  left: `${clipLeft + clipWidth / 2}px`,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  onSlideStart?.(e.clientX)
                }}
              >
                <Maximize2 className="w-6 h-6 text-green-500 rotate-90" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white">
              <p className="text-sm">Slide Edit (U)</p>
              <p className="text-xs opacity-80">Drag to slide clip</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>
    )
  }

  return null
}
