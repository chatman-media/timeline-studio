/**
 * Project File Types
 *
 * DEPRECATED: Legacy structure for .tls project files
 * Use TimelineStudioProject for new projects
 *
 * Canonical source for project file types
 */

import type { SavedMediaFile, SavedMusicFile } from "@timeline-studio/domains/media-management"
import type { ProjectSettings } from "./settings"

/**
 * DEPRECATED: Старая структура файла проекта (.tls)
 * Используйте TimelineStudioProject из timeline-studio-project.ts
 *
 * Оставлено для обратной совместимости при миграции старых проектов
 */
export interface ProjectFile {
  /** Настройки проекта (разрешение, FPS, цветовое пространство) */
  settings: ProjectSettings

  /** Медиа пул - новое название для mediaLibrary */
  mediaPool?: {
    mediaFiles: SavedMediaFile[]
    musicFiles: SavedMusicFile[]
    lastUpdated: number
    version: string
  }

  /** @deprecated Используйте mediaPool в новой структуре */
  mediaLibrary?: {
    mediaFiles: SavedMediaFile[]
    musicFiles: SavedMusicFile[]
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
