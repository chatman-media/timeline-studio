/**
 * Tests for Subtitle Tauri Commands
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type {
  AudioPeaksResult,
  SubtitleExportOptions,
  SubtitleImportResult,
  UpdateTimelineSubtitlesParams,
} from "../../types"
import { analyzeAudioPeaks, readSubtitleFile, saveSubtitleFile, updateTimelineSubtitles } from "../subtitle-commands"

// Hoist mock function declaration
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}))

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
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

describe("Subtitle Tauri Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("readSubtitleFile", () => {
    it("should invoke Tauri command and return subtitle data", async () => {
      const filePath = "/path/to/subtitles.srt"
      const mockResult: SubtitleImportResult = {
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello World",
        format: "srt",
        file_name: "subtitles.srt",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(mockInvoke).toHaveBeenCalledWith("read_subtitle_file", {
        file_path: filePath,
      })
      expect(result).toEqual(mockResult)
      expect(result.format).toBe("srt")
      expect(result.file_name).toBe("subtitles.srt")
    })

    it("should handle SRT format", async () => {
      const filePath = "/path/to/file.srt"
      const mockResult: SubtitleImportResult = {
        content: "1\n00:00:01,000 --> 00:00:04,000\nFirst subtitle",
        format: "srt",
        file_name: "file.srt",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.format).toBe("srt")
      expect(result.content).toContain("00:00:01,000")
    })

    it("should handle VTT format", async () => {
      const filePath = "/path/to/file.vtt"
      const mockResult: SubtitleImportResult = {
        content: "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nFirst subtitle",
        format: "vtt",
        file_name: "file.vtt",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.format).toBe("vtt")
      expect(result.content).toContain("WEBVTT")
    })

    it("should handle ASS format", async () => {
      const filePath = "/path/to/file.ass"
      const mockResult: SubtitleImportResult = {
        content: "[Script Info]\nTitle: Test",
        format: "ass",
        file_name: "file.ass",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.format).toBe("ass")
      expect(result.content).toContain("[Script Info]")
    })

    it("should handle SSA format", async () => {
      const filePath = "/path/to/file.ssa"
      const mockResult: SubtitleImportResult = {
        content: "[Script Info]\nTitle: Test",
        format: "ssa",
        file_name: "file.ssa",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.format).toBe("ssa")
    })

    it("should handle file not found error", async () => {
      const filePath = "/nonexistent/file.srt"

      mockInvoke.mockRejectedValueOnce(new Error("File not found"))

      await expect(readSubtitleFile(filePath)).rejects.toThrow("File not found")
    })

    it("should handle invalid format error", async () => {
      const filePath = "/path/to/invalid.txt"

      mockInvoke.mockRejectedValueOnce(new Error("Unsupported format"))

      await expect(readSubtitleFile(filePath)).rejects.toThrow("Unsupported format")
    })

    it("should handle corrupted file error", async () => {
      const filePath = "/path/to/corrupted.srt"

      mockInvoke.mockRejectedValueOnce(new Error("Failed to parse subtitle file"))

      await expect(readSubtitleFile(filePath)).rejects.toThrow("Failed to parse subtitle file")
    })

    it("should handle empty subtitle file", async () => {
      const filePath = "/path/to/empty.srt"
      const mockResult: SubtitleImportResult = {
        content: "",
        format: "srt",
        file_name: "empty.srt",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.content).toBe("")
    })

    it("should handle large subtitle file", async () => {
      const filePath = "/path/to/large.srt"
      const largeContent = Array.from(
        { length: 1000 },
        (_, i) =>
          `${i + 1}\n00:00:${String(i).padStart(2, "0")},000 --> 00:00:${String(i + 1).padStart(2, "0")},000\nSubtitle ${i + 1}`,
      ).join("\n\n")

      const mockResult: SubtitleImportResult = {
        content: largeContent,
        format: "srt",
        file_name: "large.srt",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.content.length).toBeGreaterThan(10000)
    })

    it("should handle special characters in content", async () => {
      const filePath = "/path/to/special.srt"
      const mockResult: SubtitleImportResult = {
        content: '1\n00:00:01,000 --> 00:00:04,000\n<i>Hello</i> & "World" 你好',
        format: "srt",
        file_name: "special.srt",
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await readSubtitleFile(filePath)

      expect(result.content).toContain("<i>")
      expect(result.content).toContain("&")
      expect(result.content).toContain("你好")
    })
  })

  describe("analyzeAudioPeaks", () => {
    it("should invoke Tauri command with default options", async () => {
      const audioPath = "/path/to/audio.mp3"
      const mockResult: AudioPeaksResult = {
        peaks: [
          { time: 1.5, amplitude: 0.8 },
          { time: 3.2, amplitude: 0.9 },
        ],
        sample_rate: 44100,
        duration: 60.5,
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await analyzeAudioPeaks(audioPath)

      expect(mockInvoke).toHaveBeenCalledWith("analyze_audio_peaks", {
        audioPath,
        windowSize: 1024,
        hopSize: 512,
        threshold: 0.5,
      })
      expect(result.peaks).toHaveLength(2)
      expect(result.sample_rate).toBe(44100)
      expect(result.duration).toBe(60.5)
    })

    it("should invoke Tauri command with custom options", async () => {
      const audioPath = "/path/to/audio.mp3"
      const options = {
        windowSize: 2048,
        hopSize: 1024,
        threshold: 0.7,
      }
      const mockResult: AudioPeaksResult = {
        peaks: [{ time: 2.0, amplitude: 0.85 }],
        sample_rate: 48000,
        duration: 120.0,
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await analyzeAudioPeaks(audioPath, options)

      expect(mockInvoke).toHaveBeenCalledWith("analyze_audio_peaks", {
        audioPath,
        windowSize: 2048,
        hopSize: 1024,
        threshold: 0.7,
      })
      expect(result.sample_rate).toBe(48000)
    })

    it("should handle partial options", async () => {
      const audioPath = "/path/to/audio.mp3"
      const options = {
        threshold: 0.6,
      }
      const mockResult: AudioPeaksResult = {
        peaks: [],
        sample_rate: 44100,
        duration: 30.0,
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await analyzeAudioPeaks(audioPath, options)

      expect(mockInvoke).toHaveBeenCalledWith("analyze_audio_peaks", {
        audioPath,
        windowSize: 1024,
        hopSize: 512,
        threshold: 0.6,
      })
    })

    it("should handle video file with audio track", async () => {
      const audioPath = "/path/to/video.mp4"
      const mockResult: AudioPeaksResult = {
        peaks: [{ time: 5.0, amplitude: 0.95 }],
        sample_rate: 48000,
        duration: 180.5,
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await analyzeAudioPeaks(audioPath)

      expect(result.peaks).toHaveLength(1)
    })

    it("should handle empty peaks result", async () => {
      const audioPath = "/path/to/silent.mp3"
      const mockResult: AudioPeaksResult = {
        peaks: [],
        sample_rate: 44100,
        duration: 10.0,
      }

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await analyzeAudioPeaks(audioPath)

      expect(result.peaks).toHaveLength(0)
    })

    it("should handle large number of peaks", async () => {
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

      mockInvoke.mockResolvedValueOnce(mockResult)

      const result = await analyzeAudioPeaks(audioPath)

      expect(result.peaks.length).toBe(1000)
    })

    it("should handle audio file not found error", async () => {
      const audioPath = "/nonexistent/audio.mp3"

      mockInvoke.mockRejectedValueOnce(new Error("Audio file not found"))

      await expect(analyzeAudioPeaks(audioPath)).rejects.toThrow("Audio file not found")
    })

    it("should handle unsupported audio format error", async () => {
      const audioPath = "/path/to/unsupported.xyz"

      mockInvoke.mockRejectedValueOnce(new Error("Unsupported audio format"))

      await expect(analyzeAudioPeaks(audioPath)).rejects.toThrow("Unsupported audio format")
    })

    it("should handle corrupted audio file error", async () => {
      const audioPath = "/path/to/corrupted.mp3"

      mockInvoke.mockRejectedValueOnce(new Error("Failed to decode audio"))

      await expect(analyzeAudioPeaks(audioPath)).rejects.toThrow("Failed to decode audio")
    })

    it("should handle different sample rates", async () => {
      const testCases = [
        { sampleRate: 22050, duration: 30.0 },
        { sampleRate: 44100, duration: 60.0 },
        { sampleRate: 48000, duration: 120.0 },
        { sampleRate: 96000, duration: 90.0 },
      ]

      for (const testCase of testCases) {
        const mockResult: AudioPeaksResult = {
          peaks: [],
          sample_rate: testCase.sampleRate,
          duration: testCase.duration,
        }

        mockInvoke.mockResolvedValueOnce(mockResult)

        const result = await analyzeAudioPeaks("/path/to/audio.mp3")

        expect(result.sample_rate).toBe(testCase.sampleRate)
        expect(result.duration).toBe(testCase.duration)
      }
    })
  })

  describe("saveSubtitleFile", () => {
    it("should invoke Tauri command to save SRT file", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "1\n00:00:01,000 --> 00:00:04,000\nHello World",
        output_path: "/path/to/output.srt",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })

    it("should handle VTT export", async () => {
      const options: SubtitleExportOptions = {
        format: "vtt",
        content: "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello World",
        output_path: "/path/to/output.vtt",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })

    it("should handle ASS export", async () => {
      const options: SubtitleExportOptions = {
        format: "ass",
        content: "[Script Info]\nTitle: Test",
        output_path: "/path/to/output.ass",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })

    it("should handle SSA export", async () => {
      const options: SubtitleExportOptions = {
        format: "ssa",
        content: "[Script Info]\nTitle: Test",
        output_path: "/path/to/output.ssa",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })

    it("should handle empty content", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "",
        output_path: "/path/to/empty.srt",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })

    it("should handle large content", async () => {
      const largeContent = Array.from(
        { length: 1000 },
        (_, i) =>
          `${i + 1}\n00:00:${String(i).padStart(2, "0")},000 --> 00:00:${String(i + 1).padStart(2, "0")},000\nSubtitle ${i + 1}`,
      ).join("\n\n")

      const options: SubtitleExportOptions = {
        format: "srt",
        content: largeContent,
        output_path: "/path/to/large.srt",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })

    it("should handle write permission error", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "Test content",
        output_path: "/protected/file.srt",
      }

      mockInvoke.mockRejectedValueOnce(new Error("Permission denied"))

      await expect(saveSubtitleFile(options)).rejects.toThrow("Permission denied")
    })

    it("should handle invalid path error", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "Test content",
        output_path: "/invalid:path/file.srt",
      }

      mockInvoke.mockRejectedValueOnce(new Error("Invalid path"))

      await expect(saveSubtitleFile(options)).rejects.toThrow("Invalid path")
    })

    it("should handle disk full error", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "Test content",
        output_path: "/path/to/file.srt",
      }

      mockInvoke.mockRejectedValueOnce(new Error("Disk full"))

      await expect(saveSubtitleFile(options)).rejects.toThrow("Disk full")
    })

    it("should handle special characters in path", async () => {
      const options: SubtitleExportOptions = {
        format: "srt",
        content: "Test content",
        output_path: "/path/to/файл с пробелами.srt",
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await saveSubtitleFile(options)

      expect(mockInvoke).toHaveBeenCalledWith("save_subtitle_file", { options })
    })
  })

  describe("updateTimelineSubtitles", () => {
    it("should invoke Tauri command with track ID and subtitles", async () => {
      const params: UpdateTimelineSubtitlesParams = {
        trackId: "track-123",
        subtitles: [
          { start: 1.0, end: 4.0, text: "First subtitle" },
          { start: 5.0, end: 8.0, text: "Second subtitle" },
        ],
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await updateTimelineSubtitles(params)

      expect(mockInvoke).toHaveBeenCalledWith("update_timeline_subtitles", {
        trackId: params.trackId,
        subtitles: params.subtitles,
      })
    })

    it("should handle empty subtitles array", async () => {
      const params: UpdateTimelineSubtitlesParams = {
        trackId: "track-123",
        subtitles: [],
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await updateTimelineSubtitles(params)

      expect(mockInvoke).toHaveBeenCalledWith("update_timeline_subtitles", {
        trackId: params.trackId,
        subtitles: [],
      })
    })

    it("should handle large number of subtitles", async () => {
      const params: UpdateTimelineSubtitlesParams = {
        trackId: "track-123",
        subtitles: Array.from({ length: 500 }, (_, i) => ({
          start: i * 3,
          end: (i + 1) * 3,
          text: `Subtitle ${i + 1}`,
        })),
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await updateTimelineSubtitles(params)

      expect(mockInvoke).toHaveBeenCalledWith("update_timeline_subtitles", {
        trackId: params.trackId,
        subtitles: params.subtitles,
      })
    })

    it("should handle subtitles with metadata", async () => {
      const params: UpdateTimelineSubtitlesParams = {
        trackId: "track-123",
        subtitles: [
          {
            start: 1.0,
            end: 4.0,
            text: "Styled subtitle",
            style: { color: "red", fontSize: 20 },
            position: { x: 100, y: 200 },
          },
        ],
      }

      mockInvoke.mockResolvedValueOnce(undefined)

      await updateTimelineSubtitles(params)

      expect(mockInvoke).toHaveBeenCalledWith("update_timeline_subtitles", {
        trackId: params.trackId,
        subtitles: params.subtitles,
      })
    })

    it("should handle track not found error", async () => {
      const params: UpdateTimelineSubtitlesParams = {
        trackId: "nonexistent-track",
        subtitles: [],
      }

      mockInvoke.mockRejectedValueOnce(new Error("Track not found"))

      await expect(updateTimelineSubtitles(params)).rejects.toThrow("Track not found")
    })

    it("should handle invalid subtitle data error", async () => {
      const params: UpdateTimelineSubtitlesParams = {
        trackId: "track-123",
        subtitles: [{ start: 10, end: 5, text: "Invalid timing" }],
      }

      mockInvoke.mockRejectedValueOnce(new Error("Invalid subtitle timing"))

      await expect(updateTimelineSubtitles(params)).rejects.toThrow("Invalid subtitle timing")
    })

    it("should handle concurrent updates to different tracks", async () => {
      const params1: UpdateTimelineSubtitlesParams = {
        trackId: "track-1",
        subtitles: [{ start: 1.0, end: 2.0, text: "Track 1" }],
      }
      const params2: UpdateTimelineSubtitlesParams = {
        trackId: "track-2",
        subtitles: [{ start: 1.0, end: 2.0, text: "Track 2" }],
      }

      mockInvoke.mockResolvedValue(undefined)

      await Promise.all([updateTimelineSubtitles(params1), updateTimelineSubtitles(params2)])

      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })
  })

  describe("error scenarios", () => {
    it("should propagate network errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Network error"))

      await expect(readSubtitleFile("/path/to/file.srt")).rejects.toThrow("Network error")
    })

    it("should propagate timeout errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Request timeout"))

      await expect(analyzeAudioPeaks("/path/to/audio.mp3")).rejects.toThrow("Request timeout")
    })

    it("should propagate permission errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Permission denied"))

      await expect(
        saveSubtitleFile({
          format: "srt",
          content: "Test",
          output_path: "/protected/file.srt",
        }),
      ).rejects.toThrow("Permission denied")
    })

    it("should propagate generic errors", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Unknown error"))

      await expect(
        updateTimelineSubtitles({
          trackId: "track-123",
          subtitles: [],
        }),
      ).rejects.toThrow("Unknown error")
    })
  })

  describe("concurrent calls", () => {
    it("should handle concurrent readSubtitleFile calls", async () => {
      const mockResult: SubtitleImportResult = {
        content: "Test",
        format: "srt",
        file_name: "test.srt",
      }

      mockInvoke.mockResolvedValue(mockResult)

      const calls = [readSubtitleFile("/file1.srt"), readSubtitleFile("/file2.srt"), readSubtitleFile("/file3.srt")]

      const results = await Promise.all(calls)

      expect(results).toHaveLength(3)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent analyzeAudioPeaks calls", async () => {
      const mockResult: AudioPeaksResult = {
        peaks: [],
        sample_rate: 44100,
        duration: 10.0,
      }

      mockInvoke.mockResolvedValue(mockResult)

      const calls = [
        analyzeAudioPeaks("/audio1.mp3"),
        analyzeAudioPeaks("/audio2.mp3"),
        analyzeAudioPeaks("/audio3.mp3"),
      ]

      const results = await Promise.all(calls)

      expect(results).toHaveLength(3)
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle concurrent saveSubtitleFile calls", async () => {
      mockInvoke.mockResolvedValue(undefined)

      const calls = [
        saveSubtitleFile({ format: "srt", content: "Test 1", output_path: "/file1.srt" }),
        saveSubtitleFile({ format: "vtt", content: "Test 2", output_path: "/file2.vtt" }),
        saveSubtitleFile({ format: "ass", content: "Test 3", output_path: "/file3.ass" }),
      ]

      await Promise.all(calls)

      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })
  })
})
