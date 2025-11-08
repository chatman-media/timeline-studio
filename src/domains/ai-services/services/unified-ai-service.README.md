# Unified AI Service

Сервис для работы с унифицированными AI командами через Tauri backend. Поддерживает множество провайдеров через единый интерфейс.

## Поддерживаемые провайдеры

- **Claude** (Anthropic)
- **OpenAI** (GPT-4, GPT-3.5)
- **DeepSeek** (DeepSeek Chat, DeepSeek Coder)
- **Ollama** (Local LLMs)

## Основные возможности

- ✅ Унифицированный API для всех провайдеров
- ✅ Автоматическое кэширование ответов
- ✅ Streaming support через Tauri Event System
- ✅ Function Calling / Claude Tool Use
- ✅ Валидация провайдеров и API ключей
- ✅ Статистика кэша и управление
- ✅ Secure API key storage (не требует передачи ключей с frontend)
- ✅ Automatic fallback между провайдерами

## Установка

```typescript
import { unifiedAIService } from "@/domains/ai-services/services"
```

## Примеры использования

### 1. Простой запрос (Non-streaming)

```typescript
const response = await unifiedAIService.sendRequest({
  provider: "claude",
  model: "claude-sonnet-4",
  messages: [
    { role: "user", content: "Hello, how are you?" }
  ],
  maxTokens: 1024,
  temperature: 0.7,
  stream: false,
  system: "You are a helpful assistant.",
  tools: null,
  toolChoice: null,
})

console.log(response.content)
console.log(`Tokens: ${response.usage?.totalTokens}`)
```

### 2. Streaming запрос

```typescript
const requestId = await unifiedAIService.sendStreamingRequest(
  {
    provider: "claude",
    model: "claude-sonnet-4",
    messages: [
      { role: "user", content: "Tell me a long story" }
    ],
    stream: true,
    maxTokens: null,
    temperature: 0.8,
    system: null,
    tools: null,
    toolChoice: null,
  },
  {
    onChunk: (chunk) => {
      console.log("Chunk:", chunk)
      // Update UI with streaming text
    },
    onComplete: (fullContent) => {
      console.log("Complete:", fullContent)
      // Finalize UI
    },
    onError: (error) => {
      console.error("Error:", error)
      // Handle error
    }
  }
)

console.log("Request ID:", requestId)
```

### 3. Запрос с инструментами (Function Calling)

```typescript
const response = await unifiedAIService.sendSecureRequestWithTools(
  "claude",
  "claude-sonnet-4",
  [
    { role: "user", content: "What's the weather in San Francisco?" }
  ],
  [
    {
      name: "get_weather",
      description: "Get current weather information",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name" },
          units: { type: "string", enum: ["celsius", "fahrenheit"] }
        },
        required: ["location"]
      }
    }
  ],
  {
    toolChoice: { tool: { name: "get_weather" } },
    maxTokens: 1024,
    temperature: 0.5
  }
)

// Check if AI wants to call a tool
if (response.toolCalls && response.toolCalls.length > 0) {
  const toolCall = response.toolCalls[0]
  console.log("AI wants to call:", toolCall.name)
  console.log("With input:", toolCall.input)

  // Execute the tool and send result back...
}
```

### 4. Работа с кэшем

```typescript
// Получить статистику кэша
const stats = await unifiedAIService.getCacheStats()
console.log(`Cache: ${stats.totalEntries} entries`)
console.log(`Cache hits: ${stats.totalHits}`)
console.log(`Expired: ${stats.expiredEntries}`)

// Очистить весь кэш
const cleared = await unifiedAIService.clearCache()
console.log(`Cleared ${cleared} entries`)

// Очистить только просроченные записи
const cleaned = await unifiedAIService.cleanupExpiredCache()
console.log(`Removed ${cleaned} expired entries`)
```

### 5. Валидация провайдеров

```typescript
// Проверить один провайдер
const status = await unifiedAIService.validateProvider(
  "claude",
  "sk-ant-api-key"
)

if (status.available) {
  console.log("Claude is available!")
  console.log("Models:", status.models)
} else {
  console.error("Error:", status.error)
}

// Проверить все провайдеры
const health = await unifiedAIService.checkProvidersHealth([
  ["claude", "sk-ant-..."],
  ["openai", "sk-..."],
  ["ollama", null] // Ollama не требует API ключ
])

health.forEach(status => {
  console.log(`${status.provider}: ${status.available ? "OK" : "Error"}`)
})
```

### 6. Получить информацию о провайдерах

```typescript
// Все поддерживаемые провайдеры
const providers = await unifiedAIService.getSupportedProviders()
console.log("Supported:", providers)
// ["claude", "openai", "deepseek", "ollama"]

// Модели для конкретного провайдера
const models = await unifiedAIService.getProviderModels("claude")
console.log("Claude models:", models)
// ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", ...]
```

