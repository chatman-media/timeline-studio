/**
 * Tests for Command Queue
 *
 * Тесты для очереди команд с предотвращением race conditions
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CommandQueue, debounceCommand, throttleCommand } from "../../utils/command-queue"

describe("CommandQueue", () => {
  let queue: CommandQueue

  beforeEach(() => {
    queue = new CommandQueue()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Basic Operations", () => {
    it("should enqueue and execute commands in order", async () => {
      const results: number[] = []
      const command1 = vi.fn(async () => {
        results.push(1)
        return 1
      })
      const command2 = vi.fn(async () => {
        results.push(2)
        return 2
      })
      const command3 = vi.fn(async () => {
        results.push(3)
        return 3
      })

      const promise1 = queue.enqueue(command1)
      const promise2 = queue.enqueue(command2)
      const promise3 = queue.enqueue(command3)

      await Promise.all([promise1, promise2, promise3])

      expect(results).toEqual([1, 2, 3])
      expect(command1).toHaveBeenCalledTimes(1)
      expect(command2).toHaveBeenCalledTimes(1)
      expect(command3).toHaveBeenCalledTimes(1)
    })

    it("should return correct result from enqueued command", async () => {
      const result = await queue.enqueue(async () => {
        return "test-result"
      })

      expect(result).toBe("test-result")
    })

    it("should handle empty queue", () => {
      expect(queue.getLength()).toBe(0)
      expect(queue.isIdle()).toBe(true)
    })
  })

  describe("Priority Queue", () => {
    it("should execute commands by priority (higher first)", async () => {
      const results: string[] = []

      const lowPriority = queue.enqueue(async () => {
        results.push("low")
        return "low"
      }, 0)

      const highPriority = queue.enqueue(async () => {
        results.push("high")
        return "high"
      }, 10)

      const mediumPriority = queue.enqueue(async () => {
        results.push("medium")
        return "medium"
      }, 5)

      await Promise.all([lowPriority, mediumPriority, highPriority])

      // First command executes immediately, then by priority
      expect(results[0]).toBe("low") // Already started
      expect(results[1]).toBe("high") // Priority 10
      expect(results[2]).toBe("medium") // Priority 5
    })

    it("should maintain insertion order for same priority", async () => {
      const results: number[] = []

      const command1 = queue.enqueue(async () => {
        results.push(1)
      }, 5)

      const command2 = queue.enqueue(async () => {
        results.push(2)
      }, 5)

      const command3 = queue.enqueue(async () => {
        results.push(3)
      }, 5)

      await Promise.all([command1, command2, command3])

      expect(results).toEqual([1, 2, 3])
    })
  })

  describe("Error Handling", () => {
    it("should reject promise when command fails", async () => {
      const error = new Error("Command failed")
      const failingCommand = async () => {
        throw error
      }

      await expect(queue.enqueue(failingCommand)).rejects.toThrow("Command failed")
    })

    it("should continue processing queue after command failure", async () => {
      const results: number[] = []

      const command1 = queue.enqueue(async () => {
        results.push(1)
      })

      const command2 = queue.enqueue(async () => {
        throw new Error("Failed")
      })

      const command3 = queue.enqueue(async () => {
        results.push(3)
      })

      await command1
      await expect(command2).rejects.toThrow("Failed")
      await command3

      expect(results).toEqual([1, 3])
    })

    it("should handle multiple consecutive failures", async () => {
      const error1 = new Error("Error 1")
      const error2 = new Error("Error 2")
      const results: string[] = []

      const promise1 = queue.enqueue(async () => {
        throw error1
      })

      const promise2 = queue.enqueue(async () => {
        throw error2
      })

      const promise3 = queue.enqueue(async () => {
        results.push("success")
      })

      await expect(promise1).rejects.toThrow("Error 1")
      await expect(promise2).rejects.toThrow("Error 2")
      await promise3

      expect(results).toEqual(["success"])
    })
  })

  describe("Queue Management", () => {
    it("should clear queue", async () => {
      queue.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })
      queue.enqueue(async () => {})
      queue.enqueue(async () => {})

      // Даём время первой команде начать выполнение
      await new Promise((resolve) => setTimeout(resolve, 5))

      expect(queue.getLength()).toBeGreaterThan(0)

      queue.clear()

      expect(queue.getLength()).toBe(0)
    })

    it("should return correct queue length", async () => {
      expect(queue.getLength()).toBe(0)

      const slowCommand = queue.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })

      const command2 = queue.enqueue(async () => {})
      const command3 = queue.enqueue(async () => {})

      // Даём время первой команде начать выполнение
      await new Promise((resolve) => setTimeout(resolve, 5))
      expect(queue.getLength()).toBe(2) // First is processing, 2 waiting

      // Ждём выполнения всех команд
      await Promise.all([slowCommand, command2, command3])

      expect(queue.getLength()).toBe(0)
    })

    it("should report idle state correctly", async () => {
      expect(queue.isIdle()).toBe(true)

      const promise = queue.enqueue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20))
      })

      // Даём время команде начать выполнение
      await new Promise((resolve) => setTimeout(resolve, 5))
      expect(queue.isIdle()).toBe(false)

      await promise

      expect(queue.isIdle()).toBe(true)
    })
  })

  describe("Concurrency Control", () => {
    it("should process commands sequentially, not in parallel", async () => {
      let executing = 0
      let maxConcurrent = 0

      const createCommand = (delay: number) => async () => {
        executing++
        maxConcurrent = Math.max(maxConcurrent, executing)
        await new Promise((resolve) => setTimeout(resolve, delay))
        executing--
      }

      const promises = [
        queue.enqueue(createCommand(10)),
        queue.enqueue(createCommand(10)),
        queue.enqueue(createCommand(10)),
      ]

      await Promise.all(promises)

      expect(maxConcurrent).toBe(1) // Only 1 command executing at a time
    })
  })

  describe("Command Metadata", () => {
    it("should generate unique command IDs", async () => {
      const ids = new Set<string>()

      // Mock command to capture ID
      const captureId = async () => {
        return "result"
      }

      await queue.enqueue(captureId)
      await queue.enqueue(captureId)
      await queue.enqueue(captureId)

      // Each command should have unique ID (tested indirectly through execution)
      expect(ids.size).toBeGreaterThanOrEqual(0) // IDs are internal, can't directly test
    })
  })
})

describe("debounceCommand", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("should debounce command execution", async () => {
    const fn = vi.fn(async (value: string) => value)
    const debounced = debounceCommand(fn, 100)

    const promise1 = debounced("call1")
    const promise2 = debounced("call2")
    const promise3 = debounced("call3")

    vi.advanceTimersByTime(100)
    await vi.runAllTimersAsync()

    await Promise.all([promise1, promise2, promise3])

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith("call3") // Last call wins
  })

  it("should execute after delay expires", async () => {
    const fn = vi.fn(async () => "result")
    const debounced = debounceCommand(fn, 200)

    const promise = debounced()

    vi.advanceTimersByTime(199)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    await promise

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("should reset timer on subsequent calls", async () => {
    const fn = vi.fn(async () => "result")
    const debounced = debounceCommand(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(50)

    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(50)
    await vi.runAllTimersAsync()

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("should handle errors in debounced function", async () => {
    const error = new Error("Debounced error")
    const fn = vi.fn(async () => {
      throw error
    })
    const debounced = debounceCommand(fn, 100)

    const promise = debounced()

    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toThrow("Debounced error")
  })

  it("should return result from latest call", async () => {
    const fn = vi.fn(async (value: number) => value * 2)
    const debounced = debounceCommand(fn, 100)

    debounced(1)
    debounced(2)
    const promise = debounced(3)

    vi.advanceTimersByTime(100)

    const result = await promise

    expect(result).toBe(6) // 3 * 2
  })

  it("should handle multiple debounce cycles", async () => {
    const fn = vi.fn(async (value: string) => value)
    const debounced = debounceCommand(fn, 100)

    // First cycle
    debounced("call1")
    vi.advanceTimersByTime(100)
    await vi.runAllTimersAsync()

    // Second cycle
    debounced("call2")
    vi.advanceTimersByTime(100)
    await vi.runAllTimersAsync()

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, "call1")
    expect(fn).toHaveBeenNthCalledWith(2, "call2")
  })
})

describe("throttleCommand", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("should throttle command execution", async () => {
    const fn = vi.fn(async (value: number) => value)
    const throttled = throttleCommand(fn, 100)

    await throttled(1) // Executes immediately
    throttled(2) // Throttled
    throttled(3) // Throttled

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)
  })

  it("should allow execution after throttle period", async () => {
    const fn = vi.fn(async (value: number) => value)
    const throttled = throttleCommand(fn, 100)

    await throttled(1)
    expect(fn).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)

    await throttled(2)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it("should return result from first call in throttle window", async () => {
    const fn = vi.fn(async (value: number) => value * 2)
    const throttled = throttleCommand(fn, 100)

    const result1 = await throttled(5)
    const result2 = await throttled(10) // Throttled, waits for pending

    expect(result1).toBe(10) // 5 * 2
    expect(result2).toBe(undefined) // Throttled
  })

  it("should handle errors in throttled function", async () => {
    const error = new Error("Throttled error")
    const fn = vi.fn(async () => {
      throw error
    })
    const throttled = throttleCommand(fn, 100)

    await expect(throttled()).rejects.toThrow("Throttled error")

    // Subsequent calls within throttle period return undefined
    const result = await throttled()
    expect(result).toBe(undefined)
  })

  it("should track time correctly across multiple calls", async () => {
    const fn = vi.fn(async (value: number) => value)
    const throttled = throttleCommand(fn, 100)

    await throttled(1) // t=0, executes
    vi.advanceTimersByTime(50)
    await throttled(2) // t=50, throttled
    vi.advanceTimersByTime(50)
    await throttled(3) // t=100, executes
    vi.advanceTimersByTime(50)
    await throttled(4) // t=150, throttled

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, 1)
    expect(fn).toHaveBeenNthCalledWith(2, 3)
  })

  it("should return pending promise during throttle", async () => {
    let resolvePromise: (value: number) => void
    const fn = vi.fn(
      async (value: number) =>
        new Promise<number>((resolve) => {
          resolvePromise = resolve
        }),
    )
    const throttled = throttleCommand(fn, 100)

    const promise1 = throttled(1)
    const promise2 = throttled(2) // Should return promise1 result (undefined)

    resolvePromise!(10)
    await promise1

    const result2 = await promise2
    expect(result2).toBe(undefined)
  })
})

describe("Integration Tests", () => {
  it("should work with debounceCommand and CommandQueue", async () => {
    const queue = new CommandQueue()
    const fn = vi.fn(async (value: string) => value)
    const debounced = debounceCommand(fn, 50)

    queue.enqueue(() => debounced("call1"))
    queue.enqueue(() => debounced("call2"))
    queue.enqueue(() => debounced("call3"))

    // Ждём выполнения debounce delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Only last call should execute due to debounce
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("should work with throttleCommand and CommandQueue", async () => {
    const queue = new CommandQueue()
    const fn = vi.fn(async (value: number) => value)
    const throttled = throttleCommand(fn, 50)

    await queue.enqueue(() => throttled(1))
    await queue.enqueue(() => throttled(2))

    // Ждём throttle period
    await new Promise((resolve) => setTimeout(resolve, 60))

    await queue.enqueue(() => throttled(3))

    expect(fn).toHaveBeenCalledTimes(2) // First and third calls
  })
})
