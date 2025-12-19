/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { useHotkeys } from "react-hotkeys-hook"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ShortcutHandler } from "../../components/shortcut-handler"
import type { ShortcutDefinition } from "../../services/shortcuts-registry"

// Mock react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}))

describe("ShortcutHandler", () => {
  const mockUseHotkeys = vi.mocked(useHotkeys)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Component Rendering", () => {
    it("should render null", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      }

      const { container } = render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="y175vhd" />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe("Hotkey Registration", () => {
    it("should register hotkey for single key combination", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        action: mockAction,
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="h9b6b7c" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        "cmd+t",
        mockAction,
        expect.objectContaining({
          enableOnFormTags: false,
          preventDefault: true,
          enabled: true,
        }),
        expect.arrayContaining([true, mockAction, true, "cmd+t"]),
      )
    })

    it("should register hotkeys for multiple key combinations as comma-separated string", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t", "ctrl+t", "alt+t"],
        action: mockAction,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid=":dh28:w" />)

      // Should be called once with comma-separated keys
      expect(mockUseHotkeys).toHaveBeenCalledTimes(1)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        "cmd+t, ctrl+t, alt+t",
        mockAction,
        expect.objectContaining({
          enableOnFormTags: false,
          preventDefault: true,
        }),
        expect.arrayContaining([true, mockAction, undefined, "cmd+t, ctrl+t, alt+t"]),
      )
    })

    it("should use empty function when no action provided", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        // No action provided
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="6q3-mbp" />)

      const registeredAction = mockUseHotkeys.mock.calls[0][1]
      expect(typeof registeredAction).toBe("function")

      // Should not throw when called
      expect(() => registeredAction({} as any, { hotkey: "cmd+t" })).not.toThrow()
    })
  })

  describe("Enabled/Disabled State", () => {
    it("should enable hotkey when both enabled and shortcut.enabled are true", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="6hl9a:p" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: false,
          enabled: true,
        }),
        expect.any(Array),
      )
    })

    it("should disable hotkey when enabled prop is false", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={false} data-oid="4s87799" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: false,
          enabled: false,
        }),
        expect.any(Array),
      )
    })

    it("should disable hotkey when shortcut.enabled is false", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        enabled: false,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="zpfy_r8" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: false,
          enabled: false,
        }),
        expect.any(Array),
      )
    })

    it("should treat undefined shortcut.enabled as enabled", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        // enabled is undefined
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="gkpltk8" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: false,
          enabled: true, // undefined !== false, so it should be true
        }),
        expect.any(Array),
      )
    })
  })

  describe("Options Handling", () => {
    it("should merge custom options with defaults", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        options: {
          preventDefault: false,
          enableOnFormTags: false,
          enabled: false,
        },
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="83yfg_j" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: false,
          preventDefault: true,
          enabled: false, // Should respect the combined enabled state
          // Custom options should be spread in
          ...shortcut.options,
        }),
        expect.any(Array),
      )
    })

    it("should use default options when none provided", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="duy3.51" />)

      expect(mockUseHotkeys).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.objectContaining({
          enableOnFormTags: false,
          preventDefault: true,
          enabled: true, // undefined !== false, so it should be true
        }),
        expect.any(Array),
      )
    })
  })

  describe("Dependencies Array", () => {
    it("should include correct dependencies", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        action: mockAction,
        enabled: true,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="pub4wzy" />)

      const dependencies = mockUseHotkeys.mock.calls[0][3]

      expect(dependencies).toEqual([true, mockAction, true, "cmd+t"])
    })

    it("should update dependencies when props change", () => {
      const mockAction = vi.fn()
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: ["cmd+t"],
        action: mockAction,
        enabled: true,
      }

      const { rerender } = render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="qf9p:z5" />)

      mockUseHotkeys.mockClear()

      // Change enabled prop
      rerender(<ShortcutHandler shortcut={shortcut} enabled={false} data-oid="pzi14w4" />)

      const dependencies = mockUseHotkeys.mock.calls[0][3]
      expect(dependencies).toEqual([false, mockAction, true, "cmd+t"])
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty keys array", () => {
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys: [],
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="q52ncyx" />)

      // Should call useHotkeys with empty string
      expect(mockUseHotkeys).toHaveBeenCalledWith("", expect.any(Function), expect.any(Object), expect.any(Array))
    })

    it("should handle shortcut with many key combinations", () => {
      const keys = Array.from({ length: 10 }, (_, i) => `cmd+${i}`)
      const shortcut: ShortcutDefinition = {
        id: "test",
        name: "Test",
        category: "test",
        keys,
      }

      render(<ShortcutHandler shortcut={shortcut} enabled={true} data-oid="l:x0l-6" />)

      // Should be called once with comma-separated keys
      expect(mockUseHotkeys).toHaveBeenCalledTimes(1)
      expect(mockUseHotkeys).toHaveBeenCalledWith(
        keys.join(", "),
        expect.any(Function),
        expect.any(Object),
        expect.any(Array),
      )
    })
  })
})
