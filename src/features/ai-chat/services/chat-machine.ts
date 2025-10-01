/**
 * @deprecated
 * This file has been moved to @/domains/ai-services/machines/chat-machine.ts
 *
 * Import from the new location:
 * import { chatMachine } from '@/domains/ai-services/machines/chat-machine'
 */

// Legacy re-export for backward compatibility
export {
  type ChatMachine,
  type ChatMachineContext,
  type ChatMachineEvent,
  chatMachine,
} from "../../../domains/ai-services/machines/chat-machine"

// Import from new domain location
import type { ChatListItem, ChatMessage } from "../../../domains/ai-services/types/chat"

// Re-export types that were imported from types/chat
export type { ChatListItem, ChatMessage }
