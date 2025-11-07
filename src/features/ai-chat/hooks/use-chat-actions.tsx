import { logInfo } from "@/lib/tauri-logger"

import type { ChatContextType } from "../services/chat-provider"
import { useChat } from "./use-chat"

/**
 * Хук для получения только действий чата (без состояния)
 * Полезен для компонентов, которые только выполняют действия
 *
 * @returns Действия чата
 */
export function useChatActions(): Pick<
  ChatContextType,
  | "sendChatMessage"
  | "receiveChatMessage"
  | "selectAgent"
  | "setProcessing"
  | "setError"
  | "clearMessages"
  | "removeMessage"
> {
  logInfo("[useChatActions] Инициализация")

  const { sendChatMessage, receiveChatMessage, selectAgent, setProcessing, setError, clearMessages, removeMessage } =
    useChat()

  logInfo("[useChatActions] Готов")

  return {
    sendChatMessage,
    receiveChatMessage,
    selectAgent,
    setProcessing,
    setError,
    clearMessages,
    removeMessage,
  }
}
