import { Button } from "@timeline-studio/ui/components/button"
import { Input } from "@timeline-studio/ui/components/input"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { Edit2, FolderClosed, FolderOpen, Lock, Palette, Plus, Trash2, Unlock, Users } from "lucide-react"
import { useState } from "react"
import type { TimelineClip } from "@/features/timeline/types"
import { cn } from "@/lib/utils"
import { useClipGroups } from "../../hooks/clips/use-clip-groups"
import { useTimeline } from "../../hooks/state/use-timeline"
import type { ClipGroup, GroupColorKey } from "../../types/clip-groups"
import { GroupColors } from "../../types/clip-groups"

export function GroupManagerPanel() {
  const { project, selectedClipIds } = useTimeline()
  const { groups, createGroup, renameGroup, setGroupColor, toggleCollapse, lockGroup, ungroupClips } = useClipGroups()
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const selectedClipCount = selectedClipIds?.length || 0

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
    <div className="p-4 space-y-4" data-oid="nb:z4w9">
      {/* Header */}
      <div className="flex items-center justify-between" data-oid="871o8sa">
        <h3 className="text-sm font-medium flex items-center gap-2" data-oid="t4sjrlg">
          <Users className="w-4 h-4" data-oid="j1asnrl" />
          Clip Groups
        </h3>
        {selectedClipCount > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            disabled={selectedClipCount < 2}
            onClick={handleCreateGroup}
            data-oid="nj8isbw"
          >
            <Plus className="w-3 h-3 mr-1" data-oid="qitcf2v" />
            Group Selected ({selectedClipCount})
          </Button>
        )}
      </div>

      {/* Groups list */}
      <div className="space-y-2" data-oid="la1kmh8">
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4" data-oid="wmcrzye">
            No groups created yet
          </p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={cn("flex items-center gap-2 p-2 rounded-md border", "hover:bg-accent/50 transition-colors")}
              style={{
                borderColor: `${group.color}40`,
                backgroundColor: `${group.color}10`,
              }}
              data-oid="m7ysdwv"
            >
              {/* Collapse toggle */}
              <button
                onClick={() => toggleCollapse(group.id)}
                className="p-1 hover:bg-white/20 rounded"
                data-oid="8fazw7-"
              >
                {group.collapsed ? (
                  <FolderClosed className="w-4 h-4" style={{ color: group.color }} data-oid="3pkiv-a" />
                ) : (
                  <FolderOpen className="w-4 h-4" style={{ color: group.color }} data-oid="qw1sl0y" />
                )}
              </button>

              {/* Group name */}
              <div className="flex-1 min-w-0" data-oid="wksq.5v">
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
                    data-oid="agmrt_8"
                  />
                ) : (
                  <div className="flex items-center gap-2" data-oid="201g1hq">
                    <span className="text-xs font-medium truncate" data-oid="65swe3a">
                      {group.name}
                    </span>
                    <span className="text-xs text-muted-foreground" data-oid="8w2:2c6">
                      ({group.clips.length} clips)
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1" data-oid="4emkbgp">
                {/* Edit name */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => handleStartRename(group)}
                  data-oid="m:92gpc"
                >
                  <Edit2 className="w-3 h-3" data-oid="loxax2w" />
                </Button>

                {/* Color picker */}
                <Popover data-oid="0.8:vem">
                  <PopoverTrigger asChild data-oid="lv4ex:g">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" data-oid="b9g_7_3">
                      <Palette className="w-3 h-3" data-oid="j22_61n" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" data-oid="kwqwbmw">
                    <div className="grid grid-cols-4 gap-2" data-oid="gp1pgev">
                      {colorOptions.map(([key, color]) => (
                        <button
                          key={key}
                          className={cn(
                            "w-6 h-6 rounded-md border-2",
                            group.color === color ? "border-primary" : "border-transparent",
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => handleColorChange(group.id, color)}
                          data-oid="b8ls4aa"
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
                  data-oid="imzvmop"
                >
                  {group.locked ? (
                    <Lock className="w-3 h-3" data-oid="ey3rzz5" />
                  ) : (
                    <Unlock className="w-3 h-3" data-oid=":sbnq8:" />
                  )}
                </Button>

                {/* Ungroup */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:text-destructive"
                  onClick={() => ungroupClips(group.id)}
                  disabled={group.locked}
                  data-oid="hfg:hly"
                >
                  <Trash2 className="w-3 h-3" data-oid="5k:-et4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
