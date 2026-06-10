import "@testing-library/jest-dom"

import { cleanup, render } from "@testing-library/react"
import { container } from "@timeline-studio/core/container"
import { setMediaManagementBindings } from "@timeline-studio/core/services/media-management-registry"
import { setMontagePlannerBindings } from "@timeline-studio/core/services/montage-planner-registry"
import { setVideoEditingBindings } from "@timeline-studio/core/services/video-editing-registry"
import type React from "react"
import { afterEach, beforeAll, beforeEach, vi } from "vitest"

// Export render to make it available globally
// This prevents RTL from calling beforeAll() inside tests
export { render }

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
import "@/test/mocks/system-integration"

// Mock Tauri Logger
vi.mock("@/lib/tauri-logger", () => ({
  logTrace: vi.fn(),
  logDebug: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    traceSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    info: vi.fn(),
    infoSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  })),
}))

const mockProjectState = vi.hoisted(() => ({
  project: {
    id: "test-project",
    name: "Test Project",
    metadata: {
      name: "Test Project",
      created_at: "2026-01-01T00:00:00.000Z",
      modified_at: "2026-01-01T00:00:00.000Z",
      version: "1.0.0",
    },
    settings: {
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      audio_sample_rate: 48000,
      audio_channels: 2,
    },
    media_pool: { items: {} },
    resources: {
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
      styleTemplates: [],
      subtitles: [],
    },
    timeline: { tracks: [], duration: 0, fps: 30, sample_rate: 48000 },
  },
  playback_state: {
    current_time: 0,
    is_playing: false,
    playback_rate: 1,
    volume: 1,
  },
  ui_state: {
    selected_clips: [],
    selected_tracks: [],
    timeline_zoom: 1,
    timeline_scroll: 0,
    active_tool: "select",
  },
  version: 0,
}))

const mockUseApp = vi.hoisted(() => vi.fn())

const createNoopService = (overrides: Record<string, any> = {}) =>
  new Proxy(overrides, {
    get(target, property) {
      if (property in target) {
        return target[property as keyof typeof target]
      }
      if (typeof property === "symbol") {
        return undefined
      }

      const method = vi.fn().mockResolvedValue(undefined)
      target[property] = method
      return method
    },
  })

const createDefaultUserSettings = () => ({
  layoutMode: "default",
  activeTab: "media",
  playerVolume: 50,
  playerVideoSource: "browser",
  language: "en",
  theme: "light",
  timelineVirtualizationEnabled: false,
  openAiApiKey: "test-openai-key",
  claudeApiKey: "test-claude-key",
  autoSaveEnabled: true,
  autoSaveInterval: 5,
  isBrowserVisible: true,
  isTimelineVisible: true,
  isOptionsVisible: true,
})

const createMockResources = () => ({
  mediaResources: [],
  musicResources: [],
  effectResources: [],
  filterResources: [],
  transitionResources: [],
  templateResources: [],
  styleTemplateResources: [],
  subtitleResources: [],
  isLoading: false,
  error: null,
  addMedia: vi.fn(),
  addMusic: vi.fn(),
  addEffect: vi.fn(),
  addFilter: vi.fn(),
  addTransition: vi.fn(),
  addSubtitle: vi.fn(),
  addTemplate: vi.fn(),
  addStyleTemplate: vi.fn(),
  removeResource: vi.fn(),
  isAdded: vi.fn(() => false),
  isMediaAdded: vi.fn(() => false),
  isMusicAdded: vi.fn(() => false),
  isSubtitleAdded: vi.fn(() => false),
  isTemplateAdded: vi.fn(() => false),
  isEffectAdded: vi.fn(() => false),
  isFilterAdded: vi.fn(() => false),
  isTransitionAdded: vi.fn(() => false),
  isStyleTemplateAdded: vi.fn(() => false),
})

const createMockPlayer = () => ({
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isLoading: false,
  isReady: false,
  volume: 1,
  playbackRate: 1,
  currentVideo: null,
  videoSource: null,
  previewMedia: null,
  appliedEffects: [],
  appliedFilters: [],
  appliedTemplate: null,
  playerSetSource: vi.fn().mockResolvedValue(undefined),
  playerSetMedia: vi.fn().mockResolvedValue(undefined),
  setCurrentVideo: vi.fn(),
  setPreviewMedia: vi.fn(),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  seek: vi.fn(),
  setVolume: vi.fn(),
  setPlaybackRate: vi.fn(),
})

