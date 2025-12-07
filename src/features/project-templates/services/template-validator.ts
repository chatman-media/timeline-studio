/**
 * Template Validator
 * Валидация шаблонов проектов
 */

import type { ProjectTemplate, Section } from "../types/project-template"

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: "error"
}

export interface ValidationWarning {
  field: string
  message: string
  severity: "warning"
}

export class TemplateValidator {
  /**
   * Полная валидация шаблона
   */
  validate(template: ProjectTemplate): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Базовые поля
    this.validateBasicFields(template, errors)

    // Структура
    this.validateStructure(template, errors, warnings)

    // Настройки
    this.validateSettings(template, errors, warnings)

    // Placeholders
    this.validatePlaceholders(template, errors, warnings)

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Валидация базовых полей
   */
  private validateBasicFields(template: ProjectTemplate, errors: ValidationError[]): void {
    if (!template.id || template.id.trim() === "") {
      errors.push({
        field: "id",
        message: "Template ID is required",
        severity: "error",
      })
    }

    if (!template.name || !template.name.en || template.name.en.trim() === "") {
      errors.push({
        field: "name.en",
        message: "Template name (English) is required",
        severity: "error",
      })
    }

    if (!template.name || !template.name.ru || template.name.ru.trim() === "") {
      errors.push({
        field: "name.ru",
        message: "Template name (Russian) is required",
        severity: "error",
      })
    }

    if (!template.category) {
      errors.push({
        field: "category",
        message: "Template category is required",
        severity: "error",
      })
    }

    if (!template.aspectRatio) {
      errors.push({
        field: "aspectRatio",
        message: "Aspect ratio is required",
        severity: "error",
      })
    }

    if (template.estimatedDuration <= 0) {
      errors.push({
        field: "estimatedDuration",
        message: "Estimated duration must be greater than 0",
        severity: "error",
      })
    }
  }

  /**
   * Валидация структуры
   */
  private validateStructure(template: ProjectTemplate, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!template.structure) {
      errors.push({
        field: "structure",
        message: "Template structure is required",
        severity: "error",
      })
      return
    }

    // Секции
    if (!template.structure.sections || template.structure.sections.length === 0) {
      errors.push({
        field: "structure.sections",
        message: "Template must have at least one section",
        severity: "error",
      })
    } else {
      this.validateSections(template.structure.sections, errors, warnings)
    }

