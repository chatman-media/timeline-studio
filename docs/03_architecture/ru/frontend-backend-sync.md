# Архитектура синхронизации Frontend ↔ Backend

## Текущая проблема

Сейчас в коде смешаны разные подходы:
- ✅ XState машины для локального состояния
- ✅ Backend команды через Tauri
- ✅ Backend события через Event Bus
- ❌ BackendSync сервис (получает полное состояние)
- ❌ Оптимистичные обновления (локально + backend)
- ❌ Неясно, кто источник истины

**Результат:** Непонятно, откуда берется состояние и как оно обновляется.

## Идеальная архитектура: Command-Event Sourcing

### Принцип: Backend - единственный источник истины

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │   React UI   │────────▶│ XState       │                  │
│  │  Components  │         │ Machine      │                  │
│  └──────────────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │ User Action            │ State                    │
│         ▼                        │                           │
│  ┌──────────────┐                │                          │
│  │   Actions    │                │                          │
│  │  (commands)  │                │                          │
│  └──────┬───────┘                │                          │
│         │                        │                           │
│         │ async command()        │                          │
│         ▼                        │                           │
│  ┌─────────────────────────────────────┐                    │
│  │      Tauri Commands                 │                    │
│  │  browserSwitchTab(tab)              │                    │
│  │  browserSetSort(by, order)          │                    │
│  │  timelineAddClip(...)               │                    │
│  └─────────────┬───────────────────────┘                    │
│                │                        ▲                    │
│                │ invoke                 │ listen             │
└────────────────┼────────────────────────┼────────────────────┘
                 │                        │
                 ▼                        │
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND (Rust)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Command Handler                          │   │
│  │  1. Валидация команды                                │   │
│  │  2. Обновление ProjectState                          │   │
│  │  3. Публикация события в EventBus                    │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             ProjectState                             │   │
│  │  - browser_state: BrowserState                       │   │
│  │  - timeline_state: TimelineState                     │   │
│  │  - player_state: PlayerState                         │   │
│  │  - version: u64                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             EventBus                                 │   │
│  │  publish(ProjectEvent) ───▶ Tauri Events            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                 │
                 │ event: "project:event"
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Events)                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        BackendSync Service                           │   │
│  │  listen("project:event", handleEvent)                │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                            │
│                 │ notify subscribers                         │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Domain Providers                              │   │
│  │  - BrowserProvider                                   │   │
│  │  - TimelineProvider                                  │   │
│  │  - PlayerProvider                                    │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                            │
│                 │ send(BACKEND_EVENT)                        │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        XState Machine                                │   │
│  │  on: {                                               │   │
│  │    BACKEND_EVENT: {                                  │   │
│  │      actions: ["handleBackendEvent"]                 │   │
│  │    }                                                  │   │
│  │  }                                                    │   │
│  └──────────────┬───────────────────────────────────────┘   │
│                 │                                            │
│                 │ assign(context updates)                    │
│                 ▼                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        React Components                              │   │
│  │  const state = useSelector(actor)                    │   │
│  │  → re-render                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Поток данных

### 1. User Action → Command → Event → State Update

