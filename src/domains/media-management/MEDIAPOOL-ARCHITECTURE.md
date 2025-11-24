# Архитектура MediaPool

## Обзор

MediaPool - это централизованное хранилище медиафайлов в Timeline Studio, которое синхронизируется с Rust backend через event-driven архитектуру.

## Структура данных

### Frontend: MediaInfo
```typescript
interface MediaInfo {
  path: string           // Путь к файлу
  name: string           // Имя файла
  type: MediaType        // "Video" | "Audio" | "Image" | "Unknown"
  metadata?: MediaMetadata
  size?: number
  duration?: number      // В секундах
  thumbnailPath?: string
}
```

### Backend: MediaData
```typescript
interface MediaData {
  id: string             // Уникальный ID (UUID)
  path: string
  name: string
  media_type: string
  duration: number | null
}
```

### MediaPool
```typescript
// Map: media_id -> MediaInfo
mediaPool: Map<string, MediaInfo>
```

**Ключ** = `media.id` (UUID из backend)
**Значение** = `MediaInfo` (frontend representation)

## Event-Driven архитектура

### Поток данных

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Пользователь выбирает файлы                                │
│     ↓                                                            │
│  2. importFiles(files: string[], options)                      │
│     ↓                                                            │
│  3. for each file:                                              │
│     backendSync.executeCommand(                                 │
│       AppCommands.addMedia(filePath, mediaType)                │
│     )                                                            │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Command: AddMedia
                         │ { path, media_type }
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Backend                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  4. Получает команду AddMedia                                   │
│     ↓                                                            │
│  5. Создает MediaData с UUID                                    │
│     - Генерирует уникальный ID                                  │
│     - Извлекает метаданные файла                                │
│     - Создает thumbnail (опционально)                           │
│     ↓                                                            │
│  6. Добавляет в ProjectState.media_pool                         │
│     ↓                                                            │
│  7. Emit Event: MediaAdded { media: MediaData }                 │
│                                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Event: MediaAdded
                         │ { media: MediaData }
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Provider)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  8. backendSync.onEvent((event: ProjectEvent) => {             │
│       handleMediaBackendEvent(context, event)                  │
│     })                                                           │
│     ↓                                                            │
│  9. handleMediaAdded(context, event)                            │
│     - Конвертирует MediaData → MediaInfo                       │
│     - updatedMediaPool.set(media.id, mediaInfo)                │
│     ↓                                                            │
│  10. setMediaPool(updatedMediaPool)                             │
│      ✅ MediaPool обновлен!                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Ключевые компоненты

### 1. MediaManagementProvider
**Файл**: `providers/media-management-provider.tsx`

**Ответственность**:
- Управление локальным состоянием `mediaPool`
- Подписка на backend события через `backendSync.onEvent()`
- Синхронизация с backend через `handleMediaBackendEvent`
- Предоставление методов для работы с медиа (importFiles, getMediaInfo)

```typescript
const [mediaPool, setMediaPool] = useState<Map<string, MediaInfo>>(new Map())

useEffect(() => {
  const unsubscribe = backendSync.onEvent((event: ProjectEvent) => {
    const context = { mediaPool, isLoading, error }
    const updates = handleMediaBackendEvent(context, event)
    
    if (updates.mediaPool) {
      setMediaPool(updates.mediaPool) // ✅ Обновляем state
    }
  })
  
  return () => unsubscribe()
}, [backendSync, mediaPool])
```

### 2. Backend Event Handlers
**Файл**: `machines/backend-event-handlers.ts`

**Обрабатываемые события**:
- `MediaAdded` - добавление нового файла
- `MediaRemoved` - удаление файла
- `MediaUpdated` - обновление метаданных

```typescript
function handleMediaAdded(
  context: MediaManagementContext,
  event: Extract<ProjectEvent, { type: "MediaAdded" }>
): Partial<MediaManagementContext> {
  const { media } = event.payload // MediaData от backend
  
  // Создаем новую копию (иммутабельность!)
  const updatedMediaPool = new Map(context.mediaPool)
  
  // Конвертируем backend -> frontend
  const mediaInfo: MediaInfo = {
    path: media.path,
    name: media.name,
    type: media.media_type as MediaType,
    duration: media.duration ?? undefined,
    thumbnailPath: (media as any).thumbnail ?? undefined,
  }
  
  // Добавляем в pool
  updatedMediaPool.set(media.id, mediaInfo) // ✅ Ключ = media.id
  
  return {
    mediaPool: updatedMediaPool,
    isLoading: false,
  }
}
```

