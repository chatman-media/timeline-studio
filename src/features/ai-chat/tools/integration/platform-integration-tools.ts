/**
 * Platform Optimization AI Tools с использованием BaseAITool
 *
 * Набор AI инструментов для оптимизации видео под различные социальные платформы.
 * Интегрируется с Claude Tools через AI Chat модуль.
 */

import { invoke } from "@tauri-apps/api/core"
import { ClaudeTool } from "@/domains/ai-core/providers/claude"
import { ContentCategory, PlatformOptimizationService, SupportedPlatform } from "@/domains/ai-services"
import { createLogger } from "@/lib/tauri-logger"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

const logger = createLogger({ module: "PlatformIntegrationTools" })

// Типы для операций оптимизации платформ
export interface PlatformOptimizationInput {
  operation:
    | "get_platform_specs"
    | "get_all_platforms"
    | "analyze_content"
    | "optimize_for_platform"
    | "suggest_formats"
    | "validate_specifications"
    | "generate_thumbnails"
    | "create_variants"
  platform?: SupportedPlatform
  videoPath?: string
  contentCategory?: ContentCategory
  targetAudience?: string
  customRequirements?: any
  generateVariants?: boolean
  includeAnalytics?: boolean
  outputPath?: string
}

export interface PlatformOptimizationResult {
  operation: string
  success: boolean
  platformSpecs?: any
  platforms?: any[]
  analysis?: any
  optimizedVideo?: any
  suggestions?: any[]
  validation?: any
  thumbnails?: any[]
  variants?: any[]
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для оптимизации платформ с унифицированной обработкой ошибок
 */
export class PlatformOptimizationTool extends BaseAITool {
  private platformService: PlatformOptimizationService

  constructor(logger?: AIToolLogger) {
    super("PlatformOptimizationTool", logger)
    this.platformService = PlatformOptimizationService.getInstance()
  }

