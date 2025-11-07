/**
 * Codec Support Service
 *
 * Расширенная поддержка видеокодеков:
 * - Детекция поддерживаемых форматов
 * - Оптимальный выбор кодека
 * - Анализ производительности
 * - Автоматическая оптимизация настроек
 */

export interface CodecProfile {
  name: string
  displayName: string
  mimeType: string
  extensions: string[]
  maxResolution: { width: number; height: number }
  maxFrameRate: number
  supportLevel: "full" | "partial" | "unsupported"
  hardwareAcceleration: boolean
  hdrSupport: boolean
  features: {
    variableBitrate: boolean
    adaptiveStreaming: boolean
    losslessMode: boolean
    alpha: boolean
  }
}

export interface FormatDetectionResult {
  codec: string
  profile: string
  level: string
  container: string
  videoTrack: {
    codec: string
    width: number
    height: number
    frameRate: number
    bitDepth: number
    colorSpace: string
    pixelFormat: string
  }
  audioTracks: Array<{
    codec: string
    channels: number
    sampleRate: number
    bitDepth: number
  }>
  hdr: {
    isHdr: boolean
    format: string
    colorSpace: string
    transferFunction: string
  }
  metadata: {
    duration: number
    bitrate: number
    fileSize: number
    creation: Date | null
  }
}

export interface OptimizationSettings {
  preferHardwareDecoding: boolean
  targetResolution?: { width: number; height: number }
  maxFrameRate?: number
  qualityPreference: "speed" | "quality" | "balanced"
  powerSaving: boolean
}

export class CodecSupportService {
  private static instance: CodecSupportService
  private supportedProfiles = new Map<string, CodecProfile>()
  private performanceCache = new Map<string, number>()

  static getInstance(): CodecSupportService {
    if (!CodecSupportService.instance) {
      CodecSupportService.instance = new CodecSupportService()
    }
    return CodecSupportService.instance
  }

  constructor() {
    this.initializeCodecProfiles()
  }

  /**
   * Инициализация профилей кодеков
   */
  private initializeCodecProfiles(): void {
    const profiles: CodecProfile[] = [
      // H.264 / AVC
      {
        name: "h264",
        displayName: "H.264 / AVC",
        mimeType: 'video/mp4; codecs="avc1.42E01E"',
        extensions: ["mp4", "m4v", "mov"],
        maxResolution: { width: 7680, height: 4320 }, // 8K
        maxFrameRate: 120,
        supportLevel: "full",
        hardwareAcceleration: true,
        hdrSupport: false,
        features: {
          variableBitrate: true,
          adaptiveStreaming: true,
          losslessMode: true,
          alpha: false,
        },
      },

      // H.265 / HEVC
      {
        name: "h265",
        displayName: "H.265 / HEVC",
        mimeType: 'video/mp4; codecs="hev1.1.6.L93.B0"',
        extensions: ["mp4", "m4v", "mov", "mkv"],
        maxResolution: { width: 7680, height: 4320 },
        maxFrameRate: 120,
        supportLevel: "partial", // Зависит от браузера
        hardwareAcceleration: true,
        hdrSupport: true,
        features: {
          variableBitrate: true,
          adaptiveStreaming: true,
          losslessMode: true,
          alpha: false,
        },
      },

      // VP9
      {
        name: "vp9",
        displayName: "VP9",
        mimeType: 'video/webm; codecs="vp9"',
        extensions: ["webm", "mkv"],
        maxResolution: { width: 7680, height: 4320 },
        maxFrameRate: 120,
        supportLevel: "full",
        hardwareAcceleration: true,
        hdrSupport: true,
        features: {
          variableBitrate: true,
          adaptiveStreaming: true,
          losslessMode: true,
          alpha: true,
        },
      },

      // AV1
      {
        name: "av1",
        displayName: "AV1",
        mimeType: 'video/mp4; codecs="av01.0.08M.08"',
        extensions: ["mp4", "webm", "mkv"],
        maxResolution: { width: 7680, height: 4320 },
        maxFrameRate: 120,
        supportLevel: "partial", // Новый кодек
        hardwareAcceleration: false, // Пока ограниченная поддержка
        hdrSupport: true,
        features: {
          variableBitrate: true,
          adaptiveStreaming: true,
          losslessMode: true,
          alpha: true,
        },
      },

      // VP8 (Legacy)
      {
        name: "vp8",
        displayName: "VP8",
        mimeType: 'video/webm; codecs="vp8"',
        extensions: ["webm"],
        maxResolution: { width: 3840, height: 2160 },
        maxFrameRate: 60,
        supportLevel: "full",
        hardwareAcceleration: false,
        hdrSupport: false,
        features: {
          variableBitrate: true,
          adaptiveStreaming: false,
          losslessMode: false,
          alpha: true,
        },
      },

      // Apple ProRes (если доступен)
      {
        name: "prores",
        displayName: "Apple ProRes",
        mimeType: 'video/mp4; codecs="hvc1"',
        extensions: ["mov", "mp4"],
        maxResolution: { width: 7680, height: 4320 },
        maxFrameRate: 120,
        supportLevel: "unsupported", // Веб не поддерживает нативно
        hardwareAcceleration: true,
        hdrSupport: true,
        features: {
          variableBitrate: false,
          adaptiveStreaming: false,
          losslessMode: true,
          alpha: true,
        },
      },
    ]

    // Сохраняем профили
    profiles.forEach((profile) => {
      this.supportedProfiles.set(profile.name, profile)
    })
  }

