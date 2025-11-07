import { useCallback, useMemo, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import type {
  BasicParametersState,
  ColorGradingState,
  ColorWheelType,
  CurvePoint,
  CurveType,
  RGBValue,
} from "../types/color-grading"
import { BUILT_IN_PRESETS, type ColorGradingPreset } from "../types/presets"

const logger = createLogger({ module: "UseColorGrading" })

// Начальные значения
const DEFAULT_RGB: RGBValue = { r: 0, g: 0, b: 0 }

const DEFAULT_STATE: ColorGradingState = {
  colorWheels: {
    lift: DEFAULT_RGB,
    gamma: DEFAULT_RGB,
    gain: DEFAULT_RGB,
    offset: DEFAULT_RGB,
  },
  basicParameters: {
    temperature: 0,
    tint: 0,
    contrast: 0,
    pivot: 0.5,
    saturation: 0,
    hue: 0,
    luminance: 0,
  },
  curves: {
    master: [
      { x: 0, y: 256, id: "start" },
      { x: 256, y: 0, id: "end" },
    ],
    red: [
      { x: 0, y: 256, id: "start" },
      { x: 256, y: 0, id: "end" },
    ],
    green: [
      { x: 0, y: 256, id: "start" },
      { x: 256, y: 0, id: "end" },
    ],
    blue: [
      { x: 0, y: 256, id: "start" },
      { x: 256, y: 0, id: "end" },
    ],
    hueVsHue: [],
    hueVsSaturation: [],
    hueVsLuminance: [],
    luminanceVsSaturation: [],
    saturationVsSaturation: [],
  },
  lut: {
    file: null,
    intensity: 100,
    isEnabled: false,
  },
  scopes: {
    waveformEnabled: true,
    vectorscopeEnabled: false,
    histogramEnabled: false,
    refreshRate: 30,
  },
  previewEnabled: true,
  selectedClip: null,
  isActive: false,
  currentPreset: null,
  hasUnsavedChanges: false,
}

export function useColorGrading() {
  const [state, setState] = useState<ColorGradingState>(DEFAULT_STATE)

  // Обновление цветовых колес
  const updateColorWheel = useCallback((wheelType: ColorWheelType, value: RGBValue) => {
    setState((prev) => ({
      ...prev,
      colorWheels: {
        ...prev.colorWheels,
        [wheelType]: value,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Обновление базовых параметров
  const updateBasicParameter = useCallback((parameter: keyof BasicParametersState, value: number) => {
    setState((prev) => ({
      ...prev,
      basicParameters: {
        ...prev.basicParameters,
        [parameter]: value,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Обновление кривых
  const updateCurve = useCallback((curveType: CurveType, points: CurvePoint[]) => {
    setState((prev) => ({
      ...prev,
      curves: {
        ...prev.curves,
        [curveType]: points,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Загрузка LUT
  const loadLUT = useCallback((file: string) => {
    setState((prev) => ({
      ...prev,
      lut: {
        ...prev.lut,
        file,
        isEnabled: true,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Установка интенсивности LUT
  const setLUTIntensity = useCallback((intensity: number) => {
    setState((prev) => ({
      ...prev,
      lut: {
        ...prev.lut,
        intensity,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Переключение LUT
  const toggleLUT = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      lut: {
        ...prev.lut,
        isEnabled: enabled,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Переключение превью
  const togglePreview = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      previewEnabled: enabled,
    }))
  }, [])

  // Применение к клипу
  const applyToClip = useCallback(() => {
    if (!state.selectedClip) return

    // Создаем объект цветокоррекции для timeline
    const colorGradingData = {
      id: `color-grading-${Date.now()}`,
      colorWheels: state.colorWheels,
      basicParameters: state.basicParameters,
      curves: state.curves,
      lut: state.lut,
      presetId: state.currentPreset,
      isEnabled: true,
    }

    // Отправляем событие в timeline для применения к клипу
    // В реальном приложении это будет интеграция с timeline service
    const timelineEvent = new CustomEvent("timeline:apply-color-grading", {
      detail: {
        clipId: state.selectedClip,
        colorGrading: colorGradingData,
      },
    })
    window.dispatchEvent(timelineEvent)

    setState((prev) => ({
      ...prev,
      hasUnsavedChanges: false,
    }))
  }, [state])

  // Сброс всех настроек
  const resetAll = useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      selectedClip: state.selectedClip,
      previewEnabled: state.previewEnabled,
    })
  }, [state.selectedClip, state.previewEnabled])

  // Загрузка пресета
  const loadPreset = useCallback((presetId: string) => {
    const preset = BUILT_IN_PRESETS.find((p) => p.id === presetId)
    if (!preset) {
      logger.warn("Preset not found", { presetId })
      return
    }

    setState((prev) => ({
      ...prev,
      ...preset.data,
      currentPreset: presetId,
      hasUnsavedChanges: true,
    }))
  }, [])

  // Сохранение пресета
  const savePreset = useCallback(
    (name: string) => {
      const preset: ColorGradingPreset = {
        id: `preset-custom-${Date.now()}`,
        name,
        category: "custom",
        isBuiltIn: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        data: {
          colorWheels: state.colorWheels,
          basicParameters: state.basicParameters,
          curves: state.curves,
          lut: state.lut,
        },
      }

      // В реальном приложении сохранять в localStorage или backend
      const customPresets = JSON.parse(localStorage.getItem("colorGradingPresets") || "[]")
      customPresets.push(preset)
      localStorage.setItem("colorGradingPresets", JSON.stringify(customPresets))

      logger.info("Saved preset", { name })
    },
    [state],
  )

  // Автоматическая коррекция
  const autoCorrect = useCallback(() => {
    // Простая автокоррекция - нормализация уровней
    setState((prev) => ({
      ...prev,
      curves: {
        ...prev.curves,
        master: [
          { x: 0, y: 246, id: "start" }, // Поднимаем черную точку
          { x: 128, y: 128, id: "mid" }, // Средняя точка
          { x: 256, y: 10, id: "end" }, // Опускаем белую точку
        ],
      },
      basicParameters: {
        ...prev.basicParameters,
        contrast: 5,
        saturation: 5,
      },
      hasUnsavedChanges: true,
    }))
  }, [])

  // Проверка изменений
  const hasChanges = useMemo(() => {
    // Проверяем отличия от дефолтных значений
    const { colorWheels, basicParameters } = state

    // Проверка цветовых колес
    const wheelsChanged = Object.entries(colorWheels).some(
      ([_key, value]) => value.r !== 0 || value.g !== 0 || value.b !== 0,
    )

    // Проверка базовых параметров
    const paramsChanged = Object.entries(basicParameters).some(([key, value]) => {
      if (key === "pivot") return value !== 0.5
      return value !== 0
    })

    return wheelsChanged || paramsChanged || state.lut.isEnabled
  }, [state])

  // Dispatch функция для обработки событий из компонентов
  const dispatch = useCallback(
    (action: any) => {
      switch (action.type) {
        case "UPDATE_CURVE":
          updateCurve(action.curve, action.points)
          break
        case "UPDATE_COLOR_WHEEL":
          updateColorWheel(action.wheel, action.value)
          break
        case "UPDATE_BASIC_PARAMETER":
          updateBasicParameter(action.parameter, action.value)
          break
        case "LOAD_LUT":
          loadLUT(action.file)
          break
        case "SET_LUT_INTENSITY":
          setLUTIntensity(action.value)
          break
        case "TOGGLE_LUT":
          toggleLUT(action.enabled)
          break
        case "RESET_LUT":
          setState((prev) => ({
            ...prev,
            lut: {
              file: null,
              intensity: 100,
              isEnabled: false,
            },
          }))
          break
        case "TOGGLE_SCOPE":
          setState((prev) => ({
            ...prev,
            scopes: {
              ...prev.scopes,
              [`${action.scopeType}Enabled`]: action.enabled,
            },
          }))
          break
        case "SET_SCOPE_REFRESH_RATE":
          setState((prev) => ({
            ...prev,
            scopes: {
              ...prev.scopes,
              refreshRate: action.value,
            },
          }))
          break
        case "RESET_ALL":
          resetAll()
          break
        case "AUTO_CORRECT":
          autoCorrect()
          break
        case "LOAD_PRESET":
          loadPreset(action.presetId)
          break
        case "SAVE_PRESET":
          savePreset(action.name)
          break
        default:
          logger.warn("Unknown action type:", action.type)
      }
    },
    [
      updateColorWheel,
      updateBasicParameter,
      updateCurve,
      loadLUT,
      setLUTIntensity,
      toggleLUT,
      resetAll,
      autoCorrect,
      loadPreset,
      savePreset,
    ],
  )

  return {
    state,
    dispatch,

    // Методы обновления
    updateColorWheel,
    updateBasicParameter,
    updateCurve,
    loadLUT,
    setLUTIntensity,
    toggleLUT,
    togglePreview,

    // Действия
    applyToClip,
    resetAll,
    loadPreset,
    savePreset,
    autoCorrect,

    // Состояние
    hasChanges,
    isActive: state.isActive,

    // Пресеты
    availablePresets: BUILT_IN_PRESETS,
  }
}
