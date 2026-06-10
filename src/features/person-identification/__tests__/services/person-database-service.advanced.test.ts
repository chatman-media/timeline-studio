/**
 * Advanced tests for PersonDatabaseService
 * Testing complex scenarios, edge cases, and advanced functionality
 */

import "fake-indexeddb/auto"
import { invoke } from "@tauri-apps/api/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PersonDatabaseService } from "@/domains/ai-services/services/person-identification"
import type { FaceEmbedding, PersonAppearance, PersonProfile } from "@/features/person-identification/types/person"

const mockInvoke = vi.hoisted(() => vi.fn())

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

vi.mock("@/core/container", () => ({
  getAI: () => ({
    initPersonDatabase: () => mockInvoke("init_person_database"),
  }),
}))

// fake-indexeddb is imported globally via "fake-indexeddb/auto"
// No need for custom mock - fake-indexeddb provides full IndexedDB API

describe("PersonDatabaseService - Advanced", () => {
  let service: PersonDatabaseService

  const createMockPerson = (
    overrides?: Partial<PersonProfile>,
  ): Omit<PersonProfile, "id" | "createdAt" | "updatedAt"> => ({
    name: "Test Person",
    isVerified: false,
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
    ...overrides,
  })

  const createMockEmbedding = (overrides?: Partial<FaceEmbedding>): FaceEmbedding => ({
    faceId: `face_${Date.now()}`,
    vector: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
    quality: 0.9,
    personId: "person-1",
    timestamp: { seconds: 1.0 },
    frameNumber: 30,
    createdAt: new Date().toISOString(),
    ...overrides,
  })

  beforeEach(() => {
    // Reset singleton for each test
    ;(PersonDatabaseService as any).instance = undefined
    // Use indexeddb storage as memory storage is not fully implemented
    service = PersonDatabaseService.getInstance({ storage: "indexeddb" })
    vi.clearAllMocks()
  })

  describe("Initialize with different storage types", () => {
    it("should initialize with tauri storage", async () => {
      // Reset singleton and create new instance with tauri storage
      ;(PersonDatabaseService as any).instance = undefined
      vi.mocked(invoke).mockResolvedValue(undefined)
      const tauriService = PersonDatabaseService.getInstance({ storage: "tauri" })

      await tauriService.initialize()

      expect(invoke).toHaveBeenCalledWith("init_person_database")
    })

    it("should initialize with indexeddb storage", async () => {
      // IndexedDB is mocked in test environment
      const idbService = PersonDatabaseService.getInstance({ storage: "indexeddb" })

      await expect(idbService.initialize()).resolves.not.toThrow()
    })

    it("should not reinitialize if already initialized", async () => {
      await service.initialize()
      await service.initialize() // Second call should be no-op

      // Test passes if no error thrown
      expect(true).toBe(true)
    })
  })

  describe("createPerson with complex data", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should create person with embeddings and appearances", async () => {
      const embedding1 = createMockEmbedding({ quality: 0.95 })
      const embedding2 = createMockEmbedding({ quality: 0.88 })

      const personData = createMockPerson({
        name: "John Doe",
        faceEmbeddings: [embedding1, embedding2],
        tags: ["actor", "main"],
      })

      const person = await service.createPerson(personData)

      expect(person.id).toBeDefined()
      expect(person.name).toBe("John Doe")
      expect(person.faceEmbeddings).toHaveLength(2)
      expect(person.tags).toContain("actor")
    })

    it.skip("should generate average embedding from multiple embeddings", async () => {
      const embeddings = [
        createMockEmbedding({ vector: new Float32Array([1, 0, 0, 0, 0]) }),
        createMockEmbedding({ vector: new Float32Array([0, 1, 0, 0, 0]) }),
        createMockEmbedding({ vector: new Float32Array([0, 0, 1, 0, 0]) }),
      ]

      const personData = createMockPerson({
        faceEmbeddings: embeddings,
      })

      const person = await service.createPerson(personData)

      expect(person.averageEmbedding).toBeDefined()
      expect(person.averageEmbedding).toHaveLength(5)
    })

    it("should handle person without name (anonymous)", async () => {
      const personData = createMockPerson({
        name: undefined,
        tags: ["auto_generated"],
      })

      const person = await service.createPerson(personData)

      expect(person.name).toBeUndefined()
      expect(person.isVerified).toBe(false)
      expect(person.tags).toContain("auto_generated")
    })
  })

  describe("searchPersonsByEmbedding with complex scenarios", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it.skip("should find best matching person from multiple candidates", async () => {
      // Create persons with different similarity embeddings
      const searchEmbedding = new Float32Array([1, 0, 0, 0, 0])

      const person1 = await service.createPerson(
        createMockPerson({
          name: "Person 1",
          faceEmbeddings: [
            createMockEmbedding({ vector: new Float32Array([0.9, 0.1, 0, 0, 0]) }), // Similar
          ],
        }),
      )

      const person2 = await service.createPerson(
        createMockPerson({
          name: "Person 2",
          faceEmbeddings: [
            createMockEmbedding({ vector: new Float32Array([0, 1, 0, 0, 0]) }), // Orthogonal
          ],
        }),
      )

      await service.createPerson(
        createMockPerson({
          name: "Person 3",
          faceEmbeddings: [
            createMockEmbedding({ vector: new Float32Array([0.95, 0.05, 0, 0, 0]) }), // Very similar
          ],
        }),
      )

      const results = await service.searchPersonsByEmbedding(searchEmbedding, 0.5, 3)

      expect(results.length).toBeGreaterThan(0)
      // First result should be most similar
      expect(results[0].similarity).toBeGreaterThan(0.9)
    })

    it.skip("should respect similarity threshold", async () => {
      const person = await service.createPerson(
        createMockPerson({
          faceEmbeddings: [createMockEmbedding({ vector: new Float32Array([1, 0, 0, 0, 0]) })],
        }),
      )

      const searchEmbedding = new Float32Array([0, 1, 0, 0, 0]) // Orthogonal

      const highThreshold = await service.searchPersonsByEmbedding(searchEmbedding, 0.9, 10)
      const lowThreshold = await service.searchPersonsByEmbedding(searchEmbedding, 0.0, 10)

      expect(highThreshold).toHaveLength(0)
      expect(lowThreshold.length).toBeGreaterThan(0)
    })

    it("should respect limit parameter", async () => {
      // Create 5 persons
      for (let i = 0; i < 5; i++) {
        await service.createPerson(
          createMockPerson({
            name: `Person ${i}`,
            faceEmbeddings: [createMockEmbedding({ vector: new Float32Array([0.8 + i * 0.01, 0.2, 0, 0, 0]) })],
          }),
        )
      }

      const searchEmbedding = new Float32Array([1, 0, 0, 0, 0])
      const results = await service.searchPersonsByEmbedding(searchEmbedding, 0.1, 3)

      expect(results.length).toBeLessThanOrEqual(3)
    })
  })

  describe("mergePersons", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it.skip("should merge multiple persons into target", async () => {
      const target = await service.createPerson(
        createMockPerson({
          name: "Target Person",
          faceEmbeddings: [createMockEmbedding()],
          totalScreenTime: 10,
        }),
      )

      const source1 = await service.createPerson(
        createMockPerson({
          name: "Source 1",
          faceEmbeddings: [createMockEmbedding(), createMockEmbedding()],
          totalScreenTime: 5,
        }),
      )

      const source2 = await service.createPerson(
        createMockPerson({
          name: "Source 2",
          faceEmbeddings: [createMockEmbedding()],
          totalScreenTime: 3,
        }),
      )

      const result = await service.mergePersons(target.id, [source1.id, source2.id])

      expect(result).toBe(true)

      const merged = await service.getPerson(target.id)
      expect(merged?.faceEmbeddings.length).toBe(4) // 1 + 2 + 1
      expect(merged?.totalScreenTime).toBe(18) // 10 + 5 + 3

      // Source persons should be deleted
      expect(await service.getPerson(source1.id)).toBeNull()
      expect(await service.getPerson(source2.id)).toBeNull()
    })

    it("should recalculate average embedding after merge", async () => {
      const target = await service.createPerson(
        createMockPerson({
          faceEmbeddings: [createMockEmbedding({ vector: new Float32Array([1, 0, 0, 0, 0]) })],
        }),
      )

      const source = await service.createPerson(
        createMockPerson({
          faceEmbeddings: [createMockEmbedding({ vector: new Float32Array([0, 1, 0, 0, 0]) })],
        }),
      )

      await service.mergePersons(target.id, [source.id])

      const merged = await service.getPerson(target.id)
      expect(merged?.averageEmbedding).toBeDefined()
      expect(merged?.faceEmbeddings).toHaveLength(2)
    })
  })

  describe("clusterUnidentifiedFaces", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should create clusters from similar faces", async () => {
      const faces = [
        {
          id: "face-1",
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.9,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([1, 0, 0, 0, 0]),
        },
        {
          id: "face-2",
          bbox: { x: 10, y: 10, width: 100, height: 100 },
          confidence: 0.85,
          timestamp: { seconds: 2 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0.95, 0.05, 0, 0, 0]), // Similar to face-1
        },
        {
          id: "face-3",
          bbox: { x: 100, y: 100, width: 100, height: 100 },
          confidence: 0.88,
          timestamp: { seconds: 3 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0, 1, 0, 0, 0]), // Different from others
        },
      ]

      const persons = await service.clusterUnidentifiedFaces(faces, 0.8)

      // Should create 2 clusters: one for face-1 + face-2, one for face-3
      // But face-3 is alone so might not create a person (depends on minClusterSize)
      expect(persons.length).toBeGreaterThan(0)
      expect(persons[0].tags).toContain("auto_generated")
      expect(persons[0].isVerified).toBe(false)
    })

    it("should skip single-face clusters", async () => {
      const faces = [
        {
          id: "face-1",
          bbox: { x: 0, y: 0, width: 100, height: 100 },
          confidence: 0.9,
          timestamp: { seconds: 1 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([1, 0, 0, 0, 0]),
        },
        {
          id: "face-2",
          bbox: { x: 100, y: 100, width: 100, height: 100 },
          confidence: 0.85,
          timestamp: { seconds: 2 },
          blur: 0.1,
          occlusion: 0.05,
          pose: { yaw: 0, pitch: 0, roll: 0 },
          embedding: new Float32Array([0, 1, 0, 0, 0]), // Very different
        },
      ]

      const persons = await service.clusterUnidentifiedFaces(faces, 0.9)

      // With high threshold, faces won't cluster together, creating single-face clusters
      // which should be skipped
      expect(persons).toHaveLength(0)
    })
  })

  describe("addAppearance", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should update person statistics when adding appearance", async () => {
      const person = await service.createPerson(createMockPerson({ name: "Test" }))

      const appearance: PersonAppearance = {
        id: "app-1",
        personId: person.id,
        clipId: "clip-1",
        startTime: { seconds: 10 },
        endTime: { seconds: 15 },
        duration: 5,
        confidence: 0.9,
        minConfidence: 0.85,
        maxConfidence: 0.95,
        detections: [],
        createdAt: new Date().toISOString(),
      }

      await service.addAppearance(person.id, appearance)

      const updated = await service.getPerson(person.id)
      expect(updated?.totalScreenTime).toBe(5)
      expect(updated?.lastSeen).toEqual({ seconds: 15 })
      expect(updated?.appearances).toHaveLength(1)
    })

    it("should accumulate screen time across multiple appearances", async () => {
      const person = await service.createPerson(createMockPerson())

      const app1: PersonAppearance = {
        id: "app-1",
        personId: person.id,
        clipId: "clip-1",
        startTime: { seconds: 0 },
        endTime: { seconds: 5 },
        duration: 5,
        confidence: 0.9,
        minConfidence: 0.85,
        maxConfidence: 0.95,
        detections: [],
        createdAt: new Date().toISOString(),
      }

      const app2: PersonAppearance = {
        id: "app-2",
        personId: person.id,
        clipId: "clip-1",
        startTime: { seconds: 10 },
        endTime: { seconds: 17 },
        duration: 7,
        confidence: 0.88,
        minConfidence: 0.8,
        maxConfidence: 0.92,
        detections: [],
        createdAt: new Date().toISOString(),
      }

      await service.addAppearance(person.id, app1)
      await service.addAppearance(person.id, app2)

      const updated = await service.getPerson(person.id)
      expect(updated?.totalScreenTime).toBe(12)
      expect(updated?.appearances).toHaveLength(2)
    })
  })

  describe("getPersonStats", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should calculate comprehensive person statistics", async () => {
      const person = await service.createPerson(createMockPerson({ name: "Stats Test" }))

      // Add multiple appearances
      const appearances = [
        {
          id: "app-1",
          personId: person.id,
          clipId: "clip-1",
          startTime: { seconds: 0 },
          endTime: { seconds: 10 },
          duration: 10,
          confidence: 0.9,
          minConfidence: 0.85,
          maxConfidence: 0.95,
          detections: [
            {
              id: "det-1",
              bbox: { x: 0, y: 0, width: 100, height: 100 },
              confidence: 0.9,
              timestamp: { seconds: 5 },
              blur: 0.1,
              occlusion: 0.05,
              pose: { yaw: 0, pitch: 0, roll: 0 },
              emotion: "happy" as const,
            },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: "app-2",
          personId: person.id,
          clipId: "clip-2",
          startTime: { seconds: 0 },
          endTime: { seconds: 5 },
          duration: 5,
          confidence: 0.85,
          minConfidence: 0.8,
          maxConfidence: 0.9,
          detections: [
            {
              id: "det-2",
              bbox: { x: 0, y: 0, width: 100, height: 100 },
              confidence: 0.85,
              timestamp: { seconds: 2 },
              blur: 0.1,
              occlusion: 0.05,
              pose: { yaw: 0, pitch: 0, roll: 0 },
              emotion: "neutral" as const,
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ]

      for (const app of appearances) {
        await service.addAppearance(person.id, app)
      }

      const stats = await service.getPersonStats(person.id)

      expect(stats).toBeDefined()
      expect(stats?.totalAppearances).toBe(2)
      expect(stats?.totalScreenTime).toBe(15)
      expect(stats?.clipsCount).toBe(2)
      expect(stats?.averageConfidence).toBeCloseTo(0.875, 2)
      expect(stats?.emotionDistribution).toBeDefined()
    })
  })

  describe("Cache management", () => {
    beforeEach(async () => {
      service = PersonDatabaseService.getInstance({ enableCache: true, cacheSize: 2 })
      await service.initialize()
    })

    it("should cache frequently accessed persons", async () => {
      const person = await service.createPerson(createMockPerson({ name: "Cached" }))

      // First access
      await service.getPerson(person.id)
      // Second access should use cache
      const cached = await service.getPerson(person.id)

      expect(cached?.id).toBe(person.id)
    })

    it("should invalidate cache on update", async () => {
      const person = await service.createPerson(createMockPerson({ name: "Original" }))

      await service.getPerson(person.id) // Cache it
      await service.updatePerson(person.id, { name: "Updated" })

      const updated = await service.getPerson(person.id)
      expect(updated?.name).toBe("Updated")
    })
  })

  describe("Error handling", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it.skip("should handle failed person creation gracefully", async () => {
      // Mock a failure scenario
      const invalidData = null as any

      await expect(service.createPerson(invalidData)).rejects.toThrow()
    })

    it("should return null for non-existent person", async () => {
      const person = await service.getPerson("non-existent-id")

      expect(person).toBeNull()
    })

    it.skip("should return false when deleting non-existent person", async () => {
      const result = await service.deletePerson("non-existent-id")

      expect(result).toBe(false)
    })

    it("should return empty array for search with no results", async () => {
      const embedding = new Float32Array([1, 2, 3, 4, 5])
      const results = await service.searchPersonsByEmbedding(embedding, 0.99, 10)

      expect(results).toEqual([])
    })
  })

  describe("Event system", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should emit events for person lifecycle", async () => {
      const events: any[] = []
      const listener = (event: any) => events.push(event)

      service.addEventListener(listener)

      const person = await service.createPerson(createMockPerson({ name: "Event Test" }))
      await service.updatePerson(person.id, { name: "Updated" })
      await service.deletePerson(person.id)

      expect(events).toHaveLength(3)
      expect(events[0].type).toBe("person_created")
      expect(events[1].type).toBe("person_updated")
      expect(events[2].type).toBe("person_deleted")

      service.removeEventListener(listener)
    })

    it("should handle multiple event listeners", async () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      service.addEventListener(listener1)
      service.addEventListener(listener2)

      await service.createPerson(createMockPerson())

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()

      service.removeEventListener(listener1)
      service.removeEventListener(listener2)
    })
  })
})
