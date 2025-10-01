/**
 * Multi-Platform Engine
 * Основной движок для адаптации контента под различные платформы
 */

import { UnifiedAIService } from "@/domains/ai-core"
import { AdaptedContent, Platform, PlatformId } from "@/features/ai-content-intelligence"
import { getOptimalAspectRatio, getOptimalResolution, getPlatformConfig } from "../platform-configs"
import type {
  AdaptationResult,
  AdaptationStrategy,
  BatchAdaptationRequest,
  MultiPlatformConfig,
  PerformanceMetrics,
  PlatformAdaptationContext,
  PlatformOptimizationResult,
  TrendingElements,
} from "../types"

import { BatchProcessor } from "./batch-processor"
import { LanguageAdapter } from "./language-adapter"
import { PlatformAdapter } from "./platform-adapter"

export class MultiPlatformEngine {
  private platformAdapter: PlatformAdapter
  private languageAdapter: LanguageAdapter
  private batchProcessor: BatchProcessor
  private config: MultiPlatformConfig
  private isInitialized = false
  aiService: UnifiedAIService

  constructor(config?: Partial<MultiPlatformConfig>) {
    this.config = this.getDefaultConfig(config)
    this.platformAdapter = new PlatformAdapter()
    this.languageAdapter = new LanguageAdapter()
    this.batchProcessor = new BatchProcessor(this.config.processing)
    this.aiService = UnifiedAIService.getInstance()
  }

  /**
   * Инициализация движка
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.platformAdapter.initialize(),
      this.languageAdapter.initialize(),
      this.batchProcessor.initialize(),
    ])

    this.isInitialized = true
  }

  /**
   * Адаптировать контент для платформы
   */
  async adaptForPlatform(context: PlatformAdaptationContext, platformId: PlatformId): Promise<AdaptationResult> {
    if (!this.isInitialized) {
      throw new Error("Multi-Platform Engine not initialized")
    }

    const platform = getPlatformConfig(platformId)
    const strategy = await this.generateAdaptationStrategy(context, platform)

    // Адаптируем контент
    const adaptedContent = await this.platformAdapter.adapt(context.analysis, platform, strategy)

    // Переводим при необходимости
    if (context.targetLanguages.length > 0) {
      await this.languageAdapter.translate(adaptedContent, context.sourceLanguage, context.targetLanguages)
    }

    // Оцениваем качество адаптации
    const quality = await this.evaluateAdaptation(adaptedContent, platform)

    return {
      platform: platformId,
      content: adaptedContent,
      quality,
      issues: this.detectIssues(adaptedContent, platform),
      suggestions: await this.generateSuggestions(adaptedContent, platform),
    }
  }

  /**
   * Пакетная адаптация для нескольких платформ
   */
  async adaptBatch(request: BatchAdaptationRequest): Promise<AdaptationResult[]> {
    return this.batchProcessor.processBatch(request.targetPlatforms, async (platformId) => {
      const context: PlatformAdaptationContext = {
        analysis: request.sourceContent.analysis,
        script: request.sourceContent.script,
        targetPlatform: getPlatformConfig(platformId),
        sourceLanguage: await this.detectSourceLanguage(request.sourceContent),
        targetLanguages: request.languages,
        userPreferences: request.preferences,
      }

      return this.adaptForPlatform(context, platformId)
    })
  }

  /**
   * Оптимизировать контент для платформы
   */
  async optimizeForPlatform(content: AdaptedContent, platformId: PlatformId): Promise<PlatformOptimizationResult> {
    const platform = getPlatformConfig(platformId)

    // Анализируем текущие тренды
    const trends = await this.analyzeTrends(platformId)

    // Генерируем рекомендации по настройкам
    const recommendedSettings = await this.generateOptimalSettings(content, platform, trends)

    // Оцениваем потенциальную производительность
    const estimatedPerformance = await this.estimatePerformance(content, platform, recommendedSettings)

    return {
      recommendedSettings,
      estimatedPerformance,
      trendingElements: trends,
    }
  }

