import { act, render, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock getBackendSync для получения доступа к моку
import { getBackendSync } from "@/features/app-state/services/backend-sync"

// Сначала определяем моки
const mockSend = vi.fn()
const mockContext = {
  isAnalyzing: false,
  analysisResults: null,
  error: null,
  currentVideoId: null,
}

const mockActor = {
  getSnapshot: vi.fn(() => ({
    context: mockContext,
  })),
  send: mockSend,
  subscribe: vi.fn(() => vi.fn()),
  stop: vi.fn(),
  start: vi.fn(),
}

// Mock машины состояний
vi.mock("@/domains/ai-services/machines/ai-intelligence-machine", () => ({
  aiIntelligenceMachine: {
    provide: vi.fn(),
  },
}))

vi.mock("xstate", () => ({
  createActor: () => mockActor,
}))

// Импортируем компоненты после моков
import { AIIntelligenceProvider, useAIIntelligence } from "../ai-intelligence-provider"

describe("AIIntelligenceProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем моки актора
    mockActor.start.mockClear()
    mockActor.stop.mockClear()
    mockActor.subscribe.mockReturnValue(vi.fn())
  })

  it("должен рендерить детей", () => {
    const { getByText } = render(
      <AIIntelligenceProvider>
        <div>Test Child</div>
      </AIIntelligenceProvider>,
    )

    expect(getByText("Test Child")).toBeInTheDocument()
  })

  it("должен предоставлять контекст через useAIIntelligence", async () => {
    const TestComponent = () => {
      const context = useAIIntelligence()
      const state = context.actor?.getSnapshot?.()
      return (
        <div>
          <div data-testid="isAnalyzing">{state?.context.isAnalyzing.toString()}</div>
          <div data-testid="isBackendConnected">{context.isConnected.toString()}</div>
          <div data-testid="hasResults">{state?.context.analysisResults ? "true" : "false"}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <AIIntelligenceProvider>
        <TestComponent />
      </AIIntelligenceProvider>,
    )

    // Ждем инициализации актора
    await waitFor(() => {
      expect(mockActor.start).toHaveBeenCalled()
    })

    expect(getByTestId("isAnalyzing")).toHaveTextContent("false")
    expect(getByTestId("isBackendConnected")).toHaveTextContent("false") // Начальное состояние
    expect(getByTestId("hasResults")).toHaveTextContent("false")
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    const TestComponent = () => {
      useAIIntelligence()
      return null
    }

    // Подавляем вывод ошибки в консоль для этого теста
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow("useAIIntelligence must be used within AIIntelligenceProvider")

    consoleSpy.mockRestore()
  })

  it("должен синхронизировать состояние анализа с backend", async () => {
    const mockBackendSync = getBackendSync()
    let subscribeCallback: any

    // Настраиваем мок для вызова callback при подписке
    mockActor.subscribe.mockImplementation((callback) => {
      subscribeCallback = callback
      return vi.fn()
    })

    const { result } = renderHook(() => useAIIntelligence(), {
      wrapper: ({ children }) => <AIIntelligenceProvider>{children}</AIIntelligenceProvider>,
    })

    // Проверяем, что isConnected установлен правильно
    expect(result.current.isConnected).toBe(false) // Начальное состояние false

    // Симулируем событие через callback подписки
    await act(async () => {
      if (subscribeCallback) {
        subscribeCallback({
          event: {
            type: "START_ANALYSIS",
          },
        })
      }
    })

    // Ждем вызов синхронизации
    await waitFor(() => {
      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AI",
        params: {
          type: "StartContentAnalysis",
          params: {
            config: undefined,
            mediaFiles: undefined,
          },
        },
      })
    })
  })

  it("должен восстанавливать состояние из backend при подключении", async () => {
    const mockBackendSync = getBackendSync()
    let stateCallback: any

    // Подписываемся на изменения состояния
    mockBackendSync.onStateChange.mockImplementation((callback) => {
      stateCallback = callback
      return vi.fn() // unsubscribe
    })

    render(
      <AIIntelligenceProvider>
        <div>Test</div>
      </AIIntelligenceProvider>,
    )

    // Симулируем получение состояния от backend
    await act(async () => {
      if (stateCallback) {
        stateCallback({
          ai_state: {
            analysis_results: {
              scenes: [],
              objects: [],
              transcript: null,
            },
            is_analyzing: false,
          },
        } as ProjectState)
      }
    })

    expect(mockBackendSync.onStateChange).toHaveBeenCalled()
  })
})
