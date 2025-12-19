import { Film } from "lucide-react"
import { memo } from "react"
import type { MediaFile } from "@/domains/media-management"
import type { TimelineResource } from "@/domains/shared/types/resources"
import { formatDuration } from "@/lib/date"
import { cn, formatResolution } from "@/lib/utils"
import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

interface VideoOverlaysProps {
  file: MediaFile
  size: number
  isLoaded: boolean
  isMultipleStreams: boolean
  streamIndex?: number
  streamWidth?: number
  streamHeight?: number
  showFileName?: boolean
  isLastStream?: boolean
}

/**
 * Компонент для отображения всех накладок на видео
 * (иконка, длительность, разрешение, кнопки)
 */
export const VideoOverlays = memo(
  ({
    file,
    size,
    isLoaded,
    isMultipleStreams,
    streamIndex,
    streamWidth,
    streamHeight,
    showFileName,
    isLastStream,
  }: VideoOverlaysProps) => {
    const isNotFirstStream = isMultipleStreams && typeof streamIndex !== "undefined" && streamIndex !== 0

    return (
      <>
        {/* Продолжительность видео */}
        {file.duration && file.duration > 0 && !isNotFirstStream && (
          <div
            className={cn(
              "pointer-events-none absolute rounded-xs bg-black/60 text-xs leading-4",
              size > 100 ? "top-1 right-1 px-1 py-0.5" : "top-0.5 right-0.5 px-0.5 py-0",
            )}
            style={{
              fontSize: size > 100 ? "13px" : "11px",
              color: "#ffffff",
              zIndex: 20,
            }}
            data-oid="3pt_bku"
          >
            {formatDuration(file.duration, 0, true)}
          </div>
        )}

        {/* Иконка видео */}
        {!isNotFirstStream && (
          <div
            className={cn(
              "pointer-events-none absolute rounded-xs bg-black/60 p-0.5",
              size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5",
            )}
            style={{
              color: "#ffffff",
              zIndex: 10,
            }}
            data-oid="o:p5.9k"
          >
            <Film size={size > 100 ? 16 : 12} data-oid="foe07ij" />
          </div>
        )}

        {/* Кнопка избранного */}
        {!isNotFirstStream && <FavoriteButton file={file} size={size} type="media" data-oid="y37zvvb" />}

        {/* Разрешение видео */}
        {isLoaded && !isNotFirstStream && streamWidth && streamHeight && (
          <div
            className={`pointer-events-none absolute ${size > 100 ? "left-7" : "left-[22px]"} rounded-xs bg-black/60 text-xs leading-4 ${size > 100 ? "bottom-1" : "bottom-0.5"} ${size > 100 ? "px-1 py-0.5" : "px-0.5 py-0"}`}
            style={{
              fontSize: size > 100 ? "13px" : "11px",
              color: "#ffffff",
              zIndex: 20,
            }}
            data-oid="oesgjvl"
          >
            {formatResolution(streamWidth, streamHeight)}
          </div>
        )}

        {/* Имя файла */}
        {showFileName && !isNotFirstStream && (
          <div
            className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${size > 100 ? "left-1" : "left-0.5"} ${size > 100 ? "px-1 py-0.5" : "px-0.5 py-0"} line-clamp-1 rounded-xs bg-black/60 text-xs leading-4 ${isMultipleStreams ? "max-w-full" : "max-w-[60%]"}`}
            style={{
              fontSize: size > 100 ? "12px" : "11px",
              color: "#ffffff",
              zIndex: 10,
            }}
            data-oid="14q-y.c"
          >
            {file.name}
          </div>
        )}

        {/* Кнопка добавления */}
        {isLoaded && isLastStream && (
          <AddMediaButton
            resource={
              {
                id: file.id,
                type: "media",
                name: file.name,
                file,
              } as TimelineResource
            }
            size={size}
            type="media"
            data-oid="0b7:ag0"
          />
        )}
      </>
    )
  },
)

VideoOverlays.displayName = "VideoOverlays"