vi.mock("@timeline-studio/core/hooks/use-app", () => ({
  useApp: mockUseApp,
}))

function resetMockUseApp() {
  mockUseApp.mockReturnValue({
    isConnected: true,
    isConnecting: false,
    connectionError: null,
    projectState: mockProjectState,
    connect: vi.fn(),
    disconnect: vi.fn(),
    retryConnection: vi.fn(),
    executeCommand: vi.fn().mockResolvedValue({ success: true, data: null }),
  })
}

function registerCoreTestServices() {
  container.registerBackend(
    createNoopService({
      connected: true,
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      executeCommand: vi.fn().mockResolvedValue({ success: true, data: null }),
      getProjectState: vi.fn().mockResolvedValue(mockProjectState),
      getEventHistory: vi.fn().mockResolvedValue([]),
      onEvent: vi.fn(() => vi.fn()),
      onStateChange: vi.fn(() => vi.fn()),
    }) as any,
  )
  container.registerPlatform(
    createNoopService({
      showOpenDialog: vi.fn().mockResolvedValue(null),
      showSaveDialog: vi.fn().mockResolvedValue(null),
      readFile: vi.fn().mockResolvedValue(new Uint8Array()),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readTextFile: vi.fn().mockResolvedValue(""),
      writeTextFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
      readClipboard: vi.fn().mockResolvedValue(""),
      writeClipboard: vi.fn().mockResolvedValue(undefined),
      showNotification: vi.fn().mockResolvedValue(undefined),
      openPath: vi.fn().mockResolvedValue(undefined),
      openUrl: vi.fn().mockResolvedValue(undefined),
      getVersion: vi.fn().mockResolvedValue("0.0.0-test"),
      convertFileSrc: vi.fn((path: string) => path),
      basename: vi.fn(async (path: string) => path.split("/").pop() || path),
      dirname: vi.fn(async (path: string) => path.split("/").slice(0, -1).join("/") || "."),
      join: vi.fn(async (...paths: string[]) => paths.join("/")),
      getFileStats: vi.fn().mockResolvedValue({ size: 0, lastModified: 0 }),
      getPlatform: vi.fn().mockResolvedValue("test"),
      searchFilesByName: vi.fn().mockResolvedValue([]),
      getAbsolutePath: vi.fn(async (path: string) => path),
    }) as any,
  )
  container.registerStorage(
    createNoopService({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      has: vi.fn().mockResolvedValue(false),
      keys: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
    }) as any,
  )
  container.registerEvent(
    createNoopService({
      listen: vi.fn().mockResolvedValue(vi.fn()),
      emit: vi.fn().mockResolvedValue(undefined),
    }) as any,
  )
  container.registerMedia(
    createNoopService({
      getMetadata: vi.fn().mockResolvedValue({ type: "Unknown" }),
      getMediaFiles: vi.fn().mockResolvedValue([]),
      processFile: vi.fn().mockResolvedValue({ metadata: { type: "Unknown" } }),
      generateThumbnail: vi.fn().mockResolvedValue(""),
      hasCachedThumbnail: vi.fn().mockResolvedValue(false),
      getCachedThumbnailPath: vi.fn().mockResolvedValue(""),
      loadPreviewData: vi.fn().mockResolvedValue(null),
      getPreviewData: vi.fn().mockResolvedValue(null),
      getTimelineFrames: vi.fn().mockResolvedValue([]),
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      getFilesWithPreviews: vi.fn().mockResolvedValue([]),
      restorePreviewCache: vi.fn().mockResolvedValue(0),
      importFiles: vi.fn().mockResolvedValue({ imported: [], failed: [] }),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
    }) as any,
  )
  container.registerNodeBackend(
    createNoopService({
      checkHealth: vi.fn().mockResolvedValue({ available: false, ffmpegAvailable: false, timestamp: 0 }),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      scanFolder: vi.fn().mockResolvedValue([]),
      getMetadata: vi.fn().mockResolvedValue({ type: "Unknown" }),
      processFiles: vi.fn().mockResolvedValue([]),
      generateThumbnail: vi.fn().mockResolvedValue(""),
      generateWaveform: vi.fn().mockResolvedValue([]),
      getCacheStats: vi.fn().mockResolvedValue({
        cache: { memorySize: 0, dbSize: 0 },
        queue: { pending: 0, processing: 0, completed: 0, failed: 0 },
        timestamp: 0,
      }),
      clearCache: vi.fn().mockResolvedValue({ success: true, timestamp: 0, cleared: 0 }),
    }) as any,
  )
  container.registerVideo(
    createNoopService({
      getCacheStats: vi.fn().mockResolvedValue({ totalSize: 0, fileCount: 0, hitRate: 0, missRate: 0 }),
      getCacheSize: vi.fn().mockResolvedValue(0),
      getCacheMemoryUsage: vi.fn().mockResolvedValue({ used: 0, available: 0, percentage: 0 }),
      getCachedMetadata: vi.fn().mockResolvedValue(null),
      getGpuCapabilities: vi.fn().mockResolvedValue({ available: false, encoders: [], decoders: [] }),
      checkHardwareAccelerationSupport: vi.fn().mockResolvedValue(false),
      getActiveJobs: vi.fn().mockResolvedValue([]),
      getRenderJob: vi.fn().mockResolvedValue({ id: "test-job", status: "completed", progress: 100 }),
      getRenderProgress: vi.fn().mockResolvedValue({ jobId: "test-job", progress: 100, stage: "done" }),
      cancelRender: vi.fn().mockResolvedValue(true),
      renderProject: vi.fn().mockResolvedValue("test-job"),
      generatePreview: vi.fn().mockResolvedValue([]),
      prerenderSegment: vi.fn().mockResolvedValue({ segmentId: "test-segment", frames: [], duration: 0 }),
      getPrerenderCacheInfo: vi.fn().mockResolvedValue({ totalSegments: 0, totalSize: 0 }),
      clearPrerenderCache: vi.fn().mockResolvedValue(0),
      getCompilerSettings: vi.fn().mockResolvedValue({}),
      getUserEffectsList: vi.fn().mockResolvedValue([]),
      loadUserEffect: vi.fn().mockResolvedValue(""),
      loadEffectsCollection: vi.fn().mockResolvedValue(""),
      getSystemInfo: vi.fn().mockResolvedValue({
        os: "test",
        arch: "x64",
        cpuCores: 1,
        totalMemory: 0,
        availableMemory: 0,
      }),
      checkFfmpegCapabilities: vi.fn().mockResolvedValue({
        version: "test",
        codecs: [],
        formats: [],
        filters: [],
        hwAccel: [],
      }),
      loadFile: vi.fn().mockResolvedValue(""),
      extractTimelineFrames: vi.fn().mockResolvedValue([]),
      extractRecognitionFrames: vi.fn().mockResolvedValue([]),
      extractSubtitleFrames: vi.fn().mockResolvedValue([]),
    }) as any,
  )
  container.registerAI(createNoopService() as any)
  container.registerLanguage(
    createNoopService({
      getAppLanguage: vi.fn().mockResolvedValue({ language: "en", system_language: "en" }),
      setAppLanguage: vi.fn(async (language: string) => ({ language, system_language: "en" })),
    }) as any,
  )
  container.registerTranscription(createNoopService() as any)
  container.registerEnhancedSubtitleAutomation(createNoopService() as any)
  container.registerUpdate(createNoopService() as any)
  container.registerUserSettings(
    createNoopService({
      getUserSettings: vi.fn(() => createDefaultUserSettings()),
      updateUserSettings: vi.fn(),
      subscribeToUserSettings: vi.fn(() => ({ unsubscribe: vi.fn() })),
    }) as any,
  )
}

