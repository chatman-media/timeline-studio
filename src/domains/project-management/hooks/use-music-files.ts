import type { MediaFile } from "@/domains/media-management"
import type { MediaItem } from "@/types/generated/tauri-bindings"

import { useApp } from "../providers/app-provider"

/**
 * Хук для доступа к музыкальным файлам
 * Предоставляет методы для управления музыкальными файлами в состоянии приложения
 *
 * @returns Объект с данными и методами для работы с музыкальными файлами
 */
export function useMusicFiles() {
  const { projectState, executeCommand } = useApp()

  // Извлекаем только аудио файлы из media_pool (музыка - это аудио)
  const musicFiles: MediaItem[] = projectState?.project?.media_pool?.items
    ? Object.values(projectState.project.media_pool.items).filter((item): item is MediaItem => {
        return (
          item !== undefined &&
          item !== null &&
          typeof item === "object" &&
          "media_type" in item &&
          item.media_type === "Audio"
        )
      })
    : []

  // Добавление музыкального файла
  const addMusicFile = async (path: string) => {
    return executeCommand({
      type: "AddMedia",
      params: { path, media_type: "Audio" },
    })
  }

  // Удаление музыкального файла
  const removeMusicFile = async (mediaId: string) => {
    return executeCommand({
      type: "RemoveMedia",
      params: { media_id: mediaId },
    })
  }

  // Обновление музыкального файла
  const updateMusicFile = async (mediaId: string, updates: any) => {
    return executeCommand({
      type: "UpdateMedia",
      params: { media_id: mediaId, updates },
    })
  }

  // Массовое обновление музыкальных файлов
  const updateMusicFiles = async (files: MediaFile[]) => {
    // Добавляем файлы по одному через команды
    for (const file of files) {
      executeCommand({
        type: "AddMedia",
        params: {
          path: file.path,
          media_type: "Audio",
        },
      })
    }
  }

  return {
    musicFiles,
    addMusicFile,
    removeMusicFile,
    updateMusicFile,
    updateMusicFiles,
  }
}
