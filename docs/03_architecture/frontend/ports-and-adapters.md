# Ports & Adapters (Hexagonal) Architecture

[← Назад к Frontend](README.md) | [← К оглавлению](../README.md)

## Цель

Сделать frontend независимым от Tauri, чтобы приложение могло работать с разными backend-ами (Tauri, Node.js API, браузер для тестов).

## Обзор

Timeline Studio использует **Ports & Adapters** (Hexagonal Architecture) паттерн для абстракции платформо-зависимых операций. Это позволяет:

1. **Тестируемость** — тесты запускаются без Tauri runtime
2. **Портируемость** — легко добавить другие backend-ы (Electron, Node.js)
3. **Разделение ответственности** — чёткие границы между бизнес-логикой и платформой
4. **Dependency Injection** — сервисы регистрируются в контейнере при старте

## Архитектура

```
src/
├── core/                     # Ядро — интерфейсы и контейнер
│   ├── ports/                # Интерфейсы (порты)
│   │   ├── backend.port.ts   # IBackendService — команды к бэкенду
│   │   ├── platform.port.ts  # IPlatformService — диалоги, файлы, shell
│   │   ├── storage.port.ts   # IStorageService — localStorage/Tauri Store
│   │   └── event.port.ts     # IEventService — подписка на события
│   ├── container.ts          # DI контейнер (singleton)
│   ├── types.ts              # Общие типы (re-export из tauri-bindings)
│   └── index.ts              # Экспорты
│
├── adapters/                 # Реализации (адаптеры)
│   ├── tauri/                # Tauri реализация
│   │   ├── backend.ts        # TauriBackendService
│   │   ├── platform.ts       # TauriPlatformService
│   │   ├── storage.ts        # TauriStorageService
│   │   ├── event.ts          # TauriEventService
│   │   └── index.ts          # initTauriApp()
│   │
│   ├── mock/                 # Mock для тестов/браузера
│   │   ├── backend.ts        # MockBackendService
│   │   ├── platform.ts       # MockPlatformService
│   │   ├── storage.ts        # MockStorageService
│   │   ├── event.ts          # MockEventService
│   │   └── index.ts          # initMockApp()
│   │
│   └── react/                # React интеграция
│       └── app-init-provider.tsx
│
├── domains/                  # Доменная логика (использует @/core)
├── features/                 # Фичи (используют domains и @/core)
└── ...
```

## Порты (Интерфейсы)

### IBackendService

Отвечает за команды к Rust backend:

```typescript
interface IBackendService {
  // Выполнить команду
  invoke<T>(command: string, args?: Record<string, unknown>): Promise<T>

  // Подключение/отключение
  connect(): Promise<void>
  disconnect(): void
  isConnected(): boolean

  // Подписка на изменения состояния
  onStateChange(handler: StateChangeHandler): Unsubscribe
}
```

### IPlatformService

Отвечает за платформо-зависимые операции:

```typescript
interface IPlatformService {
  // Диалоги
  showOpenDialog(options?: OpenDialogOptions): Promise<string[] | null>
  showSaveDialog(options?: SaveDialogOptions): Promise<string | null>

  // Файловая система
  readFile(path: string): Promise<Uint8Array>
  writeFile(path: string, data: Uint8Array): Promise<void>
  readTextFile(path: string): Promise<string>
  writeTextFile(path: string, content: string): Promise<void>
  exists(path: string): Promise<boolean>

  // Буфер обмена
  readClipboard(): Promise<string>
  writeClipboard(text: string): Promise<void>

  // Уведомления
  showNotification(options: NotificationOptions): Promise<void>

  // Shell операции
  openPath(path: string): Promise<void>
  openUrl(url: string): Promise<void>

  // App info
  getVersion(): Promise<string>

  // Конвертация путей для <video>, <img> тегов
  convertFileSrc(path: string): string

  // Path утилиты
  basename(path: string): Promise<string>
  dirname(path: string): Promise<string>
  join(...paths: string[]): Promise<string>
}
```

### IStorageService

Отвечает за персистентное хранилище:

```typescript
interface IStorageService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  keys(): Promise<string[]>
}
```

### IEventService

Отвечает за подписку на события:

```typescript
type UnlistenFn = () => void
type EventCallback<T> = (event: { payload: T }) => void

interface IEventService {
  // Подписаться на событие
  listen<T>(eventName: string, callback: EventCallback<T>): Promise<UnlistenFn>

  // Отправить событие (для тестов)
  emit<T>(eventName: string, payload: T): Promise<void>
}
```

## DI Контейнер

Централизованное управление зависимостями:

```typescript
import { container } from "@/core"

// Получение сервисов
const backend = container.getBackend()
const platform = container.getPlatform()
const storage = container.getStorage()
const event = container.getEvent()

// Проверка наличия сервиса
if (container.hasPlatform()) {
  const platform = container.getPlatform()
}
```

## Инициализация

### Tauri приложение

```typescript
// src/app/providers.tsx
import { initTauriApp } from "@/adapters/tauri"

export async function initializeApp() {
  await initTauriApp({
    storeName: "settings.json",
    autoConnect: true
  })
}
```

### Тесты / Браузер

