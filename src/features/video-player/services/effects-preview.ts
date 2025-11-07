/**
 * Real-time Effects Preview Service
 *
 * Система предпросмотра эффектов в реальном времени:
 * - WebGL shaders для эффектов
 * - Цепочка обработки эффектов
 * - Кэширование результатов
 * - Оптимизация производительности
 */

import type { TimelineClip } from "@/features/timeline/types/timeline"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "EffectsPreview" })

export interface EffectShader {
  name: string
  vertexShader: string
  fragmentShader: string
  uniforms: Record<
    string,
    {
      type: "float" | "vec2" | "vec3" | "vec4" | "int" | "bool" | "sampler2D"
      value: any
    }
  >
}

export interface EffectPreviewOptions {
  enabled: boolean
  quality: "low" | "medium" | "high"
  realTime: boolean
  cacheResults: boolean
  maxFrameRate: number
}

export interface EffectChain {
  effects: Array<{
    effectId: string
    enabled: boolean
    parameters: Record<string, any>
    intensity: number
  }>
  blendMode: "normal" | "overlay" | "multiply" | "screen" | "add"
  opacity: number
}

export class EffectsPreviewService {
  private static instance: EffectsPreviewService
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGL2RenderingContext | null = null
  private programs = new Map<string, WebGLProgram>()
  private framebuffers: WebGLFramebuffer[] = []
  private textures: WebGLTexture[] = []
  private effectShaders = new Map<string, EffectShader>()
  private animationFrame: number | null = null

  static getInstance(): EffectsPreviewService {
    if (!EffectsPreviewService.instance) {
      EffectsPreviewService.instance = new EffectsPreviewService()
    }
    return EffectsPreviewService.instance
  }

  constructor() {
    this.initializeWebGL()
    this.loadEffectShaders()
  }

  /**
   * Инициализация WebGL2 контекста
   */
  private initializeWebGL(): void {
    try {
      // Skip initialization during SSR
      if (typeof document === "undefined") {
        logger.warn("Effects preview WebGL initialization skipped (SSR)")
        return
      }

      this.canvas = document.createElement("canvas")
      this.gl = this.canvas.getContext("webgl2", {
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      })

      if (!this.gl) {
        throw new Error("WebGL2 not supported")
      }

      logger.info("Effects preview WebGL2 initialized")
    } catch (error) {
      logger.error("Effects preview WebGL initialization failed:", error)
    }
  }

  /**
   * Загрузка шейдеров для эффектов
   */
  private loadEffectShaders(): void {
    // Brightness/Contrast
    this.effectShaders.set("brightness-contrast", {
      name: "Brightness/Contrast",
      vertexShader: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_texture;
        uniform float u_brightness;
        uniform float u_contrast;
        uniform float u_intensity;
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          // Brightness
          color.rgb += u_brightness;
          
          // Contrast
          color.rgb = ((color.rgb - 0.5) * u_contrast) + 0.5;
          
          // Mix with original
          color.rgb = mix(texture(u_texture, v_texCoord).rgb, color.rgb, u_intensity);
          
          fragColor = color;
        }
      `,
      uniforms: {
        u_texture: { type: "sampler2D", value: 0 },
        u_brightness: { type: "float", value: 0.0 },
        u_contrast: { type: "float", value: 1.0 },
        u_intensity: { type: "float", value: 1.0 },
      },
    })

    // Saturation/Hue
    this.effectShaders.set("color-correction", {
      name: "Color Correction",
      vertexShader: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_texture;
        uniform float u_saturation;
        uniform float u_hue;
        uniform vec3 u_colorBalance;
        uniform float u_intensity;
        
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
          
          // Convert to HSV
          vec3 hsv = rgb2hsv(color.rgb);
          
          // Adjust hue
          hsv.x = fract(hsv.x + u_hue / 360.0);
          
          // Adjust saturation
          hsv.y = clamp(hsv.y * u_saturation, 0.0, 1.0);
          
          // Convert back to RGB
          vec3 rgb = hsv2rgb(hsv);
          
          // Color balance
          rgb *= u_colorBalance;
          
          // Mix with original
          rgb = mix(color.rgb, rgb, u_intensity);
          
          fragColor = vec4(rgb, color.a);
        }
      `,
      uniforms: {
        u_texture: { type: "sampler2D", value: 0 },
        u_saturation: { type: "float", value: 1.0 },
        u_hue: { type: "float", value: 0.0 },
        u_colorBalance: { type: "vec3", value: [1.0, 1.0, 1.0] },
        u_intensity: { type: "float", value: 1.0 },
      },
    })

