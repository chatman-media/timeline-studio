# Миграция на монорепо с bun workspaces

**Статус:** Planned, tracked in [#150](https://github.com/chatman-media/timeline-studio/issues/150)
**Приоритет:** High
**Создано:** 2025-11-29
**Актуализировано:** 2026-06-07
**Ответственный:** Architecture Team

## 📋 Описание

Разделение проекта на независимые пакеты для улучшения модульности, тестируемости и возможности переиспользования кода. Использование bun workspaces для управления монорепо.

## 🎯 Цели

1. **Независимость UI от адаптеров** - возможность тестировать UI с разными адаптерами (Tauri/Node/Mock)
2. **Переиспользование кода** - использование core и domains в разных приложениях (Desktop, CLI, Web)
3. **Изоляция изменений** - изменения в одном пакете не влияют на другие
4. **Улучшение DX** - более понятная структура и зависимости

## 🏗️ Целевая структура

```
timeline-studio/
├── packages/
│   ├── core/                      # @timeline-studio/core
│   │   ├── ports/                 # Интерфейсы сервисов
│   │   ├── types/                 # Общие типы
│   │   ├── container.ts           # DI контейнер
│   │   └── package.json
│   │
│   ├── domains/                   # @timeline-studio/domains
│   │   ├── ai-director/
│   │   ├── media-management/
│   │   ├── project-management/
│   │   ├── video-editing/
│   │   └── package.json           # зависит от: @timeline-studio/core
│   │
│   ├── adapters/                  # @timeline-studio/adapters
│   │   ├── tauri/
│   │   ├── node/
│   │   ├── mock/
│   │   └── package.json           # зависит от: @timeline-studio/core
│   │
│   └── ui/                        # @timeline-studio/ui
│       ├── features/              # Все features
│       ├── components/            # shadcn/ui компоненты
│       └── package.json           # зависит от: @timeline-studio/core, @timeline-studio/types
│
├── apps/
│   ├── desktop/                   # Desktop Tauri app
│   │   ├── src-tauri/
│   │   ├── src/
│   │   │   └── app/               # Next.js App Router
│   │   └── package.json           # зависит от: ui, domains, adapters
│   │
│   └── cli/                       # CLI приложение
│       └── package.json           # зависит от: core, domains, adapters/node
│
├── package.json                   # Root workspace config
└── bun.lock
```

## 📊 Граф зависимостей

```
apps/desktop → ui + domains + adapters/tauri
apps/cli → domains + adapters/node

ui → core
domains → core
adapters → core
```

**Правило:** UI зависит ТОЛЬКО от core, не знает о domains и adapters напрямую.

## 🔧 Текущие проблемы

### 1. Features напрямую импортирует из domains

```typescript
// ❌ Текущее состояние
// features/transcription/hooks/use-transcription.ts
import { TranscriptionService } from "@/domains/ai-services/services/transcription-service"

// ✅ Должно быть
import { getAI } from "@/core/container"
import type { ITranscriptionService } from "@/core/ports"
```

### 2. Хуки из domains используются в features

```typescript
// ❌ Текущее
import { useMediaManagement } from "@/domains/media-management"

// ✅ Должно быть
import { useMediaManagement } from "@timeline-studio/core"
// или через провайдер в core
```

### 3. Типы разбросаны по domains

Нужно вынести общие типы в `@timeline-studio/core/types`.

## 📝 План миграции

### Phase 1: Подготовка (1-2 дня)

- [ ] Создать структуру workspaces
- [ ] Настроить bun workspaces в `package.json`
- [ ] Создать `package.json` для каждого пакета
- [ ] Настроить TypeScript paths для workspaces

**Конфигурация:**

```json
// package.json (root)
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

```json
// packages/core/package.json
{
  "name": "@timeline-studio/core",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./ports": "./src/ports/index.ts",
    "./types": "./src/types/index.ts"
  }
}
```

### Phase 2: Рефакторинг типов (2-3 дня)

- [ ] Вынести все общие типы в `@timeline-studio/core/types`
- [ ] Обновить импорты типов в domains
- [ ] Обновить импорты типов в features

**Примеры:**

```typescript
// packages/core/types/media.ts
export interface MediaMetadata { ... }
export interface MediaFile { ... }

// packages/domains/media-management/services/media-api.ts
import type { MediaMetadata } from "@timeline-studio/core/types"
```

### Phase 3: Инверсия зависимостей (3-4 дня)

- [ ] Убрать прямые импорты сервисов из domains в features
- [ ] Все сервисы получать через `getXxx()` из core/container
- [ ] Создать провайдеры для хуков domains в core
- [ ] Обновить features для использования через core

**Refactoring pattern:**

```typescript
// ❌ Было
import { TranscriptionService } from "@/domains/ai-services"
const service = new TranscriptionService()

