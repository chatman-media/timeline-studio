import "@testing-library/jest-dom"

import { cleanup } from "@testing-library/react"
import type React from "react"
import { afterEach, beforeAll, vi } from "vitest"

// Mock requestAnimationFrame and cancelAnimationFrame at module level
// This ensures they're available before any component code loads
let animationFrameId = 0
;(global as any).requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  animationFrameId++
  const id = animationFrameId
  setTimeout(() => callback(Date.now()), 16)
  return id
})
;(global as any).cancelAnimationFrame = vi.fn((id?: number) => {
  if (id !== undefined) {
    clearTimeout(id as any)
  }
})

// Mock Image constructor at module level
;(global as any).Image = class MockImage {
  onload: (() => void) | null = null
  onerror: ((error: any) => void) | null = null
  src = ""
  width = 0
  height = 0

  constructor(width?: number, height?: number) {
    if (width !== undefined) this.width = width
    if (height !== undefined) this.height = height
  }

  load() {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
}

// Mock ImageData constructor at module level
;(global as any).ImageData = class MockImageData {
  data: Uint8ClampedArray
  width: number
  height: number

  constructor(width: number, height: number)
  constructor(data: Uint8ClampedArray, width: number, height?: number)
  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (dataOrWidth instanceof Uint8ClampedArray) {
      this.data = dataOrWidth
      this.width = widthOrHeight
      this.height = height || dataOrWidth.length / (4 * widthOrHeight)
    } else {
      this.width = dataOrWidth
      this.height = widthOrHeight
      this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4)
    }
  }
}

// Import modular mocks
import "@/test/mocks/backend-sync"
import "@/test/mocks/tauri"
import "@/test/mocks/browser"
import "@/test/mocks/libraries"
import "@/test/mocks/libraries/lucide-react"
import "@/test/mocks/libraries/react-hotkeys-hook"

// Mock scrollIntoView globally for all tests (needed for Radix UI components)
beforeAll(async () => {
  Element.prototype.scrollIntoView = vi.fn()

  // Also mock other methods that might be missing in jsdom
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = vi.fn()
  }
  if (!Element.prototype.scroll) {
    Element.prototype.scroll = vi.fn()
  }

  // Initialize AI services with test configuration
  // try {
  //   const container = AIDIContainer.getInstance()
  //   await container.initialize()
  // } catch (error) {
  //   // AI services initialization might fail in test environment - that's ok
  //   console.warn("AI services initialization skipped in test environment:", error)
  // }
})

// Mock common providers that are used in tests
vi.mock("@/features/user-settings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/user-settings")>()
  return {
    ...actual,
    useUserSettings: () => ({
      openAiApiKey: "test-api-key",
      claudeApiKey: "test-claude-key",
      updateSettings: vi.fn(),
      settings: {
        timelineVirtualizationEnabled: false,
        language: "en",
        theme: "light",
        quality: "medium",
        audioLanguage: "en",
        subtitleLanguage: "en",
        showSubtitles: false,
        autoSave: true,
        autoSaveInterval: 5,
      },
    }),
    UserSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  }
})

// Mock PlayerProvider and usePlayer
vi.mock("@/features/video-player/services/player-provider", () => ({
  PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
  usePlayer: () => ({
    playerSetSource: vi.fn().mockResolvedValue(undefined),
    playerSetMedia: vi.fn().mockResolvedValue(undefined),
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    playbackRate: 1,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    setPlaybackRate: vi.fn(),
    setPreviewMedia: vi.fn(),
  }),
}))

// Mock useApiKeys hook
vi.mock("@/features/user-settings/hooks/use-api-keys")

// Mock ApiKeyLoader
vi.mock("@/features/ai-chat/services/api-key-loader", () => ({
  ApiKeyLoader: {
    getInstance: () => ({
      clearCache: vi.fn(),
      getApiKey: vi.fn().mockResolvedValue("test-api-key"),
      setApiKey: vi.fn(),
    }),
  },
}))

vi.mock("@/features/ai-chat/__mocks__/api-key-loader", () => ({
  ApiKeyLoader: {
    getInstance: () => ({
      clearCache: vi.fn(),
      getApiKey: vi.fn().mockResolvedValue("test-api-key"),
      setApiKey: vi.fn(),
    }),
  },
}))

vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
    modalData: null,
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/modals/services/modal-provider", () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
    modalData: null,
  }),
}))