  /**
   * Сгенерировать стратегию адаптации
   */
  private async generateAdaptationStrategy(
    context: PlatformAdaptationContext,
    platform: Platform,
  ): Promise<AdaptationStrategy> {
    const optimalResolution = getOptimalResolution(platform.id)
    const optimalAspectRatio = getOptimalAspectRatio(platform.id)

    // Определяем стратегию видео
    const videoStrategy = {
      targetResolution: {
        ...optimalResolution,
        label: `${optimalResolution.height}p`,
      },
      targetAspectRatio: {
        ...optimalAspectRatio,
        preferred: true,
      },
      cropStrategy: this.determineCropStrategy(context.analysis, optimalAspectRatio),
      qualityPreset: (this.config.adaptation.preserveOriginalQuality ? "preserve" : "optimize") as
        | "preserve"
        | "optimize"
        | "compress",
      enhancementFilters: this.selectEnhancements(context.analysis),
    }

    // Определяем стратегию аудио
    const audioStrategy = {
      normalize: true,
      compressDynamics: platform.id.includes("mobile"),
      enhanceVoice: (context.analysis?.contentType as string) === "tutorial",
      removeBackground: false,
      targetLoudness: -16, // LUFS стандарт для стриминга
    }

    // Определяем стратегию текста
    const textStrategy = {
      generateTitle: true,
      generateDescription: true,
      generateHashtags: this.config.ai.generateHashtags,
      hashtagCount: platform.bestPractices.optimization.seo.hashtagCount.optimal,
      seoOptimization: this.config.ai.optimizeSEO,
      callToAction: {
        type: "subscribe" as const,
        text: "Subscribe for more!",
        placement: "end" as const,
        style: "prominent" as const,
      },
      localization: {
        translateTitle: context.targetLanguages.length > 0,
        translateDescription: context.targetLanguages.length > 0,
        adaptCulturally: true,
        useLocalTrends: true,
      },
    }

    // Определяем стратегию графики
    const graphicsStrategy = {
      addIntro: !!context.userPreferences?.brandingElements?.intros,
      addOutro: !!context.userPreferences?.brandingElements?.outros,
      addLowerThirds: false,
      addCaptions: {
        style: "bold" as const,
        position: "bottom" as const,
        autoGenerate: true,
        burnIn: false,
      },
      addProgress: (platform.id as string) === "youtube_shorts" || (platform.id as string) === "tiktok",
      addBranding: !!context.userPreferences?.brandingElements,
      overlays: [],
    }

    // Определяем стратегию тайминга
    const timingStrategy = {
      targetDuration: platform.specifications.duration.optimal?.min,
      trimStrategy: "smart" as const,
      highlights: this.identifyHighlights(context.analysis),
    }

    return {
      platform: platform.id,
      videoStrategy,
      audioStrategy,
      textStrategy,
      graphicsStrategy,
      timingStrategy,
    }
  }

  /**
   * Определить стратегию обрезки видео
   */
  private determineCropStrategy(analysis: any, targetAspectRatio: any): "center" | "smart" | "manual" | "none" {
    // Если соотношения совпадают, обрезка не нужна
    if (analysis.technicalSpecs?.aspectRatio === targetAspectRatio.ratio) {
      return "none"
    }

    // Если есть обнаруженные объекты, используем умную обрезку
    if (analysis.detections?.objects?.length > 0) {
      return "smart"
    }

    // По умолчанию центрируем
    return "center"
  }

  /**
   * Выбрать улучшения для видео
   */
  private selectEnhancements(analysis: any): any[] {
    const enhancements = []

    // Стабилизация для шаткого видео
    if (analysis.qualityMetrics?.stability < 0.7) {
      enhancements.push({
        type: "stabilization",
        intensity: 0.8,
      })
    }

    // Шумоподавление для низкого качества
    if (analysis.qualityMetrics?.noise > 0.3) {
      enhancements.push({
        type: "denoise",
        intensity: 0.6,
      })
    }

    return enhancements
  }

  /**
   * Идентифицировать ключевые моменты
   */
  private identifyHighlights(analysis: any): any[] {
    return (
      analysis.keyMoments?.map((moment: any) => ({
        start: moment.timestamp as number,
        end: (moment.timestamp as number) + (moment.duration as number),
        importance: moment.score as number,
        keepAudio: true,
      })) || []
    )
  }

