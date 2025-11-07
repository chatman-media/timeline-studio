/**
 * Timeline Integration Service
 * Integrates Motion Graphics with Timeline functionality
 */

import type { TimelineClip, TimelineProject } from "@/features/timeline/types/timeline"
import { createLogger } from "@/lib/tauri-logger"
import type { AnimatedProperty, AnimationTrack, MotionPreset } from "../types/keyframe"
import { createAnimationTrack, evaluateTrackAtTime } from "./animation-layers"
import { applyPreset } from "./preset-manager"

const logger = createLogger({ module: "TimelineIntegration" })

/**
 * Motion Graphics data extension for timeline clips
 */
export interface MotionGraphicsClip extends TimelineClip {
  motionTracks?: AnimationTrack[]
  motionEnabled?: boolean
}

/**
 * Motion Graphics data extension for timeline project
 */
export interface MotionGraphicsProject extends TimelineProject {
  motionTracks?: Record<string, AnimationTrack[]> // Keyed by clip ID
}

/**
 * Add motion graphics to clip
 */
export function addMotionGraphicsToClip(clip: TimelineClip, preset?: MotionPreset): MotionGraphicsClip {
  const motionClip: MotionGraphicsClip = {
    ...clip,
    motionTracks: [],
    motionEnabled: true,
  }

  if (preset) {
    const layer = applyPreset(preset, {
      startTime: 0,
      duration: clip.duration || 5,
    })

    const track = createAnimationTrack(clip.id, "clip")
    track.layers = [layer]

    motionClip.motionTracks = [track]
  }

  return motionClip
}

/**
 * Apply motion preset to clip
 */
export function applyMotionPresetToClip(
  clip: MotionGraphicsClip,
  preset: MotionPreset,
  options?: {
    startTime?: number
    duration?: number
    replace?: boolean
  },
): MotionGraphicsClip {
  const { startTime = 0, duration = clip.duration || 5, replace = false } = options || {}

  const layer = applyPreset(preset, {
    startTime,
    duration,
    targetId: clip.id,
  })

  let motionTracks = clip.motionTracks || []

  if (replace) {
    // Replace existing tracks
    const track = createAnimationTrack(clip.id, "clip")
    track.layers = [layer]
    motionTracks = [track]
  } else {
    // Add to existing tracks
    if (motionTracks.length === 0) {
      const track = createAnimationTrack(clip.id, "clip")
      track.layers = [layer]
      motionTracks = [track]
    } else {
      // Add layer to first track
      motionTracks[0].layers.push(layer)
    }
  }

  return {
    ...clip,
    motionTracks,
    motionEnabled: true,
  }
}

/**
 * Evaluate motion graphics for clip at time
 */
export function evaluateClipMotionAtTime(clip: MotionGraphicsClip, time: number, context?: any): Record<string, any> {
  if (!clip.motionEnabled || !clip.motionTracks) {
    return {}
  }

  const clipTime = time - (clip.startTime || 0)
  if (clipTime < 0 || clipTime > (clip.duration || 0)) {
    return {}
  }

  let results: Record<string, any> = {}

  clip.motionTracks.forEach((track) => {
    const trackResults = evaluateTrackAtTime(track, clipTime, {
      ...context,
      clip,
      comp: {
        width: 1920,
        height: 1080,
        duration: clip.duration || 5,
        frameDuration: 1 / 30,
      },
    })

    // Merge results
    results = { ...results, ...trackResults }
  })

  return results
}

/**
 * Get motion graphics keyframes for timeline display
 */
export function getMotionKeyframesForTimeline(
  clip: MotionGraphicsClip,
  propertyPath?: string,
): Array<{ time: number; value: any; interpolation: string }> {
  if (!clip.motionTracks) return []

  const keyframes: Array<{ time: number; value: any; interpolation: string }> = []

  clip.motionTracks.forEach((track) => {
    track.layers.forEach((layer) => {
      layer.properties.forEach((property) => {
        if (!propertyPath || property.path === propertyPath) {
          property.keyframes.forEach((kf) => {
            keyframes.push({
              time: (clip.startTime || 0) + kf.time,
              value: kf.value,
              interpolation: kf.interpolation,
            })
          })
        }
      })
    })
  })

  return keyframes.sort((a, b) => a.time - b.time)
}

/**
 * Update motion property in clip
 */
export function updateMotionPropertyInClip(
  clip: MotionGraphicsClip,
  propertyPath: string,
  updates: Partial<AnimatedProperty>,
): MotionGraphicsClip {
  if (!clip.motionTracks) return clip

  const updatedTracks = clip.motionTracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) => ({
      ...layer,
      properties: layer.properties.map((prop) => (prop.path === propertyPath ? { ...prop, ...updates } : prop)),
    })),
  }))

  return {
    ...clip,
    motionTracks: updatedTracks,
  }
}

