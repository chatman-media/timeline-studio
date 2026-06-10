/**
 * Waveform Generator Service
 *
 * Сервис для генерации визуализации аудио волны (waveform)
 * Используется для отображения аудио на таймлайне
 *
 * ✅ ОБНОВЛЕНО (2025-11-28): Использует IMediaService через container
 */

import { getMedia } from "@timeline-studio/core/container"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaInfo } from "../types"

const logger = createLogger("WaveformGenerator")

/**
 * Настройки генерации waveform
 */
export interface WaveformOptions {
  /** Ширина waveform в пикселях */
  width?: number
  /** Высота waveform в пикселях */
  height?: number
  /** Цвет waveform */
  color?: string
  /** Цвет фона */
  backgroundColor?: string
  /** Количество семплов */
  samples?: number
  /** Стиль waveform */
  style?: "bars" | "line" | "filled"
  /** Формат вывода */
  format?: "svg" | "png" | "data"
}

/**
 * Данные waveform
 */
export interface WaveformData {
  /** Массив амплитуд (0-1) */
  peaks: number[]
  /** Длительность аудио в секундах */
  duration: number
  /** Частота дискретизации */
  sampleRate: number
  /** Количество каналов */
  channels: number
  /** SVG представление (если format === 'svg') */
  svg?: string
  /** PNG base64 (если format === 'png') */
  png?: string
}

/**
 * Результат генерации waveform
 */
export interface WaveformResult {
  /** Данные waveform */
  data: WaveformData
  /** Путь к исходному файлу */
  sourcePath: string
  /** Время генерации в миллисекундах */
  generationTime: number
}

/**
 * Сервис генерации waveform
 */
export class WaveformGeneratorService {
  private cache = new Map<string, WaveformData>()

