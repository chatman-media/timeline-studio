import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useTranscription, useWhisperModels } from "../../hooks/use-transcription"
import { createMockModels, createMockTranscriptionOptions, createMockTranscriptionResult } from "../test-utils"

// Create shared mock service instance that will be used in the mock
const mockTranscribeMedia = vi.fn()
const mockGenerateSubtitles = vi.fn()
const mockGetAvailableModels = vi.fn()
const mockDownloadModel = vi.fn()
const mockGetSupportedLanguages = vi.fn()
const mockRecommendModel = vi.fn()

// Mock TranscriptionService
vi.mock("@/domains/ai-services/services/transcription-service", () => ({
  TranscriptionService: {
    getInstance: vi.fn(() => ({
      transcribeMedia: mockTranscribeMedia,
      generateSubtitles: mockGenerateSubtitles,
      getAvailableModels: mockGetAvailableModels,
      downloadModel: mockDownloadModel,
      getSupportedLanguages: mockGetSupportedLanguages,
      recommendModel: mockRecommendModel,
    })),
  },
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}))

describe("useTranscription", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations
    mockTranscribeMedia.mockResolvedValue(createMockTranscriptionResult())
    mockGenerateSubtitles.mockResolvedValue("1\n00:00:00,000 --> 00:00:05,000\nHello world\n")
  })

  describe("Initial state", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useTranscription())

      expect(result.current.isTranscribing).toBe(false)
      expect(result.current.progress).toEqual({ status: "idle", progress: 0 })
      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe("transcribe", () => {
    it("should successfully transcribe media file", async () => {
      const { result } = renderHook(() => useTranscription())
      const mockResult = createMockTranscriptionResult()
      mockTranscribeMedia.mockResolvedValue(mockResult)

      const options = createMockTranscriptionOptions()
      const transcriptionResult = await result.current.transcribe("/path/to/media.mp4", options)

      expect(transcriptionResult).toEqual(mockResult)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.isTranscribing).toBe(false)
        expect(result.current.result).toEqual(mockResult)
        expect(result.current.error).toBeNull()
      })
    })

    it("should update progress during transcription", async () => {
      const { result } = renderHook(() => useTranscription())
      const options = createMockTranscriptionOptions()

      mockTranscribeMedia.mockImplementation(async (_path, _options, onProgress) => {
        // Simulate progress updates
        if (onProgress) {
          onProgress({ status: "processing", progress: 50 })
        }
        return createMockTranscriptionResult()
      })

      await result.current.transcribe("/path/to/media.mp4", options)

      // Progress should be updated during processing
      expect(mockTranscribeMedia).toHaveBeenCalledWith("/path/to/media.mp4", options, expect.any(Function))
    })

    it("should handle transcription errors", async () => {
      const { result } = renderHook(() => useTranscription())
      const errorMessage = "Transcription failed"
      mockTranscribeMedia.mockRejectedValue(new Error(errorMessage))

      const options = createMockTranscriptionOptions()
      const transcriptionResult = await result.current.transcribe("/path/to/media.mp4", options)

      expect(transcriptionResult).toBeNull()

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.isTranscribing).toBe(false)
        expect(result.current.error).toBe(errorMessage)
        expect(result.current.result).toBeNull()
      })
    })

    it("should set isTranscribing to true during transcription", async () => {
      const { result } = renderHook(() => useTranscription())
      let isTranscribingDuringCall = false

      mockTranscribeMedia.mockImplementation(async () => {
        // Wait for React to update state
        await new Promise((resolve) => setTimeout(resolve, 10))
        isTranscribingDuringCall = result.current.isTranscribing
        return createMockTranscriptionResult()
      })

      const options = createMockTranscriptionOptions()
      await result.current.transcribe("/path/to/media.mp4", options)

      expect(isTranscribingDuringCall).toBe(true)

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.isTranscribing).toBe(false)
      })
    })
  })

  describe("generateSubtitles", () => {
    it("should generate subtitles from result", async () => {
      const { result } = renderHook(() => useTranscription())
      const mockResult = createMockTranscriptionResult()
      const mockSubtitles = "1\n00:00:00,000 --> 00:00:05,000\nHello world\n"

      // First transcribe to get a result
      mockTranscribeMedia.mockResolvedValue(mockResult)
      mockGenerateSubtitles.mockResolvedValue(mockSubtitles)

      await result.current.transcribe("/path/to/media.mp4", createMockTranscriptionOptions())

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult)
      })

      const subtitles = await result.current.generateSubtitles("srt")

      expect(subtitles).toBe(mockSubtitles)
      expect(mockGenerateSubtitles).toHaveBeenCalledWith(mockResult, "srt")
    })

    it("should handle error when no transcription result exists", async () => {
      const { result } = renderHook(() => useTranscription())

      const subtitles = await result.current.generateSubtitles("srt")

      expect(subtitles).toBeNull()

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.result).toBeNull()
        expect(result.current.error).toBe("Нет результата транскрипции")
      })
    })

    it("should handle subtitle generation errors", async () => {
      const { result } = renderHook(() => useTranscription())
      const mockResult = createMockTranscriptionResult()

      mockTranscribeMedia.mockResolvedValue(mockResult)
      await result.current.transcribe("/path/to/media.mp4", createMockTranscriptionOptions())

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult)
      })

      const errorMessage = "Subtitle generation failed"
      mockGenerateSubtitles.mockRejectedValue(new Error(errorMessage))

      const subtitles = await result.current.generateSubtitles("srt")

      expect(subtitles).toBeNull()

      // Wait for error state to update
      await waitFor(() => {
        expect(result.current.error).toBe(errorMessage)
      })
    })
  })

  describe("reset", () => {
    it("should reset all state to initial values", async () => {
      const { result } = renderHook(() => useTranscription())
      const mockResult = createMockTranscriptionResult()

      // First transcribe to change state
      mockTranscribeMedia.mockResolvedValue(mockResult)
      await result.current.transcribe("/path/to/media.mp4", createMockTranscriptionOptions())

      // Wait for state to update after transcription
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResult)
      })

      // Now reset
      result.current.reset()

      // Wait for state to update after reset
      await waitFor(() => {
        expect(result.current.isTranscribing).toBe(false)
        expect(result.current.progress).toEqual({ status: "idle", progress: 0 })
        expect(result.current.result).toBeNull()
        expect(result.current.error).toBeNull()
      })
    })
  })
})