  /**
   * Оценить качество адаптации
   */
  private async evaluateAdaptation(content: AdaptedContent, platform: Platform): Promise<any> {
    // Базовая оценка
    const scores = {
      overall: 0.85,
      video: this.evaluateVideoQuality(content),
      audio: this.evaluateAudioQuality(content),
      text: await this.evaluateTextQuality(content, platform),
      engagement: this.estimateEngagement(content, platform),
      technical: this.evaluateTechnicalCompliance(content, platform),
    }

    // Вычисляем общий балл
    scores.overall =
      scores.video * 0.3 + scores.audio * 0.2 + scores.text * 0.2 + scores.engagement * 0.2 + scores.technical * 0.1

    return scores
  }

  private evaluateVideoQuality(_content: AdaptedContent): number {
    // Упрощенная оценка качества видео
    return 0.85
  }

  private evaluateAudioQuality(_content: AdaptedContent): number {
    // Упрощенная оценка качества аудио
    return 0.9
  }

  private async evaluateTextQuality(content: AdaptedContent, platform: Platform): Promise<number> {
    // Проверяем соответствие длины текста рекомендациям
    const titleLength = content.metadata.title?.length || 0
    const descLength = content.metadata.description?.length || 0

    const titleScore = this.scoreInRange(titleLength, platform.bestPractices.optimization.seo.titleLength)

    const descScore = this.scoreInRange(descLength, platform.bestPractices.optimization.seo.descriptionLength)

    return (titleScore + descScore) / 2
  }

  private scoreInRange(value: number, range: { min: number; max: number; optimal: number }): number {
    if (value === range.optimal) return 1
    if (value >= range.min && value <= range.max) {
      const distance = Math.abs(value - range.optimal)
      const maxDistance = Math.max(range.optimal - range.min, range.max - range.optimal)
      return 1 - (distance / maxDistance) * 0.5
    }
    return 0.5
  }

  private estimateEngagement(content: AdaptedContent, platform: Platform): number {
    // Базовая оценка вовлеченности
    let score = 0.7

    // Бонус за хуки в начале
    if (content.processingDetails?.hooks && content.processingDetails.hooks.length > 0) {
      score += 0.1
    }

    // Бонус за CTA
    if (content.processingDetails?.callToActions && content.processingDetails.callToActions.length > 0) {
      score += 0.1
    }

    // Бонус за оптимальную длительность
    if (
      content.duration !== undefined &&
      content.duration >= (platform.specifications.duration.optimal?.min || 0) &&
      content.duration <= (platform.specifications.duration.optimal?.max || Number.POSITIVE_INFINITY)
    ) {
      score += 0.1
    }

    return Math.min(score, 1)
  }

  private evaluateTechnicalCompliance(_content: AdaptedContent, _platform: Platform): number {
    // Проверяем техническое соответствие
    return 0.95 // Упрощенная реализация
  }

  /**
   * Обнаружить проблемы в адаптированном контенте
   */
  private detectIssues(content: AdaptedContent, platform: Platform): any[] {
    const issues = []

    // Проверяем длительность
    if (content.duration !== undefined && content.duration > platform.specifications.duration.max) {
      issues.push({
        type: "error",
        category: "timing",
        message: `Video duration (${content.duration}s) exceeds platform limit (${platform.specifications.duration.max}s)`,
        severity: "high",
        suggestion: "Trim video to fit platform requirements",
      })
    }

    // Проверяем размер файла
    if (content.fileSize !== undefined && content.fileSize > platform.specifications.fileSize.max) {
      issues.push({
        type: "error",
        category: "technical",
        message: "File size exceeds platform limit",
        severity: "high",
        suggestion: "Reduce video quality or duration",
      })
    }

    return issues
  }

  /**
   * Сгенерировать предложения по улучшению
   */
  private async generateSuggestions(content: AdaptedContent, platform: Platform): Promise<string[]> {
    const suggestions = []

    // Предложения по хэштегам
    const hashtagCount = content.metadata?.hashtags?.length || 0
    if (hashtagCount < platform.bestPractices.optimization.seo.hashtagCount.min) {
      suggestions.push(
        `Add more hashtags (current: ${hashtagCount}, recommended: ${platform.bestPractices.optimization.seo.hashtagCount.optimal})`,
      )
    }

    // Предложения по времени публикации
    if (platform.bestPractices.timing.optimalTimes.length > 0) {
      const times = platform.bestPractices.timing.optimalTimes
        .map((t) => `${t.dayOfWeek} ${t.startHour}:00-${t.endHour}:00 ${t.timezone}`)
        .join(", ")
      suggestions.push(`Best posting times: ${times}`)
    }

    return suggestions
  }

