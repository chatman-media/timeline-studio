/**
 * Тесты для drag-drop bridge между @dnd-kit и DragDropManager
 */

import type { DragEndEvent } from "@dnd-kit/core"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Используем vi.hoisted() для создания моков, доступных в vi.mock()
const { mockLogger, mockDragDropManager } = vi.hoisted(() => {
  const logger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  }

  const manager = {
    emit: vi.fn(),
  }

  return { mockLogger: logger, mockDragDropManager: manager }
})

// Мокаем модули с полной имплементацией
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => mockLogger),
}))

vi.mock("@/features/drag-drop", () => ({
  getDragDropManager: vi.fn(() => mockDragDropManager),
}))

import {
  convertDndKitToDragDropManager,
  getBridgeStatus,
  handleInterModuleDrag,
  initializeDragDropBridge,
  isInterModuleDrag,
} from "../../services/drag-drop-bridge"

describe("DragDropBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogger.info.mockClear()
    mockLogger.error.mockClear()
  })

  describe("convertDndKitToDragDropManager", () => {
    it("должен корректно конвертировать @dnd-kit данные в DragDropManager формат", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "video-123",
          data: {
            current: {
              type: "video",
              mediaFile: {
                id: "media-123",
                name: "test.mp4",
                thumbnailPath: "/thumb.jpg",
              },
            },
          },
        },
        over: {
          id: "track-456",
        },
      } as any

      const result = convertDndKitToDragDropManager(mockEvent)

      expect(result).toEqual({
        type: "media",
        data: {
          id: "media-123",
          name: "test.mp4",
          thumbnailPath: "/thumb.jpg",
        },
        preview: {
          url: "/thumb.jpg",
          width: 100,
          height: 60,
        },
      })
    })

    it("должен вернуть null для пустых данных", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "test",
          data: {
            current: null,
          },
        },
        over: null,
      } as any

      const result = convertDndKitToDragDropManager(mockEvent)
      expect(result).toBeNull()
    })

    it("должен конвертировать аудио файлы", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "audio-123",
          data: {
            current: {
              type: "audio",
              mediaFile: {
                id: "audio-123",
                name: "song.mp3",
              },
            },
          },
        },
        over: {
          id: "track-456",
        },
      } as any

      const result = convertDndKitToDragDropManager(mockEvent)

      expect(result).toEqual({
        type: "media",
        data: {
          id: "audio-123",
          name: "song.mp3",
        },
        preview: {
          url: undefined,
          width: 100,
          height: 60,
        },
      })
    })
  })

  describe("isInterModuleDrag", () => {
    it("должен определить drag из Browser в Timeline", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "video-123",
          data: { current: {} },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      expect(isInterModuleDrag(mockEvent)).toBe(true)
    })

    it("должен определить drag из Resources в Timeline", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "effect-blur",
          data: { current: {} },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      expect(isInterModuleDrag(mockEvent)).toBe(true)
    })

    it("должен определить internal Timeline drag", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "clip-123",
          data: { current: {} },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      expect(isInterModuleDrag(mockEvent)).toBe(false)
    })

    it("должен определить track insertion drag", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "video-123",
          data: { current: {} },
        },
        over: {
          id: "track-insertion-0",
          data: { current: {} },
        },
      } as any

      expect(isInterModuleDrag(mockEvent)).toBe(true)
    })

    it("должен обработать отсутствие over элемента", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "video-123",
          data: { current: {} },
        },
        over: null,
      } as any

      expect(isInterModuleDrag(mockEvent)).toBe(false)
    })
  })

  describe("handleInterModuleDrag", () => {
    it("должен обработать межмодульный drag & drop", async () => {
      const mockTimelineActions = {
        addSingleMediaToTimeline: vi.fn(),
        addMediaToTimeline: vi.fn(),
      }
      const mockEvent: DragEndEvent = {
        active: {
          id: "video-123",
          data: {
            current: {
              type: "video",
              mediaFile: {
                id: "media-123",
                name: "test.mp4",
              },
            },
          },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      const result = handleInterModuleDrag(mockEvent, mockTimelineActions)

      expect(result).toBe(true)
      expect(mockTimelineActions.addSingleMediaToTimeline).toHaveBeenCalledWith(
        {
          id: "media-123",
          name: "test.mp4",
        },
        "456", // track ID
        0, // start time
      )
      expect(mockDragDropManager.emit).not.toHaveBeenCalled() // Не должен использовать fallback
    })

    it("должен обработать multi-select drag & drop", () => {
      const mockTimelineActions = {
        addSingleMediaToTimeline: vi.fn(),
        addMediaToTimeline: vi.fn(),
      }

      const selectedFiles = [
        { id: "media-1", name: "video1.mp4" },
        { id: "media-2", name: "video2.mp4" },
        { id: "media-3", name: "video3.mp4" },
      ]

      const mockEvent: DragEndEvent = {
        active: {
          id: "video-multi-123",
          data: {
            current: {
              type: "video",
              mediaFile: selectedFiles[0],
              isMultiSelect: true,
              selectedFiles: selectedFiles,
            },
          },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      const result = handleInterModuleDrag(mockEvent, mockTimelineActions)

      expect(result).toBe(true)
      expect(mockTimelineActions.addMediaToTimeline).toHaveBeenCalledWith(selectedFiles)
      expect(mockTimelineActions.addSingleMediaToTimeline).not.toHaveBeenCalled()
      expect(mockDragDropManager.emit).not.toHaveBeenCalled()
    })

    it("должен вернуть false для не-межмодульного drag", () => {
      const mockEvent: DragEndEvent = {
        active: {
          id: "clip-123",
          data: { current: {} },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      const result = handleInterModuleDrag(mockEvent)

      expect(result).toBe(false)
      expect(mockDragDropManager.emit).not.toHaveBeenCalled()
    })

    it("должен обработать ошибки gracefully", () => {
      // Мокаем ошибку в addSingleMediaToTimeline
      const mockTimelineActions = {
        addSingleMediaToTimeline: vi.fn().mockImplementation(() => {
          throw new Error("Test error")
        }),
        addMediaToTimeline: vi.fn(),
      }

      const mockEvent: DragEndEvent = {
        active: {
          id: "video-123",
          data: {
            current: {
              type: "video",
              mediaFile: {
                id: "media-123",
                name: "test.mp4",
              },
            },
          },
        },
        over: {
          id: "track-456",
          data: { current: {} },
        },
      } as any

      const result = handleInterModuleDrag(mockEvent, mockTimelineActions)

      expect(result).toBe(false)
      // Проверяем что logger.error был вызван с правильным сообщением
      expect(mockLogger.error).toHaveBeenCalledWith("[DragDropBridge] Failed to bridge drag:", { error: expect.any(Error) })
    })
  })

  describe("initializeDragDropBridge", () => {
    it("должен инициализировать bridge", () => {
      initializeDragDropBridge()

      // Проверяем что logger.info был вызван с правильным сообщением
      expect(mockLogger.info).toHaveBeenCalledWith("[DragDropBridge] Initializing drag & drop bridge")
    })
  })

  describe("getBridgeStatus", () => {
    it("должен вернуть статус bridge", () => {
      const status = getBridgeStatus()

      expect(status).toEqual({
        initialized: true,
        dndKitAvailable: true, // В тестовой среде window доступен
        dragDropManagerAvailable: true,
        supportedTypes: ["media", "music", "effect", "filter", "transition", "template"],
      })
    })
  })
})