function registerDomainTestBindings() {
  const createMockActor = (context: Record<string, any>) => ({
    getSnapshot: vi.fn(() => ({
      context,
      matches: vi.fn(() => false),
    })),
    send: vi.fn(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
  })
  const timelineActor = createMockActor({
    project: null,
    isLoading: false,
    hasUnsavedChanges: false,
    tracks: [],
    sections: [],
    clips: [],
    selectedClipIds: [],
    selectedTrackIds: [],
    selectedSectionIds: [],
    markers: [],
    currentTime: 0,
    duration: 0,
    zoom: 1,
    scrollLeft: 0,
  })
  const playerActor = createMockActor({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    playbackRate: 1,
  })
  const mediaFacade = {
    mediaPool: new Map(),
    mediaImportState: { isImporting: false, isCompleted: false, isFailed: false, status: "idle" },
    isReady: true,
    isLoading: false,
    error: null,
    importFiles: vi.fn().mockResolvedValue([]),
    selectMediaFiles: vi.fn().mockResolvedValue([]),
    selectAudioFiles: vi.fn().mockResolvedValue([]),
    selectMediaDirectory: vi.fn().mockResolvedValue(null),
    getMediaInfo: vi.fn().mockResolvedValue(null),
    extractMetadata: vi.fn().mockResolvedValue(null),
    removeMedia: vi.fn().mockResolvedValue(undefined),
    removeMultipleMedia: vi.fn().mockResolvedValue(undefined),
  }
  const mediaPreviewFacade = {
    getPreviewData: vi.fn().mockResolvedValue(null),
    generateThumbnail: vi.fn().mockResolvedValue(null),
    clearPreviewData: vi.fn().mockResolvedValue(true),
    getAllFilesWithPreviews: vi.fn().mockResolvedValue([]),
    getFilesWithPreviews: vi.fn().mockResolvedValue([]),
    savePreviewData: vi.fn().mockResolvedValue(true),
    loadPreviewData: vi.fn().mockResolvedValue(true),
    saveTimelineFrames: vi.fn().mockResolvedValue(true),
    getTimelineFrames: vi.fn().mockResolvedValue([]),
    restorePreviewCache: vi.fn().mockResolvedValue(0),
    hasCachedThumbnail: vi.fn().mockResolvedValue(false),
    getCachedThumbnailPath: vi.fn().mockResolvedValue(""),
    isGenerating: false,
    error: null,
  }
  const framePreviewFacade = {
    extractTimelineFrames: vi.fn().mockResolvedValue([]),
    extractRecognitionFrames: vi.fn().mockResolvedValue([]),
    getFrameAtTimestamp: vi.fn().mockResolvedValue(null),
    isExtracting: false,
    error: null,
  }

  setMediaManagementBindings({
    getMediaFiles: vi.fn().mockResolvedValue([]),
    getMediaMetadata: vi.fn().mockResolvedValue(null),
    getMediaMetadataService: vi.fn(() => ({})),
    selectAudioFile: vi.fn().mockResolvedValue([]),
    selectMediaDirectory: vi.fn().mockResolvedValue(null),
    useAutoProxy: vi.fn(() => ({
      generateProxy: vi.fn().mockResolvedValue(null),
      getProxyPath: vi.fn(() => null),
      isGenerating: vi.fn(() => false),
      generatingFileIds: [],
    })),
    useCacheStatistics: vi.fn(() => ({ stats: null, isLoading: false, error: null })),
    useFileOperations: vi.fn(() => ({ isLoading: false, error: null })),
    useFramePreview: vi.fn(() => framePreviewFacade),
    useMediaImport: vi.fn(() => mediaFacade),
    useMediaManagement: vi.fn(() => mediaFacade),
    useMediaMetadata: vi.fn(() => ({ metadata: null, isLoading: false, error: null })),
    useMediaPreview: vi.fn(() => mediaPreviewFacade),
    useMediaProcessor: vi.fn(() => ({
      scanFolder: vi.fn().mockResolvedValue([]),
      scanFolderWithThumbnails: vi.fn().mockResolvedValue([]),
      processFiles: vi.fn().mockResolvedValue([]),
      processFilesWithThumbnails: vi.fn().mockResolvedValue([]),
      isProcessing: false,
      progress: { current: 0, total: 0 },
      errors: new Map(),
      clearErrors: vi.fn(),
      cancelProcessing: vi.fn().mockResolvedValue(undefined),
    })),
    useMediaRestoration: vi.fn(() => ({ isRestoring: false, progress: 0, error: null })),
    usePreviewPreloader: vi.fn(() => ({ preload: vi.fn(), cancel: vi.fn(), isPreloading: false })),
    useSimpleMediaProcessor: vi.fn(() => ({ processFile: vi.fn().mockResolvedValue(null), isProcessing: false })),
  })

  setVideoEditingBindings({
    getVideoEditingOrchestrator: vi.fn(() => ({
      getActors: vi.fn(() => ({
        timeline: timelineActor,
        player: playerActor,
      })),
      createProject: vi.fn().mockResolvedValue(undefined),
      saveProject: vi.fn().mockResolvedValue(undefined),
      loadProject: vi.fn().mockResolvedValue(undefined),
      addTrack: vi.fn().mockResolvedValue(undefined),
      addClip: vi.fn().mockResolvedValue(undefined),
      executeCommand: vi.fn().mockResolvedValue({ success: true, data: null }),
      getProjectState: vi.fn().mockResolvedValue(mockProjectState),
      onStateChange: vi.fn(() => vi.fn()),
    })),
    useUndoRedo: vi.fn(() => ({
      canUndo: false,
      canRedo: false,
      undo: vi.fn(),
      redo: vi.fn(),
      addAction: vi.fn(),
      clearHistory: vi.fn(),
    })),
    UndoRedoHelpers: {
      createAddClipAction: vi.fn(() => ({})),
      createRemoveClipAction: vi.fn(() => ({})),
      createMoveClipAction: vi.fn(() => ({})),
      createBatchOperationAction: vi.fn(() => ({})),
    },
  })

  setMontagePlannerBindings({
    montagePlannerMachine: {},
    applyPlanToTimeline: vi.fn().mockResolvedValue({ success: true }),
    ContentAnalyzer: vi.fn(),
    createMarkersFromPlan: vi.fn(() => []),
    MomentDetector: vi.fn(),
    PlanGenerator: vi.fn(),
    RhythmCalculator: vi.fn(),
    unifiedOrchestrator: {
      getActiveWorkflows: vi.fn(() => []),
    },
    DOMAIN_EVENTS: {
      AI_SERVICES: {},
    },
    eventBus: {
      publish: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    },
  })
}

resetMockUseApp()
registerCoreTestServices()
registerDomainTestBindings()

beforeEach(() => {
  resetMockUseApp()
  registerCoreTestServices()
  registerDomainTestBindings()
})

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

// Mock PlayerProvider, ResourcesProvider, and usePlayer
// После миграции providers в features, этот мок обеспечивает обратную совместимость
vi.mock("@timeline-studio/domains/video-editing", async () => {
  // Импортируем actual domain exports
  const actual = await vi.importActual("@timeline-studio/domains/video-editing")

  return {
    ...actual,
    // Providers (теперь импортируются из features)
    PlayerProvider: ({ children }: { children: React.ReactNode }) => children,
    ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
    TimelineProvider: ({ children }: { children: React.ReactNode }) => children,

    // Hooks из timeline providers
    useTimelineProject: () => ({
      project: null,
      isLoading: false,
      hasUnsavedChanges: false,
      createProject: vi.fn(),
      saveProject: vi.fn(),
      loadProject: vi.fn(),
      backend: null,
    }),
    useTimelinePlayback: () => ({
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1,
      duration: 0,
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      seek: vi.fn(),
      setPlaybackRate: vi.fn(),
    }),
    useTimelineTracks: () => ({
      tracks: [],
      activeTrackId: null,
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      updateTrack: vi.fn(),
      setActiveTrack: vi.fn(),
    }),
    useTimelineUI: () => ({
      timeScale: 1,
      scrollPosition: { x: 0, y: 0 },
      setTimeScale: vi.fn(),
      setScrollPosition: vi.fn(),
    }),
    useTimelineEvents: () => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
    useTimelineMarkers: () => ({
      markers: [],
      addMarker: vi.fn(),
      removeMarker: vi.fn(),
      updateMarker: vi.fn(),
    }),

    // Player hooks
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

    // Resources hooks
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

    // Добавляем типы которые могут импортироваться
    GpuEncoder: {
      H264: "h264",
      H265: "h265",
      VP9: "vp9",
    },
    SubtitleAlignX: {
      LEFT: "left",
      CENTER: "center",
      RIGHT: "right",
    },
  }
})

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

// Modal mocks removed - tests should control their own modal mocks using the new architecture
// from @timeline-studio/domains/system-integration via useModals hook
// Each test can mock useModals individually as needed

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
}))

