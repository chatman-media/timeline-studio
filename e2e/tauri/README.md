# Tauri E2E Tests

Комплексные end-to-end тесты для Tauri-специфичной функциональности Timeline Studio.

## 📊 Статус покрытия

| Категория | Реализовано | Запланировано | Покрытие |
|-----------|-------------|---------------|----------|
| **App Core** | 8 тестов | 8 | ✅ 100% |
| **Features** | 24 теста | ~600 | 🟡 4% |
| **Domains** | 25 тестов | ~80 | 🟡 31% |
| **Integration** | 2 теста | ~50 | 🟡 4% |
| **ИТОГО** | **59 тестов** | **~738** | **8%** |

## ✅ Реализованные тесты

### App Core
- `app-core/startup.spec.ts` - 8 тестов (инициализация, провайдеры, XState, events, performance)

### Features
| Фича | Файл | Тестов | Статус |
|------|------|--------|--------|
| AI Director | `features/ai-director/backend-integration.spec.ts` | 11 | ✅ Ready |
| Browser | `features/browser/media-import.spec.ts` | 13 | ✅ Ready |
| AI Chat | `features/ai-chat/` | 0 | ⏳ Пустая папка |
| Video Player | `features/video-player/` | 0 | ⏳ Пустая папка |

### Domains (корневые тесты)
| Домен | Файл | Тестов | Статус |
|-------|------|--------|--------|
| File System | `file-system.spec.ts` | 6 | ✅ Ready |
| Notifications | `notifications.spec.ts` | 5 | ✅ Ready |
| Project Management | `project-management.spec.ts` | 5 | ✅ Ready |
| Window & Clipboard | `window-clipboard.spec.ts` | 9 | ✅ Ready |

### Integration (интеграционные тесты)
| Тест | Файл | Тестов | Статус |
|------|------|--------|--------|
| Media Import | `integration/media-import-e2e.spec.ts` | 2 | ✅ Ready |

## 📋 Чеклист по фичам

> Полные чеклисты E2E тестов находятся в README.md каждой фичи в секции "E2E Tests"

### 🔴 High Priority (нужны тесты)

| Фича | Planned | Tauri Commands | README |
|------|---------|----------------|--------|
| **video-player** | 19 | 8 | `src/features/video-player/README.md` |
| **timeline** | 23 | backend-sync | `src/features/timeline/README.md` |
| **export** | 31 | 6 | `src/features/export/README.md` |
| **video-compiler** | 20 | 17 | `src/features/video-compiler/README.md` |
| **user-settings** | 16 | 12 | `src/features/user-settings/README.md` |
| **person-identification** | 30 | 20+ | `src/features/person-identification/README.md` |
| **montage-planner** | 24 | 6 | `src/features/montage-planner/README.md` |

### 🟡 Medium Priority

| Фича | Planned | Tauri Commands | README |
|------|---------|----------------|--------|
| ai-chat | 15 | через domains | `src/features/ai-chat/README.md` |
| camera-capture | 25 | Web APIs | `src/features/camera-capture/README.md` |
| effects | 25 | 3 | `src/features/effects/README.md` |
| subtitles | 15 | 2 | `src/features/subtitles/README.md` |
| transcription | 20 | через domains | `src/features/transcription/README.md` |
| recognition | 20 | 3 | `src/features/recognition/README.md` |
| updates | 10 | 1 | `src/features/updates/README.md` |
| voice-recording | 17 | 1 | `src/features/voice-recording/README.md` |

### 🟢 Low Priority (frontend-only)

| Фича | Planned | Note | README |
|------|---------|------|--------|
| filters | 12 | CSS Filters | `src/features/filters/README.md` |
| color-grading | 20 | Canvas API | `src/features/color-grading/README.md` |
| transitions | 19 | WebGL | `src/features/transitions/README.md` |
| motion-graphics | 30 | Frontend | `src/features/motion-graphics/README.md` |
| templates | 16 | Frontend | `src/features/templates/README.md` |
| style-templates | 14 | localStorage | `src/features/style-templates/README.md` |

