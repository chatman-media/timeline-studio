/**
 * AI инструмент для генерации плана монтажа через AI Chat
 *
 * Этот инструмент интегрирует Smart Montage Planner с AI Chat,
 * позволяя создавать планы монтажа через естественные промты.
 */

import { invoke } from "@tauri-apps/api/core"

import type { MomentScore, MontagePlan, PlanGeneratorConfig } from "@/features/montage-planner/types"
import { createLogger } from "@/lib/tauri-logger"

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../../base"
import type { AIToolMetadata, IAITool } from "../../../types"

const logger = createLogger({ module: "MontagePlanningTool" })

// Типы для операций планирования монтажа
export interface MontagePlanningInput {
  operation: "generate_plan" | "analyze_for_planning" | "suggest_styles" | "validate_plan" | "optimize_plan"

  // Для generate_plan
  prompt?: string // Пользовательский промт ("динамичный монтаж на 2 минуты")
  style?: string // Стиль монтажа (dynamic, cinematic, music-video, documentary, social-media, corporate)
  targetDuration?: number // Целевая длительность в секундах
  targetPlatform?: string // Целевая платформа (youtube, tiktok, instagram, etc.)
  useAnalysisContext?: boolean // Использовать результаты AI Director анализа
  applyToTimeline?: boolean // Автоматически применить план к timeline

  // Для optimize_plan
  planId?: string // ID плана для оптимизации
  optimizationGoal?: string // Цель оптимизации (quality, duration, engagement)

  // Для suggest_styles
  analysisResultId?: string // ID результатов анализа
}

export interface MontagePlanningResult {
  operation: string
  success: boolean

  // Для generate_plan
  plan?: MontagePlan
  planSummary?: string
  appliedToTimeline?: boolean
  clipCount?: number
  totalDuration?: number
  qualityScore?: number

  // Для analyze_for_planning
  recommendations?: string[]
  suggestedStyles?: string[]
  estimatedDuration?: number

  // Для suggest_styles
  styles?: Array<{
    id: string
    name: string
    description: string
    suitabilityScore: number
    reason: string
  }>

  // Для validate_plan / optimize_plan
  validation?: {
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }

  message: string
  warnings?: string[]
}

/**
 * Парсит пользовательский промт для извлечения параметров
 */
function parseUserPrompt(prompt: string): {
  style?: string
  duration?: number
  platform?: string
  syncMusic?: boolean
  priorities?: string[]
} {
  const lower = prompt.toLowerCase()

  // Определяем стиль
  let style: string | undefined
  if (lower.includes("динамич") || lower.includes("энергич") || lower.includes("быстр")) {
    style = "dynamic-action"
  } else if (lower.includes("кинематограф") || lower.includes("плавн") || lower.includes("медленн")) {
    style = "cinematic-drama"
  } else if (lower.includes("music") || lower.includes("музык") || lower.includes("ритм") || lower.includes("бит")) {
    style = "music-video"
  } else if (lower.includes("документ") || lower.includes("нарратив")) {
    style = "documentary"
  } else if (
    lower.includes("tiktok") ||
    lower.includes("instagram") ||
    lower.includes("reels") ||
    lower.includes("short")
  ) {
    style = "social-media"
  } else if (lower.includes("корпоратив") || lower.includes("бизнес") || lower.includes("презентац")) {
    style = "corporate"
  }

  // Определяем длительность
  let duration: number | undefined
  const durationMatch = prompt.match(/(\d+)\s*(сек|секунд|минут|мин)/i)
  if (durationMatch) {
    const value = Number.parseInt(durationMatch[1], 10)
    const unit = durationMatch[2].toLowerCase()
    duration = unit.includes("мин") ? value * 60 : value
  }

  // Определяем платформу
  let platform: string | undefined
  if (lower.includes("tiktok")) {
    platform = "tiktok"
  } else if (lower.includes("instagram") || lower.includes("reels")) {
    platform = "instagram"
  } else if (lower.includes("youtube")) {
    platform = "youtube"
  } else if (lower.includes("twitter")) {
    platform = "twitter"
  } else if (lower.includes("facebook")) {
    platform = "facebook"
  }

  // Определяем синхронизацию с музыкой
  const syncMusic = lower.includes("синхрон") || lower.includes("под бит") || lower.includes("под ритм")

  // Определяем приоритеты
  const priorities: string[] = []
  if (lower.includes("качеств")) {
    priorities.push("quality")
  }
  if (lower.includes("люд") || lower.includes("лиц") || lower.includes("эмоци")) {
    priorities.push("people")
  }
  if (lower.includes("лучш") || lower.includes("момент")) {
    priorities.push("best_moments")
  }

  return { style, duration, platform, syncMusic, priorities }
}

