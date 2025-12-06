/**
 * Tauri Video Adapter
 *
 * Реализация IVideoService для Tauri.
 * Использует invoke() для вызова Rust backend команд.
 */

import { invoke } from "@tauri-apps/api/core"

import type {
  CacheConfig,
  CacheMemoryUsage,
  CacheStats,
  CompilerSettings,
  ExtractedFrame,
  FfmpegCapabilities,
  FrameExtractionRequest,
  GpuCapabilities,
  IVideoService,
  PrerenderCacheInfo,
  PrerenderRequest,
  PrerenderResult,
  RenderJob,
  RenderProgress,
  SystemInfo,
} from "@/core/ports"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("TauriVideoService")

export class TauriVideoService implements IVideoService {
  // ============================================================================
  // Cache Operations
  // ============================================================================

  async cacheMediaMetadata(params: unknown): Promise<void> {
    logger.debugSync("Caching media metadata")
    return invoke("cache_media_metadata", params as Record<string, unknown>)
  }

  async clearMediaMetadataCache(): Promise<void> {
    logger.infoSync("Clearing media metadata cache")
    return invoke("clear_media_metadata_cache")
  }

  async clearPreviewCache(): Promise<void> {
    logger.infoSync("Clearing preview cache")
    return invoke("clear_preview_cache")
  }

  async clearAllCache(): Promise<void> {
    logger.infoSync("Clearing all cache")
    return invoke("clear_all_cache")
  }

  async configureCache(config: CacheConfig): Promise<void> {
    logger.infoSync("Configuring cache")
    return invoke("configure_cache", { config })
  }

  async getCacheStats(): Promise<CacheStats> {
    logger.debugSync("Getting cache stats")
    return invoke("get_cache_stats")
  }

  async getCacheSize(): Promise<number> {
    logger.debugSync("Getting cache size")
    return invoke("get_cache_size")
  }

  async getCacheMemoryUsage(): Promise<CacheMemoryUsage> {
    logger.debugSync("Getting cache memory usage")
    return invoke("get_cache_memory_usage")
  }

  async getCachedMetadata(filePath: string): Promise<unknown | null> {
    logger.debugSync("Getting cached metadata", { filePath })
    return invoke("get_cached_metadata", { filePath })
  }

  // ============================================================================
  // Hardware Acceleration
  // ============================================================================

  async checkGpuEncoderAvailability(): Promise<unknown> {
    logger.debugSync("Checking GPU encoder availability")
    return invoke("check_gpu_encoder_availability")
  }

  async getGpuCapabilities(): Promise<GpuCapabilities> {
    logger.debugSync("Getting GPU capabilities")
    return invoke("get_gpu_capabilities_full")
  }

  async setHardwareAcceleration(enabled: boolean): Promise<void> {
    logger.infoSync("Setting hardware acceleration", { enabled })
    return invoke("set_hardware_acceleration", { enabled })
  }

  async checkHardwareAccelerationSupport(): Promise<boolean> {
    logger.debugSync("Checking hardware acceleration support")
    return invoke("check_hardware_acceleration_support")
  }

  // ============================================================================
  // Render Jobs
  // ============================================================================

  async getActiveJobs(): Promise<RenderJob[]> {
    logger.debugSync("Getting active render jobs")
    return invoke("get_active_jobs")
  }

  async getRenderJob(jobId: string): Promise<RenderJob> {
    logger.debugSync("Getting render job", { jobId })
    return invoke("get_render_job", { jobId })
  }

  async getRenderProgress(jobId: string): Promise<RenderProgress> {
    logger.debugSync("Getting render progress", { jobId })
    return invoke("get_render_progress", { jobId })
  }

  async cancelRender(jobId: string): Promise<boolean> {
    logger.infoSync("Cancelling render", { jobId })
    return invoke("cancel_render", { jobId })
  }

  // ============================================================================
  // Video Compilation
  // ============================================================================

  async renderProject(projectSchema: unknown, outputPath: string): Promise<string> {
    logger.infoSync("Starting video compilation", { outputPath })
    return invoke("compile_video", { projectSchema, outputPath })
  }

  async generatePreview(projectSchema: unknown, timestamp: number, quality?: number): Promise<number[]> {
    logger.debugSync("Generating preview", { timestamp, quality })
    return invoke("generate_preview", {
      projectSchema,
      timestamp,
      quality: quality || 75,
    })
  }

  async prerenderSegment(request: PrerenderRequest): Promise<PrerenderResult> {
    logger.debugSync("Prerendering segment", {
      startTime: request.startTime,
      endTime: request.endTime,
      outputPath: request.outputPath,
    })
    // Tauri автоматически конвертирует camelCase в snake_case
    return invoke("prerender_segment", {
      projectSchema: request.projectSchema,
      startTime: request.startTime,
      endTime: request.endTime,
      outputPath: request.outputPath,
    })
  }

