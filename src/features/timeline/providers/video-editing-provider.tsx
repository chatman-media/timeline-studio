/**
 * Video Editing Domain Provider
 *
 * Предоставляет контекст для работы с Video Editing доменом
 */

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  getVideoEditingOrchestrator,
  type VideoEditingOrchestrator,
} from "@/domains/video-editing/services/video-editing-orchestrator"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("VideoEditingProvider")

interface VideoEditingContextValue {
  orchestrator: VideoEditingOrchestrator
}

const VideoEditingContext = createContext<VideoEditingContextValue | null>(null)

interface VideoEditingProviderProps {
  children: React.ReactNode
}

export function VideoEditingProvider({ children }: VideoEditingProviderProps) {
  const [orchestrator] = useState(() => getVideoEditingOrchestrator())

  useEffect(() => {
    logger.info("[Video Editing Provider] Initialized")

    return () => {
      logger.info("[Video Editing Provider] Cleanup")
    }
  }, [])

  const value: VideoEditingContextValue = {
    orchestrator,
  }

  return (
    <VideoEditingContext.Provider value={value} data-oid="qszqsvu">
      {children}
    </VideoEditingContext.Provider>
  )
}

/**
 * Hook для доступа к Video Editing контексту
 */
export function useVideoEditingContext() {
  const context = useContext(VideoEditingContext)

  if (!context) {
    throw new Error("useVideoEditingContext must be used within VideoEditingProvider")
  }

  return context
}
