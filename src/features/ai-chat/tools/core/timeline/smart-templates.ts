/**
 * AI инструмент для создания и применения умных шаблонов Timeline с использованием BaseAITool
 */

import type { TimelineProject, TimelineSection, TimelineTrack, TrackType } from "@/features/timeline/types/timeline"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../../base-ai-tool"

// Типы для умных шаблонов
export interface SmartTemplatesInput {
  operation: "create" | "apply" | "analyze" | "suggest" | "customize"
  templateType?: "project" | "section" | "workflow" | "style"
  sourceProject?: string // ID проекта-источника для создания шаблона
  templateId?: string // ID шаблона для применения
  customizationOptions?: {
    preserveContent?: boolean
    preserveStructure?: boolean
    preserveTiming?: boolean
    adaptToContent?: boolean
  }
  analysisScope?: "current" | "similar" | "all"
}

export interface TemplateElement {
  type: "track" | "section" | "clip" | "effect" | "transition"
  id: string
  name: string
  properties: Record<string, any>
  constraints?: {
    required: boolean
    adaptable: boolean
    dependencies?: string[]
  }
}

export interface SmartTemplate {
  id: string
  name: string
  description: string
  type: "project" | "section" | "workflow" | "style"
  category: string
  tags: string[]
  complexity: "simple" | "moderate" | "complex"
  elements: TemplateElement[]
  metadata: {
    createdAt: string
    usageCount: number
    successRate: number
    averageAdaptationTime: number
  }
  compatibility: {
    projectTypes: string[]
    contentTypes: string[]
    minimumTracks: number
    recommendedDuration: number
  }
}

export interface TemplateAnalysis {
  projectComplexity: "simple" | "moderate" | "complex"
  dominantPatterns: Array<{
    pattern: string
    frequency: number
    confidence: number
  }>
  structuralElements: {
    trackPatterns: Record<string, number>
    sectionPatterns: Record<string, number>
    timingPatterns: Record<string, number>
  }
  suggestedTemplateTypes: Array<{
    type: string
    reason: string
    confidence: number
  }>
}

export interface TemplateApplication {
  templateId: string
  templateName: string
  adaptations: Array<{
    element: string
    originalValue: any
    adaptedValue: any
    reason: string
  }>
  conflicts: Array<{
    element: string
    issue: string
    resolution: string
  }>
  statistics: {
    elementsApplied: number
    elementsAdapted: number
    elementsSkipped: number
    applicationTime: number
  }
}

