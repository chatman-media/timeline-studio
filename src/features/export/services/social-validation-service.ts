// Сервис для валидации контента перед загрузкой в социальные сети

import { SOCIAL_NETWORKS } from "../constants/export-constants"
import type { SocialExportSettings } from "../types/export-types"

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface SocialNetworkLimits {
  maxFileSize: number // в байтах
  maxDuration: number // в секундах
  minDuration?: number
  supportedFormats: string[]
  maxResolution: string
  recommendedAspectRatios: string[]
  titleMaxLength: number
  descriptionMaxLength: number
  tagsMaxCount: number
  tagMaxLength: number
}

const NETWORK_LIMITS: Record<string, SocialNetworkLimits> = {
  youtube: {
    maxFileSize: 128 * 1024 * 1024 * 1024, // 128GB
    maxDuration: 12 * 60 * 60, // 12 hours
    supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "webm"],
    maxResolution: "4k",
    recommendedAspectRatios: ["16:9", "9:16", "1:1"],
    titleMaxLength: 100,
    descriptionMaxLength: 5000,
    tagsMaxCount: 15,
    tagMaxLength: 30,
  },
  tiktok: {
    maxFileSize: 287 * 1024 * 1024, // 287MB
    maxDuration: 10 * 60, // 10 minutes
    minDuration: 3, // 3 seconds
    supportedFormats: ["mp4", "mov"],
    maxResolution: "1080p",
    recommendedAspectRatios: ["9:16"],
    titleMaxLength: 150,
    descriptionMaxLength: 2200,
    tagsMaxCount: 20,
    tagMaxLength: 20,
  },
  vimeo: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB (Basic plan)
    maxDuration: 7 * 24 * 60 * 60, // 7 days
    supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "webm", "3gp"],
    maxResolution: "4k",
    recommendedAspectRatios: ["16:9", "4:3", "1:1"],
    titleMaxLength: 128,
    descriptionMaxLength: 5000,
    tagsMaxCount: 20,
    tagMaxLength: 40,
  },
  telegram: {
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxDuration: Number.POSITIVE_INFINITY,
    supportedFormats: ["mp4", "avi", "mov", "mkv"],
    maxResolution: "1080p",
    recommendedAspectRatios: ["16:9", "4:3"],
    titleMaxLength: 256,
    descriptionMaxLength: 4096,
    tagsMaxCount: 10,
    tagMaxLength: 30,
  },
}

export function validateExportSettings(
  networkId: string,
  settings: SocialExportSettings,
  videoFile?: { size: number; duration: number; format: string },
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  const limits = NETWORK_LIMITS[networkId]
  if (!limits) {
    result.errors.push(`Unsupported social network: ${networkId}`)
    result.isValid = false
    return result
  }

  // Валидация заголовка
  validateTitle(settings.title, limits, result)

  // Валидация описания
  validateDescription(settings.description, limits, result)

  // Валидация тегов
  validateTags(settings.tags, limits, result)

  // Валидация приватности
  validatePrivacy(settings.privacy, networkId, result)

  // Валидация файла (если предоставлен)
  if (videoFile) {
    validateVideoFile(videoFile, limits, result)
  }

  // Валидация настроек экспорта
  validateExportConfig(settings, limits, result)

  // Добавляем предложения по оптимизации
  addOptimizationSuggestions(networkId, settings, result)

  result.isValid = result.errors.length === 0
  return result
}

function validateTitle(title: string | undefined, limits: SocialNetworkLimits, result: ValidationResult): void {
  if (!title || title.trim().length === 0) {
    result.errors.push("Title is required")
    return
  }

  if (title.length > limits.titleMaxLength) {
    result.errors.push(`Title must be ${limits.titleMaxLength} characters or less (current: ${title.length})`)
  }

  // Проверка на запрещенные символы
  const forbiddenChars = /[<>]/g
  if (forbiddenChars.test(title)) {
    result.warnings.push("Title contains potentially problematic characters (< >)")
  }

  // Проверка на слишком короткий заголовок
  if (title.trim().length < 10) {
    result.suggestions.push("Consider making the title more descriptive (at least 10 characters)")
  }
}

function validateDescription(
  description: string | undefined,
  limits: SocialNetworkLimits,
  result: ValidationResult,
): void {
  if (description && description.length > limits.descriptionMaxLength) {
    result.errors.push(
      `Description must be ${limits.descriptionMaxLength} characters or less (current: ${description.length})`,
    )
  }

  if (!description || description.trim().length === 0) {
    result.suggestions.push("Adding a description can help improve discoverability")
  }
}

function validateTags(tags: string[] | undefined, limits: SocialNetworkLimits, result: ValidationResult): void {
  if (!tags) return

  if (tags.length > limits.tagsMaxCount) {
    result.errors.push(`Maximum ${limits.tagsMaxCount} tags allowed (current: ${tags.length})`)
  }

  tags.forEach((tag, index) => {
    if (tag.length > limits.tagMaxLength) {
      result.errors.push(`Tag ${index + 1} is too long (max ${limits.tagMaxLength} characters)`)
    }

    if (tag.trim().length === 0) {
      result.warnings.push(`Tag ${index + 1} is empty`)
    }

    if (!/^[a-zA-Z0-9\s-_]+$/.test(tag)) {
      result.warnings.push(`Tag "${tag}" contains special characters that may not be supported`)
    }
  })

  if (tags.length === 0) {
    result.suggestions.push("Adding relevant tags can help improve discoverability")
  }
}