## 📁 Структура проекта

```
e2e/tauri/
├── fixtures/              # Тестовые данные и моки
├── helpers/               # Вспомогательные функции
│   ├── backend-logger.ts  # ✅ Перехват и анализ backend логов
│   ├── backend-events.ts  # ✅ Command-Event Pattern helpers
│   └── tauri-helpers.ts   # Утилиты для работы с Tauri API
├── page-objects/          # Page Object Pattern для компонентов
├── app-core/              # Тесты ядра приложения
│   └── startup.spec.ts    # ✅ 8 тестов
├── features/              # Тесты по фичам
│   ├── ai-chat/           # ⏳ Пусто
│   ├── ai-director/       # ✅ 11 тестов
│   │   └── backend-integration.spec.ts
│   ├── browser/           # ✅ 13 тестов
│   │   └── media-import.spec.ts
│   └── video-player/      # ⏳ Пусто
├── integration/           # ✅ Комплексные сценарии
│   └── media-import-e2e.spec.ts # ✅ 2 теста (полная интеграция с backend)
├── file-system.spec.ts    # ✅ 6 тестов
├── notifications.spec.ts  # ✅ 5 тестов
├── project-management.spec.ts # ✅ 5 тестов
└── window-clipboard.spec.ts   # ✅ 9 тестов
```

## 🎯 Что тестируем

### App Core (Ядро приложения)
- **startup.spec.ts** ✅ - Порядок инициализации, загрузка сервисов, XState machines, event listeners

### Features (Фичи)
- **Browser** ✅ - Импорт медиа, Tauri API, метаданные файлов
- **AI Director** ✅ - Backend integration, команды, события
- **Video Player** ⏳ - Playback, контролы, синхронизация с timeline
- **AI Chat** ⏳ - Разговоры, команды, streaming

### Domains (Корневые тесты)
- **File System** ✅ - Tauri FS API, чтение/запись файлов
- **Notifications** ✅ - Tauri notifications plugin
- **Project Management** ✅ - Сохранение/загрузка проектов
- **Window & Clipboard** ✅ - Window API, буфер обмена

### Integration (Интеграция)
- **Media Import** ✅ - Полная интеграция: команды → события → состояние → логи
- ⏳ Комплексные сценарии использования
- ⏳ Взаимодействие между фичами

## 🚀 Запуск тестов

```bash
# Все Tauri E2E тесты
bun run test:e2e:tauri:dev

# С UI для отладки
bun run test:e2e:tauri:ui

# Конкретный файл
bunx playwright test e2e/tauri/features/browser/navigation.spec.ts

# Только app-core тесты
bunx playwright test e2e/tauri/app-core/
```

## 🧰 Backend Integration Helpers

Для полноценного интеграционного тестирования с Tauri backend доступны специальные helpers.

### Backend Logger (backend-logger.ts)

Перехват и анализ логов из Tauri backend:

```typescript
import { createLogCapture } from "../helpers/backend-logger"

const logCapture = createLogCapture()
await logCapture.start(page)

// Получить все логи
const logs = logCapture.getLogs()

// Фильтрация по уровню
const errors = logCapture.getErrors()
const warnings = logCapture.getWarnings()

// Поиск по паттерну
const importLogs = logCapture.findLogs(/import|media|add/i)

// Ожидание конкретного лога
const log = await logCapture.waitForLog(/media.*imported/, { timeout: 5000 })

// Проверка отсутствия ошибок
logCapture.assertNoErrors()

// Статистика
const stats = logCapture.getStats()
console.log(`Total: ${stats.total}, Errors: ${stats.byLevel.error}`)
```

### Backend Events (backend-events.ts)

Работа с Command-Event Pattern:

