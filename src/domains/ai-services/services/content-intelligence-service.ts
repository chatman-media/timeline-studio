/**
 * Сервис для анализа контента и Content Intelligence
 * Извлечен из UnifiedAIService для улучшения архитектуры
 */

// Импорт shared типов для Content Intelligence
import { AiMessage } from "@/domains/ai-core"
import type { ContentAnalysisResult, IFFmpegAnalysisService, MediaFile } from "@/domains/ai-services/types/interfaces"

// Реэкспорт shared типов для обратной совместимости
export type MediaInput = MediaFile
export interface UnifiedContentAnalysis extends ContentAnalysisResult {
  classification?: ContentClassification
  script?: ContentScript
  platformVariants?: PlatformVariant[]
  qualityMetrics?: QualityMetrics
  insights?: ContentInsights
}

// Legacy типы для обратной совместимости
export interface ContentClassification {
  genre: string
  style: string
  emotion: string
  audience: string
  technicalQuality: string
  contentRating: string
  confidence: Record<string, number>
}

export interface ContentScript {
  title: string
  description: string
  hooks: string[]
}

export interface QualityMetrics {
  technical: { overallScore: number }
  narrative: { overallScore: number }
  engagement: { overallScore: number }
  accessibility: { overallScore: number }
}

export interface ContentInsights {
  strengths: string[]
  improvements: string[]
  recommendations: string[]
}

export interface SceneAnalysis {
  id: string
  startTime: number
  endTime: number
  type: "dialog" | "action" | "landscape" | "closeup" | "transition"
  confidence: number
  keyFrames: string[]
  description: string
  objects?: DetectedObject[]
  persons?: DetectedPerson[]
}

export interface GeneratedScript {
  id: string
  title: string
  style: string
  structure: string
  tone: string
  scenes: ScriptScene[]
  shotList?: ShotListItem[]
  metadata: ScriptMetadata
}

export interface ScriptScene {
  id: string
  sceneNumber: number
  location: string
  timeOfDay: string
  description: string
  dialogue?: DialogueLine[]
  action: string[]
  notes: string[]
}

export interface DialogueLine {
  character: string
  text: string
  direction?: string
}

export interface ShotListItem {
  shotNumber: number
  type: "wide" | "medium" | "close-up" | "extreme-close-up" | "over-shoulder" | "point-of-view" | "establishing"
  description: string
  cameraMovement?: string
  duration: number
  notes?: string
}

export interface ScriptMetadata {
  estimatedDuration: number
  targetAudience: string
  genre: string
  createdAt: string
  version: string
}

export interface PlatformVariant {
  platform: string
  adaptations: PlatformAdaptation[]
  seoData?: SEOData
  variants?: ContentVariant[]
}

export interface PlatformAdaptation {
  type: "title" | "description" | "tags" | "duration" | "format" | "content"
  original: string
  adapted: string
  reason: string
}

export interface SEOData {
  title: string
  description: string
  tags: string[]
  thumbnail?: string
  category: string
}

export interface ContentVariant {
  id: string
  type: "tone_variation" | "length_variation" | "structure_variation" | "style_variation"
  changes: string[]
  targetMetric: string
  description: string
}

export interface QualityMetricsDetailed {
  technical: TechnicalQuality
  narrative: NarrativeQuality
  engagement: EngagementQuality
  accessibility: AccessibilityQuality
}

export interface TechnicalQuality {
  videoQuality: number
  audioQuality: number
  stabilization: number
  colorCorrection: number
  lighting: number
  overallScore: number
}

export interface NarrativeQuality {
  structure: number
  pacing: number
  clarity: number
  engagement: number
  overallScore: number
}

export interface EngagementQuality {
  hookStrength: number
  retentionPotential: number
  emotionalImpact: number
  callToActionEffectiveness: number
  overallScore: number
}

export interface AccessibilityQuality {
  subtitleQuality: number
  audioClarity: number
  visualClarity: number
  languageSimplicity: number
  overallScore: number
}

export interface ContentInsightsDetailed {
  summary: string
  tags: string[]
  strengths: string[]
  weaknesses: string[]
  highlights: string[]
  suggestions: Array<{
    type: string
    priority: "low" | "medium" | "high"
    description: string
  }>
  warnings: Array<{
    type: string
    severity: "low" | "medium" | "high"
    description: string
  }>
  recommendations: Recommendation[]
  marketingAngles: string[]
  targetDemographics: string[]
  qualityMetrics?: {
    overall: number
    sharpness: number
    brightness: number
    contrast: number
    saturation: number
  }
  mood?: {
    valence: number
    arousal: number
    dominantEmotion: string
    intensity: number
  }
}

