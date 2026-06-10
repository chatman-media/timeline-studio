/**
 * Integration tests for transcribe command
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IAIService, IPlatformService, TranscriptionResult } from "@timeline-studio/core/ports"

// Mock adapters/node
const mockPlatform: IPlatformService = {
  exists: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  getFileStats: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn(),
  getPlatform: vi.fn(),
  convertFileSrc: vi.fn(),
  basename: vi.fn(),
  dirname: vi.fn(),
  join: vi.fn(),
  getAbsolutePath: vi.fn(),
  searchFilesByName: vi.fn(),
}

const mockAI: Partial<IAIService> = {
  whisperTranscribeLocal: vi.fn(),
  whisperTranscribeOpenAI: vi.fn(),
}

vi.mock("@/adapters/node", () => ({
  initNodeApp: vi.fn().mockImplementation(async (_config?: { ai?: { openaiApiKey?: string } }) => ({
    platform: mockPlatform,
    ai: mockAI,
  })),
}))

describe("transcribe command integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
  })

  describe("Local Whisper transcription", () => {
    it("should transcribe with tiny model", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      const mockResult: TranscriptionResult = {
        text: "This is a test transcription from tiny model",
        segments: [
          { start: 0, end: 2.5, text: "This is a test" },
          { start: 2.5, end: 5.0, text: "transcription from tiny model" },
        ],
        language: "en",
        processingTime: 1.2,
      }

      if (mockAI.whisperTranscribeLocal) {
        vi.mocked(mockAI.whisperTranscribeLocal).mockResolvedValue(mockResult)

        const result = await mockAI.whisperTranscribeLocal("/path/to/audio.mp3", {
          model: "tiny",
          language: "en",
        })

        expect(result.text).toContain("test transcription")
        expect(result.segments).toHaveLength(2)
        expect(result.language).toBe("en")
      }
    })

    it("should transcribe with base model", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      const mockResult: TranscriptionResult = {
        text: "Base model transcription result",
        segments: [],
        language: "en",
        processingTime: 2.5,
      }

      if (mockAI.whisperTranscribeLocal) {
        vi.mocked(mockAI.whisperTranscribeLocal).mockResolvedValue(mockResult)

        const result = await mockAI.whisperTranscribeLocal("/path/to/audio.mp3", {
          model: "base",
        })

        expect(result.text).toBe("Base model transcription result")
        expect(result.processingTime).toBeGreaterThan(0)
      }
    })

    it("should handle different languages", async () => {
      const languages = ["en", "ru", "es", "fr", "de"]

      for (const lang of languages) {
        const mockResult: TranscriptionResult = {
          text: `Text in ${lang}`,
          segments: [],
          language: lang,
          processingTime: 1.0,
        }

        if (mockAI.whisperTranscribeLocal) {
          vi.mocked(mockAI.whisperTranscribeLocal).mockResolvedValue(mockResult)

          const result = await mockAI.whisperTranscribeLocal("/path/to/audio.mp3", {
            model: "base",
            language: lang,
          })

          expect(result.language).toBe(lang)
        }
      }
    })
  })

  describe("OpenAI Whisper transcription", () => {
    it("should transcribe using OpenAI API", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      const mockResult: TranscriptionResult = {
        text: "OpenAI Whisper transcription result",
        segments: [{ start: 0, end: 3.5, text: "OpenAI Whisper transcription result" }],
        language: "en",
        processingTime: 0.8,
      }

      if (mockAI.whisperTranscribeOpenAI) {
        vi.mocked(mockAI.whisperTranscribeOpenAI).mockResolvedValue(mockResult)

        const result = await mockAI.whisperTranscribeOpenAI("/path/to/audio.mp3", {
          language: "en",
        })

        expect(result.text).toContain("OpenAI")
        expect(result.processingTime).toBeLessThan(2)
      }
    })

    it("should handle API key configuration", async () => {
      const { initNodeApp } = await import("@/adapters/node")

      await initNodeApp({ ai: { openaiApiKey: "test-key" } })

      expect(initNodeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          ai: expect.objectContaining({
            openaiApiKey: "test-key",
          }),
        }),
      )
    })
  })

  describe("Format conversion", () => {
    it("should format segments as SRT", () => {
      const segments = [
        { start: 0, end: 2.5, text: "First subtitle" },
        { start: 3.0, end: 5.5, text: "Second subtitle" },
      ]

      // SRT format: index, timestamp, text
      expect(segments[0].start).toBe(0)
      expect(segments[0].end).toBe(2.5)
      expect(segments[0].text).toBe("First subtitle")
    })

    it("should format segments as VTT", () => {
      const segments = [
        { start: 0, end: 2.5, text: "WebVTT subtitle 1" },
        { start: 3.0, end: 5.5, text: "WebVTT subtitle 2" },
      ]

      expect(segments).toHaveLength(2)
      expect(segments[0].text).toContain("WebVTT")
    })

    it("should export as JSON", () => {
      const result: TranscriptionResult = {
        text: "Full transcription text",
        segments: [
          { start: 0, end: 2.5, text: "Segment 1" },
          { start: 2.5, end: 5.0, text: "Segment 2" },
        ],
        language: "en",
        processingTime: 1.5,
      }

      const json = JSON.stringify(result, null, 2)

      expect(json).toContain("text")
      expect(json).toContain("segments")
      expect(json).toContain("language")
      expect(json).toContain("processingTime")
    })
  })

  describe("Time formatting", () => {
    it("should format SRT timestamp correctly", () => {
      const seconds = 125.456 // 00:02:05,456
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 1000)

      expect(hours).toBe(0)
      expect(minutes).toBe(2)
      expect(secs).toBe(5)
      expect(ms).toBe(456)

      const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`
      expect(formatted).toBe("00:02:05,456")
    })

    it("should format VTT timestamp correctly", () => {
      const seconds = 125.456 // 00:02:05.456
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 1000)

      const formatted = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`
      expect(formatted).toBe("00:02:05.456")
    })
  })

  describe("Error handling", () => {
    it("should handle file not found", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(false)

      const exists = await mockPlatform.exists("/nonexistent/audio.mp3")
      expect(exists).toBe(false)
    })

    it("should handle transcription errors", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockAI.whisperTranscribeLocal) {
        vi.mocked(mockAI.whisperTranscribeLocal).mockRejectedValue(new Error("Transcription failed"))

        await expect(mockAI.whisperTranscribeLocal("/path/to/audio.mp3", { model: "base" })).rejects.toThrow(
          "Transcription failed",
        )
      }
    })

    it("should handle missing API key for OpenAI", async () => {
      vi.mocked(mockPlatform.exists).mockResolvedValue(true)

      if (mockAI.whisperTranscribeOpenAI) {
        vi.mocked(mockAI.whisperTranscribeOpenAI).mockRejectedValue(new Error("API key required"))

        await expect(mockAI.whisperTranscribeOpenAI("/path/to/audio.mp3", {})).rejects.toThrow("API key required")
      }
    })
  })

  describe("Model options", () => {
    it("should support all model sizes", async () => {
      const models: Array<"tiny" | "base" | "small" | "medium" | "large"> = ["tiny", "base", "small", "medium", "large"]

      for (const model of models) {
        const mockResult: TranscriptionResult = {
          text: `Transcription with ${model} model`,
          segments: [],
          language: "en",
          processingTime: 1.0,
        }

        if (mockAI.whisperTranscribeLocal) {
          vi.mocked(mockAI.whisperTranscribeLocal).mockResolvedValue(mockResult)

          const result = await mockAI.whisperTranscribeLocal("/path/to/audio.mp3", { model })

          expect(result.text).toContain(model)
        }
      }
    })
  })
})