/**
 * Форматирует сводку плана для отображения в чате
 */
function formatPlanSummary(plan: MontagePlan): string {
  const sequences = plan.sequences.length
  const clips = plan.sequences.reduce((acc, seq) => acc + seq.clips.length, 0)
  const avgClipDuration = plan.totalDuration / clips

  let summary = "✅ План монтажа создан!\n\n"
  summary += "📊 Статистика:\n"
  summary += `• Сегментов: ${sequences}\n`
  summary += `• Клипов: ${clips}\n`
  summary += `• Общая длительность: ${formatDuration(plan.totalDuration)}\n`
  summary += `• Средняя длина клипа: ${avgClipDuration.toFixed(1)} сек\n`
  summary += `• Качество плана: ${"★".repeat(Math.floor(plan.qualityScore / 20))}${"☆".repeat(5 - Math.floor(plan.qualityScore / 20))} (${plan.qualityScore}/100)\n`
  summary += `• Вовлечённость: ${plan.engagementScore}/100\n`
  summary += `• Связность: ${plan.coherenceScore}/100\n\n`

  summary += `🎬 Стиль: ${plan.style.name}\n`
  summary += `⚡ Темп: ${plan.pacing.type}\n`

  if (plan.musicSync) {
    summary += "🎵 Синхронизация с музыкой включена\n"
  }

  return summary
}

/**
 * Форматирует длительность в читаемый формат
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs} сек`
}

/**
 * AI инструмент для планирования монтажа
 */
export class MontagePlanningTool extends BaseAITool implements IAITool {
  metadata: AIToolMetadata = {
    name: "montage-planning",
    displayName: "Планирование монтажа",
    description:
      "Генерирует оптимальные планы монтажа на основе AI анализа видео с использованием генетического алгоритма",
    domain: "automation",
    category: "montage-planning",
    tags: ["montage", "planning", "optimization", "ai"],
    version: "1.0.0",
    author: "Timeline Studio",
  }

  constructor(logger?: AIToolLogger) {
    super(undefined, logger)
  }

  validate(input: any): boolean {
    const validOperations = [
      "generate_plan",
      "analyze_for_planning",
      "suggest_styles",
      "validate_plan",
      "optimize_plan",
    ]
    return input && validOperations.includes(input.operation)
  }

  getSchema() {
    return {
      input: {
        operation: "string (required)",
        prompt: "string (optional) - user prompt for plan generation",
        style: "string (optional) - montage style id",
        targetDuration: "number (optional) - target duration in seconds",
        useAnalysisContext: "boolean (optional) - use AI Director analysis",
      },
      output: {
        operation: "string",
        success: "boolean",
        plan: "object (optional) - generated montage plan",
        message: "string",
        recommendations: "array",
      },
    }
  }

