# Browser Feature Architecture Refactoring

**Статус:** Planned
**Приоритет:** Medium
**Дата создания:** 2025-11-29
**Оценка времени:** 3-4 дня

## Обзор

Browser feature имеет 19 импортов из domains layer, что нарушает архитектуру Ports & Adapters. Необходимо рефакторить все импорты на использование core layer.

## Текущее состояние

### Статистика нарушений

**Всего нарушений:**
- 17 файлов с прямыми импортами из domains
- 19 импортов (не считая deprecated реэкспорты)
- 24% файлов нарушают архитектуру (17 из 71)

**Распределение по доменам:**
1. `@/domains/project-management/hooks` - 12 импортов
   - `useFavorites` - 11 адаптеров
   - `useMusicFiles`, `useCurrentProject` - 1 файл
2. `@/domains/browser` - 5 импортов
   - `useBrowserState` - 4 компонента
   - `BrowserTab`, `ViewMode` - типы
3. `@/domains/media-management` - 2 файла
   - `useMediaManagement` - 1 адаптер
   - Функции (getMediaFiles, getMetadata, selectFile, selectDirectory) - 1 хук

### Файлы с нарушениями

#### Адаптеры (11 файлов)
```
src/features/browser/adapters/
├── use-style-templates-adapter.tsx    → useFavorites
├── use-subtitles-adapter.tsx          → useFavorites
├── use-music-adapter.tsx              → useFavorites, useMusicFiles
├── use-filters-adapter.tsx            → useFavorites
├── use-templates-adapter.tsx          → useFavorites
├── use-scenarios-adapter.tsx          → useFavorites
├── use-effects-adapter.tsx            → useFavorites
├── use-media-adapter.tsx              → useFavorites, useMediaManagement
├── use-project-templates-adapter.tsx  → useFavorites
└── use-transitions-adapter.tsx        → useFavorites
```

#### Компоненты (5 файлов)
```
src/features/browser/components/
├── browser.tsx                        → useBrowserState, BrowserTab
├── browser-content.tsx                → useBrowserState
├── universal-list.tsx                 → useBrowserState
├── media-toolbar.tsx                  → ViewMode (type)
├── browser-toolbar-wrapper.tsx        → BrowserTab (type)
└── layout/favorite-button.tsx         → useFavorites
```

#### Хуки (1 файл)
```
src/features/browser/hooks/
└── use-music-import.ts                → getMediaFiles, getMediaMetadata,
                                          selectAudioFile, selectMediaDirectory,
                                          useCurrentProject, useMusicFiles
```

#### Legacy файлы (2 файла - уже @deprecated)
```
src/features/browser/services/
├── browser-state-provider.tsx         → BrowserProvider, useBrowser (реэкспорт)
└── browser-state-machine.ts           → BrowserState, BrowserTab (типы)
```

## Целевая архитектура

### Dependency Inversion

```
@/features/browser
    ↓
@/core/container (service locator)
    ↓
@/core/ports/* (interfaces)
    ↑
@/domains/* (implementations)
```

### Новая структура core layer

```typescript
// @/core/hooks/use-browser.ts
export function useBrowser() {
  const service = useDependency('browser')
  return service
}

// @/core/hooks/use-favorites.ts
export function useFavorites() {
  const service = useDependency('favorites')
  return service
}

// @/core/hooks/use-media-management.ts
export function useMediaManagement() {
  const service = useDependency('mediaManagement')
  return service
}

// @/core/hooks/use-current-project.ts
export function useCurrentProject() {
  const service = useDependency('currentProject')
  return service
}

// @/core/hooks/use-music-files.ts
export function useMusicFiles() {
  const service = useDependency('musicFiles')
  return service
}
```

## План рефакторинга

### Фаза 1: Создание core hooks (0.5 дня)

