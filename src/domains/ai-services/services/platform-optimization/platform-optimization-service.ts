/**
 * Сервис для адаптации видео под различные социальные платформы
 * Автоматически оптимизирует разрешение, соотношение сторон, битрейт и метаданные
 */

import { invoke } from "@tauri-apps/api/core"

/**
 * Поддерживаемые платформы
 */
export type SupportedPlatform =
  | "youtube"
  | "tiktok"
  | "instagram_feed"
  | "instagram_stories"
  | "instagram_reels"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "vimeo"
  | "twitch"

/**
 * Категории контента для оптимизации
 */
export type ContentCategory =
  | "shorts" // Короткие вертикальные видео
  | "standard" // Обычные горизонтальные видео
  | "live" // Прямые трансляции
  | "stories" // Истории
  | "ads" // Реклама

/**
 * Настройки платформы
 */
export interface PlatformSpecs {
  name: string
  displayName: string
  aspectRatio: string
  maxDuration: number // в секундах
  minDuration: number
  maxFileSize: number // в MB
  recommendedResolution: {
    width: number
    height: number
  }
  supportedFormats: string[]
  maxBitrate: number // в kbps
  audioCodec: string
  videoCodec: string
  framerate: number
  description: string
}

/**
 * Параметры оптимизации
 */
export interface OptimizationParams {
  inputVideoPath: string
  platform: SupportedPlatform
  contentCategory: ContentCategory
  outputDirectory: string
  customSettings?: {
    targetResolution?: { width: number; height: number }
    targetBitrate?: number
    targetFramerate?: number
    cropToFit?: boolean
    addPlatformBranding?: boolean
    generateThumbnail?: boolean
  }
}

/**
 * Результат оптимизации
 */
export interface PlatformOptimizationResult {
  platform: SupportedPlatform
  originalFile: string
  optimizedFile: string
  thumbnail?: string
  metadata: {
    originalSize: number
    optimizedSize: number
    compressionRatio: number
    originalResolution: { width: number; height: number }
    optimizedResolution: { width: number; height: number }
    originalDuration: number
    optimizedDuration: number
    originalBitrate: number
    optimizedBitrate: number
  }
  platformCompliance: {
    durationCompliant: boolean
    sizeCompliant: boolean
    formatCompliant: boolean
    resolutionCompliant: boolean
    warnings: string[]
  }
  suggestions: string[]
}

/**
 * Статистика пакетной оптимизации
 */
export interface BatchOptimizationStats {
  totalVideos: number
  successfulOptimizations: number
  failedOptimizations: number
  totalOriginalSize: number
  totalOptimizedSize: number
  averageCompressionRatio: number
  platformDistribution: Record<SupportedPlatform, number>
}

/**
 * Сервис для оптимизации видео под платформы
 */
export class PlatformOptimizationService {
  private static instance: PlatformOptimizationService