    // Треки
    if (!template.structure.tracks || template.structure.tracks.length === 0) {
      errors.push({
        field: "structure.tracks",
        message: "Template must have at least one track",
        severity: "error",
      })
    } else {
      this.validateTracks(template.structure.tracks, errors, warnings)
    }
  }

  /**
   * Валидация секций
   */
  private validateSections(sections: Section[], errors: ValidationError[], warnings: ValidationWarning[]): void {
    const ids = new Set<string>()
    const positions: Array<{ position: number; duration: number }> = []

    sections.forEach((section, index) => {
      // Проверка ID
      if (!section.id || section.id.trim() === "") {
        errors.push({
          field: `structure.sections[${index}].id`,
          message: "Section ID is required",
          severity: "error",
        })
      } else if (ids.has(section.id)) {
        errors.push({
          field: `structure.sections[${index}].id`,
          message: `Duplicate section ID: ${section.id}`,
          severity: "error",
        })
      } else {
        ids.add(section.id)
      }

      // Проверка названия
      if (!section.name || !section.name.en) {
        errors.push({
          field: `structure.sections[${index}].name`,
          message: "Section name is required",
          severity: "error",
        })
      }

      // Проверка длительности
      if (section.duration <= 0) {
        errors.push({
          field: `structure.sections[${index}].duration`,
          message: "Section duration must be greater than 0",
          severity: "error",
        })
      }

      // Проверка позиции
      if (section.position < 0) {
        errors.push({
          field: `structure.sections[${index}].position`,
          message: "Section position cannot be negative",
          severity: "error",
        })
      }

      positions.push({
        position: section.position,
        duration: section.duration,
      })

      // Предупреждение о слишком коротких секциях
      if (section.duration < 1) {
        warnings.push({
          field: `structure.sections[${index}].duration`,
          message: `Section "${section.name.en}" is very short (${section.duration}s)`,
          severity: "warning",
        })
      }
    })

    // Проверка пересечений
    const overlaps = this.findOverlappingSections(positions)
    overlaps.forEach((overlap) => {
      errors.push({
        field: "structure.sections",
        message: `Sections overlap at time ${overlap.time}s`,
        severity: "error",
      })
    })
  }

  /**
   * Поиск пересекающихся секций
   */
  private findOverlappingSections(sections: Array<{ position: number; duration: number }>): Array<{ time: number }> {
    const overlaps: Array<{ time: number }> = []
    const sorted = [...sections].sort((a, b) => a.position - b.position)

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]
      const currentEnd = current.position + current.duration

      if (currentEnd > next.position) {
        overlaps.push({ time: next.position })
      }
    }

    return overlaps
  }

  /**
   * Валидация треков
   */
  private validateTracks(
    tracks: Array<{ id: string; type: string; name: string }>,
    errors: ValidationError[],
    warnings: ValidationWarning[],
  ): void {
    const ids = new Set<string>()

    tracks.forEach((track, index) => {
      // Проверка ID
      if (!track.id || track.id.trim() === "") {
        errors.push({
          field: `structure.tracks[${index}].id`,
          message: "Track ID is required",
          severity: "error",
        })
      } else if (ids.has(track.id)) {
        errors.push({
          field: `structure.tracks[${index}].id`,
          message: `Duplicate track ID: ${track.id}`,
          severity: "error",
        })
      } else {
        ids.add(track.id)
      }

      // Проверка типа
      if (!track.type) {
        errors.push({
          field: `structure.tracks[${index}].type`,
          message: "Track type is required",
          severity: "error",
        })
      }

      // Проверка названия
      if (!track.name || track.name.trim() === "") {
        errors.push({
          field: `structure.tracks[${index}].name`,
          message: "Track name is required",
          severity: "error",
        })
      }
    })

    // Предупреждение если нет видео трека
    const hasVideoTrack = tracks.some((t) => t.type === "video")
    if (!hasVideoTrack) {
      warnings.push({
        field: "structure.tracks",
        message: "Template has no video tracks",
        severity: "warning",
      })
    }
  }

  /**
   * Валидация настроек
   */
  private validateSettings(template: ProjectTemplate, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!template.settings) {
      errors.push({
        field: "settings",
        message: "Template settings are required",
        severity: "error",
      })
      return
    }

    // Разрешение
    if (!template.settings.resolution) {
      errors.push({
        field: "settings.resolution",
        message: "Resolution is required",
        severity: "error",
      })
    } else {
      // Проверка формата разрешения (должно быть "WIDTHxHEIGHT")
      const resolutionRegex = /^\d+x\d+$/
      if (!resolutionRegex.test(template.settings.resolution)) {
        errors.push({
          field: "settings.resolution",
          message: "Resolution must be in format WIDTHxHEIGHT (e.g. 1920x1080)",
          severity: "error",
        })
      } else {
        // Предупреждения о нестандартных разрешениях
        const commonResolutions = ["1920x1080", "1080x1920", "1280x720", "3840x2160", "1080x1080"]

        if (!commonResolutions.includes(template.settings.resolution)) {
          warnings.push({
            field: "settings.resolution",
            message: `Unusual resolution: ${template.settings.resolution}`,
            severity: "warning",
          })
        }
      }
    }

    // Частота кадров
    if (!template.settings.frameRate) {
      errors.push({
        field: "settings.frameRate",
        message: "Frame rate is required",
        severity: "error",
      })
    } else {
      const commonFrameRates = ["23.97", "24", "25", "29.97", "30", "50", "59.94", "60"]
      if (!commonFrameRates.includes(template.settings.frameRate)) {
        warnings.push({
          field: "settings.frameRate",
          message: `Unusual frame rate: ${template.settings.frameRate} fps`,
          severity: "warning",
        })
      }
    }

    // Aspect Ratio
    if (!template.settings.aspectRatio) {
      errors.push({
        field: "settings.aspectRatio",
        message: "Aspect ratio is required",
        severity: "error",
      })
    }

    // Color Space
    if (!template.settings.colorSpace) {
      errors.push({
        field: "settings.colorSpace",
        message: "Color space is required",
        severity: "error",
      })
    }
  }

  /**
   * Валидация placeholders
   */
  private validatePlaceholders(
    template: ProjectTemplate,
    errors: ValidationError[],
    _warnings: ValidationWarning[],
  ): void {
    if (!template.placeholders) {
      return
    }

    // Intro
    if (template.placeholders.intro) {
      if (template.placeholders.intro.duration <= 0) {
        errors.push({
          field: "placeholders.intro.duration",
          message: "Intro duration must be greater than 0",
          severity: "error",
        })
      }
    }

    // Outro
    if (template.placeholders.outro) {
      if (template.placeholders.outro.duration <= 0) {
        errors.push({
          field: "placeholders.outro.duration",
          message: "Outro duration must be greater than 0",
          severity: "error",
        })
      }
    }

    // Main content
    if (template.placeholders.mainContent) {
      const { minDuration, maxDuration } = template.placeholders.mainContent

      if (minDuration <= 0) {
        errors.push({
          field: "placeholders.mainContent.minDuration",
          message: "Main content minimum duration must be greater than 0",
          severity: "error",
        })
      }

      if (maxDuration && maxDuration < minDuration) {
        errors.push({
          field: "placeholders.mainContent.maxDuration",
          message: "Main content maximum duration cannot be less than minimum",
          severity: "error",
        })
      }
    }
  }

  /**
   * Быстрая валидация (только критичные ошибки)
   */
  quickValidate(template: ProjectTemplate): boolean {
    return !!(
      template.id &&
      template.name &&
      template.category &&
      template.structure &&
      template.structure.sections.length > 0 &&
      template.structure.tracks.length > 0 &&
      template.settings &&
      template.settings.resolution &&
      template.settings.frameRate
    )
  }
}

// Singleton экземпляр
export const templateValidator = new TemplateValidator()
