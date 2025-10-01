/**
 * Chat-related Tauri Commands for AI Services Domain
 */

import { invoke } from "@tauri-apps/api/core"
import type { ChatMessage, ChatTimelineContext } from "../types/chat"

/**
 * API Key management commands
 */
export async function saveApiKey(provider: string, apiKey: string): Promise<void> {
  return invoke("save_simple_api_key", {
    provider,
    apiKey,
  })
}

export async function getApiKey(provider: string): Promise<string | null> {
  return invoke("get_decrypted_api_key", {
    provider,
  })
}

export async function validateApiKey(provider: string, apiKey: string): Promise<boolean> {
  return invoke("validate_api_key", {
    provider,
    apiKey,
  })
}

export async function listApiKeys(): Promise<string[]> {
  return invoke("list_api_keys")
}

export async function deleteApiKey(provider: string): Promise<void> {
  return invoke("delete_api_key", {
    provider,
  })
}

/**
 * Chat session management (if supported by backend)
 */
export interface ChatSessionData {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// Note: These commands would need to be implemented in Rust backend
// Currently they are placeholder for future implementation
export async function createChatSession(title: string): Promise<ChatSessionData> {
  console.log("[Chat Commands] Creating chat session:", title)
  // Placeholder - would call actual Tauri command when implemented
  return {
    id: `session-${Date.now()}`,
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function saveChatSession(session: ChatSessionData): Promise<void> {
  console.log("[Chat Commands] Saving chat session:", session.id)
  // Placeholder for future backend implementation
}

export async function loadChatSession(sessionId: string): Promise<ChatSessionData | null> {
  console.log("[Chat Commands] Loading chat session:", sessionId)
  // Placeholder for future backend implementation
  return null
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  console.log("[Chat Commands] Deleting chat session:", sessionId)
  // Placeholder for future backend implementation
}

/**
 * Timeline context extraction for AI chat
 */
export async function extractTimelineContext(): Promise<ChatTimelineContext> {
  console.log("[Chat Commands] Extracting timeline context")
  // This would integrate with timeline domain when available
  return {
    projectName: "Current Project",
    projectDuration: 0,
    selectedClips: [],
    selectedTracks: [],
    currentTime: 0,
    effects: [],
    filters: [],
  }
}
