import { Film } from "lucide-react"
import { memo } from "react"
import type { MediaFile } from "@/features/media/types/media"
import type { TimelineResource } from "@/features/resources/types"
import { formatDuration } from "@/lib/date"
import { cn, formatResolution } from "@/lib/utils"
import { ApplyButton } from "../layout"
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
  onApply?: (resource: TimelineResource, type: string) => Promise<void>
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
    onApply,
    isLastStream,
  }: VideoOverlaysProps) => {
    const isNotFirstStream = isMultipleStreams && typeof streamIndex !== "undefined" && streamIndex !== 0

    return (
      <>
        {/* Продолжительность видео */}
        {file.duration && file.duration > 0 && !isNotFirstStream && (
          <div
            className={cn(
              "pointer-events-none absolute rounded-xs bg-black/60 text-xs leading-[16px]",
              size > 100 ? "top-1 right-1 px-[4px] py-[2px]" : "top-0.5 right-0.5 px-[2px] py-0",
            )}
            style={{
              fontSize: size > 100 ? "13px" : "11px",
              color: "#ffffff",
              zIndex: 20,
            }}
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
          >
            <Film size={size > 100 ? 16 : 12} />
          </div>
        )}

        {/* Кнопка избранного */}
        {!isNotFirstStream && <FavoriteButton file={file} size={size} type="media" />}

        {/* Разрешение видео */}
        {isLoaded && !isNotFirstStream && streamWidth && streamHeight && (
          <div
            className={`pointer-events-none absolute ${size > 100 ? "left-[28px]" : "left-[22px]"} rounded-xs bg-black/60 text-xs leading-[16px] ${size > 100 ? "bottom-1" : "bottom-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"}`}
            style={{
              fontSize: size > 100 ? "13px" : "11px",
              color: "#ffffff",
              zIndex: 20,
            }}
          >
            {formatResolution(streamWidth, streamHeight)}
          </div>
        )}

        {/* Имя файла */}
        {showFileName && !isNotFirstStream && (
          <div
            className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${size > 100 ? "left-1" : "left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} line-clamp-1 rounded-xs bg-black/60 text-xs leading-[16px] ${isMultipleStreams ? "max-w-[100%]" : "max-w-[60%]"}`}
            style={{
              fontSize: size > 100 ? "12px" : "11px",
              color: "#ffffff",
              zIndex: 10,
            }}
          >
            {file.name}
          </div>
        )}

        {/* Кнопка Apply */}
        {onApply && (
          <ApplyButton
            resource={{ id: file.id, type: "media" } as TimelineResource}
            size={size}
            type="media"
            onApply={onApply}
          />
        )}

        {/* Кнопка добавления */}
        {isLoaded && isLastStream && (
          <AddMediaButton
            resource={{ id: file.id, type: "media", name: file.name, file } as TimelineResource}
            size={size}
            type="media"
          />
        )}
      </>
    )
  },
)

VideoOverlays.displayName = "VideoOverlays"
