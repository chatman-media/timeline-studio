/**
 * Node.js Video Adapter
 *
 * Реализация IVideoService для Node.js.
 * Использует ffmpeg CLI для рендеринга видео.
 */

import { type ChildProcess, exec, spawn } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

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
} from "@timeline-studio/core/ports"

const execAsync = promisify(exec)

export interface NodeVideoOptions {
  cacheDir?: string
  ffmpegPath?: string
  ffprobePath?: string
}

interface ActiveJob {
  process: ChildProcess
  job: RenderJob
  progress: RenderProgress
}

interface NodeVideoLegacyClip {
  path?: string
  source_path?: string
  source?: unknown
}

interface NodeVideoProjectLike {
  clips?: NodeVideoLegacyClip[]
  tracks?: Array<{
    clips?: NodeVideoLegacyClip[]
  }>
}

export function extractNodeVideoInputFiles(projectSchema: unknown): string[] {
  const schema = projectSchema as NodeVideoProjectLike
  const legacyClips = schema.clips ?? []
  const trackClips = schema.tracks?.flatMap((track) => track.clips ?? []) ?? []

  return [...legacyClips, ...trackClips]
    .map((clip) => clip.path ?? clip.source_path ?? sourceToInputFile(clip.source))
    .filter((value): value is string => Boolean(value))
}

export class NodeVideoService implements IVideoService {
  private cacheDir: string
  private ffmpegPath: string
  private ffprobePath: string
  private activeJobs = new Map<string, ActiveJob>()
  private metadataCache = new Map<string, unknown>()
  private cacheConfig: CacheConfig = {
    maxSize: 1024 * 1024 * 1024, // 1GB
    ttl: 86400, // 24 hours
    enabled: true,
  }

  constructor(options: NodeVideoOptions = {}) {
    this.cacheDir = options.cacheDir || path.join(os.tmpdir(), "timeline-studio-cache")
    this.ffmpegPath = options.ffmpegPath || "ffmpeg"
    this.ffprobePath = options.ffprobePath || "ffprobe"

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  // ============================================================================
  // Cache Operations
  // ============================================================================

  async cacheMediaMetadata(params: unknown): Promise<void> {
    const p = params as { filePath: string; metadata: unknown }
    this.metadataCache.set(p.filePath, p.metadata)
  }

  async clearMediaMetadataCache(): Promise<void> {
    this.metadataCache.clear()
  }

  async clearPreviewCache(): Promise<void> {
    const previewDir = path.join(this.cacheDir, "previews")
    if (fs.existsSync(previewDir)) {
      await fsPromises.rm(previewDir, { recursive: true })
    }
  }

  async clearAllCache(): Promise<void> {
    this.metadataCache.clear()
    if (fs.existsSync(this.cacheDir)) {
      await fsPromises.rm(this.cacheDir, { recursive: true })
      await fsPromises.mkdir(this.cacheDir, { recursive: true })
    }
  }

  async configureCache(config: CacheConfig): Promise<void> {
    this.cacheConfig = config
  }

  async getCacheStats(): Promise<CacheStats> {
    const size = await this.getCacheSize()
    return {
      totalSize: size,
      fileCount: this.metadataCache.size,
      hitRate: 0,
      missRate: 0,
    }
  }

  async getCacheSize(): Promise<number> {
    if (!fs.existsSync(this.cacheDir)) return 0

    let totalSize = 0
    const walk = async (dir: string): Promise<void> => {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          await walk(fullPath)
        } else {
          const stats = await fsPromises.stat(fullPath)
          totalSize += stats.size
        }
      }
    }

