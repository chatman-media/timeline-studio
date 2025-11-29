# AI Features Architecture Refactoring

**Статус:** Planned
**Приоритет:** High
**Создано:** 2025-11-29
**Ответственный:** Architecture Team
**Зависит от:** monorepo-packages-migration.md (опционально)

## 📋 Описание

Комплексный рефакторинг AI модулей (`ai-chat` и `ai-director`) для приведения в соответствие с архитектурой Ports & Adapters. Устранение прямых зависимостей от domains и использование core layer.

## 🎯 Цели

1. **Соответствие архитектуре** - следование принципу Ports & Adapters
2. **Независимость UI от domains** - features зависят только от core
3. **Тестируемость** - возможность тестирования с mock адаптерами
4. **Переиспользование** - использование в разных приложениях (Desktop, CLI, Web)

## 📊 Текущее состояние

### AI Chat

| Метрика | Значение |
|---------|----------|
| Импортов из domains | ~30+ |
| Файлов с нарушениями | ~20+ |
| Прямых созданий сервисов | ~5+ |
| Зависимостей от domains | 5 доменов |

**Зависимости:**
```
ai-chat → domains/ai-services
       → domains/video-editing
       → domains/browser
       → domains/project-management
       → domains/ai-tools
```

### AI Director

| Метрика | Значение |
|---------|----------|
| Импортов из domains | 14 |
| Файлов с нарушениями | 9 |
| Прямых созданий сервисов | 1 |
| Зависимостей от domains | 3 домена |

**Зависимости:**
```
ai-director → domains/ai-director
           → domains/media-management
           → domains/system-integration
```

### Analysis Dashboard

| Метрика | Значение |
|---------|----------|
| Импортов из domains | 3 |
| Файлов с нарушениями | 2 |
| Прямых созданий сервисов | 0 |
| Зависимостей от domains | 2 домена |
| Версий компонента | 2 (v1, v2) |

**Зависимости:**
```
analysis-dashboard → domains/browser
                  → domains/media-management
                  → domains/project-management
```

**Примечание:** Есть 2 версии дашборда:
- `ai-analysis-dashboard.tsx` (v1) - используется в `/analysis` странице
- `ai-analysis-dashboard-v2.tsx` (v2) - не используется, более новая

**План:** Удалить v1, переключить на v2, рефакторить v2

## 🔴 Общие проблемы

### 1. Прямой импорт хуков из domains

```typescript
// ❌ AI Chat
import { useTimeline } from "@/domains/video-editing/hooks"
import { useBrowserState } from "@/domains/browser"
import { useApp } from "@/domains/project-management/providers"

// ❌ AI Director
import { useMediaManagement } from "@/domains/media-management"
import { useNotifications } from "@/domains/system-integration"
import { useAIDirectorEvents } from "@/domains/ai-director"
```

### 2. Прямой импорт сервисов и функций

```typescript
// ❌ AI Chat
import { TimelineAIService } from "@/domains/ai-services/services/timeline-ai-service"
import { allAITools } from "@/domains/ai-tools"
import { setBrowserStateAccess } from "@/domains/ai-tools/tools/core/browser/utils/helpers"

// ❌ AI Director
import { aiDirectorAnalyzeBatch } from "@/domains/ai-director"
import { fileSystemService } from "@/domains/media-management/services/file-system-service"
```

### 3. Создание экземпляров сервисов напрямую

```typescript
// ❌ AI Chat
const timelineAI = new TimelineAIService(
  resourcesProvider,
  {}, // browserState - заглушка
  ...
)
```

### 4. Типы разбросаны по domains

```typescript
// ❌ Типы должны быть в core
import type { ChatMessage, Agent } from "@/domains/ai-services/types/chat"
import type { IAITool } from "@/domains/ai-tools/types"
import type { AIDirectorConfig, AnalysisProgress } from "@/domains/ai-director"
import type { MediaInfo, MediaType } from "@/domains/media-management/types"
```

## 🎯 Целевое состояние

### Правильная архитектура

```
ai-chat     ──→ core ✓
ai-director ──→ core ✓

core:
  ├─→ ports (интерфейсы)
  ├─→ types (типы)
  ├─→ hooks (React хуки)
  └─→ container (DI)
```

### Примеры правильного кода

```typescript
// ✅ Через core/container
import { getAI, getTimeline, getBrowser, getMedia } from "@/core/container"

// ✅ Хуки через core
import { useTimeline, useBrowser, useMediaManagement, useNotifications } from "@/core/hooks"

// ✅ Типы из core
import type { ChatMessage, Agent, IAITool, AIDirectorConfig, MediaInfo } from "@/core/types"

// ✅ Использование сервисов через DI
const aiService = getAI()
const timelineService = getTimeline()
const mediaService = getMedia()
```

