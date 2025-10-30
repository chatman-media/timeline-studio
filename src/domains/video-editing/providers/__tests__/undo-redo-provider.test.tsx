import { act, render, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useUndoRedo } from "../../hooks/use-undo-redo"
import { UndoRedoProvider } from "../undo-redo-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock getBackendSync
import { getBackendSync } from "@/features/app-state/services/backend-sync"

// Mock orchestrator
vi.mock("../../services/video-editing-orchestrator", () => ({
  getVideoEditingOrchestrator: vi.fn(() => ({
    getSnapshot: vi.fn(() => ({
      context: {
        undoStack: [],
        redoStack: [],
        isTracking: true,
      },
    })),
    send: vi.fn(),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getActors: vi.fn(() => ({
      timeline: {
        send: vi.fn(),
        getSnapshot: vi.fn(() => ({ context: {} })),
      },
    })),
  })),
}))

describe("UndoRedoProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить детей", () => {
    const { getByText } = render(
      <UndoRedoProvider>
        <div>Test Child</div>
      </UndoRedoProvider>,
    )

    expect(getByText("Test Child")).toBeInTheDocument()
  })

  it("должен предоставлять контекст через useUndoRedo", () => {
    const TestComponent = () => {
      const context = useUndoRedo()
      return (
        <div>
          <div data-testid="canUndo">{context.canUndo.toString()}</div>
          <div data-testid="canRedo">{context.canRedo.toString()}</div>
          <div data-testid="historyStats">{JSON.stringify(context.historyStats)}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <UndoRedoProvider>
        <TestComponent />
      </UndoRedoProvider>,
    )

    expect(getByTestId("canUndo")).toHaveTextContent("false")
    expect(getByTestId("canRedo")).toHaveTextContent("false")
    expect(getByTestId("historyStats")).toBeInTheDocument()
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    const TestComponent = () => {
      useUndoRedo()
      return null
    }

    // Подавляем вывод ошибки в консоль для этого теста
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow("useUndoRedo must be used within UndoRedoProvider")

    consoleSpy.mockRestore()
  })

  it("должен синхронизировать историю с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useUndoRedo(), {
      wrapper: ({ children }) => <UndoRedoProvider>{children}</UndoRedoProvider>,
    })

    // Симулируем добавление действия
    await act(async () => {
      result.current.registerAction({
        type: "ADD_CLIP",
        description: "Add clip",
        undoData: { clipId: "test-clip" },
        redoData: { clipId: "test-clip", trackId: "test-track", mediaFile: "test.mp4", time: 0 },
        affectedEntities: { clips: ["test-clip"], tracks: ["test-track"] },
        priority: "medium",
        mergeable: false,
      })
    })

    // Ждем debounce (1 секунда)
    await waitFor(
      () => {
        expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
          type: "History",
          params: {
            type: "SyncUndoRedoHistory",
            params: expect.objectContaining({
              undoStack: expect.any(Array),
              redoStack: expect.any(Array),
              maxHistorySize: expect.any(Number),
              lastSyncTime: expect.any(String),
            }),
          },
        })
      },
      { timeout: 1500 },
    )
  })

  it("должен восстанавливать историю из backend", async () => {
    const mockBackendSync = getBackendSync()
    let stateCallback: any

    // Сохраняем callback для вызова позже
    mockBackendSync.onStateChange.mockImplementation((callback) => {
      stateCallback = callback
      return vi.fn() // unsubscribe
    })

    render(
      <UndoRedoProvider>
        <div>Test</div>
      </UndoRedoProvider>,
    )

    // Симулируем получение состояния от backend
    await act(async () => {
      if (stateCallback) {
        stateCallback({
          undo_redo_history: {
            undoStack: [
              {
                type: "timeline/add-clip",
                description: "Add clip",
                timestamp: Date.now(),
                data: { clipId: "restored-clip" },
              },
            ],
            redoStack: [],
            lastSyncTime: new Date().toISOString(),
          },
        })
      }
    })

    expect(mockBackendSync.onStateChange).toHaveBeenCalled()
  })

  it("должен логировать действия в аналитику", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useUndoRedo(), {
      wrapper: ({ children }) => <UndoRedoProvider>{children}</UndoRedoProvider>,
    })

    // Выполняем undo
    await act(async () => {
      result.current.undo()
    })

    // Проверяем логирование
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Analytics",
      params: {
        type: "LogUndoRedoAction",
        params: expect.objectContaining({
          action: "undo",
          undoStackSize: expect.any(Number),
          redoStackSize: expect.any(Number),
        }),
      },
    })
  })

  it("должен очищать историю и синхронизировать с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useUndoRedo(), {
      wrapper: ({ children }) => <UndoRedoProvider>{children}</UndoRedoProvider>,
    })

    // Очищаем историю
    await act(async () => {
      result.current.clearHistory()
    })

    // Проверяем вызов backend
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "History",
      params: {
        type: "ClearHistory",
        params: {
          timestamp: expect.any(String),
        },
      },
    })
  })

  it("должен предоставлять статистику истории", async () => {
    const { result } = renderHook(() => useUndoRedo(), {
      wrapper: ({ children }) => <UndoRedoProvider>{children}</UndoRedoProvider>,
    })

    // Проверяем статистику
    expect(result.current.historyStats).toBeDefined()
    expect(typeof result.current.historyStats.undoCount).toBe("number")
    expect(typeof result.current.historyStats.redoCount).toBe("number")
  })
})
