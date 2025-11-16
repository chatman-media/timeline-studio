import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectEvent } from "@/types/generated/tauri-bindings"

import { useColorGrading } from "../hooks/use-color-grading"
import {
  type ColorGradingContext as ColorGradingMachineContext,
  handleBackendEvent,
} from "../machines/backend-event-handlers"
import type {
  BasicParametersState,
  ColorGradingState,
  ColorWheelType,
  CurvePoint,
  CurveType,
  RGBValue,
} from "../types/color-grading"
import type { ColorGradingPreset } from "../types/presets"

const logger = createLogger("ColorGradingProvider")

interface ColorGradingContextValue {
  state: ColorGradingState
  dispatch: (action: any) => void
  updateColorWheel: (wheelType: ColorWheelType, value: RGBValue) => void
  updateBasicParameter: (parameter: keyof BasicParametersState, value: number) => void
  updateCurve: (curveType: CurveType, points: CurvePoint[]) => void
  loadLUT: (file: string) => void
  setLUTIntensity: (intensity: number) => void
  toggleLUT: (enabled: boolean) => void
  togglePreview: (enabled: boolean) => void
  applyToClip: () => void
  resetAll: () => void
  autoCorrect: () => void
  loadPreset: (presetId: string) => void
  savePreset: (name: string) => void
  hasChanges: boolean
  isActive: boolean
  availablePresets: ColorGradingPreset[]
  // BackendSync status
  isConnected: boolean
  error: string | null
}

const ColorGradingContext = createContext<ColorGradingContextValue | null>(null)

/**
 * Color Grading Provider с интеграцией BackendSync
 *
 * Синхронизирует состояние цветокоррекции с backend
 */
export function ColorGradingProvider({ children }: { children: ReactNode }) {
  const colorGrading = useColorGrading()
  const [backendSync] = useState(() => getBackendSync())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Backend event context
  const [eventContext, setEventContext] = useState<ColorGradingMachineContext>({
    availablePresets: [],
    appliedColorGrading: new Map(),
    isLoading: false,
    error: null,
  })

  // Синхронизация состояния с backend
  useEffect(() => {
    setIsConnected(true)

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event: ProjectEvent) => {
      logger.debugSync("Received backend event", { type: event.type })

      // Обрабатываем события через event handler
      const updates = handleBackendEvent(eventContext, event)

      if (Object.keys(updates).length > 0) {
        setEventContext((prev) => ({ ...prev, ...updates }))

        // Синхронизируем с локальным состоянием color grading
        if (event.type === "ColorGradingApplied") {
          const { clip_id, preset_id } = event.payload
          if (preset_id && colorGrading.state.selectedClip === clip_id) {
            colorGrading.loadPreset(preset_id)
          }
        } else if (event.type === "ColorGradingReset") {
          const { clip_id } = event.payload
          if (colorGrading.state.selectedClip === clip_id) {
            colorGrading.resetAll()
          }
        }
      }
    })

    return () => {
      unsubscribeEvents()
    }
  }, [backendSync, eventContext, colorGrading])

  // Load available presets from backend on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const result = await backendSync.executeCommand({
          type: "GetColorGradingPresets",
        } as any)

        if (result.success && result.data && typeof result.data === "object" && "presets" in result.data) {
          const presets: ColorGradingPreset[] = (result.data.presets as any[]).map((p: any) => ({
            id: p.id,
            name: p.name,
            category: "custom" as const,
            isBuiltIn: false,
            createdAt: new Date(p.added_at * 1000),
            updatedAt: new Date(p.added_at * 1000),
            data: p.parameters,
          }))

          setEventContext((prev) => ({
            ...prev,
            availablePresets: presets,
          }))
        }
      } catch (err) {
        void logger.error("Failed to load presets from backend", { error: String(err) })
      }
    }

    void loadPresets()
  }, [backendSync])

  // Переопределяем applyToClip для синхронизации с backend
  const applyToClipWithBackend = async () => {
    if (!colorGrading.state.selectedClip) return

    try {
      // Создаем объект параметров цветокоррекции
      const parameters = {
        colorWheels: colorGrading.state.colorWheels,
        basicParameters: colorGrading.state.basicParameters,
        curves: colorGrading.state.curves,
        lut: colorGrading.state.lut,
      }

      // Отправляем команду на backend
      await backendSync.executeCommand({
        type: "ApplyColorGrading",
        params: {
          clip_id: colorGrading.state.selectedClip,
          preset_id: colorGrading.state.currentPreset,
          parameters: parameters as any, // Complex nested state, cast to any for backend
        },
      } as any)

      // Локальное обновление обрабатывается через события backend
      // Не вызываем colorGrading.applyToClip() напрямую - wait for event
    } catch (err) {
      void logger.error("Failed to apply color grading", { error: String(err) })
      setError(err instanceof Error ? err.message : "Failed to apply color grading")
    }
  }

  // Переопределяем savePreset для синхронизации с backend
  const savePresetWithBackend = async (name: string) => {
    try {
      const parameters = {
        colorWheels: colorGrading.state.colorWheels,
        basicParameters: colorGrading.state.basicParameters,
        curves: colorGrading.state.curves,
        lut: colorGrading.state.lut,
      }

      // Сохраняем пресет на backend
      await backendSync.executeCommand({
        type: "SaveColorGradingPreset",
        params: {
          name,
          parameters: parameters as any, // Complex nested state, cast to any for backend
        },
      } as any)

      // Backend event будет обновлять список пресетов
      // Вызываем локальное сохранение для немедленного feedback
      colorGrading.savePreset(name)
    } catch (err) {
      void logger.error("Failed to save preset", { error: String(err) })
      setError(err instanceof Error ? err.message : "Failed to save preset")
    }
  }

  // Переопределяем loadPreset для синхронизации с backend
  const loadPresetWithBackend = async (presetId: string) => {
    try {
      // Вызываем оригинальный метод для немедленной загрузки UI
      colorGrading.loadPreset(presetId)

      // Уведомляем backend о загрузке пресета (для аналитики/истории)
      // Это опционально, backend уже знает о пресетах
      logger.debugSync("Loaded preset from local state", { presetId })
    } catch (err) {
      void logger.error("Failed to load preset", { error: String(err) })
      setError(err instanceof Error ? err.message : "Failed to load preset")
    }
  }

  const value: ColorGradingContextValue = {
    ...colorGrading,
    applyToClip: applyToClipWithBackend,
    savePreset: savePresetWithBackend,
    loadPreset: loadPresetWithBackend,
    availablePresets: eventContext.availablePresets,
    isConnected,
    error,
  }

  return <ColorGradingContext.Provider value={value}>{children}</ColorGradingContext.Provider>
}

export function useColorGradingContext() {
  const context = useContext(ColorGradingContext)
  if (!context) {
    throw new Error("useColorGradingContext must be used within ColorGradingProvider")
  }
  return context
}

// Экспортируем useColorGrading как синоним для useColorGradingContext
export { useColorGradingContext as useColorGrading }