```typescript
import {
  createEventCapture,
  executeCommand,
  executeCommandAndWaitForEvent,
  assertCommandSuccess,
  assertEventReceived,
  getProjectState,
} from "../helpers/backend-events"

// Создать захват событий
const eventCapture = createEventCapture()
await eventCapture.start(page)

// Выполнить команду
const result = await executeCommand(page, "add_imported_media", { path: filePath })
assertCommandSuccess(result, "add_imported_media")

// Выполнить команду и дождаться события
const { commandResult, event } = await executeCommandAndWaitForEvent(
  page,
  "add_imported_media",
  { path: filePath },
  "ImportedMediaAdded",
  eventCapture,
  { timeout: 10000 }
)

// Проверить событие
assertEventReceived(event, "ImportedMediaAdded", ["path"])

// Получить состояние проекта
const state = await getProjectState(page)

// Получить события по типу
const events = eventCapture.getEventsByType("ImportedMediaAdded")

// Статистика
const stats = eventCapture.getStats()
console.log(`Events: ${stats.total}, Latest version: ${stats.latestVersion}`)
```

## 📝 Написание тестов

### Базовый шаблон

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => typeof (window as any).__TAURI__ !== 'undefined')
  })

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.locator('[data-testid="element"]')

    // Act
    await element.click()

    // Assert
    expect(await element.isVisible()).toBe(true)
  })
})
```

### Интеграционный тест с Backend

Полноценная проверка команд, событий, состояния и логов:

```typescript
import { test, expect } from "@playwright/test"
import { createLogCapture } from "../helpers/backend-logger"
import {
  createEventCapture,
  executeCommandAndWaitForEvent,
  assertCommandSuccess,
  assertEventReceived,
  getProjectState,
} from "../helpers/backend-events"
import { waitForTauriReady } from "../helpers/tauri-helpers"

test.describe("Media Import Integration", () => {
  test("should import file with full backend integration", async ({ page }) => {
    // 1. Инициализация
    await page.goto("/")
    await waitForTauriReady(page, 30000)

    // 2. Настройка перехвата
    const logCapture = createLogCapture()
    const eventCapture = createEventCapture()

    await logCapture.start(page)
    await eventCapture.start(page)

    // 3. Проверка начального состояния
    const initialState = await getProjectState(page)
    expect(initialState?.imported_media || []).toHaveLength(0)

    // 4. Выполнение команды и ожидание события
    const filePath = "/path/to/test/file.mp4"
    const { commandResult, event } = await executeCommandAndWaitForEvent(
      page,
      "add_imported_media",
      { path: filePath },
      "ImportedMediaAdded",
      eventCapture,
      { timeout: 10000 }
    )

    // 5. Проверка результата команды
    assertCommandSuccess(commandResult, "add_imported_media")

    // 6. Проверка события
    assertEventReceived(event, "ImportedMediaAdded", ["path"])
    expect(event.event.payload.path).toBe(filePath)

    // 7. Проверка состояния после импорта
    const stateAfterImport = await getProjectState(page)
    expect(stateAfterImport.imported_media).toContainEqual(
      expect.objectContaining({ path: filePath })
    )

    // 8. Проверка логов
    const errors = logCapture.getErrors()
    expect(errors).toHaveLength(0)

    // Очистка
    logCapture.stop()
    eventCapture.stop()
  })
})
```

### Best Practices

1. **Всегда проверяйте три аспекта:**
   - ✅ Команда выполнилась успешно
   - ✅ Событие получено с правильным payload
   - ✅ Состояние обновилось корректно

2. **Проверяйте логи:**
   - Используйте `logCapture.assertNoErrors()` для критических операций
   - Ищите ожидаемые логи через `findLogs()` или `waitForLog()`

3. **Command-Event Pattern:**
   - Backend = Single Source of Truth
   - Frontend отправляет команды → Backend публикует события
   - Всегда ждите событие после команды для полной синхронизации

4. **Очистка:**
   - Останавливайте captures после теста: `logCapture.stop()`, `eventCapture.stop()`
   - Используйте `beforeEach` для очистки состояния между тестами

## 🔗 Связанная документация

- [Playwright Documentation](https://playwright.dev)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Testing Strategy](/docs/05_development/ru/testing-strategy.md)
