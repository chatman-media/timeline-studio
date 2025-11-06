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

### Фаза 2: Упрощение BrowserStateProvider

- [ ] **Задача 2.1**: Упростить `BrowserStateProvider` - убрать дублирование с backend
  - Сохранить localStorage ТОЛЬКО для UX (activeTab, viewMode)
  - Убрать синхронизацию selectedFiles с backend (временное состояние для drag)
  - Упростить debounce логику

### Фаза 3: Переименование для ясности

- [ ] **Задача 3.1**: Переименовать `EffectsProvider` → `BrowserResourcesProvider`
  - Добавить deprecated алиас для обратной совместимости
  - Обновить exports в index.ts

- [ ] **Задача 3.2**: Обновить импорты в `browser.tsx`

- [ ] **Задача 3.3**: Обновить импорты в browser/hooks/use-resources.ts

### Фаза 4: Документация

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

## Статус: В процессе

**Текущая фаза**: Фаза 1 - Подготовка
**Последнее обновление**: 2025-11-06
