/**
 * AI инструмент для интеллектуального управления клипами Timeline с использованием BaseAITool
 */

import type { TimelineClip, TimelineProject } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для управления клипами
export interface ClipManagementInput {
  operation: "organize" | "cleanup" | "analyze" | "batch-edit" | "smart-sort"
  scope?: "all" | "selected" | "track" | "section"
  targetId?: string // ID трека или секции для операций с ограниченной областью
  organizationCriteria?: ("type" | "duration" | "date" | "name" | "quality")[]
  cleanupOptions?: {
    removeEmpty?: boolean
    removeDuplicates?: boolean
    removeCorrupted?: boolean
    consolidateShort?: boolean
    minDuration?: number
  }
  batchEditOptions?: {
    adjustVolume?: number
    adjustSpeed?: number
    applyEffects?: string[]
    normalizeAudio?: boolean
  }
}

export interface ClipInfo {
  id: string
  name: string
  trackId: string
  startTime: number
  duration: number
  type: string
  mediaPath?: string
  issues: string[]
  qualityScore: number
  recommendations: string[]
}

export interface ClipAnalysis {
  totalClips: number
  byType: Record<string, number>
  byTrack: Record<string, number>
  averageDuration: number
  issues: {
    empty: number
    corrupted: number
    duplicates: number
    tooShort: number
    missingFiles: number
  }
  qualityDistribution: {
    excellent: number
    good: number
    fair: number
    poor: number
  }
}

export interface BatchOperation {
  type: string
  description: string
  affectedClips: number
  estimatedTime: number
  risks: string[]
  reversible: boolean
}

