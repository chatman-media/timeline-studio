import { useEffect } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"
import type { TimelineClip } from "@/features/timeline/types"
import { useTimeline } from "../state/use-timeline"
import { useClipGroups } from "./use-clip-groups"

export function useGroupHotkeys() {
  const { createGroup, ungroupClips, getGroupByClip } = useClipGroups()
  const { project, selectedClipIds } = useTimeline()

  // Helper function to get selected clips
  const getSelectedClips = (): TimelineClip[] => {
    if (!project) return []

    const selectedClips: TimelineClip[] = []

    // Check global tracks
    project.globalTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (selectedClipIds.includes(clip.id)) {
          selectedClips.push(clip)
        }
      })
    })

    // Check section tracks
    project.sections.forEach((section) => {
      section.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (selectedClipIds.includes(clip.id)) {
            selectedClips.push(clip)
          }
        })
      })
    })

    return selectedClips
  }

  // Register keyboard shortcuts for grouping operations
  useEffect(() => {
    const shortcuts = [
      {
        id: "group-clips",
        action: () => {
          const selectedClips = getSelectedClips()
          if (selectedClips.length >= 2) {
            createGroup(selectedClips)
          }
        },
      },
      {
        id: "ungroup-clips",
        action: () => {
          const selectedClips = getSelectedClips()
          if (selectedClips.length > 0) {
            // Find the group of the first selected clip
            const group = getGroupByClip(selectedClips[0].id)
            if (group) {
              ungroupClips(group.id)
            }
          }
        },
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [project, selectedClipIds, createGroup, ungroupClips, getGroupByClip])
}