  /**
   * Выполняет операции оптимизации платформ
   */
  public async optimizePlatform(
    input: PlatformOptimizationInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<PlatformOptimizationResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInput(input, (data) => {
        const errors: string[] = []

        const validOperations = [
          "get_platform_specs",
          "get_all_platforms",
          "analyze_content",
          "optimize_for_platform",
          "suggest_formats",
          "validate_specifications",
          "generate_thumbnails",
          "create_variants",
        ]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        if (
          ["get_platform_specs", "optimize_for_platform", "validate_specifications"].includes(data.operation) &&
          !data.platform
        ) {
          errors.push("Требуется указать платформу")
        }

        if (
          ["analyze_content", "optimize_for_platform", "generate_thumbnails"].includes(data.operation) &&
          !data.videoPath
        ) {
          errors.push("Требуется указать путь к видеофайлу")
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      let result: PlatformOptimizationResult

      switch (input.operation) {
        case "get_platform_specs":
          const specs = await this.platformService.getPlatformSpecs(input.platform!)
          result = {
            operation: input.operation,
            success: true,
            platformSpecs: specs,
            message: `Получены спецификации для ${input.platform}`,
            recommendations: ["Используйте эти спецификации для оптимизации видео"],
          }
          break

        case "get_all_platforms":
          const platforms = await this.platformService.getAllPlatforms()
          result = {
            operation: input.operation,
            success: true,
            platforms: platforms,
            message: `Найдено ${platforms.length} поддерживаемых платформ`,
            recommendations: ["Выберите подходящую платформу для оптимизации"],
          }
          break

        case "analyze_content":
          const analysis = await this.platformService.analyzeContent(input.videoPath!, {
            category: input.contentCategory,
            targetAudience: input.targetAudience,
          })
          result = {
            operation: input.operation,
            success: true,
            analysis: analysis,
            message: "Анализ контента завершен",
            recommendations: [
              "Используйте результаты анализа для выбора оптимальной платформы",
              "Учтите особенности целевой аудитории",
            ],
          }
          break

        case "optimize_for_platform":
          const optimized = await this.platformService.optimizeForPlatform(input.videoPath!, input.platform!, {
            category: input.contentCategory,
            generateVariants: input.generateVariants,
            outputPath: input.outputPath,
          })
          result = {
            operation: input.operation,
            success: true,
            optimizedVideo: optimized,
            message: `Видео оптимизировано для ${input.platform}`,
            recommendations: [
              "Проверьте качество оптимизированного видео",
              "Рассмотрите создание дополнительных вариантов",
            ],
          }
          break

        case "suggest_formats":
          const suggestions = await this.platformService.suggestOptimalFormats(input.videoPath!, {
            contentCategory: input.contentCategory,
            targetAudience: input.targetAudience,
          })
          result = {
            operation: input.operation,
            success: true,
            suggestions: suggestions,
            message: `Найдено ${suggestions.length} рекомендованных форматов`,
            recommendations: ["Выберите формат, наиболее подходящий для вашего контента"],
          }
          break

        case "validate_specifications":
          // Используем анализ видео для валидации
          const analysisResults = await this.platformService.analyzeVideoForPlatforms(input.videoPath!)
          const platformAnalysis = analysisResults.platforms.find((p) => p.platform === input.platform)
          const isValid = platformAnalysis?.compatibility.overallScore
            ? platformAnalysis.compatibility.overallScore > 0.8
            : false
          result = {
            operation: input.operation,
            success: true,
            validation: {
              isValid,
              issues: platformAnalysis?.compatibility.issues || [],
              score: platformAnalysis?.compatibility.overallScore || 0,
            },
            message: isValid ? "Видео соответствует требованиям платформы" : "Обнаружены несоответствия требованиям",
            recommendations: platformAnalysis?.compatibility.suggestions || [],
            warnings: platformAnalysis?.compatibility.issues,
          }
          break

        case "generate_thumbnails":
        case "create_variants":
          result = {
            operation: input.operation,
            success: false,
            message: "Функция пока не реализована",
            recommendations: ["Функция будет добавлена в следующих версиях"],
          }
          break

        default:
          throw new Error(`Неподдерживаемая операция: ${input.operation}`)
      }

      return result
    }, options)
  }
}

// Создаем singleton экземпляр
const platformOptimizationTool = new PlatformOptimizationTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executePlatformOptimizationTool(
  operation: PlatformOptimizationInput["operation"],
  params: Omit<PlatformOptimizationInput, "operation">,
  options?: AIToolExecutionOptions,
): Promise<AIToolResult<PlatformOptimizationResult>> {
  return platformOptimizationTool.optimizePlatform({ operation, ...params }, options)
}

// Экспорт для обратной совместимости
export const getPlatformSpecsTool: ClaudeTool = {
  name: "get_platform_specs",
  description: "Получить технические спецификации и ограничения для конкретной социальной платформы",
  input_schema: {
    type: "object",
    properties: {
      platform: {
        type: "string",
        enum: [
          "youtube",
          "tiktok",
          "instagram_feed",
          "instagram_stories",
          "instagram_reels",
          "facebook",
          "twitter",
          "linkedin",
          "vimeo",
          "twitch",
        ],
        description: "Название платформы для получения спецификаций",
      },
    },
    required: ["platform"],
  },
}

export const getAllPlatformsTool: ClaudeTool = {
  name: "get_all_platforms",
  description: "Получить список всех поддерживаемых социальных платформ с их характеристиками",
  input_schema: {
    type: "object",
    properties: {},
    required: [],
  },
}

/**
 * Инструмент для получения рекомендованных платформ
 */
export const getRecommendedPlatformsTool: ClaudeTool = {
  name: "get_recommended_platforms",
  description: "Получить рекомендованные платформы на основе типа контента, соотношения сторон и длительности",
  input_schema: {
    type: "object",
    properties: {
      contentCategory: {
        type: "string",
        enum: ["shorts", "standard", "live", "stories", "ads"],
        description: "Категория контента для оптимизации",
      },
      aspectRatio: {
        type: "string",
        description: "Соотношение сторон видео (например, '16:9', '9:16', '1:1')",
        pattern: "^\\d+:\\d+$",
      },
      duration: {
        type: "number",
        description: "Длительность видео в секундах",
        minimum: 1,
      },
    },
    required: ["contentCategory"],
  },
}

/**
 * Инструмент для анализа видео и рекомендаций платформ
 */
export const analyzeVideoForPlatformsTool: ClaudeTool = {
  name: "analyze_video_for_platforms",
  description: "Анализировать видео и получить рекомендации по платформам с оценками совместимости",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу для анализа",
      },
    },
    required: ["videoPath"],
  },
}

