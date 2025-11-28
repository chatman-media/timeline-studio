/**
 * Mock Video Adapter
 *
 * Реализация IVideoService для тестов и браузера.
 * Возвращает заглушки для всех методов.
 */

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

export class MockVideoService implements IVideoService {
  private renderJobs: Map<string, RenderJob> = new Map()
  private cache: Map<string, unknown> = new Map()

  // ============================================================================
  // Cache Operations
  // ============================================================================

  async cacheMediaMetadata(_params: unknown): Promise<void> {
    // No-op in mock
  }

  async clearMediaMetadataCache(): Promise<void> {
    this.cache.clear()
  }

  async clearPreviewCache(): Promise<void> {
    // No-op in mock
  }

  async clearAllCache(): Promise<void> {
    this.cache.clear()
    this.renderJobs.clear()
  }

  async configureCache(_config: CacheConfig): Promise<void> {
    // No-op in mock
  }

  async getCacheStats(): Promise<CacheStats> {
    return {
      totalSize: 0,
      fileCount: this.cache.size,
      hitRate: 0.5,
      missRate: 0.5,
    }
  }

  async getCacheSize(): Promise<number> {
    return 0
  }

  async getCacheMemoryUsage(): Promise<CacheMemoryUsage> {
    return {
      used: 0,
      available: 1024 * 1024 * 1024, // 1GB
      percentage: 0,
    }
  }

  async getCachedMetadata(filePath: string): Promise<unknown | null> {
    return this.cache.get(filePath) || null
  }

  // ============================================================================
  // Hardware Acceleration
  // ============================================================================

  async checkGpuEncoderAvailability(): Promise<unknown> {
    return { available: false, reason: "Mock environment" }
  }

  async getGpuCapabilities(): Promise<GpuCapabilities> {
    return {
      available: false,
      encoders: [],
      decoders: [],
      vendor: "Mock",
      model: "Mock GPU",
    }
  }

  async setHardwareAcceleration(_enabled: boolean): Promise<void> {
    // No-op in mock
  }

  async checkHardwareAccelerationSupport(): Promise<boolean> {
    return false
  }

  // ============================================================================
  // Render Jobs
  // ============================================================================

  async getActiveJobs(): Promise<RenderJob[]> {
    return Array.from(this.renderJobs.values()).filter((job) => job.status === "pending" || job.status === "running")
  }

  async getRenderJob(jobId: string): Promise<RenderJob> {
    const job = this.renderJobs.get(jobId)
    if (!job) {
      throw new Error(`Render job not found: ${jobId}`)
    }
    return job
  }

  async getRenderProgress(jobId: string): Promise<RenderProgress> {
    const job = this.renderJobs.get(jobId)
    return {
      jobId,
      progress: job?.progress || 0,
      stage: job?.status || "pending",
    }
  }

  async cancelRender(jobId: string): Promise<boolean> {
    const job = this.renderJobs.get(jobId)
    if (job) {
      job.status = "cancelled"
      return true
    }
    return false
  }

  // ============================================================================
  // Video Compilation
  // ============================================================================

  async renderProject(_projectSchema: unknown, outputPath: string): Promise<string> {
    const jobId = `mock-job-${Date.now()}`
    this.renderJobs.set(jobId, {
      id: jobId,
      status: "completed",
      progress: 100,
      outputPath,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })
    return jobId
  }

  async generatePreview(_projectSchema: unknown, _timestamp: number, _quality?: number): Promise<number[]> {
    // Return empty array (mock preview data)
    return []
  }

  async prerenderSegment(_request: PrerenderRequest): Promise<PrerenderResult> {
    return {
      segmentId: `mock-segment-${Date.now()}`,
      frames: [],
      duration: 0,
    }
  }

  async getPrerenderCacheInfo(): Promise<PrerenderCacheInfo> {
    return {
      totalSegments: 0,
      totalSize: 0,
    }
  }

  async clearPrerenderCache(): Promise<number> {
    return 0
  }

  // ============================================================================
  // Compiler Settings
  // ============================================================================

  async getCompilerSettings(): Promise<CompilerSettings> {
    return {
      outputFormat: "mp4",
      videoCodec: "h264",
      audioCodec: "aac",
      videoBitrate: 5000000,
      audioBitrate: 192000,
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      hardwareAcceleration: false,
    }
  }

  async updateCompilerSettings(_settings: CompilerSettings): Promise<void> {
    // No-op in mock
  }

  // ============================================================================
  // Effects Operations
  // ============================================================================

  async createEffect(_effect: unknown): Promise<void> {
    // No-op in mock
  }

  async createFilter(_filter: unknown): Promise<void> {
    // No-op in mock
  }

  async deleteUserEffect(_effectId: string): Promise<void> {
    // No-op in mock
  }

  async saveUserEffect(fileName: string, _effect: string): Promise<string> {
    return `/mock/effects/${fileName}`
  }

  async loadUserEffect(_filePath: string): Promise<string> {
    return JSON.stringify({ name: "Mock Effect", params: {} })
  }

  async getUserEffectsList(): Promise<string[]> {
    return []
  }

  async saveEffectsCollection(fileName: string, _collection: string): Promise<string> {
    return `/mock/collections/${fileName}`
  }

  async loadEffectsCollection(_filePath: string): Promise<string> {
    return JSON.stringify({ name: "Mock Collection", effects: [] })
  }

  // ============================================================================
  // Effects on Clips
  // ============================================================================

  async addEffectToClip(_clipId: string, _effectId: string, projectSchema: unknown): Promise<unknown> {
    return projectSchema
  }

  async addFilterToClip(_clipId: string, _filterId: string, projectSchema: unknown): Promise<unknown> {
    return projectSchema
  }

  async removeEffectFromClip(_clipId: string, _effectId: string, projectSchema: unknown): Promise<unknown> {
    return projectSchema
  }

  async removeFilterFromClip(_clipId: string, _filterId: string, projectSchema: unknown): Promise<unknown> {
    return projectSchema
  }

  // ============================================================================
  // System Info
  // ============================================================================

  async getSystemInfo(): Promise<SystemInfo> {
    return {
      os: "Mock OS",
      arch: "x64",
      cpuCores: 4,
      totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
      availableMemory: 4 * 1024 * 1024 * 1024, // 4GB
    }
  }

  async checkFfmpegCapabilities(): Promise<FfmpegCapabilities> {
    return {
      version: "mock-5.0",
      codecs: ["h264", "aac", "mp3"],
      formats: ["mp4", "mov", "webm"],
      filters: ["scale", "fps", "overlay"],
      hwAccel: [],
    }
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  async loadFile(_path: string): Promise<string> {
    return ""
  }

  async saveFile(_params: unknown): Promise<void> {
    // No-op in mock
  }

  // ============================================================================
  // Frame Extraction
  // ============================================================================

  async extractTimelineFrames(_request: FrameExtractionRequest): Promise<ExtractedFrame[]> {
    return []
  }

  async extractRecognitionFrames(_videoPath: string, _purpose: string, _interval: number): Promise<ExtractedFrame[]> {
    return []
  }

  async extractSubtitleFrames(_videoPath: string, _subtitles: unknown[]): Promise<ExtractedFrame[]> {
    return []
  }
}
