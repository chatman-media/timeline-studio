import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PersonDatabaseService } from "../../services/person-database-service"

import type { PersonProfile } from "../../types/person"

// Mock IndexedDB
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

const mockRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
}

// Mock indexedDB global
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

describe("PersonDatabaseService Integration", () => {
  let service: PersonDatabaseService

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton
    ;(PersonDatabaseService as any).instance = null
    service = PersonDatabaseService.getInstance()

    // Setup mock returns
    mockDb.transaction.mockReturnValue(mockTransaction)
    mockObjectStore.put.mockReturnValue(mockRequest)
    mockObjectStore.get.mockReturnValue(mockRequest)
    mockObjectStore.getAll.mockReturnValue(mockRequest)
    mockObjectStore.delete.mockReturnValue(mockRequest)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize the database", async () => {
    const openRequest = {
      result: mockDb,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    }

    global.indexedDB.open = vi.fn().mockReturnValue(openRequest)

    // Simulate successful open
    setTimeout(() => {
      if (openRequest.onsuccess) {
        ;(openRequest.onsuccess as () => void)()
      }
    }, 0)

    await service.initialize()

    expect(global.indexedDB.open).toHaveBeenCalledWith("timeline_studio_persons", 1)
  })

  it("should create a new person", async () => {
    // Initialize service first
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

    // Setup successful put request
    mockObjectStore.put.mockReturnValue({
      result: null,
      error: null,
      onsuccess: null,
      onerror: null,
    })

    const personData = {
      name: "Test Person",
      isVerified: false,
      faceEmbeddings: [],
      appearances: [],
      totalScreenTime: 0,
      firstSeen: { seconds: 0 },
      lastSeen: { seconds: 0 },
      tags: ["test"],
      thumbnails: [],
      privacy: {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
        blurIntensity: 5,
        blurTracking: true,
      },
    }

    // Mock successful transaction
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      put: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const person = await service.createPerson(personData)

    expect(person).toHaveProperty("id")
    expect(person.name).toBe("Test Person")
    expect(person.tags).toContain("test")
  })

  it("should get all persons", async () => {
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

    const mockPersons: PersonProfile[] = [
      {
        id: "person-1",
        name: "John Doe",
        isVerified: true,
        faceEmbeddings: [],
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

    // Mock successful getAll
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      getAll: vi.fn().mockImplementation(() => {
        const req = { result: mockPersons, onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const persons = await service.getAllPersons()

    expect(persons).toHaveLength(1)
    expect(persons[0].name).toBe("John Doe")
  })

  it("should search persons by name", async () => {
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

    const mockPersons: PersonProfile[] = [
      {
        id: "person-1",
        name: "John Doe",
        isVerified: true,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 100,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 100 },
        tags: ["actor"],
        notes: "Main character",
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
      {
        id: "person-2",
        name: "Jane Smith",
        isVerified: false,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 50,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 50 },
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

    const results = await service.searchPersons("john")

    expect(results).toHaveLength(1)
    expect(results[0].name).toBe("John Doe")
  })

  it("should calculate cosine similarity", async () => {
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

    // Access private method through prototype
    const calculateCosineSimilarity = (service as any).calculateCosineSimilarity.bind(service)

    const vec1 = new Float32Array([1, 0, 0])
    const vec2 = new Float32Array([1, 0, 0])
    const vec3 = new Float32Array([0, 1, 0])

    expect(calculateCosineSimilarity(vec1, vec2)).toBeCloseTo(1, 5)
    expect(calculateCosineSimilarity(vec1, vec3)).toBeCloseTo(0, 5)
  })

  it("should handle database errors", async () => {
    const openRequest = {
      result: null,
      error: new Error("Database error"),
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    }

    global.indexedDB.open = vi.fn().mockReturnValue(openRequest)

    setTimeout(() => {
      if (openRequest.onerror) {
        ;(openRequest.onerror as () => void)()
      }
    }, 0)

    await expect(service.initialize()).rejects.toThrow()
  })

  it("should update person", async () => {
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

    const existingPerson: PersonProfile = {
      id: "person-1",
      name: "John Doe",
      isVerified: true,
      faceEmbeddings: [],
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
    }

    // Mock getPerson
    vi.spyOn(service, "getPerson").mockResolvedValue(existingPerson)

    // Mock successful put
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      put: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const updated = await service.updatePerson("person-1", { name: "John Updated" })

    expect(updated).not.toBeNull()
    expect(updated?.name).toBe("John Updated")
  })

  it("should delete person", async () => {
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

    // Mock successful delete
    mockTransaction.objectStore = vi.fn().mockReturnValue({
      delete: vi.fn().mockImplementation(() => {
        const req = { onsuccess: null as (() => void) | null, onerror: null }
        setTimeout(() => req.onsuccess && req.onsuccess(), 0)
        return req
      }),
    })

    const result = await service.deletePerson("person-1")

    expect(result).toBe(true)
  })

  it("should get database statistics", async () => {
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

    const mockPersons: PersonProfile[] = [
      {
        id: "person-1",
        name: "John Doe",
        isVerified: true,
        faceEmbeddings: [
          {
            faceId: "face-1",
            vector: new Float32Array([0.1, 0.2]),
            quality: 0.9,
            timestamp: { seconds: 10 },
            frameNumber: 300,
            createdAt: new Date().toISOString(),
          },
        ],
        appearances: [
          {
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
            createdAt: "2025-01-01T00:00:00Z",
          },
        ],
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

    vi.spyOn(service, "getAllPersons").mockResolvedValue(mockPersons)

    const stats = await service.getDatabaseStats()

    expect(stats.totalPersons).toBe(1)
    expect(stats.totalEmbeddings).toBe(1)
    expect(stats.totalAppearances).toBe(1)
    expect(stats.averageEmbeddingsPerPerson).toBe(1)
  })
})
