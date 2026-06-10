/**
 * Компонент отображения информации о синхронизации
 */

import { AlertCircle, CheckCircle2, Clock, Music } from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@timeline-studio/ui/components/badge"
import type { MediaFile } from "@timeline-studio/core/types/media"
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
    <div className={cn("space-y-2", className)} data-oid="bvltsc2">
      {/* Статус синхронизации */}
      <div className="flex items-center gap-2" data-oid="wi3jxa0">
        {hasSyncOffsets ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" data-oid=".zufoeb" />
            <span className="text-sm font-medium" data-oid="-mqv1of">
              Синхронизировано
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-yellow-500" data-oid="q:9mlw." />
            <span className="text-sm font-medium" data-oid="_og3.0z">
              Не синхронизировано
            </span>
          </>
        )}
      </div>

      {/* Возможности синхронизации */}
      <div className="flex gap-2" data-oid="dvn6mgd">
        <Badge variant={canSyncByTimecode ? "secondary" : "outline"} className="text-xs" data-oid="_m8.zys">
          <Clock className="w-3 h-3 mr-1" data-oid="_1chiqt" />
          Таймкод {canSyncByTimecode ? "✓" : "✗"}
        </Badge>
        <Badge variant={canSyncByAudio ? "secondary" : "outline"} className="text-xs" data-oid="x99141t">
          <Music className="w-3 h-3 mr-1" data-oid="neie565" />
          Аудио {canSyncByAudio ? "✓" : "✗"}
        </Badge>
      </div>

      {/* Детальная информация */}
      {showDetails && hasSyncOffsets && (
        <div className="space-y-1 pt-2 border-t" data-oid="k0:hpc3">
          <div className="text-xs text-muted-foreground" data-oid="d3lqez1">
            Смещения:
          </div>
          {multicam.angles.map((angle, index) => {
            const offset = multicam.syncOffsets[index] || 0
            if (Math.abs(offset) < 0.01) return null

            return (
              <div key={angle.id} className="flex items-center justify-between text-xs" data-oid="1hmu43q">
                <span data-oid="l5f3f_8">{angle.name}:</span>
                <span className="font-mono" data-oid="l6fy.ew">
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
