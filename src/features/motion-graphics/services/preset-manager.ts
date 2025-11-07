/**
 * Motion Preset Manager
 * Handles loading, applying and managing motion presets
 */

import { nanoid } from "nanoid"
import { createLogger } from "@/lib/tauri-logger"
import motionPresetsData from "../data/motion-presets.json"
import type {
  AnimatedProperty,
  AnimationLayer,
  InterpolationType,
  KeyframeValue,
  MotionPreset,
} from "../types/keyframe"
import { createAnimationLayer } from "./animation-layers"
import { offsetKeyframesToTime, scaleKeyframesToDuration } from "./keyframe-manager"

const logger = createLogger({ module: "PresetManager" })

/**
 * Preset categories
 */
export interface PresetCategory {
  id: string
  name: string
  icon: string
}

/**
 * Get all preset categories
 */
export function getPresetCategories(): PresetCategory[] {
  return motionPresetsData.categories
}

/**
 * Get all presets
 */
export function getAllPresets(): MotionPreset[] {
  return motionPresetsData.presets.map((preset) => ({
    ...preset,
    preview: preset.preview || { before: 0, after: 1 },
    properties: preset.properties.map((prop) => ({
      ...prop,
      type: prop.type as "number" | "vec2" | "vec3" | "vec4" | "color" | "boolean" | "text",
      keyframes: prop.keyframes.map((kf) => ({
        ...kf,
        interpolation: kf.interpolation as InterpolationType,
        value: normalizeKeyframeValue(kf.value, prop.type),
      })),
    })),
  }))
}

/**
 * Normalize keyframe value to proper type
 */
