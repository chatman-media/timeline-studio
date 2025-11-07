/**
 * WebGL2 рендерер для preview модуля
 * Использует унифицированную WebGL2 библиотеку
 */

import type { AppliedEffect } from "@/features/effects/types/unified-effects"
import type { TimelineSection } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import { BaseRenderer, type RendererOptions, type ShaderSource, shaderPool, vaoManager } from "@/lib/webgl"

const logger = createLogger({ module: "Webgl2PreviewRenderer" })

// Re-export or map to local types if needed
type PreviewEffect = AppliedEffect

// Simple effect representation for internal use
interface Effect {
  id: string
  type: string
  enabled: boolean
  parameters: Record<string, any>
  intensity: number
}

/**
 * Интерфейс для рендеринга превью
 */
export interface PreviewFrame {
  bitmap: ImageBitmap
  width: number
  height: number
  timestamp: number
}

/**
 * WebGL2 рендерер превью
 */
export class WebGL2PreviewRenderer extends BaseRenderer {
  private sourceTexture: WebGLTexture | null = null
  private videoElement: HTMLVideoElement | null = null
  private segments: TimelineSection[] = []
  private currentTime = 0
  private quadVAO: WebGLVertexArrayObject | null = null

  constructor(options: RendererOptions) {
    super({
      ...options,
      name: options.name || "preview-renderer",
    })
  }

  /**
   * Инициализация специфичная для превью
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Компилируем базовые шейдеры
    await this.compileShaders()

    // Создаем VAO для полноэкранного квада
    const copyProgram = shaderPool.getProgram("copy")
    if (copyProgram) {
      this.quadVAO = vaoManager.createQuadVAO(copyProgram)
    }

    // Создаем фреймбуферы для эффектов
    this.createFramebuffer("effect_ping", 1920, 1080)
    this.createFramebuffer("effect_pong", 1920, 1080)
  }

  /**
   * Установить видео источник
   */
  public setVideoSource(video: HTMLVideoElement): void {
    this.videoElement = video

    if (this.gl && video.videoWidth && video.videoHeight) {
      // Пересоздаем текстуру источника
      if (this.sourceTexture) {
        this.gl.deleteTexture(this.sourceTexture)
      }

      this.sourceTexture = this.createVideoTexture(video)

      // Обновляем размеры фреймбуферов
      this.resize(video.videoWidth, video.videoHeight)
    }
  }

  /**
   * Установить сегменты таймлайна
   */
  public setSegments(segments: TimelineSection[]): void {
    this.segments = segments
  }

  /**
   * Установить текущее время
   */
  public setCurrentTime(time: number): void {
    this.currentTime = time
  }

  /**
   * Рендеринг кадра
   */
  public render(_deltaTime: number): void {
    if (!this.gl || !this.videoElement || !this.sourceTexture) return

    // Обновляем текстуру видео
    this.updateVideoTexture(this.sourceTexture, this.videoElement)

    // Получаем активные эффекты для текущего времени
    const activeEffects = this.getActiveEffects()

    if (activeEffects.length === 0) {
      // Без эффектов - просто копируем исходное видео
      this.renderCopy()
    } else {
      // Применяем эффекты последовательно
      this.renderEffects(activeEffects)
    }
  }

  /**
   * Получить текущий кадр как ImageBitmap
   */
  public async captureFrame(): Promise<PreviewFrame | null> {
    if (!this.gl || !this.canvas) return null

    const width = this.canvas.width
    const height = this.canvas.height

    // Читаем пиксели из текущего фреймбуфера
    const pixels = new Uint8Array(width * height * 4)
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)

