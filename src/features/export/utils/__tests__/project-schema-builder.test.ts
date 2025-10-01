import { describe, expect, it, vi } from "vitest"

import { OutputFormat } from "@/domains/video-editing/types"

import { AUDIO_BITRATE } from "../../constants/export-constants"
import type { ExportSettings } from "../../types/export-types"
import {
  formatToOutputFormat,
  getDefaultExportSettings,
  getDefaultPreviewSettings,
  ProjectSchemaBuilder,
  qualityToNumber,
} from "../project-schema-builder"

// Mock timelineToProjectSchema
vi.mock("@/features/timeline/utils/timeline-to-project", () => ({
  timelineToProjectSchema: vi.fn(() => createMockProjectSchema()),
}))

// Create mock timeline
const createMockTimeline = () => ({
  id: "test-timeline",
  name: "Test Timeline",
  duration: 60,
  fps: 30,
  resolution: [1920, 1080] as [number, number],
  tracks: [],
  markers: [],
  settings: {},
})

// Create mock project schema
const createMockProjectSchema = () => ({
  metadata: {
    name: "Test Project",
    version: "1.0.0",
    created_at: new Date().toISOString(),
  },
  timeline: {
    duration: 60,
    fps: 30,
    resolution: [1920, 1080] as [number, number],
  },
  tracks: [
    {
      id: "track1",
      type: "video",
      clips: [
        {
          id: "clip1",
          start_time: 0,
          end_time: 30,
          source_start: 0,
          source_end: 30,
          source_path: "/path/to/video.mp4",
        },
        {
          id: "clip2",
          start_time: 30,
          end_time: 60,
          source_start: 0,
          source_end: 30,
          source_path: "/path/to/video2.mp4",
        },
      ],
    },
  ],
  subtitles: [
    {
      id: "sub1",
      start_time: 10,
      end_time: 20,
      text: "Test subtitle",
    },
    {
      id: "sub2",
      start_time: 40,
      end_time: 50,
      text: "Another subtitle",
    },
  ],
  settings: {
    export: {
      format: OutputFormat.Mp4,
      quality: 85,
      video_bitrate: 8000,
      audio_bitrate: 192,
      hardware_acceleration: true,
      ffmpeg_args: [],
    },
    preview: {
      resolution: [1280, 720] as [number, number],
      fps: 30,
      quality: 75,
    },
    custom: {},
  },
})

describe("formatToOutputFormat", () => {
  it("should convert mp4 format", () => {
    expect(formatToOutputFormat("mp4")).toBe(OutputFormat.Mp4)
  })

  it("should convert mov format", () => {
    expect(formatToOutputFormat("mov")).toBe(OutputFormat.Mov)
    expect(formatToOutputFormat("quicktime")).toBe(OutputFormat.Mov)
  })

  it("should convert webm format", () => {
    expect(formatToOutputFormat("webm")).toBe(OutputFormat.WebM)
  })

  it("should default to mp4 for unknown formats", () => {
    expect(formatToOutputFormat("unknown")).toBe(OutputFormat.Mp4)
    expect(formatToOutputFormat("")).toBe(OutputFormat.Mp4)
  })
})

describe("qualityToNumber", () => {
  it("should convert quality presets to numbers", () => {
    expect(qualityToNumber("best")).toBe(95)
    expect(qualityToNumber("good")).toBe(85)
    expect(qualityToNumber("normal")).toBe(75)
  })

  it("should default to 85 for unknown quality", () => {
    expect(qualityToNumber("unknown")).toBe(85)
    expect(qualityToNumber("")).toBe(85)
  })
})

describe("getDefaultExportSettings", () => {
  it("should return default export settings", () => {
    const settings = getDefaultExportSettings()

    expect(settings).toEqual({
      format: OutputFormat.Mp4,
      quality: 85,
      video_bitrate: 8000,
      audio_bitrate: AUDIO_BITRATE,
      hardware_acceleration: true,
      ffmpeg_args: [],
    })
  })

  it("should return a copy of defaults", () => {
    const settings1 = getDefaultExportSettings()
    const settings2 = getDefaultExportSettings()

    expect(settings1).not.toBe(settings2)
    expect(settings1).toEqual(settings2)
  })
})

