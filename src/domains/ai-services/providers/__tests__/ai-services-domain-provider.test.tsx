import { act, render, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  AIServicesDomainProvider,
  useAIServicesChat,
  useAIServicesDomain,
  useAIServicesDomainStatus,
  useAIServicesIntelligence,
  useAIServicesMontage,
  useAIUsageMonitor,
} from "../ai-services-domain-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Создаем shared mock object который переиспользуется
const mockBackendSyncInstance = {
  connected: true,
  executeCommand: vi.fn().mockResolvedValue({ success: true, data: {} }),
  onStateChange: vi.fn().mockReturnValue(vi.fn()),
  onEvent: vi.fn().mockReturnValue(vi.fn()),
}

// Mock getBackendSync
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => mockBackendSyncInstance),
}))

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
    // Chat machine mock
    if (machine?.id?.includes?.("chat") || machine?.toString?.()?.includes?.("chat")) {
      return [
        {
          context: {
            chatMessages: [],
            isProcessing: false,
            error: null,
          },
        },
        mockChatSend,
      ]
    }
    // Montage planner machine mock
    if (machine?.id?.includes?.("montage") || machine?.toString?.()?.includes?.("montage")) {
      return [
        {
          context: {
            isAnalyzing: false,
            currentPlan: null,
            error: null,
          },
        },
        mockMontageSend,
      ]
    }
    // AI intelligence machine mock (default)
    return [
      {
        context: {
          progress: 0,
          result: null,
          errors: [],
        },
      },
      mockIntelligenceSend,
    ]
  }),
}))

describe("AIServicesDomainProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем моки
    mockBackendSyncInstance.executeCommand.mockClear()
    mockBackendSyncInstance.executeCommand.mockResolvedValue({ success: true, data: {} })
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
    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Вызываем синхронизацию
    await act(async () => {
      await result.current.syncAIState()
    })

    // Проверяем вызов backend - код отправляет команду напрямую
    await waitFor(() => {
      expect(mockBackendSyncInstance.executeCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SyncState",
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
          timestamp: expect.any(String),
        }),
      )
    })
  })

  it("должен включать/выключать сервисы и синхронизировать с backend", async () => {
    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Отключаем сервис
    await act(async () => {
      await result.current.disableService("chatEnabled")
    })

    // Проверяем вызов backend - код отправляет команду напрямую
    expect(mockBackendSyncInstance.executeCommand).toHaveBeenCalledWith({
      type: "UpdateAIServiceConfig",
      service: "chatEnabled",
      enabled: false,
    })

    expect(result.current.config.chatEnabled).toBe(false)
  })

  it("должен сбрасывать все сервисы", async () => {
    const { result } = renderHook(() => useAIServicesDomain(), {
      wrapper: ({ children }) => <AIServicesDomainProvider>{children}</AIServicesDomainProvider>,
    })

    // Сбрасываем все сервисы
    await act(async () => {
      await result.current.resetAllServices()
    })

    // Проверяем уведомление backend - код отправляет команду напрямую
    expect(mockBackendSyncInstance.executeCommand).toHaveBeenCalledWith({
      type: "ResetAllAIServices",
      timestamp: expect.any(String),
    })
  })

  it("должен восстанавливать конфигурацию из backend", async () => {
    let stateCallback: any

    // Перехватываем callback ДО монтирования провайдера
    vi.mocked(getBackendSync).mockImplementationOnce(() => ({
      connected: true,
      executeCommand: vi.fn().mockResolvedValue({ success: true, data: {} }),
      onStateChange: vi.fn().mockImplementation((callback: any) => {
        stateCallback = callback
        return vi.fn() // unsubscribe
      }),
      onEvent: vi.fn().mockReturnValue(vi.fn()),
    }))

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
    // Устанавливаем мок ДО монтирования провайдера
    vi.mocked(getBackendSync).mockImplementationOnce(() => ({
      connected: true,
      executeCommand: vi.fn().mockResolvedValue({
        success: true,
        data: {
          totalRequests: 42,
          totalTokens: 1337,
        },
      }),
      onStateChange: vi.fn().mockReturnValue(vi.fn()),
      onEvent: vi.fn().mockReturnValue(vi.fn()),
    }))

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
          <div data-testid="chat">{(chat.chatState as any).messages?.length || 0}</div>
          <div data-testid="montage">{((montage.montagePlannerState as any).isAnalyzing || false).toString()}</div>
          <div data-testid="intelligence">
            {((intelligence.aiIntelligenceState as any).isAnalyzing || false).toString()}
          </div>
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

    // Проверяем что текст содержит "chatEnabled"
    expect(getByTestId("enabled").textContent).toContain("chatEnabled")
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