  /**
   * Генерация waveform для аудио файла
   */
  async generateWaveform(sourceFile: string | MediaInfo, options: WaveformOptions = {}): Promise<WaveformResult> {
    const startTime = Date.now()
    const sourcePath = typeof sourceFile === "string" ? sourceFile : sourceFile.path

    logger.info("Starting waveform generation", { sourcePath, options })

    try {
      // Проверяем кэш
      const cacheKey = this.getCacheKey(sourcePath, options)
      const cached = this.cache.get(cacheKey)

      if (cached) {
        logger.info("Waveform loaded from cache", { sourcePath })
        return {
          data: cached,
          sourcePath,
          generationTime: 0,
        }
      }

      const {
        width = 1000,
        height = 100,
        color = "#3b82f6",
        backgroundColor = "transparent",
        samples = 1000,
        style = "bars",
        format = "svg",
      } = options

      // ✅ Генерируем временный путь для PNG файла
      const outputPath = `/tmp/waveform_${Date.now()}.png`

      // ✅ Используем IMediaService для генерации waveform
      const resultPath = await getMedia().generateWaveformPreview(sourcePath, outputPath, {
        width,
        height,
        color,
      })

      // Читаем сгенерированный PNG файл и конвертируем в base64
      // TODO: В будущем можно добавить чтение файла для PNG формата
      // Пока возвращаем mock данные для совместимости с интерфейсом
      const waveformData: WaveformData = {
        peaks: new Array(samples).fill(0).map(() => Math.random()),
        duration: 0,
        sampleRate: 48000,
        channels: 2,
        ...(format === "png" && { png: resultPath }), // Путь к PNG файлу
      }

      // Сохраняем в кэш
      this.cache.set(cacheKey, waveformData)

      const generationTime = Date.now() - startTime

      logger.info("Waveform generation completed", {
        sourcePath,
        generationTime,
        peaksCount: waveformData.peaks.length,
      })

      return {
        data: waveformData,
        sourcePath,
        generationTime,
      }
    } catch (error) {
      logger.error("Waveform generation failed", { sourcePath, error })

      // Возвращаем пустую waveform в случае ошибки
      const fallbackData: WaveformData = {
        peaks: new Array(options.samples || 1000).fill(0),
        duration: 0,
        sampleRate: 48000,
        channels: 2,
      }

      return {
        data: fallbackData,
        sourcePath,
        generationTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Пакетная генерация waveform
   */
  async batchGenerate(
    files: Array<string | MediaInfo>,
    options: WaveformOptions & {
      onFileProgress?: (file: string | MediaInfo, progress: number) => void
      onFileComplete?: (file: string | MediaInfo, result: WaveformResult) => void
      onFileError?: (file: string | MediaInfo, error: Error) => void
    } = {},
  ): Promise<WaveformResult[]> {
    logger.info("Starting batch waveform generation", { filesCount: files.length })

    const results: WaveformResult[] = []
    const errors: Array<{ file: string | MediaInfo; error: Error }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const filePath = typeof file === "string" ? file : file.path

      try {
        // Уведомляем о прогрессе
        options.onFileProgress?.(file, (i / files.length) * 100)

        const result = await this.generateWaveform(file, options)

        results.push(result)
        options.onFileComplete?.(file, result)

        // Уведомляем о завершении
        options.onFileProgress?.(file, 100)

        logger.info(`Batch progress: ${i + 1}/${files.length} completed`)
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errors.push({ file, error: err })
        options.onFileError?.(file, err)
        logger.error("Failed to generate waveform in batch", { filePath, error })
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
   * Генерация SVG waveform
   */
  async generateSVG(sourceFile: string | MediaInfo, options: Omit<WaveformOptions, "format"> = {}): Promise<string> {
    const result = await this.generateWaveform(sourceFile, {
      ...options,
      format: "svg",
    })

    return result.data.svg || this.createFallbackSVG(options)
  }

  /**
   * Генерация PNG waveform (base64)
   */
  async generatePNG(sourceFile: string | MediaInfo, options: Omit<WaveformOptions, "format"> = {}): Promise<string> {
    const result = await this.generateWaveform(sourceFile, {
      ...options,
      format: "png",
    })

    return result.data.png || ""
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    const size = this.cache.size
    this.cache.clear()
    logger.info("Waveform cache cleared", { entriesCleared: size })
  }

  /**
   * Удалить из кэша
   */
  removeFromCache(sourcePath: string) {
    let removed = 0

    for (const key of this.cache.keys()) {
      if (key.startsWith(sourcePath)) {
        this.cache.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      logger.info("Removed waveform from cache", { sourcePath, entriesRemoved: removed })
    }
  }

  /**
   * Размер кэша
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * Создать ключ кэша
   */
  private getCacheKey(sourcePath: string, options: WaveformOptions): string {
    return `${sourcePath}_${JSON.stringify(options)}`
  }

  /**
   * Создать fallback SVG
   */
  private createFallbackSVG(options: WaveformOptions): string {
    const width = options.width || 1000
    const height = options.height || 100
    const color = options.color || "#3b82f6"
    const backgroundColor = options.backgroundColor || "transparent"

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${backgroundColor}" />
        <line x1="0" y1="${height / 2}" x2="${width}" y2="${height / 2}" stroke="${color}" stroke-width="1" />
        <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="${color}" font-size="12">
          Waveform unavailable
        </text>
      </svg>
    `.trim()
  }
}

/**
 * Singleton instance
 */
let waveformGeneratorInstance: WaveformGeneratorService | null = null

/**
 * Получить instance сервиса
 */
export function getWaveformGenerator(): WaveformGeneratorService {
  if (!waveformGeneratorInstance) {
    waveformGeneratorInstance = new WaveformGeneratorService()
  }

  return waveformGeneratorInstance
}

/**
 * TODO: Будущие улучшения
 *
 * 1. Реализация Tauri команды generate_waveform в Rust:
 *    - Использовать FFmpeg для декодирования аудио
 *    - Расчет RMS амплитуды для каждого sample
 *    - Генерация SVG/PNG
 *
 * 2. Оптимизация производительности:
 *    - Потоковая обработка больших файлов
 *    - Параллельная обработка нескольких файлов
 *    - Прогрессивная генерация (низкое качество -> высокое)
 *
 * 3. Дополнительные стили:
 *    - Спектрограмма
 *    - Частотный анализ
 *    - Стерео waveform (L/R каналы)
 *
 * 4. Интерактивность:
 *    - Zoom in/out
 *    - Выделение регионов
 *    - Playback cursor
 *
 * 5. Экспорт:
 *    - Разные форматы (SVG, PNG, WebP)
 *    - Настраиваемые цветовые схемы
 *    - Анимированные waveforms
 */
