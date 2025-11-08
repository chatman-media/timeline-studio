/**
 * Утилиты для преобразования типов медиафайлов
 */

import { type MediaFile, MediaType } from "@/features/media/types/media"
import type { MediaItem } from "@/types/generated/tauri-bindings"

/**
 * Преобразует MediaItem из Tauri в MediaFile
 */
export function mediaItemToMediaFile(item: MediaItem): MediaFile {
  // Map Tauri MediaType to our MediaType enum
  // item.media_type is already a string that we can use directly
  let type: MediaType
  const mediaTypeStr = (item.media_type as any as string).toLowerCase()
  const isVideo = mediaTypeStr.includes("video")
  const isAudio = mediaTypeStr === "audio"
  const isImage = mediaTypeStr.includes("image")

  if (isVideo) {
    type = MediaType.Video
  } else if (isAudio) {
    type = MediaType.Audio
  } else if (isImage) {
    type = MediaType.StillImage
  } else {
    type = MediaType.Unknown
  }

  return {
    id: item.id,
    name: item.name,
    path: item.path,
    type,
    size: 0, // MediaItem не содержит размер
    isVideo,
    isAudio,
    isImage,
    duration: item.duration ?? undefined,
    width: undefined, // MediaItem не содержит width
    height: undefined, // MediaItem не содержит height
    fps: undefined, // MediaItem не содержит fps
    bitrate: undefined,
    probeData: undefined, // MediaItem не содержит probe_data
    thumbnailPath: item.thumbnail ?? undefined,
    createdAt: new Date(), // MediaItem не содержит created_at
  }
}

/**
 * Преобразует массив MediaItem в массив MediaFile
 */
export function mediaItemsToMediaFiles(items: MediaItem[]): MediaFile[] {
  return items.map(mediaItemToMediaFile)
}
