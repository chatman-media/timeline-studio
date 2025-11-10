/**
 * Chat Machine Tests
 *
 * Тесты для state machine управления чатом с AI
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import type { ChatMessage } from "../../types/chat"
import { chatMachine } from "../chat-machine"

describe("Chat Machine", () => {
  let actor: ReturnType<typeof createActor<typeof chatMachine>>

  beforeEach(() => {
    actor = createActor(chatMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("должен стартовать в состоянии idle", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("должен иметь корректный начальный контекст", () => {
      const context = actor.getSnapshot().context

      expect(context.chatMessages).toEqual([])
      expect(context.selectedAgentId).toBe("claude-4-sonnet")
      expect(context.isProcessing).toBe(false)
      expect(context.error).toBeNull()
      expect(context.currentSessionId).toBeNull()
      expect(context.sessions).toEqual([])
      expect(context.isCreatingNewChat).toBe(false)
    })
  })

  describe("Agent Selection", () => {
    it("должен позволять выбрать агента", () => {
      actor.send({
        type: "SELECT_AGENT",
        agentId: "gpt-4-turbo",
      })

      const context = actor.getSnapshot().context
      expect(context.selectedAgentId).toBe("gpt-4-turbo")
    })

    it("должен сохранять состояние idle при выборе агента", () => {
      actor.send({
        type: "SELECT_AGENT",
        agentId: "gpt-4-turbo",
      })

      expect(actor.getSnapshot().value).toBe("idle")
    })
  })

  describe("Message Sending", () => {
    it("должен добавлять пользовательское сообщение и переходить в processing", () => {
      const userMessage = "Hello, AI!"

      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: userMessage,
      })

      const context = actor.getSnapshot().context

      expect(actor.getSnapshot().value).toBe("processing")
      expect(context.chatMessages).toHaveLength(1)
      expect(context.chatMessages[0].content).toBe(userMessage)
      expect(context.chatMessages[0].role).toBe("user")
      expect(context.isProcessing).toBe(true)
      expect(context.error).toBeNull()
    })

    it("должен генерировать уникальный ID для сообщения", () => {
      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Test message",
      })

      const context = actor.getSnapshot().context
      expect(context.chatMessages[0].id).toBeDefined()
      expect(context.chatMessages[0].id).toMatch(/^msg-/)
    })

    it("должен добавлять timestamp к сообщению", () => {
      const beforeSend = new Date()

      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Test message",
      })

      const context = actor.getSnapshot().context
      const messageTime = context.chatMessages[0].timestamp

      expect(messageTime).toBeInstanceOf(Date)
      expect(messageTime.getTime()).toBeGreaterThanOrEqual(beforeSend.getTime())
    })
  })

  describe("Message Receiving", () => {
    it("должен получать ответ от AI и возвращаться в idle", async () => {
      // Отправляем сообщение
      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Hello",
      })

      await waitFor(actor, (state) => state.matches("processing"))

      // Получаем ответ
      const aiMessage: ChatMessage = {
        id: "ai-msg-123",
        content: "Hello! How can I help you?",
        role: "assistant",
        timestamp: new Date(),
      }

      actor.send({
        type: "RECEIVE_CHAT_MESSAGE",
        message: aiMessage,
      })

      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.chatMessages).toHaveLength(2)
      expect(context.chatMessages[1]).toEqual(aiMessage)
      expect(context.isProcessing).toBe(false)
      expect(context.error).toBeNull()
    })
  })

  describe("Error Handling", () => {
    it("должен обрабатывать ошибки во время processing", async () => {
      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Test",
      })

      await waitFor(actor, (state) => state.matches("processing"))

      actor.send({
        type: "SET_ERROR",
        error: "API connection failed",
      })

      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.error).toBe("API connection failed")
      expect(context.isProcessing).toBe(false)
    })

    it("должен сохранять сообщения при ошибке", async () => {
      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Test",
      })

      await waitFor(actor, (state) => state.matches("processing"))

      actor.send({
        type: "SET_ERROR",
        error: "Error occurred",
      })

      const context = actor.getSnapshot().context
      expect(context.chatMessages).toHaveLength(1) // User message should still be there
    })
  })

  describe("Message Management", () => {
    it("должен очищать все сообщения", () => {
      // Добавляем несколько сообщений
      actor.send({ type: "SEND_CHAT_MESSAGE", message: "Message 1" })
      actor.send({
        type: "RECEIVE_CHAT_MESSAGE",
        message: {
          id: "ai-1",
          content: "Response 1",
          role: "assistant",
          timestamp: new Date(),
        },
      })

      actor.send({ type: "CLEAR_MESSAGES" })

      const context = actor.getSnapshot().context
      expect(context.chatMessages).toEqual([])
      expect(context.error).toBeNull()
    })

    it("должен удалять конкретное сообщение", async () => {
      actor.send({ type: "SEND_CHAT_MESSAGE", message: "Message 1" })

      await waitFor(actor, (state) => state.matches("processing"))

      const messageId = actor.getSnapshot().context.chatMessages[0].id

      // Получаем ответ, чтобы вернуться в idle
      actor.send({
        type: "RECEIVE_CHAT_MESSAGE",
        message: {
          id: "ai-1",
          content: "Response 1",
          role: "assistant",
          timestamp: new Date(),
        },
      })

      await waitFor(actor, (state) => state.matches("idle"))

      actor.send({ type: "SEND_CHAT_MESSAGE", message: "Message 2" })

      await waitFor(actor, (state) => state.matches("processing"))

      // Получаем ответ, чтобы вернуться в idle
      actor.send({
        type: "RECEIVE_CHAT_MESSAGE",
        message: {
          id: "ai-2",
          content: "Response 2",
          role: "assistant",
          timestamp: new Date(),
        },
      })

      await waitFor(actor, (state) => state.matches("idle"))

      // Теперь удаляем сообщение в состоянии idle
      actor.send({
        type: "REMOVE_MESSAGE",
        messageId,
      })

      const context = actor.getSnapshot().context
      expect(context.chatMessages.filter((m) => m.role === "user")).toHaveLength(1)
      expect(context.chatMessages.find((m) => m.role === "user")?.content).toBe("Message 2")
    })
  })

  describe("Session Management", () => {
    it("должен создавать новую сессию чата", () => {
      actor.send({ type: "CREATE_NEW_CHAT" })

      const context = actor.getSnapshot().context
      expect(context.isCreatingNewChat).toBe(true)
      expect(context.error).toBeNull()
    })

    it("должен обрабатывать создание новой сессии", () => {
      const newSession = {
        id: "session-123",
        title: "New Chat",
        createdAt: new Date(),
        agent: "claude-4-sonnet" as const,
        messageCount: 0,
      }

      actor.send({
        type: "NEW_CHAT_CREATED",
        session: newSession,
      })

      const context = actor.getSnapshot().context
      expect(context.isCreatingNewChat).toBe(false)
      expect(context.currentSessionId).toBe("session-123")
      expect(context.sessions).toContain(newSession)
      expect(context.chatMessages).toEqual([])
      expect(context.error).toBeNull()
    })

    it("должен переключаться между сессиями", () => {
      // Создаем сессии
      actor.send({
        type: "UPDATE_SESSIONS",
        sessions: [
          {
            id: "session-1",
            title: "Chat 1",
            createdAt: new Date(),
            agent: "claude-4-sonnet" as const,
            messageCount: 0,
          },
          {
            id: "session-2",
            title: "Chat 2",
            createdAt: new Date(),
            agent: "claude-4-sonnet" as const,
            messageCount: 0,
          },
        ],
      })

      // Переключаемся на session-2
      actor.send({
        type: "SWITCH_SESSION",
        sessionId: "session-2",
      })

      const context = actor.getSnapshot().context
      expect(context.currentSessionId).toBe("session-2")
      expect(context.chatMessages).toEqual([]) // Messages should be cleared
      expect(context.error).toBeNull()
    })

    it("должен загружать сообщения сессии", () => {
      const sessionMessages: ChatMessage[] = [
        {
          id: "msg-1",
          content: "Previous message",
          role: "user",
          timestamp: new Date(),
        },
        {
          id: "msg-2",
          content: "Previous response",
          role: "assistant",
          timestamp: new Date(),
        },
      ]

      actor.send({
        type: "LOAD_SESSION_MESSAGES",
        messages: sessionMessages,
      })

      const context = actor.getSnapshot().context
      expect(context.chatMessages).toEqual(sessionMessages)
      expect(context.error).toBeNull()
    })

    it("должен удалять сессию", () => {
      actor.send({
        type: "UPDATE_SESSIONS",
        sessions: [
          {
            id: "session-1",
            title: "Chat 1",
            createdAt: new Date(),
            agent: "claude-4-sonnet" as const,
            messageCount: 0,
          },
          {
            id: "session-2",
            title: "Chat 2",
            createdAt: new Date(),
            agent: "claude-4-sonnet" as const,
            messageCount: 0,
          },
        ],
      })

      actor.send({
        type: "DELETE_SESSION",
        sessionId: "session-1",
      })

      const context = actor.getSnapshot().context
      expect(context.sessions).toHaveLength(1)
      expect(context.sessions[0].id).toBe("session-2")
    })

    it("должен сбрасывать currentSessionId при удалении активной сессии", () => {
      actor.send({
        type: "UPDATE_SESSIONS",
        sessions: [
          {
            id: "session-1",
            title: "Chat 1",
            createdAt: new Date(),
            agent: "claude-4-sonnet" as const,
            messageCount: 0,
          },
        ],
      })

      actor.send({
        type: "SWITCH_SESSION",
        sessionId: "session-1",
      })

      actor.send({
        type: "DELETE_SESSION",
        sessionId: "session-1",
      })

      const context = actor.getSnapshot().context
      expect(context.currentSessionId).toBeNull()
    })
  })

  describe("Timeline AI Operations", () => {
    it("должен переходить в состояние creatingTimeline", async () => {
      actor.send({
        type: "CREATE_TIMELINE_FROM_PROMPT",
        prompt: "Create a 30-second montage",
      })

      await waitFor(actor, (state) => state.matches("creatingTimeline"))

      const context = actor.getSnapshot().context
      expect(context.isProcessing).toBe(true)
      expect(context.error).toBeNull()
    })

    it("должен переходить в состояние analyzingResources", async () => {
      actor.send({
        type: "ANALYZE_RESOURCES",
        query: "Find best moments",
      })

      await waitFor(actor, (state) => state.matches("analyzingResources"))

      const context = actor.getSnapshot().context
      expect(context.isProcessing).toBe(true)
    })

    it("должен переходить в состояние executingCommand", async () => {
      actor.send({
        type: "EXECUTE_AI_COMMAND",
        command: "optimize_timeline",
        params: { quality: "high" },
      })

      await waitFor(actor, (state) => state.matches("executingCommand"))

      const context = actor.getSnapshot().context
      expect(context.isProcessing).toBe(true)
    })

    it("должен обрабатывать успешное выполнение Timeline операции", async () => {
      actor.send({
        type: "CREATE_TIMELINE_FROM_PROMPT",
        prompt: "Test prompt",
      })

      await waitFor(actor, (state) => state.matches("creatingTimeline"))

      actor.send({
        type: "TIMELINE_OPERATION_SUCCESS",
        result: { timelineId: "timeline-123" },
      })

      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.isProcessing).toBe(false)
      expect(context.error).toBeNull()
    })

    it("должен обрабатывать ошибки Timeline операций", async () => {
      actor.send({
        type: "CREATE_TIMELINE_FROM_PROMPT",
        prompt: "Test prompt",
      })

      await waitFor(actor, (state) => state.matches("creatingTimeline"))

      actor.send({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Timeline creation failed",
      })

      await waitFor(actor, (state) => state.matches("idle"))

      const context = actor.getSnapshot().context
      expect(context.isProcessing).toBe(false)
      expect(context.error).toBe("Timeline creation failed")
    })
  })

  describe("Processing State Management", () => {
    it("должен позволять изменять isProcessing во время processing", async () => {
      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Test",
      })

      await waitFor(actor, (state) => state.matches("processing"))

      actor.send({
        type: "SET_PROCESSING",
        isProcessing: false,
      })

      const context = actor.getSnapshot().context
      expect(context.isProcessing).toBe(false)
    })

    it("должен позволять выбирать агента во время processing", async () => {
      actor.send({
        type: "SEND_CHAT_MESSAGE",
        message: "Test",
      })

      await waitFor(actor, (state) => state.matches("processing"))

      actor.send({
        type: "SELECT_AGENT",
        agentId: "gpt-4",
      })

      const context = actor.getSnapshot().context
      expect(context.selectedAgentId).toBe("gpt-4")
    })
  })
})