    // Blur
    this.effectShaders.set("blur", {
      name: "Blur",
      vertexShader: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform float u_blurRadius;
        uniform float u_intensity;
        
        void main() {
          vec2 texelSize = 1.0 / u_resolution;
          vec4 color = vec4(0.0);
          float total = 0.0;
          
          // Simple box blur
          float radius = u_blurRadius;
          
          for(float x = -radius; x <= radius; x += 1.0) {
            for(float y = -radius; y <= radius; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize;
              color += texture(u_texture, v_texCoord + offset);
              total += 1.0;
            }
          }
          
          color /= total;
          
          // Mix with original
          vec4 original = texture(u_texture, v_texCoord);
          color = mix(original, color, u_intensity);
          
          fragColor = color;
        }
      `,
      uniforms: {
        u_texture: { type: "sampler2D", value: 0 },
        u_resolution: { type: "vec2", value: [1920, 1080] },
        u_blurRadius: { type: "float", value: 5.0 },
        u_intensity: { type: "float", value: 1.0 },
      },
    })

    // Vintage/Film
    this.effectShaders.set("vintage", {
      name: "Vintage Film",
      vertexShader: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_texture;
        uniform float u_vignette;
        uniform float u_sepia;
        uniform float u_noise;
        uniform float u_time;
        uniform float u_intensity;
        
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        vec3 sepia(vec3 color) {
          float r = color.r * 0.393 + color.g * 0.769 + color.b * 0.189;
          float g = color.r * 0.349 + color.g * 0.686 + color.b * 0.168;
          float b = color.r * 0.272 + color.g * 0.534 + color.b * 0.131;
          return vec3(r, g, b);
        }
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          // Sepia effect
          color.rgb = mix(color.rgb, sepia(color.rgb), u_sepia);
          
          // Vignette
          vec2 center = v_texCoord - 0.5;
          float distance = length(center);
          float vignette = 1.0 - smoothstep(0.3, 0.8, distance * u_vignette);
          color.rgb *= vignette;
          
          // Film noise
          float noise = rand(v_texCoord + u_time) * 0.1 * u_noise;
          color.rgb += noise;
          
          // Mix with original
          vec4 original = texture(u_texture, v_texCoord);
          color = mix(original, color, u_intensity);
          
          fragColor = color;
        }
      `,
      uniforms: {
        u_texture: { type: "sampler2D", value: 0 },
        u_vignette: { type: "float", value: 1.0 },
        u_sepia: { type: "float", value: 0.5 },
        u_noise: { type: "float", value: 0.1 },
        u_time: { type: "float", value: 0.0 },
        u_intensity: { type: "float", value: 1.0 },
      },
    })

