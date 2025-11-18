/**
 * Hook для управления analyzer preset'ами
 * Хранит кастомные preset'ы в user settings
 */

import { useCallback, useEffect, useState } from "react"

import { createLogger } from "@/lib/tauri-logger"

import type { AnalyzerType } from "../types/analysis-progress"
import type { AnalyzerPreset } from "../types/analyzer-presets"

const logger = createLogger("useAnalyzerPresets")

const STORAGE_KEY = "ai-director-analyzer-presets"

export interface UseAnalyzerPresetsReturn {
  customPresets: AnalyzerPreset[]
  savePreset: (preset: AnalyzerPreset) => void
  deletePreset: (presetId: string) => void
  applyPreset: (preset: AnalyzerPreset, setAnalyzers: (analyzers: Set<AnalyzerType>) => void) => void
  isLoading: boolean
}

export function useAnalyzerPresets(): UseAnalyzerPresetsReturn {
  const [customPresets, setCustomPresets] = useState<AnalyzerPreset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const presets = JSON.parse(stored) as AnalyzerPreset[]
        setCustomPresets(presets)
        logger.infoSync("[useAnalyzerPresets] Loaded presets from storage", {
          count: presets.length,
        })
      }
    } catch (error) {
      logger.errorSync("[useAnalyzerPresets] Failed to load presets", error as Record<string, unknown>)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save preset
  const savePreset = useCallback((preset: AnalyzerPreset) => {
    setCustomPresets((prev) => {
      // Check if preset with same ID already exists
      const existingIndex = prev.findIndex((p) => p.id === preset.id)

      let updated: AnalyzerPreset[]
      if (existingIndex >= 0) {
        // Update existing
        updated = [...prev]
        updated[existingIndex] = preset
        logger.infoSync("[useAnalyzerPresets] Updated existing preset", {
          presetId: preset.id,
        })
      } else {
        // Add new
        updated = [...prev, preset]
        logger.infoSync("[useAnalyzerPresets] Saved new preset", {
          presetId: preset.id,
          name: preset.name,
        })
      }

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        logger.errorSync("[useAnalyzerPresets] Failed to persist preset", error as Record<string, unknown>)
      }

      return updated
    })
  }, [])

  // Delete preset
  const deletePreset = useCallback((presetId: string) => {
    setCustomPresets((prev) => {
      const updated = prev.filter((p) => p.id !== presetId)

      logger.infoSync("[useAnalyzerPresets] Deleted preset", { presetId })

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        logger.errorSync("[useAnalyzerPresets] Failed to persist after delete", error as Record<string, unknown>)
      }

      return updated
    })
  }, [])

  // Apply preset
  const applyPreset = useCallback((preset: AnalyzerPreset, setAnalyzers: (analyzers: Set<AnalyzerType>) => void) => {
    logger.infoSync("[useAnalyzerPresets] Applying preset", {
      presetId: preset.id,
      name: preset.name,
      analyzersCount: preset.analyzers.length,
    })

    setAnalyzers(new Set(preset.analyzers))
  }, [])

  return {
    customPresets,
    savePreset,
    deletePreset,
    applyPreset,
    isLoading,
  }
}
