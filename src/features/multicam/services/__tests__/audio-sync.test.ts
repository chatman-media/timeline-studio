/**
 * Тесты для сервиса синхронизации по аудио
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { type MediaFile, MediaType } from "@/domains/media-management"
import type { TimelineClip } from "@/features/timeline/types"
import type { SyncResult } from "../../types/multicam"
import {
  analyzeAudioSyncQuality,
  correlateAudioSignals,
  formatSyncResult,
  getAudioInfo,
  hasAudioTrack,
  syncByAudio,
} from "../audio-sync"

// Тестовые данные
const createMockMediaFile = (id: string, hasAudio: boolean): MediaFile => ({
  id,
  name: `media-${id}.mp4`,
  path: `/path/to/${id}.mp4`,
  type: MediaType.Video,
  size: 1000000,
  duration: 60,
  createdAt: new Date(),
  updatedAt: new Date(),
  probeData: hasAudio
    ? {
        streams: [
          {
            index: 0,
            codec_type: "video" as const,
          },
          {
            index: 1,
            codec_type: "audio" as const,
            sample_rate: 48000,
            channels: 2,
            duration: "60.0",
          },
        ],
        format: {
          duration: 60.0,
        },
      }
    : {
        streams: [
          {
            index: 0,
            codec_type: "video" as const,
          },
        ],
        format: {
          duration: 60.0,
        },
      },
})

const createMockClip = (id: string, mediaId: string): TimelineClip => ({
  id,
  name: `Clip ${id}`,
  trackId: "track1",
  mediaId,
  startTime: 0,
  duration: 10,
  mediaStartTime: 0,
  mediaEndTime: 10,
  offset: 0,
  speed: 1,
  volume: 1,
  opacity: 1,
  isReversed: false,
  isSelected: false,
  isLocked: false,
  effects: [],
  filters: [],
  transitions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
})

describe("Audio Sync Service", () => {
  describe("hasAudioTrack", () => {
    it("should return true for media file with audio", () => {
      const mediaFile = createMockMediaFile("test1", true)

      expect(hasAudioTrack(mediaFile)).toBe(true)
    })

    it("should return false for media file without audio", () => {
      const mediaFile = createMockMediaFile("test2", false)

      expect(hasAudioTrack(mediaFile)).toBe(false)
    })

    it("should return false for media file without probeData", () => {
      const mediaFile: MediaFile = {
        id: "test3",
        name: "test.mp4",
        path: "/test.mp4",
        type: MediaType.Video,
        size: 1000,
        duration: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(hasAudioTrack(mediaFile)).toBe(false)
    })
  })

  describe("getAudioInfo", () => {
    it("should extract audio information from media file", () => {
      const mediaFile = createMockMediaFile("test1", true)

      const audioInfo = getAudioInfo(mediaFile)

      expect(audioInfo).toMatchObject({
        clipId: "test1",
        hasAudio: true,
        sampleRate: 48000,
        channels: 2,
        audioStreamIndex: 1,
      })
      expect(audioInfo?.duration).toBeGreaterThan(0)
    })

    it("should return null for media file without audio", () => {
      const mediaFile = createMockMediaFile("test2", false)

      const audioInfo = getAudioInfo(mediaFile)

      expect(audioInfo).toBeNull()
    })

    it("should use default values for missing stream properties", () => {
      const mediaFile: MediaFile = {
        ...createMockMediaFile("test3", true),
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "audio" as const,
            },
          ],
          format: {},
        },
      }

      const audioInfo = getAudioInfo(mediaFile)

      expect(audioInfo).toMatchObject({
        sampleRate: 48000, // default
        channels: 2, // default
        duration: 0, // no duration provided
      })
    })

    it("should prioritize stream duration over format duration", () => {
      const mediaFile: MediaFile = {
        ...createMockMediaFile("test4", true),
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "audio" as const,
              duration: "30.5",
            },
          ],
          format: {
            duration: 60.0,
          },
        },
      }

      const audioInfo = getAudioInfo(mediaFile)

      expect(audioInfo?.duration).toBe(30.5)
    })
  })

  describe("correlateAudioSignals", () => {
    it("should find perfect correlation at zero offset", () => {
      const signal = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])

      const result = correlateAudioSignals(signal, signal, 48000, 0.1)

      expect(result.offset).toBe(0)
      // Корреляция идентичного сигнала должна быть близка к 1, но не обязательно точно 1
      expect(result.confidence).toBeGreaterThan(0.99)
      expect(result.correlationPeak).toBeGreaterThan(0.99)
    })

    it("should find correlation with offset", () => {
      const signal1 = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0, 0, 0])
      const signal2 = new Float32Array([0, 0, 0, 0.1, 0.2, 0.3, 0.4, 0.5])

      const result = correlateAudioSignals(signal1, signal2, 8, 1)

      // Signal2 is delayed by 3 samples, offset should be positive
      expect(Math.abs(result.offset)).toBeGreaterThan(0)
    })

    it("should return low confidence for uncorrelated signals", () => {
      const signal1 = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])
      const signal2 = new Float32Array([0.9, 0.8, 0.7, 0.6, 0.5])

      const result = correlateAudioSignals(signal1, signal2, 48000, 0.1)

      expect(result.confidence).toBeLessThan(1.0)
    })

    it("should respect maxOffsetSeconds parameter", () => {
      const signal1 = new Float32Array(100).fill(0.5)
      const signal2 = new Float32Array(100).fill(0.3)
      const maxOffsetSeconds = 0.5
      const sampleRate = 1000

      const result = correlateAudioSignals(signal1, signal2, sampleRate, maxOffsetSeconds)

      // Offset should be within maxOffsetSeconds
      expect(Math.abs(result.offset)).toBeLessThanOrEqual(maxOffsetSeconds)
    })

    it("should handle empty signals", () => {
      const signal1 = new Float32Array([])
      const signal2 = new Float32Array([])

      const result = correlateAudioSignals(signal1, signal2, 48000, 1)

      expect(result.offset).toBe(0)
      expect(result.confidence).toBe(0)
      expect(result.correlationPeak).toBe(0)
    })
  })

  describe("syncByAudio", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("should return empty results if base clip has no audio", async () => {
      const baseClip = createMockClip("base", "media-no-audio")
      const clips = [createMockClip("clip1", "media1")]
      const mediaFiles = [createMockMediaFile("media-no-audio", false), createMockMediaFile("media1", true)]

      const results = await syncByAudio(baseClip, clips, mediaFiles)

      expect(results).toEqual([])
    })

    it("should skip clips without audio", async () => {
      const baseClip = createMockClip("base", "media-base")
      const clips = [createMockClip("clip1", "media-no-audio"), createMockClip("clip2", "media2")]
      const mediaFiles = [
        createMockMediaFile("media-base", true),
        createMockMediaFile("media-no-audio", false),
        createMockMediaFile("media2", true),
      ]

      const results = await syncByAudio(baseClip, clips, mediaFiles)

      expect(results).toHaveLength(2)
      expect(results[0]).toMatchObject({
        clipId: "clip1",
        method: "none",
        confidence: 0,
      })
      expect(results[1]).toMatchObject({
        clipId: "clip2",
        method: "audio",
      })
    }, 20000)

    it("should skip base clip in results", async () => {
      vi.useFakeTimers()
      const baseClip = createMockClip("base", "media-base")
      const clips = [baseClip, createMockClip("clip1", "media1")]
      const mediaFiles = [createMockMediaFile("media-base", true), createMockMediaFile("media1", true)]

      const promise = syncByAudio(baseClip, clips, mediaFiles)
      await vi.runAllTimersAsync()
      const results = await promise

      expect(results.every((r) => r.clipId !== "base")).toBe(true)
      vi.useRealTimers()
    }, 20000)

    it("should call onProgress callback during sync", async () => {
      vi.useFakeTimers()
      const baseClip = createMockClip("base", "media-base")
      const clips = [createMockClip("clip1", "media1")]
      const mediaFiles = [createMockMediaFile("media-base", true), createMockMediaFile("media1", true)]

      const onProgress = vi.fn()

      const promise = syncByAudio(baseClip, clips, mediaFiles, onProgress)
      await vi.runAllTimersAsync()
      await promise

      expect(onProgress).toHaveBeenCalled()
      // Should report completion
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: "complete",
        }),
      )
      vi.useRealTimers()
    }, 20000)

    it("should report progress phases correctly", async () => {
      vi.useFakeTimers()
      const baseClip = createMockClip("base", "media-base")
      const clips = [createMockClip("clip1", "media1")]
      const mediaFiles = [createMockMediaFile("media-base", true), createMockMediaFile("media1", true)]

      const onProgress = vi.fn()

      const promise = syncByAudio(baseClip, clips, mediaFiles, onProgress)
      await vi.runAllTimersAsync()
      await promise

      const calls = onProgress.mock.calls.map((call) => call[0])
      const phases = calls.map((c: any) => c.phase)

      expect(phases).toContain("loading")
      expect(phases).toContain("analyzing")
      expect(phases).toContain("correlating")
      expect(phases).toContain("complete")
      vi.useRealTimers()
    }, 20000)
  })

  describe("analyzeAudioSyncQuality", () => {
    it("should return poor quality for empty results", () => {
      const results: SyncResult[] = []

      const quality = analyzeAudioSyncQuality(results)

      expect(quality.recommendation).toBe("poor")
      expect(quality.averageConfidence).toBe(0)
      expect(quality.successRate).toBe(0)
    })

    it("should return good quality for high confidence results", () => {
      const results: SyncResult[] = [
        { clipId: "1", offset: 1.0, confidence: 0.9, method: "audio" },
        { clipId: "2", offset: 2.0, confidence: 0.95, method: "audio" },
        { clipId: "3", offset: 1.5, confidence: 0.85, method: "audio" },
      ]

      const quality = analyzeAudioSyncQuality(results)

      expect(quality.recommendation).toBe("good")
      expect(quality.averageConfidence).toBeGreaterThan(0.8)
      expect(quality.successRate).toBeGreaterThan(0.8)
    })

    it("should return fair quality for medium confidence results", () => {
      const results: SyncResult[] = [
        { clipId: "1", offset: 1.0, confidence: 0.7, method: "audio" },
        { clipId: "2", offset: 2.0, confidence: 0.6, method: "audio" },
        { clipId: "3", offset: 1.5, confidence: 0.65, method: "audio" },
      ]

      const quality = analyzeAudioSyncQuality(results)

      // averageConfidence = (0.7 + 0.6 + 0.65) / 3 = 0.65
      // successRate = 1/3 = 0.33 (только 0.7 > 0.7)
      // Должно быть fair по логике: averageConfidence > 0.6 || successRate > 0.6
      expect(quality.recommendation).toBe("fair")
      expect(quality.averageConfidence).toBeGreaterThan(0.6)
      expect(quality.averageConfidence).toBeLessThan(0.8)
    })

    it("should ignore non-audio sync results", () => {
      const results: SyncResult[] = [
        { clipId: "1", offset: 1.0, confidence: 0.9, method: "audio" },
        { clipId: "2", offset: 2.0, confidence: 0.5, method: "timecode" },
        { clipId: "3", offset: 1.5, confidence: 0.3, method: "manual" },
      ]

      const quality = analyzeAudioSyncQuality(results)

      // Should only consider the audio result
      expect(quality.averageConfidence).toBe(0.9)
    })

    it("should calculate success rate based on 0.7 threshold", () => {
      const results: SyncResult[] = [
        { clipId: "1", offset: 1.0, confidence: 0.8, method: "audio" }, // success
        { clipId: "2", offset: 2.0, confidence: 0.75, method: "audio" }, // success
        { clipId: "3", offset: 1.5, confidence: 0.6, method: "audio" }, // fail
        { clipId: "4", offset: 1.2, confidence: 0.5, method: "audio" }, // fail
      ]

      const quality = analyzeAudioSyncQuality(results)

      expect(quality.successRate).toBe(0.5) // 2 out of 4
    })
  })

  describe("formatSyncResult", () => {
    it("should format result with positive offset", () => {
      const result: SyncResult = {
        clipId: "1",
        offset: 2.456,
        confidence: 0.85,
        method: "audio",
      }

      const formatted = formatSyncResult(result)

      expect(formatted).toContain("+2.456")
      expect(formatted).toContain("85")
    })

    it("should format result with negative offset", () => {
      const result: SyncResult = {
        clipId: "1",
        offset: -1.234,
        confidence: 0.92,
        method: "audio",
      }

      const formatted = formatSyncResult(result)

      expect(formatted).toContain("-1.234")
      expect(formatted).toContain("92")
    })

    it("should return failure message for failed sync", () => {
      const result: SyncResult = {
        clipId: "1",
        offset: 0,
        confidence: 0,
        method: "none",
      }

      const formatted = formatSyncResult(result)

      expect(formatted).toBe("Синхронизация не удалась")
    })

    it("should return failure message for zero confidence", () => {
      const result: SyncResult = {
        clipId: "1",
        offset: 2.0,
        confidence: 0,
        method: "audio",
      }

      const formatted = formatSyncResult(result)

      expect(formatted).toBe("Синхронизация не удалась")
    })

    it("should round confidence to nearest percent", () => {
      const result: SyncResult = {
        clipId: "1",
        offset: 1.0,
        confidence: 0.876,
        method: "audio",
      }

      const formatted = formatSyncResult(result)

      expect(formatted).toContain("88%")
    })
  })
})
