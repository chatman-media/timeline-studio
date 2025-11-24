/**
 * Smart Organization Service
 *
 * Сервис для интеллектуальной организации медиафайлов
 * Группировка по дате, камере, событиям и другим критериям
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaInfo } from "../types"
import { getMediaMetadataService } from "./media-metadata-service"

const logger = createLogger("SmartOrganization")

/**
 * Формат даты для организации
 */
export type DateFormat = "YYYY-MM-DD" | "YYYY/MM/DD" | "YYYYMMDD" | "YYYY-MM" | "YYYY"

/**
 * Группа файлов
 */
export interface MediaGroup {
  /** Название группы */
  name: string
  /** Файлы в группе */
  files: MediaInfo[]
  /** Дата создания группы */
  date?: Date
  /** Метаданные группы */
  metadata?: Record<string, any>
}

/**
 * Опции для организации по дате
 */
export interface OrganizeByDateOptions {
  /** Формат даты для папок */
  format?: DateFormat
  /** Использовать дату создания файла */
  useCreationDate?: boolean
  /** Использовать дату модификации файла */
  useModificationDate?: boolean
  /** Использовать EXIF дату (для фото/видео) */
  useExifDate?: boolean
  /** Создавать подпапки */
  createFolders?: boolean
}

/**
 * Опции для организации по событиям
 */
export interface OrganizeByEventsOptions {
  /** Определять события по timestamp gaps */
  detectByTimestamp?: boolean
  /** Порог разрыва между событиями (в секундах) */
  gapThreshold?: number
  /** Минимальное количество файлов в событии */
  minFilesPerEvent?: number
  /** Создавать папки для событий */
  createFolders?: boolean
}

/**
 * Опции для организации по типу камеры
 */
export interface OrganizeByCameraOptions {
  /** Создавать папки по моделям камер */
  createFolders?: boolean
  /** Группировать по производителю */
  groupByManufacturer?: boolean
}

/**
 * Результат организации
 */
export interface OrganizationResult {
  /** Созданные группы */
  groups: MediaGroup[]
  /** Количество обработанных файлов */
  processedFiles: number
  /** Количество созданных папок */
  createdFolders: number
  /** Время организации (мс) */
  duration: number
}

/**
 * Сервис для интеллектуальной организации медиафайлов
 */
export class SmartOrganizationService {
  /**
   * Организация файлов по дате
   */
  async organizeByDate(files: MediaInfo[], options: OrganizeByDateOptions = {}): Promise<OrganizationResult> {
    const startTime = Date.now()

    logger.info("Organizing files by date", { filesCount: files.length, options })

    try {
      const {
        format = "YYYY-MM-DD",
        useCreationDate = true,
        useModificationDate = false,
        useExifDate = true,
        createFolders = false,
      } = options

      // Группируем файлы по датам
      const groupsMap = new Map<string, MediaInfo[]>()

      for (const file of files) {
        try {
          // Получаем дату файла
          const date = await this.extractFileDate(file, {
            useCreationDate,
            useModificationDate,
            useExifDate,
          })

          if (!date) {
            logger.warn("Could not determine date for file", { filePath: file.path })
            continue
          }

          // Форматируем дату
          const dateKey = this.formatDate(date, format)

          // Добавляем в группу
          const groupFiles = groupsMap.get(dateKey) || []
          groupFiles.push(file)
          groupsMap.set(dateKey, groupFiles)
        } catch (error) {
          logger.error("Failed to process file date", { filePath: file.path, error })
        }
      }

      // Создаем группы
      const groups: MediaGroup[] = Array.from(groupsMap.entries()).map(([dateKey, groupFiles]) => ({
        name: dateKey,
        files: groupFiles,
        date: this.parseFormattedDate(dateKey, format),
      }))

      // Сортируем группы по дате
      groups.sort((a, b) => {
        if (!a.date || !b.date) return 0
        return a.date.getTime() - b.date.getTime()
      })

      const duration = Date.now() - startTime

      logger.info("Files organized by date", {
        groupsCount: groups.length,
        processedFiles: files.length,
        duration,
      })

      return {
        groups,
        processedFiles: files.length,
        createdFolders: createFolders ? groups.length : 0,
        duration,
      }
    } catch (error) {
      logger.error("Failed to organize files by date", { error })
      throw error
    }
  }

