/**
 * Централизованный менеджер WebGL2 контекста
 * Единая точка управления WebGL2 для всего приложения
 */

import { EventEmitter } from "events"
import { createLogger } from "../tauri-logger"

const logger = createLogger("WebGLContextManager")

/**
 * Конфигурация контекста
 */
export interface ContextConfig {
  canvas?: HTMLCanvasElement
  attributes?: WebGLContextAttributes
}

/**
 * Возможности GPU
 */
export interface GPUCapabilities {
  maxTextureSize: number
  maxTextureUnits: number
  maxVertexAttributes: number
  maxVaryingVectors: number
  maxUniformVectors: number
  maxFragmentUniformVectors: number
  maxDrawBuffers: number
  maxColorAttachments: number
  maxSamples: number
  extensions: string[]
  renderer: string
  vendor: string
  version: string
  shadingLanguageVersion: string
  supportsFloatTextures: boolean
  supportsHalfFloatTextures: boolean
  supportsDepthTextures: boolean
  supportsAnisotropicFiltering: boolean
  supportsTextureFloatLinear: boolean
  maxAnisotropy: number
  tier: "low" | "medium" | "high"
}

/**
 * Менеджер WebGL2 контекста
 */
export class ContextManager extends EventEmitter {
  private static instance: ContextManager | null = null
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGL2RenderingContext | null = null
  private capabilities: GPUCapabilities | null = null
  private isInitialized = false
  private contextLostHandler: ((event: Event) => void) | null = null
  private contextRestoredHandler: (() => void) | null = null

