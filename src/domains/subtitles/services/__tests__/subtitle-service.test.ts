/**
 * Tests for SubtitleService
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SubtitleService } from "../subtitle-service"
import type {
  AudioAnalysisOptions,
  AudioPeaksResult,
  SubtitleExportOptions,
  SubtitleImportResult,
} from "../../types"

// Hoist mock functions
const { mockReadSubtitleFile, mockAnalyzeAudioPeaks, mockSaveSubtitleFile, mockUpdateTimelineSubtitles } = vi.hoisted(
  () => ({
    mockReadSubtitleFile: vi.fn(),
    mockAnalyzeAudioPeaks: vi.fn(),
    mockSaveSubtitleFile: vi.fn(),
    mockUpdateTimelineSubtitles: vi.fn(),
  }),
)

// Mock subtitle commands
vi.mock("../../tauri", () => ({
  readSubtitleFile: mockReadSubtitleFile,
  analyzeAudioPeaks: mockAnalyzeAudioPeaks,
  saveSubtitleFile: mockSaveSubtitleFile,
  updateTimelineSubtitles: mockUpdateTimelineSubtitles,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debugSync: vi.fn(),
    debug: vi.fn(),
    infoSync: vi.fn(),
    info: vi.fn(),
    warnSync: vi.fn(),
    warn: vi.fn(),
    errorSync: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("SubtitleService", () => {
  let service: SubtitleService

  beforeEach(() => {
    vi.clearAllMocks()
    service = SubtitleService.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Singleton pattern", () => {
    it("should return the same instance", () => {
      const instance1 = SubtitleService.getInstance()
      const instance2 = SubtitleService.getInstance()

      expect(instance1).toBe(instance2)
    })

    it("should create instance only once", () => {
      const instance1 = SubtitleService.getInstance()
      const instance2 = SubtitleService.getInstance()
      const instance3 = SubtitleService.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })
  })

  describe("importSubtitleFile", () => {
    it("should import SRT file successfully", async () => {
      const filePath = "/path/to/subtitles.srt"
      const mockResult: SubtitleImportResult = {
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello World",
        format: "srt",
        file_name: "subtitles.srt",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockResult)

      const result = await service.importSubtitleFile(filePath)

      expect(mockReadSubtitleFile).toHaveBeenCalledWith(filePath)
      expect(result).toEqual(mockResult)
    })

    it("should import VTT file successfully", async () => {
      const filePath = "/path/to/subtitles.vtt"
      const mockResult: SubtitleImportResult = {
        content: "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello World",
        format: "vtt",
        file_name: "subtitles.vtt",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockResult)

      const result = await service.importSubtitleFile(filePath)

      expect(result.format).toBe("vtt")
      expect(result.content).toContain("WEBVTT")
    })

    it("should import ASS file successfully", async () => {
      const filePath = "/path/to/subtitles.ass"
      const mockResult: SubtitleImportResult = {
        content: "[Script Info]\nTitle: Test",
        format: "ass",
        file_name: "subtitles.ass",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockResult)

      const result = await service.importSubtitleFile(filePath)

      expect(result.format).toBe("ass")
    })

    it("should import SSA file successfully", async () => {
      const filePath = "/path/to/subtitles.ssa"
      const mockResult: SubtitleImportResult = {
        content: "[Script Info]\nTitle: Test",
        format: "ssa",
        file_name: "subtitles.ssa",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockResult)

      const result = await service.importSubtitleFile(filePath)

      expect(result.format).toBe("ssa")
    })

    it("should handle file not found error", async () => {
      const filePath = "/nonexistent/file.srt"

      mockReadSubtitleFile.mockRejectedValueOnce(new Error("File not found"))

      await expect(service.importSubtitleFile(filePath)).rejects.toThrow("File not found")
    })

    it("should handle unsupported format error", async () => {
      const filePath = "/path/to/unsupported.txt"

      mockReadSubtitleFile.mockRejectedValueOnce(new Error("Unsupported format"))

      await expect(service.importSubtitleFile(filePath)).rejects.toThrow("Unsupported format")
    })

    it("should handle empty file", async () => {
      const filePath = "/path/to/empty.srt"
      const mockResult: SubtitleImportResult = {
        content: "",
        format: "srt",
        file_name: "empty.srt",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockResult)

      const result = await service.importSubtitleFile(filePath)

      expect(result.content).toBe("")
    })

    it("should handle multiple imports sequentially", async () => {
      const files = ["/file1.srt", "/file2.vtt", "/file3.ass"]

      for (const file of files) {
        const mockResult: SubtitleImportResult = {
          content: "Test",
          format: file.split(".")[1],
          file_name: file.split("/").pop() || "",
        }

        mockReadSubtitleFile.mockResolvedValueOnce(mockResult)

        await service.importSubtitleFile(file)
      }

      expect(mockReadSubtitleFile).toHaveBeenCalledTimes(3)
    })
  })

  describe("analyzeAudioForSync", () => {
    it("should analyze audio with default options", async () => {
      const audioPath = "/path/to/audio.mp3"
      const mockResult: AudioPeaksResult = {
        peaks: [
          { time: 1.5, amplitude: 0.8 },
          { time: 3.2, amplitude: 0.9 },
        ],
        sample_rate: 44100,
        duration: 60.5,
      }

      mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockResult)

      const result = await service.analyzeAudioForSync(audioPath)

      expect(mockAnalyzeAudioPeaks).toHaveBeenCalledWith(audioPath, undefined)
      expect(result.peaks).toHaveLength(2)
      expect(result.sample_rate).toBe(44100)
    })

    it("should analyze audio with custom options", async () => {
      const audioPath = "/path/to/audio.mp3"
      const options: AudioAnalysisOptions = {
        windowSize: 2048,
        hopSize: 1024,
        threshold: 0.7,
      }
      const mockResult: AudioPeaksResult = {
        peaks: [{ time: 2.0, amplitude: 0.85 }],
        sample_rate: 48000,
        duration: 120.0,
      }

      mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockResult)

      const result = await service.analyzeAudioForSync(audioPath, options)

      expect(mockAnalyzeAudioPeaks).toHaveBeenCalledWith(audioPath, options)
      expect(result.sample_rate).toBe(48000)
    })

    it("should handle video files with audio track", async () => {
      const audioPath = "/path/to/video.mp4"
      const mockResult: AudioPeaksResult = {
        peaks: [{ time: 5.0, amplitude: 0.95 }],
        sample_rate: 48000,
        duration: 180.5,
      }

      mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockResult)

      const result = await service.analyzeAudioForSync(audioPath)

      expect(result.peaks).toHaveLength(1)
    })

    it("should handle empty peaks (silent audio)", async () => {
      const audioPath = "/path/to/silent.mp3"
      const mockResult: AudioPeaksResult = {
        peaks: [],
        sample_rate: 44100,
        duration: 10.0,
      }

      mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockResult)

      const result = await service.analyzeAudioForSync(audioPath)

      expect(result.peaks).toHaveLength(0)
    })

    it("should handle audio analysis errors", async () => {
      const audioPath = "/path/to/corrupted.mp3"

      mockAnalyzeAudioPeaks.mockRejectedValueOnce(new Error("Failed to decode audio"))

      await expect(service.analyzeAudioForSync(audioPath)).rejects.toThrow("Failed to decode audio")
    })

    it("should analyze long audio files", async () => {
      const audioPath = "/path/to/long.mp3"
      const mockPeaks = Array.from({ length: 1000 }, (_, i) => ({
        time: i * 0.5,
        amplitude: Math.random(),
      }))
      const mockResult: AudioPeaksResult = {
        peaks: mockPeaks,
        sample_rate: 44100,
        duration: 500.0,
      }

      mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockResult)

      const result = await service.analyzeAudioForSync(audioPath)

      expect(result.peaks.length).toBe(1000)
      expect(result.duration).toBe(500.0)
    })

    it("should handle different threshold values", async () => {
      const audioPath = "/path/to/audio.mp3"
      const thresholds = [0.3, 0.5, 0.7, 0.9]

      for (const threshold of thresholds) {
        const mockResult: AudioPeaksResult = {
          peaks: [],
          sample_rate: 44100,
          duration: 30.0,
        }

        mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockResult)

        await service.analyzeAudioForSync(audioPath, { threshold })

        expect(mockAnalyzeAudioPeaks).toHaveBeenCalledWith(audioPath, { threshold })
      }
    })
  })

  describe("exportSubtitleFile", () => {
    it("should export SRT file successfully", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello World",
        output_path: "/path/to/output.srt",
      }

      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      await service.exportSubtitleFile(options)

      expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
    })

    it("should export VTT file successfully", async () => {
      const options: SubtitleExportOptions = {
        format: "vtt",
        content: "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello World",
        output_path: "/path/to/output.vtt",
      }

      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      await service.exportSubtitleFile(options)

      expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
    })

    it("should export ASS file successfully", async () => {
      const options: SubtitleExportOptions = {
        format: "ass",
        content: "[Script Info]\nTitle: Test",
        output_path: "/path/to/output.ass",
      }

      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      await service.exportSubtitleFile(options)

      expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
    })

    it("should export SSA file successfully", async () => {
      const options: SubtitleExportOptions = {
        format: "ssa",
        content: "[Script Info]\nTitle: Test",
        output_path: "/path/to/output.ssa",
      }

      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      await service.exportSubtitleFile(options)

      expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
    })

    it("should handle write permission error", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "Test",
        output_path: "/protected/file.srt",
      }

      mockSaveSubtitleFile.mockRejectedValueOnce(new Error("Permission denied"))

      await expect(service.exportSubtitleFile(options)).rejects.toThrow("Permission denied")
    })

    it("should handle invalid path error", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "Test",
        output_path: "/invalid:path/file.srt",
      }

      mockSaveSubtitleFile.mockRejectedValueOnce(new Error("Invalid path"))

      await expect(service.exportSubtitleFile(options)).rejects.toThrow("Invalid path")
    })

    it("should export empty content", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "",
        output_path: "/path/to/empty.srt",
      }

      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      await service.exportSubtitleFile(options)

      expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
    })

    it("should export large content", async () => {
      const largeContent = Array.from({ length: 1000 }, (_, i) => `${i + 1}\n00:00:${String(i).padStart(2, "0")},000 --> 00:00:${String(i + 1).padStart(2, "0")},000\nSubtitle ${i + 1}`).join("\n\n")

      const options: SubtitleExportOptions = {
        format: "srt",
        content: largeContent,
        output_path: "/path/to/large.srt",
      }

      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      await service.exportSubtitleFile(options)

      expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
    })

    it("should handle all supported formats", async () => {
      const formats: Array<"srt" | "vtt" | "ass" | "ssa"> = ["srt", "vtt", "ass", "ssa"]

      for (const format of formats) {
        const options: SubtitleExportOptions = {
          format,
          content: "Test content",
          output_path: `/path/to/file.${format}`,
        }

        mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

        await service.exportSubtitleFile(options)

        expect(mockSaveSubtitleFile).toHaveBeenCalledWith(options)
      }
    })
  })

  describe("updateTimelineSubtitles", () => {
    it("should update timeline subtitles successfully", async () => {
      const trackId = "track-123"
      const subtitles = [
        { start: 1.0, end: 4.0, text: "First subtitle" },
        { start: 5.0, end: 8.0, text: "Second subtitle" },
      ]

      mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

      await service.updateTimelineSubtitles(trackId, subtitles)

      expect(mockUpdateTimelineSubtitles).toHaveBeenCalledWith({
        trackId,
        subtitles,
      })
    })

    it("should handle empty subtitles array", async () => {
      const trackId = "track-123"
      const subtitles: any[] = []

      mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

      await service.updateTimelineSubtitles(trackId, subtitles)

      expect(mockUpdateTimelineSubtitles).toHaveBeenCalledWith({
        trackId,
        subtitles,
      })
    })

    it("should handle large number of subtitles", async () => {
      const trackId = "track-123"
      const subtitles = Array.from({ length: 500 }, (_, i) => ({
        start: i * 3,
        end: (i + 1) * 3,
        text: `Subtitle ${i + 1}`,
      }))

      mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

      await service.updateTimelineSubtitles(trackId, subtitles)

      expect(mockUpdateTimelineSubtitles).toHaveBeenCalledWith({
        trackId,
        subtitles,
      })
    })

    it("should handle track not found error", async () => {
      const trackId = "nonexistent-track"
      const subtitles: any[] = []

      mockUpdateTimelineSubtitles.mockRejectedValueOnce(new Error("Track not found"))

      await expect(service.updateTimelineSubtitles(trackId, subtitles)).rejects.toThrow("Track not found")
    })

    it("should update multiple tracks sequentially", async () => {
      const tracks = ["track-1", "track-2", "track-3"]

      for (const trackId of tracks) {
        mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

        await service.updateTimelineSubtitles(trackId, [])
      }

      expect(mockUpdateTimelineSubtitles).toHaveBeenCalledTimes(3)
    })

    it("should handle subtitles with complex metadata", async () => {
      const trackId = "track-123"
      const subtitles = [
        {
          start: 1.0,
          end: 4.0,
          text: "Styled subtitle",
          style: { color: "red", fontSize: 20 },
          position: { x: 100, y: 200 },
        },
      ]

      mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

      await service.updateTimelineSubtitles(trackId, subtitles)

      expect(mockUpdateTimelineSubtitles).toHaveBeenCalledWith({
        trackId,
        subtitles,
      })
    })
  })

  describe("getSupportedFormats", () => {
    it("should return array of supported formats", () => {
      const formats = service.getSupportedFormats()

      expect(formats).toEqual(["srt", "vtt", "ass", "ssa"])
    })

    it("should return same formats on multiple calls", () => {
      const formats1 = service.getSupportedFormats()
      const formats2 = service.getSupportedFormats()

      expect(formats1).toEqual(formats2)
    })

    it("should include all 4 formats", () => {
      const formats = service.getSupportedFormats()

      expect(formats).toHaveLength(4)
      expect(formats).toContain("srt")
      expect(formats).toContain("vtt")
      expect(formats).toContain("ass")
      expect(formats).toContain("ssa")
    })

    it("should return formats in correct order", () => {
      const formats = service.getSupportedFormats()

      expect(formats[0]).toBe("srt")
      expect(formats[1]).toBe("vtt")
      expect(formats[2]).toBe("ass")
      expect(formats[3]).toBe("ssa")
    })
  })

  describe("Integration scenarios", () => {
    it("should import and export subtitle file", async () => {
      const importPath = "/path/to/input.srt"
      const exportPath = "/path/to/output.srt"

      const mockImportResult: SubtitleImportResult = {
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello World",
        format: "srt",
        file_name: "input.srt",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockImportResult)
      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      const imported = await service.importSubtitleFile(importPath)
      await service.exportSubtitleFile({
        format: "srt",
        content: imported.content,
        output_path: exportPath,
      })

      expect(mockReadSubtitleFile).toHaveBeenCalledWith(importPath)
      expect(mockSaveSubtitleFile).toHaveBeenCalled()
    })

    it("should import, analyze, and update timeline", async () => {
      const subtitlePath = "/path/to/subtitles.srt"
      const audioPath = "/path/to/audio.mp3"
      const trackId = "track-123"

      const mockImportResult: SubtitleImportResult = {
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello",
        format: "srt",
        file_name: "subtitles.srt",
      }

      const mockAudioResult: AudioPeaksResult = {
        peaks: [{ time: 1.5, amplitude: 0.8 }],
        sample_rate: 44100,
        duration: 60.0,
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockImportResult)
      mockAnalyzeAudioPeaks.mockResolvedValueOnce(mockAudioResult)
      mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

      await service.importSubtitleFile(subtitlePath)
      await service.analyzeAudioForSync(audioPath)
      await service.updateTimelineSubtitles(trackId, [])

      expect(mockReadSubtitleFile).toHaveBeenCalled()
      expect(mockAnalyzeAudioPeaks).toHaveBeenCalled()
      expect(mockUpdateTimelineSubtitles).toHaveBeenCalled()
    })

    it("should handle format conversion workflow", async () => {
      const inputPath = "/path/to/input.srt"
      const outputPath = "/path/to/output.vtt"

      const mockImportResult: SubtitleImportResult = {
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello",
        format: "srt",
        file_name: "input.srt",
      }

      mockReadSubtitleFile.mockResolvedValueOnce(mockImportResult)
      mockSaveSubtitleFile.mockResolvedValueOnce(undefined)

      const imported = await service.importSubtitleFile(inputPath)

      // Convert content from SRT to VTT format (simplified)
      const convertedContent = `WEBVTT\n\n${imported.content}`

      await service.exportSubtitleFile({
        format: "vtt",
        content: convertedContent,
        output_path: outputPath,
      })

      expect(mockReadSubtitleFile).toHaveBeenCalledWith(inputPath)
      expect(mockSaveSubtitleFile).toHaveBeenCalledWith({
        format: "vtt",
        content: convertedContent,
        output_path: outputPath,
      })
    })
  })

  describe("Error handling", () => {
    it("should handle cascading errors in import-export workflow", async () => {
      const importPath = "/path/to/input.srt"

      mockReadSubtitleFile.mockRejectedValueOnce(new Error("Import failed"))

      await expect(service.importSubtitleFile(importPath)).rejects.toThrow("Import failed")

      // Verify export is not called when import fails
      expect(mockSaveSubtitleFile).not.toHaveBeenCalled()
    })

    it("should handle errors in analysis workflow", async () => {
      const audioPath = "/path/to/audio.mp3"

      mockAnalyzeAudioPeaks.mockRejectedValueOnce(new Error("Analysis failed"))

      await expect(service.analyzeAudioForSync(audioPath)).rejects.toThrow("Analysis failed")
    })

    it("should recover from individual operation failures", async () => {
      const trackId1 = "track-1"
      const trackId2 = "track-2"

      mockUpdateTimelineSubtitles.mockRejectedValueOnce(new Error("Update failed"))

      mockUpdateTimelineSubtitles.mockResolvedValueOnce(undefined)

      await expect(service.updateTimelineSubtitles(trackId1, [])).rejects.toThrow("Update failed")

      await expect(service.updateTimelineSubtitles(trackId2, [])).resolves.toBeUndefined()
    })
  })
})
