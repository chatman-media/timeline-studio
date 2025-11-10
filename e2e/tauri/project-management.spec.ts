/**
 * Tauri Project Management Tests
 *
 * Тесты для проверки сохранения и загрузки проектов через Tauri API
 */

import { test, expect } from "@playwright/test"
import { join } from "node:path"
import { tmpdir } from "node:os"

test.describe("Tauri Project Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Ждем загрузки Tauri API
    await page.waitForFunction(() => {
      return typeof (window as any).__TAURI__ !== "undefined"
    }, { timeout: 10000 })
  })

  test("should be able to create and save project", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__
      const testProjectPath = "/tmp/test-project.tsp"

      try {
        // Создаем тестовый проект
        const projectData = {
          name: "Test Project",
          version: "1.0.0",
          timeline: {
            tracks: [],
            sections: [],
          },
          settings: {
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
          },
        }

        // Сохраняем проект через Tauri API
        await tauri.fs.writeTextFile(testProjectPath, JSON.stringify(projectData, null, 2))

        // Проверяем что файл создан
        const exists = await tauri.fs.exists(testProjectPath)

        // Читаем содержимое обратно
        const content = await tauri.fs.readTextFile(testProjectPath)
        const parsed = JSON.parse(content)

        // Удаляем тестовый файл
        await tauri.fs.remove(testProjectPath)

        return {
          success: true,
          exists,
          projectName: parsed.name,
          hasTimeline: !!parsed.timeline,
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
      expect(result.exists).toBe(true)
      expect(result.projectName).toBe("Test Project")
      expect(result.hasTimeline).toBe(true)
    }
  })

  test("should handle project file not found", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__
      const nonExistentPath = "/tmp/non-existent-project.tsp"

      try {
        await tauri.fs.readTextFile(nonExistentPath)
        return { success: false, error: "Should have thrown error" }
      } catch (error) {
        return {
          success: true,
          errorCaught: true,
          errorMessage: (error as Error).message,
        }
      }
    })

    expect(result.success).toBe(true)
    expect(result.errorCaught).toBe(true)
  })

  test("should be able to check project file existence", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__
      const testPath = "/tmp/existence-test.tsp"

      try {
        // Создаем файл
        await tauri.fs.writeTextFile(testPath, "{}")

        // Проверяем существование
        const existsBefore = await tauri.fs.exists(testPath)

        // Удаляем файл
        await tauri.fs.remove(testPath)

        // Проверяем что файл удален
        const existsAfter = await tauri.fs.exists(testPath)

        return {
          success: true,
          existsBefore,
          existsAfter,
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
      expect(result.existsBefore).toBe(true)
      expect(result.existsAfter).toBe(false)
    }
  })

  test("should access project-related Tauri commands", async ({ page }) => {
    const hasCommands = await page.evaluate(() => {
      const tauri = (window as any).__TAURI__

      return {
        hasInvoke: typeof tauri?.core?.invoke === "function",
        hasFs: typeof tauri?.fs !== "undefined",
        hasPath: typeof tauri?.path !== "undefined",
        hasDialog: typeof tauri?.dialog !== "undefined",
      }
    })

    expect(hasCommands.hasInvoke).toBe(true)
    expect(hasCommands.hasFs).toBe(true)
    expect(hasCommands.hasPath).toBe(true)
    expect(hasCommands.hasDialog).toBe(true)
  })

  test("should be able to get temp directory path", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const tauri = (window as any).__TAURI__

      try {
        // Получаем временную директорию
        const tempDir = await tauri.path.tempDir()

        return {
          success: true,
          hasTempDir: typeof tempDir === "string" && tempDir.length > 0,
          tempDir,
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
      expect(result.hasTempDir).toBe(true)
    }
  })
})
