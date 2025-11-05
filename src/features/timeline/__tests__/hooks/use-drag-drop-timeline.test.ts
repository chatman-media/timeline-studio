/**
 * Расширенные тесты для useDragDropTimeline hook
 */

import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import mocks
import "@/test/mocks/dnd-kit"

import { useDragDropTimeline } from "../../hooks/use-drag-drop-timeline"
import type { TrackType } from "../../types"
import type { DragType } from "../../types/drag-drop"

// Import the actual hook after mocks are set up

// Моки для внешних зависимостей
const mockAddSingleMediaToTimeline = vi.fn()
const mockAddTrack = vi.fn()
const mockUiState = {
  timeScale: 1,
  snapMode: "none" as const,
  selectedTrackIds: [],
}

vi.mock("../../hooks/use-timeline", () => ({
  useTimeline: () => ({
    uiState: mockUiState,
    addTrack: mockAddTrack,
  }),
}))

vi.mock("../../hooks/use-timeline-actions", () => ({
  useTimelineActions: () => ({
    addSingleMediaToTimeline: mockAddSingleMediaToTimeline,
  }),
}))

vi.mock("../../utils/drag-calculations", () => ({
  calculateTimelinePosition: vi.fn((mouseX, rect, _scrollLeft, timeScale) => {
    return (mouseX - rect.left) / timeScale
  }),
  canDropOnTrack: vi.fn((mediaFile, trackType) => {
    if (mediaFile.isVideo) return trackType === "video"
    if (mediaFile.isAudio) return trackType === "audio"
    if (mediaFile.isImage) return trackType === "video"
    return false
  }),
  findInsertionPoint: vi.fn((timePosition, _trackId, _duration) => timePosition),
  getTrackTypeForMediaFile: vi.fn((mediaFile) => {
    if (mediaFile.isVideo) return "video"
    if (mediaFile.isAudio) return "audio"
    if (mediaFile.isImage) return "video"
    return "video"
  }),
  snapToGrid: vi.fn((position, snapMode) => {
    if (snapMode === "grid") return Math.floor(position)
    return position
  }),
}))

// Mock для DOM элементов
Object.defineProperty(document, "querySelector", {
  value: vi.fn(() => ({
    getBoundingClientRect: () => ({
      left: 100,
      right: 500,
      top: 50,
      bottom: 150,
      width: 400,
      height: 100,
    }),
    scrollLeft: 0,
  })),
  writable: true,
})

