import { NodeMediaService } from "@timeline-studio/adapters/node/media"
import type { IMediaService } from "@timeline-studio/core/ports/media.port"
import type { CacheService } from "./cache-service"
import type { QueueService } from "./queue-service"
import { createLogger } from "../utils/logger"
import { config } from "../config"
import { PATHS } from "../config/paths"

const logger = createLogger("MediaService")

export interface MediaServiceConfig {
  cacheDir: string
  ffmpegPath: string
  ffprobePath: string
  cacheSize: number
  maxConcurrentWorkers: number
}

/**
 * Enhanced wrapper over NodeMediaService
 * Adds caching, queue management, and monitoring
 */
export class EnhancedMediaService implements IMediaService {
  private readonly nodeService: NodeMediaService
  private readonly cacheService: CacheService
  private readonly queueService?: QueueService

  constructor(
    cacheService: CacheService,
    queueService?: QueueService
  ) {
    // Initialize NodeMediaService with config
    this.nodeService = new NodeMediaService({
      cacheDir: config.CACHE_DIR,
      ffmpegPath: config.FFMPEG_PATH,
      ffprobePath: config.FFPROBE_PATH,
    })

    this.cacheService = cacheService
    this.queueService = queueService

    logger.info("Enhanced media service initialized")
  }

  // === Metadata with caching ===

  async getMetadata(filePath: string) {
    const cacheKey = `metadata:${filePath}`
    const cached = this.cacheService.get<ReturnType<IMediaService["getMetadata"]>>(cacheKey)

    if (cached) {
      logger.debug("Metadata cache hit", { filePath })
      return cached
    }

    logger.debug("Metadata cache miss, fetching", { filePath })
    const metadata = await this.nodeService.getMetadata(filePath)

    this.cacheService.set(cacheKey, metadata)

    return metadata
  }

  // === Delegate all other methods to NodeMediaService ===

  async extractMediaMetadata(filePath: string) {
    return this.nodeService.extractMediaMetadata(filePath)
  }

  async getMediaDuration(filePath: string) {
    return this.nodeService.getMediaDuration(filePath)
  }

  async processFile(filePath: string, options?: Parameters<IMediaService["processFile"]>[1]) {
    return this.nodeService.processFile(filePath, options)
  }

  async processFiles(filePaths: string[]) {
    return this.nodeService.processFiles(filePaths)
  }

  async processFilesWithThumbnails(
    paths: string[],
    width: number,
    height: number
  ) {
    return this.nodeService.processFilesWithThumbnails(paths, width, height)
  }

  async scanFolder(
    folderPath: string,
    options?: Parameters<IMediaService["scanFolder"]>[1]
  ) {
    return this.nodeService.scanFolder(folderPath, options)
  }

  async scanFolderWithThumbnails(
    folderPath: string,
    width: number,
    height: number
  ) {
    // Always process synchronously to match IMediaService interface
    // Queue service can be used via explicit batch operations
    return this.nodeService.scanFolderWithThumbnails(
      folderPath,
      width,
      height
    )
  }

  async generateThumbnail(
    fileId: string,
    filePath: string,
    options?: Parameters<IMediaService["generateThumbnail"]>[2]
  ) {
    return this.nodeService.generateThumbnail(fileId, filePath, options)
  }

  async hasCachedThumbnail(fileId: string, width: number, height: number) {
    return this.nodeService.hasCachedThumbnail(fileId, width, height)
  }

  async getCachedThumbnailPath(fileId: string, width: number, height: number) {
    return this.nodeService.getCachedThumbnailPath(fileId, width, height)
  }

  async generateAudioWaveform(filePath: string) {
    return this.nodeService.generateAudioWaveform(filePath)
  }

  async detectVideoScenes(filePath: string) {
    return this.nodeService.detectVideoScenes(filePath)
  }

  async generateVideoThumbnail(videoPath: string, time: number) {
    return this.nodeService.generateVideoThumbnail(videoPath, time)
  }

  async getPreviewData(fileId: string) {
    return this.nodeService.getPreviewData(fileId)
  }

  async savePreviewData(path: string) {
    return this.nodeService.savePreviewData(path)
  }

  async importFiles(
    paths: string[],
    options?: Parameters<IMediaService["importFiles"]>[1]
  ) {
    return this.nodeService.importFiles(paths, options)
  }

  async cancelProcessing(filePath: string) {
    return this.nodeService.cancelProcessing(filePath)
  }

  async getMediaFiles(directory: string) {
    return this.nodeService.getMediaFiles(directory)
  }

  async loadPreviewData(path: string) {
    return this.nodeService.loadPreviewData(path)
  }

  async clearPreviewData(fileId?: string) {
    return this.nodeService.clearPreviewData(fileId)
  }

  async saveTimelineFrames(fileId: string, frames: string[]) {
    return this.nodeService.saveTimelineFrames(fileId, frames)
  }

  async getTimelineFrames(fileId: string) {
    return this.nodeService.getTimelineFrames(fileId)
  }

  async getFilesWithPreviews() {
    return this.nodeService.getFilesWithPreviews()
  }

  async restorePreviewCache() {
    return this.nodeService.restorePreviewCache()
  }

  async ejectDevice(deviceId: string) {
    return this.nodeService.ejectDevice(deviceId)
  }

  async generateWaveformPreview(audioPath: string, outputPath: string, options?: Parameters<IMediaService["generateWaveformPreview"]>[2]) {
    return this.nodeService.generateWaveformPreview(audioPath, outputPath, options)
  }

  async generateProxy(sourcePath: string, options: Parameters<IMediaService["generateProxy"]>[1]) {
    return this.nodeService.generateProxy(sourcePath, options)
  }
}