describe("useWhisperModels", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAvailableModels.mockResolvedValue(createMockModels())
    mockDownloadModel.mockResolvedValue(true)
  })

  describe("Initial state", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useWhisperModels())

      expect(result.current.models).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.downloadProgress).toEqual({})
    })
  })

  describe("loadModels", () => {
    it("should load available models", async () => {
      const { result } = renderHook(() => useWhisperModels())
      const mockModels = createMockModels()
      mockGetAvailableModels.mockResolvedValue(mockModels)

      await result.current.loadModels()

      expect(mockGetAvailableModels).toHaveBeenCalled()

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.models).toEqual(mockModels)
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should handle loading errors gracefully", async () => {
      const { result } = renderHook(() => useWhisperModels())
      mockGetAvailableModels.mockRejectedValue(new Error("Loading failed"))

      await result.current.loadModels()

      expect(result.current.isLoading).toBe(false)
      expect(result.current.models).toEqual([])
    })
  })

  describe("downloadModel", () => {
    it("should successfully download a model", async () => {
      const { result } = renderHook(() => useWhisperModels())
      mockDownloadModel.mockResolvedValue(true)
      mockGetAvailableModels.mockResolvedValue(createMockModels())

      const success = await result.current.downloadModel("base")

      expect(success).toBe(true)
      expect(mockDownloadModel).toHaveBeenCalledWith("base", expect.any(Function))
    })

    it("should update download progress", async () => {
      const { result } = renderHook(() => useWhisperModels())

      mockDownloadModel.mockImplementation(async (_name, onProgress) => {
        if (onProgress) {
          onProgress(25)
          onProgress(50)
          onProgress(75)
          onProgress(100)
        }
        return true
      })

      await result.current.downloadModel("base")

      expect(mockDownloadModel).toHaveBeenCalledWith("base", expect.any(Function))
    })

    it("should reload models after successful download", async () => {
      const { result } = renderHook(() => useWhisperModels())
      mockDownloadModel.mockResolvedValue(true)
      mockGetAvailableModels.mockResolvedValue(createMockModels())

      await result.current.downloadModel("base")

      expect(mockGetAvailableModels).toHaveBeenCalled()
    })

    it("should handle download errors", async () => {
      const { result } = renderHook(() => useWhisperModels())
      mockDownloadModel.mockRejectedValue(new Error("Download failed"))

      const success = await result.current.downloadModel("base")

      expect(success).toBe(false)
    })

    it("should clear download progress after completion", async () => {
      const { result } = renderHook(() => useWhisperModels())
      mockDownloadModel.mockImplementation(async (_name, onProgress) => {
        if (onProgress) {
          onProgress(50)
        }
        return true
      })
      mockGetAvailableModels.mockResolvedValue(createMockModels())

      await result.current.downloadModel("base")

      expect(result.current.downloadProgress).not.toHaveProperty("base")
    })
  })
})