## 📝 План рефакторинга

### Phase 1: Анализ и подготовка (1 день)

- [ ] Составить полный список импортов из domains в ai-chat
- [ ] Составить полный список импортов из domains в ai-director
- [ ] Определить все типы для переноса в core
- [ ] Определить все хуки для core
- [ ] Создать migration checklist

**Скрипт анализа:**

```bash
# AI Chat
grep -r "from [\"']@/domains" src/features/ai-chat --include="*.ts" --include="*.tsx" > analysis/ai-chat-imports.txt

# AI Director
grep -r "from [\"']@/domains" src/features/ai-director --include="*.ts" --include="*.tsx" > analysis/ai-director-imports.txt

# Статистика
echo "AI Chat files: $(grep -rl "from [\"']@/domains" src/features/ai-chat --include="*.ts" --include="*.tsx" | wc -l)"
echo "AI Director files: $(grep -rl "from [\"']@/domains" src/features/ai-director --include="*.ts" --include="*.tsx" | wc -l)"
```

### Phase 2: Перенос типов в core (2-3 дня)

- [ ] Создать `src/core/types/ai.ts` для AI типов
- [ ] Создать `src/core/types/tools.ts` для AI Tools типов
- [ ] Создать `src/core/types/analysis.ts` для анализа
- [ ] Перенести типы из `@/domains/ai-services/types/chat`
  - ChatMessage, Agent, AgentId, ChatSession, ChatListItem
- [ ] Перенести типы из `@/domains/ai-tools/types`
  - IAITool, AIToolResult, BrowserStateAccess
- [ ] Перенести типы из `@/domains/ai-director`
  - AIDirectorConfig, AnalysisProgress, AnalysisError, ComprehensiveAnalysisResult
- [ ] Перенести типы из `@/domains/media-management/types`
  - MediaInfo, MediaType (если ещё не в core)

**Файловая структура:**

```
src/core/types/
├── ai.ts              # Chat, Agent, ChatMessage
├── tools.ts           # IAITool, AIToolResult
├── analysis.ts        # AIDirectorConfig, AnalysisProgress
├── media.ts           # MediaInfo, MediaType (уже есть?)
└── index.ts           # Re-exports
```

**Примеры:**

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

```typescript
// src/core/types/analysis.ts
export interface AIDirectorConfig {
  performance_mode: "fast" | "balanced" | "quality"
  enable_audio_analysis: boolean
  enable_scene_detection: boolean
  enable_video_analysis: boolean
  // ... остальные поля
}

export interface AnalysisProgress {
  percent: number
  stage: string
  current_operation?: string
  estimated_time_remaining?: number
}

export interface AnalysisError {
  message: string
  code?: string
  details?: any
}
```

### Phase 3: Расширение портов для AI (2 дня)

- [ ] Расширить `src/core/ports/ai.port.ts` методами для чата
- [ ] Добавить методы для AI Director анализа
- [ ] Добавить методы для работы с AI tools
- [ ] Добавить методы для notifications

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

  // AI Director methods
  analyzeComprehensive(filePath: string, config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult>
  analyzeQuick(filePath: string): Promise<ComprehensiveAnalysisResult>
  analyzeBatch(filePaths: string[], config?: AIDirectorConfig): Promise<ComprehensiveAnalysisResult[]>
}
```

**Создание INotificationService:**

```typescript
// src/core/ports/notification.port.ts
export interface INotificationService {
  showInfo(message: string, options?: NotificationOptions): void
  showSuccess(message: string, options?: NotificationOptions): void
  showWarning(message: string, options?: NotificationOptions): void
  showError(message: string, options?: NotificationOptions): void
}
```

### Phase 4: Создание хуков в core (2-3 дня)

- [ ] Создать `src/core/hooks/use-timeline.ts`
- [ ] Создать `src/core/hooks/use-browser.ts`
- [ ] Создать `src/core/hooks/use-media-management.ts`
- [ ] Создать `src/core/hooks/use-notifications.ts`
- [ ] Создать `src/core/hooks/use-ai-chat.ts`
- [ ] Создать `src/core/hooks/use-ai-director.ts`

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
// src/core/hooks/use-notifications.ts
import { getNotifications } from "@/core/container"

export function useNotifications() {
  return getNotifications()
}
```

```typescript
// src/core/hooks/use-media-management.ts
import { useMediaManagement as useDomainMediaManagement } from "@/domains/media-management"

export function useMediaManagement() {
  return useDomainMediaManagement()
}
```

