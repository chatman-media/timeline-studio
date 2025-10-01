/**
 * Media File Adapter
 *
 * Адаптер для конвертации между старым MediaFile (features) и новым (domains)
 */

import type { MediaFile as FeatureMediaFile } from "@/features/media/types/media"
import { type MediaFile as DomainMediaFile, MediaType } from "../types/media"

/**
 * Конвертирует старый MediaFile в новый формат
 */
export function featureToDomainMediaFile(file: FeatureMediaFile): DomainMediaFile {
  // Определяем тип медиа на основе boolean флагов
  let type = MediaType.Unknown

  if (file.isVideo) {
    // Проверяем есть ли аудио в видео через probeData
    const hasAudio = file.probeData?.streams?.some((stream) => stream.codec_type === "audio")
    type = hasAudio ? MediaType.VideoWithAudio : MediaType.Video
  } else if (file.isAudio) {
    type = MediaType.Audio
  } else if (file.isImage) {
    type = MediaType.StillImage
  }

  return {
    id: file.id,
    name: file.name,
    path: file.path,
    type,
    duration: file.duration,
    size: file.size,
    createdAt: file.createdAt ? new Date(file.createdAt) : undefined,
    updatedAt: file.updatedAt ? new Date(file.updatedAt) : undefined,

    // Video properties
    width: file.probeData?.streams?.[0]?.width,
    height: file.probeData?.streams?.[0]?.height,
    fps: file.probeData?.streams?.[0]?.r_frame_rate ? parseFps(file.probeData.streams[0].r_frame_rate) : undefined,

    // Timeline integration
    isAddedToTimeline: file.isAddedToTimeline,
    isIncluded: file.isIncluded,
    isUnavailable: file.isUnavailable,
    lastCheckedAt: file.lastCheckedAt,
    isLoadingMetadata: file.isLoadingMetadata,
    source: file.source || "browser",

    // Proxy
    proxy: file.proxy
      ? {
          path: file.proxy.path,
          width: file.proxy.width,
          height: file.proxy.height,
          bitrate: file.proxy.bitrate,
          codec: MediaCodec.Unknown,
        }
      : undefined,

    // Thumbnail
    thumbnailPath: file.thumbnailPath,

    // Technical metadata
    probeData: file.probeData,
  }
}

/**
 * Конвертирует новый MediaFile в старый формат
 */
export function domainToFeatureMediaFile(file: DomainMediaFile): FeatureMediaFile {
  return {
    id: file.id,
    name: file.name,
    path: file.path,

    // Boolean флаги на основе enum
    isVideo: file.type === MediaType.Video || file.type === MediaType.VideoWithAudio,
    isAudio: [MediaType.Audio, MediaType.Music, MediaType.Voiceover, MediaType.SFX, MediaType.Ambient].includes(
      file.type,
    ),
    isImage: file.type === MediaType.StillImage || file.type === MediaType.ImageSequence,

    duration: file.duration,
    size: file.size,
    createdAt: file.createdAt?.toISOString(),
    updatedAt: file.updatedAt?.toISOString(),

    // Timeline integration
    isAddedToTimeline: file.isAddedToTimeline,
    isIncluded: file.isIncluded,
    isUnavailable: file.isUnavailable,
    lastCheckedAt: file.lastCheckedAt,
    isLoadingMetadata: file.isLoadingMetadata,
    source: file.source === "import" ? "browser" : file.source,

    // Proxy
    proxy: file.proxy
      ? {
          path: file.proxy.path,
          width: file.proxy.width,
          height: file.proxy.height,
          bitrate: file.proxy.bitrate,
        }
      : undefined,

    // Thumbnail
    thumbnailPath: file.thumbnailPath,

    // Technical metadata
    probeData: file.probeData,
  }
}

/**
 * Парсит FPS из строки формата "30/1" или "30"
 */
function parseFps(fpsString: string): number {
  if (fpsString.includes("/")) {
    const [num, den] = fpsString.split("/").map(Number)
    return num / den
  }
  return Number(fpsString)
}

// Импортируем MediaCodec для proxy
import { MediaCodec } from "../types/media"
