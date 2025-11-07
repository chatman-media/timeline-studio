/**
 * React hook for WebGL2-based real-time preview
 * Использует новую унифицированную WebGL2 библиотеку
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useTimelineEffects } from "@/features/timeline/hooks/use-timeline-effects"
import { usePlayer } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"
import { PreviewCache } from "../services/preview-cache"
import { WebGL2PreviewRenderer } from "../services/webgl2-preview-renderer"
import type { Effect, GPUTier, PreviewQuality } from "../types"

const logger = createLogger({ module: "UseWebgl2Preview" })

// Throttle utility function
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      lastExecTime = currentTime
      return func(...args)
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      lastExecTime = Date.now()
      func(...args)
    }, delay)
  }) as T
}

interface UseWebGL2PreviewOptions {
  cacheSize?: number // MB
  prefetchRange?: number // seconds
  updateInterval?: number // ms
}

export function useWebGL2Preview(options: UseWebGL2PreviewOptions = {}) {
  const {
    cacheSize = 100,
    prefetchRange = 2,
    updateInterval = 33, // ~30fps
  } = options

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGL2PreviewRenderer | null>(null)
  const cacheRef = useRef<PreviewCache | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [previewFrame, setPreviewFrame] = useState<ImageBitmap | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [gpuTier, setGpuTier] = useState<GPUTier>("medium")
  const [quality, setQuality] = useState<PreviewQuality>({
    resolution: 1.0,
    effects: "all",
    fps: 30,
    antialiasing: true,
  })
  const [cacheStats, setCacheStats] = useState({
    entries: 0,
    sizeMB: 0,
    hitRate: 0,
  })

  const timeline = useTimeline()
  const player = usePlayer()
  const { getClipEffects, getClipFilters, getClipTransitions } = useTimelineEffects()

  const currentTime = player.currentTime
  const selectedClipId = timeline.selectedClipIds?.[0]
  const mediaFile = player.currentVideo
  const isPlaying = player.isPlaying

  // Get enabled effects at current time
  const activeEffects = useMemo(() => {
    if (!timeline.project) return []

    const effects: Effect[] = []

    // Получаем все клипы на текущем времени
    for (const section of timeline.project.sections) {
      for (const track of section.tracks) {
        for (const clip of track.clips) {
          // Проверяем, попадает ли текущее время в клип
          if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
            // Добавляем эффекты клипа
            const clipEffects = getClipEffects(clip.id)
            effects.push(
              ...clipEffects.map((e) => ({
                id: e.id,
                type: e.effectId as any, // AppliedEffect uses effectId, not type
                enabled: e.enabled,
                parameters: e.parameters || {},
                intensity: 1.0, // Default intensity for compatibility
              })),
            )

            // Добавляем фильтры клипа
            const clipFilters = getClipFilters(clip.id)
            effects.push(
              ...clipFilters.map((f) => ({
                id: f.id,
                type: f.filterId as any, // AppliedFilter uses filterId, not type
                enabled: f.enabled,
                parameters: f.parameters || {},
                intensity: 1.0, // Default intensity for compatibility
              })),
            )

            // Проверяем переходы
            const transitions = getClipTransitions(clip.id)
            for (const transition of transitions) {
              // Определяем, активен ли переход в текущий момент
              const transitionTime = currentTime - clip.startTime
              if (transition.type === "in" && transitionTime < transition.duration) {
                effects.push({
                  id: transition.id,
                  type: transition.transitionId as any,
                  enabled: transition.isEnabled,
                  parameters: {
                    ...transition.parameters,
                    progress: transitionTime / transition.duration,
                  },
                  intensity: 1.0,
                })
              } else if (transition.type === "out" && transitionTime > clip.duration - transition.duration) {
                const progress = (transitionTime - (clip.duration - transition.duration)) / transition.duration
                effects.push({
                  id: transition.id,
                  type: transition.transitionId as any,
                  enabled: transition.isEnabled,
                  parameters: {
                    ...transition.parameters,
                    progress,
                  },
                  intensity: 1.0,
                })
              }
            }
          }
        }
      }
    }

    // Добавляем глобальные эффекты треков
    for (const track of timeline.project.globalTracks) {
      for (const clip of track.clips) {
        if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
          const clipEffects = getClipEffects(clip.id)
          effects.push(
            ...clipEffects.map((e) => ({
              id: e.id,
              type: e.effectId as any, // AppliedEffect uses effectId, not type
              enabled: e.enabled,
              parameters: e.parameters || {},
              intensity: 1.0, // Default intensity for compatibility
            })),
          )
        }
      }
    }

    return effects.filter((effect) => effect.enabled)
  }, [currentTime, timeline.project, getClipEffects, getClipFilters, getClipTransitions])

  // Initialize WebGL2 renderer
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // Create WebGL2 renderer
    const renderer = new WebGL2PreviewRenderer({
      name: "preview",
      canvas,
      antialias: quality.antialiasing,
    })

    // Create cache
    const cache = new PreviewCache(cacheSize)

    rendererRef.current = renderer
    cacheRef.current = cache

    // Initialize renderer
    renderer
      .initialize()
      .then(() => {
        // Get GPU capabilities
        const capabilities = renderer.getCapabilities()
        if (capabilities) {
          setGpuTier(capabilities.tier)

          // Adjust quality based on GPU
          const newQuality = getQualityForGPU(capabilities.tier)
          setQuality(newQuality)
        }

        setIsInitialized(true)
      })
      .catch((err: unknown) => {
        logger.error("Failed to initialize WebGL2 preview renderer:", { error: err })
      })

    return () => {
      renderer.dispose()
      cache.dispose()
    }
  }, [cacheSize])

  // Extract frame from video
  const extractFrame = useCallback(
    async (time: number): Promise<ImageBitmap | null> => {
      if (!videoRef.current || !mediaFile) return null

      const video = videoRef.current

      // Seek to time if needed
      if (Math.abs(video.currentTime - time) > 0.1) {
        video.currentTime = time

        // Wait for seek to complete
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked)
            resolve()
          }
          video.addEventListener("seeked", onSeeked)
        })
      }

      // Create bitmap from video frame
      return createImageBitmap(video)
    },
    [mediaFile],
  )

  // Render frame with effects
  const renderFrame = useCallback(
    async (time: number, effects: Effect[]): Promise<ImageBitmap | null> => {
      if (!rendererRef.current || !cacheRef.current || !isInitialized || !videoRef.current) return null

      try {
        // Try cache first
        const cached = await cacheRef.current.getOrCompute(time, effects, async () => {
          // Set video source and segments
          rendererRef.current!.setVideoSource(videoRef.current!)
          // Cast to TimelineSection[] for compatibility
          rendererRef.current!.setSegments((timeline.project?.sections || []) as any)
          rendererRef.current!.setCurrentTime(time)

          // Apply quality settings
          let processedEffects = effects
          if (quality.effects === "basic") {
            // Only color correction and transform
            processedEffects = effects.filter((e) => e.type === "color_correction" || e.type === "transform")
          } else if (quality.effects === "none") {
            processedEffects = []
          }

          // Render frame
          rendererRef.current!.render(0)

          // Capture frame
          const result = await rendererRef.current!.captureFrame()
          if (!result) throw new Error("Failed to capture frame")

          return result.bitmap
        })

        return cached
      } catch (error: unknown) {
        logger.error("Failed to render preview frame:", { error })
        return null
      }
    },
    [isInitialized, timeline.project?.sections, quality],
  )

  // Update preview (throttled)
  const updatePreview = useMemo(
    () =>
      throttle(async () => {
        if (!isInitialized || !mediaFile) return

        const frame = await renderFrame(currentTime, activeEffects)
        if (frame) {
          setPreviewFrame(frame)
        }
      }, updateInterval),
    [isInitialized, mediaFile, currentTime, activeEffects, renderFrame, updateInterval],
  )

  // Update on time/effects change
  useEffect(() => {
    void updatePreview()
  }, [updatePreview])

  // Prefetch nearby frames
  useEffect(() => {
    if (!isInitialized || !mediaFile || !cacheRef.current || !rendererRef.current) return

    const prefetch = async () => {
      await cacheRef.current!.prefetch(currentTime, prefetchRange, quality.fps, activeEffects, async (time) => {
        // Set time and render
        rendererRef.current!.setCurrentTime(time)
        rendererRef.current!.render(0)

        const result = await rendererRef.current!.captureFrame()
        if (!result) throw new Error("Failed to capture frame")

        return result.bitmap
      })
    }

    // Debounce prefetch
    const timeout = setTimeout(prefetch, 500)
    return () => clearTimeout(timeout)
  }, [currentTime, activeEffects, isInitialized, mediaFile, prefetchRange, quality.fps])

  // Invalidate cache when effects change significantly
  useEffect(() => {
    if (!cacheRef.current) return
    cacheRef.current.invalidate(activeEffects)
  }, [activeEffects])

  // Resize handler
  useEffect(() => {
    if (!canvasRef.current || !rendererRef.current || !isInitialized) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const { width, height } = entry.contentRect

      // Apply quality resolution scale
      const scaledWidth = Math.floor(width * quality.resolution)
      const scaledHeight = Math.floor(height * quality.resolution)

      rendererRef.current!.resize(scaledWidth, scaledHeight)
    })

    resizeObserver.observe(canvasRef.current)
    return () => resizeObserver.disconnect()
  }, [isInitialized, quality.resolution])

  // Canvas ref callback
  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      canvasRef.current = canvas
    }
  }, [])

  // Hidden video element for frame extraction
  const setVideoRef = useCallback(
    (video: HTMLVideoElement | null) => {
      if (video && mediaFile) {
        videoRef.current = video
        video.src = mediaFile.path
        video.muted = true
      }
    },
    [mediaFile],
  )

  return {
    canvasRef: setCanvasRef,
    videoRef: setVideoRef,
    previewFrame,
    isInitialized,
    gpuTier,
    quality,
    setQuality,
    cacheStats: cacheRef.current?.getStats() || {
      entries: 0,
      sizeBytes: 0,
      sizeMB: 0,
      maxSizeMB: cacheSize,
      fillPercentage: 0,
      hitRate: 0,
    },
  }
}

/**
 * Get quality settings based on GPU tier
 */
function getQualityForGPU(tier: GPUTier): PreviewQuality {
  switch (tier) {
    case "high":
      return {
        resolution: 1.0,
        effects: "all",
        fps: 30,
        antialiasing: true,
      }
    case "medium":
      return {
        resolution: 0.75,
        effects: "all",
        fps: 24,
        antialiasing: true,
      }
    case "low":
      return {
        resolution: 0.5,
        effects: "basic",
        fps: 15,
        antialiasing: false,
      }
    default:
      // Fallback для неизвестных уровней GPU
      return {
        resolution: 0.5,
        effects: "basic",
        fps: 15,
        antialiasing: false,
      }
  }
}