/**
 * Инструмент для оптимизации видео под одну платформу
 */
export const optimizeForPlatformTool: ClaudeTool = {
  name: "optimize_for_platform",
  description: "Оптимизировать видео под конкретную социальную платформу с настройкой параметров",
  input_schema: {
    type: "object",
    properties: {
      inputVideoPath: {
        type: "string",
        description: "Путь к исходному видеофайлу",
      },
      platform: {
        type: "string",
        enum: [
          "youtube",
          "tiktok",
          "instagram_feed",
          "instagram_stories",
          "instagram_reels",
          "facebook",
          "twitter",
          "linkedin",
          "vimeo",
          "twitch",
        ],
        description: "Целевая платформа для оптимизации",
      },
      contentCategory: {
        type: "string",
        enum: ["shorts", "standard", "live", "stories", "ads"],
        description: "Категория контента",
      },
      outputDirectory: {
        type: "string",
        description: "Директория для сохранения оптимизированного видео",
      },
      customSettings: {
        type: "object",
        description: "Дополнительные настройки оптимизации",
        properties: {
          targetResolution: {
            type: "object",
            properties: {
              width: { type: "number", minimum: 1 },
              height: { type: "number", minimum: 1 },
            },
          },
          targetBitrate: {
            type: "number",
            description: "Целевой битрейт в kbps",
            minimum: 100,
          },
          targetFramerate: {
            type: "number",
            description: "Целевая частота кадров",
            minimum: 1,
            maximum: 120,
          },
          cropToFit: {
            type: "boolean",
            description: "Обрезать видео для точного соответствия соотношению сторон",
          },
          addPlatformBranding: {
            type: "boolean",
            description: "Добавить брендинг платформы",
          },
          generateThumbnail: {
            type: "boolean",
            description: "Создать превью изображение",
          },
        },
      },
    },
    required: ["inputVideoPath", "platform", "contentCategory", "outputDirectory"],
  },
}

/**
 * Инструмент для пакетной оптимизации под несколько платформ
 */
export const batchOptimizeForPlatformsTool: ClaudeTool = {
  name: "batch_optimize_for_platforms",
  description: "Оптимизировать одно видео сразу под несколько социальных платформ",
  input_schema: {
    type: "object",
    properties: {
      inputVideoPath: {
        type: "string",
        description: "Путь к исходному видеофайлу",
      },
      platforms: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "youtube",
            "tiktok",
            "instagram_feed",
            "instagram_stories",
            "instagram_reels",
            "facebook",
            "twitter",
            "linkedin",
            "vimeo",
            "twitch",
          ],
        },
        description: "Список платформ для оптимизации",
        minItems: 1,
      },
      outputDirectory: {
        type: "string",
        description: "Директория для сохранения всех оптимизированных видео",
      },
      contentCategory: {
        type: "string",
        enum: ["shorts", "standard", "live", "stories", "ads"],
        description: "Категория контента",
        default: "standard",
      },
    },
    required: ["inputVideoPath", "platforms", "outputDirectory"],
  },
}

/**
 * Инструмент для создания превью для платформы
 */
