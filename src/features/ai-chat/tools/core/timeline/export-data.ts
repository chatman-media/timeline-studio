/**
 * AI инструмент для экспорта данных Timeline с использованием BaseAITool
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для экспорта данных Timeline
export interface TimelineExportInput {
  exportFormat: "json" | "xml" | "csv" | "edl" | "fcpxml" | "davinci-resolve"
  includeData?: {
    projectSettings?: boolean
    sections?: boolean
    tracks?: boolean
    clips?: boolean
    effects?: boolean
    transitions?: boolean
    metadata?: boolean
  }
  exportScope?: "full-project" | "selected-elements" | "time-range"
}

export interface TimelineExportResult {
  exportData: string
  statistics: {
    totalElements: number
    includedSections: number
    includedTracks: number
    includedClips: number
    includedEffects: number
    includedTransitions: number
    format: string
    compressionRatio: number
  }
  fileInfo: {
    name: string
    format: string
    size: number
    timestamp: string
  }
  recommendations: string[]
}

/**
 * AI инструмент для экспорта данных Timeline с унифицированной обработкой ошибок
 */
export class TimelineExportTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("TimelineExportTool", logger)
  }

  /**
   * Экспортирует данные Timeline в указанном формате
   */
  public async exportTimelineData(
    input: TimelineExportInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<TimelineExportResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      if (!data.exportFormat) {
        errors.push("Не указан формат экспорта")
      }

      const validFormats = ["json", "xml", "csv", "edl", "fcpxml", "davinci-resolve"]
      if (data.exportFormat && !validFormats.includes(data.exportFormat)) {
        errors.push(`Неподдерживаемый формат экспорта: ${data.exportFormat}`)
      }

      const validScopes = ["full-project", "selected-elements", "time-range"]
      if (data.exportScope && !validScopes.includes(data.exportScope)) {
        errors.push(`Неподдерживаемая область экспорта: ${data.exportScope}`)
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
        message: "Ошибка валидации входных данных для экспорта",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    // Устанавливаем значения по умолчанию
    const exportFormat = input.exportFormat
    const includeData = {
      projectSettings: true,
      sections: true,
      tracks: true,
      clips: true,
      effects: true,
      transitions: true,
      metadata: true,
      ...input.includeData,
    }
    const exportScope = input.exportScope || "full-project"

    // Выполняем экспорт с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем экспорт данных Timeline", {
          format: exportFormat,
          scope: exportScope,
          includeDataKeys: Object.keys(includeData).filter((key) => includeData[key as keyof typeof includeData]),
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен. Доступ к timeline не сконфигурирован")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для экспорта. Откройте или создайте проект в timeline")
        }

        // Подготавливаем данные для экспорта
        const exportData = await this.prepareExportData(currentProject, includeData, exportScope)

        // Форматируем данные в соответствии с выбранным форматом
        const formattedData = await this.formatExportData(exportData, exportFormat)

        // Генерируем имя файла
        const fileName = this.generateExportFileName(currentProject.name || "timeline", exportFormat)

        // Получаем статистику экспорта
        const exportStats = this.calculateExportStats(exportData, exportFormat)

        // Генерируем рекомендации
        const recommendations = this.generateExportRecommendations(exportFormat, exportStats, includeData)

        const result: TimelineExportResult = {
          exportData: formattedData,
          statistics: exportStats,
          fileInfo: {
            name: fileName,
            format: exportFormat,
            size: this.calculateDataSize(formattedData),
            timestamp: new Date().toISOString(),
          },
          recommendations,
        }

        this.logger?.info("Экспорт данных Timeline завершен", {
          format: exportFormat,
          fileSize: result.fileInfo.size,
          elementsCount: exportStats.totalElements,
          recommendationsCount: recommendations.length,
        })

        return result
      },
      {
        timeout: options.timeout || 30000,
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 1000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          exportFormat,
          exportScope,
          projectId: input.exportFormat, // Будет заменен реальным ID проекта внутри executeWithErrorHandling
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Подготавливает данные для экспорта
   */
  private async prepareExportData(project: any, includeData: any, exportScope: string): Promise<any> {
    const exportData: any = {
      version: "1.0.0",
      exportTimestamp: new Date().toISOString(),
      exportScope,
    }

    // Настройки проекта
    if (includeData.projectSettings) {
      exportData.projectSettings = {
        name: project.name,
        id: project.id,
        duration: project.duration,
        frameRate: project.frameRate,
        resolution: project.resolution,
        audioSampleRate: project.audioSampleRate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    }

    // Получаем все треки
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section: any) => allTracks.push(...section.tracks))

    // Секции
    if (includeData.sections) {
      exportData.sections = project.sections.map((section: any) => ({
        id: section.id,
        name: section.name,
        startTime: section.startTime,
        duration: section.duration,
        color: section.color,
        description: section.description,
        trackIds: section.tracks.map((track: any) => track.id),
      }))
    }

    // Треки
    if (includeData.tracks) {
      exportData.tracks = allTracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        type: track.type,
        sectionId: track.sectionId,
        height: track.height,
        volume: track.volume,
        muted: track.muted,
        locked: track.locked,
        clipIds: track.clips.map((clip: any) => clip.id),
      }))
    }

    // Клипы
    if (includeData.clips) {
      const allClips: any[] = []
      allTracks.forEach((track) => allClips.push(...track.clips))

      exportData.clips = allClips.map((clip: any) => ({
        id: clip.id,
        name: clip.name,
        trackId: clip.trackId,
        startTime: clip.startTime,
        duration: clip.duration,
        mediaFile: clip.mediaFile,
        volume: clip.volume,
        speed: clip.speed,
        opacity: clip.opacity,
        effectIds: clip.effects?.map((effect: any) => effect.id) || [],
        transitionIds: clip.transitions?.map((transition: any) => transition.id) || [],
      }))
    }

    // Эффекты
    if (includeData.effects) {
      const allEffects: any[] = []
      allTracks.forEach((track) => {
        track.clips.forEach((clip: any) => {
          if (clip.effects) {
            allEffects.push(...clip.effects)
          }
        })
      })

      exportData.effects = allEffects.map((effect: any) => ({
        id: effect.id,
        type: effect.type,
        name: effect.name,
        parameters: effect.parameters,
        enabled: effect.enabled,
        startTime: effect.startTime,
        duration: effect.duration,
      }))
    }

    // Переходы
    if (includeData.transitions) {
      const allTransitions: any[] = []
      allTracks.forEach((track) => {
        track.clips.forEach((clip: any) => {
          if (clip.transitions) {
            allTransitions.push(...clip.transitions)
          }
        })
      })

      exportData.transitions = allTransitions.map((transition: any) => ({
        id: transition.id,
        type: transition.type,
        name: transition.name,
        duration: transition.duration,
        startTime: transition.startTime,
        endTime: transition.endTime,
        parameters: transition.parameters,
      }))
    }

    // Метаданные
    if (includeData.metadata) {
      exportData.metadata = {
        totalTracks: allTracks.length,
        totalClips: allTracks.reduce((sum: number, track: any) => sum + track.clips.length, 0),
        totalSections: project.sections.length,
        videoTracks: allTracks.filter((track: any) => track.type === "video").length,
        audioTracks: allTracks.filter((track: any) => track.type === "audio").length,
        projectDuration: project.duration,
        exportedBy: "Timeline Studio AI",
      }
    }

    return exportData
  }

  /**
   * Форматирует данные в соответствии с выбранным форматом
   */
  private async formatExportData(exportData: any, format: string): Promise<any> {
    switch (format) {
      case "json":
        return JSON.stringify(exportData, null, 2)

      case "xml":
        return this.convertToXML(exportData)

      case "csv":
        return this.convertToCSV(exportData)

      case "edl":
        return this.convertToEDL(exportData)

      case "fcpxml":
        return this.convertToFCPXML(exportData)

      case "davinci-resolve":
        return this.convertToDaVinciResolve(exportData)

      default:
        return JSON.stringify(exportData, null, 2)
    }
  }

  /**
   * Конвертирует данные в XML формат
   */
  private convertToXML(data: any): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
    const xmlContent = this.objectToXML(data, "timeline")
    return xmlHeader + xmlContent
  }

  /**
   * Конвертирует данные в CSV формат
   */
  private convertToCSV(data: any): string {
    const csvLines: string[] = []

    // Заголовки CSV
    csvLines.push("Type,ID,Name,StartTime,Duration,TrackType,SectionId")

    // Клипы
    if (data.clips) {
      data.clips.forEach((clip: any) => {
        csvLines.push(["Clip", clip.id, clip.name || "", clip.startTime, clip.duration, "", ""].join(","))
      })
    }

    // Треки
    if (data.tracks) {
      data.tracks.forEach((track: any) => {
        csvLines.push(["Track", track.id, track.name || "", "", "", track.type, track.sectionId || ""].join(","))
      })
    }

    return csvLines.join("\n")
  }

  /**
   * Конвертирует данные в EDL формат
   */
  private convertToEDL(data: any): string {
    const edlLines: string[] = []
    edlLines.push("TITLE: Timeline Studio Export")
    edlLines.push("FCM: NON-DROP FRAME")
    edlLines.push("")

    if (data.clips) {
      data.clips.forEach((clip: any, index: number) => {
        const editNumber = String(index + 1).padStart(3, "0")
        const timecode = this.formatTimecode(clip.startTime)
        const duration = this.formatTimecode(clip.duration)

        edlLines.push(`${editNumber}  ${clip.name || "CLIP"} V     C        ${timecode} ${duration}`)
      })
    }

    return edlLines.join("\n")
  }

  /**
   * Конвертирует данные в FCPXML формат
   */
  private convertToFCPXML(data: any): string {
    const fcpxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <resources>
    <!-- Resources would go here -->
  </resources>
  <library>
    <event name="Timeline Studio Export">
      <project name="${data.projectSettings?.name || "Exported Project"}">
        <sequence format="r1" tcStart="0s">
          <spine>
            ${
              data.clips
                ?.map(
                  (clip: any) => `
            <video offset="${clip.startTime}s" duration="${clip.duration}s" name="${clip.name || "Clip"}">
              <adjust-conform type="fit"/>
            </video>`,
                )
                .join("") || ""
            }
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

    return fcpxmlContent
  }

  /**
   * Конвертирует данные в DaVinci Resolve формат
   */
  private convertToDaVinciResolve(data: any): string {
    const resolveData = {
      version: "1.0",
      timelineData: {
        name: data.projectSettings?.name || "Exported Timeline",
        frameRate: data.projectSettings?.frameRate || 24,
        resolution: data.projectSettings?.resolution || { width: 1920, height: 1080 },
        tracks: data.tracks || [],
        clips: data.clips || [],
      },
      metadata: data.metadata || {},
    }

    return JSON.stringify(resolveData, null, 2)
  }

  /**
   * Преобразует объект в XML формат
   */
  private objectToXML(obj: any, rootName: string): string {
    const xmlLines: string[] = []
    xmlLines.push(`<${rootName}>`)

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        xmlLines.push(`  <${key}>`)
        value.forEach((item: any) => {
          xmlLines.push("    <item>")
          if (typeof item === "object") {
            for (const [itemKey, itemValue] of Object.entries(item)) {
              let safeValue = ""
              if (itemValue !== null && itemValue !== undefined) {
                if (typeof itemValue === "object") {
                  safeValue = JSON.stringify(itemValue)
                } else {
                  // Type is string, number, boolean, etc - safe to stringify
                  safeValue = String(itemValue as string | number | boolean)
                }
              }
              xmlLines.push(`      <${itemKey}>${safeValue}</${itemKey}>`)
            }
          } else {
            xmlLines.push(`      ${item}`)
          }
          xmlLines.push("    </item>")
        })
        xmlLines.push(`  </${key}>`)
      } else if (typeof value === "object") {
        xmlLines.push(`  <${key}>`)
        for (const [subKey, subValue] of Object.entries(value as any)) {
          let safeSubValue = ""
          if (subValue === null || subValue === undefined) {
            safeSubValue = ""
          } else if (typeof subValue === "object") {
            safeSubValue = JSON.stringify(subValue)
          } else {
            safeSubValue =
              typeof subValue === "string" || typeof subValue === "number" || typeof subValue === "boolean"
                ? String(subValue)
                : JSON.stringify(subValue)
          }
          xmlLines.push(`    <${subKey}>${safeSubValue}</${subKey}>`)
        }
        xmlLines.push(`  </${key}>`)
      } else {
        let safeValue = ""
        if (value === null || value === undefined) {
          safeValue = ""
        } else if (typeof value === "object") {
          safeValue = JSON.stringify(value)
        } else {
          safeValue =
            typeof value === "string" || typeof value === "number" || typeof value === "boolean"
              ? String(value)
              : JSON.stringify(value)
        }
        xmlLines.push(`  <${key}>${safeValue}</${key}>`)
      }
    }

    xmlLines.push(`</${rootName}>`)
    return xmlLines.join("\n")
  }

  /**
   * Форматирует время в формат timecode
   */
  private formatTimecode(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 24) // Assuming 24fps

    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
  }

  /**
   * Генерирует имя файла для экспорта
   */
  private generateExportFileName(projectName: string, format: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
    const extension = this.getFileExtension(format)
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_")

    return `${sanitizedName}_export_${timestamp}.${extension}`
  }

  /**
   * Определяет расширение файла по формату
   */
  private getFileExtension(format: string): string {
    switch (format) {
      case "json":
        return "json"
      case "xml":
        return "xml"
      case "csv":
        return "csv"
      case "edl":
        return "edl"
      case "fcpxml":
        return "fcpxml"
      case "davinci-resolve":
        return "resolve"
      default:
        return "txt"
    }
  }

  /**
   * Вычисляет статистику экспорта
   */
  private calculateExportStats(exportData: any, format: string): any {
    return {
      totalElements: Object.keys(exportData).length,
      includedSections: exportData.sections?.length || 0,
      includedTracks: exportData.tracks?.length || 0,
      includedClips: exportData.clips?.length || 0,
      includedEffects: exportData.effects?.length || 0,
      includedTransitions: exportData.transitions?.length || 0,
      format,
      compressionRatio: this.calculateCompressionRatio(exportData, format),
    }
  }

  /**
   * Вычисляет степень сжатия данных
   */
  private calculateCompressionRatio(data: any, _format: string): number {
    const jsonSize = JSON.stringify(data).length
    const formattedSize = this.calculateDataSize(data)
    return formattedSize / jsonSize
  }

  /**
   * Вычисляет размер данных в байтах
   */
  private calculateDataSize(data: any): number {
    if (typeof data === "string") {
      return new TextEncoder().encode(data).length
    }
    return new TextEncoder().encode(JSON.stringify(data)).length
  }

  /**
   * Генерирует рекомендации по экспорту
   */
  private generateExportRecommendations(format: string, stats: any, includeData: any): string[] {
    const recommendations: string[] = []

    // Рекомендации по форматам
    switch (format) {
      case "json":
        recommendations.push("JSON формат подходит для резервного копирования и импорта в Timeline Studio")
        break
      case "xml":
        recommendations.push("XML формат обеспечивает структурированный обмен данными")
        break
      case "csv":
        recommendations.push("CSV формат подходит для анализа данных в электронных таблицах")
        break
      case "edl":
        recommendations.push("EDL формат совместим с большинством профессиональных видеоредакторов")
        break
      case "fcpxml":
        recommendations.push("FCPXML формат предназначен для Final Cut Pro X")
        break
      case "davinci-resolve":
        recommendations.push("Формат DaVinci Resolve для импорта в DaVinci Resolve")
        break
      default:
        recommendations.push("Выбранный формат подходит для экспорта данных")
        break
    }

    // Рекомендации по содержимому
    if (stats.includedClips > 100) {
      recommendations.push("Большое количество клипов - рассмотрите разделение на несколько файлов")
    }

    if (stats.includedEffects > 50) {
      recommendations.push("Много эффектов - проверьте совместимость с целевой системой")
    }

    if (!includeData.metadata) {
      recommendations.push("Включите метаданные для лучшей совместимости")
    }

    recommendations.push("Сохраните экспортированные данные в безопасном месте")
    recommendations.push("Проверьте целостность данных перед использованием")

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const timelineExportTool = new TimelineExportTool()

// Функция-обертка для обратной совместимости
export async function exportTimelineData(params: any): Promise<AIToolResult<TimelineExportResult>> {
  // Преобразуем старые параметры в новый формат
  const input: TimelineExportInput = {
    exportFormat: params.exportFormat || "json",
    includeData: params.includeData,
    exportScope: params.exportScope,
  }

  return timelineExportTool.exportTimelineData(input)
}
