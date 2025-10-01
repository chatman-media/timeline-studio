/**
 * Инструменты Claude AI для мультимодального анализа видео с GPT-4V с использованием BaseAITool
 * Анализ кадров, создание описаний, выбор превью
 */

import type { MultimodalAnalysisType } from "@/domains/ai-services/services/vision"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

// Типы для операций мультимодального анализа
export interface MultimodalInput {
  operation:
    | "analyze_frame"
    | "analyze_video"
    | "suggest_thumbnails"
    | "detect_highlights"
    | "analyze_emotions"
    | "generate_description"
    | "analyze_audio_visual"
    | "moderate_content"
    | "analyze_scene_transitions"
    | "analyze_brand_elements"
  frameImagePath?: string
  clipId?: string
  analysisType?: MultimodalAnalysisType
  analysisTypes?: MultimodalAnalysisType[]
  customPrompt?: string
  detailLevel?: "low" | "medium" | "high"
  contextInfo?: any
  samplingRate?: number
  maxFrames?: number
  count?: number
  criteria?: string[]
  highlightTypes?: string[]
  descriptionLength?: "short" | "medium" | "long" | "custom"
  includeSpeech?: boolean
  contentCategories?: string[]
  checkContext?: boolean
  transitionTypes?: string[]
  brandElements?: any[]
}

