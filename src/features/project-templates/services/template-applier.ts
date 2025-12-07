/**
 * Template Applier
 * Применение шаблона проекта к Timeline Studio Project
 */

import type { FrameRate, Resolution } from "@/domains/shared/types/project"
import type { TimelineStudioProject } from "@/domains/project-management/types"
import type { Sequence, SequenceSettings } from "@/features/timeline/types/sequence"
import type { TimelineTrack } from "@/features/timeline/types/timeline"
import { createLogger } from "@/lib/tauri-logger"

import type { ProjectTemplate, Section } from "../types/project-template"

const logger = createLogger("TemplateApplier")

/**
 * Helper функция для конвертации разрешения из строки в объект { width, height }
 */
function parseResolution(resolution: Resolution): { width: number; height: number } {
  const [width, height] = resolution.split("x").map(Number)
  return { width, height }
}

/**
 * Helper функция для конвертации frameRate из FrameRate string в number
 */
function frameRateToNumber(frameRate: FrameRate): number {
  return Number.parseFloat(frameRate)
}

export interface ApplyTemplateOptions {
  /** Создать новую секвенцию или заменить активную */
  mode: "new" | "replace"

  /** Название секвенции (если не указано, берется из шаблона) */
  sequenceName?: string

  /** Применить настройки проекта (разрешение, fps) */
  applyProjectSettings?: boolean

  /** Создать маркеры для секций */
  createMarkers?: boolean

  /** Создать пустые треки */
  createTracks?: boolean
}

export class TemplateApplier {
  /**
   * Применить шаблон проекта
   */
  async applyTemplate(
    project: TimelineStudioProject,
    template: ProjectTemplate,
    options: ApplyTemplateOptions,
  ): Promise<Sequence> {
    logger.info("Applying project template", { templateId: template.id, mode: options.mode })

    try {
      // 1. Создаем настройки секвенции из шаблона
      const sequenceSettings = this.createSequenceSettings(template)

      // 2. Создаем новую секвенцию
      const sequence = this.createSequence(template, sequenceSettings, options)

      // 3. Создаем треки
      if (options.createTracks) {
        this.createTracks(sequence, template)
      }

      // 4. Создаем маркеры для секций
      if (options.createMarkers) {
        this.createSectionMarkers(sequence, template)
      }

      // 5. Применяем настройки проекта
      if (options.applyProjectSettings) {
        this.applyProjectSettings(project, template)
      }

      // 6. Добавляем секвенцию в проект
      if (options.mode === "new") {
        project.sequences.set(sequence.id, sequence)
        project.activeSequenceId = sequence.id
      } else if (options.mode === "replace") {
        const activeSequence = project.sequences.get(project.activeSequenceId)
        if (activeSequence) {
          // Сохраняем ID и заменяем содержимое
          sequence.id = activeSequence.id
          project.sequences.set(activeSequence.id, sequence)
        }
      }

      logger.info("Template applied successfully", { sequenceId: sequence.id })

      return sequence
    } catch (error) {
      logger.error("Failed to apply template", { error })
      throw error
    }
  }

  /**
   * Создает настройки секвенции из шаблона
   */
  private createSequenceSettings(template: ProjectTemplate): SequenceSettings {
    return {
      resolution: parseResolution(template.settings.resolution),
      frameRate: frameRateToNumber(template.settings.frameRate),
      aspectRatio: template.settings.aspectRatio?.label || "16:9",
      duration: template.estimatedDuration,
      audio: {
        sampleRate: 48000,
        bitDepth: 24,
        channels: 2,
      },
      colorSpace: "rec709" as "rec709" | "rec2020" | "srgb" | "p3",
    }
  }

  /**
   * Создает новую секвенцию
   */
  private createSequence(
    template: ProjectTemplate,
    settings: SequenceSettings,
    options: ApplyTemplateOptions,
  ): Sequence {
    const sequenceName = options.sequenceName || template.name.en

    return {
      id: `sequence-${Date.now()}`,
      name: sequenceName,
      type: "main",
      settings,
      composition: {
        tracks: [],
        masterClips: [],
      },
      resources: {
        effects: new Map(),
        filters: new Map(),
        transitions: new Map(),
        colorGrades: new Map(),
        titles: new Map(),
        generators: new Map(),
      },
      markers: [],
      history: [],
      historyPosition: 0,
      metadata: {
        created: new Date(),
        modified: new Date(),
        notes: `Created from template: ${template.name.en}`,
        tags: template.tags?.en || [],
      },
    }
  }

  /**
   * Создает треки из конфигурации шаблона
   */
  private createTracks(sequence: Sequence, template: ProjectTemplate): void {
    const tracks: TimelineTrack[] = []

    template.structure.tracks.forEach((trackConfig, index) => {
      // Преобразуем тип трека в допустимый TrackType
      const trackType = trackConfig.type === "graphics" ? "video" : (trackConfig.type as "video" | "audio")

      const track: TimelineTrack = {
        id: trackConfig.id || `track-${Date.now()}-${index}`,
        name: trackConfig.name,
        type: trackType,
        clips: [],
        isLocked: trackConfig.locked || false,
        isMuted: false,
        isHidden: !(trackConfig.visible !== false),
        isSolo: false,
        order: index,
        height: trackConfig.height || 60,
        volume: 1.0,
        pan: 0,
        color: this.getTrackColor(trackConfig.type),
        transitions: [],
        trackEffects: [],
        trackFilters: [],
      }

      tracks.push(track)
    })

    sequence.composition.tracks = tracks

    logger.info("Tracks created", { count: tracks.length })
  }

