import { useMemo } from "react"

import { useEditModeContext } from "@/features/timeline/hooks/editing/use-edit-mode"
import type { TimelineClip, TimelineTrack } from "../../types"
import { EDIT_MODES } from "../../types/edit-modes"
import { RollEditHandle } from "../edit-tools/roll-edit-handle"

interface TrackRollHandlesProps {
  track: TimelineTrack
  timeScale: number
  onRollStart?: (leftClipId: string, rightClipId: string, mouseX: number) => void
}

export function TrackRollHandles({ track, timeScale, onRollStart }: TrackRollHandlesProps) {
  const { editMode } = useEditModeContext()

  // Find adjacent clip pairs
  const adjacentPairs = useMemo(() => {
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)
    const pairs: Array<{ left: TimelineClip; right: TimelineClip }> = []

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const leftClip = sortedClips[i]
      const rightClip = sortedClips[i + 1]

      // Check if clips are adjacent (small gap tolerance)
      const gap = Math.abs(rightClip.startTime - (leftClip.startTime + leftClip.duration))
      if (gap <= 0.001) {
        pairs.push({ left: leftClip, right: rightClip })
      }
    }

    return pairs
  }, [track.clips])

  // Only render in roll mode
  if (editMode !== EDIT_MODES.ROLL) {
    return null
  }

  return (
    <>
      {adjacentPairs.map(({ left, right }) => (
        <RollEditHandle
          key={`${left.id}-${right.id}`}
          leftClip={left}
          rightClip={right}
          isHovered={true} // For now, always show in roll mode
          isActive={false}
          timeScale={timeScale}
          onRollStart={(mouseX) => onRollStart?.(left.id, right.id, mouseX)}
          data-oid="kby::o0"
        />
      ))}
    </>
  )
}
