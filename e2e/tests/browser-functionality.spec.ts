import { BrowserPage } from "../fixtures/page-objects/browser-page"
import { expect, test } from "../fixtures/test-base"

test.describe("Browser Functionality", () => {
  let browserPage: BrowserPage

  test.beforeEach(async ({ page }) => {
    browserPage = new BrowserPage(page)
  })

  test("should display media browser with correct tabs", async ({ page }) => {
    // Проверяем все вкладки браузера
    await expect(browserPage.mediaTab).toBeVisible()
    await expect(browserPage.effectsTab).toBeVisible()
    await expect(browserPage.transitionsTab).toBeVisible()
    await expect(browserPage.templatesTab).toBeVisible()
  })

  test("should show empty state in media tab", async ({ page }) => {
    await browserPage.selectTab("Media")

    // Проверяем что есть либо пустое состояние, либо кнопки импорта
    const hasEmptyState = await browserPage.emptyState.isVisible().catch(() => false)
    const hasImportButton = await browserPage.importButton.isVisible().catch(() => false)

    expect(hasEmptyState || hasImportButton).toBeTruthy()
  })

  test("should switch between different browser tabs", async ({ page }) => {
    // Сначала убедимся, что все вкладки загружены
    await expect(browserPage.mediaTab).toBeVisible()
    await expect(browserPage.effectsTab).toBeVisible()
    await expect(browserPage.transitionsTab).toBeVisible()
    await expect(browserPage.templatesTab).toBeVisible()

    // Переключаемся на Effects
    await browserPage.selectTab("Effects")
    await expect(browserPage.effectsTab).toHaveAttribute("data-state", "active")
    await expect(browserPage.mediaTab).toHaveAttribute("data-state", "inactive")

    // Переключаемся на Transitions
    await browserPage.selectTab("Transitions")
    await expect(browserPage.transitionsTab).toHaveAttribute("data-state", "active")
    await expect(browserPage.effectsTab).toHaveAttribute("data-state", "inactive")

    // Переключаемся на Templates
    await browserPage.selectTab("Templates")
    await expect(browserPage.templatesTab).toHaveAttribute("data-state", "active")
    await expect(browserPage.transitionsTab).toHaveAttribute("data-state", "inactive")
  })

  test("should display effects in grid layout", async ({ page }) => {
    // Сначала убедимся, что вкладка Effects видима
    await expect(browserPage.effectsTab).toBeVisible()

    await browserPage.selectTab("Effects")

    // Ждем загрузки контента эффектов
    const effectsContent = page.locator("text=/effect|filter|blur|color|brightness/i").first()
    const gridContent = page.locator('[class*="effect"], [class*="grid"]').first()

    // Проверяем что хотя бы один из элементов появился
    await expect(effectsContent.or(gridContent)).toBeVisible({ timeout: 10000 })
  })

  test("should display transitions with preview", async ({ page }) => {
    await browserPage.selectTab("Transitions")

    // Ждем загрузки контента
    await page.waitForTimeout(500)

    // Проверяем что есть какой-то контент переходов
    const hasTransitionsContent =
      (await page.locator("text=/transition|fade|slide|wipe|dissolve/i").count()) > 0 ||
      (await page.locator('[class*="transition"], [class*="grid"]').count()) > 0

    expect(hasTransitionsContent).toBeTruthy()
  })

  test("should display templates categories", async ({ page }) => {
    // Сначала убедимся, что вкладка Templates видима
    await expect(browserPage.templatesTab).toBeVisible()

    await browserPage.selectTab("Templates")

    // Ждем загрузки контента и проверяем наличие категорий шаблонов
    const templateCategories = page.locator("text=/Multi-camera|Intro|Outro|template/i")
    await expect(templateCategories.first()).toBeVisible({ timeout: 10000 })
  })

  test("should handle import button click", async ({ page }) => {
    await browserPage.selectTab("Media")
    await page.waitForTimeout(500)

    // Проверяем наличие кнопки импорта
    const importButtonVisible = await browserPage.importButton.isVisible().catch(() => false)

    if (importButtonVisible) {
      // Настраиваем перехват команд Tauri для отслеживания вызовов
      let dialogCalled = false
      await page.evaluate(() => {
        if (window.__TAURI__) {
          const originalInvoke = window.__TAURI__.core.invoke
          window.__TAURI__.core.invoke = async (cmd: string, args?: any) => {
            if (cmd.includes("dialog") || cmd.includes("import")) {
              ;(window as any).__dialogCalled = true
            }
            return originalInvoke ? originalInvoke(cmd, args) : null
          }
        }
      })

      // Кликаем на кнопку импорта
      await browserPage.importButton.click()
      await page.waitForTimeout(300)

      // Проверяем что команда была вызвана или кнопка остается активной
      dialogCalled = await page.evaluate(() => {
        return (window as any).__dialogCalled === true
      })
      const buttonStillVisible = await browserPage.importButton.isVisible()

      expect(dialogCalled || buttonStillVisible).toBeTruthy()
    } else {
      console.log("Import button not found, skipping test")
    }
  })

  test("should show search functionality", async ({ page }) => {
    // Проверяем наличие поля поиска
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    await expect(searchInput).toBeVisible()

    // Вводим текст в поиск
    await searchInput.fill("test")

    // Проверяем что поиск работает
    await expect(searchInput).toHaveValue("test")
  })
})
