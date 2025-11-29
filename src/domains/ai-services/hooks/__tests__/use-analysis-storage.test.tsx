/**
 * Tests for useAnalysisStorage hook
 *
 * Тесты для хука работы с хранилищем AI анализов
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MontageAnalysisResult } from "@/types/montage-planner-rust"
import type { UnifiedContentAnalysis } from "../../mappers/ai-director-mapper"
import type { ComprehensiveAnalysisResult } from "../../services/ai-director"
import type { AnalysisMetadata, StorageResult } from "../../services/analysis-storage-service"
import { useAnalysisStorage } from "../use-analysis-storage"

// Mock data
const mockComprehensiveAnalysis: ComprehensiveAnalysisResult = {
  analysis_id: "test-analysis-123",
  status: "Completed",
  audio_analysis: {
    duration: 120,
    loudness: -12,
    tempo: 120,
    silence_percentage: 0.1,
  },
  scene_analysis: {
    scenes: [],
    scene_count: 0,
  },
  video_analysis: {
    width: 1920,
    height: 1080,
    fps: 30,
    duration: 120,
    bitrate: 5000000,
    codec: "h264",
  },
  started_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  total_duration_ms: 1000,
  errors: [],
}

const mockMontageAnalysis: MontageAnalysisResult = {
  video_id: "/test/video.mp4",
  duration: 120,
  quality_score: 0.8,
  motion_score: 0.6,
  faces_detected: 2,
  objects_detected: ["person", "car"],
  audio_quality: 0.9,
  key_moments: [],
  analysis_id: "test-analysis-123",
}

const mockUnifiedAnalysis: UnifiedContentAnalysis = {
  analysisId: "test-123",
  videoPath: "/test/video.mp4",
  status: "completed",
  createdAt: new Date().toISOString(),
  processingTimeMs: 1000,
  videoInfo: {
    duration: 120,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    codec: "h264",
    fileSize: 1024000,
  },
  keyMoments: [],
  qualityMetrics: {
    overall: 0.8,
    video: 0.85,
    audio: 0.75,
    technical: 0.8,
  },
}

const mockMetadata: AnalysisMetadata = {
  analysisId: "test-analysis-123",
  videoPath: "/test/video.mp4",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  success: true,
}

// Mock storage service - определяем функции внутри vi.mock для избежания hoisting проблем
vi.mock("../../services/analysis-storage-service", () => ({
  analysisStorageService: {
    saveComprehensiveAnalysis: vi.fn(),
    loadComprehensiveAnalysis: vi.fn(),
    deleteComprehensiveAnalysis: vi.fn(),
    saveMontageAnalysis: vi.fn(),
    loadMontageAnalysis: vi.fn(),
    saveUnifiedAnalysis: vi.fn(),
    loadUnifiedAnalysis: vi.fn(),
    hasAnalysis: vi.fn(),
    getAnalyzedVideos: vi.fn(),
    clearAll: vi.fn(),
    getStorageStats: vi.fn(),
    loadAnalysisMetadata: vi.fn(),
  },
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

describe("useAnalysisStorage", () => {
  let mockStorageService: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Import mock service
    const module = await import("../../services/analysis-storage-service")
    mockStorageService = module.analysisStorageService

    // Default successful responses
    vi.mocked(mockStorageService.saveComprehensiveAnalysis).mockResolvedValue({ success: true, data: "test-id" })
    vi.mocked(mockStorageService.loadComprehensiveAnalysis).mockResolvedValue({
      success: true,
      data: mockComprehensiveAnalysis,
    })
    vi.mocked(mockStorageService.deleteComprehensiveAnalysis).mockResolvedValue({ success: true })
    vi.mocked(mockStorageService.saveMontageAnalysis).mockResolvedValue({ success: true, data: "test-id" })
    vi.mocked(mockStorageService.loadMontageAnalysis).mockResolvedValue({ success: true, data: mockMontageAnalysis })
    vi.mocked(mockStorageService.saveUnifiedAnalysis).mockResolvedValue({ success: true })
    vi.mocked(mockStorageService.loadUnifiedAnalysis).mockResolvedValue({ success: true, data: mockUnifiedAnalysis })
    vi.mocked(mockStorageService.loadAnalysisMetadata).mockResolvedValue(mockMetadata)
    vi.mocked(mockStorageService.hasAnalysis).mockResolvedValue(true)
    vi.mocked(mockStorageService.getAnalyzedVideos).mockResolvedValue(["/test/video1.mp4", "/test/video2.mp4"])
    vi.mocked(mockStorageService.clearAll).mockResolvedValue({ success: true })
    vi.mocked(mockStorageService.getStorageStats).mockResolvedValue({
      comprehensiveCount: 5,
      montageCount: 3,
      unifiedCount: 4,
      totalSize: 1024 * 1024,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial State", () => {
    it("должен иметь корректное начальное состояние", () => {
      const { result } = renderHook(() => useAnalysisStorage())

      expect(result.current.comprehensiveAnalysis).toBeNull()
      expect(result.current.montageAnalysis).toBeNull()
      expect(result.current.unifiedAnalysis).toBeNull()
      expect(result.current.metadata).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe("Comprehensive Analysis Operations", () => {
    it("должен сохранять comprehensive analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      let saveResult: StorageResult<string> | undefined

      await act(async () => {
        saveResult = await result.current.saveComprehensive("/test/video.mp4", mockComprehensiveAnalysis)
      })

      expect(mockStorageService.saveComprehensiveAnalysis).toHaveBeenCalledWith(
        "/test/video.mp4",
        mockComprehensiveAnalysis,
        undefined,
      )
      expect(saveResult?.success).toBe(true)
      expect(result.current.comprehensiveAnalysis).toEqual(mockComprehensiveAnalysis)
      expect(result.current.error).toBeNull()
    })

    it("должен загружать comprehensive analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.loadComprehensive("/test/video.mp4")
      })

      expect(mockStorageService.loadComprehensiveAnalysis).toHaveBeenCalledWith("/test/video.mp4")
      expect(result.current.comprehensiveAnalysis).toEqual(mockComprehensiveAnalysis)
      expect(result.current.metadata).toEqual(mockMetadata)
    })

    it("должен удалять comprehensive analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      // Сначала загрузим анализ
      await act(async () => {
        await result.current.loadComprehensive("/test/video.mp4")
      })

      expect(result.current.comprehensiveAnalysis).not.toBeNull()

      // Теперь удалим
      await act(async () => {
        await result.current.deleteComprehensive("/test/video.mp4")
      })

      expect(mockStorageService.deleteComprehensiveAnalysis).toHaveBeenCalledWith("/test/video.mp4")
      expect(result.current.comprehensiveAnalysis).toBeNull()
      expect(result.current.metadata).toBeNull()
    })

    it("должен обрабатывать ошибки сохранения", async () => {
      mockStorageService.saveComprehensiveAnalysis.mockResolvedValueOnce({
        success: false,
        error: "Save failed",
      })

      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.saveComprehensive("/test/video.mp4", mockComprehensiveAnalysis)
      })

      expect(result.current.error).toBe("Save failed")
      expect(result.current.comprehensiveAnalysis).toBeNull()
    })

    it("должен обрабатывать ошибки загрузки", async () => {
      mockStorageService.loadComprehensiveAnalysis.mockResolvedValueOnce({
        success: false,
        error: "Load failed",
      })

      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.loadComprehensive("/test/video.mp4")
      })

      expect(result.current.error).toBe("Load failed")
      expect(result.current.comprehensiveAnalysis).toBeNull()
    })
  })

  describe("Montage Analysis Operations", () => {
    it("должен сохранять montage analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.saveMontage("/test/video.mp4", mockMontageAnalysis)
      })

      expect(mockStorageService.saveMontageAnalysis).toHaveBeenCalledWith(
        "/test/video.mp4",
        mockMontageAnalysis,
        undefined,
      )
      expect(result.current.montageAnalysis).toEqual(mockMontageAnalysis)
    })

    it("должен загружать montage analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.loadMontage("/test/video.mp4")
      })

      expect(mockStorageService.loadMontageAnalysis).toHaveBeenCalledWith("/test/video.mp4")
      expect(result.current.montageAnalysis).toEqual(mockMontageAnalysis)
    })

    it("должен передавать опции сохранения", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      const options = { overwrite: true, saveMetadata: true }

      await act(async () => {
        await result.current.saveMontage("/test/video.mp4", mockMontageAnalysis, options)
      })

      expect(mockStorageService.saveMontageAnalysis).toHaveBeenCalledWith(
        "/test/video.mp4",
        mockMontageAnalysis,
        options,
      )
    })
  })

  describe("Unified Analysis Operations", () => {
    it("должен сохранять unified analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.saveUnified("/test/video.mp4", mockUnifiedAnalysis)
      })

      expect(mockStorageService.saveUnifiedAnalysis).toHaveBeenCalledWith("/test/video.mp4", mockUnifiedAnalysis)
      expect(result.current.unifiedAnalysis).toEqual(mockUnifiedAnalysis)
    })

    it("должен загружать unified analysis", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.loadUnified("/test/video.mp4")
      })

      expect(mockStorageService.loadUnifiedAnalysis).toHaveBeenCalledWith("/test/video.mp4")
      expect(result.current.unifiedAnalysis).toEqual(mockUnifiedAnalysis)
    })
  })

  describe("Utility Methods", () => {
    it("должен проверять наличие анализа", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      let hasAnalysis: boolean = false

      await act(async () => {
        hasAnalysis = await result.current.hasAnalysis("/test/video.mp4")
      })

      expect(mockStorageService.hasAnalysis).toHaveBeenCalledWith("/test/video.mp4")
      expect(hasAnalysis).toBe(true)
    })

    it("должен получать список проанализированных видео", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      let videos: string[] = []

      await act(async () => {
        videos = await result.current.getAnalyzedVideos()
      })

      expect(mockStorageService.getAnalyzedVideos).toHaveBeenCalled()
      expect(videos).toEqual(["/test/video1.mp4", "/test/video2.mp4"])
    })

    it("должен очищать все анализы", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      // Загрузим анализы
      await act(async () => {
        await result.current.loadComprehensive("/test/video.mp4")
        await result.current.loadMontage("/test/video.mp4")
        await result.current.loadUnified("/test/video.mp4")
      })

      expect(result.current.comprehensiveAnalysis).not.toBeNull()

      // Очистим всё
      await act(async () => {
        await result.current.clearAll()
      })

      expect(mockStorageService.clearAll).toHaveBeenCalled()
      expect(result.current.comprehensiveAnalysis).toBeNull()
      expect(result.current.montageAnalysis).toBeNull()
      expect(result.current.unifiedAnalysis).toBeNull()
      expect(result.current.metadata).toBeNull()
    })

    it("должен получать статистику хранилища", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      let stats: any

      await act(async () => {
        stats = await result.current.getStats()
      })

      expect(mockStorageService.getStorageStats).toHaveBeenCalled()
      expect(stats).toEqual({
        comprehensiveCount: 5,
        montageCount: 3,
        unifiedCount: 4,
        totalSize: 1024 * 1024,
      })
    })
  })

  describe("Auto-load Feature", () => {
    it("должен автоматически загружать анализы при монтировании", async () => {
      const { result } = renderHook(() =>
        useAnalysisStorage({
          autoLoad: true,
          videoPath: "/test/video.mp4",
        }),
      )

      await waitFor(() => {
        expect(mockStorageService.loadComprehensiveAnalysis).toHaveBeenCalledWith("/test/video.mp4")
        expect(mockStorageService.loadMontageAnalysis).toHaveBeenCalledWith("/test/video.mp4")
        expect(mockStorageService.loadUnifiedAnalysis).toHaveBeenCalledWith("/test/video.mp4")
      })

      expect(result.current.comprehensiveAnalysis).toEqual(mockComprehensiveAnalysis)
      expect(result.current.montageAnalysis).toEqual(mockMontageAnalysis)
      expect(result.current.unifiedAnalysis).toEqual(mockUnifiedAnalysis)
    })

    it("не должен автоматически загружать если autoLoad = false", () => {
      renderHook(() =>
        useAnalysisStorage({
          autoLoad: false,
          videoPath: "/test/video.mp4",
        }),
      )

      expect(mockStorageService.loadComprehensiveAnalysis).not.toHaveBeenCalled()
      expect(mockStorageService.loadMontageAnalysis).not.toHaveBeenCalled()
      expect(mockStorageService.loadUnifiedAnalysis).not.toHaveBeenCalled()
    })

    it("не должен автоматически загружать если videoPath не передан", () => {
      renderHook(() =>
        useAnalysisStorage({
          autoLoad: true,
        }),
      )

      expect(mockStorageService.loadComprehensiveAnalysis).not.toHaveBeenCalled()
    })
  })

  describe("Loading State", () => {
    it("должен устанавливать isLoading во время операций", async () => {
      const { result } = renderHook(() => useAnalysisStorage())

      let loadingDuringOperation = false

      mockStorageService.loadComprehensiveAnalysis.mockImplementation(async () => {
        loadingDuringOperation = result.current.isLoading
        return { success: true, data: mockComprehensiveAnalysis }
      })

      await act(async () => {
        await result.current.loadComprehensive("/test/video.mp4")
      })

      expect(loadingDuringOperation).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe("Error Handling", () => {
    it("должен обрабатывать исключения при сохранении", async () => {
      mockStorageService.saveComprehensiveAnalysis.mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.saveComprehensive("/test/video.mp4", mockComprehensiveAnalysis)
      })

      expect(result.current.error).toBe("Network error")
    })

    it("должен обрабатывать исключения при загрузке", async () => {
      mockStorageService.loadComprehensiveAnalysis.mockRejectedValueOnce(new Error("File not found"))

      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.loadComprehensive("/test/video.mp4")
      })

      expect(result.current.error).toBe("File not found")
    })

    it("должен обрабатывать исключения при очистке", async () => {
      mockStorageService.clearAll.mockRejectedValueOnce(new Error("Permission denied"))

      const { result } = renderHook(() => useAnalysisStorage())

      await act(async () => {
        await result.current.clearAll()
      })

      expect(result.current.error).toBe("Permission denied")
    })
  })

  describe("Debug Mode", () => {
    it("должен работать с включенным debug режимом", async () => {
      const { result } = renderHook(() => useAnalysisStorage({ debug: true }))

      await act(async () => {
        await result.current.saveComprehensive("/test/video.mp4", mockComprehensiveAnalysis)
      })

      expect(result.current.comprehensiveAnalysis).toEqual(mockComprehensiveAnalysis)
    })
  })
})
