import { vi } from "vitest"

import { container } from "../container"

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

export function getMockProjectState() {
  return mockProjectState
}

export const createNoopService = (overrides: Record<PropertyKey, any> = {}) =>
  new Proxy(overrides, {
    get(target, property) {
      if (property in target) {
        return target[property]
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

vi.mock("@timeline-studio/core/hooks/use-app", () => ({
  useApp: mockUseApp,
}))

export function resetMockUseApp() {
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

export function registerCoreTestServices() {
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
