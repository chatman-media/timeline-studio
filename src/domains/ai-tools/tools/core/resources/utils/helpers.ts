/**
 * Вспомогательные функции для работы с ресурсами
 */

import type { ResourcesStateAccess } from "../types"

// Глобальная переменная для доступа к состоянию resources
let resourcesStateAccess: ResourcesStateAccess | null = null

/**
 * Устанавливает доступ к состоянию resources
 */
export function setResourcesStateAccess(access: ResourcesStateAccess | null) {
  resourcesStateAccess = access
}

/**
 * Получает текущий доступ к ресурсам
 */
export function getResourcesStateAccess(): ResourcesStateAccess | null {
  return resourcesStateAccess
}

/**
 * Проверяет, настроен ли доступ к ресурсам
 */
export function hasResourcesAccess(): boolean {
  return resourcesStateAccess !== null
}

/**
 * Получает провайдер ресурсов
 */
export function getResourcesProvider() {
  if (!resourcesStateAccess) {
    throw new Error("Resources state access не настроен")
  }
  return resourcesStateAccess.getResourcesProvider()
}

/**
 * Получает статистику ресурсов
 */
export function getResourcesStats() {
  if (!resourcesStateAccess) {
    throw new Error("Resources state access не настроен")
  }
  return resourcesStateAccess.getResourceStats()
}

/**
 * Проверяет, существует ли ресурс с данным ID
 */
export function resourceExists(resourceId: string): boolean {
  try {
    const provider = getResourcesProvider()
    return provider.resources.some((r) => r.resourceId === resourceId)
  } catch {
    return false
  }
}

/**
 * Находит ресурс по ID
 */
export function findResource(resourceId: string) {
  try {
    const provider = getResourcesProvider()
    return provider.resources.find((r) => r.resourceId === resourceId)
  } catch {
    return null
  }
}

/**
 * Получает детальную информацию о ресурсе
 */
export function getResourceDetails(resourceId: string) {
  try {
    const provider = getResourcesProvider()
    const resource = provider.resources.find((r) => r.resourceId === resourceId)
    if (!resource) return null

    // Получаем детальную информацию в зависимости от типа
    switch (resource.type) {
      case "media":
      case "music": {
        const mediaResource =
          provider.mediaResources.find((m) => m.resourceId === resourceId) ||
          provider.musicResources.find((m) => m.resourceId === resourceId)
        return mediaResource
          ? {
              ...resource,
              file: mediaResource.file,
              name: mediaResource.file.name,
              size: mediaResource.file.size,
              duration: mediaResource.file.duration,
            }
          : null
      }
      case "effect": {
        const effectResource = provider.effectResources.find((e) => e.resourceId === resourceId)
        return effectResource
          ? {
              ...resource,
              effect: effectResource.effect,
              name: effectResource.effect.name,
              category: effectResource.effect.category,
            }
          : null
      }
      case "filter": {
        const filterResource = provider.filterResources.find((f) => f.resourceId === resourceId)
        return filterResource
          ? {
              ...resource,
              filter: filterResource.filter,
              name: filterResource.filter.name,
              category: filterResource.filter.category,
            }
          : null
      }
      case "transition": {
        const transitionResource = provider.transitionResources.find((t) => t.resourceId === resourceId)
        return transitionResource
          ? {
              ...resource,
              transition: transitionResource.transition,
              name: transitionResource.transition.name || transitionResource.transition.type,
            }
          : null
      }
      default:
        return resource
    }
  } catch {
    return null
  }
}

/**
 * Фильтрует ресурсы по критериям
 */
export function filterResources(resources: any[], criteria: any): any[] {
  let filtered = [...resources]

  if (criteria.searchQuery) {
    const query = criteria.searchQuery.toLowerCase()
    filtered = filtered.filter(
      (resource) => resource.name?.toLowerCase().includes(query) || resource.id?.toLowerCase().includes(query),
    )
  }

  if (criteria.tags?.length) {
    filtered = filtered.filter((resource) => criteria.tags.some((tag: string) => resource.tags?.includes(tag)))
  }

  if (criteria.minDuration !== undefined) {
    filtered = filtered.filter((resource) => !resource.duration || resource.duration >= criteria.minDuration)
  }

  if (criteria.maxDuration !== undefined) {
    filtered = filtered.filter((resource) => !resource.duration || resource.duration <= criteria.maxDuration)
  }

  if (criteria.fileTypes?.length) {
    filtered = filtered.filter((resource) => {
      if (!resource.isVideo && !resource.isAudio && !resource.isImage) return true
      return criteria.fileTypes.some((type: string) => {
        switch (type) {
          case "video":
            return resource.isVideo
          case "audio":
            return resource.isAudio
          case "image":
            return resource.isImage
          default:
            return false
        }
      })
    })
  }

  return filtered
}

