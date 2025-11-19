# AI Chat Components

**Русский** | [English](./README.md)

React компоненты для пользовательского интерфейса AI Chat.

## Доступные компоненты

### `AIChat`
Основной компонент интерфейса чата - полнофункциональный UI чата.

**Возможности:**
- Полный UI чата со списком сообщений и вводом
- Выбор модели и провайдера
- Управление и переключение сессий
- Отображение потоковых ответов с анимацией печати
- Механизмы обработки ошибок и повтора
- Интеграция с state machine чата

**Свойства:**
```typescript
interface AIChatProps {
  className?: string
  defaultModel?: string
  defaultProvider?: string
  onMessageSent?: (message: string) => void
}
```

### `ChatList`
Компонент списка сессий чата для управления несколькими разговорами.

**Возможности:**
- Отображение всех сессий чата с метаданными
- Выбор и переключение сессий
- Удаление и переименование сессий
- Функциональность поиска сессий
- Метаданные сессий (дата, количество сообщений, используемая модель)

**Свойства:**
```typescript
interface ChatListProps {
  className?: string
  onSessionSelect?: (sessionId: string) => void
  onSessionDelete?: (sessionId: string) => void
}
```

### `AIProcessingIndicator`
Индикатор загрузки для AI операций.

**Возможности:**
- Визуальная обратная связь во время обработки AI
- Анимированные состояния загрузки
- Индикация прогресса
- Поддержка отмены операций

**Свойства:**
```typescript
interface AIProcessingIndicatorProps {
  isProcessing: boolean
  message?: string
  onCancel?: () => void
}
```

### `AIActionPreview`
Компонент предпросмотра AI-сгенерированных действий перед выполнением.

**Возможности:**
- Предпросмотр предлагаемых AI действий
- Подтверждение/отклонение выполнения действия
- Отображение деталей действия
- Подтверждения безопасности для деструктивных действий

**Свойства:**
```typescript
interface AIActionPreviewProps {
  action: AIAction
  onConfirm: () => void
  onReject: () => void
}
```

### `CacheStatsPanel`
Отображение статистики кэша AI ответов и метрик производительности.

**Возможности:**
- Отображение соотношения попаданий/промахов кэша
- Метрики времени ответа
- Статистика использования памяти
- Управление кэшем

**Свойства:**
```typescript
interface CacheStatsPanelProps {
  className?: string
  showDetails?: boolean
}
```

### Директория `suggestions/`
Компоненты контекстных AI подсказок.

#### `AISuggestionsPanel`
Умные подсказки на основе текущего контекста.

**Возможности:**
- Контекстные подсказки промптов
- Кнопки быстрых действий
- Предложения шаблонов
- История недавних команд

**Свойства:**
```typescript
interface AISuggestionsPanelProps {
  context: AIContext
  onSuggestionSelect: (suggestion: string) => void
}
```

## Примеры использования

### Базовый интерфейс чата

```typescript
import { AIChat, ChatList } from '@/features/ai-chat/components'
import { ChatProvider } from '@/features/ai-chat/services'

function ChatInterface() {
  return (
    <ChatProvider>
      <div className="flex h-full">
        {/* Боковая панель сессий */}
        <div className="w-64 border-r">
          <ChatList />
        </div>

        {/* Основной чат */}
        <div className="flex-1">
          <AIChat />
        </div>
      </div>
    </ChatProvider>
  )
}
```

### С индикатором обработки

```typescript
import { AIChat, AIProcessingIndicator } from '@/features/ai-chat/components'
import { useChat } from '@/features/ai-chat/hooks'

function ChatWithIndicator() {
  const { isProcessing } = useChat()

  return (
    <div className="chat-container">
      <AIChat />
      {isProcessing && (
        <AIProcessingIndicator
          isProcessing={isProcessing}
          message="AI думает..."
        />
      )}
    </div>
  )
}
```

### С предпросмотром действий

```typescript
import { AIActionPreview } from '@/features/ai-chat/components'

function ActionConfirmation() {
  const [pendingAction, setPendingAction] = useState<AIAction | null>(null)

  const handleConfirm = () => {
    // Выполнить действие
    executePendingAction(pendingAction)
    setPendingAction(null)
  }

  return pendingAction ? (
    <AIActionPreview
      action={pendingAction}
      onConfirm={handleConfirm}
      onReject={() => setPendingAction(null)}
    />
  ) : null
}
```

### Статистика кэша

```typescript
import { CacheStatsPanel } from '@/features/ai-chat/components'

function PerformanceMonitor() {
  return (
    <div className="performance-panel">
      <h2>Производительность AI</h2>
      <CacheStatsPanel showDetails={true} />
    </div>
  )
}
```

## Тестирование

```bash
# Запустить тесты компонентов
bun run test src/features/ai-chat/components/

# Конкретные тесты компонентов
bun run test src/features/ai-chat/components/__tests__/chat-list.test.tsx
```

## Лучшие практики

- Всегда оборачивайте компоненты чата в `ChatProvider`
- Корректно обрабатывайте состояния загрузки и ошибок
- Используйте правильные TypeScript типы для свойств
- Реализуйте функции доступности (ARIA метки, навигация с клавиатуры)
- Следуйте существующим паттернам Tailwind CSS
- Тестируйте компоненты с React Testing Library

## Стилизация

Все компоненты используют Tailwind CSS и следуют дизайн-системе:
- Поддержка светлой/темной тем
- Адаптивный дизайн
- Доступная разметка
- Настройка через свойство className