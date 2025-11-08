/**
 * AI инструмент для создания структуры треков на Timeline с использованием BaseAITool
 */

import type { TimelineTrack, TrackType } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"
import { generateTrackId } from "./utils/generators"
import { getCurrentTimelineProject, saveTimelineProject } from "./utils/helpers"

// Типы для создания треков
export interface TrackConfig {
  name?: string
  type: "video" | "audio" | "subtitle" | "effects" | "music"
  height?: number
  volume?: number
  pan?: number
  isLocked?: boolean
  isMuted?: boolean
  isHidden?: boolean
}

export interface CreateTracksInput {
  tracks: TrackConfig[]
  targetType?: "global" | "section"
  targetSectionId?: string
  replaceExisting?: boolean
}

export interface CreateTracksResult {
  createdTracks: TimelineTrack[]
  analysis: {
    tracksCreated: number
    targetType: string
    targetSectionId?: string
    trackTypes: Record<string, number>
  }
  warnings?: string[]
}

/**
 * AI инструмент для создания треков с унифицированной обработкой ошибок
 */
export class TrackCreationTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("TrackCreationTool", logger)
  }

  /**
   * Создает структуру треков на Timeline
   */
  public async createTrackStructure(
    input: CreateTracksInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<CreateTracksResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (!data.tracks || !Array.isArray(data.tracks)) {
        errors.push("Не указаны треки для создания")
      }

      if (data.tracks?.length === 0) {
        errors.push("Массив треков не должен быть пустым")
      }

      // Проверяем каждый трек
      data.tracks?.forEach((track, index) => {
        if (!track.type) {
          errors.push(`Трек ${index + 1}: не указан тип трека`)
        }

        const validTypes = ["video", "audio", "subtitle", "effects", "music"]
        if (track.type && !validTypes.includes(track.type)) {
          errors.push(`Трек ${index + 1}: неподдерживаемый тип трека ${track.type}`)
        }

        if (track.volume !== undefined && (track.volume < 0 || track.volume > 1)) {
          errors.push(`Трек ${index + 1}: громкость должна быть в диапазоне 0-1`)
        }

        if (track.pan !== undefined && (track.pan < -1 || track.pan > 1)) {
          errors.push(`Трек ${index + 1}: панорама должна быть в диапазоне -1 до 1`)
        }
      })

      if (data.targetType && !["global", "section"].includes(data.targetType)) {
        errors.push(`Неподдерживаемый тип цели: ${data.targetType}`)
      }

      if (data.targetType === "section" && !data.targetSectionId) {
        errors.push("При targetType=section необходимо указать targetSectionId")
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
        message: "Ошибка валидации данных для создания треков",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    // Устанавливаем значения по умолчанию
    const tracks = input.tracks
    const targetType = input.targetType || "global"
    const targetSectionId = input.targetSectionId
    const replaceExisting = input.replaceExisting || false

    // Выполняем создание треков с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем создание треков", {
          tracksCount: tracks.length,
          targetType,
          targetSectionId,
          replaceExisting,
        })

        const currentProject = await getCurrentTimelineProject()

        if (!currentProject) {
          throw new Error("Нет активного проекта для создания треков. Создайте проект Timeline перед созданием треков")
        }

        const newTracks: TimelineTrack[] = tracks.map((trackConfig, index) => ({
          id: generateTrackId(),
          name: trackConfig.name || `Track ${index + 1}`,
          type: trackConfig.type as TrackType,
          order: index,
          clips: [],
          isLocked: trackConfig.isLocked === true,
          isMuted: trackConfig.isMuted === true,
          isHidden: trackConfig.isHidden === true,
          isSolo: false,
          volume: trackConfig.volume ?? 1,
          pan: trackConfig.pan ?? 0,
          height: trackConfig.height ?? 100,
          trackEffects: [],
          trackFilters: [],
          transitions: [],
        }))

        const warnings: string[] = []

        if (targetType === "section" && targetSectionId) {
          // Добавляем треки в конкретную секцию
          const section = currentProject.sections.find((s) => s.id === targetSectionId)

          if (!section) {
            throw new Error(`Секция с ID ${targetSectionId} не найдена`)
          }

          if (replaceExisting) {
            if (section.tracks.length > 0) {
              warnings.push(`Заменено ${section.tracks.length} существующих треков в секции`)
            }
            section.tracks = newTracks
          } else {
            // Обновляем порядок для новых треков
            newTracks.forEach((track, index) => {
              track.order = section.tracks.length + index
            })
            section.tracks.push(...newTracks)
          }
        } else {
          // Добавляем глобальные треки
          if (replaceExisting) {
            if (currentProject.globalTracks.length > 0) {
              warnings.push(`Заменено ${currentProject.globalTracks.length} существующих глобальных треков`)
            }
            currentProject.globalTracks = newTracks
          } else {
            // Обновляем порядок для новых треков
            newTracks.forEach((track, index) => {
              track.order = currentProject.globalTracks.length + index
            })
            currentProject.globalTracks.push(...newTracks)
          }
        }

        await saveTimelineProject(currentProject)

        // Подсчитываем типы треков
        const trackTypes = newTracks.reduce<Record<string, number>>((acc, track) => {
          acc[track.type] = (acc[track.type] || 0) + 1
          return acc
        }, {})

        const result: CreateTracksResult = {
          createdTracks: newTracks,
          analysis: {
            tracksCreated: newTracks.length,
            targetType,
            targetSectionId,
            trackTypes,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Треки успешно созданы", {
          tracksCreated: newTracks.length,
          targetType,
          trackTypes: Object.keys(trackTypes).join(", "),
          warningsCount: warnings.length,
        })

        return result
      },
      {
        timeout: options.timeout || 30000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          tracksCount: tracks.length,
          targetType,
          replaceExisting,
          ...options.metadata,
        },
      },
    )
  }
}

// Экспортируем готовый экземпляр для использования
export const trackCreationTool = new TrackCreationTool()

// Функция-обертка для обратной совместимости
export async function createTrackStructure(params: any): Promise<AIToolResult<CreateTracksResult>> {
  const input: CreateTracksInput = {
    tracks: params.tracks,
    targetType: params.targetType,
    targetSectionId: params.targetSectionId,
    replaceExisting: params.replaceExisting,
  }

  return trackCreationTool.createTrackStructure(input)
}
