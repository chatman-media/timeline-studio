# Стратегия тестирования Timeline Studio

## Уровни тестирования

### 1. Unit Tests (Юнит-тесты)

#### Frontend (Vitest + Testing Library)
- **Количество:** 9000+ тестов
- **Покрытие:** Domains, Features, Components
- **Запуск:** `bun run test`
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
├── ai-director/
│   └── components/
│       └── v3/
│           ├── empty-state.stories.tsx
│           ├── file-analysis-card.stories.tsx
│           ├── overall-progress-card.stories.tsx
│           ├── media-pool-selector.stories.tsx
│           └── analysis-settings.stories.tsx
├── timeline/
│   └── components/
│       ├── edit-mode-selector.stories.tsx
│       └── split-edit-toolbar.stories.tsx
└── options/
    └── components/
        ├── speed-settings.stories.tsx
        └── audio-settings.stories.tsx
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
- **Количество:** ~100 тестов
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

### 3. E2E Tests (End-to-End тесты)

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
    // Путь к собранному приложению
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

    // Проверяем что UI загрузился
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

### 4. Visual Regression Tests (Визуальное тестирование)

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

### 5. Performance Tests (Тесты производительности)

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

### 6. Accessibility Tests (Доступность)

**axe-core интеграция:**
```typescript
import { injectAxe, checkA11y } from "axe-playwright"

test("should be accessible", async ({ page }) => {
  await page.goto("/")
  await injectAxe(page)
  await checkA11y(page)
})
```

## Рекомендуемая структура

```
/tests
├── unit/                 # Юнит-тесты (Vitest)
│   ├── src/domains/      # Domain unit tests
│   ├── src/features/     # Feature unit tests
│   └── src-tauri/        # Rust unit tests
├── integration/          # Интеграционные тесты
│   ├── frontend/         # Frontend integration
│   └── backend/          # Rust integration
├── e2e/
│   ├── web/             # Next.js dev тесты (быстрые)
│   ├── tauri/           # Tauri dev тесты (средние)
│   └── bundle/          # Production bundle тесты (медленные)
└── performance/         # Performance benchmarks
```

## CI/CD Pipeline

```yaml
name: Full Test Suite

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: bun run test

  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - run: bun run test:rust

  e2e-web:
    runs-on: ubuntu-latest
    steps:
      - run: bun run test:e2e

  e2e-tauri:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - run: bun run tauri build
      - run: bun run test:e2e:tauri
```

## Метрики качества

### Текущее состояние
- ✅ Unit tests: **10,190 passing** (из 10,229 total, ~99.6%)
- ✅ Rust tests: **150+ passing**
- ✅ E2E Web tests: **54 tests** (Next.js dev server)
- ✅ E2E Tauri tests: **25 tests** (Tauri API + native функции)
- ✅ Storybook stories: **50+ stories** для основных компонентов

### Целевые показатели
- Unit test coverage: **>85%**
- Integration test coverage: **>75%**
- E2E critical paths: **100%**
- Performance benchmarks: **Стабильны ±5%**

## Лучшие практики

1. **Test Pyramid:** Больше unit, меньше E2E
2. **Изоляция:** Каждый тест независим
3. **Детерминизм:** Тесты дают одинаковый результат
4. **Скорость:** Unit < 1s, Integration < 5s, E2E < 30s
5. **Читаемость:** Описательные названия тестов