  /**
   * Проверка поддержки кодека в браузере
   */
  async checkCodecSupport(codecName: string): Promise<"full" | "partial" | "unsupported"> {
    const profile = this.supportedProfiles.get(codecName)
    if (!profile) return "unsupported"

    try {
      // Skip during SSR
      if (typeof document === "undefined") {
        logger.warn("Codec support detection skipped (SSR)")
        return "unsupported"
      }

      // Базовая проверка через canPlayType
      const video = document.createElement("video")
      const basicSupport = video.canPlayType(profile.mimeType)

      if (basicSupport === "probably") {
        // Дополнительная проверка через Media Capabilities API
        if ("mediaCapabilities" in navigator) {
          const mediaCapabilities = navigator.mediaCapabilities as any

          const result = await mediaCapabilities.decodingInfo({
            type: "file",
            video: {
              contentType: profile.mimeType,
              width: 1920,
              height: 1080,
              bitrate: 5000000,
              framerate: 30,
            },
          })

          if (result.supported && result.smooth && result.powerEfficient) {
            return "full"
          }
          if (result.supported) {
            return "partial"
          }
        }

        return "full"
      }
      if (basicSupport === "maybe") {
        return "partial"
      }

      return "unsupported"
    } catch (error) {
      logger.warn(`Codec support check failed for ${codecName}:`, error)
      return "unsupported"
    }
  }

  /**
   * Получение всех поддерживаемых кодеков
   */
  async getSupportedCodecs(): Promise<Map<string, CodecProfile>> {
    const supportedCodecs = new Map<string, CodecProfile>()

    for (const [name, profile] of this.supportedProfiles) {
      const support = await this.checkCodecSupport(name)

      if (support !== "unsupported") {
        supportedCodecs.set(name, {
          ...profile,
          supportLevel: support,
        })
      }
    }

    return supportedCodecs
  }

  /**
   * Детекция формата видео файла
   */
  async detectVideoFormat(videoElement: HTMLVideoElement): Promise<FormatDetectionResult> {
    const result: FormatDetectionResult = {
      codec: "unknown",
      profile: "unknown",
      level: "unknown",
      container: "unknown",
      videoTrack: {
        codec: "unknown",
        width: videoElement.videoWidth || 0,
        height: videoElement.videoHeight || 0,
        frameRate: 30,
        bitDepth: 8,
        colorSpace: "bt709",
        pixelFormat: "yuv420p",
      },
      audioTracks: [],
      hdr: {
        isHdr: false,
        format: "SDR",
        colorSpace: "bt709",
        transferFunction: "gamma",
      },
      metadata: {
        duration: videoElement.duration || 0,
        bitrate: 0,
        fileSize: 0,
        creation: null,
      },
    }

    try {
      // Анализируем source URL для определения контейнера
      const src = videoElement.currentSrc || videoElement.src
      if (src) {
        const url = new URL(src)
        const extension = url.pathname.split(".").pop()?.toLowerCase()

        if (extension) {
          result.container = extension

          // Предположительный кодек на основе расширения
          if (extension === "mp4" || extension === "m4v") {
            result.codec = "h264" // Наиболее вероятный
          } else if (extension === "webm") {
            result.codec = "vp9"
          } else if (extension === "mkv") {
            result.codec = "h265"
          } else if (extension === "mov") {
            result.codec = "h264"
          }
        }
      }

      // Получаем информацию о треках
      const videoElementWithTracks = videoElement as any
      if (
        "videoTracks" in videoElementWithTracks &&
        videoElementWithTracks.videoTracks &&
        videoElementWithTracks.videoTracks.length > 0
      ) {
        const videoTrack = videoElementWithTracks.videoTracks[0]

        if ("getSettings" in videoTrack) {
          const settings = videoTrack.getSettings()

          result.videoTrack.width = settings.width || result.videoTrack.width
          result.videoTrack.height = settings.height || result.videoTrack.height
          result.videoTrack.frameRate = settings.frameRate || 30

          if (settings.colorSpace) {
            result.videoTrack.colorSpace = settings.colorSpace
            result.hdr.colorSpace = settings.colorSpace
          }
        }
      }

      if (videoElementWithTracks.audioTracks) {
        for (let i = 0; i < videoElementWithTracks.audioTracks.length; i++) {
          const audioTrack = videoElementWithTracks.audioTracks[i]

          result.audioTracks.push({
            codec: "unknown",
            channels: 2, // Default stereo
            sampleRate: 48000, // Standard
            bitDepth: 16,
          })
        }
      }

      // Анализ метаданных через Media Session API (если доступен)
      if ("mediaSession" in navigator && navigator.mediaSession.metadata) {
        const metadata = navigator.mediaSession.metadata
        // Дополнительная информация из метаданных
      }

      // Проверяем HDR характеристики
      await this.analyzeHDRCharacteristics(videoElement, result)

      // Измеряем производительность декодирования
      await this.measureDecodingPerformance(videoElement, result.codec)
    } catch (error) {
      logger.error("Video format detection failed:", error)
    }

    return result
  }

