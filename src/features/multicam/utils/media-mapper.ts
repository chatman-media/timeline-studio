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
  // Tauri uses string literal types which may differ in casing
  let type: MediaType
  const isVideo = item.media_type === "video" || item.media_type === ("Video" as any)
  const isAudio = item.media_type === "audio" || item.media_type === ("Audio" as any)
  const isImage = item.media_type === "image" || item.media_type === ("Image" as any)

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
