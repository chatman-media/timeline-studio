import { assign, setup } from "xstate"
import { handleBackendChatEvent } from "@/features/ai-chat/machines/backend-event-handlers"
import { createLogger } from "@/lib/tauri-logger"
import type { ChatEvent } from "@/types/generated/tauri-bindings"

import type { ChatListItem, ChatMessage } from "../types/chat"

const logger = createLogger("ChatMachine")

// Интерфейс контекста машины состояний чата
export interface ChatMachineContext {
  chatMessages: ChatMessage[]
  selectedAgentId: string | null
  isProcessing: boolean
  error: string | null
  currentSessionId: string | null
  sessions: ChatListItem[]
  isCreatingNewChat: boolean
}

// Типы событий для машины состояний чата
export type ChatMachineEvent =
  | { type: "SEND_CHAT_MESSAGE"; message: string }
  | { type: "RECEIVE_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "LOAD_SESSION_MESSAGES"; messages: ChatMessage[] }
  | { type: "SELECT_AGENT"; agentId: string }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "CLEAR_MESSAGES" }
  | { type: "REMOVE_MESSAGE"; messageId: string }
  | { type: "CREATE_NEW_CHAT" }
  | { type: "NEW_CHAT_CREATED"; session: ChatListItem }
  | { type: "LOAD_SESSION"; sessionId: string }
  | { type: "DELETE_SESSION"; sessionId: string }
  | { type: "SWITCH_SESSION"; sessionId: string }
  | { type: "UPDATE_SESSIONS"; sessions: ChatListItem[] }
  // Backend events
  | { type: "BACKEND_EVENT"; event: ChatEvent }
  // Timeline AI события
  | { type: "CREATE_TIMELINE_FROM_PROMPT"; prompt: string }
  | { type: "ANALYZE_RESOURCES"; query: string }
  | { type: "EXECUTE_AI_COMMAND"; command: string; params?: any }
  | { type: "TIMELINE_OPERATION_SUCCESS"; result: any }
  | { type: "TIMELINE_OPERATION_ERROR"; error: string }

// Начальный контекст
const initialContext: ChatMachineContext = {
  chatMessages: [],
  selectedAgentId: "claude-4-sonnet",
  isProcessing: false,
  error: null,
  currentSessionId: null,
  sessions: [],
  isCreatingNewChat: false,
}

/**
 * Машина состояний для управления чатом с ИИ
 *
 * Перенесено в AI Services Domain из src/features/ai-chat/services/chat-machine.ts
 *
 * Обрабатывает:
 * - Отправку и получение сообщений
 * - Выбор агента (модели ИИ)
 * - Состояние обработки
 * - Ошибки
 * - Timeline AI операции
 */
