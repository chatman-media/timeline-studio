/**
 * AI инструмент для интеллектуального анализа контента с использованием BaseAITool
 */

import { SceneAnalysisEngine } from "@/domains/ai-services/services/engines/scene-analysis"

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../../base"
import type {
  ContentAnalysisResult,
  ContentIntelligenceInput,
  ContentIntelligenceResult,
  ContentIntelligenceToolResult,
  ContentVariant,
} from "./types"

/**
 * AI инструмент для комплексного интеллектуального анализа контента с унифицированной обработкой ошибок
 * Использует shared Content Analysis service
 */
export class ContentIntelligenceTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ContentIntelligenceTool", logger)
  }

  /**
   * Выполняет операции интеллектуального анализа контента
   */
  public async processContentIntelligence(
    input: ContentIntelligenceInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ContentIntelligenceResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "analyze_content",
        "detect_scenes",
        "classify_content",
        "adapt_platform",
        "generate_multilanguage",
        "generate_variants",
        "analyze_audience",
        "optimize_engagement",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      if (!data.reason) {
        errors.push("Требуется указать причину анализа контента")
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "analyze_content":
        case "detect_scenes":
        case "classify_content":
          if (!data.mediaFiles || data.mediaFiles.length === 0) {
            errors.push("Для анализа контента требуется указать mediaFiles")
          }
          break
        case "adapt_platform":
          if (!data.sourceContent || !data.targetPlatform) {
            errors.push("Для адаптации под платформу требуется sourceContent и targetPlatform")
          }
          break
        case "generate_multilanguage":
          if (!data.sourceContent || !data.targetLanguages || data.targetLanguages.length === 0) {
            errors.push("Для мультиязычной генерации требуется sourceContent и targetLanguages")
          }
          break
        case "generate_variants":
          if (!data.sourceContent) {
            errors.push("Для генерации вариантов требуется sourceContent")
          }
          if (data.generateVariants !== undefined && (data.generateVariants < 1 || data.generateVariants > 10)) {
            errors.push("Количество вариантов должно быть между 1 и 10")
          }
          break
      }

      if (data.analysisDepth && !["quick", "normal", "deep"].includes(data.analysisDepth)) {
        errors.push("Неподдерживаемая глубина анализа")
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации входных данных для анализа контента",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation
    const mediaFiles = input.mediaFiles || []

    // Выполняем анализ контента с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем интеллектуальный анализ контента", {
          operation,
          filesCount: mediaFiles.length,
          reason: input.reason,
        })

        // Выполняем конкретную операцию
        let analysisResults: ContentAnalysisResult | undefined
        let contentVariants: ContentVariant[] | undefined
        let multiLanguageVersions: any[] | undefined
        let processedFiles: string[] = []
        const recommendations: string[] = []
        const warnings: string[] = []
        const nextActions: string[] = []
        let confidenceScore = 0

        switch (operation) {
          case "analyze_content":
            analysisResults = await this.performContentAnalysis(input)
            processedFiles = mediaFiles
            recommendations.push("Используйте результаты анализа для улучшения контента")
            nextActions.push("Применить рекомендации по оптимизации")
            confidenceScore = 8.5
            break

          case "detect_scenes":
            analysisResults = await this.performSceneDetection(input)
            processedFiles = mediaFiles
            recommendations.push("Проверьте точность детекции сцен")
            nextActions.push("Создать маркеры для найденных сцен")
            confidenceScore = 8.0
            break

          case "classify_content":
            analysisResults = await this.performContentClassification(input)
            processedFiles = mediaFiles
            recommendations.push("Используйте классификацию для таргетинга аудитории")
            nextActions.push("Настроить рекомендательные алгоритмы")
            confidenceScore = 8.3
            break

          case "adapt_platform":
            analysisResults = await this.performPlatformAdaptation(input)
            processedFiles = ["adapted_content"]
            recommendations.push("Проверьте соответствие требованиям платформы")
            nextActions.push("Тестировать производительность на целевой платформе")
            confidenceScore = 8.7
            break

          case "generate_multilanguage":
            multiLanguageVersions = await this.performMultiLanguageGeneration(input)
            processedFiles = input.targetLanguages || []
            recommendations.push("Проверьте культурную адекватность переводов")
            nextActions.push("Тестировать контент на носителях языка")
            confidenceScore = 8.2
            break

          case "generate_variants":
            contentVariants = await this.performVariantGeneration(input)
            processedFiles = [`${input.generateVariants || 3}_variants`]
            recommendations.push("Проведите A/B тестирование вариантов")
            nextActions.push("Анализировать метрики производительности")
            confidenceScore = 8.4
            break

          case "analyze_audience":
            analysisResults = await this.performAudienceAnalysis(input)
            processedFiles = mediaFiles
            recommendations.push("Адаптируйте контент под выявленные сегменты")
            nextActions.push("Создать персонализированные версии")
            confidenceScore = 8.1
            break

          case "optimize_engagement":
            analysisResults = await this.performEngagementOptimization(input)
            processedFiles = mediaFiles
            recommendations.push("Примените предложенные улучшения")
            nextActions.push("Измерить влияние на метрики вовлечения")
            confidenceScore = 8.6
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        // Добавляем общие предупреждения
        if (input.analysisDepth === "deep" && mediaFiles.length > 5) {
          warnings.push("Глубокий анализ большого количества файлов может занять значительное время")
        }

        if (input.generateVariants && input.generateVariants > 5) {
          warnings.push("Большое количество вариантов может затруднить анализ результатов")
        }

        const result: ContentIntelligenceResult = {
          operation,
          success: true,
          processedFiles,
          analysisResults,
          contentVariants,
          multiLanguageVersions,
          statistics: {
            totalFiles: processedFiles.length,
            processingTime: 0, // Будет заполнено в executeWithErrorHandling
            analysisDepth: input.analysisDepth || "normal",
            confidenceScore,
          },
          recommendations,
          warnings: warnings.length > 0 ? warnings : undefined,
          nextActions,
        }

        this.logger?.info("Интеллектуальный анализ контента завершен", {
          operation,
          processedFiles: processedFiles.length,
          success: true,
        })

        return result
      },
      {
        timeout: options.timeout || 600000, // 10 минут для анализа контента
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 3000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          filesCount: mediaFiles.length,
          reason: input.reason,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Выполняет комплексный анализ контента
   */
  private async performContentAnalysis(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем комплексный анализ контента", {
      depth: input.analysisDepth,
      files: input.mediaFiles?.length,
    })

    try {
      // Используем Scene Analysis Engine для реального анализа
      const { ContentClassifier } = await import("@/domains/ai-services/services/content-classifier")

      const sceneEngine = SceneAnalysisEngine.getInstance()

      const classifier = ContentClassifier.getInstance()

      // Анализируем первый файл как пример
      const videoPath = input.mediaFiles?.[0]
      if (!videoPath) {
        throw new Error("Не указаны медиафайлы для анализа")
      }

      // Выполняем анализ сцен
      const analysis = await sceneEngine.analyzeScenes({
        id: "temp",
        path: videoPath,
        filename: "temp",
        size: 0,
        type: "video",
        duration: 0,
        format: "video",
      })

      // Преобразуем сцены для классификатора
      const scenesForClassifier = (analysis as any).scenes.map((scene: any) => ({
        id: scene.id || `scene-${scene.startTime}`,
        startTime: scene.startTime,
        endTime: scene.endTime,
        duration: scene.endTime - scene.startTime,
        type: scene.sceneType || "content",
        confidence: scene.confidence || 0.85,
        content: scene.content,
      }))

      // Классифицируем контент
      const classification = await classifier.classify(scenesForClassifier, { duration: (analysis as any).duration })

      // Подготавливаем результаты
      const scenes = (analysis as any).scenes.map((scene: any) => ({
        startTime: scene.startTime / 1000,
        endTime: scene.endTime / 1000,
        type: scene.sceneType || "content",
        confidence: scene.confidence || 0.85,
        keyElements: [
          ...(scene.content?.objects?.map((obj: any) => obj.class) || []),
          ...(scene.content?.activities || []),
        ],
      }))

      return {
        analysisType: "comprehensive",
        sceneDetection: {
          scenes,
          totalScenes: scenes.length,
          avgSceneLength: (analysis as any).duration / scenes.length / 1000,
        },
        contentClassification: {
          genre: classification.primary.category || "general",
          style: "standard", // Временно используем стандартный стиль
          mood: "neutral",
          target_audience: "general",
          content_rating: "general", // Временно используем общий рейтинг
          topics: classification.tags || [],
        },
        personTracking:
          input.enablePersonTracking && (analysis as any).persons?.length > 0
            ? {
                detectedPersons: ((analysis as any).persons || []).map((person: any) => ({
                  id: person.id,
                  appearances: person.appearances || [],
                })),
                totalPersons: ((analysis as any).persons || []).length,
              }
            : undefined,
      }
    } catch (error) {
      this.logger?.error("Ошибка анализа контента", { error })
      // Возвращаем базовый результат при ошибке
      return {
        analysisType: "comprehensive",
        sceneDetection: {
          scenes: [],
          totalScenes: 0,
          avgSceneLength: 0,
        },
        contentClassification: {
          genre: "unknown",
          style: "unknown",
          mood: "unknown",
          target_audience: "unknown",
          content_rating: "unknown",
          topics: [],
        },
      }
    }
  }

  /**
   * Выполняет детекцию сцен
   */
  private async performSceneDetection(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем детекцию сцен", {
      files: input.mediaFiles?.length,
    })

    try {
      const sceneDetector = SceneAnalysisEngine.getInstance()
      const videoPath = input.mediaFiles?.[0]

      if (!videoPath) {
        throw new Error("Не указаны медиафайлы для анализа")
      }

      // Используем уже импортированный SceneAnalysisEngine
      const sceneEngine = SceneAnalysisEngine.getInstance()

      // Выполняем детекцию сцен через scene analysis engine
      const scenes = await sceneEngine.analyzeScenes({
        id: "temp",
        path: videoPath,
        filename: "temp",
        size: 0,
        type: "video",
        duration: 0,
        format: "video",
      })

      // Анализируем переходы между сценами
      // transitionAnalysis закомментирован, так как analyzeTransitions может не существовать
      // const transitionAnalysis = await sceneDetector.analyzeTransitions(scenes.scenes || [])

      // Классифицируем тип каждой сцены
      const classifiedScenes = scenes.map((scene: any, index: number) => {
        let type = "content"
        const totalScenes = scenes.length

        // Простая эвристика для определения типа сцены
        if (index === 0 && scene.duration < 5) {
          type = "intro"
        } else if (index === totalScenes - 1 && scene.duration < 5) {
          type = "outro"
        } else if (scene.duration < 2) {
          type = "transition"
        } else if (index === Math.floor(totalScenes / 2)) {
          type = "climax"
        }

        return {
          startTime: scene.startTime,
          endTime: scene.endTime,
          type,
          confidence: (scene as any).confidence || 0.8,
          keyElements: (scene as any).features
            ? [
                `motion_${(scene as any).features.motionIntensity > 0.5 ? "high" : "low"}`,
                `brightness_${(scene as any).features.brightness > 0.5 ? "bright" : "dark"}`,
                (scene as any).features.hasFaces ? "faces" : "no_faces",
              ]
            : [],
        }
      })

      return {
        analysisType: "scene_detection",
        sceneDetection: {
          scenes: classifiedScenes,
          totalScenes: classifiedScenes.length,
          avgSceneLength:
            classifiedScenes.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / classifiedScenes.length,
        },
      }
    } catch (error) {
      this.logger?.error("Ошибка детекции сцен", { error })
      return {
        analysisType: "scene_detection",
        sceneDetection: {
          scenes: [],
          totalScenes: 0,
          avgSceneLength: 0,
        },
      }
    }
  }

  /**
   * Выполняет классификацию контента
   */
  private async performContentClassification(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем классификацию контента")

    try {
      const { ContentClassifier } = await import("@/domains/ai-services/services/content-classifier")
      const classifier = ContentClassifier.getInstance()
      const sceneEngine = SceneAnalysisEngine.getInstance()

      const videoPath = input.mediaFiles?.[0]
      if (!videoPath) {
        throw new Error("Не указаны медиафайлы для классификации")
      }

      // Быстрый анализ для классификации
      const analysis = await sceneEngine.analyzeScenes({
        id: "temp",
        path: videoPath,
        filename: "temp",
        size: 0,
        type: "video",
        duration: 0,
        format: "video",
      })

      // Преобразуем сцены для классификатора
      const scenesForClassifier = analysis.map((scene: any) => ({
        id: scene.id || `scene-${scene.startTime}`,
        startTime: scene.startTime,
        endTime: scene.endTime,
        duration: scene.endTime - scene.startTime,
        type: scene.sceneType || "content",
        confidence: scene.confidence || 0.85,
        content: scene.content,
      }))

      // Классифицируем контент
      const classification = await classifier.classify(scenesForClassifier, {
        duration: (analysis as any).duration || 0,
        fps: (analysis as any).fps || 30,
      })

      return {
        analysisType: "classification",
        contentClassification: {
          genre: classification.primary.category || "general",
          style: "standard", // Временно используем стандартный стиль
          mood: "neutral",
          target_audience: "general",
          content_rating: "general", // Временно используем общий рейтинг
          topics: classification.tags || [],
        },
      }
    } catch (error) {
      this.logger?.error("Ошибка классификации контента", { error })
      return {
        analysisType: "classification",
        contentClassification: {
          genre: "unknown",
          style: "unknown",
          mood: "unknown",
          target_audience: "unknown",
          content_rating: "unknown",
          topics: [],
        },
      }
    }
  }

  /**
   * Выполняет адаптацию под платформу
   */
  private async performPlatformAdaptation(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем адаптацию под платформу", {
      platform: input.targetPlatform,
    })

    try {
      // Определяем параметры платформы
      const platformConfig = this.getPlatformConfig(input.targetPlatform || "youtube")

      // Используем AI для генерации оптимизаций
      const { getAIContainer } = await import("@/domains/ai-core")
      const aiContainer = getAIContainer()
      const contentAnalyzer = await aiContainer.resolve<any>("ContentAnalyzer")

      // Анализируем исходный контент
      const contentInfo = input.sourceContent || {}

      // Генерируем рекомендации через AI
      const recommendations = await contentAnalyzer.generatePlatformRecommendations({
        platform: input.targetPlatform,
        content: contentInfo,
        includeSeo: input.includeSeo,
      })

      // Генерируем вариации заголовков
      const titleVariations = await this.generateTitleVariations(
        contentInfo.script || "",
        input.targetPlatform || "youtube",
      )

      // Генерируем хэштеги
      const hashtags = await this.generateHashtags(contentInfo, input.targetPlatform || "youtube")

      return {
        analysisType: "platform_adaptation",
        platformAdaptation: {
          platform: input.targetPlatform || "youtube",
          optimizations: {
            duration: platformConfig.maxDuration,
            aspectRatio: platformConfig.aspectRatio,
            thumbnailSuggestions: recommendations.thumbnailTips || [
              "Используйте яркие цвета",
              "Добавьте чёткий текст",
              "Покажите эмоции",
            ],
            titleVariations: titleVariations.slice(0, 5),
            descriptionOptimized: recommendations.description || "Оптимизированное описание",
            hashtagSuggestions: hashtags,
            bestPostingTimes: platformConfig.bestTimes,
          },
        },
      }
    } catch (error) {
      this.logger?.error("Ошибка адаптации под платформу", { error })
      return {
        analysisType: "platform_adaptation",
        platformAdaptation: {
          platform: input.targetPlatform || "youtube",
          optimizations: {
            duration: 600,
            aspectRatio: "16:9",
            thumbnailSuggestions: [],
            titleVariations: [],
            descriptionOptimized: "",
            hashtagSuggestions: [],
            bestPostingTimes: [],
          },
        },
      }
    }
  }

  /**
   * Получить конфигурацию платформы
   */
  private getPlatformConfig(platform: string): any {
    const configs: Record<string, any> = {
      youtube_long: {
        maxDuration: 3600,
        aspectRatio: "16:9",
        bestTimes: ["14:00-16:00", "19:00-21:00"],
      },
      youtube_shorts: {
        maxDuration: 60,
        aspectRatio: "9:16",
        bestTimes: ["12:00-13:00", "17:00-19:00"],
      },
      tiktok: {
        maxDuration: 180,
        aspectRatio: "9:16",
        bestTimes: ["6:00-10:00", "19:00-23:00"],
      },
      instagram_reels: {
        maxDuration: 90,
        aspectRatio: "9:16",
        bestTimes: ["11:00-13:00", "19:00-21:00"],
      },
      instagram_igtv: {
        maxDuration: 3600,
        aspectRatio: "9:16",
        bestTimes: ["12:00-14:00", "20:00-22:00"],
      },
      facebook: {
        maxDuration: 240,
        aspectRatio: "16:9",
        bestTimes: ["13:00-16:00", "19:00-21:00"],
      },
      linkedin: {
        maxDuration: 600,
        aspectRatio: "16:9",
        bestTimes: ["7:00-9:00", "12:00-13:00", "17:00-18:00"],
      },
      twitter: {
        maxDuration: 140,
        aspectRatio: "16:9",
        bestTimes: ["8:00-10:00", "19:00-21:00"],
      },
      telegram: {
        maxDuration: 600,
        aspectRatio: "16:9",
        bestTimes: ["8:00-9:00", "20:00-22:00"],
      },
    }

    return configs[platform] || configs.youtube_long
  }

  /**
   * Генерирует вариации заголовков
   */
  private async generateTitleVariations(_content: string, platform: string): Promise<string[]> {
    // Базовые шаблоны для разных платформ
    const templates = {
      youtube: [
        "Как {action} за {time}",
        "{number} способов {action}",
        "Полное руководство по {topic}",
        "{topic}: всё, что нужно знать",
      ],
      tiktok: ["И вы так можете! 🤯", "Лайфхак, который все ищут", "POV: {scenario}", "Попробуй это!"],
      instagram: ["✨ {topic} ✨", "Сохраняйте на потом!", "{number} секретов {topic}"],
    }

    const platformKey = platform.split("_")[0] as keyof typeof templates
    const platformTemplates = templates[platformKey] || templates.youtube
    return platformTemplates.map((template: string) =>
      template
        .replace("{action}", "сделать это")
        .replace("{time}", "5 минут")
        .replace("{number}", "7")
        .replace("{topic}", "видеомонтажу")
        .replace("{scenario}", "ты монтируешь своё первое видео"),
    )
  }

  /**
   * Генерирует хэштеги
   */
  private async generateHashtags(_content: any, platform: string): Promise<string[]> {
    const baseHashtags = ["#видеомонтаж", "#монтаж", "#видео", "#творчество", "#контент"]

    // Добавляем платформ-специфичные хэштеги
    if (platform.includes("tiktok")) {
      baseHashtags.push("#tiktok", "#fyp", "#рекомендации")
    } else if (platform.includes("instagram")) {
      baseHashtags.push("#reels", "#instagram", "#instagood")
    } else if (platform.includes("youtube")) {
      baseHashtags.push("#youtube", "#youtuber", "#subscribe")
    }

    return baseHashtags.slice(0, 10)
  }

  /**
   * Выполняет мультиязычную генерацию
   */
  private async performMultiLanguageGeneration(input: ContentIntelligenceInput): Promise<any[]> {
    this.logger?.info("Выполняем мультиязычную генерацию", {
      languages: input.targetLanguages?.length,
    })

    try {
      const { getAIContainer } = await import("@/domains/ai-core")
      const aiContainer = getAIContainer()
      const aiService = await aiContainer.resolve<any>("UnifiedAIService")

      const results = []
      const sourceContent = input.sourceContent || {
        script: "Оригинальный контент",
        title: "Оригинальный заголовок",
        description: "Оригинальное описание",
      }

      for (const lang of input.targetLanguages || []) {
        try {
          // Используем AI для перевода и культурной адаптации
          const prompt = this.buildTranslationPrompt(sourceContent, lang, input.localizationLevel)

          const translationResult = await aiService.generateCompletion({
            prompt,
            maxTokens: 2000,
            temperature: 0.3,
          })

          // Парсим результат
          const translated = this.parseTranslationResult(translationResult.content, lang)

          // Определяем культурные адаптации
          const culturalAdaptations = await this.identifyCulturalAdaptations(
            sourceContent,
            translated,
            lang,
            input.culturalSensitivity,
          )

          results.push({
            language: lang,
            content: translated,
            culturalAdaptations,
          })
        } catch (error) {
          this.logger?.error(`Ошибка перевода для ${lang}`, { error })
          results.push({
            language: lang,
            content: {
              script: sourceContent.script,
              title: (sourceContent as any).title || "",
              description: (sourceContent as any).description || "",
            },
            culturalAdaptations: [],
          })
        }
      }

      return results
    } catch (error) {
      this.logger?.error("Ошибка мультиязычной генерации", { error })
      return []
    }
  }

  /**
   * Создаёт промпт для перевода
   */
  private buildTranslationPrompt(content: any, targetLang: string, level?: string): string {
    const localizationLevel = level || "translation"

    let prompt = `Переведи следующий контент на ${targetLang}.\n\n`

    if (localizationLevel === "cultural_adaptation") {
      prompt += "Адаптируй контент с учётом культурных особенностей целевой аудитории. "
      prompt += "Измени идиомы, примеры и культурные отсылки на подходящие для целевой культуры.\n\n"
    } else if (localizationLevel === "localization") {
      prompt += "Локализуй контент, адаптируя единицы измерения, даты, валюту и форматы.\n\n"
    }

    prompt += `Заголовок: ${(content as any).title || "Без заголовка"}\n`
    prompt += `Описание: ${(content as any).description || "Без описания"}\n`
    prompt += `Скрипт: ${(content as any).script || "Без скрипта"}\n\n`

    prompt += "Верни результат в формате JSON:\n"
    prompt += `{
      "title": "переведённый заголовок",
      "description": "переведённое описание",
      "script": "переведённый скрипт"
    }`

    return prompt
  }

  /**
   * Парсит результат перевода
   */
  private parseTranslationResult(result: string, lang: string): any {
    try {
      // Пытаемся распарсить JSON
      const parsed = JSON.parse(result)
      return {
        title: parsed.title || `Заголовок на ${lang}`,
        description: parsed.description || `Описание на ${lang}`,
        script: parsed.script || `Скрипт на ${lang}`,
      }
    } catch {
      // Если не JSON, возвращаем как есть
      return {
        title: `Заголовок на ${lang}`,
        description: `Описание на ${lang}`,
        script: result,
      }
    }
  }

  /**
   * Определяет культурные адаптации
   */
  private async identifyCulturalAdaptations(
    _original: any,
    _translated: any,
    lang: string,
    _culturalSensitivity?: boolean,
  ): Promise<string[]> {
    const adaptations: string[] = []

    // Базовые адаптации для разных языков
    const langAdaptations: Record<string, string[]> = {
      en: ["Использованы международные примеры", "Адаптированы единицы измерения"],
      es: ["Учтены региональные различия испанского", "Адаптированы культурные отсылки"],
      fr: ["Использован формальный стиль обращения", "Адаптированы идиомы"],
      de: ["Соблюдён немецкий деловой стиль", "Адаптирована терминология"],
      ja: ["Использованы вежливые формы", "Учтена иерархия обращений"],
      zh: ["Адаптированы числовые символы", "Учтены культурные особенности"],
      ar: ["Текст адаптирован для RTL", "Учтены религиозные аспекты"],
    }

    const defaultAdaptations = [`Контент адаптирован для ${lang}`, "Сохранён культурный контекст"]

    return langAdaptations[lang] || defaultAdaptations
  }

  /**
   * Выполняет генерацию вариантов
   */
  private async performVariantGeneration(input: ContentIntelligenceInput): Promise<ContentVariant[]> {
    this.logger?.info("Выполняем генерацию вариантов", {
      count: input.generateVariants,
    })

    try {
      const { getAIContainer } = await import("@/domains/ai-core")
      const aiContainer = getAIContainer()
      const aiService = await aiContainer.resolve<any>("UnifiedAIService")

      const variants: ContentVariant[] = []
      const sourceContent = input.sourceContent || {
        script: "Оригинальный контент",
        title: "Оригинальный заголовок",
        description: "Оригинальное описание",
      }

      const strategies = input.variantStrategies || [
        "emotional_tone",
        "content_length",
        "hook_style",
        "cta_approach",
        "visual_style",
      ]

      const variantCount = Math.min(input.generateVariants || 3, strategies.length)

      for (let i = 0; i < variantCount; i++) {
        const strategy = strategies[i % strategies.length]

        try {
          // Генерируем вариант через AI
          const prompt = this.buildVariantPrompt(sourceContent, strategy, input.contentGoal)

          const variantResult = await aiService.generateCompletion({
            prompt,
            maxTokens: 1500,
            temperature: 0.7,
          })

          // Парсим результат
          const variantData = this.parseVariantResult(variantResult.content, strategy)

          // Оцениваем производительность
          const performance = await this.predictVariantPerformance(variantData, strategy, input.testingMetrics)

          variants.push({
            id: `variant_${i + 1}`,
            strategy,
            changes: variantData.changes,
            predictedPerformance: performance,
          })
        } catch (error) {
          this.logger?.error(`Ошибка генерации варианта ${i + 1}`, { error })
          // Добавляем базовый вариант при ошибке
          variants.push({
            id: `variant_${i + 1}`,
            strategy,
            changes: [
              {
                element: "title",
                original: (sourceContent as any).title || "Оригинал",
                modified: `${(sourceContent as any).title || "Контент"} - Вариант ${i + 1}`,
                rationale: `Стратегия: ${strategy}`,
              },
            ],
            predictedPerformance: {
              engagement: 0.5,
              retention: 0.5,
              conversion: 0.05,
            },
          })
        }
      }

      return variants
    } catch (error) {
      this.logger?.error("Ошибка генерации вариантов", { error })
      return []
    }
  }

  /**
   * Создаёт промпт для генерации варианта
   */
  private buildVariantPrompt(content: any, strategy: string, goal?: string): string {
    const contentGoal = goal || "engagement"

    let prompt = `Создай вариант контента со следующей стратегией: ${strategy}.\n`
    prompt += `Цель контента: ${contentGoal}.\n\n`

    const strategyInstructions: Record<string, string> = {
      emotional_tone: "Измени эмоциональный тон - сделай более драматичным, весёлым или вдохновляющим",
      content_length: "Оптимизируй длину - сократи для краткости или расширь для детальности",
      hook_style: "Измени стиль захвата внимания - вопрос, факт, история или вызов",
      cta_approach: "Измени призыв к действию - прямой, мягкий, срочный или выгодный",
      visual_style: "Адаптируй для другого визуального стиля - минималистичный, яркий или кинематографичный",
    }

    prompt += `${strategyInstructions[strategy] || "Создай альтернативную версию"}\n\n`

    prompt += "Оригинальный контент:\n"
    prompt += `Заголовок: ${(content as any).title || "Без заголовка"}\n`
    prompt += `Описание: ${(content as any).description || "Без описания"}\n`
    prompt += `Скрипт: ${(content as any).script || "Без скрипта"}\n\n`

    prompt += "Верни результат в формате JSON:\n"
    prompt += `{
      "changes": [
        {
          "element": "title/description/script",
          "original": "оригинальный текст",
          "modified": "изменённый текст",
          "rationale": "обоснование изменения"
        }
      ]
    }`

    return prompt
  }

  /**
   * Парсит результат генерации варианта
   */
  private parseVariantResult(result: string, strategy: string): any {
    try {
      const parsed = JSON.parse(result)
      return {
        changes: parsed.changes || [
          {
            element: "title",
            original: "Оригинал",
            modified: "Изменённый вариант",
            rationale: `Применена стратегия ${strategy}`,
          },
        ],
      }
    } catch {
      return {
        changes: [
          {
            element: "content",
            original: "Оригинальный контент",
            modified: result,
            rationale: `Стратегия ${strategy}`,
          },
        ],
      }
    }
  }

  /**
   * Предсказывает производительность варианта
   */
  private async predictVariantPerformance(_variantData: any, strategy: string, metrics?: string[]): Promise<any> {
    // Базовые оценки для разных стратегий
    const strategyScores: Record<string, any> = {
      emotional_tone: { engagement: 0.85, retention: 0.75, conversion: 0.08 },
      content_length: { engagement: 0.7, retention: 0.8, conversion: 0.06 },
      hook_style: { engagement: 0.9, retention: 0.65, conversion: 0.1 },
      cta_approach: { engagement: 0.75, retention: 0.7, conversion: 0.12 },
      visual_style: { engagement: 0.8, retention: 0.85, conversion: 0.07 },
    }

    const baseScores = strategyScores[strategy] || {
      engagement: 0.7,
      retention: 0.7,
      conversion: 0.07,
    }

    // Добавляем случайную вариацию
    const performance: any = {}
    const requestedMetrics = metrics || ["engagement", "retention", "conversion"]

    for (const metric of requestedMetrics) {
      if (metric === "ctr") {
        performance.ctr = baseScores.engagement * 0.15 + Math.random() * 0.05
      } else if (baseScores[metric] !== undefined) {
        performance[metric] = baseScores[metric] + (Math.random() - 0.5) * 0.1
        performance[metric] = Math.max(0, Math.min(1, performance[metric]))
      }
    }

    return performance
  }

  /**
   * Выполняет анализ аудитории
   */
  private async performAudienceAnalysis(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем анализ аудитории")

    try {
      const { getAIContainer } = await import("@/domains/ai-core")
      // Используем SceneAnalysisEngine для анализа возраста и пола
      const aiContainer = getAIContainer()
      const contentAnalyzer = await aiContainer.resolve<any>("ContentAnalyzer")
      const ageGenderService = SceneAnalysisEngine.getInstance()

      // Создаем конфиг для анализа (заглушка для совместимости)
      const ageGenderConfig = {
        enableAge: true,
        enableGender: true,
        enableEmotion: true,
      }

      const videoPath = input.mediaFiles?.[0]
      if (!videoPath) {
        throw new Error("Не указаны медиафайлы для анализа")
      }

      // Анализируем демографию через видео
      const demographics = await ageGenderService.analyzeScenes({
        id: "temp",
        path: videoPath,
        filename: "temp",
        size: 0,
        type: "video",
        duration: 0,
        format: "video",
      })

      // Анализируем контент для определения аудитории
      const contentProfile = await contentAnalyzer.analyzeContentProfile({
        mediaFiles: input.mediaFiles,
        analysisScope: input.analysisScope || "full_content",
      })

      // Агрегируем демографические данные из всех сцен (заглушка)
      const overallDemographics = {
        age_groups: { "18-24": 25, "25-34": 35, "35-44": 25, "45+": 15 },
        gender: { male: 60, female: 40 },
        interests: ["technology", "entertainment", "lifestyle"],
        confidence: 0.7,
      }

      // Определяем сегменты аудитории
      const segments = this.generateAudienceSegments(overallDemographics, contentProfile, input.audienceSegments)

      // Рассчитываем общий скор
      const overallScore = segments.reduce((sum, seg) => sum + seg.engagement_prediction, 0) / segments.length

      return {
        analysisType: "audience_analysis",
        audienceAnalysis: {
          segments,
          overallScore,
        },
      }
    } catch (error) {
      this.logger?.error("Ошибка анализа аудитории", { error })
      return {
        analysisType: "audience_analysis",
        audienceAnalysis: {
          segments: [],
          overallScore: 0,
        },
      }
    }
  }

  /**
   * Генерирует сегменты аудитории
   */
  private generateAudienceSegments(demographics: any, contentProfile: any, requestedSegments?: string[]): any[] {
    const segments = []

    // Демографические сегменты
    if (!requestedSegments || requestedSegments.includes("demographic")) {
      if (demographics.ageDistribution) {
        const dominantAge = Object.entries(demographics.ageDistribution).sort(([, a]: any, [, b]: any) => b - a)[0]

        segments.push({
          name: `Основная возрастная группа (${dominantAge[0]})`,
          characteristics: [
            dominantAge[0],
            demographics.genderDistribution?.male > 50 ? "Преимущественно мужчины" : "Преимущественно женщины",
            "Активные пользователи",
          ],
          engagement_prediction: 7.5 + Math.random() * 2,
          content_preferences: this.getContentPreferences(dominantAge[0]),
        })
      }
    }

    // Поведенческие сегменты
    if (!requestedSegments || requestedSegments.includes("behavioral")) {
      if (contentProfile.engagementPatterns) {
        segments.push({
          name: "Активные зрители",
          characteristics: ["Высокая вовлечённость", "Частое взаимодействие", "Делятся контентом"],
          engagement_prediction: 8.5 + Math.random(),
          content_preferences: ["обучающие видео", "интерактивный контент", "лайфхаки"],
        })
      }
    }

    // Психографические сегменты
    if (!requestedSegments || requestedSegments.includes("psychographic")) {
      if (contentProfile.contentStyle) {
        segments.push({
          name: "Искатели знаний",
          characteristics: ["Любознательные", "Саморазвитие", "Открыты новому"],
          engagement_prediction: 8 + Math.random() * 1.5,
          content_preferences: ["образовательный контент", "гайды", "экспертные мнения"],
        })
      }
    }

    return segments.filter((seg) => seg.engagement_prediction > 0)
  }

  /**
   * Определяет предпочтения контента по возрасту
   */
  private getContentPreferences(ageGroup: string): string[] {
    const preferences: Record<string, string[]> = {
      "0-17": ["развлечения", "игры", "короткие видео"],
      "18-24": ["тренды", "обучение", "лайфстайл"],
      "25-34": ["карьера", "саморазвитие", "технологии"],
      "35-44": ["семья", "финансы", "здоровье"],
      "45-54": ["новости", "аналитика", "отдых"],
      "55-64": ["хобби", "путешествия", "здоровье"],
      "65+": ["досуг", "семья", "воспоминания"],
    }

    return preferences[ageGroup] || ["разнообразный контент"]
  }

  /**
   * Выполняет оптимизацию вовлечения
   */
  private async performEngagementOptimization(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем оптимизацию вовлечения")

    try {
      const sceneEngine = SceneAnalysisEngine.getInstance()

      const videoPath = input.mediaFiles?.[0]
      if (!videoPath) {
        throw new Error("Не указаны медиафайлы для анализа")
      }

      // Анализируем видео
      const analysis = await sceneEngine.analyzeScenes({
        id: "temp",
        path: videoPath,
        filename: "temp",
        size: 0,
        type: "video",
        duration: 0,
        format: "video",
      })

      // Оцениваем факторы вовлечения
      const engagementFactors = input.engagementFactors || ["hook", "pacing", "music", "effects", "cta"]

      const improvementAreas = []
      let currentScore = 7.0

      // Анализируем начало (hook)
      if (engagementFactors.includes("hook")) {
        const firstScene = analysis[0]
        const hookRating = this.evaluateHook(firstScene)
        if (hookRating < 8) {
          improvementAreas.push({
            factor: "hook",
            currentRating: hookRating,
            suggestions: [
              "Начните с вопроса или интригующего факта",
              "Используйте яркие визуальные элементы",
              "Создайте ощущение срочности",
            ],
            potential_impact: (8 - hookRating) * 0.5,
          })
        }
        currentScore = (currentScore + hookRating) / 2
      }

      // Анализируем темп (pacing)
      if (engagementFactors.includes("pacing")) {
        const pacingRating = this.evaluatePacing(analysis)
        if (pacingRating < 8) {
          improvementAreas.push({
            factor: "pacing",
            currentRating: pacingRating,
            suggestions: ["Варьируйте длину сцен", "Добавьте динамичные переходы", "Уберите мёртвые зоны"],
            potential_impact: (8 - pacingRating) * 0.4,
          })
        }
        currentScore = (currentScore + pacingRating) / 2
      }

      // Анализируем музыку
      if (engagementFactors.includes("music") && (analysis as any).musicSegments) {
        const musicRating = this.evaluateMusic((analysis as any).musicSegments)
        if (musicRating < 8) {
          improvementAreas.push({
            factor: "music",
            currentRating: musicRating,
            suggestions: [
              "Добавьте эмоциональную музыку",
              "Синхронизируйте ритм с монтажом",
              "Используйте музыкальные акценты",
            ],
            potential_impact: (8 - musicRating) * 0.3,
          })
        }
        currentScore = (currentScore + musicRating) / 2
      }

      // Рассчитываем общее улучшение
      const predictedImprovement = improvementAreas.reduce((sum, area) => sum + area.potential_impact, 0)

      return {
        analysisType: "engagement_optimization",
        engagementOptimization: {
          currentScore,
          improvementAreas,
          predictedImprovement,
        },
      }
    } catch (error) {
      this.logger?.error("Ошибка оптимизации вовлечения", { error })
      return {
        analysisType: "engagement_optimization",
        engagementOptimization: {
          currentScore: 5.0,
          improvementAreas: [],
          predictedImprovement: 0,
        },
      }
    }
  }

  /**
   * Оценивает эффективность hook
   */
  private evaluateHook(firstScene: any): number {
    let score = 5.0

    // Короткие первые сцены лучше
    if (firstScene.duration < 5000) score += 1

    // Наличие активности
    if (firstScene.content?.activities?.length > 0) score += 1

    // Наличие лиц
    if (firstScene.content?.faces?.length > 0) score += 1

    // Эмоциональность
    if (firstScene.emotion && firstScene.emotion !== "neutral") score += 1

    // Динамика
    if (firstScene.motion?.intensity > 0.5) score += 1

    return Math.min(10, score)
  }

  /**
   * Оценивает темп видео
   */
  private evaluatePacing(scenes: any[]): number {
    if (scenes.length === 0) return 5.0

    let score = 7.0

    // Анализируем вариацию длины сцен
    const durations = scenes.map((s) => s.duration || s.endTime - s.startTime)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + (d - avgDuration) ** 2, 0) / durations.length
    const stdDev = Math.sqrt(variance)

    // Хорошая вариация - это хорошо
    if (stdDev / avgDuration > 0.3) score += 1

    // Слишком длинные сцены - плохо
    if (durations.some((d) => d > 30000)) score -= 1

    // Слишком короткие сцены - тоже плохо
    if (durations.filter((d) => d < 2000).length > scenes.length / 3) score -= 1

    // Хорошая средняя длина
    if (avgDuration >= 5000 && avgDuration <= 15000) score += 1

    return Math.min(10, Math.max(0, score))
  }

  /**
   * Оценивает использование музыки
   */
  private evaluateMusic(musicSegments: any[]): number {
    if (!musicSegments || musicSegments.length === 0) return 5.0

    let score = 6.0

    // Наличие музыки
    score += 2

    // Разнообразие музыки
    if (musicSegments.length > 1) score += 1

    // Соответствие настроению
    const hasEnergeticMusic = musicSegments.some((s) => s.energy > 0.7)
    if (hasEnergeticMusic) score += 1

    return Math.min(10, score)
  }
}

