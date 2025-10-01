/**
 * Базовый класс для WebGL рендереров
 * Предоставляет общую функциональность для всех рендереров
 */

import { EventEmitter } from "events"
import { contextManager, type GPUCapabilities } from "./context-manager"
import { type ShaderProgram, shaderPool } from "./shader-pool"

/**
 * Параметры рендерера
 */
export interface RendererOptions {
  name: string
  canvas?: HTMLCanvasElement
  createCanvas?: boolean
  width?: number
  height?: number
  antialias?: boolean
  preserveDrawingBuffer?: boolean
}

/**
 * Текстура с метаданными
 */
export interface ManagedTexture {
  texture: WebGLTexture
  width: number
  height: number
  format: number
  type: number
}

/**
 * Фреймбуфер с метаданными
 */
export interface ManagedFramebuffer {
  framebuffer: WebGLFramebuffer
  colorTextures: ManagedTexture[]
  depthTexture?: ManagedTexture
  width: number
  height: number
}

/**
 * Базовый класс рендерера
 */
export abstract class BaseRenderer extends EventEmitter {
  protected name: string
  protected canvas: HTMLCanvasElement | null = null
  protected gl: WebGL2RenderingContext | null = null
  protected capabilities: GPUCapabilities | null = null
  protected isInitialized = false

  // Управление ресурсами
  protected textures = new Map<string, ManagedTexture>()
  protected framebuffers = new Map<string, ManagedFramebuffer>()
  protected programs = new Map<string, ShaderProgram>()

  // Текущее состояние
  protected currentProgram: ShaderProgram | null = null
  protected currentFramebuffer: ManagedFramebuffer | null = null
  protected viewport = { x: 0, y: 0, width: 0, height: 0 }

  constructor(options: RendererOptions) {
    super()
    this.name = options.name

    // Создаем или используем существующий canvas
    if (options.canvas) {
      this.canvas = options.canvas
    } else if (options.createCanvas) {
      this.canvas = document.createElement("canvas")
      if (options.width) this.canvas.width = options.width
      if (options.height) this.canvas.height = options.height
    }
  }

  /**
   * Инициализация рендерера
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // Инициализируем контекст
      if (this.canvas) {
        const success = contextManager.initialize({
          canvas: this.canvas,
          attributes: {
            antialias: this.getOption("antialias", true),
            preserveDrawingBuffer: this.getOption("preserveDrawingBuffer", false),
          },
        })

        if (!success) {
          throw new Error("Не удалось инициализировать WebGL2 контекст")
        }
      }

      this.gl = contextManager.getContext()
      this.capabilities = contextManager.getCapabilities()

      if (!this.gl || !this.capabilities) {
        throw new Error("WebGL2 контекст недоступен")
      }

      // Настраиваем обработчики событий
      this.setupEventHandlers()

      // Инициализация специфичная для рендерера
      await this.onInitialize()

      this.isInitialized = true
      this.emit("initialized")

      return true
    } catch (error) {
      console.error(`Ошибка инициализации рендерера ${this.name}:`, error)
      this.emit("error", error)
      return false
    }
  }

  /**
   * Абстрактный метод для инициализации специфичной для рендерера
   */
  protected abstract onInitialize(): Promise<void>

  /**
   * Рендеринг кадра
   */
  public abstract render(deltaTime: number): void

  /**
   * Изменение размера
   */
  public resize(width: number, height: number): void {
    if (!this.canvas || !this.gl) return

    contextManager.resize(width, height)
    this.viewport.width = width
    this.viewport.height = height

    // Пересоздаем фреймбуферы при изменении размера
    for (const [name, fb] of this.framebuffers) {
      if (fb.width === width && fb.height === height) continue
      this.recreateFramebuffer(name, width, height)
    }

    this.onResize(width, height)
    this.emit("resize", { width, height })
  }

  /**
   * Метод для обработки изменения размера в наследниках
   */
  protected onResize(_width: number, _height: number): void {
    // Переопределяется в наследниках при необходимости
  }

  /**
   * Создать текстуру
   */
  protected createTexture(
    name: string,
    width: number,
    height: number,
    options: {
      format?: number
      internalFormat?: number
      type?: number
      data?: ArrayBufferView | null
      minFilter?: number
      magFilter?: number
      wrapS?: number
      wrapT?: number
      generateMipmaps?: boolean
    } = {},
  ): ManagedTexture | null {
    if (!this.gl) return null

    // Удаляем существующую текстуру
    this.deleteTexture(name)

    const texture = this.gl.createTexture()
    if (!texture) return null

    const {
      format = this.gl.RGBA,
      internalFormat = this.gl.RGBA8,
      type = this.gl.UNSIGNED_BYTE,
      data = null,
      minFilter = this.gl.LINEAR,
      magFilter = this.gl.LINEAR,
      wrapS = this.gl.CLAMP_TO_EDGE,
      wrapT = this.gl.CLAMP_TO_EDGE,
      generateMipmaps = false,
    } = options

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

    // Устанавливаем данные текстуры
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, data)