  async getPrerenderCacheInfo(): Promise<PrerenderCacheInfo> {
    logger.debugSync("Getting prerender cache info")
    return invoke("get_prerender_cache_info")
  }

  async clearPrerenderCache(): Promise<number> {
    logger.infoSync("Clearing prerender cache")
    return invoke("clear_prerender_cache")
  }

  // ============================================================================
  // Compiler Settings
  // ============================================================================

  async getCompilerSettings(): Promise<CompilerSettings> {
    logger.debugSync("Getting compiler settings")
    return invoke("get_compiler_settings_advanced")
  }

  async updateCompilerSettings(settings: CompilerSettings): Promise<void> {
    logger.infoSync("Updating compiler settings")
    return invoke("update_compiler_settings_advanced", { settings })
  }

  // ============================================================================
  // Effects Operations
  // ============================================================================

  async createEffect(effect: unknown): Promise<void> {
    logger.infoSync("Creating effect")
    return invoke("create_effect", effect as Record<string, unknown>)
  }

  async createFilter(filter: unknown): Promise<void> {
    logger.infoSync("Creating filter")
    return invoke("create_filter", filter as Record<string, unknown>)
  }

  async deleteUserEffect(effectId: string): Promise<void> {
    logger.infoSync("Deleting user effect", { effectId })
    return invoke("delete_user_effect", { effectId })
  }

  async saveUserEffect(fileName: string, effect: string): Promise<string> {
    logger.infoSync("Saving user effect", { fileName })
    return invoke("save_user_effect", { fileName, effect })
  }

  async loadUserEffect(filePath: string): Promise<string> {
    logger.debugSync("Loading user effect", { filePath })
    return invoke("load_user_effect", { filePath })
  }

  async getUserEffectsList(): Promise<string[]> {
    logger.debugSync("Getting user effects list")
    return invoke("get_user_effects_list")
  }

  async saveEffectsCollection(fileName: string, collection: string): Promise<string> {
    logger.infoSync("Saving effects collection", { fileName })
    return invoke("save_effects_collection", { fileName, collection })
  }

  async loadEffectsCollection(filePath: string): Promise<string> {
    logger.debugSync("Loading effects collection", { filePath })
    return invoke("load_effects_collection", { filePath })
  }

  // ============================================================================
  // Effects on Clips
  // ============================================================================

  async addEffectToClip(clipId: string, effectId: string, projectSchema: unknown): Promise<unknown> {
    logger.infoSync("Adding effect to clip", { clipId, effectId })
    return invoke("add_effect_to_clip", { clipId, effectId, projectSchema })
  }

  async addFilterToClip(clipId: string, filterId: string, projectSchema: unknown): Promise<unknown> {
    logger.infoSync("Adding filter to clip", { clipId, filterId })
    return invoke("add_filter_to_clip", { clipId, filterId, projectSchema })
  }

  async removeEffectFromClip(clipId: string, effectId: string, projectSchema: unknown): Promise<unknown> {
    logger.infoSync("Removing effect from clip", { clipId, effectId })
    return invoke("remove_effect_from_clip", { clipId, effectId, projectSchema })
  }

  async removeFilterFromClip(clipId: string, filterId: string, projectSchema: unknown): Promise<unknown> {
    logger.infoSync("Removing filter from clip", { clipId, filterId })
    return invoke("remove_filter_from_clip", { clipId, filterId, projectSchema })
  }

  // ============================================================================
  // System Info
  // ============================================================================

  async getSystemInfo(): Promise<SystemInfo> {
    logger.debugSync("Getting system info")
    return invoke("get_system_info")
  }

  async checkFfmpegCapabilities(): Promise<FfmpegCapabilities> {
    logger.debugSync("Checking FFmpeg capabilities")
    return invoke("check_ffmpeg_capabilities")
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  async loadFile(path: string): Promise<string> {
    logger.debugSync("Loading file", { path })
    return invoke("load_file", { path })
  }

  async saveFile(params: unknown): Promise<void> {
    logger.infoSync("Saving file")
    return invoke("save_file", params as Record<string, unknown>)
  }

  // ============================================================================
  // Frame Extraction
  // ============================================================================

  async extractTimelineFrames(request: FrameExtractionRequest): Promise<ExtractedFrame[]> {
    logger.debugSync("Extracting timeline frames")
    return invoke("extract_timeline_frames", { request })
  }

  async extractRecognitionFrames(videoPath: string, purpose: string, interval: number): Promise<ExtractedFrame[]> {
    logger.debugSync("Extracting recognition frames", { videoPath, purpose })
    return invoke("extract_recognition_frames", {
      video_path: videoPath,
      purpose,
      interval,
    })
  }

  async extractSubtitleFrames(videoPath: string, subtitles: unknown[]): Promise<ExtractedFrame[]> {
    logger.debugSync("Extracting subtitle frames", { videoPath })
    return invoke("extract_subtitle_frames", {
      video_path: videoPath,
      subtitles,
    })
  }
}
