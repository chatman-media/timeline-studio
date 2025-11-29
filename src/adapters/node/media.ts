/**
 * Node.js Media Adapter
 *
 * Реализация IMediaService для Node.js.
 * Использует ffprobe/ffmpeg CLI для работы с медиафайлами.
 */

import { exec } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import fsPromises from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import type {
  IMediaService,
  MediaImportOptions,
  MediaImportResult,
  MediaMetadata,
  MediaPreviewData,
  ProcessMediaOptions,
  ProcessMediaResult,
  ProxyGenerationOptions,
  ProxyGenerationResult,
  ScanFolderOptions,
  ScannedMediaFile,
  SceneDetectionResult,
  ThumbnailOptions,
  WaveformOptions,
} from "@/core/ports"

const execAsync = promisify(exec)

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".wmv", ".flv"]
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a", ".wma"]
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".svg"]

export interface NodeMediaOptions {
  cacheDir?: string
  ffmpegPath?: string
  ffprobePath?: string
}

export class NodeMediaService implements IMediaService {
  private cacheDir: string
  private ffmpegPath: string
  private ffprobePath: string
  private previewCache = new Map<string, MediaPreviewData>()
  private timelineFramesCache = new Map<string, string[]>()

  constructor(options: NodeMediaOptions = {}) {
    this.cacheDir = options.cacheDir || path.join(os.tmpdir(), "timeline-studio-cache")
    this.ffmpegPath = options.ffmpegPath || "ffmpeg"
    this.ffprobePath = options.ffprobePath || "ffprobe"

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  // ============================================================================
  // Metadata
  // ============================================================================

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    const ext = path.extname(filePath).toLowerCase()

    if (IMAGE_EXTENSIONS.includes(ext)) {
      return this.getImageMetadata(filePath)
    }

    try {
      const { stdout } = await execAsync(
        `${this.ffprobePath} -v quiet -print_format json -show_format -show_streams "${filePath}"`,
      )
      const probe = JSON.parse(stdout)

      const videoStream = probe.streams?.find((s: { codec_type: string }) => s.codec_type === "video")
      const audioStream = probe.streams?.find((s: { codec_type: string }) => s.codec_type === "audio")
      const format = probe.format

      if (videoStream) {
        return {
          type: "Video",
          duration: Number.parseFloat(format?.duration || "0"),
          width: videoStream.width,
          height: videoStream.height,
          fps: this.parseFps(videoStream.r_frame_rate || videoStream.avg_frame_rate),
          codec: videoStream.codec_name,
          bitrate: Number.parseInt(format?.bit_rate || "0", 10),
          size: Number.parseInt(format?.size || "0", 10),
          creation_time: format?.tags?.creation_time,
        }
      }
      if (audioStream) {
        return {
          type: "Audio",
          duration: Number.parseFloat(format?.duration || "0"),
          codec: audioStream.codec_name,
          bitrate: Number.parseInt(format?.bit_rate || audioStream.bit_rate || "0", 10),
          sample_rate: Number.parseInt(audioStream.sample_rate || "0", 10),
          channels: audioStream.channels,
          size: Number.parseInt(format?.size || "0", 10),
          creation_time: format?.tags?.creation_time,
        }
      }
    } catch (error) {
      console.error("Failed to get metadata:", error)
    }

    return { type: "Unknown" }
  }

  private async getImageMetadata(filePath: string): Promise<MediaMetadata> {
    try {
      const { stdout } = await execAsync(`file "${filePath}"`)
      const stats = await fsPromises.stat(filePath)
      const sizeMatch = stdout.match(/(\d+)\s*x\s*(\d+)/)

      return {
        type: "Image",
        width: sizeMatch ? Number.parseInt(sizeMatch[1], 10) : undefined,
        height: sizeMatch ? Number.parseInt(sizeMatch[2], 10) : undefined,
        format: path.extname(filePath).slice(1).toUpperCase(),
        size: stats.size,
      }
    } catch {
      const stats = await fsPromises.stat(filePath)
      return {
        type: "Image",
        format: path.extname(filePath).slice(1).toUpperCase(),
        size: stats.size,
      }
    }
  }