  /**
   * Анализ HDR характеристик
   */
  private async analyzeHDRCharacteristics(
    videoElement: HTMLVideoElement,
    result: FormatDetectionResult,
  ): Promise<void> {
    try {
      // Простые эвристики для HDR детекции
      const width = result.videoTrack.width
      const height = result.videoTrack.height

      // 4K+ разрешение может означать HDR
      if (width >= 3840 && height >= 2160) {
        // Дополнительная проверка через filename/URL
        const src = videoElement.currentSrc || videoElement.src
        const filename = src.toLowerCase()

        if (
          filename.includes("hdr") ||
          filename.includes("uhd") ||
          filename.includes("dolby") ||
          filename.includes("vision") ||
          filename.includes("10bit") ||
          filename.includes("bt2020")
        ) {
          result.hdr.isHdr = true
          result.videoTrack.bitDepth = 10
          result.hdr.colorSpace = "bt2020"
          result.hdr.transferFunction = "pq"

          if (filename.includes("dolby") || filename.includes("vision")) {
            result.hdr.format = "Dolby Vision"
          } else if (filename.includes("hdr10+")) {
            result.hdr.format = "HDR10+"
          } else if (filename.includes("hlg")) {
            result.hdr.format = "HLG"
          } else {
            result.hdr.format = "HDR10"
          }
        }
      }

      // Анализ цветового пространства
      if (result.videoTrack.colorSpace.includes("2020") || result.videoTrack.colorSpace.includes("p3")) {
        result.hdr.isHdr = true
      }
    } catch (error) {
      logger.warn("HDR analysis failed:", error)
    }
  }

  /**
   * Измерение производительности декодирования
   */
  private async measureDecodingPerformance(videoElement: HTMLVideoElement, codec: string): Promise<number> {
    try {
      if (!("requestVideoFrameCallback" in videoElement)) {
        return 0
      }

      return await new Promise((resolve) => {
        const startTime = performance.now()
        let frameCount = 0
        const maxFrames = 30 // Измеряем на 30 кадрах

        const frameCallback = () => {
          frameCount++

          if (frameCount < maxFrames) {
            ;(videoElement as any).requestVideoFrameCallback(frameCallback)
          } else {
            const elapsed = performance.now() - startTime
            const fps = (frameCount / elapsed) * 1000

            // Кэшируем результат
            this.performanceCache.set(codec, fps)
            resolve(fps)
          }
        }

        if (videoElement.readyState >= 2) {
          ;(videoElement as any).requestVideoFrameCallback(frameCallback)
        } else {
          resolve(0)
        }
      })
    } catch (error) {
      logger.warn("Performance measurement failed:", error)
      return 0
    }
  }