- [ ] Создать `@/core/hooks/use-browser.ts`
- [ ] Создать `@/core/hooks/use-favorites.ts`
- [ ] Создать `@/core/hooks/use-media-management.ts`
- [ ] Создать `@/core/hooks/use-current-project.ts`
- [ ] Создать `@/core/hooks/use-music-files.ts`
- [ ] Добавить экспорты в `@/core/hooks/index.ts`
- [ ] Добавить сервисы в container registration

### Фаза 2: Рефакторинг адаптеров (1 день)

**Все адаптеры используют useFavorites:**

- [ ] `use-style-templates-adapter.tsx`
- [ ] `use-subtitles-adapter.tsx`
- [ ] `use-filters-adapter.tsx`
- [ ] `use-templates-adapter.tsx`
- [ ] `use-scenarios-adapter.tsx`
- [ ] `use-effects-adapter.tsx`
- [ ] `use-project-templates-adapter.tsx`
- [ ] `use-transitions-adapter.tsx`

**Адаптеры с дополнительными зависимостями:**

- [ ] `use-music-adapter.tsx` (useFavorites + useMusicFiles)
- [ ] `use-media-adapter.tsx` (useFavorites + useMediaManagement)

**Паттерн замены:**
```typescript
// Было:
import { useFavorites } from "@/domains/project-management/hooks"

// Стало:
import { useFavorites } from "@/core/hooks"
```

### Фаза 3: Рефакторинг компонентов (1 день)

**Компоненты с useBrowserState:**

- [ ] `browser.tsx`
- [ ] `browser-content.tsx`
- [ ] `universal-list.tsx`

**Компоненты с типами:**

- [ ] `media-toolbar.tsx` (ViewMode type)
- [ ] `browser-toolbar-wrapper.tsx` (BrowserTab type)

**Компоненты с useFavorites:**

- [ ] `layout/favorite-button.tsx`

**Паттерн замены:**
```typescript
// Было:
import { useBrowserState } from "@/domains/browser"
import type { ViewMode, BrowserTab } from "@/domains/browser"

// Стало:
import { useBrowser } from "@/core/hooks"
import type { ViewMode, BrowserTab } from "@/core/types"
```

### Фаза 4: Рефакторинг хуков (1 день)

**use-music-import.ts - сложный случай:**

Текущие импорты:
```typescript
import {
  getMediaFiles,
  getMediaMetadata,
  selectAudioFile,
  selectMediaDirectory
} from "@/domains/media-management"
import {
  useCurrentProject,
  useMusicFiles
} from "@/domains/project-management/hooks"
```

Варианты решения:

**Вариант 1: Создать MediaPort с методами**
```typescript
// @/core/ports/media.port.ts
export interface MediaPort {
  getMediaFiles(): Promise<MediaFile[]>
  getMediaMetadata(path: string): Promise<MediaMetadata>
  selectAudioFile(): Promise<string | null>
  selectMediaDirectory(): Promise<string | null>
}

// @/core/hooks/use-media.ts
export function useMedia() {
  return useDependency<MediaPort>('media')
}
```

**Вариант 2: Wrap functions в хук**
```typescript
// @/core/hooks/use-media-operations.ts
export function useMediaOperations() {
  const service = useDependency('mediaManagement')
  return {
    getMediaFiles: service.getMediaFiles,
    getMediaMetadata: service.getMediaMetadata,
    selectAudioFile: service.selectAudioFile,
    selectMediaDirectory: service.selectMediaDirectory,
  }
}
```

**Рекомендация:** Вариант 1 - создать MediaPort

Задачи:
- [ ] Создать `@/core/ports/media.port.ts` с интерфейсом
- [ ] Создать `@/core/hooks/use-media.ts`
- [ ] Обновить `use-music-import.ts` для использования core hooks

### Фаза 5: Очистка legacy файлов (0.5 дня)

Legacy файлы уже помечены `@deprecated`, но можно удалить если не используются:

- [ ] Проверить использование `browser-state-provider.tsx` (поиск по кодовой базе)
- [ ] Проверить использование `browser-state-machine.ts` (поиск по кодовой базе)
- [ ] Если не используются - удалить
- [ ] Если используются - добавить TODO комментарий с датой удаления

