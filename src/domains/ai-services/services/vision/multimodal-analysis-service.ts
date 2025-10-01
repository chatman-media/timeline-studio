/**
 * Сервис для мультимодального анализа видео с помощью GPT-4V
 * Анализ кадров, создание описаний, определение ключевых моментов
 */

import { invoke } from "@tauri-apps/api/core"

import { ApiKeyLoader } from "@/domains/ai-core"
import type { FrameAnalysis, IVisionService } from "@/domains/ai-services/types/interfaces"

/**
 * Типы мультимодального анализа
 */
export type MultimodalAnalysisType =
  | "frame_description" // Описание кадров
  | "scene_understanding" // Понимание сцен
  | "object_detection" // Детекция объектов
  | "emotion_analysis" // Анализ эмоций
  | "action_recognition" // Распознавание действий
  | "text_recognition" // Распознавание текста в кадрах
  | "aesthetic_analysis" // Эстетический анализ
  | "content_moderation" // Модерация контента
  | "thumbnail_selection" // Выбор превью
  | "highlight_detection" // Детекция ключевых моментов

/**
 * Параметры анализа кадра
 */
export interface FrameAnalysisParams {
  frameImagePath: string
  analysisType: MultimodalAnalysisType
  customPrompt?: string
  detailLevel?: "low" | "medium" | "high"
  language?: string
  contextInfo?: {
    videoTitle?: string
    videoDuration?: number
    frameTimestamp?: number
    previousFrames?: string[]
  }
}

/**
 * Результат анализа кадра
 */
export interface FrameAnalysisResult {
  frameTimestamp: number
  analysisType: MultimodalAnalysisType
  description: string
  confidence: number
  detectedObjects?: Array<{
    name: string
    confidence: number
    boundingBox?: { x: number; y: number; width: number; height: number }
  }>
  detectedText?: Array<{
    text: string
    confidence: number
    language?: string
    position?: { x: number; y: number }
  }>
  emotions?: Array<{
    emotion: string
    confidence: number
    person?: string
  }>
  aestheticScore?: {
    composition: number
    lighting: number
    colorHarmony: number
    overall: number
  }
  tags: string[]
  metadata: Record<string, any>
}

/**
 * Параметры видео анализа
 */
export interface VideoAnalysisParams {
  clipId: string
  analysisTypes: MultimodalAnalysisType[]
  samplingRate?: number // кадров в секунду для анализа
  maxFrames?: number
  customPrompts?: Record<MultimodalAnalysisType, string>
  contextInfo?: {
    title?: string
    description?: string
    genre?: string
    targetAudience?: string
  }
}

/**
 * Результат анализа видео
 */
export interface VideoAnalysisResult {
  clipId: string
  analysisTypes: MultimodalAnalysisType[]
  frameResults: FrameAnalysisResult[]
  summary: {
    mainSubjects: string[]
    overallMood: string
    keyMoments: Array<{
      timestamp: number
      description: string
      importance: number
    }>
    suggestedCuts: Array<{
      startTime: number
      endTime: number
      reason: string
      confidence: number
    }>
    aestheticHighlights: Array<{
      timestamp: number
      score: number
      reason: string
    }>
  }
  metadata: {
    totalFramesAnalyzed: number
    processingTime: number
    averageConfidence: number
    detectedLanguages: string[]
  }
}

/**
 * Параметры для создания превью
 */
export interface ThumbnailSuggestionParams {
  clipId: string
  count?: number
  criteria?: Array<"aesthetic" | "emotion" | "action" | "text" | "faces">
  targetAspectRatio?: string
  contextPrompt?: string
}

/**
 * Результат выбора превью
 */
export interface ThumbnailSuggestion {
  frameTimestamp: number
  frameImagePath: string
  score: number
  reasons: string[]
  aestheticScore: number
  emotionalImpact: number
  visualComplexity: number
  textContent?: string
}

/**
 * Сервис мультимодального анализа
 */
export class MultimodalAnalysisService {
  private static instance: MultimodalAnalysisService
  private apiKeyLoader: ApiKeyLoader

