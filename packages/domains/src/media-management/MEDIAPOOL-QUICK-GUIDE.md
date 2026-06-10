# MediaPool - Быстрый гид

## Что это?

**MediaPool** = `Map<string, MediaInfo>` - хранилище всех медиафайлов проекта

- **Ключ**: UUID файла (генерируется backend)
- **Значение**: MediaInfo с путем, типом, метаданными

## Как данные попадают в MediaPool?

### 📤 Command → Event цикл

```
Frontend                Backend                Frontend
────────────────────────────────────────────────────────
                                                        
1. Команда              2. Обработка          3. Событие
   ↓                       ↓                      ↓
executeCommand()     добавить в state      onEvent()
AddMedia         →   + генерация UUID  →   MediaAdded
{ path, type }       save to media_pool    { media }
                                               ↓
                                          4. Обновление
                                          mediaPool.set()
```

### Пример

```typescript
// 1. Отправляем команду
await backendSync.executeCommand({
  type: "AddMedia",
  params: { 
    path: "/video.mp4", 
    media_type: "Video" 
  }
})

// 2. Backend генерирует UUID и сохраняет
// media_id = "550e8400-..."

// 3. Backend отправляет событие
emit_event({
  type: "MediaAdded",
  payload: {
    media: {
      id: "550e8400-...",
      path: "/video.mp4",
      name: "video.mp4",
      media_type: "Video",
      duration: 120
    }
  }
})

// 4. Frontend обновляет mediaPool
backendSync.onEvent((event) => {
  if (event.type === "MediaAdded") {
    const mediaInfo = convertToMediaInfo(event.payload.media)
    updatedPool.set(event.payload.media.id, mediaInfo)
  }
})
```

## Структура данных

### Backend: MediaData
```typescript
{
  id: "550e8400-e29b-41d4-a716-446655440000",  // UUID
  path: "/Users/user/Videos/clip.mp4",
  name: "clip.mp4",
  media_type: "Video",
  duration: 120.5
}
```

### Frontend: MediaInfo
```typescript
{
  path: "/Users/user/Videos/clip.mp4",
  name: "clip.mp4",
  type: "Video",
  duration: 120.5,
  thumbnailPath: "/path/to/thumb.jpg"
}
```

### MediaPool Map
```typescript
Map {
  "550e8400-..." => MediaInfo { path: "/video.mp4", ... },
  "6fa459ea-..." => MediaInfo { path: "/audio.mp3", ... },
  "7c9e6679-..." => MediaInfo { path: "/image.png", ... }
}
```

## Откуда берется ID?

❌ **НЕ frontend**:
```typescript
// НЕ делайте так!
const mediaId = crypto.randomUUID()
mediaPool.set(mediaId, mediaInfo)
```

✅ **Backend генерирует**:
```rust
// В Rust backend
let media_id = Uuid::new_v4().to_string();
let media_data = MediaData {
    id: media_id,
    path,
    name,
    media_type,
    duration
};
```

## Почему так сложно?

### 1. Единственный источник истины
- Backend хранит ProjectState
- Frontend - только отображение
- Нет рассинхрона между вкладками/окнами

### 2. Персистентность
- Backend сохраняет в файл проекта
- При открытии - восстанавливает состояние
- Frontend просто подписывается на события

### 3. Undo/Redo
- Backend знает всю историю команд
- Может откатить/повторить действия
- Frontend получает обновленный state

## Жизненный цикл файла

```
┌────────────────────────────────────────────────────────┐
│ 1. Пользователь выбирает файл                          │
│    selectMediaFiles()                                  │
│    → ["/Users/user/video.mp4"]                         │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 2. Frontend отправляет команду                         │
│    executeCommand(AddMedia)                            │
│    { path: "/Users/user/video.mp4", type: "Video" }   │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 3. Backend обрабатывает                                │
│    - Генерирует UUID: "550e8400-..."                   │
│    - Извлекает метаданные: duration=120, codec=h264    │
│    - Создает thumbnail (опционально)                   │
│    - Сохраняет в ProjectState.media_pool               │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 4. Backend отправляет событие                          │
│    emit_event(MediaAdded)                              │
│    {                                                    │
│      type: "MediaAdded",                               │
│      payload: {                                        │
│        media: {                                        │
│          id: "550e8400-...",                           │
│          path: "/Users/user/video.mp4",                │
│          name: "video.mp4",                            │
│          media_type: "Video",                          │
│          duration: 120                                 │
│        }                                               │
│      }                                                 │
│    }                                                   │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 5. Frontend получает событие                           │
│    backendSync.onEvent((event) => {                    │
│      if (event.type === "MediaAdded") {                │
│        handleMediaAdded(event)                         │
│      }                                                 │
│    })                                                  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 6. MediaPool обновляется                               │
│    const updatedPool = new Map(mediaPool)              │
│    updatedPool.set("550e8400-...", {                   │
│      path: "/Users/user/video.mp4",                    │
│      name: "video.mp4",                                │
│      type: "Video",                                    │
│      duration: 120                                     │
│    })                                                  │
│    setMediaPool(updatedPool)                           │
└────────────────┬───────────────────────────────────────┘
                 │
                 ↓
┌────────────────────────────────────────────────────────┐
│ 7. UI обновляется                                      │
│    - Файл появляется в Browser                         │
│    - Можно перетаскивать на Timeline                   │
│    - Доступен для эффектов/переходов                   │
└────────────────────────────────────────────────────────┘
```

