# Backend Sync - Быстрый Старт

## 🎯 Идея в двух словах

**Frontend НЕ имеет собственного state. Backend - единственный источник правды.**

Когда ты добавляешь видео на таймлайн:
1. ❌ НЕ обновляй UI сам
2. ✅ Отправь команду на backend
3. ✅ Backend изменит state и пришлет событие
4. ✅ Событие обновит UI автоматически

## 📊 Flow для любой операции

```
User Click → Command → Backend → Event → UI Update
```

**Пример: Добавление клипа**

```typescript
// ❌ НЕПРАВИЛЬНО (старый подход)
async function addClipOld(file) {
  // Сначала обновляем UI
  const clip = createClip(file)
  addClipToTimeline(clip)

  // Потом отправляем на backend
  await backend.addClip(clip)
}

// ✅ ПРАВИЛЬНО (новый подход)
async function addClipNew(file) {
  // ТОЛЬКО отправляем команду
  await backend.addClip(file)

  // ВСЁ! Backend пришлет событие ClipAdded
  // UI обновится автоматически
}
```

## 🔧 Как это работает технически

### 1. Отправка команды (Frontend)

```typescript
import { getBackendSync } from "@/features/app-state/services/backend-sync"

const backendSync = getBackendSync()

// Отправляем команду
await backendSync.executeCommand({
  type: "AddClip",
  params: {
    track_id: "track-1",
    media_id: "media-1",
    time: 5.0
  }
})

// Не делаем ничего больше!
// Ждем событие от backend
```

### 2. Обработка на Backend (Rust)

```rust
// src-tauri/src/state/commands/timeline.rs
pub async fn add_clip(&self, track_id: String, media_id: String, time: f64) {
    // 1. Изменяем состояние
    let clip = Clip { ... };
    track.clips.push(clip.clone());

    // 2. Публикуем событие
    self.event_bus.publish(
        ProjectEvent::ClipAdded {
            track_id,
            clip: clip.into()
        }
    ).await;
}
```

### 3. Получение события (Frontend)

```typescript
// Это происходит автоматически!

// TimelineProjectProvider слушает события:
backendSync.onEvent((event) => {
  // Отправляет в машину
  timelineActor.send({
    type: "BACKEND_EVENT",
    event
  })
})

// Timeline Machine обрабатывает событие:
handleBackendEvent: assign(({ context, event }) => {
  // Инкрементально обновляет state
  return handleBackendEvent(context, event.event)
})
```

## 📝 Чеклист для новых операций

Когда добавляешь новую операцию:

### ✅ Frontend Hook

```typescript
// src/features/timeline/hooks/use-timeline-actions.ts
export function useTimelineActions() {
  const { backend } = useTimeline()

  const addClip = async (trackId, file, time) => {
    // ❌ НЕ делай: updateLocalState(...)

    // ✅ Делай: отправь команду
    await backend.executeCommand({
      type: "AddClip",
      params: { track_id: trackId, media_id: file.id, time }
    })

    // Backend пришлет событие ClipAdded
  }

  return { addClip }
}
```

### ✅ Backend Command Handler

```rust
// src-tauri/src/state/commands/timeline.rs
pub async fn add_clip(&self, ...) -> CommandResult {
    // 1. Валидация
    // 2. Изменение state
    // 3. Публикация события

    self.event_bus.publish(
        ProjectEvent::ClipAdded { ... }
    ).await;

    CommandResult::success(...)
}
```

### ✅ Backend Event Definition

```rust
// src-tauri/src/state/events.rs
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "payload")]
pub enum ProjectEvent {
    ClipAdded {
        track_id: String,
        clip: ClipData,
    },
    // ...
}
```

### ✅ Frontend Event Handler

```typescript
// src/domains/video-editing/machines/backend-event-handlers.ts
function handleClipAdded(
  context: TimelineExtendedContext,
  event: Extract<ProjectEvent, { type: "ClipAdded" }>
): Partial<TimelineExtendedContext> {
  const { track_id, clip } = event.payload

  // Находим трек
  const track = findTrack(context.project, track_id)

  // Добавляем клип
  track.clips.push(convertToTimelineClip(clip))

  // Сортируем
  track.clips.sort((a, b) => a.startTime - b.startTime)

  return {
    project: updatedProject,
    hasUnsavedChanges: true
  }
}
```

## 🚫 Антипаттерны

### ❌ Оптимистичные обновления

```typescript
// НЕПРАВИЛЬНО
function addClip(file) {
  // Добавляем временный клип
  const tempClip = { id: "temp-123", ...file }
  addToUI(tempClip)

  // Отправляем на backend
  backend.addClip(file).then(realClip => {
    // Заменяем временный на настоящий
    replaceInUI("temp-123", realClip)
  })
}
```

### ❌ Fetch после каждого события

```typescript
// НЕПРАВИЛЬНО
backendSync.onEvent(async (event) => {
  // Получили событие - запрашиваем ВСЁ состояние заново
  const fullState = await backendSync.getProjectState()
  updateEntireState(fullState)
})
```

### ❌ Дублирование логики

```typescript
// НЕПРАВИЛЬНО
function addClipToTimeline(clip) {
  // Логика добавления клипа на фронте
  track.clips.push(clip)
  track.clips.sort(...)

  // Та же логика есть на backend!
}
```

## ✅ Правильные паттерны

### ✅ Только команды, никакого локального state

```typescript
// ПРАВИЛЬНО
async function addClip(file) {
  await backend.executeCommand({
    type: "AddClip",
    params: { ...file }
  })
  // Готово! Event придет автоматически
}
```

### ✅ Инкрементальные обновления через события

```typescript
// ПРАВИЛЬНО
function handleClipAdded(context, event) {
  // Обновляем ТОЛЬКО то, что изменилось
  const track = findTrack(context, event.track_id)
  track.clips.push(event.clip)

  return { project: updatedProject }
}
```

### ✅ Показываем loading state

```typescript
// ПРАВИЛЬНО
async function addClip(file) {
  setLoading(true)

  try {
    await backend.addClip(file)
    // UI обновится через событие
  } catch (error) {
    showError(error)
  } finally {
    setLoading(false)
  }
}
```

## 🐛 Отладка

### Логирование событий

Все события логируются в консоли:

```
[BackendSync] Received event { type: "ClipAdded", ... }
[TimelineProjectProvider] Forwarding to machine
[TimelineExtendedMachine] Processing backend event
[BackendEventHandlers] Handling ClipAdded
```

### Проверка state

```typescript
// В DevTools
const timelineActor = getVideoEditingOrchestrator().getActors().timeline
console.log(timelineActor.getSnapshot().context.project)
```

### История событий

Backend хранит последние 1000 событий:

```typescript
const events = await backendSync.getEventHistory(lastVersion)
console.log("Missed events:", events)
```

## 📚 Полная документация

См. [backend-sync-architecture.md](./backend-sync-architecture.md) для подробного описания архитектуры.

## ❓ FAQ

**Q: Что если событие потерялось?**
A: Backend хранит историю. При переподключении можно получить пропущенные события через `getEventHistory()`

**Q: Можно ли делать оптимистичные обновления?**
A: НЕТ. Это приводит к рассинхронизации. Используй loading states вместо этого.

**Q: Как обрабатывать ошибки?**
A: Команда вернет ошибку. Событие не придет. Покажи ошибку пользователю.

**Q: Медленно ли ждать событие?**
A: События приходят за ~5-10ms. Пользователь не заметит задержки.

**Q: Что с undo/redo?**
A: Легко реализовать через replay событий из истории.
