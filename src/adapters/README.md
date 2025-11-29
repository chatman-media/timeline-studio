# Adapters

Реализации портов для различных платформ и окружений.

## Структура

```
src/adapters/
├── tauri/           # Адаптеры для Tauri (production)
│   ├── ai.ts            # TauriAIService
│   ├── backend.ts       # TauriBackendService
│   ├── backend-sync.ts  # BackendSync для синхронизации
│   ├── event.ts         # TauriEventService
│   ├── media.ts         # TauriMediaService
│   ├── platform.ts      # TauriPlatformService
│   ├── storage.ts       # TauriStorageService
│   ├── video.ts         # TauriVideoService
│   └── index.ts         # initTauriApp() и экспорты
├── mock/            # Mock адаптеры для тестов
│   ├── ai.ts            # MockAIService
│   ├── backend.ts       # MockBackendService
│   ├── event.ts         # MockEventService
│   ├── media.ts         # MockMediaService
│   ├── platform.ts      # MockPlatformService
│   ├── storage.ts       # MockStorageService
│   ├── video.ts         # MockVideoService
│   ├── __tests__/       # Тесты mock адаптеров
│   └── index.ts         # initMockApp() и экспорты
└── README.md        # Эта документация
```

## Tauri Adapters

Используют `invoke()` для вызова Rust backend команд.

### Инициализация

```typescript
import { initTauriApp } from "@/adapters/tauri"

// В main.tsx или app initialization
await initTauriApp({
  storeName: "settings.json",  // Имя файла хранилища
  autoConnect: true,           // Автоподключение к бэкенду
})
```

### Сервисы

| Сервис | Описание | Методов |
|--------|----------|---------|
| TauriBackendService | Жизненный цикл, команды проекта | 5 |
| TauriPlatformService | Диалоги, файлы, shell, уведомления | 15+ |
| TauriStorageService | Tauri Store для настроек | 5 |
| TauriEventService | События через Tauri listen/emit | 3 |
| TauriMediaService | Работа с медиа файлами | 20+ |
| TauriVideoService | Компиляция, рендеринг, кэш | 40+ |
| TauriAIService | AI/ML: YOLO, Whisper, AI Director | 80+ |

### Пример использования

```typescript
import { TauriMediaService } from "@/adapters/tauri"

const service = new TauriMediaService()
const metadata = await service.getMetadata("/path/to/video.mp4")
```

## Mock Adapters

Для тестов и разработки в браузере. Не требуют Rust backend.

### Инициализация

```typescript
import { initMockApp } from "@/adapters/mock"

// Возвращает все сервисы для тестовых манипуляций
const { backend, platform, storage, event, media, video, ai } = initMockApp({
  useLocalStorage: false,  // true для использования localStorage
})
```

### Создание изолированных моков

```typescript
import { createMockServices } from "@/adapters/mock"

// Не регистрирует в container - для unit-тестов
const services = createMockServices()
```

### Тестирование

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest"
import { initMockApp, MockMediaService } from "@/adapters/mock"
import { resetContainer } from "@/core/container"

describe("MyComponent", () => {
  let mockMedia: MockMediaService

  beforeEach(() => {
    resetContainer()
    const services = initMockApp()
    mockMedia = services.media
  })

  it("should get metadata", async () => {
    // MockMediaService возвращает заглушки
    const metadata = await mockMedia.getMetadata("/test.mp4")
    expect(metadata.duration).toBe(0)
  })
})
```

## Добавление нового адаптера

### 1. Создайте интерфейс порта

```typescript
// src/core/ports/my-service.port.ts
export interface IMyService {
  doSomething(input: string): Promise<string>
}
```

### 2. Добавьте в container

```typescript
// src/core/container.ts
private _myService: IMyService | null = null

registerMyService(service: IMyService): void {
  this._myService = service
}

getMyService(): IMyService {
  if (!this._myService) throw new Error("MyService not registered")
  return this._myService
}
```

### 3. Создайте Tauri адаптер

```typescript
// src/adapters/tauri/my-service.ts
import { invoke } from "@tauri-apps/api/core"
import type { IMyService } from "@/core/ports"

export class TauriMyService implements IMyService {
  async doSomething(input: string): Promise<string> {
    return invoke("do_something", { input })
  }
}
```

### 4. Создайте Mock адаптер

```typescript
// src/adapters/mock/my-service.ts
import type { IMyService } from "@/core/ports"

export class MockMyService implements IMyService {
  async doSomething(input: string): Promise<string> {
    return `mock-${input}`
  }
}
```

### 5. Зарегистрируйте в init функциях

```typescript
// src/adapters/tauri/index.ts
export async function initTauriApp() {
  // ...
  container.registerMyService(new TauriMyService())
}

// src/adapters/mock/index.ts
export function initMockApp() {
  // ...
  container.registerMyService(new MockMyService())
}
```

## Паттерны

### Dependency Injection

Все сервисы получаются через container:
```typescript
import { getMedia, getVideo } from "@/core/container"

// Не создавайте сервисы напрямую в компонентах
// ❌ const service = new TauriMediaService()
// ✅ const service = getMedia()
```

### Тестирование с моками

```typescript
// Мокирование через vi.mock
const mockMediaService = {
  getMetadata: vi.fn().mockResolvedValue({ duration: 100 }),
}

vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))
```

### Ленивая инициализация

Сервисы создаются один раз при вызове `initTauriApp()` или `initMockApp()`:
```typescript
// В точке входа приложения
await initTauriApp()

// Везде далее используем getters
const media = getMedia() // Возвращает уже созданный сервис
```
