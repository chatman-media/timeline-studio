/**
 * Тесты для хука регистрации горячих клавиш мультикамеры
 */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { shortcutsRegistry } from "@/features/keyboard-shortcuts/services/shortcuts-registry"
import { multicamManager } from "../../services/multicam-manager"
import { useMulticamShortcuts } from "../use-multicam-shortcuts"

// Моки
vi.mock("@/features/keyboard-shortcuts/services/shortcuts-registry", () => ({
  shortcutsRegistry: {
    get: vi.fn(),
    register: vi.fn(),
  },
}))

vi.mock("../../services/multicam-manager", () => ({
  multicamManager: {
    switchToCameraByNumber: vi.fn(),
  },
}))

vi.mock("@/lib/tauri-logger", () => ({
  logInfo: vi.fn(),
}))

describe("useMulticamShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // По умолчанию все shortcuts существуют с правильными ID
    vi.mocked(shortcutsRegistry.get).mockImplementation((id) => ({
      id,
      key: id.replace("switch-camera-", ""),
      description: `Switch to camera ${id.replace("switch-camera-", "")}`,
      category: "multicam" as const,
      enabled: true,
    }))
  })

  describe("Initialization", () => {
    it("should initialize without errors", () => {
      expect(() => {
        renderHook(() => useMulticamShortcuts())
      }).not.toThrow()
    })

    it("should register shortcuts for cameras 1-9", () => {
      renderHook(() => useMulticamShortcuts())

      // Should try to get all 9 camera shortcuts
      expect(shortcutsRegistry.get).toHaveBeenCalledTimes(9)

      for (let i = 1; i <= 9; i++) {
        expect(shortcutsRegistry.get).toHaveBeenCalledWith(`switch-camera-${i}`)
      }
    })

    it("should register action handlers for existing shortcuts", () => {
      renderHook(() => useMulticamShortcuts())

      // Should register all 9 shortcuts with actions
      expect(shortcutsRegistry.register).toHaveBeenCalledTimes(9)

      // Each registration should have an action function
      const calls = vi.mocked(shortcutsRegistry.register).mock.calls
      calls.forEach((call) => {
        expect(call[0].action).toBeDefined()
        expect(typeof call[0].action).toBe("function")
      })
    })

    it("should not register shortcuts that don't exist", () => {
      // Только первые 3 shortcut'а существуют
      vi.mocked(shortcutsRegistry.get).mockImplementation((id) => {
        const num = Number.parseInt(id.replace("switch-camera-", ""), 10)
        if (num <= 3) {
          return {
            id,
            key: id.replace("switch-camera-", ""),
            description: `Switch to camera ${id.replace("switch-camera-", "")}`,
            category: "multicam" as const,
            enabled: true,
          }
        }
        return undefined
      })

      renderHook(() => useMulticamShortcuts())

      // Should only register 3 shortcuts
      expect(shortcutsRegistry.register).toHaveBeenCalledTimes(3)
    })
  })

  describe("Shortcut Actions", () => {
    it("should call switchToCameraByNumber when shortcut is triggered", () => {
      renderHook(() => useMulticamShortcuts())

      // Get the registered action for camera 1
      const registerCall = vi.mocked(shortcutsRegistry.register).mock.calls.find((call) =>
        call[0].id.includes("camera-1"),
      )

      expect(registerCall).toBeDefined()
      const action = registerCall![0].action

      // Trigger the action
      const mockEvent = new KeyboardEvent("keydown", { key: "1" })
      action!(mockEvent)

      expect(multicamManager.switchToCameraByNumber).toHaveBeenCalledWith(1)
    })

    it("should call correct camera number for each shortcut", () => {
      renderHook(() => useMulticamShortcuts())

      const registerCalls = vi.mocked(shortcutsRegistry.register).mock.calls

      // Test each camera shortcut
      for (let i = 1; i <= 9; i++) {
        const call = registerCalls.find((c) => c[0].id === `switch-camera-${i}`)
        expect(call).toBeDefined()

        const action = call![0].action
        const mockEvent = new KeyboardEvent("keydown", { key: String(i) })

        vi.mocked(multicamManager.switchToCameraByNumber).mockClear()
        action!(mockEvent)

        expect(multicamManager.switchToCameraByNumber).toHaveBeenCalledWith(i)
      }
    })

    it("should prevent default event behavior", () => {
      renderHook(() => useMulticamShortcuts())

      const registerCall = vi.mocked(shortcutsRegistry.register).mock.calls[0]
      const action = registerCall[0].action

      const mockEvent = {
        preventDefault: vi.fn(),
      } as any

      action!(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
  })

  describe("Cleanup", () => {
    it("should unregister shortcuts on unmount", () => {
      const { unmount } = renderHook(() => useMulticamShortcuts())

      vi.mocked(shortcutsRegistry.register).mockClear()

      unmount()

      // Should unregister all 9 shortcuts
      expect(shortcutsRegistry.register).toHaveBeenCalledTimes(9)

      // Each unregistration should have undefined action
      const calls = vi.mocked(shortcutsRegistry.register).mock.calls
      calls.forEach((call) => {
        expect(call[0].action).toBeUndefined()
      })
    })

    it("should preserve other shortcut properties on cleanup", () => {
      const { unmount } = renderHook(() => useMulticamShortcuts())

      vi.mocked(shortcutsRegistry.register).mockClear()

      unmount()

      const cleanupCall = vi.mocked(shortcutsRegistry.register).mock.calls[0]

      expect(cleanupCall[0]).toMatchObject({
        id: expect.stringMatching(/^switch-camera-\d$/),
        key: expect.any(String),
        description: expect.any(String),
        category: "multicam",
        enabled: true,
        action: undefined,
      })
    })

    it("should not fail cleanup for non-existent shortcuts", () => {
      vi.mocked(shortcutsRegistry.get).mockReturnValue(undefined)

      const { unmount } = renderHook(() => useMulticamShortcuts())

      expect(() => unmount()).not.toThrow()
    })
  })

  describe("Re-mounting", () => {
    it("should re-register shortcuts when re-mounted", () => {
      const { unmount } = renderHook(() => useMulticamShortcuts())

      const initialCallCount = vi.mocked(shortcutsRegistry.register).mock.calls.length

      unmount()
      vi.mocked(shortcutsRegistry.register).mockClear()

      // Создаем новый хук вместо rerender
      renderHook(() => useMulticamShortcuts())

      expect(shortcutsRegistry.register).toHaveBeenCalledTimes(initialCallCount)
    })

    it("should work correctly after multiple mount/unmount cycles", () => {
      const { unmount: unmount1 } = renderHook(() => useMulticamShortcuts())
      unmount1()

      const { unmount: unmount2 } = renderHook(() => useMulticamShortcuts())
      unmount2()

      const { result } = renderHook(() => useMulticamShortcuts())

      // Should still work after multiple cycles
      expect(result.current).toBeUndefined() // Hook returns nothing
      expect(shortcutsRegistry.register).toHaveBeenCalled()
    })
  })

  describe("Edge Cases", () => {
    it("should handle shortcuts that change after mount", () => {
      const { rerender } = renderHook(() => useMulticamShortcuts())

      // Change mock to return different shortcut
      vi.mocked(shortcutsRegistry.get).mockImplementation((id) => ({
        id,
        key: id.replace("switch-camera-", ""),
        description: `Switch to camera ${id.replace("switch-camera-", "")}`,
        category: "multicam" as const,
        enabled: false, // Changed from true to false
      }))

      // Rerender - but effect shouldn't re-run (empty deps)
      rerender()

      // Should not re-register (effect has empty deps)
      expect(shortcutsRegistry.register).toHaveBeenCalledTimes(9)
    })

    it("should handle get returning null", () => {
      vi.mocked(shortcutsRegistry.get).mockReturnValue(null as any)

      expect(() => {
        renderHook(() => useMulticamShortcuts())
      }).not.toThrow()

      // Should not try to register if shortcut doesn't exist
      expect(shortcutsRegistry.register).not.toHaveBeenCalled()
    })

    it("should register exactly 9 shortcuts regardless of other shortcuts", () => {
      renderHook(() => useMulticamShortcuts())

      expect(shortcutsRegistry.get).toHaveBeenCalledTimes(9)
      expect(shortcutsRegistry.register).toHaveBeenCalledTimes(9)

      // Verify we only register camera shortcuts
      const calls = vi.mocked(shortcutsRegistry.register).mock.calls
      calls.forEach((call) => {
        expect(call[0].id).toMatch(/^switch-camera-[1-9]$/)
      })
    })
  })

  describe("Integration with multicamManager", () => {
    it("should correctly map keyboard numbers to camera indices", () => {
      renderHook(() => useMulticamShortcuts())

      const testMappings = [
        { key: 1, expectedCamera: 1 },
        { key: 5, expectedCamera: 5 },
        { key: 9, expectedCamera: 9 },
      ]

      testMappings.forEach(({ key, expectedCamera }) => {
        const call = vi.mocked(shortcutsRegistry.register).mock.calls.find((c) => c[0].id === `switch-camera-${key}`)

        const action = call![0].action
        const mockEvent = new KeyboardEvent("keydown", { key: String(key) })

        vi.mocked(multicamManager.switchToCameraByNumber).mockClear()
        action!(mockEvent)

        expect(multicamManager.switchToCameraByNumber).toHaveBeenCalledWith(expectedCamera)
      })
    })

    it("should not interfere with multicam manager state", () => {
      renderHook(() => useMulticamShortcuts())

      // Trigger some shortcuts
      const calls = vi.mocked(shortcutsRegistry.register).mock.calls
      calls.slice(0, 3).forEach((call) => {
        const action = call[0].action
        const mockEvent = new KeyboardEvent("keydown")
        action!(mockEvent)
      })

      // Should only call switchToCameraByNumber, nothing else
      expect(multicamManager.switchToCameraByNumber).toHaveBeenCalledTimes(3)
    })
  })
})