### 7. Automatic Fallback

```typescript
// Попробовать несколько провайдеров по порядку
const response = await unifiedAIService.sendRequestWithFallback(
  [
    ["claude", "sk-ant-..."],      // Сначала попробуем Claude
    ["openai", "sk-..."],           // Затем OpenAI
    ["ollama", ""]                  // В крайнем случае local Ollama
  ],
  {
    provider: "claude", // preferred
    model: "claude-sonnet-4",
    messages: [{ role: "user", content: "Hello" }],
    maxTokens: null,
    temperature: null,
    stream: false,
    system: null,
    tools: null,
    toolChoice: null,
  }
)

console.log("Got response from:", response.provider)
```

## Типы

### UnifiedAIRequest

```typescript
interface UnifiedAIRequest {
  provider: AIProvider          // "claude" | "openai" | "deepseek" | "ollama"
  model: string                 // e.g., "claude-sonnet-4"
  messages: AIMessage[]         // Conversation history
  maxTokens: number | null      // Max tokens to generate
  temperature: number | null    // 0.0 - 1.0
  stream: boolean | null        // Enable streaming
  system: string | null         // System prompt
  tools: AITool[] | null        // Available tools
  toolChoice: ToolChoice | null // Tool selection strategy
}
```

### UnifiedAIResponse

```typescript
interface UnifiedAIResponse {
  id: string                    // Response ID
  provider: AIProvider          // Provider that responded
  model: string                 // Model that was used
  content: string               // Generated text
  usage: TokenUsage | null      // Token usage info
  finishReason: string | null   // Why generation stopped
  toolCalls: AIToolCall[] | null // If AI wants to call tools
}
```

### StreamingCallbacks

```typescript
interface StreamingCallbacks {
  onChunk?: (chunk: string) => void          // New chunk received
  onComplete?: (fullContent: string) => void // Stream completed
  onError?: (error: string) => void          // Error occurred
}
```

### CacheStats

```typescript
interface CacheStats {
  totalEntries: number      // Total cache entries
  totalHits: number         // Cache hit count
  expiredEntries: number    // Expired entries count
  maxEntries: number        // Max cache size
  enabled: boolean          // Is cache enabled
}
```

### ProviderStatus

```typescript
interface ProviderStatus {
  provider: AIProvider      // Provider name
  available: boolean        // Is provider available
  models: string[]          // Available models
  error: string | null      // Error message if unavailable
}
```

## Streaming события

При использовании streaming запросов, сервис подписывается на следующие события:

- `ai-stream-started` - Запрос начат
- `ai-stream-chunk` - Получен новый чанк данных
- `ai-stream-completed` - Streaming завершен
- `ai-stream-error` - Произошла ошибка

Все события содержат `requestId` для идентификации запроса.

## Cleanup

При unmount компонента или завершении работы необходимо очистить listeners:

```typescript
import { useEffect } from "react"

function MyComponent() {
  useEffect(() => {
    return () => {
      unifiedAIService.cleanup()
    }
  }, [])

  // ...
}
```

## Backend команды

Сервис использует следующие Tauri команды:

### Non-streaming
- `ai_send_secure_request` - Отправить запрос используя stored API key
- `ai_send_unified_request` - Отправить запрос с явным API key
- `ai_send_request_with_tools` - Запрос с инструментами (явный API key)
- `ai_send_secure_request_with_tools` - Запрос с инструментами (stored API key)
- `ai_send_request_with_fallback` - Запрос с fallback на другие провайдеры

### Streaming
- `ai_send_secure_streaming_request` - Streaming запрос (stored API key)
- `ai_send_streaming_request` - Streaming запрос (явный API key)

### Cache управление
- `ai_get_cache_stats` - Получить статистику кэша
- `ai_clear_cache` - Очистить весь кэш
- `ai_cleanup_expired_cache` - Очистить просроченные записи

### Провайдеры
- `ai_get_supported_providers` - Список поддерживаемых провайдеров
- `ai_get_provider_models` - Модели для провайдера
- `ai_validate_provider` - Проверить доступность провайдера
- `ai_check_providers_health` - Проверить здоровье всех провайдеров

## Безопасность

Сервис поддерживает два способа работы с API ключами:

1. **Secure (рекомендуется)** - API ключи хранятся в Tauri secure storage и автоматически загружаются
2. **Explicit** - API ключи передаются явно (для временного использования)

Используйте `sendRequest()` и `sendStreamingRequest()` для secure режима.
Используйте `sendRequestWithApiKey()` для explicit режима.

## См. также

- `/src-tauri/src/video_compiler/commands/ai_api_proxy/unified_commands.rs` - Backend реализация
- `/src-tauri/src/video_compiler/commands/ai_api_proxy/types.rs` - Backend типы
- `/src/types/generated/tauri-bindings.ts` - Generated TypeScript bindings