### Phase 5: Рефакторинг AI Chat (3-4 дня)

- [ ] Обновить импорты в `components/` (6 компонентов)
- [ ] Обновить импорты в `hooks/` (10+ хуков)
- [ ] Обновить импорты в `utils/` (5 утилит)
- [ ] Обновить импорты в `services/` (3 сервиса)
- [ ] Удалить прямые создания экземпляров сервисов
- [ ] Обновить использование AI tools

**Ключевые файлы AI Chat:**

| Категория | Файлы | Приоритет |
|-----------|-------|-----------|
| Компоненты | ai-chat.tsx, chat-list.tsx, ai-action-preview.tsx | Высокий |
| Хуки | use-chat.ts, use-chat-state.ts, use-timeline-ai.tsx | Высокий |
| Интеграции | use-browser-ai-integration.ts, use-player-ai-integration.ts | Средний |
| Сервисы | chat-provider.tsx, chat-storage-service.ts | Высокий |

**Примеры рефакторинга:**

```typescript
// ❌ До (ai-chat.tsx)
import type { Agent, ChatMessage } from "@/domains/ai-services/types/chat"
import { useTimeline } from "@/domains/video-editing/hooks"
import { allAITools } from "@/domains/ai-tools"

// ✅ После
import type { Agent, ChatMessage } from "@/core/types"
import { useTimeline } from "@/core/hooks"
import { getAI } from "@/core/container"

const aiService = getAI()
const allTools = aiService.getTools()
```

```typescript
// ❌ До (use-timeline-ai.tsx)
import { TimelineAIService } from "@/domains/ai-services/services/timeline-ai-service"
const timelineAI = new TimelineAIService(...)

// ✅ После
import { getAI } from "@/core/container"
const aiService = getAI()
```

### Phase 6: Рефакторинг AI Director (2-3 дня)

- [ ] Обновить импорты в `components/v3/` (3 компонента)
- [ ] Обновить импорты в `hooks/` (10 хуков)
- [ ] Обновить `services/ai-director-machine.ts`
- [ ] Обновить `types/ai-director.ts`
- [ ] Удалить прямые вызовы fileSystemService

### Phase 6.5: Рефакторинг Analysis Dashboard (0.5 дня)

- [ ] Удалить старую версию `ai-analysis-dashboard.tsx`
- [ ] Переключить импорт в `/analysis` странице на V2
- [ ] Обновить импорты в `ai-analysis-dashboard-v2.tsx`
  - `useBrowser` → `@/core/hooks`
  - `useMediaManagement` → `@/core/hooks`
- [ ] Переименовать V2 в основную версию (убрать суффикс V2)

**Ключевые файлы AI Director:**

| Категория | Файлы | Приоритет |
|-----------|-------|-----------|
| Компоненты | ai-director-v3-dashboard.tsx, file-analysis-card.tsx | Высокий |
| Хуки | use-ai-director-analysis.ts, use-ai-director-analysis-v2.ts | Высокий |
| Хуки | use-montage-applicator.ts | Средний |
| Сервисы | ai-director-machine.ts | Высокий |

**Примеры рефакторинга:**

```typescript
// ❌ До (ai-director-v3-dashboard.tsx)
import { useMediaManagement } from "@/domains/media-management"
import { useNotifications } from "@/domains/system-integration"

// ✅ После
import { useMediaManagement, useNotifications } from "@/core/hooks"
```

```typescript
// ❌ До (use-ai-director-analysis.ts)
import { aiDirectorAnalyzeComprehensive, aiDirectorAnalyzeQuick } from "@/domains/ai-director"

// ✅ После
import { getAI } from "@/core/container"

const aiService = getAI()
await aiService.analyzeComprehensive(videoPath, config)
await aiService.analyzeQuick(videoPath)
```

```typescript
// ❌ До (use-montage-applicator.ts)
import { fileSystemService } from "@/domains/media-management/services/file-system-service"

// ✅ После
import { getMedia } from "@/core/container"

const mediaService = getMedia()
// Использовать методы mediaService для работы с файлами
```

### Phase 7: Удаление устаревшего кода (1 день)

- [ ] Удалить прямые создания экземпляров сервисов
- [ ] Удалить все импорты из domains в AI features
- [ ] Удалить временные заглушки
- [ ] Очистить неиспользуемый код
- [ ] Убрать реэкспорты из domains

### Phase 8: Тестирование (3 дня)

- [ ] Обновить тесты AI Chat с новыми импортами
- [ ] Обновить тесты AI Director с новыми импортами
- [ ] Добавить тесты для новых core hooks
- [ ] Проверить работу с mock адаптерами
- [ ] Запустить все unit тесты AI модулей
- [ ] E2E тесты для AI функциональности

