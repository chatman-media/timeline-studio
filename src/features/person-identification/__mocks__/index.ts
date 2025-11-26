/**
 * Mock data and utilities for person identification tests
 */

import { vi } from "vitest"
import type {
  BoundingBox,
  DetectedFace,
  FaceEmbedding,
  PersonAppearance,
  PersonProfile,
  PersonSearchResult,
  PersonThumbnail,
  Timecode,
} from "../types/person"

/**
 * Create a mock bounding box
 */
export const createMockBoundingBox = (overrides?: Partial<BoundingBox>): BoundingBox => ({
  x: 100,
  y: 150,
  width: 200,
  height: 250,
  ...overrides,
})

/**
 * Create a mock timecode
 */
export const createMockTimecode = (seconds = 0, frames?: number): Timecode => ({
  seconds,
  frames,
})

/**
 * Create a mock detected face
 */
export const createMockDetectedFace = (overrides?: Partial<DetectedFace>): DetectedFace => ({
  id: `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  bbox: createMockBoundingBox(),
  confidence: 0.9,
  timestamp: createMockTimecode(1.0),
  frameNumber: 30,
  blur: 0.1,
  occlusion: 0.05,
  pose: {
    yaw: 0,
    pitch: 0,
    roll: 0,
  },
  age: 30,
  gender: "male",
  emotion: "neutral",
  landmarks: {
    points: [
      { x: 120, y: 170 },
      { x: 180, y: 170 },
      { x: 150, y: 200 },
    ],
    quality: 0.85,
  },
  ...overrides,
})

/**
 * Create a mock face embedding
 */
export const createMockFaceEmbedding = (overrides?: Partial<FaceEmbedding>): FaceEmbedding => ({
  faceId: `face_${Date.now()}`,
  personId: "person-1",
  vector: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
  quality: 0.9,
  timestamp: createMockTimecode(1.0),
  frameNumber: 30,
  clipId: "clip-1",
  createdAt: new Date().toISOString(),
  ...overrides,
})

/**
 * Create a mock person thumbnail
 */
export const createMockThumbnail = (overrides?: Partial<PersonThumbnail>): PersonThumbnail => ({
  id: `thumb_${Date.now()}`,
  imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  width: 200,
  height: 200,
  sourceClipId: "clip-1",
  sourceTimestamp: createMockTimecode(1.0),
  quality: 0.9,
  isPrimary: true,
  isGenerated: false,
  ...overrides,
})

/**
 * Create a mock person appearance
 */
export const createMockAppearance = (overrides?: Partial<PersonAppearance>): PersonAppearance => ({
  id: `app_${Date.now()}`,
  personId: "person-1",
  clipId: "clip-1",
  startTime: createMockTimecode(0),
  endTime: createMockTimecode(10),
  duration: 10,
  confidence: 0.9,
  minConfidence: 0.85,
  maxConfidence: 0.95,
  detections: [createMockDetectedFace()],
  createdAt: new Date().toISOString(),
  ...overrides,
})

/**
 * Create a mock person profile
 */
export const createMockPersonProfile = (overrides?: Partial<PersonProfile>): PersonProfile => ({
  id: `person_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  name: "Test Person",
  isVerified: false,
  faceEmbeddings: [createMockFaceEmbedding()],
  averageEmbedding: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
  appearances: [createMockAppearance()],
  totalScreenTime: 120,
  firstSeen: createMockTimecode(0),
  lastSeen: createMockTimecode(120),
  tags: ["actor", "main"],
  notes: "Test person description",
  thumbnails: [createMockThumbnail()],
  privacy: {
    blurFace: false,
    hideFromSearch: false,
    anonymize: false,
    blurIntensity: 5,
    blurTracking: true,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

/**
 * Create a mock person search result
 */
export const createMockSearchResult = (overrides?: Partial<PersonSearchResult>): PersonSearchResult => ({
  person: createMockPersonProfile(),
  similarity: 0.95,
  matches: [
    {
      faceId: "face-1",
      personId: "person-1",
      similarity: 0.95,
      confidence: 0.9,
      clipId: "clip-1",
      timestamp: createMockTimecode(1.0),
      thumbnail: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    },
  ],
  ...overrides,
})

/**
 * Create multiple mock persons
 */
export const createMockPersons = (count: number): PersonProfile[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockPersonProfile({
      id: `person-${index + 1}`,
      name: `Person ${index + 1}`,
      faceEmbeddings: [
        createMockFaceEmbedding({
          personId: `person-${index + 1}`,
          vector: new Float32Array(Array.from({ length: 512 }, () => Math.random())),
        }),
      ],
      totalScreenTime: 60 + index * 30,
    }),
  )
}

/**
 * Create multiple mock detected faces
 */
export const createMockDetectedFaces = (count: number): DetectedFace[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockDetectedFace({
      id: `face-${index + 1}`,
      confidence: 0.8 + Math.random() * 0.2,
      timestamp: createMockTimecode(index * 1.5),
      frameNumber: index * 45,
    }),
  )
}

/**
 * Mock PersonDatabaseService methods
 */
export const createMockPersonDatabaseService = () => ({
  getInstance: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    createPerson: vi.fn().mockImplementation((data) =>
      Promise.resolve(
        createMockPersonProfile({
          ...data,
          id: `person_${Date.now()}`,
        }),
      ),
    ),
    getPerson: vi
      .fn()
      .mockImplementation((id: string) =>
        Promise.resolve(id === "non-existent" ? null : createMockPersonProfile({ id })),
      ),
    updatePerson: vi.fn().mockResolvedValue(undefined),
    deletePerson: vi.fn().mockResolvedValue(true),
    getAllPersons: vi.fn().mockResolvedValue(createMockPersons(3)),
    searchPersons: vi.fn().mockImplementation((query: string) => {
      const persons = createMockPersons(3)
      return Promise.resolve(persons.filter((p) => p.name?.toLowerCase().includes(query.toLowerCase())))
    }),
    searchPersonsByName: vi.fn().mockResolvedValue(createMockPersons(1)),
    searchPersonsByEmbedding: vi.fn().mockResolvedValue([createMockSearchResult()]),
    findSimilarPersons: vi.fn().mockResolvedValue([createMockSearchResult()]),
    addEmbedding: vi.fn().mockResolvedValue(true),
    addAppearance: vi.fn().mockResolvedValue(true),
    getPersonStats: vi.fn().mockResolvedValue({
      personId: "person-1",
      totalAppearances: 5,
      totalScreenTime: 150,
      averageAppearanceLength: 30,
      clipsCount: 3,
      clipIds: ["clip-1", "clip-2", "clip-3"],
      averageConfidence: 0.9,
      bestConfidence: 0.95,
      worstConfidence: 0.85,
      firstAppearance: createMockTimecode(0),
      lastAppearance: createMockTimecode(150),
      emotionDistribution: {
        happy: 3,
        neutral: 2,
      },
      screenTimePercentage: 25,
      appearanceFrequency: 2,
    }),
    mergePersons: vi.fn().mockResolvedValue(true),
    clusterUnidentifiedFaces: vi.fn().mockResolvedValue(createMockPersons(2)),
    getDatabaseStats: vi.fn().mockResolvedValue({
      totalPersons: 10,
      totalEmbeddings: 50,
      totalAppearances: 25,
      averageEmbeddingsPerPerson: 5,
      storageSize: 1024000,
      lastUpdated: new Date().toISOString(),
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
    addPersonThumbnail: vi.fn().mockResolvedValue(true),
  })),
})

