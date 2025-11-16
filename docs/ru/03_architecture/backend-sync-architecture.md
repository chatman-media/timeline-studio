# Архитектура синхронизации Frontend-Backend

## Обзор

Timeline Studio использует **Command-Event Pattern** для синхронизации состояния между React фронтендом и Rust бэкендом.

## Ключевые принципы

### 1. Single Source of Truth (SSOT)

**Backend (Rust) = единственный источник правды**

- Весь state проекта хранится в `ProjectState` (Rust)
- Frontend НЕ имеет собственного authoritative state
- XState машина на фронтенде — это **кэш** backend state

### 2. Command-Event Pattern

```
Frontend                Backend
   |                       |
   |--[Command: AddClip]-->|
   |                       | (изменяет state)
   |                       | (публикует событие)
   |<--[Event: ClipAdded]--|
   | (обновляет кэш)       |
   |                       |
```

**Шаг 1: Отправка команды**
```typescript
// Frontend отправляет команду
await backendSync.executeCommand({
  type: "AddClip",
  params: { track_id, media_id, time }
})
```

**Шаг 2: Backend обрабатывает**
```rust
// Backend выполняет команду
pub async fn add_clip(&self, track_id: String, media_id: String, time: f64) {
    // 1. Изменяет состояние
    track.clips.push(clip.clone());
    state.mark_dirty();

    // 2. Публикует событие
    self.event_bus.publish(
        ProjectEvent::ClipAdded { track_id, clip },
        "command_handler".to_string(),
        version
    ).await;
}
```

**Шаг 3: Frontend получает событие**
```typescript
// BackendSync слушает события
listen<EventEnvelope>("project:event", (event) => {
  this.handleBackendEvent(event.payload)
})

// Обрабатывает событие напрямую
handleBackendEvent(envelope: EventEnvelope) {
  const event = envelope.event

  // Отправляет в машину для обновления кэша
  timelineActor.send({
    type: "BACKEND_EVENT",
    event: event
  })
}
```

### 3. Инкрементальные обновления

❌ **Неправильно** (старый подход):
```typescript
// Получили событие ClipAdded
// → Делаем полный fetch всего состояния
const state = await backendSync.getProjectState()
updateEntireState(state)
```

✅ **Правильно** (новый подход):
```typescript
// Получили событие ClipAdded
// → Обновляем только этот клип
handleClipAddedEvent(event: ClipAddedEvent) {
  const { track_id, clip } = event.payload

  // Находим трек и добавляем клип
  const track = findTrack(track_id)
  track.clips.push(clip)

  // Триггерим ре-рендер
  notifySubscribers()
}
```

### 4. Запрет оптимистичных обновлений

❌ **Неправильно**:
```typescript
// Сначала обновляем UI
const optimisticClip = { id: 'temp', ... }
addClipToUI(optimisticClip)

// Потом отправляем на backend
await backend.addClip(...)

// Заменяем temp ID на настоящий
replaceOptimisticClip(optimisticClip.id, realClip.id)
```

✅ **Правильно**:
```typescript
// Показываем loader
setLoading(true)

// Отправляем команду
await backend.addClip(...)

// НЕ обновляем UI сами!
// Ждем события ClipAdded от backend

// Backend пришлет событие → UI обновится автоматически
```

## Компоненты системы

### BackendSync (src/features/app-state/services/backend-sync.ts)

**Ответственность**: Коммуникация с backend

```typescript
class BackendSync {
  // Отправка команд
  async executeCommand(command: ProjectCommand): Promise<CommandResult>

  // Подписка на события
  onEvent(handler: EventHandler): UnsubscribeFn

  // Получение полного состояния (только для инициализации!)
  async getProjectState(): Promise<ProjectState | null>
}
```

### Timeline Machine (src/domains/video-editing/machines/timeline-extended-machine.ts)

**Ответственность**: Кэширование backend state, обработка событий

```typescript
const timelineMachine = setup({
  types: {
    events: {} as TimelineEvent | BackendEvent
  },
  actions: {
    // Обработка backend событий
    handleBackendEvent: assign(({ context, event }) => {
      if (event.type !== 'BACKEND_EVENT') return context

      switch (event.event.type) {
        case 'ClipAdded':
          return handleClipAdded(context, event.event)
        case 'ClipDeleted':
          return handleClipDeleted(context, event.event)
        // ... другие события
      }
    })
  }
})
```

### Timeline Providers (src/domains/video-editing/providers/timeline-providers.tsx)

**Ответственность**: React интеграция, подписка на события

```typescript
export function TimelineProjectProvider({ children }) {
  const orchestrator = getVideoEditingOrchestrator()
  const timelineActor = orchestrator.getActors().timeline
  const backendSync = getBackendSync()

  useEffect(() => {
    // Подписываемся на backend события
    const unsubscribe = backendSync.onEvent((event) => {
      // Отправляем в машину
      timelineActor.send({
        type: 'BACKEND_EVENT',
        event
      })
    })

    return unsubscribe
  }, [])

  // ...
}
```

