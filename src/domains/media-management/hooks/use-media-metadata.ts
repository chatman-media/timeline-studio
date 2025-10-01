/**
 * Media Metadata Hook
 *
 * Хук для работы с метаданными медиа файлов
 */

import { useCallback, useState } from "react"
import type { MediaMetadata } from "../types"
import { useMediaManagement } from "./use-media-management"

export function useMediaMetadata() {
  const { extractMetadata, getMediaInfo } = useMediaManagement()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getMetadata = useCallback(
    async (filePath: string): Promise<MediaMetadata | null> => {
      setLoading(true)
      setError(null)

      try {
        const metadata = await extractMetadata(filePath)
        return metadata
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to extract metadata"
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [extractMetadata],
  )

  const getInfo = useCallback(
    async (filePath: string) => {
      setLoading(true)
      setError(null)

      try {
        const info = await getMediaInfo(filePath)
        return info
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to get media info"
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [getMediaInfo],
  )

  return {
    loading,
    error,
    getMetadata,
    getInfo,
  }
}
