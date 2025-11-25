# Стратегия тестирования Timeline Studio

## Обзор

Timeline Studio использует многоуровневый подход к тестированию, обеспечивающий качество кода на всех уровнях - от отдельных функций до полного приложения.

## Уровни тестирования

### 1. Unit Tests (Юнит-тесты)

#### Frontend (Vitest + Testing Library)
- **Количество:** 10,190+ тестов
- **Покрытие:** Domains, Features, Components, Hooks
- **Запуск:** `bun run test`
- **Watch mode:** `bun run test:watch`
- **Цель:** Тестирование изолированных функций, компонентов, hooks

**Примеры:**
```typescript
// Тест компонента
describe("VideoPlayer", () => {
  it("should play video when play button clicked", () => {
    const { getByRole } = render(<VideoPlayer />)
    fireEvent.click(getByRole("button", { name: /play/i }))
    expect(mockPlay).toHaveBeenCalled()
  })
})

// Тест XState машины
describe("TimelineMachine", () => {
  it("should transition to playing state", () => {
    const actor = createActor(timelineMachine)
    actor.start()
    actor.send({ type: "PLAY" })
    expect(actor.getSnapshot().value).toBe("playing")
  })
})

// Тест хука
describe("useTimeline", () => {
  it("should add clip to timeline", () => {
    const { result } = renderHook(() => useTimeline())

    act(() => {
      result.current.addClip({
        id: "clip-1",
        startTime: 0,
        duration: 10
      })
    })

    expect(result.current.clips).toHaveLength(1)
  })
})
```

#### Backend (Rust - cargo test)
- **Количество:** ~150 тестов
- **Покрытие:** Services, Utils, FFmpeg integration
- **Запуск:** `bun run test:rust`
- **Цель:** Тестирование Rust бизнес-логики

**Примеры:**
```rust
#[tokio::test]
async fn test_video_analysis() {
    let result = analyze_video("test.mp4").await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap().duration, 120.0);
}

#[test]
fn test_timeline_serialization() {
    let timeline = Timeline::new();
    let json = serde_json::to_string(&timeline).unwrap();
    assert!(json.contains("tracks"));
}
```

### 2. Storybook (Визуальная документация и разработка)

**Storybook** - интерактивная среда для разработки и документирования UI компонентов в изоляции.

- **Инструмент:** Storybook 8.x для Next.js
- **Запуск:** `bun run storybook`
- **Build:** `bun run build-storybook`
- **URL:** http://localhost:6006

#### Преимущества Storybook:
1. **Изолированная разработка** - работа с компонентами без запуска всего приложения
2. **Визуальная документация** - автоматическая документация компонентов
3. **Тестирование состояний** - демонстрация различных состояний компонента
4. **Совместная работа** - дизайнеры и разработчики видят одно и то же
5. **Visual regression testing** - возможность автоматического тестирования изменений UI

#### Структура Stories

```
src/features/
├── timeline/
│   └── components/
│       ├── edit-mode-selector.stories.tsx
│       ├── split-edit-toolbar.stories.tsx
│       └── snap-feedback.stories.tsx
├── video-player/
│   └── components/
│       └── video-player.stories.tsx
├── browser/
│   └── components/
│       └── browser-tabs.stories.tsx
├── ai-chat/
│   └── components/
│       └── chat-message.stories.tsx
├── options/
│   └── components/
│       ├── speed-settings.stories.tsx
│       └── audio-settings.stories.tsx
└── ai-director/
    └── components/
        └── v3/
            ├── empty-state.stories.tsx
            ├── file-analysis-card.stories.tsx
            ├── overall-progress-card.stories.tsx
            ├── media-pool-selector.stories.tsx
            └── analysis-settings.stories.tsx
```

#### Пример Story файла:

```typescript
import type { Meta, StoryObj } from "@storybook/react"
import { fn } from "@storybook/test"
import { EmptyState } from "./empty-state"

const meta = {
  title: "Features/AI Director/v3/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Компонент пустого состояния для AI Director v3"
      }
    }
  },
  tags: ["autodocs"],
  args: {
    onSelectFiles: fn()
  }
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const BalancedMode: Story = {
  args: {
    currentSettings: {
      mode: "balanced",
      analyzers: ["scene_detection", "audio_quality"]
    }
  }
}

export const FastMode: Story = {
  args: {
    currentSettings: {
      mode: "fast",
      analyzers: ["scene_detection"]
    }
  }
}
```

