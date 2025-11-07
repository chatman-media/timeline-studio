import { useCallback, useState } from "react"

import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { selectMediaDirectory, selectMediaFile } from "@/features/media"
import { useMediaPreview } from "@/features/media/hooks/use-media-preview"
import { type DiscoveredFile, useMediaProcessor } from "@/features/media/hooks/use-media-processor"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"
import { convertToSavedMediaFile } from "@/features/media/utils/saved-media-utils"
import { useResources } from "@/features/resources/services/resources-provider"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("MediaImport")

/**
 * Интерфейс для результата импорта
 */
interface ImportResult {
  success: boolean
  message: string
  files: MediaFile[]
}

/**
 * Хук для импорта медиафайлов с использованием backend процессора
 * Использует события от backend для обновления файлов по мере готовности
 */
export function useMediaImport() {
  const { currentProject, setProjectDirty } = useCurrentProject()
  const { addMedia } = useResources()
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  // Хранилище для быстрого доступа к файлам по ID (удалено - не используется)

  // Используем Preview Manager для унифицированной системы превью
  const { generateThumbnail } = useMediaPreview()

  /**
   * Создает базовый объект медиафайла с минимальной информацией
   */
  const createBasicMediaFile = (filePath: string, size?: number): MediaFile => {
    const fileName = filePath.split("/").pop() ?? "unknown"
    const fileExtension = fileName.split(".").pop()?.toLowerCase() ?? ""

    // Определяем тип файла по расширению
    const isVideo = ["mp4", "avi", "mkv", "mov", "webm", "insv", "lrv"].includes(fileExtension)
    const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(fileExtension)
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(fileExtension)

    // Определяем MediaType
    const mediaType = isVideo
      ? MediaType.Video
      : isAudio
        ? MediaType.Audio
        : isImage
          ? MediaType.StillImage
          : MediaType.Unknown

    return {
      id: filePath,
      name: fileName,
      path: filePath,
      type: mediaType,
      isVideo,
      isAudio,
      isImage,
      size,
      // Устанавливаем флаг, что метаданные еще загружаются
      isLoadingMetadata: true,
      // Добавляем пустой объект probeData
      probeData: {
        streams: [],
        format: {},
      },
    }
  }

  /**
   * Настройка обработчиков событий от MediaProcessor
   */
  const mediaProcessorOptions = {
    // Когда обнаружены файлы - сразу добавляем их с флагом загрузки
    onFilesDiscovered: useCallback(
      (discoveredFiles: DiscoveredFile[]) => {
        logger.infoSync(`Обнаружено ${discoveredFiles.length} файлов`, {
          count: discoveredFiles.length,
          files: discoveredFiles.map((f) => ({ path: f.path, size: f.size })),
        })

        const basicFiles = discoveredFiles.map((file) => createBasicMediaFile(file.path, file.size))

        // Добавляем файлы в ресурсы для синхронизации с проектом (Resources - единственный источник истины)
        basicFiles.forEach((file) => {
          logger.debugSync(`Добавляем базовый файл: ${file.name}`, {
            id: file.id,
            type: file.isVideo ? "video" : file.isAudio ? "audio" : "image",
          })
          void addMedia(file)
        })
      },
      [addMedia],
    ),

    // Когда готовы метаданные - обновляем конкретный файл
    onMetadataReady: useCallback(
      (fileId: string, metadata: MediaFile) => {
        logger.infoSync(`Метаданные готовы для: ${metadata.name}`, {
          fileId,
          fileName: metadata.name,
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
          hasProbeData: !!metadata.probeData,
        })

        // Обновляем существующий файл, сохраняя его id
        const updatedFile: MediaFile = {
          ...metadata,
          id: fileId,
          isLoadingMetadata: false,
        }

        logger.debugSync(`Обновляем файл с метаданными: ${metadata.name}`)
        // Обновляем файл в ресурсах для синхронизации с проектом (Resources - единственный источник истины)
        void addMedia(updatedFile)
      },
      [addMedia],
    ),

    // Когда готово превью - обновляем путь и генерируем через Preview Manager
    onThumbnailReady: useCallback(
      (fileId: string, _thumbnailPath: string) => {
        logger.debugSync(`Превью готово для: ${fileId}`, { fileId, thumbnailPath: _thumbnailPath })

        // TODO: Нужен способ получить текущий файл по ID для обновления thumbnail
        // Пока просто логируем для отладки
      },
      [generateThumbnail],
    ),

    // Обработка ошибок
    onError: useCallback((fileId: string, error: string) => {
      logger.errorSync(`Ошибка обработки файла ${fileId}`, { fileId, error })

      // TODO: Нужен способ обновить файл и снять флаг загрузки при ошибке
    }, []),

    // Обновление прогресса
    onProgress: useCallback((current: number, total: number) => {
      setProgress(total > 0 ? Math.floor((current / total) * 100) : 0)
    }, []),
  }

  // Используем хук MediaProcessor
  const { scanFolderWithThumbnails, processFiles } = useMediaProcessor(mediaProcessorOptions)

  /**
   * Сохраняет импортированные медиафайлы в проект (если проект открыт)
   */
  const saveFilesToProject = useCallback(
    async (files: MediaFile[]) => {
      if (!currentProject?.path || files.length === 0) {
        logger.debugSync("Пропускаем сохранение файлов", {
          hasProject: !!currentProject?.path,
          filesCount: files.length,
        })
        return
      }

      try {
        logger.infoSync(`Сохраняем ${files.length} медиафайлов в проект`, {
          projectPath: currentProject?.path,
          filesCount: files.length,
        })
        const savedFiles = await Promise.all(
          files.map((file) => convertToSavedMediaFile(file, currentProject?.path || undefined)),
        )

        logger.infoSync(`Сохранено ${savedFiles.length} медиафайлов в проект`)
        setProjectDirty(true)
      } catch (error) {
        logger.errorSync("Ошибка при сохранении файлов в проект", { error: String(error), filesCount: files.length })
      }
    },
    [currentProject?.path, setProjectDirty],
  )

  /**
   * Импортирует медиафайлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    logger.infoSync("Начинаем импорт файлов")
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора файлов
      logger.debugSync("Открываем диалог выбора файлов")
      const selectedFiles = await selectMediaFile()

      if (!selectedFiles || selectedFiles.length === 0) {
        logger.warnSync("Файлы не выбраны")
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          files: [],
        }
      }

      logger.infoSync(`Выбрано ${selectedFiles.length} файлов`, {
        filesCount: selectedFiles.length,
        files: selectedFiles,
      })

      // Обрабатываем выбранные файлы и ждем результат (добавим только после обработки с метаданными)
      logger.debugSync("Начинаем обработку файлов")
      const processedFiles = await processFiles(selectedFiles).catch((error: unknown) => {
        logger.errorSync("Ошибка обработки файлов", { error: String(error) })
        return [] as MediaFile[]
      })

      logger.infoSync(`Обработка завершена. Импортировано ${processedFiles.length} файлов`, {
        processedCount: processedFiles.length,
        selectedCount: selectedFiles.length,
      })

      // Сохраняем финальные файлы для возврата
      let finalFiles: MediaFile[]

      // Если получили обработанные файлы, добавляем их в ресурсы
      if (processedFiles.length > 0) {
        logger.debugSync("Финализация обработанных файлов", { count: processedFiles.length })
        // Устанавливаем isLoadingMetadata: false для финализации
        const filesWithMetadata = processedFiles.map((file) => ({
          ...file,
          isLoadingMetadata: false,
        }))

        // Добавляем обработанные файлы в ресурсы (Resources - единственный источник истины)
        // ВАЖНО: Добавляем ТОЛЬКО ОДИН РАЗ, после полной обработки с метаданными
        logger.debugSync("Добавляем файлы в ресурсы", { count: filesWithMetadata.length })
        filesWithMetadata.forEach((file) => {
          void addMedia(file)
        })

        // Сохраняем обработанные файлы в проект
        await saveFilesToProject(filesWithMetadata)
        finalFiles = filesWithMetadata
      } else {
        logger.warnSync("Обработка не удалась, создаем базовые файлы")
        // Если обработка не удалась, создаем базовые файлы и сохраняем их
        const basicFiles = selectedFiles.map((filePath) => createBasicMediaFile(filePath))
        basicFiles.forEach((file) => {
          void addMedia(file)
        })
        await saveFilesToProject(basicFiles)
        finalFiles = basicFiles
      }

      setIsImporting(false)
      logger.infoSync("Импорт завершен успешно", { filesCount: finalFiles.length })

      return {
        success: true,
        message: `Импортировано ${finalFiles.length} файлов`,
        files: finalFiles,
      }
    } catch (error) {
      logger.errorSync("Ошибка при импорте файлов", { error: String(error) })
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте файлов: ${String(error)}`,
        files: [],
      }
    }
  }, [processFiles, saveFilesToProject, addMedia])

  /**
   * Импортирует папку с медиафайлами
   */
  const importFolder = useCallback(async (): Promise<ImportResult> => {
    logger.infoSync("Начинаем импорт папки")
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора директории
      logger.debugSync("Открываем диалог выбора директории")
      const selectedDir = await selectMediaDirectory()

      if (!selectedDir) {
        logger.warnSync("Директория не выбрана")
        setIsImporting(false)
        return {
          success: false,
          message: "Директория не выбрана",
          files: [],
        }
      }

      logger.infoSync("Начинаем сканирование директории", { directory: selectedDir })

      // Запускаем сканирование с превью
      // Backend будет отправлять события по мере обнаружения файлов и готовности метаданных
      void scanFolderWithThumbnails(selectedDir)
        .then((finalFiles) => {
          logger.infoSync(`Сканирование завершено. Обработано ${finalFiles.length} файлов`, {
            filesCount: finalFiles.length,
            directory: selectedDir,
          })
          setIsImporting(false)

          // Убеждаемся, что isLoadingMetadata установлен в false для всех файлов
          const filesWithMetadata = finalFiles.map((file) => ({
            ...file,
            isLoadingMetadata: false,
          }))

          logger.debugSync("Добавляем файлы из папки в ресурсы", { count: filesWithMetadata.length })
          // Добавляем файлы в ресурсы (Resources - единственный источник истины)
          filesWithMetadata.forEach((file) => {
            void addMedia(file)
          })

          // Сохраняем финальный список файлов в проект
          void saveFilesToProject(filesWithMetadata)
        })
        .catch((error: unknown) => {
          logger.errorSync("Ошибка сканирования папки", { error: String(error), directory: selectedDir })
          setIsImporting(false)
        })

      return {
        success: true,
        message: "Сканирование папки начато...",
        files: [], // Файлы будут добавляться через события
      }
    } catch (error) {
      logger.errorSync("Ошибка при импорте папки", { error: String(error) })
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте папки: ${String(error)}`,
        files: [],
      }
    }
  }, [scanFolderWithThumbnails, saveFilesToProject, addMedia])

  return {
    importFile,
    importFolder,
    isImporting,
    progress,
  }
}
