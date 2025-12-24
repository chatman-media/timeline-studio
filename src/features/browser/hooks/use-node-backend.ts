/**
 * React Hook for Node.js Backend
 *
 * Provides type-safe access to Node.js backend media processing
 */

import { useState, useCallback } from "react"
import { nodeBackendClient } from "@/adapters/node/node-backend-client"
import type { ScannedMediaFile } from "@/core/ports/media.port"

interface UseNodeBackendOptions {
  enabled?: boolean
  onError?: (error: Error) => void
}

interface BackendHealth {
  available: boolean
  ffmpegAvailable: boolean
  timestamp: number
}

/**
 * Hook for using Node.js backend for media operations
 *
 * @example
 * ```tsx
 * function MediaBrowser() {
 *   const { scanFolder, isScanning, error } = useNodeBackend({
 *     onError: (err) => console.error('Backend error:', err)
 *   })
 *
 *   const handleScan = async () => {
 *     const files = await scanFolder('/path/to/folder', {
 *       width: 320,
 *       height: 180
 *     })
 *     console.log('Scanned files:', files)
 *   }
 *
 *   return (
 *     <button onClick={handleScan} disabled={isScanning}>
 *       {isScanning ? 'Scanning...' : 'Scan Folder'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useNodeBackend(options: UseNodeBackendOptions = {}) {
  const { enabled = true, onError } = options

  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Check backend health and FFmpeg availability
   */
  const checkHealth = useCallback(async (): Promise<BackendHealth> => {
    try {
      const [health, ffmpeg] = await Promise.all([
        nodeBackendClient.health.check.query(),
        nodeBackendClient.health.ffmpegCheck.query(),
      ])

      return {
        available: health.status === "ok",
        ffmpegAvailable: ffmpeg.available,
        timestamp: Date.now(),
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    }
  }, [onError])

  /**
   * Scan folder for media files with thumbnail generation
   */
  const scanFolder = useCallback(
    async (
      folderPath: string,
      options: { width: number; height: number }
    ): Promise<ScannedMediaFile[]> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      setIsScanning(true)
      setError(null)

      try {
        const result = await nodeBackendClient.media.scanWithThumbnails.mutate({
          folderPath,
          width: options.width,
          height: options.height,
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsScanning(false)
      }
    },
    [enabled, onError]
  )

  /**
   * Scan folder without thumbnails
   */
  const scanFolderSimple = useCallback(
    async (
      folderPath: string,
      options?: { recursive?: boolean }
    ): Promise<ScannedMediaFile[]> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      setIsScanning(true)
      setError(null)

      try {
        const result = await nodeBackendClient.media.scanFolder.mutate({
          folderPath,
          options,
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsScanning(false)
      }
    },
    [enabled, onError]
  )

  /**
   * Get metadata for a single file
   */
  const getMetadata = useCallback(
    async (filePath: string) => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      try {
        const result = await nodeBackendClient.media.getMetadata.query({
          filePath,
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      }
    },
    [enabled, onError]
  )

  /**
   * Process multiple files
   */
  const processFiles = useCallback(
    async (filePaths: string[]): Promise<ScannedMediaFile[]> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      setIsProcessing(true)
      setError(null)

      try {
        const result = await nodeBackendClient.media.processFiles.mutate({
          filePaths,
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [enabled, onError]
  )

  /**
   * Generate thumbnail for a file
   */
  const generateThumbnail = useCallback(
    async (
      fileId: string,
      filePath: string,
      options?: { width?: number; height?: number; timestamp?: number }
    ): Promise<string> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      try {
        const result = await nodeBackendClient.thumbnail.generate.mutate({
          fileId,
          filePath,
          options,
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      }
    },
    [enabled, onError]
  )

  /**
   * Generate waveform data for audio file
   */
  const generateWaveform = useCallback(
    async (filePath: string): Promise<number[]> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      try {
        const result = await nodeBackendClient.waveform.generateData.mutate({
          filePath,
        })

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      }
    },
    [enabled, onError]
  )

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      const result = await nodeBackendClient.cache.getStats.query()
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    }
  }, [onError])

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    try {
      const result = await nodeBackendClient.cache.clear.mutate()
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    }
  }, [onError])

  return {
    // State
    isScanning,
    isProcessing,
    error,

    // Health
    checkHealth,

    // Scanning
    scanFolder,
    scanFolderSimple,

    // Processing
    getMetadata,
    processFiles,
    generateThumbnail,
    generateWaveform,

    // Cache
    getCacheStats,
    clearCache,

    // Direct client access (for advanced use)
    client: nodeBackendClient,
  }
}