```typescript
// 1. User clicks button
<button onClick={() => switchTab("effects")}>Effects</button>

// 2. Provider вызывает команду
const switchTab = async (tab: BrowserTab) => {
  const { commands } = await import("@/types/generated/tauri-bindings")
  const result = await commands.browserSwitchTab(tab)

  if (result.status === "error") {
    throw new Error(result.error)
  }
  // НЕ обновляем локальное состояние!
  // Ждём события от backend
}

// 3. Backend обрабатывает команду
async fn browser_switch_tab(tab: BrowserTab) -> CommandResult {
  let mut state = self.state.write().await;
  state.browser_state.switch_tab(tab.clone()); // Обновляем состояние

  // Публикуем событие
  self.event_bus.publish(
    ProjectEvent::Browser(BrowserEvent::TabSwitched { tab }),
    version
  ).await;

  CommandResult::success()
}

// 4. Frontend получает событие через Tauri
listen("project:event", (envelope) => {
  backendSync.handleBackendEvent(envelope)
})

// 5. BackendSync уведомляет подписчиков
handleBackendEvent(envelope: EventEnvelope) {
  this.eventHandlers.forEach(handler => {
    handler(envelope.event) // BrowserEvent::TabSwitched
  })
}

// 6. BrowserProvider обрабатывает событие
useEffect(() => {
  const unsubscribe = backendSync.onEvent(event => {
    if (event.type === "Browser") {
      browserActor.send({
        type: "BACKEND_EVENT",
        event: event.payload
      })
    }
  })
}, [])

// 7. XState машина обновляет контекст
actions: {
  handleBackendEvent: assign(({ context, event }) => {
    if (event.type !== "BACKEND_EVENT") return context

    // Делегируем в event handler
    const updates = handleBrowserBackendEvent(context, event.event)
    return { ...context, ...updates }
  })
}

// 8. React компонент перерисовывается
const activeTab = useSelector(browserActor, state => state.context.activeTab)
// activeTab изменился → re-render
```

## Два варианта работы

### Вариант A: Pure Event-Driven (рекомендуется)

**Принцип:** Frontend НИКОГДА не обновляет локальное состояние напрямую. Только через backend события.

**Плюсы:**
- ✅ Единственный источник истины (backend)
- ✅ Невозможны рассинхронизации
- ✅ Автоматическая синхронизация между вкладками/окнами
- ✅ Простая логика - команда → событие → обновление

**Минусы:**
- ❌ Задержка UI (ждём roundtrip backend → frontend)
- ❌ Требуется сетевое соединение (для будущего cloud sync)

**Реализация:**
```typescript
const switchTab = async (tab: BrowserTab) => {
  // 1. Отправляем команду на backend
  const result = await commands.browserSwitchTab(tab)

  if (result.status === "error") {
    throw new Error(result.error)
  }

  // 2. НЕ обновляем локально!
  // 3. Backend пришлет событие TabSwitched
  // 4. Событие обновит машину автоматически
}
```

### Вариант B: Optimistic Updates + Event Reconciliation (текущий)

**Принцип:** Frontend обновляет состояние локально (оптимистично), но backend событие может перезаписать.

**Плюсы:**
- ✅ Мгновенный отклик UI
- ✅ Работает без сети (для offline-first)
- ✅ Лучший UX

**Минусы:**
- ❌ Возможны конфликты (локальное vs backend)
- ❌ Сложнее логика (нужна reconciliation)
- ❌ Может быть "мерцание" UI при перезаписи

**Реализация:**
```typescript
const switchTab = async (tab: BrowserTab) => {
  // 1. Оптимистичное обновление локально
  browserActor.send({ type: "SWITCH_TAB", tab })

  try {
    // 2. Отправляем команду на backend
    const result = await commands.browserSwitchTab(tab)

    if (result.status === "error") {
      // 3. Откатываем при ошибке
      browserActor.send({ type: "SET_ERROR", error: result.error })
      // Backend пришлет корректное состояние
      throw new Error(result.error)
    }

    // 4. Backend пришлет TabSwitched для подтверждения
    // Если оно отличается - перезапишет локальное
  } catch (err) {
    throw err
  }
}

// В машине два обработчика:
on: {
  // Локальное оптимистичное обновление
  SWITCH_TAB: {
    actions: assign(({ event }) => ({
      activeTab: event.tab
    }))
  },

  // Backend событие (может перезаписать)
  BACKEND_EVENT: {
    actions: "handleBackendEvent"
  }
}
```

## Инициализация состояния

### Проблема
При первой загрузке нужно получить начальное состояние из backend.

### Решение: Синхронизация через события

