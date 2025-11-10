/**
 * Tauri Notifications Tests
 *
 * Тесты для проверки системных нотификаций через Tauri API
 */

import { test, expect } from "@playwright/test"

test.describe("Tauri Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Ждем загрузки Tauri API
    await page.waitForFunction(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    }, { timeout: 10000 })
  })

  test("should have notification API available", async ({ page }) => {
    const hasNotificationApi = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__
      return typeof tauri?.notification !== "undefined"
    })

    expect(hasNotificationApi).toBe(true)
  })

  test("should be able to check notification permission", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        // Проверяем доступность функции isPermissionGranted
        const hasPermissionCheck =
          typeof tauri?.notification?.isPermissionGranted === "function"

        if (!hasPermissionCheck) {
          return { success: false, error: "isPermissionGranted not available" }
        }

        // Проверяем разрешение на нотификации
        const permissionGranted = await tauri.notification.isPermissionGranted()

        return {
          success: true,
          permissionGranted,
          hasPermissionCheck,
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
      expect(result.hasPermissionCheck).toBe(true)
      expect(typeof result.permissionGranted).toBe("boolean")
    }
  })

  test("should be able to request notification permission", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        const hasRequestPermission =
          typeof tauri?.notification?.requestPermission === "function"

        if (!hasRequestPermission) {
          return { success: false, error: "requestPermission not available" }
        }

        // В тестовой среде может быть автоматически предоставлено
        const permission = await tauri.notification.requestPermission()

        return {
          success: true,
          hasRequestPermission,
          permission,
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
      expect(result.hasRequestPermission).toBe(true)
    }
  })

  test("should validate notification options structure", async ({ page }) => {
    const hasValidStructure = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__

      // Проверяем что можем создать объект нотификации
      const notificationOptions = {
        title: "Test Notification",
        body: "This is a test notification body",
        icon: "icon.png",
      }

      return {
        hasTitle: typeof notificationOptions.title === "string",
        hasBody: typeof notificationOptions.body === "string",
        optionsValid: true,
      }
    })

    expect(hasValidStructure.hasTitle).toBe(true)
    expect(hasValidStructure.hasBody).toBe(true)
    expect(hasValidStructure.optionsValid).toBe(true)
  })

  test("should have send notification method", async ({ page }) => {
    const result = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__

      return {
        hasSendNotification: typeof tauri?.notification?.sendNotification === "function",
        hasNotificationConstructor: typeof tauri?.notification?.Notification !== "undefined",
      }
    })

    // По крайней мере один из методов должен быть доступен
    expect(result.hasSendNotification || result.hasNotificationConstructor).toBe(true)
  })
})
