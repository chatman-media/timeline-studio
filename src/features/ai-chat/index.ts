/**
 * AI Chat Feature Exports
 *
 * Экспортирует все основные компоненты и хуки для AI чата
 */

// Сервисы и провайдеры (включая основной useChat)
// Re-export chat machine from domains
export type {
  ChatMachine,
  ChatMachineContext,
  ChatMachineEvent,
} from "../../domains/ai-services/machines/chat-machine"
export { chatMachine } from "../../domains/ai-services/machines/chat-machine"
export * from "../../domains/ai-services/services/whisper-service"
export type { ChatListItem, ChatMessage } from "../../domains/ai-services/types/chat"
// Основные компоненты
export * from "./components"
// Хуки - экспортируем все кроме useChat (конфликт с services)
export * from "./hooks/use-chat-actions"
export * from "./hooks/use-chat-state"
export * from "./hooks/use-resources-ai-integration"
export * from "./hooks/use-timeline-ai"

// Инструменты
export type { AIToolResult } from "./tools/base-ai-tool"

export * from "./types/streaming"

// Утилиты
export * from "./utils/context-manager"
export * from "./utils/timeline-context"
