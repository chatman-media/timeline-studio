import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { TimelineProject } from "@/features/timeline/types"
import type { TimelineTransition } from "@/features/timeline/types/timeline-transition"
import type { Transition } from "@/features/transitions/types/transitions"
import { useTransitionExport } from "../../hooks/use-transition-export"
import { TransitionExportService } from "../../services/transition-export-service"
import type { ExportSettings } from "../../types/export-types"
import type { TransitionExportStatus } from "../../types/transition-export-types"

// Мокаем зависимости
vi.mock("@/lib/tauri-logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  createLogger: vi.fn(() => ({
    logError: vi.fn(),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    logDebug: vi.fn(),
  })),
}))

vi.mock("../../services/transition-export-service")

describe("useTransitionExport", () => {
  let mockService: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Создаем mock для service
    mockService = {
      extractTransitionsFromProject: vi.fn(),
      exportTransitions: vi.fn(),
      clearStatuses: vi.fn(),
      updateOptimizationSettings: vi.fn(),
      getExportStatus: vi.fn(),
    }

    ;(TransitionExportService.getInstance as any).mockReturnValue(mockService)
  })

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useTransitionExport())

      expect(result.current.isExporting).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.error).toBeUndefined()
      expect(result.current.result).toBeUndefined()
    })

    it("should apply optimizations when enabled", () => {
      renderHook(() => useTransitionExport({ enableOptimizations: true }))

      expect(mockService.updateOptimizationSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          enableTransitionCache: true,
          enableParallelProcessing: true,
        }),
      )
    })

    it("should not apply optimizations when disabled", () => {
      renderHook(() => useTransitionExport({ enableOptimizations: false }))

      expect(mockService.updateOptimizationSettings).not.toHaveBeenCalled()
    })
  })

  describe("hasTransitions", () => {
    it("should return true for project with transitions", () => {
      const project = createMockProject()
      const { result } = renderHook(() => useTransitionExport())

      expect(result.current.hasTransitions(project)).toBe(true)
    })

    it("should return false for project without transitions", () => {
      const project = createMockProject()
      project.sections[0].tracks[0].transitions = []

      const { result } = renderHook(() => useTransitionExport())

      expect(result.current.hasTransitions(project)).toBe(false)
    })

    it("should check global tracks", () => {
      const project = createMockProject()
      project.sections[0].tracks[0].transitions = []
      project.globalTracks = [
        {
          id: "global-1",
          name: "Global",
          clips: [],
          transitions: ["transition-1"],
        } as any,
      ]

      const { result } = renderHook(() => useTransitionExport())

      expect(result.current.hasTransitions(project)).toBe(true)
    })
  })

  describe("getTransitionInfo", () => {
    it("should return transition information", () => {
      const project = createMockProject()
      const mockTransitions = [
        {
          transition: { id: "t1" },
          duration: 1,
          gpuAccelerated: true,
          customParameters: { param1: "value1" },
          shaderType: "custom",
        },
        {
          transition: { id: "t2" },
          duration: 2,
          gpuAccelerated: false,
          customParameters: {},
          shaderType: "basic",
        },
      ]

      mockService.extractTransitionsFromProject.mockReturnValue(mockTransitions)

      const { result } = renderHook(() => useTransitionExport())
      const info = result.current.getTransitionInfo(project)

      expect(info.totalTransitions).toBe(2)
      expect(info.gpuAccelerated).toBe(1)
      expect(info.estimatedTime).toBe(3)
      expect(info.complexity).toBeGreaterThan(0)
    })

    it("should handle project without transitions", () => {
      const project = createMockProject()
      mockService.extractTransitionsFromProject.mockReturnValue([])

      const { result } = renderHook(() => useTransitionExport())
      const info = result.current.getTransitionInfo(project)

      expect(info.totalTransitions).toBe(0)
      expect(info.gpuAccelerated).toBe(0)
      expect(info.estimatedTime).toBe(0)
    })
  })

  describe("exportTransitions", () => {
    it("should export transitions successfully", async () => {
      const project = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map([["clip-1", "/path/clip1.mp4"]])

      const mockResult = {
        success: true,
        totalTransitions: 1,
        processedTransitions: 1,
        failedTransitions: [],
        outputPath: "/output",
        tempFiles: [],
        totalRenderTime: 1000,
        averageTransitionTime: 1000,
        gpuAccelerated: false,
        ffmpegLogs: [],
        errors: [],
        warnings: [],
      }

      mockService.extractTransitionsFromProject.mockReturnValue([{ transition: { id: "t1" }, duration: 1 }])
      mockService.exportTransitions.mockResolvedValue(mockResult)

      const onComplete = vi.fn()
      const { result } = renderHook(() => useTransitionExport({ onComplete }))

      const exportResult = await result.current.exportTransitions(project, exportSettings, clipPaths)

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false)
        expect(result.current.progress).toBe(100)
        expect(result.current.result).toEqual(mockResult)
      })

      expect(exportResult).toEqual(mockResult)
      expect(onComplete).toHaveBeenCalledWith(mockResult)
    })

    it("should return null if project has no transitions", async () => {
      const project = createMockProject()
      project.sections[0].tracks[0].transitions = []

      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      const onError = vi.fn()
      const { result } = renderHook(() => useTransitionExport({ onError }))

      const exportResult = await result.current.exportTransitions(project, exportSettings, clipPaths)

      expect(exportResult).toBeNull()
      expect(onError).toHaveBeenCalledWith("В проекте нет переходов для экспорта")
    })

    it("should return null if already exporting", async () => {
      const project = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      mockService.extractTransitionsFromProject.mockReturnValue([{ transition: { id: "t1" } }])
      mockService.exportTransitions.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

      const onError = vi.fn()
      const { result } = renderHook(() => useTransitionExport({ onError }))

      // Начинаем первый экспорт
      const promise1 = result.current.exportTransitions(project, exportSettings, clipPaths)

      // Пытаемся начать второй экспорт пока первый выполняется
      await waitFor(() => {
        expect(result.current.isExporting).toBe(true)
      })

      const promise2 = result.current.exportTransitions(project, exportSettings, clipPaths)

      expect(await promise2).toBeNull()
      expect(onError).toHaveBeenCalledWith("Экспорт уже выполняется")

      // Дожидаемся завершения первого экспорта
      await promise1
    })

    it("should handle export errors", async () => {
      const project = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      mockService.extractTransitionsFromProject.mockReturnValue([{ transition: { id: "t1" } }])
      mockService.exportTransitions.mockRejectedValue(new Error("Export failed"))

      const onError = vi.fn()
      const { result } = renderHook(() => useTransitionExport({ onError }))

      const exportResult = await result.current.exportTransitions(project, exportSettings, clipPaths)

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false)
        expect(result.current.error).toBe("Export failed")
      })

      expect(exportResult).toBeNull()
      expect(onError).toHaveBeenCalledWith("Export failed")
    })

    it("should call onProgress callback", async () => {
      const project = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      const mockResult = {
        success: true,
        totalTransitions: 1,
        processedTransitions: 1,
        failedTransitions: [],
        outputPath: "/output",
        tempFiles: [],
        totalRenderTime: 1000,
        averageTransitionTime: 1000,
        gpuAccelerated: false,
        ffmpegLogs: [],
        errors: [],
        warnings: [],
      }

      mockService.extractTransitionsFromProject.mockReturnValue([{ transition: { id: "t1" } }])
      mockService.exportTransitions.mockImplementation(
        async (
          _project: TimelineProject,
          _settings: ExportSettings,
          _clips: Map<string, string>,
          onProgress?: (status: TransitionExportStatus) => void,
        ) => {
          if (onProgress) {
            onProgress({ transitionId: "t1", status: "processing", progress: 50 })
            onProgress({ transitionId: "t1", status: "completed", progress: 100 })
          }
          return mockResult
        },
      )

      const onProgress = vi.fn()
      const { result } = renderHook(() => useTransitionExport({ onProgress }))

      await result.current.exportTransitions(project, exportSettings, clipPaths)

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          transitionId: "t1",
          status: "processing",
        }),
      )
    })
  })

  describe("cancelExport", () => {
    it("should cancel ongoing export", async () => {
      const { result } = renderHook(() => useTransitionExport())

      // Simulate export in progress
      const project = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      mockService.extractTransitionsFromProject.mockReturnValue([{ transition: { id: "t1" } }])
      mockService.exportTransitions.mockImplementation(() => new Promise(() => {})) // Never resolves

      result.current.exportTransitions(project, exportSettings, clipPaths)

      await waitFor(() => {
        expect(result.current.isExporting).toBe(true)
      })

      result.current.cancelExport()

      await waitFor(() => {
        expect(result.current.isExporting).toBe(false)
        expect(result.current.error).toBe("Экспорт отменен пользователем")
      })
    })
  })

  describe("clearState", () => {
    it("should clear state and service statuses", () => {
      const { result } = renderHook(() => useTransitionExport())

      result.current.clearState()

      expect(result.current.isExporting).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(result.current.statuses.size).toBe(0)
      expect(mockService.clearStatuses).toHaveBeenCalled()
    })
  })

  describe("getTransitionStatus", () => {
    it("should return status from state", () => {
      const { result } = renderHook(() => useTransitionExport())

      // Status from state takes priority
      const status = result.current.getTransitionStatus("transition-1")

      expect(mockService.getExportStatus).toHaveBeenCalledWith("transition-1")
    })
  })

  describe("getExportStats", () => {
    it("should calculate export statistics", async () => {
      const project = createMockProject()
      const exportSettings = createMockExportSettings()
      const clipPaths = new Map()

      const mockResult = {
        success: true,
        totalTransitions: 2,
        processedTransitions: 2,
        failedTransitions: [],
        outputPath: "/output",
        tempFiles: [],
        totalRenderTime: 2000,
        averageTransitionTime: 1000,
        gpuAccelerated: false,
        ffmpegLogs: [],
        errors: [],
        warnings: [],
      }

      mockService.extractTransitionsFromProject.mockReturnValue([
        { transition: { id: "t1" } },
        { transition: { id: "t2" } },
      ])

      mockService.exportTransitions.mockImplementation(
        async (
          _project: TimelineProject,
          _settings: ExportSettings,
          _clips: Map<string, string>,
          onProgress?: (status: TransitionExportStatus) => void,
        ) => {
          if (onProgress) {
            onProgress({
              transitionId: "t1",
              status: "completed",
              progress: 100,
              renderTimeMs: 1000,
              outputSizeBytes: 1024,
            })
            onProgress({
              transitionId: "t2",
              status: "completed",
              progress: 100,
              renderTimeMs: 1000,
              outputSizeBytes: 2048,
            })
          }
          return mockResult
        },
      )

      const { result } = renderHook(() => useTransitionExport())

      await result.current.exportTransitions(project, exportSettings, clipPaths)

      await waitFor(() => {
        const stats = result.current.getExportStats()

        expect(stats.total).toBeGreaterThan(0)
        expect(stats.completed).toBeGreaterThan(0)
      })
    })
  })

  describe("updateOptimizationSettings", () => {
    it("should update service optimization settings", () => {
      const { result } = renderHook(() => useTransitionExport())

      const settings = {
        enableTransitionCache: false,
        maxWorkers: 8,
      }

      result.current.updateOptimizationSettings(settings)

      expect(mockService.updateOptimizationSettings).toHaveBeenCalledWith(settings)
    })
  })
})

// ============================================================================
// Helper Functions
// ============================================================================

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
    parameters: {},
    keyframes: [],
    curve: {
      type: "linear",
      points: [],
    },
    isEnabled: true,
    isLocked: false,
  }

  const transitionResource: Transition = {
    id: "fade",
    type: "fade",
    name: "Fade",
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
    tags: ["fade", "opacity", "smooth"],
    duration: {
      min: 0.5,
      max: 5,
      default: 1,
    },
    ffmpegCommand: () => "",
    gpuAccelerated: false,
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
            transitions: ["transition-1"],
          },
        ],
      },
    ],
    globalTracks: [],
    resources: {
      timelineTransitions: [transition1],
      transitions: [transitionResource],
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
    format: "Mp4" as any,
    quality: "good",
    resolution: "1080",
    frameRate: "30",
    enableGPU: false,
    bitrate: 5000,
  }
}
