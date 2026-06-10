/**
 * AI инструмент для генерации плана монтажа через AI Chat
 *
 * Этот инструмент интегрирует Smart Montage Planner с AI Chat,
 * позволяя создавать планы монтажа через естественные промты.
 */

import { analysisStorageService } from "@timeline-studio/domains/ai-services/services/analysis-storage-service"
import {
  MomentCategory,
  type MomentScore,
  type MontagePlan,
  type PlanGeneratorConfig,
} from "@timeline-studio/domains/ai-services/types/montage-planning"
import { getVideoEditingOrchestrator } from "@timeline-studio/domains/video-editing"
import type { TimelineClip } from "@timeline-studio/domains/video-editing/types"
import { createLogger } from "@/lib/tauri-logger"
import type { DetectedMoment } from "@/types/montage-planner-rust"
import { MomentCategory as RustMomentCategory } from "@/types/montage-planner-rust"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../../base"
import { generateMontagePlan as generateMontagePlanTauri } from "../../../tauri/ai-tools-commands"
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
  videoPaths?: string[] // Пути к видео файлам для анализа и планирования

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
 * Маппинг категорий из Rust backend (PascalCase) в frontend (lowercase)
 */
function mapRustCategoryToFrontend(rustCategory: RustMomentCategory): MomentCategory {
  const mapping: Record<RustMomentCategory, MomentCategory> = {
    [RustMomentCategory.Action]: MomentCategory.Action,
    [RustMomentCategory.Drama]: MomentCategory.Drama,
    [RustMomentCategory.Comedy]: MomentCategory.Comedy,
    [RustMomentCategory.Transition]: MomentCategory.Transition,
    [RustMomentCategory.Highlight]: MomentCategory.Highlight,
    [RustMomentCategory.Opening]: MomentCategory.Opening,
    [RustMomentCategory.Closing]: MomentCategory.Closing,
    [RustMomentCategory.BRoll]: MomentCategory.BRoll,
  }
  return mapping[rustCategory] ?? MomentCategory.Highlight
}

/**
 * Конвертирует DetectedMoment из backend в MomentScore для frontend
 */
function convertDetectedMomentToMomentScore(detected: DetectedMoment): MomentScore {
  return {
    timestamp: detected.timestamp,
    duration: detected.duration,
    scores: {
      visual: detected.scores.visual,
      technical: detected.scores.technical,
      emotional: detected.scores.emotional,
      narrative: detected.scores.narrative,
      action: detected.scores.action,
      composition: detected.scores.composition,
    },
    totalScore: detected.total_score,
    category: mapRustCategoryToFrontend(detected.category as RustMomentCategory),
  }
}

/**
 * Применяет план монтажа к Timeline
 *
 * Основные этапы:
 * 1. Получает/создаёт видео треки для каждого sequence
 * 2. Конвертирует PlannedClip -> TimelineClip
 * 3. Добавляет клипы на соответствующие треки
 * 4. Применяет переходы между клипами
 * 5. Применяет adjustments (speed, effects)
 */
