import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { usePanelShortcuts } from "../../hooks/use-panel-shortcuts"
import { shortcutsRegistry } from "../../services/shortcuts-registry"

// Mock user settings
const mockToggleBrowserVisibility = vi.fn()
const mockToggleOptionsVisibility = vi.fn()
const mockToggleTimelineVisibility = vi.fn()

vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    toggleBrowserVisibility: mockToggleBrowserVisibility,
    toggleOptionsVisibility: mockToggleOptionsVisibility,
    toggleTimelineVisibility: mockToggleTimelineVisibility,
  }),
}))

describe("usePanelShortcuts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    shortcutsRegistry.clear()

    // Pre-register the panel shortcuts without actions
    shortcutsRegistry.register({
      id: "toggle-browser",
      name: "Toggle Browser",
      category: "view",
      keys: ["cmd+b"],
    })

    shortcutsRegistry.register({
      id: "toggle-options",
      name: "Toggle Options",
      category: "view",
      keys: ["cmd+o"],
    })

    shortcutsRegistry.register({
      id: "toggle-timeline",
      name: "Toggle Timeline",
      category: "view",
      keys: ["cmd+t"],
    })
  })

  afterEach(() => {
    shortcutsRegistry.clear()
  })

  describe("Hook Behavior", () => {
    it("should register actions for panel shortcuts", () => {
      renderHook(() => usePanelShortcuts())

      const browserShortcut = shortcutsRegistry.get("toggle-browser")
      const optionsShortcut = shortcutsRegistry.get("toggle-options")
      const timelineShortcut = shortcutsRegistry.get("toggle-timeline")

      expect(browserShortcut?.action).toBeDefined()
      expect(optionsShortcut?.action).toBeDefined()
      expect(timelineShortcut?.action).toBeDefined()
    })

    it("should not throw if shortcuts don't exist", () => {
      // Clear all shortcuts
      shortcutsRegistry.clear()

      expect(() => {
        renderHook(() => usePanelShortcuts())
      }).not.toThrow()
    })
  })

  describe("Browser Panel Toggle", () => {
    it("should call toggleBrowserVisibility when action is triggered", () => {
      renderHook(() => usePanelShortcuts())

      const shortcut = shortcutsRegistry.get("toggle-browser")
      const mockEvent = new KeyboardEvent("keydown")
      vi.spyOn(mockEvent, "preventDefault")

      shortcut?.action?.(mockEvent, {})

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockToggleBrowserVisibility).toHaveBeenCalled()
    })

    it("should update existing shortcut action", () => {
      // Pre-set an action
      const originalAction = vi.fn()
      shortcutsRegistry.register({
        id: "toggle-browser",
        name: "Toggle Browser",
        category: "view",
        keys: ["cmd+b"],
        action: originalAction,
      })

      renderHook(() => usePanelShortcuts())

      const shortcut = shortcutsRegistry.get("toggle-browser")

      // Action should be replaced
      expect(shortcut?.action).not.toBe(originalAction)

      // New action should work
      const mockEvent = new KeyboardEvent("keydown")
      shortcut?.action?.(mockEvent, {})

      expect(mockToggleBrowserVisibility).toHaveBeenCalled()
      expect(originalAction).not.toHaveBeenCalled()
    })
  })

  describe("Options Panel Toggle", () => {
    it("should call toggleOptionsVisibility when action is triggered", () => {
      renderHook(() => usePanelShortcuts())

      const shortcut = shortcutsRegistry.get("toggle-options")
      const mockEvent = new KeyboardEvent("keydown")
      vi.spyOn(mockEvent, "preventDefault")

      shortcut?.action?.(mockEvent, {})

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockToggleOptionsVisibility).toHaveBeenCalled()
    })
  })

  describe("Timeline Panel Toggle", () => {
    it("should call toggleTimelineVisibility when action is triggered", () => {
      renderHook(() => usePanelShortcuts())

      const shortcut = shortcutsRegistry.get("toggle-timeline")
      const mockEvent = new KeyboardEvent("keydown")
      vi.spyOn(mockEvent, "preventDefault")

      shortcut?.action?.(mockEvent, {})

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(mockToggleTimelineVisibility).toHaveBeenCalled()
    })
  })

  describe("UserSettings Integration", () => {
    // TODO: Тест пропущен - требуется проверка
    it.skip("should use current userSettings instance", () => {
      // Skip: vi.doMock doesn't work after module import
      const customToggleBrowser = vi.fn()
      const customToggleOptions = vi.fn()
      const customToggleTimeline = vi.fn()

      // Mock different user settings
      vi.doMock("@/features/user-settings", () => ({
        useUserSettings: () => ({
          toggleBrowserVisibility: customToggleBrowser,
          toggleOptionsVisibility: customToggleOptions,
          toggleTimelineVisibility: customToggleTimeline,
        }),
      }))

      renderHook(() => usePanelShortcuts())

      // Test each shortcut uses the custom functions
      const browserShortcut = shortcutsRegistry.get("toggle-browser")
      browserShortcut?.action?.(new KeyboardEvent("keydown"), {})
      expect(customToggleBrowser).toHaveBeenCalled()

      const optionsShortcut = shortcutsRegistry.get("toggle-options")
      optionsShortcut?.action?.(new KeyboardEvent("keydown"), {})
      expect(customToggleOptions).toHaveBeenCalled()

      const timelineShortcut = shortcutsRegistry.get("toggle-timeline")
      timelineShortcut?.action?.(new KeyboardEvent("keydown"), {})
      expect(customToggleTimeline).toHaveBeenCalled()
    })
  })

  describe("Effect Dependencies", () => {
    // TODO: Тест пропущен - требуется проверка
    it.skip("should re-run effect when userSettings changes", () => {
      // Skip: vi.doMock doesn't work after module import
      const { rerender } = renderHook(() => usePanelShortcuts())

      // Clear action calls
      mockToggleBrowserVisibility.mockClear()

      // Change mock implementation
      const newToggleBrowser = vi.fn()
      vi.doMock("@/features/user-settings", () => ({
        useUserSettings: () => ({
          toggleBrowserVisibility: newToggleBrowser,
          toggleOptionsVisibility: mockToggleOptionsVisibility,
          toggleTimelineVisibility: mockToggleTimelineVisibility,
        }),
      }))

      rerender()

      const shortcut = shortcutsRegistry.get("toggle-browser")
      shortcut?.action?.(new KeyboardEvent("keydown"), {})

      // Should use the new function
      expect(newToggleBrowser).toHaveBeenCalled()
    })
  })

  describe("Registry Updates", () => {
    it("should preserve other shortcut properties when updating action", () => {
      const originalShortcut = {
        id: "toggle-browser",
        name: "Toggle Browser Panel",
        category: "view",
        keys: ["cmd+b", "ctrl+b"],
        description: "Toggle browser panel visibility",
        enabled: false,
        options: { someOption: true },
      }

      shortcutsRegistry.register(originalShortcut)

      renderHook(() => usePanelShortcuts())

      const updatedShortcut = shortcutsRegistry.get("toggle-browser")

      // Should preserve all properties except action
      expect(updatedShortcut?.name).toBe(originalShortcut.name)
      expect(updatedShortcut?.category).toBe(originalShortcut.category)
      expect(updatedShortcut?.keys).toEqual(originalShortcut.keys)
      expect(updatedShortcut?.description).toBe(originalShortcut.description)
      expect(updatedShortcut?.enabled).toBe(originalShortcut.enabled)
      expect(updatedShortcut?.options).toEqual(originalShortcut.options)

      // Should have new action
      expect(updatedShortcut?.action).toBeDefined()
    })
  })

  describe("Multiple Renders", () => {
    it("should handle multiple renders without issues", () => {
      const { rerender } = renderHook(() => usePanelShortcuts())

      // Multiple rerenders
      rerender()
      rerender()
      rerender()

      // Should still work correctly
      const shortcut = shortcutsRegistry.get("toggle-browser")
      shortcut?.action?.(new KeyboardEvent("keydown"), {})

      // Should only call once per action trigger
      expect(mockToggleBrowserVisibility).toHaveBeenCalledTimes(1)
    })
  })
})