/**
 * Форматирует размер файла в читаемом виде
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Форматирует длительность в читаемом виде
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}:${minutes.toString().padStart(2, "0")}:00`
}

/**
 * Группирует ресурсы по типу
 */
export function groupResourcesByType(resources: any[]): Record<string, any[]> {
  return resources.reduce<Record<string, any[]>>((acc, resource) => {
    const type = resource.type || "unknown"
    if (!acc[type]) acc[type] = []
    acc[type].push(resource)
    return acc
  }, {})
}

/**
 * Получает предложения настроения по типу проекта
 */
export function getMoodEffects(mood: string): string[] {
  const moodEffects: Record<string, string[]> = {
    energetic: ["speed-ramp", "shake", "zoom-burst", "glitch"],
    calm: ["blur", "soft-focus", "slow-motion", "fade"],
    dramatic: ["black-white", "contrast", "vignette", "dramatic-zoom"],
    romantic: ["warm-filter", "soft-glow", "heart-overlay", "bokeh"],
    professional: ["clean-transitions", "minimal-effects", "corporate-lower-thirds"],
    playful: ["cartoon-effects", "bounce", "spin", "colorful-transitions"],
    serious: ["desaturate", "film-grain", "documentary-style"],
    uplifting: ["light-leaks", "sun-flare", "bright-transitions"],
  }

  return moodEffects[mood] || []
}

/**
 * Получает рекомендуемые ресурсы по типу проекта
 */
export function getProjectTypeResources(projectType: string): string[] {
  const projectTypeResources: Record<string, string[]> = {
    wedding: ["romantic-music", "elegant-transitions", "warm-filters", "title-templates"],
    travel: ["upbeat-music", "map-animations", "location-titles", "cinematic-effects"],
    corporate: ["professional-music", "clean-transitions", "brand-templates", "infographics"],
    social: ["trendy-music", "quick-cuts", "social-media-templates", "emoji-overlays"],
    documentary: ["ambient-music", "simple-transitions", "interview-templates", "subtitles"],
    education: ["background-music", "clear-transitions", "educational-graphics", "annotations"],
    "music-video": ["sync-effects", "beat-transitions", "visual-effects", "color-grades"],
    commercial: ["upbeat-music", "product-highlights", "call-to-action", "brand-elements"],
  }

  return projectTypeResources[projectType] || []
}

/**
 * Проверяет совместимость ресурса с настройками проекта
 */
export function checkResourceCompatibility(
  resource: any,
  projectSettings: any,
): {
  compatible: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Проверка разрешения для видео
  if (resource.file?.isVideo && resource.file.probeData?.streams) {
    const videoStream = resource.file.probeData.streams.find((s: any) => s.codec_type === "video")
    if (videoStream && videoStream.width && videoStream.height) {
      if (
        videoStream.width !== projectSettings.resolution.width ||
        videoStream.height !== projectSettings.resolution.height
      ) {
        issues.push(
          `Несовместимость разрешения: ${videoStream.width}x${videoStream.height} vs ${projectSettings.resolution.width}x${projectSettings.resolution.height}`,
        )
      }
    }
  }

  // Проверка частоты кадров
  if (resource.file?.isVideo && resource.file.probeData?.streams) {
    const videoStream = resource.file.probeData.streams.find((s: any) => s.codec_type === "video")
    if (videoStream && videoStream.r_frame_rate) {
      try {
        const fps = eval(videoStream.r_frame_rate)
        if (fps && Math.abs(fps - projectSettings.fps) > 5) {
          issues.push(`Различная частота кадров: ${fps} fps vs ${projectSettings.fps} fps`)
        }
      } catch {
        // Ignore frame rate parsing errors
      }
    }
  }

  // Проверка частоты дискретизации аудио
  if (resource.file?.isAudio && resource.file.probeData?.streams) {
    const audioStream = resource.file.probeData.streams.find((s: any) => s.codec_type === "audio")
    if (
      audioStream &&
      audioStream.sample_rate &&
      Number.parseInt(audioStream.sample_rate.toString()) !== projectSettings.sampleRate
    ) {
      issues.push(`Различная частота дискретизации: ${audioStream.sample_rate} Hz vs ${projectSettings.sampleRate} Hz`)
    }
  }

  return {
    compatible: issues.length === 0,
    issues,
  }
}