**Тестирование с mock адаптером:**

```typescript
// __tests__/ai-features.test.tsx
import { initMockApp } from "@/adapters/mock"

beforeAll(() => {
  initMockApp()
})

test("ai-chat works with mock adapter", () => {
  // ai-chat должен работать без Tauri
})

test("ai-director works with mock adapter", () => {
  // ai-director должен работать без Tauri
})
```

### Phase 9: Документация (1 день)

- [ ] Обновить README.md в ai-chat
- [ ] Обновить README.md в ai-director
- [ ] Документировать новые core hooks
- [ ] Примеры использования
- [ ] Migration guide для разработчиков

## 📋 Детальный checklist

### AI Chat (30+ файлов)

**Компоненты (6):**
- [ ] `components/ai-chat.tsx`
- [ ] `components/chat-list.tsx`
- [ ] `components/ai-action-preview.tsx`
- [ ] `components/ai-processing-indicator.tsx`
- [ ] `components/cache-stats-panel.tsx`
- [ ] `components/suggestions/ai-suggestions-panel.tsx`

**Хуки (10+):**
- [ ] `hooks/use-chat.ts`
- [ ] `hooks/use-chat-state.ts`
- [ ] `hooks/use-chat-actions.tsx`
- [ ] `hooks/use-timeline-ai.tsx`
- [ ] `hooks/use-browser-ai-integration.ts`
- [ ] `hooks/use-player-ai-integration.ts`
- [ ] `hooks/use-resources-ai-integration.ts`
- [ ] И другие...

**Утилиты (5):**
- [ ] `utils/convert-tools.ts`
- [ ] `utils/context-manager.ts`
- [ ] `utils/timeline-context.ts`

**Сервисы (3):**
- [ ] `services/chat-provider.tsx`
- [ ] `services/chat-storage-service.ts`
- [ ] `services/mcp-provider.tsx`

### AI Director (9 файлов)

**Компоненты (3):**
- [ ] `components/v3/ai-director-v3-dashboard.tsx`
- [ ] `components/v3/empty-state.tsx`
- [ ] `components/v3/media-pool-list.tsx`

**Хуки (4):**
- [ ] `hooks/use-ai-director-analysis.ts`
- [ ] `hooks/use-ai-director-analysis-v2.ts`
- [ ] `hooks/use-montage-applicator.ts`

**Типы и сервисы (2):**
- [ ] `types/ai-director.ts`
- [ ] `services/ai-director-machine.ts`

### Analysis Dashboard (2 файла → 1 после cleanup)

**Компоненты (2 → 1):**
- [ ] `components/ai-analysis-dashboard.tsx` - **УДАЛИТЬ** (старая версия)
- [ ] `components/ai-analysis-dashboard-v2.tsx` - **РЕФАКТОРИТЬ** и переименовать

**План:**
1. Удалить v1
2. Переключить `/analysis` страницу на v2
3. Рефакторить v2: `useBrowser`, `useMediaManagement` → `@/core/hooks`
4. Переименовать v2 → основная версия

## ✅ Критерии успеха

1. ✅ Нет импортов `@/domains/*` в `src/features/ai-chat`
2. ✅ Нет импортов `@/domains/*` в `src/features/ai-director`
3. ✅ Нет импортов `@/domains/*` в `src/features/analysis-dashboard`
4. ✅ Все типы импортируются из `@/core/types`
5. ✅ Все хуки импортируются из `@/core/hooks`
6. ✅ Все сервисы получаются через `@/core/container`
7. ✅ Тесты проходят с mock адаптерами
8. ✅ TypeScript компилируется без ошибок
9. ✅ AI features работают в dev и production

## 🔍 Скрипт проверки

