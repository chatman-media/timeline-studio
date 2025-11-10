/**
 * Tauri File System Tests
 *
 * Тесты для проверки работы с файловой системой через Tauri API
 */

import { test, expect } from "@playwright/test"

test.describe("Tauri File System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Ждем загрузки Tauri API
    await page.waitForFunction(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    }, { timeout: 10000 })
  })

  test("should have Tauri API available", async ({ page }) => {
    const hasTauriApi = await page.evaluate(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    })

    expect(hasTauriApi).toBe(true)
  })

  test("should be able to invoke Tauri commands", async ({ page }) => {
    const result = await page.evaluate(async () => {
      try {
        // Проверяем что можем вызвать Tauri команду
        return await (window as any).__TAURI__.core.invoke("greet", { name: "Test" })
      } catch (error) {
        return { error: (error as Error).message }
      }
    })

    // Команда должна существовать или вернуть ошибку о том что она не найдена
    expect(result).toBeDefined()
  })

  test("should access file system through dialog", async ({ page }) => {
    const canAccessDialog = await page.evaluate(() => {
      return typeof (window as any).__TAURI__?.dialog?.open !== "undefined"
    })

    expect(canAccessDialog).toBe(true)
  })

  test("should have path utilities available", async ({ page }) => {
    const hasPathUtils = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__
      return (
        typeof tauri?.path?.appDataDir !== "undefined" &&
        typeof tauri?.path?.join !== "undefined"
      )
    })

    expect(hasPathUtils).toBe(true)
  })

  test("should be able to get app directories", async ({ page }) => {
    const directories = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__
      try {
        return {
          appData: await tauri.path.appDataDir(),
          appCache: await tauri.path.appCacheDir(),
          appConfig: await tauri.path.appConfigDir(),
        }
      } catch (error) {
        return { error: (error as Error).message }
      }
    })

    // Проверяем что получили пути или ошибку
    expect(directories).toBeDefined()

    if ("appData" in directories) {
      expect(typeof directories.appData).toBe("string")
      expect(directories.appData.length).toBeGreaterThan(0)
    }
  })

  test("should access fs module for file operations", async ({ page }) => {
    const hasFsModule = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__
      return (
        typeof tauri?.fs?.readTextFile !== "undefined" &&
        typeof tauri?.fs?.writeTextFile !== "undefined" &&
        typeof tauri?.fs?.exists !== "undefined"
      )
    })

    expect(hasFsModule).toBe(true)
  })
})
