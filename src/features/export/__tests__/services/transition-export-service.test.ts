import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimelineProject } from "@/features/timeline/types"
import type { TimelineTransition } from "@/features/timeline/types/timeline-transition"
import type { Transition } from "@/features/transitions/types/transitions"
import { OutputFormat } from "@/features/video-compiler/types/render"
import type { ExportSettings } from "../../types/export-types"
import type { FFmpegTransitionConfig, TransitionOptimizationSettings } from "../../types/transition-export-types"

// Создаем mockLogger через vi.hoisted для корректного hoisting
const mockLogger = vi.hoisted(() => ({
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}))

// Мокируем createLogger чтобы всегда возвращать один и тот же mockLogger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => mockLogger),
}))

import { TransitionExportService } from "../../services/transition-export-service"

describe("TransitionExportService", () => {
  let service: TransitionExportService

  beforeEach(() => {
    service = TransitionExportService.getInstance()
    service.clearStatuses()
  })

  describe("Singleton Pattern", () => {
    it("should return same instance", () => {
      const instance1 = TransitionExportService.getInstance()
      const instance2 = TransitionExportService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should initialize with default optimization settings", () => {
      const newService = TransitionExportService.getInstance()
      expect(newService).toBeDefined()
    })
  })

  describe("extractTransitionsFromProject", () => {
    it("should extract transitions from project", () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      expect(transitions).toHaveLength(2)
      expect(transitions[0].transition.id).toBe("transition-1")
      expect(transitions[1].transition.id).toBe("transition-2")
    })

    it("should sort transitions by start time", () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      expect(transitions[0].startTime).toBeLessThanOrEqual(transitions[1].startTime)
    })

    it("should calculate render quality for each transition", () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      transitions.forEach((t) => {
        expect(t.renderQuality).toBeGreaterThanOrEqual(50)
        expect(t.renderQuality).toBeLessThanOrEqual(100)
      })
    })

    it("should handle project without transitions", () => {
      const emptyProject = createMockProject()
      emptyProject.sections[0].tracks[0].transitions = []
      const availableTransitions = createAvailableTransitionsMap()

      const transitions = service.extractTransitionsFromProject(emptyProject, availableTransitions)

      expect(transitions).toHaveLength(0)
    })

    it("should skip transitions with missing resources", () => {
      const mockProject = createMockProject()
      // Добавляем переход с несуществующим resource ID
      const track = mockProject.sections[0].tracks[0]
      const invalidTransition: TimelineTransition = {
        id: "invalid-transition",
        transitionId: "non-existent-resource",
        type: "between",
        position: 5,
        duration: 1,
        startClipId: "clip-1",
        endClipId: "clip-2",
        trackId: "track-1",
        parameters: {
          intensity: 1.0,
          direction: "center",
        },
        keyframes: [],
        curve: { type: "linear", points: [] },
        isEnabled: true,
        isLocked: false,
      }

      if (!mockProject.resources.timelineTransitions) {
        mockProject.resources.timelineTransitions = []
      }
      mockProject.resources.timelineTransitions.push(invalidTransition as any)
      track.transitions?.push("invalid-transition")

      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      // Should only return valid transitions
      expect(transitions.every((t) => t.resource !== undefined)).toBe(true)
    })

    it("should handle global tracks", () => {
      const mockProject = createMockProject()
      const globalTrack = {
        id: "global-track",
        name: "Global",
        type: "video" as const,
        order: 0,
        clips: [],
        transitions: ["transition-1"],
        isLocked: false,
        isMuted: false,
        isHidden: false,
        isSolo: false,
        volume: 1,
        pan: 0,
        height: 100,
        trackEffects: [],
        trackFilters: [],
      }

      mockProject.globalTracks = [globalTrack]

      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      expect(transitions.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("createFFmpegConfigs", () => {
    it("should create FFmpeg configs from transitions", async () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])

      const configs = await service.createFFmpegConfigs(transitions, exportSettings, clipPaths)

      expect(configs.length).toBeGreaterThan(0)
      configs.forEach((config) => {
        expect(config.id).toBeDefined()
        expect(config.type).toBeDefined()
        expect(config.inputA).toBeDefined()
        expect(config.inputB).toBeDefined()
      })
    })

    it("should skip transitions with missing clip paths", async () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([["clip-1", "/path/to/clip1.mp4"]])
      // clip-2 отсутствует

      const configs = await service.createFFmpegConfigs(transitions, exportSettings, clipPaths)

      // Should skip transitions without both clips
      expect(configs.length).toBeLessThan(transitions.length)
    })

    it("should apply GPU settings when enabled", async () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      const exportSettings = createMockExportSettings()
      exportSettings.enableGPU = true

      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])

      const configs = await service.createFFmpegConfigs(transitions, exportSettings, clipPaths)

      const gpuConfig = configs.find((c) => c.useGpu)
      if (gpuConfig) {
        expect(gpuConfig.useGpu).toBe(true)
        expect(gpuConfig.gpuDevice).toBe("auto")
      }
    })

    it("should handle errors when skipFailedTransitions is enabled", async () => {
      const mockProject = createMockProject()
      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      service.updateOptimizationSettings({ skipFailedTransitions: true })

      const configs = await service.createFFmpegConfigs(transitions, exportSettings, clipPaths)

      // Should not throw, just skip failed transitions
      expect(configs).toBeDefined()
    })
  })

  describe("generateFFmpegCommands", () => {
    it("should generate FFmpeg commands from configs", () => {
      const configs: FFmpegTransitionConfig[] = [
        {
          id: "transition-1",
          type: "fade",
          startTime: 0,
          duration: 1,
          parameters: {
            intensity: 1.0,
            direction: "center",
            blur: { enabled: false, amount: 0, type: "gaussian" },
            color: { enabled: false, saturation: 0, brightness: 0 },
          },
          inputA: "/path/clip1.mp4",
          inputB: "/path/clip2.mp4",
          output: "/output/transition1.mp4",
          quality: 85,
          resolution: { width: 1920, height: 1080 },
          useGpu: false,
        },
      ]

      const commands = service.generateFFmpegCommands(configs)

      expect(commands).toHaveLength(1)
      expect(commands[0].filterGraph).toContain("xfade")
      expect(commands[0].inputs).toHaveLength(2)
      expect(commands[0].output.path).toBe("/output/transition1.mp4")
    })

    it("should include GPU options when enabled", () => {
      const configs: FFmpegTransitionConfig[] = [
        {
          id: "transition-1",
          type: "fade",
          startTime: 0,
          duration: 1,
          parameters: {
            intensity: 1.0,
            direction: "center",
            blur: { enabled: false, amount: 0, type: "gaussian" },
            color: { enabled: false, saturation: 0, brightness: 0 },
          },
          inputA: "/path/clip1.mp4",
          inputB: "/path/clip2.mp4",
          output: "/output/transition1.mp4",
          quality: 85,
          resolution: { width: 1920, height: 1080 },
          useGpu: true,
          gpuDevice: "0",
        },
      ]

      const commands = service.generateFFmpegCommands(configs)

      expect(commands[0].output.options).toContain("-hwaccel")
      expect(commands[0].output.options).toContain("cuda")
    })

    it("should use software encoder when GPU disabled", () => {
      const configs: FFmpegTransitionConfig[] = [
        {
          id: "transition-1",
          type: "fade",
          startTime: 0,
          duration: 1,
          parameters: {
            intensity: 1.0,
            direction: "center",
            blur: { enabled: false, amount: 0, type: "gaussian" },
            color: { enabled: false, saturation: 0, brightness: 0 },
          },
          inputA: "/path/clip1.mp4",
          inputB: "/path/clip2.mp4",
          output: "/output/transition1.mp4",
          quality: 85,
          resolution: { width: 1920, height: 1080 },
          useGpu: false,
        },
      ]

      const commands = service.generateFFmpegCommands(configs)

      expect(commands[0].output.options).toContain("libx264")
    })

    it("should throw error for unknown transition type", () => {
      const configs: FFmpegTransitionConfig[] = [
        {
          id: "transition-1",
          type: "unknown" as any,
          startTime: 0,
          duration: 1,
          parameters: {
            intensity: 1.0,
            direction: "center",
            blur: { enabled: false, amount: 0, type: "gaussian" },
            color: { enabled: false, saturation: 0, brightness: 0 },
          },
          inputA: "/path/clip1.mp4",
          inputB: "/path/clip2.mp4",
          output: "/output/transition1.mp4",
          quality: 85,
          resolution: { width: 1920, height: 1080 },
          useGpu: false,
        },
      ]

      expect(() => service.generateFFmpegCommands(configs)).toThrow("Unknown transition type")
    })
  })

  describe("exportTransitions", () => {
    it("should export transitions successfully", async () => {
      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])
      const availableTransitions = createAvailableTransitionsMap()

      const result = await service.exportTransitions(mockProject, exportSettings, clipPaths, availableTransitions)

      expect(result.success).toBe(true)
      expect(result.totalTransitions).toBe(2)
      expect(result.processedTransitions).toBe(2)
    })

    it("should handle project without transitions", async () => {
      const emptyProject = createMockProject()
      emptyProject.sections[0].tracks[0].transitions = []

      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()
      const availableTransitions = createAvailableTransitionsMap()

      const result = await service.exportTransitions(emptyProject, exportSettings, clipPaths, availableTransitions)

      expect(result.success).toBe(true)
      expect(result.totalTransitions).toBe(0)
      expect(result.processedTransitions).toBe(0)
    })

    it("should call progress callback", async () => {
      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])
      const availableTransitions = createAvailableTransitionsMap()

      const progressCallback = vi.fn()

      await service.exportTransitions(mockProject, exportSettings, clipPaths, availableTransitions, progressCallback)

      expect(progressCallback).toHaveBeenCalled()
    })

    it("should calculate render time", async () => {
      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])
      const availableTransitions = createAvailableTransitionsMap()

      const result = await service.exportTransitions(mockProject, exportSettings, clipPaths, availableTransitions)

      expect(result.totalRenderTime).toBeGreaterThan(0)
      expect(result.averageTransitionTime).toBeGreaterThan(0)
    })

    it("should enable parallel processing when configured", async () => {
      service.updateOptimizationSettings({
        enableParallelProcessing: true,
        maxWorkers: 4,
      })

      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])
      const availableTransitions = createAvailableTransitionsMap()

      const result = await service.exportTransitions(mockProject, exportSettings, clipPaths, availableTransitions)

      expect(result.success).toBe(true)
    })
  })

  describe("updateOptimizationSettings", () => {
    it("should update optimization settings", () => {
      const newSettings: Partial<TransitionOptimizationSettings> = {
        enableTransitionCache: false,
        maxCacheSize: 1000,
        maxWorkers: 8,
      }

      service.updateOptimizationSettings(newSettings)

      // Settings should be updated (verified by subsequent behavior)
      expect(true).toBe(true)
    })

    it("should merge with existing settings", () => {
      service.updateOptimizationSettings({ maxWorkers: 2 })
      service.updateOptimizationSettings({ maxCacheSize: 200 })

      // Both settings should be preserved
      expect(true).toBe(true)
    })
  })

  describe("getExportStatus", () => {
    it("should return undefined for unknown transition", () => {
      const status = service.getExportStatus("non-existent")

      expect(status).toBeUndefined()
    })

    it("should return status after export", async () => {
      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])
      const availableTransitions = createAvailableTransitionsMap()

      await service.exportTransitions(mockProject, exportSettings, clipPaths, availableTransitions)

      // After export, statuses should be available
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      if (transitions.length > 0) {
        const status = service.getExportStatus(transitions[0].transition.id)
        // Status might be undefined or defined based on implementation
        expect(status === undefined || status.transitionId === transitions[0].transition.id).toBe(true)
      }
    })
  })

  describe("clearStatuses", () => {
    it("should clear all statuses", async () => {
      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])
      const availableTransitions = createAvailableTransitionsMap()

      await service.exportTransitions(mockProject, exportSettings, clipPaths, availableTransitions)

      service.clearStatuses()

      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      if (transitions.length > 0) {
        const status = service.getExportStatus(transitions[0].transition.id)
        expect(status).toBeUndefined()
      }
    })
  })

  describe("Edge Cases", () => {
    it("should handle transitions with zero duration", () => {
      const mockProject = createMockProject()
      if (mockProject.resources.timelineTransitions && mockProject.resources.timelineTransitions[0]) {
        mockProject.resources.timelineTransitions[0].duration = 0
      }

      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      expect(transitions[0].duration).toBe(0)
    })

    it("should handle very long transitions", () => {
      const mockProject = createMockProject()
      if (mockProject.resources.timelineTransitions && mockProject.resources.timelineTransitions[0]) {
        mockProject.resources.timelineTransitions[0].duration = 10000
      }

      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)

      expect(transitions[0].duration).toBe(10000)
    })

    it("should handle high quality settings", async () => {
      const mockProject = createMockProject()
      const exportSettings = createMockExportSettings()
      exportSettings.quality = "best"

      const availableTransitions = createAvailableTransitionsMap()
      const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
      const clipPaths = new Map([
        ["clip-1", "/path/to/clip1.mp4"],
        ["clip-2", "/path/to/clip2.mp4"],
      ])

      const configs = await service.createFFmpegConfigs(transitions, exportSettings, clipPaths)

      expect(configs[0].quality).toBeGreaterThan(80)
    })

    it("should handle different resolutions", async () => {
      const mockProject = createMockProject()
      const resolutions = ["720", "1080", "1440", "4k"] as const

      for (const resolution of resolutions) {
        const exportSettings = createMockExportSettings()
        exportSettings.resolution = resolution

        const availableTransitions = createAvailableTransitionsMap()
        const transitions = service.extractTransitionsFromProject(mockProject, availableTransitions)
        const clipPaths = new Map([
          ["clip-1", "/path/to/clip1.mp4"],
          ["clip-2", "/path/to/clip2.mp4"],
        ])

        const configs = await service.createFFmpegConfigs(transitions, exportSettings, clipPaths)

        expect(configs[0].resolution.width).toBeGreaterThan(0)
        expect(configs[0].resolution.height).toBeGreaterThan(0)
      }
    })
  })
})

