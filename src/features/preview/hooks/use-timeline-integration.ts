/**
 * Timeline Integration Hook
 * Connects preview system with timeline state
 */

import { useCallback, useEffect, useRef } from "react"
import { usePlayer } from "@/domains/video-editing"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useTimelineSelection } from "@/features/timeline/hooks/use-timeline-selection"
import { createLogger } from "@/lib/tauri-logger"
import type { EffectPipelineManager } from "../services/effect-pipeline-manager"
import type { WebGL2PreviewRenderer } from "../services/webgl2-preview-renderer"
import type { Effect, GPUTier, PreviewQuality } from "../types"

const logger = createLogger({ module: "UseTimelineIntegration" })

interface UseTimelineIntegrationOptions {
  renderer: WebGL2PreviewRenderer | null
  pipelineManager: EffectPipelineManager | null
  gpuTier: GPUTier
  quality: PreviewQuality
}

export function useTimelineIntegration({ renderer, pipelineManager, quality }: UseTimelineIntegrationOptions) {
  const { currentTime } = useTimeline()
  const { selectedClips } = useTimelineSelection()
  const { isPlaying, currentVideo } = usePlayer()

  const selectedClipId = selectedClips?.[0]?.id || null
  const currentMediaFile = currentVideo

  // TODO: Implement these functions when timeline effects system is ready
  const getEffectsAtTime = useCallback((_time: number) => {
    // Returns effects active at specific time
    return []
  }, [])

  const getEffectsForClip = useCallback((_clipId: string) => {
    // Returns effects applied to specific clip
    return []
  }, [])

  const lastUpdateTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number>(0)

  /**
   * Get active effects at current timeline position
   */
  const getActiveEffects = useCallback((): Effect[] => {
    if (!pipelineManager) return []

    // Get effects from timeline at current time
    const timelineEffects = getEffectsAtTime(currentTime)

    // Get effects from selected clip if any
    let clipEffects: Effect[] = []
    if (selectedClipId) {
      clipEffects = getEffectsForClip(selectedClipId)
    }

    // Combine timeline and clip effects
    const allEffects = [...timelineEffects, ...clipEffects]

    // Convert to preview system format
    const previewEffects: Effect[] = allEffects.map((effect) => ({
      id: effect.id,
      type: effect.type,
      enabled: effect.enabled,
      parameters: effect.parameters || {},
      intensity: effect.intensity || 1.0,
    }))

    // Get optimized effects from pipeline manager
    return pipelineManager.getOptimizedEffects()
  }, [currentTime, selectedClipId, getEffectsAtTime, getEffectsForClip, pipelineManager])

  /**
   * Update preview frame
   */
  const updatePreview = useCallback(async () => {
    if (!renderer || !currentMediaFile) return

    try {
      const activeEffects = getActiveEffects()

      // Create dummy video element for frame extraction
      const video = document.createElement("video")
      video.src = currentMediaFile.path
      video.currentTime = currentTime
      video.muted = true

      // Wait for video to seek to correct position
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Seek timeout")), 5000)

        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked)
          video.removeEventListener("error", onError)
          clearTimeout(timeout)
          resolve()
        }

        const onError = () => {
          video.removeEventListener("seeked", onSeeked)
          video.removeEventListener("error", onError)
          clearTimeout(timeout)
          reject(new Error("Video error"))
        }

        video.addEventListener("seeked", onSeeked)
        video.addEventListener("error", onError)
      })

      // Set video source and render
      renderer.setVideoSource(video)
      renderer.setCurrentTime(currentTime)
      renderer.render(0)

      // Capture the rendered frame
      const renderedFrame = await renderer.captureFrame()

      // Clean up
      video.remove()

      return renderedFrame
    } catch (error: unknown) {
      logger.error("Failed to update preview:", { error })
      return null
    }
  }, [renderer, currentMediaFile, currentTime, getActiveEffects])

  /**
   * Animation loop for real-time updates during playback
   */
  const animationLoop = useCallback(() => {
    const now = performance.now()

    // Throttle updates based on quality settings
    const updateInterval = 1000 / quality.fps

    if (now - lastUpdateTimeRef.current >= updateInterval) {
      void updatePreview()
      lastUpdateTimeRef.current = now
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animationLoop)
    }
  }, [updatePreview, quality.fps, isPlaying])

  /**
   * Start/stop animation loop based on playback state
   */
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animationLoop)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      // Update preview once when stopped
      void updatePreview()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, animationLoop, updatePreview])

  /**
   * Update preview when timeline position changes (scrubbing)
   */
  useEffect(() => {
    if (!isPlaying) {
      void updatePreview()
    }
  }, [currentTime, updatePreview, isPlaying])

  /**
   * Update preview when effects change
   */
  useEffect(() => {
    void updatePreview()
  }, [updatePreview]) // updatePreview already includes effect dependencies

  /**
   * Sync playhead position for preview
   */
  const getPlayheadPosition = useCallback(() => {
    if (!currentMediaFile || !currentMediaFile.duration) return 0
    return currentTime / currentMediaFile.duration
  }, [currentTime, currentMediaFile])

  /**
   * Jump to specific time
   */
  const seekToTime = useCallback(
    (_time: number) => {
      // This would be implemented by the timeline state management
      // For now, just update preview
      void updatePreview()
    },
    [updatePreview],
  )

  /**
   * Toggle effect at current position
   */
  const toggleEffectAtPosition = useCallback(
    (_effectId: string) => {
      // This would interact with timeline effect management
      // For now, just trigger preview update
      void updatePreview()
    },
    [updatePreview],
  )

  return {
    // State
    currentTime,
    isPlaying,
    playheadPosition: getPlayheadPosition(),
    activeEffects: getActiveEffects(),

    // Actions
    updatePreview,
    seekToTime,
    toggleEffectAtPosition,

    // Utils
    hasMediaFile: !!currentMediaFile,
  }
}
