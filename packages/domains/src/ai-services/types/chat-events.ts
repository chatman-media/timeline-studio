/**
 * Chat Event Types
 *
 * Типы событий чата от Rust backend
 * Временное решение до генерации типов из Rust
 */

import type { ChatListItem, ChatMessage } from "./chat"

export type ChatEvent =
  | { type: "ChatSessionCreated"; payload: ChatListItem }
  | { type: "ChatSessionDeleted"; payload: { sessionId: string } }
  | { type: "ChatSessionCleared"; payload: { sessionId: string } }
  | { type: "ChatSessionUpdated"; payload: ChatListItem }
  | { type: "ChatMessageAdded"; payload: ChatMessage }
  | { type: "ChatMessageUpdated"; payload: ChatMessage }
  | { type: "ChatMessageDeleted"; payload: { messageId: string } }
