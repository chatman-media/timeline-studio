/**
 * Node Backend Bridge Adapter
 *
 * Thin adapter around the src-node tRPC client.
 */

import type {
  INodeBackendService,
  MediaMetadata,
  NodeBackendCacheStats,
  NodeBackendClearCacheResult,
  NodeBackendHealth,
  NodeBackendThumbnailSize,
  ScanFolderOptions,
  ScannedMediaFile,
  ThumbnailOptions,
} from "@/core/ports"

import { createNodeBackendClient, type NodeBackendClient, nodeBackendClient } from "./node-backend-client"

export interface NodeBackendBridgeOptions {
  client?: NodeBackendClient
  serverUrl?: string
}

export class NodeBackendBridgeService implements INodeBackendService {
  private readonly client: NodeBackendClient

  constructor(options: NodeBackendBridgeOptions = {}) {
    this.client = options.client ?? (options.serverUrl ? createNodeBackendClient(options.serverUrl) : nodeBackendClient)
  }

  async checkHealth(): Promise<NodeBackendHealth> {
    const [health, ffmpeg] = await Promise.all([
      this.client.health.check.query(),
      this.client.health.ffmpegCheck.query(),
    ])

    return {
      available: health.status === "ok",
      ffmpegAvailable: ffmpeg.available,
      timestamp: Date.now(),
    }
  }

  async scanFolderWithThumbnails(folderPath: string, options: NodeBackendThumbnailSize): Promise<ScannedMediaFile[]> {
    return this.client.media.scanWithThumbnails.mutate({
      folderPath,
      width: options.width,
      height: options.height,
    })
  }

  async scanFolder(folderPath: string, options?: ScanFolderOptions): Promise<ScannedMediaFile[]> {
    return this.client.media.scanFolder.mutate({
      folderPath,
      recursive: options?.recursive,
    })
  }

  async getMetadata(filePath: string): Promise<MediaMetadata> {
    return this.client.media.getMetadata.query({ filePath })
  }

  async processFiles(filePaths: string[]): Promise<ScannedMediaFile[]> {
    return this.client.media.processFiles.mutate({ filePaths })
  }

  async generateThumbnail(fileId: string, filePath: string, options?: ThumbnailOptions): Promise<string> {
    return this.client.thumbnail.generate.mutate({
      fileId,
      filePath,
      width: options?.width,
      height: options?.height,
      timestamp: options?.timestamp,
    })
  }

  async generateWaveform(filePath: string): Promise<number[]> {
    return this.client.waveform.generateData.query({ filePath })
  }

  async getCacheStats(): Promise<NodeBackendCacheStats> {
    return this.client.cache.getStats.query()
  }

  async clearCache(): Promise<NodeBackendClearCacheResult> {
    return this.client.cache.clear.mutate()
  }
}
