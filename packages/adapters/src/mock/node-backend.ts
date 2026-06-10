/**
 * Mock Node Backend Adapter
 *
 * Represents an unavailable optional src-node backend in tests/browser fallback.
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
} from "@timeline-studio/core/ports"

export class MockNodeBackendService implements INodeBackendService {
  async checkHealth(): Promise<NodeBackendHealth> {
    return {
      available: false,
      ffmpegAvailable: false,
      timestamp: Date.now(),
    }
  }

  async scanFolderWithThumbnails(_folderPath: string, _options: NodeBackendThumbnailSize): Promise<ScannedMediaFile[]> {
    throw new Error("Node backend is not available in mock mode")
  }

  async scanFolder(_folderPath: string, _options?: ScanFolderOptions): Promise<ScannedMediaFile[]> {
    throw new Error("Node backend is not available in mock mode")
  }

  async getMetadata(_filePath: string): Promise<MediaMetadata> {
    throw new Error("Node backend is not available in mock mode")
  }

  async processFiles(_filePaths: string[]): Promise<ScannedMediaFile[]> {
    throw new Error("Node backend is not available in mock mode")
  }

  async generateThumbnail(_fileId: string, _filePath: string, _options?: ThumbnailOptions): Promise<string> {
    throw new Error("Node backend is not available in mock mode")
  }

  async generateWaveform(_filePath: string): Promise<number[]> {
    throw new Error("Node backend is not available in mock mode")
  }

  async getCacheStats(): Promise<NodeBackendCacheStats> {
    return {
      cache: {
        memorySize: 0,
        dbSize: 0,
      },
      queue: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
      timestamp: Date.now(),
    }
  }

  async clearCache(): Promise<NodeBackendClearCacheResult> {
    return {
      success: true,
      cleared: 0,
    }
  }
}