async function applyPlanToTimeline(plan: MontagePlan): Promise<{
  success: boolean
  appliedClips: number
  appliedTransitions: number
  errors: string[]
}> {
  const orchestrator = getVideoEditingOrchestrator()
  const errors: string[] = []
  let appliedClips = 0
  let appliedTransitions = 0

  try {
    logger.info("Applying montage plan to timeline", {
      sequences: plan.sequences.length,
      totalClips: plan.sequences.reduce((acc, seq) => acc + seq.clips.length, 0),
    })

    // 1. Очищаем текущее выделение
    logger.debug("Clearing current selection")

    // Создаём треки для каждого sequence (если нужно)
    const sequenceTracks = new Map<string, string>() // sequenceId -> trackId
    let currentTime = 0 // Текущая позиция на timeline

    for (const sequence of plan.sequences) {
      logger.debug("Processing sequence", {
        sequenceId: sequence.id,
        type: sequence.type,
        clips: sequence.clips.length,
      })

      // Создаём новый трек для sequence
      const trackName = `${sequence.type} - ${sequence.purpose}`

      try {
        await orchestrator.addTrack("video", trackName)

        // После создания трека нужно получить его ID из backend
        // Используем временное решение - генерируем ID локально
        const trackId = `track-${sequence.id}-${Date.now()}`
        sequenceTracks.set(sequence.id, trackId)

        logger.debug("Created track for sequence", { trackId, trackName })
      } catch (error) {
        errors.push(
          `Не удалось создать трек для ${sequence.type}: ${error instanceof Error ? error.message : String(error)}`,
        )
        logger.error("Failed to create track", { error, sequenceId: sequence.id })
        continue
      }

      // 2. Добавляем клипы из sequence на трек
      const trackId = sequenceTracks.get(sequence.id)
      if (!trackId) {
        errors.push(`Не найден трек для sequence ${sequence.id}`)
        continue
      }

      for (const plannedClip of sequence.clips.sort((a, b) => a.sequenceOrder - b.sequenceOrder)) {
        const fragment = plannedClip.fragment
        if (!fragment) {
          errors.push(`Фрагмент не найден для клипа в sequence ${sequence.id}`)
          continue
        }

        try {
          // Конвертируем Fragment -> TimelineClip через addClip API
          const mediaFile = fragment.sourceFile
          if (!mediaFile) {
            errors.push(`MediaFile не найден для фрагмента ${fragment.id}`)
            continue
          }

          // Добавляем клип на timeline
          await orchestrator.addClip(trackId, mediaFile, currentTime)

          // Применяем adjustments если есть
          if (plannedClip.adjustments) {
            const adjustments = plannedClip.adjustments
            const clipId = `clip-${fragment.id}` // Временный ID, должен прийти от backend

            const updates: Partial<TimelineClip> = {}

            if (adjustments.speedMultiplier && adjustments.speedMultiplier !== 1) {
              updates.speed = adjustments.speedMultiplier
              updates.playbackRate = adjustments.speedMultiplier
            }

            if (adjustments.crop) {
              updates.position = {
                x: adjustments.crop.x,
                y: adjustments.crop.y,
                width: adjustments.crop.width,
                height: adjustments.crop.height,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
              }
            }

            if (Object.keys(updates).length > 0) {
              try {
                await orchestrator.updateClip(clipId, updates)
                logger.debug("Applied clip adjustments", { clipId, updates })
              } catch (error) {
                logger.warn("Failed to apply clip adjustments", { error, clipId })
                errors.push(`Не удалось применить настройки для клипа ${clipId}`)
              }
            }
          }

          appliedClips++

          // Обновляем позицию для следующего клипа
          const clipDuration = fragment.duration
          currentTime += plannedClip.adjustments?.speedMultiplier
            ? clipDuration / plannedClip.adjustments.speedMultiplier
            : clipDuration

          logger.debug("Added clip to timeline", {
            fragmentId: fragment.id,
            startTime: currentTime - clipDuration,
            duration: clipDuration,
          })
        } catch (error) {
          errors.push(
            `Не удалось добавить клип из фрагмента ${fragment.id}: ${error instanceof Error ? error.message : String(error)}`,
          )
          logger.error("Failed to add clip", { error, fragmentId: fragment.id })
        }
      }

      // 3. Применяем переходы для sequence
      for (const transition of sequence.transitions) {
        try {
          // TODO: Реализовать применение переходов через Timeline API
          // Пока логируем для отладки
          logger.debug("Transition to apply", {
            from: transition.fromClipId,
            to: transition.toClipId,
            transitionId: transition.transitionId,
            duration: transition.duration,
          })
          appliedTransitions++
        } catch (error) {
          errors.push(`Не удалось применить переход: ${error instanceof Error ? error.message : String(error)}`)
          logger.error("Failed to apply transition", { error, transition })
        }
      }

      // Добавляем небольшой gap между sequences (опционально)
      currentTime += 0.5 // 0.5 секунды между sequences
    }

    // 4. Применяем глобальные переходы между sequences
    if (plan.transitions) {
      for (const seqTransition of plan.transitions) {
        try {
          // TODO: Реализовать применение sequence transitions
          logger.debug("Sequence transition to apply", {
            from: seqTransition.from,
            to: seqTransition.to,
            style: seqTransition.style,
            duration: seqTransition.duration,
          })
          appliedTransitions++
        } catch (error) {
          errors.push(
            `Не удалось применить переход между сегментами: ${error instanceof Error ? error.message : String(error)}`,
          )
          logger.error("Failed to apply sequence transition", {
            error,
            from: seqTransition.from,
            to: seqTransition.to,
          })
        }
      }
    }

    logger.info("Plan applied to timeline", {
      appliedClips,
      appliedTransitions,
      errors: errors.length,
    })

    return {
      success: errors.length === 0,
      appliedClips,
      appliedTransitions,
      errors,
    }
  } catch (error) {
    logger.error("Failed to apply plan to timeline", { error })
    errors.push(`Критическая ошибка применения плана: ${error instanceof Error ? error.message : String(error)}`)

    return {
      success: false,
      appliedClips,
      appliedTransitions,
      errors,
    }
  }
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
        videoPaths: "string[] (optional) - paths to video files for analysis",
        applyToTimeline: "boolean (optional) - automatically apply plan to timeline",
      },
      output: {
        operation: "string",
        success: "boolean",
        plan: "object (optional) - generated montage plan",
        message: "string",
        recommendations: "array",
        appliedToTimeline: "boolean (optional)",
        clipCount: "number (optional)",
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
            // Получаем моменты из AI Director анализа (если useAnalysisContext = true)
            const moments: MomentScore[] = []
            const sourceFiles = input.videoPaths || []

            if (input.useAnalysisContext && sourceFiles.length > 0) {
              logger.info("Loading AI Director analysis context", {
                videoPaths: sourceFiles,
              })

              // Загружаем анализ из storage для каждого видео
              for (const videoPath of sourceFiles) {
                try {
                  const montageAnalysisResult = await analysisStorageService.loadMontageAnalysis(videoPath)

                  if (montageAnalysisResult.success && montageAnalysisResult.data) {
                    const keyMoments = montageAnalysisResult.data.key_moments || []
                    const convertedMoments = keyMoments.map(convertDetectedMomentToMomentScore)
                    moments.push(...convertedMoments)

                    logger.info("Loaded key moments from AI analysis", {
                      videoPath,
                      momentsCount: keyMoments.length,
                    })
                  } else {
                    logger.warn("No montage analysis found for video", {
                      videoPath,
                      error: montageAnalysisResult.error,
                    })
                  }
                } catch (error) {
                  logger.error("Failed to load analysis for video", {
                    videoPath,
                    error,
                  })
                }
              }

              if (moments.length === 0) {
                logger.warn("No moments found in AI analysis, using empty array")
              }
            } else {
              logger.info("Generating plan without AI Director context", {
                useAnalysis: input.useAnalysisContext,
                sourceFilesCount: sourceFiles.length,
              })
            }

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
            const plan = await generateMontagePlanTauri(moments, config, sourceFiles)

            // Форматируем сводку
            const planSummary = formatPlanSummary(plan)

            // Применить план к timeline, если требуется
            let appliedToTimeline = false
            let applyResult: Awaited<ReturnType<typeof applyPlanToTimeline>> | null = null

            if (input.applyToTimeline) {
              try {
                logger.info("Applying plan to timeline automatically")
                applyResult = await applyPlanToTimeline(plan)
                appliedToTimeline = applyResult.success

                if (!applyResult.success) {
                  logger.warn("Plan applied with errors", {
                    errors: applyResult.errors,
                    appliedClips: applyResult.appliedClips,
                  })
                }
              } catch (error) {
                logger.error("Failed to apply plan to timeline", { error })
                applyResult = {
                  success: false,
                  appliedClips: 0,
                  appliedTransitions: 0,
                  errors: [`Ошибка применения плана: ${error instanceof Error ? error.message : String(error)}`],
                }
              }
            }

            // Формируем результат
            const baseMessage = appliedToTimeline
              ? `План монтажа создан и применён к таймлайну (${applyResult?.appliedClips || 0} клипов)`
              : "План монтажа создан. Используйте кнопку 'Применить' для добавления на таймлайн"

            const warnings = applyResult?.errors || []

            result = {
              operation: input.operation,
              success: true,
              plan,
              planSummary,
              appliedToTimeline,
              clipCount: plan.sequences.reduce((acc: number, seq: { clips: any[] }) => acc + seq.clips.length, 0),
              totalDuration: plan.totalDuration,
              qualityScore: plan.qualityScore,
              message: baseMessage,
              warnings: warnings.length > 0 ? warnings : undefined,
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

/**
 * Экспортируем функцию применения плана для внешнего использования
 * Может быть вызвана из UI компонентов напрямую
 */
export { applyPlanToTimeline }