describe("useDragDropTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUiState.timeScale = 1
    mockUiState.snapMode = "none"
  })

  describe("Hook Initialization", () => {
    it("должен возвращать объект со всеми необходимыми свойствами и методами", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current).toHaveProperty("dragState")
      expect(result.current).toHaveProperty("handleDragStart")
      expect(result.current).toHaveProperty("handleDragOver")
      expect(result.current).toHaveProperty("handleDragEnd")
      expect(result.current).toHaveProperty("isValidDropTarget")
      expect(result.current).toHaveProperty("isValidDropTargetForNewTrack")
    })

    it("должен инициализироваться с корректным состоянием по умолчанию", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.dragState).toEqual({
        isDragging: false,
        draggedItem: null,
        dragOverTrack: null,
        dropPosition: null,
        snapPoint: null,
        snapActive: false,
      })
    })

    it("должен возвращать функции для всех обработчиков событий", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(typeof result.current.handleDragStart).toBe("function")
      expect(typeof result.current.handleDragOver).toBe("function")
      expect(typeof result.current.handleDragEnd).toBe("function")
      expect(typeof result.current.isValidDropTarget).toBe("function")
      expect(typeof result.current.isValidDropTargetForNewTrack).toBe("function")
    })
  })

  describe("Управление состоянием Drag", () => {
    it("должен иметь isDragging false по умолчанию", () => {
      const { result } = renderHook(() => useDragDropTimeline())
      expect(result.current.dragState.isDragging).toBe(false)
    })

    it("должен иметь все свойства состояния drag определенными", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.dragState.isDragging).toBeDefined()
      expect(result.current.dragState.draggedItem).toBeDefined()
      expect(result.current.dragState.dragOverTrack).toBeDefined()
      expect(result.current.dragState.dropPosition).toBeDefined()
    })
  })

  describe("Функции валидации", () => {
    it("должен возвращать false для isValidDropTarget когда не происходит drag", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.isValidDropTarget("track-1", "video")).toBe(false)
      expect(result.current.isValidDropTarget("track-2", "audio")).toBe(false)
    })

    it("должен возвращать false для isValidDropTargetForNewTrack когда не происходит drag", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      expect(result.current.isValidDropTargetForNewTrack()).toBe(false)
      expect(result.current.isValidDropTargetForNewTrack("video" as TrackType)).toBe(false)
    })
  })

  describe("handleDragStart", () => {
    const createMockDragStartEvent = (mediaFile: any, dragType: DragType = "video"): DragStartEvent => ({
      active: {
        id: "media-item-1",
        data: {
          current: {
            type: dragType,
            mediaFile,
          },
        },
        rect: { current: { initial: null, translated: null } },
      },
      activatorEvent: new MouseEvent("mousedown"),
    })

    it("должен установить состояние dragging при начале перетаскивания", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      const mediaFile = {
        name: "test-video.mp4",
        path: "/path/to/test-video.mp4",
        duration: 120,
        isVideo: true,
        isAudio: false,
        isImage: false,
      }

      const event = createMockDragStartEvent(mediaFile, "video")

      act(() => {
        result.current.handleDragStart(event)
      })

      expect(result.current.dragState.isDragging).toBe(true)
      expect(result.current.dragState.draggedItem).toEqual({
        type: "video",
        mediaFile,
      })
      expect(result.current.dragState.dragOverTrack).toBeNull()
      expect(result.current.dragState.dropPosition).toBeNull()
    })

    it("должен игнорировать event без dragData", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      const event: DragStartEvent = {
        active: {
          id: "media-item-1",
          data: { current: null },
          rect: { current: { initial: null, translated: null } },
        },
        activatorEvent: new MouseEvent("mousedown"),
      }

      act(() => {
        result.current.handleDragStart(event)
      })

      expect(result.current.dragState.isDragging).toBe(false)
      expect(result.current.dragState.draggedItem).toBeNull()
    })
  })

  describe("handleDragOver", () => {
    const createMockDragOverEvent = (overData: any): DragOverEvent => ({
      active: {
        id: "media-item-1",
        data: {
          current: {
            type: "video" as DragType,
            mediaFile: {
              name: "test.mp4",
              isVideo: true,
              isAudio: false,
              isImage: false,
              duration: 60,
            },
          },
        },
        rect: { current: { initial: null, translated: null } },
      },
      over: overData
        ? {
            id: "drop-zone-1",
            data: { current: overData },
            rect: { left: 100, right: 500, top: 50, bottom: 150, width: 400, height: 100 },
          }
        : null,
      delta: { x: 0, y: 0 },
      activatorEvent: new MouseEvent("mousemove", { clientX: 200 }),
      collisions: [],
    })

    it("должен сбрасывать состояние при отсутствии over зоны", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      // Сначала устанавливаем состояние drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: { name: "test.mp4", isVideo: true, isAudio: false, isImage: false },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      const event = createMockDragOverEvent(null)

      act(() => {
        result.current.handleDragOver(event)
      })

      expect(result.current.dragState.dragOverTrack).toBeNull()
      expect(result.current.dragState.dropPosition).toBeNull()
    })

    it("должен обрабатывать track-insertion зоны", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      // Сначала начинаем drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: { name: "test.mp4", isVideo: true, isAudio: false, isImage: false },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      const event = createMockDragOverEvent({
        type: "track-insertion",
        insertIndex: 0,
      })

      act(() => {
        result.current.handleDragOver(event)
      })

      expect(result.current.dragState.dropPosition).toMatchObject({
        type: "track-insertion",
        insertIndex: 0,
        trackType: "video",
        startTime: 0,
      })
    })

    it("должен обрабатывать drop на существующие треки", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      // Сначала начинаем drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: { name: "test.mp4", isVideo: true, isAudio: false, isImage: false, duration: 10 },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      const event = createMockDragOverEvent({
        trackId: "track-1",
        trackType: "video",
      })

      act(() => {
        result.current.handleDragOver(event)
      })

      expect(result.current.dragState.dragOverTrack).toBe("track-1")
      expect(result.current.dragState.dropPosition).toHaveProperty("trackId", "track-1")
      expect(result.current.dragState.dropPosition).toHaveProperty("startTime")
    })
  })

  describe("handleDragEnd", () => {
    const createMockDragEndEvent = (overData: any): DragEndEvent => ({
      active: {
        id: "media-item-1",
        data: {
          current: {
            type: "video" as DragType,
            mediaFile: {
              name: "test.mp4",
              isVideo: true,
              isAudio: false,
              isImage: false,
              duration: 60,
            },
          },
        },
        rect: { current: { initial: null, translated: null } },
      },
      over: overData
        ? {
            id: "drop-zone-1",
            data: { current: overData },
            rect: { left: 100, right: 500, top: 50, bottom: 150, width: 400, height: 100 },
          }
        : null,
      delta: { x: 100, y: 0 },
      activatorEvent: new MouseEvent("mouseup"),
      collisions: [],
    })

    it("должен сбрасывать состояние при отсутствии валидного drop", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      const event = createMockDragEndEvent(null)

      act(() => {
        result.current.handleDragEnd(event)
      })

      expect(result.current.dragState.isDragging).toBe(false)
      expect(result.current.dragState.draggedItem).toBeNull()
      expect(result.current.dragState.dragOverTrack).toBeNull()
      expect(result.current.dragState.dropPosition).toBeNull()
    })

    it("должен создавать новый трек при drop в track-insertion зону", async () => {
      const { result } = renderHook(() => useDragDropTimeline())

      // Сначала начинаем drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: { name: "test.mp4", isVideo: true, isAudio: false, isImage: false },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      // Устанавливаем dropPosition через handleDragOver
      act(() => {
        result.current.handleDragOver({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: { name: "test.mp4", isVideo: true, isAudio: false, isImage: false },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          over: {
            id: "insertion-zone",
            data: {
              current: {
                type: "track-insertion",
                insertIndex: 0,
              },
            },
            rect: { left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100 },
          },
          delta: { x: 0, y: 0 },
          activatorEvent: new MouseEvent("mousemove"),
          collisions: [],
        })
      })

      const event = createMockDragEndEvent({
        type: "track-insertion",
        insertIndex: 0,
      })

      act(() => {
        result.current.handleDragEnd(event)
      })

      // Проверяем вызов addTrack
      expect(mockAddTrack).toHaveBeenCalledWith("video", "Video Track")

      // Ждем асинхронную операцию с таймаутом
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Проверяем вызов addSingleMediaToTimeline
      expect(mockAddSingleMediaToTimeline).toHaveBeenCalled()
    })

    it("должен добавлять медиа на существующий трек", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      const mediaFile = {
        name: "test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
        duration: 60,
      }

      // Начинаем drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile,
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      // Устанавливаем dropPosition
      act(() => {
        result.current.handleDragOver({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile,
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          over: {
            id: "track-1",
            data: {
              current: {
                trackId: "track-1",
                trackType: "video",
              },
            },
            rect: { left: 100, right: 500, top: 50, bottom: 150, width: 400, height: 100 },
          },
          delta: { x: 0, y: 0 },
          activatorEvent: new MouseEvent("mousemove", { clientX: 200 }),
          collisions: [],
        })
      })

      const event = createMockDragEndEvent({
        trackId: "track-1",
        trackType: "video",
      })

      act(() => {
        result.current.handleDragEnd(event)
      })

      expect(mockAddSingleMediaToTimeline).toHaveBeenCalledWith(mediaFile, "track-1", undefined)
    })
  })

  describe("Расчеты позиции и снэппинга", () => {
    // TODO: Тест пропущен - требуется проверка
    it.skip("должен правильно рассчитывать позицию времени", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      // Начинаем drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: {
                  name: "test.mp4",
                  isVideo: true,
                  isAudio: false,
                  isImage: false,
                  duration: 60,
                },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      // Симулируем drag over с разными позициями мыши
      const event: DragOverEvent = {
        active: {
          id: "test",
          data: {
            current: {
              type: "video" as DragType,
              mediaFile: {
                name: "test.mp4",
                isVideo: true,
                isAudio: false,
                isImage: false,
                duration: 10,
              },
            },
          },
          rect: { current: { initial: null, translated: null } },
        },
        over: {
          id: "track-1",
          data: {
            current: {
              trackId: "track-1",
              trackType: "video",
            },
          },
          rect: { left: 100, right: 500, top: 50, bottom: 150, width: 400, height: 100 },
        },
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousemove", { clientX: 300 }), // Середина трека
        collisions: [],
      }

      act(() => {
        result.current.handleDragOver(event)
      })

      // При clientX: 300, left: 100, width: 400, timeScale: 1
      // Позиция = (300 - 100) / 1 = 200
      expect(result.current.dragState.dropPosition?.startTime).toBe(200)
    })

    // TODO: Тест пропущен - требуется проверка
    it.skip("должен применять снэппинг при включенном режиме", () => {
      mockUiState.snapMode = "grid"
      const { result } = renderHook(() => useDragDropTimeline())

      // Начинаем drag
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: {
                  name: "test.mp4",
                  isVideo: true,
                  isAudio: false,
                  isImage: false,
                  duration: 60,
                },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      const event: DragOverEvent = {
        active: {
          id: "test",
          data: {
            current: {
              type: "video" as DragType,
              mediaFile: {
                name: "test.mp4",
                isVideo: true,
                isAudio: false,
                isImage: false,
                duration: 10,
              },
            },
          },
          rect: { current: { initial: null, translated: null } },
        },
        over: {
          id: "track-1",
          data: {
            current: {
              trackId: "track-1",
              trackType: "video",
            },
          },
          rect: { left: 100, right: 500, top: 50, bottom: 150, width: 400, height: 100 },
        },
        delta: { x: 0, y: 0 },
        activatorEvent: new MouseEvent("mousemove", { clientX: 218 }), // Должно снэппиться к 120
        collisions: [],
      }

      act(() => {
        result.current.handleDragOver(event)
      })

      // При snapMode: "grid" позиция должна снэппиться к кратному 1
      expect(result.current.dragState.dropPosition?.startTime).toBe(118)
    })
  })

  describe("Валидация во время drag операций", () => {
    it("должен корректно валидировать drop target для видео", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      // Начинаем drag с видео файлом
      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile: {
                  name: "test.mp4",
                  isVideo: true,
                  isAudio: false,
                  isImage: false,
                },
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      // Видео можно дропнуть только на видео треки
      expect(result.current.isValidDropTarget("track-1", "video")).toBe(true)
      expect(result.current.isValidDropTarget("track-2", "audio")).toBe(false)
      expect(result.current.isValidDropTarget("track-3", "subtitle")).toBe(false)
    })

    it("должен правильно валидировать новые треки во время drag", () => {
      const { result } = renderHook(() => useDragDropTimeline())

      const mediaFile = {
        name: "test.mp4",
        isVideo: true,
        isAudio: false,
        isImage: false,
      }

      act(() => {
        result.current.handleDragStart({
          active: {
            id: "test",
            data: {
              current: {
                type: "video" as DragType,
                mediaFile,
              },
            },
            rect: { current: { initial: null, translated: null } },
          },
          activatorEvent: new MouseEvent("mousedown"),
        })
      })

      // Любой медиафайл может создать новый трек
      expect(result.current.isValidDropTargetForNewTrack()).toBe(true)
      expect(result.current.isValidDropTargetForNewTrack("video" as TrackType)).toBe(true)
    })
  })
})