  // Спецификации платформ
  private readonly platformSpecs: Record<SupportedPlatform, PlatformSpecs> = {
    youtube: {
      name: "youtube",
      displayName: "YouTube",
      aspectRatio: "16:9",
      maxDuration: 43200, // 12 часов
      minDuration: 1,
      maxFileSize: 256000, // 256 GB
      recommendedResolution: { width: 1920, height: 1080 },
      supportedFormats: ["mp4", "mov", "avi", "wmv", "flv", "webm"],
      maxBitrate: 68000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 60,
      description: "Оптимизация для YouTube с высоким качеством",
    },
    tiktok: {
      name: "tiktok",
      displayName: "TikTok",
      aspectRatio: "9:16",
      maxDuration: 600, // 10 минут
      minDuration: 3,
      maxFileSize: 287, // 287 MB
      recommendedResolution: { width: 1080, height: 1920 },
      supportedFormats: ["mp4", "mov"],
      maxBitrate: 17000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 30,
      description: "Вертикальные видео для TikTok",
    },
    instagram_feed: {
      name: "instagram_feed",
      displayName: "Instagram Лента",
      aspectRatio: "1:1",
      maxDuration: 60,
      minDuration: 3,
      maxFileSize: 100,
      recommendedResolution: { width: 1080, height: 1080 },
      supportedFormats: ["mp4", "mov"],
      maxBitrate: 3500,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 30,
      description: "Квадратные видео для ленты Instagram",
    },
    instagram_stories: {
      name: "instagram_stories",
      displayName: "Instagram Истории",
      aspectRatio: "9:16",
      maxDuration: 15,
      minDuration: 1,
      maxFileSize: 100,
      recommendedResolution: { width: 1080, height: 1920 },
      supportedFormats: ["mp4", "mov"],
      maxBitrate: 3500,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 30,
      description: "Вертикальные истории для Instagram",
    },
    instagram_reels: {
      name: "instagram_reels",
      displayName: "Instagram Reels",
      aspectRatio: "9:16",
      maxDuration: 90,
      minDuration: 3,
      maxFileSize: 100,
      recommendedResolution: { width: 1080, height: 1920 },
      supportedFormats: ["mp4", "mov"],
      maxBitrate: 3500,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 30,
      description: "Короткие вертикальные видео для Instagram Reels",
    },
    facebook: {
      name: "facebook",
      displayName: "Facebook",
      aspectRatio: "16:9",
      maxDuration: 14400, // 4 часа
      minDuration: 1,
      maxFileSize: 10000, // 10 GB
      recommendedResolution: { width: 1920, height: 1080 },
      supportedFormats: ["mp4", "mov"],
      maxBitrate: 8000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 30,
      description: "Оптимизация для Facebook",
    },
    twitter: {
      name: "twitter",
      displayName: "Twitter",
      aspectRatio: "16:9",
      maxDuration: 140,
      minDuration: 1,
      maxFileSize: 512,
      recommendedResolution: { width: 1280, height: 720 },
      supportedFormats: ["mp4", "mov"],
      maxBitrate: 25000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 40,
      description: "Короткие видео для Twitter",
    },
    linkedin: {
      name: "linkedin",
      displayName: "LinkedIn",
      aspectRatio: "16:9",
      maxDuration: 600, // 10 минут
      minDuration: 3,
      maxFileSize: 5000, // 5 GB
      recommendedResolution: { width: 1920, height: 1080 },
      supportedFormats: ["mp4", "mov", "avi"],
      maxBitrate: 10000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 30,
      description: "Профессиональные видео для LinkedIn",
    },
    vimeo: {
      name: "vimeo",
      displayName: "Vimeo",
      aspectRatio: "16:9",
      maxDuration: 43200, // 12 часов
      minDuration: 1,
      maxFileSize: 500000, // 500 GB (Pro)
      recommendedResolution: { width: 1920, height: 1080 },
      supportedFormats: ["mp4", "mov", "avi", "wmv", "flv"],
      maxBitrate: 50000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 60,
      description: "Высококачественные видео для Vimeo",
    },
    twitch: {
      name: "twitch",
      displayName: "Twitch",
      aspectRatio: "16:9",
      maxDuration: 43200, // 12 часов
      minDuration: 1,
      maxFileSize: 10000, // 10 GB
      recommendedResolution: { width: 1920, height: 1080 },
      supportedFormats: ["mp4", "mov", "avi", "flv"],
      maxBitrate: 6000,
      audioCodec: "aac",
      videoCodec: "h264",
      framerate: 60,
      description: "Стримы и клипы для Twitch",
    },
  }

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): PlatformOptimizationService {
    if (!PlatformOptimizationService.instance) {
      PlatformOptimizationService.instance = new PlatformOptimizationService()
    }
    return PlatformOptimizationService.instance
  }

  /**
   * Получить спецификации платформы
   */
  public getPlatformSpecs(platform: SupportedPlatform): PlatformSpecs {
    return this.platformSpecs[platform]
  }

  /**
   * Получить все доступные платформы
   */
  public getAllPlatforms(): PlatformSpecs[] {
    return Object.values(this.platformSpecs)
  }

  /**
   * Получить рекомендованные платформы для контента
   */
  public getRecommendedPlatforms(
    contentCategory: ContentCategory,
    _aspectRatio?: string,
    duration?: number,
  ): SupportedPlatform[] {
    const recommendations: SupportedPlatform[] = []

    switch (contentCategory) {
      case "shorts":
        recommendations.push("tiktok", "instagram_reels", "instagram_stories")
        break
      case "standard":
        recommendations.push("youtube", "facebook", "vimeo", "linkedin")
        break
      case "live":
        recommendations.push("youtube", "facebook", "twitch")
        break
      case "stories":
        recommendations.push("instagram_stories", "instagram_reels")
        break
      case "ads":
        recommendations.push("youtube", "facebook", "instagram_feed", "linkedin")
        break
      default:
        // For unknown categories, recommend general platforms
        recommendations.push("youtube", "vimeo", "facebook")
        break
    }

    // Фильтрация по продолжительности
    if (duration) {
      return recommendations.filter((platform) => {
        const specs = this.platformSpecs[platform]
        return duration >= specs.minDuration && duration <= specs.maxDuration
      })
    }

    return recommendations
  }

  /**
   * Оптимизировать видео для платформы
   */
  public async optimizeForPlatform(params: OptimizationParams): Promise<PlatformOptimizationResult> {
    const specs = this.platformSpecs[params.platform]

    // Получаем метаданные исходного видео
    const originalMetadata = (await invoke("ffmpeg_get_metadata", {
      filePath: params.inputVideoPath,
    })) as any

    // Определяем параметры оптимизации
    const targetResolution = params.customSettings?.targetResolution || specs.recommendedResolution
    const targetBitrate = params.customSettings?.targetBitrate || specs.maxBitrate
    const targetFramerate = params.customSettings?.targetFramerate || specs.framerate

    // Генерируем имя выходного файла
    const outputFileName = `${params.platform}_optimized_${Date.now()}.mp4`
    const outputPath = `${params.outputDirectory}/${outputFileName}`

    try {
      // Выполняем оптимизацию через FFmpeg
      const optimizationResult = await invoke("ffmpeg_optimize_for_platform", {
        inputPath: params.inputVideoPath,
        outputPath: outputPath,
        targetWidth: targetResolution.width,
        targetHeight: targetResolution.height,
        targetBitrate: targetBitrate,
        targetFramerate: targetFramerate,
        audioCodec: specs.audioCodec,
        videoCodec: specs.videoCodec,
        cropToFit: params.customSettings?.cropToFit || false,
      })

      // Получаем метаданные оптимизированного видео
      const optimizedMetadata = (await invoke("ffmpeg_get_metadata", {
        filePath: outputPath,
      })) as any

      // Генерируем превью если требуется
      let thumbnailPath: string | undefined
      if (params.customSettings?.generateThumbnail) {
        thumbnailPath = await invoke("ffmpeg_generate_thumbnail", {
          videoPath: outputPath,
          outputPath: `${params.outputDirectory}/thumb_${params.platform}_${Date.now()}.jpg`,
          timestamp: originalMetadata.duration / 2, // Середина видео
        })
      }

      // Проверяем соответствие платформе
      const compliance = this.checkPlatformCompliance(optimizedMetadata, specs)

      // Генерируем предложения по улучшению
      const suggestions = this.generateOptimizationSuggestions(originalMetadata, optimizedMetadata, specs, params)

      return {
        platform: params.platform,
        originalFile: params.inputVideoPath,
        optimizedFile: outputPath,
        thumbnail: thumbnailPath,
        metadata: {
          originalSize: originalMetadata.fileSize || 0,
          optimizedSize: optimizedMetadata.fileSize || 0,
          compressionRatio: (originalMetadata.fileSize || 0) / (optimizedMetadata.fileSize || 1),
          originalResolution: {
            width: originalMetadata.width || 0,
            height: originalMetadata.height || 0,
          },
          optimizedResolution: {
            width: optimizedMetadata.width || 0,
            height: optimizedMetadata.height || 0,
          },
          originalDuration: originalMetadata.duration || 0,
          optimizedDuration: optimizedMetadata.duration || 0,
          originalBitrate: originalMetadata.bitRate || 0,
          optimizedBitrate: optimizedMetadata.bitRate || 0,
        },
        platformCompliance: compliance,
        suggestions,
      }
    } catch (error) {
      console.error(`Ошибка оптимизации для ${params.platform}:`, error)
      throw new Error(`Не удалось оптимизировать видео для ${specs.displayName}: ${String(error)}`)
    }
  }

  /**
   * Пакетная оптимизация для нескольких платформ
   */
  public async batchOptimizeForPlatforms(
    inputVideoPath: string,
    platforms: SupportedPlatform[],
    outputDirectory: string,
    contentCategory: ContentCategory = "standard",
  ): Promise<{
    results: PlatformOptimizationResult[]
    stats: BatchOptimizationStats
  }> {
    const results: PlatformOptimizationResult[] = []
    const platformDistribution: Record<SupportedPlatform, number> = {} as any

    let totalOriginalSize = 0
    let totalOptimizedSize = 0
    let successfulOptimizations = 0
    let failedOptimizations = 0

    for (const platform of platforms) {
      try {
        const result = await this.optimizeForPlatform({
          inputVideoPath,
          platform,
          contentCategory,
          outputDirectory,
          customSettings: {
            generateThumbnail: true,
          },
        })

        results.push(result)
        successfulOptimizations++
        totalOriginalSize += result.metadata.originalSize
        totalOptimizedSize += result.metadata.optimizedSize
        platformDistribution[platform] = (platformDistribution[platform] || 0) + 1
      } catch (error) {
        console.error(`Ошибка оптимизации для ${platform}:`, error)
        failedOptimizations++
      }
    }

    const stats: BatchOptimizationStats = {
      totalVideos: platforms.length,
      successfulOptimizations,
      failedOptimizations,
      totalOriginalSize,
      totalOptimizedSize,
      averageCompressionRatio: totalOriginalSize / totalOptimizedSize || 1,
      platformDistribution,
    }

    return { results, stats }
  }

  /**
   * Анализ видео и рекомендации платформ
   */
  public async analyzeVideoForPlatforms(videoPath: string): Promise<{
    videoAnalysis: any
    recommendedPlatforms: Array<{
      platform: SupportedPlatform
      suitabilityScore: number
      reasons: string[]
      requiredChanges: string[]
    }>
  }> {
    // Анализируем видео
    const analysis = await invoke("ffmpeg_quick_analysis", {
      filePath: videoPath,
    })

    const metadata = (await invoke("ffmpeg_get_metadata", {
      filePath: videoPath,
    })) as any

    // Оцениваем совместимость с каждой платформой
    const recommendations = Object.entries(this.platformSpecs)
      .map(([platform, specs]) => {
        const score = this.calculateSuitabilityScore(metadata, specs)
        const reasons = this.getSuitabilityReasons(metadata, specs)
        const changes = this.getRequiredChanges(metadata, specs)

        return {
          platform: platform as SupportedPlatform,
          suitabilityScore: score,
          reasons,
          requiredChanges: changes,
        }
      })
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)

    return {
      videoAnalysis: { ...(analysis as any), metadata },
      recommendedPlatforms: recommendations,
    }
  }

  /**
   * Проверка соответствия платформе
   */
  private checkPlatformCompliance(metadata: any, specs: PlatformSpecs) {
    const warnings: string[] = []
    let durationCompliant = true
    let sizeCompliant = true
    const formatCompliant = true
    const resolutionCompliant = true

    // Проверка длительности
    if (metadata.duration < specs.minDuration) {
      durationCompliant = false
      warnings.push(`Видео слишком короткое (мин: ${specs.minDuration}с)`)
    }
    if (metadata.duration > specs.maxDuration) {
      durationCompliant = false
      warnings.push(`Видео слишком длинное (макс: ${specs.maxDuration}с)`)
    }

    // Проверка размера файла
    const fileSizeMB = (metadata.fileSize || 0) / (1024 * 1024)
    if (fileSizeMB > specs.maxFileSize) {
      sizeCompliant = false
      warnings.push(`Файл слишком большой (макс: ${specs.maxFileSize}MB)`)
    }

    // Проверка битрейта
    if ((metadata.bitRate || 0) > specs.maxBitrate) {
      warnings.push(`Битрейт превышает рекомендованный (макс: ${specs.maxBitrate}kbps)`)
    }

    return {
      durationCompliant,
      sizeCompliant,
      formatCompliant,
      resolutionCompliant,
      warnings,
    }
  }

  /**
   * Вычисление оценки совместимости
   */
  private calculateSuitabilityScore(metadata: any, specs: PlatformSpecs): number {
    let score = 100

    // Штраф за несоответствие длительности
    if (metadata.duration < specs.minDuration || metadata.duration > specs.maxDuration) {
      score -= 30
    }

    // Штраф за размер файла
    const fileSizeMB = (metadata.fileSize || 0) / (1024 * 1024)
    if (fileSizeMB > specs.maxFileSize) {
      score -= 25
    }

    // Штраф за разрешение
    const aspectRatio = (metadata.width || 1) / (metadata.height || 1)
    const targetAspectRatio = specs.recommendedResolution.width / specs.recommendedResolution.height
    const aspectDiff = Math.abs(aspectRatio - targetAspectRatio)
    score -= aspectDiff * 20

    // Штраф за битрейт
    if ((metadata.bitRate || 0) > specs.maxBitrate) {
      score -= 15
    }

    return Math.max(0, score)
  }

  /**
   * Получение причин совместимости
   */
  private getSuitabilityReasons(metadata: any, specs: PlatformSpecs): string[] {
    const reasons: string[] = []

    if (metadata.duration >= specs.minDuration && metadata.duration <= specs.maxDuration) {
      reasons.push("Подходящая длительность видео")
    }

    const fileSizeMB = (metadata.fileSize || 0) / (1024 * 1024)
    if (fileSizeMB <= specs.maxFileSize) {
      reasons.push("Размер файла в пределах лимита")
    }

    if ((metadata.bitRate || 0) <= specs.maxBitrate) {
      reasons.push("Битрейт соответствует рекомендациям")
    }

    return reasons
  }

  /**
   * Получение необходимых изменений
   */
  private getRequiredChanges(metadata: any, specs: PlatformSpecs): string[] {
    const changes: string[] = []

    if (metadata.duration < specs.minDuration) {
      changes.push(`Увеличить длительность до ${specs.minDuration}с`)
    }
    if (metadata.duration > specs.maxDuration) {
      changes.push(`Сократить до ${specs.maxDuration}с`)
    }

    const fileSizeMB = (metadata.fileSize || 0) / (1024 * 1024)
    if (fileSizeMB > specs.maxFileSize) {
      changes.push(`Уменьшить размер файла до ${specs.maxFileSize}MB`)
    }

    const currentAspectRatio = (metadata.width || 1) / (metadata.height || 1)
    const targetAspectRatio = specs.recommendedResolution.width / specs.recommendedResolution.height
    if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.1) {
      changes.push(`Изменить соотношение сторон на ${specs.aspectRatio}`)
    }

    if ((metadata.bitRate || 0) > specs.maxBitrate) {
      changes.push(`Снизить битрейт до ${specs.maxBitrate}kbps`)
    }

    return changes
  }

  /**
   * Генерация предложений по оптимизации
   */
  private generateOptimizationSuggestions(
    original: any,
    optimized: any,
    specs: PlatformSpecs,
    params: OptimizationParams,
  ): string[] {
    const suggestions: string[] = []

    // Проверяем эффективность сжатия
    const compressionRatio = (original.fileSize || 0) / (optimized.fileSize || 1)
    if (compressionRatio < 1.5) {
      suggestions.push("Попробуйте увеличить сжатие для уменьшения размера файла")
    }

    // Проверяем качество
    if ((optimized.bitRate || 0) < specs.maxBitrate * 0.5) {
      suggestions.push("Можно увеличить битрейт для лучшего качества")
    }

    // Проверяем соотношение сторон
    const currentAspectRatio = (optimized.width || 1) / (optimized.height || 1)
    const targetAspectRatio = specs.recommendedResolution.width / specs.recommendedResolution.height
    if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.1) {
      suggestions.push(`Рекомендуется соотношение сторон ${specs.aspectRatio} для этой платформы`)
    }

    // Предложения по контенту
    if (params.platform === "tiktok" || params.platform === "instagram_reels") {
      suggestions.push("Добавьте субтитры для лучшего восприятия")
      suggestions.push("Используйте яркие цвета и динамичный монтаж")
    }

    if (params.platform === "linkedin") {
      suggestions.push("Добавьте профессиональные титры и брендинг")
    }

    return suggestions
  }
}