export interface Recommendation {
  category: "technical" | "narrative" | "engagement" | "marketing"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  actionSteps: string[]
  estimatedImpact: string
}

export interface DetectedObject {
  class: string
  confidence: number
  boundingBox: BoundingBox
  timestamp: number
}

export interface DetectedPerson {
  id: string
  confidence: number
  boundingBox: BoundingBox
  timestamp: number
  characteristics?: PersonCharacteristics
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PersonCharacteristics {
  age?: "child" | "teenager" | "adult" | "senior"
  gender?: "male" | "female" | "unknown"
  emotion?: "happy" | "sad" | "angry" | "surprised" | "neutral"
}

// Интерфейс для взаимодействия с AI сервисом
export interface AIServiceInterface {
  sendRequest(model: string, messages: AiMessage[], options?: { temperature?: number }): Promise<{ content: string }>
}

/**
 * Сервис для анализа контента и Content Intelligence
 */
export class ContentIntelligenceService {
  private aiService: AIServiceInterface

  private constructor(aiService: AIServiceInterface) {
    this.aiService = aiService
  }

  /**
   * Создать экземпляр сервиса с AI сервисом
   */
  public static create(aiService: AIServiceInterface): ContentIntelligenceService {
    return new ContentIntelligenceService(aiService)
  }

  /**
   * Content Intelligence: Полный анализ контента
   */
  public async analyzeContentIntelligence(
    mediaFiles: MediaInput[],
    options: {
      analysisDepth?: "quick" | "normal" | "deep"
      targetPlatforms?: string[]
      languages?: string[]
      enablePersonTracking?: boolean
      generateScript?: boolean
    } = {},
  ): Promise<UnifiedContentAnalysis[]> {
    const {
      analysisDepth = "normal",
      targetPlatforms = [],
      languages = [],
      enablePersonTracking = false,
      generateScript = false,
    } = options

    const results: UnifiedContentAnalysis[] = []

    for (const mediaFile of mediaFiles) {
      try {
        // 1. Scene Analysis с использованием existing video analysis tools
        const scenes = await this.performSceneAnalysis(mediaFile, analysisDepth, enablePersonTracking)

        // 2. Content Classification
        const classification = await this.classifyContent(mediaFile, scenes)

        // 3. Quality Analysis
        const qualityMetrics = await this.analyzeQuality(mediaFile, scenes)

        // 4. Script Generation (если запрошено)
        let script: ContentScript | undefined
        let generatedScript: GeneratedScript | undefined
        if (generateScript) {
          generatedScript = await this.generateScript(scenes, classification)
          script = {
            title: generatedScript.title,
            description: generatedScript.structure || "",
            hooks: generatedScript.scenes.map((s) => s.description).filter(Boolean),
          }
        }

        // 5. Platform Adaptation (если указаны платформы)
        let platformVariants: PlatformVariant[] | undefined
        if (targetPlatforms.length > 0) {
          platformVariants = await this.adaptToPlatforms(
            { scenes, classification, script: generatedScript },
            targetPlatforms,
            languages,
          )
        }

        // 6. Content Insights
        const insightsDetailed = await this.generateInsights(scenes, classification, qualityMetrics)
        const insights: ContentInsights = {
          strengths: insightsDetailed.strengths,
          improvements: insightsDetailed.weaknesses || [],
          recommendations: insightsDetailed.recommendations?.map((r) => r.description) || [],
        }

        const analysis: UnifiedContentAnalysis = {
          id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          mediaFile,
          scenes: scenes.map((scene) => ({
            start: scene.startTime,
            end: scene.endTime,
            confidence: scene.confidence,
            id: scene.id,
            description: scene.description,
            objects: scene.objects?.map((obj) => obj.class) || [],
            keyframes: scene.keyFrames,
          })),
          video: {
            duration: 0,
            fps: 30,
            resolution: { width: 1920, height: 1080 },
            codec: "h264",
            bitrate: 5000000,
            scenes: [],
            quality: {
              overall: 80,
              sharpness: 85,
              noise: 10,
              compression: 15,
              motionIntensity: 50,
            },
          },
          audio: {
            duration: 0,
            channels: 2,
            sampleRate: 48000,
            bitrate: 192000,
            codec: "aac",
            volume: { average: -12, peak: -6, min: -30, max: -6 },
            silentSegments: [],
          },
          transcript: { text: "", segments: [] },
          summary: "",
          tags: [],
          sentiment: { positive: 0.5, neutral: 0.4, negative: 0.1 },
          classification,
          script,
          platformVariants,
          qualityMetrics,
          insights,
        }

        results.push(analysis)
      } catch (error) {
        console.error(`Ошибка анализа файла ${mediaFile.filename}:`, error)
        // Продолжаем с другими файлами
      }
    }

    return results
  }