#### Storybook vs Unit Tests

| Аспект | Storybook | Unit Tests |
|--------|-----------|------------|
| **Цель** | Визуальная разработка и документация | Функциональное тестирование |
| **Когда использовать** | Разработка UI, демонстрация состояний | Проверка логики, граничные случаи |
| **Интерактивность** | Высокая (controls, actions) | Низкая (автоматизированные проверки) |
| **Документация** | Автоматическая из JSDoc | Описывает поведение через тесты |
| **Покрытие** | Визуальные состояния | Логика и edge cases |

**Рекомендация:** Используйте оба подхода вместе:
- **Storybook** для разработки UI и демонстрации различных состояний
- **Unit Tests** для проверки логики, обработки ошибок и граничных случаев

### 3. Integration Tests (Интеграционные тесты)

#### Frontend Integration
- **Количество:** Встроены в unit тесты
- **Покрытие:** Cross-domain взаимодействие, State management
- **Запуск:** `bun run test src/**/*integration*.test.ts`

**Примеры:**
```typescript
describe("Media Import Flow", () => {
  it("should import media and update timeline", async () => {
    const { result } = renderHook(() => useMediaManagement())

    await act(async () => {
      await result.current.importFiles(["video.mp4"])
    })

    expect(result.current.mediaPool).toHaveLength(1)
  })
})
```

#### Backend Integration (Rust)
- **Запуск:** `cd src-tauri && cargo test --test '*'`
- **Цель:** Тестирование FFmpeg, ONNX Runtime, File system

### 4. E2E Tests (End-to-End тесты)

У нас есть **3 подхода** к E2E тестированию:

#### A) Web-версия (Next.js dev server)
✅ **Уже настроено**
- **Количество:** 54 теста
- **Инструмент:** Playwright
- **Запуск:** `bun run test:e2e`
- **Порт:** 3001

**Преимущества:**
- Быстрый запуск
- Легко отлаживать
- Работает в CI/CD

**Недостатки:**
- Не тестирует Tauri API
- Не тестирует native функционал

**Структура:**
```
e2e/tests/
├── browser.spec.ts              # Браузер медиа файлов
├── browser-performance.spec.ts  # Performance тесты
├── timeline.spec.ts             # Timeline функционал
└── video-player.spec.ts         # Видеоплеер
```

#### B) Tauri приложение (WebDriver)
✅ **Настроено и работает**
- **Количество:** 25 тестов в 4 файлах
- **Инструмент:** Playwright + Tauri API
- **Порт:** 1420 (Tauri dev)
- **Запуск:** `bun run test:e2e:tauri:dev`

**Доступные команды:**
```bash
# Автоматический запуск (запускает Tauri dev + тесты)
bun run test:e2e:tauri:dev

# Ручной запуск (требует запущенный `bun run tauri dev`)
bun run test:e2e:tauri

# С UI интерфейсом
bun run test:e2e:tauri:ui
```

**Структура тестов:**
```
e2e/tauri/
├── file-system.spec.ts        # Файловая система через Tauri API (6 тестов)
├── project-management.spec.ts # Сохранение/загрузка проектов (5 тестов)
├── notifications.spec.ts      # Системные нотификации (5 тестов)
├── window-clipboard.spec.ts   # Окна и clipboard (9 тестов)
├── pages/                     # Page Objects
│   └── app.page.ts
├── helpers/                   # Вспомогательные функции
│   └── tauri-helpers.ts
└── README.md                  # Подробная документация
```

**Преимущества:**
- Тестирует реальный Tauri API
- Доступ к нативным функциям (файлы, нотификации, окна)
- Полный функционал desktop приложения

