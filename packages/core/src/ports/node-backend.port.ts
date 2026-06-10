/**
 * Node Backend Port Interface
 *
 * Contract for optional src-node media processing backend access.
 * Implementations live in adapters so UI code never imports node/trpc clients.
 */

import type { MediaMetadata, ScanFolderOptions, ScannedMediaFile, ThumbnailOptions } from "./media.port"

export interface NodeBackendHealth {
  available: boolean
  ffmpegAvailable: boolean
  timestamp: number
}

export interface NodeBackendThumbnailSize {
  width: number
  height: number
}

export interface NodeBackendCacheStats {
  cache: {
    memorySize: number
    dbSize: number
  }
  queue: {
    pending: number
    processing: number
    completed: number
    failed: number
  }
  timestamp: number
}

export interface NodeBackendClearCacheResult {
  success: boolean
  timestamp?: number
  cleared?: number
}

export interface INodeBackendService {
  checkHealth(): Promise<NodeBackendHealth>
  scanFolderWithThumbnails(folderPath: string, options: NodeBackendThumbnailSize): Promise<ScannedMediaFile[]>
  scanFolder(folderPath: string, options?: ScanFolderOptions): Promise<ScannedMediaFile[]>
  getMetadata(filePath: string): Promise<MediaMetadata>
  processFiles(filePaths: string[]): Promise<ScannedMediaFile[]>
  generateThumbnail(fileId: string, filePath: string, options?: ThumbnailOptions): Promise<string>
  generateWaveform(filePath: string): Promise<number[]>
  getCacheStats(): Promise<NodeBackendCacheStats>
  clearCache(): Promise<NodeBackendClearCacheResult>
}
