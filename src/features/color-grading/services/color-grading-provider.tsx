import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

// Временные типы до создания backend-sync
interface ProjectState {
  color_grading?: any
}

interface BackendSync {
  executeCommand: (command: any) => Promise<any>
  onStateChange: (callback: (state: ProjectState) => void) => () => void
}

const mockBackendSync: BackendSync = {
  executeCommand: (command) => Promise.resolve({ success: true }),
  onStateChange: (callback) => () => {},
}

const getBackendSync = () => mockBackendSync

import { useColorGrading } from "../hooks/use-color-grading"
import type {
  BasicParametersState,
  ColorGradingState,
  ColorWheelType,
  CurvePoint,
  CurveType,
  RGBValue,
} from "../types/color-grading"
import type { ColorGradingPreset } from "../types/presets"

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
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const backendSync = getBackendSync()

  // Синхронизация состояния с backend
  useEffect(() => {
    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setIsConnected(true)

      // Синхронизируем состояние цветокоррекции из backend
      if (state.color_grading_state) {
        // Здесь можно восстановить состояние из backend
        // Например, загрузить сохраненные пресеты, последние настройки и т.д.
        console.log("[ColorGrading] Synced state from backend:", state.color_grading_state)
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      if (event.type === "COLOR_GRADING_PRESET_LOADED") {
        colorGrading.loadPreset(event.data.presetId)
      } else if (event.type === "COLOR_GRADING_APPLIED") {
        // Обновляем состояние после применения цветокоррекции
        console.log("[ColorGrading] Color grading applied to clip:", event.data.clipId)
      }
    })

    return () => {
      unsubscribe()
      unsubscribeEvents()
    }
  }, [backendSync, colorGrading])

  // Переопределяем applyToClip для синхронизации с backend
  const applyToClipWithBackend = async () => {
    if (!colorGrading.state.selectedClip) return

    try {
      // Создаем объект цветокоррекции
      const colorGradingData = {
        id: `color-grading-${Date.now()}`,
        colorWheels: colorGrading.state.colorWheels,
        basicParameters: colorGrading.state.basicParameters,
        curves: colorGrading.state.curves,
        lut: colorGrading.state.lut,
        presetId: colorGrading.state.currentPreset,
        isEnabled: true,
      }

      // Отправляем команду на backend
      await backendSync.executeCommand({
        type: "Effects",
        params: {
          type: "ApplyColorGrading",
          params: {
            clipId: colorGrading.state.selectedClip,
            colorGrading: colorGradingData,
          },
        },
      })

      // Вызываем оригинальный метод для локального обновления
      colorGrading.applyToClip()
    } catch (err) {
      console.error("[ColorGrading] Failed to apply color grading:", err)
      setError(err instanceof Error ? err.message : "Failed to apply color grading")
    }
  }

  // Переопределяем savePreset для синхронизации с backend
  const savePresetWithBackend = async (name: string) => {
    try {
      const preset: ColorGradingPreset = {
        id: `preset-custom-${Date.now()}`,
        name,
        category: "custom",
        isBuiltIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          colorWheels: colorGrading.state.colorWheels,
          basicParameters: colorGrading.state.basicParameters,
          curves: colorGrading.state.curves,
          lut: colorGrading.state.lut,
        },
      }

      // Сохраняем пресет на backend
      await backendSync.executeCommand({
        type: "Effects",
        params: {
          type: "SaveColorGradingPreset",
          params: {
            preset,
          },
        },
      })

      // Вызываем оригинальный метод для локального сохранения
      colorGrading.savePreset(name)
    } catch (err) {
      console.error("[ColorGrading] Failed to save preset:", err)
      setError(err instanceof Error ? err.message : "Failed to save preset")
    }
  }

  // Переопределяем loadPreset для синхронизации с backend
  const loadPresetWithBackend = async (presetId: string) => {
    try {
      // Уведомляем backend о загрузке пресета
      await backendSync.executeCommand({
        type: "Effects",
        params: {
          type: "LoadColorGradingPreset",
          params: {
            presetId,
          },
        },
      })

      // Вызываем оригинальный метод
      colorGrading.loadPreset(presetId)
    } catch (err) {
      console.error("[ColorGrading] Failed to load preset:", err)
      setError(err instanceof Error ? err.message : "Failed to load preset")
    }
  }

  // Отслеживаем изменения состояния и синхронизируем с backend
  useEffect(() => {
    if (colorGrading.hasChanges && colorGrading.state.selectedClip) {
      // Debounced синхронизация изменений с backend
      const timer = setTimeout(() => {
        backendSync
          .executeCommand({
            type: "Effects",
            params: {
              type: "UpdateColorGradingPreview",
              params: {
                clipId: colorGrading.state.selectedClip,
                settings: {
                  colorWheels: colorGrading.state.colorWheels,
                  basicParameters: colorGrading.state.basicParameters,
                  curves: colorGrading.state.curves,
                  lut: colorGrading.state.lut,
                },
              },
            },
          })
          .catch((err) => {
            console.error("[ColorGrading] Failed to sync preview:", err)
          })
      }, 500) // Задержка 500ms для debouncing

      return () => clearTimeout(timer)
    }
  }, [colorGrading.state, colorGrading.hasChanges, backendSync])

  const value: ColorGradingContextValue = {
    ...colorGrading,
    applyToClip: applyToClipWithBackend,
    savePreset: savePresetWithBackend,
    loadPreset: loadPresetWithBackend,
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
