"use client"

/**
 * Media Pool List Component for AI Director v3
 * Показывает файлы из медиапула для выбора
 */

import { Check, File, FileAudio, FileImage, FileVideo } from "lucide-react"
import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type MediaInfo, MediaType } from "@/domains/media-management/types"

export interface MediaPoolListProps {
  /** Файлы из медиапула */
  mediaPool: Map<string, MediaInfo>

  /** Выбранные ID файлов */
  selectedIds: Set<string>

  /** Callback для изменения выбора */
  onSelectionChange: (selectedIds: Set<string>) => void

  /** Disabled state */
  disabled?: boolean
}

const getMediaIcon = (type: MediaType) => {
  switch (type) {
    case MediaType.Video:
    case MediaType.VideoWithAudio:
      return <FileVideo className="h-4 w-4 text-blue-500" />
    case MediaType.Audio:
    case MediaType.Music:
    case MediaType.Voiceover:
    case MediaType.SFX:
    case MediaType.Ambient:
      return <FileAudio className="h-4 w-4 text-green-500" />
    case MediaType.StillImage:
    case MediaType.ImageSequence:
    case MediaType.Graphics:
      return <FileImage className="h-4 w-4 text-purple-500" />
    default:
      return <File className="h-4 w-4 text-muted-foreground" />
  }
}

const getMediaTypeBadge = (type: MediaType) => {
  const variants: Partial<Record<MediaType, "default" | "secondary" | "outline" | "destructive">> = {
    [MediaType.Video]: "default",
    [MediaType.VideoWithAudio]: "default",
    [MediaType.Audio]: "secondary",
    [MediaType.Music]: "secondary",
    [MediaType.Voiceover]: "secondary",
    [MediaType.SFX]: "secondary",
    [MediaType.Ambient]: "secondary",
    [MediaType.StillImage]: "outline",
    [MediaType.ImageSequence]: "outline",
    [MediaType.Graphics]: "outline",
    [MediaType.Unknown]: "outline",
  }
  return (
    <Badge variant={variants[type] ?? "outline"} className="text-xs">
      {type}
    </Badge>
  )
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return ""
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function MediaPoolList({ mediaPool, selectedIds, onSelectionChange, disabled = false }: MediaPoolListProps) {
  const mediaFiles = useMemo(() => Array.from(mediaPool.entries()), [mediaPool])

  const handleToggleFile = (fileId: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId)
    } else {
      newSelection.add(fileId)
    }
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    const allIds = new Set(mediaFiles.map(([id]) => id))
    onSelectionChange(allIds)
  }

  const handleDeselectAll = () => {
    onSelectionChange(new Set())
  }

  if (mediaFiles.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Нет файлов в медиапуле. Импортируйте файлы через Browser.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with selection controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedIds.size} из {mediaFiles.length} выбрано
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled || selectedIds.size === mediaFiles.length}
          >
            Выбрать все
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDeselectAll} disabled={disabled || selectedIds.size === 0}>
            Снять выбор
          </Button>
        </div>
      </div>

      {/* Files list */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {mediaFiles.map(([fileId, mediaInfo]) => {
            const isSelected = selectedIds.has(fileId)

            return (
              <Card
                key={fileId}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  isSelected ? "border-primary bg-primary/5" : ""
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !disabled && handleToggleFile(fileId)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      onCheckedChange={() => handleToggleFile(fileId)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    {/* Media icon */}
                    {getMediaIcon(mediaInfo.type as MediaType)}

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" title={mediaInfo.name}>
                        {mediaInfo.name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getMediaTypeBadge(mediaInfo.type as MediaType)}
                        {mediaInfo.duration && (
                          <span className="text-xs text-muted-foreground">{formatDuration(mediaInfo.duration)}</span>
                        )}
                      </div>
                    </div>

                    {/* Selected indicator */}
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
