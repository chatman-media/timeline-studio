# Архитектура синхронизации - Краткое резюме

## TL;DR

**Backend = источник истины. События = обновления. XState = кэш.**

## Как это работает

```typescript
// 1. User нажал кнопку
onClick={() => switchTab("effects")}

// 2. Provider вызывает команду
await commands.browserSwitchTab("effects")

// 3. Backend обновляет состояние + публикует событие
state.browser_state.active_tab = "effects"
event_bus.publish(TabSwitched { tab: "effects" })

// 4. Frontend получает событие через Tauri
listen("project:event", handleEvent)

// 5. Provider отправляет в машину
browserActor.send({ type: "BACKEND_EVENT", event })

// 6. Машина обновляет контекст
assign({ activeTab: "effects" })

// 7. React перерисовывается
useSelector() → re-render
```

## Два режима

### Mode 1: Pure Event-Driven (медленные операции)
```typescript
// Импорт медиа, экспорт, рендеринг
const importMedia = async (path: string) => {
  // НЕ обновляем UI
  await commands.addImportedMedia(path)
  // Ждём события ImportedMediaAdded
  // Только тогда UI обновится
}
```

### Mode 2: Optimistic Updates (быстрые операции)
```typescript
// Переключение вкладок, сортировка
const switchTab = async (tab: BrowserTab) => {
  // Сразу обновляем UI
  browserActor.send({ type: "SWITCH_TAB", tab })

  // Backend подтвердит или перезапишет
  await commands.browserSwitchTab(tab)
}
```

## Компоненты системы

### 1. Backend (Rust)
```rust
// Состояние
ProjectState {
  browser_state,
  timeline_state,
  player_state,
  version
}

// Команда → Изменение + Событие
fn browser_switch_tab(tab) {
  state.active_tab = tab;  // Обновили
  publish(TabSwitched);     // Уведомили
}
```

### 2. BackendSync (TypeScript)
```typescript
// Транспорт событий
class BackendSync {
  // Подписка на Tauri
  connect() {
    listen("project:event", this.handleEvent)
  }

  // Распространение событий
  handleEvent(event) {
    this.eventHandlers.forEach(h => h(event))
  }

  // API
  onEvent(handler) { ... }
  getProjectState() { ... } // Только для инициализации!
}
```

### 3. Domain Provider (React)
```typescript
// Получает события и отправляет в машину
useEffect(() => {
  const unsub = backendSync.onEvent(event => {
    if (event.type === "Browser") {
      browserActor.send({
        type: "BACKEND_EVENT",
        event: event.payload
      })
    }
  })
}, [])
```

### 4. XState Machine
```typescript
// Локальный кэш backend состояния
on: {
  BACKEND_EVENT: {
    actions: assign(({ event }) => {
      // Инкрементально обновляем context
      return handleBackendEvent(context, event)
    })
  }
}
```

### 5. React Components
```typescript
// Читают из машины через useSelector
const activeTab = useSelector(
  browserActor,
  state => state.context.activeTab
)
```

## Правила

1. ✅ **Backend - единственный источник истины**
   - Вся бизнес-логика в Rust
   - Frontend только отображает

2. ✅ **События - единственный способ обновления**
   - НЕ fetch полного состояния после команды
   - Событие уже содержит всё нужное

3. ✅ **XState - кэш backend состояния**
   - Обновляется только через события
   - НЕ прямые мутации context

4. ✅ **Optimistic updates - опционально**
   - Только для UX критичных операций
   - Backend событие может перезаписать

5. ❌ **BackendSync НЕ синхронизирует состояние**
   - Только транспорт событий
   - getProjectState() только для init

## Что убрать

```typescript
// ❌ Удалить из BackendSync
private handleBackendEvent(envelope) {
  this.eventHandlers.forEach(h => h(envelope.event))

  // ❌ УДАЛИТЬ ЭТО!
  await this.fetchAndNotifyState()
}

// ❌ Удалить оптимистичные обновления там, где не нужны
const setSort = async (by, order) => {
  // ❌ УДАЛИТЬ
  browserActor.send({ type: "SET_SORT", by, order })

  // ✅ Только команда
  await commands.browserSetSort(by, order)
  // Backend пришлет SortChanged
}
```

## Что добавить

```typescript
// ✅ Полные данные в события
ImportedMediaAdded {
  media_id: "123",
  path: "/path/to/file.mp4",
  media_type: Video,
  duration: 120.5,
  // ВСЕ данные, чтобы не fetch!
}

// ✅ Обработчик использует данные из события
handleImportedMediaAdded(context, event) {
  return {
    importedMedia: [
      ...context.importedMedia,
      {
        id: event.data.media_id,
        path: event.data.path,
        // ... все из события
      }
    ]
  }
}
```

## Пример: Browser Tab Switching

### Текущая (правильная) реализация

```typescript
// 1. Provider
const switchTab = async (tab: BrowserTab) => {
  // Оптимистично обновляем
  browserActor.send({ type: "SWITCH_TAB", tab })

  // Отправляем команду
  await commands.browserSwitchTab(tab)

  // Backend пришлет TabSwitched для подтверждения
}

// 2. Machine
on: {
  SWITCH_TAB: {
    // Локальное обновление
    actions: assign({ activeTab: event.tab })
  },
  BACKEND_EVENT: {
    // Backend может перезаписать
    actions: "handleBackendEvent"
  }
}

// 3. Backend Event Handler
function handleTabSwitched(context, event) {
  return {
    activeTab: event.data.tab
  }
}
```

## Диаграмма потока

```
┌─────────────┐
│   User      │
│   Click     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  Provider.switchTab()   │
│  1. Optimistic update   │ ──────┐
│  2. Send command        │       │ Мгновенно
└──────┬──────────────────┘       │
       │                          ▼
       │                   ┌──────────────┐
       │                   │  UI Update   │
       │                   └──────────────┘
       ▼
┌─────────────────────────┐
│  Backend Command        │
│  1. Update state        │
│  2. Publish event       │
└──────┬──────────────────┘
       │
       │ ~10-50ms
       ▼
┌─────────────────────────┐
│  Tauri Event Bus        │
│  "project:event"        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  BackendSync            │
│  Forward to providers   │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Provider.onEvent()     │
│  Send BACKEND_EVENT     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  XState Machine         │
│  assign(context)        │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  useSelector()          │
│  Re-render if changed   │
└─────────────────────────┘
```

## Инициализация

```typescript
useEffect(() => {
  // 1. Подписываемся на события
  const unsubEvents = backendSync.onEvent(handleEvent)

  // 2. Подписываемся на state changes (только для init!)
  const unsubState = backendSync.onStateChange(state => {
    // Конвертируем начальное состояние в события
    Object.entries(state.browser_state.tab_settings).forEach(([tab, settings]) => {
      browserActor.send({
        type: "BACKEND_EVENT",
        event: { event_type: "SortChanged", data: { tab, ...settings } }
      })
    })
  })

  // 3. Получаем начальное состояние (один раз!)
  backendSync.getProjectState()

  return () => {
    unsubEvents()
    unsubState()
  }
}, [])
```

## Итог

**Правильная архитектура:**
- Backend хранит состояние
- Команды изменяют состояние
- События уведомляют об изменениях
- XState кэширует состояние локально
- React отображает из кэша

**Неправильная архитектура:**
- Frontend хранит своё состояние
- После команды fetch полного состояния
- BackendSync синхронизирует состояние
- Смешанные источники истины
- Рассинхронизации и конфликты
