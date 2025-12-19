import type { TimelineClip } from "@/features/timeline/types"
import { cn } from "@/lib/utils"
import { getCutType } from "../../types/jl-cuts"

interface JLCutIndicatorProps {
  videoClip?: TimelineClip
  audioClip: TimelineClip
  pixelsPerSecond: number
  className?: string
}

export function JLCutIndicator({ audioClip, pixelsPerSecond, className }: JLCutIndicatorProps) {
  const audioOffset = audioClip.audioOffset || 0

  if (audioOffset === 0) return null

  const cutType = getCutType(audioOffset)
  const offsetPixels = Math.abs(audioOffset) * pixelsPerSecond

  // Для J-Cut аудио начинается раньше видео
  // Для L-Cut аудио заканчивается позже видео
  const isJCut = cutType === "j-cut"

  return (
    <div
      className={cn("absolute top-0 h-full pointer-events-none", className)}
      style={{
        width: `${offsetPixels}px`,
        ...(isJCut
          ? {
              right: "100%",
              borderRight: "2px dashed rgba(59, 130, 246, 0.5)",
            }
          : {
              left: "100%",
              borderLeft: "2px dashed rgba(239, 68, 68, 0.5)",
            }),
      }}
      data-oid="4tf-c23"
    >
      {/* Визуальный индикатор типа cut */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-xs font-medium px-1 py-0.5 rounded",
          isJCut ? "bg-blue-500/20 text-blue-500" : "bg-red-500/20 text-red-500",
          isJCut ? "right-1" : "left-1",
        )}
        data-oid="__c9z37"
      >
        {isJCut ? "J" : "L"}
      </div>

      {/* Линия связи между клипами */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }} data-oid="ri-aggg">
        <defs data-oid="2fpe0-6">
          <pattern id={`diagonal-${cutType}`} patternUnits="userSpaceOnUse" width="8" height="8" data-oid="5i-h4g-">
            <path
              d="M0,8 L8,0"
              stroke={isJCut ? "rgba(59, 130, 246, 0.3)" : "rgba(239, 68, 68, 0.3)"}
              strokeWidth="1"
              data-oid="gs59h48"
            />
          </pattern>
        </defs>

        <rect
          x={isJCut ? 0 : -offsetPixels}
          y="0"
          width={offsetPixels}
          height="100%"
          fill={`url(#diagonal-${cutType})`}
          data-oid="33jnbhu"
        />
      </svg>
    </div>
  )
}
