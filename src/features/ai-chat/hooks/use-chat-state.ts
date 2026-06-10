import type { ChatContextType } from "@/features/ai-chat/services/chat-provider"
import { logInfo } from "@/lib/tauri-logger"
import { useChat } from "./use-chat"

/**
 * Хук для доступа только к состоянию чата (без методов)
 * @returns Только состояние чата
 */
export function useChatState(): Pick<
  ChatContextType,
  "chatMessages" | "selectedAgentId" | "isProcessing" | "error" | "currentSessionId" | "sessions" | "isCreatingNewChat"
> {
  logInfo("[useChatState] Инициализация")

  const { chatMessages, selectedAgentId, isProcessing, error, currentSessionId, sessions, isCreatingNewChat } =
    useChat()

  const result = {
    chatMessages,
    selectedAgentId,
    isProcessing,
    error,
    currentSessionId,
    sessions,
    isCreatingNewChat,
  }

  logInfo("[useChatState] Готов", {
    messagesCount: chatMessages.length,
    isProcessing,
    sessionsCount: sessions.length,
  })

  return result
}
