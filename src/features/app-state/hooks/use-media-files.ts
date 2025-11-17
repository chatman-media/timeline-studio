import type { MediaItem } from "@/types/generated/state-types"

import { useApp } from "../services/app-provider"

/**
 * Хук для доступа к медиа-файлам
 * Предоставляет методы для управления медиа-файлами в состоянии приложения
 *
 * @returns Объект с данными и методами для работы с медиа-файлами
 */
export function useMediaFiles() {
  const { projectState, executeCommand } = useApp()

  // Извлекаем медиа-файлы из media_pool
  const mediaFiles: MediaItem[] = projectState?.project?.media_pool?.items
    ? Object.values(projectState.project.media_pool.items)
    : []

  // Добавление медиа-файла
  const addMediaFile = async (path: string, mediaType: "Video" | "Audio" | "Image") => {
    return executeCommand({
      type: "AddMedia",
      params: { path, media_type: mediaType },
    })
  }

  // Удаление медиа-файла
  const removeMediaFile = async (mediaId: string) => {
    return executeCommand({
      type: "RemoveMedia",
      params: { media_id: mediaId },
    })
  }

  // Обновление медиа-файла
  const updateMediaFile = async (mediaId: string, updates: any) => {
    return executeCommand({
      type: "UpdateMedia",
      params: { media_id: mediaId, updates },
    })
  }

  return {
    mediaFiles,
    addMediaFile,
    removeMediaFile,
    updateMediaFile,
  }
}
