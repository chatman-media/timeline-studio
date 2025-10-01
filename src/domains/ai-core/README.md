# AI Core Domain

Базовая инфраструктура для AI функциональности в Timeline Studio.

## Обзор

AI Core домен предоставляет централизованную инфраструктуру для управления AI сервисами, включая DI контейнер, унифицированный сервис для работы с различными провайдерами, управление моделями и React интеграцию.

## Структура

```
ai-core/
├── container/          # DI контейнер для управления зависимостями
├── providers/          # AI провайдеры (Claude, OpenAI, Grok и др.)
├── react/             # React интеграция (хуки и провайдеры)
├── services/          # Основные сервисы (UnifiedAIService, ModelManager)
├── types/            # TypeScript типы и интерфейсы
└── index.ts          # Главный экспорт модуля
```

## Основные компоненты

### DI Container

Dependency Injection контейнер для управления жизненным циклом сервисов:

```typescript
import { getAIContainer, initializeAICore } from '@/domains/ai-core'

// Инициализация с конфигурацией
const container = await initializeAICore({
  providers: {
    claude: { apiKey: 'your-key' },
    openai: { apiKey: 'your-key' },
    grok: { apiKey: 'your-key' }
  }
})

// Получение сервиса
const aiService = await container.resolve('UnifiedAIService')
```

### AI Providers

Инфраструктура для подключения различных AI провайдеров через единый интерфейс. Подробности о конкретных провайдерах см. в [providers/README.md](./providers/README.md).

### Unified AI Service

Единый интерфейс для работы со всеми провайдерами:

```typescript
import { getAIContainer } from '@/domains/ai-core'

const container = getAIContainer()
const aiService = await container.resolve('UnifiedAIService')

// Отправка запроса
const response = await aiService.sendRequest('gpt-4o', [
  { role: 'user', content: 'Привет!' }
])

// Streaming запрос
await aiService.sendStreamingRequest('claude-3.5-sonnet', messages, {
  onContent: (content) => console.log(content),
  onComplete: (response) => console.log('Done:', response)
})
```

### Model Manager

Управление доступными моделями:

```typescript
const modelManager = await container.resolve('ModelManager')

// Получить все доступные модели
const models = await modelManager.getAvailableModels()

// Найти лучшую модель для задачи
const bestModel = await modelManager.getBestModelForTask('analysis', {
  requiresStreaming: true,
  maxTokens: 100000
})
```

### React Integration

Использование в React компонентах:

```typescript
import { AIServicesProvider, useAIService } from '@/domains/ai-core'

// В корневом компоненте
function App() {
  return (
    <AIServicesProvider>
      <YourApp />
    </AIServicesProvider>
  )
}

// В компоненте
function MyComponent() {
  const aiService = useAIService()
  
  const handleAnalyze = async () => {
    if (!aiService) return
    
    const result = await aiService.sendRequest('grok-2', [
      { role: 'user', content: 'Analyze this video' }
    ])
  }
}
```

## API Key Management

API ключи управляются через ApiKeyLoader:

```typescript
import { ApiKeyLoader } from '@/domains/ai-core'

const loader = ApiKeyLoader.getInstance()

// Проверка наличия ключа
const hasKey = await loader.hasApiKey('openai')

// Получение ключа
const key = await loader.getApiKey('claude')

// Проверка валидности
const isValid = await loader.validateApiKey('grok', 'xai-...')
```

## Архитектура

### Dependency Injection

AI Core использует паттерн Dependency Injection для управления зависимостями:

```typescript
// Все сервисы регистрируются в контейнере
container.registerSingleton('UnifiedAIService', UnifiedAIService)
container.registerSingleton('ModelManager', ModelManager)
container.registerFactory('ProviderFactory', ProviderFactory)
```

### Service Lifecycle

1. **Initialization**: Инициализация контейнера и базовых сервисов
2. **Registration**: Регистрация провайдеров и сервисов
3. **Resolution**: Разрешение зависимостей при запросе
4. **Cleanup**: Очистка ресурсов при завершении

## Конфигурация

```typescript
interface AIServiceConfig {
  providers?: Record<string, ProviderConfig>
  cache?: CacheConfig
  retry?: RetryConfig
  fallback?: FallbackConfig
}

interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  maxRetries?: number
  timeout?: number
}
```

## Расширение функциональности

### Добавление нового провайдера

1. Создайте класс провайдера в `providers/your-provider/`
2. Реализуйте интерфейс `IAIProvider`
3. Зарегистрируйте в `providers/register.ts`
4. Добавьте в фабрику провайдеров

### Добавление нового сервиса

1. Создайте сервис в `services/`
2. Зарегистрируйте в контейнере
3. Экспортируйте через `services/index.ts`

## Миграция

Если вы мигрируете с старой архитектуры из `src/shared/services/ai`, см. [MIGRATION.md](./MIGRATION.md).

## Примеры использования

### Базовый запрос

```typescript
const response = await aiService.sendRequest('claude-3.5-sonnet', [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Explain quantum computing' }
], {
  temperature: 0.7,
  maxTokens: 2000
})
```

### С fallback моделями

```typescript
const response = await aiService.sendRequest('gpt-4o', messages, {
  fallbackModels: ['claude-3.5-sonnet', 'grok-2'],
  retryAttempts: 3
})
```

### Кэширование ответов

```typescript
const response = await aiService.sendRequest('grok-2-mini', messages, {
  enableCache: true,
  cacheTTL: 600000 // 10 минут
})
```

## Лицензия

Часть Timeline Studio. См. корневую лицензию проекта.