# AI Providers

Провайдеры для подключения различных AI моделей в Timeline Studio.

## Обзор

Этот модуль содержит реализации провайдеров для различных AI сервисов. Каждый провайдер реализует единый интерфейс `IAIProvider`, что позволяет легко переключаться между разными AI моделями.

## Поддерживаемые провайдеры

### Claude (Anthropic)

Провайдер для работы с моделями Claude от Anthropic.

**Модели:**
- `claude-3.5-sonnet` - Быстрая и умная модель для большинства задач
- `claude-4-opus` - Самая мощная модель для сложных задач
- `claude-4-sonnet` - Оптимальный баланс скорости и качества

**Особенности:**
- Поддержка streaming ответов
- Большой контекст (до 200k токенов)
- Computer Use API для взаимодействия с интерфейсом
- Vision capabilities для анализа изображений

```typescript
import { ClaudeProvider } from '@/domains/ai-core/providers/claude'

const provider = new ClaudeProvider({
  apiKey: process.env.CLAUDE_API_KEY
})

const response = await provider.sendMessage('claude-3.5-sonnet', [
  { role: 'user', content: 'Explain quantum computing' }
])
```

### OpenAI

Провайдер для GPT моделей от OpenAI.

**Модели:**
- `gpt-4o` - Омнимодальная модель с поддержкой изображений
- `gpt-4-turbo` - Быстрая версия GPT-4
- `gpt-3.5-turbo` - Быстрая и экономичная модель

**Особенности:**
- Function calling для выполнения действий
- JSON mode для структурированных ответов
- Vision API для анализа изображений
- Embeddings для семантического поиска

```typescript
import { OpenAIProvider } from '@/domains/ai-core/providers/openai'

const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY
})

// С функциями
const response = await provider.sendMessage('gpt-4o', messages, {
  tools: [{
    type: 'function',
    function: {
      name: 'analyze_video',
      description: 'Analyze video content',
      parameters: { /* ... */ }
    }
  }]
})
```

### DeepSeek

Китайский провайдер с мощными моделями для кода и чата.

**Модели:**
- `deepseek-chat` - Общая модель для диалогов
- `deepseek-coder` - Специализированная модель для кода
- `deepseek-v3` - Новейшая модель с улучшенными возможностями

**Особенности:**
- Отличное понимание кода
- Поддержка множества языков программирования
- Конкурентная цена
- Большой контекст

```typescript
import { DeepSeekProvider } from '@/domains/ai-core/providers/deepseek'

const provider = new DeepSeekProvider({
  apiKey: process.env.DEEPSEEK_API_KEY
})
```

### Ollama

Провайдер для локальных моделей через Ollama.

**Модели:**
- `llama3` - Meta's Llama 3
- `mistral` - Mistral AI модели
- `qwen` - Alibaba Qwen модели
- `codellama` - Специализированная модель для кода
- И многие другие локальные модели

**Особенности:**
- Полностью локальное выполнение
- Нет ограничений по API
- Поддержка кастомных моделей
- Низкая задержка

```typescript
import { OllamaProvider } from '@/domains/ai-core/providers/ollama'

const provider = new OllamaProvider({
  baseUrl: 'http://localhost:11434' // Ollama API endpoint
})

// Список доступных моделей
const models = await provider.getAvailableModels()
```

### Grok (xAI)

Провайдер для моделей Grok от xAI.

**Модели:**
- `grok-2` - Полная модель с расширенными возможностями
- `grok-2-mini` - Облегченная версия для быстрых ответов

**Особенности:**
- Доступ к реальному времени через X (Twitter)
- Юмор и неформальный стиль
- Актуальная информация
- Поддержка изображений

```typescript
import { GrokProvider } from '@/domains/ai-core/providers/grok'

const provider = new GrokProvider({
  apiKey: process.env.GROK_API_KEY
})
```

## Единый интерфейс провайдера

Все провайдеры реализуют интерфейс `IAIProvider`:

