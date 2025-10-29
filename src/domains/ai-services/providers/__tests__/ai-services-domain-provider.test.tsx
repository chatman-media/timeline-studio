import { act, render, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { 
  AIServicesDomainProvider, 
  useAIServicesDomain, 
  useAIServicesChat,
  useAIServicesMontage,
  useAIServicesIntelligence,
  useAIServicesDomainStatus,
  useAIUsageMonitor
} from "../ai-services-domain-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock getBackendSync
import { getBackendSync } from "@/features/app-state/services/backend-sync"

// Mock machines
vi.mock("../../machines/chat-machine", () => ({
  chatMachine: {
    provide: vi.fn(),
  },
}))

vi.mock("../../machines/montage-planner-machine", () => ({
  montagePlannerMachine: {
    provide: vi.fn(),
  },
}))

vi.mock("../../machines/ai-intelligence-machine", () => ({
  aiIntelligenceMachine: {
    provide: vi.fn(),
  },
}))

// Mock useActor
const mockChatSend = vi.fn()
const mockMontageSend = vi.fn()
const mockIntelligenceSend = vi.fn()

vi.mock("@xstate/react", () => ({
  useActor: vi.fn((machine) => {
    if (machine.provide === vi.mocked(vi.importActual("../../machines/chat-machine")).chatMachine?.provide) {
      return [
        {
          context: {
            messages: [],
            isLoading: false,
            error: null,
          },
        },
        mockChatSend,
      ]
    }
    if (machine.provide === vi.mocked(vi.importActual("../../machines/montage-planner-machine")).montagePlannerMachine?.provide) {
      return [
        {
          context: {
            isAnalyzing: false,
            montagePlan: null,
            error: null,
          },
        },
        mockMontageSend,
      ]
    }
    return [
      {
        context: {
          isAnalyzing: false,
          analysisResults: null,
          error: null,
        },
      },
      mockIntelligenceSend,
    ]
  }),
}))

describe("AIServicesDomainProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить детей", () => {
    const { getByText } = render(
      <AIServicesDomainProvider>
        <div>Test Child</div>
      </AIServicesDomainProvider>,
    )

    expect(getByText("Test Child")).toBeInTheDocument()
  })

  it("должен предоставлять контекст через useAIServicesDomain", () => {
    const TestComponent = () => {
      const context = useAIServicesDomain()
      return (
        <div>
          <div data-testid="chatEnabled">{context.config.chatEnabled.toString()}</div>
          <div data-testid="intelligenceEnabled">{context.config.intelligenceEnabled.toString()}</div>
          <div data-testid="isBackendConnected">{context.isBackendConnected.toString()}</div>
          <div data-testid="totalRequests">{context.aiUsageStats.totalRequests}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <AIServicesDomainProvider>
        <TestComponent />
      </AIServicesDomainProvider>,
    )

    expect(getByTestId("chatEnabled")).toHaveTextContent("true")
    expect(getByTestId("intelligenceEnabled")).toHaveTextContent("true")
    expect(getByTestId("isBackendConnected")).toHaveTextContent("true")
    expect(getByTestId("totalRequests")).toHaveTextContent("0")
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    const TestComponent = () => {
      useAIServicesDomain()
      return null
    }

    // Подавляем вывод ошибки в консоль для этого теста
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow("useAIServicesDomain must be used within AIServicesDomainProvider")

    consoleSpy.mockRestore()
  })

  it("должен синхронизировать состояние AI сервисов с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Вызываем синхронизацию
    await act(async () => {
      await result.current.syncAIState()
    })

    // Проверяем вызов backend
    await waitFor(() => {
      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "AI",
        params: {
          type: "SyncAIServicesState",
          params: expect.objectContaining({
            config: expect.objectContaining({
              chatEnabled: true,
              intelligenceEnabled: true,
              montagePlannerEnabled: true,
              recognitionEnabled: true,
            }),
            chatHistory: expect.any(Array),
            montageStatus: expect.any(Object),
            intelligenceStatus: expect.any(Object),
            usageStats: expect.any(Object),
          }),
        },
      })
    })
  })

  it("должен включать/выключать сервисы и синхронизировать с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Отключаем сервис
    await act(async () => {
      result.current.disableService("chatEnabled")
    })

    // Проверяем вызов backend
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "AI",
      params: {
        type: "UpdateAIServiceConfig",
        params: { service: "chatEnabled", enabled: false },
      },
    })

    expect(result.current.config.chatEnabled).toBe(false)
  })

  it("должен сбрасывать все сервисы", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Сбрасываем все сервисы
    await act(async () => {
      result.current.resetAllServices()
    })

    // Проверяем вызовы машин
    expect(mockChatSend).toHaveBeenCalledWith({ type: "CLEAR_MESSAGES" })
    expect(mockMontageSend).toHaveBeenCalledWith({ type: "RESET" })
    expect(mockIntelligenceSend).toHaveBeenCalledWith({ type: "RESET" })

    // Проверяем уведомление backend
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "AI",
      params: {
        type: "ResetAllAIServices",
        params: { timestamp: expect.any(String) },
      },
    })
  })

  it("должен восстанавливать конфигурацию из backend", async () => {
    const mockBackendSync = getBackendSync()
    let stateCallback: any

    // Сохраняем callback для вызова позже
    mockBackendSync.onStateChange.mockImplementation((callback) => {
      stateCallback = callback
      return vi.fn() // unsubscribe
    })

    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Симулируем получение состояния от backend
    await act(async () => {
      if (stateCallback) {
        stateCallback({
          ai_services_config: {
            chatEnabled: false,
            intelligenceEnabled: true,
            montagePlannerEnabled: false,
            recognitionEnabled: true,
          },
        })
      }
    })

    expect(result.current.config.chatEnabled).toBe(false)
    expect(result.current.config.montagePlannerEnabled).toBe(false)
  })

  it("должен обновлять статистику использования от backend", async () => {
    const mockBackendSync = getBackendSync()
    mockBackendSync.executeCommand.mockResolvedValueOnce({
      success: true,
      data: {
        totalRequests: 42,
        totalTokens: 1337,
      },
    })

    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Вызываем синхронизацию
    await act(async () => {
      await result.current.syncAIState()
    })

    await waitFor(() => {
      expect(result.current.aiUsageStats.totalRequests).toBe(42)
      expect(result.current.aiUsageStats.totalTokens).toBe(1337)
    })
  })

  it("должен предоставлять хуки для отдельных сервисов", () => {
    const TestComponent = () => {
      const chat = useAIServicesChat()
      const montage = useAIServicesMontage()
      const intelligence = useAIServicesIntelligence()
      
      return (
        <div>
          <div data-testid="chat">{chat.chatState.messages.length}</div>
          <div data-testid="montage">{montage.montagePlannerState.isAnalyzing.toString()}</div>
          <div data-testid="intelligence">{intelligence.aiIntelligenceState.isAnalyzing.toString()}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <AIServicesDomainProvider>
        <TestComponent />
      </AIServicesDomainProvider>,
    )

    expect(getByTestId("chat")).toHaveTextContent("0")
    expect(getByTestId("montage")).toHaveTextContent("false")
    expect(getByTestId("intelligence")).toHaveTextContent("false")
  })

  it("должен предоставлять статус домена через useAIServicesDomainStatus", () => {
    const TestComponent = () => {
      const status = useAIServicesDomainStatus()
      
      return (
        <div>
          <div data-testid="enabled">{status.enabledServices.join(",")}</div>
          <div data-testid="chatEnabled">{status.isServiceEnabled("chatEnabled").toString()}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <AIServicesDomainProvider>
        <TestComponent />
      </AIServicesDomainProvider>,
    )

    expect(getByTestId("enabled")).toContain("chatEnabled")
    expect(getByTestId("chatEnabled")).toHaveTextContent("true")
  })

  it("должен мониторить использование через useAIUsageMonitor", () => {
    const TestComponent = () => {
      const monitor = useAIUsageMonitor()
      
      return (
        <div>
          <div data-testid="totalUsage">{monitor.stats.totalRequests}</div>
          <div data-testid="canSync">{monitor.canSync.toString()}</div>
          <div data-testid="isConnected">{monitor.isConnected.toString()}</div>
        </div>
      )
    }

    const { getByTestId } = render(
      <AIServicesDomainProvider>
        <TestComponent />
      </AIServicesDomainProvider>,
    )

    expect(getByTestId("totalUsage")).toHaveTextContent("0")
    expect(getByTestId("canSync")).toHaveTextContent("false")
    expect(getByTestId("isConnected")).toHaveTextContent("true")
  })
})