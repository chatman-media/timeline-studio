/**
 * Тесты для Backend Event Handlers
 */

import { describe, expect, it } from "vitest"
import type { ChatMachineContext } from "@/domains/ai-services/machines/chat-machine"
import type { ChatEvent } from "@/types/generated/tauri-bindings"
import { handleBackendChatEvent } from "../backend-event-handlers"

// Mock context для тестов
const createMockContext = (overrides?: Partial<ChatMachineContext>): ChatMachineContext => ({
  chatMessages: [],
  currentSessionId: null,
  sessions: [],
  selectedAgentId: "claude-4-sonnet",
  isProcessing: false,
  error: null,
  isCreatingNewChat: false,
  ...overrides,
})

describe("Backend Event Handlers", () => {
  describe("ChatSessionCreated", () => {
    it("должен создать новую сессию чата", () => {
      const context = createMockContext()
      const event: ChatEvent = {
        type: "ChatSessionCreated",
        data: {
          session: {
            id: "session-1",
            name: "Новый чат",
            messages: [],
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions).toHaveLength(1)
      expect(result.sessions?.[0]).toMatchObject({
        id: "session-1",
        title: "Новый чат",
        messageCount: 0,
      })
      expect(result.currentSessionId).toBe("session-1")
      expect(result.chatMessages).toEqual([])
      expect(result.isCreatingNewChat).toBe(false)
      expect(result.error).toBeNull()
    })

    it("должен добавить сессию в начало списка существующих", () => {
      const context = createMockContext({
        sessions: [
          {
            id: "session-old",
            title: "Старый чат",
            lastMessageAt: new Date("2024-01-01"),
            messageCount: 5,
            createdAt: new Date("2024-01-01"),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionCreated",
        data: {
          session: {
            id: "session-new",
            name: "Новый чат",
            messages: [],
            created_at: "2024-01-02T00:00:00Z",
            updated_at: "2024-01-02T00:00:00Z",
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions).toHaveLength(2)
      expect(result.sessions?.[0].id).toBe("session-new")
      expect(result.sessions?.[1].id).toBe("session-old")
    })

    it("должен создать сессию с сообщениями", () => {
      const context = createMockContext()
      const event: ChatEvent = {
        type: "ChatSessionCreated",
        data: {
          session: {
            id: "session-1",
            name: "Чат с сообщениями",
            messages: [
              {
                id: "msg-1",
                role: "user",
                content: "Привет!",
                timestamp: "2024-01-01T00:00:00Z",
              },
            ],
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions?.[0].messageCount).toBe(1)
      expect(result.sessions?.[0].lastMessage).toBe("Привет!")
    })
  })

  describe("ChatSessionDeleted", () => {
    it("должен удалить сессию из списка", () => {
      const context = createMockContext({
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date(),
            messageCount: 5,
            createdAt: new Date(),
            agent: null as any,
          },
          {
            id: "session-2",
            title: "Чат 2",
            lastMessageAt: new Date(),
            messageCount: 3,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionDeleted",
        data: {
          session_id: "session-1",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions).toHaveLength(1)
      expect(result.sessions?.[0].id).toBe("session-2")
    })

    it("должен сбросить состояние если удалена текущая сессия", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [
          {
            id: "msg-1",
            role: "user",
            content: "Test",
            timestamp: new Date(),
          },
        ],
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date(),
            messageCount: 1,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionDeleted",
        data: {
          session_id: "session-1",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.currentSessionId).toBeNull()
      expect(result.chatMessages).toEqual([])
      expect(result.sessions).toEqual([])
    })

    it("не должен сбросить состояние если удалена другая сессия", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [
          {
            id: "msg-1",
            role: "user",
            content: "Test",
            timestamp: new Date(),
          },
        ],
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date(),
            messageCount: 1,
            createdAt: new Date(),
            agent: null as any,
          },
          {
            id: "session-2",
            title: "Чат 2",
            lastMessageAt: new Date(),
            messageCount: 0,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionDeleted",
        data: {
          session_id: "session-2",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.currentSessionId).toBeUndefined()
      expect(result.chatMessages).toBeUndefined()
    })
  })

  describe("ChatSessionCleared", () => {
    it("должен очистить сообщения текущей сессии", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [
          {
            id: "msg-1",
            role: "user",
            content: "Test",
            timestamp: new Date(),
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionCleared",
        data: {
          session_id: "session-1",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.chatMessages).toEqual([])
      expect(result.error).toBeNull()
    })

    it("должен обновить метаданные очищенной сессии в списке", () => {
      const context = createMockContext({
        currentSessionId: "session-2",
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date(),
            messageCount: 5,
            lastMessage: "Последнее сообщение",
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionCleared",
        data: {
          session_id: "session-1",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions?.[0].messageCount).toBe(0)
      expect(result.sessions?.[0].lastMessage).toBeUndefined()
    })
  })

  describe("ChatSessionUpdated", () => {
    it("должен обновить название сессии", () => {
      const context = createMockContext({
        sessions: [
          {
            id: "session-1",
            title: "Старое название",
            lastMessageAt: new Date(),
            messageCount: 0,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionUpdated",
        data: {
          session_id: "session-1",
          name: "Новое название",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions?.[0].title).toBe("Новое название")
    })

    it("не должен изменять другие свойства сессии", () => {
      const createdAt = new Date("2024-01-01")
      const lastMessageAt = new Date("2024-01-02")
      const context = createMockContext({
        sessions: [
          {
            id: "session-1",
            title: "Старое название",
            lastMessageAt,
            messageCount: 5,
            createdAt,
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatSessionUpdated",
        data: {
          session_id: "session-1",
          name: "Новое название",
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions?.[0]).toMatchObject({
        messageCount: 5,
        createdAt,
        lastMessageAt,
      })
    })
  })

  describe("ChatMessageAdded", () => {
    it("должен добавить сообщение в текущую сессию", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [],
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date(),
            messageCount: 0,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatMessageAdded",
        data: {
          session_id: "session-1",
          message: {
            id: "msg-1",
            role: "user",
            content: "Привет!",
            timestamp: "2024-01-01T00:00:00Z",
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.chatMessages).toHaveLength(1)
      expect(result.chatMessages?.[0]).toMatchObject({
        id: "msg-1",
        role: "user",
        content: "Привет!",
      })
      expect(result.isProcessing).toBe(false)
      expect(result.error).toBeNull()
    })

    it("должен обновить метаданные сессии при добавлении сообщения", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [],
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date("2024-01-01"),
            messageCount: 0,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatMessageAdded",
        data: {
          session_id: "session-1",
          message: {
            id: "msg-1",
            role: "user",
            content: "Новое сообщение",
            timestamp: "2024-01-02T00:00:00Z",
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.sessions?.[0]).toMatchObject({
        messageCount: 1,
        lastMessage: "Новое сообщение",
      })
      expect(result.sessions?.[0].lastMessageAt.toISOString()).toBe("2024-01-02T00:00:00.000Z")
    })

    it("должен обновить только метаданные для не-текущей сессии", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [],
        sessions: [
          {
            id: "session-2",
            title: "Чат 2",
            lastMessageAt: new Date(),
            messageCount: 0,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatMessageAdded",
        data: {
          session_id: "session-2",
          message: {
            id: "msg-1",
            role: "user",
            content: "Сообщение в другую сессию",
            timestamp: "2024-01-01T00:00:00Z",
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.chatMessages).toBeUndefined()
      expect(result.sessions?.[0]).toMatchObject({
        messageCount: 1,
        lastMessage: "Сообщение в другую сессию",
      })
    })

    it("должен корректно обрабатывать сообщения с метаданными", () => {
      const context = createMockContext({
        currentSessionId: "session-1",
        chatMessages: [],
        sessions: [
          {
            id: "session-1",
            title: "Чат 1",
            lastMessageAt: new Date(),
            messageCount: 0,
            createdAt: new Date(),
            agent: null as any,
          },
        ],
      })

      const event: ChatEvent = {
        type: "ChatMessageAdded",
        data: {
          session_id: "session-1",
          message: {
            id: "msg-1",
            role: "assistant",
            content: "Ответ с метаданными",
            timestamp: "2024-01-01T00:00:00Z",
            metadata: {
              model: "claude-4-sonnet",
              tokens: 150,
            },
          },
        },
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result.chatMessages?.[0].metadata).toEqual({
        model: "claude-4-sonnet",
        tokens: 150,
      })
    })
  })

  describe("Unhandled events", () => {
    it("должен вернуть пустой объект для неизвестного события", () => {
      const context = createMockContext()
      const event: ChatEvent = {
        type: "UnknownEvent" as any,
        data: {},
      } as any

      const result = handleBackendChatEvent(context, event)

      expect(result).toEqual({})
    })
  })
})
