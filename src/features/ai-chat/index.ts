/**
 * AI Chat Feature - Public API
 *
 * Экспортирует UI компоненты и интеграционные хуки для AI чата.
 *
 * ⚠️ ВАЖНО: НЕ реэкспортируйте domain логику!
 * Domain сущности (машины, сервисы, провайдеры) импортируйте из @/domains/ai-services
 *
 * Этот модуль содержит только:
 * - UI компоненты (AiChat, AIActionPreview, и т.д.)
 * - Интеграционные хуки (useTimelineAI, usePlayerAIIntegration)
 * - Feature-специфичные утилиты
 */

// UI Компоненты
export * from "./components"
export * from "./hooks/use-browser-ai-integration"
// Интеграционные хуки
export * from "./hooks/use-chat-actions"
export * from "./hooks/use-chat-state"
export * from "./hooks/use-player-ai-integration"
export * from "./hooks/use-resources-ai-integration"
export * from "./hooks/use-timeline-ai"
export * from "./hooks/use-timeline-ai-integration"

// Feature-специфичные типы
export * from "./types/streaming"

// Утилиты
export * from "./utils/context-manager"
export * from "./utils/timeline-context"