  /**
   * Анализировать тренды платформы
   */
  private async analyzeTrends(platformId: PlatformId): Promise<TrendingElements> {
    // В реальной реализации здесь был бы вызов API платформы
    // Сейчас возвращаем моковые данные

    const trendsByPlatform: Record<PlatformId, TrendingElements> = {
      youtube: {
        hashtags: ["#tutorial", "#howto", "#diy", "#tech", "#vlog"],
        topics: ["AI", "productivity", "gaming", "cooking", "fitness"],
        formats: ["long-form", "tutorials", "reviews"],
      },
      youtube_shorts: {
        hashtags: ["#shorts", "#viral", "#trending", "#fyp"],
        sounds: ["trending-sound-1", "trending-sound-2"],
        topics: ["quick tips", "life hacks", "comedy"],
        formats: ["vertical", "quick tips", "reactions"],
      },
      tiktok: {
        hashtags: ["#fyp", "#foryou", "#viral", "#trend"],
        sounds: ["popular-audio-1", "popular-audio-2"],
        effects: ["green-screen", "transitions", "filters"],
        topics: ["dance", "comedy", "education"],
        formats: ["challenges", "duets", "stories"],
      },
      instagram_reels: {
        hashtags: ["#reels", "#explore", "#viral", "#instagram"],
        sounds: ["trending-audio-1", "trending-audio-2"],
        topics: ["lifestyle", "fashion", "food"],
        formats: ["aesthetic", "behind-scenes", "tutorials"],
      },
      instagram_feed: {
        hashtags: ["#instagram", "#photo", "#lifestyle"],
        topics: ["photography", "lifestyle", "art"],
        formats: ["carousel", "single-image", "video"],
      },
      instagram_stories: {
        hashtags: ["#story", "#behind", "#live"],
        topics: ["daily life", "quick updates", "polls"],
        formats: ["vertical", "interactive", "temporary"],
      },
      facebook: {
        hashtags: ["#facebook", "#social", "#community"],
        topics: ["community", "events", "family"],
        formats: ["long-form", "live-video", "community"],
      },
      twitter: {
        hashtags: ["#breaking", "#news", "#opinion"],
        topics: ["current events", "tech", "politics"],
        formats: ["news clips", "reactions", "explainers"],
      },
      telegram: {
        hashtags: ["#telegram", "#channel", "#community"],
        topics: ["tech", "crypto", "news"],
        formats: ["text", "media", "polls"],
      },
      linkedin: {
        hashtags: ["#professional", "#career", "#business"],
        topics: ["career", "business", "networking"],
        formats: ["articles", "professional", "insights"],
      },
      vimeo: {
        hashtags: ["#creative", "#art", "#professional"],
        topics: ["creative", "artistic", "professional"],
        formats: ["high-quality", "creative", "artistic"],
      },
      twitch: {
        hashtags: ["#twitch", "#gaming", "#live"],
        topics: ["gaming", "streaming", "entertainment"],
        formats: ["live-stream", "gaming", "interactive"],
      },
      snapchat: {
        hashtags: ["#snapchat", "#snap", "#story"],
        topics: ["daily life", "friends", "quick updates"],
        formats: ["vertical", "temporary", "filters"],
      },
    }

    return (
      trendsByPlatform[platformId] || {
        hashtags: [],
        topics: [],
        formats: [],
      }
    )
  }

  /**
   * Сгенерировать оптимальные настройки
   */
  private async generateOptimalSettings(
    _content: AdaptedContent,
    platform: Platform,
    _trends: TrendingElements,
  ): Promise<Partial<AdaptationStrategy>> {
    // Генерируем настройки на основе трендов и контента
    return {
      textStrategy: {
        generateTitle: true,
        generateDescription: true,
        generateHashtags: true,
        hashtagCount: platform.bestPractices.optimization.seo.hashtagCount.optimal,
        seoOptimization: true,
        callToAction: {
          type: "subscribe" as const,
          text: "Subscribe for more!",
          placement: "end" as const,
          style: "prominent" as const,
        },
        localization: {
          translateTitle: false,
          translateDescription: false,
          adaptCulturally: true,
          useLocalTrends: true,
        },
      },
    }
  }