/**
 * Remove motion graphics from clip
 */
export function removeMotionGraphicsFromClip(clip: MotionGraphicsClip): TimelineClip {
  const { motionTracks, motionEnabled, ...baseClip } = clip
  return baseClip
}

/**
 * Copy motion graphics from one clip to another
 */
export function copyMotionGraphics(sourceClip: MotionGraphicsClip, targetClip: TimelineClip): MotionGraphicsClip {
  if (!sourceClip.motionTracks) return targetClip as MotionGraphicsClip

  // Deep clone motion tracks
  const copiedTracks = sourceClip.motionTracks.map((track) => ({
    ...track,
    id: `${track.id}-copy-${Date.now()}`,
    targetId: targetClip.id,
    layers: track.layers.map((layer) => ({
      ...layer,
      id: `${layer.id}-copy-${Date.now()}`,
      properties: layer.properties.map((prop) => ({
        ...prop,
        id: `${prop.id}-copy-${Date.now()}`,
        keyframes: prop.keyframes.map((kf) => ({
          ...kf,
          id: `${kf.id}-copy-${Date.now()}`,
        })),
      })),
    })),
  }))

  return {
    ...targetClip,
    motionTracks: copiedTracks,
    motionEnabled: true,
  }
}

/**
 * Scale motion graphics duration
 */
export function scaleMotionGraphicsDuration(clip: MotionGraphicsClip, newDuration: number): MotionGraphicsClip {
  if (!clip.motionTracks || !clip.duration) return clip

  const scaleFactor = newDuration / clip.duration

  const scaledTracks = clip.motionTracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) => ({
      ...layer,
      properties: layer.properties.map((prop) => ({
        ...prop,
        keyframes: prop.keyframes.map((kf) => ({
          ...kf,
          time: kf.time * scaleFactor,
        })),
      })),
    })),
  }))

  return {
    ...clip,
    motionTracks: scaledTracks,
  }
}

/**
 * Offset motion graphics timing
 */
export function offsetMotionGraphicsTiming(clip: MotionGraphicsClip, timeOffset: number): MotionGraphicsClip {
  if (!clip.motionTracks) return clip

  const offsetTracks = clip.motionTracks.map((track) => ({
    ...track,
    layers: track.layers.map((layer) => ({
      ...layer,
      properties: layer.properties.map((prop) => ({
        ...prop,
        keyframes: prop.keyframes.map((kf) => ({
          ...kf,
          time: Math.max(0, kf.time + timeOffset),
        })),
      })),
    })),
  }))

  return {
    ...clip,
    motionTracks: offsetTracks,
  }
}

/**
 * Export motion graphics data
 */
export function exportMotionGraphics(clip: MotionGraphicsClip): string {
  if (!clip.motionTracks) return "{}"

  const exportData = {
    version: "1.0.0",
    clipId: clip.id,
    duration: clip.duration,
    motionTracks: clip.motionTracks,
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Import motion graphics data
 */
export function importMotionGraphics(clip: TimelineClip, jsonData: string): MotionGraphicsClip | null {
  try {
    const data = JSON.parse(jsonData)

    if (!data.motionTracks || !Array.isArray(data.motionTracks)) {
      return null
    }

    return {
      ...clip,
      motionTracks: data.motionTracks,
      motionEnabled: true,
    }
  } catch (error) {
    logger.error("Failed to import motion graphics:", error)
    return null
  }
}

/**
 * Get motion graphics summary
 */
export function getMotionGraphicsSummary(clip: MotionGraphicsClip): {
  enabled: boolean
  tracks: number
  layers: number
  properties: number
  keyframes: number
} {
  if (!clip.motionEnabled || !clip.motionTracks) {
    return {
      enabled: false,
      tracks: 0,
      layers: 0,
      properties: 0,
      keyframes: 0,
    }
  }

  let layers = 0
  let properties = 0
  let keyframes = 0

  clip.motionTracks.forEach((track) => {
    layers += track.layers.length
    track.layers.forEach((layer) => {
      properties += layer.properties.length
      layer.properties.forEach((prop) => {
        keyframes += prop.keyframes.length
      })
    })
  })

  return {
    enabled: true,
    tracks: clip.motionTracks.length,
    layers,
    properties,
    keyframes,
  }
}

/**
 * Create motion graphics context for expressions
 */
export function createMotionContext(clip: MotionGraphicsClip, time: number, frame: number, fps = 30) {
  return {
    time,
    frame,
    fps,
    comp: {
      width: 1920,
      height: 1080,
      duration: clip.duration || 5,
      frameDuration: 1 / fps,
    },
    thisComp: (_name: string) => {
      // Return composition data by name
      return null
    },
    thisLayer: (_name: string) => {
      // Return layer data by name
      return null
    },
    thisProperty: () => {
      // Return current property
      return null
    },
  }
}