```typescript
useEffect(() => {
  // 1. Подписываемся на backend события
  const unsubscribeEvents = backendSync.onEvent(handleBackendEvent)

  // 2. Подписываемся на state changes для инициализации
  const unsubscribeState = backendSync.onStateChange((state) => {
    if (state?.browser_state) {
      // Конвертируем начальное состояние в события
      Object.entries(state.browser_state.tab_settings).forEach(([tab, settings]) => {
        // Генерируем события для каждой настройки
        browserActor.send({
          type: "BACKEND_EVENT",
          event: {
            event_type: "SortChanged",
            data: { tab, sort_by: settings.sort_by, sort_order: settings.sort_order }
          }
        })
        // ... остальные настройки
      })
    }
  })

  // 3. Получаем начальное состояние (только при mount)
  backendSync.getProjectState().then(state => {
    // Начальное состояние обработается через onStateChange
  })

  return () => {
    unsubscribeEvents()
    unsubscribeState()
  }
}, [])
```

## BackendSync: Что он должен делать?

### Текущая реализация (правильная)

```typescript
class BackendSync {
  private eventHandlers = new Set<EventHandler>()
  private stateChangeHandlers = new Set<StateChangeHandler>()

  // 1. Подписка на Tauri события
  async connect() {
    this.unlisten = await listen<EventEnvelope>("project:event", (event) => {
      this.handleBackendEvent(event.payload)
    })
  }

  // 2. Распространение событий подписчикам
  private handleBackendEvent(envelope: EventEnvelope) {
    this.eventHandlers.forEach(handler => {
      handler(envelope.event) // ProjectEvent
    })
  }

  // 3. API для подписки
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  // 4. Получение полного состояния (только для инициализации!)
  async getProjectState(): Promise<ProjectState> {
    return commands.getProjectState()
  }
}
```

### ❌ Что НЕ нужно делать

```typescript
// ❌ НЕ НУЖНО автоматически fetch состояние после каждого события
private handleBackendEvent(envelope: EventEnvelope) {
  this.eventHandlers.forEach(handler => handler(envelope.event))

  // ❌ ЭТО НЕПРАВИЛЬНО!
  await this.fetchAndNotifyState() // Лишний roundtrip!
}

// ❌ НЕ НУЖНО синхронизировать полное состояние
private async fetchAndNotifyState() {
  const state = await this.getProjectState()
  this.stateChangeHandlers.forEach(handler => handler(state))
}
```

### ✅ Что нужно

```typescript
// ✅ События - это инкрементальные обновления
private handleBackendEvent(envelope: EventEnvelope) {
  // Просто передаём событие подписчикам
  this.eventHandlers.forEach(handler => {
    handler(envelope.event)
  })

  // Полное состояние НЕ нужно!
  // Событие уже содержит всю информацию для обновления
}
```

## Рекомендация: Hybrid подход

Используем **Optimistic Updates** для лучшего UX, но с четкими правилами:

### 1. Быстрые операции → Optimistic

```typescript
// Переключение вкладок, сортировка, фильтрация
const switchTab = async (tab: BrowserTab) => {
  // Оптимистично обновляем
  browserActor.send({ type: "SWITCH_TAB", tab })

  // Backend подтвердит или перезапишет
  await commands.browserSwitchTab(tab)
}
```

### 2. Медленные операции → Pure Event-Driven

```typescript
// Импорт медиа, рендеринг, экспорт
const importMedia = async (path: string) => {
  // НЕ обновляем локально
  // Показываем loading
  setIsImporting(true)

  // Ждём команды и события
  await commands.addImportedMedia(path)

  // Backend пришлет ImportedMediaAdded
  // Событие обновит список медиа
}
```

### 3. Критичные операции → Pure Event-Driven + Confirmation

```typescript
// Удаление, перемещение клипов на таймлайне
const deleteClip = async (clipId: string) => {
  // Показываем confirmation
  const confirmed = await showConfirmDialog()
  if (!confirmed) return

  // НЕ удаляем локально
  await commands.deleteClip(clipId)

  // Backend пришлет ClipDeleted
  // Только тогда обновим UI
}
```

## Правила работы с состоянием

### 1. XState Machine - локальный кэш backend состояния

```typescript
// Machine context = кэш ProjectState
context: {
  activeTab: "media",        // из browser_state.active_tab
  tabSettings: {...},        // из browser_state.tab_settings
  selectedFiles: {...},      // из browser_state.selected_files
}

// Обновляется ТОЛЬКО через события
on: {
  BACKEND_EVENT: {
    actions: "handleBackendEvent" // assign новые значения
  }
}
```

