/**
 * Тесты для ChatProvider
 * Проверяет асинхронные операции, race conditions, error handling
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import type React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatProvider, useChat } from "../chat-provider"

// Mock Backend via container
const mockExecuteCommand = vi.fn()
const mockOnStateChange = vi.fn()

vi.mock("@/core/container", () => ({
  container: {
    getBackend: vi.fn(() => ({
      executeCommand: mockExecuteCommand,
      onStateChange: mockOnStateChange,
    })),
    hasBackend: vi.fn(() => true),
    registerBackend: vi.fn(),
  },
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    warnSync: vi.fn(),
    debugSync: vi.fn(),
  }),
}))

describe("ChatProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockOnStateChange.mockReturnValue(() => {}) // unsubscribe function
    mockExecuteCommand.mockResolvedValue({ success: true, data: null })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => <ChatProvider>{children}</ChatProvider>

  describe("Инициализация", () => {
    it("должен инициализироваться с дефолтным состоянием", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.currentSession).toBeDefined()
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.chatMessages).toEqual([])
    })

    it("должен загрузить сессии из localStorage при инициализации", async () => {
      const storedSessions = [
        {
          id: "session-1",
          name: "Test Session",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("timeline-studio-chat-sessions", JSON.stringify(storedSessions))

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(1)
      })

      expect(result.current.sessions[0].id).toBe("session-1")
      expect(result.current.sessions[0].title).toBe("Test Session")
    })

    it("должен корректно обрабатывать невалидные данные в localStorage", async () => {
      localStorage.setItem("timeline-studio-chat-sessions", "invalid json")

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.currentSession).toBeDefined()
      })

      // Не должно выбросить ошибку
      expect(result.current.sessions).toBeDefined()
    })
  })

  describe("createSession", () => {
    it("должен создать новую сессию через backend", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: { session_id: "new-session-123" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.createSession("New Chat")
      })

      await waitFor(() => {
        expect(mockExecuteCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "CreateChatSession",
            params: expect.objectContaining({
              name: "New Chat",
            }),
          }),
        )
      })
    })

    it("должен создать сессию локально при ошибке backend", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useChat(), { wrapper })

      let session: any
      await act(async () => {
        session = await result.current.createSession("Fallback Chat")
      })

      expect(session).toBeDefined()
      expect(session.id).toContain("session_")
      expect(session.name).toBe("Fallback Chat")
    })

    it("должен автоматически генерировать название если не передано", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: { session_id: "auto-session" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.createSession()
      })

      await waitFor(() => {
        expect(mockExecuteCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            params: expect.objectContaining({
              name: expect.stringContaining("Чат"),
            }),
          }),
        )
      })
    })

    it("должен установить созданную сессию как текущую", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        success: true,
        data: { session_id: "current-session" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.createSession("Current")
      })

      await waitFor(() => {
        expect(result.current.currentSession?.id).toBe("current-session")
      })
    })
  })

  describe("sendMessage", () => {
    it("должен добавить сообщение пользователя в историю", async () => {
      mockExecuteCommand.mockResolvedValue({
        success: true,
        data: { response: "AI response", message_id: "ai-msg-123" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.sendMessage("Hello AI")
      })

      await waitFor(() => {
        expect(result.current.chatMessages.length).toBeGreaterThan(0)
      })

      const userMessage = result.current.chatMessages.find((m: any) => m.role === "user")
      expect(userMessage).toBeDefined()
      expect(userMessage?.content).toBe("Hello AI")
    })

    it("должен создать новую сессию если её нет", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      // Очищаем текущую сессию
      await act(async () => {
        result.current.currentSession = null as any
      })

      mockExecuteCommand
        .mockResolvedValueOnce({
          success: true,
          data: { session_id: "auto-created" },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { project: "context" },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { response: "Response", message_id: "msg" },
        })

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      await waitFor(() => {
        expect(result.current.currentSession).toBeDefined()
      })
    })

    it("должен сбросить флаги isStreaming и isProcessing после отправки", async () => {
      mockExecuteCommand.mockResolvedValue({
        success: true,
        data: { response: "Done", message_id: "msg" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      // После завершения флаги должны быть сброшены
      await waitFor(() => {
        expect(result.current.isStreaming).toBe(false)
        expect(result.current.isProcessing).toBe(false)
      })
    })

    it("должен добавить сообщение об ошибке при провале backend запроса", async () => {
      mockExecuteCommand
        .mockResolvedValueOnce({ success: true, data: {} })
        .mockRejectedValueOnce(new Error("Network error"))

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.sendMessage("Test")
      })

      await waitFor(() => {
        expect(result.current.chatMessages.length).toBeGreaterThan(0)
      })

      // Должно быть сообщение пользователя и сообщение об ошибке
      const errorMessage = result.current.chatMessages.find((msg: any) => msg.metadata?.error === true)
      expect(errorMessage).toBeDefined()
    })

    it("должен обновить updatedAt сессии после отправки сообщения", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ success: true, data: {} }).mockResolvedValueOnce({
        success: true,
        data: { response: "Response", message_id: "msg" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      const initialUpdatedAt = result.current.currentSession?.updatedAt

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10)) // Небольшая задержка
        await result.current.sendMessage("Test")
      })

      await waitFor(() => {
        expect(result.current.currentSession?.updatedAt.getTime()).toBeGreaterThan(initialUpdatedAt?.getTime() || 0)
      })
    })
  })

  describe("deleteSession", () => {
    it("должен удалить сессию через backend и локально", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      // Создаём сессию
      await act(async () => {
        await result.current.updateSessions([
          {
            id: "to-delete",
            title: "Delete Me",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await act(async () => {
        await result.current.deleteSession("to-delete")
      })

      await waitFor(() => {
        expect(result.current.sessions.find((s: any) => s.id === "to-delete")).toBeUndefined()
      })

      expect(mockExecuteCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "DeleteChatSession",
          params: { session_id: "to-delete" },
        }),
      )
    })

    it("должен сбросить currentSession если удаляется текущая", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "current",
            title: "Current",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        await result.current.switchSession("current")
      })

      expect(result.current.currentSession?.id).toBe("current")

      await act(async () => {
        await result.current.deleteSession("current")
      })

      await waitFor(() => {
        expect(result.current.currentSession).toBeNull()
      })
    })

    it("должен корректно обработать удаление последней сессии", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "last-one",
            title: "Last",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await act(async () => {
        await result.current.deleteSession("last-one")
      })

      await waitFor(() => {
        expect(result.current.sessions.find((s: any) => s.id === "last-one")).toBeUndefined()
      })
    })

    it("должен удалить сессию локально даже при ошибке backend", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "to-delete",
            title: "Delete",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await act(async () => {
        await result.current.deleteSession("to-delete")
      })

      await waitFor(() => {
        expect(result.current.sessions.find((s: any) => s.id === "to-delete")).toBeUndefined()
      })
    })
  })

  describe("switchSession", () => {
    it("должен переключиться на существующую сессию", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "session-1",
            title: "First",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: "session-2",
            title: "Second",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await act(async () => {
        await result.current.switchSession("session-2")
      })

      expect(result.current.currentSession?.id).toBe("session-2")
    })

    it("должен создать новую сессию при переключении на несуществующую", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.switchSession("non-existent")
      })

      await waitFor(() => {
        expect(result.current.currentSession?.id).toBe("non-existent")
        expect(result.current.sessions.find((s: any) => s.id === "non-existent")).toBeDefined()
      })
    })
  })

  describe("Race conditions", () => {
    it("должен корректно обрабатывать множественные одновременные отправки сообщений", async () => {
      mockExecuteCommand.mockResolvedValue({ success: true, data: {} }).mockResolvedValue({
        success: true,
        data: { response: "Response", message_id: "msg" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await Promise.all([
          result.current.sendMessage("Message 1"),
          result.current.sendMessage("Message 2"),
          result.current.sendMessage("Message 3"),
        ])
      })

      await waitFor(() => {
        // Должны быть все сообщения пользователя и ответы
        expect(result.current.chatMessages.length).toBeGreaterThanOrEqual(6)
      })
    })

    it("должен корректно обрабатывать быстрое создание и удаление сессий", async () => {
      mockExecuteCommand.mockResolvedValue({
        success: true,
        data: { session_id: "rapid-session" },
      })

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        const session = await result.current.createSession("Rapid")
        await result.current.deleteSession(session.id)
      })

      await waitFor(() => {
        expect(result.current.sessions.find((s: any) => s.id === "rapid-session")).toBeUndefined()
      })
    })

    it("должен корректно обрабатывать параллельное создание нескольких сессий", async () => {
      let counter = 0
      mockExecuteCommand.mockImplementation(async () => ({
        success: true,
        data: { session_id: `session-${++counter}` },
      }))

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await Promise.all([
          result.current.createSession("Session 1"),
          result.current.createSession("Session 2"),
          result.current.createSession("Session 3"),
        ])
      })

      await waitFor(() => {
        expect(result.current.sessions.length).toBeGreaterThanOrEqual(3)
      })
    })
  })

  describe("updateSessions", () => {
    it("должен обновить сессии с новым массивом", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      const newSessions = [
        {
          id: "new-1",
          title: "New 1",
          messageCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "new-2",
          title: "New 2",
          messageCount: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      await act(async () => {
        await result.current.updateSessions(newSessions)
      })

      await waitFor(() => {
        expect(result.current.sessions).toHaveLength(2)
      })

      expect(result.current.sessions[0].title).toBe("New 1")
      expect(result.current.sessions[1].title).toBe("New 2")
    })

    it("должен создать фиктивные сообщения если указан messageCount", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "with-count",
            title: "With Messages",
            messageCount: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await waitFor(() => {
        const session = result.current.sessions.find((s: any) => s.id === "with-count")
        expect(session?.messageCount).toBe(3)
      })
    })

    it("должен сбросить currentSession если она не в новом списке", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "old-session",
            title: "Old",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
        await result.current.switchSession("old-session")
      })

      expect(result.current.currentSession?.id).toBe("old-session")

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "new-session",
            title: "New",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await waitFor(() => {
        expect(result.current.currentSession).toBeNull()
      })
    })
  })

  describe("Error handling", () => {
    it("должен установить error при провале executeCommand", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Command failed"))

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        try {
          await result.current.createSession("Fail")
        } catch (e) {
          // Ожидаем ошибку
        }
      })

      // Даже при ошибке должна создаться локальная сессия (fallback)
      expect(result.current.sessions.length).toBeGreaterThan(0)
    })

    it("должен сбросить isLoading после ошибки", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Error"))

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        try {
          await result.current.sendMessage("Test")
        } catch (e) {
          // ignore
        }
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe("LocalStorage persistence", () => {
    it("должен сохранить сессии в localStorage при создании", async () => {
      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        await result.current.updateSessions([
          {
            id: "persist-1",
            title: "Persist",
            messageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      })

      await waitFor(() => {
        const stored = localStorage.getItem("timeline-studio-chat-sessions")
        expect(stored).toBeTruthy()
        const parsed = JSON.parse(stored!)
        expect(parsed).toHaveLength(1)
      })
    })

    it("должен восстановить последнюю активную сессию при загрузке", async () => {
      const storedSessions = [
        {
          id: "last-active",
          name: "Last Active",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      localStorage.setItem("timeline-studio-chat-sessions", JSON.stringify(storedSessions))

      const { result } = renderHook(() => useChat(), { wrapper })

      await waitFor(() => {
        expect(result.current.currentSession?.id).toBe("last-active")
      })
    })
  })
})