  /**
   * Оценить потенциальную производительность
   */
  private async estimatePerformance(
    content: AdaptedContent,
    platform: Platform,
    _settings: Partial<AdaptationStrategy>,
  ): Promise<PerformanceMetrics> {
    // Базовая оценка производительности
    const baseViews = this.estimateBaseViews(platform)
    const contentMultiplier = this.calculateContentMultiplier(content, platform)
    const trendMultiplier = 1.2 // Бонус за использование трендов

    return {
      estimatedViews: {
        min: Math.floor(baseViews.min * contentMultiplier),
        max: Math.floor(baseViews.max * contentMultiplier * trendMultiplier),
      },
      engagementRate: 0.05 * contentMultiplier, // 5% базовая вовлеченность
      shareability: this.calculateShareability(content, platform),
      algorithmScore: this.calculateAlgorithmScore(content, platform),
    }
  }

  private estimateBaseViews(platform: Platform): { min: number; max: number } {
    // Базовые оценки по платформам
    const estimates: Record<PlatformId, { min: number; max: number }> = {
      youtube: { min: 100, max: 10000 },
      youtube_shorts: { min: 1000, max: 100000 },
      tiktok: { min: 500, max: 50000 },
      instagram_reels: { min: 200, max: 20000 },
      instagram_feed: { min: 150, max: 8000 },
      instagram_stories: { min: 100, max: 5000 },
      facebook: { min: 80, max: 15000 },
      twitter: { min: 50, max: 5000 },
      telegram: { min: 30, max: 3000 },
      linkedin: { min: 40, max: 2000 },
      vimeo: { min: 20, max: 1000 },
      twitch: { min: 10, max: 10000 },
      snapchat: { min: 50, max: 8000 },
    }

    return estimates[platform.id] || { min: 100, max: 1000 }
  }

  private calculateContentMultiplier(content: AdaptedContent, platform: Platform): number {
    let multiplier = 1

    // Бонус за качество
    if (content.quality?.overall !== undefined && content.quality.overall > 0.8) multiplier *= 1.5

    // Бонус за оптимальную длительность
    if (
      content.duration !== undefined &&
      content.duration >= (platform.specifications.duration.optimal?.min || 0) &&
      content.duration <= (platform.specifications.duration.optimal?.max || Number.POSITIVE_INFINITY)
    ) {
      multiplier *= 1.3
    }

    return multiplier
  }

  private calculateShareability(content: AdaptedContent, _platform: Platform): number {
    // Упрощенный расчет "шарабельности"
    let score = 0.5

    // Контент с эмоциональным воздействием более "шарабелен"
    if (content.metadata?.tags?.some((tag) => ["inspiring", "funny", "shocking", "educational"].includes(tag))) {
      score += 0.2
    }

    // Короткий контент легче шарить
    if (content.duration !== undefined && content.duration < 60) score += 0.1

    return Math.min(score, 1)
  }

  private calculateAlgorithmScore(_content: AdaptedContent, platform: Platform): number {
    // Оценка соответствия алгоритмам платформы
    let score = 0.7

    // Проверяем соответствие сигналам алгоритма
    for (const signal of platform.algorithms.signals) {
      if ((signal.importance as string) === "critical") {
        score += 0.1
      }
    }

    return Math.min(score, 1)
  }

  /**
   * Получить конфигурацию по умолчанию
   */
  private getDefaultConfig(customConfig?: Partial<MultiPlatformConfig>): MultiPlatformConfig {
    return {
      adaptation: {
        autoDetectBestFormat: true,
        preserveOriginalQuality: false,
        optimizeForMobile: true,
        generateThumbnails: true,
        generatePreviews: true,
        ...customConfig?.adaptation,
      },
      language: {
        autoTranslate: false,
        translationService: "deepl",
        preserveOriginalAudio: true,
        generateSubtitles: true,
        dubbing: false,
        ...customConfig?.language,
      },
      processing: {
        parallel: true,
        maxConcurrent: 3,
        priority: "balanced",
        cacheResults: true,
        ...customConfig?.processing,
      },
      ai: {
        model: "gpt-4",
        temperature: 0.7,
        enhanceDescriptions: true,
        generateHashtags: true,
        optimizeSEO: true,
        ...customConfig?.ai,
      },
    }
  }