  /**
   * Scene Analysis с использованием shared analysis services
   */
  private async performSceneAnalysis(
    mediaFile: MediaInput,
    depth: "quick" | "normal" | "deep",
    enablePersonTracking: boolean,
  ): Promise<SceneAnalysis[]> {
    try {
      // Используем shared FFmpeg анализ
      const { getAIContainer } = await import("@/domains/ai-core")
      const aiContainer = getAIContainer()
      const ffmpegService = await aiContainer.resolve<IFFmpegAnalysisService>("FFmpegService")

      // Выполняем детекцию сцен через shared сервис
      const sceneDetection = await ffmpegService.detectScenes(mediaFile.path, {
        sensitivity: depth === "quick" ? 0.5 : depth === "deep" ? 0.2 : 0.3,
        minSceneDuration: depth === "quick" ? 5 : depth === "deep" ? 1 : 2,
        method: "threshold",
      })

      // Конвертируем в legacy формат для обратной совместимости
      return sceneDetection.map((scene, index) => ({
        id: `scene_${index}`,
        startTime: scene.start,
        endTime: scene.end,
        type: "action" as const,
        confidence: scene.confidence,
        keyFrames: [],
        description: `Scene ${index + 1}`,
        objects: [],
        persons: enablePersonTracking ? [] : undefined,
      }))
    } catch (error) {
      console.warn("Ошибка парсинга результатов детекции сцен:", error)
      return []
    }
  }

