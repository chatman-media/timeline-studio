# AI Chat Types

**Русский** | [English](./README.md)

TypeScript определения типов для функции AI Chat.

## Файлы типов

### `ai-context.ts`
Типы контекста для передачи информации о состоянии между компонентами Timeline Studio и AI сервисами.

**Экспорты:**
- `AIContext` - Полный контекст включая timeline, ресурсы, состояние браузера
- `TimelineContext` - Информация о состоянии timeline
- `ResourceContext` - Состояние пула ресурсов
- `BrowserContext` - Состояние файлового браузера
- `PlayerContext` - Состояние видео плеера

### `common.ts`
Общие типы результатов и стандартизированные интерфейсы для AI операций.

**Экспорты:**
- `BaseResult<T>` - Базовый результат операции с успехом/ошибкой
- `ResultWithMetrics<T>` - Результат с метриками выполнения
- `AIToolResult<T>` - Результат выполнения AI инструмента
- `AnalysisResult<T>` - Результат анализа контента
- `MediaProcessingResult` - Результат обработки медиа
- `ContentGenerationResult<T>` - Результат генерации контента
- `SearchResult<T>` - Результат поисковой операции
- `ValidationResult` - Результат валидации данных
- `ExportResult` - Результат экспорта
- `ImportResult<T>` - Результат импорта
- `PaginatedResult<T>` - Результат с пагинацией
- `AsyncResult<T>` - Асинхронная операция с состоянием загрузки
- `CachedResult<T>` - Кэшированный результат с TTL
- `BatchResult<TInput, TOutput>` - Результат пакетной операции
- `RetriableResult<T>` - Результат с информацией о повторах
- Утилитарные функции: `isSuccess()`, `isFailure()`, `createSuccess()`, `createFailure()`

### `streaming.ts`
Типы для потоковых ответов в реальном времени.

**Экспорты:**
- `StreamingOptions` - Конфигурация для потоковой передачи
- `StreamingResponse` - Структура потокового ответа
- `StreamEvent` - Типы server-sent событий
- `StreamError` - Обработка ошибок потоковой передачи

**Примечание:** Типы чата (`ChatSession`, `ChatMessage` и т.д.) мигрированы в `/src/domains/ai-services/types/chat.ts`

## Использование

### AI Контекст
```typescript
import type { AIContext } from '@/features/ai-chat/types'

// Создание контекста для AI
const context: AIContext = {
  timeline: currentTimelineState,
  resources: resourcePoolState,
  browser: browserState,
  player: playerState
}
```

### Общие Типы Результатов
```typescript
import {
  type BaseResult,
  type ResultWithMetrics,
  isSuccess,
  createSuccess,
  createFailure
} from '@/features/ai-chat/types'

// Создать успешный результат
const result: BaseResult<string> = createSuccess(
  "Операция завершена",
  "Сообщение об успехе",
  ["Предупреждение: Некоторые данные пропущены"]
)

// Проверить статус результата
if (isSuccess(result)) {
  console.log(result.data)
}

// Создать результат с метриками
const resultWithMetrics: ResultWithMetrics<VideoAnalysis> = {
  success: true,
  data: analysis,
  executionTime: 1234,
  metadata: {
    model: "claude-4-sonnet",
    provider: "claude",
    tokenCount: 1500,
    cacheHit: false
  }
}
```

### Типы Потоковой Передачи
```typescript
import type { StreamingOptions, StreamEvent } from '@/features/ai-chat/types'

const streamingOptions: StreamingOptions = {
  enabled: true,
  onChunk: (chunk) => console.log(chunk),
  onComplete: () => console.log('Готово'),
  onError: (error) => console.error(error)
}
```

## Связанные Типы

Для типов чата используйте типы из доменов:

```typescript
// Типы чата из доменов
import type {
  ChatSession,
  ChatMessage,
  ChatListItem
} from '@/domains/ai-services/types/chat'

const session: ChatSession = {
  id: 'session-123',
  messages: [],
  createdAt: new Date(),
  updatedAt: new Date()
}
```