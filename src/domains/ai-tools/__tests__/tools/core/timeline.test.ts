/**
 * Тесты для Timeline Tools
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  timelineClipPlacementTool,
  timelineEnhancementApplicationTool,
  timelineProjectCreationTool,
  timelineSectionCreationTool,
  timelineStructureAnalysisTool,
  timelineTools,
  timelineTrackCreationTool,
} from "../../../tools/core/timeline"

// Мокаем оригинальные функции
vi.mock("../../../../../features/ai-chat/tools/core/timeline/create-project", () => ({
  createTimelineProject: vi.fn().mockResolvedValue({
    success: true,
    data: {
      projectId: "test-project-123",
      projectName: "Test Project",
      createdElements: ["timeline", "tracks"],
      trackStructure: { videoTracks: 1, audioTracks: 1 },
    },
  }),
}))

vi.mock("../../../../../features/ai-chat/tools/core/timeline/analyze-structure", () => ({
  analyzeTimelineStructure: vi.fn().mockResolvedValue({
    success: true,
    data: {
      complexity: "medium",
      recommendations: ["Optimize track layout"],
      structure: { tracks: 2, clips: 5 },
    },
  }),
}))

vi.mock("../../../../../features/ai-chat/tools/core/timeline/create-sections", () => ({
  createSectionsByStrategy: vi.fn().mockResolvedValue({
    success: true,
    data: {
      sections: [{ id: "section1", duration: 30 }],
      totalSections: 1,
      strategy: "auto",
    },
  }),
}))

vi.mock("../../../../../features/ai-chat/tools/core/timeline/create-tracks", () => ({
  createTrackStructure: vi.fn().mockResolvedValue({
    success: true,
    data: {
      tracks: [{ id: "track1", type: "video" }],
      totalTracks: 1,
    },
  }),
}))

vi.mock("../../../../../features/ai-chat/tools/core/timeline/place-clips", () => ({
  placeClipsOnTimeline: vi.fn().mockResolvedValue({
    success: true,
    data: {
      placedClips: [{ id: "clip1", position: 0 }],
      conflicts: [],
    },
  }),
}))

vi.mock("../../../../../features/ai-chat/tools/core/timeline/apply-enhancements", () => ({
  applyAutomaticEnhancements: vi.fn().mockResolvedValue({
    success: true,
    data: {
      appliedEnhancements: ["color-correction"],
      results: [{ enhancement: "color-correction", success: true }],
    },
  }),
}))

describe("Timeline Tools", () => {
  describe("Экспорт инструментов", () => {
    it("должен экспортировать все Timeline инструменты", () => {
      expect(timelineTools).toHaveLength(6)
      expect(timelineTools).toContain(timelineProjectCreationTool)
      expect(timelineTools).toContain(timelineStructureAnalysisTool)
      expect(timelineTools).toContain(timelineSectionCreationTool)
      expect(timelineTools).toContain(timelineTrackCreationTool)
      expect(timelineTools).toContain(timelineClipPlacementTool)
      expect(timelineTools).toContain(timelineEnhancementApplicationTool)
    })

    it("все инструменты должны иметь корректные метаданные", () => {
      timelineTools.forEach((tool) => {
        expect(tool.metadata.name).toBeDefined()
        expect(tool.metadata.domain).toBe("core")
        expect(tool.metadata.category).toBe("timeline")
        expect(tool.metadata.description).toBeDefined()
        expect(tool.metadata.version).toBeDefined()
        expect(tool.metadata.author).toBeDefined()
      })
    })
  })

  describe("Timeline Project Creation Tool", () => {
    it("должен иметь корректные метаданные", () => {
      const metadata = timelineProjectCreationTool.metadata

      expect(metadata.name).toBe("timeline-project-creation")
      expect(metadata.domain).toBe("core")
      expect(metadata.category).toBe("timeline")
      expect(metadata.description).toContain("Создание нового проекта Timeline")
      expect(metadata.tags).toContain("timeline")
      expect(metadata.tags).toContain("project")
      expect(metadata.dependencies).toContain("video-editing")
    })

    it("должен валидировать входные данные", () => {
      const validInput = {
        projectSettings: {
          name: "Test Project",
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
      }

      const invalidInput = {
        projectSettings: {
          name: "Test Project",
          // Отсутствуют resolution и fps
        },
      }

      expect(timelineProjectCreationTool.validate(validInput)).toBe(true)
      expect(timelineProjectCreationTool.validate(invalidInput)).toBe(false)
    })

    it("должен возвращать корректную схему", () => {
      const schema = timelineProjectCreationTool.getSchema()

      expect(schema.input.type).toBe("object")
      expect(schema.input.properties.projectSettings).toBeDefined()
      expect(schema.output.type).toBe("object")
      expect(schema.output.properties.projectId).toBeDefined()
    })

    it("должен успешно выполняться", async () => {
      const input = {
        projectSettings: {
          name: "Test Project",
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
      }

      const result = await timelineProjectCreationTool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data?.projectId).toBe("test-project-123")
      expect(result.data?.projectName).toBe("Test Project")
      expect(result.toolName).toBe("timeline-project-creation")
      expect(result.executionTime).toBeGreaterThan(0)
    })
  })

  describe("Timeline Structure Analysis Tool", () => {
    it("должен иметь корректные метаданные", () => {
      const metadata = timelineStructureAnalysisTool.metadata

      expect(metadata.name).toBe("timeline-structure-analysis")
      expect(metadata.description).toContain("Анализ структуры Timeline")
      expect(metadata.tags).toContain("analysis")
    })

    it("должен валидировать входные данные", () => {
      expect(timelineStructureAnalysisTool.validate({ timelineId: "test" })).toBe(true)
      expect(timelineStructureAnalysisTool.validate({ timeline: {} })).toBe(true)
      expect(timelineStructureAnalysisTool.validate({})).toBe(false)
    })

    it("должен успешно выполняться", async () => {
      const input = { timelineId: "timeline-123" }
      const result = await timelineStructureAnalysisTool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data?.complexity).toBe("medium")
      expect(result.data?.recommendations).toContain("Optimize track layout")
    })
  })

  describe("Timeline Section Creation Tool", () => {
    it("должен валидировать входные данные", () => {
      expect(timelineSectionCreationTool.validate({ strategy: "auto" })).toBe(true)
      expect(timelineSectionCreationTool.validate({})).toBe(false)
    })

    it("должен успешно выполняться", async () => {
      const input = { strategy: "auto", duration: 60 }
      const result = await timelineSectionCreationTool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data?.sections).toHaveLength(1)
      expect(result.data?.totalSections).toBe(1)
    })
  })

  describe("Timeline Track Creation Tool", () => {
    it("должен валидировать входные данные", () => {
      expect(timelineTrackCreationTool.validate({ trackType: "video" })).toBe(true)
      expect(timelineTrackCreationTool.validate({})).toBe(false)
    })

    it("должен успешно выполняться", async () => {
      const input = { trackType: "video", count: 3 }
      const result = await timelineTrackCreationTool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data?.tracks).toHaveLength(1)
      expect(result.data?.totalTracks).toBe(1)
    })
  })

  describe("Timeline Clip Placement Tool", () => {
    it("должен валидировать входные данные", () => {
      expect(timelineClipPlacementTool.validate({ clips: [] })).toBe(true)
      expect(timelineClipPlacementTool.validate({ clips: "not-array" })).toBe(false)
      expect(timelineClipPlacementTool.validate({})).toBe(false)
    })

    it("должен успешно выполняться", async () => {
      const input = { clips: [{ id: "clip1" }], strategy: "auto" }
      const result = await timelineClipPlacementTool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data?.placedClips).toHaveLength(1)
      expect(result.data?.conflicts).toHaveLength(0)
    })
  })

  describe("Timeline Enhancement Application Tool", () => {
    it("должен валидировать входные данные", () => {
      expect(timelineEnhancementApplicationTool.validate({ enhancements: ["color-correction"] })).toBe(true)
      expect(timelineEnhancementApplicationTool.validate({ enhancements: "not-array" })).toBe(false)
      expect(timelineEnhancementApplicationTool.validate({})).toBe(false)
    })

    it("должен успешно выполняться", async () => {
      const input = { enhancements: ["color-correction", "audio-sync"] }
      const result = await timelineEnhancementApplicationTool.execute(input)

      expect(result.success).toBe(true)
      expect(result.data?.appliedEnhancements).toContain("color-correction")
      expect(result.data?.results).toHaveLength(1)
    })
  })

  describe("Интеграция с BaseAITool", () => {
    it("все инструменты должны наследовать от BaseAITool", () => {
      timelineTools.forEach((tool) => {
        expect(tool.execute).toBeDefined()
        expect(tool.validate).toBeDefined()
        expect(tool.getSchema).toBeDefined()
        expect(tool.getToolName).toBeDefined()
        expect(tool.getMetadata).toBeDefined()
      })
    })

    it("должны поддерживать опции выполнения", async () => {
      const input = {
        projectSettings: {
          name: "Test Project",
          resolution: { width: 1920, height: 1080 },
          fps: 30,
        },
      }

      const options = {
        timeout: 5000,
        retries: 2,
        enableLogging: false,
      }

      const result = await timelineProjectCreationTool.execute(input, options)

      expect(result.success).toBe(true)
      expect(result.metadata?.maxRetries).toBe(2)
    })

    it("должны обрабатывать ошибки валидации", async () => {
      // Используем реально невалидные данные
      const invalidInput = {} // Отсутствуют обязательные поля

      const result = await timelineProjectCreationTool.execute(invalidInput)
      expect(result.success).toBe(false)
      expect(result.message).toContain("Невалидные входные данные")
    })
  })
})