### 2. Backend - единственный источник истины

```rust
// ProjectState - master state
pub struct ProjectState {
    pub browser_state: BrowserState,
    pub timeline_state: TimelineState,
    pub player_state: PlayerState,
    pub version: u64,
}

// Обновляется через команды
async fn browser_switch_tab(tab: BrowserTab) {
    state.browser_state.switch_tab(tab); // Обновили
    event_bus.publish(BrowserEvent::TabSwitched { tab }); // Уведомили
}
```

### 3. Команды - мутации состояния

```typescript
// Команда = запрос на изменение
await commands.browserSwitchTab(tab)

// Успех = изменение применено
// Ошибка = изменение отклонено
```

### 4. События - уведомления об изменениях

```typescript
// Событие = факт изменения
BrowserEvent::TabSwitched { tab: "effects" }

// Обрабатываем событие = синхронизируем кэш
```

## Миграция текущего кода

### Шаг 1: Удалить оптимистичные обновления там, где не нужны

```typescript
// ❌ Было
const setSort = async (sortBy: string, sortOrder: "asc" | "desc") => {
  browserActor.send({ type: "SET_SORT", sortBy, sortOrder }) // Оптимистично
  await commands.browserSetSort(sortBy, sortOrder)
}

// ✅ Стало
const setSort = async (sortBy: string, sortOrder: "asc" | "desc") => {
  // НЕ обновляем локально
  await commands.browserSetSort(sortBy, sortOrder)
  // Backend пришлет SortChanged событие
}
```

### Шаг 2: Убрать fetchAndNotifyState из BackendSync

```typescript
// ❌ Было
private handleBackendEvent(envelope: EventEnvelope) {
  this.eventHandlers.forEach(handler => handler(envelope.event))

  if (this.isImportedMediaEvent(envelope.event)) {
    await this.fetchAndNotifyState() // Убрать!
  }
}

// ✅ Стало
private handleBackendEvent(envelope: EventEnvelope) {
  // Просто распространяем событие
  this.eventHandlers.forEach(handler => handler(envelope.event))

  // Событие уже содержит всю нужную информацию!
}
```

### Шаг 3: Использовать события для ImportedMedia

```typescript
// Вместо fetch состояния после события ImportedMediaAdded:

// 1. Backend уже присылает событие с данными
ImportedMediaAdded {
  media_id: "123",
  path: "/path/to/file.mp4",
  media_type: Video,
  // ... все нужные данные
}

// 2. Обработчик события добавляет в локальный массив
handleImportedMediaAdded(context, event) {
  return {
    importedMedia: [...context.importedMedia, {
      id: event.data.media_id,
      path: event.data.path,
      type: event.data.media_type,
      // ...
    }]
  }
}
```

## Итоговая архитектура

```
User Action
    │
    ▼
Command (async)
    │
    ▼
Backend State Update
    │
    ▼
Event Publication
    │
    ▼
Tauri Event Bus
    │
    ▼
BackendSync.handleEvent()
    │
    ▼
Provider.onEvent()
    │
    ▼
Machine.send(BACKEND_EVENT)
    │
    ▼
assign(context updates)
    │
    ▼
useSelector re-render
    │
    ▼
UI Update
```

**Ключевые принципы:**
1. ✅ Backend - единственный источник истины
2. ✅ События - единственный способ обновления frontend состояния
3. ✅ XState - локальный кэш backend состояния
4. ✅ Optimistic updates - опционально, для лучшего UX
5. ✅ BackendSync - транспорт событий, НЕ sync состояния

## Следующие шаги

1. ✅ **Сохранить** оптимистичные обновления для быстрых операций (switchTab, setSort)
2. ❌ **Удалить** fetchAndNotifyState из BackendSync
3. ✅ **Использовать** только события для инкрементальных обновлений
4. ✅ **Добавить** полные данные в события (чтобы не fetch состояние)
5. ✅ **Документировать** какие операции optimistic, какие pure event-driven