export interface SmartTemplatesResult {
  operation: string
  templateType?: string
  processedTemplates: number
  templateAnalysis?: TemplateAnalysis
  availableTemplates?: SmartTemplate[]
  createdTemplate?: SmartTemplate
  appliedTemplate?: TemplateApplication
  suggestions?: Array<{
    templateId: string
    templateName: string
    matchScore: number
    applicabilityReason: string
    estimatedAdaptationTime: number
  }>
  customizationResults?: {
    customizedElements: number
    preservedElements: number
    adaptedElements: number
  }
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для умных шаблонов с унифицированной обработкой ошибок
 */
export class SmartTemplatesTools extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("SmartTemplatesTools", logger)
  }

  /**
   * Выполняет операции с умными шаблонами
   */
  public async manageSmartTemplates(
    input: SmartTemplatesInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<SmartTemplatesResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = ["create", "apply", "analyze", "suggest", "customize"]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      const validTemplateTypes = ["project", "section", "workflow", "style"]
      if (data.templateType && !validTemplateTypes.includes(data.templateType)) {
        errors.push(`Неподдерживаемый тип шаблона: ${data.templateType}`)
      }

      if (data.operation === "apply" && !data.templateId) {
        errors.push("Для применения шаблона требуется templateId")
      }

      if (data.operation === "create" && !data.sourceProject && !data.templateType) {
        errors.push("Для создания шаблона требуется sourceProject или templateType")
      }

      const validAnalysisScopes = ["current", "similar", "all"]
      if (data.analysisScope && !validAnalysisScopes.includes(data.analysisScope)) {
        errors.push(`Неподдерживаемая область анализа: ${data.analysisScope}`)
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
        message: "Ошибка валидации параметров умных шаблонов",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation
    const templateType = input.templateType || "project"

    // Выполняем операции с шаблонами с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем операции с умными шаблонами", {
          operation,
          templateType,
          templateId: input.templateId,
        })

        const { getTimelineStateAccess } = await import("./types")
        const timelineAccess = getTimelineStateAccess()

        if (!timelineAccess) {
          throw new Error("Timeline state access не настроен")
        }

        const currentProject = timelineAccess.getCurrentProject() as TimelineProject | null
        if (!currentProject || !currentProject.id) {
          throw new Error("Нет активного проекта для работы с шаблонами. Откройте или создайте проект в timeline")
        }

        const result: SmartTemplatesResult = {
          operation,
          templateType,
          processedTemplates: 0,
          recommendations: [],
          warnings: [],
        }

        const warnings: string[] = []

        // Выполняем конкретную операцию
        switch (operation) {
          case "analyze":
            this.logger?.info("Анализируем проект для создания шаблонов")
            result.templateAnalysis = await this.analyzeProjectForTemplates(
              currentProject,
              input.analysisScope || "current",
            )
            result.processedTemplates = 1
            break

          case "create":
            this.logger?.info("Создаем умный шаблон")
            result.createdTemplate = await this.createSmartTemplate(currentProject, templateType, input.sourceProject)
            result.processedTemplates = 1
            break

          case "apply":
            this.logger?.info("Применяем умный шаблон")
            if (!input.templateId) throw new Error("Template ID is required for apply operation")

            result.appliedTemplate = await this.applySmartTemplate(
              currentProject,
              input.templateId,
              input.customizationOptions || {},
            )
            result.processedTemplates = 1

            if (result.appliedTemplate.conflicts.length > 0) {
              warnings.push(`Обнаружено ${result.appliedTemplate.conflicts.length} конфликтов при применении шаблона`)
            }
            break

          case "suggest":
            this.logger?.info("Предлагаем подходящие шаблоны")
            const suggestionResults = await this.suggestAppropriateTemplates(currentProject, templateType)
            result.suggestions = suggestionResults.suggestions
            result.availableTemplates = suggestionResults.availableTemplates
            result.processedTemplates = suggestionResults.availableTemplates.length
            break

          case "customize":
            this.logger?.info("Настраиваем шаблон")
            if (!input.templateId) throw new Error("Template ID is required for customize operation")

            result.customizationResults = await this.customizeTemplate(
              input.templateId,
              currentProject,
              input.customizationOptions || {},
            )
            result.processedTemplates = 1
            break
        }

        // Генерируем рекомендации
        result.recommendations = this.generateTemplateRecommendations(operation, result, currentProject)

        // Дополнительные предупреждения
        if (operation === "apply" && !input.customizationOptions?.preserveContent) {
          warnings.push("Применение шаблона может заменить существующий контент")
        }

        if (operation === "create" && this.isProjectTooSimple(currentProject)) {
          warnings.push("Проект может быть слишком простым для создания эффективного шаблона")
        }

        result.warnings = warnings.length > 0 ? warnings : undefined

        this.logger?.info("Операции с умными шаблонами завершены", {
          operation,
          processedTemplates: result.processedTemplates,
          warningsCount: warnings.length,
        })

        return result
      },
      {
        timeout: options.timeout || 90000, // 1.5 минуты для операций с шаблонами
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          templateType,
          templateId: input.templateId,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Анализирует проект для выявления шаблонных паттернов
   */
  private async analyzeProjectForTemplates(
    project: TimelineProject,
    _analysisScope: string,
  ): Promise<TemplateAnalysis> {
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    const allClips = allTracks.reduce((clips, track) => clips.concat(track.clips), [])

    // Определяем сложность проекта
    let complexity: TemplateAnalysis["projectComplexity"] = "simple"
    if (allTracks.length > 5 && allClips.length > 20) complexity = "moderate"
    if (allTracks.length > 10 && allClips.length > 50) complexity = "complex"

    // Анализируем доминирующие паттерны
    const dominantPatterns = this.identifyDominantPatterns(project)

    // Анализируем структурные элементы
    const structuralElements = {
      trackPatterns: this.analyzeTrackPatterns(allTracks),
      sectionPatterns: this.analyzeSectionPatterns(project.sections),
      timingPatterns: this.analyzeTimingPatterns(allClips),
    }

    // Предлагаем типы шаблонов
    const suggestedTemplateTypes = this.suggestTemplateTypes(complexity, dominantPatterns, structuralElements)

    return {
      projectComplexity: complexity,
      dominantPatterns,
      structuralElements,
      suggestedTemplateTypes,
    }
  }

  /**
   * Создает умный шаблон на основе проекта
   */
  private async createSmartTemplate(
    project: TimelineProject,
    templateType: string,
    _sourceProjectId?: string,
  ): Promise<SmartTemplate> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    // Извлекаем элементы для шаблона
    const elements = this.extractTemplateElements(project, templateType)

    // Определяем категорию и теги
    const category = this.determineTemplateCategory(project, templateType)
    const tags = this.generateTemplateTags(project, templateType)

    // Анализируем совместимость
    const compatibility = this.analyzeTemplateCompatibility(project)

    const template: SmartTemplate = {
      id: templateId,
      name: `${project.name} Template`,
      description: `Умный шаблон, созданный на основе проекта "${project.name}"`,
      type: templateType as SmartTemplate["type"],
      category,
      tags,
      complexity: this.determineTemplateComplexity(elements),
      elements,
      metadata: {
        createdAt: new Date().toISOString(),
        usageCount: 0,
        successRate: 100,
        averageAdaptationTime: 30,
      },
      compatibility,
    }

    return template
  }

  /**
   * Применяет умный шаблон к проекту
   */
  private async applySmartTemplate(
    project: TimelineProject,
    templateId: string,
    options: NonNullable<SmartTemplatesInput["customizationOptions"]>,
  ): Promise<TemplateApplication> {
    // В реальной реализации здесь бы загружался шаблон из базы данных
    const template = this.getMockTemplate(templateId)

    const adaptations: TemplateApplication["adaptations"] = []
    const conflicts: TemplateApplication["conflicts"] = []
    let elementsApplied = 0
    let elementsAdapted = 0
    let elementsSkipped = 0

    // Применяем элементы шаблона
    for (const element of template.elements) {
      try {
        const adaptation = this.applyTemplateElement(element, project, options)

        if (adaptation.applied) {
          elementsApplied++

          if (adaptation.adapted) {
            elementsAdapted++
            adaptations.push({
              element: element.name,
              originalValue: adaptation.originalValue,
              adaptedValue: adaptation.adaptedValue,
              reason: adaptation.reason,
            })
          }
        } else {
          elementsSkipped++
          conflicts.push({
            element: element.name,
            issue: adaptation.issue || "Unknown issue",
            resolution: adaptation.resolution || "Element skipped",
          })
        }
      } catch (error) {
        elementsSkipped++
        conflicts.push({
          element: element.name,
          issue: `Error applying element: ${error}`,
          resolution: "Element skipped due to error",
        })
      }
    }

    return {
      templateId,
      templateName: template.name,
      adaptations,
      conflicts,
      statistics: {
        elementsApplied,
        elementsAdapted,
        elementsSkipped,
        applicationTime: 15 + template.elements.length * 2,
      },
    }
  }

  /**
   * Предлагает подходящие шаблоны для проекта
   */
  private async suggestAppropriateTemplates(
    project: TimelineProject,
    templateType: string,
  ): Promise<{ suggestions: SmartTemplatesResult["suggestions"]; availableTemplates: SmartTemplate[] }> {
    // В реальной реализации здесь бы загружались шаблоны из базы данных
    const availableTemplates = this.getMockTemplates(templateType)

    const suggestions = availableTemplates.map((template) => {
      const matchScore = this.calculateTemplateMatchScore(project, template)

      return {
        templateId: template.id,
        templateName: template.name,
        matchScore,
        applicabilityReason: this.generateApplicabilityReason(project, template, matchScore),
        estimatedAdaptationTime: template.metadata.averageAdaptationTime + Math.random() * 10,
      }
    })

    // Сортируем по убыванию совместимости
    suggestions.sort((a, b) => b.matchScore - a.matchScore)

    return {
      suggestions: suggestions.slice(0, 5), // Топ-5 предложений
      availableTemplates,
    }
  }

  /**
   * Настраивает существующий шаблон
   */
  private async customizeTemplate(
    templateId: string,
    _project: TimelineProject,
    options: NonNullable<SmartTemplatesInput["customizationOptions"]>,
  ): Promise<NonNullable<SmartTemplatesResult["customizationResults"]>> {
    const template = this.getMockTemplate(templateId)

    let customizedElements = 0
    let preservedElements = 0
    let adaptedElements = 0

    for (const element of template.elements) {
      if (options.preserveStructure && element.type === "track") {
        preservedElements++
      } else if (options.adaptToContent) {
        adaptedElements++
      } else {
        customizedElements++
      }
    }

    return {
      customizedElements,
      preservedElements,
      adaptedElements,
    }
  }

  // Вспомогательные методы

  /**
   * Выявляет доминирующие паттерны в проекте
   */
  private identifyDominantPatterns(project: TimelineProject): TemplateAnalysis["dominantPatterns"] {
    const patterns: TemplateAnalysis["dominantPatterns"] = []

    // Анализируем паттерны треков
    const trackTypes = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].reduce(
      (acc, track) => {
        acc[track.type] = (acc[track.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    Object.entries(trackTypes).forEach(([type, count]) => {
      if (count > 2) {
        patterns.push({
          pattern: `Multiple ${type} tracks`,
          frequency: count,
          confidence: Math.min(0.9, count * 0.2),
        })
      }
    })

    // Анализируем паттерны секций
    if (project.sections.length >= 3) {
      patterns.push({
        pattern: "Multi-section structure",
        frequency: project.sections.length,
        confidence: 0.8,
      })
    }

    return patterns
  }

  /**
   * Анализирует паттерны треков
   */
  private analyzeTrackPatterns(tracks: TimelineTrack[]): Record<string, number> {
    const patterns: Record<string, number> = {}

    // Подсчет по типам треков
    tracks.forEach((track) => {
      patterns[`${track.type}_tracks`] = (patterns[`${track.type}_tracks`] || 0) + 1
    })

    // Анализ сложности треков
    tracks.forEach((track) => {
      const clipsCount = track.clips.length
      if (clipsCount > 10) patterns.complex_tracks = (patterns.complex_tracks || 0) + 1
      else if (clipsCount > 5) patterns.moderate_tracks = (patterns.moderate_tracks || 0) + 1
      else patterns.simple_tracks = (patterns.simple_tracks || 0) + 1
    })

    return patterns
  }

  /**
   * Анализирует паттерны секций
   */
  private analyzeSectionPatterns(sections: TimelineSection[]): Record<string, number> {
    const patterns: Record<string, number> = {}

    if (sections.length === 0) {
      patterns.no_sections = 1
    } else {
      patterns.section_count = sections.length

      // Анализ длительности секций
      const durations = sections.map((s) => s.duration)
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

      if (avgDuration > 180) patterns.long_sections = 1
      else if (avgDuration > 60) patterns.medium_sections = 1
      else patterns.short_sections = 1
    }

    return patterns
  }

  /**
   * Анализирует паттерны времени
   */
  private analyzeTimingPatterns(clips: any[]): Record<string, number> {
    const patterns: Record<string, number> = {}

    if (clips.length === 0) return patterns

    // Анализ длительности клипов
    const durations = clips.map((c) => c.duration)
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length

    if (avgDuration > 30) patterns.long_clips = 1
    else if (avgDuration > 10) patterns.medium_clips = 1
    else patterns.short_clips = 1

    // Анализ промежутков между клипами
    const sortedClips = clips.sort((a, b) => a.startTime - b.startTime)
    let gapsCount = 0

    for (let i = 1; i < sortedClips.length; i++) {
      const prevEnd = sortedClips[i - 1].startTime + sortedClips[i - 1].duration
      const currentStart = sortedClips[i].startTime

      if (currentStart - prevEnd > 1) gapsCount++
    }

    patterns.gaps_between_clips = gapsCount

    return patterns
  }

  /**
   * Предлагает типы шаблонов на основе анализа
   */
  private suggestTemplateTypes(
    complexity: TemplateAnalysis["projectComplexity"],
    patterns: TemplateAnalysis["dominantPatterns"],
    structure: TemplateAnalysis["structuralElements"],
  ): TemplateAnalysis["suggestedTemplateTypes"] {
    const suggestions: TemplateAnalysis["suggestedTemplateTypes"] = []

    // На основе сложности
    if (complexity === "simple") {
      suggestions.push({
        type: "workflow",
        reason: "Простая структура идеальна для шаблона рабочего процесса",
        confidence: 0.8,
      })
    }

    // На основе паттернов
    const hasMultiTrackPattern = patterns.some((p) => p.pattern.includes("Multiple") && p.frequency > 2)
    if (hasMultiTrackPattern) {
      suggestions.push({
        type: "project",
        reason: "Множественные треки указывают на шаблон проекта",
        confidence: 0.9,
      })
    }

    // На основе структуры секций
    if (structure.sectionPatterns.section_count > 3) {
      suggestions.push({
        type: "section",
        reason: "Хорошо структурированные секции подходят для шаблона секций",
        confidence: 0.85,
      })
    }

    // Общий шаблон стиля
    suggestions.push({
      type: "style",
      reason: "Любой проект может служить основой для стилевого шаблона",
      confidence: 0.6,
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Извлекает элементы для создания шаблона
   */
  private extractTemplateElements(project: TimelineProject, templateType: string): TemplateElement[] {
    const elements: TemplateElement[] = []

    // Извлекаем треки
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    allTracks.forEach((track) => {
      elements.push({
        type: "track",
        id: track.id,
        name: track.name,
        properties: {
          type: track.type,
          height: track.height || 60,
          clipsCount: track.clips.length,
        },
        constraints: {
          required: track.clips.length > 0,
          adaptable: true,
        },
      })
    })

    // Извлекаем секции для соответствующих типов шаблонов
    if (templateType === "section" || templateType === "project") {
      project.sections.forEach((section) => {
        elements.push({
          type: "section",
          id: section.id,
          name: section.name,
          properties: {
            duration: section.duration,
            startTime: section.startTime,
            tracksCount: section.tracks.length,
          },
          constraints: {
            required: false,
            adaptable: true,
          },
        })
      })
    }

    return elements
  }

  /**
   * Определяет категорию шаблона
   */
  private determineTemplateCategory(project: TimelineProject, _templateType: string): string {
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    const videoTracks = allTracks.filter((t) => t.type === "video").length
    const audioTracks = allTracks.filter((t) => t.type === "audio").length

    if (videoTracks > audioTracks) return "Video Production"
    if (audioTracks > videoTracks) return "Audio Production"
    return "Mixed Media"
  }

  /**
   * Генерирует теги для шаблона
   */
  private generateTemplateTags(project: TimelineProject, templateType: string): string[] {
    const tags: string[] = [templateType]

    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    // Добавляем теги на основе типов треков
    const trackTypes = new Set(allTracks.map((t) => t.type))
    trackTypes.forEach((type) => tags.push(type))

    // Добавляем теги сложности
    if (allTracks.length > 10) tags.push("complex")
    else if (allTracks.length > 5) tags.push("moderate")
    else tags.push("simple")

    if (project.sections.length > 0) tags.push("structured")

    return tags
  }

  /**
   * Определяет сложность шаблона
   */
  private determineTemplateComplexity(elements: TemplateElement[]): SmartTemplate["complexity"] {
    if (elements.length > 20) return "complex"
    if (elements.length > 10) return "moderate"
    return "simple"
  }

  /**
   * Анализирует совместимость шаблона
   */
  private analyzeTemplateCompatibility(project: TimelineProject): SmartTemplate["compatibility"] {
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    return {
      projectTypes: ["video", "audio", "mixed"],
      contentTypes: [...new Set(allTracks.map((t) => t.type))],
      minimumTracks: Math.max(1, Math.floor(allTracks.length * 0.5)),
      recommendedDuration: project.duration || 60,
    }
  }

  /**
   * Применяет элемент шаблона к проекту
   */
  private applyTemplateElement(
    element: TemplateElement,
    _project: TimelineProject,
    options: NonNullable<SmartTemplatesInput["customizationOptions"]>,
  ): {
    applied: boolean
    adapted: boolean
    originalValue?: any
    adaptedValue?: any
    reason: string
    issue?: string
    resolution?: string
  } {
    // Простая симуляция применения элемента
    const shouldAdapt = options.adaptToContent && Math.random() > 0.3
    const canApply = !element.constraints?.required || Math.random() > 0.1

    if (!canApply) {
      return {
        applied: false,
        adapted: false,
        reason: "Element conflicts with existing structure",
        issue: "Constraint not satisfied",
        resolution: "Skip element",
      }
    }

    if (shouldAdapt) {
      return {
        applied: true,
        adapted: true,
        originalValue: element.properties,
        adaptedValue: { ...element.properties, adapted: true },
        reason: "Adapted to fit current project content",
      }
    }

    return {
      applied: true,
      adapted: false,
      reason: "Applied without modification",
    }
  }

  /**
   * Вычисляет совместимость шаблона с проектом
   */
  private calculateTemplateMatchScore(project: TimelineProject, template: SmartTemplate): number {
    let score = 50 // Базовый балл

    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    // Совместимость по количеству треков
    if (allTracks.length >= template.compatibility.minimumTracks) {
      score += 20
    } else {
      score -= 10
    }

    // Совместимость по типам контента
    const projectTrackTypes = new Set(allTracks.map((t) => t.type))
    const matchingTypes = template.compatibility.contentTypes.filter((type) =>
      projectTrackTypes.has(type as TrackType),
    ).length

    score += (matchingTypes / template.compatibility.contentTypes.length) * 20

    // Совместимость по сложности
    const projectComplexity = this.getProjectComplexityScore(project)
    const templateComplexity = this.getTemplateComplexityScore(template.complexity)

    if (Math.abs(projectComplexity - templateComplexity) < 1) {
      score += 10
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Генерирует причину применимости шаблона
   */
  private generateApplicabilityReason(_project: TimelineProject, _template: SmartTemplate, matchScore: number): string {
    if (matchScore >= 80) {
      return "Отличное соответствие структуре и типу проекта"
    }
    if (matchScore >= 60) {
      return "Хорошее соответствие с минимальными адаптациями"
    }
    if (matchScore >= 40) {
      return "Частичное соответствие, потребуются существенные адаптации"
    }
    return "Низкое соответствие, рекомендуется другой шаблон"
  }

  /**
   * Проверяет, является ли проект слишком простым для шаблона
   */
  private isProjectTooSimple(project: TimelineProject): boolean {
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    const allClips = allTracks.reduce((clips, track) => clips.concat(track.clips), [])

    return allTracks.length < 2 && allClips.length < 5
  }

  /**
   * Получает оценку сложности проекта
   */
  private getProjectComplexityScore(project: TimelineProject): number {
    const allTracks = [...project.globalTracks]
    project.sections.forEach((section) => allTracks.push(...section.tracks))

    const allClips = allTracks.reduce((clips, track) => clips.concat(track.clips), [])

    let score = 1
    if (allTracks.length > 5) score = 2
    if (allTracks.length > 10) score = 3
    if (allClips.length > 50) score += 1

    return Math.min(3, score)
  }

  /**
   * Получает оценку сложности шаблона
   */
  private getTemplateComplexityScore(complexity: SmartTemplate["complexity"]): number {
    switch (complexity) {
      case "simple":
        return 1
      case "moderate":
        return 2
      case "complex":
        return 3
      default:
        return 2
    }
  }

  /**
   * Создает мок-шаблон для демонстрации
   */
  private getMockTemplate(templateId: string): SmartTemplate {
    return {
      id: templateId,
      name: "Demo Template",
      description: "Демонстрационный шаблон",
      type: "project",
      category: "Video Production",
      tags: ["video", "moderate", "structured"],
      complexity: "moderate",
      elements: [
        {
          type: "track",
          id: "track_video_1",
          name: "Main Video",
          properties: { type: "video", height: 80 },
          constraints: { required: true, adaptable: true },
        },
        {
          type: "track",
          id: "track_audio_1",
          name: "Main Audio",
          properties: { type: "audio", height: 60 },
          constraints: { required: false, adaptable: true },
        },
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        usageCount: 5,
        successRate: 85,
        averageAdaptationTime: 25,
      },
      compatibility: {
        projectTypes: ["video", "mixed"],
        contentTypes: ["video", "audio"],
        minimumTracks: 2,
        recommendedDuration: 120,
      },
    }
  }

  /**
   * Создает мок-шаблоны для демонстрации
   */
  private getMockTemplates(templateType: string): SmartTemplate[] {
    return [
      {
        id: "template_1",
        name: "Basic Video Template",
        description: "Базовый шаблон для видео проектов",
        type: templateType as SmartTemplate["type"],
        category: "Video Production",
        tags: ["video", "simple"],
        complexity: "simple",
        elements: [],
        metadata: {
          createdAt: new Date().toISOString(),
          usageCount: 10,
          successRate: 90,
          averageAdaptationTime: 15,
        },
        compatibility: {
          projectTypes: ["video"],
          contentTypes: ["video"],
          minimumTracks: 1,
          recommendedDuration: 60,
        },
      },
      {
        id: "template_2",
        name: "Podcast Template",
        description: "Шаблон для подкастов и аудио проектов",
        type: templateType as SmartTemplate["type"],
        category: "Audio Production",
        tags: ["audio", "simple"],
        complexity: "simple",
        elements: [],
        metadata: {
          createdAt: new Date().toISOString(),
          usageCount: 8,
          successRate: 95,
          averageAdaptationTime: 20,
        },
        compatibility: {
          projectTypes: ["audio"],
          contentTypes: ["audio"],
          minimumTracks: 2,
          recommendedDuration: 1800,
        },
      },
    ]
  }

  /**
   * Генерирует рекомендации для работы с шаблонами
   */
  private generateTemplateRecommendations(
    operation: string,
    result: SmartTemplatesResult,
    _project: TimelineProject,
  ): string[] {
    const recommendations: string[] = []

    switch (operation) {
      case "analyze":
        if (result.templateAnalysis?.projectComplexity === "simple") {
          recommendations.push("Проект подходит для создания базового шаблона рабочего процесса")
        } else if (result.templateAnalysis?.projectComplexity === "complex") {
          recommendations.push("Сложный проект - рассмотрите создание специализированного шаблона")
        }

        recommendations.push("Сохраните успешные паттерны как шаблоны для будущих проектов")
        break

      case "create":
        recommendations.push("Протестируйте созданный шаблон на новом проекте")
        recommendations.push("Добавьте описательные теги для легкого поиска")
        recommendations.push("Регулярно обновляйте шаблон на основе опыта использования")
        break

      case "apply":
        if (result.appliedTemplate?.conflicts.length === 0) {
          recommendations.push("Шаблон успешно применен без конфликтов")
        } else {
          recommendations.push("Проверьте и исправьте конфликты после применения шаблона")
        }

        recommendations.push("Настройте детали под специфику текущего проекта")
        break

      case "suggest":
        if (result.suggestions && result.suggestions.length > 0) {
          const topSuggestion = result.suggestions[0]
          if (topSuggestion.matchScore > 80) {
            recommendations.push(
              `Рекомендуется применить шаблон "${topSuggestion.templateName}" - высокое соответствие`,
            )
          }
        }

        recommendations.push("Рассмотрите создание пользовательского шаблона если подходящих нет")
        break

      case "customize":
        recommendations.push("Сохраните настроенный шаблон как новый вариант")
        recommendations.push("Документируйте изменения для будущего использования")
        break
    }

    // Общие рекомендации
    recommendations.push("Регулярно обновляйте библиотеку шаблонов")
    recommendations.push("Создавайте резервные копии важных шаблонов")

    return recommendations
  }
}

// Экспортируем готовый экземпляр для использования
export const smartTemplatesTools = new SmartTemplatesTools()

// Функция-обертка для обратной совместимости
export async function manageSmartTemplates(params: any): Promise<AIToolResult<SmartTemplatesResult>> {
  const input: SmartTemplatesInput = {
    operation: params.operation,
    templateType: params.templateType,
    sourceProject: params.sourceProject,
    templateId: params.templateId,
    customizationOptions: params.customizationOptions,
    analysisScope: params.analysisScope,
  }

  return smartTemplatesTools.manageSmartTemplates(input)
}
