# Browser Architecture Refactoring Plan

## Цель
Упростить архитектуру Browser компонента, устранив дублирование источников правды и разделив ответственность между провайдерами.

## Проблемы текущей архитектуры

### 1. Путаница с именованием

**ДВА разных ResourcesProvider:**
- `EffectsProvider` (в browser/providers/) → библиотека ДОСТУПНЫХ ресурсов для Browser
- `ResourcesProvider` (в resources/services/) → ДОБАВЛЕННЫЕ на timeline ресурсы ✅ УЖЕ ПРАВИЛЬНЫЙ

**Проблема:** Неочевидно из названия, что `EffectsProvider` — это про Browser, а не только про эффекты

### 2. BrowserStateProvider дублирует backend

- localStorage хранит выбранные файлы и UI настройки
- Backend также хранит эти данные
- Возможна рассинхронизация
- Слишком много логики синхронизации (500мс debounce + 2сек backend sync)

## Правильная архитектура (как должно быть)

### Принцип: Чёткое разделение ответственности

```
┌────────────────────────────────────────────────────────┐
│ Browser (библиотека доступных ресурсов)                │
│   → BrowserResourcesProvider (был EffectsProvider)    │
│      - Встроенные effects/filters/transitions (JSON)   │
│      - Импортированные media (от backend)              │
├────────────────────────────────────────────────────────┤
│ Resources Panel (добавленные на timeline)              │
│   → ResourcesProvider ✅ УЖЕ ПРАВИЛЬНЫЙ                │
│      - media_pool из backend                           │
│      - Применённые effects/filters                     │
└────────────────────────────────────────────────────────┘
```

### Разделение ответственности

1. **BrowserResourcesProvider** (был EffectsProvider)
   - Загрузка встроенных ресурсов из JSON
   - Получение импортированных медиа от backend
   - Кэширование для производительности
   - ❌ НЕ управляет timeline resources
   - ❌ НЕ управляет UI состоянием

2. **ResourcesProvider** ✅ УЖЕ ПРАВИЛЬНЫЙ
   - Timeline resources из backend (media_pool)
   - Команды для добавления/удаления
   - Кэш метаданных медиа файлов
   - ❌ НЕ загружает встроенные ресурсы
   - ❌ НЕ управляет UI

3. **BrowserUIProvider** (упрощённый BrowserStateProvider)
   - Активный таб, режим просмотра, сортировка
   - Временные выборы файлов (для drag)
   - localStorage ТОЛЬКО для UX (не источник правды)
   - ❌ НЕ хранит данные ресурсов
   - ❌ НЕ дублирует backend для критических данных

---

## План выполнения

### Фаза 1: Анализ и подготовка ✅ ВЫПОЛНЕНО

- [x] **Задача 1.1**: Создать документ с планом рефакторинга
- [x] **Задача 1.2**: Проанализировать ResourcesPanel и убедиться, что ResourcesProvider правильный
- [x] **Задача 1.3**: Понять разницу между Browser (доступные) и Resources Panel (на timeline)

### Фаза 2: Упрощение BrowserStateProvider ✅ ВЫПОЛНЕНО

- [x] **Задача 2.1**: Упростить `BrowserStateProvider` - убрать дублирование с backend
  - ✅ Сохранил localStorage ТОЛЬКО для UX (activeTab, viewMode, tabSettings)
  - ✅ Убрал синхронизацию selectedFiles с backend (временное состояние для drag)
  - ✅ Упростил debounce логику (убрал двойной debounce: 500ms + 2sec)
  - ✅ Результат: -119 строк кода
  - ✅ Файл: `src/features/browser/services/browser-state-provider.tsx`

### Фаза 3: Переименование для ясности ✅ ВЫПОЛНЕНО

- [x] **Задача 3.1**: Переименовать `EffectsProvider` → `BrowserResourcesProvider`
  - ✅ Использовал `git mv` для сохранения истории
  - ✅ Добавил deprecated алиас `EffectsProvider` для обратной совместимости
  - ✅ Создал новый хук `useBrowserResourcesProvider`
  - ✅ Сохранил старый хук `useEffectsProvider` как алиас
  - ✅ Файлы переименованы:
    - `providers/effects-provider.tsx` → `providers/browser-resources-provider.tsx`
    - `types/effects-provider.ts` → `types/browser-resources-provider.ts`

- [x] **Задача 3.2**: Обновить импорты в `browser.tsx`
  - ✅ Обновлен импорт на новый путь

- [x] **Задача 3.3**: Обновить импорты в browser/hooks/use-resources.ts
  - ✅ Обновлены все импорты на новый путь

- [x] **Задача 3.4**: Исправить тесты после переименования
  - ✅ Обновлены импорты в тестах:
    - `browser-tabs.test.tsx`
    - `use-resources.test.tsx`
    - `effects-provider.test.tsx`
  - ✅ Обновлено ожидаемое сообщение об ошибке в тестах
  - ✅ Все 24 тестовых файла browser feature проходят (456 тестов)

### Фаза 4: Документация 🔄 В ПРОЦЕССЕ

- [ ] **Задача 4.1**: Создать diagram с архитектурой Browser vs Resources Panel
- [ ] **Задача 4.2**: Обновить комментарии в коде
- [ ] **Задача 4.3**: Добавить JSDoc с описанием ответственности каждого провайдера

---

## Детальные задачи

### Задача 1.2: Создать ResourcesProvider

