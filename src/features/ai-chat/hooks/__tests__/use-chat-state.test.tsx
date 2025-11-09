/**
 * Тесты для useChatState
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ChatMessage } from "@/domains/ai-services/types/chat"
import { useChatState } from "../use-chat-state"

// Mock useChat hook
const mockChatState = {
  chatMessages: [] as ChatMessage[],
  selectedAgentId: "claude-4-sonnet",
  isProcessing: false,
  error: null as string | null,
  currentSessionId: null as string | null,
  sessions: [] as any[],
  isCreatingNewChat: false,
  // Методы (не должны быть в результате)
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectAgent: vi.fn(),
  setProcessing: vi.fn(),
  setError: vi.fn(),
  clearMessages: vi.fn(),
  removeMessage: vi.fn(),
}

vi.mock("../use-chat", () => ({
  useChat: () => mockChatState,
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
}))

describe("useChatState", () => {
  it("должен вернуть только состояние чата без методов", () => {
    const { result } = renderHook(() => useChatState())

    // Проверяем, что есть все поля состояния
    expect(result.current).toHaveProperty("chatMessages")
    expect(result.current).toHaveProperty("selectedAgentId")
    expect(result.current).toHaveProperty("isProcessing")
    expect(result.current).toHaveProperty("error")
    expect(result.current).toHaveProperty("currentSessionId")
    expect(result.current).toHaveProperty("sessions")
    expect(result.current).toHaveProperty("isCreatingNewChat")

    // Проверяем, что нет методов
    expect(result.current).not.toHaveProperty("sendChatMessage")
    expect(result.current).not.toHaveProperty("receiveChatMessage")
    expect(result.current).not.toHaveProperty("selectAgent")
    expect(result.current).not.toHaveProperty("setProcessing")
    expect(result.current).not.toHaveProperty("setError")
    expect(result.current).not.toHaveProperty("clearMessages")
    expect(result.current).not.toHaveProperty("removeMessage")
  })

  it("должен вернуть пустое начальное состояние", () => {
    mockChatState.chatMessages = []
    mockChatState.selectedAgentId = "claude-4-sonnet"
    mockChatState.isProcessing = false
    mockChatState.error = null
    mockChatState.currentSessionId = null
    mockChatState.sessions = []
    mockChatState.isCreatingNewChat = false

    const { result } = renderHook(() => useChatState())

    expect(result.current.chatMessages).toEqual([])
    expect(result.current.selectedAgentId).toBe("claude-4-sonnet")
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.currentSessionId).toBeNull()
    expect(result.current.sessions).toEqual([])
    expect(result.current.isCreatingNewChat).toBe(false)
  })

  it("должен вернуть состояние с сообщениями", () => {
    const messages: ChatMessage[] = [
      {
        id: "msg-1",
        role: "user",
        content: "Привет!",
        timestamp: new Date(),
      },
      {
        id: "msg-2",
        role: "assistant",
        content: "Здравствуйте!",
        timestamp: new Date(),
      },
    ]

    mockChatState.chatMessages = messages

    const { result } = renderHook(() => useChatState())

    expect(result.current.chatMessages).toEqual(messages)
    expect(result.current.chatMessages).toHaveLength(2)
  })

  it("должен вернуть состояние обработки", () => {
    mockChatState.isProcessing = true

    const { result } = renderHook(() => useChatState())

    expect(result.current.isProcessing).toBe(true)
  })

  it("должен вернуть ошибку", () => {
    mockChatState.error = "Ошибка подключения к AI"

    const { result } = renderHook(() => useChatState())

    expect(result.current.error).toBe("Ошибка подключения к AI")
  })

  it("должен вернуть ID текущей сессии", () => {
    mockChatState.currentSessionId = "session-123"

    const { result } = renderHook(() => useChatState())

    expect(result.current.currentSessionId).toBe("session-123")
  })

  it("должен вернуть список сессий", () => {
    const sessions = [
      {
        id: "session-1",
        title: "Первый чат",
        messageCount: 5,
        lastMessage: "Последнее сообщение",
        lastMessageAt: new Date(),
        createdAt: new Date(),
        agent: "gpt-5",
      },
      {
        id: "session-2",
        title: "Второй чат",
        messageCount: 3,
        lastMessage: "Другое сообщение",
        lastMessageAt: new Date(),
        createdAt: new Date(),
        agent: "gpt-5",
      },
    ]

    mockChatState.sessions = sessions

    const { result } = renderHook(() => useChatState())

    expect(result.current.sessions).toEqual(sessions)
    expect(result.current.sessions).toHaveLength(2)
  })

  it("должен вернуть флаг создания нового чата", () => {
    mockChatState.isCreatingNewChat = true

    const { result } = renderHook(() => useChatState())

    expect(result.current.isCreatingNewChat).toBe(true)
  })

  it("должен вернуть выбранный ID агента", () => {
    mockChatState.selectedAgentId = "gpt-4o"

    const { result } = renderHook(() => useChatState())

    expect(result.current.selectedAgentId).toBe("gpt-4o")
  })
})
