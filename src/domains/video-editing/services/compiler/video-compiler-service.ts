/**
 * Сервис для работы с Video Compiler (Rust backend)
 */

import { ProjectSchema, type RenderProgress, RenderStatus } from "@/domains/video-editing/types/video-compiler"
import { createLogger } from "@/lib/tauri-logger"
import {
  cancelRender as cancelRenderTauri,
  checkGpuEncoderAvailability as checkGpuEncoderAvailabilityTauri,
  clearMediaMetadataCache as clearMediaMetadataCacheTauri,
  clearPrerenderCache as clearPrerenderCacheTauri,
  generatePreview as generatePreviewTauri,
  getActiveJobs as getActiveJobsTauri,
  getGpuCapabilitiesFull as getGpuCapabilitiesFullTauri,
  getPrerenderCacheInfo as getPrerenderCacheInfoTauri,
  getRenderJob as getRenderJobTauri,
  getRenderProgress as getRenderProgressTauri,
  prerenderSegment as prerenderSegmentTauri,
  renderProject as renderProjectTauri,
  updateCompilerSettings as updateCompilerSettingsTauri,
} from "../../tauri/compiler-commands"

const logger = createLogger("VideoCompilerService")

/**
 * Запуск рендеринга проекта
 */
export async function renderProject(project: ProjectSchema, outputPath: string): Promise<string> {
  try {
    const jobId = await renderProjectTauri(project, outputPath)
    return jobId
  } catch (error) {
    void logger.error("Failed to start video compilation:", { error })
    throw error
  }
}

/**
 * Отслеживание прогресса рендеринга
 */
export async function trackRenderProgress(
  jobId: string,
  onProgress: (progress: RenderProgress) => void,
): Promise<void> {
  const checkProgress = async () => {
    try {
      const progress = await getRenderProgressTauri(jobId)

      if (progress) {
        onProgress(progress)

        // Если рендеринг еще идет, проверяем снова через 500ms
        if (progress.status === RenderStatus.Processing) {
          setTimeout(checkProgress, 500)
        }
      }
    } catch (error) {
      void logger.error("Failed to get render progress:", { error })
    }
  }

  // Начинаем отслеживание
  void checkProgress()
}

/**
 * Генерация превью кадра
 */
export async function generatePreview(
  project: ProjectSchema,
  timestamp: number,
  quality?: number,
): Promise<Uint8Array> {
  try {
    const jpegData = await generatePreviewTauri(project, timestamp, quality)
    return new Uint8Array(jpegData)
  } catch (error) {
    void logger.error("Failed to generate preview:", { error })
    throw error
  }
}

/**
 * Отмена рендеринга
 */
export async function cancelRender(jobId: string): Promise<boolean> {
  try {
    return await cancelRenderTauri(jobId)
  } catch (error) {
    void logger.error("Failed to cancel render:", { error })
    return false
  }
}

/**
 * Получение списка активных задач
 */
export async function getActiveJobs() {
  try {
    return await getActiveJobsTauri()
  } catch (error) {
    void logger.error("Failed to get active jobs:", { error })
    throw error
  }
}

/**
 * Получение информации о задаче
 */
export async function getRenderJob(jobId: string) {
  try {
    return await getRenderJobTauri(jobId)
  } catch (error) {
    void logger.error("Failed to get render job:", { error })
    return null
  }
}

/**
 * Параметры для пререндера сегмента
 */
export interface PrerenderRequest {
  projectSchema: ProjectSchema
  startTime: number
  endTime: number
  outputPath: string // Путь к выходному файлу (требуется Rust командой)
  applyEffects?: boolean // Опционально - применять ли эффекты
  quality?: number // Опционально - качество рендера
}

/**
 * Результат пререндера
 */
export interface PrerenderResult {
  filePath: string
  duration: number
  fileSize: number
  renderTimeMs: number
}

/**
 * Пререндер сегмента видео для быстрого предпросмотра
 */
export async function prerenderSegment(request: PrerenderRequest): Promise<PrerenderResult> {
  try {
    logger.info("VIDEO-COMPILER-SERVICE prerenderSegment called", {
      hasProjectSchema: !!request?.projectSchema,
      hasOutputPath: !!request?.outputPath,
      startTime: request?.startTime,
      endTime: request?.endTime,
      requestKeys: Object.keys(request || {}),
      requestType: typeof request,
    })

    // Передаем объект request напрямую - он уже в правильном camelCase формате
    const result = await prerenderSegmentTauri(request)

    return result
  } catch (error) {
    void logger.error("Failed to prerender segment:", { error })
    throw error
  }
}

/**
 * Информация о кеше пререндеров
 */
export interface PrerenderCacheInfo {
  fileCount: number
  totalSize: number
  files: PrerenderCacheFile[]
}

/**
 * Информация о файле в кеше
 */
export interface PrerenderCacheFile {
  path: string
  size: number
  created: number
  startTime: number
  endTime: number
}

/**
 * Получить информацию о кеше пререндеров
 */
export async function getPrerenderCacheInfo(): Promise<PrerenderCacheInfo> {
  const result = await getPrerenderCacheInfoTauri()

  return {
    fileCount: result.file_count || 0,
    totalSize: result.total_size || 0,
    files: (result.files || []).map((f: any) => ({
      path: f.path,
      size: f.size,
      created: f.created,
      startTime: f.start_time,
      endTime: f.end_time,
    })),
  }
}

/**
 * Очистить кеш пререндеров
 * @returns Размер удаленных файлов в байтах
 */
export async function clearPrerenderCache(): Promise<number> {
  return await clearPrerenderCacheTauri()
}

/**
 * Проверка возможностей GPU (использует get_gpu_capabilities_full)
 */
export async function checkGpuCapabilities() {
  try {
    return await getGpuCapabilitiesFullTauri()
  } catch (error) {
    void logger.error("Failed to get GPU capabilities:", { error })
    throw error
  }
}

/**
 * Обновление настроек компилятора (использует update_compiler_settings_advanced)
 */
export async function updateCompilerSettings(settings: any) {
  try {
    return await updateCompilerSettingsTauri(settings)
  } catch (error) {
    void logger.error("Failed to update compiler settings:", { error })
    throw error
  }
}

/**
 * Проверка доступности GPU кодировщика
 */
export async function checkGpuEncoderAvailability(_encoder: string) {
  try {
    return await checkGpuEncoderAvailabilityTauri()
  } catch (error) {
    void logger.error("Failed to check GPU encoder availability:", { error })
    throw error
  }
}

/**
 * Очистка кеша метаданных медиа
 */
export async function clearMediaMetadataCache() {
  try {
    return await clearMediaMetadataCacheTauri()
  } catch (error) {
    void logger.error("Failed to clear media metadata cache:", { error })
    throw error
  }
}
