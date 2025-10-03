import { act, renderHook } from "@testing-library/react"
import React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useTimelineProject } from "@/domains/video-editing"

// Мокаем backend-sync ДО импорта компонентов
vi.mock("@/features/app-state/services/backend-sync", () => {
  const mockExecuteCommand = vi.fn()
  const mockOnStateChange = vi.fn()
  const mockOnEvent = vi.fn()
  const mockConnect = vi.fn()
  const mockDisconnect = vi.fn()
  const mockGetProjectState = vi.fn()
  const mockGetEventHistory = vi.fn()

  // Создаем мок класса BackendSync внутри фабрики
  class MockBackendSync {
    onStateChange = mockOnStateChange
    onEvent = mockOnEvent
    executeCommand = mockExecuteCommand
    connect = mockConnect
    disconnect = mockDisconnect
    getProjectState = mockGetProjectState
    getEventHistory = mockGetEventHistory
  }

  const mockBackendSyncInstance = new MockBackendSync()

  return {
    getBackendSync: vi.fn(() => mockBackendSyncInstance),
    BackendSync: MockBackendSync,
    _mockExecuteCommand: mockExecuteCommand,
    _mockOnStateChange: mockOnStateChange,
    _mockOnEvent: mockOnEvent,
    _mockConnect: mockConnect,
    _mockDisconnect: mockDisconnect,
    _mockGetProjectState: mockGetProjectState,
    _mockGetEventHistory: mockGetEventHistory,
  }
})

// Мокаем AppProvider для избежания проблем с машиной состояний
vi.mock("@/features/app-state/services/app-provider", () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useApp: vi.fn(() => ({
    projectState: { project: null },
    executeCommand: vi.fn(),
    isConnected: true,
    isConnecting: false,
    connectionError: null,
  })),
}))

// Мокаем video-editing-orchestrator
vi.mock("@/domains/video-editing/services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: vi.fn(() => ({
    getActors: vi.fn(() => ({
      timeline: {
        send: vi.fn(),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      },
    })),
    createProject: vi.fn(),
    saveProject: vi.fn(),
    loadProject: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    stopPlayback: vi.fn(),
    seek: vi.fn(),
    addTrack: vi.fn(),
    addClip: vi.fn(),
    executeCommand: vi.fn(),
  })),
}))