export const generatePlatformThumbnailTool: ClaudeTool = {
  name: "generate_platform_thumbnail",
  description: "Создать оптимизированное превью (обложку) видео для конкретной платформы",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу",
      },
      platform: {
        type: "string",
        enum: [
          "youtube",
          "tiktok",
          "instagram_feed",
          "instagram_stories",
          "instagram_reels",
          "facebook",
          "twitter",
          "linkedin",
          "vimeo",
          "twitch",
        ],
        description: "Платформа для создания превью",
      },
      outputPath: {
        type: "string",
        description: "Путь для сохранения превью",
      },
      timestamp: {
        type: "number",
        description: "Временная метка в секундах для создания кадра (по умолчанию - середина видео)",
        minimum: 0,
      },
      addOverlay: {
        type: "boolean",
        description: "Добавить текстовые элементы и брендинг",
        default: false,
      },
    },
    required: ["videoPath", "platform", "outputPath"],
  },
}

/**
 * Инструмент для проверки соответствия платформе
 */
export const checkPlatformComplianceTool: ClaudeTool = {
  name: "check_platform_compliance",
  description: "Проверить соответствие видео требованиям конкретной платформы",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу для проверки",
      },
      platform: {
        type: "string",
        enum: [
          "youtube",
          "tiktok",
          "instagram_feed",
          "instagram_stories",
          "instagram_reels",
          "facebook",
          "twitter",
          "linkedin",
          "vimeo",
          "twitch",
        ],
        description: "Платформа для проверки соответствия",
      },
    },
    required: ["videoPath", "platform"],
  },
}

/**
 * Инструмент для получения статистики оптимизации
 */
export const getOptimizationStatsTool: ClaudeTool = {
  name: "get_optimization_stats",
  description: "Получить статистику и аналитику по выполненным оптимизациям",
  input_schema: {
    type: "object",
    properties: {
      timeframe: {
        type: "string",
        enum: ["day", "week", "month", "all"],
        description: "Временной диапазон для статистики",
        default: "all",
      },
      platform: {
        type: "string",
        enum: [
          "youtube",
          "tiktok",
          "instagram_feed",
          "instagram_stories",
          "instagram_reels",
          "facebook",
          "twitter",
          "linkedin",
          "vimeo",
          "twitch",
        ],
        description: "Фильтр по конкретной платформе (опционально)",
      },
    },
    required: [],
  },
}

/**
 * Инструмент для генерации метаданных платформы
 */
export const generatePlatformMetadataTool: ClaudeTool = {
  name: "generate_platform_metadata",
  description: "Создать оптимизированные метаданные (заголовок, описание, теги) для видео на конкретной платформе",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу",
      },
      platform: {
        type: "string",
        enum: [
          "youtube",
          "tiktok",
          "instagram_feed",
          "instagram_stories",
          "instagram_reels",
          "facebook",
          "twitter",
          "linkedin",
          "vimeo",
          "twitch",
        ],
        description: "Целевая платформа",
      },
      contentTheme: {
        type: "string",
        description: "Основная тема или тематика видео",
      },
      targetAudience: {
        type: "string",
        description: "Целевая аудитория (например, 'молодежь 18-25', 'профессионалы', 'геймеры')",
      },
      language: {
        type: "string",
        description: "Язык для метаданных",
        default: "ru",
      },
      includeHashtags: {
        type: "boolean",
        description: "Включить рекомендуемые хештеги",
        default: true,
      },
    },
    required: ["videoPath", "platform", "contentTheme"],
  },
}

/**
 * Все инструменты для оптимизации платформ
 */
export const platformOptimizationTools: ClaudeTool[] = [
  getPlatformSpecsTool,
  getAllPlatformsTool,
  getRecommendedPlatformsTool,
  analyzeVideoForPlatformsTool,
  optimizeForPlatformTool,
  batchOptimizeForPlatformsTool,
  generatePlatformThumbnailTool,
  checkPlatformComplianceTool,
  getOptimizationStatsTool,
  generatePlatformMetadataTool,
]

