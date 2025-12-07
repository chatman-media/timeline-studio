# Архитектура типов Timeline Studio

[← Назад к архитектуре](README.md)

**Дата создания:** 2025-12-07
**Статус:** Активно

## Обзор

Timeline Studio использует строгую иерархию типов, основанную на принципах:
- **FEOD** (Fractal Entity Oriental Design) - слоистая архитектура
- **DDD** (Domain-Driven Design) - доменная организация
- **Hexagonal Architecture** - разделение бизнес-логики и инфраструктуры

## Иерархия типов

```
┌─────────────────────────────────────────────────────────────┐
│                    Timeline Studio Types                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/domains/shared/types/  (Общие типы)             │  │
│  │  • primitives.ts  - ID, Timestamp, FilePath           │  │
│  │  • common.ts      - Size, Position, TimeRange         │  │
│  │  • result.ts      - Result<T>, Option<T>              │  │
│  │  • project/       - ProjectSettings, AspectRatio      │  │
│  │  • media/         - ResolutionOption, FrameRate       │  │
│  │  • resources/     - Resource, TimelineResource        │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │ импорт                            │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  src/domains/*/types/  (Доменные типы)               │  │
│  │  • media-management/  - MediaFile ✅ CANONICAL        │  │
│  │  • video-editing/     - TimelineClip, Track           │  │
│  │  • ai-services/       - AIAnalysis                    │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                         │ импорт                            │
│  ┌──────────────────────▼───────────────────────────────┐  │
│  │  src/features/*/types/  (UI типы)                    │  │
│  │  • Реэкспорты из domains                             │  │
│  │  • UI-специфичные типы (props, local state)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/core/ports/  (DI интерфейсы)                    │  │
│  │  • IMediaService, IAIService, IStorageService         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Детальная структура

### 1. src/domains/shared/types/ - Общие типы

**Назначение:** Типы, используемые в 3+ доменах или features

**Структура:**
```
src/domains/shared/types/
├── index.ts                # Главный экспорт
├── primitives.ts          # Базовые примитивы
├── common.ts              # Общие типы
├── result.ts              # Функциональные типы
├── project/
│   ├── index.ts
│   └── settings.ts        # ProjectSettings, AspectRatio, Resolution
├── media/
│   ├── index.ts
│   └── (реэкспорты из project/settings.ts)
└── resources/
    ├── index.ts
    └── types.ts           # Resource, TimelineResource + factories
```

**Примеры типов:**

```typescript
// primitives.ts
export type ID = string
export type Timestamp = number
export type FilePath = string
export type Duration = number

// common.ts
export interface Size { width: number; height: number }
export interface Position { x: number; y: number }
export interface TimeRange { start: number; end: number; duration?: number }
export interface Rectangle extends Position, Size {}

// result.ts
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }
export type Option<T> = T | null | undefined

// project/settings.ts
export interface ProjectSettings {
  aspectRatio: AspectRatio
  resolution: Resolution
  frameRate: FrameRate
  colorSpace: ColorSpace
}

// resources/types.ts
export interface Resource {
  id: string
  type: ResourceType
  name: string
  resourceId: string
  addedAt: number
}
export type TimelineResource = MediaResource | EffectResource | ...
```

**Правила:**
- ✅ НЕ импортирует из domains (кроме реэкспортов)
- ✅ НЕ импортирует из features
- ✅ Только общие, переиспользуемые типы
- ✅ Нет бизнес-логики

### 2. src/domains/*/types/ - Доменные типы

**Назначение:** Бизнес-типы для конкретного домена

**Примеры:**

```typescript
// src/domains/media-management/types/media.ts
export interface MediaFile {
  id: string
  name: string
  path: string
  type: MediaType
  duration?: number
  width?: number
  height?: number
  // ... полная структура медиа файла
}

// src/domains/video-editing/types/timeline.ts
export interface TimelineClip {
  id: string
  trackId: string
  mediaFileId: string
  startTime: number
  endTime: number
  // ... логика клипа на timeline
}

// src/domains/ai-services/types/interfaces.ts
// Реэкспорт MediaFile из canonical source
export type { MediaFile } from '@/domains/media-management/types'
```

**Правила:**
- ✅ МОЖЕТ импортировать из `domains/shared/types`
- ✅ МОЖЕТ импортировать из других domains (через их index.ts)
- ❌ НЕ ДОЛЖЕН импортировать из `features/*/types`
- ✅ Один canonical источник для каждого типа

**Canonical источники:**
- `MediaFile` → `domains/media-management/types/media.ts` ✅ CANONICAL
- `TimelineClip` → `domains/video-editing/types/timeline.ts` ✅ CANONICAL
- `ProjectSettings` → `domains/shared/types/project/settings.ts` ✅ CANONICAL

### 3. src/features/*/types/ - UI типы

**Назначение:** UI-специфичные типы и реэкспорты для удобства

**Структура:**