  /**
   * Организация файлов по событиям
   */
  async organizeByEvents(files: MediaInfo[], options: OrganizeByEventsOptions = {}): Promise<OrganizationResult> {
    const startTime = Date.now()

    logger.info("Organizing files by events", { filesCount: files.length, options })

    try {
      const { detectByTimestamp = true, gapThreshold = 3600, minFilesPerEvent = 1, createFolders = false } = options

      if (!detectByTimestamp) {
        throw new Error("Only timestamp-based event detection is currently supported")
      }

      // Получаем timestamps для всех файлов
      const filesWithTimestamps = await Promise.all(
        files.map(async (file) => ({
          file,
          timestamp: await this.getFileTimestamp(file),
        })),
      )

      // Сортируем файлы по дате
      const sortedFiles = filesWithTimestamps
        .filter((item) => item.timestamp !== null)
        .sort((a, b) => a.timestamp! - b.timestamp!)
        .map((item) => item.file)

      // Группируем по событиям
      const events: MediaGroup[] = []
      let currentEvent: MediaInfo[] = []
      let lastTimestamp: number | null = null

      for (const file of sortedFiles) {
        const timestamp = await this.getFileTimestamp(file)

        if (!timestamp) {
          continue
        }

        if (lastTimestamp === null) {
          // Первый файл - начинаем новое событие
          currentEvent = [file]
          lastTimestamp = timestamp
        } else {
          const gap = (timestamp - lastTimestamp) / 1000 // в секундах

          if (gap > gapThreshold) {
            // Разрыв больше порога - завершаем текущее событие
            if (currentEvent.length >= minFilesPerEvent) {
              events.push({
                name: `Event ${events.length + 1}`,
                files: currentEvent,
              })
            }

            // Начинаем новое событие
            currentEvent = [file]
          } else {
            // Добавляем в текущее событие
            currentEvent.push(file)
          }

          lastTimestamp = timestamp
        }
      }

      // Добавляем последнее событие
      if (currentEvent.length >= minFilesPerEvent) {
        events.push({
          name: `Event ${events.length + 1}`,
          files: currentEvent,
        })
      }

      const duration = Date.now() - startTime

      logger.info("Files organized by events", {
        eventsCount: events.length,
        processedFiles: files.length,
        duration,
      })

      return {
        groups: events,
        processedFiles: files.length,
        createdFolders: createFolders ? events.length : 0,
        duration,
      }
    } catch (error) {
      logger.error("Failed to organize files by events", { error })
      throw error
    }
  }

  /**
   * Организация файлов по типу камеры
   */
  async organizeByCameraType(files: MediaInfo[], options: OrganizeByCameraOptions = {}): Promise<OrganizationResult> {
    const startTime = Date.now()

    logger.info("Organizing files by camera type", {
      filesCount: files.length,
      options,
    })

    try {
      const { createFolders = false, groupByManufacturer = false } = options

      // Группируем по камере
      const groupsMap = new Map<string, MediaInfo[]>()

      for (const file of files) {
        try {
          const cameraInfo = await this.extractCameraInfo(file)

          if (!cameraInfo) {
            // Файлы без информации о камере идут в группу "Unknown"
            const unknownFiles = groupsMap.get("Unknown") || []
            unknownFiles.push(file)
            groupsMap.set("Unknown", unknownFiles)
            continue
          }

          const groupKey = groupByManufacturer
            ? cameraInfo.manufacturer || "Unknown"
            : cameraInfo.model || cameraInfo.manufacturer || "Unknown"

          const groupFiles = groupsMap.get(groupKey) || []
          groupFiles.push(file)
          groupsMap.set(groupKey, groupFiles)
        } catch (error) {
          logger.error("Failed to extract camera info", { filePath: file.path, error })
        }
      }

      // Создаем группы
      const groups: MediaGroup[] = Array.from(groupsMap.entries()).map(([name, groupFiles]) => ({
        name,
        files: groupFiles,
      }))

      // Сортируем группы по названию
      groups.sort((a, b) => a.name.localeCompare(b.name))

      const duration = Date.now() - startTime

      logger.info("Files organized by camera type", {
        groupsCount: groups.length,
        processedFiles: files.length,
        duration,
      })

      return {
        groups,
        processedFiles: files.length,
        createdFolders: createFolders ? groups.length : 0,
        duration,
      }
    } catch (error) {
      logger.error("Failed to organize files by camera type", { error })
      throw error
    }
  }

  /**
   * Извлечь дату файла
   */
  private async extractFileDate(
    file: MediaInfo,
    options: Pick<OrganizeByDateOptions, "useCreationDate" | "useModificationDate" | "useExifDate">,
  ): Promise<Date | null> {
    try {
      const { useCreationDate, useModificationDate, useExifDate } = options

      // 1. Приоритет: EXIF дата (для фото/видео) если включена
      if (useExifDate && (file.type === "Video" || file.type === "Image")) {
        try {
          const metadataService = getMediaMetadataService()
          const metadata = await metadataService.extractMetadata(file.path)

          // Проверяем creation_time в метаданных
          if ("creation_time" in metadata && metadata.creation_time) {
            const date = new Date(metadata.creation_time)
            if (!Number.isNaN(date.getTime())) {
              return date
            }
          }
        } catch (error) {
          logger.warn("Failed to extract EXIF date", { filePath: file.path, error })
        }
      }

      // 2. Используем дату из существующих метаданных файла, если есть
      if (file.metadata && "creation_time" in file.metadata && file.metadata.creation_time) {
        const date = new Date(file.metadata.creation_time)
        if (!Number.isNaN(date.getTime())) {
          return date
        }
      }

      // 3. Получаем статистику файла через Tauri
      const fileStats = await invoke<{ size: number; lastModified: number }>("get_file_stats", {
        path: file.path,
      })

      // Используем дату модификации если включена или как fallback
      if (fileStats.lastModified && (useModificationDate || useCreationDate)) {
        return new Date(fileStats.lastModified)
      }

      return null
    } catch (error) {
      logger.error("Failed to extract file date", { filePath: file.path, error })
      return null
    }
  }