  /**
   * Content Classification
   */
  private async classifyContent(mediaFile: MediaInput, scenes: SceneAnalysis[]): Promise<ContentClassification> {
    const classificationResult = await this.aiService.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Классифицируй видео контент на основе анализа сцен:
          
Файл: ${mediaFile.filename}
Сцены: ${JSON.stringify(scenes.slice(0, 5))} // Первые 5 сцен для контекста

Определи:
- genre (documentary, narrative, instructional, promotional, etc.)
- style (professional, casual, artistic, etc.)
- emotion (positive, negative, neutral, dramatic, etc.)
- audience (children, teenagers, adults, seniors, general)
- technicalQuality (poor, fair, good, excellent)
- contentRating (G, PG, PG-13, R)

Форматируй как JSON с полями genre, style, emotion, audience, technicalQuality, contentRating и confidence (объект с уверенностью для каждого поля).`,
        },
      ],
      { temperature: 0.2 },
    )

    try {
      return JSON.parse(classificationResult.content)
    } catch (error) {
      console.warn("Ошибка парсинга классификации контента:", error)
      return {
        genre: "unknown",
        style: "unknown",
        emotion: "neutral",
        audience: "general",
        technicalQuality: "fair",
        contentRating: "G",
        confidence: {},
      }
    }
  }

  /**
   * Quality Analysis с использованием shared analysis services
   */
  private async analyzeQuality(mediaFile: MediaInput, scenes: SceneAnalysis[]): Promise<QualityMetrics> {
    try {
      // Используем shared FFmpeg анализ качества
      const { getAIContainer } = await import("@/domains/ai-core")
      const aiContainer = getAIContainer()
      const ffmpegService = await aiContainer.resolve<IFFmpegAnalysisService>("FFmpegService")

      const qualityAnalysis = await ffmpegService.analyzeQuality(mediaFile.path, {
        checkVideo: true,
        checkAudio: true,
        deepAnalysis: true,
      })

      // Конвертируем в legacy формат QualityMetrics
      return {
        technical: {
          overallScore: qualityAnalysis.overall || 75,
        },
        narrative: {
          overallScore: 7,
        },
        engagement: {
          overallScore: 7,
        },
        accessibility: {
          overallScore: Math.round(
            (5 + (qualityAnalysis.audio?.clarity || 75) / 10 + (qualityAnalysis.video?.sharpness || 75) / 10 + 7) / 4,
          ),
        },
      }
    } catch (error) {
      console.warn("Ошибка shared анализа качества, используем AI fallback:", error)

      // AI fallback через существующий AI сервис
      try {
        const qualityResult = await this.aiService.sendRequest(
          "claude-4-sonnet",
          [
            {
              role: "user",
              content: `Проанализируй качество видео: ${mediaFile.filename}. Количество сцен: ${scenes.length}. Верни JSON с полями technical, narrative, engagement, accessibility, каждый с overallScore.`,
            },
          ],
          { temperature: 0.2 },
        )

        return JSON.parse(qualityResult.content)
      } catch (fallbackError) {
        console.warn("Ошибка парсинга анализа качества:", fallbackError)

        return {
          technical: {
            overallScore: 5,
          },
          narrative: {
            overallScore: 5,
          },
          engagement: {
            overallScore: 5,
          },
          accessibility: {
            overallScore: 5,
          },
        }
      }
    }
  }

  /**
   * Script Generation
   */
  private async generateScript(
    scenes: SceneAnalysis[],
    classification: ContentClassification,
  ): Promise<GeneratedScript> {
    const scriptResult = await this.aiService.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Сгенерируй полный сценарий на основе анализа видео:

Сцены: ${JSON.stringify(scenes)}
Классификация: ${JSON.stringify(classification)}

Создай сценарий в формате JSON с полями:
- id: уникальный идентификатор
- title: название
- style: стиль сценария (${classification.style})
- structure: структура повествования
- tone: тон (на основе emotion: ${classification.emotion})
- scenes: массив сцен с полями id, sceneNumber, location, timeOfDay, description, dialogue, action, notes
- shotList: список кадров (опционально)
- metadata: метаданные с estimatedDuration, targetAudience, genre, createdAt, version`,
        },
      ],
      { temperature: 0.4 },
    )

    try {
      const script = JSON.parse(scriptResult.content)
      return {
        ...script,
        id: script.id || `script_${Date.now()}`,
        metadata: {
          ...script.metadata,
          createdAt: new Date().toISOString(),
          version: "1.0",
        },
      }
    } catch (error) {
      console.warn("Ошибка парсинга генерации сценария:", error)
      return {
        id: `script_${Date.now()}`,
        title: "Generated Script",
        style: classification.style,
        structure: "chronological",
        tone: classification.emotion,
        scenes: [],
        metadata: {
          estimatedDuration: 0,
          targetAudience: classification.audience,
          genre: classification.genre,
          createdAt: new Date().toISOString(),
          version: "1.0",
        },
      }
    }
  }

  /**
   * Platform Adaptation
   */
  private async adaptToPlatforms(
    content: { scenes: SceneAnalysis[]; classification: ContentClassification; script?: GeneratedScript },
    platforms: string[],
    _languages: string[],
  ): Promise<PlatformVariant[]> {
    const variants: PlatformVariant[] = []

    for (const platform of platforms) {
      const adaptationResult = await this.aiService.sendRequest(
        "claude-4-sonnet",
        [
          {
            role: "user",
            content: `Адаптируй контент под платформу ${platform}:

Контент:
- Жанр: ${content.classification.genre}
- Стиль: ${content.classification.style}
- Аудитория: ${content.classification.audience}
- Количество сцен: ${content.scenes.length}

Создай адаптацию в формате JSON:
- platform: "${platform}"
- adaptations: массив изменений с полями type, original, adapted, reason
- seoData: title, description, tags, category
- variants: варианты для A/B тестирования

Учти специфику платформы:
- YouTube: длинные видео, SEO, миниатюры
- TikTok: короткие вертикальные видео, тренды
- Instagram: визуальность, хештеги, Stories/Reels
- Telegram: каналы, боты, стикеры`,
          },
        ],
        { temperature: 0.3 },
      )

      try {
        const variant = JSON.parse(adaptationResult.content)
        variants.push(variant)
      } catch (error) {
        console.warn(`Ошибка адаптации для платформы ${platform}:`, error)
      }
    }

    return variants
  }

  /**
   * Content Insights Generation
   */
  private async generateInsights(
    scenes: SceneAnalysis[],
    classification: ContentClassification,
    quality: QualityMetrics,
  ): Promise<ContentInsightsDetailed> {
    const insightsResult = await this.aiService.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Сгенерируй инсайты по контенту:

Сцены: ${scenes.length} сцен, типы: ${scenes.map((s) => s.type).join(", ")}
Классификация: ${JSON.stringify(classification)}
Качество: Техническое ${quality.technical.overallScore}/10, Повествование ${quality.narrative.overallScore}/10

Создай анализ в формате JSON:
- strengths: массив сильных сторон
- weaknesses: массив слабых сторон  
- recommendations: массив рекомендаций с полями category, priority, title, description, actionSteps, estimatedImpact
- marketingAngles: углы для продвижения
- targetDemographics: целевые демографии

Будь конкретным и действенным в рекомендациях.`,
        },
      ],
      { temperature: 0.4 },
    )

    try {
      return JSON.parse(insightsResult.content)
    } catch (error) {
      console.warn("Ошибка парсинга генерации инсайтов:", error)
      return {
        summary: "",
        tags: [],
        strengths: [],
        weaknesses: [],
        highlights: [],
        suggestions: [],
        warnings: [],
        recommendations: [],
        marketingAngles: [],
        targetDemographics: [],
      }
    }
  }
}
