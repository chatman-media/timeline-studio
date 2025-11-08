/**
 * Platform Adapter
 * Адаптер для преобразования контента под конкретную платформу
 */

// REMOVED: import { UnifiedAIService } from "@/domains/ai-core" // ai-core module deleted - use backend AI proxy instead
import { UnifiedContentAnalysis } from "@/domains/ai-services/types/unified-analysis"
import {
  AdaptedContent,
  AspectRatio,
  AudioSpecs,
  CaptionPosition,
  Platform,
  PlatformResolution,
  VideoSpecs,
} from "@/domains/shared/types/ai-tools/platform-adaptation"
import {
  AdaptationStrategy,
  AudioAdaptationStrategy,
  GraphicsAdaptationStrategy,
  TextAdaptationStrategy,
  TimingAdaptationStrategy,
  VideoAdaptationStrategy,
} from "../types"

export class PlatformAdapter {
  private aiService: any /* UnifiedAIService from deleted ai-core */
  private isInitialized = false

  constructor() {
    this.aiService = UnifiedAIService.getInstance()
  }

  async initialize(): Promise<void> {
    this.isInitialized = true
  }

  /**
   * Адаптировать контент для платформы
   */
  async adapt(
    analysis: UnifiedContentAnalysis,
    platform: Platform,
    strategy: AdaptationStrategy,
  ): Promise<AdaptedContent> {
    if (!this.isInitialized) {
      throw new Error("Platform Adapter not initialized")
    }

    // Адаптируем видео
    const videoSpecs = await this.adaptVideo(analysis, platform.specifications.videoSpecs, strategy.videoStrategy)

    // Адаптируем аудио
    const audioSpecs = await this.adaptAudio(analysis, platform.specifications.audioSpecs, strategy.audioStrategy)

    // Генерируем текстовый контент
    const textContent = await this.generateTextContent(analysis, platform, strategy.textStrategy)

    // Добавляем графические элементы
    const graphics = await this.addGraphics(analysis, platform, strategy.graphicsStrategy)

    // Применяем тайминг
    const timing = await this.applyTiming(analysis, platform, strategy.timingStrategy)

    // Формируем результат
    const adaptedContent: AdaptedContent = {
      id: `adapted-${Date.now()}`,
      platform: platform.id,
      originalContent: {
        sceneIds: analysis.scenes.map((s) => s.id),
        duration: analysis.mediaFile.duration,
      },
      adaptations: {
        video: {
          resolution: videoSpecs.resolution[0],
          aspectRatio: videoSpecs.aspectRatio[0],
          frameRate: videoSpecs.frameRate[0],
          codec: videoSpecs.codec[0],
          bitrate: videoSpecs.bitrate.recommended,
        },
        audio: {
          volume: [],
          compression: {
            threshold: -18,
            ratio: 4,
            attack: 10,
            release: 100,
          },
          normalization: true,
          enhancements: [],
        },
        text: {
          title: {
            text: textContent.title || "",
            language: "en",
            characterCount: textContent.title?.length || 0,
          },
          description: {
            text: textContent.description || "",
            language: "en",
            characterCount: textContent.description?.length || 0,
          },
          captions: {
            enabled: false,
            style: {
              font: "Arial",
              size: 16,
              color: "#ffffff",
              background: "#000000",
              position: CaptionPosition.BOTTOM,
            },
            language: "en",
            content: [],
          },
          hashtags: textContent.hashtags || [],
          mentions: textContent.mentions || [],
        },
        graphics: {
          overlays: [],
        },
        timing: {
          cuts: [],
          speed: [],
        },
      },
      platformId: platform.id,
      platformName: platform.name,
      metadata: {
        createdAt: new Date(),
        language: "en",
        title: textContent.title,
        description: textContent.description,
        hashtags: textContent.hashtags,
        tags: this.extractTags(analysis),
        mentions: textContent.mentions || [],
      },
      duration: timing.duration,
      fileSize: this.estimateFileSize(videoSpecs, audioSpecs, timing.duration),
      quality: {
        video: videoSpecs.bitrate.recommended,
        audio: audioSpecs.bitrate.recommended,
        overall: 0.85, // Будет пересчитано позже
      },
      format: {
        container: "mp4",
        videoCodec: videoSpecs.codec[0],
        audioCodec: audioSpecs.codec[0],
      },
      optimizations: {
        compressed: true,
        enhanced: (strategy.videoStrategy.enhancementFilters?.length ?? 0) > 0,
        aiProcessed: true,
      },
      processingDetails: {
        adaptationDate: new Date(),
        strategy: strategy,
        hooks: graphics.hooks,
        callToActions: textContent.callToActions,
        brandingApplied: graphics.brandingApplied,
      },
    }

    return adaptedContent
  }