**Пример теста:**
```typescript
test("should save project file", async ({ page }) => {
  await page.goto("/")

  const result = await page.evaluate(async () => {
    const tauri = (window as any).__TAURI__
    await tauri.fs.writeTextFile("/tmp/test.tsp", JSON.stringify({
      name: "Test Project",
      timeline: { tracks: [] }
    }))
    return await tauri.fs.exists("/tmp/test.tsp")
  })

  expect(result).toBe(true)
})
```

#### C) Tauri Bundle Testing (Production build)
🔥 **Наиболее полное тестирование**
- **Инструмент:** Playwright + Tauri CLI
- **Запуск собранного .app/.exe**

**Как настроить:**

1. **Создать test harness:**
```typescript
// e2e/tauri/bundle-test.ts
import { _electron as electron } from "playwright"
import { test, expect } from "@playwright/test"
import path from "node:path"

test.describe("Tauri Bundle", () => {
  test("should launch and load UI", async () => {
    const appPath = path.join(
      process.cwd(),
      "src-tauri/target/release/bundle/macos/Timeline Studio.app/Contents/MacOS/Timeline Studio"
    )

    const app = await electron.launch({
      executablePath: appPath,
      env: {
        ...process.env,
        TAURI_ENV_DEBUG: "1"
      }
    })

    const window = await app.firstWindow()
    await window.waitForLoadState("domcontentloaded")

    const title = await window.title()
    expect(title).toContain("Timeline Studio")

    await app.close()
  })
})
```

2. **CI/CD интеграция:**
```yaml
# .github/workflows/e2e-tauri.yml
- name: Build Tauri app
  run: bun run tauri build

- name: Run bundle tests (macOS)
  run: |
    chmod +x "src-tauri/target/release/bundle/macos/Timeline Studio.app/Contents/MacOS/Timeline Studio"
    bun run test:e2e:bundle
```

### 5. Visual Regression Tests (Визуальное тестирование)

**Playwright Screenshots:**
```typescript
test("timeline should match screenshot", async ({ page }) => {
  await page.goto("/")
  await page.locator("[data-testid='timeline']").waitFor()

  await expect(page).toHaveScreenshot("timeline.png", {
    maxDiffPixels: 100
  })
})
```

**Chromatic + Storybook:**
```bash
# Автоматическое визуальное тестирование stories
npm run chromatic
```

### 6. Performance Tests (Тесты производительности)

✅ **Уже есть:** `e2e/browser-performance.spec.ts`

**Можно добавить:**
```typescript
// e2e/tests/video-processing-performance.spec.ts
test("should process 4K video under 5 seconds", async ({ page }) => {
  const start = Date.now()

  await page.evaluate(async () => {
    return await window.__TAURI__.invoke("process_video", {
      input: "4k-test.mp4",
      output: "output.mp4"
    })
  })

  const duration = Date.now() - start
  expect(duration).toBeLessThan(5000)
})
```

### 7. Accessibility Tests (Доступность)

**axe-core интеграция:**
```typescript
import { injectAxe, checkA11y } from "axe-playwright"

test("should be accessible", async ({ page }) => {
  await page.goto("/")
  await injectAxe(page)
  await checkA11y(page)
})
```

## Организация тестов

### Структура директорий

```
timeline-studio/
├── src/
│   ├── features/
│   │   └── [feature]/
│   │       ├── components/
│   │       │   ├── component.tsx
│   │       │   ├── component.stories.tsx    # Storybook stories
│   │       │   └── __tests__/
│   │       │       └── component.test.tsx   # Unit tests
│   │       ├── hooks/
│   │       │   ├── use-hook.ts
│   │       │   └── __tests__/
│   │       │       └── use-hook.test.ts
│   │       ├── services/
│   │       │   └── __tests__/
│   │       └── __mocks__/                   # Feature-specific mocks
│   ├── test/
│   │   ├── setup.ts                         # Global test setup
│   │   ├── mocks/                           # Shared mocks
│   │   │   ├── tauri.ts
│   │   │   ├── browser.ts
│   │   │   └── libraries/
│   │   └── utils/                           # Test utilities
│   │       └── audio-test-utils.ts
│   └── src-tauri/
│       └── src/
│           └── tests/                       # Rust unit tests
├── e2e/
│   ├── tests/                               # Web E2E tests
│   │   ├── browser.spec.ts
│   │   ├── timeline.spec.ts
│   │   └── video-player.spec.ts
│   └── tauri/                               # Tauri E2E tests
│       ├── file-system.spec.ts
│       ├── project-management.spec.ts
│       ├── notifications.spec.ts
│       ├── window-clipboard.spec.ts
│       ├── pages/                           # Page Objects
│       ├── helpers/                         # Test helpers
│       └── README.md
└── .storybook/                              # Storybook configuration
    ├── main.ts
    └── preview.ts
```

