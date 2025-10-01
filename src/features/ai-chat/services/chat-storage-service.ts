import type { ChatListItem, ChatMessage, ChatSession, ChatStorageService } from "@/domains/ai-services/types/chat"
import { appDirectoriesService } from "@/features/app-state/services"

// Declare Tauri global for this file
declare global {
  interface Window {
    __TAURI__?: any
  }
}

/**
 * Сервис для сохранения и управления чатами
 * Сохраняет чаты в ~/Movies/Timeline Studio/Chats/
 */
export class LocalChatStorageService implements ChatStorageService {
  private static instance: LocalChatStorageService
  private chatsDir?: string
  private initialized = false

  private constructor() {}

  static getInstance(): LocalChatStorageService {
    if (!LocalChatStorageService.instance) {
      LocalChatStorageService.instance = new LocalChatStorageService()
    }
    return LocalChatStorageService.instance
  }

  /**
   * Инициализация сервиса и создание директории для чатов
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const dirs = await appDirectoriesService.getAppDirectories()
      this.chatsDir = `${dirs.base_dir}/Chats`

      // Создаем директорию для чатов если её нет
      if (typeof window !== "undefined" && window.__TAURI__) {
        const { exists, mkdir } = await import("@tauri-apps/plugin-fs")

        if (!(await exists(this.chatsDir))) {
          await mkdir(this.chatsDir, { recursive: true })
        }
      }

      this.initialized = true
    } catch (error) {
      console.error("Failed to initialize chat storage:", error)
      throw error
    }
  }

  /**
   * Создать новую сессию чата
   */
  async createSession(title?: string): Promise<ChatSession> {
    await this.initialize()

    const session: ChatSession = {
      id: this.generateId(),
      title: title || `Новый чат ${new Date().toLocaleString("ru")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      agent: "claude-4-sonnet",
    }

    await this.saveSession(session)
    return session
  }

  /**
   * Получить сессию по ID
   */
  async getSession(id: string): Promise<ChatSession | null> {
    await this.initialize()

    try {
      if (typeof window !== "undefined" && window.__TAURI__) {
        const { readTextFile } = await import("@tauri-apps/plugin-fs")
        const filePath = `${this.chatsDir}/${id}.json`

        const content = await readTextFile(filePath)
        const session = JSON.parse(content)

        // Преобразуем строки дат обратно в объекты Date
        return {
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }
      }

      // Для веб-версии используем localStorage
      const stored = localStorage.getItem(`chat_${id}`)
      if (!stored) return null

      const session = JSON.parse(stored)
      // Преобразуем строки дат обратно в объекты Date
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }
    } catch (error) {
      console.error(`Failed to get session ${id}:`, error)
      return null
    }
  }

  /**
   * Получить список всех сессий
   */
  async getAllSessions(): Promise<ChatListItem[]> {
    await this.initialize()

    try {
      const sessions: ChatListItem[] = []

      if (typeof window !== "undefined" && window.__TAURI__) {
        const { readDir } = await import("@tauri-apps/plugin-fs")
        const entries = await readDir(this.chatsDir!)

        for (const entry of entries) {
          if (entry.name?.endsWith(".json")) {
            const id = entry.name.replace(".json", "")
            const session = await this.getSession(id)

            if (session && session.messages.length > 0) {
              sessions.push(this.sessionToListItem(session))
            }
          }
        }
      } else {
        // Для веб-версии используем localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith("chat_")) {
            const id = key.replace("chat_", "")
            const session = await this.getSession(id)
            if (session && session.messages.length > 0) {
              sessions.push(this.sessionToListItem(session))
            }
          }
        }
      }

      // Сортируем по дате последнего обновления (новые сверху)
      return sessions.sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0))
    } catch (error) {
      console.error("Failed to get all sessions:", error)
      return []
    }
  }

  /**
   * Обновить сессию
   */
  async updateSession(id: string, updates: Partial<ChatSession>): Promise<void> {
    const session = await this.getSession(id)
    if (!session) {
      throw new Error(`Session ${id} not found`)
    }

    const updated = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    }

    await this.saveSession(updated)
  }

  /**
   * Удалить сессию
   */
  async deleteSession(id: string): Promise<void> {
    await this.initialize()

    try {
      if (typeof window !== "undefined" && window.__TAURI__) {
        const { remove } = await import("@tauri-apps/plugin-fs")
        const filePath = `${this.chatsDir}/${id}.json`
        await remove(filePath)
      } else {
        localStorage.removeItem(`chat_${id}`)
      }
    } catch (error) {
      console.error(`Failed to delete session ${id}:`, error)
      throw error
    }
  }

  /**
   * Добавить сообщение в сессию
   */
  async addMessage(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const newMessage: ChatMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date(),
    }

    session.messages.push(newMessage)
    session.updatedAt = new Date()

    // Обновляем заголовок чата если это первое сообщение пользователя
    if (session.messages.length === 1 && message.role === "user") {
      session.title = this.generateTitle(message.content)
    }

    await this.saveSession(session)
    return newMessage
  }

  /**
   * Обновить сообщение
   */
  async updateMessage(sessionId: string, messageId: string, updates: Partial<ChatMessage>): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const messageIndex = session.messages.findIndex((m: ChatMessage) => m.id === messageId)
    if (messageIndex === -1) {
      throw new Error(`Message ${messageId} not found`)
    }

    session.messages[messageIndex] = {
      ...session.messages[messageIndex],
      ...updates,
    }

    await this.updateSession(sessionId, { messages: session.messages })
  }

  /**
   * Удалить сообщение
   */
  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    session.messages = session.messages.filter((m: ChatMessage) => m.id !== messageId)
    await this.updateSession(sessionId, { messages: session.messages })
  }

  /**
   * Поиск по сессиям
   */
  async searchSessions(query: string): Promise<ChatListItem[]> {
    const allSessions = await this.getAllSessions()
    const queryLower = query.toLowerCase()

    return allSessions.filter(
      (session) =>
        session.title.toLowerCase().includes(queryLower) || session.lastMessage?.toLowerCase().includes(queryLower),
    )
  }

  /**
   * Экспортировать сессию в JSON
   */
  async exportSession(id: string): Promise<string> {
    const session = await this.getSession(id)
    if (!session) {
      throw new Error(`Session ${id} not found`)
    }

    return JSON.stringify(session, null, 2)
  }

  /**
   * Импортировать сессию из JSON
   */
  async importSession(data: string): Promise<ChatSession> {
    try {
      const parsed = JSON.parse(data)

      // Создаем новую сессию с новым ID
      const session: ChatSession = {
        ...parsed,
        id: this.generateId(),
        createdAt: new Date(parsed.createdAt),
        updatedAt: new Date(),
        messages: parsed.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }

      await this.saveSession(session)
      return session
    } catch (error) {
      console.error("Failed to import session:", error)
      throw new Error("Invalid session data")
    }
  }

  /**
   * Сохранить сессию
   */
  private async saveSession(session: ChatSession): Promise<void> {
    await this.initialize()

    try {
      const data = JSON.stringify(session, null, 2)

      if (typeof window !== "undefined" && window.__TAURI__) {
        const { writeTextFile } = await import("@tauri-apps/plugin-fs")
        const filePath = `${this.chatsDir}/${session.id}.json`
        await writeTextFile(filePath, data)
      } else {
        localStorage.setItem(`chat_${session.id}`, data)
      }
    } catch (error) {
      console.error("Failed to save session:", error)
      throw error
    }
  }

  /**
   * Преобразовать сессию в элемент списка
   */
  private sessionToListItem(session: ChatSession): ChatListItem {
    const lastMessage = session.messages[session.messages.length - 1]

    return {
      id: session.id,
      title: session.title,
      lastMessage: lastMessage ? `${lastMessage.content.substring(0, 100)}...` : undefined,
      lastMessageAt: session.updatedAt,
      messageCount: session.messages.length,
      createdAt: new Date(),
      agent: "gpt-5",
    }
  }

  /**
   * Сгенерировать ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  /**
   * Сгенерировать заголовок из первого сообщения
   */
  private generateTitle(content: string): string {
    // Берем первые 50 символов или до первого переноса строки
    const firstLine = content.split("\n")[0]
    const title = firstLine.substring(0, 50)
    return title.length < firstLine.length ? `${title}...` : title
  }
}

// Экспортируем singleton instance
export const chatStorageService = LocalChatStorageService.getInstance()