## Как использовать в коде

### Получить все файлы
```typescript
const { mediaPool } = useMediaManagement()

// Конвертировать в массив
const files = Array.from(mediaPool.values())

// Фильтровать по типу
const videos = files.filter(m => m.type === "Video")
```

### Найти файл по ID
```typescript
const mediaInfo = mediaPool.get(mediaId)
if (mediaInfo) {
  console.log("Found:", mediaInfo.path)
}
```

### Найти файл по пути
```typescript
const { getMediaInfo } = useMediaManagement()

const mediaInfo = await getMediaInfo("/path/to/file.mp4")
```

### Импортировать файлы
```typescript
const { importFiles } = useMediaImport()

const files = ["/video1.mp4", "/video2.mp4"]
await importFiles(files, {
  copyToProject: true,
  generateThumbnails: true
})

// MediaPool обновится автоматически через события!
```

## Важные правила

### ❌ НЕ модифицируйте напрямую
```typescript
// ❌ Плохо
mediaPool.set(newId, newInfo)
mediaPool.delete(oldId)
```

### ✅ Используйте команды
```typescript
// ✅ Хорошо
await backendSync.executeCommand(
  AppCommands.addMedia(path, type)
)

await backendSync.executeCommand(
  AppCommands.removeMedia(mediaId)
)
```

### ✅ Иммутабельность
```typescript
// ✅ Создавайте новую копию
const updatedPool = new Map(context.mediaPool)
updatedPool.set(mediaId, mediaInfo)
return { mediaPool: updatedPool }

// ❌ Не мутируйте существующую
context.mediaPool.set(mediaId, mediaInfo) // ❌
```

## Отладка

### Логировать события
```typescript
backendSync.onEvent((event) => {
  console.log("📦 Event:", event.type, event.payload)
})
```

### Проверить состояние
```typescript
console.log("📦 Pool size:", mediaPool.size)
console.log("📦 All files:", Array.from(mediaPool.entries()))
```

### Найти несовпадения
```typescript
// Сравнить с backend
const backendState = await backendSync.getState()
const backendMediaIds = Object.keys(backendState.media_pool)
const frontendMediaIds = Array.from(mediaPool.keys())

const missing = backendMediaIds.filter(
  id => !frontendMediaIds.includes(id)
)
console.log("Missing in frontend:", missing)
```

## Типичные ошибки

### 1. Использование path как ключ
❌ Неправильно:
```typescript
mediaPool.set(media.path, mediaInfo)
```

✅ Правильно:
```typescript
mediaPool.set(media.id, mediaInfo) // UUID!
```

### 2. Прямое изменение state
❌ Неправильно:
```typescript
mediaPool.set(newId, newInfo)
setMediaPool(mediaPool) // React не обнаружит изменение!
```

✅ Правильно:
```typescript
const updated = new Map(mediaPool)
updated.set(newId, newInfo)
setMediaPool(updated) // Новая ссылка = re-render
```

### 3. Синхронная операция
❌ Неправильно:
```typescript
mediaPool.set(media.id, mediaInfo)
// Сразу использовать
const info = mediaPool.get(media.id)
```

✅ Правильно:
```typescript
await backendSync.executeCommand(AddMedia)
// Дождаться события MediaAdded
// Потом использовать через mediaPool
```

## Резюме

**MediaPool** - это Map с UUID → MediaInfo

**Данные попадают через**:
1. Frontend → Command → Backend
2. Backend → Event → Frontend
3. Frontend → Update mediaPool

**Ключевые моменты**:
- Backend генерирует UUID
- Frontend только читает/отображает
- Все изменения через команды
- Иммутабельность обязательна
- Event-driven архитектура

**Используйте**:
- `useMediaManagement()` - доступ к pool
- `useMediaImport()` - импорт файлов
- `backendSync` - низкоуровневые команды
