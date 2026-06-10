/**
 * @vitest-environment jsdom
 */
/**
 * Тесты для хука useUpdateManager
 */

import { act, renderHook } from "@testing-library/react"
import { container, resetContainer } from "@timeline-studio/core/container"
import type { IUpdateService } from "@timeline-studio/core/ports"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { UpdateMachineContext } from "../../types"
import { useUpdateAvailability, useUpdateManager } from "../use-update-manager"

// Мокаем XState
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(),
}))

const mockUpdateService: IUpdateService = {
  checkForUpdates: vi.fn(),
  downloadAndInstall: vi.fn(),
  getCurrentVersion: vi.fn(),
  isUpdaterAvailable: vi.fn(),
  subscribe: vi.fn(() => vi.fn()),
  enableAutoCheck: vi.fn(),
  disableAutoCheck: vi.fn(),
  getCurrentStatus: vi.fn(),
  reset: vi.fn(),
  getAutoCheckSettings: vi.fn(),
  dispose: vi.fn(),
}

describe("useUpdateManager", () => {
  const mockSend = vi.fn()
  const mockState = {
    value: "idle",
    matches: vi.fn((state: string) => state === "idle"),
    context: {
      currentVersion: "1.0.0",
      availableUpdate: undefined,
      error: undefined,
      progress: undefined,
      autoCheckEnabled: false,
      autoCheckInterval: 60,
      lastCheckTime: undefined,
    } as UpdateMachineContext,
  }

  beforeEach(async () => {
    resetContainer()
    vi.clearAllMocks()
    container.registerUpdate(mockUpdateService)
    const { useMachine } = await import("@xstate/react")
    vi.mocked(useMachine).mockReturnValue([mockState, mockSend] as any)
  })

  afterEach(() => {
    resetContainer()
  })

  it("возвращает правильную структуру", () => {
    const { result } = renderHook(() => useUpdateManager())

    expect(result.current).toMatchObject({
      state: expect.any(String),
      context: expect.any(Object),
      isInitializing: expect.any(Boolean),
      isIdle: expect.any(Boolean),
      isChecking: expect.any(Boolean),
      isUpdateAvailable: expect.any(Boolean),
      isDownloading: expect.any(Boolean),
      isReadyToInstall: expect.any(Boolean),
      isInstalling: expect.any(Boolean),
      isInstalled: expect.any(Boolean),
      isError: expect.any(Boolean),
      currentVersion: expect.any(String),
      autoCheckSettings: expect.any(Object),
      checkForUpdates: expect.any(Function),
      downloadUpdate: expect.any(Function),
      installUpdate: expect.any(Function),
      cancelUpdate: expect.any(Function),
      retry: expect.any(Function),
      dismiss: expect.any(Function),
      enableAutoCheck: expect.any(Function),
      disableAutoCheck: expect.any(Function),
    })
  })

  it("правильно определяет состояния", () => {
    const { result, rerender } = renderHook(() => useUpdateManager())

    expect(result.current.isIdle).toBe(true)
    expect(result.current.isChecking).toBe(false)

    // Меняем состояние на checking
    mockState.matches.mockImplementation((state: string) => state === "checking")
    mockState.value = "checking"
    rerender()

    expect(result.current.isIdle).toBe(false)
    expect(result.current.isChecking).toBe(true)
  })

  it("вызывает checkForUpdates", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.checkForUpdates()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "CHECK_FOR_UPDATES" })
  })

  it("вызывает downloadUpdate", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.downloadUpdate()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "DOWNLOAD_UPDATE" })
  })

  it("вызывает installUpdate", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.installUpdate()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "INSTALL_UPDATE" })
  })

  it("вызывает cancelUpdate", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.cancelUpdate()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "CANCEL_UPDATE" })
  })

  it("вызывает retry", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.retry()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "RETRY" })
  })

  it("вызывает dismiss", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.dismiss()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "DISMISS" })
  })

  it("вызывает enableAutoCheck с интервалом", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.enableAutoCheck(120)
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 120 })
  })

  it("вызывает enableAutoCheck с дефолтным интервалом", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.enableAutoCheck()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "ENABLE_AUTO_CHECK", intervalMinutes: 60 })
  })

  it("вызывает disableAutoCheck", () => {
    const { result } = renderHook(() => useUpdateManager())

    act(() => {
      result.current.disableAutoCheck()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "DISABLE_AUTO_CHECK" })
  })

  it("подписывается на события updateService", async () => {
    renderHook(() => useUpdateManager())

    expect(mockUpdateService.subscribe).toHaveBeenCalled()
  })

  it("включает/выключает автопроверку в сервисе", () => {
    // Автопроверка выключена
    renderHook(() => useUpdateManager())
    expect(mockUpdateService.disableAutoCheck).toHaveBeenCalled()

    // Включаем автопроверку
    mockState.context.autoCheckEnabled = true
    mockState.context.autoCheckInterval = 120
    const { rerender } = renderHook(() => useUpdateManager())
    rerender()

    expect(mockUpdateService.enableAutoCheck).toHaveBeenCalledWith(120)
  })

  it("возвращает данные контекста", () => {
    // Создаем новый контекст с обновленными данными
    const updatedContext: UpdateMachineContext = {
      currentVersion: "1.2.3",
      availableUpdate: {
        version: "1.3.0",
        notes: "New features",
        pub_date: "2024-01-01",
        signature: "sig",
        url: "http://example.com",
      },
      error: "Network error",
      progress: {
        downloaded: 50,
        total: 100,
        percentage: 50,
        chunk_length: 1024,
        content_length: 100,
      },
      autoCheckEnabled: true,
      autoCheckInterval: 180,
      lastCheckTime: new Date(),
    }

    // Обновляем контекст в mockState
    mockState.context = updatedContext

    const { result } = renderHook(() => useUpdateManager())

    expect(result.current.currentVersion).toBe("1.2.3")
    expect(result.current.availableUpdate).toEqual(mockState.context.availableUpdate)
    expect(result.current.error).toBe("Network error")
    expect(result.current.progress).toEqual(mockState.context.progress)
    expect(result.current.autoCheckSettings).toEqual({
      enabled: true,
      intervalMinutes: 180,
    })
  })
})

