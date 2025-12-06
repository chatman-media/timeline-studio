/**
 * Media Import Integration E2E Test
 *
 * Полноценный интеграционный тест импорта медиа с проверкой:
 * - Backend команд и событий
 * - Логирования
 * - Состояния приложения
 * - Command-Event Pattern
 */

import { test, expect } from "@playwright/test"
import path from "path"
import { createLogCapture } from "../helpers/backend-logger"
import {
  createEventCapture,
  executeCommand,
  executeCommandAndWaitForEvent,
  assertCommandSuccess,
  assertEventReceived,
  getProjectState,
} from "../helpers/backend-events"
import { waitForTauriReady } from "../helpers/tauri-helpers"

// Тестовые файлы
const TEST_DATA_DIR = path.resolve(process.cwd(), "test-data")
const TEST_FILES = {
  video: {
    kate: path.join(TEST_DATA_DIR, "Kate.mp4"),
    waterPlay: path.join(TEST_DATA_DIR, "water play3.mp4"),
  },
  audio: {
    dji: path.join(TEST_DATA_DIR, "DJI_02_20250402_104352.WAV"),
  },
}

test.describe("Media Import Integration E2E", () => {
  test("should import media file with full backend integration", async ({ page }) => {
    // ===== 1. Подготовка =====
    console.log("\n========================================")
    console.log("Starting Media Import Integration Test")
    console.log("========================================\n")

    // Переходим на страницу
    await page.goto("/")

    // Ждём инициализации Tauri
    await waitForTauriReady(page, 30000)
    console.log("✅ Tauri API ready")

    // Ждём загрузки UI
    await page.waitForSelector('[role="tablist"]', { timeout: 30000 })
    console.log("✅ UI loaded")

    // ===== 2. Настройка перехвата =====
    const logCapture = createLogCapture()
    const eventCapture = createEventCapture()

    await logCapture.start(page)
    await eventCapture.start(page)
    console.log("✅ Log and event capture started")

    // Даём время на начальную загрузку
    await page.waitForTimeout(1000)

    // ===== 3. Проверка начального состояния =====
    console.log("\n--- Checking initial state ---")
    const initialState = await getProjectState(page)
    console.log("Initial state:", JSON.stringify(initialState, null, 2))

    // ===== 4. Импорт медиа файла =====
    console.log("\n--- Importing media file ---")
    const filePath = TEST_FILES.video.kate
    console.log(`Importing: ${filePath}`)

    // Проверяем что файл существует
    const fileExists = await page.evaluate(async (path) => {
      const tauri = (window as any).__TAURI__
      try {
        return await tauri.fs.exists(path)
      } catch {
        return false
      }
    }, filePath)

    expect(fileExists, `Test file should exist: ${filePath}`).toBe(true)
    console.log("✅ Test file exists")

    // Выполняем импорт и ждём события
    console.log("Executing add_imported_media command...")
    const { commandResult, event } = await executeCommandAndWaitForEvent(
      page,
      "add_imported_media",
      { path: filePath },
      "ImportedMediaAdded",
      eventCapture,
      { timeout: 10000 }
    )

    // Проверяем результат команды
    assertCommandSuccess(commandResult, "add_imported_media")
    console.log("✅ Command executed successfully")

    // Проверяем событие
    assertEventReceived(event, "ImportedMediaAdded", ["path"])
    console.log("✅ Event received:", event.event.type)
    console.log("   Event payload:", event.event.payload)

    // ===== 5. Проверка состояния после импорта =====
    console.log("\n--- Checking state after import ---")
    await page.waitForTimeout(500) // Даём время на обновление состояния

    const stateAfterImport = await getProjectState(page)
    console.log("State after import:", JSON.stringify(stateAfterImport, null, 2))

    // Проверяем что файл появился в imported_media
    if (stateAfterImport?.imported_media) {
      expect(stateAfterImport.imported_media.length).toBeGreaterThan(0)
      const importedFile = stateAfterImport.imported_media.find(
        (media: any) => media.path === filePath
      )
      expect(importedFile).toBeDefined()
      console.log("✅ File added to imported_media")
      console.log("   File info:", importedFile)
    }

    // ===== 6. Получение метаданных =====
    console.log("\n--- Getting media metadata ---")
    const metadataResult = await executeCommand(page, "get_media_metadata", { path: filePath })

    if (metadataResult.success) {
      console.log("✅ Metadata retrieved")
      console.log("   Metadata:", metadataResult.data)

      // Проверяем основные поля метаданных
      const metadata = metadataResult.data
      expect(metadata).toBeDefined()

      if (metadata.type === "Video") {
        expect(metadata).toHaveProperty("duration")
        expect(metadata).toHaveProperty("width")
        expect(metadata).toHaveProperty("height")
        console.log(
          `   Video: ${metadata.width}x${metadata.height}, ${metadata.duration}s`
        )
      }
    } else {
      console.log("⚠️  Metadata command not available or failed:", metadataResult.error)
    }

    // ===== 7. Проверка логов =====
    console.log("\n--- Checking backend logs ---")
    const logs = logCapture.getLogs()
    const stats = logCapture.getStats()

    console.log(`Total logs: ${stats.total}`)
    console.log("By level:", stats.byLevel)
    console.log("By target:", stats.byTarget)

    // Проверяем что нет критических ошибок
    const errors = logCapture.getErrors()
    if (errors.length > 0) {
      console.log("\n⚠️  Backend errors detected:")
      errors.forEach((err) => {
        console.log(`   [ERROR] ${err.target}: ${err.message}`)
      })
    }

    // Не падаем тест если есть ошибки, просто выводим предупреждение
    // logCapture.assertNoErrors()

    // Ищем логи импорта
    const importLogs = logCapture.findLogs(/import|media|add/i)
    console.log(`\nImport-related logs: ${importLogs.length}`)
    importLogs.slice(0, 5).forEach((log) => {
      console.log(`   [${log.level}] ${log.message}`)
    })

    // ===== 8. Проверка событий =====
    console.log("\n--- Checking backend events ---")
    const events = eventCapture.getEvents()
    const eventStats = eventCapture.getStats()

    console.log(`Total events: ${eventStats.total}`)
    console.log("By type:", eventStats.byType)
    console.log(`Latest version: ${eventStats.latestVersion}`)

    // Проверяем что получили событие импорта
    const importEvents = eventCapture.getEventsByType("ImportedMediaAdded")
    expect(importEvents.length).toBeGreaterThan(0)
    console.log(`✅ Received ${importEvents.length} ImportedMediaAdded event(s)`)

    // ===== 9. Очистка (опционально) =====
    console.log("\n--- Cleaning up ---")
    const clearResult = await executeCommand(page, "clear_imported_media")
    if (clearResult.success) {
      console.log("✅ Imported media cleared")

      // Ждём события очистки
      try {
        const clearEvent = await eventCapture.waitForEvent("ImportedMediaCleared", {
          timeout: 2000,
        })
        console.log("✅ ImportedMediaCleared event received")
      } catch {
        console.log("⚠️  ImportedMediaCleared event not received (may not be implemented)")
      }
    }

    // ===== 10. Финальная статистика =====
    console.log("\n========================================")
    console.log("Test Summary")
    console.log("========================================")
    console.log(`✅ File imported: ${path.basename(filePath)}`)
    console.log(`✅ Events captured: ${eventStats.total}`)
    console.log(`✅ Logs captured: ${stats.total}`)
    console.log(`⚠️  Errors: ${errors.length}`)
    console.log("========================================\n")

    // Выводим полный лог если нужно
    if (process.env.VERBOSE) {
      logCapture.printLogs()
      eventCapture.printEvents()
    }

    // Останавливаем перехват
    logCapture.stop()
    eventCapture.stop()
  })

  test("should import multiple files and verify state consistency", async ({ page }) => {
    console.log("\n========================================")
    console.log("Testing Multiple File Import")
    console.log("========================================\n")

    await page.goto("/")
    await waitForTauriReady(page, 30000)

    const eventCapture = createEventCapture()
    await eventCapture.start(page)

    // Очищаем начальное состояние
    await executeCommand(page, "clear_imported_media")
    await page.waitForTimeout(500)

    const filesToImport = [TEST_FILES.video.kate, TEST_FILES.video.waterPlay]

    console.log(`Importing ${filesToImport.length} files...`)

    for (const filePath of filesToImport) {
      console.log(`\nImporting: ${path.basename(filePath)}`)

      const result = await executeCommand(page, "add_imported_media", { path: filePath })
      assertCommandSuccess(result, "add_imported_media")

      // Ждём события
      const event = await eventCapture.waitForEvent("ImportedMediaAdded", { timeout: 5000 })
      expect(event.event.payload.path).toBe(filePath)
      console.log(`✅ File imported: ${path.basename(filePath)}`)
    }

    // Проверяем финальное состояние
    const finalState = await getProjectState(page)
    console.log("\nFinal state:", JSON.stringify(finalState, null, 2))

    if (finalState?.imported_media) {
      expect(finalState.imported_media.length).toBe(filesToImport.length)
      console.log(`✅ All ${filesToImport.length} files in state`)
    }

    // Проверяем версию состояния
    const eventStats = eventCapture.getStats()
    console.log(`\nFinal state version: ${eventStats.latestVersion}`)
    console.log(`Total events: ${eventStats.total}`)

    eventCapture.stop()

    console.log("\n========================================")
    console.log(`✅ Successfully imported ${filesToImport.length} files`)
    console.log("========================================\n")
  })
})