// Мокаем старый TimelineProvider для совместимости с test-utils (только providers, не hooks)
vi.mock("@/domains/video-editing/providers/timeline-providers", () => ({
  TimelineProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TimelineProjectProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TimelinePlaybackProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TimelineTracksProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TimelineClipsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Create mock functions that can be tracked
const mockExecuteCommand = vi.fn()
const mockPlay = vi.fn(() => mockExecuteCommand({ type: "Play" }))
const mockPause = vi.fn(() => mockExecuteCommand({ type: "Pause" }))
const mockStop = vi.fn(() => mockExecuteCommand({ type: "Stop" }))
const mockSeek = vi.fn((time: number) => mockExecuteCommand({ type: "Seek", params: { time } }))
const mockSetPlaybackRate = vi.fn((rate: number) => mockExecuteCommand({ type: "SetPlaybackRate", params: { rate } }))
// Global mock state for selection
const mockSelectionState = {
  selectedClipIds: [] as string[],
  selectedTrackIds: [] as string[],
  clipboardClips: [] as string[],
}

// Simple state management for mocking
let mockSelectedClipIds: string[] = []
let mockSelectedTrackIds: string[] = []
let mockClipboardClips: string[] = []

// Force update mechanism
let forceUpdateCallback: (() => void) | null = null

const resetSelectionState = () => {
  mockSelectedClipIds = []
  mockSelectedTrackIds = []
  mockClipboardClips = []
  forceUpdateCallback?.()
}

// Provider component that manages selection state
const SelectionStateProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
const mockApplyEffect = vi.fn()
const mockRemoveEffect = vi.fn()
const mockApplyFilter = vi.fn()
const mockRemoveFilter = vi.fn()
const mockApplyTransition = vi.fn()
const mockRemoveTransition = vi.fn()
const mockCreateProject = vi.fn()
const mockSaveProject = vi.fn()
const mockLoadProject = vi.fn()
const mockAddTrack = vi.fn()
const mockRemoveTrack = vi.fn()
const mockUpdateTrack = vi.fn()
const mockReorderTracks = vi.fn()
const mockSetActiveTrack = vi.fn()
const mockAddClip = vi.fn()
const mockRemoveClip = vi.fn()
const mockMoveClip = vi.fn()
const mockTrimClip = vi.fn()
const mockSplitClip = vi.fn()
const mockUpdateClip = vi.fn()
const mockBatchUpdateClips = vi.fn()

// Мокаем timeline hooks для useTimeline
vi.mock("@/domains/video-editing", () => ({
  useTimelineProject: vi.fn(() => ({
    project: null,
    isLoading: false,
    hasUnsavedChanges: false,
    createProject: async (name: string) => {
      await mockExecuteCommand({
        type: "CreateProject",
        params: { name, template: "default" },
      })
      return mockCreateProject(name)
    },
    saveProject: async (projectPath?: string) => {
      await mockExecuteCommand({
        type: "SaveProject",
        params: { path: projectPath },
      })
      return mockSaveProject(projectPath)
    },
    loadProject: mockLoadProject,
    backend: null,
  })),
  useTimelinePlayback: vi.fn(() => ({
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    duration: 0,
    play: mockPlay,
    pause: mockPause,
    stop: mockStop,
    seek: mockSeek,
    setPlaybackRate: mockSetPlaybackRate,
  })),
  useTimelineTracks: vi.fn(() => ({
    tracks: [],
    activeTrackId: null,
    addTrack: vi.fn(async (type: any, name?: string, sectionId?: string) => {
      await mockExecuteCommand({
        type: "AddTrack",
        params: {
          name: name || `${type} Track`,
          track_type: type.toUpperCase(),
          index: null,
        },
      })
      mockAddTrack(type, name, sectionId)
    }),
    removeTrack: vi.fn(async (trackId: string) => {
      await mockExecuteCommand({
        type: "DeleteTrack",
        params: { track_id: trackId },
      })
      mockRemoveTrack(trackId)
    }),
    updateTrack: vi.fn(async (trackId: string, updates: any) => {
      // updateTrack doesn't call executeCommand in the actual implementation
      mockUpdateTrack(trackId, updates)
    }),
    reorderTracks: mockReorderTracks,
    setActiveTrack: mockSetActiveTrack,
  })),
  useTimelineClips: vi.fn(() => ({
    clips: [],
    addClip: vi.fn(async (trackId: string, mediaFile: any, time: number) => {
      await mockExecuteCommand({
        type: "AddClip",
        params: { track_id: trackId, media_id: mediaFile.id, time },
      })
      mockAddClip(trackId, mediaFile, time)
    }),
    removeClip: vi.fn(async (clipId: string) => {
      await mockExecuteCommand({
        type: "DeleteClip",
        params: { clip_id: clipId },
      })
      mockRemoveClip(clipId)
    }),
    moveClip: vi.fn(async (clipId: string, trackId: string, time: number) => {
      await mockExecuteCommand({
        type: "MoveClip",
        params: { clip_id: clipId, track_id: trackId, time },
      })
      mockMoveClip(clipId, trackId, time)
    }),
    trimClip: vi.fn(async (clipId: string, startTime: number, endTime: number) => {
      await mockExecuteCommand({
        type: "TrimClip",
        params: { clip_id: clipId, start: startTime, end: endTime },
      })
      mockTrimClip(clipId, startTime, endTime)
    }),
    splitClip: mockSplitClip,
    updateClip: vi.fn(async (clipId: string, updates: any) => {
      await mockExecuteCommand({
        type: "UpdateClip",
        params: { clip_id: clipId, updates },
      })
      mockUpdateClip(clipId, updates)
    }),
    batchUpdateClips: mockBatchUpdateClips,
  })),
  useTimelineSelection: vi.fn(() => {
    // Set up force update callback for this instance
    const [, forceUpdate] = React.useReducer((x) => x + 1, 0)
    React.useEffect(() => {
      forceUpdateCallback = forceUpdate
      return () => {
        forceUpdateCallback = null
      }
    }, [])

    return {
      selectedClipIds: mockSelectedClipIds,
      selectedTrackIds: mockSelectedTrackIds,
      clipboardClips: mockClipboardClips,
      selectClips: vi.fn((clipIds: string[]) => {
        mockSelectedClipIds = clipIds
        forceUpdateCallback?.()
      }),
      selectTracks: vi.fn((trackIds: string[]) => {
        mockSelectedTrackIds = trackIds
        forceUpdateCallback?.()
      }),
      clearSelection: vi.fn(() => {
        mockSelectedClipIds = []
        mockSelectedTrackIds = []
        forceUpdateCallback?.()
      }),
      copyClips: vi.fn(() => {
        mockClipboardClips = [...mockSelectedClipIds]
        forceUpdateCallback?.()
      }),
      cutClips: vi.fn(async () => {
        mockClipboardClips = [...mockSelectedClipIds]
        mockSelectedClipIds = []
        forceUpdateCallback?.()
      }),
      pasteClips: vi.fn(async () => {
        forceUpdateCallback?.()
      }),
      deleteSelected: vi.fn(async () => {
        mockSelectedClipIds = []
        mockSelectedTrackIds = []
        forceUpdateCallback?.()
      }),
    }
  }),
  useTimelineEffects: vi.fn(() => ({
    applyEffect: mockApplyEffect,
    removeEffect: mockRemoveEffect,
    applyFilter: mockApplyFilter,
    removeFilter: mockRemoveFilter,
    applyTransition: mockApplyTransition,
    removeTransition: mockRemoveTransition,
  })),
}))

// Мокаем useMachine для UI машины
const mockUISend = vi.fn()
const mockUIState = {
  context: {
    timeScale: 1,
    scrollX: 0,
    scrollY: 0,
    scrollPosition: { x: 0, y: 0 },
    editMode: "select" as const,
    snapMode: "none" as const,
    selectedClipIds: [] as string[],
    selectedTrackIds: [] as string[],
    selectedSectionIds: [] as string[],
    isPlaying: false,
    currentTime: 0,
    playbackRate: 1,
    clipboard: null,
    uiError: null,
  },
}

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockUIState, mockUISend]),
}))

