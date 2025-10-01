/**
 * AI Core Domain
 *
 * Базовая инфраструктура для AI функциональности
 */

// DI Container
export {
  type AIDIContainer,
  createTestContainer,
  getAIContainer,
  initializeAICore,
  type ServiceFactory,
  type ServiceLifecycle,
} from "./container"
// Providers
export {
  CLAUDE_MODELS,
  ClaudeProvider,
  createAIProviderFactory,
  DEEPSEEK_MODELS,
  DeepSeekProvider,
  GROK_MODELS,
  GrokProvider,
  OLLAMA_MODELS,
  OllamaProvider,
  OPENAI_MODELS,
  OpenAIProvider,
  registerAIProviders,
} from "./providers"
// React Integration
export {
  type AIServices,
  AIServicesProvider,
  useAIService,
  useAIServiceLazy,
  useAIServices,
  withAIServices,
} from "./react"
// Services
export {
  ApiKeyLoader,
  EnhancedUnifiedAIService,
  EnhancedUnifiedAIService as UnifiedAIService,
  ModelManagerImpl,
  registerAICoreServices,
  type UnifiedRequestOptions,
  type UnifiedResponse,
} from "./services"
// Intent Recognition
export * from "./services/intent-recognition"

// Response Processor
export * from "./services/response-processor"
// Types
export * from "./types"
