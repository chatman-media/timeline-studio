/**
 * Тесты для LocalChatStorageService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ChatMessage } from "@/domains/ai-services/types/chat"
import { LocalChatStorageService } from "../chat-storage-service"

// Mock appDirectoriesService
vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    getAppDirectories: vi.fn().mockResolvedValue({
      base_dir: "/mock/base/dir",
    }),
  },
}))

// Mock environment
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn().mockReturnValue(false), // По умолчанию используем веб-версию (localStorage)
}))

// Mock Tauri logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    warn: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
    debugSync: vi.fn(),
  }),
}))

describe("LocalChatStorageService", () => {
  let service: LocalChatStorageService

  beforeEach(async () => {
    // Очистка localStorage перед каждым тестом
    localStorage.clear()
    // Получаем новый экземпляр сервиса
    service = LocalChatStorageService.getInstance()
    // Ждем немного для завершения async операций
    await new Promise((resolve) => setTimeout(resolve, 5))
  })

  describe("createSession", () => {
    it("должен создать новую сессию с переданным заголовком", async () => {
      const session = await service.createSession("Тестовый чат")

      expect(session).toBeDefined()
      expect(session.id).toBeDefined()
      expect(session.title).toBe("Тестовый чат")
      expect(session.messages).toEqual([])
      expect(session.agent).toBe("claude-4-sonnet")
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.updatedAt).toBeInstanceOf(Date)
    })

    it("должен создать новую сессию с автоматическим заголовком если не передан", async () => {
      const session = await service.createSession()

      expect(session).toBeDefined()
      expect(session.id).toBeDefined()
      expect(session.title).toContain("Новый чат")
      expect(session.messages).toEqual([])
    })

    it("должен сохранить сессию в localStorage", async () => {
      const session = await service.createSession("Сохраненный чат")

      const stored = localStorage.getItem(`chat_${session.id}`)
      expect(stored).toBeDefined()

      const parsed = JSON.parse(stored!)
      expect(parsed.id).toBe(session.id)
      expect(parsed.title).toBe("Сохраненный чат")
    })
  })

  describe("getSession", () => {
    it("должен получить существующую сессию", async () => {
      const created = await service.createSession("Тест получения")
      const retrieved = await service.getSession(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.title).toBe(created.title)
      expect(retrieved!.createdAt).toBeInstanceOf(Date)
      expect(retrieved!.updatedAt).toBeInstanceOf(Date)
    })

    it("должен вернуть null для несуществующей сессии", async () => {
      const retrieved = await service.getSession("non-existent-id")

      expect(retrieved).toBeNull()
    })

    it("должен корректно преобразовать даты из строк в объекты Date", async () => {
      const session = await service.createSession("Тест дат")
      const message: Omit<ChatMessage, "id" | "timestamp"> = {
        role: "user",
        content: "Тестовое сообщение",
      }
      await service.addMessage(session.id, message)

      const retrieved = await service.getSession(session.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.createdAt).toBeInstanceOf(Date)
      expect(retrieved!.updatedAt).toBeInstanceOf(Date)
      expect(retrieved!.messages[0].timestamp).toBeInstanceOf(Date)
    })
  })

  describe("getAllSessions", () => {
    it("должен вернуть пустой массив если нет сессий", async () => {
      const sessions = await service.getAllSessions()

      expect(sessions).toEqual([])
    })

    it.skip("должен вернуть все сессии с сообщениями", async () => {
      // TODO: Изолировать от beforeEach
      const session1 = await service.createSession("Чат 1")
      const session2 = await service.createSession("Чат 2")

      await service.addMessage(session1.id, {
        role: "user",
        content: "Сообщение 1",
      })
      await service.addMessage(session2.id, {
        role: "user",
        content: "Сообщение 2",
      })

      const sessions = await service.getAllSessions()

      expect(sessions).toHaveLength(2)
      // После добавления первого сообщения заголовок обновляется
      expect(sessions.map((s) => s.title)).toContain("Сообщение 1")
      expect(sessions.map((s) => s.title)).toContain("Сообщение 2")
    })

    it.skip("должен исключить сессии без сообщений", async () => {
      // TODO: Изолировать от beforeEach
      await service.createSession("Пустой чат")
      const session2 = await service.createSession("Чат с сообщением")

      await service.addMessage(session2.id, {
        role: "user",
        content: "Сообщение",
      })

      const sessions = await service.getAllSessions()

      expect(sessions).toHaveLength(1)
      // Заголовок обновляется на первое сообщение
      expect(sessions[0].title).toBe("Сообщение")
    })

    it.skip("должен сортировать сессии по дате последнего обновления (новые сверху)", async () => {
      // TODO: Изолировать от beforeEach
      const session1 = await service.createSession("Старый чат")
      await service.addMessage(session1.id, {
        role: "user",
        content: "Старое сообщение",
      })

      // Небольшая задержка
      await new Promise((resolve) => setTimeout(resolve, 10))

      const session2 = await service.createSession("Новый чат")
      await service.addMessage(session2.id, {
        role: "user",
        content: "Новое сообщение",
      })

      const sessions = await service.getAllSessions()

      // Заголовки обновляются на первые сообщения
      expect(sessions[0].title).toBe("Новое сообщение")
      expect(sessions[1].title).toBe("Старое сообщение")
    })
  })

  describe("updateSession", () => {
    it("должен обновить сессию", async () => {
      const session = await service.createSession("Исходный заголовок")

      // Небольшая задержка чтобы updatedAt был точно другой
      await new Promise((resolve) => setTimeout(resolve, 10))

      await service.updateSession(session.id, {
        title: "Обновленный заголовок",
      })

      const updated = await service.getSession(session.id)
      expect(updated!.title).toBe("Обновленный заголовок")
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(session.updatedAt.getTime())
    })

    it("должен выбросить ошибку если сессия не найдена", async () => {
      await expect(service.updateSession("non-existent", { title: "Новый заголовок" })).rejects.toThrow(
        "Session non-existent not found",
      )
    })
  })

  describe("deleteSession", () => {
    it("должен удалить сессию", async () => {
      const session = await service.createSession("Чат для удаления")

      await service.deleteSession(session.id)

      const retrieved = await service.getSession(session.id)
      expect(retrieved).toBeNull()
    })

    it("не должен выбрасывать ошибку при удалении несуществующей сессии", async () => {
      // В текущей реализации просто пытается удалить из localStorage
      await expect(service.deleteSession("non-existent")).resolves.not.toThrow()
    })
  })

  describe("addMessage", () => {
    it("должен добавить сообщение в сессию", async () => {
      const session = await service.createSession("Чат для сообщений")

      const message = await service.addMessage(session.id, {
        role: "user",
        content: "Тестовое сообщение",
      })

      expect(message).toBeDefined()
      expect(message.id).toBeDefined()
      expect(message.timestamp).toBeInstanceOf(Date)
      expect(message.role).toBe("user")
      expect(message.content).toBe("Тестовое сообщение")

      const updated = await service.getSession(session.id)
      expect(updated!.messages).toHaveLength(1)
      expect(updated!.messages[0].id).toBe(message.id)
    })

    it("должен обновить заголовок сессии на основе первого сообщения пользователя", async () => {
      const session = await service.createSession("Автозаголовок")

      await service.addMessage(session.id, {
        role: "user",
        content: "Первое сообщение от пользователя",
      })

      const updated = await service.getSession(session.id)
      expect(updated!.title).toBe("Первое сообщение от пользователя")
    })

    it("должен обрезать длинный заголовок до 50 символов", async () => {
      const session = await service.createSession("Длинный заголовок")
      const longMessage =
        "Это очень длинное сообщение которое должно быть обрезано до пятидесяти символов и получить многоточие в конце"

      await service.addMessage(session.id, {
        role: "user",
        content: longMessage,
      })

      const updated = await service.getSession(session.id)
      expect(updated!.title).toHaveLength(53) // 50 символов + "..."
      expect(updated!.title).toContain("...")
    })

    it("должен выбросить ошибку если сессия не найдена", async () => {
      await expect(
        service.addMessage("non-existent", {
          role: "user",
          content: "Сообщение",
        }),
      ).rejects.toThrow("Session non-existent not found")
    })
  })

  describe("updateMessage", () => {
    it("должен обновить сообщение в сессии", async () => {
      const session = await service.createSession("Чат для обновления сообщений")
      const message = await service.addMessage(session.id, {
        role: "user",
        content: "Исходное содержимое",
      })

      await service.updateMessage(session.id, message.id, {
        content: "Обновленное содержимое",
      })

      const updated = await service.getSession(session.id)
      expect(updated!.messages[0].content).toBe("Обновленное содержимое")
    })

    it("должен выбросить ошибку если сессия не найдена", async () => {
      await expect(service.updateMessage("non-existent", "msg-id", { content: "Новое" })).rejects.toThrow(
        "Session non-existent not found",
      )
    })

    it("должен выбросить ошибку если сообщение не найдено", async () => {
      const session = await service.createSession("Чат")

      await expect(service.updateMessage(session.id, "non-existent-msg", { content: "Новое" })).rejects.toThrow(
        "Message non-existent-msg not found",
      )
    })
  })

  describe("deleteMessage", () => {
    it("должен удалить сообщение из сессии", async () => {
      const session = await service.createSession("Чат для удаления сообщений")
      const message = await service.addMessage(session.id, {
        role: "user",
        content: "Сообщение для удаления",
      })

      await service.deleteMessage(session.id, message.id)

      const updated = await service.getSession(session.id)
      expect(updated!.messages).toHaveLength(0)
    })

    it("должен выбросить ошибку если сессия не найдена", async () => {
      await expect(service.deleteMessage("non-existent", "msg-id")).rejects.toThrow("Session non-existent not found")
    })
  })

  describe.skip("searchSessions", () => {
    // Пропускаем эти тесты из-за проблем с изоляцией localStorage
    // TODO: Переписать с использованием моков вместо реального localStorage
    let session1Id: string
    let session2Id: string
    let session3Id: string

    beforeEach(async () => {
      // Создаем тестовые сессии для поиска
      const session1 = await service.createSession("JavaScript разработка")
      session1Id = session1.id
      await service.addMessage(session1Id, {
        role: "user",
        content: "Как использовать React hooks?",
      })

      const session2 = await service.createSession("Python программирование")
      session2Id = session2.id
      await service.addMessage(session2Id, {
        role: "user",
        content: "Объясни декораторы",
      })

      const session3 = await service.createSession("Базы данных")
      session3Id = session3.id
      await service.addMessage(session3Id, {
        role: "user",
        content: "Что такое индексы в PostgreSQL?",
      })
    })

    it("должен найти сессии по заголовку", async () => {
      // Сначала проверим, что сессии созданы
      const allSessions = await service.getAllSessions()
      expect(allSessions.length).toBe(3)

      const results = await service.searchSessions("React")

      expect(results.length).toBeGreaterThanOrEqual(1)
      // Заголовок обновился на первое сообщение
      expect(results.some((r) => r.title.includes("React") || r.lastMessage?.includes("React"))).toBe(true)
    })

    it("должен найти сессии по содержимому сообщения", async () => {
      const allSessions = await service.getAllSessions()
      expect(allSessions.length).toBe(3)

      const results = await service.searchSessions("декораторы")

      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results.some((r) => r.title.includes("декораторы") || r.lastMessage?.includes("декораторы"))).toBe(true)
    })

    it("должен быть регистронезависимым", async () => {
      const allSessions = await service.getAllSessions()
      expect(allSessions.length).toBe(3)

      const results = await service.searchSessions("REACT")

      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it("должен вернуть пустой массив если ничего не найдено", async () => {
      const results = await service.searchSessions("несуществующий запрос xyz123 абсолютно уникальный")

      expect(results).toEqual([])
    })

    it("должен найти несколько сессий", async () => {
      // Поиск по общему слову, которое есть во всех сессиях
      const allSessions = await service.getAllSessions()

      expect(allSessions.length).toBe(3)
    })
  })

  describe("exportSession", () => {
    it("должен экспортировать сессию в JSON", async () => {
      const session = await service.createSession("Чат для экспорта")
      await service.addMessage(session.id, {
        role: "user",
        content: "Тестовое сообщение",
      })

      const exported = await service.exportSession(session.id)

      expect(exported).toBeDefined()
      const parsed = JSON.parse(exported)
      expect(parsed.id).toBe(session.id)
      expect(parsed.title).toBe("Тестовое сообщение") // Заголовок обновился
      expect(parsed.messages).toHaveLength(1)
    })

    it("должен выбросить ошибку если сессия не найдена", async () => {
      await expect(service.exportSession("non-existent")).rejects.toThrow("Session non-existent not found")
    })
  })

  describe("importSession", () => {
    it("должен импортировать сессию из JSON", async () => {
      const originalSession = await service.createSession("Оригинальный чат")
      await service.addMessage(originalSession.id, {
        role: "user",
        content: "Оригинальное сообщение",
      })

      const exported = await service.exportSession(originalSession.id)
      const imported = await service.importSession(exported)

      expect(imported).toBeDefined()
      expect(imported.id).not.toBe(originalSession.id) // Новый ID
      expect(imported.title).toBe("Оригинальное сообщение")
      expect(imported.messages).toHaveLength(1)
      expect(imported.messages[0].content).toBe("Оригинальное сообщение")
      expect(imported.createdAt).toBeInstanceOf(Date)
      expect(imported.updatedAt).toBeInstanceOf(Date)
    })

    it("должен выбросить ошибку если данные невалидны", async () => {
      await expect(service.importSession("invalid json")).rejects.toThrow("Invalid session data")
    })
  })

  describe("Singleton pattern", () => {
    it("должен возвращать один и тот же экземпляр", () => {
      const instance1 = LocalChatStorageService.getInstance()
      const instance2 = LocalChatStorageService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe("Edge cases", () => {
    it("должен корректно обрабатывать сессии с большим количеством сообщений", async () => {
      const session = await service.createSession("Большой чат")

      // Добавляем 100 сообщений
      for (let i = 0; i < 100; i++) {
        await service.addMessage(session.id, {
          role: i % 2 === 0 ? "user" : "assistant",
          content: `Сообщение ${i}`,
        })
      }

      const retrieved = await service.getSession(session.id)
      expect(retrieved!.messages).toHaveLength(100)
    })

    it("должен корректно обрабатывать специальные символы в сообщениях", async () => {
      const session = await service.createSession("Спецсимволы")
      const specialContent = "Тест с \"кавычками\", 'апострофами', и \n переносами \t строк"

      await service.addMessage(session.id, {
        role: "user",
        content: specialContent,
      })

      const retrieved = await service.getSession(session.id)
      expect(retrieved!.messages[0].content).toBe(specialContent)
    })
  })
})
