import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as enhancedAutomation from "@/domains/ai-tools/tools/automation/enhanced-subtitle-automation"
import { useEnhancedSubtitleAutomation } from "../../hooks/use-enhanced-subtitle-automation"
import { createMockEnhancedSubtitleResult } from "../test-utils"

// Mock enhanced subtitle automation tool
vi.mock("@/domains/ai-tools/tools/automation/enhanced-subtitle-automation", () => ({
  enhancedSubtitleAutomation: {
    processEnhancedSubtitles: vi.fn(),
  },
  autoGenerateSubtitlesFromVideo: vi.fn(),
  extractSubtitlesFromScreenText: vi.fn(),
  generateMultilingualSubtitles: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    logInfo: vi.fn(),
    logError: vi.fn(),
  }
})

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock useNotifications
vi.mock("@/domains/system-integration", () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}))

describe("useEnhancedSubtitleAutomation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Initial state", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.progress).toEqual({
        stage: "initializing",
        progress: 0,
      })
      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe("generateEnhancedSubtitles", () => {
    it("should successfully generate enhanced subtitles", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockResult = createMockEnhancedSubtitleResult()

      vi.mocked(enhancedAutomation.enhancedSubtitleAutomation.processEnhancedSubtitles).mockResolvedValue({
        success: true,
        data: mockResult,
        executionTime: 2500,
        toolName: "enhanced-subtitle-automation",
        executionId: `enhanced-subtitle-automation_${Date.now()}_test`,
      })

      await result.current.generateEnhancedSubtitles("/path/to/media.mp4", "test-clip", {})

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      expect(result.current.result).toEqual(mockResult)
      expect(result.current.error).toBeNull()
    })

    it("should handle generation errors", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const errorMessage = "Processing failed"

      vi.mocked(enhancedAutomation.enhancedSubtitleAutomation.processEnhancedSubtitles).mockResolvedValue({
        success: false,
        errors: [errorMessage],
        executionTime: 0,
        toolName: "enhanced-subtitle-automation",
        executionId: `enhanced-subtitle-automation_${Date.now()}_test`,
      })

      await result.current.generateEnhancedSubtitles("/path/to/media.mp4", "test-clip", {})

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      expect(result.current.error).toBe(errorMessage)
    })

    it("should update progress during generation", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockResult = createMockEnhancedSubtitleResult()

      vi.mocked(enhancedAutomation.enhancedSubtitleAutomation.processEnhancedSubtitles).mockResolvedValue({
        success: true,
        data: mockResult,
        executionTime: 2500,
        toolName: "enhanced-subtitle-automation",
        executionId: `enhanced-subtitle-automation_${Date.now()}_test`,
      })

      await result.current.generateEnhancedSubtitles("/path/to/media.mp4", "test-clip", {
        useSpeechRecognition: true,
        useOCR: true,
        useSceneAnalysis: true,
      })

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.progress.stage).toBe("completed")
        expect(result.current.progress.progress).toBe(100)
      })
    })
  })

  describe("quickGenerateFromVideo", () => {
    it("should quickly generate subtitles from video", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockResult = createMockEnhancedSubtitleResult()

      vi.mocked(enhancedAutomation.autoGenerateSubtitlesFromVideo).mockResolvedValue({
        success: true,
        data: mockResult,
        executionTime: 2000,
        toolName: "auto-generate-subtitles-from-video",
        executionId: `auto-generate-subtitles-from-video_${Date.now()}_test`,
      })

      const enhancedResult = await result.current.quickGenerateFromVideo("test-clip", "en")

      expect(enhancedResult).toEqual(mockResult)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult)
      })
    })

    it("should handle quick generation errors", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const errorMessage = "Quick generation failed"

      vi.mocked(enhancedAutomation.autoGenerateSubtitlesFromVideo).mockResolvedValue({
        success: false,
        errors: [errorMessage],
        executionTime: 0,
        toolName: "auto-generate-subtitles-from-video",
        executionId: `auto-generate-subtitles-from-video_${Date.now()}_test`,
      })

      const enhancedResult = await result.current.quickGenerateFromVideo("test-clip")

      expect(enhancedResult).toBeNull()

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })
    })
  })

  describe("extractFromScreenText", () => {
    it("should extract subtitles from screen text", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockResult = createMockEnhancedSubtitleResult()

      vi.mocked(enhancedAutomation.extractSubtitlesFromScreenText).mockResolvedValue({
        success: true,
        data: mockResult,
        executionTime: 1500,
        toolName: "extract-subtitles-from-screen-text",
        executionId: `extract-subtitles-from-screen-text_${Date.now()}_test`,
      })

      const enhancedResult = await result.current.extractFromScreenText("test-clip", "en")

      expect(enhancedResult).toEqual(mockResult)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult)
      })
    })

    it("should handle OCR extraction errors", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const errorMessage = "OCR extraction failed"

      vi.mocked(enhancedAutomation.extractSubtitlesFromScreenText).mockResolvedValue({
        success: false,
        errors: [errorMessage],
        executionTime: 0,
        toolName: "extract-subtitles-from-screen-text",
        executionId: `extract-subtitles-from-screen-text_${Date.now()}_test`,
      })

      const enhancedResult = await result.current.extractFromScreenText("test-clip")

      expect(enhancedResult).toBeNull()

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })
    })
  })

  describe("generateMultilingual", () => {
    it("should generate multilingual subtitles", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockResult = createMockEnhancedSubtitleResult()

      vi.mocked(enhancedAutomation.generateMultilingualSubtitles).mockResolvedValue({
        success: true,
        data: mockResult,
        executionTime: 3000,
        toolName: "generate-multilingual-subtitles",
        executionId: `generate-multilingual-subtitles_${Date.now()}_test`,
      })

      const enhancedResult = await result.current.generateMultilingual("test-clip", ["en", "ru", "es"])

      expect(enhancedResult).toEqual(mockResult)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult)
      })
    })

    it("should handle multilingual generation errors", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const errorMessage = "Multilingual generation failed"

      vi.mocked(enhancedAutomation.generateMultilingualSubtitles).mockResolvedValue({
        success: false,
        errors: [errorMessage],
        executionTime: 0,
        toolName: "generate-multilingual-subtitles",
        executionId: `generate-multilingual-subtitles_${Date.now()}_test`,
      })

      const enhancedResult = await result.current.generateMultilingual("test-clip", ["en", "ru"])

      expect(enhancedResult).toBeNull()

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })
    })
  })

  describe("convertToTranscriptionResult", () => {
    it("should convert enhanced result to transcription format", () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockEnhancedResult = createMockEnhancedSubtitleResult()

      const transcriptionResult = result.current.convertToTranscriptionResult(mockEnhancedResult)

      expect(transcriptionResult.segments).toHaveLength(mockEnhancedResult.subtitles.length)
      expect(transcriptionResult.language).toBe(mockEnhancedResult.processing.detectedLanguages[0])
      expect(transcriptionResult.duration).toBeGreaterThan(0)
      expect(transcriptionResult.text).toContain(mockEnhancedResult.subtitles[0].text)
    })
  })

  describe("cancel", () => {
    it("should cancel ongoing operation", () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())

      result.current.cancel()

      expect(result.current.isProcessing).toBe(false)
    })
  })

  describe("reset", () => {
    it("should reset all state to initial values", async () => {
      const { result } = renderHook(() => useEnhancedSubtitleAutomation())
      const mockResult = createMockEnhancedSubtitleResult()

      vi.mocked(enhancedAutomation.autoGenerateSubtitlesFromVideo).mockResolvedValue({
        success: true,
        data: mockResult,
        executionTime: 2000,
        toolName: "auto-generate-subtitles-from-video",
        executionId: `auto-generate-subtitles-from-video_${Date.now()}_test`,
      })

      await result.current.quickGenerateFromVideo("test-clip")

      // Wait for state to update after generation
      await waitFor(() => {
        expect(result.current.result).not.toBeNull()
      })

      result.current.reset()

      // Wait for state to update after reset
      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
        expect(result.current.progress).toEqual({ stage: "initializing", progress: 0 })
        expect(result.current.result).toBeNull()
        expect(result.current.error).toBeNull()
      })
    })
  })
})
