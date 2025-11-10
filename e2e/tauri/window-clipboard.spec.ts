/**
 * Tauri Window and Clipboard Tests
 *
 * Тесты для проверки управления окнами и работы с клипбордом через Tauri API
 */

import { test, expect } from "@playwright/test"

test.describe("Tauri Window Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Ждем загрузки Tauri API
    await page.waitForFunction(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    }, { timeout: 10000 })
  })

  test("should have window API available", async ({ page }) => {
    const hasWindowApi = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__
      return typeof tauri?.window !== "undefined"
    })

    expect(hasWindowApi).toBe(true)
  })

  test("should be able to get current window", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        // Получаем текущее окно
        const currentWindow = tauri.window.getCurrent()

        return {
          success: true,
          hasCurrentWindow: currentWindow !== null && currentWindow !== undefined,
          hasLabel: typeof currentWindow?.label === "string",
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        }
      }
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.hasCurrentWindow).toBe(true)
    }
  })

  test("should be able to get window label", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        const currentWindow = tauri.window.getCurrent()
        const label = currentWindow.label

        return {
          success: true,
          label,
          isString: typeof label === "string",
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        }
      }
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.isString).toBe(true)
      expect(result.label.length).toBeGreaterThan(0)
    }
  })

  test("should have window state methods available", async ({ page }) => {
    const hasMethods = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__
      const currentWindow = tauri.window.getCurrent()

      return {
        hasMinimize: typeof currentWindow?.minimize === "function",
        hasMaximize: typeof currentWindow?.maximize === "function",
        hasClose: typeof currentWindow?.close === "function",
        hasSetTitle: typeof currentWindow?.setTitle === "function",
        hasSetSize: typeof currentWindow?.setSize === "function",
        hasSetPosition: typeof currentWindow?.setPosition === "function",
      }
    })

    expect(hasMethods.hasMinimize).toBe(true)
    expect(hasMethods.hasMaximize).toBe(true)
    expect(hasMethods.hasClose).toBe(true)
    expect(hasMethods.hasSetTitle).toBe(true)
  })

  test("should be able to check window state", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        const currentWindow = tauri.window.getCurrent()

        // Проверяем доступность методов для получения состояния
        const hasStateChecks =
          typeof currentWindow?.isFullscreen === "function" &&
          typeof currentWindow?.isMaximized === "function" &&
          typeof currentWindow?.isMinimized === "function"

        if (!hasStateChecks) {
          return { success: true, hasStateChecks: false }
        }

        // Получаем состояние окна
        const isFullscreen = await currentWindow.isFullscreen()
        const isMaximized = await currentWindow.isMaximized()
        const isMinimized = await currentWindow.isMinimized()

        return {
          success: true,
          hasStateChecks: true,
          isFullscreen,
          isMaximized,
          isMinimized,
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        }
      }
    })

    expect(result.success).toBe(true)
    if (result.success && result.hasStateChecks) {
      expect(typeof result.isFullscreen).toBe("boolean")
      expect(typeof result.isMaximized).toBe("boolean")
      expect(typeof result.isMinimized).toBe("boolean")
    }
  })
})

test.describe("Tauri Clipboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    await page.waitForFunction(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    }, { timeout: 10000 })
  })

  test("should have clipboard API available", async ({ page }) => {
    const hasClipboardApi = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__
      return typeof tauri?.clipboard !== "undefined"
    })

    expect(hasClipboardApi).toBe(true)
  })

  test("should have clipboard read/write methods", async ({ page }) => {
    const hasMethods = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__

      return {
        hasReadText: typeof tauri?.clipboard?.readText === "function",
        hasWriteText: typeof tauri?.clipboard?.writeText === "function",
      }
    })

    expect(hasMethods.hasReadText).toBe(true)
    expect(hasMethods.hasWriteText).toBe(true)
  })

  test("should be able to write and read text from clipboard", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__
      const testText = "Test Clipboard Content"

      try {
        // Записываем текст в буфер обмена
        await tauri.clipboard.writeText(testText)

        // Читаем текст из буфера обмена
        const clipboardContent = await tauri.clipboard.readText()

        return {
          success: true,
          written: testText,
          read: clipboardContent,
          matches: testText === clipboardContent,
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        }
      }
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.matches).toBe(true)
      expect(result.read).toBe(result.written)
    }
  })

  test("should handle empty clipboard", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        // Очищаем буфер обмена
        await tauri.clipboard.writeText("")

        // Читаем содержимое
        const content = await tauri.clipboard.readText()

        return {
          success: true,
          content,
          isEmpty: content === "" || content === null,
        }
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message,
        }
      }
    })

    expect(result.success).toBe(true)
  })
})