vi.mock("@/features/modals/services", () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: false,
    modalData: null,
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock ResourcesProvider and useResources
vi.mock("@/features/resources", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
  useResources: () => ({
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    addMedia: vi.fn(),
    removeMedia: vi.fn(),
    getEffectById: vi.fn(),
    getFilterById: vi.fn(),
    getTransitionById: vi.fn(),
    getTemplateById: vi.fn(),
    loadResources: vi.fn(),
    isLoading: false,
  }),
  useResources: () => ({
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    addMedia: vi.fn(),
    removeMedia: vi.fn(),
    getEffectById: vi.fn(),
    getFilterById: vi.fn(),
    getTransitionById: vi.fn(),
    getTemplateById: vi.fn(),
    loadResources: vi.fn(),
    isLoading: false,
  }),
}))

vi.mock("@/features/app-state", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state")>()
  return {
    ...actual,
    useCurrentProject: () => ({
      currentProject: {
        name: "Test Project",
        path: "/test/project.tlsp",
        timeline: { tracks: [], duration: 0 },
      },
      createNewProject: vi.fn(),
      createTempProject: vi.fn(),
      loadOrCreateTempProject: vi.fn(),
      openProject: vi.fn(),
      saveProject: vi.fn(),
      setProjectDirty: vi.fn(),
      isTempProject: false,
    }),
    useAppSettings: () => ({
      getCurrentProject: vi.fn().mockReturnValue({
        name: "Test Project",
        path: "/test/project.tlsp",
        timeline: { tracks: [], duration: 0 },
      }),
      getUserSettings: vi.fn().mockReturnValue({
        browserSettings: null,
        theme: "light",
        language: "en",
      }),
      updateUserSettings: vi.fn(),
      createNewProject: vi.fn(),
      createTempProject: vi.fn(),
      loadOrCreateTempProject: vi.fn(),
      openProject: vi.fn(),
      saveProject: vi.fn(),
      setProjectDirty: vi.fn(),
      isTempProject: false,
    }),
    useAppState: () => ({
      state: {
        context: {
          isConnected: true,
          error: null,
          projectState: null,
        },
        matches: vi.fn(() => false),
      },
      send: vi.fn(),
    }),
  }
})

// Mock new project management domain hooks
vi.mock("@/domains/project-management", () => ({
  useProject: () => ({
    projectState: {
      project: {
        metadata: {
          name: "Test Project",
          file_path: "/test/project.tlsp",
        },
        timeline: { tracks: [], duration: 0 },
      },
      hasUnsavedChanges: false,
    },
    isLoading: false,
    hasUnsavedChanges: false,
    createProject: vi.fn(),
    saveProject: vi.fn(),
    saveProjectAs: vi.fn(),
    openProject: vi.fn(),
    closeProject: vi.fn(),
  }),
  useUserSettings: () => ({
    settings: {
      layoutMode: "default",
      activeTab: "media",
      openAiApiKey: "test-openai-key",
      claudeApiKey: "test-claude-key",
      playerVolume: 0.8,
      screenshotsPath: "/test/screenshots",
      playerScreenshotsPath: "/test/player-screenshots",
      gpuAccelerationEnabled: true,
      autoSaveEnabled: true,
      autoSaveInterval: 5,
      isBrowserVisible: true,
      isTimelineVisible: true,
      isOptionsVisible: true,
    },
    isLoading: false,
    updateSettings: vi.fn(),
    updateLayoutMode: vi.fn(),
    updateActiveTab: vi.fn(),
    updateApiKey: vi.fn(),
    updateGpuAcceleration: vi.fn(),
    updateAutoSave: vi.fn(),
  }),
  useAppState: () => ({
    isConnected: true,
    connectionError: null,
    isLoading: false,
    retryConnection: vi.fn(),
  }),
  useProjectManagement: () => ({
    projectState: {
      project: {
        metadata: {
          name: "Test Project",
          file_path: "/test/project.tlsp",
        },
        timeline: { tracks: [], duration: 0 },
      },
    },
    userSettings: {
      layoutMode: "default",
      activeTab: "media",
      openAiApiKey: "test-openai-key",
      claudeApiKey: "test-claude-key",
      playerVolume: 0.8,
      autoSaveEnabled: true,
      autoSaveInterval: 5,
    },
    isConnected: true,
    connectionError: null,
    createProject: vi.fn(),
    openProject: vi.fn(),
    saveProject: vi.fn(),
    saveProjectAs: vi.fn(),
    closeProject: vi.fn(),
    updateUserSettings: vi.fn(),
    hasProject: true,
    projectName: "Test Project",
    projectPath: "/test/project.tlsp",
    isAutoSaveEnabled: true,
    layoutMode: "default",
    activeTab: "media",
  }),
  ProjectManagementProvider: ({ children }: { children: React.ReactNode }) => children,
  useProjectManagementContext: () => ({
    projectState: null,
    userSettings: {},
    isConnected: true,
    connectionError: null,
    isLoading: false,
  }),
}))

