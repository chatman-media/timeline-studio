import type { MediaFile } from "@/features/media/types/media"
import type { MediaItem } from "@/types/generated/tauri-bindings"

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

  // Массовое обновление медиа-файлов
  // DEPRECATED: Эта функция больше не должна использоваться для добавления медиа
  // Используйте Resources Provider (addMedia) вместо этого
  const updateMediaFiles = async (files: MediaFile[]) => {
    console.warn(
      "DEPRECATED: updateMediaFiles should not be used for adding media. " +
        "Use Resources Provider (addMedia) instead. " +
        `Called with ${files.length} files.`,
      files.map((f) => f.path),
    )
    // NO-OP: не вызываем executeCommand чтобы избежать дублирования
    // Resources Provider - единственный источник истины для медиа
  }

  return {
    mediaFiles,
    addMediaFile,
    removeMediaFile,
    updateMediaFile,
    updateMediaFiles,
  }
}