## Поток данных для типичной операции

### Пример: Добавление клипа на таймлайн

**1. User действие**
```typescript
// UI компонент
<button onClick={() => addClipToTimeline(mediaFile)}>
  Add to Timeline
</button>
```

**2. Hook вызывает команду**
```typescript
// useTimelineActions.ts
const addClip = async (trackId, mediaFile, time) => {
  // ❌ НЕ обновляем локальное состояние!

  // ✅ Отправляем команду на backend
  await orchestrator.addClip(trackId, mediaFile, time)

  // Backend сам пришлет событие ClipAdded
}
```

**3. Orchestrator выполняет команду**
```typescript
// video-editing-orchestrator.ts
async addClip(trackId: string, mediaFile: MediaFile, time: number) {
  // Подготовка данных
  const mediaId = await this.ensureMediaInBackend(mediaFile)

  // Отправка команды
  const result = await this.backendSync.executeCommand({
    type: 'AddClip',
    params: { track_id: trackId, media_id: mediaId, time }
  })

  if (!result.success) {
    throw new Error(result.error)
  }

  // Возвращаемся. НЕ обновляем state!
  return result
}
```

**4. Backend обрабатывает команду**
```rust
// src-tauri/src/state/commands/timeline.rs
pub async fn add_clip(&self, track_id: String, media_id: String, time: f64) {
    let mut state = self.state.write().await;

    // Изменяем состояние
    let clip = Clip { id: uuid::new_v4(), ... };
    track.clips.push(clip.clone());
    state.mark_dirty();

    // Публикуем событие
    self.event_bus.publish(
        ProjectEvent::ClipAdded {
            track_id: track_id.clone(),
            clip: clip.into()
        },
        "command_handler".to_string(),
        state.version
    ).await;
}
```

**5. Event Bus отправляет событие**
```rust
// src-tauri/src/state/events.rs
pub async fn publish(&self, event: ProjectEvent, source: String, version: u32) {
    let envelope = EventEnvelope {
        metadata: EventMetadata { ... },
        event: event.clone()
    };

    // Emit на frontend
    self.app_handle
        .emit("project:event", &envelope)
        .map_err(|e| format!("Failed to emit: {}", e))?;
}
```

**6. Frontend получает событие**
```typescript
// backend-sync.ts
private handleBackendEvent(envelope: EventEnvelope) {
  // Уведомляем всех подписчиков
  this.eventHandlers.forEach(handler => {
    handler(envelope.event)
  })
}
```

**7. Machine обрабатывает событие**
```typescript
// timeline-extended-machine.ts
actions: {
  handleClipAdded: assign(({ context, event }) => {
    const { track_id, clip } = event.payload

    // Находим секцию и трек
    const section = context.project.sections.find(s =>
      s.tracks.some(t => t.id === track_id)
    )
    const track = section.tracks.find(t => t.id === track_id)

    // Добавляем клип
    track.clips.push(clip)

    // Сортируем по времени
    track.clips.sort((a, b) => a.timeline_in - b.timeline_in)

    return context
  })
}
```

**8. React ре-рендерит UI**
```typescript
// Автоматически через useSelector
const clips = useSelector(timelineActor, state => state.context.clips)

// Компонент ре-рендерится с новым клипом
<ClipComponent clip={newClip} />
```

## Обработка ошибок

### Команда не выполнилась

```typescript
try {
  await backendSync.executeCommand({ type: 'AddClip', params })
} catch (error) {
  // Показываем ошибку пользователю
  toast.error('Failed to add clip: ' + error.message)

  // ❌ НЕ откатываем оптимистичное обновление (его не было!)
  // ✅ Просто показываем ошибку
}
```

### Событие потерялось

Backend хранит историю событий:

```typescript
// При переподключении
const events = await backendSync.getEventHistory(lastKnownVersion)

// Применяем пропущенные события
events.forEach(envelope => {
  timelineActor.send({ type: 'BACKEND_EVENT', event: envelope.event })
})
```

## Преимущества архитектуры

✅ **Простота**: Один источник правды, понятный flow
✅ **Надежность**: Нет рассинхронизации frontend/backend
✅ **Отладка**: Все изменения логируются в event bus
✅ **Версионирование**: Каждое событие имеет версию
✅ **Undo/Redo**: Легко реализовать через replay событий
✅ **Оффлайн**: Можно queue команды и отправить позже

## Антипаттерны (чего избегать)

❌ Оптимистичные обновления без rollback механизма
❌ Прямое изменение context машины из провайдера
❌ Дублирование логики на frontend и backend
❌ Fetch полного состояния после каждого события
❌ Игнорирование событий ("сделаем сами на фронте")

## Примеры кода

См. также:
- [Полный пример в backend-sync.ts](../../features/app-state/services/backend-sync.ts)
- [Обработка событий в timeline-machine](../../domains/video-editing/machines/timeline-extended-machine.ts)
- [Провайдеры в timeline-providers.tsx](../../domains/video-editing/providers/timeline-providers.tsx)
