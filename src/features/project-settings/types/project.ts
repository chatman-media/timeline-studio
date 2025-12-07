/**
 * Типы перемещены в @/domains/shared/types/project
 * Реэкспортируются здесь для обратной совместимости
 */
export type {
  AspectRatio,
  AspectRatioValue,
  ColorSpace,
  FrameRate,
  ProjectSettings,
  Resolution,
  ResolutionOption,
} from "@/domains/shared/types/project"

export {
  ASPECT_RATIOS,
  COLOR_SPACES,
  COMMON_FRAMERATES,
  COMMON_RESOLUTIONS,
  DEFAULT_PROJECT_SETTINGS,
  FRAME_RATES,
  getDefaultResolutionForAspectRatio,
  getResolutionsForAspectRatio,
  RESOLUTIONS_1_1,
  RESOLUTIONS_4_3,
  RESOLUTIONS_4_5,
  RESOLUTIONS_9_16,
  RESOLUTIONS_16_9,
  RESOLUTIONS_21_9,
} from "@/domains/shared/types/project"

// Import directly to avoid circular dependency
import type { ProjectSettings as PS } from "@/domains/shared/types/project/settings"

/**
 * DEPRECATED: Старая структура файла проекта (.tls)
 * Используйте TimelineStudioProject из timeline-studio-project.ts
 *
 * Оставлено для обратной совместимости при миграции старых проектов
 */
export interface ProjectFile {
  /** Настройки проекта (разрешение, FPS, цветовое пространство) */
  settings: PS

  /** Медиа пул - новое название для mediaLibrary */
  mediaPool?: {
    mediaFiles: import("@/domains/media-management").SavedMediaFile[]
    musicFiles: import("@/domains/media-management").SavedMusicFile[]
    lastUpdated: number
    version: string
  }

  /** @deprecated Используйте mediaPool в новой структуре */
  mediaLibrary?: {
    mediaFiles: import("@/domains/media-management").SavedMediaFile[]
    musicFiles: import("@/domains/media-management").SavedMusicFile[]
    lastUpdated: number
    version: string
  }

  /** Настройки рабочего пространства - новое название для browserState */
  workspaceSettings?: {
    media: {
      viewMode: "list" | "grid" | "thumbnails"
      sortBy: string
      sortOrder: "asc" | "desc"
      searchQuery: string
      filterType: string
      groupBy: string
    }
    music: {
      viewMode: "list" | "thumbnails"
      sortBy: string
      sortOrder: "asc" | "desc"
      searchQuery: string
      filterType: string
      groupBy: "none" | "artist" | "genre" | "album"
      showFavoritesOnly: boolean
    }
  }

  /** @deprecated Перенесено в workspace настройки */
  browserState?: {
    media: {
      viewMode: "list" | "grid" | "thumbnails"
      sortBy: string
      sortOrder: "asc" | "desc"
      searchQuery: string
      filterType: string
      groupBy: string
    }
    music: {
      viewMode: "list" | "thumbnails"
      sortBy: string
      sortOrder: "asc" | "desc"
      searchQuery: string
      filterType: string
      groupBy: "none" | "artist" | "genre" | "album"
      showFavoritesOnly: boolean
    }
  }

  /** Избранные файлы - новое название для projectFavorites */
  favoriteFiles?: {
    mediaFiles: string[]
    musicFiles: string[]
  }

  /** @deprecated Интегрировано в mediaPool */
  projectFavorites?: {
    mediaFiles: string[]
    musicFiles: string[]
  }

  /** @deprecated Используйте sequences в новой структуре */
  timeline?: {
    tracks: any[]
    resources: any[]
  }

  /** Метаданные проекта */
  meta: {
    version: string
    createdAt: number
    lastModified: number
    originalPlatform?: string
  }
}