  /**
   * Адаптировать видео параметры
   */
  private async adaptVideo(
    analysis: UnifiedContentAnalysis,
    targetSpecs: VideoSpecs,
    strategy: VideoAdaptationStrategy,
  ): Promise<VideoSpecs> {
    // Выбираем оптимальное разрешение
    const resolution: PlatformResolution = strategy.targetResolution
      ? { ...strategy.targetResolution, preferred: true }
      : targetSpecs.resolution[0]

    // Выбираем частоту кадров
    const frameRate = this.selectFrameRate(analysis.technicalSpecs?.frameRate, targetSpecs.frameRate)

    // Выбираем кодек
    const codec = this.selectCodec(analysis.technicalSpecs?.codec, targetSpecs.codec)

    // Рассчитываем битрейт
    const bitrate = this.calculateBitrate(resolution, frameRate, targetSpecs.bitrate, strategy.qualityPreset)

    // Конвертируем строку aspectRatio в объект
    const aspectRatio = this.parseAspectRatio(strategy.targetAspectRatio, targetSpecs.aspectRatio)

    return {
      resolution: [resolution],
      aspectRatio: [aspectRatio],
      frameRate: [frameRate],
      codec: [codec],
      bitrate,
    }
  }

  /**
   * Адаптировать аудио параметры
   */
  private async adaptAudio(
    _analysis: UnifiedContentAnalysis,
    targetSpecs: AudioSpecs,
    strategy: AudioAdaptationStrategy,
  ): Promise<AudioSpecs> {
    // Выбираем количество каналов
    const channels = targetSpecs.channels.includes(2) ? 2 : targetSpecs.channels[0]

    // Выбираем частоту дискретизации
    const sampleRate = targetSpecs.sampleRate[0]

    // Выбираем кодек
    const codec = targetSpecs.codec[0]

    // Рассчитываем битрейт
    const bitrate = strategy.enhanceVoice
      ? { ...targetSpecs.bitrate, recommended: targetSpecs.bitrate.max }
      : targetSpecs.bitrate

    return {
      channels: [channels],
      sampleRate: [sampleRate],
      codec: [codec],
      bitrate,
    }
  }