describe("getDefaultPreviewSettings", () => {
  it("should return default preview settings", () => {
    const settings = getDefaultPreviewSettings()

    expect(settings).toEqual({
      resolution: [1280, 720],
      fps: 30,
      quality: 75,
    })
  })

  it("should return a copy of defaults", () => {
    const settings1 = getDefaultPreviewSettings()
    const settings2 = getDefaultPreviewSettings()

    expect(settings1).not.toBe(settings2)
    expect(settings1).toEqual(settings2)
  })
})

describe("ProjectSchemaBuilder", () => {
  const mockTimeline = createMockTimeline()

  describe("constructor", () => {
    it("should create builder with timeline", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const schema = builder.build()

      expect(schema).toBeDefined()
      expect(schema.metadata.name).toBe("Test Project")
    })

    it("should set custom project name", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline, "Custom Project")
      const schema = builder.build()

      expect(schema.metadata.name).toBe("Custom Project")
    })
  })

  describe("withExportSettings", () => {
    it("should apply export format", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        format: "webm",
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.settings.export.format).toBe(OutputFormat.WebM)
    })

    it("should apply quality settings", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        quality: "best",
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.settings.export.quality).toBe(95)
    })

    it("should apply video bitrate", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        bitrate: 12000,
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.settings.export.video_bitrate).toBe(12000)
    })

    it("should always set audio bitrate to default", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {}

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.settings.export.audio_bitrate).toBe(AUDIO_BITRATE)
    })

    it("should apply GPU acceleration setting", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        enableGPU: false,
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.settings.export.hardware_acceleration).toBe(false)
    })

    it("should apply resolution settings", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        resolution: "4k",
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.timeline.resolution).toEqual([3840, 2160])
    })

    it("should skip resolution when set to timeline", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        resolution: "timeline",
      }

      const schema = builder.withExportSettings(exportSettings).build()

      // Should keep original timeline resolution
      expect(schema.timeline.resolution).toEqual([1920, 1080])
    })

    it("should apply frame rate", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        frameRate: "60",
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.timeline.fps).toBe(60)
    })

    it("should ignore invalid frame rate", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        frameRate: "invalid",
      }

      const schema = builder.withExportSettings(exportSettings).build()

      // Should keep original fps
      expect(schema.timeline.fps).toBe(30)
    })

    it("should chain multiple settings", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const exportSettings: Partial<ExportSettings> = {
        format: "mov",
        quality: "best",
        resolution: "1440",
        enableGPU: true,
      }

      const schema = builder.withExportSettings(exportSettings).build()

      expect(schema.settings.export.format).toBe(OutputFormat.Mov)
      expect(schema.settings.export.quality).toBe(95)
      expect(schema.timeline.resolution).toEqual([2560, 1440])
      expect(schema.settings.export.hardware_acceleration).toBe(true)
    })
  })

  describe("withPreviewSettings", () => {
    it("should apply preview resolution", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const previewSettings = {
        resolution: [1920, 1080] as [number, number],
      }

      const schema = builder.withPreviewSettings(previewSettings).build()

      expect(schema.settings.preview.resolution).toEqual([1920, 1080])
    })

    it("should apply preview fps", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const previewSettings = {
        fps: 60,
      }

      const schema = builder.withPreviewSettings(previewSettings).build()

      expect(schema.settings.preview.fps).toBe(60)
    })

    it("should apply preview quality", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const previewSettings = {
        quality: 90,
      }

      const schema = builder.withPreviewSettings(previewSettings).build()

      expect(schema.settings.preview.quality).toBe(90)
    })
  })

  describe("withMetadata", () => {
    it("should apply custom metadata", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const metadata = {
        name: "Custom Name",
        version: "2.0.0",
      }

      const schema = builder.withMetadata(metadata).build()

      expect(schema.metadata.name).toBe("Custom Name")
      expect(schema.metadata.version).toBe("2.0.0")
    })

    it("should merge with existing metadata", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const metadata = {
        version: "2.0.0",
      }

      const schema = builder.withMetadata(metadata).build()

      expect(schema.metadata.name).toBe("Test Project") // original preserved
      expect(schema.metadata.version).toBe("2.0.0") // new value
    })
  })

  describe("withCustomSettings", () => {
    it("should apply custom settings", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
      const customSettings = {
        customField: "value",
        anotherField: 123,
      }

      const schema = builder.withCustomSettings(customSettings).build()

      expect(schema.settings.custom.customField).toBe("value")
      expect(schema.settings.custom.anotherField).toBe(123)
    })

    it("should merge with existing custom settings", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)
        .withCustomSettings({ field1: "value1" })
        .withCustomSettings({ field2: "value2" })

      const schema = builder.build()

      expect(schema.settings.custom.field1).toBe("value1")
      expect(schema.settings.custom.field2).toBe("value2")
    })
  })

  describe("withTimeRange", () => {
    it("should filter clips by time range", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)

      const schema = builder.withTimeRange(10, 40).build()

      // Should include clips that intersect with [10, 40]
      expect(schema.tracks[0].clips).toHaveLength(2)

      // First clip should be adjusted
      expect(schema.tracks[0].clips[0].start_time).toBe(0) // 10 - 10 = 0
      expect(schema.tracks[0].clips[0].end_time).toBe(20) // 30 - 10 = 20

      // Second clip should be adjusted and trimmed
      expect(schema.tracks[0].clips[1].start_time).toBe(20) // 30 - 10 = 20
      expect(schema.tracks[0].clips[1].end_time).toBe(30) // 40 - 10 = 30
    })

    it("should filter subtitles by time range", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)

      const schema = builder.withTimeRange(15, 45).build()

      // Should include subtitles that intersect with [15, 45]
      expect(schema.subtitles).toHaveLength(2)

      // First subtitle (10-20) intersects with [15, 45]
      expect(schema.subtitles[0].start_time).toBe(0) // max(10, 15) - 15 = 0
      expect(schema.subtitles[0].end_time).toBe(5) // min(20, 45) - 15 = 5

      // Second subtitle (40-50) intersects with [15, 45]
      expect(schema.subtitles[1].start_time).toBe(25) // max(40, 15) - 15 = 25
      expect(schema.subtitles[1].end_time).toBe(30) // min(50, 45) - 15 = 30
    })

    it("should update timeline duration", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)

      const schema = builder.withTimeRange(10, 40).build()

      expect(schema.timeline.duration).toBe(30) // 40 - 10
    })

    it("should add time range to custom settings", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)

      const schema = builder.withTimeRange(10, 40).build()

      expect(schema.settings.custom.timeRange).toEqual({
        start: 10,
        end: 40,
        originalDuration: 30, // 40 - 10
      })
    })

    it("should handle clips outside time range", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)

      const schema = builder.withTimeRange(65, 75).build()

      // No clips should be included (all clips end at 60)
      expect(schema.tracks[0].clips).toHaveLength(0)
    })

    it("should handle subtitles outside time range", () => {
      const builder = new ProjectSchemaBuilder(mockTimeline)

      const schema = builder.withTimeRange(0, 5).build()

      // No subtitles should be included (first starts at 10)
      expect(schema.subtitles).toHaveLength(0)
    })
  })

  describe("static methods", () => {
    describe("createDefault", () => {
      it("should create default project schema", () => {
        const schema = ProjectSchemaBuilder.createDefault(mockTimeline)

        expect(schema).toBeDefined()
        expect(schema.metadata.name).toBe("Test Project")
      })

      it("should create with custom project name", () => {
        const schema = ProjectSchemaBuilder.createDefault(mockTimeline, "Custom")

        expect(schema.metadata.name).toBe("Custom")
      })
    })

    describe("createForExport", () => {
      it("should create schema with export settings", () => {
        const exportSettings: ExportSettings = {
          fileName: "test",
          savePath: "/tmp",
          format: "webm",
          quality: "best",
          resolution: "4k",
          frameRate: "60",
          enableGPU: true,
        }

        const schema = ProjectSchemaBuilder.createForExport(mockTimeline, exportSettings, "Export Project")

        expect(schema.metadata.name).toBe("Export Project")
        expect(schema.settings.export.format).toBe(OutputFormat.WebM)
        expect(schema.settings.export.quality).toBe(95)
        expect(schema.timeline.resolution).toEqual([3840, 2160])
        expect(schema.timeline.fps).toBe(60)
      })
    })

    describe("createForPreview", () => {
      it("should create schema with default preview settings", () => {
        const schema = ProjectSchemaBuilder.createForPreview(mockTimeline)

        expect(schema.metadata.name).toBe("preview")
        expect(schema.settings.preview.resolution).toEqual([1280, 720])
        expect(schema.settings.preview.fps).toBe(30)
        expect(schema.settings.preview.quality).toBe(75)
      })

      it("should create schema with custom preview settings", () => {
        const previewSettings = {
          resolution: [1920, 1080] as [number, number],
          fps: 60,
          quality: 90,
        }

        const schema = ProjectSchemaBuilder.createForPreview(mockTimeline, previewSettings)

        expect(schema.settings.preview.resolution).toEqual([1920, 1080])
        expect(schema.settings.preview.fps).toBe(60)
        expect(schema.settings.preview.quality).toBe(90)
      })
    })

    describe("createForSectionExport", () => {
      it("should create schema for section export", () => {
        const exportSettings: ExportSettings = {
          fileName: "section",
          savePath: "/tmp",
          format: "mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: false,
        }

        const schema = ProjectSchemaBuilder.createForSectionExport(mockTimeline, exportSettings, 10, 40, "Test Section")

        expect(schema.metadata.name).toBe("Test Section")
        expect(schema.timeline.duration).toBe(30) // 40 - 10
        expect(schema.settings.custom.timeRange).toEqual({
          start: 10,
          end: 40,
          originalDuration: 30,
        })
      })

      it("should use default section name", () => {
        const exportSettings: ExportSettings = {
          fileName: "section",
          savePath: "/tmp",
          format: "mp4",
          quality: "good",
          resolution: "1080",
          frameRate: "30",
          enableGPU: false,
        }

        const schema = ProjectSchemaBuilder.createForSectionExport(mockTimeline, exportSettings, 10, 40)

        expect(schema.metadata.name).toBe("section")
      })
    })
  })

  describe("method chaining", () => {
    it("should allow chaining multiple methods", () => {
      const exportSettings: Partial<ExportSettings> = {
        format: "mov",
        quality: "best",
      }

      const previewSettings = {
        resolution: [1920, 1080] as [number, number],
        fps: 60,
      }

      const metadata = {
        version: "2.0.0",
      }

      const customSettings = {
        customField: "value",
      }

      const schema = new ProjectSchemaBuilder(mockTimeline, "Chained Project")
        .withExportSettings(exportSettings)
        .withPreviewSettings(previewSettings)
        .withMetadata(metadata)
        .withCustomSettings(customSettings)
        .withTimeRange(5, 25)
        .build()

      expect(schema.metadata.name).toBe("Chained Project")
      expect(schema.metadata.version).toBe("2.0.0")
      expect(schema.settings.export.format).toBe(OutputFormat.Mov)
      expect(schema.settings.export.quality).toBe(95)
      expect(schema.settings.preview.resolution).toEqual([1920, 1080])
      expect(schema.settings.preview.fps).toBe(60)
      expect(schema.settings.custom.customField).toBe("value")
      expect(schema.timeline.duration).toBe(20) // 25 - 5
    })
  })
})
