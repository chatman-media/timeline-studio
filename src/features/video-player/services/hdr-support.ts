/**
 * HDR Support Service
 *
 * Предоставляет функциональность для работы с HDR видео контентом:
 * - Определение HDR формата (HDR10, HDR10+, Dolby Vision, HLG)
 * - Парсинг HDR метаданных
 * - Конвертация цветовых пространств
 * - GPU-ускорение для HDR декодинга
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:hdr-support")

export interface HDRMetadata {
  /** Основные характеристики HDR */
  format: "HDR10" | "HDR10+" | "Dolby Vision" | "HLG" | "SDR"
  colorSpace: "bt2020" | "bt709" | "p3" | "rec2020"
  transferFunction: "pq" | "hlg" | "gamma" | "bt709"

  /** Яркостные характеристики */
  maxDisplayMasteringLuminance?: number // nits
  minDisplayMasteringLuminance?: number // nits
  maxContentLightLevel?: number // nits
  maxFrameAverageLightLevel?: number // nits

  /** Цветовые примари */
  whitePoint?: { x: number; y: number }
  redPrimary?: { x: number; y: number }
  greenPrimary?: { x: number; y: number }
  bluePrimary?: { x: number; y: number }

  /** Дополнительная информация */
  bitDepth: number
  bitrate?: number
  isHdr: boolean
}

export interface VideoCodecInfo {
  /** Основная информация о кодеке */
  codec: string
  profile: string
  level: string
  pixelFormat: string

  /** Разрешение и frame rate */
  width: number
  height: number
  frameRate: number
  aspectRatio: string

  /** HDR и цвет */
  hdr: HDRMetadata

  /** Поддержка декодирования */
  hardwareDecoding: boolean
  gpuAcceleration: boolean
  supportedDecoders: string[]
}

export class HDRSupportService {
  private static instance: HDRSupportService
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGL2RenderingContext | null = null
  private isWebGL2Supported = false

  static getInstance(): HDRSupportService {
    if (!HDRSupportService.instance) {
      HDRSupportService.instance = new HDRSupportService()
    }
    return HDRSupportService.instance
  }

  constructor() {
    this.initializeWebGL()
  }

  /**
   * Инициализация WebGL2 для HDR обработки
   */
  private initializeWebGL(): void {
    try {
      // Skip initialization during SSR
      if (typeof document === "undefined") {
        logger.debug("WebGL initialization skipped (SSR)")
        return
      }

      this.canvas = document.createElement("canvas")
      this.gl = this.canvas.getContext("webgl2")

      if (this.gl) {
        this.isWebGL2Supported = true
        // Проверяем поддержку HDR расширений
        const supportedExtensions = this.gl.getSupportedExtensions()
        logger.info(
          "WebGL2 HDR extensions:",
          supportedExtensions?.filter((ext) => ext.includes("color") || ext.includes("hdr") || ext.includes("float")),
        )
      }
    } catch (error) {
      logger.warn("WebGL2 initialization failed", { error })
      this.isWebGL2Supported = false
    }
  }

  /**
   * Определение HDR возможностей устройства
   */
  async detectHDRCapabilities(): Promise<{
    isHDRSupported: boolean
    supportedFormats: string[]
    maxDisplayMasteringLuminance: number
    colorGamut: string
    hdr10Support: boolean
    hdr10PlusSupport: boolean
    dolbyVisionSupport: boolean
    hlgSupport: boolean
  }> {
    const capabilities = {
      isHDRSupported: false,
      supportedFormats: [] as string[],
      maxDisplayMasteringLuminance: 100, // SDR default
      colorGamut: "srgb",
      hdr10Support: false,
      hdr10PlusSupport: false,
      dolbyVisionSupport: false,
      hlgSupport: false,
    }

    try {
      // Проверяем поддержку HDR в браузере
      if ("screen" in window && "colorDepth" in screen) {
        const colorDepth = (screen as any).colorDepth
        if (colorDepth > 24) {
          capabilities.isHDRSupported = true
          capabilities.maxDisplayMasteringLuminance = 400 // Примерное значение
        }
      }

      // Проверяем поддержку Media Capabilities API
      if ("mediaCapabilities" in navigator) {
        const mediaCapabilities = navigator.mediaCapabilities as any

        // Тестируем различные HDR форматы
        const hdrFormats = [
          { codec: "hevc", profile: "main10" },
          { codec: "vp9", profile: "2" },
          { codec: "av01", profile: "main" },
        ]

        for (const format of hdrFormats) {
          try {
            const result = await mediaCapabilities.decodingInfo({
              type: "file",
              video: {
                contentType: `video/${format.codec}; codecs="${format.codec}.${format.profile}"`,
                width: 3840,
                height: 2160,
                bitrate: 20000000,
                framerate: 60,
                transferFunction: "pq",
                colorGamut: "rec2020",
              },
            })

            if (result.supported) {
              capabilities.supportedFormats.push(`${format.codec}-${format.profile}`)

              // Определяем поддержку конкретных HDR форматов
              if (format.codec === "hevc" && format.profile === "main10") {
                capabilities.hdr10Support = true
              }
            }
          } catch (e) {
            // Формат не поддерживается
          }
        }
      }

      // Проверяем цветовую гамму экрана
      if ("screen" in window && "colorGamut" in (screen as any)) {
        capabilities.colorGamut = (screen as any).colorGamut || "srgb"
      } else if (matchMedia) {
        if (matchMedia("(color-gamut: p3)").matches) {
          capabilities.colorGamut = "p3"
        } else if (matchMedia("(color-gamut: rec2020)").matches) {
          capabilities.colorGamut = "rec2020"
        }
      }
    } catch (error) {
      logger.warn("HDR capabilities detection failed", { error })
    }

    return capabilities
  }