    await walk(this.cacheDir)
    return totalSize
  }

  async getCacheMemoryUsage(): Promise<CacheMemoryUsage> {
    const used = this.metadataCache.size * 1024 // Approximate
    const maxSize = this.cacheConfig.maxSize || 1024 * 1024 * 1024
    return {
      used,
      available: maxSize - used,
      percentage: (used / maxSize) * 100,
    }
  }

  async getCachedMetadata(filePath: string): Promise<unknown | null> {
    return this.metadataCache.get(filePath) || null
  }

  // ============================================================================
  // Hardware Acceleration
  // ============================================================================

  async checkGpuEncoderAvailability(): Promise<unknown> {
    try {
      const { stdout } = await execAsync(`${this.ffmpegPath} -encoders 2>&1`)
      return {
        h264_nvenc: stdout.includes("h264_nvenc"),
        hevc_nvenc: stdout.includes("hevc_nvenc"),
        h264_videotoolbox: stdout.includes("h264_videotoolbox"),
        hevc_videotoolbox: stdout.includes("hevc_videotoolbox"),
        h264_qsv: stdout.includes("h264_qsv"),
        hevc_qsv: stdout.includes("hevc_qsv"),
      }
    } catch {
      return {}
    }
  }

  async getGpuCapabilities(): Promise<GpuCapabilities> {
    const encoders = (await this.checkGpuEncoderAvailability()) as Record<string, boolean>
    return {
      available: Object.values(encoders).some(Boolean),
      encoders: Object.keys(encoders).filter((k) => encoders[k]),
      decoders: [],
      vendor: os.platform() === "darwin" ? "Apple" : "Unknown",
    }
  }

  async setHardwareAcceleration(_enabled: boolean): Promise<void> {
    // Configuration stored for use in render commands
  }

  async checkHardwareAccelerationSupport(): Promise<boolean> {
    const caps = await this.getGpuCapabilities()
    return caps.available
  }

  // ============================================================================
  // Render Jobs
  // ============================================================================

  async getActiveJobs(): Promise<RenderJob[]> {
    return Array.from(this.activeJobs.values()).map((j) => j.job)
  }

  async getRenderJob(jobId: string): Promise<RenderJob> {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }
    return job.job
  }

  async getRenderProgress(jobId: string): Promise<RenderProgress> {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      throw new Error(`Job not found: ${jobId}`)
    }
    return job.progress
  }

  async cancelRender(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId)
    if (!job) {
      return false
    }

    job.process.kill("SIGTERM")
    this.activeJobs.delete(jobId)
    return true
  }

  // ============================================================================
  // Video Compilation
  // ============================================================================

  async renderProject(projectSchema: unknown, outputPath: string): Promise<string> {
    const jobId = crypto.randomUUID()
    const inputFiles = extractNodeVideoInputFiles(projectSchema)

    if (inputFiles.length === 0) {
      throw new Error("No clips in project")
    }

    const listPath = path.join(this.cacheDir, `concat_${jobId}.txt`)
    const listContent = inputFiles.map((f) => `file '${f}'`).join("\n")
    await fsPromises.writeFile(listPath, listContent)

    const process = spawn(this.ffmpegPath, [
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-c",
      "copy",
      outputPath,
      "-y",
    ])

    const job: RenderJob = {
      id: jobId,
      status: "running",
      progress: 0,
      outputPath,
      startedAt: new Date().toISOString(),
    }

    const progress: RenderProgress = {
      jobId,
      progress: 0,
      stage: "rendering",
      currentFrame: 0,
      totalFrames: 0,
      eta: 0,
    }

    this.activeJobs.set(jobId, { process, job, progress })

    process.on("close", (code) => {
      const activeJob = this.activeJobs.get(jobId)
      if (activeJob) {
        activeJob.job.status = code === 0 ? "completed" : "failed"
        activeJob.job.completedAt = new Date().toISOString()
        activeJob.job.progress = code === 0 ? 100 : 0
        activeJob.progress.progress = code === 0 ? 100 : 0
      }
      fsPromises.unlink(listPath).catch(() => {})
    })

    return jobId
  }

  async generatePreview(projectSchema: unknown, timestamp: number, quality?: number): Promise<number[]> {
    const firstClip = extractNodeVideoInputFiles(projectSchema)[0]

    if (!firstClip) {
      return []
    }

    const outputPath = path.join(this.cacheDir, `preview_${Date.now()}.jpg`)
    const q = quality || 75

    await execAsync(
      `${this.ffmpegPath} -ss ${timestamp} -i "${firstClip}" -vframes 1 -q:v ${Math.floor((100 - q) / 10)} "${outputPath}" -y`,
    )

    const buffer = await fsPromises.readFile(outputPath)
    await fsPromises.unlink(outputPath)

    return Array.from(buffer)
  }

  async prerenderSegment(request: PrerenderRequest): Promise<PrerenderResult> {
    const segmentId = `segment_${request.startTime}_${request.endTime}`

    return {
      segmentId,
      frames: [],
      duration: request.endTime - request.startTime,
    }
  }

  async getPrerenderCacheInfo(): Promise<PrerenderCacheInfo> {
    const prerenderDir = path.join(this.cacheDir, "prerender")
    let size = 0
    let count = 0

    if (fs.existsSync(prerenderDir)) {
      const files = await fsPromises.readdir(prerenderDir)
      count = files.length
      for (const file of files) {
        const stats = await fsPromises.stat(path.join(prerenderDir, file))
        size += stats.size
      }
    }

    return { totalSegments: count, totalSize: size }
  }

  async clearPrerenderCache(): Promise<number> {
    const prerenderDir = path.join(this.cacheDir, "prerender")
    let count = 0

    if (fs.existsSync(prerenderDir)) {
      const files = await fsPromises.readdir(prerenderDir)
      count = files.length
      await fsPromises.rm(prerenderDir, { recursive: true })
    }

    return count
  }

  // ============================================================================
  // Compiler Settings
  // ============================================================================

  async getCompilerSettings(): Promise<CompilerSettings> {
    return {
      outputFormat: "mp4",
      videoCodec: "libx264",
      audioCodec: "aac",
      videoBitrate: 5000000,
      audioBitrate: 192000,
      fps: 30,
    }
  }

  async updateCompilerSettings(_settings: CompilerSettings): Promise<void> {
    // Store settings for use in render commands
  }

  // ============================================================================
  // Effects Operations
  // ============================================================================

  async createEffect(effect: unknown): Promise<void> {
    const effectsDir = path.join(this.cacheDir, "effects")
    if (!fs.existsSync(effectsDir)) {
      await fsPromises.mkdir(effectsDir, { recursive: true })
    }
    const e = effect as { id: string }
    await fsPromises.writeFile(path.join(effectsDir, `${e.id}.json`), JSON.stringify(effect))
  }

  async createFilter(filter: unknown): Promise<void> {
    const filtersDir = path.join(this.cacheDir, "filters")
    if (!fs.existsSync(filtersDir)) {
      await fsPromises.mkdir(filtersDir, { recursive: true })
    }
    const f = filter as { id: string }
    await fsPromises.writeFile(path.join(filtersDir, `${f.id}.json`), JSON.stringify(filter))
  }

  async deleteUserEffect(effectId: string): Promise<void> {
    const effectPath = path.join(this.cacheDir, "effects", `${effectId}.json`)
    if (fs.existsSync(effectPath)) {
      await fsPromises.unlink(effectPath)
    }
  }

  async saveUserEffect(fileName: string, effect: string): Promise<string> {
    const effectsDir = path.join(this.cacheDir, "effects")
    if (!fs.existsSync(effectsDir)) {
      await fsPromises.mkdir(effectsDir, { recursive: true })
    }
    const filePath = path.join(effectsDir, fileName)
    await fsPromises.writeFile(filePath, effect)
    return filePath
  }

  async loadUserEffect(filePath: string): Promise<string> {
    return fsPromises.readFile(filePath, "utf-8")
  }

  async getUserEffectsList(): Promise<string[]> {
    const effectsDir = path.join(this.cacheDir, "effects")
    if (!fs.existsSync(effectsDir)) {
      return []
    }
    return fsPromises.readdir(effectsDir)
  }

  async saveEffectsCollection(fileName: string, collection: string): Promise<string> {
    const collectionsDir = path.join(this.cacheDir, "collections")
    if (!fs.existsSync(collectionsDir)) {
      await fsPromises.mkdir(collectionsDir, { recursive: true })
    }
    const filePath = path.join(collectionsDir, fileName)
    await fsPromises.writeFile(filePath, collection)
    return filePath
  }

  async loadEffectsCollection(filePath: string): Promise<string> {
    return fsPromises.readFile(filePath, "utf-8")
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
      os: os.platform(),
      arch: os.arch(),
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      availableMemory: os.freemem(),
    }
  }

  async checkFfmpegCapabilities(): Promise<FfmpegCapabilities> {
    try {
      const { stdout: versionOutput } = await execAsync(`${this.ffmpegPath} -version`)
      const { stdout: codecsOutput } = await execAsync(`${this.ffmpegPath} -codecs 2>&1`)
      const { stdout: formatsOutput } = await execAsync(`${this.ffmpegPath} -formats 2>&1`)
      const { stdout: filtersOutput } = await execAsync(`${this.ffmpegPath} -filters 2>&1`)

      const versionMatch = versionOutput.match(/ffmpeg version (\S+)/)

      return {
        version: versionMatch?.[1] || "unknown",
        codecs: codecsOutput
          .split("\n")
          .filter((l) => l.includes("DEV") || l.includes("D.V"))
          .slice(0, 50),
        formats: formatsOutput
          .split("\n")
          .filter((l) => l.startsWith(" D") || l.startsWith(" E"))
          .slice(0, 50),
        filters: filtersOutput
          .split("\n")
          .filter((l) => l.includes("->"))
          .slice(0, 50),
        hwAccel: [],
      }
    } catch {
      return {
        version: "not found",
        codecs: [],
        formats: [],
        filters: [],
        hwAccel: [],
      }
    }
  }

  // ============================================================================
  // File Operations
  // ============================================================================

  async loadFile(filePath: string): Promise<string> {
    return fsPromises.readFile(filePath, "utf-8")
  }

  async saveFile(params: unknown): Promise<void> {
    const p = params as { path: string; content: string }
    await fsPromises.writeFile(p.path, p.content)
  }

  // ============================================================================
  // Frame Extraction
  // ============================================================================

  async extractTimelineFrames(request: FrameExtractionRequest): Promise<ExtractedFrame[]> {
    const frames: ExtractedFrame[] = []
    const { videoPath, timestamps, width, height } = request
    const framesDir = path.join(this.cacheDir, "frames")

    if (!fs.existsSync(framesDir)) {
      await fsPromises.mkdir(framesDir, { recursive: true })
    }

    const frameWidth = width || 320
    const frameHeight = height || 180

    for (const timestamp of timestamps) {
      const outputPath = path.join(framesDir, `frame_${timestamp}.jpg`)
      await execAsync(
        `${this.ffmpegPath} -ss ${timestamp} -i "${videoPath}" -vframes 1 -s ${frameWidth}x${frameHeight} "${outputPath}" -y`,
      )

      const buffer = await fsPromises.readFile(outputPath)
      frames.push({
        timestamp,
        data: buffer.toString("base64"),
        width: frameWidth,
        height: frameHeight,
      })
    }

    return frames
  }

  async extractRecognitionFrames(videoPath: string, _purpose: string, interval: number): Promise<ExtractedFrame[]> {
    const { stdout } = await execAsync(
      `${this.ffprobePath} -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`,
    )
    const duration = Number.parseFloat(stdout.trim())

    const timestamps: number[] = []
    for (let t = 0; t < duration; t += interval) {
      timestamps.push(t)
    }

    return this.extractTimelineFrames({
      videoPath,
      timestamps,
    })
  }

  async extractSubtitleFrames(videoPath: string, subtitles: unknown[]): Promise<ExtractedFrame[]> {
    const timestamps = (subtitles as Array<{ startTime: number }>).map((s) => s.startTime)
    return this.extractTimelineFrames({ videoPath, timestamps })
  }
}

function sourceToInputFile(source: unknown): string | undefined {
  if (typeof source === "string") {
    return source === "Generated" ? undefined : source
  }

  if (!source || typeof source !== "object") return undefined

  if ("File" in source && typeof source.File === "string") return source.File
  if ("Stream" in source && typeof source.Stream === "string") return source.Stream

  return undefined
}