export const chatMachine = setup({
  types: {
    context: {} as ChatMachineContext,
    events: {} as ChatMachineEvent,
  },
  actions: {
    /**
     * Действие для логирования отправки сообщения
     */
    logSendMessage: ({ event }) => {
      if (event.type === "SEND_CHAT_MESSAGE") {
        logger.infoSync("Отправка сообщения", { message: event.message })
      }
    },

    /**
     * Действие для логирования получения сообщения
     */
    logReceiveMessage: ({ event }) => {
      if (event.type === "RECEIVE_CHAT_MESSAGE") {
        logger.infoSync("Получение сообщения", {
          role: event.message.role,
          contentPreview: event.message.content?.substring(0, 50) || "",
        })
      }
    },

    /**
     * Действие для логирования выбора агента
     */
    logSelectAgent: ({ event }) => {
      if (event.type === "SELECT_AGENT") {
        logger.infoSync("Выбран агент", { agentId: event.agentId })
      }
    },

    /**
     * Обработка backend событий
     */
    handleBackendEvent: assign(({ context, event }) => {
      if (event.type !== "BACKEND_EVENT") return context

      logger.infoSync("Обработка backend события", { eventType: event.event.type })

      // Делегируем обработку в специализированный обработчик
      const updates = handleBackendChatEvent(context, event.event)

      return { ...context, ...updates }
    }),
  },
}).createMachine({
  id: "ai-services-chat",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        BACKEND_EVENT: {
          actions: [{ type: "handleBackendEvent" }],
        },
        SEND_CHAT_MESSAGE: {
          target: "processing",
          actions: [
            { type: "logSendMessage" },
            assign({
              chatMessages: ({ context, event }) => [
                ...context.chatMessages,
                {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  content: event.message,
                  role: "user" as const,
                  timestamp: new Date(),
                },
              ],
              isProcessing: true,
              error: null,
            }),
          ],
        },
        SELECT_AGENT: {
          actions: [
            { type: "logSelectAgent" },
            assign({
              selectedAgentId: ({ event }) => event.agentId,
            }),
          ],
        },
        CLEAR_MESSAGES: {
          actions: assign({
            chatMessages: [],
            error: null,
          }),
        },
        REMOVE_MESSAGE: {
          actions: assign({
            chatMessages: ({ context, event }) => context.chatMessages.filter((msg) => msg.id !== event.messageId),
          }),
        },
        CREATE_NEW_CHAT: {
          actions: assign({
            isCreatingNewChat: true,
            error: null,
          }),
        },
        NEW_CHAT_CREATED: {
          actions: assign({
            isCreatingNewChat: false,
            currentSessionId: ({ event }) => event.session.id,
            sessions: ({ context, event }) => [event.session, ...context.sessions],
            chatMessages: [],
            error: null,
          }),
        },
        UPDATE_SESSIONS: {
          actions: assign({
            sessions: ({ event }) => event.sessions,
          }),
        },
        SWITCH_SESSION: {
          actions: assign({
            currentSessionId: ({ event }) => event.sessionId,
            chatMessages: [], // Сообщения должны загружаться отдельно
            error: null,
          }),
        },
        LOAD_SESSION_MESSAGES: {
          actions: assign({
            chatMessages: ({ event }) => event.messages,
            error: null,
          }),
        },
        DELETE_SESSION: {
          actions: assign({
            sessions: ({ context, event }) => context.sessions.filter((s) => s.id !== event.sessionId),
            currentSessionId: ({ context, event }) =>
              context.currentSessionId === event.sessionId ? null : context.currentSessionId,
          }),
        },
        // Timeline AI операции
        CREATE_TIMELINE_FROM_PROMPT: {
          target: "creatingTimeline",
          actions: assign({
            isProcessing: true,
            error: null,
          }),
        },
        ANALYZE_RESOURCES: {
          target: "analyzingResources",
          actions: assign({
            isProcessing: true,
            error: null,
          }),
        },
        EXECUTE_AI_COMMAND: {
          target: "executingCommand",
          actions: assign({
            isProcessing: true,
            error: null,
          }),
        },
      },
    },
    processing: {
      on: {
        BACKEND_EVENT: {
          actions: [{ type: "handleBackendEvent" }],
        },
        RECEIVE_CHAT_MESSAGE: {
          target: "idle",
          actions: [
            { type: "logReceiveMessage" },
            assign({
              chatMessages: ({ context, event }) => [...context.chatMessages, event.message],
              isProcessing: false,
              error: null,
            }),
          ],
        },
        SET_ERROR: {
          target: "idle",
          actions: assign({
            error: ({ event }) => event.error,
            isProcessing: false,
          }),
        },
        SET_PROCESSING: {
          actions: assign({
            isProcessing: ({ event }) => event.isProcessing,
          }),
        },
        SELECT_AGENT: {
          actions: [
            { type: "logSelectAgent" },
            assign({
              selectedAgentId: ({ event }) => event.agentId,
            }),
          ],
        },
      },
    },
    // Новые состояния для Timeline AI операций
    creatingTimeline: {
      on: {
        BACKEND_EVENT: {
          actions: [{ type: "handleBackendEvent" }],
        },
        TIMELINE_OPERATION_SUCCESS: {
          target: "idle",
          actions: [
            assign({
              isProcessing: false,
              error: null,
            }),
            ({ event }) => {
              logger.infoSync("Timeline создан успешно", { result: event.result })
            },
          ],
        },
        TIMELINE_OPERATION_ERROR: {
          target: "idle",
          actions: assign({
            error: ({ event }) => event.error,
            isProcessing: false,
          }),
        },
      },
    },
    analyzingResources: {
      on: {
        BACKEND_EVENT: {
          actions: [{ type: "handleBackendEvent" }],
        },
        TIMELINE_OPERATION_SUCCESS: {
          target: "idle",
          actions: [
            assign({
              isProcessing: false,
              error: null,
            }),
            ({ event }) => {
              logger.infoSync("Анализ ресурсов завершен", { result: event.result })
            },
          ],
        },
        TIMELINE_OPERATION_ERROR: {
          target: "idle",
          actions: assign({
            error: ({ event }) => event.error,
            isProcessing: false,
          }),
        },
      },
    },
    executingCommand: {
      on: {
        BACKEND_EVENT: {
          actions: [{ type: "handleBackendEvent" }],
        },
        TIMELINE_OPERATION_SUCCESS: {
          target: "idle",
          actions: [
            assign({
              isProcessing: false,
              error: null,
            }),
            ({ event }) => {
              logger.infoSync("Команда выполнена успешно", { result: event.result })
            },
          ],
        },
        TIMELINE_OPERATION_ERROR: {
          target: "idle",
          actions: assign({
            error: ({ event }) => event.error,
            isProcessing: false,
          }),
        },
      },
    },
  },
})

/**
 * Тип машины состояний чата
 */
export type ChatMachine = typeof chatMachine

// Re-export types from chat types for convenience
export type { ChatListItem, ChatMessage } from "../types/chat"
