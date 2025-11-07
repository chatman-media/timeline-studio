import { useCallback, useEffect, useRef, useState } from "react"
import { logError, logInfo } from "@/lib/tauri-logger"
import { webglTransitionService } from "../services/webgl-transition-service"
import type { Transition } from "../types/transitions"
import { useTransitions } from "./use-transitions"

/**
 * Параметры для предварительного просмотра перехода
 */
interface PreviewParams {
  transition: Transition
  sourceImage: HTMLImageElement
  targetImage: HTMLImageElement
  progress: number
  canvas: HTMLCanvasElement
}

/**
 * Результат предварительного просмотра
 */
interface PreviewResult {
  success: boolean
  error?: string
  renderTime?: number
}

/**
 * Hook для работы с расширенными переходами
 */
export function useAdvancedTransitions() {
  const { transitions, loading: transitionsLoading, error: transitionsError } = useTransitions()
  const [isWebGLInitialized, setIsWebGLInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  /**
   * Инициализация WebGL
   */
  const initializeWebGL = useCallback((canvas: HTMLCanvasElement) => {
    void logInfo("Initializing WebGL for advanced transitions")
    try {
      const success = webglTransitionService.initialize(canvas)
      setIsWebGLInitialized(success)

      if (success) {
        canvasRef.current = canvas
        setInitError(null)
        void logInfo("WebGL initialization successful")
      } else {
        setInitError("Не удалось инициализировать WebGL")
        void logError("WebGL initialization failed")
      }

      return success
    } catch (error) {
      const message = error instanceof Error ? error.message : "Неизвестная ошибка WebGL"
      setInitError(message)
      setIsWebGLInitialized(false)
      void logError(`WebGL initialization error: ${message}`)
      return false
    }
  }, [])

  /**
   * Получение переходов с поддержкой blur/color параметров
   */
  const advancedTransitions = transitions.filter(
    (transition) =>
      transition.parameters?.blur?.enabled || transition.parameters?.color?.enabled || transition.gpuAccelerated,
  )

  /**
   * Получение переходов по категории
   */
  const getTransitionsByCategory = useCallback(
    (category: string) => {
      return transitions.filter((t) => t.category === category)
    },
    [transitions],
  )

  /**
   * Получение переходов с GPU ускорением
   */
  const gpuAcceleratedTransitions = transitions.filter((t) => t.gpuAccelerated)

  /**
   * Предварительный просмотр перехода
   */
  const previewTransition = useCallback(
    async (params: PreviewParams): Promise<PreviewResult> => {
      if (!isWebGLInitialized) {
        void logError("Preview attempted but WebGL not initialized")
        return { success: false, error: "WebGL не инициализирован" }
      }

      void logInfo(`Starting preview for transition: ${params.transition.id}`)
      try {
        // Создаем текстуры из изображений
        const sourceTexture = webglTransitionService.createTextureFromImage(params.sourceImage)
        const targetTexture = webglTransitionService.createTextureFromImage(params.targetImage)

        if (!sourceTexture || !targetTexture) {
          void logError("Failed to create textures for preview")
          return { success: false, error: "Не удалось создать текстуры" }
        }

        void logInfo("Textures created, rendering transition preview")

        // Рендерим переход
        const result = await webglTransitionService.renderTransition({
          canvas: params.canvas,
          sourceTexture,
          targetTexture,
          progress: params.progress,
          parameters: params.transition.parameters,
        })

        void logInfo(`Preview rendered successfully, time: ${result.renderTime}ms`)
        return result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Неизвестная ошибка"
        void logError(`Preview error: ${errorMsg}`)
        return {
          success: false,
          error: errorMsg,
        }
      }
    },
    [isWebGLInitialized],
  )

  /**
   * Проверка поддержки перехода
   */
  const isTransitionSupported = useCallback(
    (transition: Transition): boolean => {
      // Базовые переходы поддерживаются всегда
      if (transition.complexity === "basic" || transition.complexity === "intermediate") {
        return true
      }

      // GPU переходы требуют WebGL
      if (transition.gpuAccelerated && !isWebGLInitialized) {
        return false
      }

      return true
    },
    [isWebGLInitialized],
  )

  /**
   * Получение информации о производительности перехода
   */
  const getTransitionPerformanceInfo = useCallback(
    (transition: Transition) => {
      const hasBlur = transition.parameters?.blur?.enabled
      const hasColor = transition.parameters?.color?.enabled
      const isGpuAccelerated = transition.gpuAccelerated
      const complexity = transition.complexity

      let performanceLevel: "high" | "medium" | "low" = "high"
      let estimatedRenderTime = 0 // ms

      // Оценка производительности на основе параметров
      if (complexity === "basic") {
        performanceLevel = "high"
        estimatedRenderTime = 5
      } else if (complexity === "intermediate") {
        performanceLevel = "medium"
        estimatedRenderTime = 15
      } else {
        performanceLevel = "low"
        estimatedRenderTime = 30
      }

      // Дополнительные эффекты увеличивают время рендера
      if (hasBlur) estimatedRenderTime += 10
      if (hasColor) estimatedRenderTime += 5

      // GPU ускорение улучшает производительность
      if (isGpuAccelerated && isWebGLInitialized) {
        estimatedRenderTime = Math.max(1, estimatedRenderTime * 0.3)
        if (performanceLevel === "low") performanceLevel = "medium"
      }

      return {
        performanceLevel,
        estimatedRenderTime,
        supportsGpu: isGpuAccelerated,
        hasAdvancedEffects: hasBlur || hasColor,
        requirements: {
          webgl: isGpuAccelerated,
          memory: complexity === "advanced" ? "high" : "medium",
        },
      }
    },
    [isWebGLInitialized],
  )

  /**
   * Создание параметров перехода по умолчанию
   */
  const createDefaultParameters = useCallback((transition: Transition) => {
    const params = { ...transition.parameters }

    // Устанавливаем значения по умолчанию для blur
    if (params?.blur?.enabled === undefined && transition.parameters?.blur) {
      params.blur = {
        enabled: true,
        amount: 50,
        type: "gaussian",
        ...params.blur,
      }
    }

    // Устанавливаем значения по умолчанию для color
    if (params?.color?.enabled === undefined && transition.parameters?.color) {
      params.color = {
        enabled: true,
        tint: "#FFFFFF",
        saturation: 0,
        brightness: 0,
        ...params.color,
      }
    }

    return params
  }, [])

  /**
   * Очистка ресурсов при размонтировании
   */
  useEffect(() => {
    return () => {
      webglTransitionService.dispose()
    }
  }, [])

  return {
    // Состояние
    transitions,
    advancedTransitions,
    gpuAcceleratedTransitions,
    loading: transitionsLoading,
    error: transitionsError || initError,
    isWebGLInitialized,

    // Методы
    initializeWebGL,
    getTransitionsByCategory,
    previewTransition,
    isTransitionSupported,
    getTransitionPerformanceInfo,
    createDefaultParameters,

    // Утилиты
    hasBlurSupport: (transition: Transition) => !!transition.parameters?.blur,
    hasColorSupport: (transition: Transition) => !!transition.parameters?.color,
    hasGpuSupport: (transition: Transition) => !!transition.gpuAccelerated,
  }
}
