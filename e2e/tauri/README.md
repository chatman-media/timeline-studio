# Tauri E2E Tests

Тесты для проверки функционала Timeline Studio через Tauri API.

## Особенности

Эти тесты отличаются от обычных E2E тестов тем, что:
- Используют реальный Tauri runtime на порту 1420 (а не Next.js dev server на 3001)
- Имеют доступ к полному Tauri API (`window.__TAURI__`)
- Могут тестировать нативные функции (файловая система, нотификации, окна, clipboard)
- Требуют запущенного Tauri приложения в dev режиме

## Структура тестов

```
e2e/tauri/
├── file-system.spec.ts        # Тесты файловой системы через Tauri API
├── project-management.spec.ts # Сохранение и загрузка проектов
├── notifications.spec.ts      # Системные нотификации
├── window-clipboard.spec.ts   # Управление окнами и clipboard
└── README.md                  # Этот файл
```

## Запуск тестов

### Вариант 1: Автоматический запуск (рекомендуется)
```bash
# Запускает Tauri dev сервер и тесты автоматически
bun run test:e2e:tauri:dev
```

Эта команда:
1. Запускает `bun run tauri dev` (порт 1420)
2. Ждет пока сервер станет доступен
3. Запускает Playwright тесты с проектом "tauri"
4. Автоматически останавливает сервер после завершения

### Вариант 2: Ручной запуск

**Терминал 1 - запустите Tauri dev:**
```bash
bun run tauri dev
```

**Терминал 2 - запустите тесты:**
```bash
# Запуск всех Tauri тестов
bun run test:e2e:tauri

# Запуск с UI
bun run test:e2e:tauri:ui

# Запуск конкретного теста
playwright test --project=tauri e2e/tauri/file-system.spec.ts
```

### Вариант 3: Запуск вместе с обычными E2E тестами
```bash
# Запускает все E2E тесты (Web + Tauri)
bun run test:e2e
```

## Конфигурация

Настройки для Tauri тестов находятся в `playwright.config.ts`:

```typescript
{
  name: "tauri",
  use: {
    baseURL: "http://localhost:1420",  // Tauri dev server
  },
  testMatch: "**/e2e/tauri/**/*.spec.ts",
}
```

## Доступный Tauri API

В тестах доступен полный Tauri API через `window.__TAURI__`:

### Файловая система
```javascript
const tauri = window.__TAURI__

// Чтение файла
const content = await tauri.fs.readTextFile("/path/to/file.txt")

// Запись файла
await tauri.fs.writeTextFile("/path/to/file.txt", "content")

// Проверка существования
const exists = await tauri.fs.exists("/path/to/file.txt")

// Удаление файла
await tauri.fs.remove("/path/to/file.txt")
```

### Пути
```javascript
// Получение системных путей
const appData = await tauri.path.appDataDir()
const appCache = await tauri.path.appCacheDir()
const tempDir = await tauri.path.tempDir()

// Соединение путей
const fullPath = await tauri.path.join(appData, "projects", "file.tsp")
```

### Диалоги
```javascript
// Открыть диалог выбора файла
const filePath = await tauri.dialog.open({
  multiple: false,
  filters: [{
    name: "Project",
    extensions: ["tsp"]
  }]
})

// Сохранить файл
const savePath = await tauri.dialog.save({
  defaultPath: "project.tsp"
})
```

### Нотификации
```javascript
// Проверка разрешения
const granted = await tauri.notification.isPermissionGranted()

// Запрос разрешения
await tauri.notification.requestPermission()

// Отправка нотификации
await tauri.notification.sendNotification({
  title: "Export Complete",
  body: "Your video has been exported successfully"
})
```

### Управление окнами
```javascript
// Получить текущее окно
const window = tauri.window.getCurrent()

// Изменить заголовок
await window.setTitle("New Title")

// Изменить размер
await window.setSize({ width: 1920, height: 1080 })

// Состояние окна
const isMaximized = await window.isMaximized()
const isFullscreen = await window.isFullscreen()

// Управление
await window.minimize()
await window.maximize()
await window.close()
```

### Clipboard
```javascript
// Запись в буфер обмена
await tauri.clipboard.writeText("Text to copy")

// Чтение из буфера обмена
const text = await tauri.clipboard.readText()
```

### Команды (invoke)
```javascript
// Вызов Rust команды
const result = await tauri.core.invoke("command_name", {
  arg1: "value1",
  arg2: 42
})
```

## Написание новых тестов

### Структура теста
```typescript
import { test, expect } from "@playwright/test"

test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Ждем загрузки Tauri API
    await page.waitForFunction(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    }, { timeout: 10000 })
  })

  test("should do something", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      // Ваш код с Tauri API
      return await tauri.fs.readTextFile("/test.txt")
    })

    expect(result).toBeDefined()
  })
})
```

### Best Practices

1. **Всегда ждите загрузки Tauri API** перед использованием
2. **Используйте `page.evaluate()`** для доступа к `window.__TAURI__`
3. **Обрабатывайте ошибки** - некоторые команды могут быть недоступны в dev режиме
4. **Очищайте тестовые файлы** после каждого теста
5. **Используйте временные пути** для тестовых файлов
6. **Проверяйте доступность API** перед использованием

### Пример с обработкой ошибок
```typescript
test("should handle errors gracefully", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const tauri = (window as any).__TAURI__

    try {
      // Пытаемся прочитать несуществующий файл
      const content = await tauri.fs.readTextFile("/non-existent.txt")
      return { success: true, content }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      }
    }
  })

  expect(result.success).toBe(false)
  expect(result.error).toBeDefined()
})
```

## Отладка

### Просмотр логов Tauri
```bash
# Запустите с логированием
RUST_LOG=debug bun run tauri dev
```

### Использование Playwright UI
```bash
bun run test:e2e:tauri:ui
```

### Скриншоты при ошибках
Playwright автоматически делает скриншоты при падении тестов.
Найти их можно в `test-results/`.

### Трассировка
```bash
# Запуск с трассировкой
playwright test --project=tauri --trace on
```

## Troubleshooting

### Тест не может подключиться к порту 1420
**Решение:** Убедитесь что `bun run tauri dev` запущен и доступен.

### `window.__TAURI__` is undefined
**Решение:** Добавьте ожидание загрузки API:
```typescript
await page.waitForFunction(() => {
  return typeof (window as any).__TAURI__ !== "undefined"
})
```

### Таймауты при выполнении команд
**Решение:** Увеличьте таймаут в `playwright.config.ts` для проекта "tauri".

### Ошибки доступа к файловой системе
**Решение:**
- Проверьте права доступа к файлам
- Используйте временные директории для тестов
- Убедитесь что Tauri имеет необходимые разрешения в `tauri.conf.json`

## CI/CD

Для запуска в CI/CD добавьте в workflow:

```yaml
- name: Install Tauri dependencies
  run: |
    # Установка системных зависимостей
    sudo apt-get install -y libwebkit2gtk-4.1-dev

- name: Run Tauri E2E tests
  run: bun run test:e2e:tauri:dev
  timeout-minutes: 10
```

## Ссылки

- [Tauri Testing Guide](https://tauri.app/v2/guides/test/)
- [Playwright Documentation](https://playwright.dev/)
- [Tauri API Reference](https://tauri.app/v2/reference/js/)
