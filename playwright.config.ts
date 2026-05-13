import { defineConfig, devices } from "@playwright/test"

// Порты сервисов
const FRONTEND_PORT = 3001
const NODE_BACKEND_PORT = parseInt(process.env.NODE_BACKEND_PORT ?? "3100", 10)

export const BACKEND_URL = process.env.NODE_BACKEND_URL ?? `http://localhost:${NODE_BACKEND_PORT}`

export default defineConfig({
  testDir: "./e2e",
  // Запускаем тесты последовательно для стабильности
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [["html"], ["list"], ["junit", { outputFile: "test-results/junit.xml" }]],

  // Глобальный таймаут для каждого теста
  timeout: 60000,

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Увеличиваем таймауты для стабильности
    navigationTimeout: 60000,
    actionTimeout: 30000,

    // Размер окна браузера
    viewport: { width: 1920, height: 1080 },

    // Опции запуска
    launchOptions: {
      slowMo: process.env.CI ? 0 : 50,
    },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Добавляем permissions для clipboard и file access
        permissions: ["clipboard-read", "clipboard-write"],
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Проект для запуска с реальным Tauri приложением
    {
      name: "tauri",
      use: {
        ...devices["Desktop Chrome"],
        // Для Tauri тестов используем другой порт
        baseURL: "http://localhost:1420",
      },
      // Не запускаем dev сервер для Tauri тестов
      testMatch: "**/e2e/tauri/**/*.spec.ts",
    },

    // Интеграционные тесты: фронт + Node.js бэкенд вместе
    {
      name: "node-backend-integration",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${FRONTEND_PORT}`,
        permissions: ["clipboard-read", "clipboard-write"],
      },
      testMatch: "**/e2e/integration/**/*.spec.ts",
    },
  ],

  webServer: [
    // Фронтенд (Next.js)
    {
      command: `bun run dev -- --port ${FRONTEND_PORT}`,
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      stdout: "pipe",
      stderr: "pipe",
    },
    // Node.js медиа-бэкенд
    {
      command: `PORT=${NODE_BACKEND_PORT} bun run ./src-node/src/main.ts`,
      url: `http://localhost:${NODE_BACKEND_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],

  // Глобальный setup/teardown
  globalSetup: "./e2e/global-setup",
  globalTeardown: "./e2e/global-teardown",
})
