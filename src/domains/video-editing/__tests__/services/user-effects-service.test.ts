/**
 * User Effects Service Tests
 *
 * Tests for user effects CRUD operations and collections
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { BaseEffect } from "@/features/effects/types/unified-effects"
import * as userEffectsService from "../../services/effects/user-effects-service"

// Mock Tauri commands
const mockSaveUserEffectTauri = vi.fn()
const mockLoadUserEffectTauri = vi.fn()
const mockGetUserEffectsListTauri = vi.fn()
const mockDeleteUserEffectById = vi.fn()
const mockSaveEffectsCollectionTauri = vi.fn()
const mockLoadEffectsCollectionTauri = vi.fn()
const mockAddEffectToClipTauri = vi.fn()
const mockRemoveEffectFromClipTauri = vi.fn()
const mockCreateEffectTauri = vi.fn()
const mockCreateFilterTauri = vi.fn()

vi.mock("../../tauri/compiler-commands", () => ({
  saveUserEffect: (fileName: string, data: string) => mockSaveUserEffectTauri(fileName, data),
  loadUserEffect: (filePath: string) => mockLoadUserEffectTauri(filePath),
  getUserEffectsList: () => mockGetUserEffectsListTauri(),
  deleteUserEffectById: (filePath: string) => mockDeleteUserEffectById(filePath),
  saveEffectsCollection: (fileName: string, data: string) => mockSaveEffectsCollectionTauri(fileName, data),
  loadEffectsCollection: (filePath: string) => mockLoadEffectsCollectionTauri(filePath),
  addEffectToClip: (clipId: string, effectId: string, params: any) =>
    mockAddEffectToClipTauri(clipId, effectId, params),
  removeEffectFromClip: (clipId: string, effectId: string) => mockRemoveEffectFromClipTauri(clipId, effectId),
  createEffect: (effect: any) => mockCreateEffectTauri(effect),
  createFilter: (filter: any) => mockCreateFilterTauri(filter),
  addFilterToClip: vi.fn(),
  removeFilterFromClip: vi.fn(),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
  }),
}))

describe("UserEffectsService", () => {
  const mockEffect: BaseEffect = {
    id: "effect-1",
    name: {
      en: "Test Effect",
      ru: "Тестовый эффект",
    },
    description: {
      en: "Test effect description",
      ru: "Описание тестового эффекта",
    },
    category: "transform",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["test"],
    complexity: "low",
    gpuAccelerated: false,
    parameters: [],
    presets: [],
    processors: {},
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("saveUserEffect", () => {
    it("should save user effect successfully", async () => {
      mockSaveUserEffectTauri.mockResolvedValue("/path/to/effect.json")

      const filePath = await userEffectsService.saveUserEffect(mockEffect, "test-effect.json")

      expect(filePath).toBe("/path/to/effect.json")
      expect(mockSaveUserEffectTauri).toHaveBeenCalledWith(
        "test-effect.json",
        expect.stringContaining('"id":"effect-1"'),
      )
    })

    it("should add metadata to saved effect", async () => {
      mockSaveUserEffectTauri.mockResolvedValue("/path/to/effect.json")

      await userEffectsService.saveUserEffect(mockEffect, "test-effect.json")

      const savedData = mockSaveUserEffectTauri.mock.calls[0][1]
      const parsedEffect = JSON.parse(savedData)

      expect(parsedEffect.isCustom).toBe(true)
      expect(parsedEffect.createdAt).toBeDefined()
      expect(parsedEffect.updatedAt).toBeDefined()
    })

    it("should throw error on save failure", async () => {
      mockSaveUserEffectTauri.mockRejectedValue(new Error("Save failed"))

      await expect(userEffectsService.saveUserEffect(mockEffect, "test-effect.json")).rejects.toThrow("Save failed")
    })
  })

  describe("loadUserEffect", () => {
    it("should load user effect successfully", async () => {
      const mockUserEffect = {
        ...mockEffect,
        isCustom: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }

      mockLoadUserEffectTauri.mockResolvedValue(JSON.stringify(mockUserEffect))

      const effect = await userEffectsService.loadUserEffect("/path/to/effect.json")

      expect(effect).toEqual(mockUserEffect)
      expect(mockLoadUserEffectTauri).toHaveBeenCalledWith("/path/to/effect.json")
    })

    it("should throw error on load failure", async () => {
      mockLoadUserEffectTauri.mockRejectedValue(new Error("Load failed"))

      await expect(userEffectsService.loadUserEffect("/path/to/effect.json")).rejects.toThrow("Load failed")
    })

    it("should parse JSON correctly", async () => {
      const mockUserEffect = {
        id: "effect-2",
        name: "Parsed Effect",
        type: "color" as const,
        isCustom: true as const,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        category: "color" as const,
        parameters: { brightness: 1.5 },
      }

      mockLoadUserEffectTauri.mockResolvedValue(JSON.stringify(mockUserEffect))

      const effect = await userEffectsService.loadUserEffect("/path/to/effect.json")

      expect(effect.id).toBe("effect-2")
      expect(effect.parameters).toEqual({ brightness: 1.5 })
    })
  })

  describe("getUserEffectsList", () => {
    it("should get list of user effects", async () => {
      const mockFiles = ["/path/to/effect1.json", "/path/to/effect2.json", "/path/to/effect3.json"]

      mockGetUserEffectsListTauri.mockResolvedValue(mockFiles)

      const files = await userEffectsService.getUserEffectsList()

      expect(files).toEqual(mockFiles)
      expect(files).toHaveLength(3)
      expect(mockGetUserEffectsListTauri).toHaveBeenCalled()
    })

    it("should return empty array on error", async () => {
      mockGetUserEffectsListTauri.mockRejectedValue(new Error("List failed"))

      const files = await userEffectsService.getUserEffectsList()

      expect(files).toEqual([])
    })

    it("should handle empty list", async () => {
      mockGetUserEffectsListTauri.mockResolvedValue([])

      const files = await userEffectsService.getUserEffectsList()

      expect(files).toEqual([])
      expect(files).toHaveLength(0)
    })
  })

  describe("deleteUserEffect", () => {
    it("should delete user effect successfully", async () => {
      mockDeleteUserEffectById.mockResolvedValue(undefined)

      await userEffectsService.deleteUserEffect("/path/to/effect.json")

      expect(mockDeleteUserEffectById).toHaveBeenCalledWith("/path/to/effect.json")
    })

    it("should throw error on delete failure", async () => {
      mockDeleteUserEffectById.mockRejectedValue(new Error("Delete failed"))

      await expect(userEffectsService.deleteUserEffect("/path/to/effect.json")).rejects.toThrow("Delete failed")
    })
  })

  describe("saveEffectsCollection", () => {
    it("should save effects collection successfully", async () => {
      const mockCollection: userEffectsService.UserEffectsCollection = {
        version: "1.0.0",
        name: "Test Collection",
        description: "Collection description",
        effects: [mockEffect as userEffectsService.UserEffect],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }

      mockSaveEffectsCollectionTauri.mockResolvedValue("/path/to/collection.json")

      const filePath = await userEffectsService.saveEffectsCollection(mockCollection, "collection.json")

      expect(filePath).toBe("/path/to/collection.json")
      expect(mockSaveEffectsCollectionTauri).toHaveBeenCalledWith("collection.json", expect.any(String))
    })

    it("should throw error on collection save failure", async () => {
      const mockCollection: userEffectsService.UserEffectsCollection = {
        version: "1.0.0",
        name: "Test Collection",
        effects: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }

      mockSaveEffectsCollectionTauri.mockRejectedValue(new Error("Save collection failed"))

      await expect(userEffectsService.saveEffectsCollection(mockCollection, "collection.json")).rejects.toThrow(
        "Save collection failed",
      )
    })
  })

  describe("loadEffectsCollection", () => {
    it("should load effects collection successfully", async () => {
      const mockCollection: userEffectsService.UserEffectsCollection = {
        version: "1.0.0",
        name: "Test Collection",
        description: "Collection description",
        effects: [mockEffect as userEffectsService.UserEffect],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      }

      mockLoadEffectsCollectionTauri.mockResolvedValue(JSON.stringify(mockCollection))

      const collection = await userEffectsService.loadEffectsCollection("/path/to/collection.json")

      expect(collection).toEqual(mockCollection)
      expect(collection.effects).toHaveLength(1)
      expect(mockLoadEffectsCollectionTauri).toHaveBeenCalledWith("/path/to/collection.json")
    })

    it("should throw error on collection load failure", async () => {
      mockLoadEffectsCollectionTauri.mockRejectedValue(new Error("Load collection failed"))

      await expect(userEffectsService.loadEffectsCollection("/path/to/collection.json")).rejects.toThrow(
        "Load collection failed",
      )
    })

    it("should parse collection JSON correctly", async () => {
      const mockCollection: userEffectsService.UserEffectsCollection = {
        version: "2.0.0",
        name: "Parsed Collection",
        effects: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      }

      mockLoadEffectsCollectionTauri.mockResolvedValue(JSON.stringify(mockCollection))

      const collection = await userEffectsService.loadEffectsCollection("/path/to/collection.json")

      expect(collection.version).toBe("2.0.0")
      expect(collection.effects).toEqual([])
    })
  })
})
