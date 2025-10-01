/**
 * Сервис для работы с Video Compiler (Rust backend)
 */

import { invoke } from "@tauri-apps/api/core"
import { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import type { RenderProgress } from "../types/render"
import { RenderStatus } from "../types/render"

/**
 * Запуск рендеринга проекта
 */
export async function renderProject(project: ProjectSchema, outputPath: string): Promise<string> {
  try {
    const jobId = await invoke<string>("compile_video", {
      projectSchema: project,
      outputPath,
    })

    return jobId
  } catch (error) {
    console.error("Failed to start video compilation:", error)
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
      const progress = await invoke<RenderProgress | null>("get_render_progress", { jobId })

      if (progress) {
        onProgress(progress)

        // Если рендеринг еще идет, проверяем снова через 500ms
        if (progress.status === RenderStatus.Processing) {
          setTimeout(checkProgress, 500)
        }
      }
    } catch (error) {
      console.error("Failed to get render progress:", error)
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
    const jpegData = await invoke<number[]>("generate_preview", {
      projectSchema: project,
      timestamp,
      quality: quality || 75,
    })

    return new Uint8Array(jpegData)
  } catch (error) {
    console.error("Failed to generate preview:", error)
    throw error
  }
}

/**
 * Отмена рендеринга
 */
export async function cancelRender(jobId: string): Promise<boolean> {
  try {
    return await invoke<boolean>("cancel_render", { jobId })
  } catch (error) {
    console.error("Failed to cancel render:", error)
    return false
  }
}

/**
 * Получение списка активных задач
 */
export async function getActiveJobs() {
  try {
    return await invoke("get_active_jobs")
  } catch (error) {
    console.error("Failed to get active jobs:", error)
    throw error
  }
}

/**
 * Получение информации о задаче
 */
export async function getRenderJob(jobId: string) {
  try {
    return await invoke("get_render_job", { jobId })
  } catch (error) {
    console.error("Failed to get render job:", error)
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
  applyEffects: boolean
  quality?: number
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
    const result = await invoke<PrerenderResult>("prerender_segment", {
      request: {
        project_schema: request.projectSchema,
        start_time: request.startTime,
        end_time: request.endTime,
        apply_effects: request.applyEffects,
        quality: request.quality,
      },
    })

    return result
  } catch (error) {
    console.error("Failed to prerender segment:", error)
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
  const result = await invoke<{
    file_count: number
    total_size: number
    files?: Array<{
      path: string
      size: number
      created: number
      start_time: number
      end_time: number
    }>
  }>("get_prerender_cache_info")

  return {
    fileCount: result.file_count || 0,
    totalSize: result.total_size || 0,
    files: (result.files || []).map((f) => ({
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
  return await invoke<number>("clear_prerender_cache")
}

/**
 * Проверка возможностей GPU (использует get_gpu_capabilities_full)
 */
export async function checkGpuCapabilities() {
  try {
    return await invoke("get_gpu_capabilities_full")
  } catch (error) {
    console.error("Failed to get GPU capabilities:", error)
    throw error
  }
}

/**
 * Обновление настроек компилятора (использует update_compiler_settings_advanced)
 */
export async function updateCompilerSettings(settings: any) {
  try {
    return await invoke("update_compiler_settings_advanced", { settings })
  } catch (error) {
    console.error("Failed to update compiler settings:", error)
    throw error
  }
}

/**
 * Проверка доступности GPU кодировщика
 */
export async function checkGpuEncoderAvailability(encoder: string) {
  try {
    return await invoke("check_gpu_encoder_availability", { encoder })
  } catch (error) {
    console.error("Failed to check GPU encoder availability:", error)
    throw error
  }
}

/**
 * Очистка кеша метаданных медиа
 */
export async function clearMediaMetadataCache() {
  try {
    return await invoke("clear_media_metadata_cache")
  } catch (error) {
    console.error("Failed to clear media metadata cache:", error)
    throw error
  }
}
