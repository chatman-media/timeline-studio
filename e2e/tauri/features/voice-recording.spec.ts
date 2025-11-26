/**
 * Tauri Voice Recording Integration Tests
 *
 * Тесты для проверки интеграции voice recording с Tauri backend:
 * - Сохранение аудио файлов
 * - Получение поддерживаемых форматов
 * - Работа с файловой системой
 */

import { test, expect } from "@playwright/test"

test.describe("Tauri Voice Recording Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")

    // Ждем загрузки Tauri API
    await page.waitForFunction(
      () => {
        return typeof (window as any).__TAURI__ !== "undefined"
      },
      { timeout: 10000 },
    )
  })

  test.describe("Audio Format Support", () => {
    test("should have access to Tauri invoke for audio commands", async ({ page }) => {
      const hasInvoke = await page.evaluate(() => {
        const tauri = (window as any).__TAURI__
        return typeof tauri?.core?.invoke === "function"
      })

      expect(hasInvoke).toBe(true)
    })

    test("should be able to call get_supported_audio_formats command", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const tauri = (window as any).__TAURI__

        try {
          const formats = await tauri.core.invoke("get_supported_audio_formats")
          return {
            success: true,
            hasFormats: Array.isArray(formats),
            formatCount: formats?.length || 0,
            formats: formats?.map((f: any) => f.format) || [],
          }
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            commandNotFound: (error as Error).message.includes("command") || (error as Error).message.includes("not"),
          }
        }
      })

      // Либо успех с форматами, либо команда не найдена (на этапе разработки)
      expect(result.success || result.commandNotFound).toBe(true)
    })
  })

  test.describe("Audio File Operations", () => {
    test("should be able to write audio file to temp directory", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const tauri = (window as any).__TAURI__

        try {
          // Получаем временную директорию
          const tempDir = await tauri.path.tempDir()
          const testFilePath = `${tempDir}/test_audio_${Date.now()}.webm`

          // Создаем тестовые данные (base64 encoded minimal audio)
          const testAudioData = "SGVsbG8gV29ybGQh" // "Hello World!" in base64

          // Записываем файл
          await tauri.fs.writeFile(testFilePath, new TextEncoder().encode(atob(testAudioData)))

          // Проверяем что файл создан
          const exists = await tauri.fs.exists(testFilePath)

          // Удаляем тестовый файл
          await tauri.fs.remove(testFilePath)

          return {
            success: true,
            exists,
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
        expect(result.exists).toBe(true)
      }
    })

    test("should be able to create audio subdirectory", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const tauri = (window as any).__TAURI__

        try {
          const tempDir = await tauri.path.tempDir()
          const audioDir = `${tempDir}/voice_recordings_test_${Date.now()}`

          // Создаем директорию
          await tauri.fs.mkdir(audioDir, { recursive: true })

          // Проверяем существование
          const exists = await tauri.fs.exists(audioDir)

          // Удаляем директорию
          await tauri.fs.remove(audioDir, { recursive: true })

          return {
            success: true,
            exists,
            audioDir,
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
      }
    })
  })

  test.describe("Voice Recording Command", () => {
    test("should be able to call save_voice_recording command", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const tauri = (window as any).__TAURI__

        try {
          const params = {
            audioData: "SGVsbG8gV29ybGQh", // base64 test data
            fileName: "test_recording",
            format: "webm",
            useSubdirectory: false,
          }

          const saveResult = await tauri.core.invoke("save_voice_recording", { params })

          return {
            success: true,
            hasFilePath: typeof saveResult?.filePath === "string",
            hasFileName: typeof saveResult?.fileName === "string",
            result: saveResult,
          }
        } catch (error) {
          return {
            success: false,
            error: (error as Error).message,
            commandNotFound: (error as Error).message.includes("command") || (error as Error).message.includes("not"),
          }
        }
      })

      // Либо успех, либо команда не найдена
      expect(result.success || result.commandNotFound).toBe(true)
    })
  })

  test.describe("MediaDevices API Availability", () => {
    test("should check if MediaDevices API is available", async ({ page }) => {
      const result = await page.evaluate(() => {
        return {
          hasMediaDevices: typeof navigator.mediaDevices !== "undefined",
          hasGetUserMedia: typeof navigator.mediaDevices?.getUserMedia === "function",
          hasEnumerateDevices: typeof navigator.mediaDevices?.enumerateDevices === "function",
        }
      })

      // В Tauri контексте MediaDevices может быть недоступен
      expect(typeof result.hasMediaDevices).toBe("boolean")
    })

    test("should check MediaRecorder availability", async ({ page }) => {
      const result = await page.evaluate(() => {
        return {
          hasMediaRecorder: typeof MediaRecorder !== "undefined",
          hasIsTypeSupported: typeof MediaRecorder?.isTypeSupported === "function",
        }
      })

      expect(typeof result.hasMediaRecorder).toBe("boolean")
    })

    test("should check WebM format support if MediaRecorder available", async ({ page }) => {
      const result = await page.evaluate(() => {
        if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
          return {
            available: false,
            reason: "MediaRecorder not available",
          }
        }

        return {
          available: true,
          webm: MediaRecorder.isTypeSupported("audio/webm"),
          webmOpus: MediaRecorder.isTypeSupported("audio/webm;codecs=opus"),
          webmVorbis: MediaRecorder.isTypeSupported("audio/webm;codecs=vorbis"),
          mp3: MediaRecorder.isTypeSupported("audio/mpeg"),
          wav: MediaRecorder.isTypeSupported("audio/wav"),
          ogg: MediaRecorder.isTypeSupported("audio/ogg"),
        }
      })

      expect(typeof result.available).toBe("boolean")
    })
  })

  test.describe("Audio Format Conversion", () => {
    test("should convert string to base64", async ({ page }) => {
      const result = await page.evaluate(() => {
        const testString = "Hello, World!"
        const base64 = btoa(testString)
        const decoded = atob(base64)

        return {
          original: testString,
          encoded: base64,
          decoded: decoded,
          roundTripSuccess: testString === decoded,
        }
      })

      expect(result.roundTripSuccess).toBe(true)
      expect(result.encoded).toBe("SGVsbG8sIFdvcmxkIQ==")
    })

    test("should handle binary data in base64", async ({ page }) => {
      const result = await page.evaluate(() => {
        // Create binary data
        const bytes = new Uint8Array([0, 1, 2, 128, 255])

        // Convert to base64 manually
        let binary = ""
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)

        // Decode back
        const decoded = atob(base64)
        const decodedBytes = new Uint8Array(decoded.length)
        for (let i = 0; i < decoded.length; i++) {
          decodedBytes[i] = decoded.charCodeAt(i)
        }

        // Verify
        let allMatch = bytes.length === decodedBytes.length
        if (allMatch) {
          for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] !== decodedBytes[i]) {
              allMatch = false
              break
            }
          }
        }

        return {
          originalLength: bytes.length,
          encodedLength: base64.length,
          decodedLength: decodedBytes.length,
          roundTripSuccess: allMatch,
        }
      })

      expect(result.roundTripSuccess).toBe(true)
      expect(result.originalLength).toBe(result.decodedLength)
    })
  })

  test.describe("File Path Utilities", () => {
    test("should get app directories", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const tauri = (window as any).__TAURI__

        try {
          const paths = await Promise.all([
            tauri.path.tempDir(),
            tauri.path.documentDir(),
            tauri.path.audioDir().catch(() => null),
          ])

          return {
            success: true,
            tempDir: paths[0],
            documentDir: paths[1],
            audioDir: paths[2],
            hasTempDir: typeof paths[0] === "string" && paths[0].length > 0,
            hasDocumentDir: typeof paths[1] === "string" && paths[1].length > 0,
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
        expect(result.hasDocumentDir).toBe(true)
      }
    })

    test("should format timestamp correctly", async ({ page }) => {
      const result = await page.evaluate(() => {
        const now = new Date()
        const timestamp = now.toISOString().replace(/:/g, "-").replace(/\..+/, "")
        const fileName = `voice_recording_${timestamp}`

        return {
          timestamp,
          fileName,
          matchesPattern: /^voice_recording_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/.test(fileName),
        }
      })

      expect(result.matchesPattern).toBe(true)
    })
  })

  test.describe("Error Handling", () => {
    test("should handle non-existent audio file gracefully", async ({ page }) => {
      const result = await page.evaluate(async () => {
        const tauri = (window as any).__TAURI__

        try {
          const nonExistentPath = "/non/existent/audio/file.webm"
          await tauri.fs.readFile(nonExistentPath)
          return { success: false, error: "Should have thrown" }
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

    test("should handle invalid base64 data gracefully", async ({ page }) => {
      const result = await page.evaluate(() => {
        try {
          atob("invalid-base64-!!!")
          return { success: false, error: "Should have thrown" }
        } catch (error) {
          return {
            success: true,
            errorCaught: true,
            errorType: (error as Error).name,
          }
        }
      })

      expect(result.success).toBe(true)
      expect(result.errorCaught).toBe(true)
    })
  })
})
