/**
 * Тесты для MulticamManager - синглтон для управления мультикамерной системой
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MulticamCommand } from "../../types/multicam"
import { multicamManager } from "../multicam-manager"

describe("MulticamManager", () => {
  beforeEach(() => {
    // Очищаем все слушатели перед каждым тестом
    multicamManager.removeAllListeners()
  })

  describe("Singleton Pattern", () => {
    it("should always return the same instance", () => {
      const instance1 = multicamManager
      const instance2 = multicamManager

      expect(instance1).toBe(instance2)
    })
  })

  describe("Base Clip Management", () => {
    it("should set base clip ID", () => {
      multicamManager.setBaseClip("clip-123")

      expect(multicamManager.getBaseClip()).toBe("clip-123")
    })

    it("should update base clip ID", () => {
      multicamManager.setBaseClip("clip-123")
      multicamManager.setBaseClip("clip-456")

      expect(multicamManager.getBaseClip()).toBe("clip-456")
    })

    it("should set base clip to null", () => {
      multicamManager.setBaseClip("clip-123")
      multicamManager.setBaseClip(null)

      expect(multicamManager.getBaseClip()).toBeNull()
    })

    it("should initialize with null base clip", () => {
      expect(multicamManager.getBaseClip()).toBeNull()
    })
  })

  describe("Camera Switching", () => {
    it("should switch to camera by index", () => {
      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      multicamManager.switchToCamera(2)

      expect(handler).toHaveBeenCalledWith(2)
    })

    it("should update current angle index", () => {
      multicamManager.switchToCamera(3)

      expect(multicamManager.getCurrentAngleIndex()).toBe(3)
    })

    it("should switch to camera by number (1-indexed)", () => {
      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      multicamManager.switchToCameraByNumber(5) // Camera 5 = index 4

      expect(handler).toHaveBeenCalledWith(4)
      expect(multicamManager.getCurrentAngleIndex()).toBe(4)
    })

    it("should emit camera-switched event", () => {
      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      multicamManager.switchToCamera(1)
      multicamManager.switchToCamera(2)
      multicamManager.switchToCamera(0)

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, 1)
      expect(handler).toHaveBeenNthCalledWith(2, 2)
      expect(handler).toHaveBeenNthCalledWith(3, 0)
    })

    it("should initialize with angle index 0", () => {
      expect(multicamManager.getCurrentAngleIndex()).toBe(0)
    })
  })

  describe("Command Execution", () => {
    it("should execute switch-camera command", () => {
      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      const command: MulticamCommand = {
        type: "switch-camera",
        angleIndex: 2,
      }

      multicamManager.executeCommand(command)

      expect(handler).toHaveBeenCalledWith(2)
      expect(multicamManager.getCurrentAngleIndex()).toBe(2)
    })

    it("should execute sync-angle command", () => {
      const handler = vi.fn()
      multicamManager.on("sync-updated", handler)

      const command: MulticamCommand = {
        type: "sync-angle",
        angleIndex: 1,
        offset: 2.5,
      }

      multicamManager.executeCommand(command)

      expect(handler).toHaveBeenCalledWith(1, 2.5)
    })

    it("should execute add-angle command", () => {
      const handler = vi.fn()
      multicamManager.on("angle-added", handler)

      const command: MulticamCommand = {
        type: "add-angle",
        clipId: "new-clip-123",
      }

      multicamManager.executeCommand(command)

      expect(handler).toHaveBeenCalledWith("new-clip-123")
    })

    it("should execute remove-angle command", () => {
      const handler = vi.fn()
      multicamManager.on("angle-removed", handler)

      const command: MulticamCommand = {
        type: "remove-angle",
        angleIndex: 3,
      }

      multicamManager.executeCommand(command)

      expect(handler).toHaveBeenCalledWith(3)
    })

    it("should handle unknown command types gracefully", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const command = {
        type: "unknown-command",
      } as any

      expect(() => {
        multicamManager.executeCommand(command)
      }).not.toThrow()

      consoleWarnSpy.mockRestore()
    })
  })

  describe("Event System", () => {
    it("should support camera-switched events", () => {
      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      multicamManager.switchToCamera(1)

      expect(handler).toHaveBeenCalledWith(1)
    })

    it("should support sync-updated events", () => {
      const handler = vi.fn()
      multicamManager.on("sync-updated", handler)

      multicamManager.executeCommand({
        type: "sync-angle",
        angleIndex: 0,
        offset: 1.5,
      })

      expect(handler).toHaveBeenCalledWith(0, 1.5)
    })

    it("should support angle-added events", () => {
      const handler = vi.fn()
      multicamManager.on("angle-added", handler)

      multicamManager.executeCommand({
        type: "add-angle",
        clipId: "clip-789",
      })

      expect(handler).toHaveBeenCalledWith("clip-789")
    })

    it("should support angle-removed events", () => {
      const handler = vi.fn()
      multicamManager.on("angle-removed", handler)

      multicamManager.executeCommand({
        type: "remove-angle",
        angleIndex: 2,
      })

      expect(handler).toHaveBeenCalledWith(2)
    })

    it("should support multiple listeners for same event", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      multicamManager.on("camera-switched", handler1)
      multicamManager.on("camera-switched", handler2)
      multicamManager.on("camera-switched", handler3)

      multicamManager.switchToCamera(5)

      expect(handler1).toHaveBeenCalledWith(5)
      expect(handler2).toHaveBeenCalledWith(5)
      expect(handler3).toHaveBeenCalledWith(5)
    })

    it("should allow removing listeners", () => {
      const handler = vi.fn()

      multicamManager.on("camera-switched", handler)
      multicamManager.removeListener("camera-switched", handler)

      multicamManager.switchToCamera(1)

      expect(handler).not.toHaveBeenCalled()
    })

    it("should support once listeners", () => {
      const handler = vi.fn()

      multicamManager.once("camera-switched", handler)

      multicamManager.switchToCamera(1)
      multicamManager.switchToCamera(2)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(1)
    })
  })

  describe("State Persistence", () => {
    it("should maintain state across multiple operations", () => {
      multicamManager.setBaseClip("base-clip")
      multicamManager.switchToCamera(3)

      expect(multicamManager.getBaseClip()).toBe("base-clip")
      expect(multicamManager.getCurrentAngleIndex()).toBe(3)

      multicamManager.switchToCamera(1)

      expect(multicamManager.getBaseClip()).toBe("base-clip")
      expect(multicamManager.getCurrentAngleIndex()).toBe(1)
    })

    it("should persist state when adding/removing listeners", () => {
      multicamManager.switchToCamera(5)

      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      expect(multicamManager.getCurrentAngleIndex()).toBe(5)

      multicamManager.removeListener("camera-switched", handler)

      expect(multicamManager.getCurrentAngleIndex()).toBe(5)
    })
  })

  describe("Complex Scenarios", () => {
    it("should handle rapid camera switches", () => {
      const handler = vi.fn()
      multicamManager.on("camera-switched", handler)

      for (let i = 0; i < 10; i++) {
        multicamManager.switchToCamera(i)
      }

      expect(handler).toHaveBeenCalledTimes(10)
      expect(multicamManager.getCurrentAngleIndex()).toBe(9)
    })

    it("should handle switching while handling switch event", () => {
      let callCount = 0
      const handler = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          // Switch again during event handling
          multicamManager.switchToCamera(5)
        }
      })

      multicamManager.on("camera-switched", handler)
      multicamManager.switchToCamera(2)

      expect(handler).toHaveBeenCalledTimes(2)
      expect(multicamManager.getCurrentAngleIndex()).toBe(5)
    })

    it("should handle command execution with multiple event listeners", () => {
      const switchHandler = vi.fn()
      const syncHandler = vi.fn()
      const addHandler = vi.fn()

      multicamManager.on("camera-switched", switchHandler)
      multicamManager.on("sync-updated", syncHandler)
      multicamManager.on("angle-added", addHandler)

      multicamManager.executeCommand({ type: "switch-camera", angleIndex: 1 })
      multicamManager.executeCommand({ type: "sync-angle", angleIndex: 0, offset: 1.0 })
      multicamManager.executeCommand({ type: "add-angle", clipId: "new-clip" })

      expect(switchHandler).toHaveBeenCalledTimes(1)
      expect(syncHandler).toHaveBeenCalledTimes(1)
      expect(addHandler).toHaveBeenCalledTimes(1)
    })

    it("should maintain separate state for different event types", () => {
      const cameraHandler = vi.fn()
      const syncHandler = vi.fn()

      multicamManager.on("camera-switched", cameraHandler)
      multicamManager.on("sync-updated", syncHandler)

      multicamManager.switchToCamera(3)
      multicamManager.executeCommand({ type: "sync-angle", angleIndex: 0, offset: 2.0 })

      expect(cameraHandler).toHaveBeenCalledWith(3)
      expect(syncHandler).toHaveBeenCalledWith(0, 2.0)
    })
  })

  describe("Error Recovery", () => {
    it("should continue working after listener throws error", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const errorHandler = vi.fn(() => {
        throw new Error("Handler error")
      })
      const normalHandler = vi.fn()

      multicamManager.on("camera-switched", errorHandler)
      multicamManager.on("camera-switched", normalHandler)

      multicamManager.switchToCamera(1)

      expect(errorHandler).toHaveBeenCalled()
      expect(normalHandler).toHaveBeenCalled()
      expect(multicamManager.getCurrentAngleIndex()).toBe(1)

      consoleErrorSpy.mockRestore()
    })

    it("should handle setting base clip to unusual values", () => {
      expect(() => {
        multicamManager.setBaseClip("")
      }).not.toThrow()

      expect(multicamManager.getBaseClip()).toBe("")

      expect(() => {
        multicamManager.setBaseClip(null)
      }).not.toThrow()

      expect(multicamManager.getBaseClip()).toBeNull()
    })
  })
})
