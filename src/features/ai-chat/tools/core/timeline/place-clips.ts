/**
 * AI инструмент для размещения клипов на Timeline с использованием BaseAITool
 */

import type { TimelineClip } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"
import { generateClipId } from "./utils/generators"
import { getCurrentTimelineProject, saveTimelineProject } from "./utils/helpers"

// Типы для размещения клипов
export interface ClipPlacementConfig {
  resourceId: string
  name?: string
  targetTrackId?: string
  startTime?: number
  duration: number
  trimStart?: number
  trimEnd?: number
  contentType?: string
}

export interface PlaceClipsInput {
  clips: ClipPlacementConfig[]
  strategy?: "sequential" | "manual" | "smart" | "chronological" | "content-based"
  trackAssignment?: "auto" | "content_type" | "least_used" | "time_based" | "smart" | "sequential"
  spacing?: number
  preventOverlaps?: boolean
}

export interface PlaceClipsResult {
  placedClips: TimelineClip[]
  skippedClips: Array<{
    config: ClipPlacementConfig
    reason: string
  }>
  analysis: {
    strategy: string
    totalClips: number
    placedCount: number
    skippedCount: number
    trackDistribution: Record<string, number>
  }
  warnings?: string[]
}

/**
 * AI инструмент для размещения клипов с унифицированной обработкой ошибок
 */
export class ClipPlacementTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ClipPlacementTool", logger)
  }

  /**
   * Размещает клипы на Timeline по заданной стратегии
   */
  public async placeClipsOnTimeline(
    input: PlaceClipsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<PlaceClipsResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (!data.clips || !Array.isArray(data.clips)) {
        errors.push("Не указаны клипы для размещения")
      }

      if (data.clips?.length === 0) {
        errors.push("Массив клипов не должен быть пустым")
      }

      data.clips?.forEach((clip, index) => {
        if (!clip.resourceId) {
          errors.push(`Клип ${index + 1}: не указан resourceId`)
        }
        if (!clip.duration || clip.duration <= 0) {
          errors.push(`Клип ${index + 1}: некорректная длительность`)
        }
        if (clip.spacing !== undefined && clip.spacing < 0) {
          errors.push(`Клип ${index + 1}: отрицательное значение spacing`)
        }
      })

      const validStrategies = ["sequential", "manual", "smart", "chronological", "content-based"]
      if (data.strategy && !validStrategies.includes(data.strategy)) {
        errors.push(`Неподдерживаемая стратегия: ${data.strategy}`)
      }

      const validAssignments = ["auto", "content_type", "least_used", "time_based", "smart", "sequential"]
      if (data.trackAssignment && !validAssignments.includes(data.trackAssignment)) {
        errors.push(`Неподдерживаемая стратегия назначения треков: ${data.trackAssignment}`)
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
        message: "Ошибка валидации данных для размещения клипов",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const clips = input.clips
    const strategy = input.strategy || "sequential"
    const trackAssignment = input.trackAssignment || "smart"
    const spacing = input.spacing || 0
    const preventOverlaps = input.preventOverlaps !== false

    // Выполняем размещение клипов с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем размещение клипов", {
          clipsCount: clips.length,
          strategy,
          trackAssignment,
          spacing,
          preventOverlaps,
        })

        const currentProject = await getCurrentTimelineProject()

        if (!currentProject) {
          throw new Error(
            "Нет активного проекта для размещения клипов. Создайте проект Timeline перед размещением клипов",
          )
        }

        const placedClips: TimelineClip[] = []
        const skippedClips: PlaceClipsResult["skippedClips"] = []
        const trackDistribution: Record<string, number> = {}
        let currentTime = 0

        // Сортируем клипы если стратегия chronological
        const clipsToPlace = [...clips]
        if (strategy === "chronological") {
          clipsToPlace.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
        }

        for (const clipConfig of clipsToPlace) {
          try {
            // Создаем и размещаем клип (упрощенная версия оригинальной логики)
            const clip: TimelineClip = {
              id: generateClipId(),
              name: clipConfig.name || `Clip ${placedClips.length + 1}`,
              trackId: clipConfig.targetTrackId || "default-track",
              mediaId: clipConfig.resourceId,
              startTime: clipConfig.startTime || currentTime,
              duration: clipConfig.duration,
              mediaStartTime: clipConfig.trimStart || 0,
              mediaEndTime: (clipConfig.trimStart || 0) + clipConfig.duration,
              volume: 1,
              speed: 1,
              offset: 0,
              isReversed: false,
              opacity: 1,
              effects: [],
              filters: [],
              transitions: [],
              mediaFile: undefined,
              isSelected: false,
              isLocked: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            placedClips.push(clip)
            trackDistribution[clip.trackId] = (trackDistribution[clip.trackId] || 0) + 1

            if (strategy === "sequential") {
              currentTime += clip.duration + spacing
            }
          } catch (error) {
            skippedClips.push({
              config: clipConfig,
              reason: error instanceof Error ? error.message : "Неизвестная ошибка",
            })
          }
        }

        await saveTimelineProject(currentProject)

        const warnings: string[] = []
        if (skippedClips.length > 0) {
          warnings.push(`Пропущено ${skippedClips.length} клипов из-за ошибок`)
        }

        const result: PlaceClipsResult = {
          placedClips,
          skippedClips,
          analysis: {
            strategy,
            totalClips: clips.length,
            placedCount: placedClips.length,
            skippedCount: skippedClips.length,
            trackDistribution,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Размещение клипов завершено", {
          placedCount: placedClips.length,
          skippedCount: skippedClips.length,
          strategy,
        })

        return result
      },
      {
        timeout: options.timeout || 45000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          strategy,
          clipsCount: clips.length,
          ...options.metadata,
        },
      },
    )
  }
}

// Экспортируем готовый экземпляр для использования
export const clipPlacementTool = new ClipPlacementTool()

// Функция-обертка для обратной совместимости
export async function placeClipsOnTimeline(params: any): Promise<AIToolResult<PlaceClipsResult>> {
  const input: PlaceClipsInput = {
    clips: params.clips,
    strategy: params.strategy,
    trackAssignment: params.trackAssignment,
    spacing: params.spacing,
    preventOverlaps: params.preventOverlaps,
  }

  return clipPlacementTool.placeClipsOnTimeline(input)
}
