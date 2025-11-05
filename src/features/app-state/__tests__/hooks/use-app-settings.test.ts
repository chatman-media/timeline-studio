import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useAppSettings } from "../../hooks/use-app-settings"

// Мокаем useApp из app-provider
const mockContextValue = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  projectState: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  retryConnection: vi.fn(),
  executeCommand: vi.fn(),
}

vi.mock("../../services/app-provider", () => ({
  useApp: vi.fn(),
}))

describe("useAppSettings", () => {
  it("should return context value when used within AppProvider", async () => {
    const { useApp } = vi.mocked(await import("../../services/app-provider"))
    useApp.mockReturnValue(mockContextValue)

    const { result } = renderHook(() => useAppSettings())

    expect(result.current).toBe(mockContextValue)
  })

  it("should throw error when used outside AppProvider", async () => {
    const { useApp } = vi.mocked(await import("../../services/app-provider"))
    useApp.mockImplementation(() => {
      throw new Error("useApp must be used within AppProvider")
    })

    const consoleError = console.error
    console.error = vi.fn() // Подавляем ошибки в консоли во время теста

    // useAppSettings теперь вызывает useApp, поэтому сообщение об ошибке изменилось
    expect(() => renderHook(() => useAppSettings())).toThrow("useApp must be used within AppProvider")

    console.error = consoleError // Восстанавливаем console.error
  })
})