  /**
   * Получение оптимального кодека для заданных условий
   */
  getOptimalCodec(
    requirements: {
      resolution: { width: number; height: number }
      frameRate: number
      hdrRequired: boolean
      qualityPriority: "speed" | "quality" | "size"
    },
    options: OptimizationSettings,
  ): string | null {
    const supportedCodecs = Array.from(this.supportedProfiles.entries()).filter(
      ([_, profile]) => profile.supportLevel !== "unsupported",
    )

    // Фильтруем по требованиям
    const candidates = supportedCodecs.filter(([_, profile]) => {
      // Проверяем разрешение
      if (
        requirements.resolution.width > profile.maxResolution.width ||
        requirements.resolution.height > profile.maxResolution.height
      ) {
        return false
      }

      // Проверяем frame rate
      if (requirements.frameRate > profile.maxFrameRate) {
        return false
      }

      // Проверяем HDR поддержку
      if (requirements.hdrRequired && !profile.hdrSupport) {
        return false
      }

      return true
    })

    if (candidates.length === 0) return null

    // Сортируем по приоритету
    candidates.sort(([nameA, profileA], [nameB, profileB]) => {
      let scoreA = 0
      let scoreB = 0

      // Аппаратное ускорение
      if (options.preferHardwareDecoding) {
        if (profileA.hardwareAcceleration) scoreA += 10
        if (profileB.hardwareAcceleration) scoreB += 10
      }

      // Качество vs скорость vs размер
      switch (requirements.qualityPriority) {
        case "speed":
          // Предпочитаем H.264 для скорости
          if (nameA === "h264") scoreA += 5
          if (nameB === "h264") scoreB += 5
          break
        case "size":
          // Предпочитаем AV1/H.265 для размера
          if (nameA === "av1") scoreA += 8
          else if (nameA === "h265") scoreA += 6
          if (nameB === "av1") scoreB += 8
          else if (nameB === "h265") scoreB += 6
          break
        case "quality":
          // Предпочитаем новые кодеки для качества
          if (nameA === "av1") scoreA += 8
          else if (nameA === "h265") scoreA += 7
          else if (nameA === "vp9") scoreA += 6
          if (nameB === "av1") scoreB += 8
          else if (nameB === "h265") scoreB += 7
          else if (nameB === "vp9") scoreB += 6
          break
        default:
          // По умолчанию приоритет у баланса
          break
      }

      // Полная поддержка лучше частичной
      if (profileA.supportLevel === "full") scoreA += 3
      if (profileB.supportLevel === "full") scoreB += 3

      // Производительность из кэша
      const perfA = this.performanceCache.get(nameA) || 0
      const perfB = this.performanceCache.get(nameB) || 0
      if (perfA > perfB) scoreA += 2
      else if (perfB > perfA) scoreB += 2

      return scoreB - scoreA
    })

    return candidates[0][0]
  }

  /**
   * Получение рекомендаций по настройкам
   */
  getOptimizationRecommendations(
    formatInfo: FormatDetectionResult,
    deviceCapabilities: any,
  ): {
    recommendedCodec: string
    settings: OptimizationSettings
    warnings: string[]
    optimizations: string[]
  } {
    const warnings: string[] = []
    const optimizations: string[] = []

    // Определяем рекомендуемый кодек
    const recommendedCodec =
      this.getOptimalCodec(
        {
          resolution: {
            width: formatInfo.videoTrack.width,
            height: formatInfo.videoTrack.height,
          },
          frameRate: formatInfo.videoTrack.frameRate,
          hdrRequired: formatInfo.hdr.isHdr,
          qualityPriority: "quality",
        },
        {
          preferHardwareDecoding: true,
          qualityPreference: "balanced",
          powerSaving: false,
        },
      ) || formatInfo.codec

    const settings: OptimizationSettings = {
      preferHardwareDecoding: true,
      qualityPreference: "balanced",
      powerSaving: false,
    }

    // Проверки и рекомендации
    if (formatInfo.videoTrack.width >= 3840) {
      warnings.push("4K видео требует мощного GPU для плавного воспроизведения")
      optimizations.push("Рекомендуется использовать аппаратное декодирование")
      settings.preferHardwareDecoding = true
    }

    if (formatInfo.hdr.isHdr && !deviceCapabilities?.isHDRSupported) {
      warnings.push("HDR контент на SDR дисплее требует tone mapping")
      optimizations.push("Включите tone mapping для корректного отображения")
    }

    if (formatInfo.videoTrack.frameRate > 60) {
      warnings.push("Высокий frame rate может влиять на производительность")
      optimizations.push("Рассмотрите ограничение frame rate до 60fps")
      settings.maxFrameRate = 60
    }

    const profile = this.supportedProfiles.get(formatInfo.codec)
    if (profile && profile.supportLevel === "partial") {
      warnings.push(`Частичная поддержка кодека ${profile.displayName}`)
      optimizations.push(`Рекомендуется конвертация в ${recommendedCodec.toUpperCase()}`)
    }

    return {
      recommendedCodec,
      settings,
      warnings,
      optimizations,
    }
  }

  /**
   * Получение информации о профиле кодека
   */
  getCodecProfile(codecName: string): CodecProfile | null {
    return this.supportedProfiles.get(codecName) || null
  }

  /**
   * Очистка кэша производительности
   */
  clearPerformanceCache(): void {
    this.performanceCache.clear()
  }
}

// Lazy initialization to avoid SSR issues
export const getCodecSupportService = () => CodecSupportService.getInstance()