  /**
   * Получает цвет трека по типу
   */
  private getTrackColor(type: string): string {
    switch (type) {
      case "video":
        return "#4A90E2"
      case "audio":
        return "#50C878"
      case "text":
        return "#F5A623"
      case "graphics":
        return "#9013FE"
      default:
        return "#7F8C8D"
    }
  }

  /**
   * Создает маркеры для секций
   */
  private createSectionMarkers(sequence: Sequence, template: ProjectTemplate): void {
    const markers = template.structure.sections.map((section) => this.createMarkerFromSection(section))

    sequence.markers = markers

    logger.info("Section markers created", { count: markers.length })
  }

  /**
   * Создает маркер из секции
   */
  private createMarkerFromSection(section: Section) {
    return {
      id: `marker-${section.id}`,
      name: section.name.en,
      time: section.position,
      duration: section.duration,
      color: this.getSectionColor(section.type),
      type: section.type === "chapter" ? ("chapter" as const) : ("standard" as const),
      comment: `Section: ${section.type}`,
    }
  }

  /**
   * Получает цвет секции по типу
   */
  private getSectionColor(type: Section["type"]): string {
    switch (type) {
      case "intro":
        return "#4A90E2" // Синий
      case "content":
        return "#50C878" // Зеленый
      case "outro":
        return "#F5A623" // Оранжевый
      case "transition":
        return "#9013FE" // Фиолетовый
      case "chapter":
        return "#E74C3C" // Красный
      default:
        return "#7F8C8D" // Серый
    }
  }

  /**
   * Применяет настройки проекта
   */
  private applyProjectSettings(project: TimelineStudioProject, template: ProjectTemplate): void {
    // Применяем resolution если не установлено
    if (!project.settings.resolution && template.settings.resolution) {
      project.settings.resolution = template.settings.resolution
    }

    // Применяем frameRate если не установлено
    if (!project.settings.frameRate && template.settings.frameRate) {
      project.settings.frameRate = template.settings.frameRate
    }

    // Применяем aspectRatio если не установлено
    if (!project.settings.aspectRatio && template.settings.aspectRatio) {
      project.settings.aspectRatio = template.settings.aspectRatio
    }

    // Применяем colorSpace если не установлено
    if (!project.settings.colorSpace && template.settings.colorSpace) {
      project.settings.colorSpace = template.settings.colorSpace
    }

    logger.info("Project settings applied", {
      resolution: template.settings.resolution,
      frameRate: template.settings.frameRate,
    })
  }

  /**
   * Валидация шаблона перед применением
   */
  validateTemplate(template: ProjectTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Проверка обязательных полей
    if (!template.id || !template.name || !template.category) {
      errors.push("Missing required fields: id, name, or category")
    }

    // Проверка структуры
    if (!template.structure) {
      errors.push("Invalid structure: template.structure is missing")
      return { valid: false, errors }
    }

    if (!template.structure.sections || !template.structure.tracks) {
      errors.push("Invalid structure: missing sections or tracks")
    }

    // Проверка секций
    if (template.structure.sections.length === 0) {
      errors.push("Template must have at least one section")
    }

    // Проверка треков
    if (template.structure.tracks.length === 0) {
      errors.push("Template must have at least one track")
    }

    // Проверка settings
    if (!template.settings || !template.settings.resolution || !template.settings.frameRate) {
      errors.push("Invalid settings: missing resolution or frameRate")
    }

    // Проверка позиций секций
    const sectionsOverlap = this.checkSectionsOverlap(template.structure.sections)
    if (sectionsOverlap) {
      errors.push("Sections have overlapping positions")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Проверка пересечения секций
   */
  private checkSectionsOverlap(sections: Section[]): boolean {
    const sorted = [...sections].sort((a, b) => a.position - b.position)

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      const currentEnd = current.position + current.duration
      if (currentEnd > next.position) {
        return true
      }
    }

    return false
  }

  /**
   * Предварительный просмотр применения шаблона
   */
  previewTemplate(template: ProjectTemplate): {
    duration: number
    trackCount: number
    sectionCount: number
    markers: Array<{ name: string; time: number; duration: number }>
    tracks: Array<{ name: string; type: string }>
  } {
    return {
      duration: template.estimatedDuration,
      trackCount: template.structure.tracks.length,
      sectionCount: template.structure.sections.length,
      markers: template.structure.sections.map((section) => ({
        name: section.name.en,
        time: section.position,
        duration: section.duration,
      })),
      tracks: template.structure.tracks.map((track) => ({
        name: track.name,
        type: track.type,
      })),
    }
  }
}

// Singleton экземпляр
export const templateApplier = new TemplateApplier()
