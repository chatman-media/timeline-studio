export const AIProvider = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  DEEPSEEK: "deepseek",
  OLLAMA: "ollama",
  LOCAL: "local",
} as const

export type AIProvider = (typeof AIProvider)[keyof typeof AIProvider]

export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
  model?: string
  endpoint?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export type AgentId =
  | "gpt-5"
  | "o3"
  | "gpt-4o"
  | "claude-opus-4-1"
  | "claude-4-sonnet"
  | "claude-4-opus"
  | "grok-4"
  | "grok-4-heavy"
  | "grok-3"
  | "deepseek-r1"
  | "deepseek-v3"
  | "deepseek-v3-0324"
  | "llama-3-3"
  | "qwen-2-5"
  | "phi-4"
  | "mistral-7b"
  | "gemma-2"

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

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
  agent: AgentId
  projectId?: string
}

export interface ChatListItem {
  id: string
  title: string
  createdAt: Date
  agent: AgentId
  messageCount: number
  lastMessage?: string
  lastMessageAt?: Date
}

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
  createSession(title?: string): Promise<ChatSession>
  getSession(id: string): Promise<ChatSession | null>
  getAllSessions(): Promise<ChatListItem[]>
  updateSession(id: string, updates: Partial<ChatSession>): Promise<void>
  deleteSession(id: string): Promise<void>
  addMessage(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>
  updateMessage(sessionId: string, messageId: string, updates: Partial<ChatMessage>): Promise<void>
  deleteMessage(sessionId: string, messageId: string): Promise<void>
  searchSessions(query: string): Promise<ChatListItem[]>
  exportSession(id: string): Promise<string>
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

export type LegacyChatListItem = ChatListItem
export type LegacyChatMessage = ChatMessage
export type LegacyChatSession = ChatSession
