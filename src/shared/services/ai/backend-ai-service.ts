/**
 * Backend AI Service
 *
 * Unified AI service that uses Tauri backend commands instead of direct API calls.
 * All AI provider logic is handled on the backend for security and consistency.
 */

import { createLogger } from "@/lib/tauri-logger"
import type {
  AIMessage,
  AIProvider,
  AITool,
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
  apiKey: string
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
   * Send a message to AI
   */
  async sendMessage(config: AIServiceConfig, messages: AIMessage[]): Promise<UnifiedAIResponse> {
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

      const result = await commands.aiSendUnifiedRequest(config.apiKey, request)

      if (!result.status) {
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
   */
  async sendMessageWithTools(
    config: AIServiceConfig,
    messages: AIMessage[],
    tools: AITool[],
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
        config.apiKey,
        config.provider,
        config.model,
        messages,
        tools,
        toolChoice ?? null,
        config.system ?? null,
        config.maxTokens ?? null,
        config.temperature ?? null,
      )

      if (!result.status) {
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
   * Send message with automatic fallback to other providers
   */
  async sendMessageWithFallback(
    providersWithKeys: Array<[AIProvider, string]>,
    model: string,
    messages: AIMessage[],
    options?: {
      maxTokens?: number
      temperature?: number
      system?: string
    },
  ): Promise<UnifiedAIResponse> {
    try {
      const request: UnifiedAIRequest = {
        provider: providersWithKeys[0][0], // Will be overridden by fallback logic
        model,
        messages,
        maxTokens: options?.maxTokens ?? null,
        temperature: options?.temperature ?? null,
        stream: false,
        system: options?.system ?? null,
        tools: null,
        toolChoice: null,
      }

      logger.infoSync("Sending AI request with fallback", {
        providerCount: providersWithKeys.length,
        model,
      })

      const result = await commands.aiSendRequestWithFallback(providersWithKeys, request)

      if (!result.status) {
        const error = result.error || "All providers failed"
        logger.errorSync("AI request with fallback failed", { error })
        throw new Error(error)
      }

      logger.infoSync("AI request with fallback successful", {
        provider: result.data.provider,
      })

      return result.data
    } catch (error) {
      logger.errorSync("Failed to send AI message with fallback", { error })
      throw error
    }
  }

  /**
   * Validate API key for a provider
   */
  async validateProvider(provider: AIProvider, apiKey: string): Promise<ProviderStatus> {
    try {
      const result = await commands.aiValidateProvider(provider, apiKey)

      if (!result.status) {
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

      if (!result.status) {
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

      if (!result.status) {
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
   */
  async checkProvidersHealth(providersWithKeys: Array<[AIProvider, string | null]>): Promise<ProviderStatus[]> {
    try {
      const result = await commands.aiCheckProvidersHealth(providersWithKeys)

      if (!result.status) {
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
}

// Export singleton instance
export const backendAI = BackendAIService.getInstance()
