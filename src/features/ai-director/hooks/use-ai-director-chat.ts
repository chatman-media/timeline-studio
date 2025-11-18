/**
 * Hook для AI Director Chat
 * Использует backend AI команды с контекстом анализа видео
 */

import { useCallback, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"

import type { FileAnalysisProgress } from "../types/analysis-progress"
import { AI_DIRECTOR_SYSTEM_PROMPT, createAnalysisContext } from "../utils/director-prompts"

const logger = createLogger("useAIDirectorChat")

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface UseAIDirectorChatReturn {
  messages: ChatMessage[]
  isProcessing: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

/**
 * Hook для управления чатом с AI Director
 */
export function useAIDirectorChat(filesProgress: FileAnalysisProgress[]): UseAIDirectorChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [backendSync] = useState(() => getBackendSync())

  // Отправить сообщение в AI Director
  const sendMessage = useCallback(
    async (content: string) => {
      try {
        setIsProcessing(true)
        setError(null)

        // Добавляем сообщение пользователя
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: "user",
          content,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, userMessage])

        logger.infoSync("[useAIDirectorChat] Sending message to AI Director", {
          content: content.substring(0, 50),
        })

        // Создаем контекст анализа
        const analysisContext = createAnalysisContext(filesProgress)

        // Формируем контекст проекта с системным промптом и результатами анализа
        const projectContext = {
          type: "ai_director_analysis",
          system_prompt: AI_DIRECTOR_SYSTEM_PROMPT,
          analysis_context: analysisContext,
          files_analyzed: filesProgress.length,
          completed_files: filesProgress.filter((f) => f.status === "completed").length,
          instruction:
            "Пользователь работает с результатами анализа видео. Используй эту информацию для создания конкретных рекомендаций по монтажу.",
        }

        // Отправляем через backend AI proxy
        const result = await backendSync.executeCommand({
          type: "SendChatMessage",
          params: {
            session_id: "ai-director-session",
            message: content,
            model: "claude-3-5-sonnet-20241022", // Используем Claude для AI Director
            provider: "claude",
            project_context: projectContext,
          },
        })

        logger.infoSync("[useAIDirectorChat] Received AI response", {
          success: result.success,
        })

        if (!result.success || !(result.data as any)?.response) {
          throw new Error(result.error || "No response from AI")
        }

        // Добавляем ответ AI
        const assistantMessage: ChatMessage = {
          id: (result.data as any).message_id || `msg-ai-${Date.now()}`,
          role: "assistant",
          content: (result.data as any).response,
          timestamp: new Date(),
          metadata: {
            model: (result.data as any).model || "claude-3-5-sonnet-20241022",
            usage: (result.data as any).usage,
          },
        }

        setMessages((prev) => [...prev, assistantMessage])

        logger.infoSync("[useAIDirectorChat] AI response added to messages")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        logger.errorSync("[useAIDirectorChat] Error sending message", err as Record<string, unknown>)

        setError(errorMessage)

        // Добавляем сообщение об ошибке
        const errorMsg: ChatMessage = {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content: `Извини, произошла ошибка при обработке запроса: ${errorMessage}. Попробуй переформулировать вопрос.`,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setIsProcessing(false)
      }
    },
    [filesProgress, backendSync],
  )

  // Очистить историю сообщений
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    logger.infoSync("[useAIDirectorChat] Messages cleared")
  }, [])

  return {
    messages,
    isProcessing,
    error,
    sendMessage,
    clearMessages,
  }
}