  /**
   * Получить timestamp файла
   */
  private async getFileTimestamp(file: MediaInfo): Promise<number | null> {
    try {
      // Используем extractFileDate с приоритетом EXIF данных
      const date = await this.extractFileDate(file, {
        useCreationDate: true,
        useModificationDate: true,
        useExifDate: true,
      })

      return date ? date.getTime() : null
    } catch (error) {
      logger.warn("Failed to get file timestamp", { filePath: file.path, error })
      return null
    }
  }

  /**
   * Извлечь информацию о камере
   */
  private async extractCameraInfo(file: MediaInfo): Promise<{ manufacturer?: string; model?: string } | null> {
    try {
      // Информация о камере доступна только для фото и видео
      if (file.type !== "Video" && file.type !== "Image") {
        return null
      }

      // Пытаемся извлечь метаданные через сервис
      const metadataService = getMediaMetadataService()
      const metadata = await metadataService.extractMetadata(file.path)

      // Извлекаем информацию о камере из codec или других полей
      let manufacturer: string | undefined
      let model: string | undefined

      // Для видео можем использовать информацию из codec
      if (metadata.type === "Video" && metadata.codec) {
        const codecLower = metadata.codec.toLowerCase()

        // Определяем производителя по codec
        if (codecLower.includes("apple") || codecLower.includes("prores")) {
          manufacturer = "Apple"
        } else if (codecLower.includes("gopro")) {
          manufacturer = "GoPro"
        } else if (codecLower.includes("dji")) {
          manufacturer = "DJI"
        } else if (codecLower.includes("sony")) {
          manufacturer = "Sony"
        } else if (codecLower.includes("canon")) {
          manufacturer = "Canon"
        }

        model = metadata.codec
      }

      // Если есть поля в базовых метаданных (они могут добавляться в будущем)
      if (metadata.artist) {
        manufacturer = metadata.artist
      }
      if (metadata.album) {
        model = metadata.album
      }

      // Возвращаем результат только если есть хоть какая-то информация
      if (manufacturer || model) {
        return { manufacturer, model }
      }

      return null
    } catch (error) {
      logger.warn("Failed to extract camera info", { filePath: file.path, error })
      return null
    }
  }

  /**
   * Форматировать дату
   */
  private formatDate(date: Date, format: DateFormat): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`
      case "YYYY/MM/DD":
        return `${year}/${month}/${day}`
      case "YYYYMMDD":
        return `${year}${month}${day}`
      case "YYYY-MM":
        return `${year}-${month}`
      case "YYYY":
        return `${year}`
      default:
        return `${year}-${month}-${day}`
    }
  }

  /**
   * Парсить отформатированную дату обратно
   */
  private parseFormattedDate(dateStr: string, format: DateFormat): Date | undefined {
    try {
      switch (format) {
        case "YYYY-MM-DD": {
          const [year, month, day] = dateStr.split("-").map(Number)
          return new Date(year, month - 1, day)
        }
        case "YYYY/MM/DD": {
          const [year, month, day] = dateStr.split("/").map(Number)
          return new Date(year, month - 1, day)
        }
        case "YYYYMMDD": {
          const year = Number(dateStr.substring(0, 4))
          const month = Number(dateStr.substring(4, 6))
          const day = Number(dateStr.substring(6, 8))
          return new Date(year, month - 1, day)
        }
        case "YYYY-MM": {
          const [year, month] = dateStr.split("-").map(Number)
          return new Date(year, month - 1, 1)
        }
        case "YYYY": {
          const year = Number(dateStr)
          return new Date(year, 0, 1)
        }
        default:
          return undefined
      }
    } catch {
      return undefined
    }
  }
}

/**
 * Singleton instance
 */
let smartOrganizationInstance: SmartOrganizationService | null = null

/**
 * Получить instance сервиса
 */
export function getSmartOrganization(): SmartOrganizationService {
  if (!smartOrganizationInstance) {
    smartOrganizationInstance = new SmartOrganizationService()
  }

  return smartOrganizationInstance
}

/**
 * Будущие улучшения:
 *
 * 1. Расширенная интеграция с metadata extraction:
 *    - GPS координаты для геогруппировки
 *    - Расширенные EXIF данные (выдержка, ISO, диафрагма)
 *    - Полная информация о камере из EXIF (не только из codec)
 * 2. Машинное обучение для группировки по содержимому:
 *    - Определение похожих сцен
 *    - Группировка людей (face recognition)
 *    - Определение активности (спорт, путешествие, событие)
 * 3. Умное именование событий:
 *    - На основе геолокации ("Paris Trip", "Home")
 *    - На основе календаря ("Christmas 2024", "Birthday Party")
 * 4. Автоматическая организация при импорте
 * 5. Предложения по организации на основе анализа
 * 6. Bulk операции для реорганизации
 * 7. Отмена организации (undo)
 * 8. Экспорт организованной структуры
 */