/**
 * Выполнение инструментов оптимизации платформ (старая функция для совместимости)
 */
async function executePlatformOptimizationToolOld(toolName: string, input: any): Promise<any> {
  // Объявление платформенного сервиса
  const platformService = PlatformOptimizationService.getInstance()
  try {
    switch (toolName) {
      case "get_platform_specs":
        return platformService.getPlatformSpecs(input.platform as SupportedPlatform)

      case "get_all_platforms":
        return {
          platforms: platformService.getAllPlatforms(),
          totalPlatforms: platformService.getAllPlatforms().length,
        }

      case "get_recommended_platforms":
        return {
          recommendedPlatforms: platformService.getRecommendedPlatforms(
            input.contentCategory as ContentCategory,
            input.aspectRatio,
            input.duration,
          ),
          contentCategory: input.contentCategory,
        }

      case "analyze_video_for_platforms":
        return await platformService.analyzeVideoForPlatforms(input.videoPath)

      case "optimize_for_platform":
        return await platformService.optimizeForPlatform({
          inputVideoPath: input.inputVideoPath,
          platform: input.platform as SupportedPlatform,
          contentCategory: input.contentCategory as ContentCategory,
          outputDirectory: input.outputDirectory,
          customSettings: input.customSettings,
        })

      case "batch_optimize_for_platforms":
        return await platformService.batchOptimizeForPlatforms(
          input.inputVideoPath,
          input.platforms as SupportedPlatform[],
          input.outputDirectory,
          (input.contentCategory as ContentCategory) || "standard",
        )

      case "generate_platform_thumbnail": {
        const specs = platformService.getPlatformSpecs(input.platform as SupportedPlatform)
        return await invoke("ffmpeg_generate_platform_thumbnail", {
          videoPath: input.videoPath,
          outputPath: input.outputPath,
          timestamp: input.timestamp,
          targetWidth: specs.recommendedResolution.width,
          targetHeight: specs.recommendedResolution.height,
          aspectRatio: specs.aspectRatio,
          addOverlay: input.addOverlay || false,
          platformName: specs.displayName,
        })
      }

      case "check_platform_compliance": {
        const metadata = await invoke("ffmpeg_get_metadata", {
          filePath: input.videoPath,
        })
        const platformSpecs = platformService.getPlatformSpecs(input.platform as SupportedPlatform)

        return {
          platform: input.platform,
          videoPath: input.videoPath,
          compliance: checkCompliance(metadata, platformSpecs),
          recommendations: generateComplianceRecommendations(metadata, platformSpecs),
        }
      }

      case "get_optimization_stats":
        // Здесь должна быть логика получения статистики из базы данных
        // Пока возвращаем заглушку
        return {
          timeframe: input.timeframe || "all",
          totalOptimizations: 0,
          platformDistribution: {},
          averageCompressionRatio: 0,
          message: "Статистика будет доступна после выполнения оптимизаций",
        }

      case "generate_platform_metadata":
        return await generateMetadataForPlatform(
          input.videoPath,
          input.platform as SupportedPlatform,
          input.contentTheme,
          input.targetAudience,
          input.language || "ru",
          input.includeHashtags !== false,
        )

      default:
        throw new Error(`Неизвестный инструмент: ${toolName}`)
    }
  } catch (error) {
    logger.error(`Ошибка выполнения инструмента ${toolName}:`, { error: String(error) })
    throw error
  }
}

/**
 * Проверка соответствия требованиям платформы
 */
