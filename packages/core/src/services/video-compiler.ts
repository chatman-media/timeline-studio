/**
 * Video compiler service commands used directly by feature UI.
 */

import { invoke } from "@tauri-apps/api/core"
import {
  RenderStatus,
  type CacheMemoryUsage,
  type CompilerSettings,
  type FfmpegCapabilities,
  type ProjectSchema,
  type RenderProgress,
  type SystemInfo,
  type VideoCompilerCacheStats,
  type VideoRenderJob,
} from "@timeline-studio/core/types/video-editing"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CoreVideoCompilerService")

export interface PrerenderRequest {
  projectSchema: unknown
  startTime: number
  endTime: number
  outputPath: string
  applyEffects?: boolean
  quality?: number
}

export interface PrerenderResult {
  filePath: string
  duration: number
  fileSize: number
  renderTimeMs: number
}

export interface PrerenderCacheInfo {
  fileCount: number
  totalSize: number
  files: PrerenderCacheFile[]
}

export interface PrerenderCacheFile {
  path: string
  size: number
  created: number
  startTime: number
  endTime: number
}

export interface GpuCapabilitiesResponse {
  available_encoders: string[]
  recommended_encoder: string | null
  current_gpu: any
  hardware_acceleration_supported: boolean
}

export async function renderProject(project: ProjectSchema, outputPath: string): Promise<string> {
  try {
    return await invoke<string>("compile_video", { projectSchema: project, outputPath })
  } catch (error) {
    void logger.error("Failed to start video compilation", { error })
    throw error
  }
}

export async function getRenderProgress(jobId: string): Promise<RenderProgress | null> {
  try {
    return await invoke<RenderProgress | null>("get_render_progress", { jobId })
  } catch (error) {
    void logger.error("Failed to get render progress", { error })
    return null
  }
}

export async function trackRenderProgress(
  jobId: string,
  onProgress: (progress: RenderProgress) => void,
): Promise<void> {
  const checkProgress = async () => {
    try {
      const progress = await getRenderProgress(jobId)

      if (progress) {
        onProgress(progress)

        if (progress.status === RenderStatus.Processing) {
          setTimeout(checkProgress, 500)
        }
      }
    } catch (error) {
      void logger.error("Failed to track render progress", { error })
    }
  }

  void checkProgress()
}

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
    void logger.error("Failed to generate preview", { error })
    throw error
  }
}

export async function getActiveJobs(): Promise<VideoRenderJob[]> {
  return await invoke<VideoRenderJob[]>("get_active_jobs")
}

export async function getRenderJob(jobId: string): Promise<VideoRenderJob | null> {
  return await invoke<VideoRenderJob | null>("get_render_job", { jobId })
}

export async function cancelRender(jobId: string): Promise<boolean> {
  return await invoke<boolean>("cancel_render", { jobId })
}

export async function prerenderSegment(request: PrerenderRequest): Promise<PrerenderResult> {
  try {
    void logger.info("Prerender segment requested", {
      hasProjectSchema: !!request?.projectSchema,
      hasOutputPath: !!request?.outputPath,
      startTime: request?.startTime,
      endTime: request?.endTime,
    })

    if (!request.projectSchema) {
      throw new Error("prerenderSegment requires projectSchema parameter")
    }
    if (!request.outputPath) {
      throw new Error("prerenderSegment requires outputPath parameter")
    }

    return await invoke<PrerenderResult>("prerender_segment", {
      projectSchema: request.projectSchema,
      startTime: request.startTime,
      endTime: request.endTime,
      outputPath: request.outputPath,
    })
  } catch (error) {
    void logger.error("Failed to prerender segment", { error })
    throw error
  }
}

export async function getPrerenderCacheInfo(): Promise<PrerenderCacheInfo> {
  const result = await invoke<any>("get_prerender_cache_info")

  return {
    fileCount: result.file_count || 0,
    totalSize: result.total_size || 0,
    files: (result.files || []).map((file: any) => ({
      path: file.path,
      size: file.size,
      created: file.created,
      startTime: file.start_time,
      endTime: file.end_time,
    })),
  }
}

export async function clearPrerenderCache(): Promise<number> {
  return await invoke<number>("clear_prerender_cache")
}

export async function getCacheStats(): Promise<VideoCompilerCacheStats> {
  return await invoke<VideoCompilerCacheStats>("get_cache_stats")
}

export async function clearPreviewCache(): Promise<void> {
  await invoke("clear_preview_cache")
}

export async function clearAllCache(): Promise<void> {
  await invoke("clear_all_cache")
}

export async function getCacheSize(): Promise<number> {
  try {
    return await invoke<number>("get_cache_size")
  } catch (error) {
    void logger.error("Failed to get cache size", { error })
    return 0
  }
}

export async function configureCacheSettings(settings: {
  max_memory_mb?: number
  max_entries?: number
  auto_cleanup?: boolean
}): Promise<void> {
  await invoke("configure_cache", settings)
}

