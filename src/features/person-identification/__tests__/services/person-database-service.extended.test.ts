import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PersonDatabaseService } from "@/domains/ai-services/services/person-identification"

import type { DetectedFace, FaceEmbedding, PersonAppearance, PersonProfile } from "../../types/person"

// Mock IndexedDB setup (same as integration test)
const mockDb = {
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn().mockReturnValue(false),
  },
  close: vi.fn(),
}

const mockObjectStore = {
  put: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  delete: vi.fn(),
  index: vi.fn(),
  createIndex: vi.fn(),
}

const mockTransaction = {
  objectStore: vi.fn().mockReturnValue(mockObjectStore),
  onerror: null,
  oncomplete: null,
}

global.indexedDB = {
  open: vi.fn().mockReturnValue({
    result: mockDb,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  }),
  deleteDatabase: vi.fn(),
  databases: vi.fn(),
  cmp: vi.fn(),
} as any

describe("PersonDatabaseService Extended Tests", () => {
  let service: PersonDatabaseService

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(PersonDatabaseService as any).instance = null
    service = PersonDatabaseService.getInstance()

    // Setup mock returns
    mockDb.transaction.mockReturnValue(mockTransaction)

    // Initialize service
    const openRequest = {
      result: mockDb,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    }

    global.indexedDB.open = vi.fn().mockReturnValue(openRequest)

    setTimeout(() => {
      if (openRequest.onsuccess) {
        ;(openRequest.onsuccess as () => void)()
      }
    }, 0)

    await service.initialize()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should add person with full data", async () => {
    const detectedFaces: DetectedFace[] = [
      {
        id: "face-1",
        confidence: 0.95,
        bbox: { x: 10, y: 10, width: 100, height: 100 },
        blur: 0,
        occlusion: 0,
        pose: { yaw: 0, pitch: 0, roll: 0 },
        frameNumber: 300,
        timestamp: { seconds: 10 },
        clipId: "clip-1",
      },
    ]

    // Mock successful put
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      put: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const person = await service.addPerson({
      name: "Test Person",
      description: "Test description",
      tags: ["actor", "main"],
      thumbnailPath: "/path/to/thumb.jpg",
      detectedFaces,
    })

    expect(person.name).toBe("Test Person")
    expect(person.notes).toBe("Test description")
    expect(person.tags).toEqual(["actor", "main"])
    expect(person.thumbnails).toHaveLength(1)
    expect(person.thumbnails[0].imageUrl).toBe("/path/to/thumb.jpg")
    expect(person.appearances).toHaveLength(1)
  })

  it("should search persons by embedding", async () => {
    const mockEmbedding: FaceEmbedding = {
      faceId: "face-1",
      vector: new Float32Array([0.1, 0.2, 0.3]),
      quality: 0.9,
      timestamp: { seconds: 10 },
      clipId: "clip-1",
      frameNumber: 300,
      createdAt: new Date().toISOString(),
    }

    // Mock getAllEmbeddings
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      getAll: vi.fn().mockImplementation(() => {
        const req = { result: [mockEmbedding], onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const searchEmbedding = new Float32Array([0.1, 0.2, 0.3])
    const results = await service.searchPersonsByEmbedding(searchEmbedding, 0.8)

    expect(results).toHaveLength(0) // No person found for embedding
  })

  it("should add embedding to person", async () => {
    const person: PersonProfile = {
      id: "person-1",
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Mock getPerson
    vi.spyOn(service, "getPerson").mockResolvedValue(person)

    // Mock updatePerson
    vi.spyOn(service, "updatePerson").mockResolvedValue(person)

    // Mock storeEmbedding
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      put: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const embedding: FaceEmbedding = {
      faceId: "face-1",
      vector: new Float32Array([0.1, 0.2, 0.3]),
      quality: 0.9,
      timestamp: { seconds: 10 },
      frameNumber: 300,
      createdAt: new Date().toISOString(),
    }

    const result = await service.addEmbedding("person-1", embedding)

    expect(result).toBe(true)
  })

  it("should add appearance to person", async () => {
    const person: PersonProfile = {
      id: "person-1",
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Mock getPerson
    vi.spyOn(service, "getPerson").mockResolvedValue(person)

    // Mock updatePerson
    vi.spyOn(service, "updatePerson").mockResolvedValue(person)

    // Mock storeAppearance
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      put: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const appearance: PersonAppearance = {
      id: "app-1",
      personId: "person-1",
      clipId: "clip-1",
      startTime: { seconds: 10 },
      endTime: { seconds: 20 },
      duration: 10,
      confidence: 0.9,
      minConfidence: 0.9,
      maxConfidence: 0.9,
      detections: [],
      createdAt: new Date().toISOString(),
    }

    const result = await service.addAppearance("person-1", appearance)

    expect(result).toBe(true)
  })

  it("should get person stats", async () => {
    const person: PersonProfile = {
      id: "person-1",
      name: "Test Person",
      isVerified: false,
      faceEmbeddings: [],
      appearances: [
        {
          id: "app-1",
          personId: "person-1",
          clipId: "clip-1",
          startTime: { seconds: 10 },
          endTime: { seconds: 20 },
          duration: 10,
          confidence: 0.9,
          minConfidence: 0.8,
          maxConfidence: 0.95,
          detections: [
            {
              id: "det-1",
              confidence: 0.9,
              bbox: { x: 10, y: 10, width: 100, height: 100 },
              blur: 0,
              occlusion: 0,
              pose: { yaw: 0, pitch: 0, roll: 0 },
              frameNumber: 450,
              timestamp: { seconds: 15 },
              emotion: "happy",
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ],
      totalScreenTime: 10,
      firstSeen: { seconds: 10 },
      lastSeen: { seconds: 20 },
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

    // Mock getPerson
    vi.spyOn(service, "getPerson").mockResolvedValue(person)

    const stats = await service.getPersonStats("person-1")

    expect(stats).not.toBeNull()
    expect(stats?.totalAppearances).toBe(1)
    expect(stats?.totalScreenTime).toBe(10)
    expect(stats?.averageAppearanceLength).toBe(10)
    expect(stats?.clipsCount).toBe(1)
    expect(stats?.averageConfidence).toBe(0.9)
    expect(stats?.bestConfidence).toBe(0.9)
    expect(stats?.worstConfidence).toBe(0.9)
    expect(stats?.emotionDistribution).toHaveProperty("happy", 1)
  })

  it("should merge persons", async () => {
    const targetPerson: PersonProfile = {
      id: "person-1",
      name: "Target Person",
      isVerified: true,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 10,
      firstSeen: { seconds: 0 },
      lastSeen: { seconds: 10 },
      tags: ["main"],
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

    const sourcePerson: PersonProfile = {
      id: "person-2",
      name: "Source Person",
      isVerified: false,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 5,
      firstSeen: { seconds: 15 },
      lastSeen: { seconds: 20 },
      tags: ["extra"],
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

    // Mock getPerson
    vi.spyOn(service, "getPerson").mockResolvedValueOnce(targetPerson).mockResolvedValueOnce(sourcePerson)

    // Mock updatePerson
    vi.spyOn(service, "updatePerson").mockResolvedValue(targetPerson)

    // Mock deletePerson
    vi.spyOn(service, "deletePerson").mockResolvedValue(true)

    const result = await service.mergePersons("person-1", ["person-2"])

    expect(result).toBe(true)
    expect(service.updatePerson).toHaveBeenCalled()
    expect(service.deletePerson).toHaveBeenCalledWith("person-2")
  })

  it("should search persons by name with empty query", async () => {
    const result = await service.searchPersonsByName("")
    expect(result).toHaveLength(0)
  })

  it("should find similar persons", async () => {
    const mockPersons: PersonProfile[] = [
      {
        id: "person-1",
        name: "John Doe",
        isVerified: true,
        faceEmbeddings: [],
        averageEmbedding: new Float32Array([0.1, 0.2, 0.3]),
        appearances: [],
        totalScreenTime: 100,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 100 },
        tags: ["actor"],
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      },
    ]

    // Mock getAllPersons
    vi.spyOn(service, "getAllPersons").mockResolvedValue(mockPersons)

    const searchEmbedding = new Float32Array([0.1, 0.2, 0.3])
    const results = await service.findSimilarPersons(searchEmbedding, { limit: 1, minConfidence: 0.5 })

    expect(results).toHaveLength(1)
    expect(results[0].person.name).toBe("John Doe")
    expect(results[0].similarity).toBe(1) // Same vector, perfect match
  })

  it("should handle cleanup", async () => {
    await service.cleanup()

    expect(mockDb.close).toHaveBeenCalled()
  })

  it("should handle event listeners", async () => {
    const listener = vi.fn()

    service.addEventListener(listener)

    // Trigger an event by creating a person
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      put: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    await service.createPerson({
      name: "Test",
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
    })

    // Check that listener was called
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "person_created",
      }),
    )

    // Remove listener
    service.removeEventListener(listener)
  })

  it("should handle errors in addEmbedding", async () => {
    // Mock getPerson to return null
    vi.spyOn(service, "getPerson").mockResolvedValue(null)

    const embedding: FaceEmbedding = {
      faceId: "face-1",
      vector: new Float32Array([0.1, 0.2, 0.3]),
      quality: 0.9,
      timestamp: { seconds: 10 },
      frameNumber: 300,
      createdAt: new Date().toISOString(),
    }

    const result = await service.addEmbedding("person-1", embedding)

    expect(result).toBe(false)
  })

  it("should handle errors in addAppearance", async () => {
    // Mock getPerson to return null
    vi.spyOn(service, "getPerson").mockResolvedValue(null)

    const appearance: PersonAppearance = {
      id: "app-1",
      personId: "person-1",
      clipId: "clip-1",
      startTime: { seconds: 10 },
      endTime: { seconds: 20 },
      duration: 10,
      confidence: 0.9,
      minConfidence: 0.9,
      maxConfidence: 0.9,
      detections: [],
      createdAt: new Date().toISOString(),
    }

    const result = await service.addAppearance("person-1", appearance)

    expect(result).toBe(false)
  })

  it("should handle configuration options", () => {
    const customConfig = {
      enableCache: false,
      similarityThreshold: 0.9,
      dbName: "custom_db",
    }

    ;(PersonDatabaseService as any).instance = null
    const customService = PersonDatabaseService.getInstance(customConfig)

    expect((customService as any).config.enableCache).toBe(false)
    expect((customService as any).config.similarityThreshold).toBe(0.9)
    expect((customService as any).config.dbName).toBe("custom_db")
  })
})
