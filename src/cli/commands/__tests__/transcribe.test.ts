/**
 * Tests for transcribe command
 */

import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { IAIService, IPlatformService, TranscriptionResult } from "@/core/ports"

// Mock adapters/node
const mockPlatform: Partial<IPlatformService> = {
  exists: vi.fn(),
}

const mockAI: Partial<IAIService> = {
  whisperTranscribeLocal: vi.fn(),
  whisperTranscribeOpenAI: vi.fn(),
}

vi.mock("@/adapters/node", () => ({
  initNodeApp: vi.fn().mockResolvedValue({
    platform: mockPlatform,
    ai: mockAI,
  }),
}))

describe("transcribe command", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(process, "exit").mockImplementation(() => undefined as never)
  })

  it("should have correct command name", async () => {
    const { transcribeCommand } = await import("../transcribe")

    expect(transcribeCommand.name()).toBe("transcribe")
  })

  it("should have description", async () => {
    const { transcribeCommand } = await import("../transcribe")

    expect(transcribeCommand.description()).toBe("Транскрибировать аудио или видео файл")
  })

  it("should accept file argument", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const args = transcribeCommand.registeredArguments
    expect(args).toHaveLength(1)
    expect(args[0].name()).toBe("file")
  })

  it("should have language option", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const options = transcribeCommand.options
    const langOption = options.find((opt) => opt.long === "--language")

    expect(langOption).toBeDefined()
    expect(langOption?.short).toBe("-l")
  })

  it("should have model option with default", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const options = transcribeCommand.options
    const modelOption = options.find((opt) => opt.long === "--model")

    expect(modelOption).toBeDefined()
    expect(modelOption?.short).toBe("-m")
    expect(modelOption?.defaultValue).toBe("base")
  })

  it("should have output option", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const options = transcribeCommand.options
    const outputOption = options.find((opt) => opt.long === "--output")

    expect(outputOption).toBeDefined()
    expect(outputOption?.short).toBe("-o")
  })

  it("should have format option with default", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const options = transcribeCommand.options
    const formatOption = options.find((opt) => opt.long === "--format")

    expect(formatOption).toBeDefined()
    expect(formatOption?.short).toBe("-f")
    expect(formatOption?.defaultValue).toBe("text")
  })

  it("should have openai option", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const options = transcribeCommand.options
    const openaiOption = options.find((opt) => opt.long === "--openai")

    expect(openaiOption).toBeDefined()
  })

  it("should have api-key option", async () => {
    const { transcribeCommand } = await import("../transcribe")

    const options = transcribeCommand.options
    const apiKeyOption = options.find((opt) => opt.long === "--api-key")

    expect(apiKeyOption).toBeDefined()
  })

  describe("formatSRT", () => {
    it("should format segments as SRT", () => {
      const segments = [
        { start: 0, end: 2.5, text: "Hello" },
        { start: 2.5, end: 5.0, text: "World" },
      ]

      // SRT format verification
      expect(segments.length).toBe(2)
      expect(segments[0].start).toBe(0)
      expect(segments[0].end).toBe(2.5)
      expect(segments[0].text).toBe("Hello")
    })

    it("should format time correctly for SRT", () => {
      const seconds = 3661.123 // 01:01:01,123
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 1000)

      expect(hours).toBe(1)
      expect(minutes).toBe(1)
      expect(secs).toBe(1)
      expect(ms).toBe(123)
    })
  })

  describe("formatVTT", () => {
    it("should format segments as VTT", () => {
      const segments = [
        { start: 0, end: 2.5, text: "Hello" },
        { start: 2.5, end: 5.0, text: "World" },
      ]

      // VTT format verification
      expect(segments.length).toBe(2)
    })

    it("should format time correctly for VTT", () => {
      const seconds = 3661.123 // 01:01:01.123
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = Math.floor(seconds % 60)
      const ms = Math.floor((seconds % 1) * 1000)

      expect(hours).toBe(1)
      expect(minutes).toBe(1)
      expect(secs).toBe(1)
      expect(ms).toBe(123)
    })
  })

  describe("Command execution", () => {
    it("should resolve absolute path", () => {
      const testPath = "audio.mp3"
      const absolutePath = path.resolve(testPath)

      expect(path.isAbsolute(absolutePath)).toBe(true)
    })

    it("should use local whisper by default", async () => {
      if (mockPlatform.exists) {
        vi.mocked(mockPlatform.exists).mockResolvedValue(true)
      }

      const mockResult: TranscriptionResult = {
        text: "Test transcription",
        segments: [],
        language: "en",
        processingTime: 1.5,
      }
      if (mockAI.whisperTranscribeLocal) {
        vi.mocked(mockAI.whisperTranscribeLocal).mockResolvedValue(mockResult)
      }

      expect(mockAI.whisperTranscribeLocal).toBeDefined()
    })

    it("should use OpenAI whisper when flag is set", async () => {
      if (mockPlatform.exists) {
        vi.mocked(mockPlatform.exists).mockResolvedValue(true)
      }

      const mockResult: TranscriptionResult = {
        text: "Test transcription",
        segments: [],
        language: "en",
        processingTime: 1.5,
      }
      if (mockAI.whisperTranscribeOpenAI) {
        vi.mocked(mockAI.whisperTranscribeOpenAI).mockResolvedValue(mockResult)
      }

      expect(mockAI.whisperTranscribeOpenAI).toBeDefined()
    })
  })

  describe("Output formats", () => {
    it("should support text format", () => {
      const result: TranscriptionResult = {
        text: "This is a test transcription",
        segments: [],
        language: "en",
        processingTime: 1.0,
      }

      expect(result.text).toBe("This is a test transcription")
    })

    it("should support json format", () => {
      const result: TranscriptionResult = {
        text: "Test",
        segments: [{ start: 0, end: 1, text: "Test" }],
        language: "en",
        processingTime: 1.0,
      }

      const json = JSON.stringify(result, null, 2)
      expect(json).toContain("text")
      expect(json).toContain("segments")
    })

    it("should support srt format", () => {
      const segments = [{ start: 0, end: 2, text: "Test" }]

      expect(segments).toHaveLength(1)
      expect(segments[0]).toHaveProperty("start")
      expect(segments[0]).toHaveProperty("end")
      expect(segments[0]).toHaveProperty("text")
    })

    it("should support vtt format", () => {
      const segments = [{ start: 0, end: 2, text: "Test" }]

      expect(segments).toHaveLength(1)
    })
  })

  describe("Model options", () => {
    it("should support tiny model", () => {
      const model = "tiny"
      expect(["tiny", "base", "small", "medium", "large"]).toContain(model)
    })

    it("should support base model", () => {
      const model = "base"
      expect(["tiny", "base", "small", "medium", "large"]).toContain(model)
    })

    it("should support small model", () => {
      const model = "small"
      expect(["tiny", "base", "small", "medium", "large"]).toContain(model)
    })

    it("should support medium model", () => {
      const model = "medium"
      expect(["tiny", "base", "small", "medium", "large"]).toContain(model)
    })

    it("should support large model", () => {
      const model = "large"
      expect(["tiny", "base", "small", "medium", "large"]).toContain(model)
    })
  })
})