function normalizeKeyframeValue(value: any, type: string): KeyframeValue {
  if (type === "vec2" && Array.isArray(value) && value.length === 2) {
    return [value[0], value[1]] as [number, number]
  }
  if (type === "vec3" && Array.isArray(value) && value.length === 3) {
    return [value[0], value[1], value[2]] as [number, number, number]
  }
  if (type === "vec4" && Array.isArray(value) && value.length === 4) {
    return [value[0], value[1], value[2], value[3]] as [number, number, number, number]
  }
  return value as KeyframeValue
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(categoryId: string): MotionPreset[] {
  return getAllPresets().filter((preset) => preset.category === categoryId)
}

/**
 * Get preset by ID
 */
export function getPresetById(presetId: string): MotionPreset | null {
  return getAllPresets().find((preset) => preset.id === presetId) || null
}

/**
 * Search presets
 */
export function searchPresets(query: string): MotionPreset[] {
  const lowercaseQuery = query.toLowerCase()

  return getAllPresets().filter(
    (preset) =>
      preset.name.toLowerCase().includes(lowercaseQuery) ||
      preset.description.toLowerCase().includes(lowercaseQuery) ||
      preset.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

/**
 * Apply preset to create animation layer
 */
export function applyPreset(
  preset: MotionPreset,
  options?: {
    startTime?: number
    duration?: number
    targetId?: string
    customizations?: Record<string, any>
  },
): AnimationLayer {
  const { startTime = 0, duration = preset.duration, customizations = {} } = options || {}

  // Clone properties with new IDs
  const properties: AnimatedProperty[] = preset.properties.map((prop) => {
    const clonedProp: AnimatedProperty = {
      ...prop,
      id: nanoid(),
      keyframes: prop.keyframes.map((kf) => ({
        ...kf,
        id: nanoid(),
      })),
    }

    // Apply customizations
    if (customizations[prop.path]) {
      Object.assign(clonedProp, customizations[prop.path])
    }

    // Scale and offset keyframes if needed
    if (preset.scalable && duration !== preset.duration) {
      clonedProp.keyframes = scaleKeyframesToDuration(clonedProp.keyframes, duration, startTime)
    } else if (startTime > 0) {
      clonedProp.keyframes = offsetKeyframesToTime(clonedProp.keyframes, startTime)
    }

    return clonedProp
  })

  // Create animation layer
  return createAnimationLayer(preset.name, properties)
}

/**
 * Create custom preset from animation layer
 */
export function createPresetFromLayer(
  layer: AnimationLayer,
  metadata: {
    name: string
    description: string
    category: string
    tags: string[]
  },
): MotionPreset {
  // Calculate duration from keyframes
  let duration = 0
  layer.properties.forEach((prop) => {
    prop.keyframes.forEach((kf) => {
      duration = Math.max(duration, kf.time)
    })
  })

  return {
    id: nanoid(),
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    tags: metadata.tags,
    duration: duration || 1,
    scalable: true,
    customizable: true,
    properties: layer.properties,
    preview: {
      before: layer.properties[0]?.keyframes[0]?.value || 0,
      after: layer.properties[0]?.keyframes[layer.properties[0].keyframes.length - 1]?.value || 1,
    },
  }
}

/**
 * Combine multiple presets
 */
export function combinePresets(
  presets: MotionPreset[],
  options?: {
    sequence?: boolean // If true, arrange sequentially. If false, overlay
    gap?: number // Gap between sequential presets
  },
): AnimationLayer {
  const { sequence = false, gap = 0 } = options || {}

  const combinedProperties = new Map<string, AnimatedProperty>()
  let currentTime = 0

  presets.forEach((preset, _index) => {
    const layer = applyPreset(preset, {
      startTime: sequence ? currentTime : 0,
    })

    layer.properties.forEach((prop) => {
      const existing = combinedProperties.get(prop.path)

      if (existing) {
        // Merge keyframes
        existing.keyframes = [...existing.keyframes, ...prop.keyframes].sort((a, b) => a.time - b.time)
      } else {
        combinedProperties.set(prop.path, {
          ...prop,
          id: nanoid(),
        })
      }
    })

    if (sequence) {
      currentTime += preset.duration + gap
    }
  })

  return createAnimationLayer("Combined Preset", Array.from(combinedProperties.values()))
}

/**
 * Get preset thumbnail data
 */
export function getPresetThumbnail(preset: MotionPreset): {
  type: "curve" | "value" | "expression"
  data: any
} {
  // Find main animated property
  const mainProp = preset.properties.find((p) => p.keyframes.length > 0) || preset.properties[0]

  if (!mainProp) {
    return { type: "value", data: null }
  }

  if (mainProp.expression && mainProp.expressionEnabled) {
    return {
      type: "expression",
      data: mainProp.expression,
    }
  }

  if (mainProp.keyframes.length >= 2) {
    return {
      type: "curve",
      data: mainProp.keyframes,
    }
  }

  return {
    type: "value",
    data: mainProp.keyframes[0]?.value || null,
  }
}

/**
 * Export presets to JSON
 */
export function exportPresets(presets: MotionPreset[]): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      presets,
    },
    null,
    2,
  )
}

/**
 * Import presets from JSON
 */
export function importPresets(json: string): MotionPreset[] {
  try {
    const data = JSON.parse(json)

    if (!data.presets || !Array.isArray(data.presets)) {
      throw new Error("Invalid preset data")
    }

    return data.presets.map((preset: any) => ({
      ...preset,
      id: nanoid(), // Generate new IDs
    }))
  } catch (error) {
    logger.error("Failed to import presets:", error)
    return []
  }
}

/**
 * Preset collections
 */
export const presetCollections = {
  essentials: ["fade-in", "slide-in-left", "scale-bounce", "typewriter"],

  advanced: ["glitch", "morph-shape", "parallax", "pendulum"],

  text: ["typewriter", "text-scramble", "wave-text"],

  transitions: ["fade-in", "slide-in-left", "zoom-blur", "blur-in"],
}

/**
 * Get collection presets
 */
export function getCollectionPresets(collectionName: keyof typeof presetCollections): MotionPreset[] {
  const presetIds = presetCollections[collectionName]
  return presetIds.map((id) => getPresetById(id)).filter(Boolean) as MotionPreset[]
}

/**
 * Validate preset structure
 */
export function validatePreset(preset: any): preset is MotionPreset {
  return (
    preset &&
    typeof preset.id === "string" &&
    typeof preset.name === "string" &&
    typeof preset.duration === "number" &&
    Array.isArray(preset.properties) &&
    preset.properties.every((prop: any) => prop.id && prop.path && prop.type && Array.isArray(prop.keyframes))
  )
}
