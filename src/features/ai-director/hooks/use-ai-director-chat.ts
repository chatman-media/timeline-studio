/**
 * Hook для AI Director Chat
 * Использует backend AI команды с контекстом анализа видео
 */

import { useCallback, useState } from "react"

import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"

import type { FileAnalysisProgress } from "../types/analysis-progress"
import type { MontagePlan } from "../types/montage-plan"
import { AI_DIRECTOR_SYSTEM_PROMPT, createAnalysisContext } from "../utils/director-prompts"
import { parseMontagePlanFromAI } from "../utils/montage-plan-parser"

const logger = createLogger("useAIDirectorChat")

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  metadata?: Record<string, any>
}

interface UseAIDirectorChatOptions {
  /** Callback когда AI создал план монтажа */
  onMontagePlanCreated?: (plan: MontagePlan) => void
}

interface UseAIDirectorChatReturn {
  messages: ChatMessage[]
  isProcessing: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
  lastMontagePlan: MontagePlan | null
}

/**
 * Hook для управления чатом с AI Director
 */
export function useAIDirectorChat(
  filesProgress: FileAnalysisProgress[],
  options?: UseAIDirectorChatOptions,
): UseAIDirectorChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastMontagePlan, setLastMontagePlan] = useState<MontagePlan | null>(null)
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

        const responseContent = (result.data as any).response

        // Пробуем распарсить план монтажа если AI его создал
        let montagePlan: MontagePlan | null = null
        if (responseContent.includes("```json") || responseContent.includes("{")) {
          montagePlan = parseMontagePlanFromAI(responseContent)

          if (montagePlan) {
            logger.infoSync("[useAIDirectorChat] Montage plan detected and parsed", {
              planId: montagePlan.id,
              clipsCount: montagePlan.clips.length,
            })

            setLastMontagePlan(montagePlan)

            // Вызываем callback если передан
            if (options?.onMontagePlanCreated) {
              options.onMontagePlanCreated(montagePlan)
            }
          }
        }

        // Добавляем ответ AI
        const assistantMessage: ChatMessage = {
          id: (result.data as any).message_id || `msg-ai-${Date.now()}`,
          role: "assistant",
          content: responseContent,
          timestamp: new Date(),
          metadata: {
            model: (result.data as any).model || "claude-3-5-sonnet-20241022",
            usage: (result.data as any).usage,
            montagePlan: montagePlan || undefined,
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
    [filesProgress, backendSync, options],
  )

  // Очистить историю сообщений
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setLastMontagePlan(null)
    logger.infoSync("[useAIDirectorChat] Messages cleared")
  }, [])

  return {
    messages,
    isProcessing,
    error,
    sendMessage,
    clearMessages,
    lastMontagePlan,
  }
}
