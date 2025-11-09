/**
 * Тесты для useChatActions
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useChatActions } from "../use-chat-actions"

// Mock useChat hook
const mockChatActions = {
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectAgent: vi.fn(),
  setProcessing: vi.fn(),
  setError: vi.fn(),
  clearMessages: vi.fn(),
  removeMessage: vi.fn(),
  // Состояние (не должно быть в результате)
  chatMessages: [],
  selectedAgentId: "claude-4-sonnet",
  isProcessing: false,
  error: null,
  currentSessionId: null,
  sessions: [],
  isCreatingNewChat: false,
}

vi.mock("../use-chat", () => ({
  useChat: () => mockChatActions,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
}))

describe("useChatActions", () => {
  it("должен вернуть только действия чата без состояния", () => {
    const { result } = renderHook(() => useChatActions())

    // Проверяем, что есть все методы
    expect(result.current).toHaveProperty("sendChatMessage")
    expect(result.current).toHaveProperty("receiveChatMessage")
    expect(result.current).toHaveProperty("selectAgent")
    expect(result.current).toHaveProperty("setProcessing")
    expect(result.current).toHaveProperty("setError")
    expect(result.current).toHaveProperty("clearMessages")
    expect(result.current).toHaveProperty("removeMessage")

    // Проверяем, что нет полей состояния
    expect(result.current).not.toHaveProperty("chatMessages")
    expect(result.current).not.toHaveProperty("selectedAgentId")
    expect(result.current).not.toHaveProperty("isProcessing")
    expect(result.current).not.toHaveProperty("error")
    expect(result.current).not.toHaveProperty("currentSessionId")
    expect(result.current).not.toHaveProperty("sessions")
    expect(result.current).not.toHaveProperty("isCreatingNewChat")
  })

  it("должен вернуть функции, которые можно вызвать", () => {
    const { result } = renderHook(() => useChatActions())

    expect(typeof result.current.sendChatMessage).toBe("function")
    expect(typeof result.current.receiveChatMessage).toBe("function")
    expect(typeof result.current.selectAgent).toBe("function")
    expect(typeof result.current.setProcessing).toBe("function")
    expect(typeof result.current.setError).toBe("function")
    expect(typeof result.current.clearMessages).toBe("function")
    expect(typeof result.current.removeMessage).toBe("function")
  })

  it("должен возвращать те же функции из useChat", () => {
    const { result } = renderHook(() => useChatActions())

    expect(result.current.sendChatMessage).toBe(mockChatActions.sendChatMessage)
    expect(result.current.receiveChatMessage).toBe(mockChatActions.receiveChatMessage)
    expect(result.current.selectAgent).toBe(mockChatActions.selectAgent)
    expect(result.current.setProcessing).toBe(mockChatActions.setProcessing)
    expect(result.current.setError).toBe(mockChatActions.setError)
    expect(result.current.clearMessages).toBe(mockChatActions.clearMessages)
    expect(result.current.removeMessage).toBe(mockChatActions.removeMessage)
  })
})
