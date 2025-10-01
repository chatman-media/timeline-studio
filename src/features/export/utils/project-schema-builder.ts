import { OutputFormat, ProjectSchema } from "@/domains/video-editing"
import type { TimelineProject as Timeline } from "@/features/timeline/types/timeline"
import { timelineToProjectSchema } from "@/features/timeline/utils/timeline-to-project"
import { AUDIO_BITRATE } from "../constants/export-constants"
import type { ExportSettings } from "../types/export-types"

/**
 * Default export settings for ProjectSchema
 */
const DEFAULT_EXPORT_SETTINGS = {
  format: OutputFormat.Mp4,
  quality: 85,
  video_bitrate: 8000,
  audio_bitrate: AUDIO_BITRATE,
  hardware_acceleration: true,
  ffmpeg_args: [] as string[],
}

/**
 * Default preview settings for ProjectSchema
 */
const DEFAULT_PREVIEW_SETTINGS = {
  resolution: [1280, 720] as [number, number],
  fps: 30,
  quality: 75,
}

/**
 * Convert frontend export format to backend OutputFormat
 */
export function formatToOutputFormat(format: string): OutputFormat {
  switch (format) {
    case "mp4":
      return OutputFormat.Mp4
    case "mov":
    case "quicktime":
      return OutputFormat.Mov
    case "webm":
      return OutputFormat.WebM
    default:
      return OutputFormat.Mp4
  }
}

/**
 * Convert quality preset to numeric value
 */
export function qualityToNumber(quality: string): number {
  switch (quality) {
    case "best":
      return 95
    case "good":
      return 85
    case "normal":
      return 75
    default:
      return 85
  }
}

/**
 * Builder class for creating ProjectSchema with custom settings
 */
export class ProjectSchemaBuilder {
  private projectSchema: ProjectSchema

  constructor(timeline: Timeline, projectName?: string) {
    this.projectSchema = timelineToProjectSchema(timeline)
    if (projectName) {
      this.projectSchema.metadata.name = projectName
    }
  }

  /**
   * Apply export settings to the project schema
   */
  withExportSettings(exportSettings: Partial<ExportSettings>): this {
    // Update export format
    if (exportSettings.format) {
      this.projectSchema.settings.export.format = formatToOutputFormat(exportSettings.format)
    }

    // Update quality
    if (exportSettings.quality) {
      this.projectSchema.settings.export.quality = qualityToNumber(exportSettings.quality)
    }

    // Update video bitrate
    if (exportSettings.bitrate !== undefined) {
      this.projectSchema.settings.export.video_bitrate = exportSettings.bitrate
    }

    // Update audio bitrate (use default if not specified)
    this.projectSchema.settings.export.audio_bitrate = AUDIO_BITRATE

    // Update GPU acceleration
    if (exportSettings.enableGPU !== undefined) {
      this.projectSchema.settings.export.hardware_acceleration = exportSettings.enableGPU
    }

    // Update resolution
    if (exportSettings.resolution) {
      const resolutionMap: Record<string, [number, number]> = {
        "720": [1280, 720],
        "1080": [1920, 1080],
        "1440": [2560, 1440],
        "4k": [3840, 2160],
      }

      if (exportSettings.resolution !== "timeline" && resolutionMap[exportSettings.resolution]) {
        this.projectSchema.timeline.resolution = resolutionMap[exportSettings.resolution]
      }
    }

    // Update frame rate
    if (exportSettings.frameRate !== undefined) {
      const fps = Number.parseInt(exportSettings.frameRate)
      if (!Number.isNaN(fps)) {
        this.projectSchema.timeline.fps = fps
      }
    }

    return this
  }

  /**
   * Apply preview settings to the project schema
   */
  withPreviewSettings(previewSettings: { resolution?: [number, number]; fps?: number; quality?: number }): this {
    if (previewSettings.resolution) {
      this.projectSchema.settings.preview.resolution = previewSettings.resolution
    }

    if (previewSettings.fps !== undefined) {
      this.projectSchema.settings.preview.fps = previewSettings.fps
    }

    if (previewSettings.quality !== undefined) {
      this.projectSchema.settings.preview.quality = previewSettings.quality
    }

    return this
  }

  /**
   * Apply custom metadata
   */
  withMetadata(metadata: Partial<ProjectSchema["metadata"]>): this {
    this.projectSchema.metadata = {
      ...this.projectSchema.metadata,
      ...metadata,
    }

    return this
  }

