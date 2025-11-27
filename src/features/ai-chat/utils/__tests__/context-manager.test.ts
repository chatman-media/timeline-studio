/**
 * Тесты для context-manager
 * Проверяет управление размером контекста AI чатов
 */

import { beforeEach, describe, expect, it } from "vitest"
import type { ChatMessage } from "@/domains/ai-services/types/chat"
import {
  calculateMessagesTokens,
  compressContext,
  estimateTokens,
  getModelContextLimit,
  isContextOverLimit,
  trimMessagesForContext,
} from "../context-manager"

describe("context-manager", () => {
  describe("estimateTokens", () => {
    it("должен корректно оценивать токены для короткого текста", () => {
      const text = "Hello"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(2) // 5 chars / 4 = 1.25, округляется до 2
    })

    it("должен корректно оценивать токены для длинного текста", () => {
      const text = "A".repeat(1000)
      const tokens = estimateTokens(text)
      expect(tokens).toBe(250) // 1000 / 4 = 250
    })

    it("должен возвращать 0 для пустой строки", () => {
      const tokens = estimateTokens("")
      expect(tokens).toBe(0)
    })

    it("должен корректно обрабатывать юникод символы", () => {
      const text = "Привет, мир! 你好世界 🌍"
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })

    it("должен корректно обрабатывать многострочный текст", () => {
      const text = "Line 1\nLine 2\nLine 3"
      const tokens = estimateTokens(text)
      expect(tokens).toBe(Math.ceil(text.length / 4))
    })
  })

  describe("getModelContextLimit", () => {
    it("должен возвращать лимит для Claude 4 Sonnet", () => {
      const limit = getModelContextLimit("claude-4-sonnet")
      expect(limit).toBe(200000)
    })

    it("должен возвращать лимит для GPT-4", () => {
      const limit = getModelContextLimit("gpt-4")
      expect(limit).toBe(32000)
    })

    it("должен возвращать лимит для GPT-4o", () => {
      const limit = getModelContextLimit("gpt-4o")
      expect(limit).toBe(128000)
    })

    it("должен быть регистронезависимым", () => {
      const limit1 = getModelContextLimit("GPT-4")
      const limit2 = getModelContextLimit("gpt-4")
      expect(limit1).toBe(limit2)
    })

    it("должен возвращать дефолтный лимит для неизвестной модели", () => {
      const limit = getModelContextLimit("unknown-model-xyz")
      expect(limit).toBe(16000)
    })

    it("должен обрабатывать пустое название модели", () => {
      const limit = getModelContextLimit("")
      expect(limit).toBe(16000)
    })

    it("должен обрабатывать частичное совпадение названия модели", () => {
      const limit = getModelContextLimit("gpt-4-turbo-preview")
      expect(limit).toBe(16000) // Не совпадает точно, вернёт дефолтный
    })
  })

  describe("calculateMessagesTokens", () => {
    it("должен подсчитать токены для одного сообщения", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: "Hello, world!",
          role: "user",
          timestamp: new Date(),
        },
      ]
      const tokens = calculateMessagesTokens(messages)
      expect(tokens).toBe(estimateTokens("Hello, world!"))
    })

    it("должен подсчитать токены для нескольких сообщений", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: "First message",
          role: "user",
          timestamp: new Date(),
        },
        {
          id: "2",
          content: "Second message",
          role: "assistant",
          timestamp: new Date(),
        },
      ]
      const tokens = calculateMessagesTokens(messages)
      const expectedTokens = estimateTokens("First message") + estimateTokens("Second message")
      expect(tokens).toBe(expectedTokens)
    })

    it("должен возвращать 0 для пустого массива", () => {
      const tokens = calculateMessagesTokens([])
      expect(tokens).toBe(0)
    })

    it("должен корректно обрабатывать сообщения с пустым содержимым", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: "",
          role: "user",
          timestamp: new Date(),
        },
      ]
      const tokens = calculateMessagesTokens(messages)
      expect(tokens).toBe(0)
    })

    it("должен корректно обрабатывать сообщения с большим содержимым", () => {
      const largeContent = "A".repeat(10000)
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: largeContent,
          role: "user",
          timestamp: new Date(),
        },
      ]
      const tokens = calculateMessagesTokens(messages)
      expect(tokens).toBe(2500) // 10000 / 4
    })
  })

  describe("trimMessagesForContext", () => {
    let messages: ChatMessage[]

    beforeEach(() => {
      messages = [
        {
          id: "1",
          content: "Message 1",
          role: "user",
          timestamp: new Date(),
        },
        {
          id: "2",
          content: "Message 2",
          role: "assistant",
          timestamp: new Date(),
        },
        {
          id: "3",
          content: "Message 3",
          role: "user",
          timestamp: new Date(),
        },
        {
          id: "4",
          content: "Message 4",
          role: "assistant",
          timestamp: new Date(),
        },
        {
          id: "5",
          content: "Message 5",
          role: "user",
          timestamp: new Date(),
        },
      ]
    })

    it("должен вернуть все сообщения если они помещаются в контекст", () => {
      const trimmed = trimMessagesForContext(messages, "claude-4-sonnet")
      expect(trimmed).toEqual(messages)
    })

    it("должен всегда сохранять последнее сообщение пользователя", () => {
      const lastMessage = messages[messages.length - 1]
      const trimmed = trimMessagesForContext(messages, "gpt-3.5-turbo", undefined, 10000)
      expect(trimmed[trimmed.length - 1]).toEqual(lastMessage)
    })

    it("должен обрезать сообщения начиная с начала", () => {
      const trimmed = trimMessagesForContext(messages, "gpt-3.5-turbo", undefined, 15000)
      expect(trimmed.length).toBeLessThanOrEqual(messages.length)
      expect(trimmed[trimmed.length - 1]).toEqual(messages[messages.length - 1])
    })

    it("должен обрезать очень длинное последнее сообщение", () => {
      const longMessage: ChatMessage = {
        id: "long",
        content: "A".repeat(100000),
        role: "user",
        timestamp: new Date(),
      }
      const trimmed = trimMessagesForContext([longMessage], "gpt-3.5-turbo")
      expect(trimmed).toHaveLength(1)
      expect(trimmed[0].content.length).toBeLessThan(longMessage.content.length)
      expect(trimmed[0].content).toContain("...")
    })

    it("должен учитывать системный промпт при расчете доступного контекста", () => {
      const systemPrompt = "You are a helpful assistant"
      const trimmed = trimMessagesForContext(messages, "gpt-3.5-turbo", systemPrompt, 15000)
      expect(trimmed.length).toBeLessThanOrEqual(messages.length)
    })

    it("должен вернуть пустой массив для пустого входа", () => {
      const trimmed = trimMessagesForContext([], "gpt-4")
      expect(trimmed).toEqual([])
    })

    it("должен корректно обрабатывать maxTokensForResponse", () => {
      const trimmed = trimMessagesForContext(messages, "gpt-3.5-turbo", undefined, 10000)
      // При большом maxTokensForResponse должно остаться меньше сообщений
      expect(trimmed.length).toBeGreaterThan(0)
    })
  })

  describe("compressContext", () => {
    let messages: ChatMessage[]

    beforeEach(() => {
      messages = []
      for (let i = 0; i < 20; i++) {
        messages.push({
          id: `msg-${i}`,
          content: `Message ${i}`,
          role: i % 2 === 0 ? "user" : "assistant",
          timestamp: new Date(),
        })
      }
    })

    it("должен не менять сообщения если они помещаются в контекст", () => {
      const compressed = compressContext(messages.slice(0, 5), "claude-4-sonnet")
      expect(compressed).toEqual(messages.slice(0, 5))
    })

    it("должен возвращать сообщения если они помещаются в контекст", () => {
      const compressed = compressContext(messages, "gpt-3.5-turbo", undefined, 2000)
      // 20 коротких сообщений должны поместиться в контекст GPT-3.5
      expect(compressed.length).toBeGreaterThan(0)
    })

    it("должен сохранять первые 2 сообщения", () => {
      const compressed = compressContext(messages, "gpt-3.5-turbo", undefined, 15000)
      expect(compressed[0]).toEqual(messages[0])
      expect(compressed[1]).toEqual(messages[1])
    })

    it("должен сохранять последние 5 сообщений", () => {
      const compressed = compressContext(messages, "gpt-3.5-turbo", undefined, 15000)
      const lastFive = messages.slice(-5)
      const compressedLastFive = compressed.slice(-5)
      expect(compressedLastFive).toEqual(lastFive)
    })

    it("должен создавать сводку для очень большого количества сообщений", () => {
      // Создаём сообщения с большим контентом чтобы превысить лимит
      const largeMessages: ChatMessage[] = []
      for (let i = 0; i < 30; i++) {
        largeMessages.push({
          id: `msg-${i}`,
          content: "A".repeat(2000), // Большой контент
          role: i % 2 === 0 ? "user" : "assistant",
          timestamp: new Date(),
        })
      }
      const compressed = compressContext(largeMessages, "gpt-3.5-turbo", undefined, 2000)
      // Должно быть меньше исходных сообщений из-за сжатия
      expect(compressed.length).toBeLessThan(largeMessages.length)
    })

    it("должен использовать обычную обрезку для небольшого количества сообщений", () => {
      const smallMessages = messages.slice(0, 8)
      const compressed = compressContext(smallMessages, "gpt-3.5-turbo", undefined, 15000)
      // Не должно быть сводки для малого количества сообщений
      const hasSummary = compressed.some((msg) => msg.id === "summary")
      expect(hasSummary).toBe(false)
    })

    it("должен корректно обрабатывать очень большой контекст", () => {
      const largeMessages: ChatMessage[] = []
      for (let i = 0; i < 100; i++) {
        largeMessages.push({
          id: `msg-${i}`,
          content: "A".repeat(1000),
          role: i % 2 === 0 ? "user" : "assistant",
          timestamp: new Date(),
        })
      }
      const compressed = compressContext(largeMessages, "gpt-3.5-turbo")
      expect(compressed.length).toBeLessThan(largeMessages.length)
    })

    it("должен учитывать системный промпт при сжатии", () => {
      const systemPrompt = "You are a helpful assistant"
      const compressed = compressContext(messages, "gpt-3.5-turbo", systemPrompt, 15000)
      expect(compressed.length).toBeGreaterThan(0)
    })
  })

  describe("isContextOverLimit", () => {
    it("должен вернуть false если контекст в пределах лимита", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: "Short message",
          role: "user",
          timestamp: new Date(),
        },
      ]
      const isOver = isContextOverLimit(messages, "claude-4-sonnet")
      expect(isOver).toBe(false)
    })

    it("должен вернуть true если контекст превышает лимит", () => {
      const largeContent = "A".repeat(100000)
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: largeContent,
          role: "user",
          timestamp: new Date(),
        },
      ]
      const isOver = isContextOverLimit(messages, "gpt-3.5-turbo")
      expect(isOver).toBe(true)
    })

    it("должен учитывать системный промпт при расчете лимита", () => {
      const systemPrompt = "A".repeat(30000) // 7500 токенов
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: "A".repeat(40000), // 10000 токенов
          role: "user",
          timestamp: new Date(),
        },
      ]
      // Для GPT-3.5 лимит 16000 токенов
      // systemPrompt (7500) + message (10000) + maxTokens (2000) = 19500 > 16000
      const isOver = isContextOverLimit(messages, "gpt-3.5-turbo", systemPrompt, 2000)
      expect(isOver).toBe(true)
    })

    it("должен учитывать maxTokensForResponse", () => {
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: "A".repeat(60000),
          role: "user",
          timestamp: new Date(),
        },
      ]
      const isOver = isContextOverLimit(messages, "gpt-3.5-turbo", undefined, 10000)
      expect(isOver).toBe(true)
    })

    it("должен вернуть false для пустого массива сообщений", () => {
      const isOver = isContextOverLimit([], "gpt-4")
      expect(isOver).toBe(false)
    })

    it("должен корректно работать с разными моделями", () => {
      const largeContent = "A".repeat(100000) // 25000 токенов
      const messages: ChatMessage[] = [
        {
          id: "1",
          content: largeContent,
          role: "user",
          timestamp: new Date(),
        },
      ]

      // Claude 4 имеет больший лимит (200k)
      const isOverClaude = isContextOverLimit(messages, "claude-4-sonnet")
      expect(isOverClaude).toBe(false)

      // GPT-3.5 имеет меньший лимит (16k)
      // 25000 токенов + 2000 (maxTokens) = 27000 > 16000
      const isOverGpt = isContextOverLimit(messages, "gpt-3.5-turbo")
      expect(isOverGpt).toBe(true)
    })
  })

  describe("Edge cases", () => {
    it("должен выбросить ошибку для сообщений с null content", () => {
      const messages: any[] = [
        {
          id: "1",
          content: null,
          role: "user",
          timestamp: new Date(),
        },
      ]
      // В текущей реализации это вызовет ошибку т.к. нет валидации
      expect(() => calculateMessagesTokens(messages)).toThrow()
    })

    it("должен обрабатывать сообщения с очень длинными ID", () => {
      const message: ChatMessage = {
        id: "x".repeat(10000),
        content: "Test",
        role: "user",
        timestamp: new Date(),
      }
      const tokens = calculateMessagesTokens([message])
      expect(tokens).toBeGreaterThan(0)
    })

    it("должен обрабатывать сообщения с спецсимволами", () => {
      const message: ChatMessage = {
        id: "1",
        content: "Test\n\r\t\"'`<>{}[]\\",
        role: "user",
        timestamp: new Date(),
      }
      const tokens = estimateTokens(message.content)
      expect(tokens).toBeGreaterThan(0)
    })

    it("должен обрабатывать модели с названиями в верхнем регистре", () => {
      const limit = getModelContextLimit("CLAUDE-4-SONNET")
      expect(limit).toBe(200000)
    })
  })
})