vi.mock("@/features/app-state/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state/services")>()
  return {
    ...actual,
    appDirectoriesService: {
      getAppDirectories: vi.fn().mockResolvedValue({
        base_dir: "/Users/test/Movies/Timeline Studio",
      }),
    },
  }
})

// Mock AI Content Intelligence services globally
vi.mock("@/features/ai-chat/services/unified-ai-service", () => ({
  UnifiedAIService: {
    getInstance: vi.fn(() => ({
      analyzeContentIntelligence: vi.fn().mockResolvedValue([]),
      generateScript: vi.fn().mockResolvedValue({ script: "Generated script" }),
      adaptForPlatform: vi.fn().mockResolvedValue({ content: "Adapted content" }),
    })),
  },
}))

// PersonDatabaseService is not mocked globally to allow testing the real implementation

vi.mock("@/domains/ai-services/services/engines/scene-analysis/scene-analysis-engine", () => ({
  SceneAnalysisEngine: class MockSceneAnalysisEngine {
    analyzeScene = vi.fn().mockResolvedValue({
      objects: [],
      faces: [],
      emotions: [],
      quality: { score: 0.8 },
    })
    detectPersons = vi.fn().mockResolvedValue([])
    analyzeVideo = vi.fn().mockResolvedValue({ scenes: [], persons: [] })
  },
}))

// Only absolutely essential global setup
beforeAll(() => {
  // Mock console methods in tests to reduce noise
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  }

  // Mock pointer capture methods for Radix UI components
  if (typeof Element !== "undefined") {
    Element.prototype.hasPointerCapture = vi.fn(() => false)
    Element.prototype.setPointerCapture = vi.fn()
    Element.prototype.releasePointerCapture = vi.fn()
  }

  // Mock ResizeObserver for components that use it
  global.ResizeObserver = class ResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      // Store callback and options for potential use
      void callback
      void options
    }
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    root = null
    rootMargin = ""
    thresholds = []
    takeRecords = vi.fn(() => [])
  }

  // Mock setInterval and clearInterval to ensure they work properly in tests
  if (typeof global.setInterval === "undefined") {
    global.setInterval = vi.fn((callback: TimerHandler, delay?: number) => {
      // In tests, callback should always be a function, not a string
      if (typeof callback === "function") {
        return setTimeout(callback, delay) as unknown as number
      }
      // If it's not a function, just return a mock timer ID
      return 1 as unknown as number
    }) as any
  }

  if (typeof global.clearInterval === "undefined") {
    global.clearInterval = vi.fn((id) => {
      clearTimeout(id)
    }) as any
  }
})

afterEach(async () => {
  cleanup()
  vi.clearAllMocks()
  vi.unstubAllEnvs()

  // Очистка AI сервисов
  // try {
  //   const container = AIDIContainer.getInstanceSafe()
  //   if (container) {
  //     await container.dispose()
  //     AIDIContainer.resetInstance()
  //   }
  // } catch (error) {
  //   // Ignore cleanup errors
  // }

  // Дополнительная очистка памяти
  if (globalThis.gc) {
    globalThis.gc()
  }

  // Очистка всех таймеров
  vi.clearAllTimers()
})

// Global test environment setup
declare module "vitest" {
  interface Assertion<T = any> {
    toBeInTheDocument(): T
    toHaveClass(className: string): T
    toHaveStyle(style: Record<string, any>): T
    toHaveAttribute(attr: string, value?: string): T
    toBeDisabled(): T
    toBeEnabled(): T
    toHaveValue(value: string | number): T
    toBeChecked(): T
    toHaveTextContent(text: string): T
    toBeVisible(): T
    toBeEmptyDOMElement(): T
    toHaveFocus(): T
  }
}
