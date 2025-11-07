# AI Chat Components

**Русский** | [English](./README.md)

React компоненты для пользовательского интерфейса AI Chat.

## Доступные компоненты

### `AIChat`
Основной компонент интерфейса чата.
- Полный UI чата со списком сообщений и вводом
- Выбор модели и провайдера
- Управление сессиями
- Отображение потоковых ответов
- Обработка ошибок и повтор

### `ChatList`
Компонент списка сессий чата.
- Отображение всех сессий чата
- Выбор сессии
- Удаление и переименование сессий
- Функциональность поиска
- Отображение метаданных сессии

### `ContentIntelligencePanel`
Панель продвинутого анализа контента.
- Результаты детекции сцен
- Отображение классификации контента
- Результаты идентификации персон
- Визуализация метрик качества
- Экспорт данных анализа

## Примеры использования

```typescript
import { AIChat, ChatList } from '@/features/ai-chat/components'

function ChatInterface() {
  return (
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
  )
}
```

### Интеграция Content Intelligence

```typescript
import { ContentIntelligencePanel } from '@/features/ai-chat/components'
import { createLogger } from '@/lib/tauri-logger'

const logger = createLogger('Example')

function VideoAnalysis() {
  return (
    <ContentIntelligencePanel
      videoId={currentVideoId}
      onAnalysisComplete={(results) => {
        logger.debugSync('Результаты анализа:', results)
      }}
    />
  )
}
```

## Свойства компонентов

### Свойства AIChat
```typescript
interface AIChatProps {
  className?: string
  defaultModel?: ChatModel
  defaultProvider?: ChatProvider
  onMessageSent?: (message: string) => void
}
```

### Свойства ChatList
```typescript
interface ChatListProps {
  className?: string
  onSessionSelect?: (sessionId: string) => void
  onSessionDelete?: (sessionId: string) => void
}
```

### Свойства ContentIntelligencePanel
```typescript
interface ContentIntelligencePanelProps {
  videoId: string
  className?: string
  onAnalysisComplete?: (results: AnalysisResults) => void
  autoStart?: boolean
}
```

## Стилизация

Все компоненты используют Tailwind CSS и следуют дизайн-системе:
- Поддержка светлой/темной тем
- Адаптивный дизайн
- Доступная разметка
- Настройка через свойство className