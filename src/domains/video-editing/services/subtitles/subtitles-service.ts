/**
 * Subtitles Service
 *
 * Сервис для экспорта и импорта субтитров.
 * Содержит бизнес-логику работы с Tauri командами.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("SubtitlesService")

/**
 * Опции экспорта субтитров
 */
export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass"
  content: string
  output_path: string
}

/**
 * Параметры обновления субтитров на треке
 */
export interface UpdateTimelineSubtitlesParams {
  trackId: string
  subtitles: any[]
}

/**
 * Сервис для работы с субтитрами
 */
export class SubtitlesService {
  /**
   * Сохраняет субтитры в файл через Tauri команду
   *
   * @param options - Опции экспорта (формат, контент, путь)
   * @returns Promise<void>
   * @throws Error при ошибке сохранения
   */
  static async saveSubtitleFile(options: SubtitleExportOptions): Promise<void> {
    logger.info("Сохранение файла субтитров", {
      format: options.format,
      outputPath: options.output_path,
      contentLength: options.content.length,
    })

    try {
      await invoke("save_subtitle_file", { options })
      logger.info("Файл субтитров успешно сохранён", { outputPath: options.output_path })
    } catch (error) {
      logger.error("Ошибка при сохранении файла субтитров", { error, options })
      throw error
    }
  }

  /**
   * Обновляет субтитры на треке таймлайна через Tauri команду
   *
   * @param params - Параметры обновления (trackId, subtitles)
   * @returns Promise<void>
   * @throws Error при ошибке обновления
   */
  static async updateTimelineSubtitles(params: UpdateTimelineSubtitlesParams): Promise<void> {
    logger.info("Обновление субтитров на треке", {
      trackId: params.trackId,
      subtitlesCount: params.subtitles.length,
    })

    try {
      await invoke("update_timeline_subtitles", {
        trackId: params.trackId,
        subtitles: params.subtitles,
      })
      logger.info("Субтитры успешно обновлены", { trackId: params.trackId })
    } catch (error) {
      logger.error("Ошибка при обновлении субтитров", { error, params })
      throw error
    }
  }
}
