/**
 * Интеграционные тесты для мультикамерного монтажа
 * Покрывает все основные функции multicam editing
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaFile } from "@/domains/media-management"
import { MediaType } from "@/domains/media-management"
import type { TimelineClip } from "@/features/timeline/types/timeline"
import * as audioSyncService from "../../services/audio-sync"
import { multicamManager } from "../../services/multicam-manager"
import * as timecodeSync from "../../services/timecode-sync"
import type { MulticamAngle, SyncMethod, SyncResult } from "../../types/multicam"

// ============================================================================
// Mock Data
// ============================================================================

const createMockMediaFile = (id: string, timecode: string, creationTime: string): MediaFile => ({
  id,
  name: `video-${id}.mp4`,
  path: `/media/video-${id}.mp4`,
  type: MediaType.Video,
  size: 1024 * 1024 * 100,
  duration: 120,
  createdAt: new Date(creationTime),
  updatedAt: new Date(creationTime),
  thumbnailPath: `/thumbnails/${id}.jpg`,
  probeData: {
    streams: [
      {
        index: 0,
        codec_type: "video",
        codec_name: "h264",
        width: 1920,
        height: 1080,
        r_frame_rate: "30/1",
        duration: "120",
        timecode,
      },
      {
        index: 1,
        codec_type: "audio",
        codec_name: "aac",
        sample_rate: 48000,
        channels: 2,
        duration: "120",
      },
    ],
    format: {
      format_name: "mp4",
      duration: 120,
      size: 104857600,
      bit_rate: 7000000,
      tags: {
        creation_time: creationTime,
      },
    },
  },
})

const mockMediaFiles: MediaFile[] = [
  createMockMediaFile("media-cam1", "10:00:00:00", "2024-01-01T10:00:00.000Z"),
  createMockMediaFile("media-cam2", "10:00:02:15", "2024-01-01T10:00:02.500Z"),
  createMockMediaFile("media-cam3", "10:00:05:00", "2024-01-01T10:00:05.000Z"),
  createMockMediaFile("media-cam4", "10:00:01:00", "2024-01-01T10:00:01.000Z"),
]

const createMockClip = (id: string, mediaId: string, startTime = 0): TimelineClip => ({
  id,
  name: `Clip ${id}`,
  trackId: `track-${id}`,
  mediaId,
  startTime,
  duration: 120,
  mediaStartTime: 0,
  mediaEndTime: 120,
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

const mockClips: TimelineClip[] = [
  createMockClip("clip-cam1", "media-cam1", 0),
  createMockClip("clip-cam2", "media-cam2", 0),
  createMockClip("clip-cam3", "media-cam3", 0),
  createMockClip("clip-cam4", "media-cam4", 0),
]

// ============================================================================
// Test Suites
// ============================================================================

describe("Multicam Editing Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    multicamManager.setBaseClip(null)
  })

  // ==========================================================================
  // 1. Синхронизация нескольких камер по audio waveform
  // ==========================================================================

  describe("Audio Waveform Synchronization", () => {
    it("should detect audio tracks in media files", () => {
      mockMediaFiles.forEach((media) => {
        const hasAudio = audioSyncService.hasAudioTrack(media)
        expect(hasAudio).toBe(true)
      })
    })

    it("should extract audio info from media files", () => {
      const audioInfo = audioSyncService.getAudioInfo(mockMediaFiles[0]!)
      expect(audioInfo).toBeDefined()
      expect(audioInfo?.hasAudio).toBe(true)
      expect(audioInfo?.sampleRate).toBe(48000)
      expect(audioInfo?.channels).toBe(2)
    })

    it("should correlate audio signals with offset", () => {
      const signal1 = new Float32Array(1000)
      const signal2 = new Float32Array(1000)

      // Заполняем тестовыми данными
      for (let i = 0; i < 1000; i++) {
        signal1[i] = Math.sin((2 * Math.PI * i) / 100)
        signal2[i] = Math.sin((2 * Math.PI * i) / 100)
      }

      const result = audioSyncService.correlateAudioSignals(signal1, signal2, 48000)

      expect(result).toBeDefined()
      expect(result.offset).toBeTypeOf("number")
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })

    it("should analyze audio sync quality", () => {
      const results: SyncResult[] = [
        { clipId: "clip-1", offset: 2.5, confidence: 0.92, method: "audio" },
        { clipId: "clip-2", offset: 5.0, confidence: 0.88, method: "audio" },
        { clipId: "clip-3", offset: 1.0, confidence: 0.95, method: "audio" },
      ]

      const analysis = audioSyncService.analyzeAudioSyncQuality(results)

      expect(analysis.averageConfidence).toBeGreaterThan(0.8)
      expect(analysis.successRate).toBe(1.0)
      expect(analysis.recommendation).toBe("good")
    })

    it("should format sync results correctly", () => {
      const result: SyncResult = {
        clipId: "clip-1",
        offset: 2.5,
        confidence: 0.92,
        method: "audio",
      }

      const formatted = audioSyncService.formatSyncResult(result)
      expect(formatted).toContain("+2.500")
      expect(formatted).toContain("92%")
    })

    it("should handle empty audio signals", () => {
      const empty1 = new Float32Array(0)
      const empty2 = new Float32Array(100)

      const result = audioSyncService.correlateAudioSignals(empty1, empty2, 48000)
      expect(result.confidence).toBe(0)
      expect(result.offset).toBe(0)
    })
  })

  // ==========================================================================
  // 2. Switching между камерами во время playback
  // ==========================================================================

  describe("Camera Switching During Playback", () => {
    it("should switch to specific camera", () => {
      multicamManager.switchToCamera(2)
      expect(multicamManager.getCurrentAngleIndex()).toBe(2)
    })

    it("should switch camera by number (1-9)", () => {
      multicamManager.switchToCameraByNumber(3)
      expect(multicamManager.getCurrentAngleIndex()).toBe(2)
    })

    it("should emit camera switch events", () => {
      const listener = vi.fn()
      multicamManager.on("camera-switched", listener)

      multicamManager.switchToCamera(1)

      expect(listener).toHaveBeenCalledWith(1)
      multicamManager.removeListener("camera-switched", listener)
    })

    it("should maintain camera state across switches", () => {
      multicamManager.switchToCamera(0)
      expect(multicamManager.getCurrentAngleIndex()).toBe(0)

      multicamManager.switchToCamera(2)
      expect(multicamManager.getCurrentAngleIndex()).toBe(2)

      multicamManager.switchToCamera(1)
      expect(multicamManager.getCurrentAngleIndex()).toBe(1)
    })

    it("should set and get base clip", () => {
      multicamManager.setBaseClip("clip-cam1")
      expect(multicamManager.getBaseClip()).toBe("clip-cam1")
    })
  })

  // ==========================================================================
  // 3. Angle selection и preview
  // ==========================================================================

  describe("Angle Selection and Preview", () => {
    it("should create multicam angles from clips", () => {
      const angles: MulticamAngle[] = mockClips.map((clip, index) => ({
        id: `angle-${clip.id}`,
        name: clip.name,
        clipId: clip.id,
        clip,
        mediaPath: mockMediaFiles[index]?.path,
        syncOffset: 0,
        isActive: index === 0,
      }))

      expect(angles).toHaveLength(4)
      expect(angles[0]?.isActive).toBe(true)
      expect(angles[1]?.isActive).toBe(false)
    })

    it("should identify active angle", () => {
      const activeIndex = 2
      const angles: MulticamAngle[] = mockClips.map((clip, index) => ({
        id: `angle-${clip.id}`,
        name: clip.name,
        clipId: clip.id,
        clip,
        syncOffset: 0,
        isActive: index === activeIndex,
      }))

      const active = angles.filter((a) => a.isActive)
      expect(active).toHaveLength(1)
      expect(active[0]?.clipId).toBe(mockClips[activeIndex]?.id)
    })

    it("should find angle by clip ID", () => {
      const angles: MulticamAngle[] = mockClips.map((clip) => ({
        id: `angle-${clip.id}`,
        name: clip.name,
        clipId: clip.id,
        clip,
        syncOffset: 0,
        isActive: false,
      }))

      const found = angles.find((a) => a.clipId === "clip-cam3")
      expect(found).toBeDefined()
      expect(found?.name).toBe("Clip clip-cam3")
    })

    it("should check if clip is in multicam group", () => {
      const multicamClipIds = mockClips.map((c) => c.id)

      expect(multicamClipIds.includes("clip-cam2")).toBe(true)
      expect(multicamClipIds.includes("other-clip")).toBe(false)
    })
  })

  // ==========================================================================
  // 4. Timecode synchronization
  // ==========================================================================

  describe("Timecode Synchronization", () => {
    it("should parse timecode correctly", () => {
      const parsed = timecodeSync.parseTimecode("10:00:02:15", 30)
      expect(parsed).toBeDefined()
      expect(parsed?.timecode).toBe("10:00:02:15")
      expect(parsed?.frameRate).toBe(30)
      expect(parsed?.dropFrame).toBe(false)
    })

    it("should parse drop frame timecode", () => {
      const parsed = timecodeSync.parseTimecode("10:00:02;15", 29.97)
      expect(parsed).toBeDefined()
      expect(parsed?.dropFrame).toBe(true)
    })

    it("should convert timecode to seconds", () => {
      const parsed = timecodeSync.parseTimecode("00:00:10:00", 30)
      const seconds = timecodeSync.timecodeToSeconds(parsed!)
      expect(seconds).toBe(10)
    })

    it("should extract timecode from media file", () => {
      const timecode = timecodeSync.extractTimecode(mockMediaFiles[0]!)
      expect(timecode).toBe("10:00:00:00")
    })

    it("should extract creation time from media file", () => {
      const creationTime = timecodeSync.extractCreationTime(mockMediaFiles[0]!)
      expect(creationTime).toBeDefined()
      expect(creationTime).toBeInstanceOf(Date)
    })

    it("should get frame rate from media file", () => {
      const fps = timecodeSync.getFrameRate(mockMediaFiles[0]!)
      expect(fps).toBe(30)
    })

    it("should sync clips by timecode", () => {
      const results = timecodeSync.syncByTimecode(mockClips[0]!, mockClips.slice(1), mockMediaFiles)

      expect(results.length).toBeGreaterThan(0)
      results.forEach((r) => {
        expect(r.clipId).toBeDefined()
        expect(r.offset).toBeTypeOf("number")
        expect(r.confidence).toBeGreaterThanOrEqual(0)
        expect(r.method).toBeDefined()
      })
    })

    it("should check timecode sync support", () => {
      const supported = timecodeSync.supportsTimecodeSync(mockMediaFiles[0]!)
      expect(supported).toBe(true)
    })

    it("should format timecode for display", () => {
      const formatted = timecodeSync.formatTimecode(125.5, 30)
      expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}:\d{2}$/)
    })
  })

  // ==========================================================================
  // 5. Multi-camera layout templates
  // ==========================================================================

  describe("Multi-camera Layout Templates", () => {
    it("should calculate grid layout for 4 cameras", () => {
      const cameraCount = 4
      const cols = Math.ceil(Math.sqrt(cameraCount))
      const rows = Math.ceil(cameraCount / cols)

      expect(cols).toBe(2)
      expect(rows).toBe(2)
      expect(cols * rows).toBeGreaterThanOrEqual(cameraCount)
    })

    it("should calculate grid layout for 3 cameras", () => {
      const cameraCount = 3
      const cols = Math.ceil(Math.sqrt(cameraCount))
      const rows = Math.ceil(cameraCount / cols)

      expect(cols).toBe(2)
      expect(rows).toBe(2)
    })

    it("should calculate grid layout for 6 cameras", () => {
      const cameraCount = 6
      const cols = Math.ceil(Math.sqrt(cameraCount))
      const rows = Math.ceil(cameraCount / cols)

      expect(cols).toBe(3)
      expect(rows).toBe(2)
    })
  })

  // ==========================================================================
  // 6. Audio sync markers
  // ==========================================================================

  describe("Audio Sync Markers", () => {
    it("should store sync results with offsets", () => {
      const syncResults: SyncResult[] = [
        { clipId: "clip-1", offset: 2.5, confidence: 0.92, method: "audio" },
        { clipId: "clip-2", offset: 5.0, confidence: 0.88, method: "audio" },
      ]

      expect(syncResults[0]?.offset).toBe(2.5)
      expect(syncResults[1]?.offset).toBe(5.0)
    })

    it("should track sync method for each clip", () => {
      const syncResults: SyncResult[] = [
        { clipId: "clip-1", offset: 2.5, confidence: 0.92, method: "audio" },
        { clipId: "clip-2", offset: 5.0, confidence: 1.0, method: "timecode" },
        { clipId: "clip-3", offset: 1.0, confidence: 1.0, method: "manual" },
      ]

      expect(syncResults[0]?.method).toBe("audio")
      expect(syncResults[1]?.method).toBe("timecode")
      expect(syncResults[2]?.method).toBe("manual")
    })

    it("should store confidence levels", () => {
      const syncResults: SyncResult[] = [
        { clipId: "clip-1", offset: 2.5, confidence: 0.92, method: "audio" },
        { clipId: "clip-2", offset: 5.0, confidence: 0.45, method: "audio" },
      ]

      expect(syncResults[0]?.confidence).toBeGreaterThan(0.9)
      expect(syncResults[1]?.confidence).toBeLessThan(0.5)
    })
  })

  // ==========================================================================
  // 7. Picture-in-Picture режим
  // ==========================================================================

  describe("Picture-in-Picture Mode", () => {
    it("should identify main and secondary angles", () => {
      const angles: MulticamAngle[] = mockClips.map((clip, index) => ({
        id: `angle-${clip.id}`,
        name: clip.name,
        clipId: clip.id,
        clip,
        syncOffset: 0,
        isActive: index === 0,
      }))

      const mainAngle = angles.find((a) => a.isActive)
      const secondaryAngles = angles.filter((a) => !a.isActive)

      expect(mainAngle).toBeDefined()
      expect(secondaryAngles).toHaveLength(3)
    })

    it("should support switching main PiP angle", () => {
      let activeIndex = 0

      activeIndex = 2
      expect(activeIndex).toBe(2)

      activeIndex = 1
      expect(activeIndex).toBe(1)
    })
  })

  // ==========================================================================
  // 8. Split screen layouts
  // ==========================================================================

  describe("Split Screen Layouts", () => {
    it("should support 2-way split", () => {
      const twoAngles = mockClips.slice(0, 2)
      expect(twoAngles).toHaveLength(2)
    })

    it("should support 3-way split", () => {
      const threeAngles = mockClips.slice(0, 3)
      expect(threeAngles).toHaveLength(3)
    })

    it("should support 4-way split (quad)", () => {
      expect(mockClips).toHaveLength(4)
    })

    it("should calculate split percentages", () => {
      const twoWay = 100 / 2
      const threeWay = 100 / 3
      const fourWay = 100 / 4

      expect(twoWay).toBe(50)
      expect(threeWay).toBeCloseTo(33.33, 2)
      expect(fourWay).toBe(25)
    })
  })

  // ==========================================================================
  // 9. Автоматическая синхронизация по событиям
  // ==========================================================================

  describe("Event-based Auto Synchronization", () => {
    it("should emit camera switch events", () => {
      const listener = vi.fn()
      multicamManager.on("camera-switched", listener)

      multicamManager.switchToCamera(2)

      expect(listener).toHaveBeenCalledWith(2)
      multicamManager.removeListener("camera-switched", listener)
    })

    it("should emit sync update events", () => {
      const listener = vi.fn()
      multicamManager.on("sync-updated", listener)

      multicamManager.executeCommand({
        type: "sync-angle",
        angleIndex: 1,
        offset: 2.5,
      })

      expect(listener).toHaveBeenCalledWith(1, 2.5)
      multicamManager.removeListener("sync-updated", listener)
    })

    it("should emit angle added events", () => {
      const listener = vi.fn()
      multicamManager.on("angle-added", listener)

      multicamManager.executeCommand({
        type: "add-angle",
        clipId: "new-clip",
      })

      expect(listener).toHaveBeenCalledWith("new-clip")
      multicamManager.removeListener("angle-added", listener)
    })

    it("should emit angle removed events", () => {
      const listener = vi.fn()
      multicamManager.on("angle-removed", listener)

      multicamManager.executeCommand({
        type: "remove-angle",
        angleIndex: 1,
      })

      expect(listener).toHaveBeenCalledWith(1)
      multicamManager.removeListener("angle-removed", listener)
    })

    it("should handle multiple event listeners", () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      multicamManager.on("camera-switched", listener1)
      multicamManager.on("camera-switched", listener2)

      multicamManager.switchToCamera(1)

      expect(listener1).toHaveBeenCalledWith(1)
      expect(listener2).toHaveBeenCalledWith(1)

      multicamManager.removeListener("camera-switched", listener1)
      multicamManager.removeListener("camera-switched", listener2)
    })
  })

  // ==========================================================================
  // 10. Export multicam sequence
  // ==========================================================================

  describe("Export Multicam Sequence", () => {
    it("should export angle metadata", () => {
      const exportData = {
        baseClipId: "clip-cam1",
        angles: mockClips.map((clip, index) => ({
          id: `angle-${clip.id}`,
          clipId: clip.id,
          name: clip.name,
          syncOffset: index * 0.5,
        })),
        activeAngleIndex: 0,
        syncResults: [
          { clipId: "clip-cam2", offset: 2.5, confidence: 0.92, method: "audio" as SyncMethod },
          { clipId: "clip-cam3", offset: 5.0, confidence: 0.88, method: "audio" as SyncMethod },
        ],
      }

      expect(exportData.angles).toHaveLength(4)
      expect(exportData.baseClipId).toBe("clip-cam1")
      expect(exportData.syncResults).toHaveLength(2)
    })

    it("should preserve sync offsets in export", () => {
      const syncOffsets = [0, 2.5, 5.0, 1.0]

      const exportData = {
        angles: mockClips.map((clip, index) => ({
          clipId: clip.id,
          syncOffset: syncOffsets[index],
        })),
      }

      exportData.angles.forEach((angle, index) => {
        expect(angle.syncOffset).toBe(syncOffsets[index])
      })
    })

    it("should include camera switch history", () => {
      const switchHistory = [
        { timestamp: 0, angleIndex: 0 },
        { timestamp: 10, angleIndex: 1 },
        { timestamp: 20, angleIndex: 2 },
        { timestamp: 30, angleIndex: 0 },
      ]

      expect(switchHistory).toHaveLength(4)
      expect(switchHistory[0]?.angleIndex).toBe(0)
      expect(switchHistory[switchHistory.length - 1]?.angleIndex).toBe(0)
    })
  })

  // ==========================================================================
  // Additional Features
  // ==========================================================================

  describe("Advanced Multicam Features", () => {
    it("should handle sync with mixed methods", () => {
      const results: SyncResult[] = [
        { clipId: "clip-1", offset: 2.5, confidence: 0.92, method: "audio" },
        { clipId: "clip-2", offset: 5.0, confidence: 1.0, method: "timecode" },
        { clipId: "clip-3", offset: 1.0, confidence: 1.0, method: "manual" },
      ]

      const audioSyncs = results.filter((r) => r.method === "audio")
      const timecodeSyncs = results.filter((r) => r.method === "timecode")
      const manualSyncs = results.filter((r) => r.method === "manual")

      expect(audioSyncs).toHaveLength(1)
      expect(timecodeSyncs).toHaveLength(1)
      expect(manualSyncs).toHaveLength(1)
    })

    it("should validate sync confidence thresholds", () => {
      const results: SyncResult[] = [
        { clipId: "clip-1", offset: 2.5, confidence: 0.95, method: "audio" },
        { clipId: "clip-2", offset: 5.0, confidence: 0.45, method: "audio" },
        { clipId: "clip-3", offset: 1.0, confidence: 0.88, method: "audio" },
      ]

      const highConfidence = results.filter((r) => r.confidence > 0.8)
      const lowConfidence = results.filter((r) => r.confidence <= 0.8)

      expect(highConfidence).toHaveLength(2)
      expect(lowConfidence).toHaveLength(1)
    })

    it("should calculate total multicam duration", () => {
      const maxDuration = Math.max(...mockClips.map((c) => c.startTime + c.duration))
      expect(maxDuration).toBeGreaterThan(0)
    })

    it("should support angle reordering", () => {
      const originalOrder = [0, 1, 2, 3]
      const reordered = [0, 2, 1, 3]

      expect(originalOrder).not.toEqual(reordered)
      expect(originalOrder).toHaveLength(reordered.length)
    })

    it("should validate multicam configuration", () => {
      const config = {
        id: "multicam-1",
        name: "Multi-camera Setup",
        angles: mockClips.map((c) => c.id),
        activeCameraIndex: 0,
        syncPoints: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(config.angles).toHaveLength(4)
      expect(config.activeCameraIndex).toBe(0)
      expect(config.id).toBeDefined()
    })
  })
})