### 3. AppCommands
**Файл**: `domains/project-management/machines/app-machine.ts`

**Команды для работы с медиа**:

```typescript
export const AppCommands = {
  // Добавить медиафайл
  addMedia: (path: string, mediaType: MediaType): ProjectCommand => ({
    type: "AddMedia",
    params: { path, media_type: mediaType },
  }),
  
  // Удалить медиафайл
  removeMedia: (mediaId: string): ProjectCommand => ({
    type: "RemoveMedia",
    params: { media_id: mediaId },
  }),
  
  // Обновить медиафайл
  updateMedia: (mediaId: string, changes: MediaChanges): ProjectCommand => ({
    type: "UpdateMedia",
    params: { media_id: mediaId, changes },
  }),
}
```

### 4. BackendSync
**Файл**: `features/app-state/services/backend-sync.ts`

**Методы**:
- `executeCommand(command)` - отправить команду в backend
- `onEvent(callback)` - подписаться на backend события
- `onStateChange(callback)` - подписаться на изменения ProjectState

## Последовательность импорта файла

### Шаг 1: Выбор файлов
```typescript
const files = await selectMediaFiles()
// → ["Users/user/video.mp4", "Users/user/audio.mp3"]
```

### Шаг 2: Вызов importFiles
```typescript
await importFiles(files, {
  copyToProject: true,
  generateThumbnails: true,
  analyzeContent: true,
})
```

### Шаг 3: Отправка команд в backend
```typescript
for (const filePath of files) {
  const mediaType = getMediaTypeFromPath(filePath) // "Video"
  
  // 🚀 Команда отправляется в Rust
  await backendSync.executeCommand(
    AppCommands.addMedia(filePath, mediaType)
  )
}
```

### Шаг 4: Backend обработка (Rust)
```rust
// В Rust backend
fn handle_add_media(path: String, media_type: MediaType) -> Result<()> {
    let media_id = Uuid::new_v4().to_string();
    
    let media_data = MediaData {
        id: media_id.clone(),
        path: path.clone(),
        name: get_filename(&path),
        media_type: media_type.to_string(),
        duration: extract_duration(&path),
    };
    
    // Добавляем в ProjectState
    project_state.media_pool.insert(media_id, media_data.clone());
    
    // 🎉 Отправляем событие
    emit_event(ProjectEvent::MediaAdded { media: media_data });
    
    Ok(())
}
```

### Шаг 5: Frontend получает событие
```typescript
// В MediaManagementProvider
backendSync.onEvent((event) => {
  if (event.type === "MediaAdded") {
    const { media } = event.payload
    
    // media.id = "550e8400-e29b-41d4-a716-446655440000"
    // media.path = "/Users/user/video.mp4"
    // media.name = "video.mp4"
    // media.media_type = "Video"
    // media.duration = 120.5
    
    handleMediaBackendEvent(context, event)
    // → Updates mediaPool
  }
})
```

### Шаг 6: MediaPool обновлен
```typescript
// После обновления:
mediaPool = Map {
  "550e8400-e29b-41d4-a716-446655440000" => {
    path: "/Users/user/video.mp4",
    name: "video.mp4",
    type: "Video",
    duration: 120.5,
    thumbnailPath: undefined,
  }
}
```

## Поиск медиафайла

### По ID
```typescript
const mediaInfo = mediaPool.get(mediaId)
// Быстрый O(1) поиск по UUID
```

### По пути
```typescript
const mediaInfo = Array.from(mediaPool.values())
  .find(media => media.path === filePath)
// O(n) поиск по всем значениям
```

## Важные особенности

### 1. Иммутабельность
❌ **Неправильно**:
```typescript
context.mediaPool.set(media.id, mediaInfo)
return { mediaPool: context.mediaPool } // ❌ Мутация!
```

