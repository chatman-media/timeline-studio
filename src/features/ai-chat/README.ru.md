# AI Chat

**Русский** | [English](./README.md)

## Обзор

AI-чат интерфейс для Timeline Studio с доменной архитектурой. Предоставляет React компоненты и хуки для интеграции AI чата с поддержкой MCP (Model Context Protocol). Модуль служит легким frontend слоем, который интегрируется с доменными сервисами из `/src/domains/ai-tools/` и `/src/domains/ai-services/`.

## Статус

**100% Готов** - Весь основной функционал полностью реализован и протестирован.

- ✅ **Компоненты**: UI компоненты для чата, списка сообщений, подсказок и статистики кэша
- ✅ **Хуки**: React хуки для AI интеграции с Timeline, Browser, Player и Resources
- ✅ **Сервисы**: Провайдер чата, сервис хранения, MCP интеграция
- ✅ **Тесты**: 86+ тестов (chat-list: 11, chat-storage: 45+, convert-tools: 30+)

## Структура

```
ai-chat/
├── components/          # React UI компоненты
│   ├── ai-chat.tsx
│   ├── chat-list.tsx
│   ├── ai-processing-indicator.tsx
│   ├── ai-action-preview.tsx
│   ├── cache-stats-panel.tsx
│   └── suggestions/
├── hooks/              # React хуки для AI интеграции
│   ├── use-chat.tsx
│   ├── use-chat-state.ts
│   ├── use-chat-actions.tsx
│   ├── use-timeline-ai.tsx
│   └── use-timeline-ai-integration.ts
├── services/          # Основные сервисы
│   ├── chat-provider.tsx
│   ├── chat-storage-service.ts
│   ├── mcp-provider.tsx
│   └── index.ts
├── types/            # TypeScript определения
│   ├── ai-context.ts
│   ├── common.ts
│   └── streaming.ts
├── utils/           # Утилиты
│   ├── context-manager.ts
│   ├── timeline-context.ts
│   └── convert-tools.ts
├── machines/       # Обработчики backend событий
│   └── backend-event-handlers.ts
└── __tests__/     # Тестовые файлы
```

## Возможности

### ✅ Реализовано

- [x] Поддержка MCP (Model Context Protocol) с нативной интеграцией
- [x] Управление состоянием чата через XState машину
- [x] Персистентная история чата с управлением сессиями
- [x] Real-time потоковые ответы
- [x] Контекстно-зависимый AI с автоматическим сбором контекста
- [x] Timeline AI операции (создание, анализ, оптимизация)
- [x] Browser интеграция (поиск файлов, анализ контента)
- [x] Player интеграция (управление воспроизведением, превью)
- [x] Resources интеграция (эффекты, фильтры, совместимость)
- [x] AI Tools интеграция (48+ специализированных инструментов из доменов)
- [x] Function calling и выполнение инструментов

### 🔮 Будущие улучшения

Основной функционал AI чата полностью реализован. Эти расширенные возможности могут быть добавлены в будущих релизах:

- [ ] Голосовой ввод/вывод для работы без использования рук
- [ ] Мультимодальный ввод (анализ изображений в чате)
- [ ] Экспорт чата в различные форматы (PDF, Markdown и т.д.)

## Использование

### Базовый компонент чата

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

### Timeline AI интеграция

```typescript
import { useTimelineAI } from "@/features/ai-chat/hooks"

function TimelineComponent() {
  const { createTimelineFromPrompt, analyzeTimeline } = useTimelineAI()

  const handleCreate = async () => {
    await createTimelineFromPrompt("Создай видео о путешествии")
  }

  const handleAnalyze = async () => {
    const analysis = await analyzeTimeline()
    console.log(analysis)
  }
}
```

### Управление контекстом

```typescript
import { collectFullContext, compressContext } from "@/features/ai-chat/utils"

// Собрать полный контекст для AI
const context = await collectFullContext()

// Сжать при необходимости
if (isContextTooLarge(context)) {
  const compressed = compressContext(context, maxTokens)
}
```

## Интеграция

- **Зависит от**:
  - `@/domains/ai-tools` - 48+ специализированных инструментов по доменам
  - `@/domains/ai-services` - Основные AI провайдеры и оркестрация
  - `@/shared/services/ai` - Общие AI утилиты и DI контейнер
- **Используется в**: `@/features/media-studio`, `@/features/ai-director`

## Тестирование

- **Всего тестов**: 86+ тестов
- **Покрытие**: Компоненты, хуки, сервисы и утилиты

### Запуск тестов

```bash
# Все ai-chat тесты
bun run test src/features/ai-chat/

# Конкретные категории тестов
bun run test src/features/ai-chat/hooks/
bun run test src/features/ai-chat/services/
bun run test src/features/ai-chat/components/
```

### Тестовые наборы

- `chat-list.test.tsx` - Компонент списка чатов (11 тестов)
- `chat-storage-service.test.ts` - Сервис хранения чатов (45+ тестов)
- `convert-tools.test.ts` - Утилиты конвертации инструментов (30+ тестов)
- `use-chat-actions.test.tsx` - Хук действий чата
- `use-chat-state.test.tsx` - Хук состояния чата
- `use-timeline-ai-integration.test.tsx` - Timeline AI интеграция

## TODO / Дорожная карта

### Высокий приоритет
- [ ] E2E тесты для полного workflow чата
- [ ] Улучшить обработку ошибок и логику повторных попыток
- [ ] Добавить импорт/экспорт чат сессий

### Средний приоритет
- [ ] Поддержка голосового ввода/вывода
- [ ] Анализ изображений в чат интерфейсе
- [ ] Улучшенные алгоритмы сжатия контекста
- [ ] Оптимизация производительности для больших контекстов

### Низкий приоритет
- [ ] Аналитика и статистика использования чата
- [ ] Пользовательские темы чата
- [ ] Горячие клавиши для опытных пользователей

## Документация

- [Components](./components/README.md) - Справка по UI компонентам
- [Hooks](./hooks/README.md) - Справка по React хукам
- [Services](./services/README.md) - Справка по сервисному слою
- [Types](./types/README.md) - TypeScript определения типов
- [Utils](./utils/README.md) - Справка по утилитам

Документация доменов:
- [AI Tools Documentation](../../domains/ai-tools/README.md)
- [AI Services Documentation](../../domains/ai-services/README.md)
- [Shared Services Documentation](../../shared/services/ai/README.md)