```bash
#!/bin/bash
# scripts/check-ai-features-architecture.sh

echo "Checking AI features architecture compliance..."

FEATURES=("ai-chat" "ai-director" "analysis-dashboard")
TOTAL_VIOLATIONS=0

for FEATURE in "${FEATURES[@]}"; do
  echo ""
  echo "=== Checking $FEATURE ==="

  # Проверяем импорты из domains
  DOMAINS_IMPORTS=$(grep -r "from [\"']@/domains" "src/features/$FEATURE" --include="*.ts" --include="*.tsx" | grep -v "__tests__" | wc -l)

  if [ "$DOMAINS_IMPORTS" -gt 0 ]; then
    echo "❌ Found $DOMAINS_IMPORTS imports from @/domains"
    grep -r "from [\"']@/domains" "src/features/$FEATURE" --include="*.ts" --include="*.tsx" | grep -v "__tests__"
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + DOMAINS_IMPORTS))
  else
    echo "✅ No imports from @/domains"
  fi

  # Проверяем прямое создание экземпляров сервисов
  NEW_SERVICE=$(grep -r "new.*Service(" "src/features/$FEATURE" --include="*.ts" --include="*.tsx" | grep -v "__tests__" | wc -l)

  if [ "$NEW_SERVICE" -gt 0 ]; then
    echo "❌ Found $NEW_SERVICE direct service instantiations"
    grep -r "new.*Service(" "src/features/$FEATURE" --include="*.ts" --include="*.tsx" | grep -v "__tests__"
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + NEW_SERVICE))
  else
    echo "✅ No direct service instantiations"
  fi
done

echo ""
if [ "$TOTAL_VIOLATIONS" -gt 0 ]; then
  echo "❌ Total violations: $TOTAL_VIOLATIONS"
  exit 1
else
  echo "✅ Architecture compliance check passed!"
  exit 0
fi
```

## 🚧 Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Breaking changes в API | Высокая | Высокое | Постепенная миграция, параллельная поддержка |
| Регрессии в AI функциях | Средняя | Критическое | Тщательное E2E тестирование |
| Увеличение сложности core | Средняя | Среднее | Хорошая документация, примеры |
| Проблемы с типами | Низкая | Среднее | TypeScript strict mode, CI проверки |
| Конфликты при параллельной работе | Средняя | Среднее | Разделение по фичам (ai-chat / ai-director) |

## 🔄 Стратегия параллелизации

Фазы можно выполнять параллельно для ускорения:

```
Phase 1 (1 день) → последовательно

Phase 2, 3, 4 (параллельно, 3 дня):
  ├─ Phase 2: Типы
  ├─ Phase 3: Порты
  └─ Phase 4: Хуки

Phase 5, 6 (параллельно, 4 дня):
  ├─ Phase 5: AI Chat
  └─ Phase 6: AI Director

Phase 7 (1 день) → последовательно
Phase 8 (3 дня) → последовательно
Phase 9 (1 день) → последовательно
```

**Итого:** 13 дней при параллелизации (vs 18-20 последовательно)

## 📅 Временные рамки

**Оценка:** 18-20 рабочих дней (3.5-4 недели)

**При параллелизации:** 13 дней (2.5 недели)

**Breakdown:**
- Phase 1: 1 день
- Phase 2: 3 дня
- Phase 3: 2 дня
- Phase 4: 3 дня
- Phase 5: 4 дня (AI Chat)
- Phase 6: 3 дня (AI Director)
- Phase 6.5: 0.5 дня (Analysis Dashboard)
- Phase 7: 1 день
- Phase 8: 3 дня
- Phase 9: 1 день

## 🎯 Метрики успеха

### До рефакторинга:

**AI Chat:**
- Импорты из domains: ~30+
- Прямые создания сервисов: ~5+
- Зависимостей от domains: 5

**AI Director:**
- Импорты из domains: 14
- Прямые создания сервисов: 1
- Зависимостей от domains: 3

**Analysis Dashboard:**
- Импорты из domains: 3
- Файлов с нарушениями: 2
- Зависимостей от domains: 2

**Всего:**
- Импорты: 47+
- Файлов с нарушениями: 31+
- Зависимостей: 8 доменов

### После рефакторинга:

- Импорты из domains: 0 ✅
- Прямые создания сервисов: 0 ✅
- Зависимостей от domains: 0 ✅
- Зависимостей от core: только core ✅
- Покрытие тестами с mock: 100% ✅

## 🔗 Связанные задачи

- [Monorepo Packages Migration](monorepo-packages-migration.md) - параллельная задача
- [Domains Adapters Migration](domains-adapters-migration.md) - завершена ✅

## 📚 Примеры из кодовой базы

### Правильная архитектура

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

// ❌ src/features/ai-director/hooks/use-montage-applicator.ts
import { fileSystemService } from "@/domains/media-management/services/file-system-service"
```

## 📖 Дополнительные материалы

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)
- [Core Layer Documentation](../../src/core/README.md)
- [Testing with Mock Adapters](../../docs/05_development/testing-with-mocks.md)

---

**Следующие шаги:**
1. Review и утверждение плана
2. Создание feature branch: `refactor/ai-features-architecture`
3. Разделение работы между разработчиками (ai-chat / ai-director)
4. Начало Phase 1: анализ зависимостей
5. Создание migration tracking issue

---

*Создано: 2025-11-29*
*Обновлено: 2025-11-29*