    // Настраиваем параметры
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, minFilter)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, magFilter)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrapS)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrapT)

    // Генерируем мипмапы при необходимости
    if (generateMipmaps && this.isPowerOfTwo(width) && this.isPowerOfTwo(height)) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D)
    }

    const managed: ManagedTexture = {
      texture,
      width,
      height,
      format,
      type,
    }

    this.textures.set(name, managed)
    return managed
  }

  /**
   * Загрузить текстуру из изображения
   */
  protected async loadTexture(
    name: string,
    source: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
  ): Promise<ManagedTexture | null> {
    if (!this.gl) return null

    try {
      let image: TexImageSource

      if (typeof source === "string") {
        // Загружаем изображение по URL
        image = await this.loadImage(source)
      } else {
        image = source
      }

      const texture = this.createTexture(name, image.width, image.height)
      if (!texture) return null

      // Загружаем данные изображения в текстуру
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture)
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image)

      // Генерируем мипмапы для изображений с размерами степени двойки
      if (this.isPowerOfTwo(image.width) && this.isPowerOfTwo(image.height)) {
        this.gl.generateMipmap(this.gl.TEXTURE_2D)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR)
      }

      return texture
    } catch (error) {
      console.error(`Ошибка загрузки текстуры "${name}":`, error)
      return null
    }
  }

  /**
   * Создать фреймбуфер
   */
  protected createFramebuffer(
    name: string,
    width: number,
    height: number,
    options: {
      colorAttachments?: number
      depthAttachment?: boolean
      stencilAttachment?: boolean
      colorFormat?: number
      depthFormat?: number
    } = {},
  ): ManagedFramebuffer | null {
    if (!this.gl) return null

    // Удаляем существующий фреймбуфер
    this.deleteFramebuffer(name)

    const {
      colorAttachments = 1,
      depthAttachment = true,
      colorFormat = this.gl.RGBA8,
      depthFormat = this.gl.DEPTH_COMPONENT24,
    } = options

    const framebuffer = this.gl.createFramebuffer()
    if (!framebuffer) return null

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)

    const colorTextures: ManagedTexture[] = []

    // Создаем цветовые текстуры
    for (let i = 0; i < colorAttachments; i++) {
      const colorTexture = this.createTexture(`${name}_color_${i}`, width, height, { internalFormat: colorFormat })

      if (!colorTexture) {
        this.gl.deleteFramebuffer(framebuffer)
        return null
      }

      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        colorTexture.texture,
        0,
      )

      colorTextures.push(colorTexture)
    }

    // Создаем текстуру глубины
    let depthTexture: ManagedTexture | undefined
    if (depthAttachment) {
      depthTexture =
        this.createTexture(`${name}_depth`, width, height, {
          format: this.gl.DEPTH_COMPONENT,
          internalFormat: depthFormat,
          type: this.gl.UNSIGNED_INT,
        }) ?? undefined

      if (depthTexture) {
        this.gl.framebufferTexture2D(
          this.gl.FRAMEBUFFER,
          this.gl.DEPTH_ATTACHMENT,
          this.gl.TEXTURE_2D,
          depthTexture.texture,
          0,
        )
      }
    }

    // Проверяем статус фреймбуфера
    const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER)
    if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.error(`Фреймбуфер "${name}" не завершен:`, this.getFramebufferStatusString(status))
      this.gl.deleteFramebuffer(framebuffer)
      return null
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)

    const managed: ManagedFramebuffer = {
      framebuffer,
      colorTextures,
      depthTexture,
      width,
      height,
    }

    this.framebuffers.set(name, managed)
    return managed
  }

  /**
   * Использовать шейдерную программу
   */
  protected useProgram(name: string): ShaderProgram | null {
    let program = this.programs.get(name)

    if (!program) {
      program = shaderPool.getProgram(name) ?? undefined
      if (!program) return null
      this.programs.set(name, program)
    }

    if (this.gl && this.currentProgram !== program) {
      this.gl.useProgram(program.program)
      this.currentProgram = program
    }

    return program
  }

  /**
   * Привязать фреймбуфер
   */
  protected bindFramebuffer(name: string | null): void {
    if (!this.gl) return

    if (name === null) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
      this.currentFramebuffer = null
      this.gl.viewport(0, 0, this.viewport.width, this.viewport.height)
    } else {
      const fb = this.framebuffers.get(name)
      if (fb && this.currentFramebuffer !== fb) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb.framebuffer)
        this.currentFramebuffer = fb
        this.gl.viewport(0, 0, fb.width, fb.height)
      }
    }
  }

  /**
   * Очистка ресурсов
   */
  public dispose(): void {
    // Удаляем все текстуры
    for (const [name] of this.textures) {
      this.deleteTexture(name)
    }

    // Удаляем все фреймбуферы
    for (const [name] of this.framebuffers) {
      this.deleteFramebuffer(name)
    }

    // Освобождаем программы
    for (const [name] of this.programs) {
      shaderPool.releaseProgram(name)
    }
    this.programs.clear()

    // Специфичная очистка для рендерера
    this.onDispose()

    this.isInitialized = false
    this.gl = null
    this.canvas = null

    this.removeAllListeners()
  }

  /**
   * Метод для очистки ресурсов в наследниках
   */
  protected onDispose(): void {
    // Переопределяется в наследниках при необходимости
  }

  /**
   * Удалить текстуру
   */
  private deleteTexture(name: string): void {
    const texture = this.textures.get(name)
    if (texture && this.gl) {
      this.gl.deleteTexture(texture.texture)
      this.textures.delete(name)
    }
  }

  /**
   * Удалить фреймбуфер
   */
  private deleteFramebuffer(name: string): void {
    const fb = this.framebuffers.get(name)
    if (fb && this.gl) {
      this.gl.deleteFramebuffer(fb.framebuffer)

      // Удаляем связанные текстуры
      for (let i = 0; i < fb.colorTextures.length; i++) {
        this.deleteTexture(`${name}_color_${i}`)
      }
      if (fb.depthTexture) {
        this.deleteTexture(`${name}_depth`)
      }

      this.framebuffers.delete(name)
    }
  }

  /**
   * Пересоздать фреймбуфер с новым размером
   */
  private recreateFramebuffer(name: string, width: number, height: number): void {
    const oldFb = this.framebuffers.get(name)
    if (!oldFb) return

    const options = {
      colorAttachments: oldFb.colorTextures.length,
      depthAttachment: !!oldFb.depthTexture,
      colorFormat: oldFb.colorTextures[0]?.format,
      depthFormat: oldFb.depthTexture?.format,
    }

    this.createFramebuffer(name, width, height, options)
  }

  /**
   * Настройка обработчиков событий
   */
  private setupEventHandlers(): void {
    contextManager.on("contextLost", this.handleContextLost.bind(this))
    contextManager.on("contextRestored", this.handleContextRestored.bind(this))
  }

  /**
   * Обработчик потери контекста
   */
  private handleContextLost(): void {
    this.gl = null
    this.currentProgram = null
    this.currentFramebuffer = null
    this.emit("contextLost")
  }

  /**
   * Обработчик восстановления контекста
   */
  private async handleContextRestored(): Promise<void> {
    this.gl = contextManager.getContext()

    // Переинициализируем рендерер
    await this.onInitialize()

    this.emit("contextRestored")
  }

  /**
   * Проверка, является ли число степенью двойки
   */
  private isPowerOfTwo(value: number): boolean {
    return (value & (value - 1)) === 0 && value !== 0
  }

  /**
   * Загрузка изображения
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = url
    })
  }

  /**
   * Получить строковое представление статуса фреймбуфера
   */
  private getFramebufferStatusString(status: number): string {
    if (!this.gl) return "Unknown"

    switch (status) {
      case this.gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
        return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT"
      case this.gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
        return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT"
      case this.gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
        return "FRAMEBUFFER_INCOMPLETE_DIMENSIONS"
      case this.gl.FRAMEBUFFER_UNSUPPORTED:
        return "FRAMEBUFFER_UNSUPPORTED"
      case this.gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
        return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE"
      default:
        return `Unknown (${status})`
    }
  }

  /**
   * Получить опцию рендерера
   */
  private getOption<T>(key: string, defaultValue: T): T {
    return (this as any)[key] ?? defaultValue
  }

  /**
   * Установить uniform значения
   */
  protected setUniform(name: string, value: any): void {
    if (!this.gl || !this.currentProgram) return

    const location = shaderPool.getUniformLocation(this.currentProgram, name)
    if (!location) return

    if (typeof value === "number") {
      this.gl.uniform1f(location, value)
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value)
          break
        case 3:
          this.gl.uniform3fv(location, value)
          break
        case 4:
          this.gl.uniform4fv(location, value)
          break
        case 9:
          this.gl.uniformMatrix3fv(location, false, value)
          break
        case 16:
          this.gl.uniformMatrix4fv(location, false, value)
          break
      }
    }
  }

  /**
   * Привязать текстуру к слоту
   */
  protected bindTexture(name: string, slot: number): void {
    if (!this.gl) return

    const texture = this.textures.get(name)
    if (!texture) return

    this.gl.activeTexture(this.gl.TEXTURE0 + slot)
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture)

    if (this.currentProgram) {
      this.setUniform(`u_texture${slot}`, slot)
    }
  }
}

/**
 * Тип для конструктора рендерера
 */
export type RendererConstructor<T extends BaseRenderer = BaseRenderer> = new (options: RendererOptions) => T
