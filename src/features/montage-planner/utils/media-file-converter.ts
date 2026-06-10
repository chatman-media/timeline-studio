/**
 * Media File Converter for Montage Planner
 *
 * Конвертирует MediaFile из features в формат для AI Services domain
 */

import type { MediaFile as FeatureMediaFile } from "@timeline-studio/core/types"
import type { UnifiedFragment } from "@timeline-studio/core/types/unified-montage"

type AIServicesMediaFile = Pick<FeatureMediaFile, "id" | "path" | "name" | "duration"> & {
  size: number
  type: "video" | "audio" | "image"
  format?: string
}

type AIServicesFragment = Omit<UnifiedFragment, "sourceFile"> & {
  sourceFile?: AIServicesMediaFile
}

/**
 * Конвертирует MediaFile из features в формат для AI Services
 */
export function convertToAIServicesMediaFile(file: FeatureMediaFile): AIServicesMediaFile {
  // Определяем тип на основе boolean флагов
  let type: "video" | "audio" | "image" = "video"

  if (file.isVideo) {
    type = "video"
  } else if (file.isAudio) {
    type = "audio"
  } else if (file.isImage) {
    type = "image"
  }

  return {
    id: file.id,
    path: file.path,
    name: file.name,
    size: file.size || 0,
    type,
    duration: file.duration,
    format: file.probeData?.format?.format_name,
  }
}

// Типы для Fragment
import type { Fragment as FeatureFragment } from "../types"

/**
 * Конвертирует Fragment для использования в AI Services domain
 */
export function convertFragmentForAIServices(fragment: Partial<FeatureFragment>): Partial<AIServicesFragment> {
  // Конвертируем score в analysis если есть
  const analysis = fragment.score
    ? {
        quality: fragment.score.scores.technical / 100,
        motion: fragment.score.scores.action / 100,
        faceCount: 0,
        objectsOfInterest: fragment.objects || [],
        audioQuality: 0.8,
        duration: fragment.duration || 0,
        brightnessVariation: 0.5,
        colorfulness: fragment.score.scores.visual / 100,
        sharpness: fragment.score.scores.technical / 100,
        contrast: 0.7,
        visualComplexity: fragment.score.scores.composition / 100,
        audioLoudness: -20,
        speechPresence: false,
      }
    : {
        quality: 0.8,
        motion: 0.5,
        faceCount: 0,
        objectsOfInterest: [],
        audioQuality: 0.8,
        duration: fragment.duration || 0,
        brightnessVariation: 0.5,
        colorfulness: 0.7,
        sharpness: 0.8,
        contrast: 0.7,
        visualComplexity: 0.6,
        audioLoudness: -20,
        speechPresence: false,
      }

  const converted: Partial<AIServicesFragment> = {
    id: fragment.id,
    videoId: fragment.videoId,
    startTime: fragment.startTime,
    endTime: fragment.endTime,
    duration: fragment.duration,
    objects: fragment.objects || [],
    people: fragment.people || [],
    tags: fragment.tags || [],
    description: fragment.description,
    analysis,
  }

  // Конвертируем sourceFile если есть
  if (fragment.sourceFile) {
    converted.sourceFile = convertToAIServicesMediaFile(fragment.sourceFile as FeatureMediaFile)
  }

  return converted
}
