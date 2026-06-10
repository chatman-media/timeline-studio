/**
 * Video Port Interface
 *
 * Контракт для работы с видео компиляцией и обработкой.
 * Реализации: TauriVideoService, MockVideoService
 */

// ============================================================================
// Types
// ============================================================================

export interface CacheConfig {
  maxSize?: number
  ttl?: number
  enabled?: boolean
}

export interface CacheStats {
  totalSize: number
  fileCount: number
  hitRate: number
  missRate: number
}

export interface CacheMemoryUsage {
  used: number
  available: number
  percentage: number
}

export interface GpuCapabilities {
  available: boolean
  encoders: string[]
  decoders: string[]
  vendor?: string
  model?: string
}

export interface RenderJob {
  id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  outputPath?: string
  error?: string
  startedAt?: string
  completedAt?: string
}

export interface RenderProgress {
  jobId: string
  progress: number
  stage: string
  currentFrame?: number
  totalFrames?: number
  eta?: number
}

export interface CompilerSettings {
  outputFormat?: string
  videoCodec?: string
  audioCodec?: string
  videoBitrate?: number
  audioBitrate?: number
  resolution?: { width: number; height: number }
  fps?: number
  hardwareAcceleration?: boolean
}

export interface SystemInfo {
  os: string
  arch: string
  cpuCores: number
  totalMemory: number
  availableMemory: number
}

export interface FfmpegCapabilities {
  version: string
  codecs: string[]
  formats: string[]
  filters: string[]
  hwAccel: string[]
}

export interface FrameExtractionRequest {
  videoPath: string
  timestamps: number[]
  width?: number
  height?: number
  quality?: number
}

export interface ExtractedFrame {
  timestamp: number
  data: number[] | string
  width: number
  height: number
}

export interface PrerenderRequest {
  projectSchema: unknown
  startTime: number
  endTime: number
  outputPath: string // Путь к выходному файлу (требуется Rust командой)
  applyEffects?: boolean // Опционально - применять ли эффекты
  quality?: number // Опционально - качество рендера
}

export interface PrerenderResult {
  segmentId: string
  frames: ExtractedFrame[]
  duration: number
}

export interface PrerenderCacheInfo {
  totalSegments: number
  totalSize: number
  oldestSegment?: string
  newestSegment?: string
}

// ============================================================================
// Interface
// ============================================================================

export interface IVideoService {
  // === Cache Operations ===

  /**
   * Cache media metadata
   */
  cacheMediaMetadata(params: unknown): Promise<void>

  /**
   * Clear media metadata cache
   */
  clearMediaMetadataCache(): Promise<void>

  /**
   * Clear preview cache
   */
  clearPreviewCache(): Promise<void>

  /**
   * Clear all caches
   */
  clearAllCache(): Promise<void>

  /**
   * Configure cache settings
   */
  configureCache(config: CacheConfig): Promise<void>

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<CacheStats>

  /**
   * Get cache size in bytes
   */
  getCacheSize(): Promise<number>

  /**
   * Get cache memory usage
   */
  getCacheMemoryUsage(): Promise<CacheMemoryUsage>

  /**
   * Get cached metadata for file
   */
  getCachedMetadata(filePath: string): Promise<unknown | null>

  // === Hardware Acceleration ===

  /**
   * Check GPU encoder availability
   */
  checkGpuEncoderAvailability(): Promise<unknown>

  /**
   * Get full GPU capabilities
   */
  getGpuCapabilities(): Promise<GpuCapabilities>

  /**
   * Set hardware acceleration enabled/disabled
   */
  setHardwareAcceleration(enabled: boolean): Promise<void>

  /**
   * Check if hardware acceleration is supported
   */
  checkHardwareAccelerationSupport(): Promise<boolean>

  // === Render Jobs ===

  /**
   * Get all active render jobs
   */
  getActiveJobs(): Promise<RenderJob[]>

  /**
   * Get specific render job by ID
   */
  getRenderJob(jobId: string): Promise<RenderJob>

  /**
   * Get render progress for job
   */
  getRenderProgress(jobId: string): Promise<RenderProgress>

  /**
   * Cancel a render job
   */
  cancelRender(jobId: string): Promise<boolean>

  // === Video Compilation ===

  /**
   * Render project to video file
   */
  renderProject(projectSchema: unknown, outputPath: string): Promise<string>

  /**
   * Generate preview frame at timestamp
   */
  generatePreview(projectSchema: unknown, timestamp: number, quality?: number): Promise<number[]>

  /**
   * Prerender a segment for smooth playback
   */
  prerenderSegment(request: PrerenderRequest): Promise<PrerenderResult>

  /**
   * Get prerender cache info
   */
  getPrerenderCacheInfo(): Promise<PrerenderCacheInfo>

  /**
   * Clear prerender cache
   */
  clearPrerenderCache(): Promise<number>

  // === Compiler Settings ===

  /**
   * Get compiler settings
   */
  getCompilerSettings(): Promise<CompilerSettings>

  /**
   * Update compiler settings
   */
  updateCompilerSettings(settings: CompilerSettings): Promise<void>

  // === Effects Operations ===

  /**
   * Create a new effect
   */
  createEffect(effect: unknown): Promise<void>

  /**
   * Create a new filter
   */
  createFilter(filter: unknown): Promise<void>

  /**
   * Delete user effect by ID
   */
  deleteUserEffect(effectId: string): Promise<void>

  /**
   * Save user effect to file
   */
  saveUserEffect(fileName: string, effect: string): Promise<string>

  /**
   * Load user effect from file
   */
  loadUserEffect(filePath: string): Promise<string>

  /**
   * Get list of user effects
   */
  getUserEffectsList(): Promise<string[]>

  /**
   * Save effects collection
   */
  saveEffectsCollection(fileName: string, collection: string): Promise<string>

  /**
   * Load effects collection
   */
  loadEffectsCollection(filePath: string): Promise<string>

  // === Effects on Clips ===

  /**
   * Add effect to clip
   */
  addEffectToClip(clipId: string, effectId: string, projectSchema: unknown): Promise<unknown>

  /**
   * Add filter to clip
   */
  addFilterToClip(clipId: string, filterId: string, projectSchema: unknown): Promise<unknown>

  /**
   * Remove effect from clip
   */
  removeEffectFromClip(clipId: string, effectId: string, projectSchema: unknown): Promise<unknown>

  /**
   * Remove filter from clip
   */
  removeFilterFromClip(clipId: string, filterId: string, projectSchema: unknown): Promise<unknown>

  // === System Info ===

  /**
   * Get system information
   */
  getSystemInfo(): Promise<SystemInfo>

  /**
   * Check FFmpeg capabilities
   */
  checkFfmpegCapabilities(): Promise<FfmpegCapabilities>

  // === File Operations ===

  /**
   * Load file content
   */
  loadFile(path: string): Promise<string>

  /**
   * Save file content
   */
  saveFile(params: unknown): Promise<void>

  // === Frame Extraction ===

  /**
   * Extract timeline frames
   */
  extractTimelineFrames(request: FrameExtractionRequest): Promise<ExtractedFrame[]>

  /**
   * Extract frames for recognition
   */
  extractRecognitionFrames(videoPath: string, purpose: string, interval: number): Promise<ExtractedFrame[]>

  /**
   * Extract frames for subtitles
   */
  extractSubtitleFrames(videoPath: string, subtitles: unknown[]): Promise<ExtractedFrame[]>
}