✅ **Правильно**:
```typescript
const updatedMediaPool = new Map(context.mediaPool) // ✅ Копия
updatedMediaPool.set(media.id, mediaInfo)
return { mediaPool: updatedMediaPool }
```

### 2. ID vs Path
- **Ключ Map** = `media.id` (UUID от backend)
- **MediaInfo.path** = путь к файлу в файловой системе

Почему не path как ключ?
- Файл может быть перемещен
- Одинаковое имя файла в разных папках
- Backend генерирует стабильный UUID

### 3. Синхронизация
**Backend = Source of Truth**
- Frontend НЕ модифицирует mediaPool напрямую
- Все изменения через команды → backend → события
- Гарантирует консистентность данных

### 4. Конвертация типов
Backend использует snake_case:
```typescript
media_type: string
media_id: string
```

Frontend использует camelCase:
```typescript
mediaType: MediaType
mediaId: string
```

Event handlers конвертируют между форматами.

## Использование в компонентах

### Получить весь pool
```typescript
const { mediaPool } = useMediaManagement()

// Конвертировать в массив
const mediaArray = Array.from(mediaPool.values())
```

### Получить конкретный файл
```typescript
const { getMediaInfo } = useMediaManagement()

const mediaInfo = await getMediaInfo("/path/to/file.mp4")
```

### Импортировать файлы
```typescript
const { importFiles } = useMediaImport()

await importFiles(files, {
  copyToProject: true,
  generateThumbnails: true,
})

// После завершения mediaPool автоматически обновится
// через события MediaAdded
```

## Отладка

### Логирование событий
```typescript
// В MediaManagementProvider
backendSync.onEvent((event) => {
  if (event.type.startsWith("Media")) {
    console.log("📦 Media Event:", event.type, event.payload)
  }
})
```

### Проверка состояния
```typescript
// В компоненте
const { mediaPool } = useMediaManagement()

useEffect(() => {
  console.log("📦 MediaPool size:", mediaPool.size)
  console.log("📦 MediaPool entries:", Array.from(mediaPool.entries()))
}, [mediaPool])
```

### Logger
```typescript
// В backend-event-handlers.ts
const logger = createLogger("MediaBackendEventHandlers")

logger.info("Media added to pool:", {
  mediaId: media.id,
  path: media.path,
  type: media.media_type,
})
```

## Диаграмма состояний

```
                    ┌─────────────────┐
                    │   User Action   │
                    │ (select files)  │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │  importFiles()  │
                    │   (Frontend)    │
                    └────────┬────────┘
                             │
                   ┌─────────┴──────────┐
                   │  for each file:    │
                   │  executeCommand(   │
                   │    AddMedia        │
                   │  )                 │
                   └─────────┬──────────┘
                             │
                             ↓
        ╔════════════════════════════════════╗
        ║         Rust Backend               ║
        ║  1. Create MediaData with UUID     ║
        ║  2. Add to ProjectState.media_pool ║
        ║  3. Emit MediaAdded event          ║
        ╚════════════════════════════════════╝
                             │
                             ↓
                   ┌─────────────────┐
                   │ MediaAdded Event│
                   │  { media: ... } │
                   └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  backendSync    │
                    │  .onEvent()     │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │ handleMediaBackendEvent()   │
              │  - Convert MediaData        │
              │  - Update mediaPool Map     │
              │  - Return updates           │
              └──────────────┬──────────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │ setMediaPool()  │
                    │  (React state)  │
                    └────────┬────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │  UI Re-renders  │
                    │  with new data  │
                    └─────────────────┘
```

## Визуальные диаграммы

### Структура MediaPool

```
MediaPool (Map)
├─ "550e8400-..." → MediaInfo { path: "/video1.mp4", type: "Video" }
├─ "6fa459ea-..." → MediaInfo { path: "/audio1.mp3", type: "Audio" }
├─ "7c9e6679-..." → MediaInfo { path: "/image1.png", type: "Image" }
└─ "8d7be5f9-..." → MediaInfo { path: "/video2.mov", type: "Video" }

┌─────────────────────────────────────────────────────────┐
│ Key: UUID (от Backend)                                  │
│ Value: MediaInfo (Frontend representation)              │
└─────────────────────────────────────────────────────────┘
```

