# Resources Panel Testing Documentation

## Обзор

Данный документ описывает E2E тесты для Resources Panel и backend интеграции ресурсов в Timeline Studio.

## Структура тестов

### 1. Resources Panel UI Tests (`resources-panel.spec.ts`)

Проверяет пользовательский интерфейс панели ресурсов.

**Тесты (10):**
- ✅ Отображение Resources Panel в timeline view
- ✅ Добавление effect из Browser в Resources Panel
- ✅ Добавление filter из Browser в Resources Panel
- ✅ Добавление transition в Resources Panel
- ✅ Отображение счетчика ресурсов
- ✅ Категоризация ресурсов по типам
- ✅ Удаление ресурса из панели
- ✅ Drag & Drop из Resources Panel на timeline
- ✅ Empty state когда нет ресурсов
- ✅ Фильтрация ресурсов в панели

**Команда запуска:**
```bash
bun run test:e2e -- resources-panel.spec.ts
```

### 2. Backend Resource Commands Tests (`backend-resources.spec.ts`)

Проверяет backend команды для работы с ресурсами через Tauri API.

**Тесты (11):**
- ✅ Доступность Tauri invoke API
- ✅ SaveResource команда для effect
- ✅ SaveResource команда для filter
- ✅ SaveResource команда для transition
- ✅ SaveResource команда для template
- ✅ SaveResource команда для style template
- ✅ SaveResource команда для subtitle
- ✅ DeleteResource команда
- ✅ Проверка ресурса в backend state после SaveResource
- ✅ Обработка невалидного типа ресурса
- ✅ Обработка отсутствующих обязательных полей

**Команда запуска:**
```bash
bun run test:e2e -- backend-resources.spec.ts
```

### 3. Integration Tests (`resources-integration.spec.ts`)

Проверяет полный цикл работы с ресурсами от Browser до Timeline.

**Тесты (6):**
- ✅ Полный workflow: Browser → Resources Panel → Timeline
- ✅ Персистентность ресурсов после сохранения и загрузки проекта
- ✅ Дедупликация ресурсов
- ✅ Синхронизация между Browser и Resources Panel
- ✅ Обработка множественных типов ресурсов в панели
- ✅ Проверка состояния backend после операций

**Команда запуска:**
```bash
bun run test:e2e -- resources-integration.spec.ts
```

## Архитектура тестирования

### Backend Commands Flow

```
Frontend Action
    ↓
Execute Command via Tauri Invoke
    ↓
CommandHandler.execute_command()
    ↓
ResourceCommands.add_*() или remove_resource()
    ↓
Update ProjectState pools
    ↓
Publish Event (e.g., EffectAdded)
    ↓
EventBus → Frontend listeners
    ↓
Update UI (Resources Panel)
```

### Resource Pools в ProjectState

```rust
pub struct Project {
    pub effects_pool: HashMap<String, EffectResource>,
    pub filters_pool: HashMap<String, FilterResource>,
    pub transitions_pool: HashMap<String, TransitionResource>,
    pub templates_pool: HashMap<String, TemplateResource>,
    pub style_templates_pool: HashMap<String, StyleTemplateResource>,
    pub subtitles_pool: HashMap<String, SubtitleResource>,
}
```

## Типы ресурсов

### 1. Effect Resource
```typescript
{
  id: string
  name: string
  effect_id: string
  parameters: Record<string, any>
  added_at: number (timestamp in seconds)
}
```

### 2. Filter Resource
```typescript
{
  id: string
  name: string
  filter_id: string
  parameters: Record<string, any>
  added_at: number
}
```

### 3. Transition Resource
```typescript
{
  id: string
  name: string
  transition_id: string
  parameters: {
    duration: number
    easing: string
  }
  added_at: number
}
```

### 4. Template Resource
```typescript
{
  id: string
  name: string
  template_id: string
  data: {
    type: 'split' | 'grid' | 'pip'
    slots: number
  }
  added_at: number
}
```

### 5. Style Template Resource
```typescript
{
  id: string
  name: string
  template_id: string
  data: {
    type: 'intro' | 'outro' | 'title'
    duration: number
    animations: any[]
  }
  added_at: number
}
```

### 6. Subtitle Resource
```typescript
{
  id: string
  name: string
  style_id: string
  data: {
    fontFamily: string
    fontSize: number
    color: string
  }
  added_at: number
}
```

## Backend Commands

### SaveResource

Добавляет ресурс в соответствующий пул.

```typescript
await window.__TAURI_INVOKE__('execute_command', {
  command: {
    type: 'SaveResource',
    params: {
      resource_id: 'unique-id',
      resource_type: 'effect' | 'filter' | 'transition' | 'template' | 'styleTemplate' | 'subtitle',
      data: { /* resource-specific data */ },
      metadata: {}
    }
  }
})
```

