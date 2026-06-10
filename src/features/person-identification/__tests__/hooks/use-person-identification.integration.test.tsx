/**
 * @vitest-environment jsdom
 */
/**
 * Integration tests for usePersonIdentification hook
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PersonDatabaseService } from "@timeline-studio/core/services"
import { usePersonIdentification } from "@/features/person-identification/hooks/use-person-identification"
import type { PersonProfile } from "@/features/person-identification/types/person"

// Mock PersonDatabaseService
vi.mock("@timeline-studio/core/services", () => {
  const mockService = {
    getInstance: vi.fn(),
    getAllPersons: vi.fn(),
    addPerson: vi.fn(),
    updatePerson: vi.fn(),
    deletePerson: vi.fn(),
    searchPersons: vi.fn(),
    addEmbedding: vi.fn(),
    addAppearance: vi.fn(),
    findSimilarPersons: vi.fn(),
    clusterUnidentifiedFaces: vi.fn(),
    addPersonThumbnail: vi.fn(),
  }

  return {
    PersonDatabaseService: {
      getInstance: () => mockService,
    },
  }
})

describe("usePersonIdentification - Integration", () => {
  let mockService: ReturnType<typeof PersonDatabaseService.getInstance>

  const mockPerson: PersonProfile = {
    id: "person-1",
    name: "Test Person",
    isVerified: true,
    faceEmbeddings: [],
    appearances: [],
    totalScreenTime: 120,
    firstSeen: { seconds: 0 },
    lastSeen: { seconds: 120 },
    tags: ["actor"],
    notes: "Test notes",
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

  beforeEach(() => {
    mockService = PersonDatabaseService.getInstance()
    vi.clearAllMocks()
  })

  describe("Loading persons", () => {
    it("should load persons on mount", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockService.getAllPersons).toHaveBeenCalled()
    })

    it("should handle loading errors", async () => {
      vi.mocked(mockService.getAllPersons).mockRejectedValue(new Error("Load failed"))

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка загрузки персон")
        expect(result.current.isLoading).toBe(false)
      })
    })

    it("should reload persons when loadPersons is called", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      // Add another person
      const person2 = { ...mockPerson, id: "person-2", name: "Person 2" }
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson, person2])

      await act(async () => {
        await result.current.loadPersons()
      })

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(2)
      })
    })
  })

  describe("Adding persons", () => {
    it("should add a new person", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])
      vi.mocked(mockService.addPerson).mockResolvedValue(mockPerson)

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      await act(async () => {
        await result.current.addPerson({
          name: "Test Person",
          description: "Test notes",
          tags: ["actor"],
        })
      })

      expect(mockService.addPerson).toHaveBeenCalled()
    })

    it("should reload persons after adding with autoSave", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValueOnce([]).mockResolvedValueOnce([mockPerson])
      vi.mocked(mockService.addPerson).mockResolvedValue(mockPerson)

      const { result } = renderHook(() => usePersonIdentification({ autoSave: true }))

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      await act(async () => {
        await result.current.addPerson({ name: "Test" })
      })

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })
    })

    it("should not reload persons after adding without autoSave", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])
      vi.mocked(mockService.addPerson).mockResolvedValue(mockPerson)

      const { result } = renderHook(() => usePersonIdentification({ autoSave: false }))

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      await act(async () => {
        await result.current.addPerson({ name: "Test" })
      })

      // getAllPersons should only be called once (initial load)
      expect(mockService.getAllPersons).toHaveBeenCalledTimes(1)
    })

    it("should handle add person errors", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])
      vi.mocked(mockService.addPerson).mockRejectedValue(new Error("Add failed"))

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      await act(async () => {
        try {
          await result.current.addPerson({ name: "Test" })
        } catch (e) {
          // Ignore expected error
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка добавления персоны")
      })
    })
  })

  describe("Updating persons", () => {
    it("should update an existing person", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])
      vi.mocked(mockService.updatePerson).mockResolvedValue(null)

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      await act(async () => {
        await result.current.updatePerson("person-1", { name: "Updated Name" })
      })

      expect(mockService.updatePerson).toHaveBeenCalledWith("person-1", {
        name: "Updated Name",
      })
    })

    it("should handle update errors", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])
      vi.mocked(mockService.updatePerson).mockRejectedValue(new Error("Update failed"))

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      await act(async () => {
        try {
          await result.current.updatePerson("person-1", { name: "Updated" })
        } catch (e) {
          // Ignore expected error
        }
      })

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка обновления персоны")
      })
    })
  })

  describe("Deleting persons", () => {
    it("should delete a person", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValueOnce([mockPerson]).mockResolvedValueOnce([])
      vi.mocked(mockService.deletePerson).mockResolvedValue(true)

      const { result } = renderHook(() => usePersonIdentification({ autoSave: true }))

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      await act(async () => {
        await result.current.deletePerson("person-1")
      })

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })
    })
  })

  describe("Searching persons", () => {
    it("should search persons by query", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])
      vi.mocked(mockService.searchPersons).mockResolvedValue([mockPerson])

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      let searchResults: PersonProfile[] = []
      await act(async () => {
        searchResults = await result.current.searchPersons("Test")
      })

      expect(searchResults).toHaveLength(1)
      expect(mockService.searchPersons).toHaveBeenCalledWith("Test", undefined)
    })

    it("should search with options", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])
      vi.mocked(mockService.searchPersons).mockResolvedValue([mockPerson])

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      await act(async () => {
        await result.current.searchPersons("Test", {
          tags: ["actor"],
          limit: 10,
        })
      })

      expect(mockService.searchPersons).toHaveBeenCalledWith("Test", {
        tags: ["actor"],
        limit: 10,
      })
    })
  })

  describe("Face identification", () => {
    it("should identify person from face", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])
      vi.mocked(mockService.findSimilarPersons).mockResolvedValue([
        {
          person: mockPerson,
          similarity: 0.95,
          matches: [],
        },
      ])

      const { result } = renderHook(() => usePersonIdentification({ confidenceThreshold: 0.7 }))

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      let identifiedPerson: {
        person: PersonProfile
        confidence: number
      } | null = null
      await act(async () => {
        identifiedPerson = await result.current.identifyPerson({
          id: "face-1",
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.9,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0.1, 0.2, 0.3]),
        })
      })

      expect(identifiedPerson).not.toBeNull()
      expect(identifiedPerson!.person.id).toBe("person-1")
      expect(identifiedPerson!.confidence).toBe(0.95)
    })

    it("should return null if no embedding provided", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      let identifiedPerson: {
        person: PersonProfile
        confidence: number
      } | null = null
      await act(async () => {
        identifiedPerson = await result.current.identifyPerson({
          id: "face-1",
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.9,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          // No embedding
        })
      })

      expect(identifiedPerson).toBeNull()
    })

    it("should return null if confidence below threshold", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([mockPerson])
      vi.mocked(mockService.findSimilarPersons).mockResolvedValue([])

      const { result } = renderHook(() => usePersonIdentification({ confidenceThreshold: 0.9 }))

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      let identifiedPerson: {
        person: PersonProfile
        confidence: number
      } | null = null
      await act(async () => {
        identifiedPerson = await result.current.identifyPerson({
          id: "face-1",
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.9,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0.1, 0.2, 0.3]),
        })
      })

      expect(identifiedPerson).toBeNull()
    })
  })

  describe("Creating person from face", () => {
    it("should create person and add embedding", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])
      vi.mocked(mockService.addPerson).mockResolvedValue(mockPerson)
      vi.mocked(mockService.addEmbedding).mockResolvedValue(true)

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      let newPerson: PersonProfile | null = null
      await act(async () => {
        newPerson = await result.current.createPersonFromFace(
          {
            id: "face-1",
            bbox: { x: 0, y: 0, width: 100, height: 100 },
            confidence: 0.9,
            timestamp: { seconds: 1 },
            frameNumber: 30,
            clipId: "clip-1",
            blur: 0.1,
            occlusion: 0.05,
            pose: { yaw: 0, pitch: 0, roll: 0 },
            embedding: new Float32Array([0.1, 0.2, 0.3]),
            thumbnailUrl: "http://example.com/thumb.jpg",
          },
          {
            name: "New Person",
            description: "Created from face",
            tags: ["new"],
          },
        )
      })

      expect(newPerson).toBeDefined()
      expect(mockService.addEmbedding).toHaveBeenCalled()
    })
  })

  describe("Face clustering", () => {
    it("should cluster unknown faces", async () => {
      vi.mocked(mockService.getAllPersons).mockResolvedValue([])
      vi.mocked(mockService.clusterUnidentifiedFaces).mockResolvedValue([mockPerson])

      const { result } = renderHook(() => usePersonIdentification({ autoSave: true }))

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(0)
      })

      const faces = [
        {
          id: "face-1",
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.9,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0.1, 0.2, 0.3]),
        },
        {
          id: "face-2",
          bbox: { x: 10, y: 10, width: 100, height: 100 },
          confidence: 0.85,
          timestamp: { seconds: 2 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0.11, 0.21, 0.31]),
        },
      ]

      let clusters: PersonProfile[] = []
      await act(async () => {
        clusters = await result.current.clusterUnknownFaces(faces, 0.8)
      })

      expect(clusters).toHaveLength(1)
      expect(mockService.clusterUnidentifiedFaces).toHaveBeenCalledWith(faces, 0.8)
    })
  })

  describe("Statistics", () => {
    it("should calculate correct statistics", async () => {
      const person1 = {
        ...mockPerson,
        id: "person-1",
        faceEmbeddings: [{ vector: new Float32Array(5) } as any],
      }
      const person2 = {
        ...mockPerson,
        id: "person-2",
        faceEmbeddings: [{ vector: new Float32Array(5) } as any, { vector: new Float32Array(5) } as any],
        appearances: [{ id: "app-1" } as any, { id: "app-2" } as any],
      }

      vi.mocked(mockService.getAllPersons).mockResolvedValue([person1, person2])

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(2)
      })

      const stats = result.current.getStatistics()

      expect(stats.totalPersons).toBe(2)
      expect(stats.totalFaces).toBe(3)
      expect(stats.totalAppearances).toBe(2)
      expect(stats.averageFacesPerPerson).toBe(1.5)
    })
  })

  describe("Error clearing", () => {
    it("should clear errors", async () => {
      vi.mocked(mockService.getAllPersons).mockRejectedValue(new Error("Load failed"))

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.error).toBe("Ошибка загрузки персон")
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})
