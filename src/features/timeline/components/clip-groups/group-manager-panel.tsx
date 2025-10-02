import { Edit2, FolderClosed, FolderOpen, Lock, Palette, Plus, Trash2, Unlock, Users } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { useClipGroups } from "../../hooks/use-clip-groups"
import { useTimeline } from "../../hooks/use-timeline"
import type { ClipGroup, GroupColorKey } from "../../types/clip-groups"
import { GroupColors } from "../../types/clip-groups"
import type { TimelineClip } from "../../types/timeline"

export function GroupManagerPanel() {
  const { groups, createGroup, renameGroup, setGroupColor, toggleCollapse, lockGroup, ungroupClips } = useClipGroups()
  const { project, selectedClipIds } = useTimeline()
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const selectedClipCount = selectedClipIds.length

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

  const handleStartRename = (group: ClipGroup) => {
    setEditingGroupId(group.id)
    setEditingName(group.name)
  }

  const handleFinishRename = (groupId: string) => {
    if (editingName.trim()) {
      renameGroup(groupId, editingName.trim())
    }
    setEditingGroupId(null)
    setEditingName("")
  }

  const handleColorChange = (groupId: string, color: string) => {
    setGroupColor(groupId, color)
  }

  const colorOptions = Object.entries(GroupColors as Record<GroupColorKey, string>)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          Clip Groups
        </h3>
        {selectedClipCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            disabled={selectedClipCount < 2}
            onClick={handleCreateGroup}
          >
            <Plus className="w-3 h-3 mr-1" />
            Group Selected ({selectedClipCount})
          </Button>
        )}
      </div>

      {/* Groups list */}
      <div className="space-y-2">
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No groups created yet</p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={cn("flex items-center gap-2 p-2 rounded-md border", "hover:bg-accent/50 transition-colors")}
              style={{
                borderColor: `${group.color}40`,
                backgroundColor: `${group.color}10`,
              }}
            >
              {/* Collapse toggle */}
              <button onClick={() => toggleCollapse(group.id)} className="p-1 hover:bg-white/20 rounded">
                {group.collapsed ? (
                  <FolderClosed className="w-4 h-4" style={{ color: group.color }} />
                ) : (
                  <FolderOpen className="w-4 h-4" style={{ color: group.color }} />
                )}
              </button>

              {/* Group name */}
              <div className="flex-1 min-w-0">
                {editingGroupId === group.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleFinishRename(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFinishRename(group.id)
                      } else if (e.key === "Escape") {
                        setEditingGroupId(null)
                      }
                    }}
                    className="h-6 text-xs"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{group.name}</span>
                    <span className="text-xs text-muted-foreground">({group.clips.length} clips)</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Edit name */}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleStartRename(group)}>
                  <Edit2 className="w-3 h-3" />
                </Button>

                {/* Color picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Palette className="w-3 h-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map(([key, color]) => (
                        <button
                          key={key}
                          className={cn(
                            "w-6 h-6 rounded-md border-2",
                            group.color === color ? "border-primary" : "border-transparent",
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(group.id, color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Lock toggle */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => lockGroup(group.id, !group.locked)}
                >
                  {group.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>

                {/* Ungroup */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:text-destructive"
                  onClick={() => ungroupClips(group.id)}
                  disabled={group.locked}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
