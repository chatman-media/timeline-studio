import { test as base } from "@playwright/test"

type TestFixtures = {
  autoGoto: undefined
  mockTauriAPI: undefined
}

// Расширяем базовый тест с полезными фикстурами
export const test = base.extend<TestFixtures>({
  // Автоматическая навигация на главную страницу
  autoGoto: [
    async ({ page }, use) => {
      await page.goto("/")
      await page.waitForLoadState("networkidle")

      // Wait for the app to be ready
      await page.waitForSelector('[role="tablist"]', { timeout: 30000 })

      // Wait for i18n to initialize (check for any translated text)
      await page.waitForFunction(
        () => {
          const tabs = document.querySelectorAll('[role="tab"]')
          return tabs.length > 0 && Array.from(tabs).some((tab) => tab.textContent && tab.textContent.length > 0)
        },
        { timeout: 30000 },
      )

      await use(undefined)
    },
    { auto: true },
  ],

  // Моки для Tauri API если приложение запущено в браузере
  mockTauriAPI: async ({ page }, use) => {
    // Мы больше не добавляем свои моки, так как TauriMockProvider
    // уже предоставляет все необходимые моки через window.__TAURI_INTERNALS__
    // Просто ждем инициализации приложения
    await page.waitForLoadState("networkidle")

    // Ждем, пока TauriMockProvider инициализируется
    await page.waitForFunction(
      () => {
        return (window as any).__TAURI_INTERNALS__ !== undefined
      },
      { timeout: 10000 },
    )

    await use(undefined)
  },
})

export { expect } from "@playwright/test"