// ✅ Стало
import { getAI } from "@timeline-studio/core"
const service = getAI()
```

### Phase 4: Миграция пакетов (4-5 дней)

- [ ] Переместить `src/core` → `packages/core`
- [ ] Переместить `src/domains` → `packages/domains`
- [ ] Переместить `src/adapters` → `packages/adapters`
- [ ] Переместить `src/features` → `packages/ui`
- [ ] Создать `apps/desktop` с Next.js shell
- [ ] Создать `apps/cli`

### Phase 5: Настройка сборки (2-3 дня)

- [ ] Настроить сборку каждого пакета
- [ ] Обновить Tauri конфигурацию
- [ ] Обновить скрипты `package.json`
- [ ] Проверить hot reload в dev режиме

**Build configuration:**

```json
// packages/ui/package.json
{
  "scripts": {
    "build": "tsc --noEmit && vite build",
    "dev": "vite"
  }
}
```

### Phase 6: Тестирование (2-3 дня)

- [ ] Обновить пути импортов в тестах
- [ ] Запустить все unit тесты (11500+)
- [ ] Запустить Rust тесты
- [ ] Запустить E2E тесты
- [ ] Проверить сборку desktop приложения
- [ ] Проверить CLI

### Phase 7: Документация (1 день)

- [ ] Обновить README пакетов
- [ ] Обновить architecture-overview.md
- [ ] Обновить project-structure.md
- [ ] Добавить migration guide
- [ ] Обновить contributing guide

## ✅ Критерии успеха

1. ✅ UI пакет зависит ТОЛЬКО от core
2. ✅ Можно собрать desktop и CLI независимо
3. ✅ Все тесты проходят
4. ✅ Dev режим работает с hot reload
5. ✅ Production сборка работает
6. ✅ TypeScript компилируется без ошибок
7. ✅ Можно тестировать UI с mock адаптерами изолированно

## 🚧 Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Breaking changes в импортах | Высокая | Высокое | Постепенная миграция, автоматизация через codemod |
| Циклические зависимости | Средняя | Высокое | Строгий контроль через eslint-plugin-import |
| Проблемы с hot reload | Средняя | Среднее | Тестирование на ранних этапах |
| Увеличение времени сборки | Низкая | Среднее | Использование turbo для кеширования |

## 🔄 Автоматизация миграции

### Codemod для импортов

```typescript
// scripts/migrate-imports.ts
import { Project } from "ts-morph"

const project = new Project()
project.addSourceFilesAtPaths("src/**/*.ts")

for (const sourceFile of project.getSourceFiles()) {
  sourceFile.getImportDeclarations().forEach((importDecl) => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue()

    // Заменить @/domains → @timeline-studio/domains
    if (moduleSpecifier.startsWith("@/domains")) {
      importDecl.setModuleSpecifier(
        moduleSpecifier.replace("@/domains", "@timeline-studio/domains")
      )
    }
  })

  sourceFile.save()
}
```

## 📚 Примеры из других проектов

- [Turborepo Kitchen Sink](https://github.com/vercel/turborepo/tree/main/examples/kitchen-sink)
- [tRPC monorepo](https://github.com/trpc/trpc/tree/main/packages)
- [Prisma monorepo](https://github.com/prisma/prisma)

## 📅 Временные рамки

**Оценка:** 15-20 рабочих дней (3-4 недели)

**Breakdown:**
- Phase 1: 2 дня
- Phase 2: 3 дня
- Phase 3: 4 дня
- Phase 4: 5 дней
- Phase 5: 3 дня
- Phase 6: 3 дня
- Phase 7: 1 день

## 🔗 Связанные задачи

- [ ] Настройка Turborepo для кеширования сборки (опционально)
- [ ] Настройка changesets для версионирования пакетов
- [ ] CI/CD для монорепо
- [ ] Storybook для @timeline-studio/ui

## 📖 Дополнительные материалы

- [Bun Workspaces Documentation](https://bun.sh/docs/install/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Hexagonal Architecture Pattern](https://alistair.cockburn.us/hexagonal-architecture/)

---

**Следующие шаги:**
1. Review и обсуждение архитектуры с командой
2. Создание proof-of-concept для одного пакета
3. Утверждение плана миграции
4. Начало Phase 1

---

*Создано: 2025-11-29*
*Обновлено: 2025-11-29*
