/**
 * AI инструмент для создания нового проекта Timeline с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для создания проекта
export interface ProjectCreationInput {
  projectSettings: {
    name: string
    description?: string
    resolution: {
      width: number
      height: number
    }
    fps: number
    aspectRatio?: string
    duration?: number
    sampleRate?: number
  }
  autoCreateStructure?: boolean
  templateType?: "empty" | "basic" | "advanced" | "custom"
}

export interface ProjectSettings {
  name: string
  description?: string
  resolution: {
    width: number
    height: number
  }
  fps: number
  aspectRatio: string
  duration: number
  sampleRate: number
  channels: number
  bitDepth: number
  timeFormat: string
  snapToGrid: boolean
  gridSize: number
  autoSave: boolean
  autoSaveInterval: number
}

export interface ProjectCreationResult {
  projectId: string
  projectName: string
  createdElements: string[]
  trackStructure: {
    globalTracks: number
    videoTracks: number
    audioTracks: number
    subtitleTracks: number
  }
  projectSettings: ProjectSettings
  templateApplied: string
  recommendations: string[]
}

/**
 * AI инструмент для создания проекта Timeline с унифицированной обработкой ошибок
 */
export class ProjectCreationTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ProjectCreationTool", logger)
  }

  /**
   * Создает новый проект Timeline
   */
  public async createNewTimelineProject(
    input: ProjectCreationInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ProjectCreationResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      // Проверка обязательных полей
      if (!data.projectSettings) {
        errors.push("Настройки проекта обязательны")
      } else {
        if (!data.projectSettings.name || data.projectSettings.name.trim() === "") {
          errors.push("Название проекта обязательно")
        }

        if (!data.projectSettings.resolution) {
          errors.push("Разрешение проекта обязательно")
        } else {
          if (!data.projectSettings.resolution.width || data.projectSettings.resolution.width <= 0) {
            errors.push("Ширина разрешения должна быть больше 0")
          }
          if (!data.projectSettings.resolution.height || data.projectSettings.resolution.height <= 0) {
            errors.push("Высота разрешения должна быть больше 0")
          }
        }

        if (!data.projectSettings.fps || data.projectSettings.fps <= 0) {
          errors.push("FPS должен быть больше 0")
        }

        // Проверка допустимых значений FPS
        const validFPS = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60]
        if (data.projectSettings.fps && !validFPS.includes(data.projectSettings.fps)) {
          errors.push(`Неподдерживаемый FPS: ${data.projectSettings.fps}. Допустимые значения: ${validFPS.join(", ")}`)
        }
      }

      // Проверка типа шаблона
      const validTemplates = ["empty", "basic", "advanced", "custom"]
      if (data.templateType && !validTemplates.includes(data.templateType)) {
        errors.push(
          `Неподдерживаемый тип шаблона: ${data.templateType}. Допустимые значения: ${validTemplates.join(", ")}`,
        )
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
        message: "Ошибка валидации параметров создания проекта",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const autoCreateStructure = input.autoCreateStructure !== false // По умолчанию true
    const templateType = input.templateType || "basic"

    // Выполняем создание проекта с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем создание нового проекта Timeline", {
          projectName: input.projectSettings.name,
          resolution: `${input.projectSettings.resolution.width}x${input.projectSettings.resolution.height}`,
          fps: input.projectSettings.fps,
          templateType,
          autoCreateStructure,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineStateAccess = getTimelineStateAccess()

        if (!timelineStateAccess) {
          throw new Error("Timeline state access не настроен")
        }

        // Генерируем уникальный ID проекта
        const projectId = this.generateProjectId()

        this.logger?.info("Создаем структуру проекта", { projectId })

        // Создаем настройки проекта
        const projectSettings: ProjectSettings = {
          name: input.projectSettings.name,
          description: input.projectSettings.description,
          resolution: input.projectSettings.resolution,
          fps: input.projectSettings.fps,
          aspectRatio:
            input.projectSettings.aspectRatio ||
            this.calculateAspectRatio(input.projectSettings.resolution.width, input.projectSettings.resolution.height),
          duration: input.projectSettings.duration || 0,
          sampleRate: input.projectSettings.sampleRate || 48000,
          channels: 2,
          bitDepth: 24,
          timeFormat: "timecode",
          snapToGrid: true,
          gridSize: 1,
          autoSave: true,
          autoSaveInterval: 300,
        }

        // Создаем базовую структуру проекта
        const project: TimelineProject = {
          id: projectId,
          name: projectSettings.name,
          description: projectSettings.description,
          duration: projectSettings.duration,
          fps: projectSettings.fps,
          sampleRate: projectSettings.sampleRate,
          sections: [],
          globalTracks: [],
          markers: [],
          resources: {
            effects: [],
            filters: [],
            transitions: [],
            timelineTransitions: [],
            templates: [],
            styleTemplates: [],
            subtitleStyles: [],
            music: [],
            media: [],
          },
          settings: {
            resolution: projectSettings.resolution,
            fps: projectSettings.fps,
            aspectRatio: projectSettings.aspectRatio,
            sampleRate: projectSettings.sampleRate,
            channels: projectSettings.channels,
            bitDepth: projectSettings.bitDepth,
            timeFormat: projectSettings.timeFormat as "timecode" | "seconds" | "frames",
            snapToGrid: projectSettings.snapToGrid,
            gridSize: projectSettings.gridSize,
            autoSave: projectSettings.autoSave,
            autoSaveInterval: projectSettings.autoSaveInterval,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          version: "1.0.0",
        }

        const createdElements: string[] = []
        const trackStructure = {
          globalTracks: 0,
          videoTracks: 0,
          audioTracks: 0,
          subtitleTracks: 0,
        }

        // Автоматически создаем базовую структуру треков
        if (autoCreateStructure) {
          this.logger?.info("Создаем базовую структуру треков", { templateType })

          const tracks = this.createDefaultTrackStructure(templateType)
          project.globalTracks = tracks

          // Подсчитываем созданные треки
          tracks.forEach((track) => {
            createdElements.push(track.id)
            trackStructure.globalTracks++

            switch (track.type) {
              case "video":
                trackStructure.videoTracks++
                break
              case "audio":
                trackStructure.audioTracks++
                break
              case "subtitle":
                trackStructure.subtitleTracks++
                break
            }
          })
        }

        // Сохраняем проект
        this.logger?.info("Сохраняем проект в Timeline", {
          projectId,
          tracksCreated: createdElements.length,
        })

        await timelineStateAccess.createProject(project)

        // Генерируем рекомендации для нового проекта
        const recommendations = this.generateProjectRecommendations(project, templateType)

        const result: ProjectCreationResult = {
          projectId,
          projectName: projectSettings.name,
          createdElements,
          trackStructure,
          projectSettings,
          templateApplied: templateType,
          recommendations,
        }

        this.logger?.info("Проект успешно создан", {
          projectId,
          projectName: result.projectName,
          elementsCreated: createdElements.length,
          template: templateType,
        })

        return result
      },
      {
        timeout: options.timeout || 30000, // 30 секунд для создания проекта
        retries: options.retries || 2,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          projectName: input.projectSettings.name,
          templateType,
          resolution: `${input.projectSettings.resolution.width}x${input.projectSettings.resolution.height}`,
          fps: input.projectSettings.fps,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Генерирует уникальный ID проекта
   */
  private generateProjectId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `timeline_project_${timestamp}_${random}`
  }

  /**
   * Вычисляет соотношение сторон
   */
  private calculateAspectRatio(width: number, height: number): string {
    // Находим НОД для упрощения дроби
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
    const divisor = gcd(width, height)
    const aspectWidth = width / divisor
    const aspectHeight = height / divisor

    // Известные соотношения сторон
    const knownRatios: Record<string, string> = {
      "16:9": "16:9",
      "4:3": "4:3",
      "21:9": "21:9",
      "1:1": "1:1",
      "3:2": "3:2",
      "5:4": "5:4",
    }

    const ratio = `${aspectWidth}:${aspectHeight}`
    return knownRatios[ratio] || ratio
  }

  /**
   * Создает структуру треков по умолчанию
   */
  private createDefaultTrackStructure(templateType: string): any[] {
    const tracks: any[] = []
    const baseId = Date.now()

    switch (templateType) {
      case "empty":
        // Пустой проект - только один видео и один аудио трек
        tracks.push({
          id: `video_track_${baseId}`,
          name: "Видео 1",
          type: "video",
          clips: [],
          muted: false,
          solo: false,
          locked: false,
          height: 60,
          expanded: true,
          color: "#3B82F6",
        })

        tracks.push({
          id: `audio_track_${baseId + 1}`,
          name: "Аудио 1",
          type: "audio",
          clips: [],
          muted: false,
          solo: false,
          locked: false,
          height: 60,
          expanded: true,
          color: "#10B981",
        })
        break

      case "basic":
        // Базовый проект - 2 видео, 2 аудио, 1 субтитры
        for (let i = 0; i < 2; i++) {
          tracks.push({
            id: `video_track_${baseId + i}`,
            name: `Видео ${i + 1}`,
            type: "video",
            clips: [],
            muted: false,
            solo: false,
            locked: false,
            height: 60,
            expanded: true,
            color: i === 0 ? "#3B82F6" : "#6366F1",
          })
        }

        for (let i = 0; i < 2; i++) {
          tracks.push({
            id: `audio_track_${baseId + i + 2}`,
            name: `Аудио ${i + 1}`,
            type: "audio",
            clips: [],
            muted: false,
            solo: false,
            locked: false,
            height: 60,
            expanded: true,
            color: i === 0 ? "#10B981" : "#14B8A6",
          })
        }

        tracks.push({
          id: `subtitle_track_${baseId + 4}`,
          name: "Субтитры",
          type: "subtitle",
          clips: [],
          muted: false,
          solo: false,
          locked: false,
          height: 40,
          expanded: true,
          color: "#F59E0B",
        })
        break

      case "advanced":
        // Продвинутый проект - 4 видео, 4 аудио, 2 субтитры
        for (let i = 0; i < 4; i++) {
          tracks.push({
            id: `video_track_${baseId + i}`,
            name: `Видео ${i + 1}`,
            type: "video",
            clips: [],
            muted: false,
            solo: false,
            locked: false,
            height: 60,
            expanded: true,
            color: ["#3B82F6", "#6366F1", "#8B5CF6", "#A855F7"][i],
          })
        }

        for (let i = 0; i < 4; i++) {
          tracks.push({
            id: `audio_track_${baseId + i + 4}`,
            name: `Аудио ${i + 1}`,
            type: "audio",
            clips: [],
            muted: false,
            solo: false,
            locked: false,
            height: 60,
            expanded: true,
            color: ["#10B981", "#14B8A6", "#06B6D4", "#0EA5E9"][i],
          })
        }

        for (let i = 0; i < 2; i++) {
          tracks.push({
            id: `subtitle_track_${baseId + i + 8}`,
            name: `Субтитры ${i + 1}`,
            type: "subtitle",
            clips: [],
            muted: false,
            solo: false,
            locked: false,
            height: 40,
            expanded: true,
            color: i === 0 ? "#F59E0B" : "#EF4444",
          })
        }
        break

      case "custom":
        // Пользовательский шаблон - минимальная структура
        tracks.push({
          id: `video_track_${baseId}`,
          name: "Видео",
          type: "video",
          clips: [],
          muted: false,
          solo: false,
          locked: false,
          height: 60,
          expanded: true,
          color: "#3B82F6",
        })
        break
    }

    return tracks
  }

  /**
   * Генерирует рекомендации для нового проекта
   */
  private generateProjectRecommendations(project: TimelineProject, templateType: string): string[] {
    const recommendations: string[] = []

    // Общие рекомендации
    recommendations.push(`Проект "${project.name}" создан с шаблоном "${templateType}"`)
    recommendations.push("Начните добавлять медиафайлы в браузере медиа")
    recommendations.push("Настройте параметры проекта в настройках при необходимости")

    // Специфичные рекомендации по шаблону
    switch (templateType) {
      case "empty":
        recommendations.push("Минимальная структура создана - добавьте дополнительные треки по мере необходимости")
        break

      case "basic":
        recommendations.push("Базовая структура готова для большинства проектов")
        recommendations.push("Используйте субтитровый трек для добавления текста")
        break

      case "advanced":
        recommendations.push("Продвинутая структура позволяет сложный монтаж")
        recommendations.push("Используйте разные треки для многослойной композиции")
        break

      case "custom":
        recommendations.push("Минимальная структура - настройте под ваши потребности")
        break
    }

    // Рекомендации по настройкам
    if (project.settings?.resolution) {
      const { width, height } = project.settings.resolution
      if (width >= 3840 && height >= 2160) {
        recommendations.push("4K разрешение - убедитесь в достаточной производительности системы")
      } else if (width >= 1920 && height >= 1080) {
        recommendations.push("Full HD разрешение - оптимально для большинства проектов")
      }
    }

    if (project.fps) {
      if (project.fps >= 50) {
        recommendations.push("Высокий FPS - отлично для динамичного контента")
      } else if (project.fps <= 25) {
        recommendations.push("Стандартный FPS - подходит для большинства видео")
      }
    }

    // Следующие шаги
    recommendations.push("Создайте резервную копию проекта после добавления контента")
    recommendations.push("Регулярно сохраняйте изменения во время работы")

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const projectCreationTool = new ProjectCreationTool()

// Функция-обертка для обратной совместимости
export async function createTimelineProject(params: any): Promise<AIToolResult<ProjectCreationResult>> {
  const input: ProjectCreationInput = {
    projectSettings: params.projectSettings,
    autoCreateStructure: params.autoCreateStructure,
    templateType: params.templateType,
  }

  return projectCreationTool.createNewTimelineProject(input)
}
