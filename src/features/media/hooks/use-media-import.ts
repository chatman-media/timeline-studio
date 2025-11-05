import { useCallback, useState } from "react"

import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { selectMediaDirectory, selectMediaFile } from "@/features/media"
import { useMediaPreview } from "@/features/media/hooks/use-media-preview"
import { type DiscoveredFile, useMediaProcessor } from "@/features/media/hooks/use-media-processor"
import type { MediaFile } from "@/features/media/types/media"
import { convertToSavedMediaFile } from "@/features/media/utils/saved-media-utils"
import { useResources } from "@/features/resources/services/resources-provider"

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

    return {
      id: filePath,
      name: fileName,
      path: filePath,
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
        console.log(`Обнаружено ${discoveredFiles.length} файлов`)

        const basicFiles = discoveredFiles.map((file) => createBasicMediaFile(file.path, file.size))

        // Добавляем файлы в ресурсы для синхронизации с проектом (Resources - единственный источник истины)
        basicFiles.forEach((file) => {
          void addMedia(file)
        })
      },
      [addMedia],
    ),

    // Когда готовы метаданные - обновляем конкретный файл
    onMetadataReady: useCallback(
      (fileId: string, metadata: MediaFile) => {
        console.log(`Метаданные готовы для: ${metadata.name}`)

        // Обновляем существующий файл, сохраняя его id
        const updatedFile: MediaFile = {
          ...metadata,
          id: fileId,
          isLoadingMetadata: false,
        }

        // Обновляем файл в ресурсах для синхронизации с проектом (Resources - единственный источник истины)
        void addMedia(updatedFile)
      },
      [addMedia],
    ),

    // Когда готово превью - обновляем путь и генерируем через Preview Manager
    onThumbnailReady: useCallback(
      (fileId: string, _thumbnailPath: string) => {
        console.log(`Превью готово для: ${fileId}, но пока не можем обновить без доступа к файлу`)

        // TODO: Нужен способ получить текущий файл по ID для обновления thumbnail
        // Пока просто логируем для отладки
      },
      [generateThumbnail],
    ),

    // Обработка ошибок
    onError: useCallback((fileId: string, error: string) => {
      console.error(`Ошибка обработки файла ${fileId}:`, error)

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
        return
      }

      try {
        const savedFiles = await Promise.all(
          files.map((file) => convertToSavedMediaFile(file, currentProject?.path || undefined)),
        )

        console.log(`Сохранено ${savedFiles.length} медиафайлов в проект`)
        setProjectDirty(true)
      } catch (error) {
        console.error("Ошибка при сохранении файлов в проект:", error)
      }
    },
    [currentProject?.path, setProjectDirty],
  )

  /**
   * Импортирует медиафайлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора файлов
      const selectedFiles = await selectMediaFile()

      if (!selectedFiles || selectedFiles.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          files: [],
        }
      }

      console.log(`Выбрано ${selectedFiles.length} файлов`)

      // Создаем базовые файлы для мгновенного отображения
      const basicFiles = selectedFiles.map((filePath) => createBasicMediaFile(filePath))

      // Добавляем файлы в ресурсы для синхронизации с проектом (Resources - единственный источник истины)
      basicFiles.forEach((file) => {
        void addMedia(file)
      })

      // Обрабатываем выбранные файлы и ждем результат
      const processedFiles = await processFiles(selectedFiles).catch((error: unknown) => {
        console.error("Ошибка обработки файлов:", error)
        return [] as MediaFile[]
      })

      console.log(`Обработка завершена. Импортировано ${processedFiles.length} файлов`)

      // Если получили обработанные файлы, обновляем их в ресурсах
      if (processedFiles.length > 0) {
        // Обновляем файлы, устанавливая isLoadingMetadata: false
        const filesWithMetadata = processedFiles.map((file) => ({
          ...file,
          isLoadingMetadata: false,
        }))

        // Добавляем обработанные файлы в ресурсы (Resources - единственный источник истины)
        filesWithMetadata.forEach((file) => {
          void addMedia(file)
        })

        // Сохраняем обработанные файлы в проект
        await saveFilesToProject(filesWithMetadata)
      } else {
        // Если обработка не удалась, сохраняем хотя бы базовые файлы
        await saveFilesToProject(basicFiles)
      }

      setIsImporting(false)

      return {
        success: true,
        message: `Импортируется ${basicFiles.length} файлов...`,
        files: basicFiles,
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов:", error)
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
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора директории
      const selectedDir = await selectMediaDirectory()

      if (!selectedDir) {
        setIsImporting(false)
        return {
          success: false,
          message: "Директория не выбрана",
          files: [],
        }
      }

      console.log("Начинаем сканирование директории:", selectedDir)

      // Запускаем сканирование с превью
      // Backend будет отправлять события по мере обнаружения файлов и готовности метаданных
      void scanFolderWithThumbnails(selectedDir)
        .then((finalFiles) => {
          console.log(`Сканирование завершено. Обработано ${finalFiles.length} файлов`)
          setIsImporting(false)

          // Убеждаемся, что isLoadingMetadata установлен в false для всех файлов
          const filesWithMetadata = finalFiles.map((file) => ({
            ...file,
            isLoadingMetadata: false,
          }))

          // Добавляем файлы в ресурсы (Resources - единственный источник истины)
          filesWithMetadata.forEach((file) => {
            void addMedia(file)
          })

          // Сохраняем финальный список файлов в проект
          void saveFilesToProject(filesWithMetadata)
        })
        .catch((error: unknown) => {
          console.error("Ошибка сканирования папки:", error)
          setIsImporting(false)
        })

      return {
        success: true,
        message: "Сканирование папки начато...",
        files: [], // Файлы будут добавляться через события
      }
    } catch (error) {
      console.error("Ошибка при импорте папки:", error)
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
