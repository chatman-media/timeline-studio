import { act, render, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SystemIntegrationProvider, useSystemIntegration, useSystemIntegrationBackendSync } from "../system-integration-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Mock getBackendSync
import { getBackendSync } from "@/features/app-state/services/backend-sync"

// Mock orchestrator
const mockOrchestrator = {
  getSnapshot: vi.fn(() => ({
    context: {
      featureFlags: {
        enableAdvancedEditing: true,
        enableCloudSync: false,
      },
      systemInfo: {
        platform: "darwin",
        version: "1.0.0",
      },
      notifications: [],
    },
  })),
  send: vi.fn(),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
}

vi.mock("../../services/system-integration-orchestrator", () => ({
  getSystemIntegrationOrchestrator: vi.fn(() => mockOrchestrator),
}))

describe("SystemIntegrationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить детей", () => {
    const { getByText } = render(
      <SystemIntegrationProvider>
        <div>Test Child</div>
      </SystemIntegrationProvider>,
    )

    expect(getByText("Test Child")).toBeInTheDocument()
  })

  it("должен предоставлять контекст через useSystemIntegration", () => {
    const TestComponent = () => {
      const context = useSystemIntegration()
      return (
        <div>
          <div data-testid="platform">{context.systemInfo.platform}</div>
          <div data-testid="version">{context.systemInfo.version}</div>
          <div data-testid="featureEnabled">
            {context.isFeatureEnabled("enableAdvancedEditing").toString()}
          </div>
        </div>
      )
    }

    const { getByTestId } = render(
      <SystemIntegrationProvider>
        <TestComponent />
      </SystemIntegrationProvider>,
    )

    expect(getByTestId("platform")).toHaveTextContent("darwin")
    expect(getByTestId("version")).toHaveTextContent("1.0.0")
    expect(getByTestId("featureEnabled")).toHaveTextContent("true")
  })

  it("должен выбрасывать ошибку при использовании вне провайдера", () => {
    const TestComponent = () => {
      useSystemIntegration()
      return null
    }

    // Подавляем вывод ошибки в консоль для этого теста
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow("useSystemIntegration must be used within SystemIntegrationProvider")

    consoleSpy.mockRestore()
  })

  it("должен синхронизировать feature flags с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useSystemIntegrationBackendSync(), {
      wrapper: ({ children }) => <SystemIntegrationProvider>{children}</SystemIntegrationProvider>,
    })

    // Проверяем подключение
    expect(result.current.isBackendConnected).toBe(true)

    // Вызываем синхронизацию
    await act(async () => {
      await result.current.syncFeatureFlags()
    })

    // Проверяем вызов backend
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "System",
      params: {
        type: "SyncFeatureFlags",
        params: {
          flags: expect.objectContaining({
            enableAdvancedEditing: true,
            enableCloudSync: false,
          }),
          timestamp: expect.any(String),
        },
      },
    })
  })

  it("должен обновлять feature flag и синхронизировать с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useSystemIntegration(), {
      wrapper: ({ children }) => <SystemIntegrationProvider>{children}</SystemIntegrationProvider>,
    })

    // Обновляем флаг
    await act(async () => {
      result.current.setFeatureFlag("enableCloudSync", true)
    })

    // Проверяем вызов orchestrator
    expect(mockOrchestrator.send).toHaveBeenCalledWith({
      type: "SET_FEATURE_FLAG",
      flag: "enableCloudSync",
      enabled: true,
    })

    // Проверяем немедленную синхронизацию
    await waitFor(() => {
      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
        type: "System",
        params: {
          type: "UpdateFeatureFlag",
          params: {
            flag: "enableCloudSync",
            enabled: true,
            timestamp: expect.any(String),
          },
        },
      })
    })
  })

  it("должен синхронизировать уведомления с backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useSystemIntegrationBackendSync(), {
      wrapper: ({ children }) => <SystemIntegrationProvider>{children}</SystemIntegrationProvider>,
    })

    // Вызываем синхронизацию уведомлений
    await act(async () => {
      await result.current.syncNotifications()
    })

    // Проверяем вызов backend
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "System",
      params: {
        type: "SyncNotifications",
        params: {
          notifications: expect.any(Array),
          unreadCount: expect.any(Number),
        },
      },
    })
  })

  it("должен восстанавливать состояние из backend", async () => {
    const mockBackendSync = getBackendSync()
    let stateCallback: any

    // Сохраняем callback для вызова позже
    mockBackendSync.onStateChange.mockImplementation((callback) => {
      stateCallback = callback
      return vi.fn() // unsubscribe
    })

    render(
      <SystemIntegrationProvider>
        <div>Test</div>
      </SystemIntegrationProvider>,
    )

    // Симулируем получение состояния от backend
    await act(async () => {
      if (stateCallback) {
        stateCallback({
          system_integration_state: {
            featureFlags: {
              enableAdvancedEditing: false,
              enableCloudSync: true,
              enableAIAssistant: true,
            },
            systemInfo: {
              platform: "win32",
              version: "2.0.0",
            },
          },
        })
      }
    })

    expect(mockBackendSync.onStateChange).toHaveBeenCalled()
  })

  it("должен добавлять уведомление и логировать в backend", async () => {
    const mockBackendSync = getBackendSync()

    const { result } = renderHook(() => useSystemIntegration(), {
      wrapper: ({ children }) => <SystemIntegrationProvider>{children}</SystemIntegrationProvider>,
    })

    // Добавляем уведомление
    await act(async () => {
      result.current.addNotification({
        type: "info",
        title: "Test Notification",
        message: "This is a test",
      })
    })

    // Проверяем логирование
    expect(mockBackendSync.executeCommand).toHaveBeenCalledWith({
      type: "Analytics",
      params: {
        type: "LogNotification",
        params: {
          type: "info",
          title: "Test Notification",
          timestamp: expect.any(String),
        },
      },
    })
  })
})