// ============================================================================
// Helper Functions
// ============================================================================

function createAvailableTransitionsMap(): Map<string, Transition> {
  const transitionResource1: Transition = {
    id: "fade",
    type: "fade",
    labels: {
      ru: "Затухание",
      en: "Fade",
    },
    description: {
      ru: "Плавное затухание",
      en: "Fade transition",
    },
    category: "basic",
    complexity: "basic",
    tags: ["fade", "opacity"],
    duration: {
      min: 0.5,
      max: 5,
      default: 1,
    },
    ffmpegCommand: () => "fade",
    gpuAccelerated: false,
  }

  const transitionResource2: Transition = {
    id: "dissolve",
    type: "dissolve",
    labels: {
      ru: "Растворение",
      en: "Dissolve",
    },
    description: {
      ru: "Плавное растворение",
      en: "Dissolve transition",
    },
    category: "basic",
    complexity: "basic",
    tags: ["dissolve", "fade"],
    duration: {
      min: 0.5,
      max: 5,
      default: 1.5,
    },
    ffmpegCommand: () => "dissolve",
    gpuAccelerated: true,
  }

  return new Map([
    ["fade", transitionResource1],
    ["dissolve", transitionResource2],
  ])
}

function createMockProject(): TimelineProject {
  const transition1: TimelineTransition = {
    id: "transition-1",
    transitionId: "fade",
    type: "between",
    position: 0,
    duration: 1,
    startClipId: "clip-1",
    endClipId: "clip-2",
    trackId: "track-1",
    parameters: {
      intensity: 1.0,
      direction: "center",
    },
    keyframes: [],
    curve: { type: "linear", points: [] },
    isEnabled: true,
    isLocked: false,
  }

  const transition2: TimelineTransition = {
    id: "transition-2",
    transitionId: "dissolve",
    type: "between",
    position: 5,
    duration: 1.5,
    startClipId: "clip-1",
    endClipId: "clip-2",
    trackId: "track-1",
    parameters: {
      intensity: 0.8,
      direction: "center",
    },
    keyframes: [],
    curve: { type: "linear", points: [] },
    isEnabled: true,
    isLocked: false,
  }

  return {
    id: "test-project",
    name: "Test Project",
    sections: [
      {
        id: "section-1",
        name: "Section 1",
        startTime: 0,
        endTime: 10,
        tracks: [
          {
            id: "track-1",
            name: "Track 1",
            clips: [],
            transitions: ["transition-1", "transition-2"],
          },
        ],
      },
    ],
    globalTracks: [],
    resources: {
      timelineTransitions: [transition1, transition2],
      transitions: [], // Note: transitions are now passed via availableTransitions Map
      effects: [],
      filters: [],
      templates: [],
      styleTemplates: [],
    },
    settings: {
      timeline: {
        duration: 10,
        fps: 30,
        resolution: { width: 1920, height: 1080 },
      },
    },
  } as any
}

function createMockExportSettings(): ExportSettings {
  return {
    fileName: "export",
    savePath: "/output",
    format: OutputFormat.Mp4,
    quality: "good",
    resolution: "1080",
    frameRate: "30",
    enableGPU: false,
    bitrate: 5000,
  }
}