  private constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): MultimodalAnalysisService {
    if (!MultimodalAnalysisService.instance) {
      MultimodalAnalysisService.instance = new MultimodalAnalysisService()
    }
    return MultimodalAnalysisService.instance
  }

  /**
   * Анализ одного кадра с использованием shared Vision service
   */
  public async analyzeFrame(params: FrameAnalysisParams): Promise<FrameAnalysisResult> {
    try {
      // Используем shared Vision service
      const { getAIContainer } = await import("@/domains/ai-core")
      const aiContainer = getAIContainer()
      const visionService = (await aiContainer.resolve("VisionService")) as IVisionService

      // Vision service анализирует кадр
      const frameAnalysis = await visionService.analyzeFrame(params.frameImagePath)

      // Дополнительные анализы для полной информации
      const [composition, colors] = await Promise.all([
        visionService.analyzeComposition?.(params.frameImagePath) || {
          ruleOfThirds: { score: 0.7, points: [] },
          leadingLines: { score: 0.5, lines: [] },
          balance: { score: 0.6, centerOfMass: { x: 0, y: 0 } },
          symmetry: { score: 0.5 },
        },
        visionService.analyzeColors?.(params.frameImagePath) || {
          dominantColors: [],
          palette: [],
          temperature: "neutral" as const,
          saturation: "medium" as const,
          brightness: "medium" as const,
        },
      ])

      // Конвертируем FrameAnalysisResult в FrameAnalysis для совместимости
      const adaptedAnalysis: FrameAnalysis = {
        id: `frame_${Date.now()}`,
        timestamp: Date.now(),
        objects:
          frameAnalysis.objects?.map((obj) => ({
            class: obj.label,
            confidence: obj.confidence,
            boundingBox: {
              x: obj.bbox.x,
              y: obj.bbox.y,
              width: obj.bbox.width,
              height: obj.bbox.height,
            },
          })) || [],
        text:
          frameAnalysis.text?.map((t) => ({
            text: t.text,
            confidence: t.confidence,
            boundingBox: {
              x: t.bbox.x,
              y: t.bbox.y,
              width: t.bbox.width,
              height: t.bbox.height,
            },
          })) || [],
        composition,
        colors,
        quality: {
          sharpness: 75, // Значения по умолчанию
          brightness: 75,
          contrast: 75,
        },
      }

      // Конвертируем результат в legacy формат
      return {
        frameTimestamp: params.contextInfo?.frameTimestamp || 0,
        analysisType: params.analysisType,
        description: this.generateDescriptionFromAnalysis(adaptedAnalysis, params),
        confidence: this.calculateConfidenceFromAnalysis(adaptedAnalysis),
        detectedObjects: frameAnalysis.objects?.map((obj) => ({
          name: obj.label,
          confidence: obj.confidence,
          boundingBox: obj.bbox,
        })),
        detectedText: frameAnalysis.text?.map((text) => ({
          text: text.text,
          confidence: text.confidence,
          language: "unknown",
          position: { x: text.bbox.x, y: text.bbox.y },
        })),
        aestheticScore: {
          composition: composition.ruleOfThirds.score * 10,
          lighting: 7.5, // Заглушка, так как нет прямого доступа к качеству освещения
          colorHarmony: colors.palette.length > 3 ? 8 : 5,
          overall: (composition.ruleOfThirds.score * 10 + 7.5) / 2,
        },
        tags: this.extractTagsFromAnalysis(adaptedAnalysis, params.analysisType),
        metadata: {
          processingTime: Date.now() - Date.now(), // Placeholder
          modelUsed: "shared-vision-service",
          detailLevel: params.detailLevel || "medium",
          language: params.language || "ru",
        },
      }
    } catch (error) {
      console.warn("Ошибка shared Vision service, используем legacy GPT-4V:", error)

      // Legacy fallback
      const apiKey = await this.apiKeyLoader.getApiKey("openai")
      if (!apiKey) {
        throw new Error("OpenAI API ключ не найден. Необходим для GPT-4V анализа.")
      }

      // Конвертируем изображение в base64
      const imageBase64 = await this.imageToBase64(params.frameImagePath)

      // Создаем промпт в зависимости от типа анализа
      const prompt = this.buildAnalysisPrompt(params)

      try {
        const response = await this.callGPT4Vision(
          {
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`,
                      detail: params.detailLevel || "medium",
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
            temperature: 0.1,
          },
          apiKey,
        )

        return this.parseFrameAnalysisResponse(response, params)
      } catch (error) {
        throw new Error(`Ошибка анализа кадра: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  /**
   * Анализ всего видео
   */
  public async analyzeVideo(params: VideoAnalysisParams): Promise<VideoAnalysisResult> {
    const startTime = Date.now()
    console.log(`Начинаем мультимодальный анализ видео ${params.clipId}`)

    // Извлекаем кадры из видео
    const frames = await this.extractFramesForAnalysis(params.clipId, {
      samplingRate: params.samplingRate || 1,
      maxFrames: params.maxFrames || 20,
    })

    const frameResults: FrameAnalysisResult[] = []

    // Анализируем каждый кадр
    for (const frame of frames) {
      for (const analysisType of params.analysisTypes) {
        try {
          const result = await this.analyzeFrame({
            frameImagePath: frame.imagePath,
            analysisType,
            customPrompt: params.customPrompts?.[analysisType],
            contextInfo: {
              ...params.contextInfo,
              frameTimestamp: frame.timestamp,
              previousFrames: frameResults.slice(-3).map((r) => r.description),
            },
          })

          frameResults.push({
            ...result,
            frameTimestamp: frame.timestamp,
          })
        } catch (error) {
          console.error(`Ошибка анализа кадра ${frame.timestamp}:`, error)
        }
      }
    }

    // Создаем общий анализ видео
    const endTime = Date.now()
    const summary = this.generateVideoSummary(frameResults, params.contextInfo)

    return {
      clipId: params.clipId,
      analysisTypes: params.analysisTypes,
      frameResults,
      summary,
      metadata: {
        totalFramesAnalyzed: frames.length,
        processingTime: endTime - startTime, // Реальное время обработки в миллисекундах
        averageConfidence: this.calculateAverageConfidence(frameResults),
        detectedLanguages: this.extractDetectedLanguages(frameResults),
      },
    }
  }

  /**
   * Предложения для превью
   */
  public async suggestThumbnails(params: ThumbnailSuggestionParams): Promise<ThumbnailSuggestion[]> {
    // Извлекаем кадры-кандидаты
    const candidateFrames = await this.extractFramesForAnalysis(params.clipId, {
      samplingRate: 0.5, // Каждые 2 секунды
      maxFrames: 50,
    })

    const suggestions: ThumbnailSuggestion[] = []

    // Анализируем каждый кадр-кандидат
    for (const frame of candidateFrames) {
      try {
        const analysisResult = await this.analyzeFrame({
          frameImagePath: frame.imagePath,
          analysisType: "thumbnail_selection",
          customPrompt: this.buildThumbnailSelectionPrompt(params),
          contextInfo: {
            frameTimestamp: frame.timestamp,
          },
        })

        const suggestion: ThumbnailSuggestion = {
          frameTimestamp: frame.timestamp,
          frameImagePath: frame.imagePath,
          score: analysisResult.confidence,
          reasons: analysisResult.tags,
          aestheticScore: analysisResult.aestheticScore?.overall || 0,
          emotionalImpact: this.extractEmotionalImpact(analysisResult),
          visualComplexity: this.calculateVisualComplexity(analysisResult),
          textContent: analysisResult.detectedText?.map((t) => t.text).join(" "),
        }

        suggestions.push(suggestion)
      } catch (error) {
        console.error(`Ошибка анализа кадра для превью ${frame.timestamp}:`, error)
      }
    }

    // Сортируем по общему скору и возвращаем лучшие
    return suggestions.sort((a, b) => b.score - a.score).slice(0, params.count || 5)
  }

  /**
   * Пакетный анализ видео
   */
  public async batchAnalyzeVideos(
    clipIds: string[],
    analysisTypes: MultimodalAnalysisType[],
    options?: {
      maxConcurrent?: number
      progressCallback?: (progress: { completed: number; total: number; current: string }) => void
    },
  ): Promise<Record<string, VideoAnalysisResult>> {
    const results: Record<string, VideoAnalysisResult> = {}
    const maxConcurrent = options?.maxConcurrent || 2 // GPT-4V имеет ограничения

    // Разбиваем на батчи для контроля параллельности
    const batches = this.chunkArray(clipIds, maxConcurrent)
    let completed = 0

    for (const batch of batches) {
      const batchPromises = batch.map(async (clipId) => {
        try {
          const result = await this.analyzeVideo({
            clipId,
            analysisTypes,
            samplingRate: 1,
            maxFrames: 10, // Ограничиваем для пакетного анализа
          })

          results[clipId] = result
          completed++

          if (options?.progressCallback) {
            options.progressCallback({
              completed,
              total: clipIds.length,
              current: clipId,
            })
          }
        } catch (error) {
          console.error(`Ошибка анализа видео ${clipId}:`, error)
        }
      })

      await Promise.all(batchPromises)
    }

    return results
  }

  /**
   * Вспомогательные методы
   */

  private async imageToBase64(imagePath: string): Promise<string> {
    return await invoke("convert_image_to_base64", { imagePath })
  }

  private async extractFramesForAnalysis(
    clipId: string,
    options: { samplingRate: number; maxFrames: number },
  ): Promise<Array<{ imagePath: string; timestamp: number }>> {
    return await invoke("extract_frames_for_multimodal_analysis", {
      clipId,
      samplingRate: options.samplingRate,
      maxFrames: options.maxFrames,
    })
  }

  private buildAnalysisPrompt(params: FrameAnalysisParams): string {
    const basePrompts: Record<MultimodalAnalysisType, string> = {
      frame_description: "Опишите этот кадр детально, включая объекты, людей, действия, настроение и композицию.",
      scene_understanding:
        "Проанализируйте сцену: что происходит, где это происходит, какое время дня, настроение сцены.",
      object_detection:
        "Перечислите все объекты, которые вы видите в кадре, с указанием их местоположения и уверенности.",
      emotion_analysis: "Определите эмоции людей в кадре, их настроение и эмоциональную атмосферу сцены.",
      action_recognition: "Опишите все действия и движения, которые происходят в кадре.",
      text_recognition: "Найдите и извлеките весь текст, видимый в кадре, включая надписи, титры, знаки.",
      aesthetic_analysis:
        "Оцените эстетические качества кадра: композицию, освещение, цветовую гармонию, визуальную привлекательность.",
      content_moderation: "Проверьте содержимое на наличие неподходящего контента, насилия, откровенных сцен.",
      thumbnail_selection: "Оцените, насколько этот кадр подходит для использования в качестве превью видео.",
      highlight_detection: "Определите, является ли этот кадр ключевым моментом, который стоит выделить.",
    }

    let prompt = params.customPrompt || basePrompts[params.analysisType]

    if (params.contextInfo) {
      prompt += "\n\nКонтекст: "
      if (params.contextInfo.videoTitle) prompt += `Название видео: "${params.contextInfo.videoTitle}". `
      if (params.contextInfo.frameTimestamp) prompt += `Временная метка: ${params.contextInfo.frameTimestamp}с. `
      if (params.contextInfo.previousFrames?.length) {
        prompt += `Предыдущие кадры: ${params.contextInfo.previousFrames.join(", ")}.`
      }
    }

    prompt += `\n\nВерните ответ в формате JSON со следующими полями:
{
  "description": "подробное описание",
  "confidence": число от 0 до 1,
  "tags": ["тег1", "тег2"],
  "metadata": {}
}`

    return prompt
  }

  private buildThumbnailSelectionPrompt(params: ThumbnailSuggestionParams): string {
    let prompt = "Оцените этот кадр как потенциальное превью для видео. "

    if (params.criteria) {
      prompt += `Особое внимание уделите: ${params.criteria.join(", ")}. `
    }

    if (params.contextPrompt) {
      prompt += `${params.contextPrompt} `
    }

    prompt += `Оцените по критериям:
- Визуальная привлекательность (0-10)
- Информативность (0-10) 
- Эмоциональное воздействие (0-10)
- Качество композиции (0-10)
- Наличие лиц/людей (0-10)

Верните JSON с оценками и общим скором.`

    return prompt
  }

  private async callGPT4Vision(payload: any, apiKey: string): Promise<any> {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `${response.status} ${response.statusText}`
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error?.message || errorText
        } catch {
          errorMessage = errorText || errorMessage
        }
        throw new Error(`OpenAI API error: ${errorMessage}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Network error")
      }
      throw error
    }
  }

  private parseFrameAnalysisResponse(response: string, params: FrameAnalysisParams): FrameAnalysisResult {
    try {
      const parsed = JSON.parse(response)

      return {
        frameTimestamp: params.contextInfo?.frameTimestamp || 0,
        analysisType: params.analysisType,
        description: parsed.description || "",
        confidence: parsed.confidence || 0,
        detectedObjects: parsed.objects || [],
        detectedText: parsed.text || [],
        emotions: parsed.emotions || [],
        aestheticScore: parsed.aesthetic || undefined,
        tags: parsed.tags || [],
        metadata: parsed.metadata || {},
      }
    } catch (error) {
      // Fallback если JSON parsing не удался
      return {
        frameTimestamp: params.contextInfo?.frameTimestamp || 0,
        analysisType: params.analysisType,
        description: response,
        confidence: 0.5,
        tags: [],
        metadata: {},
      }
    }
  }

  private generateVideoSummary(
    frameResults: FrameAnalysisResult[],
    _contextInfo?: any,
  ): VideoAnalysisResult["summary"] {
    // Извлекаем основные субъекты
    const allTags = frameResults.flatMap((r) => r.tags)
    const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})

    const mainSubjects = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    // Определяем общее настроение
    const emotions = frameResults.flatMap((r) => r.emotions || [])
    const overallMood =
      emotions.length > 0
        ? emotions.reduce((prev, curr) => (curr.confidence > prev.confidence ? curr : prev)).emotion
        : "neutral"

    // Находим ключевые моменты (кадры с высокой уверенностью)
    const keyMoments = frameResults
      .filter((r) => r.confidence > 0.8)
      .map((r) => ({
        timestamp: r.frameTimestamp,
        description: r.description,
        importance: r.confidence,
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)

    return {
      mainSubjects,
      overallMood,
      keyMoments,
      suggestedCuts: this.detectSuggestedCuts(frameResults),
      aestheticHighlights: frameResults
        .filter((r) => r.aestheticScore?.overall && r.aestheticScore.overall > 7)
        .map((r) => ({
          timestamp: r.frameTimestamp,
          score: r.aestheticScore!.overall,
          reason: "High aesthetic score",
        })),
    }
  }

  private detectSuggestedCuts(frameResults: FrameAnalysisResult[]): VideoAnalysisResult["summary"]["suggestedCuts"] {
    const cuts: VideoAnalysisResult["summary"]["suggestedCuts"] = []

    if (frameResults.length < 2) return cuts

    for (let i = 1; i < frameResults.length; i++) {
      const prevFrame = frameResults[i - 1]
      const currentFrame = frameResults[i]

      // Обнаружение изменения сцены по описанию
      const descriptionSimilarity = this.calculateTextSimilarity(prevFrame.description, currentFrame.description)

      // Изменение количества объектов
      const prevObjectCount = prevFrame.detectedObjects?.length || 0
      const currentObjectCount = currentFrame.detectedObjects?.length || 0
      const objectChangeRatio = Math.abs(currentObjectCount - prevObjectCount) / Math.max(prevObjectCount, 1)

      // Изменение эмоционального тона
      const prevEmotion = prevFrame.emotions?.[0]?.emotion || "neutral"
      const currentEmotion = currentFrame.emotions?.[0]?.emotion || "neutral"
      const emotionChanged = prevEmotion !== currentEmotion

      // Определение точки монтажа
      let shouldCut = false
      let reason = ""
      let confidence = 0

      if (descriptionSimilarity < 0.3) {
        shouldCut = true
        reason = "Значительное изменение сцены"
        confidence = 1 - descriptionSimilarity
      } else if (objectChangeRatio > 0.7) {
        shouldCut = true
        reason = "Изменение количества объектов в кадре"
        confidence = Math.min(objectChangeRatio, 1)
      } else if (emotionChanged && prevFrame.emotions?.length && currentFrame.emotions?.length) {
        shouldCut = true
        reason = "Изменение эмоционального тона"
        confidence = 0.6
      }

      if (shouldCut && confidence > 0.5) {
        cuts.push({
          startTime: prevFrame.frameTimestamp,
          endTime: currentFrame.frameTimestamp,
          reason,
          confidence,
        })
      }
    }

    return cuts.slice(0, 20) // Ограничиваем количество предложений
  }

  /**
   * Генерация описания из анализа кадра
   */
  private generateDescriptionFromAnalysis(analysis: FrameAnalysis, params: FrameAnalysisParams): string {
    const objects = analysis.objects?.map((o) => o.class).join(", ") || "нет объектов"
    const composition = analysis.composition?.ruleOfThirds?.score > 0.7 ? "хорошая композиция" : "обычная композиция"
    const colors = analysis.colors?.temperature || "нейтральные цвета"

    let description = `На кадре: ${objects}. Композиция: ${composition}, цветовая гамма: ${colors}.`

    if (params.customPrompt) {
      description += ` ${params.customPrompt}`
    }

    return description
  }

  /**
   * Расчет уверенности из анализа
   */
  private calculateConfidenceFromAnalysis(analysis: FrameAnalysis): number {
    const objectConfidence =
      analysis.objects?.reduce((sum: number, obj) => sum + obj.confidence, 0) / (analysis.objects?.length || 1) || 0
    const qualityScore = (analysis.quality?.sharpness || 0) * 0.5 + (analysis.quality?.contrast || 0) * 0.5
    return Math.min(1, (objectConfidence + qualityScore) / 2)
  }

  /**
   * Извлечение тегов из анализа
   */
  private extractTagsFromAnalysis(analysis: FrameAnalysis, analysisType: MultimodalAnalysisType): string[] {
    const tags: string[] = []

    // Добавляем теги объектов
    if (analysis.objects) {
      tags.push(...analysis.objects.map((o) => o.class))
    }

    // Добавляем теги композиции
    if (analysis.composition?.ruleOfThirds?.score > 0.7) {
      tags.push("good_composition")
    }

    // Добавляем теги цвета
    if (analysis.colors?.temperature) {
      tags.push(analysis.colors.temperature)
    }

    // Добавляем тег типа анализа
    tags.push(analysisType)

    return [...new Set(tags)] // Убираем дубликаты
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0

    // Простое вычисление схожести на основе общих слов
    const words1 = text1
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
    const words2 = text2
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)

    if (words1.length === 0 || words2.length === 0) return 0

    const commonWords = words1.filter((word) => words2.includes(word))
    const similarity = (2 * commonWords.length) / (words1.length + words2.length)

    return similarity
  }

  private calculateAverageConfidence(frameResults: FrameAnalysisResult[]): number {
    if (frameResults.length === 0) return 0
    const total = frameResults.reduce((sum, r) => sum + r.confidence, 0)
    return total / frameResults.length
  }

  private extractDetectedLanguages(frameResults: FrameAnalysisResult[]): string[] {
    const languages = new Set<string>()
    frameResults.forEach((r) => {
      r.detectedText?.forEach((t) => {
        if (t.language) languages.add(t.language)
      })
    })
    return [...languages]
  }

  private extractEmotionalImpact(result: FrameAnalysisResult): number {
    if (!result.emotions || result.emotions.length === 0) return 0
    return result.emotions.reduce((max, e) => Math.max(max, e.confidence), 0)
  }

  private calculateVisualComplexity(result: FrameAnalysisResult): number {
    // Простая эвристика на основе количества объектов
    const objectCount = result.detectedObjects?.length || 0
    const textCount = result.detectedText?.length || 0
    return Math.min(10, objectCount * 0.5 + textCount * 0.3)
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}
