/**
 * Camera Import Service
 *
 * Сервис для импорта файлов с камеры и других устройств
 * Интегрируется с camera-capture feature и media management
 */

import { invoke } from "@tauri-apps/api/core"
import { getMedia } from "@timeline-studio/core/container"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaImportOptions, MediaInfo } from "../types"

const logger = createLogger("CameraImport")

/**
 * Информация об устройстве (камере)
 */
export interface CameraDevice {
  /** ID устройства */
  id: string
  /** Название устройства */
  name: string
  /** Тип устройства */
  type: "camera" | "phone" | "sd-card" | "external-drive"
  /** Путь к устройству в файловой системе */
  mountPath?: string
  /** Производитель */
  manufacturer?: string
  /** Модель */
  model?: string
  /** Доступное место (в байтах) */
  availableSpace?: number
  /** Общий объем (в байтах) */
  totalSpace?: number
}

/**
 * Файл на камере
 */
export interface CameraFile {
  /** Путь к файлу на устройстве */
  path: string
  /** Название файла */
  name: string
  /** Размер файла в байтах */
  size: number
  /** Дата создания */
  createdAt: Date
  /** Дата модификации */
  modifiedAt?: Date
  /** Тип файла */
  type: "video" | "image" | "audio" | "unknown"
  /** Thumbnail (если доступен) */
  thumbnail?: string
}

/**
 * Опции импорта с камеры
 */
export interface CameraImportOptions extends MediaImportOptions {
  /** Удалить файлы с устройства после импорта */
  deleteAfterImport?: boolean
  /** Организовать по модели камеры */
  organizeByCameraModel?: boolean
  /** Организовать по дате съемки */
  organizeByDate?: boolean
  /** Формат папок по дате */
  dateFormat?: "YYYY-MM-DD" | "YYYY/MM/DD" | "YYYYMMDD"
  /** Импортировать только выбранные файлы */
  selectedFiles?: string[]
  /** Проверять дубликаты по хэшу */
  checkDuplicates?: boolean
}

/**
 * Результат импорта с камеры
 */
export interface CameraImportResult {
  /** Импортированные файлы */
  imported: MediaInfo[]
  /** Пропущенные файлы (дубликаты) */
  skipped: CameraFile[]
  /** Файлы с ошибками */
  failed: Array<{ file: CameraFile; error: string }>
  /** Общее количество обработанных файлов */
  totalProcessed: number
  /** Время импорта (мс) */
  duration: number
}

/**
 * Сервис для импорта с камер и устройств
 */
export class CameraImportService {
  /**
   * Определить доступные камеры и устройства
   */
  async detectCameras(): Promise<CameraDevice[]> {
    logger.info("Detecting cameras and devices")

    try {
      // TODO: Реализовать определение камер через Tauri
      // В текущей версии возвращаем пустой массив
      // В будущем можно интегрировать с:
      // - USB устройствами
      // - SD картами
      // - Сетевыми камерами
      // - Мобильными устройствами через WiFi/USB

      const devices = await invoke<CameraDevice[]>("detect_camera_devices").catch(() => [])

      logger.info("Cameras detected", { count: devices.length })
      return devices
    } catch (error) {
      logger.error("Failed to detect cameras", { error })
      return []
    }
  }

  /**
   * Получить список файлов на камере
   */
  async listCameraFiles(device: CameraDevice): Promise<CameraFile[]> {
    logger.info("Listing camera files", { deviceId: device.id, deviceName: device.name })

    try {
      if (!device.mountPath) {
        throw new Error("Device mount path is not available")
      }

      // TODO: Реализовать чтение файлов с устройства
      // Пока используем заглушку
      const files = await invoke<CameraFile[]>("list_camera_files", {
        deviceId: device.id,
        mountPath: device.mountPath,
      }).catch(() => [])

      logger.info("Camera files listed", {
        deviceId: device.id,
        filesCount: files.length,
      })

      return files
    } catch (error) {
      logger.error("Failed to list camera files", { deviceId: device.id, error })
      throw error
    }
  }

