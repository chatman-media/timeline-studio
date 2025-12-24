/**
 * Logger Tests
 */

import { describe, test, expect, beforeEach, mock } from "bun:test"
import { Logger, createLogger } from "../../src/utils/logger"

describe("Logger", () => {
  let consoleLogSpy: ReturnType<typeof mock>
  let consoleErrorSpy: ReturnType<typeof mock>
  let consoleWarnSpy: ReturnType<typeof mock>

  beforeEach(() => {
    consoleLogSpy = mock(() => {})
    consoleErrorSpy = mock(() => {})
    consoleWarnSpy = mock(() => {})

    console.log = consoleLogSpy
    console.error = consoleErrorSpy
    console.warn = consoleWarnSpy
  })

  describe("createLogger", () => {
    test("should create logger with name", () => {
      const logger = createLogger("TestLogger")
      expect(logger).toBeInstanceOf(Logger)
    })
  })

  describe("logging methods", () => {
    test("should log info messages", () => {
      const logger = new Logger("TestLogger", "info")
      logger.info("Test message")

      expect(consoleLogSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(loggedData.level).toBe("info")
      expect(loggedData.name).toBe("TestLogger")
      expect(loggedData.message).toBe("Test message")
      expect(loggedData.timestamp).toBeDefined()
    })

    test("should log error messages", () => {
      const logger = new Logger("TestLogger", "error")
      logger.error("Error message")

      expect(consoleErrorSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(loggedData.level).toBe("error")
      expect(loggedData.message).toBe("Error message")
    })

    test("should log warn messages", () => {
      const logger = new Logger("TestLogger", "warn")
      logger.warn("Warning message")

      expect(consoleWarnSpy).toHaveBeenCalled()
      const loggedData = JSON.parse(consoleWarnSpy.mock.calls[0][0])

      expect(loggedData.level).toBe("warn")
      expect(loggedData.message).toBe("Warning message")
    })

    test("should include context in logs", () => {
      const logger = new Logger("TestLogger", "info")
      logger.info("Test message", { userId: "123", action: "test" })

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(loggedData.userId).toBe("123")
      expect(loggedData.action).toBe("test")
    })
  })

  describe("log levels", () => {
    test("should respect log level threshold", () => {
      const logger = new Logger("TestLogger", "error")

      // Debug and info should not log when level is error
      logger.debug("Debug message")
      logger.info("Info message")

      expect(consoleLogSpy).not.toHaveBeenCalled()

      // Error should log
      logger.error("Error message")
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe("JSON formatting", () => {
    test("should produce valid JSON", () => {
      const logger = new Logger("TestLogger", "info")
      logger.info("Test message", { data: { nested: "value" } })

      const loggedString = consoleLogSpy.mock.calls[0][0]
      expect(() => JSON.parse(loggedString)).not.toThrow()
    })

    test("should include timestamp in ISO format", () => {
      const logger = new Logger("TestLogger", "info")
      logger.info("Test message")

      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0])
      const timestamp = new Date(loggedData.timestamp)

      expect(timestamp.toISOString()).toBe(loggedData.timestamp)
    })
  })
})