### Именование файлов

- **Компоненты:** `component-name.tsx`
- **Stories:** `component-name.stories.tsx`
- **Unit tests:** `component-name.test.tsx` (в `__tests__/`)
- **E2E tests:** `feature-name.spec.ts` (в `e2e/`)
- **Mocks:** Имя модуля (в `__mocks__/`)

## Test Environment Setup

### Глобальная настройка (`src/test/setup.ts`)

```typescript
import { beforeEach, afterEach, vi } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"

// Cleanup после каждого теста
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Настройка моков
beforeEach(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })
})
```

### Централизованные моки (`src/test/mocks/`)

```typescript
// src/test/mocks/index.ts
export { tauriMocks } from "./tauri"
export { browserMocks } from "./browser"
export { libraryMocks } from "./libraries"

export function resetAllMocks() {
  vi.clearAllMocks()
  // Reset all mocks to initial state
}

export function setupEssentialMocks() {
  // Setup commonly used mocks
  tauriMocks.setupFileSystemMock()
  browserMocks.setupLocalStorageMock()
}
```

### Test Utilities

```typescript
// src/test/test-utils.tsx
import { render } from "@testing-library/react"
import { UserSettingsProvider } from "@/contexts/user-settings-provider"

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <UserSettingsProvider>
      {ui}
    </UserSettingsProvider>
  )
}

export * from "@testing-library/react"
```

## CI/CD Pipeline

```yaml
name: Full Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test
      - run: bun run test:coverage

  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
      - run: bun run test:rust

  e2e-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e

  e2e-tauri:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: actions-rs/toolchain@v1
      - run: bun install
      - run: bunx playwright install --with-deps
      - run: bun run test:e2e:tauri:dev

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
```

## Метрики качества

### Текущее состояние

- ✅ **Unit tests:** 10,190 passing (из 10,229 total, ~99.6%)
- ✅ **Rust tests:** 150+ passing
- ✅ **E2E Web tests:** 54 tests (Next.js dev server)
- ✅ **E2E Tauri tests:** 25 tests (Tauri API + native функции)
- ✅ **Storybook stories:** 50+ stories для основных компонентов
- ✅ **Test coverage:** ~85% lines, ~80% branches

### Целевые показатели

- Unit test coverage: **>85%** ✅
- Integration test coverage: **>75%** ✅
- E2E critical paths: **100%** ⏳
- Performance benchmarks: **Стабильны ±5%** ⏳
- Storybook coverage: **>90% компонентов** ⏳
- Accessibility score: **>95%** 🔄

## Лучшие практики

### 1. Test Pyramid
```
           E2E (54 + 25)
         /              \
    Integration (~100)
   /                      \
Unit Tests (10,000+)      Storybook (50+)
```

**Принципы:**
- Больше unit тестов, меньше E2E
- Storybook дополняет unit тесты для UI
- Интеграционные тесты покрывают критические пути
- E2E тесты для user journeys

### 2. Изоляция тестов
```typescript
// ❌ Плохо - тесты зависят друг от друга
let sharedState = {}

test("test 1", () => {
  sharedState.value = 1
})

test("test 2", () => {
  expect(sharedState.value).toBe(1) // Зависит от test 1
})

// ✅ Хорошо - каждый тест независим
test("test 1", () => {
  const state = { value: 1 }
  expect(state.value).toBe(1)
})

test("test 2", () => {
  const state = { value: 2 }
  expect(state.value).toBe(2)
})
```

