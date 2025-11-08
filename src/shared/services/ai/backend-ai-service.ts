/**
 * Backend AI Service
 *
 * Unified AI service that uses Tauri backend commands with secure API key storage.
 * API keys are stored in SecureStorage on the backend and never exposed to frontend.
 * All AI provider logic is handled on the backend for security and consistency.
 */

import { createLogger } from "@/lib/tauri-logger"
import type {
  AIMessage,
  AIProvider,
  AITool,
  CacheStats,
  ProviderStatus,
  ToolChoice,
  UnifiedAIRequest,
  UnifiedAIResponse,
} from "@/types/generated/tauri-bindings"
import { commands } from "@/types/generated/tauri-bindings"

const logger = createLogger("BackendAIService")

export interface AIServiceConfig {
  provider: AIProvider
  model: string
  maxTokens?: number
  temperature?: number
  system?: string
}

export class BackendAIService {
  private static instance: BackendAIService | null = null

  private constructor() {
    logger.infoSync("BackendAIService initialized")
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BackendAIService {
    if (!BackendAIService.instance) {
      BackendAIService.instance = new BackendAIService()
    }
    return BackendAIService.instance
  }

  /**
   * Send a message to AI using secure API key storage
   * Note: This is a placeholder - secure key storage not yet implemented in backend
   * For now, requires API key to be provided externally
   */
  async sendMessage(config: AIServiceConfig, messages: AIMessage[], apiKey: string): Promise<UnifiedAIResponse> {
    try {
      const request: UnifiedAIRequest = {
        provider: config.provider,
        model: config.model,
        messages,
        maxTokens: config.maxTokens ?? null,
        temperature: config.temperature ?? null,
        stream: false,
        system: config.system ?? null,
        tools: null,
        toolChoice: null,
      }

      logger.infoSync("Sending AI request", {
        provider: config.provider,
        model: config.model,
        messageCount: messages.length,
      })

      const result = await commands.aiSendUnifiedRequest(apiKey, request)

      if (result.status === "error") {
        const error = result.error || "Unknown error"
        logger.errorSync("AI request failed", { error })
        throw new Error(error)
      }

      logger.infoSync("AI request successful", {
        provider: result.data.provider,
        contentLength: result.data.content.length,
      })

      return result.data
    } catch (error) {
      logger.errorSync("Failed to send AI message", { error })
      throw error
    }
  }

  /**
   * Send message with tools (Claude Tools / OpenAI Function Calling)
   * Note: This is a placeholder - secure key storage not yet implemented in backend
   * For now, requires API key to be provided externally
   */
  async sendMessageWithTools(
    config: AIServiceConfig,
    messages: AIMessage[],
    tools: AITool[],
    apiKey: string,
    toolChoice?: ToolChoice,
  ): Promise<UnifiedAIResponse> {
    try {
      logger.infoSync("Sending AI request with tools", {
        provider: config.provider,
        model: config.model,
        messageCount: messages.length,
        toolsCount: tools.length,
      })

      const result = await commands.aiSendRequestWithTools(
        apiKey,
        config.provider,
        config.model,
        messages,
        tools,
        toolChoice ?? null,
        config.system ?? null,
        config.maxTokens ?? null,
        config.temperature ?? null,
      )

      if (result.status === "error") {
        const error = result.error || "Unknown error"
        logger.errorSync("AI request with tools failed", { error })
        throw new Error(error)
      }

      return result.data
    } catch (error) {
      logger.errorSync("Failed to send AI message with tools", { error })
      throw error
    }
  }

  /**
   * Send streaming request
   * Note: Streaming is handled through UnifiedAIRequest with stream: true
   * Response comes through events, not directly from this method
   */
  async sendStreamingRequest(
    config: AIServiceConfig,
    messages: AIMessage[],
    apiKey: string,
  ): Promise<UnifiedAIResponse> {
    try {
      const request: UnifiedAIRequest = {
        provider: config.provider,
        model: config.model,
        messages,
        maxTokens: config.maxTokens ?? null,
        temperature: config.temperature ?? null,
        stream: true,
        system: config.system ?? null,
        tools: null,
        toolChoice: null,
      }

      logger.infoSync("Sending streaming AI request", {
        provider: config.provider,
        model: config.model,
        messageCount: messages.length,
      })

      const result = await commands.aiSendUnifiedRequest(apiKey, request)

      if (result.status === "error") {
        const error = result.error || "Streaming request failed"
        logger.errorSync("Streaming request failed", { error })
        throw new Error(error)
      }

      logger.infoSync("Streaming request started")

      return result.data
    } catch (error) {
      logger.errorSync("Failed to send streaming request", { error })
      throw error
    }
  }

  /**
   * Validate API key for a provider
   */
  async validateProvider(provider: AIProvider, apiKey: string): Promise<ProviderStatus> {
    try {
      const result = await commands.aiValidateProvider(provider, apiKey)

      if (result.status === "error") {
        const error = result.error || "Validation failed"
        logger.errorSync("Provider validation failed", { provider, error })
        throw new Error(error)
      }

      return result.data
    } catch (error) {
      logger.errorSync("Failed to validate provider", { provider, error })
      throw error
    }
  }

  /**
   * Get available models for a provider
   */
  async getProviderModels(provider: AIProvider): Promise<string[]> {
    try {
      const result = await commands.aiGetProviderModels(provider)

      if (result.status === "error") {
        const error = result.error || "Failed to get models"
        logger.errorSync("Failed to get provider models", { provider, error })
        throw new Error(error)
      }

      return result.data
    } catch (error) {
      logger.errorSync("Failed to get provider models", { provider, error })
      throw error
    }
  }

  /**
   * Get list of supported providers
   */
  async getSupportedProviders(): Promise<AIProvider[]> {
    try {
      const result = await commands.aiGetSupportedProviders()

      if (result.status === "error") {
        const error = result.error || "Failed to get providers"
        logger.errorSync("Failed to get supported providers", { error })
        throw new Error(error)
      }

      return result.data
    } catch (error) {
      logger.errorSync("Failed to get supported providers", { error })
      throw error
    }
  }

  /**
   * Check health of multiple providers
   * Note: Requires API keys to be provided as tuples with providers
   */
  async checkProvidersHealth(providersWithKeys: Array<[AIProvider, string | null]>): Promise<ProviderStatus[]> {
    try {
      const result = await commands.aiCheckProvidersHealth(providersWithKeys)

      if (result.status === "error") {
        const error = result.error || "Health check failed"
        logger.errorSync("Failed to check providers health", { error })
        throw new Error(error)
      }

      return result.data
    } catch (error) {
      logger.errorSync("Failed to check providers health", { error })
      throw error
    }
  }

  /**
   * Get AI cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const result = await commands.aiGetCacheStats()

      if (result.status === "error") {
        const error = result.error || "Failed to get cache stats"
        logger.errorSync("Failed to get cache stats", { error })
        throw new Error(error)
      }

      return result.data
    } catch (error) {
      logger.errorSync("Failed to get cache stats", { error })
      throw error
    }
  }

  /**
   * Clear all AI cache
   */
  async clearCache(): Promise<number> {
    try {
      const result = await commands.aiClearCache()

      if (result.status === "error") {
        const error = result.error || "Failed to clear cache"
        logger.errorSync("Failed to clear cache", { error })
        throw new Error(error)
      }

      logger.infoSync("Cache cleared", { deletedEntries: result.data })
      return result.data
    } catch (error) {
      logger.errorSync("Failed to clear cache", { error })
      throw error
    }
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    try {
      const result = await commands.aiCleanupExpiredCache()

      if (result.status === "error") {
        const error = result.error || "Failed to cleanup expired cache"
        logger.errorSync("Failed to cleanup expired cache", { error })
        throw new Error(error)
      }

      logger.infoSync("Expired cache cleaned", { deletedEntries: result.data })
      return result.data
    } catch (error) {
      logger.errorSync("Failed to cleanup expired cache", { error })
      throw error
    }
  }
}

// Export singleton instance
export const backendAI = BackendAIService.getInstance()
