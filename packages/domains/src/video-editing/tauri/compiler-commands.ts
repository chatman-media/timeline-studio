/**
 * Video Editing / Compiler Tauri Commands
 *
 * All video compiler and editing-related Tauri backend operations.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CompilerCommands")

// Cache operations
export async function cacheMediaMetadata(params: any): Promise<void> {
  logger.debugSync("Caching media metadata")
  return invoke("cache_media_metadata", params)
}

export async function clearMediaMetadataCache(): Promise<void> {
  logger.infoSync("Clearing media metadata cache")
  return invoke("clear_media_metadata_cache")
}

export async function clearPreviewCache(): Promise<void> {
  logger.infoSync("Clearing preview cache")
  return invoke("clear_preview_cache")
}

export async function clearAllCache(): Promise<void> {
  logger.infoSync("Clearing all cache")
  return invoke("clear_all_cache")
}

export async function configureCache(config: any): Promise<void> {
  logger.infoSync("Configuring cache")
  return invoke("configure_cache", config)
}

// Hardware acceleration
export async function checkGpuEncoderAvailability(): Promise<any> {
  logger.debugSync("Checking GPU encoder availability")
  return invoke("check_gpu_encoder_availability")
}

export async function getGpuCapabilitiesFull(): Promise<any> {
  logger.debugSync("Getting GPU capabilities")
  return invoke("get_gpu_capabilities_full")
}

export async function setHardwareAcceleration(enabled: boolean): Promise<void> {
  logger.infoSync("Setting hardware acceleration", { enabled })
  return invoke("set_hardware_acceleration", { enabled })
}

// Compiler operations
export async function getActiveJobs(): Promise<any[]> {
  logger.debugSync("Getting active render jobs")
  return invoke("get_active_jobs")
}

export async function getRenderJob(jobId: string): Promise<any> {
  logger.debugSync("Getting render job", { jobId })
  return invoke("get_render_job", { jobId })
}

export async function updateCompilerSettings(settings: any): Promise<void> {
  logger.infoSync("Updating compiler settings")
  return invoke("update_compiler_settings_advanced", settings)
}

// Effects operations
export async function createEffect(effect: any): Promise<void> {
  logger.infoSync("Creating effect")
  return invoke("create_effect", effect)
}

export async function createFilter(filter: any): Promise<void> {
  logger.infoSync("Creating filter")
  return invoke("create_filter", filter)
}

export async function deleteUserEffect(effectId: string): Promise<void> {
  logger.infoSync("Deleting user effect", { effectId })
  return invoke("delete_user_effect", { effectId })
}

export async function deleteUserEffectById(filePath: string): Promise<void> {
  logger.infoSync("Deleting user effect", { filePath })
  return invoke("delete_user_effect", { filePath })
}

export async function saveFile(params: any): Promise<void> {
  logger.infoSync("Saving file")
  return invoke("save_file", params)
}

// Video compilation operations
export async function renderProject(projectSchema: any, outputPath: string): Promise<string> {
  logger.infoSync("Starting video compilation", { outputPath })
  return invoke("compile_video", { projectSchema, outputPath })
}

export async function getRenderProgress(jobId: string): Promise<any> {
  logger.debugSync("Getting render progress", { jobId })
  return invoke("get_render_progress", { jobId })
}

export async function generatePreview(projectSchema: any, timestamp: number, quality?: number): Promise<number[]> {
  logger.debugSync("Generating preview", { timestamp, quality })
  return invoke("generate_preview", {
    projectSchema,
    timestamp,
    quality: quality || 75,
  })
}

export async function cancelRender(jobId: string): Promise<boolean> {
  logger.infoSync("Cancelling render", { jobId })
  return invoke("cancel_render", { jobId })
}

export async function prerenderSegment(request: any): Promise<any> {
  logger.debugSync("Prerendering segment - REQUEST RECEIVED", {
    hasProjectSchema: !!request.projectSchema,
    startTime: request.startTime,
    endTime: request.endTime,
    outputPath: request.outputPath,
    requestKeys: Object.keys(request || {}),
  })

  // Проверка обязательных полей
  if (!request.projectSchema) {
    logger.error("prerenderSegment: projectSchema is missing!", { request })
    throw new Error("prerenderSegment requires projectSchema parameter")
  }
  if (!request.outputPath) {
    logger.error("prerenderSegment: outputPath is missing!", { request })
    throw new Error("prerenderSegment requires outputPath parameter")
  }

  // Tauri автоматически конвертирует camelCase в snake_case
  return invoke("prerender_segment", {
    projectSchema: request.projectSchema,
    startTime: request.startTime,
    endTime: request.endTime,
    outputPath: request.outputPath,
  })
}

export async function getPrerenderCacheInfo(): Promise<any> {
  logger.debugSync("Getting prerender cache info")
  return invoke("get_prerender_cache_info")
}

export async function clearPrerenderCache(): Promise<number> {
  logger.infoSync("Clearing prerender cache")
  return invoke("clear_prerender_cache")
}

// Cache statistics
export async function getCacheStats(): Promise<any> {
  logger.debugSync("Getting cache stats")
  return invoke("get_cache_stats")
}

export async function getCacheSize(): Promise<number> {
  logger.debugSync("Getting cache size")
  return invoke("get_cache_size")
}

// User effects operations
export async function saveUserEffect(fileName: string, effect: string): Promise<string> {
  logger.infoSync("Saving user effect", { fileName })
  return invoke("save_user_effect", { fileName, effect })
}

export async function loadUserEffect(filePath: string): Promise<string> {
  logger.debugSync("Loading user effect", { filePath })
  return invoke("load_user_effect", { filePath })
}

export async function getUserEffectsList(): Promise<string[]> {
  logger.debugSync("Getting user effects list")
  return invoke("get_user_effects_list")
}

export async function saveEffectsCollection(fileName: string, collection: string): Promise<string> {
  logger.infoSync("Saving effects collection", { fileName })
  return invoke("save_effects_collection", { fileName, collection })
}

export async function loadEffectsCollection(filePath: string): Promise<string> {
  logger.debugSync("Loading effects collection", { filePath })
  return invoke("load_effects_collection", { filePath })
}

// Effects/Filters to clip operations
export async function addEffectToClip(clipId: string, effectId: string, projectSchema: any): Promise<any> {
  logger.infoSync("Adding effect to clip", { clipId, effectId })
  return invoke("add_effect_to_clip", { clipId, effectId, projectSchema })
}

export async function addFilterToClip(clipId: string, filterId: string, projectSchema: any): Promise<any> {
  logger.infoSync("Adding filter to clip", { clipId, filterId })
  return invoke("add_filter_to_clip", { clipId, filterId, projectSchema })
}

export async function removeEffectFromClip(clipId: string, effectId: string, projectSchema: any): Promise<any> {
  logger.infoSync("Removing effect from clip", { clipId, effectId })
  return invoke("remove_effect_from_clip", { clipId, effectId, projectSchema })
}

export async function removeFilterFromClip(clipId: string, filterId: string, projectSchema: any): Promise<any> {
  logger.infoSync("Removing filter from clip", { clipId, filterId })
  return invoke("remove_filter_from_clip", { clipId, filterId, projectSchema })
}

// System information operations
export async function getSystemInfo(): Promise<any> {
  logger.debugSync("Getting system info")
  return invoke("get_system_info")
}

export async function checkFfmpegCapabilities(): Promise<any> {
  logger.debugSync("Checking FFmpeg capabilities")
  return invoke("check_ffmpeg_capabilities")
}

export async function getCompilerSettingsAdvanced(): Promise<any> {
  logger.debugSync("Getting compiler settings")
  return invoke("get_compiler_settings_advanced")
}

export async function checkHardwareAccelerationSupport(): Promise<boolean> {
  logger.debugSync("Checking hardware acceleration support")
  return invoke("check_hardware_acceleration_support")
}

// File operations
export async function loadFile(path: string): Promise<string> {
  logger.debugSync("Loading file", { path })
  return invoke("load_file", { path })
}

// Frame extraction operations
export async function extractTimelineFrames(request: any): Promise<any[]> {
  logger.debugSync("Extracting timeline frames")
  return invoke("extract_timeline_frames", { request })
}

export async function extractRecognitionFrames(videoPath: string, purpose: string, interval: number): Promise<any[]> {
  logger.debugSync("Extracting recognition frames", { videoPath, purpose })
  return invoke("extract_recognition_frames", {
    video_path: videoPath,
    purpose,
    interval,
  })
}

export async function extractSubtitleFrames(videoPath: string, subtitles: any[]): Promise<any[]> {
  logger.debugSync("Extracting subtitle frames", { videoPath })
  return invoke("extract_subtitle_frames", {
    video_path: videoPath,
    subtitles,
  })
}

// Metadata cache operations
export async function getCachedMetadata(filePath: string): Promise<any | null> {
  logger.debugSync("Getting cached metadata", { filePath })
  return invoke("get_cached_metadata", { filePath })
}

export async function getCacheMemoryUsage(): Promise<any> {
  logger.debugSync("Getting cache memory usage")
  return invoke("get_cache_memory_usage")
}
