# AI Chat Architecture Refactoring

**Статус:** Planned
**Приоритет:** High
**Создано:** 2025-11-29
**Ответственный:** Architecture Team
**Зависит от:** monorepo-packages-migration.md (опционально)

## 📋 Описание

Рефакторинг модуля `ai-chat` для приведения в соответствие с архитектурой Ports & Adapters. Устранение прямых зависимостей от domains и использование core layer.

## 🔴 Текущие проблемы

### 1. Прямой импорт хуков из domains

```typescript
// ❌ src/features/ai-chat/components/ai-chat.tsx:10
import { useTimeline } from "@/domains/video-editing/hooks"

// ❌ src/features/ai-chat/hooks/use-browser-ai-integration.ts:4
import { useBrowserState } from "@/domains/browser"
import { useApp } from "@/domains/project-management/providers"
```

**Проблема:** Features не должны знать о domains напрямую.

### 2. Прямой импорт сервисов из domains

```typescript
// ❌ src/features/ai-chat/hooks/use-timeline-ai.tsx:9
import { TimelineAIService } from "@/domains/ai-services/services/timeline-ai-service"

// ❌ src/features/ai-chat/components/ai-chat.tsx:23
import { allAITools } from "@/domains/ai-tools"

// ❌ src/features/ai-chat/hooks/use-browser-ai-integration.ts:3
import { setBrowserStateAccess } from "@/domains/ai-tools/tools/core/browser/utils/helpers"
```

**Проблема:** Невозможно подменить реализацию для тестирования.

### 3. Создание экземпляров сервисов напрямую

```typescript
// ❌ src/features/ai-chat/hooks/use-timeline-ai.tsx:48
const timelineAI = new TimelineAIService(
  resourcesProvider,
  {}, // browserState - заглушка
  ...
)
```

**Проблема:** Нарушение принципа Dependency Injection.

### 4. Типы разбросаны по domains

```typescript
// ❌ Типы из domains
import type { Agent, AgentId, ChatMessage } from "@/domains/ai-services/types/chat"
import type { BrowserStateAccess } from "@/domains/ai-tools/tools/core/browser/types"
import type { IAITool } from "@/domains/ai-tools/types"
```

**Проблема:** Общие типы должны быть в core.

## 🎯 Целевое состояние

### Правильная архитектура

```
ai-chat → core (только!)
  │
  └─→ ports (интерфейсы)
  └─→ types (типы)
  └─→ container (DI)
```

### Примеры правильного кода

```typescript
// ✅ Через core/container
import { getAI, getTimeline, getBrowser } from "@/core/container"

// ✅ Хуки через core
import { useTimeline, useBrowser } from "@/core/hooks"

// ✅ Типы из core
import type { ChatMessage, Agent, IAITool } from "@/core/types"

// ✅ Использование сервиса через DI
const aiService = getAI()
const timelineService = getTimeline()
```

## 📊 Граф текущих зависимостей

```
ai-chat ──→ domains/ai-services ✗
        ──→ domains/video-editing ✗
        ──→ domains/browser ✗
        ──→ domains/project-management ✗
        ──→ domains/ai-tools ✗
```

**Должно быть:**

```
ai-chat ──→ core ✓
            ├─→ ports
            ├─→ types
            └─→ container
```

## 📝 План рефакторинга

### Phase 1: Анализ и подготовка (1 день)

- [ ] Составить полный список всех импортов из domains в ai-chat
- [ ] Определить какие типы нужно перенести в core
- [ ] Определить какие хуки нужны в core
- [ ] Создать migration checklist

**Скрипт для анализа:**

```bash
# Найти все импорты из domains
grep -r "from [\"']@/domains" src/features/ai-chat --include="*.ts" --include="*.tsx" > ai-chat-domains-imports.txt

# Подсчитать количество файлов
grep -rl "from [\"']@/domains" src/features/ai-chat --include="*.ts" --include="*.tsx" | wc -l
```

