// @ts-nocheck - TODO: Update to use new unified effects types
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserPreset } from "@/domains/video-editing/services/effects/user-presets-service"
import { useUserPresets } from "../../hooks/use-user-presets"

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock user presets service
const mockSaveUserPreset = vi.fn()
const mockLoadUserPreset = vi.fn()
const mockUpdateUserPreset = vi.fn()
const mockDeleteUserPreset = vi.fn()
const mockGetAllUserPresets = vi.fn()
const mockLoadPresetsForEffect = vi.fn()

vi.mock("@/domains/video-editing/services/effects/user-presets-service", () => ({
  saveUserPreset: (...args: any[]) => mockSaveUserPreset(...args),
  loadUserPreset: (...args: any[]) => mockLoadUserPreset(...args),
  updateUserPreset: (...args: any[]) => mockUpdateUserPreset(...args),
  deleteUserPreset: (...args: any[]) => mockDeleteUserPreset(...args),
  getAllUserPresets: () => mockGetAllUserPresets(),
  loadPresetsForEffect: (...args: any[]) => mockLoadPresetsForEffect(...args),
}))

describe("useUserPresets", () => {
  const mockPreset1: UserPreset = {
    id: "preset-1",
    effectId: "effect-1",
    name: "My Preset 1",
    description: "Test preset",
    params: { intensity: 50 },
    tags: ["custom"],
    favorite: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockPreset2: UserPreset = {
    id: "preset-2",
    effectId: "effect-2",
    name: "My Preset 2",
    description: "Another preset",
    params: { brightness: 75 },
    tags: ["favorite"],
    favorite: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAllUserPresets.mockResolvedValue([mockPreset1, mockPreset2])
    mockLoadPresetsForEffect.mockResolvedValue([mockPreset1])
  })

  describe("Initialization", () => {
    it("should initialize with empty presets and no loading", () => {
      mockGetAllUserPresets.mockResolvedValue([])

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      expect(result.current.presets).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it("should auto-load all presets by default", async () => {
      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockGetAllUserPresets).toHaveBeenCalledTimes(1)
      expect(result.current.presets).toHaveLength(2)
    })

    it("should load presets for specific effect when effectId provided", async () => {
      const { result } = renderHook(() => useUserPresets({ effectId: "effect-1" }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockLoadPresetsForEffect).toHaveBeenCalledWith("effect-1")
      expect(result.current.presets).toHaveLength(1)
      expect(result.current.presets[0].id).toBe("preset-1")
    })

    it("should not auto-load when autoLoad is false", async () => {
      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockGetAllUserPresets).not.toHaveBeenCalled()
      expect(result.current.presets).toEqual([])
    })
  })

  describe("savePreset", () => {
    it("should save new preset", async () => {
      const newPreset: UserPreset = {
        id: "preset-3",
        effectId: "effect-1",
        name: "New Preset",
        params: { saturation: 80 },
        tags: [],
        favorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSaveUserPreset.mockResolvedValue(newPreset)

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      let savedPreset: UserPreset | undefined

      await act(async () => {
        savedPreset = await result.current.savePreset("effect-1", "New Preset", { saturation: 80 })
      })

      expect(mockSaveUserPreset).toHaveBeenCalledWith("effect-1", "New Preset", { saturation: 80 }, undefined)
      expect(savedPreset).toEqual(newPreset)
      expect(result.current.presets).toHaveLength(1)
      expect(result.current.presets[0]).toEqual(newPreset)
    })

    it("should save preset with options", async () => {
      const newPreset: UserPreset = {
        id: "preset-3",
        effectId: "effect-1",
        name: "New Preset",
        description: "With options",
        params: { saturation: 80 },
        tags: ["test"],
        favorite: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSaveUserPreset.mockResolvedValue(newPreset)

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      await act(async () => {
        await result.current.savePreset(
          "effect-1",
          "New Preset",
          { saturation: 80 },
          {
            description: "With options",
            tags: ["test"],
            favorite: true,
          },
        )
      })

      expect(mockSaveUserPreset).toHaveBeenCalledWith(
        "effect-1",
        "New Preset",
        { saturation: 80 },
        {
          description: "With options",
          tags: ["test"],
          favorite: true,
        },
      )
    })

    it("should handle save error", async () => {
      mockSaveUserPreset.mockRejectedValue(new Error("Save failed"))

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      let error: any
      try {
        await act(async () => {
          await result.current.savePreset("effect-1", "New Preset", { saturation: 80 })
        })
      } catch (e) {
        error = e
      }

      expect(error).toBeDefined()
      expect(error.message).toContain("Save failed")
    })
  })

  describe("loadPreset", () => {
    it("should load specific preset", async () => {
      mockLoadUserPreset.mockResolvedValue(mockPreset1)

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      let loadedPreset: UserPreset | null = null

      await act(async () => {
        loadedPreset = await result.current.loadPreset("preset-1")
      })

      expect(mockLoadUserPreset).toHaveBeenCalledWith("preset-1")
      expect(loadedPreset).toEqual(mockPreset1)
    })

    it("should handle load error", async () => {
      mockLoadUserPreset.mockRejectedValue(new Error("Load failed"))

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      let error: any
      try {
        await act(async () => {
          await result.current.loadPreset("preset-1")
        })
      } catch (e) {
        error = e
      }

      expect(error).toBeDefined()
      expect(error.message).toContain("Load failed")
    })
  })

  describe("updatePreset", () => {
    it("should update preset name", async () => {
      const updatedPreset = { ...mockPreset1, name: "Updated Name" }
      mockUpdateUserPreset.mockResolvedValue(updatedPreset)

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      // Add initial preset
      act(() => {
        result.current.presets.push(mockPreset1)
      })

      await act(async () => {
        await result.current.updatePreset("preset-1", { name: "Updated Name" })
      })

      expect(mockUpdateUserPreset).toHaveBeenCalledWith("preset-1", { name: "Updated Name" })
      expect(result.current.presets[0].name).toBe("Updated Name")
    })

    it("should update multiple fields", async () => {
      const updatedPreset = {
        ...mockPreset1,
        name: "New Name",
        description: "New Description",
        favorite: true,
      }
      mockUpdateUserPreset.mockResolvedValue(updatedPreset)

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      await act(async () => {
        // Manually set presets
        result.current.presets.push(mockPreset1)
      })

      await act(async () => {
        await result.current.updatePreset("preset-1", {
          name: "New Name",
          description: "New Description",
          favorite: true,
        })
      })

      const updated = result.current.presets.find((p) => p.id === "preset-1")
      expect(updated?.name).toBe("New Name")
      expect(updated?.description).toBe("New Description")
      expect(updated?.favorite).toBe(true)
    })

    it("should handle update error", async () => {
      mockUpdateUserPreset.mockRejectedValue(new Error("Update failed"))

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      let error: any
      try {
        await act(async () => {
          await result.current.updatePreset("preset-1", { name: "New Name" })
        })
      } catch (e) {
        error = e
      }

      expect(error).toBeDefined()
      expect(error.message).toContain("Update failed")
    })
  })

  describe("deletePreset", () => {
    it("should delete preset", async () => {
      mockDeleteUserPreset.mockResolvedValue(undefined)

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      await act(async () => {
        // Add presets manually
        result.current.presets.push(mockPreset1, mockPreset2)
      })

      expect(result.current.presets).toHaveLength(2)

      await act(async () => {
        await result.current.deletePreset("preset-1")
      })

      expect(mockDeleteUserPreset).toHaveBeenCalledWith("preset-1")
      expect(result.current.presets).toHaveLength(1)
      expect(result.current.presets[0].id).toBe("preset-2")
    })

    it("should handle delete error", async () => {
      mockDeleteUserPreset.mockRejectedValue(new Error("Delete failed"))

      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      let error: any
      try {
        await act(async () => {
          await result.current.deletePreset("preset-1")
        })
      } catch (e) {
        error = e
      }

      expect(error).toBeDefined()
      expect(error.message).toContain("Delete failed")
    })
  })

  describe("getPresetsForEffect", () => {
    it("should filter presets by effect id", async () => {
      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const filtered = result.current.getPresetsForEffect("effect-1")

      expect(filtered).toHaveLength(1)
      expect(filtered[0].id).toBe("preset-1")
    })

    it("should return empty array when no presets match", async () => {
      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const filtered = result.current.getPresetsForEffect("non-existent")

      expect(filtered).toHaveLength(0)
    })
  })

  describe("getFavorites", () => {
    it("should filter favorite presets", async () => {
      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const favorites = result.current.getFavorites()

      expect(favorites).toHaveLength(1)
      expect(favorites[0].id).toBe("preset-2")
      expect(favorites[0].favorite).toBe(true)
    })

    it("should return empty array when no favorites", async () => {
      mockGetAllUserPresets.mockResolvedValue([
        { ...mockPreset1, favorite: false },
        { ...mockPreset2, favorite: false },
      ])

      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const favorites = result.current.getFavorites()

      expect(favorites).toHaveLength(0)
    })
  })

  describe("reload", () => {
    it("should reload presets", async () => {
      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      expect(mockGetAllUserPresets).not.toHaveBeenCalled()

      await act(async () => {
        await result.current.reload()
      })

      expect(mockGetAllUserPresets).toHaveBeenCalledTimes(1)
      expect(result.current.presets).toHaveLength(2)
    })

    it("should reload presets for specific effect", async () => {
      const { result } = renderHook(() => useUserPresets({ effectId: "effect-1", autoLoad: false }))

      await act(async () => {
        await result.current.reload()
      })

      expect(mockLoadPresetsForEffect).toHaveBeenCalledWith("effect-1")
    })
  })

  describe("clearError", () => {
    it("should clear error message", async () => {
      mockGetAllUserPresets.mockRejectedValue(new Error("Load error"))

      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe("Loading State", () => {
    it("should set loading state during preset load", async () => {
      let resolveLoad: (value: UserPreset[]) => void
      const loadPromise = new Promise<UserPreset[]>((resolve) => {
        resolveLoad = resolve
      })

      mockGetAllUserPresets.mockReturnValue(loadPromise)

      const { result } = renderHook(() => useUserPresets())

      // Should be loading initially
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
      })

      // Resolve the promise
      await act(async () => {
        resolveLoad!([mockPreset1, mockPreset2])
        await loadPromise
      })

      // Should not be loading after completion
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle error during initial load", async () => {
      mockGetAllUserPresets.mockRejectedValue(new Error("Network error"))

      const { result } = renderHook(() => useUserPresets())

      await waitFor(() => {
        expect(result.current.error).toContain("Failed to load presets")
        expect(result.current.error).toContain("Network error")
      })
    })

    it("should clear error on successful operation after error", async () => {
      const { result } = renderHook(() => useUserPresets({ autoLoad: false }))

      // First save fails
      mockSaveUserPreset.mockRejectedValueOnce(new Error("Save error"))

      try {
        await act(async () => {
          await result.current.savePreset("effect-1", "Test", {})
        })
      } catch {
        // Expected to fail
      }

      // Second save succeeds
      const newPreset: UserPreset = {
        id: "preset-3",
        effectId: "effect-1",
        name: "Test",
        params: {},
        tags: [],
        favorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockSaveUserPreset.mockResolvedValue(newPreset)

      await act(async () => {
        await result.current.savePreset("effect-1", "Test", {})
      })

      // Error should be cleared after successful operation
      expect(result.current.error).toBeNull()
    })
  })
})