export interface MultimodalResult {
  operation: string
  success: boolean
  analysis?: any
  suggestions?: any[]
  highlights?: any[]
  emotions?: any
  description?: string
  moderationResult?: any
  transitions?: any[]
  brandAnalysis?: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для мультимодального анализа с унифицированной обработкой ошибок
 */
export class MultimodalAnalysisTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("MultimodalAnalysisTool", logger)
  }

  /**
   * Анализ одного кадра с AI
   */
  private async analyzeFrameWithAI(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.frameImagePath) {
      throw new Error("Не указан путь к изображению кадра")
    }

    this.logger?.info("Анализ кадра с AI", { path: input.frameImagePath })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      const analysisResult = await service.analyzeFrame({
        frameImagePath: input.frameImagePath,
        analysisType: input.analysisType || "scene_understanding",
        customPrompt: input.customPrompt,
        detailLevel: input.detailLevel || "medium",
        contextInfo: input.contextInfo,
      })

      return {
        operation: input.operation,
        success: true,
        analysis: {
          description: analysisResult.description,
          objects: analysisResult.detectedObjects?.map((o) => o.name) || [],
          scenes: analysisResult.tags.filter((t) => t.includes("scene")),
          text: analysisResult.detectedText?.map((t) => t.text).join(" ") || "",
          confidence: analysisResult.confidence,
          aestheticScore: analysisResult.aestheticScore,
          emotions: analysisResult.emotions,
        },
        message: "Анализ кадра завершен",
        recommendations: this.generateFrameRecommendations(analysisResult),
      }
    } catch (error) {
      throw new Error(`Ошибка анализа кадра: ${error}`)
    }
  }

  /**
   * Комплексный анализ видео
   */
  private async analyzeVideoContent(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Комплексный анализ видео", { clipId: input.clipId })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      const videoResult = await service.analyzeVideo({
        clipId: input.clipId,
        analysisTypes: input.analysisTypes || ["scene_understanding", "object_detection"],
        samplingRate: input.samplingRate || 1,
        maxFrames: input.maxFrames || 20,
        contextInfo: input.contextInfo,
      })

      return {
        operation: input.operation,
        success: true,
        analysis: {
          scenes: videoResult.summary.mainSubjects,
          objects: this.extractUniqueObjects(videoResult.frameResults),
          emotions: this.extractUniqueEmotions(videoResult.frameResults),
          keyframes: videoResult.summary.keyMoments.map((m) => m.timestamp),
          summary: videoResult.summary,
          frameCount: videoResult.metadata.totalFramesAnalyzed,
          confidence: videoResult.metadata.averageConfidence,
        },
        message: `Анализ видео завершен. Проанализировано ${videoResult.metadata.totalFramesAnalyzed} кадров`,
        recommendations: this.generateVideoRecommendations(videoResult),
      }
    } catch (error) {
      throw new Error(`Ошибка анализа видео: ${error}`)
    }
  }

  /**
   * Предложение превью для видео
   */
  private async suggestVideoThumbnails(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Поиск лучших кадров для превью", { clipId: input.clipId })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      const suggestions = await service.suggestThumbnails({
        clipId: input.clipId,
        count: input.count || 5,
        criteria: (input.criteria ?? ["aesthetic", "faces", "emotion"]) as Array<
          "aesthetic" | "emotion" | "action" | "text" | "faces"
        >,
        contextPrompt: input.customPrompt,
      })

      return {
        operation: input.operation,
        success: true,
        suggestions: suggestions.map((s) => ({
          timestamp: s.frameTimestamp,
          framePath: s.frameImagePath,
          score: s.score,
          reason: s.reasons.join(", "),
          aestheticScore: s.aestheticScore,
          emotionalImpact: s.emotionalImpact,
          hasText: !!s.textContent,
        })),
        message: `Найдено ${suggestions.length} кандидатов для превью`,
        recommendations: [
          "Используйте кадр с наивысшим рейтингом",
          suggestions[0] && suggestions[0].emotionalImpact > 0.7
            ? "Первый кадр имеет высокое эмоциональное воздействие"
            : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка поиска превью: ${error}`)
    }
  }

  /**
   * Обнаружение ключевых моментов
   */
  private async detectVideoHighlights(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Обнаружение ключевых моментов", { clipId: input.clipId })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      // Анализируем видео для поиска ключевых моментов
      const videoResult = await service.analyzeVideo({
        clipId: input.clipId,
        analysisTypes: ["highlight_detection", "emotion_analysis", "action_recognition"],
        samplingRate: input.samplingRate || 0.5,
        maxFrames: input.maxFrames || 50,
      })

      // Фильтруем ключевые моменты
      const highlights = videoResult.summary.keyMoments
        .filter((m) => m.importance > 0.7)
        .map((m) => ({
          timestamp: m.timestamp,
          importance: m.importance,
          description: m.description,
          type: this.determineHighlightType(m.description),
        }))

      return {
        operation: input.operation,
        success: true,
        highlights,
        message: `Обнаружено ${highlights.length} ключевых моментов`,
        recommendations: [
          highlights.length > 0
            ? "Используйте эти моменты для создания трейлера"
            : "Попробуйте уменьшить порог важности",
          highlights.filter((h) => h.type === "emotional").length > 0 ? "Обнаружены эмоциональные моменты" : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка обнаружения ключевых моментов: ${error}`)
    }
  }

  /**
   * Анализ эмоций
   */
  private async analyzeEmotions(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId && !input.frameImagePath) {
      throw new Error("Не указан источник для анализа")
    }

    this.logger?.info("Анализ эмоций")

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      if (input.frameImagePath) {
        // Анализ одного кадра
        const frameResult = await service.analyzeFrame({
          frameImagePath: input.frameImagePath,
          analysisType: "emotion_analysis",
          detailLevel: "high",
        })

        return {
          operation: input.operation,
          success: true,
          emotions: {
            emotions: frameResult.emotions || [],
            dominantEmotion: frameResult.emotions?.[0]?.emotion || "neutral",
            confidence: frameResult.emotions?.[0]?.confidence || 0,
          },
          message: "Анализ эмоций завершен",
          recommendations: [],
        }
      }
      // Анализ видео
      const videoResult = await service.analyzeVideo({
        clipId: input.clipId!,
        analysisTypes: ["emotion_analysis"],
        samplingRate: input.samplingRate || 1,
        maxFrames: input.maxFrames || 30,
      })

      const emotionStats = this.calculateEmotionStatistics(videoResult.frameResults)

      return {
        operation: input.operation,
        success: true,
        emotions: {
          timeline: videoResult.frameResults.map((f) => ({
            timestamp: f.frameTimestamp,
            emotions: f.emotions || [],
            dominant: f.emotions?.[0]?.emotion || "neutral",
          })),
          statistics: emotionStats,
          overallMood: videoResult.summary.overallMood,
        },
        message: `Анализ эмоций завершен. Общее настроение: ${videoResult.summary.overallMood}`,
        recommendations: this.generateEmotionRecommendations(emotionStats),
      }
    } catch (error) {
      throw new Error(`Ошибка анализа эмоций: ${error}`)
    }
  }

  /**
   * Генерация описания видео
   */
  private async generateVideoDescription(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Генерация описания видео", { clipId: input.clipId })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      // Анализируем видео для генерации описания
      const videoResult = await service.analyzeVideo({
        clipId: input.clipId,
        analysisTypes: ["scene_understanding", "object_detection", "action_recognition"],
        samplingRate: 2, // Каждые 2 секунды
        maxFrames: 15,
        contextInfo: input.contextInfo,
      })

      const descriptionLength = input.descriptionLength || "medium"
      const description = this.generateDescriptionFromAnalysis(videoResult, descriptionLength)

      return {
        operation: input.operation,
        success: true,
        description,
        message: "Описание видео сгенерировано",
        recommendations: [
          "Проверьте описание на точность",
          descriptionLength === "short" ? "Рассмотрите расширенное описание для деталей" : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка генерации описания: ${error}`)
    }
  }

  /**
   * Анализ аудио-визуальной синхронизации
   */
  private async analyzeAudioVisualSync(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Анализ аудио-визуальной синхронизации", { clipId: input.clipId })

    try {
      // Пока используем базовый анализ
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      const videoResult = await service.analyzeVideo({
        clipId: input.clipId,
        analysisTypes: ["action_recognition", "emotion_analysis"],
        samplingRate: 0.5,
        maxFrames: 30,
      })

      // Проверяем соответствие действий и эмоций
      const syncIssues = this.detectSyncIssues(videoResult.frameResults)

      return {
        operation: input.operation,
        success: true,
        analysis: {
          syncScore: 100 - syncIssues.length * 10,
          issues: syncIssues,
          recommendations: syncIssues.map((issue) => `На ${issue.timestamp}с: ${issue.description}`),
        },
        message:
          syncIssues.length === 0
            ? "Аудио и видео хорошо синхронизированы"
            : `Обнаружено ${syncIssues.length} проблем с синхронизацией`,
        recommendations: [
          syncIssues.length > 0 ? "Проверьте синхронизацию аудио дорожек" : "",
          input.includeSpeech ? "Рекомендуется проверить синхронизацию речи" : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка анализа синхронизации: ${error}`)
    }
  }

  /**
   * Модерация контента
   */
  private async moderateContent(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId && !input.frameImagePath) {
      throw new Error("Не указан источник для модерации")
    }

    this.logger?.info("Модерация контента")

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      if (input.frameImagePath) {
        // Модерация одного кадра
        const frameResult = await service.analyzeFrame({
          frameImagePath: input.frameImagePath,
          analysisType: "content_moderation",
          detailLevel: "high",
        })

        const isSafe = frameResult.confidence < 0.3 // Низкая уверенность = безопасно

        return {
          operation: input.operation,
          success: true,
          moderationResult: {
            safe: isSafe,
            issues: frameResult.tags,
            confidence: frameResult.confidence,
            categories: input.contentCategories || ["violence", "adult", "explicit"],
          },
          message: isSafe ? "Контент безопасен" : "Обнаружены проблемы с контентом",
          recommendations: isSafe ? [] : ["Проверьте контент вручную"],
          warnings: isSafe ? undefined : frameResult.tags,
        }
      }
      // Модерация видео
      const videoResult = await service.analyzeVideo({
        clipId: input.clipId!,
        analysisTypes: ["content_moderation"],
        samplingRate: 1,
        maxFrames: 20,
      })

      const problematicFrames = videoResult.frameResults.filter((f) => f.confidence > 0.5)
      const isSafe = problematicFrames.length === 0

      return {
        operation: input.operation,
        success: true,
        moderationResult: {
          safe: isSafe,
          problematicTimestamps: problematicFrames.map((f) => f.frameTimestamp),
          issues: [...new Set(problematicFrames.flatMap((f) => f.tags))],
          overallScore: 100 - (problematicFrames.length / videoResult.frameResults.length) * 100,
        },
        message: isSafe ? "Видео прошло модерацию" : `Обнаружено ${problematicFrames.length} проблемных кадров`,
        recommendations: isSafe ? [] : ["Проверьте проблемные моменты", "Рассмотрите редактирование или размытие"],
        warnings: isSafe
          ? undefined
          : [`Найдены проблемы: ${[...new Set(problematicFrames.flatMap((f) => f.tags))].join(", ")}`],
      }
    } catch (error) {
      throw new Error(`Ошибка модерации контента: ${error}`)
    }
  }

  /**
   * Анализ переходов сцен
   */
  private async analyzeSceneTransitions(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Анализ переходов сцен", { clipId: input.clipId })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      const videoResult = await service.analyzeVideo({
        clipId: input.clipId,
        analysisTypes: ["scene_understanding"],
        samplingRate: 0.2, // Каждые 0.2 секунды
        maxFrames: 100,
      })

      // Обнаруживаем переходы на основе существенных рекомендаций монтажа
      const transitions = videoResult.summary.suggestedCuts.map((cut) => ({
        startTime: cut.startTime,
        endTime: cut.endTime,
        type: this.classifyTransitionType(cut.reason),
        confidence: cut.confidence,
        description: cut.reason,
      }))

      return {
        operation: input.operation,
        success: true,
        transitions,
        message: `Обнаружено ${transitions.length} переходов сцен`,
        recommendations: [
          transitions.length > 10 ? "Много переходов, рассмотрите упрощение монтажа" : "",
          transitions.some((t) => t.type === "abrupt") ? "Обнаружены резкие переходы" : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка анализа переходов: ${error}`)
    }
  }

  /**
   * Анализ брендовых элементов
   */
  private async analyzeBrandElements(input: MultimodalInput): Promise<MultimodalResult> {
    if (!input.clipId) {
      throw new Error("Не указан ID клипа")
    }

    this.logger?.info("Анализ брендовых элементов", { clipId: input.clipId })

    try {
      const { MultimodalAnalysisService } = await import("@/domains/ai-services/services/vision")
      const service = MultimodalAnalysisService.getInstance()

      const videoResult = await service.analyzeVideo({
        clipId: input.clipId,
        analysisTypes: ["text_recognition", "object_detection"],
        samplingRate: 1,
        maxFrames: 30,
      })

      // Ищем брендовые элементы
      const brandElements = this.extractBrandElements(videoResult.frameResults, input.brandElements)

      return {
        operation: input.operation,
        success: true,
        brandAnalysis: {
          detectedBrands: brandElements.brands,
          logos: brandElements.logos,
          textMentions: brandElements.textMentions,
          colorScheme: brandElements.colorScheme,
          consistency: brandElements.consistencyScore,
        },
        message: `Обнаружено ${brandElements.brands.length} брендовых элементов`,
        recommendations: [
          brandElements.consistencyScore < 0.7 ? "Низкая согласованность брендинга" : "",
          brandElements.logos.length === 0 ? "Логотипы не обнаружены, рассмотрите добавление" : "",
        ].filter(Boolean),
      }
    } catch (error) {
      throw new Error(`Ошибка анализа брендов: ${error}`)
    }
  }

  /**
   * Вспомогательные методы
   */
  private generateFrameRecommendations(result: any): string[] {
    const recommendations: string[] = []

    if (result.aestheticScore?.overall > 8) {
      recommendations.push("Отличный кадр для превью")
    }
    if (result.detectedObjects?.length > 5) {
      recommendations.push("Кадр перегружен объектами")
    }
    if (result.detectedText?.length > 0) {
      recommendations.push("Обнаружен текст, проверьте читаемость")
    }

    return recommendations
  }

  private generateVideoRecommendations(result: any): string[] {
    const recommendations: string[] = []

    if (result.summary.suggestedCuts.length > 10) {
      recommendations.push("Много потенциальных точек монтажа")
    }
    if (result.summary.aestheticHighlights.length > 0) {
      recommendations.push("Обнаружены эстетически привлекательные моменты")
    }
    if (result.metadata.averageConfidence < 0.7) {
      recommendations.push("Низкая уверенность анализа, проверьте качество видео")
    }

    return recommendations
  }

  private extractUniqueObjects(frameResults: any[]): string[] {
    const objects = new Set<string>()
    frameResults.forEach((result) => {
      result.detectedObjects?.forEach((obj: any) => objects.add(obj.name))
    })
    return Array.from(objects)
  }

  private extractUniqueEmotions(frameResults: any[]): string[] {
    const emotions = new Set<string>()
    frameResults.forEach((result) => {
      result.emotions?.forEach((emotion: any) => emotions.add(emotion.emotion))
    })
    return Array.from(emotions)
  }

  private determineHighlightType(description: string): string {
    const lower = description.toLowerCase()
    if (lower.includes("эмоц") || lower.includes("emotion")) return "emotional"
    if (lower.includes("действ") || lower.includes("action")) return "action"
    if (lower.includes("композиц") || lower.includes("composition")) return "visual"
    return "general"
  }

  private calculateEmotionStatistics(frameResults: any[]): any {
    const emotionCounts: Record<string, number> = {}
    let totalEmotions = 0

    frameResults.forEach((result) => {
      result.emotions?.forEach((emotion: any) => {
        emotionCounts[emotion.emotion] = (emotionCounts[emotion.emotion] || 0) + 1
        totalEmotions++
      })
    })

    const emotionPercentages: Record<string, number> = {}
    Object.entries(emotionCounts).forEach(([emotion, count]) => {
      emotionPercentages[emotion] = (count / totalEmotions) * 100
    })

    return {
      counts: emotionCounts,
      percentages: emotionPercentages,
      dominant: Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral",
    }
  }

  private generateEmotionRecommendations(stats: any): string[] {
    const recommendations: string[] = []

    if (stats.percentages.negative > 30) {
      recommendations.push("Высокий уровень негативных эмоций")
    }
    if (!stats.counts.positive && !stats.counts.happy) {
      recommendations.push("Отсутствуют позитивные эмоции")
    }

    return recommendations
  }

  private generateDescriptionFromAnalysis(videoResult: any, length: string): string {
    const { summary } = videoResult

    let description = ""

    if (length === "short") {
      description = `Видео содержит: ${summary.mainSubjects.slice(0, 3).join(", ")}. Общее настроение: ${summary.overallMood}.`
    } else if (length === "medium") {
      description = `Видео представляет ${summary.mainSubjects.join(", ")}. `
      description += `Общая атмосфера - ${summary.overallMood}. `
      description += `Ключевые моменты: ${summary.keyMoments
        .slice(0, 3)
        .map((m: any) => m.description)
        .join("; ")}.`
    } else {
      description = "Подробное описание видео:\n\n"
      description += `Основные элементы: ${summary.mainSubjects.join(", ")}\n`
      description += `Настроение: ${summary.overallMood}\n\n`
      description += "Ключевые моменты:\n"
      summary.keyMoments.forEach((moment: any) => {
        description += `- ${moment.timestamp}с: ${moment.description}\n`
      })
    }

    return description
  }

  private detectSyncIssues(frameResults: any[]): Array<{ timestamp: number; description: string }> {
    const issues: Array<{ timestamp: number; description: string }> = []

    // Простая эвристика: ищем резкие изменения эмоций без соответствующих действий
    for (let i = 1; i < frameResults.length; i++) {
      const prev = frameResults[i - 1]
      const current = frameResults[i]

      if (prev.emotions?.[0]?.emotion !== current.emotions?.[0]?.emotion) {
        const hasActionChange = prev.tags?.some((t: string) => current.tags?.includes(t))

        if (!hasActionChange) {
          issues.push({
            timestamp: current.frameTimestamp,
            description: "Изменение эмоций без соответствующих действий",
          })
        }
      }
    }

    return issues
  }

  private classifyTransitionType(reason: string): string {
    const lower = reason.toLowerCase()
    if (lower.includes("значительное") || lower.includes("significant")) return "abrupt"
    if (lower.includes("эмоцион") || lower.includes("emotion")) return "emotional"
    if (lower.includes("объект") || lower.includes("object")) return "content"
    return "smooth"
  }

  private extractBrandElements(frameResults: any[], targetBrands?: any[]): any {
    const brands = new Set<string>()
    const logos: Array<{ timestamp: number; brand: string }> = []
    const textMentions: Array<{ timestamp: number; text: string }> = []
    const colors: string[] = []

    frameResults.forEach((result) => {
      // Ищем текстовые упоминания брендов
      result.detectedText?.forEach((text: any) => {
        if (targetBrands?.some((brand) => text.text.toLowerCase().includes(brand.toLowerCase()))) {
          brands.add(text.text)
          textMentions.push({
            timestamp: result.frameTimestamp,
            text: text.text,
          })
        }
      })

      // Ищем логотипы в объектах
      result.detectedObjects?.forEach((obj: any) => {
        if (
          obj.name.includes("logo") ||
          targetBrands?.some((brand) => obj.name.toLowerCase().includes(brand.toLowerCase()))
        ) {
          brands.add(obj.name)
          logos.push({
            timestamp: result.frameTimestamp,
            brand: obj.name,
          })
        }
      })
    })

    // Оцениваем согласованность
    const consistencyScore =
      logos.length > 0 || textMentions.length > 0
        ? Math.min(1, (logos.length + textMentions.length) / frameResults.length)
        : 0

    return {
      brands: Array.from(brands),
      logos,
      textMentions,
      colorScheme: colors,
      consistencyScore,
    }
  }

  /**
   * Выполняет мультимодальный анализ
   */
  public async analyzeMultimodal(
    input: MultimodalInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<MultimodalResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        const validOperations = [
          "analyze_frame",
          "analyze_video",
          "suggest_thumbnails",
          "detect_highlights",
          "analyze_emotions",
          "generate_description",
          "analyze_audio_visual",
          "moderate_content",
          "analyze_scene_transitions",
          "analyze_brand_elements",
        ]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      let result: MultimodalResult

      switch (input.operation) {
        case "analyze_frame":
          result = await this.analyzeFrameWithAI(input)
          break

        case "analyze_video":
          result = await this.analyzeVideoContent(input)
          break

        case "suggest_thumbnails":
          result = await this.suggestVideoThumbnails(input)
          break

        case "detect_highlights":
          result = await this.detectVideoHighlights(input)
          break

        case "analyze_emotions":
          result = await this.analyzeEmotions(input)
          break

        case "generate_description":
          result = await this.generateVideoDescription(input)
          break

        case "analyze_audio_visual":
          result = await this.analyzeAudioVisualSync(input)
          break

        case "moderate_content":
          result = await this.moderateContent(input)
          break

        case "analyze_scene_transitions":
          result = await this.analyzeSceneTransitions(input)
          break

        case "analyze_brand_elements":
          result = await this.analyzeBrandElements(input)
          break

        default:
          result = {
            operation: input.operation,
            success: false,
            message: `Неподдерживаемая операция: ${input.operation}`,
            recommendations: ["Проверьте название операции"],
          }
          break
      }

      return result
    }, options)
  }
}

// Создаем singleton экземпляр
const multimodalAnalysisTool = new MultimodalAnalysisTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executeMultimodalAnalysisTool(
  operation: MultimodalInput["operation"],
  params: Omit<MultimodalInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<MultimodalResult>> {
  return multimodalAnalysisTool.analyzeMultimodal({ operation, ...params }, options)
}

// Экспорт для обратной совместимости
export const multimodalAnalysisTools: any[] = [
  {
    name: "analyze_frame_with_ai",
    description: "Анализирует отдельный кадр видео с помощью GPT-4 Vision для понимания контента",
    input_schema: {
      type: "object",
      properties: {
        frameImagePath: {
          type: "string",
          description: "Путь к изображению кадра для анализа",
        },
        analysisType: {
          type: "string",
          enum: ["scene_understanding", "object_detection", "text_recognition", "emotion_analysis", "visual_quality"],
          description: "Тип анализа для выполнения",
        },
        customPrompt: {
          type: "string",
          description: "Дополнительный промпт для анализа",
        },
        detailLevel: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Уровень детализации анализа",
          default: "medium",
        },
      },
      required: ["frameImagePath", "analysisType"],
    },
  },

  {
    name: "analyze_video_content",
    description: "Комплексный анализ видео с использованием мультимодального AI для понимания контента",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа",
        },
        analysisTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["scene_understanding", "object_detection", "text_recognition", "emotion_analysis", "visual_quality"],
          },
          description: "Типы анализа для выполнения",
          default: ["scene_understanding"],
        },
        samplingRate: {
          type: "number",
          description: "Частота взятия кадров (кадр каждые N секунд)",
          minimum: 0.5,
          maximum: 30,
          default: 1,
        },
        maxFrames: {
          type: "number",
          description: "Максимальное количество кадров для анализа",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      required: ["clipId"],
    },
  },

  {
    name: "suggest_video_thumbnails",
    description: "Предлагает лучшие кадры для использования в качестве превью видео",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа",
        },
        count: {
          type: "number",
          description: "Количество предложений превью",
          minimum: 1,
          maximum: 10,
          default: 3,
        },
        criteria: {
          type: "array",
          items: {
            type: "string",
            enum: ["face_clarity", "visual_interest", "composition", "lighting", "emotion_expression"],
          },
          description: "Критерии для выбора превью",
          default: ["face_clarity", "visual_interest", "composition"],
        },
      },
      required: ["clipId"],
    },
  },
]

export default multimodalAnalysisTools