function checkCompliance(metadata: any, specs: any) {
  const issues: string[] = []
  const warnings: string[] = []

  // Проверка длительности
  if (metadata.duration < specs.minDuration) {
    issues.push(`Видео слишком короткое. Минимум: ${specs.minDuration}с, текущее: ${metadata.duration}с`)
  }
  if (metadata.duration > specs.maxDuration) {
    issues.push(`Видео слишком длинное. Максимум: ${specs.maxDuration}с, текущее: ${metadata.duration}с`)
  }

  // Проверка размера файла
  const fileSizeMB = (metadata.fileSize || 0) / (1024 * 1024)
  if (fileSizeMB > specs.maxFileSize) {
    issues.push(`Файл слишком большой. Максимум: ${specs.maxFileSize}MB, текущий: ${fileSizeMB.toFixed(2)}MB`)
  }

  // Проверка битрейта
  if ((metadata.bitRate || 0) > specs.maxBitrate) {
    warnings.push(
      `Битрейт превышает рекомендованный. Максимум: ${specs.maxBitrate}kbps, текущий: ${metadata.bitRate}kbps`,
    )
  }

  // Проверка соотношения сторон
  const currentAspectRatio = (metadata.width || 1) / (metadata.height || 1)
  const targetAspectRatio = specs.recommendedResolution.width / specs.recommendedResolution.height
  if (Math.abs(currentAspectRatio - targetAspectRatio) > 0.2) {
    warnings.push(`Соотношение сторон не оптимально. Рекомендуется: ${specs.aspectRatio}`)
  }

  return {
    compliant: issues.length === 0,
    issues,
    warnings,
    score: Math.max(0, 100 - issues.length * 25 - warnings.length * 10),
  }
}

/**
 * Генерация рекомендаций по соответствию
 */
function generateComplianceRecommendations(metadata: any, specs: any): string[] {
  const recommendations: string[] = []

  // Рекомендации по длительности
  if (metadata.duration < specs.minDuration) {
    recommendations.push(`Увеличьте длительность видео до ${specs.minDuration} секунд`)
  }
  if (metadata.duration > specs.maxDuration) {
    recommendations.push(`Сократите видео до ${specs.maxDuration} секунд`)
  }

  // Рекомендации по размеру
  const fileSizeMB = (metadata.fileSize || 0) / (1024 * 1024)
  if (fileSizeMB > specs.maxFileSize) {
    recommendations.push("Уменьшите размер файла (сжатие, битрейт, разрешение)")
  }

  // Рекомендации по качеству
  if ((metadata.bitRate || 0) > specs.maxBitrate) {
    recommendations.push(`Снизьте битрейт до ${specs.maxBitrate}kbps`)
  }

  // Рекомендации по формату
  recommendations.push(`Используйте кодек ${specs.videoCodec} для видео и ${specs.audioCodec} для аудио`)
  recommendations.push(
    `Установите разрешение ${specs.recommendedResolution.width}x${specs.recommendedResolution.height}`,
  )

  return recommendations
}

/**
 * Генерация метаданных для платформы
 */
async function generateMetadataForPlatform(
  videoPath: string,
  platform: SupportedPlatform,
  contentTheme: string,
  targetAudience?: string,
  _language = "ru",
  includeHashtags = true,
): Promise<any> {
  // Анализируем видео для получения контекста
  const _analysis = await invoke("ffmpeg_quick_analysis", { filePath: videoPath })
  const platformService = PlatformOptimizationService.getInstance()
  const specs = platformService.getPlatformSpecs(platform)

  // Генерируем заголовок в зависимости от платформы
  const title = generateTitle(platform, contentTheme, specs)

  // Генерируем описание
  const description = generateDescription(platform, contentTheme, targetAudience, specs)

  // Генерируем теги и хештеги
  const tags = generateTags(platform, contentTheme, includeHashtags)

  return {
    platform: specs.displayName,
    title,
    description,
    tags,
    hashtags: includeHashtags ? tags.filter((tag) => tag.startsWith("#")) : [],
    keywords: tags.filter((tag) => !tag.startsWith("#")),
    recommendations: [
      `Для ${specs.displayName} рекомендуется ${specs.aspectRatio} формат`,
      `Максимальная длительность: ${specs.maxDuration} секунд`,
      `Используйте ${specs.videoCodec} кодек для лучшего качества`,
    ],
  }
}

/**
 * Генерация заголовка для платформы
 */