  /**
   * Автоопределение исходного языка контента
   */
  private async detectSourceLanguage(sourceContent: any): Promise<string> {
    try {
      // 1. Пытаемся определить язык из метаданных
      if (sourceContent.analysis?.metadata?.language) {
        return sourceContent.analysis.metadata.language
      }

      // 2. Используем текстовый контент для определения языка
      const textSamples = this.extractTextSamples(sourceContent)
      if (textSamples.length === 0) {
        return "en" // Fallback к английскому
      }

      // 3. Анализируем языковые паттерны
      const detectedLanguage = await this.analyzeLanguagePatterns(textSamples)
      if (detectedLanguage) {
        return detectedLanguage
      }

      // 4. Используем AI для более точного определения
      return await this.detectLanguageWithAI(textSamples)
    } catch (error) {
      console.warn("Language detection failed, defaulting to English:", error)
      return "en"
    }
  }

  /**
   * Извлечение текстовых образцов из контента
   */
  private extractTextSamples(sourceContent: any): string[] {
    const samples: string[] = []

    // Извлекаем из сценария
    if (sourceContent.script?.scenes) {
      sourceContent.script.scenes.forEach((scene: any) => {
        if (scene.description) samples.push(scene.description)
        if (scene.audioElements) {
          scene.audioElements.forEach((audio: any) => {
            if (audio.description) samples.push(audio.description)
          })
        }
      })
    }

    // Извлекаем из метаданных
    if (sourceContent.analysis?.metadata?.title) {
      samples.push(sourceContent.analysis.metadata.title)
    }
    if (sourceContent.analysis?.metadata?.description) {
      samples.push(sourceContent.analysis.metadata.description)
    }

    // Извлекаем из транскрипции
    if (sourceContent.analysis?.transcription?.text) {
      samples.push(sourceContent.analysis.transcription.text)
    }

    return samples.filter((sample) => sample && sample.trim().length > 0)
  }

  /**
   * Анализ языковых паттернов (простая эвристика)
   */
  private async analyzeLanguagePatterns(textSamples: string[]): Promise<string | null> {
    const combinedText = textSamples.join(" ").toLowerCase()

    // Простые эвристики для популярных языков
    const languagePatterns = {
      ru: /[а-яё]/g,
      en: /\b(the|and|or|but|is|are|was|were|have|has|had|will|would|can|could|should|shall)\b/g,
      es: /\b(el|la|los|las|de|del|y|o|pero|es|son|fue|fueron|tener|tiene|tenía)\b/g,
      fr: /\b(le|la|les|de|du|des|et|ou|mais|est|sont|était|étaient|avoir|avons|avait)\b/g,
      de: /\b(der|die|das|und|oder|aber|ist|sind|war|waren|haben|hat|hatte)\b/g,
      it: /\b(il|la|lo|gli|le|di|del|e|o|ma|è|sono|era|erano|avere|ha|aveva)\b/g,
      pt: /\b(o|a|os|as|de|do|da|e|ou|mas|é|são|era|eram|ter|tem|tinha)\b/g,
    }

    let bestMatch = { language: null as string | null, score: 0 }

    for (const [language, pattern] of Object.entries(languagePatterns)) {
      const matches = combinedText.match(pattern)
      const score = matches ? matches.length / combinedText.split(/\s+/).length : 0

      if (score > bestMatch.score && score > 0.1) {
        bestMatch = { language, score }
      }
    }

    return bestMatch.language
  }

  /**
   * Определение языка с помощью AI
   */
  private async detectLanguageWithAI(textSamples: string[]): Promise<string> {
    try {
      // Use pattern-based language detection
      // A real implementation would use the AI service API
      const detectedLanguage = await this.analyzeLanguagePatterns(textSamples)

      if (detectedLanguage) {
        return detectedLanguage
      }

      // Default fallback
      return "en"
    } catch (error) {
      console.warn("AI language detection failed:", error)
      return "en"
    }
  }
}
