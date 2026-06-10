/**
 * Tests for Advanced Tracking Service
 */

import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AdvancedTrackingService } from "@/domains/ai-services/services/person-identification"
import type { DetectedFace } from "@/features/person-identification/types/person"

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

vi.mock("@timeline-studio/core/container", () => ({
  getAI: () => ({
    initAdvancedTracking: (config: Record<string, unknown>) => mockInvoke("init_advanced_tracking", { config }),
    startPersonTracking: (options: Record<string, unknown>) => mockInvoke("start_person_tracking", options),
    processTrackingFrame: (options: Record<string, unknown>) => mockInvoke("process_tracking_frame", options),
    predictTrackPositions: (trackIds: string[]) => mockInvoke("predict_track_positions", { trackIds }),
    assignPersonToTrack: (trackId: string, personId: string) =>
      mockInvoke("assign_person_to_track", { trackId, personId }),
    mergeTracks: (sourceTrackId: string, targetTrackId: string) =>
      mockInvoke("merge_tracks", { sourceTrackId, targetTrackId }),
    interpolateTrackPositions: (options: Record<string, unknown>) => mockInvoke("interpolate_track_positions", options),
    stopPersonTracking: () => mockInvoke("stop_person_tracking"),
    updateTrackingConfig: (config: Record<string, unknown>) => mockInvoke("update_tracking_config", { config }),
    cleanupTracking: () => mockInvoke("cleanup_tracking"),
  }),
}))