  /**
   * Получить синглтон экземпляр
   */
  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager()
    }
    return ContextManager.instance
  }

  private constructor() {
    super()
  }

  /**
   * Инициализация контекста
   */
  public initialize(config: ContextConfig = {}): boolean {
    if (this.isInitialized && this.gl && !this.gl.isContextLost()) {
      return true
    }

    try {
      // Создаем или используем существующий canvas
      this.canvas = config.canvas || this.createCanvas()

      // Атрибуты контекста по умолчанию
      const contextAttributes: WebGLContextAttributes = {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
        desynchronized: true,
        ...config.attributes,
      }

      // Создаем WebGL2 контекст
      const gl = this.canvas.getContext("webgl2", contextAttributes)
      if (!gl) {
        logger.errorSync("WebGL2 не поддерживается")
        return false
      }

      this.gl = gl

      // Детектируем возможности GPU
      this.capabilities = this.detectCapabilities()

      // Настраиваем контекст
      this.setupContext()

      // Настраиваем обработчики событий
      this.setupEventHandlers()

      this.isInitialized = true
      this.emit("initialized", this.capabilities)

      logger.infoSync("WebGL2 контекст инициализирован", {
        tier: this.capabilities?.tier,
        renderer: this.capabilities?.renderer,
      })

      return true
    } catch (error) {
      logger.errorSync("Ошибка инициализации WebGL2 контекста", { error })
      this.emit("error", error)
      return false
    }
  }

  /**
   * Получить WebGL2 контекст
   */
  public getContext(): WebGL2RenderingContext | null {
    if (!this.gl || this.gl.isContextLost()) {
      return null
    }
    return this.gl
  }

  /**
   * Получить canvas элемент
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }

  /**
   * Получить возможности GPU
   */
  public getCapabilities(): GPUCapabilities | null {
    return this.capabilities
  }

  /**
   * Изменить размер canvas
   */
  public resize(width: number, height: number): void {
    if (!this.canvas || !this.gl) return

    // Учитываем device pixel ratio для четкого изображения
    const dpr = window.devicePixelRatio || 1
    const displayWidth = Math.floor(width * dpr)
    const displayHeight = Math.floor(height * dpr)

    // Изменяем размер canvas
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
      this.canvas.style.width = `${width}px`
      this.canvas.style.height = `${height}px`

      // Обновляем viewport
      this.gl.viewport(0, 0, displayWidth, displayHeight)

      this.emit("resize", { width: displayWidth, height: displayHeight, dpr })
    }
  }

  /**
   * Очистить контекст
   */
  public dispose(): void {
    if (this.canvas) {
      // Удаляем обработчики событий
      if (this.contextLostHandler) {
        this.canvas.removeEventListener("webglcontextlost", this.contextLostHandler)
      }
      if (this.contextRestoredHandler) {
        this.canvas.removeEventListener("webglcontextrestored", this.contextRestoredHandler)
      }
    }

    // Теряем контекст намеренно для освобождения ресурсов
    const loseContext = this.gl?.getExtension("WEBGL_lose_context")
    if (loseContext) {
      loseContext.loseContext()
    }

    this.gl = null
    this.canvas = null
    this.capabilities = null
    this.isInitialized = false

    this.removeAllListeners()
  }

  /**
   * Создать canvas элемент
   */
  private createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.style.position = "fixed"
    canvas.style.top = "0"
    canvas.style.left = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.pointerEvents = "none"
    canvas.style.zIndex = "-1"
    return canvas
  }

  /**
   * Детектировать возможности GPU
   */
  private detectCapabilities(): GPUCapabilities {
    if (!this.gl) {
      throw new Error("WebGL2 контекст не инициализирован")
    }

    const gl = this.gl
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
    const textureFloatLinear = !!gl.getExtension("OES_texture_float_linear")
    const anisotropic = gl.getExtension("EXT_texture_filter_anisotropic")

    // Получаем основные параметры
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
    const renderer = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "Unknown"
    const vendor = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : "Unknown"

    // Определяем производительность GPU
    let tier: "low" | "medium" | "high" = "medium"

    // Простая эвристика для определения уровня GPU
    if (maxTextureSize >= 16384 && maxTextureUnits >= 32) {
      tier = "high"
    } else if (maxTextureSize <= 4096 || maxTextureUnits <= 8) {
      tier = "low"
    }

    // Проверяем известные GPU
    const rendererLower = renderer.toLowerCase()
    if (rendererLower.includes("nvidia") || rendererLower.includes("radeon") || rendererLower.includes("geforce")) {
      tier = "high"
    } else if (rendererLower.includes("intel") && !rendererLower.includes("iris")) {
      tier = "low"
    }

    return {
      maxTextureSize,
      maxTextureUnits,
      maxVertexAttributes: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
      maxUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
      maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
      maxDrawBuffers: gl.getParameter(gl.MAX_DRAW_BUFFERS),
      maxColorAttachments: gl.getParameter(gl.MAX_COLOR_ATTACHMENTS),
      maxSamples: gl.getParameter(gl.MAX_SAMPLES),
      extensions: gl.getSupportedExtensions() || [],
      renderer,
      vendor,
      version: gl.getParameter(gl.VERSION),
      shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
      supportsFloatTextures: !!(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("OES_texture_float")),
      supportsHalfFloatTextures: !!(
        gl.getExtension("EXT_color_buffer_half_float") || gl.getExtension("OES_texture_half_float")
      ),
      supportsDepthTextures: true, // WebGL2 всегда поддерживает
      supportsAnisotropicFiltering: !!anisotropic,
      supportsTextureFloatLinear: textureFloatLinear,
      maxAnisotropy: anisotropic ? gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1,
      tier,
    }
  }

  /**
   * Настройка контекста
   */
  private setupContext(): void {
    if (!this.gl) return

    const gl = this.gl

    // Включаем необходимые расширения
    gl.getExtension("EXT_color_buffer_float")
    gl.getExtension("OES_texture_float_linear")
    gl.getExtension("EXT_texture_filter_anisotropic")

    // Базовые настройки для обработки видео
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)

    // Отключаем ненужные тесты для 2D рендеринга
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.STENCIL_TEST)

    // Настройка блендинга по умолчанию
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendEquation(gl.FUNC_ADD)

    // Очищаем начальное состояние
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventHandlers(): void {
    if (!this.canvas) return

    // Обработчик потери контекста
    this.contextLostHandler = (event: Event) => {
      event.preventDefault()
      logger.warnSync("WebGL контекст потерян")
      this.emit("contextLost")
    }

    // Обработчик восстановления контекста
    this.contextRestoredHandler = () => {
      logger.infoSync("WebGL контекст восстановлен")

      // Переинициализируем контекст
      this.initialize({ canvas: this.canvas! })

      this.emit("contextRestored")
    }

    this.canvas.addEventListener("webglcontextlost", this.contextLostHandler)
    this.canvas.addEventListener("webglcontextrestored", this.contextRestoredHandler)
  }
}

// Экспортируем синглтон
export const contextManager = ContextManager.getInstance()