### Фаза 6: Проверка и тестирование (0.5 дня)

- [ ] Запустить `bun run test src/features/browser`
- [ ] Проверить TypeScript компиляцию (`bunx tsc --noEmit`)
- [ ] Запустить приложение и протестировать все вкладки браузера
- [ ] Проверить импорт музыки
- [ ] Проверить drag & drop в Timeline
- [ ] Проверить систему избранного

### Фаза 7: Документация (0.5 дня)

- [ ] Обновить `src/features/browser/README.md`
- [ ] Обновить `src/features/browser/README.ru.md`
- [ ] Добавить примеры использования core hooks
- [ ] Обновить архитектурную диаграмму
- [ ] Задокументировать migration guide

## Автоматическая проверка

```bash
#!/bin/bash
# scripts/check-browser-architecture.sh

echo "🔍 Checking Browser architecture compliance..."

# Check for direct domain imports (excluding deprecated files)
violations=$(grep -r "from \"@/domains/" src/features/browser \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=__tests__ \
  | grep -v "services/browser-state" \
  | wc -l)

if [ "$violations" -gt 0 ]; then
  echo "❌ Found $violations domain imports in browser feature:"
  grep -rn "from \"@/domains/" src/features/browser \
    --include="*.ts" --include="*.tsx" \
    --exclude-dir=__tests__ \
    | grep -v "services/browser-state"
  exit 1
else
  echo "✅ No domain imports found - architecture is clean!"
fi
```

## Порядок работы

1. **Создать core hooks** (Фаза 1)
2. **Рефакторить в параллель:**
   - Адаптеры (Фаза 2) - простые замены
   - Компоненты (Фаза 3) - простые замены
3. **Рефакторить use-music-import** (Фаза 4) - требует создания MediaPort
4. **Очистить legacy** (Фаза 5)
5. **Тестирование** (Фаза 6)
6. **Документация** (Фаза 7)

## Риски и митигация

### Риск 1: Сломается импорт музыки
**Вероятность:** Medium
**Митигация:** Тщательно протестировать use-music-import после рефакторинга

### Риск 2: Сломаются тесты
**Вероятность:** High
**Митигация:** Обновить моки в __tests__ для использования core hooks

### Риск 3: Регрессия в системе избранного
**Вероятность:** Low
**Митигация:** Протестировать избранное для всех типов ресурсов

## Чеклист по завершению

- [ ] Все файлы используют `@/core/hooks` вместо `@/domains/*`
- [ ] MediaPort создан с полным интерфейсом
- [ ] Все тесты проходят (535 тестов)
- [ ] TypeScript компилируется без ошибок
- [ ] Приложение работает корректно
- [ ] Документация обновлена
- [ ] Скрипт проверки архитектуры выполняется успешно

## Оценка времени

- Фаза 1: 0.5 дня (создание core hooks)
- Фаза 2: 1 день (10 адаптеров)
- Фаза 3: 1 день (6 компонентов)
- Фаза 4: 1 день (use-music-import + MediaPort)
- Фаза 5: 0.5 дня (очистка legacy)
- Фаза 6: 0.5 дня (тестирование)
- Фаза 7: 0.5 дня (документация)

**Итого: 5 дней**

При параллельной работе (Фазы 2-3 одновременно):
**Оптимизированная оценка: 4 дня**

## Связанные задачи

- `ai-features-architecture-refactoring.md` - аналогичный рефакторинг для AI модулей
- Создание `@/core/hooks` layer
- Создание `@/core/ports/media.port.ts`

## Примечания

- Browser feature имеет лучшую архитектуру чем AI features (меньше нарушений)
- Legacy файлы уже помечены @deprecated - хороший пример для других модулей
- Основная проблема - массовое использование useFavorites (11 файлов)
- use-music-import требует особого внимания - много прямых вызовов функций
