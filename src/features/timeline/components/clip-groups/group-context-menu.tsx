import { Edit2, FolderClosed, FolderOpen, Layers, Lock, Palette, Ungroup, Unlock, Users } from "lucide-react"
import type React from "react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

import { useClipGroups } from "../../hooks/use-clip-groups"
import { useTimeline } from "../../hooks/use-timeline"
import { type GroupColorKey, GroupColors } from "../../types/clip-groups"

import type { TimelineClip } from "../../types/timeline"

interface GroupContextMenuProps {
  children: React.ReactNode
}

export function GroupContextMenu({ children }: GroupContextMenuProps) {
  const { project, selectedClipIds } = useTimeline()
  const { createGroup, ungroupClips, getGroupByClip, toggleCollapse, lockGroup, setGroupColor, createNestedSequence } =
    useClipGroups()

  const selectedClipCount = selectedClipIds.length
  const firstSelectedClipId = selectedClipIds[0]
  const group = firstSelectedClipId ? getGroupByClip(firstSelectedClipId) : null

  const handleCreateGroup = () => {
    if (!project || selectedClipCount < 2) return

    // Получаем выбранные клипы
    const selectedClips: TimelineClip[] = []

    project.globalTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (selectedClipIds.includes(clip.id)) {
          selectedClips.push(clip)
        }
      })
    })

    project.sections?.forEach((section) => {
      section.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (selectedClipIds.includes(clip.id)) {
            selectedClips.push(clip)
          }
        })
      })
    })

    if (selectedClips.length >= 2) {
      createGroup(selectedClips)
    }
  }

  const handleUngroup = () => {
    if (group) {
      ungroupClips(group.id)
    }
  }

  const handleToggleLock = () => {
    if (group) {
      lockGroup(group.id, !group.locked)
    }
  }

  const handleToggleCollapse = () => {
    if (group) {
      toggleCollapse(group.id)
    }
  }

  const handleColorChange = (color: string) => {
    if (group) {
      setGroupColor(group.id, color)
    }
  }

  const handleCreateNested = () => {
    if (!project || selectedClipCount < 1) return

    // Получаем выбранные клипы
    const selectedClips: TimelineClip[] = []

    project.globalTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (selectedClipIds.includes(clip.id)) {
          selectedClips.push(clip)
        }
      })
    })

    project.sections?.forEach((section) => {
      section.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (selectedClipIds.includes(clip.id)) {
            selectedClips.push(clip)
          }
        })
      })
    })

    if (selectedClips.length >= 1) {
      createNestedSequence(selectedClips)
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {/* Group operations */}
        {selectedClipCount >= 2 && !group && (
          <ContextMenuItem onClick={handleCreateGroup}>
            <Users className="mr-2 h-4 w-4" />
            Group Selected Clips
          </ContextMenuItem>
        )}

        {group && (
          <>
            <ContextMenuItem onClick={handleUngroup}>
              <Ungroup className="mr-2 h-4 w-4" />
              Ungroup
            </ContextMenuItem>

            <ContextMenuItem onClick={handleToggleCollapse}>
              {group.collapsed ? (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Expand Group
                </>
              ) : (
                <>
                  <FolderClosed className="mr-2 h-4 w-4" />
                  Collapse Group
                </>
              )}
            </ContextMenuItem>

            <ContextMenuItem onClick={handleToggleLock}>
              {group.locked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Unlock Group
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Lock Group
                </>
              )}
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Palette className="mr-2 h-4 w-4" />
                Group Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {Object.entries(GroupColors as Record<GroupColorKey, string>).map(([key, color]) => (
                  <ContextMenuItem key={key} onClick={() => handleColorChange(color)}>
                    <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: color }} />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem>
              <Edit2 className="mr-2 h-4 w-4" />
              Rename Group
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator />

        {/* Nested sequence */}
        {selectedClipCount >= 1 && (
          <ContextMenuItem onClick={handleCreateNested}>
            <Layers className="mr-2 h-4 w-4" />
            Create Nested Sequence
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