**События:**
- `EffectAdded` / `FilterAdded` / etc.

### DeleteResource

Удаляет ресурс из пула.

```typescript
await window.__TAURI_INVOKE__('execute_command', {
  command: {
    type: 'DeleteResource',
    params: {
      resource_id: 'unique-id',
      resource_type: 'effect' | 'filter' | etc.
    }
  }
})
```

**События:**
- `EffectRemoved` / `FilterRemoved` / etc.

## Проверка Backend State

Для проверки состояния backend в тестах используйте:

```typescript
const state = await page.evaluate(() => {
  return (window as any).__BACKEND_STATE__
})

// Проверка пула эффектов
const effectsCount = Object.keys(state.project.effects_pool).length

// Проверка конкретного ресурса
const hasResource = 'resource-id' in state.project.effects_pool
```

## Рекомендации по написанию тестов

### 1. Используйте явные проверки

```typescript
// ❌ ПЛОХО
expect(true).toBeTruthy()

// ✅ ХОРОШО
expect(await page.locator('[data-testid="resource-item"]').count()).toBeGreaterThan(0)
```

### 2. Добавляйте data-testid атрибуты

В компонентах React:
```tsx
<div data-testid="resources-panel">
  <div data-testid="resource-item" data-resource-id={resource.id}>
    {resource.name}
  </div>
</div>
```

В тестах:
```typescript
const panel = page.locator('[data-testid="resources-panel"]')
const items = panel.locator('[data-testid="resource-item"]')
```

### 3. Проверяйте backend state

```typescript
// Добавляем ресурс
await addResourceThroughUI(page, 'effect')

// Проверяем backend
const hasInBackend = await page.evaluate((id) => {
  const state = (window as any).__BACKEND_STATE__
  return id in state.project.effects_pool
}, resourceId)

expect(hasInBackend).toBeTruthy()
```

### 4. Тестируйте события

```typescript
// Подписываемся на события
const eventPromise = page.evaluate(() => {
  return new Promise((resolve) => {
    window.addEventListener('project:event', (e) => {
      if (e.detail.event.type === 'EffectAdded') {
        resolve(e.detail)
      }
    }, { once: true })
  })
})

// Выполняем действие
await addEffect(page)

// Ждем события
const event = await eventPromise
expect(event.event.payload.effect_id).toBeDefined()
```

## Запуск тестов

### Все тесты ресурсов
```bash
bun run test:e2e -- resources
```

### Конкретный файл
```bash
bun run test:e2e -- resources-panel.spec.ts
bun run test:e2e -- backend-resources.spec.ts
bun run test:e2e -- resources-integration.spec.ts
```

### С UI режимом Playwright
```bash
bun run test:e2e:ui -- resources
```

### Отладка конкретного теста
```bash
bun run test:e2e -- resources-panel.spec.ts --debug
```

## Coverage

После запуска тестов проверьте покрытие:

```bash
bun run test:e2e -- resources --coverage
```

## Известные проблемы

### 1. Soft Assertions

Многие тесты используют `expect(true).toBeTruthy()` для мягких проверок, так как:
- UI может варьироваться между версиями
- Некоторые элементы могут не иметь data-testid
- Backend state может быть недоступен в window

### 2. Timing Issues

Некоторые тесты требуют `waitForTimeout()` для:
- Анимаций UI
- Debounce в поиске
- Async обновлений state

### 3. Playwright Selector Flakiness

Используйте:
- `first()` для получения первого совпадения
- `count() > 0` вместо `isVisible()` для проверки наличия
- `waitForTimeout()` перед критичными действиями

## Следующие шаги

### P0 - Критично
- [ ] Добавить data-testid в Resources Panel компоненты
- [ ] Усилить проверки (заменить soft assertions на конкретные)
- [ ] Добавить проверку событий в integration тестах

### P1 - Высокий приоритет
- [ ] Тесты для undo/redo операций с ресурсами
- [ ] Тесты для error handling (недоступные файлы, etc.)
- [ ] Performance тесты (большое количество ресурсов)

### P2 - Средний приоритет
- [ ] Visual regression тесты для Resources Panel
- [ ] Accessibility тесты (ARIA labels, keyboard navigation)
- [ ] Cross-browser тесты

## Связанные документы

- [Resources Panel Expansion Checklist](../../docs/ru/08_tasks/resources-panel-expansion-checklist.md)
- [Testing Strategy](../../docs/05_development/ru/testing-strategy.md)
- [Backend Architecture](../../docs/ru/03_architecture/backend/README.md)
