import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { BaseEffect } from "../../types/unified-effects"

import {
  deleteUserEffect,
  getUserEffectsList,
  loadEffectsCollection,
  loadUserEffect,
  prepareEffectForExport,
  saveEffectsCollection,
  saveUserEffect,
  type UserEffect,
  type UserEffectsCollection,
} from "../../utils/user-effects"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("user-effects", () => {
  const mockInvoke = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup Tauri mock
    const { invoke } = await import("@tauri-apps/api/core")
    vi.mocked(invoke).mockImplementation(mockInvoke)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const createMockEffect = (id: string): BaseEffect => ({
    id,
    name: {
      ru: `Тестовый эффект ${id}`,
      en: `Test Effect ${id}`,
    },
    description: {
      ru: "Тестовый эффект",
      en: "Test Effect",
    },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["test"],
    complexity: "low",
    gpuAccelerated: false,
    parameters: [
      {
        id: "intensity",
        name: {
          ru: "Интенсивность",
          en: "Intensity",
        },
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
      },
    ],
    presets: [],
    processors: {
      webgl: {
        fragmentShader: "blur({{intensity}}px)",
        uniforms: {},
      },
    },
  })

  describe("saveUserEffect", () => {
    it("should save user effect successfully", async () => {
      const mockEffect = createMockEffect("test-1")
      const mockFilePath = "/effects/test-effect.effect"

      mockInvoke.mockResolvedValue(mockFilePath)

      const result = await saveUserEffect(mockEffect, "test-effect")

      expect(mockInvoke).toHaveBeenCalledWith("save_user_effect", {
        fileName: "test-effect",
        effect: expect.stringContaining('"isCustom":true'),
      })
      expect(result).toBe(mockFilePath)

      // Verify the effect data structure
      const effectData = JSON.parse(mockInvoke.mock.calls[0][1].effect)
      expect(effectData).toMatchObject({
        id: mockEffect.id,
        name: mockEffect.name,
        isCustom: true,
      })
      expect(effectData.createdAt).toBeDefined()
      expect(effectData.updatedAt).toBeDefined()
    })

    it("should handle save errors", async () => {
      const mockEffect = createMockEffect("test-1")
      const saveError = new Error("File save failed")

      mockInvoke.mockRejectedValue(saveError)

      await expect(saveUserEffect(mockEffect, "test-effect")).rejects.toThrow("File save failed")

      expect(mockInvoke).toHaveBeenCalledWith("save_user_effect", {
        fileName: "test-effect",
        effect: expect.any(String),
      })
    })

    it("should create proper UserEffect structure", async () => {
      const mockEffect = createMockEffect("test-1")
      const mockFilePath = "/effects/test-effect.effect"

      mockInvoke.mockResolvedValue(mockFilePath)

      await saveUserEffect(mockEffect, "test-effect")

      const effectData = JSON.parse(mockInvoke.mock.calls[0][1].effect)
      expect(effectData).toEqual({
        id: mockEffect.id,
        name: mockEffect.name,
        category: mockEffect.category,
        complexity: mockEffect.complexity,
        description: mockEffect.description,
        scope: mockEffect.scope,
        processingType: mockEffect.processingType,
        version: mockEffect.version,
        tags: mockEffect.tags,
        gpuAccelerated: mockEffect.gpuAccelerated,
        parameters: mockEffect.parameters,
        presets: mockEffect.presets,
        processors: mockEffect.processors,
        isCustom: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      })

      // Verify date format
      expect(new Date(effectData.createdAt).getTime()).toBeGreaterThan(0)
      expect(new Date(effectData.updatedAt).getTime()).toBeGreaterThan(0)
    })
  })

  describe("loadUserEffect", () => {
    it("should load user effect successfully", async () => {
      const mockEffect = createMockEffect("test-1")
      const mockUserEffect: UserEffect = {
        ...mockEffect,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        isCustom: true,
        author: "Test Author",
        tags: ["custom", "test"],
      }

      mockInvoke.mockResolvedValue(JSON.stringify(mockUserEffect))

      const result = await loadUserEffect("/effects/test-effect.effect")

      expect(mockInvoke).toHaveBeenCalledWith("load_user_effect", {
        filePath: "/effects/test-effect.effect",
      })
      expect(result).toEqual(
        expect.objectContaining({
          createdAt: mockUserEffect.createdAt,
          updatedAt: mockUserEffect.updatedAt,
          isCustom: mockUserEffect.isCustom,
          author: mockUserEffect.author,
          tags: mockUserEffect.tags,
          id: mockUserEffect.id,
          name: mockUserEffect.name,
        }),
      )
    })

    it("should handle load errors", async () => {
      const loadError = new Error("File not found")
      mockInvoke.mockRejectedValue(loadError)

      await expect(loadUserEffect("/effects/missing.effect")).rejects.toThrow("File not found")

      expect(mockInvoke).toHaveBeenCalledWith("load_user_effect", {
        filePath: "/effects/missing.effect",
      })
    })

    it("should handle invalid JSON data", async () => {
      mockInvoke.mockResolvedValue("invalid json data")

      await expect(loadUserEffect("/effects/corrupt.effect")).rejects.toThrow()
    })

    it("should parse complex effect data correctly", async () => {
      const complexEffect = createMockEffect("complex-1")
      complexEffect.presets = [
        {
          id: "preset1",
          name: { ru: "Пресет 1", en: "Preset 1" },
          parameters: { intensity: 75 },
          description: { ru: "Описание", en: "Description" },
          tags: [],
        },
      ]

      const mockUserEffect: UserEffect = {
        ...complexEffect,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-02T00:00:00.000Z",
        isCustom: true,
      }

      mockInvoke.mockResolvedValue(JSON.stringify(mockUserEffect))

      const result = await loadUserEffect("/effects/complex.effect")

      expect(result.presets).toEqual(complexEffect.presets)
      expect(result.createdAt).toBe("2023-01-01T00:00:00.000Z")
      expect(result.updatedAt).toBe("2023-01-02T00:00:00.000Z")
    })
  })

  describe("saveEffectsCollection", () => {
    it("should save effects collection successfully", async () => {
      const mockCollection: UserEffectsCollection = {
        version: "1.0",
        name: "Test Collection",
        description: "A test collection",
        effects: [
          {
            ...createMockEffect("effect-1"),
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
            isCustom: true,
          },
          {
            ...createMockEffect("effect-2"),
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
            isCustom: true,
          },
        ],
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      }

      const mockFilePath = "/collections/test-collection.effects"
      mockInvoke.mockResolvedValue(mockFilePath)

      const result = await saveEffectsCollection(mockCollection, "test-collection")

      expect(mockInvoke).toHaveBeenCalledWith("save_effects_collection", {
        fileName: "test-collection",
        collection: JSON.stringify(mockCollection),
      })
      expect(result).toBe(mockFilePath)
    })

    it("should handle collection save errors", async () => {
      const mockCollection: UserEffectsCollection = {
        version: "1.0",
        name: "Test Collection",
        effects: [],
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      }

      const saveError = new Error("Collection save failed")
      mockInvoke.mockRejectedValue(saveError)

      await expect(saveEffectsCollection(mockCollection, "test-collection")).rejects.toThrow("Collection save failed")
    })
  })

  describe("loadEffectsCollection", () => {
    it("should load effects collection successfully", async () => {
      const mockCollection: UserEffectsCollection = {
        version: "1.0",
        name: "Test Collection",
        description: "A test collection",
        effects: [
          {
            ...createMockEffect("effect-1"),
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
            isCustom: true,
          },
        ],
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      }

      mockInvoke.mockResolvedValue(JSON.stringify(mockCollection))

      const result = await loadEffectsCollection("/collections/test.effects")

      expect(mockInvoke).toHaveBeenCalledWith("load_effects_collection", {
        filePath: "/collections/test.effects",
      })
      expect(result).toEqual(
        expect.objectContaining({
          version: mockCollection.version,
          name: mockCollection.name,
          description: mockCollection.description,
          createdAt: mockCollection.createdAt,
          updatedAt: mockCollection.updatedAt,
          effects: expect.arrayContaining([
            expect.objectContaining({
              createdAt: mockCollection.effects[0].createdAt,
              updatedAt: mockCollection.effects[0].updatedAt,
              isCustom: mockCollection.effects[0].isCustom,
              id: mockCollection.effects[0].id,
              name: mockCollection.effects[0].name,
            }),
          ]),
        }),
      )
    })

    it("should handle collection load errors", async () => {
      const loadError = new Error("Collection not found")
      mockInvoke.mockRejectedValue(loadError)

      await expect(loadEffectsCollection("/collections/missing.effects")).rejects.toThrow("Collection not found")
    })

    it("should handle empty collections", async () => {
      const emptyCollection: UserEffectsCollection = {
        version: "1.0",
        name: "Empty Collection",
        effects: [],
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      }

      mockInvoke.mockResolvedValue(JSON.stringify(emptyCollection))

      const result = await loadEffectsCollection("/collections/empty.effects")

      expect(result.effects).toHaveLength(0)
      expect(result.name).toBe("Empty Collection")
    })
  })

  describe("prepareEffectForExport", () => {
    it("should return effect unchanged when no custom params", () => {
      const mockEffect = createMockEffect("test-1")

      const result = prepareEffectForExport(mockEffect)

      expect(result).toEqual(mockEffect)
      expect(result).not.toBe(mockEffect) // Should be a copy
    })

    it("should add custom preset when params provided", () => {
      const mockEffect = createMockEffect("test-1")
      const customParams = { intensity: 75, blur: 3 }
      const presetName = "My Custom Preset"

      const result = prepareEffectForExport(mockEffect, customParams, presetName)

      expect(result.presets).toBeDefined()
      expect(Array.isArray(result.presets)).toBe(true)
      expect(result.presets).toHaveLength(1)

      const customPreset = result.presets[0]
      expect(customPreset.id).toMatch(/^custom_\d+$/)
      expect(customPreset).toEqual({
        id: expect.stringMatching(/^custom_\d+$/),
        name: {
          ru: presetName,
          en: presetName,
        },
        parameters: customParams,
        description: {
          ru: "Пользовательская настройка",
          en: "Custom configuration",
        },
        tags: ["custom", "user"],
      })
    })

    it("should merge with existing presets", () => {
      const mockEffect = createMockEffect("test-1")
      mockEffect.presets = [
        {
          id: "existing-preset",
          name: { ru: "Существующий", en: "Existing" },
          parameters: { intensity: 50 },
          description: { ru: "Существующий пресет", en: "Existing preset" },
          tags: [],
        },
      ]

      const customParams = { intensity: 90 }
      const presetName = "New Preset"

      const result = prepareEffectForExport(mockEffect, customParams, presetName)

      expect(result.presets).toHaveLength(2)
      expect(result.presets[0].id).toBe("existing-preset")

      const customPreset = result.presets.find((preset) => preset.id.startsWith("custom_"))!
      expect(customPreset.parameters).toEqual(customParams)
    })

    it("should not add preset if only params provided without name", () => {
      const mockEffect = createMockEffect("test-1")
      const customParams = { intensity: 75 }

      const result = prepareEffectForExport(mockEffect, customParams)

      expect(result.presets).toEqual([])
    })

    it("should not add preset if only name provided without params", () => {
      const mockEffect = createMockEffect("test-1")
      const presetName = "My Preset"

      const result = prepareEffectForExport(mockEffect, undefined, presetName)

      expect(result.presets).toEqual([])
    })

    it("should generate unique preset IDs", async () => {
      const mockEffect = createMockEffect("test-1")
      const customParams = { intensity: 75 }

      const result1 = prepareEffectForExport(mockEffect, customParams, "Preset 1")

      // Wait enough time to ensure different timestamps (minimum 2ms)
      await new Promise((resolve) => setTimeout(resolve, 5))

      const result2 = prepareEffectForExport(mockEffect, customParams, "Preset 2")

      const id1 = result1.presets[0].id
      const id2 = result2.presets[0].id

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^custom_\d+$/)
      expect(id2).toMatch(/^custom_\d+$/)
    })
  })

  describe("getUserEffectsList", () => {
    it("should return list of user effects files", async () => {
      const mockFiles = ["/effects/effect1.effect", "/effects/effect2.effect", "/effects/collection1.effects"]

      mockInvoke.mockResolvedValue(mockFiles)

      const result = await getUserEffectsList()

      expect(mockInvoke).toHaveBeenCalledWith("get_user_effects_list")
      expect(result).toEqual(mockFiles)
    })

    it("should handle empty list", async () => {
      mockInvoke.mockResolvedValue([])

      const result = await getUserEffectsList()

      expect(result).toEqual([])
    })

    it("should handle errors gracefully", async () => {
      const listError = new Error("Failed to list files")
      mockInvoke.mockRejectedValue(listError)

      const result = await getUserEffectsList()

      expect(result).toEqual([])
      expect(mockInvoke).toHaveBeenCalledWith("get_user_effects_list")
    })

    it("should not throw on Tauri errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Tauri invoke failed"))

      // Should not throw, should return empty array
      await expect(getUserEffectsList()).resolves.toEqual([])
    })
  })

  describe("deleteUserEffect", () => {
    it("should delete user effect successfully", async () => {
      mockInvoke.mockResolvedValue(undefined)

      await deleteUserEffect("/effects/test-effect.effect")

      expect(mockInvoke).toHaveBeenCalledWith("delete_user_effect", {
        filePath: "/effects/test-effect.effect",
      })
    })

    it("should handle delete errors", async () => {
      const deleteError = new Error("File deletion failed")
      mockInvoke.mockRejectedValue(deleteError)

      await expect(deleteUserEffect("/effects/test-effect.effect")).rejects.toThrow("File deletion failed")

      expect(mockInvoke).toHaveBeenCalledWith("delete_user_effect", {
        filePath: "/effects/test-effect.effect",
      })
    })

    it("should handle non-existent files", async () => {
      const notFoundError = new Error("File not found")
      mockInvoke.mockRejectedValue(notFoundError)

      await expect(deleteUserEffect("/effects/missing.effect")).rejects.toThrow("File not found")
    })

    it("should handle permission errors", async () => {
      const permissionError = new Error("Permission denied")
      mockInvoke.mockRejectedValue(permissionError)

      await expect(deleteUserEffect("/effects/readonly.effect")).rejects.toThrow("Permission denied")
    })
  })

  describe("integration scenarios", () => {
    it("should handle save and load cycle", async () => {
      const mockEffect = createMockEffect("integration-test")
      const fileName = "integration-effect"
      const mockFilePath = "/effects/integration-effect.effect"

      // Mock save
      mockInvoke.mockResolvedValueOnce(mockFilePath)

      const savedPath = await saveUserEffect(mockEffect, fileName)
      expect(savedPath).toBe(mockFilePath)

      // Mock load
      const savedData = JSON.parse(mockInvoke.mock.calls[0][1].effect)
      mockInvoke.mockResolvedValueOnce(JSON.stringify(savedData))

      const loadedEffect = await loadUserEffect(savedPath)

      expect(loadedEffect).toEqual(
        expect.objectContaining({
          id: mockEffect.id,
          name: mockEffect.name,
          isCustom: true,
          // Functions are not preserved in JSON serialization
        }),
      )
    })

    it("should handle collection save and load cycle", async () => {
      const mockCollection: UserEffectsCollection = {
        version: "1.0",
        name: "Integration Collection",
        effects: [
          {
            ...createMockEffect("effect-1"),
            createdAt: "2023-01-01T00:00:00.000Z",
            updatedAt: "2023-01-01T00:00:00.000Z",
            isCustom: true,
          },
        ],
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      }

      const fileName = "integration-collection"
      const mockFilePath = "/collections/integration-collection.effects"

      // Mock save
      mockInvoke.mockResolvedValueOnce(mockFilePath)

      const savedPath = await saveEffectsCollection(mockCollection, fileName)
      expect(savedPath).toBe(mockFilePath)

      // Mock load
      const savedData = JSON.parse(mockInvoke.mock.calls[0][1].collection)
      mockInvoke.mockResolvedValueOnce(JSON.stringify(savedData))

      const loadedCollection = await loadEffectsCollection(savedPath)

      expect(loadedCollection).toEqual(
        expect.objectContaining({
          version: mockCollection.version,
          name: mockCollection.name,
          createdAt: mockCollection.createdAt,
          updatedAt: mockCollection.updatedAt,
          effects: expect.arrayContaining([
            expect.objectContaining({
              createdAt: mockCollection.effects[0].createdAt,
              updatedAt: mockCollection.effects[0].updatedAt,
              isCustom: mockCollection.effects[0].isCustom,
              id: mockCollection.effects[0].id,
              name: mockCollection.effects[0].name,
            }),
          ]),
        }),
      )
    })
  })
})
