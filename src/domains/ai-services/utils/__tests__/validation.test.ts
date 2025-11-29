/**
 * Tests for validation utilities
 *
 * Тесты для утилит валидации входных данных AI сервисов
 *
 * ВАЖНО: File validation функции (validateFilePath, validateVideoFile, и т.д.)
 * выбрасывают ошибку в браузерном окружении (jsdom в тестах) и должны вызываться
 * только на backend (Tauri). Поэтому мы тестируем только их базовую логику через
 * моки или пропускаем тесты, которые требуют server-side выполнения.
 */

import { describe, expect, it } from "vitest"
import {
  FileSizeError,
  FileNotFoundError,
  InputTooLargeError,
  InvalidFormatError,
  MAX_FILE_SIZE_BYTES,
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES_COUNT,
  sanitizeTextInput,
  SUPPORTED_AUDIO_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  validateAIMessages,
  validateBatchSize,
  ValidationError,
} from "../validation"

describe("Validation Utilities", () => {
  describe("Constants", () => {
    it("должен экспортировать корректные константы", () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024 * 1024)
      expect(MAX_MESSAGE_LENGTH).toBe(1024 * 1024)
      expect(MAX_MESSAGES_COUNT).toBe(100)
      expect(SUPPORTED_VIDEO_FORMATS).toContain(".mp4")
      expect(SUPPORTED_AUDIO_FORMATS).toContain(".mp3")
    })
  })

  describe("Error Classes", () => {
    it("ValidationError должен быть экземпляром Error", () => {
      const error = new ValidationError("test error")
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe("ValidationError")
      expect(error.message).toBe("test error")
    })

    it("FileSizeError должен форматировать сообщение корректно", () => {
      const error = new FileSizeError("/test/file.mp4", 1000, 500)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe("FileSizeError")
      expect(error.message).toContain("/test/file.mp4")
      expect(error.message).toContain("1000")
      expect(error.message).toContain("500")
    })

    it("FileNotFoundError должен форматировать сообщение корректно", () => {
      const error = new FileNotFoundError("/test/missing.mp4")
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe("FileNotFoundError")
      expect(error.message).toContain("/test/missing.mp4")
    })

    it("InvalidFormatError должен форматировать сообщение корректно", () => {
      const error = new InvalidFormatError("/test/file.txt", [".mp4", ".mov"])
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe("InvalidFormatError")
      expect(error.message).toContain("/test/file.txt")
      expect(error.message).toContain(".mp4")
      expect(error.message).toContain(".mov")
    })

    it("InputTooLargeError должен форматировать сообщение корректно", () => {
      const error = new InputTooLargeError("Text input", 1000, 500)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.name).toBe("InputTooLargeError")
      expect(error.message).toContain("Text input")
      expect(error.message).toContain("1000")
      expect(error.message).toContain("500")
    })
  })

  // NOTE: File validation тесты пропущены, так как они требуют server-side выполнения
  // В тестах (jsdom) эти функции выбрасывают ошибку "must be performed server-side"
  // Эти функции должны вызываться только в Tauri commands (Rust backend)

  describe("Text Input Sanitization", () => {
    it("должен удалять нулевые байты", () => {
      const input = "Hello\u0000World"
      const sanitized = sanitizeTextInput(input)

      expect(sanitized).toBe("HelloWorld")
      expect(sanitized).not.toContain("\u0000")
    })

    it("должен удалять управляющие символы", () => {
      const input = "Hello\x00\x01\x02World"
      const sanitized = sanitizeTextInput(input)

      expect(sanitized).toBe("HelloWorld")
    })

    it("должен нормализовать whitespace", () => {
      const input = "Hello    World\t\tTest"
      const sanitized = sanitizeTextInput(input)

      expect(sanitized).toBe("Hello World Test")
    })

    it("должен обрезать пробелы в начале и конце", () => {
      const input = "   Hello World   "
      const sanitized = sanitizeTextInput(input)

      expect(sanitized).toBe("Hello World")
    })

    it("должен сохранять переносы строк", () => {
      const input = "Line 1\nLine 2\nLine 3"
      const sanitized = sanitizeTextInput(input)

      expect(sanitized).toBe("Line 1\nLine 2\nLine 3")
    })

    it("должен выбрасывать ошибку для слишком большого текста", () => {
      const longText = "a".repeat(MAX_MESSAGE_LENGTH + 1)

      expect(() => sanitizeTextInput(longText)).toThrow(InputTooLargeError)
    })

    it("должен принимать текст в пределах лимита", () => {
      const text = "a".repeat(MAX_MESSAGE_LENGTH)

      expect(() => sanitizeTextInput(text)).not.toThrow()
    })

    it("должен использовать кастомный maxLength", () => {
      const text = "a".repeat(101)

      expect(() => sanitizeTextInput(text, 100)).toThrow(InputTooLargeError)
      expect(() => sanitizeTextInput(text, 200)).not.toThrow()
    })
  })

  describe("AI Messages Validation", () => {
    it("должен принимать валидные сообщения", () => {
      const messages = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "system", content: "You are helpful" },
      ]

      expect(() => validateAIMessages(messages)).not.toThrow()
    })

    it("должен отклонять пустой массив", () => {
      expect(() => validateAIMessages([])).toThrow("cannot be empty")
    })

    it("должен отклонять слишком много сообщений", () => {
      const messages = Array(MAX_MESSAGES_COUNT + 1)
        .fill(null)
        .map(() => ({ role: "user", content: "test" }))

      expect(() => validateAIMessages(messages)).toThrow(InputTooLargeError)
    })

    it("должен отклонять сообщения без role", () => {
      const messages = [{ role: "", content: "Hello" }]

      expect(() => validateAIMessages(messages)).toThrow("must have role and content")
    })

    it("должен отклонять сообщения без content", () => {
      const messages = [{ role: "user", content: "" }]

      expect(() => validateAIMessages(messages)).toThrow("must have role and content")
    })

    it("должен отклонять невалидные роли", () => {
      const messages = [{ role: "invalid", content: "Hello" }]

      expect(() => validateAIMessages(messages)).toThrow("Invalid role")
    })

    it("должен отклонять слишком длинные сообщения", () => {
      const longContent = "a".repeat(MAX_MESSAGE_LENGTH + 1)
      const messages = [{ role: "user", content: longContent }]

      expect(() => validateAIMessages(messages)).toThrow(InputTooLargeError)
    })

    it("должен использовать кастомные лимиты", () => {
      const messages = Array(11)
        .fill(null)
        .map(() => ({ role: "user", content: "test" }))

      expect(() => validateAIMessages(messages, 10)).toThrow(InputTooLargeError)
      expect(() => validateAIMessages(messages, 20)).not.toThrow()
    })
  })

  describe("Batch Validation", () => {
    it("должен принимать валидный batch", () => {
      const items = Array(50)
        .fill(null)
        .map((_, i) => ({ id: i }))

      expect(() => validateBatchSize(items)).not.toThrow()
    })

    it("должен отклонять пустой batch", () => {
      expect(() => validateBatchSize([])).toThrow("cannot be empty")
    })

    it("должен отклонять слишком большой batch", () => {
      const items = Array(101)
        .fill(null)
        .map((_, i) => ({ id: i }))

      expect(() => validateBatchSize(items, 100)).toThrow(InputTooLargeError)
    })

    it("должен использовать кастомный maxBatchSize", () => {
      const items = Array(60).fill(null)

      expect(() => validateBatchSize(items, 50)).toThrow(InputTooLargeError)
      expect(() => validateBatchSize(items, 100)).not.toThrow()
    })
  })

  // NOTE: Video batch validation тесты пропущены, так как они также требуют server-side
  // Эти функции используют validateVideoFile внутри, который выбрасывает ошибку в jsdom
})

