/**
 * Хук для bulk операций с медиа файлами
 * Позволяет добавлять несколько файлов в ресурсы одновременно
 */

import { useCallback } from "react"
import type { MediaFile } from "@/domains/media-management"
import { useResources } from "@/domains/video-editing"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UseBulkMediaActions")

export function useBulkMediaActions() {
  const { addMedia, mediaResources } = useResources()

  /**
   * Добавить все видео файлы в ресурсы
   */
  const addAllVideoFiles = useCallback(
    async (allMedia: MediaFile[]) => {
      const addedPaths = new Set(mediaResources.map((r) => r.path))
      const videoFiles = allMedia.filter(
        (file) => file.isVideo && !addedPaths.has(file.path),
      )

      logger.info(`Adding ${videoFiles.length} video files to resources`)

      for (const file of videoFiles) {
        try {
          await addMedia(file)
        } catch (error) {
          logger.error("Failed to add video file:", { path: file.path, error })
        }
      }
    },
    [addMedia, mediaResources],
  )

  /**
   * Добавить все аудио файлы в ресурсы
   */
  const addAllAudioFiles = useCallback(
    async (allMedia: MediaFile[]) => {
      const addedPaths = new Set(mediaResources.map((r) => r.path))
      const audioFiles = allMedia.filter(
        (file) => file.isAudio && !addedPaths.has(file.path),
      )

      logger.info(`Adding ${audioFiles.length} audio files to resources`)

      for (const file of audioFiles) {
        try {
          await addMedia(file)
        } catch (error) {
          logger.error("Failed to add audio file:", { path: file.path, error })
        }
      }
    },
    [addMedia, mediaResources],
  )

  /**
   * Добавить файлы за определённую дату в ресурсы
   */
  const addDateFiles = useCallback(
    async (files: MediaFile[]) => {
      const addedPaths = new Set(mediaResources.map((r) => r.path))
      const filesToAdd = files.filter((file) => !addedPaths.has(file.path))

      logger.info(`Adding ${filesToAdd.length} files for date to resources`)

      for (const file of filesToAdd) {
        try {
          await addMedia(file)
        } catch (error) {
          logger.error("Failed to add file:", { path: file.path, error })
        }
      }
    },
    [addMedia, mediaResources],
  )

  /**
   * Добавить все файлы в ресурсы
   */
  const addAllFiles = useCallback(
    async (allMedia: MediaFile[]) => {
      const addedPaths = new Set(mediaResources.map((r) => r.path))
      const filesToAdd = allMedia.filter((file) => !addedPaths.has(file.path))

      logger.info(`Adding ${filesToAdd.length} files to resources`)

      for (const file of filesToAdd) {
        try {
          await addMedia(file)
        } catch (error) {
          logger.error("Failed to add file:", { path: file.path, error })
        }
      }
    },
    [addMedia, mediaResources],
  )

  return {
    addAllVideoFiles,
    addAllAudioFiles,
    addDateFiles,
    addAllFiles,
  }
}