function validatePrivacy(privacy: string | undefined, networkId: string, result: ValidationResult): void {
  const supportedPrivacyOptions: Record<string, string[]> = {
    youtube: ["public", "private", "unlisted"],
    tiktok: ["public", "private", "friends"],
    vimeo: ["anybody", "nobody", "contacts", "password"],
    telegram: ["public", "private"],
  }

  const supported = supportedPrivacyOptions[networkId] || []
  if (privacy && !supported.includes(privacy)) {
    result.warnings.push(`Privacy setting "${privacy}" may not be supported by ${networkId}`)
  }
}

function validateVideoFile(
  videoFile: { size: number; duration: number; format: string },
  limits: SocialNetworkLimits,
  result: ValidationResult,
): void {
  // Проверка размера файла
  if (videoFile.size > limits.maxFileSize) {
    const sizeMB = Math.round(videoFile.size / (1024 * 1024))
    const limitMB = Math.round(limits.maxFileSize / (1024 * 1024))
    result.errors.push(`File size ${sizeMB}MB exceeds limit of ${limitMB}MB`)
  }

  // Проверка длительности
  if (videoFile.duration > limits.maxDuration) {
    const durationMin = Math.round(videoFile.duration / 60)
    const limitMin = Math.round(limits.maxDuration / 60)
    result.errors.push(`Video duration ${durationMin}min exceeds limit of ${limitMin}min`)
  }

  if (limits.minDuration && videoFile.duration < limits.minDuration) {
    result.errors.push(`Video duration must be at least ${limits.minDuration} seconds`)
  }

  // Проверка формата
  if (!limits.supportedFormats.includes(videoFile.format.toLowerCase())) {
    result.errors.push(
      `Format "${videoFile.format}" is not supported. Supported formats: ${limits.supportedFormats.join(", ")}`,
    )
  }
}

function validateExportConfig(
  settings: SocialExportSettings,
  limits: SocialNetworkLimits,
  result: ValidationResult,
): void {
  // Проверка разрешения
  if (settings.resolution) {
    const resolutionMap: Record<string, number> = {
      "480": 480,
      "720": 720,
      "1080": 1080,
      "1440": 1440,
      "2160": 2160, // 4K
    }

    const maxResolutionHeight =
      limits.maxResolution === "4k"
        ? 2160
        : limits.maxResolution === "1440p"
          ? 1440
          : limits.maxResolution === "1080p"
            ? 1080
            : 720

    const settingsHeight = resolutionMap[settings.resolution] || Number.parseInt(settings.resolution, 10)
    if (settingsHeight > maxResolutionHeight) {
      result.warnings.push(`Resolution ${settings.resolution}p may exceed platform limits`)
    }
  }
}

function addOptimizationSuggestions(networkId: string, settings: SocialExportSettings, result: ValidationResult): void {
  const network = SOCIAL_NETWORKS.find((n) => n.id === networkId)
  if (!network) return

  // Платформо-специфичные предложения
  switch (networkId) {
    case "tiktok":
      if (!settings.title?.includes("#")) {
        result.suggestions.push("Consider adding hashtags to your title for better discoverability on TikTok")
      }
      break

    case "youtube":
      // Consider using YouTube Shorts format for vertical videos
      if (settings.resolution && Number.parseInt(settings.resolution, 10) < 1080) {
        result.suggestions.push("YouTube recommends 1080p or higher for best quality")
      }
      break

    case "vimeo":
      if (settings.quality !== "best") {
        result.suggestions.push("Vimeo is known for high-quality videos - consider using 'best' quality setting")
      }
      break

    case "telegram":
      if (settings.fileSizeBytes && settings.fileSizeBytes > 50 * 1024 * 1024) {
        result.suggestions.push("Large files may take longer to upload and download on Telegram")
      }
      break

    default:
      // No specific suggestions for other networks
      break
  }

  // Общие предложения
  if (!settings.tags || settings.tags.length === 0) {
    result.suggestions.push("Adding relevant tags can significantly improve discoverability")
  }

  if (!settings.description || settings.description.length < 50) {
    result.suggestions.push("A detailed description helps viewers understand your content better")
  }
}

export function getNetworkLimits(networkId: string): SocialNetworkLimits | null {
  return NETWORK_LIMITS[networkId] || null
}

export function getOptimalSettings(networkId: string): Partial<SocialExportSettings> {
  const limits = NETWORK_LIMITS[networkId]
  if (!limits) return {}

  switch (networkId) {
    case "youtube":
      return {
        resolution: "1080",
        frameRate: "30",
        quality: "good",
        format: "Mp4",
      }

    case "tiktok":
      return {
        resolution: "1080",
        frameRate: "30",
        quality: "good",
        format: "Mp4",
      }

    case "vimeo":
      return {
        resolution: "1080",
        frameRate: "30",
        quality: "best",
        format: "Mp4",
      }

    case "telegram":
      return {
        resolution: "720",
        frameRate: "30",
        quality: "normal",
        format: "Mp4",
      }

    default:
      return {}
  }
}
