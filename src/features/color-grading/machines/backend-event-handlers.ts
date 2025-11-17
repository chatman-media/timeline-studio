/**
 * Backend Event Handlers для Color Grading
 *
 * Обрабатывает события от Rust backend и обновляет состояние color grading
 * Используется паттерн Command-Event для синхронизации
 */

import { createLogger } from "@/lib/tauri-logger"

import type { ColorGradingPreset } from "../types/presets"

// Define ProjectEvent type locally for color grading events
type ProjectEvent =
  | { type: "ColorGradingApplied"; payload: { clip_id: string; preset_id?: string | null; parameters: any } }
  | { type: "ColorGradingPresetSaved"; payload: { preset_id: string; name: string; parameters: any } }
  | { type: "ColorGradingPresetDeleted"; payload: { preset_id: string } }
  | { type: "ColorGradingReset"; payload: { clip_id: string } }
  | { type: string; payload?: any }

const logger = createLogger("ColorGrading:BackendEventHandlers")

/**
 * Контекст для обработки color grading событий
 */
export interface ColorGradingContext {
  availablePresets: ColorGradingPreset[]
  appliedColorGrading: Map<string, { presetId?: string; parameters: any }>
  isLoading: boolean
  error: string | null
}

/**
 * Главный обработчик backend событий для Color Grading
 */
export function handleBackendEvent(context: ColorGradingContext, event: ProjectEvent): Partial<ColorGradingContext> {
  logger.info("Handling backend event:", { eventType: event.type })

  switch (event.type) {
    case "ColorGradingApplied":
      return handleColorGradingApplied(context, event)
    case "ColorGradingPresetSaved":
      return handleColorGradingPresetSaved(context, event)
    case "ColorGradingPresetDeleted":
      return handleColorGradingPresetDeleted(context, event)
    case "ColorGradingReset":
      return handleColorGradingReset(context, event)
    default:
      logger.debug("Unhandled backend event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Color Grading Handlers
// ============================================================================

function handleColorGradingApplied(context: ColorGradingContext, event: ProjectEvent): Partial<ColorGradingContext> {
  if (event.type !== "ColorGradingApplied") return {}
  const { clip_id, preset_id, parameters } = event.payload

  logger.info("Color grading applied to clip:", { clipId: clip_id, presetId: preset_id })

  // Update the applied color grading map
  const appliedColorGrading = new Map(context.appliedColorGrading)
  appliedColorGrading.set(clip_id, {
    presetId: preset_id ?? undefined,
    parameters,
  })

  return {
    appliedColorGrading,
  }
}

function handleColorGradingPresetSaved(
  context: ColorGradingContext,
  event: ProjectEvent,
): Partial<ColorGradingContext> {
  if (event.type !== "ColorGradingPresetSaved") return {}
  const { preset_id, name, parameters } = event.payload

  logger.info("Color grading preset saved:", { presetId: preset_id, name })

  // Check if preset already exists (update) or is new (add)
  const existingIndex = context.availablePresets.findIndex((p) => p.id === preset_id)

  let availablePresets: ColorGradingPreset[]

  if (existingIndex >= 0) {
    // Update existing preset
    availablePresets = [...context.availablePresets]
    availablePresets[existingIndex] = {
      ...availablePresets[existingIndex],
      name,
      data: parameters as any, // Parameters from backend are JsonValue
      updatedAt: new Date(),
    }
  } else {
    // Add new preset
    const newPreset: ColorGradingPreset = {
      id: preset_id,
      name,
      category: "custom",
      isBuiltIn: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      data: parameters as any, // Parameters from backend are JsonValue
    }

    availablePresets = [...context.availablePresets, newPreset]
  }

  return {
    availablePresets,
  }
}

function handleColorGradingPresetDeleted(
  context: ColorGradingContext,
  event: ProjectEvent,
): Partial<ColorGradingContext> {
  if (event.type !== "ColorGradingPresetDeleted") return {}
  const { preset_id } = event.payload

  logger.info("Color grading preset deleted:", { presetId: preset_id })

  return {
    availablePresets: context.availablePresets.filter((p) => p.id !== preset_id),
  }
}

function handleColorGradingReset(context: ColorGradingContext, event: ProjectEvent): Partial<ColorGradingContext> {
  if (event.type !== "ColorGradingReset") return {}
  const { clip_id } = event.payload

  logger.info("Color grading reset for clip:", { clipId: clip_id })

  // Remove color grading from the applied map
  const appliedColorGrading = new Map(context.appliedColorGrading)
  appliedColorGrading.delete(clip_id)

  return {
    appliedColorGrading,
  }
}