function generateTitle(platform: SupportedPlatform, contentTheme: string, _specs: any): string {
  const templates = {
    youtube: `${contentTheme} | Подробный разбор`,
    tiktok: `${contentTheme} 🔥`,
    instagram_feed: `${contentTheme} ✨`,
    instagram_stories: contentTheme,
    instagram_reels: `${contentTheme} 💫`,
    facebook: `${contentTheme} - Интересный контент`,
    twitter: contentTheme,
    linkedin: `Профессиональный взгляд на ${contentTheme}`,
    vimeo: `${contentTheme} - Творческое видео`,
    twitch: `Стрим: ${contentTheme}`,
  }

  return templates[platform] || contentTheme
}

/**
 * Генерация описания для платформы
 */
function generateDescription(
  platform: SupportedPlatform,
  contentTheme: string,
  targetAudience?: string,
  _specs?: any,
): string {
  const baseDescription = `Контент на тему: ${contentTheme}`
  const audienceText = targetAudience ? ` для ${targetAudience}` : ""

  const platformDescriptions = {
    youtube: `${baseDescription}${audienceText}.\n\nПодписывайтесь на канал для новых видео!\n\n#YouTube #${contentTheme.replace(/\s+/g, "")}`,
    tiktok: `${baseDescription}${audienceText} 🎬\n\n#TikTok #${contentTheme.replace(/\s+/g, "")} #ВидеоКонтент`,
    instagram_feed: `${baseDescription}${audienceText} 📸\n\n#Instagram #${contentTheme.replace(/\s+/g, "")}`,
    instagram_stories: `${baseDescription}${audienceText}`,
    instagram_reels: `${baseDescription}${audienceText} 🎥\n\n#Reels #${contentTheme.replace(/\s+/g, "")}`,
    facebook: `${baseDescription}${audienceText}.\n\nПоделитесь с друзьями!\n\n#Facebook #${contentTheme.replace(/\s+/g, "")}`,
    twitter: `${baseDescription}${audienceText} 🧵\n\n#Twitter #${contentTheme.replace(/\s+/g, "")}`,
    linkedin: `Профессиональный контент: ${contentTheme}${audienceText}.\n\n#LinkedIn #ПрофессиональныйРост #${contentTheme.replace(/\s+/g, "")}`,
    vimeo: `Творческое видео: ${contentTheme}${audienceText}.\n\n#Vimeo #ТворчествоВидео #${contentTheme.replace(/\s+/g, "")}`,
    twitch: `Стрим на тему: ${contentTheme}${audienceText}.\n\nСледите за трансляциями!\n\n#Twitch #Стрим #${contentTheme.replace(/\s+/g, "")}`,
  }

  return platformDescriptions[platform] || baseDescription
}

/**
 * Генерация тегов для платформы
 */
function generateTags(platform: SupportedPlatform, contentTheme: string, includeHashtags: boolean): string[] {
  const baseTags = [contentTheme.replace(/\s+/g, ""), "видео", "контент"]
  const hashtags = includeHashtags ? baseTags.map((tag) => `#${tag}`) : []

  const platformTags = {
    youtube: [...baseTags, "youtube", "обзор", "туториал"],
    tiktok: [...hashtags, "#TikTok", "#Вирусное", "#Тренды"],
    instagram_feed: [...hashtags, "#Instagram", "#Фото", "#Стиль"],
    instagram_stories: [...hashtags, "#Stories", "#Момент"],
    instagram_reels: [...hashtags, "#Reels", "#Короткие", "#Вирус"],
    facebook: [...baseTags, "facebook", "социальные сети"],
    twitter: [...hashtags, "#Twitter", "#Новости", "#Обсуждение"],
    linkedin: [...baseTags, "linkedin", "профессиональное", "бизнес"],
    vimeo: [...baseTags, "vimeo", "творчество", "искусство"],
    twitch: [...baseTags, "twitch", "стрим", "игры"],
  }

  return platformTags[platform] || baseTags
}
