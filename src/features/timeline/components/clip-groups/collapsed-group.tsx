import { FolderClosed, Lock } from "lucide-react"
import React from "react"

import { cn } from "@/lib/utils"

import type { ClipGroup } from "../../types/clip-groups"
import type { TimelineClip } from "@/features/timeline/types"

interface CollapsedGroupProps {
  group: ClipGroup
  clips: TimelineClip[]
  timeScale: number
  onToggleCollapse?: () => void
  onSelect?: () => void
  isSelected?: boolean
  className?: string
}

export function CollapsedGroup({
  group,
  clips,
  timeScale,
  onToggleCollapse,
  onSelect,
  isSelected,
  className,
}: CollapsedGroupProps) {
  // Вычисляем позицию и размер группы на основе клипов
  const groupBounds = React.useMemo(() => {
    if (clips.length === 0) return { left: 0, width: 100 }

    const startTimes = clips.map((c) => c.startTime)
    const endTimes = clips.map((c) => c.startTime + c.duration)

    const minStartTime = Math.min(...startTimes)
    const maxEndTime = Math.max(...endTimes)

    return {
      left: minStartTime * timeScale,
      width: (maxEndTime - minStartTime) * timeScale,
    }
  }, [clips, timeScale])

  return (
    <div
      className={cn(
        "absolute top-1 bottom-1",
        "border-2 rounded-md",
        "flex items-center gap-2 px-3",
        "cursor-pointer transition-all",
        "hover:shadow-md",
        isSelected && "ring-2 ring-primary ring-offset-1",
        group.locked && "opacity-60",
        className,
      )}
      style={{
        left: `${groupBounds.left}px`,
        width: `${groupBounds.width}px`,
        borderColor: group.color,
        backgroundColor: `${group.color}20`,
        color: group.color,
      }}
      onClick={onSelect}
      onDoubleClick={onToggleCollapse}
    >
      {/* Group icon */}
      <FolderClosed className="w-4 h-4 shrink-0" />

      {/* Group name */}
      <span className="text-sm font-medium truncate">{group.name}</span>

      {/* Clip count */}
      <span className="text-xs opacity-70">({clips.length})</span>

      {/* Lock indicator */}
      {group.locked && <Lock className="w-3 h-3 ml-auto shrink-0" />}
    </div>
  )
}