  /**
   * Apply custom settings
   */
  withCustomSettings(customSettings: Record<string, any>): this {
    this.projectSchema.settings.custom = {
      ...this.projectSchema.settings.custom,
      ...customSettings,
    }

    return this
  }

  /**
   * Apply time range for section export
   */
  withTimeRange(startTime: number, endTime: number): this {
    // Фильтруем клипы по временному диапазону
    this.projectSchema.tracks = this.projectSchema.tracks.map((track) => ({
      ...track,
      clips: track.clips
        .filter((clip) => {
          const clipStart = clip.start_time
          const clipEnd = clip.end_time
          // Клип включается, если он хотя бы частично пересекается с диапазоном
          return clipEnd > startTime && clipStart < endTime
        })
        .map((clip) => {
          // Обрезаем клипы по границам диапазона
          const adjustedStart = Math.max(clip.start_time, startTime)
          const adjustedEnd = Math.min(clip.end_time, endTime)
          const adjustedSourceStart = clip.source_start + (adjustedStart - clip.start_time)
          const adjustedSourceEnd = clip.source_end - (clip.end_time - adjustedEnd)

          return {
            ...clip,
            start_time: adjustedStart - startTime, // Сдвигаем к началу
            end_time: adjustedEnd - startTime,
            source_start: adjustedSourceStart,
            source_end: adjustedSourceEnd,
          }
        }),
    }))

    // Фильтруем субтитры по временному диапазону
    this.projectSchema.subtitles = this.projectSchema.subtitles
      .filter((subtitle) => {
        return subtitle.end_time > startTime && subtitle.start_time < endTime
      })
      .map((subtitle) => {
        const adjustedStart = Math.max(subtitle.start_time, startTime) - startTime
        const adjustedEnd = Math.min(subtitle.end_time, endTime) - startTime

        return {
          ...subtitle,
          start_time: adjustedStart,
          end_time: adjustedEnd,
        }
      })

    // Обновляем длительность проекта
    this.projectSchema.timeline.duration = endTime - startTime

    // Добавляем информацию о временном диапазоне в кастомные настройки
    this.projectSchema.settings.custom.timeRange = {
      start: startTime,
      end: endTime,
      originalDuration: this.projectSchema.timeline.duration,
    }

    return this
  }

  /**
   * Get the built ProjectSchema
   */
  build(): ProjectSchema {
    return this.projectSchema
  }

  /**
   * Create ProjectSchema with sensible defaults from Timeline
   */
  static createDefault(timeline: Timeline, projectName?: string): ProjectSchema {
    return new ProjectSchemaBuilder(timeline, projectName).build()
  }

  /**
   * Create ProjectSchema optimized for export
   */
  static createForExport(timeline: Timeline, exportSettings: ExportSettings, projectName?: string): ProjectSchema {
    return new ProjectSchemaBuilder(timeline, projectName).withExportSettings(exportSettings).build()
  }

  /**
   * Create ProjectSchema optimized for preview
   */
  static createForPreview(
    timeline: Timeline,
    previewSettings?: {
      resolution?: [number, number]
      fps?: number
      quality?: number
    },
  ): ProjectSchema {
    const builder = new ProjectSchemaBuilder(timeline, "preview")

    // Always set preview settings, use defaults if not provided
    builder.withPreviewSettings({
      resolution: previewSettings?.resolution || DEFAULT_PREVIEW_SETTINGS.resolution,
      fps: previewSettings?.fps || DEFAULT_PREVIEW_SETTINGS.fps,
      quality: previewSettings?.quality || DEFAULT_PREVIEW_SETTINGS.quality,
    })

    return builder.build()
  }

  /**
   * Create ProjectSchema for section export with time range
   */
  static createForSectionExport(
    timeline: Timeline,
    exportSettings: ExportSettings,
    startTime: number,
    endTime: number,
    sectionName?: string,
  ): ProjectSchema {
    return new ProjectSchemaBuilder(timeline, sectionName || "section")
      .withExportSettings(exportSettings)
      .withTimeRange(startTime, endTime)
      .build()
  }
}

/**
 * Get default export settings
 */
export function getDefaultExportSettings(): typeof DEFAULT_EXPORT_SETTINGS {
  return { ...DEFAULT_EXPORT_SETTINGS }
}

/**
 * Get default preview settings
 */
export function getDefaultPreviewSettings(): typeof DEFAULT_PREVIEW_SETTINGS {
  return { ...DEFAULT_PREVIEW_SETTINGS }
}