  /**
   * Импорт файлов с камеры
   */
  async importFromCamera(device: CameraDevice, options: CameraImportOptions = {}): Promise<CameraImportResult> {
    const startTime = Date.now()

    logger.info("Starting camera import", {
      deviceId: device.id,
      deviceName: device.name,
      options,
    })

    try {
      // Получаем список файлов с устройства
      const allFiles = await this.listCameraFiles(device)

      // Фильтруем файлы если указаны selectedFiles
      const filesToImport = options.selectedFiles
        ? allFiles.filter((file) => options.selectedFiles!.includes(file.path))
        : allFiles

      logger.info("Files to import", { count: filesToImport.length })

      const imported: MediaInfo[] = []
      const skipped: CameraFile[] = []
      const failed: Array<{ file: CameraFile; error: string }> = []

      // TODO: Реализовать фактический импорт
      // Пока это заглушка для базовой интеграции

      for (const file of filesToImport) {
        try {
          // TODO: Копирование файла с устройства
          // TODO: Проверка дубликатов
          // TODO: Организация по дате/модели
          // TODO: Генерация метаданных
          // TODO: Удаление с устройства (если deleteAfterImport)

          logger.info("Importing file", { fileName: file.name })

          // Заглушка: создаем MediaInfo
          const mediaInfo: MediaInfo = {
            path: file.path,
            name: file.name,
            type: file.type === "video" ? "Video" : file.type === "audio" ? "Audio" : "Image",
            // id будет добавлен backend при импорте через MediaAdded событие
          }

          imported.push(mediaInfo)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          failed.push({ file, error: errorMessage })
          logger.error("Failed to import file", { fileName: file.name, error })
        }
      }

      const duration = Date.now() - startTime

      const result: CameraImportResult = {
        imported,
        skipped,
        failed,
        totalProcessed: filesToImport.length,
        duration,
      }

      logger.info("Camera import completed", {
        imported: imported.length,
        skipped: skipped.length,
        failed: failed.length,
        duration,
      })

      return result
    } catch (error) {
      logger.error("Camera import failed", { deviceId: device.id, error })
      throw error
    }
  }

  /**
   * Проверить доступность устройства
   */
  async isDeviceAvailable(deviceId: string): Promise<boolean> {
    try {
      const devices = await this.detectCameras()
      return devices.some((device) => device.id === deviceId)
    } catch (error) {
      logger.error("Failed to check device availability", { deviceId, error })
      return false
    }
  }

  /**
   * Безопасное извлечение устройства
   */
  async ejectDevice(device: CameraDevice): Promise<void> {
    logger.info("Ejecting device", { deviceId: device.id, deviceName: device.name })

    try {
      // Используем media сервис для извлечения устройства
      await getMedia()
        .ejectDevice(device.id)
        .catch(() => {
          logger.warn("Eject command not implemented yet")
        })

      logger.info("Device ejected", { deviceId: device.id })
    } catch (error) {
      logger.error("Failed to eject device", { deviceId: device.id, error })
      throw error
    }
  }
}

/**
 * Singleton instance
 */
let cameraImportInstance: CameraImportService | null = null

/**
 * Получить instance сервиса
 */
export function getCameraImport(): CameraImportService {
  if (!cameraImportInstance) {
    cameraImportInstance = new CameraImportService()
  }

  return cameraImportInstance
}

/**
 * TODO: Будущие улучшения
 *
 * 1. Полная интеграция с camera-capture feature
 * 2. Поддержка различных типов устройств:
 *    - USB камеры
 *    - SD карты
 *    - Сетевые камеры (FTP/SMB)
 *    - Мобильные устройства (через WiFi/USB)
 * 3. Автоматическое определение устройств при подключении
 * 4. Предпросмотр файлов перед импортом
 * 5. Умная группировка файлов:
 *    - По дате съемки
 *    - По модели камеры
 *    - По событиям (gaps в timestamps)
 * 6. Проверка дубликатов по хэшу файла
 * 7. Восстановление прерванного импорта
 * 8. Batch обработка для производительности
 * 9. Интеграция с metadata extraction
 * 10. Поддержка RAW форматов (.CR2, .NEF, .ARW, etc.)
 */
