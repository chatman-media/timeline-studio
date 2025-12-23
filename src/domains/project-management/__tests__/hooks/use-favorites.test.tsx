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

// Mock useBrowser hook with stable browserState
const mockBrowserState = {
  favorites: {
    transitions: [],
    effects: [],
    templates: [],
    filters: [],
    subtitles: [],
    media: [],
    music: [],
    style_templates: [],
  },
}

vi.mock("@/domains/browser", () => ({
  useBrowser: vi.fn(() => ({
    browserState: mockBrowserState,
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
        {
          item: { id: "t-1", name: "Transition" },
          type: "transition",
          expectedTab: "transitions",
        },
        {
          item: { id: "e-1", name: "Effect" },
          type: "effect",
          expectedTab: "effects",
        },
        {
          item: { id: "f-1", name: "Filter" },
          type: "filter",
          expectedTab: "filters",
        },
        {
          item: { id: "m-1", name: "Media" },
          type: "media",
          expectedTab: "media",
        },
      ]

      for (const { item, type, expectedTab } of testCases) {
        await result.current.addToFavorites(item, type)

        expect(mockExecuteCommand).toHaveBeenCalledWith({
          type: "BrowserAddToFavorites",
          params: { file_id: item.id, tab: expectedTab },
        })
      }
    })

    it("should handle backend errors gracefully", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      // Should not throw - error is caught and logged
      await expect(result.current.addToFavorites(item, "effect")).resolves.not.toThrow()
    })

    it("should not execute command for unknown type", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Unknown" }

      await result.current.addToFavorites(item, "unknown-type")

      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })
  })

  describe("removeFromFavorites", () => {
    it("should execute backend command with correct parameters", async () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      await result.current.removeFromFavorites(item, "effect")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "BrowserRemoveFromFavorites",
        params: { file_id: "item-1", tab: "effects" },
      })
    })

    it("should handle backend errors gracefully", async () => {
      mockExecuteCommand.mockRejectedValueOnce(new Error("Backend error"))

      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      // Should not throw - error is caught and logged
      await expect(result.current.removeFromFavorites(item, "effect")).resolves.not.toThrow()
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
    it("should return false for non-favorite item (empty favorites)", () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Effect 1" }

      expect(result.current.isItemFavorite(item, "effect")).toBe(false)
    })

    it("should handle undefined type gracefully", () => {
      const { result } = renderHook(() => useFavorites())
      const item = { id: "item-1", name: "Item" }

      expect(result.current.isItemFavorite(item, "nonexistent")).toBe(false)
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