    // Glitch
    this.effectShaders.set("glitch", {
      name: "Digital Glitch",
      vertexShader: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentShader: `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_texture;
        uniform float u_time;
        uniform float u_glitchStrength;
        uniform float u_colorSeparation;
        uniform float u_intensity;
        
        float rand(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          vec2 uv = v_texCoord;
          
          // Random horizontal displacement
          float displaceY = floor(uv.y * 300.0) / 300.0;
          float displace = (rand(vec2(displaceY, u_time)) - 0.5) * u_glitchStrength * 0.03;
          uv.x += displace;
          
          // RGB channel separation
          float r = texture(u_texture, uv + vec2(u_colorSeparation * 0.01, 0.0)).r;
          float g = texture(u_texture, uv).g;
          float b = texture(u_texture, uv - vec2(u_colorSeparation * 0.01, 0.0)).b;
          
          vec4 color = vec4(r, g, b, 1.0);
          
          // Add digital noise lines
          float line = step(0.98, rand(vec2(uv.y * u_time)));
          color.rgb = mix(color.rgb, vec3(1.0), line * u_glitchStrength);
          
          // Mix with original
          vec4 original = texture(u_texture, v_texCoord);
          color = mix(original, color, u_intensity);
          
          fragColor = color;
        }
      `,
      uniforms: {
        u_texture: { type: "sampler2D", value: 0 },
        u_time: { type: "float", value: 0.0 },
        u_glitchStrength: { type: "float", value: 1.0 },
        u_colorSeparation: { type: "float", value: 1.0 },
        u_intensity: { type: "float", value: 1.0 },
      },
    })
  }

  /**
   * Компиляция шейдера
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      logger.error("Shader compilation error:", this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Создание шейдерной программы
   */
  private createProgram(effectId: string): WebGLProgram | null {
    if (!this.gl) return null

    const effectShader = this.effectShaders.get(effectId)
    if (!effectShader) return null

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, effectShader.vertexShader)
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, effectShader.fragmentShader)

    if (!vertexShader || !fragmentShader) return null

    const program = this.gl.createProgram()
    if (!program) return null

    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      logger.error("Program linking error:", this.gl.getProgramInfoLog(program))
      this.gl.deleteProgram(program)
      return null
    }

    this.programs.set(effectId, program)
    return program
  }

  /**
   * Применение эффекта к видео кадру
   */
  async applyEffect(
    video: HTMLVideoElement,
    effectId: string,
    parameters: Record<string, any>,
    outputCanvas: HTMLCanvasElement,
  ): Promise<boolean> {
    if (!this.gl || !this.canvas) return false

    try {
      // Получаем или создаем программу
      let program: WebGLProgram | undefined | null = this.programs.get(effectId)
      if (!program) {
        program = this.createProgram(effectId)
        if (!program) return false
      }

      const gl = this.gl

      // Устанавливаем размер canvas
      this.canvas.width = video.videoWidth || 1920
      this.canvas.height = video.videoHeight || 1080
      outputCanvas.width = this.canvas.width
      outputCanvas.height = this.canvas.height

      gl.viewport(0, 0, this.canvas.width, this.canvas.height)

      // Создаем texture из видео
      const texture = gl.createTexture()
      if (!texture) {
        throw new Error("Failed to create texture")
      }
      this.textures.push(texture)

      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

      // Используем программу
      gl.useProgram(program)

      // Создаем геометрию для полноэкранного quad
      const positions = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, -1, 1, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1])

      const positionBuffer = gl.createBuffer()
      if (!positionBuffer) {
        throw new Error("Failed to create position buffer")
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

      // Получаем locations атрибутов
      const positionLocation = gl.getAttribLocation(program, "a_position")
      const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

      // Настраиваем атрибуты
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0)

      gl.enableVertexAttribArray(texCoordLocation)
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8)

      // Устанавливаем uniforms
      const effectShader = this.effectShaders.get(effectId)!

      // Texture uniform
      const textureLocation = gl.getUniformLocation(program, "u_texture")
      gl.uniform1i(textureLocation, 0)

      // Остальные uniforms
      for (const [name, uniform] of Object.entries(effectShader.uniforms)) {
        if (name === "u_texture") continue

        const location = gl.getUniformLocation(program, name)
        if (!location) continue

        const value = parameters[name.substring(2)] ?? uniform.value

        switch (uniform.type) {
          case "float":
            gl.uniform1f(location, value)
            break
          case "vec2":
            gl.uniform2fv(location, value)
            break
          case "vec3":
            gl.uniform3fv(location, value)
            break
          case "vec4":
            gl.uniform4fv(location, value)
            break
          case "int":
          case "bool":
            gl.uniform1i(location, value)
            break
          default:
            // Неподдерживаемый тип uniform
            logger.warn(`Unsupported uniform type: ${uniform.type}`)
            break
        }
      }

      // Специальные uniforms
      if (effectId === "glitch" || effectId === "vintage") {
        const timeLocation = gl.getUniformLocation(program, "u_time")
        if (timeLocation) {
          gl.uniform1f(timeLocation, performance.now() / 1000)
        }
      }

      if (effectId === "blur") {
        const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
        if (resolutionLocation) {
          gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height)
        }
      }

      // Рендерим
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      // Копируем результат в output canvas
      const outputCtx = outputCanvas.getContext("2d")
      if (outputCtx) {
        outputCtx.drawImage(this.canvas, 0, 0)
      }

      // Очищаем ресурсы
      gl.deleteTexture(texture)
      gl.deleteBuffer(positionBuffer)

      return true
    } catch (error) {
      logger.error("Effect application failed:", error)
      return false
    }
  }

  /**
   * Применение цепочки эффектов
   */
  async applyEffectChain(
    video: HTMLVideoElement,
    effectChain: EffectChain,
    outputCanvas: HTMLCanvasElement,
  ): Promise<boolean> {
    if (!this.gl) return false

    try {
      // Создаем промежуточные framebuffers для цепочки
      const enabledEffects = effectChain.effects.filter((e) => e.enabled)

      if (effectChain.effects.length === 0 || enabledEffects.length === 0) {
        // Просто копируем исходное видео
        const ctx = outputCanvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0)
        }
        return true
      }

      // Создаем временный canvas для промежуточных результатов
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = video.videoWidth || 1920
      tempCanvas.height = video.videoHeight || 1080

      // Создаем фреймбуфер для промежуточных результатов
      if (this.gl && enabledEffects.length > 1) {
        const fb = this.gl.createFramebuffer()
        if (fb) {
          this.framebuffers.push(fb)
        }
      }

      let inputElement: HTMLVideoElement | HTMLCanvasElement = video

      // Применяем эффекты последовательно
      for (let i = 0; i < enabledEffects.length; i++) {
        const effect = enabledEffects[i]
        const isLast = i === enabledEffects.length - 1
        const outputElement = isLast ? outputCanvas : tempCanvas

        const success = await this.applyEffect(
          inputElement as HTMLVideoElement,
          effect.effectId,
          {
            ...effect.parameters,
            intensity: effect.intensity,
          },
          outputElement,
        )

        if (!success) {
          logger.error(`Failed to apply effect: ${effect.effectId}`)
          return false
        }

        // Следующий эффект будет использовать результат предыдущего
        if (!isLast) {
          inputElement = tempCanvas
        }
      }

      // Применяем финальные настройки цепочки (opacity, blend mode)
      if (effectChain.opacity < 1.0) {
        const ctx = outputCanvas.getContext("2d")
        if (ctx) {
          ctx.globalAlpha = effectChain.opacity
          ctx.drawImage(outputCanvas, 0, 0)
          ctx.globalAlpha = 1.0
        }
      }

      return true
    } catch (error) {
      logger.error("Effect chain application failed:", error)
      return false
    }
  }

  /**
   * Запуск real-time preview
   */
  startRealTimePreview(
    video: HTMLVideoElement,
    clip: TimelineClip,
    outputCanvas: HTMLCanvasElement,
    options: EffectPreviewOptions = {
      enabled: true,
      quality: "medium",
      realTime: true,
      cacheResults: true,
      maxFrameRate: 30,
    },
  ): void {
    if (!options.enabled || !this.gl) return

    const processFrame = async () => {
      if (!video || video.paused || video.ended) {
        return
      }

      // Создаем effect chain из клипа
      const effectChain: EffectChain = {
        effects:
          clip.effects?.map((effect) => ({
            effectId: effect.effectId,
            enabled: effect.enabled,
            parameters: effect.customParams || {},
            intensity: (effect.customParams as any)?.intensity ?? 1.0,
          })) || [],
        blendMode: "normal",
        opacity: 1.0,
      }

      if (effectChain.effects.length > 0) {
        await this.applyEffectChain(video, effectChain, outputCanvas)
      } else {
        // Нет эффектов - просто копируем видео
        const ctx = outputCanvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height)
        }
      }

      // Планируем следующий кадр с учетом ограничения FPS
      const delay = 1000 / options.maxFrameRate
      setTimeout(() => {
        if (options.realTime) {
          this.animationFrame = requestAnimationFrame(processFrame)
        }
      }, delay)
    }

    // Запускаем обработку
    this.animationFrame = requestAnimationFrame(processFrame)
  }

  /**
   * Остановка real-time preview
   */
  stopRealTimePreview(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  /**
   * Получение списка доступных эффектов
   */
  getAvailableEffects(): Array<{ id: string; name: string }> {
    return Array.from(this.effectShaders.entries()).map(([id, shader]) => ({
      id,
      name: shader.name,
    }))
  }

  /**
   * Получение параметров эффекта
   */
  getEffectParameters(effectId: string): Record<string, any> | null {
    const shader = this.effectShaders.get(effectId)
    if (!shader) return null

    const parameters: Record<string, any> = {}

    for (const [name, uniform] of Object.entries(shader.uniforms)) {
      if (name === "u_texture") continue

      const paramName = name.substring(2) // Remove 'u_' prefix
      parameters[paramName] = uniform.value
    }

    return parameters
  }

  /**
   * Очистка ресурсов
   */
  dispose(): void {
    this.stopRealTimePreview()

    if (this.gl) {
      // Очищаем programs
      for (const program of this.programs.values()) {
        this.gl.deleteProgram(program)
      }
      this.programs.clear()

      // Очищаем framebuffers и textures
      for (const fb of this.framebuffers) {
        this.gl.deleteFramebuffer(fb)
      }
      for (const tex of this.textures) {
        this.gl.deleteTexture(tex)
      }

      this.framebuffers = []
      this.textures = []
    }

    this.canvas = null
    this.gl = null
  }
}

// Lazy initialization to avoid SSR issues
export const getEffectsPreviewService = () => EffectsPreviewService.getInstance()