  private parseFps(fpsString: string): number {
    if (!fpsString) return 0
    const [num, den] = fpsString.split("/")
    if (den) {
      return Math.round((Number.parseInt(num, 10) / Number.parseInt(den, 10)) * 100) / 100
    }
    return Number.parseFloat(num) || 0
  }

  async getMediaFiles(directory: string): Promise<string[]> {
    const allExtensions = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS, ...IMAGE_EXTENSIONS]
    const files: string[] = []

    const entries = await fsPromises.readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (allExtensions.includes(ext)) {
          files.push(path.join(directory, entry.name))
        }
      }
    }

    return files
  }

  // ============================================================================
  // Processing
  // ============================================================================

  async processFile(filePath: string, options?: ProcessMediaOptions): Promise<ProcessMediaResult> {
    const metadata = await this.getMetadata(filePath)
    const result: ProcessMediaResult = { metadata }

    if (options?.generateThumbnail && metadata.type === "Video") {
      const fileId = this.generateFileId(filePath)
      result.thumbnailPath = await this.generateThumbnail(fileId, filePath, { timestamp: 1 })
    }

    if (options?.extractAudio && metadata.type === "Video") {
      result.audioPath = await this.extractAudio(filePath)
    }

    return result
  }

  async cancelProcessing(_filePath: string): Promise<void> {
    console.warn("NodeMediaService: cancelProcessing not implemented")
  }

  private async extractAudio(videoPath: string): Promise<string> {
    const outputPath = path.join(this.cacheDir, `audio_${Date.now()}.wav`)
    await execAsync(`${this.ffmpegPath} -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${outputPath}" -y`)
    return outputPath
  }

  // ============================================================================
  // Thumbnails
  // ============================================================================

  async generateThumbnail(fileId: string, filePath: string, options?: ThumbnailOptions): Promise<string> {
    const width = options?.width || 320
    const height = options?.height || 180
    const timestamp = options?.timestamp || 1

    const thumbnailDir = path.join(this.cacheDir, "thumbnails")
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true })
    }

    const outputPath = path.join(thumbnailDir, `${fileId}_${width}x${height}.jpg`)

    if (fs.existsSync(outputPath)) {
      return outputPath
    }

    const ext = path.extname(filePath).toLowerCase()

    if (VIDEO_EXTENSIONS.includes(ext)) {
      await execAsync(
        `${this.ffmpegPath} -ss ${timestamp} -i "${filePath}" -vframes 1 -s ${width}x${height} "${outputPath}" -y`,
      )
    } else if (IMAGE_EXTENSIONS.includes(ext)) {
      await execAsync(`${this.ffmpegPath} -i "${filePath}" -vf "scale=${width}:${height}" "${outputPath}" -y`)
    }

    return outputPath
  }

  async hasCachedThumbnail(fileId: string, width: number, height: number): Promise<boolean> {
    const thumbnailPath = path.join(this.cacheDir, "thumbnails", `${fileId}_${width}x${height}.jpg`)
    return fs.existsSync(thumbnailPath)
  }

  async getCachedThumbnailPath(fileId: string, width: number, height: number): Promise<string> {
    return path.join(this.cacheDir, "thumbnails", `${fileId}_${width}x${height}.jpg`)
  }

  // ============================================================================
  // Preview Data
  // ============================================================================

  async savePreviewData(filePath: string): Promise<void> {
    const fileId = this.generateFileId(filePath)
    const metadata = await this.getMetadata(filePath)
    const previewData: MediaPreviewData = {}

    if (metadata.type === "Video") {
      previewData.thumbnailPath = await this.generateThumbnail(fileId, filePath)
    }

    this.previewCache.set(fileId, previewData)
  }

  async loadPreviewData(filePath: string): Promise<MediaPreviewData | null> {
    const fileId = this.generateFileId(filePath)
    return this.previewCache.get(fileId) || null
  }

  async getPreviewData(fileId: string): Promise<MediaPreviewData | null> {
    return this.previewCache.get(fileId) || null
  }

  async clearPreviewData(fileId?: string): Promise<void> {
    if (fileId) {
      this.previewCache.delete(fileId)
    } else {
      this.previewCache.clear()
    }
  }

  // ============================================================================
  // Timeline Frames
  // ============================================================================

  async saveTimelineFrames(fileId: string, frames: string[]): Promise<void> {
    this.timelineFramesCache.set(fileId, frames)
  }

  async getTimelineFrames(fileId: string): Promise<string[]> {
    return this.timelineFramesCache.get(fileId) || []
  }

  // ============================================================================
  // Folder Scanning
  // ============================================================================

  async scanFolder(folderPath: string, options?: ScanFolderOptions): Promise<ScannedMediaFile[]> {
    const results: ScannedMediaFile[] = []
    const allExtensions = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS, ...IMAGE_EXTENSIONS]

    const walk = async (dir: string): Promise<void> => {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (!options?.includeHidden && entry.name.startsWith(".")) continue

        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory() && options?.recursive) {
          await walk(fullPath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (allExtensions.includes(ext)) {
            const stats = await fsPromises.stat(fullPath)
            results.push({
              path: fullPath,
              name: entry.name,
              size: stats.size,
              modifiedAt: stats.mtime.toISOString(),
              type: VIDEO_EXTENSIONS.includes(ext) ? "video" : AUDIO_EXTENSIONS.includes(ext) ? "audio" : "image",
            })
          }
        }
      }
    }

    await walk(folderPath)
    return results
  }

  async scanFolderWithThumbnails(
    folderPath: string,
    thumbnailWidth: number,
    thumbnailHeight: number,
  ): Promise<ScannedMediaFile[]> {
    const files = await this.scanFolder(folderPath, { recursive: true })

    for (const file of files) {
      if (file.type === "video" || file.type === "image") {
        const fileId = this.generateFileId(file.path)
        try {
          const thumbnailPath = await this.generateThumbnail(fileId, file.path, {
            width: thumbnailWidth,
            height: thumbnailHeight,
          })
          const thumbnailBuffer = await fsPromises.readFile(thumbnailPath)
          file.thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString("base64")}`
        } catch {
          // Ignore thumbnail generation errors
        }
      }
    }

    return files
  }

  // ============================================================================
  // Cache Management
  // ============================================================================

  async getFilesWithPreviews(): Promise<string[]> {
    return Array.from(this.previewCache.keys())
  }

  async restorePreviewCache(): Promise<number> {
    return this.previewCache.size
  }

  // ============================================================================
  // Device Operations
  // ============================================================================

  async ejectDevice(deviceId: string): Promise<void> {
    const platform = os.platform()
    if (platform === "darwin") {
      await execAsync(`diskutil eject "${deviceId}"`)
    } else if (platform === "linux") {
      await execAsync(`eject "${deviceId}"`)
    }
  }

  // ============================================================================
  // Import Operations
  // ============================================================================

  async importFiles(paths: string[], options?: MediaImportOptions): Promise<MediaImportResult> {
    const imported: string[] = []
    const failed: Array<{ path: string; error: string }> = []

    for (const filePath of paths) {
      try {
        await fsPromises.access(filePath)
        if (options?.generateThumbnails) {
          const fileId = this.generateFileId(filePath)
          await this.generateThumbnail(fileId, filePath)
        }
        imported.push(filePath)
      } catch (error) {
        failed.push({
          path: filePath,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return { imported, failed }
  }

  // ============================================================================
  // Batch Processing
  // ============================================================================

  async processFiles(filePaths: string[]): Promise<ScannedMediaFile[]> {
    const results: ScannedMediaFile[] = []

    for (const filePath of filePaths) {
      try {
        const stats = await fsPromises.stat(filePath)
        const ext = path.extname(filePath).toLowerCase()

        results.push({
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          type: VIDEO_EXTENSIONS.includes(ext) ? "video" : AUDIO_EXTENSIONS.includes(ext) ? "audio" : "image",
          metadata: await this.getMetadata(filePath),
        })
      } catch (error) {
        console.error(`Failed to process ${filePath}:`, error)
      }
    }

    return results
  }

  async processFilesWithThumbnails(
    filePaths: string[],
    thumbnailWidth: number,
    thumbnailHeight: number,
  ): Promise<ScannedMediaFile[]> {
    const files = await this.processFiles(filePaths)

    for (const file of files) {
      if (file.type === "video" || file.type === "image") {
        const fileId = this.generateFileId(file.path)
        try {
          const thumbnailPath = await this.generateThumbnail(fileId, file.path, {
            width: thumbnailWidth,
            height: thumbnailHeight,
          })
          const thumbnailBuffer = await fsPromises.readFile(thumbnailPath)
          file.thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString("base64")}`
        } catch {
          // Ignore errors
        }
      }
    }

    return files
  }

  // ============================================================================
  // Audio Analysis
  // ============================================================================

  async generateWaveformPreview(audioPath: string, outputPath: string, options?: WaveformOptions): Promise<string> {
    const width = options?.width || 800
    const height = options?.height || 100
    const color = options?.color || "0x00ff00"

    await execAsync(
      `${this.ffmpegPath} -i "${audioPath}" -filter_complex "showwavespic=s=${width}x${height}:colors=${color}" -frames:v 1 "${outputPath}" -y`,
    )

    return outputPath
  }

  async generateAudioWaveform(filePath: string): Promise<number[]> {
    try {
      const { stdout } = await execAsync(
        `${this.ffmpegPath} -i "${filePath}" -ac 1 -filter:a "aresample=8000" -f f32le -`,
        { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
      )

      const peaks: number[] = []
      const buffer = stdout as unknown as Buffer
      const samples = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4)
      const step = Math.max(1, Math.floor(samples.length / 1000))

      for (let i = 0; i < samples.length; i += step) {
        let max = 0
        for (let j = i; j < Math.min(i + step, samples.length); j++) {
          max = Math.max(max, Math.abs(samples[j]))
        }
        peaks.push(max)
      }

      return peaks
    } catch {
      return []
    }
  }

  // ============================================================================
  // Video Analysis
  // ============================================================================

  async detectVideoScenes(filePath: string): Promise<SceneDetectionResult[]> {
    try {
      const { stdout } = await execAsync(
        `${this.ffmpegPath} -i "${filePath}" -filter:v "select='gt(scene,0.4)',showinfo" -f null - 2>&1 | grep showinfo`,
      )

      const scenes: SceneDetectionResult[] = []
      const lines = stdout.split("\n")

      for (const line of lines) {
        const timeMatch = line.match(/pts_time:(\d+\.?\d*)/)
        if (timeMatch) {
          const time = Number.parseFloat(timeMatch[1])
          scenes.push({ startTime: time, endTime: time, confidence: 0.4 })
        }
      }

      return scenes
    } catch {
      return []
    }
  }

  async generateVideoThumbnail(videoPath: string, time: number): Promise<string> {
    const fileId = this.generateFileId(videoPath)
    return this.generateThumbnail(fileId, videoPath, { timestamp: time })
  }

  async extractMediaMetadata(filePath: string): Promise<MediaMetadata> {
    return this.getMetadata(filePath)
  }

  async getMediaDuration(filePath: string): Promise<number> {
    const metadata = await this.getMetadata(filePath)
    if (metadata.type === "Video" || metadata.type === "Audio") {
      return metadata.duration || 0
    }
    return 0
  }

  // ============================================================================
  // Proxy Generation
  // ============================================================================

  async generateProxy(sourcePath: string, options: ProxyGenerationOptions): Promise<ProxyGenerationResult> {
    const startTime = Date.now()
    const proxyDir = path.join(this.cacheDir, "proxies")

    if (!fs.existsSync(proxyDir)) {
      fs.mkdirSync(proxyDir, { recursive: true })
    }

    const fileId = this.generateFileId(sourcePath)
    const proxyPath = path.join(proxyDir, `${fileId}_${options.width}x${options.height}.mp4`)

    const codec = options.codec || "libx264"
    const bitrate = options.bitrate || "2M"
    const fps = options.fps ? `-r ${options.fps}` : ""
    const audio = options.preserveAudio ? "-c:a aac" : "-an"

    await execAsync(
      `${this.ffmpegPath} -i "${sourcePath}" -vf "scale=${options.width}:${options.height}" -c:v ${codec} -b:v ${bitrate} ${fps} ${audio} "${proxyPath}" -y`,
    )

    const stats = await fsPromises.stat(proxyPath)

    return {
      proxyPath,
      sourcePath,
      size: stats.size,
      resolution: { width: options.width, height: options.height },
      generationTime: Date.now() - startTime,
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private generateFileId(filePath: string): string {
    return crypto.createHash("md5").update(filePath).digest("hex").slice(0, 16)
  }
}