### Конвертация типов

```
BACKEND (Rust)              FRONTEND (TypeScript)
────────────────────────────────────────────────

MediaData {                 MediaInfo {
  id: String,        ──────→  (используется как ключ Map)
  path: String,      ──────→  path: string,
  name: String,      ──────→  name: string,
  media_type: String,──────→  type: MediaType,
  duration: f64      ──────→  duration?: number,
                              metadata?: MediaMetadata,
                              thumbnailPath?: string
}                           }

┌────────────────────────────────────────────────────────┐
│ Конвертация в handleMediaAdded():                      │
│                                                         │
│ const mediaInfo: MediaInfo = {                         │
│   path: media.path,              // String → string    │
│   name: media.name,              // String → string    │
│   type: media.media_type as MediaType, // cast         │
│   duration: media.duration ?? undefined, // nullable   │
│   thumbnailPath: media.thumbnail ?? undefined          │
│ }                                                       │
│                                                         │
│ updatedMediaPool.set(media.id, mediaInfo)              │
│                      ^^^^^^^^   ^^^^^^^^^              │
│                      UUID       MediaInfo              │
└────────────────────────────────────────────────────────┘
```

### Command-Event паттерн

```
КОМАНДЫ (Commands)
─────────────────────────────────────────
Frontend → Backend
Императивные: "Сделай это"

AddMedia      → Добавь файл в медиапул
RemoveMedia   → Удали файл из медиапула
UpdateMedia   → Обнови метаданные файла

┌─────────────────────────────────────┐
│ backendSync.executeCommand({        │
│   type: "AddMedia",                 │
│   params: { path, media_type }      │
│ })                                  │
└─────────────────────────────────────┘

                ↓

СОБЫТИЯ (Events)
─────────────────────────────────────────
Backend → Frontend
Декларативные: "Это произошло"

MediaAdded    → Файл был добавлен
MediaRemoved  → Файл был удален
MediaUpdated  → Метаданные были обновлены

┌─────────────────────────────────────┐
│ backendSync.onEvent((event) => {    │
│   if (event.type === "MediaAdded") {│
│     // Update mediaPool             │
│   }                                 │
│ })                                  │
└─────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ Зачем такая сложность?                             │
│                                                     │
│ ✅ Backend = Source of Truth                       │
│ ✅ Команда может быть отклонена (валидация)        │
│ ✅ Событие = гарантия успешного выполнения         │
│ ✅ Undo/Redo работает через команды                │
│ ✅ Синхронизация между вкладками через события     │
└────────────────────────────────────────────────────┘
```

### Иммутабельность

```
❌ МУТАЦИЯ (Плохо)
───────────────────────────────────────
context.mediaPool.set(media.id, mediaInfo)
return { mediaPool: context.mediaPool }

Проблема:
- React не обнаружит изменение
- Та же ссылка на Map
- UI не обновится!


✅ ИММУТАБЕЛЬНОСТЬ (Хорошо)
───────────────────────────────────────
const updatedMediaPool = new Map(context.mediaPool)
                         ^^^^^^^^^ Новая Map!
updatedMediaPool.set(media.id, mediaInfo)
return { mediaPool: updatedMediaPool }

Преимущества:
- Новая ссылка
- React обнаружит изменение
- UI обновится
- Можно сравнивать по ссылке


┌────────────────────────────────────────────────────┐
│ В React:                                            │
│                                                     │
│ const [mediaPool, setMediaPool] = useState(...)    │
│                                                     │
│ // ❌ Не работает                                  │
│ mediaPool.set(id, info)                            │
│ setMediaPool(mediaPool) // Та же ссылка!           │
│                                                     │
│ // ✅ Работает                                     │
│ const updated = new Map(mediaPool)                 │
│ updated.set(id, info)                              │
│ setMediaPool(updated) // Новая ссылка!             │
└────────────────────────────────────────────────────┘
```

