/**
 * Chat Provider V2
 *
 * Гибридная архитектура: UI локально, история чата через backend
 */

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
// REMOVED: import { UnifiedAIService } from "@/domains/ai-core/services" // ai-core module deleted - use backend AI proxy instead
import { container } from "@/core/container"
import { createLogger } from "@/lib/tauri-logger"
import type * as TauriTypes from "@/types/generated/tauri-bindings"

type ProjectState = TauriTypes.ProjectState

const logger = createLogger("ChatProvider")

// Локальные типы для UI (с Date объектами вместо строк)
interface ChatMessage {
  id: string
  content: string
  role: "user" | "assistant" | "system"
  timestamp: Date
  metadata?: Record<string, any>
}

interface ChatSession {
  id: string
  name: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

interface ChatContextType {
  // Текущая сессия (локальное состояние)
  currentSession: ChatSession | null
  isLoading: boolean
  error: string | null

  // История сессий (backend)
  sessions: any[]

  // UI состояние (локальное)
  isOpen: boolean
  inputText: string
  isStreaming: boolean

  // Действия для сессий (backend)
  createSession: (name?: string) => Promise<ChatSession>
  switchToSession: (sessionId: string) => Promise<void>

  // Действия для сообщений (backend)
  sendMessage: (content: string) => Promise<void>
  clearCurrentSession: () => Promise<void>

  // UI действия (локальные)
  setIsOpen: (isOpen: boolean) => void
  setInputText: (text: string) => void
  setIsStreaming: (isStreaming: boolean) => void

  // Обратная совместимость со старым интерфейсом
  chatMessages: ChatMessage[]
  sendChatMessage: (content: string) => Promise<void>
  receiveChatMessage: (content: string) => void
  selectedAgentId: string | null
  selectAgent: (agentId: string) => void
  isProcessing: boolean
  setProcessing: (processing: boolean) => void
  currentSessionId: string | null
  isCreatingNewChat: boolean
  createNewChat: () => Promise<void>
  switchSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  updateSessions: (sessions?: any[]) => Promise<void>
  clearMessages: () => Promise<void>
  setError: (error: string | null) => void
  removeMessage: (messageId: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [backendSync] = useState(() => container.getBackend())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)

  // Backend состояние
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // UI состояние (локальное)
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)

  // Обратная совместимость со старым интерфейсом
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  // Флаг для отслеживания был ли вызван updateSessions
  const [wasUpdated, setWasUpdated] = useState(false)

  // Ключ для localStorage
  const CHAT_STORAGE_KEY = "timeline-studio-chat-sessions"

