/**
 * React Hook for Node.js Backend
 *
 * Provides type-safe access to Node.js backend media processing
 */

import { useCallback, useState } from "react"
import { getNodeBackend } from "@/core/container"
import type { NodeBackendHealth } from "@/core/ports"
import type { ScannedMediaFile } from "@/core/ports/media.port"

interface UseNodeBackendOptions {
  enabled?: boolean
  onError?: (error: Error) => void
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

  const [nodeBackend] = useState(() => getNodeBackend())
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Check backend health and FFmpeg availability
   */
  const checkHealth = useCallback(async (): Promise<NodeBackendHealth> => {
    try {
      return await nodeBackend.checkHealth()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    }
  }, [nodeBackend, onError])

  /**
   * Scan folder for media files with thumbnail generation
   */
  const scanFolder = useCallback(
    async (folderPath: string, options: { width: number; height: number }): Promise<ScannedMediaFile[]> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      setIsScanning(true)
      setError(null)

      try {
        return await nodeBackend.scanFolderWithThumbnails(folderPath, options)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsScanning(false)
      }
    },
    [enabled, nodeBackend, onError],
  )

  /**
   * Scan folder without thumbnails
   */
  const scanFolderSimple = useCallback(
    async (folderPath: string, options?: { recursive?: boolean }): Promise<ScannedMediaFile[]> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      setIsScanning(true)
      setError(null)

      try {
        return await nodeBackend.scanFolder(folderPath, options)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsScanning(false)
      }
    },
    [enabled, nodeBackend, onError],
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
        return await nodeBackend.getMetadata(filePath)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      }
    },
    [enabled, nodeBackend, onError],
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
        return await nodeBackend.processFiles(filePaths)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [enabled, nodeBackend, onError],
  )

  /**
   * Generate thumbnail for a file
   */
  const generateThumbnail = useCallback(
    async (
      fileId: string,
      filePath: string,
      options?: { width?: number; height?: number; timestamp?: number },
    ): Promise<string> => {
      if (!enabled) {
        throw new Error("Node backend is disabled")
      }

      try {
        return await nodeBackend.generateThumbnail(fileId, filePath, options)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      }
    },
    [enabled, nodeBackend, onError],
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
        return await nodeBackend.generateWaveform(filePath)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        onError?.(error)
        throw error
      }
    },
    [enabled, nodeBackend, onError],
  )

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      return await nodeBackend.getCacheStats()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    }
  }, [nodeBackend, onError])

  /**
   * Clear cache
   */
  const clearCache = useCallback(async () => {
    try {
      return await nodeBackend.clearCache()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error)
      throw error
    }
  }, [nodeBackend, onError])

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

    // Core port access for advanced use
    client: nodeBackend,
  }
}
