/**
 * AI Chat Feature Exports
 *
 * Экспортирует все основные компоненты и хуки для AI чата
 */

export * from "../../domains/ai-services/services/whisper-service"
// Основные компоненты
export * from "./components"
// Хуки - экспортируем все кроме useChat (конфликт с services)
export * from "./hooks/use-chat-actions"
export * from "./hooks/use-chat-state"
export * from "./hooks/use-resources-ai-integration"
export * from "./hooks/use-timeline-ai"
// Сервисы и провайдеры (включая основной useChat)
export * from "./services/chat-machine"

// Инструменты
export type { AIToolResult } from "./tools/base-ai-tool"

export * from "./types/streaming"

// Утилиты
export * from "./utils/context-manager"
export * from "./utils/timeline-context"