export async function getGpuCapabilitiesFull(): Promise<GpuCapabilitiesResponse> {
  return await invoke<GpuCapabilitiesResponse>("get_gpu_capabilities_full")
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return await invoke<SystemInfo>("get_system_info")
}

export async function checkFfmpegCapabilities(): Promise<FfmpegCapabilities> {
  return await invoke<FfmpegCapabilities>("check_ffmpeg_capabilities")
}

export async function getCompilerSettings(): Promise<CompilerSettings> {
  return await invoke<CompilerSettings>("get_compiler_settings_advanced")
}

export async function setHardwareAcceleration(enabled: boolean): Promise<void> {
  await invoke("set_hardware_acceleration", { enabled })
}

export async function checkHardwareAccelerationSupport(): Promise<boolean> {
  return await invoke<boolean>("check_hardware_acceleration_support")
}

export async function checkGpuEncoderAvailability(): Promise<any> {
  return await invoke("check_gpu_encoder_availability")
}

export async function checkGpuCapabilities(): Promise<GpuCapabilitiesResponse> {
  return getGpuCapabilitiesFull()
}

export async function updateCompilerSettings(settings: CompilerSettings): Promise<void> {
  await invoke("update_compiler_settings_advanced", settings as unknown as Record<string, unknown>)
}

export async function clearMediaMetadataCache(): Promise<void> {
  await invoke("clear_media_metadata_cache")
}

export async function getCachedMetadata<TMetadata = unknown>(filePath: string): Promise<TMetadata | null> {
  try {
    return await invoke<TMetadata | null>("get_cached_metadata", { filePath })
  } catch (error) {
    void logger.error("Failed to get cached metadata", { error })
    return null
  }
}

export async function cacheMediaMetadata(filePath: string, metadata: unknown): Promise<void> {
  try {
    await invoke("cache_media_metadata", { filePath, metadata })
  } catch (error) {
    void logger.error("Failed to cache metadata", { error })
    throw error
  }
}

export async function getCacheMemoryUsage(): Promise<CacheMemoryUsage> {
  return await invoke<CacheMemoryUsage>("get_cache_memory_usage")
}

export async function cacheMultipleMetadata(files: Array<{ path: string; metadata: unknown }>): Promise<void> {
  const batchSize = 10
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    await Promise.all(batch.map(({ path, metadata }) => cacheMediaMetadata(path, metadata)))
  }
}

export async function checkCachedFiles(filePaths: string[]): Promise<{
  cached: string[]
  notCached: string[]
}> {
  const results = await Promise.all(
    filePaths.map(async (path) => {
      const metadata = await getCachedMetadata(path)
      return { path, isCached: metadata !== null }
    }),
  )

  return {
    cached: results.filter((result) => result.isCached).map((result) => result.path),
    notCached: results.filter((result) => !result.isCached).map((result) => result.path),
  }
}

export async function invalidateFileCache(filePath: string): Promise<void> {
  void logger.info("Cache invalidation requested", { filePath })
}

export class VideoCompilerCacheService {
  async getCacheStats(): Promise<VideoCompilerCacheStats> {
    return getCacheStats()
  }

  async clearPreviewCache(): Promise<void> {
    return clearPreviewCache()
  }

  async clearAllCache(): Promise<void> {
    return clearAllCache()
  }
}

export class VideoCompilerRenderService {
  async getActiveJobs(): Promise<VideoRenderJob[]> {
    return getActiveJobs()
  }

  async getRenderJob(jobId: string): Promise<VideoRenderJob | null> {
    return getRenderJob(jobId)
  }

  async cancelRender(jobId: string): Promise<boolean> {
    return cancelRender(jobId)
  }

  async compileVideo(project: ProjectSchema, outputPath: string): Promise<string> {
    return renderProject(project, outputPath)
  }

  async generatePreview(project: ProjectSchema, timestamp: number): Promise<number[]> {
    return Array.from(await generatePreview(project, timestamp))
  }
}

export class VideoCompilerSystemService {
  async getGpuCapabilitiesFull(): Promise<GpuCapabilitiesResponse> {
    return getGpuCapabilitiesFull()
  }

  async getSystemInfo(): Promise<SystemInfo> {
    return getSystemInfo()
  }

  async checkFfmpegCapabilities(): Promise<FfmpegCapabilities> {
    return checkFfmpegCapabilities()
  }

  async getCompilerSettings(): Promise<CompilerSettings> {
    return getCompilerSettings()
  }

  async setHardwareAcceleration(enabled: boolean): Promise<void> {
    return setHardwareAcceleration(enabled)
  }

  async checkHardwareAccelerationSupport(): Promise<boolean> {
    return checkHardwareAccelerationSupport()
  }
}

export const videoCompilerCacheService = new VideoCompilerCacheService()
export const videoCompilerRenderService = new VideoCompilerRenderService()
export const videoCompilerSystemService = new VideoCompilerSystemService()