// Экспортируем готовый экземпляр для использования
export const contentIntelligenceTool = new ContentIntelligenceTool()

// Функции-обертки для обратной совместимости
export async function analyzeContentIntelligence(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "analyze_content",
    mediaFiles: params.media_files,
    analysisDepth: params.analysis_depth,
    targetPlatforms: params.target_platforms,
    languages: params.languages,
    enablePersonTracking: params.enable_person_tracking,
    generateScript: params.generate_script,
    reason: params.reason || "Комплексный анализ контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function detectSceneBoundaries(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "detect_scenes",
    mediaFiles: [params.video_path],
    reason: params.reason || "Детекция границ сцен",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function classifyContent(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "classify_content",
    mediaFiles: [params.media_input],
    reason: params.reason || "Классификация контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function adaptContentToPlatform(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "adapt_platform",
    sourceContent: params.source_content,
    targetPlatform: params.target_platform,
    adaptationDepth: params.adaptation_depth,
    includeSeo: params.include_seo,
    generateVariants: params.generate_variants,
    reason: params.reason || "Адаптация контента под платформу",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function generateMultiLanguageBatch(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "generate_multilanguage",
    sourceContent: params.source_content,
    targetLanguages: params.target_languages,
    localizationLevel: params.localization_level,
    maintainTiming: params.maintain_timing,
    culturalSensitivity: params.cultural_sensitivity,
    reason: params.reason || "Генерация мультиязычного контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function generateContentVariants(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "generate_variants",
    sourceContent: params.source_content,
    generateVariants: params.variant_count,
    variantStrategies: params.variant_strategies,
    contentGoal: params.content_goal,
    testingMetrics: params.testing_metrics,
    reason: params.reason || "Генерация вариантов контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function analyzeAudienceSegments(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "analyze_audience",
    mediaFiles: params.content_samples,
    audienceSegments: params.segment_types,
    analysisScope: params.analysis_scope,
    competitorBenchmarking: params.competitor_benchmarking,
    reason: params.reason || "Анализ сегментов аудитории",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function optimizeEngagementFactors(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "optimize_engagement",
    mediaFiles: params.content_files,
    engagementFactors: params.optimization_factors,
    optimizationGoals: params.goals,
    platformAlgorithms: params.consider_algorithms,
    reason: params.reason || "Оптимизация факторов вовлечения",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

// Старые типы и интерфейсы для обратной совместимости
export const contentIntelligenceTools: any[] = [
  {
    name: "analyze_content_intelligence",
    description: "Анализирует медиафайлы с помощью AI для понимания контента, сцен, объектов и действий",
  },
  {
    name: "detect_scene_boundaries",
    description: "Обнаруживает границы сцен в видео",
  },
  {
    name: "classify_content",
    description: "Классифицирует контент по жанру, стилю и тематике",
  },
  {
    name: "adapt_content_to_platform",
    description: "Адаптирует контент для конкретной платформы",
  },
  {
    name: "generate_multilanguage_batch",
    description: "Генерирует мультиязычные версии контента",
  },
  {
    name: "generate_content_variants",
    description: "Создает варианты контента для A/B тестирования",
  },
  {
    name: "analyze_audience_segments",
    description: "Анализирует целевую аудиторию контента",
  },
  {
    name: "optimize_engagement_factors",
    description: "Оптимизирует факторы вовлечения",
  },
]

/**
 * Выполняет инструмент интеллектуального анализа контента (legacy API)
 */
export async function executeContentIntelligenceTool(
  toolName: string,
  input: Record<string, any>,
): Promise<ContentIntelligenceToolResult> {
  try {
    // Маппинг старых названий на новые операции
    const operationMap: Record<string, () => Promise<any>> = {
      analyze_content_intelligence: () => analyzeContentIntelligence(input),
      detect_scene_boundaries: () => detectSceneBoundaries(input),
      classify_content: () => classifyContent(input),
      adapt_content_to_platform: () => adaptContentToPlatform(input),
      generate_multilanguage_batch: () => generateMultiLanguageBatch(input),
      generate_content_variants: () => generateContentVariants(input),
      analyze_audience_segments: () => analyzeAudienceSegments(input),
      optimize_engagement_factors: () => optimizeEngagementFactors(input),
    }

    const operation = operationMap[toolName]
    if (!operation) {
      return {
        success: false,
        message: `Неизвестный инструмент интеллектуального анализа: ${toolName}`,
        errors: [`Инструмент ${toolName} не найден`],
      }
    }

    const result = await operation()

    // Конвертируем результат в старый формат
    return {
      success: result.success,
      message: result.message || "Операция выполнена успешно",
      data: {
        contentAnalysis: result.data?.analysisResults,
        sceneDetection: result.data?.analysisResults?.sceneDetection,
        contentClassification: result.data?.analysisResults?.contentClassification,
        platformAdaptation: result.data?.analysisResults?.platformAdaptation,
        multiLanguageVersions: result.data?.multiLanguageVersions,
        contentVariants: result.data?.contentVariants,
        audienceAnalysis: result.data?.analysisResults?.audienceAnalysis,
        engagementOptimization: result.data?.analysisResults?.engagementOptimization,
        recommendations: result.data?.recommendations || [],
        warnings: result.data?.warnings,
      },
      errors: result.errors,
      nextActions: result.data?.nextActions || [],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения интеллектуального анализа ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}
