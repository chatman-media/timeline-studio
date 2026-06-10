/**
 * @vitest-environment jsdom
 */
/**
 * Tests for useAdvancedPersonIdentification hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAdvancedPersonIdentification } from "@/features/person-identification/hooks/use-advanced-person-identification"

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Mock services
const mockPersonService = {
  initialize: vi.fn(),
  createPerson: vi.fn(),
  searchPersonsByEmbedding: vi.fn(),
  clusterUnidentifiedFaces: vi.fn(),
  addAppearance: vi.fn(),
}

const mockDetectionService = {
  initialize: vi.fn(),
  detectFacesAdvanced: vi.fn(),
  generateFaceEmbedding: vi.fn(),
  blurFaces: vi.fn(),
}

const mockTrackingService = {
  initialize: vi.fn(),
  startTracking: vi.fn(),
  processFrame: vi.fn(),
  stopTracking: vi.fn(),
  exportTracksAsAppearances: vi.fn(),
  assignPersonToTrack: vi.fn(),
}

vi.mock("@timeline-studio/core/services", () => ({
  PersonDatabaseService: {
    getInstance: () => mockPersonService,
  },
  AdvancedFaceDetectionService: {
    getInstance: () => mockDetectionService,
  },
  AdvancedTrackingService: {
    getInstance: () => mockTrackingService,
  },
}))

describe("useAdvancedPersonIdentification", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPersonService.initialize.mockResolvedValue(undefined)
    mockDetectionService.initialize.mockResolvedValue(undefined)
    mockTrackingService.initialize.mockResolvedValue(undefined)
  })

  describe("Initialization", () => {
    it("should initialize all services on mount", async () => {
      renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(mockPersonService.initialize).toHaveBeenCalled()
        expect(mockDetectionService.initialize).toHaveBeenCalled()
      })
    })

    it("should initialize tracking service when enabled", async () => {
      renderHook(() => useAdvancedPersonIdentification({ enableTracking: true }))

      await waitFor(() => {
        expect(mockTrackingService.initialize).toHaveBeenCalled()
      })
    })

    it("should not initialize tracking service when disabled", async () => {
      renderHook(() => useAdvancedPersonIdentification({ enableTracking: false }))

      await waitFor(() => {
        expect(mockPersonService.initialize).toHaveBeenCalled()
      })

      expect(mockTrackingService.initialize).not.toHaveBeenCalled()
    })

    it("should handle initialization errors", async () => {
      mockPersonService.initialize.mockRejectedValueOnce(new Error("Init failed"))

      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })
    })
  })

  describe("analyzeVideo", () => {
    it("should analyze video with face detection", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          embedding: new Float32Array([0.1, 0.2, 0.3]),
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)

      const { result } = renderHook(() =>
        useAdvancedPersonIdentification({
          enableTracking: false,
          autoIdentify: false,
        }),
      )

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      let analysisResult: any = null
      await act(async () => {
        analysisResult = await result.current.analyzeVideo("video-path", {
          startTime: 0,
          endTime: 10,
          skipFrames: 5,
        })
      })

      expect(result.current.isAnalyzing).toBe(false)
      expect(analysisResult).toBeDefined()
    })

    it("should handle auto-identification when enabled", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          embedding: new Float32Array([0.1, 0.2, 0.3]),
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      const mockPerson = {
        id: "person-1",
        name: "Test Person",
        isVerified: true,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 0,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 0 },
        tags: [],
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)
      mockPersonService.searchPersonsByEmbedding.mockResolvedValue([
        {
          person: mockPerson,
          similarity: 0.95,
          matches: [],
        },
      ])

      const { result } = renderHook(() =>
        useAdvancedPersonIdentification({
          enableTracking: false,
          autoIdentify: true,
        }),
      )

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      await act(async () => {
        await result.current.analyzeVideo("video-path")
      })

      await waitFor(() => {
        expect(result.current.identifiedPersons.size).toBeGreaterThan(0)
      })
    })

    it("should track faces when tracking enabled", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          embedding: new Float32Array([0.1, 0.2, 0.3]),
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)
      mockTrackingService.startTracking.mockResolvedValue(undefined)
      mockTrackingService.processFrame.mockResolvedValue({
        tracks: [],
        newTracks: [],
        deletedTracks: [],
        statistics: {
          totalTracks: 0,
          activeTracks: 0,
          confirmedTracks: 0,
          tentativeTracks: 0,
          deletedTracks: 0,
          averageTrackAge: 0,
          averageConfidence: 0,
          processingTime: 0,
        },
      })
      mockTrackingService.stopTracking.mockResolvedValue(undefined)
      mockTrackingService.exportTracksAsAppearances.mockResolvedValue([])

      const { result } = renderHook(() =>
        useAdvancedPersonIdentification({
          enableTracking: true,
        }),
      )

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      await act(async () => {
        await result.current.analyzeVideo("video-path")
      })

      expect(mockTrackingService.startTracking).toHaveBeenCalled()
      expect(mockTrackingService.stopTracking).toHaveBeenCalled()
    })

    it("should cluster unidentified faces when enabled", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          embedding: new Float32Array([0.1, 0.2, 0.3]),
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
        {
          id: "face-2",
          bbox: { x: 200, y: 200, width: 50, height: 50 },
          confidence: 0.9,
          embedding: new Float32Array([0.11, 0.21, 0.31]),
          timestamp: { seconds: 2 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)
      mockPersonService.clusterUnidentifiedFaces.mockResolvedValue([])

      const { result } = renderHook(() =>
        useAdvancedPersonIdentification({
          enableTracking: false,
          autoCluster: true,
          clusterThreshold: 0.8,
        }),
      )

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      await act(async () => {
        await result.current.analyzeVideo("video-path")
      })

      expect(mockPersonService.clusterUnidentifiedFaces).toHaveBeenCalledWith(expect.any(Array), 0.8)
    })

    it("should update progress during analysis", async () => {
      mockDetectionService.detectFacesAdvanced.mockResolvedValue([])

      const { result } = renderHook(() => useAdvancedPersonIdentification({ enableTracking: false }))

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      const progressUpdates: number[] = []
      await act(async () => {
        await result.current.analyzeVideo("video-path", {
          onProgress: (progress) => progressUpdates.push(progress),
        })
      })

      expect(progressUpdates.length).toBeGreaterThan(0)
    })

    it("should handle analysis errors", async () => {
      mockDetectionService.detectFacesAdvanced.mockRejectedValue(new Error("Detection failed"))

      const { result } = renderHook(() => useAdvancedPersonIdentification({ enableTracking: false }))

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.analyzeVideo("video-path")
        }),
      ).rejects.toThrow()

      expect(result.current.error).toBeDefined()
    })
  })

  describe("applyPrivacyBlur", () => {
    it("should blur unidentified faces", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)
      mockDetectionService.blurFaces.mockResolvedValue("blurred-image-data")

      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      let blurredImage: string = ""
      await act(async () => {
        blurredImage = await result.current.applyPrivacyBlur("image-data", {
          blurIntensity: 10,
          blurType: "gaussian",
        })
      })

      expect(blurredImage).toBe("blurred-image-data")
      expect(mockDetectionService.blurFaces).toHaveBeenCalled()
    })

    it("should not blur identified faces", async () => {
      const mockFaces = [
        {
          id: "face-1",
          personId: "person-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)
      mockDetectionService.blurFaces.mockResolvedValue("image-data") // No blur

      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      let blurredImage: string = ""
      await act(async () => {
        blurredImage = await result.current.applyPrivacyBlur("image-data")
      })

      // Should not blur since face is identified
      expect(blurredImage).toBe("image-data")
    })
  })

  describe("findSimilarPersonsByImage", () => {
    it("should find similar persons from image", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          embedding: new Float32Array([0.1, 0.2, 0.3]),
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      const mockSearchResults = [
        {
          person: {
            id: "person-1",
            name: "Test Person",
            isVerified: true,
            faceEmbeddings: [],
            appearances: [],
            totalScreenTime: 0,
            firstSeen: { seconds: 0 },
            lastSeen: { seconds: 0 },
            tags: [],
            thumbnails: [],
            privacy: {
              blurFace: false,
              hideFromSearch: false,
              anonymize: false,
              blurIntensity: 5,
              blurTracking: true,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          similarity: 0.95,
          matches: [],
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)
      mockPersonService.searchPersonsByEmbedding.mockResolvedValue(mockSearchResults)

      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      let searchResults: any[] = []
      await act(async () => {
        searchResults = await result.current.findSimilarPersonsByImage("image-data", {
          limit: 5,
          minConfidence: 0.7,
        })
      })

      expect(searchResults).toHaveLength(1)
      expect(searchResults[0].person.name).toBe("Test Person")
    })

    it("should handle no faces detected", async () => {
      mockDetectionService.detectFacesAdvanced.mockResolvedValue([])

      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      let searchResults: any[] = []
      await act(async () => {
        searchResults = await result.current.findSimilarPersonsByImage("image-data")
      })

      expect(searchResults).toEqual([])
    })
  })

  describe("createPersonFromFace", () => {
    it("should create person from detected face", async () => {
      const mockPerson = {
        id: "person-1",
        name: "New Person",
        isVerified: true,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 0,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 0 },
        tags: [],
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockPersonService.createPerson.mockResolvedValue(mockPerson)

      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      const mockFace = {
        id: "face-1",
        bbox: { x: 100, y: 100, width: 50, height: 50 },
        confidence: 0.95,
        embedding: new Float32Array([0.1, 0.2, 0.3]),
        timestamp: { seconds: 1 },
        blur: 0.1,
        occlusion: 0.05,
        pose: { yaw: 0, pitch: 0, roll: 0 },
      }

      let createdPerson: any = null
      await act(async () => {
        createdPerson = await result.current.createPersonFromFace(mockFace, {
          name: "New Person",
          tags: ["actor"],
        })
      })

      expect(createdPerson).toBeDefined()
      expect(createdPerson.name).toBe("New Person")
      expect(mockPersonService.createPerson).toHaveBeenCalled()
    })
  })

  describe("clearAnalysis", () => {
    it("should reset analysis state", async () => {
      const { result } = renderHook(() => useAdvancedPersonIdentification())

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      act(() => {
        result.current.clearAnalysis()
      })

      expect(result.current.detectedFaces).toEqual([])
      expect(result.current.trackedPersons).toEqual([])
      expect(result.current.identifiedPersons.size).toBe(0)
      expect(result.current.statistics.totalFaces).toBe(0)
    })
  })

  describe("State management", () => {
    it("should track processing state", async () => {
      mockDetectionService.detectFacesAdvanced.mockResolvedValue([])

      const { result } = renderHook(() => useAdvancedPersonIdentification({ enableTracking: false }))

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      const analyzePromise = act(async () => {
        await result.current.analyzeVideo("video-path")
      })

      // During analysis, isAnalyzing should be true at some point
      await analyzePromise

      expect(result.current.isAnalyzing).toBe(false)
    })

    it("should accumulate statistics", async () => {
      const mockFaces = [
        {
          id: "face-1",
          bbox: { x: 100, y: 100, width: 50, height: 50 },
          confidence: 0.95,
          embedding: new Float32Array([0.1, 0.2, 0.3]),
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
        },
      ]

      mockDetectionService.detectFacesAdvanced.mockResolvedValue(mockFaces)

      const { result } = renderHook(() => useAdvancedPersonIdentification({ enableTracking: false }))

      await waitFor(() => {
        expect(result.current.isProcessing).toBe(false)
      })

      await act(async () => {
        await result.current.analyzeVideo("video-path")
      })

      expect(result.current.statistics.totalFaces).toBeGreaterThan(0)
    })
  })
})
