/**
 * Tests for User Presets Service
 *
 * Тесты для сервиса управления пользовательскими пресетами эффектов
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  clearAllPresets,
  convertUserPresetToEffectPreset,
  deleteUserPreset,
  exportPresets,
  getAllUserPresets,
  getFavoritePresets,
  importPresets,
  loadPresetsForEffect,
  loadUserPreset,
  saveUserPreset,
  type UserPreset,
  updateUserPreset,
} from "../../services/effects/user-presets-service"

// Mock Tauri logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock Tauri commands
vi.mock("../../tauri/compiler-commands", () => ({
  loadFile: vi.fn(),
  saveFile: vi.fn(),
}))

// Import mocked functions after mocking
import { loadFile as mockLoadFile, saveFile as mockSaveFile } from "../../tauri/compiler-commands"

describe("User Presets Service", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe("saveUserPreset", () => {
    it("should save new preset to localStorage", async () => {
      const effectId = "blur-effect"
      const name = "Strong Blur"
      const params = { strength: 10, radius: 5 }

      const preset = await saveUserPreset(effectId, name, params)

      expect(preset.id).toBeDefined()
      expect(preset.effectId).toBe(effectId)
      expect(preset.name).toBe(name)
      expect(preset.params).toEqual(params)
      expect(preset.createdAt).toBeDefined()
      expect(preset.updatedAt).toBeDefined()
      expect(preset.favorite).toBe(false)

      // Verify saved to localStorage
      const stored = localStorage.getItem("timeline-studio:effect-presets")
      expect(stored).toBeDefined()

      const collection = JSON.parse(stored!)
      expect(collection.presets).toHaveLength(1)
      expect(collection.presets[0].id).toBe(preset.id)
    })

    it("should save preset with optional fields", async () => {
      const preset = await saveUserPreset(
        "effect-1",
        "Preset 1",
        {},
        {
          description: "Test description",
          tags: ["tag1", "tag2"],
          favorite: true,
        },
      )

      expect(preset.description).toBe("Test description")
      expect(preset.tags).toEqual(["tag1", "tag2"])
      expect(preset.favorite).toBe(true)

      const stored = localStorage.getItem("timeline-studio:effect-presets")
      const collection = JSON.parse(stored!)
      expect(collection.favorites).toContain(preset.id)
    })

    it("should append to existing presets", async () => {
      await saveUserPreset("effect-1", "Preset 1", { value: 1 })
      await saveUserPreset("effect-2", "Preset 2", { value: 2 })

      const presets = await getAllUserPresets()
      expect(presets).toHaveLength(2)
    })
  })

  describe("loadUserPreset", () => {
    it("should load preset by ID", async () => {
      const saved = await saveUserPreset("effect-1", "Preset 1", { value: 1 })
      const loaded = await loadUserPreset(saved.id)

      expect(loaded).toBeDefined()
      expect(loaded?.id).toBe(saved.id)
      expect(loaded?.name).toBe(saved.name)
    })

    it("should return null for non-existent preset", async () => {
      const loaded = await loadUserPreset("non-existent-id")
      expect(loaded).toBeNull()
    })
  })

  describe("loadPresetsForEffect", () => {
    it("should load all presets for specific effect", async () => {
      await saveUserPreset("blur", "Blur 1", { strength: 5 })
      await saveUserPreset("blur", "Blur 2", { strength: 10 })
      await saveUserPreset("sharpen", "Sharpen 1", { amount: 3 })

      const blurPresets = await loadPresetsForEffect("blur")
      expect(blurPresets).toHaveLength(2)
      expect(blurPresets.every((p) => p.effectId === "blur")).toBe(true)
    })

    it("should return empty array when no presets found", async () => {
      const presets = await loadPresetsForEffect("non-existent-effect")
      expect(presets).toEqual([])
    })
  })

  describe("updateUserPreset", () => {
    it("should update preset name", async () => {
      const preset = await saveUserPreset("effect-1", "Original Name", {})
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 2))
      const updated = await updateUserPreset(preset.id, {
        name: "Updated Name",
      })

      expect(updated.name).toBe("Updated Name")
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(preset.updatedAt).getTime())
    })

    it("should update preset params", async () => {
      const preset = await saveUserPreset("effect-1", "Preset", { value: 1 })
      const updated = await updateUserPreset(preset.id, {
        params: { value: 2, newParam: "test" },
      })

      expect(updated.params).toEqual({ value: 2, newParam: "test" })
    })

    it("should update favorite status", async () => {
      const preset = await saveUserPreset("effect-1", "Preset", {})
      expect(preset.favorite).toBe(false)

      const updated = await updateUserPreset(preset.id, { favorite: true })
      expect(updated.favorite).toBe(true)

      const collection = JSON.parse(localStorage.getItem("timeline-studio:effect-presets")!)
      expect(collection.favorites).toContain(preset.id)
    })

    it("should remove from favorites when set to false", async () => {
      const preset = await saveUserPreset("effect-1", "Preset", {}, { favorite: true })
      const updated = await updateUserPreset(preset.id, { favorite: false })

      expect(updated.favorite).toBe(false)

      const collection = JSON.parse(localStorage.getItem("timeline-studio:effect-presets")!)
      expect(collection.favorites).not.toContain(preset.id)
    })

    it("should throw error for non-existent preset", async () => {
      await expect(updateUserPreset("non-existent-id", { name: "New Name" })).rejects.toThrow()
    })
  })

  describe("deleteUserPreset", () => {
    it("should delete preset from collection", async () => {
      const preset = await saveUserPreset("effect-1", "Preset", {})
      await deleteUserPreset(preset.id)

      const loaded = await loadUserPreset(preset.id)
      expect(loaded).toBeNull()
    })

    it("should remove from favorites when deleted", async () => {
      const preset = await saveUserPreset("effect-1", "Preset", {}, { favorite: true })
      await deleteUserPreset(preset.id)

      const favorites = await getFavoritePresets()
      expect(favorites).toHaveLength(0)
    })

    it("should not affect other presets", async () => {
      const preset1 = await saveUserPreset("effect-1", "Preset 1", {})
      const preset2 = await saveUserPreset("effect-2", "Preset 2", {})

      await deleteUserPreset(preset1.id)

      const allPresets = await getAllUserPresets()
      expect(allPresets).toHaveLength(1)
      expect(allPresets[0].id).toBe(preset2.id)
    })
  })

  describe("getAllUserPresets", () => {
    it("should return all presets", async () => {
      await saveUserPreset("effect-1", "Preset 1", {})
      await saveUserPreset("effect-2", "Preset 2", {})
      await saveUserPreset("effect-3", "Preset 3", {})

      const presets = await getAllUserPresets()
      expect(presets).toHaveLength(3)
    })

    it("should return empty array when no presets", async () => {
      const presets = await getAllUserPresets()
      expect(presets).toEqual([])
    })
  })

  describe("getFavoritePresets", () => {
    it("should return only favorite presets", async () => {
      await saveUserPreset("effect-1", "Preset 1", {}, { favorite: true })
      await saveUserPreset("effect-2", "Preset 2", {}, { favorite: false })
      await saveUserPreset("effect-3", "Preset 3", {}, { favorite: true })

      const favorites = await getFavoritePresets()
      expect(favorites).toHaveLength(2)
      expect(favorites.every((p) => p.favorite)).toBe(true)
    })

    it("should return empty array when no favorites", async () => {
      await saveUserPreset("effect-1", "Preset 1", {})

      const favorites = await getFavoritePresets()
      expect(favorites).toEqual([])
    })
  })

  describe("importPresets", () => {
    it("should import presets from file", async () => {
      const importData = {
        version: "1.0",
        presets: [
          {
            id: "imported-1",
            effectId: "blur",
            name: "Imported Preset",
            params: { strength: 5 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        favorites: ["imported-1"],
      }

      mockLoadFile.mockResolvedValue(JSON.stringify(importData))

      const count = await importPresets("/path/to/presets.json")

      expect(count).toBe(1)
      expect(mockLoadFile).toHaveBeenCalledWith("/path/to/presets.json")

      const allPresets = await getAllUserPresets()
      expect(allPresets).toHaveLength(1)
      expect(allPresets[0].id).toBe("imported-1")
    })

    it("should avoid importing duplicates", async () => {
      const preset = await saveUserPreset("effect-1", "Existing", {})

      const importData = {
        version: "1.0",
        presets: [
          preset, // Duplicate
          {
            id: "new-1",
            effectId: "effect-2",
            name: "New Preset",
            params: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        favorites: [],
      }

      mockLoadFile.mockResolvedValue(JSON.stringify(importData))

      const count = await importPresets("/path/to/presets.json")

      expect(count).toBe(1) // Only new preset imported
      const allPresets = await getAllUserPresets()
      expect(allPresets).toHaveLength(2)
    })

    it("should merge favorites", async () => {
      await saveUserPreset("effect-1", "Preset 1", {}, { favorite: true })

      const importData = {
        version: "1.0",
        presets: [
          {
            id: "imported-1",
            effectId: "effect-2",
            name: "Imported",
            params: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            favorite: true,
          },
        ],
        favorites: ["imported-1"],
      }

      mockLoadFile.mockResolvedValue(JSON.stringify(importData))

      await importPresets("/path/to/presets.json")

      const favorites = await getFavoritePresets()
      expect(favorites).toHaveLength(2)
    })
  })

  describe("exportPresets", () => {
    it("should export selected presets to file", async () => {
      const preset1 = await saveUserPreset("effect-1", "Preset 1", {})
      const preset2 = await saveUserPreset("effect-2", "Preset 2", {}, { favorite: true })
      const preset3 = await saveUserPreset("effect-3", "Preset 3", {})

      await exportPresets([preset1.id, preset2.id], "/path/to/export.json")

      expect(mockSaveFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/path/to/export.json",
          content: expect.any(String),
        }),
      )

      const savedContent = JSON.parse(mockSaveFile.mock.calls[0][0].content)
      expect(savedContent.presets).toHaveLength(2)
      expect(savedContent.favorites).toContain(preset2.id)
      expect(savedContent.favorites).not.toContain(preset3.id)
    })

    it("should export empty collection when no IDs match", async () => {
      await saveUserPreset("effect-1", "Preset 1", {})

      await exportPresets(["non-existent-id"], "/path/to/export.json")

      const savedContent = JSON.parse(mockSaveFile.mock.calls[0][0].content)
      expect(savedContent.presets).toHaveLength(0)
    })
  })

  describe("clearAllPresets", () => {
    it("should remove all presets", async () => {
      await saveUserPreset("effect-1", "Preset 1", {})
      await saveUserPreset("effect-2", "Preset 2", {})

      await clearAllPresets()

      const presets = await getAllUserPresets()
      expect(presets).toEqual([])
    })

    it("should remove all favorites", async () => {
      await saveUserPreset("effect-1", "Preset 1", {}, { favorite: true })

      await clearAllPresets()

      const favorites = await getFavoritePresets()
      expect(favorites).toEqual([])
    })
  })

  describe("convertUserPresetToEffectPreset", () => {
    it("should convert string name to multilingual object", () => {
      const userPreset: UserPreset = {
        id: "preset-1",
        effectId: "blur",
        name: "Strong Blur",
        params: { strength: 10 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const effectPreset = convertUserPresetToEffectPreset(userPreset)

      expect(effectPreset.name).toEqual({
        en: "Strong Blur",
        ru: "Strong Blur",
      })
    })

    it("should convert string description to multilingual object", () => {
      const userPreset: UserPreset = {
        id: "preset-1",
        effectId: "blur",
        name: "Blur",
        description: "Test description",
        params: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const effectPreset = convertUserPresetToEffectPreset(userPreset)

      expect(effectPreset.description).toEqual({
        en: "Test description",
        ru: "Test description",
      })
    })

    it("should handle undefined description", () => {
      const userPreset: UserPreset = {
        id: "preset-1",
        effectId: "blur",
        name: "Blur",
        params: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const effectPreset = convertUserPresetToEffectPreset(userPreset)

      expect(effectPreset.description).toBeUndefined()
    })

    it("should convert tags and parameters", () => {
      const userPreset: UserPreset = {
        id: "preset-1",
        effectId: "blur",
        name: "Blur",
        params: { strength: 5, radius: 10 },
        tags: ["popular", "video"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const effectPreset = convertUserPresetToEffectPreset(userPreset)

      expect(effectPreset.parameters).toEqual({ strength: 5, radius: 10 })
      expect(effectPreset.tags).toEqual(["popular", "video"])
    })

    it("should handle missing tags", () => {
      const userPreset: UserPreset = {
        id: "preset-1",
        effectId: "blur",
        name: "Blur",
        params: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const effectPreset = convertUserPresetToEffectPreset(userPreset)

      expect(effectPreset.tags).toEqual([])
    })
  })

  describe("Edge Cases", () => {
    it("should handle corrupted localStorage data", async () => {
      localStorage.setItem("timeline-studio:effect-presets", "invalid json")

      const presets = await getAllUserPresets()
      expect(presets).toEqual([])
    })

    it("should handle missing localStorage", async () => {
      const originalGetItem = localStorage.getItem
      localStorage.getItem = vi.fn(() => null)

      const presets = await getAllUserPresets()
      expect(presets).toEqual([])

      localStorage.getItem = originalGetItem
    })

    it("should generate unique IDs for sequential saves", async () => {
      // Note: Due to timestamp-based ID generation (Date.now()),
      // concurrent saves might get same ID. Test sequential saves instead.
      const preset1 = await saveUserPreset("effect-1", "Preset 1", {})
      await new Promise((resolve) => setTimeout(resolve, 2)) // Small delay
      const preset2 = await saveUserPreset("effect-1", "Preset 2", {})
      await new Promise((resolve) => setTimeout(resolve, 2)) // Small delay
      const preset3 = await saveUserPreset("effect-1", "Preset 3", {})

      const ids = [preset1.id, preset2.id, preset3.id]
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it("should handle very long preset names", async () => {
      const longName = "a".repeat(1000)
      const preset = await saveUserPreset("effect-1", longName, {})

      expect(preset.name).toBe(longName)
      expect(preset.name.length).toBe(1000)
    })

    it("should handle Unicode characters in names", async () => {
      const unicodeName = "测试 🎬 тест"
      const preset = await saveUserPreset("effect-1", unicodeName, {})

      expect(preset.name).toBe(unicodeName)
    })

    it("should handle complex nested parameters", async () => {
      const complexParams = {
        level1: {
          level2: {
            level3: {
              value: 123,
              array: [1, 2, 3],
            },
          },
        },
      }

      const preset = await saveUserPreset("effect-1", "Complex", complexParams)
      expect(preset.params).toEqual(complexParams)

      const loaded = await loadUserPreset(preset.id)
      expect(loaded?.params).toEqual(complexParams)
    })
  })
})
