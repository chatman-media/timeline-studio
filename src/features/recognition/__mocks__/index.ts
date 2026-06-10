import { vi } from "vitest"

// Мок данных YOLO
export const mockYoloData = {
  videoId: "test-video",
  videoName: "test.mp4",
  videoPath: "/path/to/test.mp4",
  frames: [
    {
      timestamp: 0,
      detections: [
        {
          class: "person",
          confidence: 0.95,
          bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
        },
      ],
    },
    {
      timestamp: 5,
      detections: [
        {
          class: "car",
          confidence: 0.87,
          bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.3 },
        },
        {
          class: "person",
          confidence: 0.92,
          bbox: { x: 0.2, y: 0.3, width: 0.25, height: 0.5 },
        },
      ],
    },
  ],
}

export const mockDetections = [
  {
    class: "person",
    confidence: 0.95,
    bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
  },
  {
    class: "car",
    confidence: 0.87,
    bbox: { x: 0.5, y: 0.4, width: 0.2, height: 0.3 },
  },
]

export const mockVideoSummary = {
  videoId: "test-video",
  videoName: "test.mp4",
  frameCount: 2,
  detectedClasses: ["person", "car"],
  classCounts: { person: 2, car: 1 },
  classTimeRanges: {
    person: [{ start: 0, end: 5 }],
    car: [{ start: 5, end: 5 }],
  },
}

// Мок компонентов
export const YoloDataOverlay = vi.fn(({ video, currentTime }) => {
  return `<div data-testid="yolo-data-overlay">Video: ${video.name}, Time: ${currentTime}</div>`
})

export const YoloDataVisualization = vi.fn(({ yoloData, width, height }) => {
  return `<div data-testid="yolo-data-visualization">Video: ${yoloData.videoName}, Size: ${width}x${height}</div>`
})

export const YoloGraphOverlay = vi.fn(({ yoloData }) => {
  return `<div data-testid="yolo-graph-overlay" onClick={() => onTimeChange?.(10)}>Graph for ${yoloData.videoName}</div>`
})

export const YoloTrackOverlay = vi.fn(({ showTrajectories }) => {
  return `<div data-testid="yolo-track-overlay">Tracks: ${showTrajectories ? "shown" : "hidden"}</div>`
})

// Мок хука useYoloData
export const useYoloData = vi.fn(() => ({
  loadYoloData: vi.fn().mockResolvedValue(mockYoloData),
  getYoloDataAtTimestamp: vi.fn().mockResolvedValue(mockDetections),
  getVideoSummary: vi.fn().mockResolvedValue(mockVideoSummary),
  getAllYoloData: vi.fn().mockResolvedValue(mockYoloData),
  hasYoloData: vi.fn().mockReturnValue(true),
  clearVideoCache: vi.fn(),
  clearAllCache: vi.fn(),
  getCacheStats: vi.fn().mockReturnValue({
    cachedVideos: 1,
    nonExistentVideos: 0,
    totalMemoryUsage: 1024,
    missingDataCount: 0,
  }),
  preloadYoloData: vi.fn().mockResolvedValue(undefined),
  getSceneContext: vi.fn().mockResolvedValue("В кадре обнаружено: person, car"),
  loadingStates: {},
  errorStates: {},
}))

// Мок сервисов
// Note: Real services are now in @timeline-studio/domains/ai-services/services/recognition
// These mocks remain here for testing purposes
export const YoloDataService = vi.fn().mockImplementation(() => ({
  loadYoloData: vi.fn().mockResolvedValue(mockYoloData),
  getYoloDataAtTimestamp: vi.fn().mockResolvedValue(mockDetections),
  getVideoSummary: vi.fn().mockResolvedValue(mockVideoSummary),
  getAllYoloData: vi.fn().mockResolvedValue(mockYoloData),
  hasYoloData: vi.fn().mockReturnValue(true),
  clearVideoCache: vi.fn(),
  clearAllCache: vi.fn(),
  getCacheStats: vi.fn().mockReturnValue({
    cachedVideos: 1,
    nonExistentVideos: 0,
    totalMemoryUsage: 1024,
    missingDataCount: 0,
  }),
}))

export const SceneContextService = vi.fn().mockImplementation(() => ({
  createSceneContext: vi.fn().mockReturnValue({
    currentVideo: { id: "test-video", name: "test.mp4", timestamp: 5 },
    detectedObjects: mockDetections.map((d) => ({
      class: d.class,
      confidence: d.confidence,
      position: "в центре кадра",
      size: "средний",
      description: `${d.class} в центре кадра`,
    })),
    sceneDescription: "В кадре обнаружено: person, car",
    objectCounts: { person: 1, car: 1 },
    dominantObjects: [],
  }),
  createChatDescription: vi.fn().mockReturnValue("Сцена содержит 2 объекта"),
  createDetailedDescription: vi.fn().mockReturnValue("Детальное описание сцены"),
  exportToJSON: vi.fn().mockReturnValue(JSON.stringify({ test: "data" })),
  filterByClass: vi.fn().mockReturnValue({
    currentVideo: { id: "test-video", name: "test.mp4", timestamp: 5 },
    detectedObjects: [mockDetections[0]],
    sceneDescription: "В кадре обнаружено: person",
    objectCounts: { person: 1 },
    dominantObjects: ["person"],
  }),
}))

// Утилиты для тестов
export const createMockVideo = (overrides = {}) => ({
  id: "test-video",
  name: "test.mp4",
  path: "/path/to/test.mp4",
  ...overrides,
})

export const createMockDetection = (overrides = {}) => ({
  class: "person",
  confidence: 0.95,
  bbox: { x: 0.1, y: 0.2, width: 0.3, height: 0.6 },
  ...overrides,
})

export const createMockYoloData = (overrides = {}) => ({
  ...mockYoloData,
  ...overrides,
})

// Хелперы для Canvas API моков
export const mockCanvasContext = {
  clearRect: vi.fn(),
  scale: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  arc: vi.fn(),
  fillText: vi.fn(),
  setLineDash: vi.fn(),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  font: "",
}

export const setupCanvasMock = () => {
  const mockGetContext = vi.fn().mockReturnValue(mockCanvasContext)

  // Проверяем, что HTMLCanvasElement существует в тестовой среде
  if (typeof HTMLCanvasElement !== "undefined") {
    HTMLCanvasElement.prototype.getContext = mockGetContext
  }

  // Мокаем window.devicePixelRatio если window существует
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "devicePixelRatio", {
      value: 2,
      writable: true,
    })
  }

  return { mockGetContext, mockCanvasContext }
}

// Мок для navigator.clipboard
export const setupClipboardMock = () => {
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn(),
    },
  })
  return navigator.clipboard
}