describe("useUpdateAvailability", () => {
  beforeEach(() => {
    resetContainer()
    vi.clearAllMocks()
    container.registerUpdate(mockUpdateService)
  })

  afterEach(() => {
    resetContainer()
  })

  it("возвращает упрощенную структуру", async () => {
    // Создаем мок состояния с доступным обновлением
    const mockState = {
      value: "updateAvailable",
      matches: (state: string) => state === "updateAvailable",
      context: {
        currentVersion: "1.0.0",
        availableUpdate: {
          version: "1.1.0",
          notes: "Bug fixes",
          pub_date: "2024-01-01",
          signature: "sig123",
          url: "http://example.com/update",
        },
        error: undefined,
        progress: undefined,
        autoCheckEnabled: false,
        autoCheckInterval: 60,
        lastCheckTime: undefined,
      } satisfies UpdateMachineContext,
    }
    const mockSend = vi.fn()

    // Переопределяем возвращаемое значение useMachine
    const { useMachine } = await import("@xstate/react")
    vi.mocked(useMachine).mockReturnValue([mockState, mockSend] as any)

    const { result } = renderHook(() => useUpdateAvailability())

    expect(result.current).toEqual({
      hasUpdate: true,
      updateInfo: {
        version: "1.1.0",
        notes: "Bug fixes",
        pub_date: "2024-01-01",
        signature: "sig123",
        url: "http://example.com/update",
      },
      currentVersion: "1.0.0",
      checkForUpdates: expect.any(Function),
    })
  })

  it("передает вызов checkForUpdates", async () => {
    // Создаем мок состояния без обновления
    const mockState = {
      value: "idle",
      matches: (state: string) => state === "idle",
      context: {
        currentVersion: "1.0.0",
        availableUpdate: undefined,
        error: undefined,
        progress: undefined,
        autoCheckEnabled: false,
        autoCheckInterval: 60,
        lastCheckTime: undefined,
      } satisfies UpdateMachineContext,
    }
    const mockSend = vi.fn()

    // Переопределяем возвращаемое значение useMachine
    const { useMachine } = await import("@xstate/react")
    vi.mocked(useMachine).mockReturnValue([mockState, mockSend] as any)

    const { result } = renderHook(() => useUpdateAvailability())

    act(() => {
      result.current.checkForUpdates()
    })

    expect(mockSend).toHaveBeenCalledWith({ type: "CHECK_FOR_UPDATES" })
  })
})
