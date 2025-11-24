# MediaPool - Визуальные диаграммы

## 1. Структура MediaPool

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

## 2. Архитектура компонентов

```
┌────────────────────────────────────────────────────────────┐
│                        React UI                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │  Browser   │  │  Timeline  │  │   Player   │          │
│  └──────┬─────┘  └─────┬──────┘  └──────┬─────┘          │
│         │              │                 │                 │
│         └──────────────┴─────────────────┘                 │
│                        │                                   │
│                        ↓                                   │
│         ┌──────────────────────────────┐                  │
│         │  useMediaManagement()        │                  │
│         │  - mediaPool                 │                  │
│         │  - importFiles()             │                  │
│         │  - getMediaInfo()            │                  │
│         └──────────────┬───────────────┘                  │
│                        │                                   │
└────────────────────────┼───────────────────────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────┐
│              MediaManagementProvider                       │
│                                                             │
│  State:                                                     │
│  - mediaPool: Map<string, MediaInfo>                       │
│  - isLoading: boolean                                      │
│  - error: string | null                                    │
│                                                             │
│  Methods:                                                   │
│  - importFiles(files, options)                             │
│  - selectMediaFiles()                                      │
│  - getMediaInfo(path)                                      │
│                                                             │
│  Event Handler:                                             │
│  backendSync.onEvent((event) => {                          │
│    handleMediaBackendEvent(context, event)                 │
│  })                                                         │
└────────────────────────┬───────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
        ↓                                  ↓
┌──────────────┐              ┌──────────────────────┐
│ BackendSync  │              │ Event Handlers       │
│              │              │                      │
│ Commands:    │              │ handleMediaAdded()   │
│ - AddMedia   │←────events───│ handleMediaRemoved() │
│ - RemoveMedia│              │ handleMediaUpdated() │
│ - UpdateMedia│              │                      │
└──────┬───────┘              └──────────────────────┘
       │
       ↓
┌────────────────────────────────────────────────────────────┐
│                    Rust Backend                            │
│                                                             │
│  ProjectState {                                             │
│    media_pool: HashMap<String, MediaData>                  │
│  }                                                          │
│                                                             │
│  Commands:                                                  │
│  - AddMedia → generate UUID → emit MediaAdded              │
│  - RemoveMedia → delete → emit MediaRemoved                │
│  - UpdateMedia → modify → emit MediaUpdated                │
└────────────────────────────────────────────────────────────┘
```

## 3. Поток данных (Data Flow)

```
┌──────────────────────────────────────────────────────────┐
│                   USER IMPORTS FILE                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │ selectMediaFiles()    │
         │ → ["/video.mp4"]      │
         └───────┬───────────────┘
                 │
                 ↓
         ┌───────────────────────┐
         │ importFiles(files)    │
         └───────┬───────────────┘
                 │
                 ↓ for each file
         ┌───────────────────────────────┐
         │ backendSync.executeCommand(   │
         │   AppCommands.addMedia(       │
         │     path: "/video.mp4",       │
         │     type: "Video"             │
         │   )                           │
         │ )                             │
         └───────┬───────────────────────┘
                 │
                 │ Command: AddMedia
                 ↓
    ╔════════════════════════════════════════╗
    ║         RUST BACKEND                   ║
    ║                                        ║
    ║  1. Receive command                    ║
    ║     ↓                                  ║
    ║  2. Generate UUID                      ║
    ║     id = "550e8400-..."                ║
    ║     ↓                                  ║
    ║  3. Extract metadata                   ║
    ║     duration = 120s                    ║
    ║     codec = "h264"                     ║
    ║     ↓                                  ║
    ║  4. Create MediaData                   ║
    ║     { id, path, name, type, duration } ║
    ║     ↓                                  ║
    ║  5. Save to ProjectState               ║
    ║     media_pool.insert(id, media_data)  ║
    ║     ↓                                  ║
    ║  6. Emit event                         ║
    ║     emit_event(MediaAdded)             ║
    ╚════════════════════════════════════════╝
                 │
                 │ Event: MediaAdded
                 │ { media: MediaData }
                 ↓
         ┌───────────────────────────────┐
         │ backendSync.onEvent()         │
         │   receives MediaAdded         │
         └───────┬───────────────────────┘
                 │
                 ↓
         ┌────────────────────────────────┐
         │ handleMediaBackendEvent()      │
         │   ↓                            │
         │ handleMediaAdded()             │
         │   - Convert MediaData          │
         │     to MediaInfo               │
         │   - Create new Map             │
         │   - Add to map:                │
         │     map.set(id, mediaInfo)     │
         └───────┬────────────────────────┘
                 │
                 ↓
         ┌───────────────────────────────┐
         │ setMediaPool(updatedMap)      │
         │  React state updates          │
         └───────┬───────────────────────┘
                 │
                 ↓
         ┌───────────────────────────────┐
         │ Components re-render          │
         │ - Browser shows new file      │
         │ - Timeline can use file       │
         └───────────────────────────────┘
```

## 4. Конвертация типов

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

## 5. Command-Event паттерн

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

## 6. Иммутабельность

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

## 7. Жизненный цикл проекта

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

## 8. Отладка и troubleshooting

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

## Резюме

**MediaPool** использует:
1. **Map** для быстрого доступа O(1)
2. **UUID** от backend как ключи
3. **Event-driven** для синхронизации
4. **Иммутабельность** для React updates
5. **Command-Event** паттерн для consistency

**Поток данных**:
```
User Action → Command → Backend → Event → Frontend → UI Update
```

**Правило**:
> Backend генерирует ID, Frontend только отображает
