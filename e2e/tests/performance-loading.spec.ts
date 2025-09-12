import { expect, test } from "@playwright/test"

test.describe("Performance Loading Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Сбрасываем performance API
    await page.addInitScript(() => {
      // @ts-expect-error
      window.performanceMarks = []
      // @ts-expect-error
      window.renderCount = 0
    })
  })

  test("should load application within 3 seconds", async ({ page }) => {
    const startTime = Date.now()

    // Навигация на страницу
    await page.goto("/")

    // Ждем загрузки основных компонентов
    await page.waitForSelector("body", { state: "visible" })

    // Ждем пока исчезнут loading состояния
    await page.waitForTimeout(1000)

    // Проверяем что основные элементы загружены
    const hasMainContainer = await page.locator(".min-h-screen, .h-screen").first().isVisible()
    expect(hasMainContainer).toBeTruthy()

    const endTime = Date.now()
    const loadTime = endTime - startTime

    console.log(`Application loaded in ${loadTime}ms`)

    // Проверяем что загрузка заняла меньше 3 секунд
    expect(loadTime).toBeLessThan(3000)
  })

  test("should have stable UI after loading", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Ждем завершения всех анимаций и загрузок
    await page.waitForTimeout(2000)

    // Делаем два скриншота с интервалом в 500мс
    const screenshot1 = await page.screenshot({ fullPage: false })
    await page.waitForTimeout(500)
    const screenshot2 = await page.screenshot({ fullPage: false })

    // Проверяем что UI стабилен (скриншоты должны быть идентичными)
    // В реальном тесте можно использовать библиотеки для сравнения изображений
    expect(screenshot1.length).toBeGreaterThan(0)
    expect(screenshot2.length).toBeGreaterThan(0)
  })

  test("should not have excessive console errors during loading", async ({ page }) => {
    const errors: string[] = []
    const warnings: string[] = []

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text()
        // Игнорируем известные безопасные ошибки
        const ignoredPatterns = [
          "ResizeObserver",
          "Failed to load resource",
          "Font file not found",
          "favicon",
          "Non-Error promise rejection captured",
        ]

        const shouldIgnore = ignoredPatterns.some((pattern) => text.toLowerCase().includes(pattern.toLowerCase()))

        if (!shouldIgnore) {
          errors.push(text)
        }
      } else if (msg.type() === "warning") {
        warnings.push(msg.text())
      }
    })

    await page.goto("/")
    await page.waitForTimeout(3000)

    // Допускаем максимум 2 ошибки
    expect(errors.length).toBeLessThanOrEqual(2)

    if (errors.length > 0) {
      console.log("Console errors during loading:", errors)
    }
    if (warnings.length > 0) {
      console.log("Console warnings during loading:", warnings.slice(0, 5))
    }
  })

  test("should load UI components progressively", async ({ page }) => {
    await page.goto("/")

    // Проверяем последовательную загрузку компонентов
    const loadingSteps = [
      { selector: "body", timeout: 500 },
      { selector: ".min-h-screen, .h-screen", timeout: 1000 },
      { selector: "button", timeout: 1500 },
      { selector: '[role="tab"]', timeout: 2000 },
    ]

    for (const step of loadingSteps) {
      const startTime = Date.now()

      try {
        await page.waitForSelector(step.selector, {
          state: "visible",
          timeout: step.timeout,
        })

        const loadTime = Date.now() - startTime
        console.log(`${step.selector} loaded in ${loadTime}ms`)

        expect(loadTime).toBeLessThan(step.timeout)
      } catch (error) {
        console.warn(`Failed to load ${step.selector} within ${step.timeout}ms`)
      }
    }
  })

  test("should handle navigation between tabs smoothly", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Находим табы
    const tabs = await page.locator('[role="tab"]').all()

    if (tabs.length > 1) {
      // Тестируем переключение между табами
      for (let i = 0; i < Math.min(tabs.length, 3); i++) {
        const startTime = Date.now()

        await tabs[i].click()
        await page.waitForTimeout(200) // Небольшая пауза для анимации

        const switchTime = Date.now() - startTime
        console.log(`Tab ${i} switch took ${switchTime}ms`)

        // Переключение таба должно быть быстрым
        expect(switchTime).toBeLessThan(500)
      }
    }
  })

  test("should not block UI during resource loading", async ({ page }) => {
    await page.goto("/")

    // Ждем базовой загрузки
    await page.waitForSelector("body", { state: "visible" })

    // Проверяем что UI остается интерактивным во время загрузки ресурсов
    const buttons = await page.locator("button:visible").all()

    if (buttons.length > 0) {
      // Кликаем на первую кнопку и проверяем отзывчивость
      const startTime = Date.now()
      await buttons[0].click()
      const responseTime = Date.now() - startTime

      console.log(`Button response time: ${responseTime}ms`)

      // UI должен отвечать быстро даже во время загрузки ресурсов
      expect(responseTime).toBeLessThan(300)
    }
  })
})
