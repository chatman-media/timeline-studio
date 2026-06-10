import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@timeline-studio/ui/components/context-menu"
import { Edit2, FolderClosed, FolderOpen, Layers, Lock, Palette, Ungroup, Unlock, Users } from "lucide-react"
import type React from "react"
import type { TimelineClip } from "@/features/timeline/types"
import { useClipGroups } from "../../hooks/clips/use-clip-groups"
import { useTimeline } from "../../hooks/state/use-timeline"
import { type GroupColorKey, GroupColors } from "../../types/clip-groups"

interface GroupContextMenuProps {
  children: React.ReactNode
}

export function GroupContextMenu({ children }: GroupContextMenuProps) {
  const { project, selectedClipIds } = useTimeline()
  const { createGroup, ungroupClips, getGroupByClip, toggleCollapse, lockGroup, setGroupColor, createNestedSequence } =
    useClipGroups()

  const selectedClipCount = selectedClipIds?.length || 0
  const firstSelectedClipId = selectedClipIds?.[0]
  const group = firstSelectedClipId ? getGroupByClip(firstSelectedClipId) : null

  const handleCreateGroup = () => {
    if (!project || selectedClipCount < 2) return

    // Получаем выбранные клипы
    const selectedClips: (typeof project.globalTracks)[0]["clips"] = []

    project.globalTracks?.forEach((track) => {
      track.clips?.forEach((clip) => {
        if (selectedClipIds?.includes(clip.id)) {
          selectedClips.push(clip)
        }
      })
    })

    project.sections?.forEach((section) => {
      section.tracks?.forEach((track) => {
        track.clips?.forEach((clip) => {
          if (selectedClipIds?.includes(clip.id)) {
            selectedClips.push(clip)
          }
        })
      })
    })

    if (selectedClips.length >= 2) {
      createGroup(selectedClips as unknown as TimelineClip[])
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
    const selectedClips: (typeof project.globalTracks)[0]["clips"] = []

    project.globalTracks?.forEach((track) => {
      track.clips?.forEach((clip) => {
        if (selectedClipIds?.includes(clip.id)) {
          selectedClips.push(clip)
        }
      })
    })

    project.sections?.forEach((section) => {
      section.tracks?.forEach((track) => {
        track.clips?.forEach((clip) => {
          if (selectedClipIds?.includes(clip.id)) {
            selectedClips.push(clip)
          }
        })
      })
    })

    if (selectedClips.length >= 1) {
      createNestedSequence(selectedClips as unknown as TimelineClip[])
    }
  }

  return (
    <ContextMenu data-oid="b_0xhr7">
      <ContextMenuTrigger asChild data-oid="flp7xks">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64" data-oid="ao1m:j5">
        {/* Group operations */}
        {selectedClipCount >= 2 && !group && (
          <ContextMenuItem onClick={handleCreateGroup} data-oid="qs4rv_3">
            <Users className="mr-2 h-4 w-4" data-oid="x7h5:oc" />
            Group Selected Clips
          </ContextMenuItem>
        )}

        {group && (
          <>
            <ContextMenuItem onClick={handleUngroup} data-oid="2d7q.6s">
              <Ungroup className="mr-2 h-4 w-4" data-oid="rq4pwop" />
              Ungroup
            </ContextMenuItem>

            <ContextMenuItem onClick={handleToggleCollapse} data-oid="y788ztl">
              {group.collapsed ? (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" data-oid="4b.g65s" />
                  Expand Group
                </>
              ) : (
                <>
                  <FolderClosed className="mr-2 h-4 w-4" data-oid="dftf1yt" />
                  Collapse Group
                </>
              )}
            </ContextMenuItem>

            <ContextMenuItem onClick={handleToggleLock} data-oid="yle.g7i">
              {group.locked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" data-oid="6li5p.h" />
                  Unlock Group
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" data-oid="4.oumw7" />
                  Lock Group
                </>
              )}
            </ContextMenuItem>

            <ContextMenuSeparator data-oid="f4rrzdt" />

            <ContextMenuSub data-oid="axx:jup">
              <ContextMenuSubTrigger data-oid="i-g82s.">
                <Palette className="mr-2 h-4 w-4" data-oid="nq:.592" />
                Group Color
              </ContextMenuSubTrigger>
              <ContextMenuSubContent data-oid="sp9bx9m">
                {Object.entries(GroupColors as Record<GroupColorKey, string>).map(([key, color]) => (
                  <ContextMenuItem key={key} onClick={() => handleColorChange(color)} data-oid="t2mljl-">
                    <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: color }} data-oid="uvdwokx" />
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem data-oid="y51vvd-">
              <Edit2 className="mr-2 h-4 w-4" data-oid="366wnh1" />
              Rename Group
            </ContextMenuItem>
          </>
        )}

        <ContextMenuSeparator data-oid="9m6g.nu" />

        {/* Nested sequence */}
        {selectedClipCount >= 1 && (
          <ContextMenuItem onClick={handleCreateNested} data-oid="c_bjv6g">
            <Layers className="mr-2 h-4 w-4" data-oid="l6:rfqe" />
            Create Nested Sequence
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