  /**
   * Парсинг HDR метаданных из видео элемента
   */
  async parseHDRMetadata(video: HTMLVideoElement): Promise<HDRMetadata> {
    const metadata: HDRMetadata = {
      format: "SDR",
      colorSpace: "bt709",
      transferFunction: "gamma",
      bitDepth: 8,
      isHdr: false,
    }

    try {
      // Получаем информацию о видеодорожках через srcObject
      const srcObject = video.srcObject as MediaStream
      if (srcObject && srcObject.getVideoTracks && srcObject.getVideoTracks().length > 0) {
        const videoTrack = srcObject.getVideoTracks()[0]

        // Пытаемся извлечь HDR информацию из трека
        if ("getSettings" in videoTrack) {
          const settings = (videoTrack as any).getSettings()

          if (settings.colorSpace) {
            metadata.colorSpace = settings.colorSpace
          }

          if (settings.transferFunction) {
            metadata.transferFunction = settings.transferFunction

            // Определяем HDR формат по transfer function
            if (settings.transferFunction === "pq") {
              metadata.format = "HDR10"
              metadata.isHdr = true
            } else if (settings.transferFunction === "hlg") {
              metadata.format = "HLG"
              metadata.isHdr = true
            }
          }

          if (settings.colorGamut === "rec2020" || settings.colorSpace === "bt2020") {
            metadata.colorSpace = "bt2020"
            metadata.isHdr = true
          }
        }
      }

      // Проверяем codec информацию через MediaSource API
      await this.detectCodecHDRSupport(video, metadata)
    } catch (error) {
      logger.warn("HDR metadata parsing failed", { error })
    }

    return metadata
  }

  /**
   * Определение HDR поддержки по codec информации
   */
  private async detectCodecHDRSupport(video: HTMLVideoElement, metadata: HDRMetadata): Promise<void> {
    try {
      // Анализируем src видео для определения кодека
      const src = video.currentSrc || video.src
      if (!src) return

      // Простая эвристика для определения HDR по имени файла или URL
      const filename = src.toLowerCase()

      // Признаки HDR в именовании
      if (filename.includes("hdr") || filename.includes("dolby") || filename.includes("vision")) {
        metadata.isHdr = true

        if (filename.includes("dolby") || filename.includes("vision")) {
          metadata.format = "Dolby Vision"
        } else if (filename.includes("hdr10+")) {
          metadata.format = "HDR10+"
        } else {
          metadata.format = "HDR10"
        }

        metadata.colorSpace = "bt2020"
        metadata.transferFunction = "pq"
        metadata.bitDepth = 10
      }

      // Анализируем разрешение - 4K часто означает HDR
      if (video.videoWidth >= 3840 && video.videoHeight >= 2160) {
        // Высокое разрешение может означать HDR контент
        if (!metadata.isHdr) {
          // Дополнительная проверка через Media Capabilities API
          await this.verifyHDRThroughMediaCapabilities(metadata)
        }
      }
    } catch (error) {
      logger.warn("codec HDR detection failed", { error })
    }
  }

  /**
   * Проверка HDR через Media Capabilities API
   */
  private async verifyHDRThroughMediaCapabilities(metadata: HDRMetadata): Promise<void> {
    try {
      if ("mediaCapabilities" in navigator) {
        const mediaCapabilities = navigator.mediaCapabilities as any

        const hdrConfig = {
          type: "file" as const,
          video: {
            contentType: 'video/mp4; codecs="hev1.2.4.L153.B0"', // HEVC Main10
            width: 3840,
            height: 2160,
            bitrate: 20000000,
            framerate: 60,
            transferFunction: "pq",
            colorGamut: "rec2020",
          },
        }

        const result = await mediaCapabilities.decodingInfo(hdrConfig)

        if (result.supported) {
          metadata.isHdr = true
          metadata.format = "HDR10"
          metadata.colorSpace = "bt2020"
          metadata.transferFunction = "pq"
          metadata.bitDepth = 10
        }
      }
    } catch (error) {
      // Игнорируем ошибки проверки
    }
  }