```typescript
// test setup
import { initMockApp } from "@/adapters/mock"

const { backend, platform, storage, event } = initMockApp({
  useLocalStorage: false
})

// Настройка моков для теста
platform.setOpenDialogResponse(["/path/to/file.mp4"])
backend.setInvokeResponse("get_media_info", { duration: 120 })
```

## Использование в коде

### В хуках

```typescript
import { useMemo, useEffect } from "react"
import { container } from "@/core"
import type { UnlistenFn } from "@/core/ports"

export function useMediaProcessor() {
  // Получаем сервис из контейнера
  const eventService = useMemo(() => {
    try {
      return container.hasEvent() ? container.getEvent() : null
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!eventService) return

    let unlisten: UnlistenFn | null = null

    const setup = async () => {
      unlisten = await eventService.listen("media-processor", (event) => {
        // Обработка события
        console.log(event.payload)
      })
    }

    void setup()

    return () => {
      unlisten?.()
    }
  }, [eventService])
}
```

### В компонентах

```typescript
import { useMemo } from "react"
import { container } from "@/core"

export function MediaScanner() {
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

  const handleSelectFiles = async () => {
    if (!platform) return

    const selected = await platform.showOpenDialog({
      title: "Select media files",
      multiple: true,
      filters: [
        { name: "Video", extensions: ["mp4", "mov", "avi"] },
        { name: "Audio", extensions: ["mp3", "wav", "flac"] }
      ]
    })

    if (selected && selected.length > 0) {
      // Обработка выбранных файлов
    }
  }

  return <button onClick={handleSelectFiles}>Select Files</button>
}
```

## Тестирование

### Мокирование @/core

```typescript
// __tests__/my-component.test.tsx
import { vi, describe, it, expect } from "vitest"

const mockShowOpenDialog = vi.fn()
const mockPlatform = {
  showOpenDialog: mockShowOpenDialog,
  showSaveDialog: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  // ... остальные методы
}

vi.mock("@/core", () => ({
  container: {
    hasPlatform: vi.fn(() => true),
    getPlatform: vi.fn(() => mockPlatform),
    hasBackend: vi.fn(() => true),
    getBackend: vi.fn(() => mockBackend),
    hasEvent: vi.fn(() => true),
    getEvent: vi.fn(() => mockEvent),
  },
}))

describe("MyComponent", () => {
  it("opens file dialog", async () => {
    mockShowOpenDialog.mockResolvedValue(["/path/to/file.mp4"])

    // ... тест

    expect(mockShowOpenDialog).toHaveBeenCalledWith({
      title: "Select media files",
      multiple: true,
      filters: expect.any(Array)
    })
  })
})
```

### Использование MockEventService

```typescript
import { MockEventService } from "@/adapters/mock"

const eventService = new MockEventService()

// Подписка на событие
const unlisten = await eventService.listen("test-event", (event) => {
  console.log(event.payload)
})

// Симуляция события (для тестов)
await eventService.emit("test-event", { data: "test" })

// Проверка состояния
expect(eventService.getListenerCount("test-event")).toBe(1)

// Отписка
unlisten()
```

## Создание нового адаптера

Например, для Electron:

```typescript
// src/adapters/electron/platform.ts
import type { IPlatformService } from "@/core/ports"

export class ElectronPlatformService implements IPlatformService {
  async showOpenDialog(options) {
    const { dialog } = require("electron")
    const result = await dialog.showOpenDialog({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
      properties: options?.multiple
        ? ["openFile", "multiSelections"]
        : ["openFile"]
    })
    return result.canceled ? null : result.filePaths
  }

  async showSaveDialog(options) {
    const { dialog } = require("electron")
    const result = await dialog.showSaveDialog({
      title: options?.title,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    })
    return result.canceled ? null : result.filePath
  }

  // ... остальные методы
}

// src/adapters/electron/index.ts
export async function initElectronApp() {
  const backend = new ElectronBackendService()
  const platform = new ElectronPlatformService()
  const storage = new ElectronStorageService()
  const event = new ElectronEventService()

  container.registerBackend(backend)
  container.registerPlatform(platform)
  container.registerStorage(storage)
  container.registerEvent(event)
}
```

## Миграция существующего кода

### До (прямой импорт Tauri)

```typescript
import { open, save } from "@tauri-apps/plugin-dialog"
import { listen } from "@tauri-apps/api/event"
import { basename, dirname, join } from "@tauri-apps/api/path"

const files = await open({ multiple: true })
const unlisten = await listen("my-event", handler)
const name = await basename("/path/to/file.mp4")
```

### После (через container)

```typescript
import { container } from "@/core"

const platform = container.getPlatform()
const eventService = container.getEvent()

const files = await platform.showOpenDialog({ multiple: true })
const unlisten = await eventService.listen("my-event", handler)
const name = await platform.basename("/path/to/file.mp4")
```

## Связанные документы

- [Backend Sync Architecture](../backend-sync-architecture.md) — Command-Event Pattern
- [State Management](./state-management.md) — XState машины
- [Task: Ports & Adapters](../../08_tasks/active/ports-and-adapters-architecture.md) — Детальный прогресс миграции

---

*Последнее обновление: 27 ноября 2025*
