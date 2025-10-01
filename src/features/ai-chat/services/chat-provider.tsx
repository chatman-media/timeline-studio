/**
 * Chat Provider V2
 *
 * Гибридная архитектура: UI локально, история чата через backend
 */

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { UnifiedAIService } from "@/domains/ai-core/services"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"

// Базовые типы для чата
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
  const [backendSync] = useState(() => getBackendSync())
  const [backendState, setBackendState] = useState<ProjectState | null>(null)
  const [aiService] = useState(() => UnifiedAIService.getInstance())

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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("claude-4-sonnet")
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
      console.error("Failed to load chat sessions from localStorage:", error)
    }
  }, [])

  // Сохранение сессий в localStorage при изменении
  useEffect(() => {
    if (sessions.length > 0 || wasUpdated) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions))
      } catch (error) {
        console.error("Failed to save chat sessions to localStorage:", error)
      }
    }
  }, [sessions, wasUpdated])

  // Подписка на backend состояние
  useEffect(() => {
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setBackendState(state)
      setError(null)

      // Извлекаем сессии чата из состояния проекта
      if ((state as any).chat_sessions) {
        const backendSessions = (state as any).chat_sessions as any[]
        const convertedSessions: ChatSession[] = backendSessions.map((s) => ({
          id: s.id,
          name: s.name,
          messages: s.messages.map((m: any) => ({
            id: m.id,
            content: m.content,
            role: m.role,
            timestamp: new Date(m.timestamp),
            metadata: m.metadata,
          })),
          createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at),
        }))

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
        console.error("Chat command failed:", err)
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
        // Используем backend команду
        const result = await executeCommand({
          type: "Chat",
          params: {
            type: "CreateChatSession",
            params: { name: sessionName },
          },
        } as any)

        if (
          result &&
          (result as any).success &&
          (result as any).data &&
          typeof (result as any).data === "object" &&
          "session_id" in (result as any).data
        ) {
          const sessionId = (result as any).data.session_id

          // Создаем локальную версию сессии
          const newSession: ChatSession = {
            id: sessionId,
            name: sessionName,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          setSessions((prev) => [...prev, newSession])
          setCurrentSession(newSession)

          return newSession
        }
        throw new Error((result as any).error || "Failed to create chat session")
      } catch (error) {
        console.error("Failed to create chat session via backend:", error)

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
    [executeCommand],
  )

  const deleteSession = useCallback(
    async (sessionId: string) => {
      setSessions((prev) => {
        const newSessions = prev.filter((s) => s.id !== sessionId)

        // Если удаляем последнюю сессию, очищаем localStorage
        if (newSessions.length === 0) {
          try {
            localStorage.removeItem(CHAT_STORAGE_KEY)
          } catch (error) {
            console.error("Failed to clear chat sessions from localStorage:", error)
          }
        }

        return newSessions
      })

      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
      }

      console.warn("Chat session deletion not yet integrated with backend")

      // В будущем это будет:
      // await executeCommand({
      //   type: 'DeleteChatSession',
      //   params: { sessionId }
      // })
    },
    [currentSession, CHAT_STORAGE_KEY],
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
      if (!currentSession) {
        // Создаем новую сессию если её нет
        const newSession = await createSession()
        setCurrentSession(newSession)
      }

      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        content,
        role: "user",
        timestamp: new Date(),
      }

      // Отправляем сообщение через backend
      try {
        const result = await executeCommand({
          type: "Chat",
          params: {
            type: "SendChatMessage",
            params: {
              session_id: currentSession.id,
              content,
              role: "user" as const,
            },
          },
        } as any)

        if (!result || !(result as any).success) {
          throw new Error((result as any)?.error || "Failed to send message")
        }
      } catch (error) {
        console.error("Failed to send message via backend:", error)
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

      // Используем реальный AI сервис
      setIsStreaming(true)
      setIsProcessing(true)

      try {
        // Подготовка контекста для AI
        const systemPrompt =
          "Ты - ассистент для видеоредактора Timeline Studio. Помогай пользователям с монтажом видео, обработкой медиафайлов и использованием функций приложения."

        // Формируем историю сообщений для контекста
        const messages = currentSession?.messages.slice(-10) || [] // Последние 10 сообщений для контекста

        // Формируем сообщения для AI
        const aiMessages = [
          {
            role: "system" as const,
            content: systemPrompt,
          },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: "user" as const,
            content: content,
          },
        ]

        let aiResponse = ""

        // Стриминг ответа
        await aiService.sendStreamingRequest(selectedAgentId || "claude-4-sonnet-latest", aiMessages, {
          onContent: (chunk: string) => {
            aiResponse += chunk

            // Обновляем временное сообщение во время стриминга
            setCurrentSession((prev) => {
              if (!prev) return prev

              const tempMessageId = `msg_temp_${prev.id}`
              const existingTempMessage = prev.messages.find((m) => m.id === tempMessageId)

              let updatedMessages: any
              if (existingTempMessage) {
                // Обновляем существующее временное сообщение
                updatedMessages = prev.messages.map((m) => (m.id === tempMessageId ? { ...m, content: aiResponse } : m))
              } else {
                // Создаем новое временное сообщение
                updatedMessages = [
                  ...prev.messages,
                  {
                    id: tempMessageId,
                    content: aiResponse,
                    role: "assistant" as const,
                    timestamp: new Date(),
                  },
                ]
              }

              const updatedSession = {
                ...prev,
                messages: updatedMessages,
                updatedAt: new Date(),
              }

              setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

              return updatedSession
            })
          },
          maxTokens: 4096,
        })

        // Финализируем сообщение после завершения стриминга
        const finalMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          content: aiResponse,
          role: "assistant",
          timestamp: new Date(),
          metadata: {
            model: selectedAgentId,
            tokenCount: aiResponse.length / 4, // Примерная оценка
          },
        }

        // Отправляем ответ AI в backend
        if (currentSession) {
          try {
            await executeCommand({
              type: "Chat",
              params: {
                type: "SendChatMessage",
                params: {
                  session_id: currentSession.id,
                  content: aiResponse,
                  role: "assistant" as const,
                },
              },
            } as any)
          } catch (error) {
            console.error("Failed to send AI response to backend:", error)
          }
        }

        setCurrentSession((prev) => {
          if (!prev) return prev

          // Удаляем временное сообщение и добавляем финальное
          const messagesWithoutTemp = prev.messages.filter((m) => !m.id.includes("temp"))

          const updatedSession = {
            ...prev,
            messages: [...messagesWithoutTemp, finalMessage],
            updatedAt: new Date(),
          }

          setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

          return updatedSession
        })
      } catch (error) {
        console.error("AI response error:", error)
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

          // Удаляем временное сообщение если оно есть
          const messagesWithoutTemp = prev.messages.filter((m) => !m.id.includes("temp"))

          const updatedSession = {
            ...prev,
            messages: [...messagesWithoutTemp, errorMessage],
            updatedAt: new Date(),
          }

          setSessions((prevSessions) => prevSessions.map((s) => (s.id === prev.id ? updatedSession : s)))

          return updatedSession
        })
      } finally {
        setIsStreaming(false)
        setIsProcessing(false)
      }

      // В будущем это будет:
      // await executeCommand({
      //   type: 'SendChatMessage',
      //   params: { sessionId: currentSession.id, content }
      // })
    },
    [currentSession, createSession],
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

    console.warn("Chat session clearing not yet integrated with backend")

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
        console.log("Sessions updated through backend state")
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
    sessions: sessions.map((s) => {
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

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
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