    // Создаем ImageData
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)

    // Создаем bitmap
    const bitmap = await createImageBitmap(imageData)

    return {
      bitmap,
      width,
      height,
      timestamp: this.currentTime,
    }
  }

  /**
   * Компилировать необходимые шейдеры
   */
  private async compileShaders(): Promise<void> {
    // Базовые шейдеры уже есть в shaderPool
    // Добавляем специфичные для эффектов шейдеры

    // Шейдер для размытия по Гауссу
    const gaussianBlur: ShaderSource = {
      vertex: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }`,
      fragment: `#version 300 es
        precision highp float;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform vec2 u_direction;
        uniform float u_radius;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec2 texelSize = 1.0 / u_resolution;
          vec2 blurVector = u_direction * texelSize * u_radius;
          
          vec4 color = vec4(0.0);
          float totalWeight = 0.0;
          
          // 13-tap Gaussian blur
          float weights[7] = float[](0.0652, 0.1295, 0.1944, 0.2270, 0.1944, 0.1295, 0.0652);
          
          for (int i = -6; i <= 6; i++) {
            vec2 offset = blurVector * float(i);
            int idx = abs(i);
            if (idx < 7) {
              color += texture(u_texture, v_texCoord + offset) * weights[idx];
              totalWeight += weights[idx];
            }
          }
          
          fragColor = color / totalWeight;
        }`,
    }

    shaderPool.getProgram("gaussianBlur", gaussianBlur)

    // Шейдер для цветокоррекции
    const colorCorrection: ShaderSource = {
      vertex: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }`,
      fragment: `#version 300 es
        precision highp float;
        
        uniform sampler2D u_texture;
        uniform float u_brightness;
        uniform float u_contrast;
        uniform float u_saturation;
        uniform float u_hue;
        uniform vec3 u_colorBalance;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          // Brightness
          color.rgb += u_brightness;
          
          // Contrast
          color.rgb = ((color.rgb - 0.5) * (1.0 + u_contrast)) + 0.5;
          
          // Saturation
          vec3 hsv = rgb2hsv(color.rgb);
          hsv.y *= (1.0 + u_saturation);
          color.rgb = hsv2rgb(hsv);
          
          // Hue
          hsv = rgb2hsv(color.rgb);
          hsv.x = mod(hsv.x + u_hue, 1.0);
          color.rgb = hsv2rgb(hsv);
          
          // Color balance
          color.rgb *= u_colorBalance;
          
          fragColor = vec4(color.rgb, color.a);
        }`,
    }

    shaderPool.getProgram("colorCorrection", colorCorrection)

    // Шейдер для fade/dissolve переходов
    const fade: ShaderSource = {
      vertex: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }`,
      fragment: `#version 300 es
        precision highp float;
        
        uniform sampler2D u_texture;
        uniform float u_progress;
        uniform vec4 u_fadeColor;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          fragColor = mix(color, u_fadeColor, u_progress);
        }`,
    }

    shaderPool.getProgram("fade", fade)

    // Шейдер для sepia эффекта
    const sepia: ShaderSource = {
      vertex: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }`,
      fragment: `#version 300 es
        precision highp float;
        
        uniform sampler2D u_texture;
        uniform float u_intensity;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          vec3 sepia = vec3(
            dot(color.rgb, vec3(0.393, 0.769, 0.189)),
            dot(color.rgb, vec3(0.349, 0.686, 0.168)),
            dot(color.rgb, vec3(0.272, 0.534, 0.131))
          );
          
          fragColor = vec4(mix(color.rgb, sepia, u_intensity), color.a);
        }`,
    }

    shaderPool.getProgram("sepia", sepia)

    // Шейдер для grayscale эффекта
    const grayscale: ShaderSource = {
      vertex: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }`,
      fragment: `#version 300 es
        precision highp float;
        
        uniform sampler2D u_texture;
        uniform float u_intensity;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          fragColor = vec4(mix(color.rgb, vec3(gray), u_intensity), color.a);
        }`,
    }

    shaderPool.getProgram("grayscale", grayscale)
  }

  /**
   * Создать текстуру из видео
   */
  private createVideoTexture(video: HTMLVideoElement): WebGLTexture | null {
    if (!this.gl) return null

    const texture = this.gl.createTexture()
    if (!texture) return null

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

    // Настройки для видео текстуры
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

    // Загружаем начальный кадр
    this.updateVideoTexture(texture, video)

    return texture
  }

  /**
   * Обновить текстуру видео
   */
  private updateVideoTexture(texture: WebGLTexture, video: HTMLVideoElement): void {
    if (!this.gl) return

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, video)
  }

  /**
   * Получить активные эффекты для текущего времени
   */
  private getActiveEffects(): Effect[] {
    // TimelineSection doesn't have effects property directly
    // Effects are applied at clip level through timeline system
    // This method is kept for compatibility but returns empty array
    return []
  }

  /**
   * Рендерить копию исходного видео
   */
  private renderCopy(): void {
    if (!this.gl || !this.sourceTexture || !this.quadVAO) return

    // Рендерим в основной фреймбуфер
    this.bindFramebuffer(null)

    // Используем программу копирования
    const program = this.useProgram("copy")
    if (!program) return

    // Привязываем VAO
    vaoManager.bindVAO(this.quadVAO)

    // Привязываем текстуру
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture)
    this.setUniform("u_texture", 0)

    // Рисуем квад
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    vaoManager.unbindVAO()
  }

  /**
   * Рендерить с эффектами
   */
  private renderEffects(effects: Effect[]): void {
    if (!this.gl || !this.sourceTexture || !this.quadVAO) return

    let sourceTexture = this.sourceTexture
    let targetFramebuffer = "effect_ping"

    // Применяем эффекты последовательно
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i]
      const isLast = i === effects.length - 1

      // Выбираем целевой фреймбуфер
      if (isLast) {
        this.bindFramebuffer(null) // Последний эффект рендерим на экран
      } else {
        this.bindFramebuffer(targetFramebuffer)
      }

      // Применяем эффект
      this.renderEffect(effect, sourceTexture)

      // Меняем местами буферы для следующего прохода
      if (!isLast) {
        const fb = this.framebuffers.get(targetFramebuffer)
        if (fb && fb.colorTextures[0]) {
          sourceTexture = fb.colorTextures[0].texture
        }
        targetFramebuffer = targetFramebuffer === "effect_ping" ? "effect_pong" : "effect_ping"
      }
    }
  }

  /**
   * Рендерить один эффект
   */
  private renderEffect(effect: Effect, sourceTexture: WebGLTexture): void {
    if (!this.gl || !this.quadVAO) return

    // Выбираем программу для эффекта
    let programName = "copy" // По умолчанию

    switch (effect.type) {
      // Effects
      case "blur":
      case "gaussian-blur":
        programName = "gaussianBlur"
        break
      case "glow":
        programName = "glow"
        break
      case "shake":
        programName = "shake"
        break
      case "zoom":
        programName = "zoom"
        break
      case "glitch":
        programName = "glitch"
        break

      // Filters
      case "brightness":
      case "contrast":
      case "saturation":
      case "colorCorrection":
        programName = "colorCorrection"
        break
      case "sepia":
        programName = "sepia"
        break
      case "grayscale":
        programName = "grayscale"
        break

      // Transitions
      case "fade":
      case "dissolve":
        programName = "fade"
        break
      case "wipe":
        programName = "wipe"
        break
      case "slide":
        programName = "slide"
        break

      // Fallback
      default:
        logger.warn(`Unknown effect type: ${effect.type}`)
    }

    const program = this.useProgram(programName)
    if (!program) return

    // Привязываем VAO
    vaoManager.bindVAO(this.quadVAO)

    // Привязываем исходную текстуру
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)
    this.setUniform("u_texture", 0)

    // Устанавливаем параметры эффекта
    const params = effect.parameters || {}

    // Общие параметры
    if ("intensity" in effect) {
      this.setUniform("u_intensity", effect.intensity)
    }

    // Специфичные для эффектов параметры
    switch (effect.type) {
      case "blur":
      case "gaussian-blur":
        this.setUniform("u_resolution", [this.viewport.width, this.viewport.height])
        this.setUniform("u_direction", [1, 0]) // Горизонтальное размытие
        this.setUniform("u_radius", params.radius || 5)
        break

      case "brightness":
        this.setUniform("u_brightness", params.value || 0)
        break

      case "contrast":
        this.setUniform("u_contrast", params.value || 0)
        break

      case "saturation":
        this.setUniform("u_saturation", params.value || 0)
        break

      case "colorCorrection":
        this.setUniform("u_brightness", params.brightness || 0)
        this.setUniform("u_contrast", params.contrast || 0)
        this.setUniform("u_saturation", params.saturation || 0)
        this.setUniform("u_hue", params.hue || 0)
        this.setUniform("u_colorBalance", params.colorBalance || [1, 1, 1])
        break

      case "fade":
      case "dissolve":
        this.setUniform("u_progress", params.progress || 0)
        this.setUniform("u_fadeColor", params.color || [0, 0, 0, 1])
        break

      case "wipe":
        this.setUniform("u_progress", params.progress || 0)
        this.setUniform("u_direction", params.direction || [1, 0])
        break

      case "slide":
        this.setUniform("u_progress", params.progress || 0)
        this.setUniform("u_direction", params.direction || [1, 0])
        break
    }

    // Рисуем квад
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    vaoManager.unbindVAO()
  }

  /**
   * Получить возможности GPU
   */
  public getCapabilities() {
    return this.capabilities
  }

  /**
   * Очистка ресурсов
   */
  protected onDispose(): void {
    if (this.gl) {
      if (this.sourceTexture) {
        this.gl.deleteTexture(this.sourceTexture)
      }
    }

    if (this.quadVAO) {
      vaoManager.releaseVAO("quad")
    }

    this.sourceTexture = null
    this.videoElement = null
    this.quadVAO = null
  }
}
