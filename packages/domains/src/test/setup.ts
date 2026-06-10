import { setMediaManagementBindings } from "@timeline-studio/core/services/media-management-registry"
import { setMontagePlannerBindings } from "@timeline-studio/core/services/montage-planner-registry"
import { setVideoEditingBindings } from "@timeline-studio/core/services/video-editing-registry"
import { getMockProjectState } from "@timeline-studio/core/test/setup"
import { vi } from "vitest"

export function registerDomainTestBindings() {
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
      getProjectState: vi.fn().mockResolvedValue(getMockProjectState()),
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