```typescript
// src/features/timeline/types/index.ts
// Реэкспорт domain типов для удобства
export type {
  TimelineClip,
  Track,
  Section,
} from '@/domains/video-editing/types'

// Локальные UI типы
export interface TimelineClipProps {
  clip: TimelineClip  // из domain
  isSelected: boolean
  onSelect: (id: string) => void
  onDoubleClick: () => void
}

// src/features/project-settings/types/project.ts
// Реэкспорт для обратной совместимости
export type {
  ProjectSettings,
  AspectRatio,
  Resolution,
  FrameRate,
  ColorSpace,
} from '@/domains/shared/types/project'

// Только legacy типы остаются здесь
export interface ProjectFile { /* deprecated */ }
```

**Правила:**
- ✅ ДОЛЖЕН импортировать из `domains/shared/types` или `domains/*/types`
- ❌ НЕ ДОЛЖЕН импортировать из других `features/*/types` (кросс-фича импорты)
- ✅ Реэкспортирует domain типы для удобства
- ✅ Содержит только UI-специфичные типы

### 4. src/core/ports/ - DI интерфейсы

**Назначение:** Интерфейсы для Dependency Injection (Hexagonal Architecture)

**Примеры:**

```typescript
// src/core/ports/media.port.ts
export interface IMediaService {
  getMetadata(path: string): Promise<MediaMetadata>
  importFiles(paths: string[]): Promise<ImportResult>
  generateThumbnail(path: string): Promise<string>
}

// src/core/ports/ai.port.ts
export interface IAIService {
  analyzeVideo(path: string): Promise<AIAnalysis>
  transcribeAudio(path: string): Promise<Transcription>
}
```

**Правила:**
- ✅ Только интерфейсы с префиксом `I`
- ✅ Platform-agnostic абстракции
- ✅ Используется для DI container
- ❌ Нет конкретных реализаций

## Правила импорта

### ✅ Разрешенные импорты

```typescript
// Features → Shared types
import type { ProjectSettings } from '@/domains/shared/types/project'
import type { Resource } from '@/domains/shared/types/resources'

// Features → Domains
import type { MediaFile } from '@/domains/media-management/types'
import type { TimelineClip } from '@/domains/video-editing/types'

// Domains → Shared types
import type { Size, Position } from '@/domains/shared/types/common'
import type { Result, Option } from '@/domains/shared/types/result'

// Domains → Domains (через публичный API)
import type { MediaFile } from '@/domains/media-management/types'

// Shared → Ничего (не импортирует!)
// (кроме реэкспортов внутри shared)
```

### ❌ Запрещенные импорты

```typescript
// ❌ Кросс-фича импорты
import type { SomeType } from '@/features/other-feature/types'

// ❌ Features импортирует сервисы domains
import { MediaService } from '@/domains/media-management/services'
// Используйте orchestrator или hooks вместо этого

// ❌ Domains импортирует из features
import type { UIType } from '@/features/some-feature/types'

// ❌ Shared импортирует из domains
import type { MediaFile } from '@/domains/media-management/types'
// Переместите тип в shared если нужен везде
```

## Где разместить новый тип?

### Чек-лист для принятия решения

1. **Это интерфейс для внешнего сервиса (Tauri, Node)?**
   → `src/core/ports/`

2. **Используется в 3+ доменах или features?**
   → `src/domains/shared/types/`

3. **Специфично для бизнес-логики одного домена?**
   → `src/domains/[domain]/types/`

4. **UI props, локальное состояние компонента?**
   → `src/features/[feature]/types/`

### Примеры принятия решений

#### Пример 1: Новый тип VideoQuality

```typescript
// ❓ Где разместить VideoQuality?

// Анализ:
// 1. Интерфейс для внешнего сервиса? → Нет
// 2. Используется в 3+ местах? → Да (export, player, timeline)
// 3. Специфично для домена? → Нет, общее
// 4. UI props? → Нет

// ✅ Решение: src/domains/shared/types/media/quality.ts
export type VideoQuality = 'low' | 'medium' | 'high' | 'ultra'
export interface QualityPreset {
  quality: VideoQuality
  bitrate: number
  resolution: Resolution
}
```

#### Пример 2: TimelineClipProps

```typescript
// ❓ Где разместить TimelineClipProps?

// Анализ:
// 1. Интерфейс для внешнего сервиса? → Нет
// 2. Используется в 3+ местах? → Нет, только в timeline UI
// 3. Специфично для домена? → Нет, это UI
// 4. UI props? → Да!

// ✅ Решение: src/features/timeline/types/components.ts
export interface TimelineClipProps {
  clip: TimelineClip  // импорт из domain
  isSelected: boolean
  onSelect: (id: string) => void
  onDoubleClick: () => void
}
```

#### Пример 3: MediaImportOptions

```typescript
// ❓ Где разместить MediaImportOptions?

// Анализ:
// 1. Интерфейс для внешнего сервиса? → Нет
// 2. Используется в 3+ местах? → Да, но все в media-management
// 3. Специфично для домена? → Да, это бизнес-логика импорта
// 4. UI props? → Нет

// ✅ Решение: src/domains/media-management/types/import.ts
export interface MediaImportOptions {
  generatePreviews: boolean
  extractMetadata: boolean
  createProxies: boolean
  importLocation: string
}
```

