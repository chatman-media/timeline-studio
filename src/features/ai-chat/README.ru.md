# AI Chat

**Русский** | [English](./README.md)

AI-чат интерфейс для Timeline Studio с доменной архитектурой. Предоставляет React компоненты и хуки для интеграции AI чата с поддержкой MCP (Model Context Protocol).

## 🏗️ Обзор Архитектуры

Модуль AI Chat — это **легковесный фронтенд-слой**, который интегрируется с доменными сервисами:

### Интеграция с Доменами
- **AI Tools** → `/src/domains/ai-tools/` - 48+ специализированных инструментов, организованных по доменам
- **AI Services** → `/src/domains/ai-services/` - Основные AI провайдеры и оркестрация
- **Shared Services** → `/src/shared/services/ai/` - Общие AI утилиты и DI контейнер

### Ответственность модуля AI Chat
- React компоненты для чат UI (интерфейс чата, список сообщений, подсказки)
- React хуки для AI интеграции (timeline, browser, player, resources)
- Управление контекстом и синхронизация состояния
- Интеграция с MCP провайдером
- Хранение чата и управление сессиями

## 📁 Структура Модуля

### `/components/`
React UI компоненты для чат интерфейса:
- `ai-chat.tsx` - Главный компонент чата
- `chat-list.tsx` - Список чат-сессий
- `ai-processing-indicator.tsx` - Индикаторы загрузки и обработки
- `ai-action-preview.tsx` - Предпросмотр AI действий перед выполнением
- `cache-stats-panel.tsx` - Статистика кэша AI ответов
- `suggestions/` - Панель контекстных AI подсказок

### `/hooks/`
React хуки для AI интеграции:
- `use-chat.tsx` - Основной хук чата с интеграцией state machine
- `use-chat-state.ts` - Доступ к состоянию чата
- `use-chat-actions.tsx` - Действия чата (отправка, очистка, отмена)
- `use-timeline-ai.tsx` - AI операции для timeline
- `use-timeline-ai-integration.ts` - Утилиты интеграции timeline
- `use-browser-ai-integration.ts` - AI интеграция браузера
- `use-player-ai-integration.ts` - AI интеграция плеера
- `use-resources-ai-integration.ts` - AI интеграция ресурсов

### `/services/`
Основные сервисы для функциональности чата:
- `chat-provider.tsx` - React Context Provider для состояния чата
- `chat-storage-service.ts` - Сохранение истории чата
- `mcp-provider.tsx` - Интеграция Model Context Protocol
- `index.ts` - Реэкспорт chat machine из domains

### `/types/`
TypeScript определения типов:
- `ai-context.ts` - Типы контекста для AI операций
- `common.ts` - Общие типы результатов и интерфейсов
- `streaming.ts` - Типы потоковых ответов

### `/utils/`
Утилитарные функции:
- `context-manager.ts` - Сбор и управление AI контекстом
- `timeline-context.ts` - Утилиты контекста для timeline
- `convert-tools.ts` - Конвертация формата инструментов для MCP

### `/machines/`
Обработчики событий бэкенда:
- `backend-event-handlers.ts` - Обработка Tauri событий для AI операций

## 🔗 Интеграция с Доменными Сервисами

Модуль AI Chat опирается на доменные сервисы для AI функциональности:

### AI Tools (`/src/domains/ai-tools/tools/`)
48+ специализированных инструментов, организованных по доменам:

#### Core Domain
- **Timeline Tools** (17) - проект, секции, клипы, сцены, анализ истории
- **Resources Tools** (7) - эффекты, фильтры, переходы, совместимость
- **Browser Tools** (5) - навигация по файлам, поиск, анализ контента
- **Player Tools** (3) - управление воспроизведением, превью, анализ медиа

#### Analysis Domain
- **Video Analysis** - детекция сцен, качество, анализ движения
- **Audio Analysis** - распознавание речи, шум, спектральный анализ
- **Content Intelligence** - понимание и классификация контента
- **Multimodal Analysis** - комбинированный анализ видео/аудио
- **Whisper Integration** - транскрипция и преобразование речи в текст
- **Person Identification** - детекция и отслеживание лиц
- **Color & Style Analysis** - цветокоррекция и стилизация

#### Automation Domain
- **Enhanced Subtitle Automation** - OCR, Whisper, синхронизация
- **Batch Processing** - параллельная обработка медиа
- **Workflow Automation** - интеллектуальная автоматизация задач
- **Smart Templates** - адаптивная генерация макетов
- **Performance Tools** - оптимизация и рендеринг

#### Integration Domain
- **Export Management** - многоформатный экспорт
- **Platform Integration** - оптимизация для соцсетей
- **Format Conversion** - конвертация медиа форматов

### AI Services (`/src/domains/ai-services/services/`)
Основные AI провайдеры и оркестрация:
- `unified-ai-service.ts` - Главный AI сервис оркестратор
- `unified-orchestrator.ts` - Продвинутая AI оркестрация workflow
- `whisper-service.ts` - Сервис транскрипции аудио
- `media-analysis/ffmpeg-analysis-service.ts` - Анализ видео/аудио

### Shared Services (`/src/shared/services/ai/`)
Общая AI инфраструктура:
- `di-container.ts` - Контейнер dependency injection
- `backend-ai-service.ts` - Интеграция backend AI сервиса
- `react-integration.tsx` - React хуки для AI сервисов
- `providers/interfaces.ts` - Интерфейсы AI провайдеров