### Phase 2: Перенос типов в core (1-2 дня)

- [ ] Создать `src/core/types/ai.ts` для AI типов
- [ ] Перенести типы из `@/domains/ai-services/types/chat`
  - ChatMessage
  - Agent
  - AgentId
  - ChatSession
  - ChatListItem
- [ ] Перенести типы из `@/domains/ai-tools/types`
  - IAITool
  - AIToolResult
  - BrowserStateAccess
- [ ] Перенести AIProvider из `@/domains/shared/types/ai-tools/ai-config`

**Файловая структура:**

```
src/core/types/
├── ai.ts              # AI типы (ChatMessage, Agent, etc.)
├── tools.ts           # AI Tools типы (IAITool, etc.)
├── media.ts           # Уже есть
└── index.ts           # Re-exports
```

**Пример миграции:**

```typescript
// src/core/types/ai.ts
export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
}

export interface Agent {
  id: AgentId
  name: string
  description: string
  systemPrompt: string
}

export type AgentId = "default" | "timeline" | "analysis" | "export" | string
```

### Phase 3: Создание портов для AI сервисов (1-2 дня)

- [ ] Расширить `src/core/ports/ai.port.ts` интерфейсами для чата
- [ ] Добавить методы для работы с chat
- [ ] Добавить методы для работы с AI tools

**Обновление IAIService:**

```typescript
// src/core/ports/ai.port.ts
export interface IAIService {
  // ... существующие методы (whisper, yolo, etc.)

  // Chat methods
  sendMessage(message: ChatMessage, options?: ChatOptions): Promise<ChatMessage>
  streamMessage(message: ChatMessage, options?: ChatOptions): AsyncIterator<ChatMessageChunk>
  getTools(): IAITool[]
  executeTool(toolName: string, args: any): Promise<AIToolResult>

  // Agent methods
  getAgent(id: AgentId): Agent | undefined
  listAgents(): Agent[]
}
```

### Phase 4: Вынос хуков в core (2 дня)

- [ ] Создать `src/core/hooks/use-timeline.ts` (обёртка над domains)
- [ ] Создать `src/core/hooks/use-browser.ts` (обёртка над domains)
- [ ] Создать `src/core/hooks/use-ai-chat.ts`

**Примеры:**

```typescript
// src/core/hooks/use-timeline.ts
import { useTimeline as useDomainTimeline } from "@/domains/video-editing/hooks"

/**
 * Core-level hook для работы с timeline
 * Абстракция над domain-level hook
 */
export function useTimeline() {
  return useDomainTimeline()
}
```

```typescript
// src/core/hooks/use-browser.ts
import { useBrowserState as useDomainBrowserState } from "@/domains/browser"

export function useBrowser() {
  return useDomainBrowserState()
}
```

### Phase 5: Рефакторинг ai-chat компонентов (2-3 дня)

- [ ] Обновить импорты в `ai-chat.tsx`
- [ ] Обновить импорты в `use-timeline-ai.tsx`
- [ ] Обновить импорты в `use-browser-ai-integration.ts`
- [ ] Обновить импорты в `use-chat-actions.tsx`
- [ ] Обновить импорты во всех остальных файлах

**Рефакторинг примеры:**

#### До (ai-chat.tsx):

```typescript
import type { Agent, AgentId, ChatMessage } from "@/domains/ai-services/types/chat"
import { useTimeline } from "@/domains/video-editing/hooks"
import { allAITools } from "@/domains/ai-tools"
```

#### После:

```typescript
import type { Agent, AgentId, ChatMessage } from "@/core/types"
import { useTimeline } from "@/core/hooks"
import { getAI } from "@/core/container"

// В компоненте
const aiService = getAI()
const allTools = aiService.getTools()
```

#### До (use-timeline-ai.tsx):