  /**
   * Получение полной информации о видео кодеке
   */
  async getVideoCodecInfo(video: HTMLVideoElement): Promise<VideoCodecInfo> {
    const hdrMetadata = await this.parseHDRMetadata(video)

    const codecInfo: VideoCodecInfo = {
      codec: "unknown",
      profile: "unknown",
      level: "unknown",
      pixelFormat: "yuv420p",
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
      frameRate: 30,
      aspectRatio: `${video.videoWidth}:${video.videoHeight}`,
      hdr: hdrMetadata,
      hardwareDecoding: false,
      gpuAcceleration: this.isWebGL2Supported,
      supportedDecoders: [],
    }

    // Определяем кодек по MIME типу или источнику
    try {
      if (video.canPlayType) {
        // Тестируем различные кодеки
        const codecs = [
          { name: "h264", mime: 'video/mp4; codecs="avc1.42E01E"' },
          { name: "h265", mime: 'video/mp4; codecs="hev1.1.6.L93.B0"' },
          { name: "vp9", mime: 'video/webm; codecs="vp9"' },
          { name: "av1", mime: 'video/mp4; codecs="av01.0.08M.08"' },
        ]

        for (const codec of codecs) {
          const support = video.canPlayType(codec.mime)
          if (support === "probably" || support === "maybe") {
            codecInfo.supportedDecoders.push(codec.name)
          }
        }
      }

      // Определяем framerate
      if ("requestVideoFrameCallback" in video) {
        // Современный способ получения framerate
        let frameCount = 0
        const startTime = performance.now()

        const frameCallback = () => {
          frameCount++
          if (frameCount < 30) {
            ;(video as any).requestVideoFrameCallback(frameCallback)
          } else {
            const elapsed = performance.now() - startTime
            codecInfo.frameRate = Math.round((frameCount / elapsed) * 1000)
          }
        }

        if (video.readyState >= 2) {
          ;(video as any).requestVideoFrameCallback(frameCallback)
        }
      }
    } catch (error) {
      logger.warn("codec info detection failed", { error })
    }

    return codecInfo
  }

  /**
   * Проверка поддержки GPU декодинга для HDR
   */
  canUseGPUDecoding(codecInfo: VideoCodecInfo): boolean {
    if (!this.isWebGL2Supported) return false

    // HDR требует более мощные GPU возможности
    if (codecInfo.hdr.isHdr) {
      return (
        codecInfo.width <= 3840 && // 4K максимум
        codecInfo.frameRate <= 60 && // 60fps максимум
        codecInfo.supportedDecoders.includes("h265") // HEVC поддержка
      )
    }

    return true
  }

  /**
   * Применение HDR tone mapping через WebGL
   */
  applyHDRToneMapping(
    video: HTMLVideoElement,
    _targetCanvas: HTMLCanvasElement,
    options: {
      targetNits: number
      gammaCorrection: number
      saturation: number
    },
  ): boolean {
    if (!this.gl || !this.isWebGL2Supported) {
      logger.warn("WebGL2 not available for HDR tone mapping")
      return false
    }

    try {
      const gl = this.gl

      // Создаем texture из видео
      const texture = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)

      // Создаем простой tone mapping shader
      const vertexShaderSource = `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `

      const fragmentShaderSource = `#version 300 es
        precision highp float;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        uniform sampler2D u_texture;
        uniform float u_targetNits;
        uniform float u_gammaCorrection;
        uniform float u_saturation;
        
        vec3 tonemap(vec3 color) {
          // Простой Reinhard tone mapping
          return color / (color + vec3(1.0));
        }
        
        void main() {
          vec4 color = texture(u_texture, v_texCoord);
          
          // Применяем tone mapping
          vec3 mapped = tonemap(color.rgb * u_targetNits / 100.0);
          
          // Гамма коррекция
          mapped = pow(mapped, vec3(1.0 / u_gammaCorrection));
          
          // Насыщенность
          float luminance = dot(mapped, vec3(0.299, 0.587, 0.114));
          mapped = mix(vec3(luminance), mapped, u_saturation);
          
          fragColor = vec4(mapped, color.a);
        }
      `

      // Компилируем shaders и создаем программу
      const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
      const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

      if (!vertexShader || !fragmentShader) return false

      const program = gl.createProgram()
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        logger.error("shader program failed to link")
        return false
      }

      gl.useProgram(program)

      // Устанавливаем uniforms
      gl.uniform1f(gl.getUniformLocation(program, "u_targetNits"), options.targetNits)
      gl.uniform1f(gl.getUniformLocation(program, "u_gammaCorrection"), options.gammaCorrection)
      gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), options.saturation)

      // Рендерим
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      return true
    } catch (error) {
      logger.error("tone mapping failed", { error })
      return false
    }
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      logger.error("shader compilation error", { info: gl.getShaderInfoLog(shader) })
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas = null
    }
    if (this.gl) {
      this.gl = null
    }
  }
}

// Lazy initialization to avoid SSR issues
export const getHDRSupportService = () => HDRSupportService.getInstance()
