/**
 * Proxy Generator Service
 *
 * Сервис для генерации прокси-файлов через FFmpeg
 * Создает оптимизированные версии медиафайлов для более плавного редактирования
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaInfo } from "../types"

const logger = createLogger("ProxyGenerator")

/**
 * Разрешения для прокси-файлов
 */
export type ProxyResolution = "360p" | "540p" | "720p" | "1080p" | "custom"

/**
 * Качество прокси
 */
export type ProxyQuality = "low" | "medium" | "high"

/**
 * Настройки для генерации прокси
 */
export interface ProxyGenerationOptions {
  /** Разрешение прокси-файла */
  resolution?: ProxyResolution
  /** Пользовательское разрешение (если resolution === 'custom') */
  customResolution?: { width: number; height: number }
  /** Качество прокси */
  quality?: ProxyQuality
  /** Кодек для видео */
  codec?: string
  /** Сохранить аудио */
  preserveAudio?: boolean
  /** FPS прокси-файла */
  fps?: number
  /** Callback для отслеживания прогресса (0-100) */
  onProgress?: (progress: number) => void
}

/**
 * Результат генерации прокси
 */
export interface ProxyGenerationResult {
  /** Путь к сгенерированному прокси-файлу */
  proxyPath: string
  /** Путь к исходному файлу */
  sourcePath: string
  /** Размер прокси-файла в байтах */
  size: number
  /** Разрешение прокси */
  resolution: { width: number; height: number }
  /** Время генерации в миллисекундах */
  generationTime: number
}

/**
 * Сервис для генерации прокси-файлов
 */
export class ProxyGeneratorService {
  private activeGenerations = new Map<string, AbortController>()

  /**
   * Получить разрешение по preset
   */
  private getResolution(resolution: ProxyResolution): { width: number; height: number } {
    switch (resolution) {
      case "360p":
        return { width: 640, height: 360 }
      case "540p":
        return { width: 960, height: 540 }
      case "720p":
        return { width: 1280, height: 720 }
      case "1080p":
        return { width: 1920, height: 1080 }
      default:
        return { width: 1280, height: 720 } // По умолчанию 720p
    }
  }

  /**
   * Получить bitrate по качеству
   */
  private getBitrate(quality: ProxyQuality): string {
    switch (quality) {
      case "low":
        return "1M"
      case "medium":
        return "3M"
      case "high":
        return "5M"
      default:
        return "3M"
    }
  }

  /**
   * Генерация прокси-файла
   */
  async generateProxy(
    sourceFile: string | MediaInfo,
    options: ProxyGenerationOptions = {},
  ): Promise<ProxyGenerationResult> {
    const startTime = Date.now()
    const sourcePath = typeof sourceFile === "string" ? sourceFile : sourceFile.path

    logger.info("Starting proxy generation", { sourcePath, options })

    try {
      const {
        resolution = "720p",
        customResolution,
        quality = "medium",
        codec = "h264",
        preserveAudio = true,
        fps,
        onProgress,
      } = options

      // Определяем разрешение
      const targetResolution =
        resolution === "custom" && customResolution ? customResolution : this.getResolution(resolution)

      // Создаем AbortController для возможности отмены
      const controller = new AbortController()
      this.activeGenerations.set(sourcePath, controller)

      // Вызываем Tauri команду для генерации прокси
      const result = await invoke<ProxyGenerationResult>("generate_proxy", {
        sourcePath,
        width: targetResolution.width,
        height: targetResolution.height,
        codec,
        bitrate: this.getBitrate(quality),
        preserveAudio,
        fps,
      })

      // Эмулируем прогресс (в реальной реализации это будет через события Tauri)
      if (onProgress) {
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(95, (elapsed / 10000) * 100) // Примерно 10 секунд
          onProgress(progress)
        }, 500)

        // Останавливаем интервал когда закончили
        setTimeout(() => clearInterval(interval), 100)
        onProgress(100)
      }

      const generationTime = Date.now() - startTime

      logger.info("Proxy generation completed", {
        sourcePath,
        proxyPath: result.proxyPath,
        generationTime,
      })

      return {
        ...result,
        generationTime,
      }
    } catch (error) {
      logger.error("Proxy generation failed", { sourcePath, error })
      throw error
    } finally {
      this.activeGenerations.delete(sourcePath)
    }
  }

  /**
   * Пакетная генерация прокси-файлов
   */
  async batchGenerate(
    files: Array<string | MediaInfo>,
    options: ProxyGenerationOptions & {
      onFileProgress?: (file: string | MediaInfo, progress: number) => void
      onFileComplete?: (file: string | MediaInfo, result: ProxyGenerationResult) => void
      onFileError?: (file: string | MediaInfo, error: Error) => void
    } = {},
  ): Promise<ProxyGenerationResult[]> {
    logger.info("Starting batch proxy generation", { filesCount: files.length })

    const results: ProxyGenerationResult[] = []
    const errors: Array<{ file: string | MediaInfo; error: Error }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = typeof file === "string" ? file : file.path

      try {
        const result = await this.generateProxy(file, {
          ...options,
          onProgress: (progress) => {
            options.onFileProgress?.(file, progress)
          },
        })

        results.push(result)
        options.onFileComplete?.(file, result)

        logger.info(`Batch progress: ${i + 1}/${files.length} completed`)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.push({ file, error: err })
        options.onFileError?.(file, err)
        logger.error("Failed to generate proxy in batch", { filePath, error })
      }
    }

    if (errors.length > 0) {
      logger.warn("Batch generation completed with errors", {
        totalFiles: files.length,
        successful: results.length,
        failed: errors.length,
      })
    }

    return results
  }

  /**
   * Отменить генерацию прокси
   */
  async cancelGeneration(sourcePath: string): Promise<void> {
    const controller = this.activeGenerations.get(sourcePath)

    if (controller) {
      controller.abort()
      this.activeGenerations.delete(sourcePath)
      logger.info("Proxy generation cancelled", { sourcePath })
    }
  }

  /**
   * Отменить все активные генерации
   */
  async cancelAllGenerations(): Promise<void> {
    const paths = Array.from(this.activeGenerations.keys())

    for (const path of paths) {
      await this.cancelGeneration(path)
    }

    logger.info("All proxy generations cancelled", { count: paths.length })
  }

  /**
   * Проверить, идет ли генерация для файла
   */
  isGenerating(sourcePath: string): boolean {
    return this.activeGenerations.has(sourcePath)
  }

  /**
   * Получить список файлов, для которых идет генерация
   */
  getActiveGenerations(): string[] {
    return Array.from(this.activeGenerations.keys())
  }
}

/**
 * Singleton instance
 */
let proxyGeneratorInstance: ProxyGeneratorService | null = null

/**
 * Получить instance сервиса
 */
export function getProxyGenerator(): ProxyGeneratorService {
  if (!proxyGeneratorInstance) {
    proxyGeneratorInstance = new ProxyGeneratorService()
  }

  return proxyGeneratorInstance
}
