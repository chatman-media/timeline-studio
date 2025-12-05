/**
 * Backend Event Handlers для Chat Machine
 *
 * Обрабатывает события от Rust backend и обновляет состояние машины
 * Используется паттерн Command-Event для синхронизации
 */

import type { ChatMachineContext } from "@/domains/ai-services/machines/chat-machine"
import type { ChatListItem, ChatMessage } from "@/domains/ai-services/types/chat"
import { createLogger } from "@/lib/tauri-logger"
import type { ChatEvent as TauriChatEvent } from "@/types/generated/tauri-bindings"

type ChatEvent = TauriChatEvent

const logger = createLogger("ChatBackendEventHandlers")

// Export type for better type safety
export type { ChatMachineContext }

/**
 * Главный обработчик backend событий
 */
export function handleBackendChatEvent(context: ChatMachineContext, event: ChatEvent): Partial<ChatMachineContext> {
  logger.info("Handling backend chat event:", { event: (event as any).type })

  switch ((event as any).type) {
    // Chat Session Events
    case "ChatSessionCreated":
      return handleChatSessionCreated(context, event as any)
    case "ChatSessionDeleted":
      return handleChatSessionDeleted(context, event as any)
    case "ChatSessionCleared":
      return handleChatSessionCleared(context, event as any)
    case "ChatSessionUpdated":
      return handleChatSessionUpdated(context, event as any)

    // Chat Message Events
    case "ChatMessageAdded":
      return handleChatMessageAdded(context, event as any)

    default:
      logger.debug("Unhandled backend chat event type:", { type: event.type })
      return {}
  }
}

// ============================================================================
// Chat Session Handlers
// ============================================================================

/**
 * Обработка создания новой сессии чата
 */
function handleChatSessionCreated(
  context: ChatMachineContext,
  event: Extract<ChatEvent, { type: "ChatSessionCreated" }>,
): Partial<ChatMachineContext> {
  const { session } = event.data

  logger.info("Chat session created:", { sessionId: session.id, name: session.name })

  // Конвертируем backend session в ChatListItem
  const newSession: ChatListItem = {
    id: session.id,
    title: session.name,
    lastMessageAt: new Date(session.updated_at),
    messageCount: session.messages.length,
    lastMessage: session.messages[session.messages.length - 1]?.content,
    createdAt: new Date(session.created_at),
    agent: null as any, // Agent type will be inferred from session data later
  }

  return {
    sessions: [newSession, ...context.sessions],
    currentSessionId: session.id,
    chatMessages: [],
    isCreatingNewChat: false,
    error: null,
  }
}

/**
 * Обработка удаления сессии чата
 */
function handleChatSessionDeleted(
  context: ChatMachineContext,
  event: Extract<ChatEvent, { type: "ChatSessionDeleted" }>,
): Partial<ChatMachineContext> {
  const { session_id } = event.data

  logger.info("Chat session deleted:", { sessionId: session_id })

  // Удаляем сессию из списка
  const updatedSessions = context.sessions.filter((s) => s.id !== session_id)

  // Если удалили текущую сессию, сбрасываем состояние
  const updates: Partial<ChatMachineContext> = {
    sessions: updatedSessions,
  }

  if (context.currentSessionId === session_id) {
    updates.currentSessionId = null
    updates.chatMessages = []
  }

  return updates
}

/**
 * Обработка очистки сессии чата
 */
function handleChatSessionCleared(
  context: ChatMachineContext,
  event: Extract<ChatEvent, { type: "ChatSessionCleared" }>,
): Partial<ChatMachineContext> {
  const { session_id } = event.data

  logger.info("Chat session cleared:", { sessionId: session_id })

  // Если это текущая сессия, очищаем сообщения
  if (context.currentSessionId === session_id) {
    return {
      chatMessages: [],
      error: null,
    }
  }

  // Обновляем информацию о сессии в списке
  const updatedSessions = context.sessions.map((session) => {
    if (session.id === session_id) {
      return {
        ...session,
        messageCount: 0,
        lastMessage: undefined,
      }
    }
    return session
  })

  return {
    sessions: updatedSessions,
  }
}

/**
 * Обработка обновления сессии чата
 */
function handleChatSessionUpdated(
  context: ChatMachineContext,
  event: Extract<ChatEvent, { type: "ChatSessionUpdated" }>,
): Partial<ChatMachineContext> {
  const { session_id, name } = event.data

  logger.info("Chat session updated:", { sessionId: session_id, name })

  // Обновляем сессию в списке
  const updatedSessions = context.sessions.map((session) => {
    if (session.id === session_id) {
      return {
        ...session,
        ...(name && { title: name }),
      }
    }
    return session
  })

  return {
    sessions: updatedSessions,
  }
}

// ============================================================================
// Chat Message Handlers
// ============================================================================

/**
 * Обработка добавления нового сообщения в чат
 */
function handleChatMessageAdded(
  context: ChatMachineContext,
  event: Extract<ChatEvent, { type: "ChatMessageAdded" }>,
): Partial<ChatMachineContext> {
  const { session_id, message } = event.data

  logger.info("Chat message added:", { sessionId: session_id, messageId: message.id, role: message.role })

  // Если это не текущая сессия, только обновляем метаданные
  if (context.currentSessionId !== session_id) {
    const updatedSessions = context.sessions.map((session) => {
      if (session.id === session_id) {
        return {
          ...session,
          lastMessage: message.content,
          lastMessageAt: new Date(message.timestamp),
          messageCount: session.messageCount + 1,
        }
      }
      return session
    })

    return {
      sessions: updatedSessions,
    }
  }

  // Конвертируем backend message в ChatMessage
  const chatMessage: ChatMessage = {
    id: message.id,
    content: message.content,
    role: message.role as "user" | "assistant" | "system",
    timestamp: new Date(message.timestamp),
    metadata: message.metadata ? (message.metadata as Record<string, any>) : undefined,
  }

  // Добавляем сообщение в текущую сессию
  const updatedMessages = [...context.chatMessages, chatMessage]

  // Обновляем сессию в списке
  const updatedSessions = context.sessions.map((session) => {
    if (session.id === session_id) {
      return {
        ...session,
        lastMessage: message.content,
        lastMessageAt: new Date(message.timestamp),
        messageCount: session.messageCount + 1,
      }
    }
    return session
  })

  return {
    chatMessages: updatedMessages,
    sessions: updatedSessions,
    isProcessing: false,
    error: null,
  }
}