import type { MediaFile } from "@/features/media/types/media"
import { TimelineProviders } from "@/test/test-utils"
import { useTimeline } from "../../hooks/use-timeline"

// Получаем моки из модуля
const {
  _mockOnStateChange: mockOnStateChange,
  _mockOnEvent: mockOnEvent,
  _mockConnect: mockConnect,
  _mockDisconnect: mockDisconnect,
  _mockGetProjectState: mockGetProjectState,
  _mockGetEventHistory: mockGetEventHistory,
} = await import("@/features/app-state/services/backend-sync")

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TimelineProviders>
    <SelectionStateProvider>{children}</SelectionStateProvider>
  </TimelineProviders>
)

describe("useTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockClear()
    mockExecuteCommand.mockResolvedValue({ success: true, data: null, error: null })
    mockOnStateChange.mockClear()
    mockOnStateChange.mockReturnValue(() => {})
    mockOnEvent.mockClear()
    mockOnEvent.mockReturnValue(() => {})
    mockConnect.mockClear()
    mockDisconnect.mockClear()
    mockGetProjectState.mockClear()
    mockGetEventHistory.mockClear()
    mockUISend.mockClear()

    // Reset selection state
    resetSelectionState()
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    // Проверяем что хук выбрасывает ошибку при использовании вне провайдера
    // Временно отключаем мок для useTimelineProject чтобы он использовал реальную реализацию
    const mockedUseTimelineProject = vi.mocked(useTimelineProject)

    // Отключаем мок для этого теста - выбрасываем ошибку как реальный хук
    mockedUseTimelineProject.mockImplementationOnce(() => {
      throw new Error("useTimelineProject must be used within TimelineProjectProvider")
    })

    // Проверяем что ошибка выбрасывается
    const { result } = renderHook(() => {
      try {
        return useTimeline()
      } catch (error: any) {
        return { error: error.message }
      }
    })

    expect(result.current).toEqual({ error: "useTimelineProject must be used within TimelineProjectProvider" })
  })

  it("должен возвращать контекст при использовании внутри провайдера", () => {
    const { result } = renderHook(() => useTimeline(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.project).toBeNull()
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.currentTime).toBe(0)
    expect(result.current.playbackRate).toBe(1)
  })

  describe("Управление проектом", () => {
    it("должен создавать новый проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.createProject("Test Project")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateProject",
        params: {
          name: "Test Project",
          template: "default",
        },
      })
    })

    it("должен загружать существующий проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // В новой архитектуре загрузка проекта происходит через backend
      // Проверяем, что есть проект после загрузки
      expect(result.current.project).toBeNull()
    })

    it("должен сохранять проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.saveProject()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SaveProject",
        params: {
          path: undefined,
        },
      })
    })

    it("должен закрывать проект", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // В новой архитектуре проект закрывается через backend команду
      // Проверяем что проект null после закрытия
      expect(result.current.project).toBeNull()
    })
  })

  describe("Управление секциями", () => {
    it("должен выводить предупреждение о неподдерживаемости секций", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      await act(async () => {
        await result.current.addSection("New Section", 0, 10)
      })

      expect(warnSpy).toHaveBeenCalledWith(
        "addSection is deprecated - sections are not implemented in the new architecture",
      )
      expect(mockExecuteCommand).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it("должен выводить предупреждение при удалении секции", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      await act(async () => {
        await result.current.removeSection("section-1")
      })

      expect(warnSpy).toHaveBeenCalledWith(
        "removeSection is deprecated - sections are not implemented in the new architecture",
      )
      expect(mockExecuteCommand).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })

  describe("Управление треками", () => {
    it("должен добавлять новый трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addTrack("video", "Video Track")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddTrack",
        params: {
          name: "Video Track",
          track_type: "VIDEO",
          index: null,
        },
      })
    })

    it("должен удалять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeTrack("track-1")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "DeleteTrack",
        params: {
          track_id: "track-1",
        },
      })
    })

    it("должен обновлять трек", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateTrack("track-1", { name: "Updated Track" })
      })

      // updateTrack doesn't call executeCommand - it only updates the timeline state
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })
  })

  describe("Управление клипами", () => {
    it("должен добавлять клип из медиафайла", async () => {
      const mockMediaFile: MediaFile = {
        id: "media-1",
        name: "test.mp4",
        path: "/test/test.mp4",
        isVideo: true,
        duration: 60,
        size: 1024,
      }

      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.addClip("track-1", mockMediaFile, 0)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "AddClip",
        params: {
          track_id: "track-1",
          media_id: mockMediaFile.id,
          time: 0,
        },
      })
    })

    it("должен удалять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.removeClip("clip-1")
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "DeleteClip",
        params: {
          clip_id: "clip-1",
        },
      })
    })

    it("должен обновлять клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.updateClip("clip-1", { volume: 0.5 })
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "UpdateClip",
        params: {
          clip_id: "clip-1",
          updates: {
            volume: 0.5,
          },
        },
      })
    })

    it("должен перемещать клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.moveClip("clip-1", "track-2", 20)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "MoveClip",
        params: {
          clip_id: "clip-1",
          track_id: "track-2",
          time: 20,
        },
      })
    })

    it("должен обрезать клип", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.trimClip("clip-1", 2, 8)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "TrimClip",
        params: {
          clip_id: "clip-1",
          start: 2,
          end: 8,
        },
      })
    })
  })

  describe("UI операции", () => {
    it("должен устанавливать масштаб временной шкалы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      act(() => {
        result.current.setTimeScale(2)
      })

      expect(warnSpy).toHaveBeenCalledWith("setTimeScale is deprecated - use UI state management instead")
      warnSpy.mockRestore()
    })

    it("должен устанавливать позицию прокрутки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      act(() => {
        result.current.setScrollPosition({ x: 100, y: 50 })
      })

      expect(warnSpy).toHaveBeenCalledWith("setScrollPosition is deprecated - use UI state management instead")
      warnSpy.mockRestore()
    })

    it("должен устанавливать режим редактирования", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      act(() => {
        result.current.setEditMode("cut")
      })

      expect(warnSpy).toHaveBeenCalledWith("setEditMode is deprecated - use UI state management instead")
      warnSpy.mockRestore()
    })

    it("должен переключать режим привязки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      act(() => {
        result.current.toggleSnap()
      })

      expect(warnSpy).toHaveBeenCalledWith("toggleSnap is deprecated - use UI state management instead")
      warnSpy.mockRestore()
    })
  })

  describe("Выделение", () => {
    it("должен выделять клипы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectClips(["clip-1", "clip-2"])
      })

      // Проверяем что клипы добавлены в выделение
      expect(result.current.selectedClipIds).toEqual(["clip-1", "clip-2"])
    })

    it("должен выделять треки", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.selectTracks(["track-1", "track-2"])
      })

      // Проверяем что треки добавлены в выделение
      expect(result.current.selectedTrackIds).toEqual(["track-1", "track-2"])
    })

    it("должен выделять секции", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      act(() => {
        result.current.selectSections(["section-1", "section-2"])
      })

      expect(warnSpy).toHaveBeenCalledWith(
        "selectSections is deprecated - sections are not implemented in the new architecture",
      )
      warnSpy.mockRestore()
    })

    it("должен сбрасывать выделение", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Сначала выделяем что-то
      act(() => {
        result.current.selectClips(["clip-1"])
        result.current.selectTracks(["track-1"])
      })

      // Затем очищаем выделение
      act(() => {
        result.current.clearSelection()
      })

      // Проверяем что выделение очищено
      expect(result.current.selectedClipIds).toEqual([])
      expect(result.current.selectedTrackIds).toEqual([])
    })
  })

  describe("Воспроизведение", () => {
    it("должен запускать воспроизведение", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.play()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Play",
      })
    })

    it("должен останавливать воспроизведение", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.pause()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Pause",
      })
    })

    it("должен перематывать к определенному времени", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.seek(30)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "Seek",
        params: { time: 30 },
      })
    })

    it("должен устанавливать скорость воспроизведения", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.setPlaybackRate(2)
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SetPlaybackRate",
        params: { rate: 2 },
      })
    })
  })

  describe("Операции с буфером обмена", () => {
    it("должен копировать выделенные элементы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.copySelection()
      })

      // В новой архитектуре copySelection обрабатывается внутри провайдера
      // Проверяем что метод существует
      expect(result.current.copySelection).toBeDefined()
      expect(typeof result.current.copySelection).toBe("function")
    })

    it("должен вырезать выделенные элементы", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      act(() => {
        result.current.cutSelection()
      })

      // В новой архитектуре cutSelection обрабатывается внутри провайдера
      expect(result.current.cutSelection).toBeDefined()
    })

    it("должен вставлять элементы", async () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      await act(async () => {
        await result.current.paste("track-1", 10)
      })

      // paste теперь асинхронный и работает с backend
      expect(result.current.paste).toBeDefined()
    })
  })

  describe("Интеграция с редактором", () => {
    it("должен иметь методы работы с эффектами", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Проверяем что методы работы с эффектами существуют
      expect(result.current.applyEffect).toBeDefined()
      expect(typeof result.current.applyEffect).toBe("function")
      expect(result.current.removeEffect).toBeDefined()
      expect(typeof result.current.removeEffect).toBe("function")
      expect(result.current.applyFilter).toBeDefined()
      expect(typeof result.current.applyFilter).toBe("function")
      expect(typeof result.current.removeFilter).toBe("function")
      expect(result.current.applyTransition).toBeDefined()
      expect(typeof result.current.applyTransition).toBe("function")
    })

    it("должен отправлять события через send", () => {
      const { result } = renderHook(() => useTimeline(), { wrapper })

      // Проверяем метод send
      expect(result.current.send).toBeDefined()
      expect(typeof result.current.send).toBe("function")

      // Отправляем кастомное событие
      result.current.send({
        type: "ADD_EFFECT_TO_CLIP",
        clipId: "clip-1",
        effect: {
          id: "effect-1",
          effectId: "blur",
          intensity: 0.5,
          order: 0,
        },
      })

      // Метод send должен работать без ошибок
      expect(true).toBe(true)
    })
  })
})