### 3. Детерминизм
```typescript
// ❌ Плохо - недетерминированный тест
test("should generate ID", () => {
  expect(generateId()).toBe("abc123") // Может упасть случайно
})

// ✅ Хорошо - детерминированный тест
test("should generate ID", () => {
  vi.spyOn(Math, "random").mockReturnValue(0.5)
  expect(generateId()).toBe("abc123")
})
```

### 4. Скорость выполнения
- Unit tests: **< 1s** ✅
- Integration tests: **< 5s** ✅
- E2E Web tests: **< 30s** ✅
- E2E Tauri tests: **< 60s** ✅

### 5. Читаемость
```typescript
// ❌ Плохо - непонятное название
test("test1", () => {
  expect(fn()).toBe(true)
})

// ✅ Хорошо - описательное название
test("should return true when user is authenticated", () => {
  const user = { authenticated: true }
  expect(isUserAuthenticated(user)).toBe(true)
})
```

### 6. Arrange-Act-Assert (AAA)
```typescript
test("should add clip to timeline", () => {
  // Arrange - подготовка
  const timeline = createTimeline()
  const clip = createClip({ duration: 10 })

  // Act - действие
  timeline.addClip(clip)

  // Assert - проверка
  expect(timeline.clips).toHaveLength(1)
  expect(timeline.clips[0]).toBe(clip)
})
```

### 7. Что тестировать в Storybook vs Unit Tests

**Storybook (визуальные состояния):**
- Разные props комбинации
- Интерактивные состояния (hover, focus, active)
- Responsive layouts
- Темы (light/dark mode)
- Различные размеры контента

**Unit Tests (логика и граничные случаи):**
- Обработка ошибок
- Edge cases (пустые данные, null, undefined)
- Сложные вычисления
- Асинхронные операции
- Состояния машин (XState)

## Команды для запуска тестов

```bash
# Unit тесты
bun run test                  # Все unit тесты
bun run test:watch            # Watch mode
bun run test:coverage         # С покрытием
bun run test path/to/test.ts  # Конкретный файл

# Rust тесты
bun run test:rust             # Все Rust тесты
cd src-tauri && cargo test    # Прямой запуск

# E2E тесты
bun run test:e2e              # Web E2E (Next.js)
bun run test:e2e:tauri:dev    # Tauri E2E (с автозапуском dev)
bun run test:e2e:tauri        # Tauri E2E (требует запущенный dev)
bun run test:e2e:tauri:ui     # Tauri E2E с UI

# Storybook
bun run storybook             # Запуск Storybook dev
bun run build-storybook       # Сборка статической версии

# Линтинг
bun run lint                  # Проверка
bun run lint:fix              # Исправление

# Все вместе
bun run check:all             # Lint + тесты + типы
bun run fix:all               # Исправить все что можно
```

## Troubleshooting

### Частые проблемы

#### 1. Тесты падают из-за моков

**Проблема:** `Cannot find module '@/hooks/use-timeline'`

**Решение:**
```typescript
// Добавить мок в __mocks__/
vi.mock("@/hooks/use-timeline", () => ({
  useTimeline: () => ({
    clips: [],
    addClip: vi.fn()
  })
}))
```

#### 2. E2E тесты не находят элементы

**Проблема:** `Timeout waiting for selector`

**Решение:**
```typescript
// Использовать правильные selectors
await page.locator('[data-testid="timeline"]').waitFor()

// Добавить timeouts
await page.waitForSelector('[data-testid="timeline"]', {
  timeout: 10000
})
```

#### 3. Storybook не находит компонент

**Проблема:** `Module not found`

**Решение:**
```typescript
// Проверить пути импортов в .storybook/main.ts
export default {
  webpackFinal: async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../src')
    }
    return config
  }
}
```

#### 4. Memory leaks в тестах

**Проблема:** Тесты используют слишком много памяти

**Решение:**
```typescript
// Добавить cleanup
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Использовать --no-threads для отладки
bun run test --no-threads
```

## Дополнительные ресурсы

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [Storybook](https://storybook.js.org/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [E2E Tauri Tests README](../../e2e/tauri/README.md)
- [Test Utils Documentation](../../src/test/utils/README.md)