## 🚀 Основные Возможности

### Поддержка MCP (Model Context Protocol)
- Встроенная интеграция MCP через `mcp-provider.tsx`
- Конвертация доменных инструментов в формат MCP
- Поддержка MCP серверов и обнаружения инструментов
- Контекстные подсказки инструментов

### Управление Состоянием Чата
- XState-based машина чата (мигрирована в `/src/domains/ai-services/machines/chat-machine.ts`)
- Постоянная история чата через `chat-storage-service.ts`
- Управление и переключение сессий
- Потоковые ответы в реальном времени

### Контекстно-ориентированный AI
- Автоматический сбор контекста из Timeline, Browser, Player, Resources
- Умное сжатие контекста для лимитов токенов
- Валидация и оптимизация контекста
- Динамические обновления контекста

### Хуки Интеграции AI
- Timeline AI операции (создание, анализ, оптимизация)
- Интеграция браузера (поиск файлов, анализ контента)
- Интеграция плеера (управление воспроизведением, превью)
- Интеграция ресурсов (эффекты, фильтры, совместимость)

## 📚 Примеры Использования

### Использование Чат Компонентов
```typescript
import { AIChat } from "@/features/ai-chat/components"
import { ChatProvider } from "@/features/ai-chat/services"

function App() {
  return (
    <ChatProvider>
      <AIChat />
    </ChatProvider>
  )
}
```

### Использование Чат Хуков
```typescript
import { useChat } from "@/features/ai-chat/hooks"

function ChatComponent() {
  const { sendMessage, messages, isLoading } = useChat()

  const handleSend = async (text: string) => {
    await sendMessage(text)
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

### Timeline AI Интеграция
```typescript
import { useTimelineAI } from "@/features/ai-chat/hooks"

function TimelineComponent() {
  const { createTimelineFromPrompt, analyzeTimeline } = useTimelineAI()

  const handleCreate = async () => {
    await createTimelineFromPrompt("Создай тревел-видео")
  }

  const handleAnalyze = async () => {
    const analysis = await analyzeTimeline()
    console.log(analysis)
  }
}
```

### Управление Контекстом
```typescript
import { collectFullContext, compressContext } from "@/features/ai-chat/utils"

// Собрать полный контекст для AI
const context = await collectFullContext()

// Сжать при необходимости
if (isContextTooLarge(context)) {
  const compressed = compressContext(context, maxTokens)
}
```

### MCP Интеграция
```typescript
import { MCPProvider } from "@/features/ai-chat/services"

function App() {
  return (
    <MCPProvider>
      <ChatProvider>
        <AIChat />
      </ChatProvider>
    </MCPProvider>
  )
}
```

## 🧪 Тестирование

### Структура Тестов
- **Тесты Компонентов** - `components/__tests__/` - тестирование UI компонентов
- **Тесты Хуков** - `hooks/__tests__/` - тестирование React хуков
- **Тесты Сервисов** - `services/__tests__/` - тестирование слоя сервисов
- **Тесты Утилит** - `utils/__tests__/` - тестирование утилитарных функций
- **Интеграционные Тесты** - `__tests__/` - полное тестирование интеграции

### Запуск Тестов
```bash
# Все тесты ai-chat
bun run test src/features/ai-chat/

# Определенные категории тестов
bun run test src/features/ai-chat/hooks/
bun run test src/features/ai-chat/services/
bun run test src/features/ai-chat/components/
```

### Доступные Тесты
- `chat-list.test.tsx` - Компонент списка чата
- `use-chat-actions.test.tsx` - Хук действий чата
- `use-chat-state.test.tsx` - Хук состояния чата
- `use-timeline-ai-integration.test.tsx` - Timeline AI интеграция
- `chat-storage-service.test.ts` - Сервис хранения чата
- `convert-tools.test.ts` - Утилиты конвертации инструментов
- `function-calling.test.ts` - AI вызов функций

## 🤝 Участие в Разработке

При добавлении новых функций в AI Chat:

### Добавление Новых Компонентов
1. Создайте компонент в директории `components/`
2. Экспортируйте из `components/index.ts`
3. Добавьте тесты в `components/__tests__/`
4. Обновите документацию компонентов README

### Добавление Новых Хуков
1. Создайте хук в директории `hooks/`
2. Экспортируйте из `hooks/index.ts`
3. Добавьте тесты в `hooks/__tests__/`
4. Обновите документацию хуков README

### Добавление Сбора Контекста
1. Обновите `utils/context-manager.ts` для новых типов контекста
2. Добавьте определения типов в `types/ai-context.ts`
3. Обновите документацию со структурой контекста

### Интеграция с Доменными Сервисами
- AI Tools → добавьте в `/src/domains/ai-tools/tools/`
- AI Services → добавьте в `/src/domains/ai-services/services/`
- Общие утилиты → добавьте в `/src/shared/services/ai/`

## 📖 Документация

Документация модуля:
- [Компоненты](./components/README.ru.md) - Справочник UI компонентов
- [Хуки](./hooks/README.ru.md) - Справочник React хуков
- [Сервисы](./services/README.ru.md) - Справочник слоя сервисов
- [Типы](./types/README.ru.md) - TypeScript определения типов
- [Утилиты](./utils/README.ru.md) - Справочник утилитарных функций

Документация доменов:
- [Документация AI Tools](../../domains/ai-tools/README.md)
- [Документация AI Services](../../domains/ai-services/README.md)
- [Документация Shared Services](../../shared/services/ai/README.md)