**Файл**: `src/features/resources/providers/resources-provider.tsx`

**Изменения**:
1. Переименовать `EffectsProvider` → `ResourcesProvider`
2. Убрать встроенную логику загрузки "built-in" ресурсов
3. Всё получать от backend через `backendSync.onStateChange`
4. Упростить API: убрать источники ("built-in", "local", etc.)
5. Использовать простой интерфейс:
```typescript
interface ResourcesContext {
  media: MediaFile[]
  music: AudioFile[]
  effects: Effect[]
  filters: Filter[]
  transitions: Transition[]
  templates: Template[]
  isLoading: boolean
  addMedia: (file: MediaFile) => Promise<void>
  removeMedia: (id: string) => Promise<void>
}
```

### Задача 1.3: Создать BrowserUIProvider

**Файл**: `src/features/browser/providers/browser-ui-provider.tsx`

**Изменения**:
1. Упростить `BrowserStateProvider`
2. Убрать дублирование с backend
3. localStorage только для UX кэша (не источник правды)
4. Интерфейс:
```typescript
interface BrowserUIContext {
  activeTab: BrowserTab
  viewMode: ViewMode
  sortBy: string
  searchQuery: string
  selectedFiles: Set<string>
  switchTab: (tab: BrowserTab) => void
  setViewMode: (mode: ViewMode) => void
}
```

### Задача 2.1: Обновить browser.tsx

**Файл**: `src/features/browser/components/browser.tsx`

**Изменения**:
```typescript
// Было
<BrowserStateProvider>
  <EffectsProvider>
    <BrowserWithState />
  </EffectsProvider>
</BrowserStateProvider>

// Стало
<ResourcesProvider>
  <BrowserUIProvider>
    <BrowserWithState />
  </BrowserUIProvider>
</ResourcesProvider>
```

### Задача 2.2: Обновить хуки

**Файл**: `src/features/browser/hooks/use-resources.ts`

**Изменения**:
1. Переименовать `useEffectsProvider` → `useResources`
2. Упростить API хуков
3. Убрать параметр `source` из всех хуков
4. Пример:
```typescript
// Было
const { effects } = useEffects("built-in")

// Стало
const { effects } = useResources()
```

---

## Критерии успеха

✅ Backend = единственный источник правды для данных
✅ localStorage используется только для UI кэша (UX)
✅ Нет дублирования состояния
✅ Провайдеры имеют чёткую ответственность
✅ Все существующие компоненты работают
✅ Тесты проходят
✅ Приложение запускается без ошибок

---

## Риски и митигация

### Риск 1: Breaking changes для существующих компонентов
**Митигация**: Создать новые провайдеры параллельно, затем мигрировать постепенно

### Риск 2: Потеря данных из localStorage
**Митигация**: Миграционный скрипт для переноса важных настроек в backend

### Риск 3: Проблемы с производительностью
**Митигация**: Сохранить кэширование в ResourcesProvider

---

## Оценка времени

- Фаза 1: 2 часа
- Фаза 2: 3 часа
- Фаза 3: 1 час
- Фаза 4: 1 час

**Итого**: ~7 часов

---

## Статус: Фазы 1-3 завершены, Фаза 4 в процессе

**Текущая фаза**: Фаза 4 - Документация
**Последнее обновление**: 2025-11-06

---

## Выполненная работа

### Упрощение BrowserStateProvider (Фаза 2)

**Изменения в `src/features/browser/services/browser-state-provider.tsx`:**

1. **Удалена функция `syncBrowserState()`** (-80 строк)
   - Убрана синхронизация UI состояния с backend
   - Убрана сериализация selectedFiles для backend
   - Убран debounce для backend синхронизации (2 сек)

2. **Упрощено взаимодействие с backend**
   - Теперь только мониторинг событий проекта (ProjectCreated, ProjectOpened, ProjectClosed)
   - Очистка временных выборов при изменении проекта
   - Проверка соединения с backend

3. **localStorage используется ТОЛЬКО для UX**
   ```typescript
   // Сохраняются только UI настройки
   const uiSettings = {
     activeTab: state.activeTab,
     tabSettings: state.tabSettings,
   }
   localStorage.setItem("browserSettings", JSON.stringify(uiSettings))
   ```
   - selectedFiles НЕ сохраняются (временное drag состояние)
   - viewMode восстанавливается из tabSettings

4. **Результат**: -119 строк кода, более простая архитектура

### Переименование EffectsProvider (Фаза 3)

**Изменения:**

1. **Файлы переименованы** (с сохранением git истории)
   ```bash
   git mv providers/effects-provider.tsx providers/browser-resources-provider.tsx
   git mv types/effects-provider.ts types/browser-resources-provider.ts
   ```

2. **Обратная совместимость сохранена**
   ```typescript
   // Новые экспорты
   export function useBrowserResourcesProvider(): EffectsProviderContext
   export { EffectsProvider as BrowserResourcesProvider }

   // Deprecated алиасы
   export const useEffectsProvider = useBrowserResourcesProvider
   export { EffectsProvider } // остается для совместимости
   ```

3. **Обновлены сообщения об ошибках**
   ```typescript
   throw new Error("useBrowserResourcesProvider must be used within a BrowserResourcesProvider")
   ```

4. **Обновлены все импорты**
   - Компоненты: `browser.tsx`
   - Хуки: `use-resources.ts`
   - Тесты: 3 тестовых файла

5. **Все тесты проходят**: 24 файла, 456 тестов ✅
