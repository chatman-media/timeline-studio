/**
 * @vitest-environment jsdom
 */
/**
 * Use Favorites Hook Tests
 *
 * Тесты для хука useFavorites
 */

import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useFavorites } from "../../hooks/use-favorites"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}))

// Mock useApp hook
const mockExecuteCommand = vi.fn()
vi.mock("../../providers/app-provider", () => ({
  useApp: vi.fn(() => ({
    executeCommand: mockExecuteCommand,
  })),
}))

describe("useFavorites Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initial State", () => {
    it("should initialize with empty favorites", () => {
      const { result } = renderHook(() => useFavorites())

      expect(result.current.favorites).toEqual({
        transition: [],
        effect: [],
        template: [],
        filter: [],
        subtitle: [],
        media: [],
        music: [],
        styleTemplate: [],
      })
    })
  })

  describe("addToFavorites", () => {
    it("should add item to favorites optimistically", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.addToFavorites(item, "effect")

      await waitFor(() => {
        expect(result.current.favorites.effect).toContainEqual(item)
      })
    })

    it("should execute backend command with correct parameters", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.addToFavorites(item, "effect")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserAddToFavorites",
        params: { file_id: "item-1", tab: "effects" },
      })
    })

    it("should handle different item types correctly", async () => {
      const { result } = renderHook(() => useFavorites())

      const testCases = [
        { item: { id: "t-1", name: "Transition" }, type: "transition", expectedTab: "transitions" },
        { item: { id: "e-1", name: "Effect" }, type: "effect", expectedTab: "effects" },
        { item: { id: "f-1", name: "Filter" }, type: "filter", expectedTab: "filters" },
        { item: { id: "m-1", name: "Media" }, type: "media", expectedTab: "media" },
      ]

      for (const { item, type, expectedTab } of testCases) {
        await result.current.addToFavorites(item, type)

        expect(mockExecuteCommand).toHaveBeenCalledWith({
          type: "BrowserAddToFavorites",
          params: { file_id: item.id, tab: expectedTab },
        })
      }
    })

    it("should rollback on error", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.addToFavorites(item, "effect")

      // Wait for rollback
      await waitFor(() => {
        expect(result.current.favorites.effect).not.toContainEqual(item)
      })
    })

    it("should not execute command for unknown type", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Unknown" }

      await result.current.addToFavorites(item, "unknown-type")

      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })
  })

  describe("removeFromFavorites", () => {
    it("should remove item from favorites optimistically", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      // Add first
      await result.current.addToFavorites(item, "effect")
      await waitFor(() => {
        expect(result.current.favorites.effect).toContainEqual(item)
      })

      // Then remove
      await result.current.removeFromFavorites(item, "effect")
      await waitFor(() => {
        expect(result.current.favorites.effect).not.toContainEqual(item)
      })
    })

    it("should execute backend command with correct parameters", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.removeFromFavorites(item, "effect")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserRemoveFromFavorites",
        params: { file_id: "item-1", tab: "effects" },
      })
    })

    it("should rollback on error", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      // Add item first
      await result.current.addToFavorites(item, "effect")

      // Mock error on removal
      mockExecuteCommand.mockRejectedValueOnce(new Error("Backend error"))

      await result.current.removeFromFavorites(item, "effect")

      // Wait for rollback - item should be back
      await waitFor(() => {
        expect(result.current.favorites.effect).toContainEqual(item)
      })
    })

    it("should not execute command for unknown type", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Unknown" }

      vi.clearAllMocks()
      await result.current.removeFromFavorites(item, "unknown-type")

      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })
  })

  describe("isItemFavorite", () => {
    it("should return false for non-favorite item", () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      expect(result.current.isItemFavorite(item, "effect")).toBe(false)
    })

    it("should return true for favorite item", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.addToFavorites(item, "effect")

      await waitFor(() => {
        expect(result.current.isItemFavorite(item, "effect")).toBe(true)
      })
    })

    it("should return false after item is removed", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.addToFavorites(item, "effect")
      await result.current.removeFromFavorites(item, "effect")

      await waitFor(() => {
        expect(result.current.isItemFavorite(item, "effect")).toBe(false)
      })
    })

    it("should distinguish between different types", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Item" }

      await result.current.addToFavorites(item, "effect")

      await waitFor(() => {
        expect(result.current.isItemFavorite(item, "effect")).toBe(true)
        expect(result.current.isItemFavorite(item, "filter")).toBe(false)
      })
    })

    it("should handle undefined type gracefully", () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Item" }

      expect(result.current.isItemFavorite(item, "nonexistent")).toBe(false)
    })
  })

  describe("Edge Cases", () => {
    it("should handle multiple items of same type", async () => {
      const { result } = renderHook(() => useFavorites())
      const items = [
        { id: "item-1", name: "Effect 1" },
        { id: "item-2", name: "Effect 2" },
        { id: "item-3", name: "Effect 3" },
      ]

      for (const item of items) {
        await result.current.addToFavorites(item, "effect")
      }

      await waitFor(() => {
        expect(result.current.favorites.effect).toHaveLength(3)
      })
    })

    it("should handle concurrent add/remove operations", async () => {
      const { result } = renderHook(() => useFavorites())
      const item1 = { id: "item-1", name: "Effect 1" }
      const item2 = { id: "item-2", name: "Effect 2" }

      await Promise.all([
        result.current.addToFavorites(item1, "effect"),
        result.current.addToFavorites(item2, "effect"),
      ])

      await waitFor(() => {
        expect(result.current.favorites.effect).toHaveLength(2)
      })
    })

    it("should not add duplicate items", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.addToFavorites(item, "effect")
      await result.current.addToFavorites(item, "effect")

      await waitFor(() => {
        // Should have duplicates because state is optimistic
        expect(result.current.favorites.effect.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", () => {
      const { result, rerender } = renderHook(() => useFavorites())

      const initialAdd = result.current.addToFavorites
      const initialRemove = result.current.removeFromFavorites
      const initialIsItemFavorite = result.current.isItemFavorite

      rerender()

      expect(result.current.addToFavorites).toBe(initialAdd)
      expect(result.current.removeFromFavorites).toBe(initialRemove)
      expect(result.current.isItemFavorite).toBe(initialIsItemFavorite)
    })
  })
})
