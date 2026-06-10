import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { Gauge } from "lucide-react"
import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import { cn } from "@/lib/utils"
import type { TimelineClip } from "../../types"
import { EDIT_MODES } from "../../types/edit-modes"

interface RateStretchHandleProps {
  clip: TimelineClip
  isHovered: boolean
  isActive: boolean
  timeScale: number
  onRateStretchStart?: (edge: "start" | "end", mouseX: number) => void
}

export function RateStretchHandle({
  clip,
  isHovered,
  isActive,
  timeScale,
  onRateStretchStart,
}: RateStretchHandleProps) {
  const { editMode } = useEditModeContext()

  // Only show handles in rate stretch mode when hovering
  if (!isHovered || editMode !== EDIT_MODES.RATE) {
    return null
  }

  const clipWidth = clip.duration * timeScale
  const clipLeft = clip.startTime * timeScale
  const currentRate = clip.playbackRate || 1.0

  return (
    <>
      {/* Rate indicator */}
      <div
        className="absolute top-2 right-2 pointer-events-none"
        style={{
          left: `${clipLeft}px`,
          width: `${clipWidth}px`,
        }}
        data-oid="-mkuzbs"
      >
        <div className="absolute right-2 top-2 bg-gray-900/80 rounded px-2 py-1" data-oid="2fm7t3m">
          <span className="text-xs font-mono text-white" data-oid="2.3mnuj">
            {(currentRate * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Start handle */}
      <TooltipProvider delayDuration={0} data-oid="-kqt2f5">
        <Tooltip data-oid="fcvq44t">
          <TooltipTrigger asChild data-oid="beguvhb">
            <div
              className={cn(
                "absolute top-0 bottom-0 w-3 -translate-x-1/2",
                "bg-orange-500/20 border-l-2 border-orange-500",
                "cursor-ew-resize transition-all duration-150",
                isActive && "bg-orange-500/40",
              )}
              style={{
                left: `${clipLeft}px`,
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                onRateStretchStart?.("start", e.clientX)
              }}
              data-oid="ob:5.--"
            >
              <Gauge className="w-3 h-3 text-orange-500 absolute top-1 left-1/2 -translate-x-1/2" data-oid="vh5gzz6" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white" data-oid=".zrmyda">
            <p className="text-sm" data-oid="m0jzk8r">
              Rate Stretch (R)
            </p>
            <p className="text-xs opacity-80" data-oid=".bb5yas">
              Drag to change speed
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* End handle */}
      <TooltipProvider delayDuration={0} data-oid="uj_-hxy">
        <Tooltip data-oid="vbqpdh8">
          <TooltipTrigger asChild data-oid="7g7jmvx">
            <div
              className={cn(
                "absolute top-0 bottom-0 w-3 translate-x-1/2",
                "bg-orange-500/20 border-r-2 border-orange-500",
                "cursor-ew-resize transition-all duration-150",
                isActive && "bg-orange-500/40",
              )}
              style={{
                left: `${clipLeft + clipWidth}px`,
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
                onRateStretchStart?.("end", e.clientX)
              }}
              data-oid="3jb0xuo"
            >
              <Gauge className="w-3 h-3 text-orange-500 absolute top-1 left-1/2 -translate-x-1/2" data-oid="xo7x_zc" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white" data-oid="nau7xd2">
            <p className="text-sm" data-oid="-mwcxt-">
              Rate Stretch (R)
            </p>
            <p className="text-xs opacity-80" data-oid="23nz.eb">
              Drag to change speed
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Visual speed indication */}
      {currentRate !== 1.0 && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: `${clipLeft}px`,
            width: `${clipWidth}px`,
          }}
          data-oid=":0w0du3"
        >
          <div
            className={cn(
              "absolute inset-0 border-2 rounded",
              currentRate > 1.0 ? "border-orange-500/30" : "border-blue-500/30",
            )}
            data-oid="h85.-rr"
          />
        </div>
      )}
    </>
  )
}