## Миграция существующих типов

### Шаг 1: Определить canonical источник

Для каждого дублирующегося типа выбрать один canonical источник:

```typescript
// ✅ CANONICAL: src/domains/media-management/types/media.ts
export interface MediaFile { /* ... */ }

// ❌ ДУБЛИКАТ: src/domains/ai-services/types/interfaces.ts
// Заменить на реэкспорт
export type { MediaFile } from '@/domains/media-management/types'
```

### Шаг 2: Обновить импорты

```bash
# Найти все использования
grep -r "from.*ai-services/types.*MediaFile" src/

# Заменить на canonical import
# Было:
import type { MediaFile } from '@/domains/ai-services/types'

# Стало:
import type { MediaFile } from '@/domains/media-management/types'
```

### Шаг 3: Добавить deprecated комментарии (опционально)

```typescript
// src/features/old-feature/types/media.ts
/**
 * @deprecated Import from @/domains/media-management/types instead
 * Will be removed in v4.0.0
 */
export type { MediaFile } from '@/domains/media-management/types'
```

## Преимущества архитектуры

### 1. Чёткие границы

- Каждый слой имеет определённую ответственность
- Нет циклических зависимостей
- Легко понять где искать тип

### 2. Переиспользование

- Общие типы в shared - доступны всем
- Canonical источники - нет дублирования
- Реэкспорты в features - удобство для старого кода

### 3. Тестируемость

- Типы изолированы от реализаций
- Mock типы в `core/ports` для DI
- Легко подменять реализации в тестах

### 4. Масштабируемость

- Добавление нового домена - просто создать `types/` папку
- Новый shared тип - добавить в `domains/shared/types/`
- Нет конфликтов имён между доменами

### 5. Совместимость с FEOD

- **Global Layer** (`src/global/types/`) - глобальные type declarations
- **Common Layer** (`src/domains/shared/types/`) - общие типы
- **Modules Layer** (`src/domains/*/types/`) - доменные типы
- **App Layer** (`src/features/*/types/`) - UI типы

## Инструменты и автоматизация

### Type checking

```bash
# Проверка типов
npx tsc --noEmit

# Поиск кросс-фича импортов
grep -r "from.*@/features/.*/types" src/features/ | grep -v "__tests__"
```

### Поиск дубликатов

```bash
# Найти дублирующиеся определения MediaFile
find src -name "*.ts" -exec grep -l "export interface MediaFile" {} \;
```

### ESLint правила (будущее)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['@/features/*/types'],
          message: 'Do not import from other features. Use @/domains/shared/types instead.',
        },
      ],
    }],
  },
}
```

## Best Practices

### 1. Избегайте дублирования

```typescript
// ❌ Плохо: дублирование типа
// src/domains/ai-services/types/media.ts
export interface MediaFile { /* ... */ }

// src/domains/media-management/types/media.ts
export interface MediaFile { /* ... */ }

// ✅ Хорошо: один canonical источник
// src/domains/media-management/types/media.ts
export interface MediaFile { /* ... */ }

// src/domains/ai-services/types/interfaces.ts
export type { MediaFile } from '@/domains/media-management/types'
```

### 2. Используйте реэкспорты в features

```typescript
// ✅ Хорошо: реэкспорт для удобства
// src/features/timeline/types/index.ts
export type {
  TimelineClip,
  Track,
  Section,
} from '@/domains/video-editing/types'

// Теперь можно импортировать из feature (для обратной совместимости)
import type { TimelineClip } from '@/features/timeline/types'
```

### 3. Документируйте canonical источники

```typescript
// src/domains/shared/types/README.md
/**
 * Canonical Type Sources
 *
 * MediaFile → @/domains/media-management/types ✅ CANONICAL
 * ProjectSettings → @/domains/shared/types/project ✅ CANONICAL
 * Resource → @/domains/shared/types/resources ✅ CANONICAL
 */
```

### 4. Избегайте circular dependencies

```typescript
// ❌ Плохо: circular dependency
// shared/types/a.ts
import { TypeB } from './b'
export interface TypeA { b: TypeB }

// shared/types/b.ts
import { TypeA } from './a'
export interface TypeB { a: TypeA }

// ✅ Хорошо: forward declaration или разделение
// shared/types/a.ts
export interface TypeA {
  b: import('./b').TypeB  // forward declaration
}
```

## Дополнительные материалы

- [Domains Overview](domain-architecture/domains-overview.md) - Обзор всех доменов
- [Ports & Adapters](frontend/ports-and-adapters.md) - Hexagonal Architecture
- [FEOD Global Layer](feod-global-layer.md) - Глобальные типы
- [CLAUDE.md](../../CLAUDE.md#организация-типов) - Краткое руководство

## История изменений

### 2025-12-07 - Первичная миграция
- ✅ Создана структура `domains/shared/types/`
- ✅ Мигрированы ProjectSettings → `shared/types/project`
- ✅ Мигрированы Resources → `shared/types/resources`
- ✅ Консолидирован MediaFile → `media-management/types`
- ✅ Обновлена документация

---

*Последнее обновление: 07 декабря 2025*
