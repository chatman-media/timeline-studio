/**
 * Компонент отображения информации о синхронизации
 */

import { AlertCircle, CheckCircle2, Clock, Music } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import type { MediaFile } from "@/domains/media-management"
import { cn } from "@/lib/utils"

import { useMulticam } from "../hooks/use-multicam"
import { supportsTimecodeSync } from "../services/timecode-sync"

interface SyncInfoProps {
  baseClipId: string
  mediaFiles: MediaFile[]
  className?: string
  showDetails?: boolean
}

export function SyncInfo({ baseClipId, mediaFiles, className, showDetails = true }: SyncInfoProps) {
  const multicam = useMulticam(baseClipId)

  // Анализируем возможности синхронизации для каждого угла
  const syncCapabilities = useMemo(() => {
    return multicam.angles.map((angle) => {
      const mediaFile = mediaFiles.find((m) => m.id === angle.clip.mediaId)
      if (!mediaFile) return { angle, hasTimecode: false, hasAudio: false }

      const hasTimecode = supportsTimecodeSync(mediaFile)
      const hasAudio = mediaFile.probeData?.streams.some((s) => s.codec_type === "audio") || false

      return { angle, hasTimecode, hasAudio }
    })
  }, [multicam.angles, mediaFiles])

  // Проверяем общие возможности синхронизации
  const canSyncByTimecode = syncCapabilities.filter((c) => c.hasTimecode).length >= 2
  const canSyncByAudio = syncCapabilities.filter((c) => c.hasAudio).length >= 2
  const hasSyncOffsets = multicam.syncOffsets.some((offset) => Math.abs(offset) > 0.01)

  if (!multicam.hasMulticamSupport) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Статус синхронизации */}
      <div className="flex items-center gap-2">
        {hasSyncOffsets ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Синхронизировано</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Не синхронизировано</span>
          </>
        )}
      </div>

      {/* Возможности синхронизации */}
      <div className="flex gap-2">
        <Badge variant={canSyncByTimecode ? "secondary" : "outline"} className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Таймкод {canSyncByTimecode ? "✓" : "✗"}
        </Badge>
        <Badge variant={canSyncByAudio ? "secondary" : "outline"} className="text-xs">
          <Music className="w-3 h-3 mr-1" />
          Аудио {canSyncByAudio ? "✓" : "✗"}
        </Badge>
      </div>

      {/* Детальная информация */}
      {showDetails && hasSyncOffsets && (
        <div className="space-y-1 pt-2 border-t">
          <div className="text-xs text-muted-foreground">Смещения:</div>
          {multicam.angles.map((angle, index) => {
            const offset = multicam.syncOffsets[index] || 0
            if (Math.abs(offset) < 0.01) return null

            return (
              <div key={angle.id} className="flex items-center justify-between text-xs">
                <span>{angle.name}:</span>
                <span className="font-mono">
                  {offset > 0 ? "+" : ""}
                  {offset.toFixed(3)}s
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
