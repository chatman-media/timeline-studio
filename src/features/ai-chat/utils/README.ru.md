# AI Chat Utils

**Русский** | [English](./README.md)

Вспомогательные функции для функции AI Chat.

## Доступные Утилиты

### `context-manager.ts`
Управляет сбором и обновлением AI контекста.
- `collectFullContext()` - Собирает полное состояние из всех компонентов Timeline Studio
- `updateContext()` - Обновляет определенные части контекста
- `compressContext()` - Сжимает большие контексты для соответствия лимитам токенов
- `validateContext()` - Валидирует структуру и полноту контекста

### `timeline-context.ts`
Утилиты для работы с контекстом timeline.
- `collectTimelineState()` - Собирает текущее состояние timeline для AI
- `extractTimelineMetadata()` - Извлекает релевантные метаданные timeline
- `summarizeTimelineContent()` - Создает краткое резюме timeline
- `formatTimelineForAI()` - Форматирует данные timeline для потребления AI

### `convert-tools.ts`
Конвертация формата инструментов MCP (Model Context Protocol).
- Преобразует доменные AI инструменты в MCP-совместимый формат
- Трансформация и валидация схем инструментов
- Обеспечивает совместимость с MCP серверами

## Использование

```typescript
import { collectFullContext, compressContext } from '@/features/ai-chat/utils'

// Сбор полного контекста
const context = await collectFullContext()

// Сжатие при необходимости
if (isContextTooLarge(context)) {
  const compressed = compressContext(context, maxTokens)
}
```

## Ключевые функции

### Сбор контекста
Автоматически собирает состояние из:
- Редактора timeline
- Пула ресурсов
- Медиа браузера
- Видео плеера
- Настроек пользователя

### Оптимизация контекста
- Оценка количества токенов
- Умное сжатие контекста
- Сохранение информации по приоритету
- Извлечение метаданных

## Тестирование

```bash
# Запустить тесты utils
bun run test src/features/ai-chat/utils/

# Конкретные тесты
bun run test src/features/ai-chat/utils/__tests__/convert-tools.test.ts
```