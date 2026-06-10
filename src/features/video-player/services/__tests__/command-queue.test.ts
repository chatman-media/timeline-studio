/**
 * Tests for CommandQueue service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CommandQueue } from "../command-queue"

// Мокаем performance monitor
vi.mock("@timeline-studio/core/services/video-player-performance-monitor", () => ({
  globalPerformanceMonitor: {
    recordSync: vi.fn(),
    recordFailure: vi.fn(),
  },
}))

// Мокаем logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

describe("CommandQueue", () => {
  let queue: CommandQueue

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    queue = new CommandQueue()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("constructor", () => {
    it("должен использовать дефолтные опции", () => {
      const q = new CommandQueue()
      expect(q.size).toBe(0)
      expect(q.isPending).toBe(false)
    })

    it("должен принимать кастомные опции", () => {
      const q = new CommandQueue({
        concurrency: 3,
        maxQueueSize: 50,
        commandTimeout: 10000,
      })
      expect(q.size).toBe(0)
    })
  })

  describe("enqueue", () => {
    it("должен выполнять команду", async () => {
      const command = vi.fn().mockResolvedValue("result")

      const resultPromise = queue.enqueue(command)

      // Позволяем выполниться микротаскам
      await vi.runAllTimersAsync()

      const result = await resultPromise
      expect(result).toBe("result")
      expect(command).toHaveBeenCalledTimes(1)
    })

    it("должен обрабатывать приоритеты - high выполняется раньше normal", async () => {
      const executionOrder: string[] = []

      // Сначала добавляем блокирующую команду, чтобы остальные попали в очередь
      const blockingPromise = queue.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return "blocking"
      }, "low")

      // Теперь добавляем команды, они попадут в очередь
      const normalPromise = queue.enqueue(async () => {
        executionOrder.push("normal")
        return "normal"
      }, "normal")

      const highPromise = queue.enqueue(async () => {
        executionOrder.push("high")
        return "high"
      }, "high")

      await vi.advanceTimersByTimeAsync(200)
      await Promise.all([blockingPromise, normalPromise, highPromise])

      // High должен выполниться раньше normal (после blocking)
      expect(executionOrder[0]).toBe("high")
      expect(executionOrder[1]).toBe("normal")
    })

    it("должен обрабатывать приоритеты - low выполняется после normal", async () => {
      const executionOrder: string[] = []

      // Сначала добавляем блокирующую команду, чтобы остальные попали в очередь
      const blockingPromise = queue.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return "blocking"
      }, "high")

      // Теперь добавляем команды, они попадут в очередь
      const lowPromise = queue.enqueue(async () => {
        executionOrder.push("low")
        return "low"
      }, "low")

      const normalPromise = queue.enqueue(async () => {
        executionOrder.push("normal")
        return "normal"
      }, "normal")

      await vi.advanceTimersByTimeAsync(200)
      await Promise.all([blockingPromise, normalPromise, lowPromise])

      // Normal должен выполниться раньше low (после blocking)
      expect(executionOrder[0]).toBe("normal")
      expect(executionOrder[1]).toBe("low")
    })

    it("должен выбрасывать ошибку при переполнении очереди", async () => {
      const smallQueue = new CommandQueue({ maxQueueSize: 2 })

      // Создаём команды которые долго выполняются
      const longCommand = () => new Promise((resolve) => setTimeout(resolve, 10000))

      // Добавляем команды
      smallQueue.enqueue(longCommand, "normal")
      smallQueue.enqueue(longCommand, "normal")
      smallQueue.enqueue(longCommand, "normal")

      // Четвёртая должна выбросить ошибку
      await expect(smallQueue.enqueue(longCommand, "normal")).rejects.toThrow("Command queue overflow")
    })

    it("должен обрабатывать таймаут команды", async () => {
      const slowQueue = new CommandQueue({ commandTimeout: 100 })

      const slowCommand = () => new Promise((resolve) => setTimeout(resolve, 10000))

      const resultPromise = slowQueue.enqueue(slowCommand, "normal", "slow-test")

      // Добавляем catch чтобы предотвратить unhandled rejection
      resultPromise.catch(() => {
        // Expected rejection
      })

      // Продвигаем таймеры
      await vi.advanceTimersByTimeAsync(150)

      await expect(resultPromise).rejects.toThrow("timed out")
    })

    it("должен пробрасывать ошибку команды", async () => {
      const failingCommand = vi.fn().mockRejectedValue(new Error("Command failed"))

      const resultPromise = queue.enqueue(failingCommand, "normal", "fail-test")

      // Добавляем catch чтобы предотвратить unhandled rejection
      resultPromise.catch(() => {
        // Expected rejection
      })

      await vi.runAllTimersAsync()

      await expect(resultPromise).rejects.toThrow("Command failed")
    })

    it("должен записывать commandType", async () => {
      const command = vi.fn().mockResolvedValue("done")

      const resultPromise = queue.enqueue(command, "normal", "play")

      await vi.runAllTimersAsync()
      await resultPromise

      // Проверяем что команда выполнилась
      expect(command).toHaveBeenCalled()
    })
  })

  describe("clear", () => {
    it("должен очищать очередь", async () => {
      const longCommand = () => new Promise((resolve) => setTimeout(resolve, 10000))

      // Добавляем команды
      queue.enqueue(longCommand, "normal")
      queue.enqueue(longCommand, "normal")

      // Очищаем
      queue.clear()

      // Очередь должна быть пустой (кроме активно выполняемой)
      expect(queue.size).toBe(0)
    })
  })

  describe("flush", () => {
    it("должен ждать завершения всех команд", async () => {
      let completed = false
      const command = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        completed = true
        return "done"
      }

      queue.enqueue(command, "normal")

      const flushPromise = queue.flush()

      // Продвигаем время
      await vi.advanceTimersByTimeAsync(200)

      await flushPromise

      expect(completed).toBe(true)
    })

    it("должен немедленно завершиться если очередь пуста", async () => {
      const startTime = Date.now()

      await queue.flush()

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(100)
    })
  })

  describe("getStats", () => {
    it("должен возвращать статистику очереди", () => {
      const stats = queue.getStats()

      expect(stats).toHaveProperty("queueSize")
      expect(stats).toHaveProperty("activeCommands")
      expect(stats).toHaveProperty("isProcessing")
      expect(stats).toHaveProperty("priorityBreakdown")
      expect(stats.priorityBreakdown).toHaveProperty("high")
      expect(stats.priorityBreakdown).toHaveProperty("normal")
      expect(stats.priorityBreakdown).toHaveProperty("low")
    })

    it("должен отображать правильную статистику приоритетов", async () => {
      const longCommand = () => new Promise((resolve) => setTimeout(resolve, 10000))

      // Первая команда начинает выполняться
      queue.enqueue(longCommand, "high")
      queue.enqueue(longCommand, "normal")
      queue.enqueue(longCommand, "normal")
      queue.enqueue(longCommand, "low")

      // Даём время на начало обработки
      await vi.advanceTimersByTimeAsync(1)

      const stats = queue.getStats()

      // Одна high уже выполняется, остальные в очереди
      expect(stats.priorityBreakdown.normal).toBe(2)
      expect(stats.priorityBreakdown.low).toBe(1)
    })
  })

  describe("isPending", () => {
    it("должен возвращать false когда очередь пуста", () => {
      expect(queue.isPending).toBe(false)
    })

    it("должен возвращать true когда есть команды в очереди", async () => {
      const longCommand = () => new Promise((resolve) => setTimeout(resolve, 10000))

      queue.enqueue(longCommand, "normal")

      expect(queue.isPending).toBe(true)
    })
  })

  describe("size", () => {
    it("должен возвращать 0 для пустой очереди", () => {
      expect(queue.size).toBe(0)
    })

    it("должен возвращать правильный размер", async () => {
      const longCommand = () => new Promise((resolve) => setTimeout(resolve, 10000))

      // Первая команда начнёт выполняться
      queue.enqueue(longCommand, "normal")
      queue.enqueue(longCommand, "normal")
      queue.enqueue(longCommand, "normal")

      // Даём время на начало обработки первой команды
      await vi.advanceTimersByTimeAsync(1)

      // Одна выполняется, две в очереди
      expect(queue.size).toBe(2)
    })
  })

  describe("concurrency", () => {
    it("должен выполнять команды последовательно при concurrency=1", async () => {
      const results: number[] = []

      const createCommand = (num: number) => async () => {
        results.push(num)
        await new Promise((resolve) => setTimeout(resolve, 50))
        return num
      }

      queue.enqueue(createCommand(1), "normal")
      queue.enqueue(createCommand(2), "normal")
      queue.enqueue(createCommand(3), "normal")

      await vi.advanceTimersByTimeAsync(200)
      await queue.flush()

      // Команды должны выполниться последовательно
      expect(results).toEqual([1, 2, 3])
    })

    it("должен выполнять команды параллельно при concurrency>1", async () => {
      const parallelQueue = new CommandQueue({ concurrency: 3 })
      const startTimes: number[] = []
      const baseTime = Date.now()

      const createCommand = () => async () => {
        startTimes.push(Date.now() - baseTime)
        await new Promise((resolve) => setTimeout(resolve, 100))
        return "done"
      }

      parallelQueue.enqueue(createCommand(), "normal")
      parallelQueue.enqueue(createCommand(), "normal")
      parallelQueue.enqueue(createCommand(), "normal")

      await vi.advanceTimersByTimeAsync(200)

      // Все три должны начаться примерно одновременно
      expect(startTimes.length).toBe(3)
    })
  })

  describe("priority ordering", () => {
    it("должен правильно сортировать по приоритету", async () => {
      const executionOrder: string[] = []
      const longCommand = () => new Promise((resolve) => setTimeout(resolve, 5000))

      // Первая команда начинает выполняться
      // Добавляем catch чтобы предотвратить unhandled rejection при таймауте
      queue.enqueue(longCommand, "normal").catch(() => {
        // Expected - команда может завершиться таймаутом
      })

      // Добавляем команды разных приоритетов
      queue.enqueue(async () => {
        executionOrder.push("low-1")
      }, "low")
      queue.enqueue(async () => {
        executionOrder.push("normal-1")
      }, "normal")
      queue.enqueue(async () => {
        executionOrder.push("high-1")
      }, "high")
      queue.enqueue(async () => {
        executionOrder.push("low-2")
      }, "low")
      queue.enqueue(async () => {
        executionOrder.push("high-2")
      }, "high")

      // Даём время на выполнение всех команд
      await vi.advanceTimersByTimeAsync(10000)

      // Порядок: high, high, normal, low, low
      expect(executionOrder).toEqual(["high-1", "high-2", "normal-1", "low-1", "low-2"])
    })
  })
})