/**
 * Mock AdvancedFaceDetectionService methods
 */
export const createMockAdvancedFaceDetectionService = () => ({
  getInstance: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    detectFacesAdvanced: vi.fn().mockResolvedValue(createMockDetectedFaces(3)),
    detectFacesBatch: vi.fn().mockResolvedValue(new Map()),
    generateFaceEmbedding: vi.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5])),
    analyzeFaceQuality: vi.fn().mockResolvedValue({
      overall: 0.85,
      sharpness: 0.9,
      brightness: 0.8,
      contrast: 0.85,
      isBlurry: false,
      isTooDark: false,
      isTooBright: false,
      isOccluded: false,
      suitableForRecognition: true,
      suitableForEnrollment: true,
    }),
    startRealtimeProcessing: vi.fn().mockResolvedValue(undefined),
    stopRealtimeProcessing: vi.fn().mockResolvedValue(undefined),
    blurFaces: vi.fn().mockResolvedValue("blurred_image_data"),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),
    getRealtimeStatus: vi.fn().mockReturnValue({
      isProcessing: false,
      fps: 30,
      processedFrames: 0,
      detectedFaces: 0,
      averageLatency: 0,
    }),
  })),
})

/**
 * Mock AdvancedTrackingService methods
 */
export const createMockAdvancedTrackingService = () => ({
  getInstance: vi.fn(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    startTracking: vi.fn().mockResolvedValue(undefined),
    stopTracking: vi.fn().mockResolvedValue(undefined),
    processFrame: vi.fn().mockResolvedValue({
      frameNumber: 45,
      timestamp: 1.5,
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
    }),
    predictNextPositions: vi.fn().mockResolvedValue(new Map()),
    assignPersonToTrack: vi.fn().mockResolvedValue(undefined),
    mergeTracks: vi.fn().mockResolvedValue(undefined),
    getTrack: vi.fn().mockReturnValue(undefined),
    getActiveTracks: vi.fn().mockReturnValue([]),
    getTracksForPerson: vi.fn().mockReturnValue([]),
    interpolateMissingPositions: vi.fn().mockResolvedValue([]),
    exportTracksAsAppearances: vi.fn().mockResolvedValue([createMockAppearance()]),
    updateConfig: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    cleanup: vi.fn().mockResolvedValue(undefined),
  })),
})

/**
 * Create a complete mock environment for testing
 */
export const setupMockEnvironment = () => {
  const personService = createMockPersonDatabaseService()
  const detectionService = createMockAdvancedFaceDetectionService()
  const trackingService = createMockAdvancedTrackingService()

  return {
    personService,
    detectionService,
    trackingService,
    cleanup: () => {
      vi.clearAllMocks()
    },
  }
}