```typescript
import { TimelineAIService } from "@/domains/ai-services/services/timeline-ai-service"

const timelineAI = new TimelineAIService(
  resourcesProvider,
  {}, // browserState - заглушка
)
```

#### После:

```typescript
import { getAI } from "@/core/container"

const aiService = getAI()
// Используем методы сервиса вместо создания нового экземпляра
```

#### До (use-browser-ai-integration.ts):

```typescript
import { useBrowserState } from "@/domains/browser"
import { useApp } from "@/domains/project-management/providers"
import { setBrowserStateAccess } from "@/domains/ai-tools/tools/core/browser/utils/helpers"
```

#### После:

```typescript
import { useBrowser, useApp } from "@/core/hooks"
import { getAI } from "@/core/container"

const aiService = getAI()
// Используем методы aiService вместо прямых вызовов helpers
```

### Phase 6: Удаление устаревшего кода (1 день)

- [ ] Удалить прямые создания экземпляров сервисов
- [ ] Удалить импорты из domains
- [ ] Удалить временные заглушки
- [ ] Очистить неиспользуемый код

### Phase 7: Тестирование (2 дня)

- [ ] Обновить тесты с новыми импортами
- [ ] Добавить тесты для новых core hooks
- [ ] Проверить работу с mock адаптерами
- [ ] Запустить все тесты ai-chat модуля
- [ ] E2E тесты для AI чата

**Тестирование с mock адаптером:**

```typescript
// __tests__/ai-chat.test.tsx
import { initMockApp } from "@/adapters/mock"

beforeAll(() => {
  initMockApp() // Инициализация mock адаптера
})

test("ai-chat works with mock adapter", () => {
  // ai-chat должен работать без Tauri
})
```

### Phase 8: Документация (1 день)

- [ ] Обновить README.md в ai-chat
- [ ] Документировать новые core hooks
- [ ] Примеры использования
- [ ] Migration guide

## 📋 Детальный checklist файлов

### Компоненты (6 файлов)

- [ ] `components/ai-chat.tsx` - основной компонент
- [ ] `components/chat-list.tsx` - список сообщений
- [ ] `components/ai-action-preview.tsx` - превью действий
- [ ] `components/ai-processing-indicator.tsx` - индикатор обработки
- [ ] `components/cache-stats-panel.tsx` - статистика кеша
- [ ] `components/suggestions/ai-suggestions-panel.tsx` - панель подсказок

### Хуки (10+ файлов)

- [ ] `hooks/use-chat.ts` - основной хук чата
- [ ] `hooks/use-chat-state.ts` - состояние чата
- [ ] `hooks/use-chat-actions.tsx` - действия чата
- [ ] `hooks/use-timeline-ai.tsx` - интеграция с timeline
- [ ] `hooks/use-browser-ai-integration.ts` - интеграция с browser
- [ ] `hooks/use-player-ai-integration.ts` - интеграция с player
- [ ] `hooks/use-resources-ai-integration.ts` - интеграция с resources
- [ ] И другие...

### Утилиты (5+ файлов)

- [ ] `utils/convert-tools.ts` - конвертация AI tools
- [ ] `utils/context-manager.ts` - управление контекстом
- [ ] `utils/timeline-context.ts` - контекст timeline

### Сервисы (3 файла)

- [ ] `services/chat-provider.tsx` - провайдер чата
- [ ] `services/chat-storage-service.ts` - хранилище
- [ ] `services/mcp-provider.tsx` - MCP провайдер

## ✅ Критерии успеха

1. ✅ Нет импортов `@/domains/*` в `src/features/ai-chat`
2. ✅ Все типы импортируются из `@/core/types`
3. ✅ Все хуки импортируются из `@/core/hooks`
4. ✅ Все сервисы получаются через `@/core/container`
5. ✅ Тесты проходят с mock адаптерами
6. ✅ TypeScript компилируется без ошибок
7. ✅ AI чат работает в dev и production