describe("AdvancedTrackingService", () => {
  let service: AdvancedTrackingService

  const mockDetection: DetectedFace = {
    id: "face-1",
    bbox: { x: 100, y: 150, width: 200, height: 250 },
    confidence: 0.95,
    timestamp: { seconds: 1.5 },
    frameNumber: 45,
    blur: 0.1,
    occlusion: 0.05,
    pose: { yaw: 0, pitch: 0, roll: 0 },
    embedding: new Float32Array([0.1, 0.2, 0.3]),
  }

  const mockTrackingResult = {
    tracks: [
      {
        id: "track-1",
        box: { x: 105, y: 155, width: 200, height: 250 },
        state: "confirmed",
        confidence: 0.92,
        features: [0.1, 0.2, 0.3],
      },
    ],
    newTracks: [],
    deletedTracks: [],
    statistics: {
      totalTracks: 1,
      activeTracks: 1,
      confirmedTracks: 1,
      tentativeTracks: 0,
      deletedTracks: 0,
      averageTrackAge: 10,
      averageConfidence: 0.92,
      processingTime: 15,
    },
  }

  beforeEach(() => {
    // Reset singleton instance before each test
    ;(AdvancedTrackingService as any).instance = undefined
    service = AdvancedTrackingService.getInstance({ algorithm: "deepsort" })
    vi.clearAllMocks()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = AdvancedTrackingService.getInstance()
      const instance2 = AdvancedTrackingService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("initialize", () => {
    it("should initialize tracking service", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)

      await service.initialize()

      expect(invoke).toHaveBeenCalledWith("init_advanced_tracking", {
        config: expect.objectContaining({
          algorithm: "deepsort",
        }),
      })
    })

    it("should handle initialization errors", async () => {
      // Reset singleton to ensure clean state
      ;(AdvancedTrackingService as any).instance = undefined
      service = AdvancedTrackingService.getInstance()
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Initialization failed"))

      await expect(service.initialize()).rejects.toThrow("Initialization failed")
    })
  })

  describe("startTracking", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should start tracking for video", async () => {
      await service.startTracking("video-1")

      expect(invoke).toHaveBeenCalledWith("start_person_tracking", {
        videoId: "video-1",
        config: expect.any(Object),
      })
    })

    it("should throw error if tracking already started", async () => {
      await service.startTracking("video-1")

      await expect(service.startTracking("video-2")).rejects.toThrow("Трекинг уже запущен")
    })
  })

  describe("processFrame", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.clearAllMocks()
    })

    it("should process frame with detections", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)

      const result = await service.processFrame([mockDetection], 45, 1.5)

      expect(result.frameNumber).toBe(45)
      expect(result.timestamp).toBe(1.5)
      expect(result.tracks).toHaveLength(1)
      expect(invoke).toHaveBeenCalledWith("process_tracking_frame", {
        detections: expect.arrayContaining([
          expect.objectContaining({
            id: "face-1",
            bbox: mockDetection.bbox,
          }),
        ]),
        frameNumber: 45,
        timestamp: 1.5,
        frameImage: undefined,
      })
    })

    it("should throw error if tracking not started", async () => {
      await service.stopTracking()

      await expect(service.processFrame([mockDetection], 45, 1.5)).rejects.toThrow("Трекинг не запущен")
    })

    it("should handle new tracks", async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        ...mockTrackingResult,
        tracks: [
          ...mockTrackingResult.tracks,
          {
            id: "track-2",
            box: { x: 200, y: 200, width: 100, height: 100 },
            state: "tentative",
            confidence: 0.7,
            features: [0.2, 0.3, 0.4],
          },
        ],
        newTracks: ["track-2"],
      })

      const result = await service.processFrame([mockDetection], 45, 1.5)

      expect(result.newTracks).toContain("track-2")
    })

    it("should handle deleted tracks", async () => {
      // First create a track
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)

      // Then delete it
      vi.mocked(invoke).mockResolvedValueOnce({
        tracks: [],
        newTracks: [],
        deletedTracks: ["track-1"],
        statistics: mockTrackingResult.statistics,
      })

      const result = await service.processFrame([], 46, 1.6)

      expect(result.deletedTracks).toContain("track-1")
    })
  })

  describe("predictNextPositions", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.clearAllMocks()
    })

    it("should predict next positions for tracks", async () => {
      // Create a track first
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)

      // Mock prediction
      vi.mocked(invoke).mockResolvedValueOnce([
        {
          trackId: "track-1",
          box: { x: 110, y: 160, width: 200, height: 250 },
        },
      ])

      const predictions = await service.predictNextPositions()

      expect(predictions.size).toBe(1)
      expect(predictions.get("track-1")).toBeDefined()
    })

    it("should fallback to linear extrapolation on error", async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Prediction failed"))

      const predictions = await service.predictNextPositions()

      expect(predictions).toBeInstanceOf(Map)
    })
  })

  describe("assignPersonToTrack", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      // Create a track
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)
      vi.clearAllMocks()
    })

    it("should assign person to track", async () => {
      await service.assignPersonToTrack("track-1", "person-1")

      expect(invoke).toHaveBeenCalledWith("assign_person_to_track", {
        trackId: "track-1",
        personId: "person-1",
      })
    })

    it("should throw error for non-existent track", async () => {
      await expect(service.assignPersonToTrack("track-999", "person-1")).rejects.toThrow("Трек track-999 не найден")
    })
  })

  describe("mergeTracks", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      // Create two tracks
      vi.mocked(invoke).mockResolvedValueOnce({
        tracks: [
          { id: "track-1", box: { x: 100, y: 100, width: 50, height: 50 }, state: "confirmed", confidence: 0.9 },
          { id: "track-2", box: { x: 120, y: 120, width: 50, height: 50 }, state: "confirmed", confidence: 0.85 },
        ],
        newTracks: ["track-1", "track-2"],
        deletedTracks: [],
        statistics: mockTrackingResult.statistics,
      })
      await service.processFrame([mockDetection], 45, 1.5)
      vi.clearAllMocks()
    })

    it("should merge two tracks", async () => {
      await service.mergeTracks("track-2", "track-1")

      expect(invoke).toHaveBeenCalledWith("merge_tracks", {
        sourceTrackId: "track-2",
        targetTrackId: "track-1",
      })
      expect(service.getTrack("track-2")).toBeUndefined()
    })

    it("should throw error if track not found", async () => {
      await expect(service.mergeTracks("track-999", "track-1")).rejects.toThrow("Один из треков не найден")
    })
  })

  describe("getTrack", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)
    })

    it("should return track by id", () => {
      const track = service.getTrack("track-1")
      expect(track).toBeDefined()
      expect(track?.trackId).toBe("track-1")
    })

    it("should return undefined for non-existent track", () => {
      const track = service.getTrack("track-999")
      expect(track).toBeUndefined()
    })
  })

  describe("getActiveTracks", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)
    })

    it("should return all active tracks", () => {
      const tracks = service.getActiveTracks()
      expect(tracks).toHaveLength(1)
      expect(tracks[0].state.state).not.toBe("deleted")
    })
  })

  describe("getTracksForPerson", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)
      vi.clearAllMocks()
      await service.assignPersonToTrack("track-1", "person-1")
    })

    it("should return tracks for specific person", () => {
      const tracks = service.getTracksForPerson("person-1")
      expect(tracks).toHaveLength(1)
      expect(tracks[0].personId).toBe("person-1")
    })

    it("should return empty array for person with no tracks", () => {
      const tracks = service.getTracksForPerson("person-999")
      expect(tracks).toHaveLength(0)
    })
  })

  describe("interpolateMissingPositions", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)
      vi.clearAllMocks()
    })

    it("should interpolate missing track positions", async () => {
      const interpolatedPoints = [
        {
          frameNumber: 46,
          timestamp: 1.533,
          box: { x: 103, y: 153, width: 200, height: 250 },
          confidence: 0.9,
          isInterpolated: true,
        },
        {
          frameNumber: 47,
          timestamp: 1.566,
          box: { x: 106, y: 156, width: 200, height: 250 },
          confidence: 0.9,
          isInterpolated: true,
        },
      ]

      vi.mocked(invoke).mockResolvedValueOnce(interpolatedPoints)

      const result = await service.interpolateMissingPositions("track-1", 45, 48)

      expect(result).toHaveLength(2)
      expect(result[0].isInterpolated).toBe(true)
    })

    it("should throw error for non-existent track", async () => {
      await expect(service.interpolateMissingPositions("track-999", 45, 48)).rejects.toThrow("Трек track-999 не найден")
    })
  })

  describe("exportTracksAsAppearances", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.mocked(invoke).mockResolvedValueOnce(mockTrackingResult)
      await service.processFrame([mockDetection], 45, 1.5)
      await service.assignPersonToTrack("track-1", "person-1")
    })

    it("should export tracks as appearances", async () => {
      const appearances = await service.exportTracksAsAppearances()

      expect(appearances).toHaveLength(1)
      expect(appearances[0].personId).toBe("person-1")
      expect(appearances[0].detections.length).toBeGreaterThan(0)
    })

    it("should skip tracks without person id", async () => {
      // Create track without person
      vi.mocked(invoke).mockResolvedValueOnce({
        tracks: [
          { id: "track-2", box: { x: 100, y: 100, width: 50, height: 50 }, state: "confirmed", confidence: 0.9 },
        ],
        newTracks: ["track-2"],
        deletedTracks: [],
        statistics: mockTrackingResult.statistics,
      })
      await service.processFrame([mockDetection], 46, 1.6)

      const appearances = await service.exportTracksAsAppearances()

      expect(appearances).toHaveLength(1) // Only track-1 with person-1
    })
  })

  describe("stopTracking", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.clearAllMocks()
    })

    it("should stop tracking", async () => {
      await service.stopTracking()

      expect(invoke).toHaveBeenCalledWith("stop_person_tracking")
    })

    it("should not call invoke if tracking not started", async () => {
      await service.stopTracking()
      vi.clearAllMocks()

      await service.stopTracking()

      expect(invoke).not.toHaveBeenCalled()
    })
  })

  describe("updateConfig", () => {
    beforeEach(async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      vi.clearAllMocks()
    })

    it("should update tracking configuration", async () => {
      await service.updateConfig({
        maxAge: 50,
        minHits: 5,
        iouThreshold: 0.4,
      })

      expect(invoke).toHaveBeenCalledWith("update_tracking_config", {
        config: expect.objectContaining({
          maxAge: 50,
          minHits: 5,
          iouThreshold: 0.4,
        }),
      })
    })
  })

  describe("addEventListener/removeEventListener", () => {
    it("should add and remove event listeners", () => {
      const listener = vi.fn()

      service.addEventListener(listener)
      service.removeEventListener(listener)

      // Shouldn't have any effect since listener was removed
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe("cleanup", () => {
    it("should cleanup tracking resources", async () => {
      vi.mocked(invoke).mockResolvedValue(undefined)
      await service.initialize()
      await service.startTracking("video-1")
      vi.clearAllMocks()

      await service.cleanup()

      expect(invoke).toHaveBeenCalledWith("stop_person_tracking")
      expect(invoke).toHaveBeenCalledWith("cleanup_tracking")
    })
  })
})
