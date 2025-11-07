/**
 * Утилиты для синхронизации ресурсов с проектом
 */

import { convertMediaFileToPoolItem } from "@/features/media/utils/media-pool-utils"
import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import type { MediaResource, MusicResource } from "@/features/resources/types"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("SyncResourcesToProject")

/**
 * Синхронизирует ресурсы из ResourcesProvider с MediaPool проекта
 */
export function syncResourcesToProject(
  project: TimelineStudioProject,
  mediaResources: MediaResource[],
  musicResources: MusicResource[],
): TimelineStudioProject {
  // Создаем глубокую копию проекта чтобы не мутировать оригинал
  const updatedProject = {
    ...project,
    mediaPool: {
      ...project.mediaPool,
      // Копируем существующие items вместо создания новой пустой Map
      items: new Map(project.mediaPool.items),
      stats: { ...project.mediaPool.stats },
    },
    metadata: { ...project.metadata },
  }

  // Создаем Set с ID ресурсов из localStorage для быстрого поиска
  const resourceIds = new Set<string>()

  // Добавляем или обновляем медиа ресурсы
  mediaResources.forEach((resource) => {
    if (resource.file) {
      const poolItem = convertMediaFileToPoolItem(resource.file)
      updatedProject.mediaPool.items.set(poolItem.id, poolItem)
      resourceIds.add(poolItem.id)
    }
  })

  // Добавляем или обновляем музыкальные ресурсы
  musicResources.forEach((resource) => {
    if (resource.file) {
      const poolItem = convertMediaFileToPoolItem(resource.file, "music")
      updatedProject.mediaPool.items.set(poolItem.id, poolItem)
      resourceIds.add(poolItem.id)
    }
  })

  // Удаляем items, которых больше нет в localStorage
  // Это нужно для синхронизации удалений
  for (const [id] of updatedProject.mediaPool.items) {
    if (!resourceIds.has(id)) {
      updatedProject.mediaPool.items.delete(id)
    }
  }

  // Обновляем статистику
  updatedProject.mediaPool.stats = {
    totalItems: updatedProject.mediaPool.items.size,
    totalSize: Array.from(updatedProject.mediaPool.items.values()).reduce<number>((sum, item) => {
      const fileSize = typeof item.metadata.fileSize === "number" ? item.metadata.fileSize : 0
      return Number(sum) + Number(fileSize)
    }, 0),
    onlineItems: Array.from(updatedProject.mediaPool.items.values()).filter((item) => item.status === "online").length,
    offlineItems: Array.from(updatedProject.mediaPool.items.values()).filter(
      (item) => item.status === "offline" || item.status === "missing",
    ).length,
    proxyItems: 0,
    unusedItems: updatedProject.mediaPool.items.size, // Все элементы изначально неиспользуемые
  }

  // Обновляем дату модификации
  updatedProject.metadata.modified = new Date()

  return updatedProject
}

/**
 * Получает ресурсы из localStorage
 */
export function getResourcesFromStorage(): {
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
} {
  // Check if we're on the client side
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return {
      mediaResources: [],
      musicResources: [],
    }
  }

  try {
    const stored = localStorage.getItem("timeline-studio-resources")
    if (stored) {
      const data = JSON.parse(stored)
      return {
        mediaResources: data.mediaResources || [],
        musicResources: data.musicResources || [],
      }
    }
  } catch (error) {
    logger.warn("Failed to get resources from localStorage:", { error })
  }

  return {
    mediaResources: [],
    musicResources: [],
  }
}