  // Загрузка сессий из localStorage при инициализации
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(CHAT_STORAGE_KEY)
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions)
        // Конвертируем строки дат обратно в объекты Date
        const sessions: ChatSession[] = parsedSessions.map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }))
        setSessions(sessions)

        // Восстанавливаем последнюю активную сессию
        if (sessions.length > 0) {
          setCurrentSession(sessions[0])
        }

        setWasUpdated(true)
      }
    } catch (error) {
      void logger.error("Failed to load chat sessions from localStorage", {
        error: String(error),
      })
    }
  }, [])

  // Сохранение сессий в localStorage при изменении
  useEffect(() => {
    if (sessions.length > 0 || wasUpdated) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions))
      } catch (error) {
        void logger.error("Failed to save chat sessions to localStorage", {
          error: String(error),
        })
      }
    }
  }, [sessions, wasUpdated])

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
      setError(null)

      // Извлекаем сессии чата из состояния проекта
      if (state.chat_sessions) {
        const backendSessions = state.chat_sessions
        const convertedSessions: ChatSession[] = backendSessions.map((s: any) => ({
          id: s.id,
          name: s.name,
          messages: s.messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            role: m.role as "user" | "assistant" | "system",
            timestamp: new Date(m.timestamp),
            metadata: m.metadata as Record<string, any> | undefined,
          })),
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
        })) as ChatSession[]

        setSessions(convertedSessions)

        // Если текущей сессии нет в списке, выбираем первую
        if (
          convertedSessions.length > 0 &&
          (!currentSession || !convertedSessions.find((s) => s.id === currentSession.id))
        ) {
          setCurrentSession(convertedSessions[0])
        }

        setWasUpdated(true)
      }
    })

    return unsubscribe
  }, [backendSync, currentSession])

  // Инициализация дефолтной сессии только если не было вызвано updateSessions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!wasUpdated && !currentSession && sessions.length === 0) {
        const defaultSession: ChatSession = {
          id: "default-session",
          name: "Новый чат",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setCurrentSession(defaultSession)
        setSessions([defaultSession])
      }
    }, 100) // Небольшая задержка для тестов

    return () => clearTimeout(timer)
  }, [])

  // Функция для выполнения backend команд
  const executeCommand = useCallback(
    async (command: any) => {
      try {
        setIsLoading(true)
        setError(null)

        const result = await backendSync.executeCommand(command)
        if (!result.success) {
          throw new Error(result.error || "Command failed")
        }

        return result.data
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        void logger.error("Chat command failed", { error: String(err) })
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [backendSync],
  )

  // Действия для сессий
  const createSession = useCallback(
    async (name?: string): Promise<ChatSession> => {
      const sessionName = name || `Чат ${new Date().toLocaleString()}`

      try {
        // Используем новую прямую AI команду
        const result = await executeCommand({
          type: "CreateChatSession",
          params: {
            name: sessionName,
            agent_type: selectedAgentId,
          },
        })

        if (result && (result as any).session_id) {
          const newSession: ChatSession = {
            id: (result as any).session_id,
            name: sessionName,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          setSessions((prev) => [...prev, newSession])
          setCurrentSession(newSession)

          return newSession
        }
        throw new Error("Failed to create chat session")
      } catch (error) {
        void logger.error("Failed to create chat session via backend", {
          error: String(error),
        })

        // Fallback на локальное создание
        const newSession: ChatSession = {
          id: `session_${Date.now()}`,
          name: sessionName,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        setSessions((prev) => [...prev, newSession])
        setCurrentSession(newSession)

        return newSession
      }
    },
    [executeCommand, selectedAgentId],
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        // Используем новую прямую AI команду
        await executeCommand({
          type: "DeleteChatSession",
          params: { session_id: sessionId },
        })
      } catch (error) {
        void logger.error("Failed to delete chat session via backend", {
          error: String(error),
        })
      }

      setSessions((prev) => {
        const newSessions = prev.filter((s) => s.id !== sessionId)

        // Если удаляем последнюю сессию, очищаем localStorage
        if (newSessions.length === 0) {
          try {
            localStorage.removeItem(CHAT_STORAGE_KEY)
          } catch (error) {
            void logger.error("Failed to clear chat sessions from localStorage", { error: String(error) })
          }
        }

        return newSessions
      })

      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
      }
    },
    [currentSession, CHAT_STORAGE_KEY, executeCommand],
  )

  const switchToSession = useCallback(async (sessionId: string) => {
    // Используем функциональное обновление для получения актуального состояния
    setSessions((prevSessions) => {
      const session = prevSessions.find((s) => s.id === sessionId)
      if (session) {
        setCurrentSession(session)
        return prevSessions
      }
      // Создаем новую сессию с указанным ID для обратной совместимости
      const newSession: ChatSession = {
        id: sessionId,
        name: "Новый чат",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setCurrentSession(newSession)
      return [...prevSessions, newSession]
    })
  }, [])

  // Действия для сообщений
  const sendMessage = useCallback(
    async (content: string) => {
      let sessionToUse = currentSession
      if (!sessionToUse) {
        // Создаем новую сессию если её нет
        sessionToUse = await createSession()
        setCurrentSession(sessionToUse)
      }

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content,
        role: "user",
        timestamp: new Date(),
      }

      // Получаем контекст проекта для AI
      let projectContext = null
      try {
        const contextResult = await executeCommand({
          type: "GetProjectContext",
        })
        projectContext = contextResult
      } catch (error) {
        void logger.error("Failed to get project context", {
          error: String(error),
        })
      }

      // Добавляем сообщение пользователя локально для немедленного отображения
      setCurrentSession((prev) => {
        if (!prev) return prev
        const updatedSession = {
          ...prev,
          messages: [...prev.messages, userMessage],
          updatedAt: new Date(),
        }

        // Обновляем в списке сессий
        setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

        return updatedSession
      })

      // Отправляем сообщение через backend AI команды
      setIsStreaming(true)
      setIsProcessing(true)

      try {
        // Определяем модель и провайдера из selectedAgentId
        const agentId = selectedAgentId || "claude-3-5-sonnet-20241022"
        const provider = agentId.includes("claude") ? "claude" : "openai"

        // Отправляем запрос через backend
        const aiResult = await executeCommand({
          type: "SendChatMessage",
          params: {
            session_id: sessionToUse.id,
            message: content,
            model: agentId,
            provider: provider,
            project_context: projectContext,
          },
        })

        if (aiResult && (aiResult as any).response) {
          // Создаем финальное сообщение от AI
          const finalMessage: ChatMessage = {
            id: (aiResult as any).message_id || `msg_ai_${Date.now()}`,
            content: (aiResult as any).response,
            role: "assistant",
            timestamp: new Date(),
            metadata: {
              model: (aiResult as any).model || agentId,
              usage: (aiResult as any).usage,
            },
          }

          // Добавляем сообщение от AI локально
          setCurrentSession((prev) => {
            if (!prev) return prev

            const updatedSession = {
              ...prev,
              messages: [...prev.messages, finalMessage],
              updatedAt: new Date(),
            }

            setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

            return updatedSession
          })
        } else {
          throw new Error("No response from AI")
        }
      } catch (error) {
        void logger.error("AI response error", { error: String(error) })
        setError(error instanceof Error ? error.message : "Ошибка при получении ответа от AI")

        // Добавляем сообщение об ошибке
        const errorMessage: ChatMessage = {
          id: `msg_error_${Date.now()}`,
          content: "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте еще раз.",
          role: "assistant",
          timestamp: new Date(),
          metadata: {
            error: true,
            errorDetails: error instanceof Error ? error.message : String(error),
          },
        }

        setCurrentSession((prev) => {
          if (!prev) return prev

          const updatedSession = {
            ...prev,
            messages: [...prev.messages, errorMessage],
            updatedAt: new Date(),
          }

          setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

          return updatedSession
        })
      } finally {
        setIsStreaming(false)
        setIsProcessing(false)
      }
    },
    [currentSession, createSession, executeCommand, selectedAgentId],
  )

  const clearCurrentSession = useCallback(async () => {
    if (!currentSession) return

    setCurrentSession((prev) => {
      if (!prev) return prev
      const clearedSession = {
        ...prev,
        messages: [],
        updatedAt: new Date(),
      }

      setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? clearedSession : s)))

      return clearedSession
    })

    logger.warnSync("Chat session clearing not yet integrated with backend")

    // В будущем это будет:
    // await executeCommand({
    //   type: 'ClearChatSession',
    //   params: { sessionId: currentSession.id }
    // })
  }, [currentSession])

  // Функции обратной совместимости
  const sendChatMessage = useCallback(
    async (content: string) => {
      setIsProcessing(true)
      try {
        await sendMessage(content)
      } finally {
        setIsProcessing(false)
      }
    },
    [sendMessage],
  )

  const receiveChatMessage = useCallback(
    (content: string) => {
      if (!currentSession) return

      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content,
        role: "assistant",
        timestamp: new Date(),
      }

      setCurrentSession((prev) => {
        if (!prev) return prev
        const updatedSession = {
          ...prev,
          messages: [...prev.messages, newMessage],
          updatedAt: new Date(),
        }

        setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

        return updatedSession
      })
    },
    [currentSession],
  )

  const selectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId)
  }, [])

  const setProcessing = useCallback((processing: boolean) => {
    setIsProcessing(processing)
  }, [])

  const createNewChat = useCallback(async () => {
    setIsCreatingNewChat(true)
    try {
      await createSession()
    } finally {
      setIsCreatingNewChat(false)
    }
  }, [createSession])

  const switchSession = useCallback(
    async (sessionId: string) => {
      await switchToSession(sessionId)
    },
    [switchToSession],
  )

  const updateSessions = useCallback(
    async (newSessions?: any[]) => {
      setWasUpdated(true)
      if (newSessions) {
        // Для тестов и обратной совместимости - принимаем массив сессий
        const convertedSessions: ChatSession[] = newSessions.map((s) => {
          // Создаем пустые сообщения, если указан messageCount
          const messages: ChatMessage[] = s.messages || []
          if (s.messageCount && !s.messages) {
            // Создаем фиктивные сообщения для соответствия messageCount
            for (let i = 0; i < s.messageCount; i++) {
              messages.push({
                id: `msg_${s.id}_${i}`,
                content: `Message ${i + 1}`,
                role: i % 2 === 0 ? "user" : "assistant",
                timestamp: new Date(),
              })
            }
          }

          return {
            id: s.id,
            name: s.title || s.name || "Чат",
            messages,
            createdAt: s.createdAt || new Date(),
            updatedAt: s.updatedAt || s.lastMessageAt || new Date(),
          }
        })
        // Полностью заменяем все сессии новыми (удаляем default-session если она есть)
        setSessions(convertedSessions)

        // Если текущая сессия не в новом списке, сбрасываем её
        if (currentSession && !convertedSessions.find((s) => s.id === currentSession.id)) {
          setCurrentSession(null)
        }
      } else {
        // Обновление сессий уже происходит через backend state
        logger.debugSync("Sessions updated through backend state")
      }
    },
    [currentSession],
  )

  const clearMessages = useCallback(async () => {
    await clearCurrentSession()
  }, [clearCurrentSession])

  // Методы для обратной совместимости
  const setErrorCompat = useCallback((errorMessage: string | null) => {
    setError(errorMessage)
  }, [])

  const removeMessage = useCallback((messageId: string) => {
    setCurrentSession((prev) => {
      if (!prev) return prev
      const updatedSession = {
        ...prev,
        messages: prev.messages.filter((msg) => msg.id !== messageId),
        updatedAt: new Date(),
      }

      // Обновляем в списке сессий
      setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

      return updatedSession
    })
  }, [])

  // Контекстное значение
  const contextValue: ChatContextType = {
    // Текущая сессия
    currentSession,
    isLoading,
    error,

    // История сессий - конвертируем в ChatListItem для обратной совместимости
    // Фильтруем сессии с 0 сообщений - пустые сессии не должны отображаться в списке
    sessions: sessions
      .filter((s) => s.messages.length > 0)
      .map((s) => {
        const item: any = {
          id: s.id,
          title: s.name,
          lastMessageAt: s.updatedAt,
          messageCount: s.messages.length,
        }
        // Добавляем lastMessage только если есть сообщения
        if (s.messages.length > 0) {
          item.lastMessage = s.messages[s.messages.length - 1]?.content
        }
        return item
      }),

    // UI состояние
    isOpen,
    inputText,
    isStreaming,

    // Действия для сессий
    createSession,
    deleteSession,
    switchToSession,

    // Действия для сообщений
    sendMessage,
    clearCurrentSession,

    // UI действия
    setIsOpen,
    setInputText,
    setIsStreaming,

    // Обратная совместимость со старым интерфейсом
    chatMessages: currentSession?.messages || [],
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    selectAgent,
    isProcessing,
    setProcessing,
    currentSessionId: currentSession?.id || null,
    isCreatingNewChat,
    createNewChat,
    switchSession,
    updateSessions,
    clearMessages,
    setError: setErrorCompat,
    removeMessage,
  }

  return (
    <ChatContext.Provider value={contextValue} data-oid="mqoyckm">
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext)

  if (!context) {
    throw new Error("useChat должен использоваться внутри ChatProvider")
  }

  return context
}

// Экспорт типов
export type { ChatContextType }

// Экспорт контекста для типизации
export { ChatContext }
