/**
 * Chat session types for AI Services Domain
 *
 * Перенесено из src/features/ai-chat/types/chat.ts
 */

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
  agent: AgentId
  projectId?: string // Associated project if any
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  agent?: AgentId
  error?: string
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

export type AgentId =
  // OpenAI - самые свежие
  | "gpt-5" // Выпущен август 2025, топ модель
  | "o3" // Reasoning модель
  | "gpt-4o" // Всё ещё актуальный

  // Claude (Anthropic)
  | "claude-opus-4-1" // Выпущен 5 августа 2025, 74.5% SWE-bench
  | "claude-4-sonnet" // Текущая стабильная модель
  | "claude-4-opus" // Флагманская модель

  // xAI (Grok)
  | "grok-4" // Топ модель 2025
  | "grok-4-heavy" // Multi-agent версия с улучшенным reasoning
  | "grok-3" // Предыдущая версия

  // DeepSeek - популярные открытые модели
  | "deepseek-r1" // Reasoning модель, январь 2025
  | "deepseek-v3" // Базовая модель, 671B параметров
  | "deepseek-v3-0324" // Обновленная версия, март 2025

  // Ollama - популярные локальные модели
  | "llama-3-3" // Meta, очень популярный
  | "qwen-2-5" // Alibaba, отличное качество
  | "phi-4" // Microsoft, компактный и мощный
  | "mistral-7b" // Популярная европейская модель
  | "gemma-2" // Google, открытая версия

export interface ChatListItem {
  id: string
  title: string
  createdAt: Date
  agent: AgentId
  messageCount: number
  lastMessage?: string
  lastMessageAt?: Date // Added from legacy types
}

// Additional legacy types from ai-chat feature
export interface Agent {
  id: string
  name: string
  useTools: boolean
  provider: "claude" | "openai" | "deepseek" | "ollama" | "grok" | string
}

export interface ChatTimelineContext {
  projectName?: string
  projectDuration?: number
  selectedClips?: Array<{
    id: string
    name: string
    startTime: number
    duration: number
  }>
  selectedTracks?: Array<{
    id: string
    name: string
    type: "video" | "audio"
  }>
  currentTime?: number
  effects?: string[]
  filters?: string[]
}

export interface ChatStorageService {
  // Session management
  createSession(title?: string): Promise<ChatSession>
  getSession(id: string): Promise<ChatSession | null>
  getAllSessions(): Promise<ChatListItem[]>
  updateSession(id: string, updates: Partial<ChatSession>): Promise<void>
  deleteSession(id: string): Promise<void>

  // Message management
  addMessage(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>
  updateMessage(sessionId: string, messageId: string, updates: Partial<ChatMessage>): Promise<void>
  deleteMessage(sessionId: string, messageId: string): Promise<void>

  // Search
  searchSessions(query: string): Promise<ChatListItem[]>

  // Export/Import
  exportSession(id: string): Promise<string> // JSON string
  importSession(data: string): Promise<ChatSession>
}

export interface AIService {
  sendMessage(
    message: string,
    context?: ChatTimelineContext,
    options?: {
      stream?: boolean
      maxTokens?: number
      temperature?: number
    },
  ): Promise<AsyncIterable<string> | string>

  isConfigured(): boolean
  getAvailableModels(): string[]
}

// Compatibility export для обратной совместимости
export type { ChatSession as LegacyChatSession }
export type { ChatMessage as LegacyChatMessage }
export type { ChatListItem as LegacyChatListItem }