```typescript
interface IAIProvider {
  // Отправка сообщения
  sendMessage(
    model: string,
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse>
  
  // Streaming ответ
  sendStreamingMessage(
    model: string,
    messages: ChatMessage[],
    options?: ChatStreamOptions
  ): AsyncGenerator<ChatStreamChunk>
  
  // Проверка доступности
  isAvailable(): Promise<boolean>
  
  // Список моделей
  getAvailableModels(): Promise<string[]>
  
  // Лимиты токенов
  getMaxTokens(model: string): number
  
  // Метаданные провайдера
  getProviderInfo(): ProviderInfo
}
```

## Конфигурация

### Базовая конфигурация

```typescript
interface ProviderConfig {
  apiKey?: string       // API ключ для аутентификации
  baseUrl?: string      // Базовый URL для API (для self-hosted)
  maxRetries?: number   // Количество повторных попыток
  timeout?: number      // Таймаут запросов в мс
  headers?: Record<string, string> // Дополнительные заголовки
}
```

### Расширенная конфигурация

```typescript
// Для Claude
interface ClaudeConfig extends ProviderConfig {
  anthropicVersion?: string // Версия API
  enableCaching?: boolean   // Кэширование контекста
}

// Для OpenAI
interface OpenAIConfig extends ProviderConfig {
  organization?: string     // ID организации
  azureEndpoint?: string   // Для Azure OpenAI
}

// Для Ollama
interface OllamaConfig extends ProviderConfig {
  keepAlive?: string       // Время жизни модели в памяти
  numGPU?: number         // Количество слоев на GPU
}
```

## Обработка ошибок

Все провайдеры используют единую систему ошибок:

```typescript
class AIProviderError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public provider: string,
    public details?: any
  ) {
    super(message)
  }
}

enum ErrorCode {
  AUTHENTICATION_ERROR = 'auth_error',
  RATE_LIMIT_ERROR = 'rate_limit',
  INVALID_REQUEST = 'invalid_request',
  MODEL_NOT_FOUND = 'model_not_found',
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout',
  UNKNOWN_ERROR = 'unknown'
}
```

## Добавление нового провайдера

1. Создайте папку в `providers/your-provider/`
2. Реализуйте интерфейс `IAIProvider`
3. Добавьте конфигурацию и типы
4. Зарегистрируйте в фабрике провайдеров

Пример структуры:
```
providers/
└── your-provider/
    ├── your-provider.ts     # Основная реализация
    ├── types.ts            # Типы и интерфейсы
    ├── config.ts           # Конфигурация
    └── index.ts            # Экспорты
```

## Best Practices

1. **Retry Logic**: Реализуйте повторные попытки с exponential backoff
2. **Rate Limiting**: Соблюдайте лимиты API провайдера
3. **Error Handling**: Преобразуйте ошибки провайдера в единый формат
4. **Logging**: Логируйте запросы для отладки
5. **Timeout**: Устанавливайте разумные таймауты
6. **Caching**: Кэшируйте результаты где возможно

## Примеры использования

### Выбор оптимального провайдера

```typescript
const modelManager = container.resolve('ModelManager')

// Найти лучшую модель для анализа кода
const codeModel = await modelManager.getBestModelForTask('code-analysis', {
  preferLocal: false,
  maxCost: 0.01,
  requiredFeatures: ['code-understanding']
})

// Использовать модель
const provider = providerFactory.getProvider(codeModel.provider)
const result = await provider.sendMessage(codeModel.model, messages)
```

### Fallback стратегия

```typescript
async function sendWithFallback(messages: ChatMessage[]) {
  const providers = ['claude', 'openai', 'deepseek']
  
  for (const providerName of providers) {
    try {
      const provider = providerFactory.getProvider(providerName)
      return await provider.sendMessage('default', messages)
    } catch (error) {
      console.warn(`Provider ${providerName} failed:`, error)
      continue
    }
  }
  
  throw new Error('All providers failed')
}
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.