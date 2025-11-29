import { beforeEach, describe, expect, it, vi } from "vitest"

import type { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"

import type { ApplyTemplateOptions } from "../../services/template-applier"
import { TemplateApplier } from "../../services/template-applier"
import type { ProjectTemplate } from "../../types/project-template"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("TemplateApplier", () => {
  let applier: TemplateApplier
  let mockProject: TimelineStudioProject
  let mockTemplate: ProjectTemplate

  beforeEach(() => {
    applier = new TemplateApplier()

    mockProject = {
      metadata: {
        id: "test-project",
        name: "Test Project",
        version: "1.0.0",
        created: new Date(),
        modified: new Date(),
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        aspectRatio: "16:9",
        audio: {
          sampleRate: 48000,
          bitDepth: 16,
          channels: 2,
          masterVolume: 1,
          panLaw: "-3dB",
        },
      },
      sequences: new Map(),
      activeSequenceId: "",
      mediaLibrary: { items: [], folders: [] },
      preferences: { autoSave: true, autoSaveInterval: 300, showTimecode: true },
    } as unknown as TimelineStudioProject

    mockTemplate = {
      id: "test-template",
      name: { en: "Test Template", ru: "Тестовый шаблон" },
      category: "youtube",
      aspectRatio: "16:9",
      estimatedDuration: 600,
      settings: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        aspectRatio: "16:9",
        audioSampleRate: 48000,
        audioChannels: 2,
      },
      structure: {
        sections: [
          {
            id: "section-1",
            type: "intro",
            name: { en: "Intro", ru: "Интро" },
            duration: 5,
            position: 0,
          },
          {
            id: "section-2",
            type: "content",
            name: { en: "Main Content", ru: "Основной контент" },
            duration: 590,
            position: 5,
          },
          {
            id: "section-3",
            type: "outro",
            name: { en: "Outro", ru: "Аутро" },
            duration: 5,
            position: 595,
          },
        ],
        tracks: [
          { id: "track-1", type: "video", name: "Video Track 1" },
          { id: "track-2", type: "audio", name: "Audio Track 1" },
        ],
      },
      placeholders: {},
    } as unknown as ProjectTemplate
  })

  describe("applyTemplate", () => {
    it("should create new sequence with default options", async () => {
      const options: ApplyTemplateOptions = {
        mode: "new",
        createTracks: true,
        createMarkers: true,
        applyProjectSettings: false,
      }

      const sequence = await applier.applyTemplate(mockProject, mockTemplate, options)

      expect(sequence).toBeDefined()
      expect(sequence.name).toBe("Test Template")
      expect(sequence.type).toBe("main")
      expect(mockProject.sequences.has(sequence.id)).toBe(true)
      expect(mockProject.activeSequenceId).toBe(sequence.id)
    })

    it("should create sequence with custom name", async () => {
      const options: ApplyTemplateOptions = {
        mode: "new",
        sequenceName: "Custom Sequence Name",
        createTracks: false,
        createMarkers: false,
        applyProjectSettings: false,
      }

      const sequence = await applier.applyTemplate(mockProject, mockTemplate, options)

      expect(sequence.name).toBe("Custom Sequence Name")
    })

    it("should create tracks when option is enabled", async () => {
      const options: ApplyTemplateOptions = {
        mode: "new",
        createTracks: true,
        createMarkers: false,
        applyProjectSettings: false,
      }

      const sequence = await applier.applyTemplate(mockProject, mockTemplate, options)

      expect(sequence.composition.tracks).toHaveLength(2)
      expect(sequence.composition.tracks[0].type).toBe("video")
      expect(sequence.composition.tracks[1].type).toBe("audio")
    })

    it("should not create tracks when option is disabled", async () => {
      const options: ApplyTemplateOptions = {
        mode: "new",
        createTracks: false,
        createMarkers: false,
        applyProjectSettings: false,
      }

      const sequence = await applier.applyTemplate(mockProject, mockTemplate, options)

      expect(sequence.composition.tracks).toHaveLength(0)
    })

    it("should create markers when option is enabled", async () => {
      const options: ApplyTemplateOptions = {
        mode: "new",
        createTracks: false,
        createMarkers: true,
        applyProjectSettings: false,
      }

      const sequence = await applier.applyTemplate(mockProject, mockTemplate, options)

      expect(sequence.markers).toHaveLength(3)
      expect(sequence.markers[0].name).toBe("Intro")
      expect(sequence.markers[0].time).toBe(0)
      expect(sequence.markers[0].duration).toBe(5)
    })

    it("should replace active sequence in replace mode", async () => {
      // Create initial sequence
      const initialSequence = await applier.applyTemplate(mockProject, mockTemplate, {
        mode: "new",
        createTracks: false,
        createMarkers: false,
        applyProjectSettings: false,
      })

      const initialId = initialSequence.id

      // Replace it
      const replacedSequence = await applier.applyTemplate(mockProject, mockTemplate, {
        mode: "replace",
        sequenceName: "Replaced",
        createTracks: false,
        createMarkers: false,
        applyProjectSettings: false,
      })

      expect(replacedSequence.id).toBe(initialId)
      expect(replacedSequence.name).toBe("Replaced")
      expect(mockProject.sequences.has(initialId)).toBe(true)
    })

    it("should apply project settings when option is enabled", async () => {
      mockProject.settings.resolution = undefined as any
      mockProject.settings.frameRate = undefined as any
      mockProject.settings.aspectRatio = undefined as any

      const options: ApplyTemplateOptions = {
        mode: "new",
        createTracks: false,
        createMarkers: false,
        applyProjectSettings: true,
      }

      await applier.applyTemplate(mockProject, mockTemplate, options)

      expect(mockProject.settings.resolution).toBe("1920x1080")
      expect(mockProject.settings.frameRate).toBe("30")
      expect(mockProject.settings.audio.sampleRate).toBe(48000)
      expect(mockProject.settings.audio.channels).toBe(2)
    })
  })

  describe("validateTemplate", () => {
    it("should validate correct template", () => {
      const result = applier.validateTemplate(mockTemplate)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it("should detect missing required fields", () => {
      const invalidTemplate = {
        ...mockTemplate,
        id: "",
      }

      const result = applier.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("required fields"))).toBe(true)
    })

    it("should detect missing structure", () => {
      const invalidTemplate = {
        ...mockTemplate,
        structure: undefined as any,
      }

      const result = applier.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("structure"))).toBe(true)
    })

    it("should detect empty sections", () => {
      const invalidTemplate = {
        ...mockTemplate,
        structure: {
          ...mockTemplate.structure,
          sections: [],
        },
      }

      const result = applier.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("at least one section"))).toBe(true)
    })

    it("should detect empty tracks", () => {
      const invalidTemplate = {
        ...mockTemplate,
        structure: {
          ...mockTemplate.structure,
          tracks: [],
        },
      }

      const result = applier.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("at least one track"))).toBe(true)
    })

    it("should detect invalid settings", () => {
      const invalidTemplate = {
        ...mockTemplate,
        settings: {
          ...mockTemplate.settings,
          resolution: undefined as any,
        },
      }

      const result = applier.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("resolution"))).toBe(true)
    })

    it("should detect overlapping sections", () => {
      const invalidTemplate = {
        ...mockTemplate,
        structure: {
          ...mockTemplate.structure,
          sections: [
            {
              id: "section-1",
              type: "intro" as const,
              name: { en: "Intro", ru: "Интро" },
              duration: 10,
              position: 0,
            },
            {
              id: "section-2",
              type: "content" as const,
              name: { en: "Content", ru: "Контент" },
              duration: 10,
              position: 5, // Overlaps with section-1
            },
          ],
        },
      }

      const result = applier.validateTemplate(invalidTemplate)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes("overlapping"))).toBe(true)
    })
  })

  describe("previewTemplate", () => {
    it("should generate preview data", () => {
      const preview = applier.previewTemplate(mockTemplate)

      expect(preview.duration).toBe(600)
      expect(preview.trackCount).toBe(2)
      expect(preview.sectionCount).toBe(3)
      expect(preview.markers).toHaveLength(3)
      expect(preview.tracks).toHaveLength(2)
    })

    it("should include marker details", () => {
      const preview = applier.previewTemplate(mockTemplate)

      expect(preview.markers[0]).toEqual({
        name: "Intro",
        time: 0,
        duration: 5,
      })
      expect(preview.markers[1]).toEqual({
        name: "Main Content",
        time: 5,
        duration: 590,
      })
    })

    it("should include track details", () => {
      const preview = applier.previewTemplate(mockTemplate)

      expect(preview.tracks[0]).toEqual({
        name: "Video Track 1",
        type: "video",
      })
      expect(preview.tracks[1]).toEqual({
        name: "Audio Track 1",
        type: "audio",
      })
    })
  })
})
