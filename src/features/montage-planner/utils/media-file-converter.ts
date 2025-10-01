/**
 * Media File Converter for Montage Planner
 *
 * Конвертирует MediaFile из features в формат для AI Services domain
 */

import type { MediaFile as DomainMediaFile } from "@/domains/ai-services/types/montage-planner"
import { MediaType } from "@/domains/video-editing/types/media"
import type { MediaFile as FeatureMediaFile } from "@/features/media/types/media"

/**
 * Конвертирует MediaFile из features в формат для AI Services
 */
export function convertToAIServicesMediaFile(file: FeatureMediaFile): DomainMediaFile {
  // Определяем тип на основе boolean флагов
  let type: MediaType = MediaType.Unknown

  if (file.isVideo) {
    const hasAudio = file.probeData?.streams?.some((stream) => stream.codec_type === "audio")
    type = hasAudio ? MediaType.VideoWithAudio : MediaType.Video
  } else if (file.isAudio) {
    type = MediaType.Audio
  } else if (file.isImage) {
    type = MediaType.StillImage
  }

  return {
    id: file.id,
    path: file.path,
    name: file.name,
    type,
    duration: file.duration,
    size: file.size,
    createdAt: file.createdAt ? new Date(file.createdAt) : undefined,
    updatedAt: file.updatedAt ? new Date(file.updatedAt) : undefined,
  } as DomainMediaFile
}

import type { Fragment as DomainFragment } from "@/domains/ai-services/types/montage-planner"
// Типы для Fragment
import type { Fragment as FeatureFragment } from "../types"

/**
 * Конвертирует Fragment для использования в AI Services domain
 */
export function convertFragmentForAIServices(fragment: Partial<FeatureFragment>): Partial<DomainFragment> {
  const converted: Partial<DomainFragment> = {
    ...fragment,
  }

  // Конвертируем sourceFile если есть
  if (fragment.sourceFile) {
    converted.sourceFile = convertToAIServicesMediaFile(fragment.sourceFile)
  }

  return converted
}
