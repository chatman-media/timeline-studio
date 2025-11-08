/**
 * AI инструмент для создания секций на Timeline с использованием BaseAITool
 */

import type { TimelineClip, TimelineSection } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"
import { calculateSectionsCoverage } from "./utils/calculators"
import {
  createManualSections,
  createSectionsByContentType,
  createSectionsByDate,
  createSectionsByDuration,
  createSectionsByLocation,
  createSmartSections,
} from "./utils/creators"
import { getCurrentTimelineProject, saveTimelineProject } from "./utils/helpers"

// Типы для создания секций
export interface ManualSectionConfig {
  name?: string
  startTime?: number
  endTime?: number
  duration?: number
  color?: string
  tags?: string[]
}

export interface SectionSettings {
  sectionDuration?: number
  defaultColor?: string
  sections?: ManualSectionConfig[]
}

export interface CreateSectionsInput {
  strategy: "by-date" | "by-duration" | "by-content-type" | "by-location" | "manual" | "smart"
  sectionSettings?: SectionSettings
  targetClips?: string[]
}

export interface CreateSectionsResult {
  createdSections: TimelineSection[]
  analysis: {
    strategy: string
    sectionsCount: number
    totalCoverage: number
    processedClips: number
  }
  warnings?: string[]
}

/**
 * AI инструмент для создания секций с унифицированной обработкой ошибок
 */
export class SectionCreationTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("SectionCreationTool", logger)
  }

  /**
   * Создает секции на Timeline по заданной стратегии
   */
  public async createSectionsByStrategy(
    input: CreateSectionsInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<CreateSectionsResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (!data.strategy) {
        errors.push("Не указана стратегия создания секций")
      }

      const validStrategies = ["by-date", "by-duration", "by-content-type", "by-location", "manual", "smart"]
      if (data.strategy && !validStrategies.includes(data.strategy)) {
        errors.push(`Неподдерживаемая стратегия: ${data.strategy}`)
      }

      if (data.sectionSettings?.sectionDuration !== undefined && data.sectionSettings.sectionDuration <= 0) {
        errors.push("Длительность секции должна быть положительным числом")
      }

      if (
        data.strategy === "manual" &&
        (!data.sectionSettings?.sections || data.sectionSettings.sections.length === 0)
      ) {
        errors.push("Для manual стратегии необходимо указать массив секций")
      }

      if (data.targetClips && !Array.isArray(data.targetClips)) {
        errors.push("targetClips должен быть массивом строк")
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
        message: "Ошибка валидации данных для создания секций",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const strategy = input.strategy
    const sectionSettings = input.sectionSettings || {}
    const targetClips = input.targetClips || []

    // Выполняем создание секций с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем создание секций", {
          strategy,
          targetClipsCount: targetClips.length,
          sectionSettings: Object.keys(sectionSettings),
        })

        const currentProject = await getCurrentTimelineProject()

        if (!currentProject) {
          throw new Error("Нет активного проекта для создания секций. Создайте проект Timeline перед созданием секций")
        }

        // Собираем все клипы из проекта
        const allClips: TimelineClip[] = []
        currentProject.globalTracks.forEach((track) => allClips.push(...track.clips))
        currentProject.sections.forEach((section) => {
          section.tracks.forEach((track) => allClips.push(...track.clips))
        })

        // Фильтруем клипы если указаны конкретные
        const clipsToProcess =
          targetClips.length > 0 ? allClips.filter((clip) => targetClips.includes(clip.id)) : allClips

        if (targetClips.length > 0 && clipsToProcess.length === 0) {
          throw new Error("Указанные клипы не найдены в проекте")
        }

        let sections: TimelineSection[] = []

        switch (strategy) {
          case "by-date":
            sections = createSectionsByDate(clipsToProcess, sectionSettings)
            break
          case "by-duration":
            sections = createSectionsByDuration(clipsToProcess, sectionSettings)
            break
          case "by-content-type":
            sections = createSectionsByContentType(clipsToProcess, sectionSettings)
            break
          case "by-location":
            sections = createSectionsByLocation(clipsToProcess, sectionSettings)
            break
          case "manual":
            sections = createManualSections(sectionSettings)
            break
          case "smart":
            sections = createSmartSections(clipsToProcess, sectionSettings)
            break
          default:
            sections = createSmartSections(clipsToProcess, sectionSettings)
            break
        }

        if (sections.length === 0) {
          throw new Error(`Не удалось создать секции по стратегии "${strategy}". Проверьте настройки и исходные данные`)
        }

        // Добавляем секции в проект
        currentProject.sections.push(...sections)
        await saveTimelineProject(currentProject)

        const totalCoverage = calculateSectionsCoverage(sections)
        const warnings: string[] = []

        if (totalCoverage < 0.5) {
          warnings.push("Секции покрывают менее 50% Timeline - рассмотрите изменение стратегии")
        }

        if (sections.length === 1) {
          warnings.push("Создана только одна секция - возможно, стоит разделить контент")
        }

        const result: CreateSectionsResult = {
          createdSections: sections,
          analysis: {
            strategy,
            sectionsCount: sections.length,
            totalCoverage,
            processedClips: clipsToProcess.length,
          },
          warnings: warnings.length > 0 ? warnings : undefined,
        }

        this.logger?.info("Секции успешно созданы", {
          strategy,
          sectionsCount: sections.length,
          totalCoverage,
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
          strategy,
          targetClipsCount: targetClips.length,
          ...options.metadata,
        },
      },
    )
  }
}

// Экспортируем готовый экземпляр для использования
export const sectionCreationTool = new SectionCreationTool()

// Функция-обертка для обратной совместимости
export async function createSectionsByStrategy(params: any): Promise<AIToolResult<CreateSectionsResult>> {
  const input: CreateSectionsInput = {
    strategy: params.strategy,
    sectionSettings: params.sectionSettings,
    targetClips: params.targetClips,
  }

  return sectionCreationTool.createSectionsByStrategy(input)
}