### Жизненный цикл проекта

```
НОВЫЙ ПРОЕКТ
────────────────────────────────────────
┌─────────────────┐
│ CreateProject   │
│ command         │
└────────┬────────┘
         │
         ↓
    ┌────────────────────┐
    │ Backend creates    │
    │ empty ProjectState │
    │ media_pool = {}    │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │ ProjectCreated     │
    │ event              │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │ Frontend:          │
    │ mediaPool = new Map│
    └────────────────────┘


ОТКРЫТИЕ СУЩЕСТВУЮЩЕГО ПРОЕКТА
────────────────────────────────────────
┌─────────────────┐
│ OpenProject     │
│ command         │
└────────┬────────┘
         │
         ↓
    ┌────────────────────┐
    │ Backend loads      │
    │ project file       │
    │ restores state     │
    │ media_pool = {...} │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │ ProjectLoaded      │
    │ event with state   │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │ Frontend:          │
    │ for each media:    │
    │   emit MediaAdded  │
    │ mediaPool populated│
    └────────────────────┘


ЗАКРЫТИЕ ПРОЕКТА
────────────────────────────────────────
┌─────────────────┐
│ CloseProject    │
│ command         │
└────────┬────────┘
         │
         ↓
    ┌────────────────────┐
    │ Backend saves      │
    │ project file       │
    │ clears state       │
    │ media_pool = {}    │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │ ProjectClosed      │
    │ event              │
    └────────┬───────────┘
             │
             ↓
    ┌────────────────────┐
    │ Frontend:          │
    │ mediaPool.clear()  │
    │ setMediaPool(empty)│
    └────────────────────┘
```

### Отладка и troubleshooting

```
ПРОВЕРКА СИНХРОНИЗАЦИИ
────────────────────────────────────────
┌────────────────────────────────────┐
│ Frontend                           │
│ console.log(                       │
│   "Frontend pool:",                │
│   Array.from(mediaPool.keys())     │
│ )                                  │
└────────────────────────────────────┘
         │
         │ Сравнить
         ↓
┌────────────────────────────────────┐
│ Backend                            │
│ const state = await                │
│   backendSync.getState()           │
│ console.log(                       │
│   "Backend pool:",                 │
│   Object.keys(state.media_pool)    │
│ )                                  │
└────────────────────────────────────┘

Если не совпадают:
- Проверить подписку на события
- Проверить обработку событий
- Проверить логи backend


ОТСЛЕЖИВАНИЕ СОБЫТИЙ
────────────────────────────────────────
backendSync.onEvent((event) => {
  if (event.type.startsWith("Media")) {
    console.log({
      time: new Date().toISOString(),
      type: event.type,
      payload: event.payload
    })
  }
})

Ожидаемые события:
- MediaAdded после importFiles()
- MediaRemoved после удаления
- MediaUpdated после обновления метаданных


ПРОВЕРКА ИММУТАБЕЛЬНОСТИ
────────────────────────────────────────
const oldRef = mediaPool
// ... operations ...
const newRef = mediaPool

if (oldRef === newRef) {
  console.error("❌ Mutation detected!")
} else {
  console.log("✅ Immutable update")
}
```

## FAQ

### Q: Почему Map, а не массив?
**A**: Map обеспечивает O(1) доступ по ID. Массив потребует O(n) поиск.

### Q: Зачем конвертировать MediaData → MediaInfo?
**A**: Backend и frontend могут иметь разные требования. MediaInfo - это frontend-friendly представление.

### Q: Что если событие MediaAdded не придет?
**A**: Backend гарантирует отправку события после успешной команды. Если событие не пришло - значит команда не выполнилась (ошибка).

### Q: Можно ли модифицировать mediaPool напрямую?
**A**: ❌ Нет! Всегда через команды → backend → события. Это гарантирует консистентность.

### Q: Как синхронизировать mediaPool между вкладками?
**A**: Backend - единственный источник истины. При открытии новой вкладки получаем текущий ProjectState от backend.

### Q: Что происходит при закрытии проекта?
**A**: Backend очищает ProjectState, отправляет событие ProjectClosed. Frontend очищает mediaPool.
