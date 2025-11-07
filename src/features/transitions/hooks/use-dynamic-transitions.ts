/**
 * Хук для работы с динамическими переходами
 * Обеспечивает GPU-ускоренный рендеринг с particle systems и physics
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { logError, logInfo } from "@/lib/tauri-logger"
import { type DynamicShaderType, DynamicTransitionService } from "../services/dynamic-transition-service"

interface UseDynamicTransitionsOptions {
  autoInitialize?: boolean
  preferHighPerformance?: boolean
}

interface RenderDynamicTransitionParams {
  shaderType: DynamicShaderType
  sourceImage: HTMLImageElement | HTMLCanvasElement
  targetImage: HTMLImageElement | HTMLCanvasElement
  progress: number
  parameters?: {
    particles?: {
      count: number
      size: number
      speed: number
      gravity: number
      turbulence: number
    }
    physics?: {
      explosionForce?: number
      gravity?: number
      windForce?: number
      viscosity?: number
    }
  }
}

interface DynamicTransitionState {
  isInitialized: boolean
  isRendering: boolean
  error: string | null
  performance: {
    fps: number
    frameTime: number
    gpuMemory?: number
  }
  capabilities: {
    webgl2: boolean
    computeShaders: boolean
    maxTextureSize: number
    maxParticles: number
  }
}

export function useDynamicTransitions(options: UseDynamicTransitionsOptions = {}) {
  const { autoInitialize = true, preferHighPerformance = true } = options

  const [state, setState] = useState<DynamicTransitionState>({
    isInitialized: false,
    isRendering: false,
    error: null,
    performance: {
      fps: 0,
      frameTime: 0,
    },
    capabilities: {
      webgl2: false,
      computeShaders: false,
      maxTextureSize: 0,
      maxParticles: 0,
    },
  })

  const serviceRef = useRef<DynamicTransitionService | undefined>(undefined)
  const canvasRef = useRef<HTMLCanvasElement | undefined>(undefined)
  const frameCountRef = useRef(0)
  const lastFrameTimeRef = useRef(0)
  const fpsIntervalRef = useRef<number | undefined>(undefined)

  // Создание и инициализация canvas
  const createCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas")
      canvasRef.current.width = 1920
      canvasRef.current.height = 1080
      canvasRef.current.style.display = "none"
      document.body.appendChild(canvasRef.current)
    }
    return canvasRef.current
  }, [])

  // Инициализация сервиса
  const initialize = useCallback(async () => {
    void logInfo("Initializing DynamicTransitionService")
    try {
      const canvas = createCanvas()
      const service = new DynamicTransitionService()

      const isInitialized = await service.initialize(canvas)
      if (isInitialized) {
        serviceRef.current = service
        void logInfo("DynamicTransitionService initialized successfully")

        // Определяем возможности
        const gl = canvas.getContext("webgl2")
        if (gl) {
          const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
          const maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)

          const capabilities = {
            webgl2: true,
            computeShaders: !!gl.getExtension("WEBGL_compute_shader"),
            maxTextureSize,
            maxParticles: Math.min(maxVertexUniformVectors * 100, 10000),
          }

          void logInfo(
            `WebGL2 capabilities detected: maxTexture=${maxTextureSize}, maxParticles=${capabilities.maxParticles}`,
          )

          setState((prev) => ({
            ...prev,
            isInitialized: true,
            capabilities,
          }))

          // Запускаем мониторинг производительности
          startPerformanceMonitoring()
        } else {
          throw new Error("WebGL2 не поддерживается")
        }
      } else {
        throw new Error("Не удалось инициализировать DynamicTransitionService")
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Неизвестная ошибка инициализации"
      void logError(`Initialization failed: ${errorMsg}`)
      setState((prev) => ({
        ...prev,
        error: errorMsg,
      }))
    }
  }, [createCanvas])

  // Мониторинг производительности
  const startPerformanceMonitoring = useCallback(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const updateFPS = () => {
      const currentTime = performance.now()
      const deltaTime = currentTime - lastTime

      if (deltaTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / deltaTime)
        const frameTime = deltaTime / frameCount

        setState((prev) => ({
          ...prev,
          performance: {
            ...prev.performance,
            fps,
            frameTime,
          },
        }))

        frameCount = 0
        lastTime = currentTime
      }

      frameCount++
      frameCountRef.current = frameCount
      lastFrameTimeRef.current = currentTime
    }

    fpsIntervalRef.current = window.setInterval(updateFPS, 100)
  }, [])

  // Рендеринг динамического перехода
  const renderDynamicTransition = useCallback(
    async (params: RenderDynamicTransitionParams) => {
      if (!serviceRef.current || !canvasRef.current) {
        void logError("Service not initialized for rendering")
        return null
      }

      if (state.isRendering) {
        void logInfo("Render already in progress, skipping")
        return null
      }

      void logInfo(`Starting render: shaderType=${params.shaderType}, progress=${params.progress}`)
      setState((prev) => ({ ...prev, isRendering: true, error: null }))

      try {
        const { shaderType, sourceImage, targetImage, progress, parameters = {} } = params
        const canvas = canvasRef.current
        const service = serviceRef.current

        // Подгоняем размер canvas под изображения
        canvas.width = Math.max(sourceImage.width, targetImage.width)
        canvas.height = Math.max(sourceImage.height, targetImage.height)
        void logInfo(`Canvas resized to ${canvas.width}x${canvas.height}`)

        // Создаем текстуры
        const sourceTexture = (await service.createTextureFromImage(sourceImage as HTMLImageElement)) || undefined
        const targetTexture = (await service.createTextureFromImage(targetImage as HTMLImageElement)) || undefined

        if (!sourceTexture || !targetTexture) {
          throw new Error("Не удалось создать текстуры")
        }

        void logInfo("Textures created, starting shader rendering")

        // Рендерим переход
        const success = await service.renderDynamicTransition({
          canvas,
          sourceTexture,
          targetTexture,
          progress,
          shaderType,
          parameters,
        })

        if (!success) {
          throw new Error("Ошибка рендеринга перехода")
        }

        void logInfo(`Shader rendering successful for ${shaderType}`)

        // Возвращаем результат как ImageData
        const ctx = canvas.getContext("2d")
        if (ctx) {
          return ctx.getImageData(0, 0, canvas.width, canvas.height)
        }

        return null
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Ошибка рендеринга"
        void logError(`Render failed: ${errorMsg}`)
        setState((prev) => ({
          ...prev,
          error: errorMsg,
        }))
        return null
      } finally {
        setState((prev) => ({ ...prev, isRendering: false }))
      }
    },
    [state.isRendering],
  )

  // Предварительный просмотр перехода в реальном времени
  const previewDynamicTransition = useCallback(
    async (params: RenderDynamicTransitionParams, targetCanvas: HTMLCanvasElement, duration = 1000) => {
      if (!serviceRef.current || state.isRendering) return

      const startTime = performance.now()
      let animationId: number

      const animate = async () => {
        const elapsed = performance.now() - startTime
        const progress = Math.min(elapsed / duration, 1.0)

        const result = await renderDynamicTransition({
          ...params,
          progress,
        })

        if (result && targetCanvas) {
          const ctx = targetCanvas.getContext("2d")
          if (ctx) {
            ctx.putImageData(result, 0, 0)
          }
        }

        if (progress < 1.0) {
          animationId = requestAnimationFrame(animate)
        }
      }

      void animate()

      // Возвращаем функцию остановки
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
      }
    },
    [renderDynamicTransition, state.isRendering],
  )

  // Проверка поддержки конкретного типа перехода
  const isTransitionSupported = useCallback(
    (shaderType: DynamicShaderType): boolean => {
      if (!state.isInitialized) {
        void logInfo(`Transition ${shaderType} not supported: service not initialized`)
        return false
      }

      // Некоторые переходы требуют особых возможностей
      const requiresHighPerformance: DynamicShaderType[] = [
        "particle-dissolve",
        "liquid-morph",
        "glass-shatter",
        "tornado-twist",
      ]

      const requiresComputeShaders: DynamicShaderType[] = ["particle-dissolve", "organic-growth"]

      if (requiresHighPerformance.includes(shaderType) && state.performance.fps < 30) {
        void logInfo(`Transition ${shaderType} requires high performance but fps=${state.performance.fps}`)
        return false
      }

      if (requiresComputeShaders.includes(shaderType) && !state.capabilities.computeShaders) {
        void logInfo(`Transition ${shaderType} requires compute shaders but not available`)
        return false
      }

      return true
    },
    [state],
  )

  // Оптимизация параметров для производительности
  const optimizeParameters = useCallback(
    (_shaderType: DynamicShaderType, parameters: any): any => {
      const optimized = { ...parameters }

      // Уменьшаем количество частиц на слабых системах
      if (parameters.particles && state.performance.fps < 30) {
        optimized.particles = {
          ...parameters.particles,
          count: Math.min(parameters.particles.count, 1000),
        }
      }

      // Упрощаем физику на слабых системах
      if (parameters.physics && state.performance.frameTime > 20) {
        optimized.physics = {
          ...parameters.physics,
          turbulence: (parameters.physics.turbulence || 1) * 0.5,
        }
      }

      return optimized
    },
    [state.performance],
  )

  // Экспорт кадра перехода
  const exportFrame = useCallback(
    async (
      params: RenderDynamicTransitionParams,
      format: "png" | "jpeg" = "png",
      quality = 0.95,
    ): Promise<Blob | null> => {
      const result = await renderDynamicTransition(params)

      if (!result || !canvasRef.current) return null

      return new Promise((resolve) => {
        canvasRef.current.toBlob((blob) => resolve(blob), `image/${format}`, quality)
      })
    },
    [renderDynamicTransition],
  )

  // Пакетный рендеринг для экспорта видео
  const batchRender = useCallback(
    async (
      params: Omit<RenderDynamicTransitionParams, "progress">,
      frames: number,
      onProgress?: (frame: number, total: number) => void,
    ): Promise<ImageData[]> => {
      const results: ImageData[] = []

      for (let i = 0; i < frames; i++) {
        const progress = i / (frames - 1)
        const result = await renderDynamicTransition({
          ...params,
          progress,
        })

        if (result) {
          results.push(result)
        }

        onProgress?.(i + 1, frames)
      }

      return results
    },
    [renderDynamicTransition],
  )

  // Автоматическая инициализация
  useEffect(() => {
    if (autoInitialize && !state.isInitialized) {
      void initialize()
    }

    return () => {
      // Очистка при размонтировании
      if (fpsIntervalRef.current) {
        clearInterval(fpsIntervalRef.current)
      }
      if (canvasRef.current) {
        canvasRef.current.remove()
      }
      if (serviceRef.current) {
        serviceRef.current.dispose()
      }
    }
  }, [autoInitialize, state.isInitialized, initialize])

  return {
    // Состояние
    isInitialized: state.isInitialized,
    isRendering: state.isRendering,
    error: state.error,
    capabilities: state.capabilities,
    performance: state.performance,

    // Методы
    initialize,
    renderDynamicTransition,
    previewDynamicTransition,
    isTransitionSupported,
    optimizeParameters,
    exportFrame,
    batchRender,

    // WebGL контекст (для продвинутого использования)
    getWebGLContext: () => canvasRef.current?.getContext("webgl2"),
  }
}