  /**
   * Сгенерировать текстовый контент
   */
  private async generateTextContent(
    analysis: UnifiedContentAnalysis,
    platform: Platform,
    strategy: TextAdaptationStrategy,
  ): Promise<any> {
    const prompts = []

    // Генерируем заголовок
    if (strategy.generateTitle) {
      const titlePrompt = `Generate an engaging title for a ${platform.name} video.
      Content: ${analysis.contentType}
      Genre: ${analysis.genres.join(", ")}
      Mood: ${JSON.stringify(analysis.mood)}
      Length constraints: ${platform.bestPractices.optimization.seo.titleLength.min}-${platform.bestPractices.optimization.seo.titleLength.optimal} characters
      Platform best practices: ${platform.bestPractices.content.toneRecommendations.join(", ")}
      
      Generate only the title, no explanation.`

      prompts.push({ key: "title", prompt: titlePrompt })
    }

    // Генерируем описание
    if (strategy.generateDescription) {
      const descPrompt = `Generate a compelling description for a ${platform.name} video.
      Content insights: ${analysis.insights.strengths.join(", ")}
      Key moments: ${analysis.keyMoments.map((m) => m.description).join(", ")}
      Length: ${platform.bestPractices.optimization.seo.descriptionLength.optimal} characters
      Include SEO keywords naturally.
      
      Generate only the description, no explanation.`

      prompts.push({ key: "description", prompt: descPrompt })
    }

    // Генерируем хэштеги
    if (strategy.generateHashtags) {
      const hashtagPrompt = `Generate ${strategy.hashtagCount} relevant hashtags for a ${platform.name} video.
      Topics: ${((analysis.insights as any).marketingAngles || []).join(", ") || "General content"}
      Genre: ${analysis.genres.join(", ")}
      Target audience: ${analysis.targetAudience ? "General" : "General"}
      
      Format: Return only hashtags separated by spaces, starting with #`

      prompts.push({ key: "hashtags", prompt: hashtagPrompt })
    }

    // Выполняем все промпты параллельно
    const results = await Promise.all(
      prompts.map(async ({ key, prompt }) => ({
        key,
        value: await this.aiService
          .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.7 })
          .then((r) => r.content),
      })),
    )

    // Собираем результаты
    const textContent: any = {
      title: "",
      description: "",
      hashtags: [],
      callToActions: [],
    }

    for (const { key, value } of results) {
      if (key === "hashtags") {
        textContent.hashtags = value.trim().split(/\s+/)
      } else {
        textContent[key] = value.trim()
      }
    }

    // Добавляем CTA
    if (strategy.callToAction) {
      textContent.callToActions = [
        {
          text: strategy.callToAction.text,
          placement: strategy.callToAction.placement,
          style: strategy.callToAction.style,
        },
      ]
    }

    return textContent
  }

  /**
   * Добавить графические элементы
   */
  private async addGraphics(
    _analysis: UnifiedContentAnalysis,
    platform: Platform,
    strategy: GraphicsAdaptationStrategy,
  ): Promise<any> {
    const graphics: any = {
      hooks: [],
      brandingApplied: false,
      overlays: [],
    }

    // Добавляем хуки в начале
    if (strategy.addIntro || platform.specifications.features.thumbnails) {
      graphics.hooks.push({
        type: "visual",
        timing: { start: 0, duration: 3 },
        description: "Eye-catching intro animation",
      })
    }

    // Добавляем прогресс-бар для коротких видео
    if (strategy.addProgress) {
      graphics.overlays.push({
        type: "progress",
        position: { x: 0, y: 0 },
        style: "minimal",
      })
    }

    // Применяем брендинг
    if (strategy.addBranding) {
      graphics.brandingApplied = true
      graphics.overlays.push({
        type: "watermark",
        position: { x: 0.9, y: 0.9 },
        opacity: 0.7,
      })
    }

    // Добавляем субтитры
    if (strategy.addCaptions.autoGenerate) {
      graphics.overlays.push({
        type: "captions",
        style: strategy.addCaptions.style,
        position: strategy.addCaptions.position,
      })
    }

    return graphics
  }

  /**
   * Применить тайминг стратегию
   */
  private async applyTiming(
    analysis: UnifiedContentAnalysis,
    platform: Platform,
    strategy: TimingAdaptationStrategy,
  ): Promise<any> {
    let duration = analysis.technicalSpecs?.duration || 0

    // Применяем целевую длительность
    if (strategy.targetDuration) {
      duration = Math.min(duration, strategy.targetDuration)
    }

    // Применяем ограничения платформы
    duration = Math.min(duration, platform.specifications.duration.max)
    duration = Math.max(duration, platform.specifications.duration.min)

    // Применяем скоростную коррекцию если нужно
    if (strategy.speedAdjustment && strategy.speedAdjustment !== 1) {
      duration /= strategy.speedAdjustment
    }

    return {
      duration,
      highlights: strategy.highlights || [],
      loops: strategy.loops || [],
    }
  }

  // Вспомогательные методы

  private selectFrameRate(current: number | undefined, available: number[]): number {
    if (!current) return available[0]

    // Находим ближайший доступный
    return available.reduce((prev, curr) => (Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev))
  }

  private selectCodec(current: string | undefined, available: string[]): string {
    if (current && available.includes(current)) {
      return current
    }
    return available[0]
  }

  private calculateBitrate(
    resolution: { width: number; height: number },
    frameRate: number,
    limits: { min: number; max: number; recommended: number },
    preset: "preserve" | "optimize" | "compress",
  ): { min: number; max: number; recommended: number } {
    // Базовый расчет битрейта на основе разрешения и FPS
    const pixels = resolution.width * resolution.height
    const baseBitrate = pixels * frameRate * 0.1 // Упрощенная формула

    let recommended = baseBitrate

    switch (preset) {
      case "preserve":
        recommended = limits.max * 0.8
        break
      case "optimize":
        recommended = Math.min(baseBitrate, limits.recommended)
        break
      case "compress":
        recommended = limits.min * 1.5
        break
      default:
        recommended = baseBitrate
        break
    }

    return {
      min: limits.min,
      max: limits.max,
      recommended: Math.max(limits.min, Math.min(recommended, limits.max)),
    }
  }

  private extractTags(analysis: UnifiedContentAnalysis): string[] {
    const tags = new Set<string>()

    // Добавляем жанры
    analysis.genres.forEach((genre: string) => tags.add(genre))

    // Добавляем темы
    analysis.insights.marketingAngles.forEach((topic: string) => tags.add(topic))

    // Добавляем обнаруженные объекты
    analysis.detections.objects?.forEach((obj: { label: string }) => tags.add(obj.label))

    return Array.from(tags)
  }

  private estimateFileSize(videoSpecs: VideoSpecs, audioSpecs: AudioSpecs, duration: number): number {
    // Оценка размера файла на основе битрейтов и длительности
    const videoBitrate = videoSpecs.bitrate.recommended
    const audioBitrate = audioSpecs.bitrate.recommended
    const totalBitrate = videoBitrate + audioBitrate

    // Размер в байтах = (битрейт в битах/сек * длительность в сек) / 8
    return Math.floor((totalBitrate * duration) / 8)
  }

  private parseAspectRatio(ratioString: string, availableRatios: AspectRatio[]): AspectRatio {
    // Пытаемся найти соответствие в доступных соотношениях
    const found = availableRatios.find((ar) => ar.ratio === ratioString)
    if (found) {
      return found
    }

    // Парсим строку вида "16:9" или "9:16"
    const parts = ratioString.split(":")
    if (parts.length === 2) {
      const width = Number.parseInt(parts[0], 10)
      const height = Number.parseInt(parts[1], 10)

      if (!Number.isNaN(width) && !Number.isNaN(height)) {
        return {
          ratio: ratioString,
          width,
          height,
          preferred: true,
        }
      }
    }

    // Возвращаем первое доступное как fallback
    return availableRatios[0]
  }
}
