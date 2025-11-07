/**
 * WebGL2 Unified Effects Renderer
 * Единый рендерер эффектов на базе новой WebGL2 библиотеки
 */

import { createLogger } from "@/lib/tauri-logger"
import type { AppliedEffect, BaseEffect, EffectProcessingType, WebGLProcessor } from "../types/unified-effects"
import { WebGL2EffectProcessor } from "./webgl2-effect-processor"

const logger = createLogger("Webgl2UnifiedRenderer")

export interface RenderContext {
  // Источник
  source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | HTMLImageElement

  // Целевой контекст
  target?: HTMLCanvasElement | HTMLVideoElement

  // Размеры
  width: number
  height: number

  // Время
  currentTime: number

  // Качество рендеринга
  quality: "draft" | "preview" | "full"

  // GPU информация
  gpuTier?: "low" | "medium" | "high"
}

export interface RenderResult {
  success: boolean
  output?: HTMLCanvasElement | ImageBitmap | string // FFmpeg command
  processingTime: number
  error?: string
}

export class WebGL2UnifiedRenderer {
  private processor: WebGL2EffectProcessor
  private isInitialized = false

  constructor() {
    this.processor = new WebGL2EffectProcessor()
  }

  // ============================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    await this.processor.initialize()
    this.isInitialized = true
  }

  // ============================================================================
  // ОСНОВНОЙ МЕТОД РЕНДЕРИНГА
  // ============================================================================

  async renderEffectStack(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    try {
      // Убеждаемся что инициализированы
      await this.initialize()

      // Сортируем эффекты по order
      const sortedEffects = [...appliedEffects].filter((ae) => ae.enabled).sort((a, b) => a.order - b.order)

      let processingType: EffectProcessingType = "realtime"

      // Определяем общий тип обработки
      for (const appliedEffect of sortedEffects) {
        const baseEffect = baseEffects.get(appliedEffect.effectId)
        if (baseEffect?.processingType === "render") {
          processingType = "render"
          break
        }
        if (baseEffect?.processingType === "hybrid") {
          processingType = "hybrid"
        }
      }

      // Выбираем стратегию рендеринга
      switch (processingType) {
        case "realtime":
          return await this.renderRealtimeEffects(sortedEffects, baseEffects, context)

        case "render":
          return await this.renderFFmpegEffects(sortedEffects, baseEffects, context)

        case "hybrid":
          return await this.renderHybridEffects(sortedEffects, baseEffects, context)

        default:
          return {
            success: false,
            error: "Unknown processing type",
            processingTime: performance.now() - startTime,
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime: performance.now() - startTime,
      }
    }
  }

  // ============================================================================
  // REALTIME РЕНДЕРИНГ (WebGL2)
  // ============================================================================

  private async renderRealtimeEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    try {
      // Компилируем кастомные шейдеры
      for (const appliedEffect of appliedEffects) {
        const baseEffect = baseEffects.get(appliedEffect.effectId)
        if (!baseEffect?.processors.webgl) continue

        // Компилируем шейдер если есть
        const convertedProcessor = this.convertWebGLProcessor(baseEffect.processors.webgl)
        const success = await this.processor.compileEffect(appliedEffect.effectId, convertedProcessor)

        if (!success) {
          logger.warn(`Failed to compile shader for effect ${appliedEffect.effectId}`)
        }
      }

      // Обрабатываем изображение последовательно через все эффекты
      let currentResult: any = context.source

      for (const appliedEffect of appliedEffects) {
        const baseEffect = baseEffects.get(appliedEffect.effectId)
        if (!baseEffect) continue

        // Получаем параметры с учетом анимации
        const params = this.getParametersAtTime(appliedEffect, context.currentTime)

        // Создаем полный объект AppliedEffect с обновленными параметрами
        const effectWithParams = {
          ...appliedEffect,
          parameters: params,
        }

        // Обрабатываем эффект
        const result = await this.processor.processImage(currentResult, effectWithParams)

        if (!result.success) {
          throw new Error(`Effect ${appliedEffect.effectId} failed: ${result.error}`)
        }

        // Экспортируем результат как ImageData для следующего эффекта
        const imageData = await this.processor.exportAsImageData(result.texture, result.width, result.height)

        currentResult = await createImageBitmap(imageData)
      }

      return {
        success: true,
        output: currentResult,
        processingTime: performance.now() - startTime,
      }
    } catch (error) {
      // Fallback на CSS фильтры при ошибке
      logger.warn("WebGL2 rendering failed, falling back to CSS:", error)
      return await this.renderCSSEffects(appliedEffects, baseEffects, context)
    }
  }

  private async renderCSSEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    // Создаем временный элемент для применения CSS фильтров
    const canvas = document.createElement("canvas")
    canvas.width = context.width
    canvas.height = context.height
    const ctx = canvas.getContext("2d")!

    // Рисуем исходное изображение
    if (context.source instanceof HTMLVideoElement) {
      ctx.drawImage(context.source, 0, 0, context.width, context.height)
    } else if (context.source instanceof ImageBitmap || context.source instanceof HTMLImageElement) {
      ctx.drawImage(context.source, 0, 0, context.width, context.height)
    } else if (context.source instanceof HTMLCanvasElement) {
      ctx.drawImage(context.source, 0, 0, context.width, context.height)
    }

    // Строим CSS фильтры
    const cssFilters: string[] = []

    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (!baseEffect?.processors.css) continue

      const params = this.getParametersAtTime(appliedEffect, context.currentTime)
      const filter = baseEffect.processors.css.filter(params)

      if (filter) {
        cssFilters.push(filter)
      }
    }

    // Применяем фильтры
    if (cssFilters.length > 0) {
      ctx.filter = cssFilters.join(" ")
      // Перерисовываем с фильтрами
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = context.width
      tempCanvas.height = context.height
      const tempCtx = tempCanvas.getContext("2d")!
      tempCtx.drawImage(canvas, 0, 0)

      ctx.clearRect(0, 0, context.width, context.height)
      ctx.drawImage(tempCanvas, 0, 0)
    }

    return {
      success: true,
      output: canvas,
      processingTime: performance.now() - startTime,
    }
  }

  // ============================================================================
  // FFMPEG РЕНДЕРИНГ
  // ============================================================================

  private async renderFFmpegEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    const filters: string[] = []

    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (!baseEffect?.processors.ffmpeg) continue

      const params = this.getParametersAtTime(appliedEffect, context.currentTime)
      const filter = baseEffect.processors.ffmpeg.filter(params)

      if (filter) {
        filters.push(filter)
      }
    }

    const ffmpegCommand = filters.length > 0 ? filters.join(",") : ""

    return {
      success: true,
      output: ffmpegCommand,
      processingTime: performance.now() - startTime,
    }
  }

  // ============================================================================
  // HYBRID РЕНДЕРИНГ
  // ============================================================================

  private async renderHybridEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    // Разделяем эффекты на realtime и render
    const realtimeEffects: AppliedEffect[] = []
    const renderEffects: AppliedEffect[] = []

    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (baseEffect?.processingType === "render") {
        renderEffects.push(appliedEffect)
      } else {
        realtimeEffects.push(appliedEffect)
      }
    }

    // Сначала применяем realtime эффекты
    let result: RenderResult
    if (realtimeEffects.length > 0) {
      result = await this.renderRealtimeEffects(realtimeEffects, baseEffects, context)
      if (!result.success) return result
    } else {
      result = {
        success: true,
        output: context.source instanceof ImageBitmap ? context.source : await createImageBitmap(context.source),
        processingTime: 0,
      }
    }

    // Затем генерируем FFmpeg команды для render эффектов
    if (renderEffects.length > 0) {
      const ffmpegResult = await this.renderFFmpegEffects(renderEffects, baseEffects, context)
      if (ffmpegResult.success && ffmpegResult.output) {
        // Возвращаем FFmpeg команду вместе с обработанным изображением
        return {
          ...result,
          output: ffmpegResult.output, // FFmpeg command string
        }
      }
    }

    return result
  }

  // ============================================================================
  // УТИЛИТЫ
  // ============================================================================

  private getParametersAtTime(appliedEffect: AppliedEffect, time: number): Record<string, any> {
    const params = { ...appliedEffect.parameters }

    // Применяем ключевые кадры
    for (const [paramId, keyframes] of Object.entries(appliedEffect.keyframes)) {
      if (keyframes.length === 0) continue

      // Находим значение в момент времени time
      const value = this.interpolateKeyframes(keyframes, time)
      if (value !== undefined) {
        params[paramId] = value
      }
    }

    return params
  }

  private interpolateKeyframes(keyframes: any[], time: number): any {
    if (keyframes.length === 0) return undefined
    if (keyframes.length === 1) return keyframes[0].value

    // Сортируем по времени
    const sorted = [...keyframes].sort((a, b) => a.time - b.time)

    // Время до первого кейфрейма
    if (time <= sorted[0].time) return sorted[0].value

    // Время после последнего кейфрейма
    if (time >= sorted[sorted.length - 1].time) {
      return sorted[sorted.length - 1].value
    }

    // Интерполяция между кейфреймами
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      if (time >= current.time && time <= next.time) {
        const progress = (time - current.time) / (next.time - current.time)

        // Простая линейная интерполяция
        if (typeof current.value === "number" && typeof next.value === "number") {
          return current.value + (next.value - current.value) * progress
        }

        // Для массивов (цвета и т.д.)
        if (Array.isArray(current.value) && Array.isArray(next.value)) {
          return current.value.map((v: any, idx: number) => {
            if (typeof v === "number" && typeof next.value[idx] === "number") {
              return v + (next.value[idx] - v) * progress
            }
            return v
          })
        }

        return current.value
      }
    }

    return undefined
  }

  // ============================================================================
  // ПРЕОБРАЗОВАНИЕ ПРОЦЕССОРОВ
  // ============================================================================

  private convertWebGLProcessor(processor: WebGLProcessor): {
    fragmentShader: string
    vertexShader?: string
    uniforms?: Record<string, any>
  } {
    // Конвертируем WebGL1 шейдеры в WebGL2
    const fragmentShader = this.convertToWebGL2Shader(processor.fragmentShader, "fragment")
    const vertexShader = processor.vertexShader
      ? this.convertToWebGL2Shader(processor.vertexShader, "vertex")
      : undefined

    return {
      fragmentShader,
      vertexShader,
      uniforms: processor.uniforms,
    }
  }

  private convertToWebGL2Shader(shaderSource: string, type: "vertex" | "fragment"): string {
    // Добавляем версию если нет
    if (!shaderSource.includes("#version")) {
      shaderSource = `#version 300 es\n${shaderSource}`
    }

    // Заменяем старый синтаксис на новый
    if (type === "vertex") {
      shaderSource = shaderSource.replace(/attribute\s+/g, "in ").replace(/varying\s+/g, "out ")
    } else {
      shaderSource = shaderSource
        .replace(/varying\s+/g, "in ")
        .replace(/texture2D\(/g, "texture(")
        .replace(/gl_FragColor/g, "fragColor")

      // Добавляем выходную переменную если нет
      if (!shaderSource.includes("out vec4 fragColor")) {
        const precisionMatch = shaderSource.match(/precision\s+\w+\s+float;/)
        const insertPos = precisionMatch ? precisionMatch.index! + precisionMatch[0].length : 0
        shaderSource = `${shaderSource.slice(0, insertPos)}\nout vec4 fragColor;\n${shaderSource.slice(insertPos)}`
      }
    }

    return shaderSource
  }

  // ============================================================================
  // ОЧИСТКА РЕСУРСОВ
  // ============================================================================

  dispose(): void {
    this.processor.dispose()
    this.isInitialized = false
  }
}