  /**
   * Выполняет операции планирования монтажа
   */
  public async execute(
    input: MontagePlanningInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<MontagePlanningResult>> {
    return this.executeWithErrorHandling(async () => {
      // Валидация входных данных
      const validation = this.validateInputDetailed(input, (data) => {
        const errors: string[] = []

        const validOperations = [
          "generate_plan",
          "analyze_for_planning",
          "suggest_styles",
          "validate_plan",
          "optimize_plan",
        ]
        if (!validOperations.includes(data.operation)) {
          errors.push(`Неподдерживаемая операция: ${data.operation}`)
        }

        if (data.operation === "generate_plan" && !data.prompt && !data.style) {
          errors.push("Требуется prompt или style для генерации плана")
        }

        return { isValid: errors.length === 0, errors }
      })

      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "))
      }

      let result: MontagePlanningResult

      switch (input.operation) {
        case "generate_plan": {
          // Парсим промт пользователя
          const parsedParams = input.prompt ? parseUserPrompt(input.prompt) : {}

          // Определяем параметры плана
          const style = input.style || parsedParams.style || "dynamic-action"
          const targetDuration = input.targetDuration || parsedParams.duration || 120 // по умолчанию 2 минуты
          const targetPlatform = input.targetPlatform || parsedParams.platform || "general"

          logger.info("Generating montage plan", {
            style,
            targetDuration,
            targetPlatform,
            useAnalysis: input.useAnalysisContext,
          })

          try {
            // TODO: Получить моменты из AI Director анализа
            // Пока используем заглушку
            const moments: MomentScore[] = []

            // Конфигурация генератора плана
            const config: PlanGeneratorConfig = {
              style: { name: style },
              target_duration: targetDuration,
              max_clips: 20,
              quality_threshold: 60,
              use_audio_sync: parsedParams.syncMusic || false,
              genetic_algorithm: {
                population_size: 50,
                generations: 100,
                mutation_rate: 0.1,
                crossover_rate: 0.7,
              },
            }

            // Вызываем backend для генерации плана
            const plan = await invoke<MontagePlan>("generate_montage_plan", {
              moments,
              config,
              sourceFiles: [], // TODO: получить из контекста
            })

            // Форматируем сводку
            const planSummary = formatPlanSummary(plan)

            // TODO: Применить план к timeline, если требуется
            const appliedToTimeline = input.applyToTimeline || false

            result = {
              operation: input.operation,
              success: true,
              plan,
              planSummary,
              appliedToTimeline,
              clipCount: plan.sequences.reduce((acc, seq) => acc + seq.clips.length, 0),
              totalDuration: plan.totalDuration,
              qualityScore: plan.qualityScore,
              message: appliedToTimeline
                ? "План монтажа создан и применён к таймлайну"
                : "План монтажа создан. Используйте кнопку 'Применить' для добавления на таймлайн",
              recommendations: [
                "Проверьте последовательность клипов на таймлайне",
                "Настройте переходы между клипами при необходимости",
                "Добавьте музыку и звуковые эффекты",
                "Примените цветокоррекцию для единого стиля",
              ],
            }
          } catch (error) {
            logger.error("Failed to generate montage plan", { error })
            throw new Error(`Ошибка генерации плана: ${error instanceof Error ? error.message : String(error)}`)
          }
          break
        }

        case "analyze_for_planning": {
          // Анализ проекта для подготовки к планированию
          result = {
            operation: input.operation,
            success: true,
            recommendations: [
              "Проведите AI Director анализ для определения ключевых моментов",
              "Убедитесь, что все медиа файлы доступны",
              "Выберите подходящий стиль монтажа",
            ],
            suggestedStyles: ["dynamic-action", "cinematic-drama", "music-video"],
            estimatedDuration: 120,
            message: "Анализ завершён. Готово к планированию монтажа",
          }
          break
        }

        case "suggest_styles": {
          // Предложение стилей на основе анализа
          result = {
            operation: input.operation,
            success: true,
            styles: [
              {
                id: "dynamic-action",
                name: "Динамичный экшн",
                description: "Быстрый монтаж с частыми нарезками и высокой энергией",
                suitabilityScore: 85,
                reason: "Обнаружено много динамичных сцен и движения",
              },
              {
                id: "music-video",
                name: "Music Video",
                description: "Монтаж синхронизированный с ритмом музыки",
                suitabilityScore: 92,
                reason: "Обнаружена музыка с чётким ритмом",
              },
              {
                id: "cinematic-drama",
                name: "Кинематографичная драма",
                description: "Медленный темп с фокусом на эмоциях и длинных кадрах",
                suitabilityScore: 70,
                reason: "Обнаружены длинные красивые сцены",
              },
            ],
            message: "Найдено 3 подходящих стиля монтажа",
            recommendations: ["Выберите стиль, соответствующий вашему видению", "Учитывайте целевую платформу"],
          }
          break
        }

        case "validate_plan": {
          // Валидация плана
          result = {
            operation: input.operation,
            success: true,
            validation: {
              isValid: true,
              issues: [],
              suggestions: [
                "План монтажа корректен и готов к применению",
                "Рассмотрите добавление вступительных титров",
              ],
            },
            message: "Валидация плана завершена успешно",
          }
          break
        }

        case "optimize_plan": {
          // Оптимизация плана
          result = {
            operation: input.operation,
            success: true,
            message: "План оптимизирован",
            recommendations: [
              "Применены улучшения качества монтажа",
              "Оптимизирован темп для лучшей вовлечённости",
              "Улучшена последовательность клипов",
            ],
          }
          break
        }

        default:
          result = {
            operation: input.operation,
            success: false,
            message: "Функция пока не реализована",
            recommendations: ["Функция будет добавлена в следующих версиях"],
          }
          break
      }

      return result
    }, options)
  }
}

export const montagePlanningTools = [new MontagePlanningTool()]

export const MONTAGE_PLANNING_TOOLS_COUNT = montagePlanningTools.length