## 🔍 Скрипт проверки

```bash
#!/bin/bash
# scripts/check-ai-chat-architecture.sh

echo "Checking ai-chat architecture compliance..."

# Проверяем импорты из domains
DOMAINS_IMPORTS=$(grep -r "from [\"']@/domains" src/features/ai-chat --include="*.ts" --include="*.tsx" | grep -v "__tests__" | wc -l)

if [ "$DOMAINS_IMPORTS" -gt 0 ]; then
  echo "❌ Found $DOMAINS_IMPORTS imports from @/domains"
  grep -r "from [\"']@/domains" src/features/ai-chat --include="*.ts" --include="*.tsx" | grep -v "__tests__"
  exit 1
else
  echo "✅ No imports from @/domains"
fi

# Проверяем прямое создание экземпляров сервисов
NEW_SERVICE=$(grep -r "new.*Service(" src/features/ai-chat --include="*.ts" --include="*.tsx" | grep -v "__tests__" | wc -l)

if [ "$NEW_SERVICE" -gt 0 ]; then
  echo "❌ Found $NEW_SERVICE direct service instantiations"
  grep -r "new.*Service(" src/features/ai-chat --include="*.ts" --include="*.tsx" | grep -v "__tests__"
  exit 1
else
  echo "✅ No direct service instantiations"
fi

echo "✅ Architecture compliance check passed!"
```

## 🚧 Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Breaking changes в API | Высокая | Высокое | Постепенная миграция, параллельная поддержка старого API |
| Регрессии в функциональности | Средняя | Высокое | Тщательное тестирование, E2E тесты |
| Увеличение сложности core | Средняя | Среднее | Хорошая документация, примеры |
| Проблемы с типами | Низкая | Среднее | TypeScript strict mode, проверка на CI |

## 🔗 Связанные задачи

- [Monorepo Packages Migration](monorepo-packages-migration.md) - параллельная задача
- [Domains Adapters Migration](domains-adapters-migration.md) - завершена ✅

## 📚 Примеры из кодовой базы

### Правильная архитектура (примеры)

```typescript
// ✅ src/features/timeline/hooks/use-timeline.ts
import { container } from "@/core"

export function useTimeline() {
  const timelineService = container.get(TimelineService)
  // ...
}
```

### Неправильная архитектура (что исправляем)

```typescript
// ❌ src/features/ai-chat/hooks/use-timeline-ai.tsx
import { TimelineAIService } from "@/domains/ai-services/services/timeline-ai-service"

const timelineAI = new TimelineAIService(...)
```

## 📅 Временные рамки

**Оценка:** 10-12 рабочих дней (2-2.5 недели)

**Breakdown:**
- Phase 1: 1 день
- Phase 2: 2 дня
- Phase 3: 2 дня
- Phase 4: 2 дня
- Phase 5: 3 дня
- Phase 6: 1 день
- Phase 7: 2 дня
- Phase 8: 1 день

**Можно распараллелить:**
- Phase 2, 3, 4 могут выполняться параллельно (3 дня вместо 6)
- Итого: **7-9 дней** при параллельной работе

## 🎯 Метрики успеха

### До рефакторинга:
- Импорты из domains: ~30+
- Прямые создания сервисов: ~5+
- Зависимостей от domains: 5 доменов

### После рефакторинга:
- Импорты из domains: 0 ✅
- Прямые создания сервисов: 0 ✅
- Зависимостей от domains: 0 ✅
- Зависимостей от core: только core ✅

## 📖 Дополнительные материалы

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Core Layer Documentation](../../src/core/README.md)

---

**Следующие шаги:**
1. Review и утверждение плана
2. Создание feature branch: `refactor/ai-chat-architecture`
3. Начало Phase 1: анализ зависимостей
4. Создание migration tracking issue

---

*Создано: 2025-11-29*
*Обновлено: 2025-11-29*