export interface ClipManagementResult {
  operation: string
  scope: string
  processedClips: number
  clipAnalysis: ClipAnalysis
  clipDetails?: ClipInfo[]
  batchOperations?: BatchOperation[]
  organizationResults?: {
    newStructure: Record<string, string[]>
    movedClips: number
    newTracks: number
  }
  cleanupResults?: {
    removedClips: string[]
    consolidatedClips: string[]
    fixedIssues: string[]
  }
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для управления клипами с унифицированной обработкой ошибок
 */
export class ClipManagementTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ClipManagementTool", logger)
  }

  /**
   * Выполняет операции управления клипами
   */
  public async manageTimelineClips(
    input: ClipManagementInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ClipManagementResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = ["organize", "cleanup", "analyze", "batch-edit", "smart-sort"]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      const validScopes = ["all", "selected", "track", "section"]
      if (data.scope && !validScopes.includes(data.scope)) {
        errors.push(`Неподдерживаемая область: ${data.scope}`)
      }

      if ((data.scope === "track" || data.scope === "section") && !data.targetId) {
        errors.push("Для операций с треком или секцией требуется targetId")
      }

      const validCriteria = ["type", "duration", "date", "name", "quality"]
      if (data.organizationCriteria?.some((criteria: string) => !validCriteria.includes(criteria))) {
        errors.push("Неподдерживаемые критерии организации")
      }

      if (data.cleanupOptions?.minDuration !== undefined && data.cleanupOptions.minDuration < 0) {
        errors.push("Минимальная длительность должна быть положительной")
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
        message: "Ошибка валидации параметров управления клипами",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation
    const scope = input.scope || "all"

    // Выполняем операции с клипами с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем операции управления клипами", {
          operation,
          scope,
          targetId: input.targetId,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для управления клипами. Откройте или создайте проект в timeline")
        }

        // Получаем клипы в зависимости от области операции
        const targetClips = this.getTargetClips(currentProject, scope, input.targetId)

        if (targetClips.length === 0) {
          throw new Error("Не найдено клипов в указанной области для обработки")
        }

        this.logger?.info("Анализируем клипы", {
          totalClips: targetClips.length,
          operation,
        })

        // Выполняем анализ клипов
        const clipAnalysis = this.analyzeClips(targetClips)
        const clipDetails = operation === "analyze" ? this.generateClipDetails(targetClips) : undefined

        const result: ClipManagementResult = {
          operation,
          scope,
          processedClips: targetClips.length,
          clipAnalysis,
          clipDetails,
          recommendations: [],
          warnings: [],
        }

        const warnings: string[] = []

        // Выполняем конкретную операцию
        switch (operation) {
          case "organize":
            this.logger?.info("Выполняем организацию клипов")
            result.organizationResults = await this.organizeClips(
              targetClips,
              input.organizationCriteria || ["type", "duration"],
              currentProject,
            )
            break

          case "cleanup":
            this.logger?.info("Выполняем очистку клипов")
            result.cleanupResults = await this.cleanupClips(targetClips, input.cleanupOptions || {}, currentProject)

            if (result.cleanupResults.removedClips.length > 0) {
              warnings.push(`Будет удалено ${result.cleanupResults.removedClips.length} клипов - это необратимо`)
            }
            break

          case "batch-edit":
            this.logger?.info("Выполняем пакетное редактирование")
            result.batchOperations = await this.prepareBatchOperations(targetClips, input.batchEditOptions || {})
            break

          case "smart-sort":
            this.logger?.info("Выполняем умную сортировку")
            result.organizationResults = await this.smartSortClips(targetClips, currentProject)
            break

          case "analyze":
            // Анализ уже выполнен выше
            this.logger?.info("Анализ клипов завершен")
            break
        }

        // Генерируем рекомендации
        result.recommendations = this.generateClipRecommendations(operation, clipAnalysis, result)

        // Добавляем предупреждения по безопасности
        if (operation === "cleanup" && clipAnalysis.issues.corrupted > 0) {
          warnings.push("Обнаружены поврежденные клипы - проверьте резервные копии")
        }

        if (operation === "batch-edit" && targetClips.length > 50) {
          warnings.push("Пакетное редактирование большого количества клипов может занять много времени")
        }

        result.warnings = warnings.length > 0 ? warnings : undefined

        this.logger?.info("Операции управления клипами завершены", {
          operation,
          processedClips: result.processedClips,
          warningsCount: warnings.length,
        })

        return result
      },
      {
        timeout: options.timeout || 120000, // 2 минуты для операций с клипами
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          scope,
          targetId: input.targetId,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Получает целевые клипы в зависимости от области операции
   */
  private getTargetClips(project: TimelineProject, scope: string, targetId?: string): TimelineClip[] {
    const allClips: TimelineClip[] = []

    switch (scope) {
      case "all":
        // Все клипы проекта
        project.globalTracks.forEach((track) => allClips.push(...track.clips))
        project.sections.forEach((section) => {
          section.tracks.forEach((track) => allClips.push(...track.clips))
        })
        break

      case "track":
        // Клипы конкретного трека
        if (!targetId) throw new Error("Не указан ID трека")

        const track = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
          (t) => t.id === targetId,
        )

        if (track) {
          allClips.push(...track.clips)
        }
        break

      case "section":
        // Клипы конкретной секции
        if (!targetId) throw new Error("Не указан ID секции")

        const section = project.sections.find((s) => s.id === targetId)
        if (section) {
          section.tracks.forEach((track) => allClips.push(...track.clips))
        }
        break

      case "selected":
        // В реальной реализации здесь бы использовались выбранные клипы
        // Для демонстрации берем все клипы
        project.globalTracks.forEach((track) => allClips.push(...track.clips))
        project.sections.forEach((section) => {
          section.tracks.forEach((track) => allClips.push(...track.clips))
        })
        break
    }

    return allClips
  }

  /**
   * Анализирует коллекцию клипов
   */
  private analyzeClips(clips: TimelineClip[]): ClipAnalysis {
    const analysis: ClipAnalysis = {
      totalClips: clips.length,
      byType: {},
      byTrack: {},
      averageDuration: 0,
      issues: {
        empty: 0,
        corrupted: 0,
        duplicates: 0,
        tooShort: 0,
        missingFiles: 0,
      },
      qualityDistribution: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      },
    }

    if (clips.length === 0) return analysis

    let totalDuration = 0

    // Анализируем каждый клип
    clips.forEach((clip) => {
      // Подсчет по типам
      const type = this.getClipType(clip)
      analysis.byType[type] = (analysis.byType[type] || 0) + 1

      // Подсчет по трекам
      analysis.byTrack[clip.trackId] = (analysis.byTrack[clip.trackId] || 0) + 1

      // Длительность
      totalDuration += clip.duration

      // Анализ проблем
      if (clip.duration === 0) analysis.issues.empty++
      if (clip.duration < 0.5) analysis.issues.tooShort++
      if (!clip.mediaFile) analysis.issues.missingFiles++
      if (clip.mediaFile && (clip.mediaFile as any).status === "missing") analysis.issues.corrupted++

      // Оценка качества
      const quality = this.assessClipQuality(clip)
      if (quality >= 8) analysis.qualityDistribution.excellent++
      else if (quality >= 6) analysis.qualityDistribution.good++
      else if (quality >= 4) analysis.qualityDistribution.fair++
      else analysis.qualityDistribution.poor++
    })

    analysis.averageDuration = totalDuration / clips.length

    // Поиск дубликатов
    analysis.issues.duplicates = this.findDuplicates(clips).length

    return analysis
  }

  /**
   * Определяет тип клипа
   */
  private getClipType(clip: TimelineClip): string {
    if (clip.mediaFile?.isVideo) return "video"
    if (clip.mediaFile?.isAudio) return "audio"
    if (clip.mediaFile?.isImage) return "image"
    return "unknown"
  }

  /**
   * Оценивает качество клипа
   */
  private assessClipQuality(clip: TimelineClip): number {
    let score = 5 // Базовый балл

    // Положительные факторы
    if (clip.mediaFile) score += 2
    if (clip.effects && clip.effects.length > 0) score += 1
    if (clip.transitions && clip.transitions.length > 0) score += 1
    if (clip.duration >= 2 && clip.duration <= 30) score += 1

    // Негативные факторы
    if (clip.duration < 0.5) score -= 3
    if (!clip.mediaFile) score -= 4
    if (clip.mediaFile && (clip.mediaFile as any).status === "missing") score -= 3

    return Math.max(0, Math.min(10, score))
  }

  /**
   * Находит дублированные клипы
   */
  private findDuplicates(clips: TimelineClip[]): string[] {
    const duplicates: string[] = []
    const seen = new Set<string>()

    clips.forEach((clip) => {
      const key = `${clip.mediaFile?.path || clip.name}_${clip.duration}`
      if (seen.has(key)) {
        duplicates.push(clip.id)
      } else {
        seen.add(key)
      }
    })

    return duplicates
  }

  /**
   * Генерирует детальную информацию о клипах
   */
  private generateClipDetails(clips: TimelineClip[]): ClipInfo[] {
    return clips.map((clip) => ({
      id: clip.id,
      name: clip.name,
      trackId: clip.trackId,
      startTime: clip.startTime,
      duration: clip.duration,
      type: this.getClipType(clip),
      mediaPath: clip.mediaFile?.path,
      issues: this.identifyClipIssues(clip),
      qualityScore: this.assessClipQuality(clip),
      recommendations: this.generateClipRecommendationsForClip(clip),
    }))
  }

  /**
   * Определяет проблемы конкретного клипа
   */
  private identifyClipIssues(clip: TimelineClip): string[] {
    const issues: string[] = []

    if (clip.duration === 0) issues.push("Нулевая длительность")
    if (clip.duration < 0.5) issues.push("Слишком короткий")
    if (!clip.mediaFile) issues.push("Отсутствует медиафайл")
    if (clip.mediaFile && (clip.mediaFile as any).status === "missing") issues.push("Файл не найден")
    if (clip.volume === 0) issues.push("Отключен звук")

    return issues
  }

  /**
   * Генерирует рекомендации для отдельного клипа
   */
  private generateClipRecommendationsForClip(clip: TimelineClip): string[] {
    const recommendations: string[] = []

    if (clip.duration < 0.5) {
      recommendations.push("Увеличьте длительность или удалите клип")
    }

    if (!clip.effects || clip.effects.length === 0) {
      recommendations.push("Рассмотрите добавление эффектов для улучшения качества")
    }

    if (!clip.transitions || clip.transitions.length === 0) {
      recommendations.push("Добавьте переходы для плавности")
    }

    if (clip.volume < 0.5 && this.getClipType(clip) === "audio") {
      recommendations.push("Проверьте уровень громкости")
    }

    return recommendations
  }

  /**
   * Организует клипы по заданным критериям
   */
  private async organizeClips(
    clips: TimelineClip[],
    criteria: string[],
    _project: TimelineProject,
  ): Promise<NonNullable<ClipManagementResult["organizationResults"]>> {
    // Простая реализация организации
    const newStructure: Record<string, string[]> = {}
    let movedClips = 0
    let newTracks = 0

    if (criteria.includes("type")) {
      const typeGroups = this.groupClipsByType(clips)
      Object.keys(typeGroups).forEach((type) => {
        newStructure[`${type}_clips`] = typeGroups[type].map((c) => c.id)
        movedClips += typeGroups[type].length
        newTracks++
      })
    }

    return {
      newStructure,
      movedClips,
      newTracks,
    }
  }

  /**
   * Группирует клипы по типу
   */
  private groupClipsByType(clips: TimelineClip[]): Record<string, TimelineClip[]> {
    const groups: Record<string, TimelineClip[]> = {}

    clips.forEach((clip) => {
      const type = this.getClipType(clip)
      if (!groups[type]) groups[type] = []
      groups[type].push(clip)
    })

    return groups
  }

  /**
   * Выполняет очистку клипов
   */
  private async cleanupClips(
    clips: TimelineClip[],
    options: NonNullable<ClipManagementInput["cleanupOptions"]>,
    _project: TimelineProject,
  ): Promise<NonNullable<ClipManagementResult["cleanupResults"]>> {
    const removedClips: string[] = []
    const consolidatedClips: string[] = []
    const fixedIssues: string[] = []

    if (options.removeEmpty) {
      const emptyClips = clips.filter((c) => c.duration === 0)
      removedClips.push(...emptyClips.map((c) => c.id))
      fixedIssues.push(`Удалено ${emptyClips.length} пустых клипов`)
    }

    if (options.removeDuplicates) {
      const duplicates = this.findDuplicates(clips)
      removedClips.push(...duplicates)
      fixedIssues.push(`Удалено ${duplicates.length} дубликатов`)
    }

    if (options.consolidateShort && options.minDuration) {
      const shortClips = clips.filter((c) => c.duration < options.minDuration!)
      consolidatedClips.push(...shortClips.map((c) => c.id))
      fixedIssues.push(`Консолидировано ${shortClips.length} коротких клипов`)
    }

    return {
      removedClips,
      consolidatedClips,
      fixedIssues,
    }
  }

  /**
   * Подготавливает операции пакетного редактирования
   */
  private async prepareBatchOperations(
    clips: TimelineClip[],
    options: NonNullable<ClipManagementInput["batchEditOptions"]>,
  ): Promise<BatchOperation[]> {
    const operations: BatchOperation[] = []

    if (options.adjustVolume !== undefined) {
      operations.push({
        type: "volume_adjustment",
        description: `Настроить громкость на ${options.adjustVolume}% для ${clips.length} клипов`,
        affectedClips: clips.length,
        estimatedTime: clips.length * 0.1,
        risks: options.adjustVolume > 150 ? ["Возможны искажения звука"] : [],
        reversible: true,
      })
    }

    if (options.normalizeAudio) {
      const audioClips = clips.filter((c) => this.getClipType(c) === "audio")
      operations.push({
        type: "audio_normalization",
        description: `Нормализовать аудио для ${audioClips.length} клипов`,
        affectedClips: audioClips.length,
        estimatedTime: audioClips.length * 0.5,
        risks: ["Изменение оригинальных уровней звука"],
        reversible: false,
      })
    }

    return operations
  }

  /**
   * Выполняет умную сортировку клипов
   */
  private async smartSortClips(
    clips: TimelineClip[],
    _project: TimelineProject,
  ): Promise<NonNullable<ClipManagementResult["organizationResults"]>> {
    // Сортируем по времени и типу контента
    const sortedClips = clips.sort((a, b) => {
      // Сначала по времени
      if (a.startTime !== b.startTime) return a.startTime - b.startTime

      // Затем по типу
      const typeOrder = { video: 0, audio: 1, image: 2, unknown: 3 }
      const aType = this.getClipType(a) as keyof typeof typeOrder
      const bType = this.getClipType(b) as keyof typeof typeOrder

      return typeOrder[aType] - typeOrder[bType]
    })

    return {
      newStructure: {
        smart_sorted: sortedClips.map((c) => c.id),
      },
      movedClips: clips.length,
      newTracks: 0,
    }
  }

  /**
   * Генерирует рекомендации по управлению клипами
   */
  private generateClipRecommendations(
    operation: string,
    analysis: ClipAnalysis,
    result: ClipManagementResult,
  ): string[] {
    const recommendations: string[] = []

    // Общие рекомендации на основе анализа
    if (analysis.issues.missingFiles > 0) {
      recommendations.push(`Восстановите ${analysis.issues.missingFiles} отсутствующих медиафайлов`)
    }

    if (analysis.issues.tooShort > 0) {
      recommendations.push(`Рассмотрите удаление или объединение ${analysis.issues.tooShort} очень коротких клипов`)
    }

    if (analysis.qualityDistribution.poor > analysis.totalClips * 0.3) {
      recommendations.push("Более 30% клипов имеют низкое качество - рассмотрите их улучшение")
    }

    // Специфические рекомендации по операциям
    switch (operation) {
      case "cleanup":
        if (result.cleanupResults?.removedClips.length === 0) {
          recommendations.push("Проект уже чист - дополнительная очистка не требуется")
        } else {
          recommendations.push("Проверьте результаты очистки перед сохранением")
        }
        break

      case "organize":
        recommendations.push("После организации проверьте, что все клипы находятся на правильных треках")
        recommendations.push("Рассмотрите создание резервной копии организованного проекта")
        break

      case "batch-edit":
        recommendations.push("Примените изменения поэтапно для лучшего контроля")
        recommendations.push("Протестируйте результат на небольшом количестве клипов сначала")
        break

      case "analyze":
        if (analysis.totalClips > 100) {
          recommendations.push("Большой проект - рассмотрите разделение на части")
        }
        break
    }

    // Рекомендации по производительности
    if (analysis.totalClips > 200) {
      recommendations.push("Большое количество клипов может влиять на производительность")
    }

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const clipManagementTool = new ClipManagementTool()

// Функция-обертка для обратной совместимости
export async function manageTimelineClips(params: any): Promise<AIToolResult<ClipManagementResult>> {
  const input: ClipManagementInput = {
    operation: params.operation,
    scope: params.scope,
    targetId: params.targetId,
    organizationCriteria: params.organizationCriteria,
    cleanupOptions: params.cleanupOptions,
    batchEditOptions: params.batchEditOptions,
  }

  return clipManagementTool.manageTimelineClips(input)
}