vi.mock("@timeline-studio/domains/project-management/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@timeline-studio/domains/project-management/hooks")>()
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
vi.mock("@timeline-studio/domains/project-management", () => ({
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

vi.mock("@timeline-studio/domains/project-management/services/app-directories-service", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@timeline-studio/domains/project-management/services/app-directories-service")
    >()
  const mockBaseDir = "/Users/test/Movies/Timeline Studio"
  const mockResourcesDir = `${mockBaseDir}/Resources`
  return {
    ...actual,
    appDirectoriesService: {
      getAppDirectories: vi.fn().mockResolvedValue({
        base_dir: mockBaseDir,
        media_dir: `${mockResourcesDir}/Media`, // Media теперь внутри Resources
        projects_dir: `${mockBaseDir}/Projects`,
        snapshot_dir: `${mockBaseDir}/Snapshot`,
        cinematic_dir: `${mockBaseDir}/Cinematic`,
        output_dir: `${mockBaseDir}/Output`,
        render_dir: `${mockBaseDir}/Render`,
        recognition_dir: `${mockBaseDir}/Recognition`,
        backup_dir: `${mockBaseDir}/Backup`,
        media_proxy_dir: `${mockBaseDir}/MediaProxy`,
        caches_dir: `${mockBaseDir}/Caches`,
        recorded_dir: `${mockBaseDir}/Recorded`,
        audio_dir: `${mockBaseDir}/Audio`,
        cloud_project_dir: `${mockBaseDir}/Cloud Project`,
        upload_dir: `${mockBaseDir}/Upload`,
      }),
      getMediaSubdirectory: vi.fn((type: string) => {
        const subdirs: Record<string, string> = {
          videos: "Videos",
          effects: "Effects",
          transitions: "Transitions",
          images: "Images",
          music: "Music",
          style_templates: "StyleTemplates",
          subtitles: "Subtitles",
          filters: "Filters",
        }
        return `${mockResourcesDir}/Media/${subdirs[type] || type}`
      }),
    },
  }
})

vi.mock("@timeline-studio/core/services/app-directories-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@timeline-studio/core/services/app-directories-service")>()
  const mockBaseDir = "/Users/test/Movies/Timeline Studio"
  const mockResourcesDir = `${mockBaseDir}/Resources`
  return {
    ...actual,
    appDirectoriesService: {
      getAppDirectories: vi.fn().mockResolvedValue({
        base_dir: mockBaseDir,
        media_dir: `${mockResourcesDir}/Media`,
        projects_dir: `${mockBaseDir}/Projects`,
        snapshot_dir: `${mockBaseDir}/Snapshot`,
        cinematic_dir: `${mockBaseDir}/Cinematic`,
        output_dir: `${mockBaseDir}/Output`,
        render_dir: `${mockBaseDir}/Render`,
        recognition_dir: `${mockBaseDir}/Recognition`,
        backup_dir: `${mockBaseDir}/Backup`,
        media_proxy_dir: `${mockBaseDir}/MediaProxy`,
        caches_dir: `${mockBaseDir}/Caches`,
        recorded_dir: `${mockBaseDir}/Recorded`,
        audio_dir: `${mockBaseDir}/Audio`,
        cloud_project_dir: `${mockBaseDir}/Cloud Project`,
        upload_dir: `${mockBaseDir}/Upload`,
      }),
      getMediaSubdirectory: vi.fn((type: string) => {
        const subdirs: Record<string, string> = {
          videos: "Videos",
          effects: "Effects",
          transitions: "Transitions",
          images: "Images",
          music: "Music",
          style_templates: "StyleTemplates",
          subtitles: "Subtitles",
          filters: "Filters",
        }
        return `${mockResourcesDir}/Media/${subdirs[type] || type}`
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

vi.mock("@timeline-studio/domains/ai-services/services/engines/scene-analysis/scene-analysis-engine", () => ({
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
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ""
    readonly thresholds: ReadonlyArray<number> = []
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      void callback
      void options
    }
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
    takeRecords = vi.fn((): IntersectionObserverEntry[] => [])
  } as unknown as typeof globalThis.IntersectionObserver

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

// Mock media-management domain
vi.mock("@timeline-studio/domains/media-management", async () => {
  const actual = await vi.importActual("@timeline-studio/domains/media-management")
  return {
    ...actual,
    DEFAULT_PREVIEW_SIZE_INDEX: 3,
    PREVIEW_SIZES: [125, 150, 200, 250, 300, 400, 500],
  }
})
