/**
 * Тесты для утилит Media Pool
 */

import { describe, expect, it } from "vitest"

import type { MediaFile } from "@/domains/media-management"
import type { SavedMediaFile, SavedMusicFile } from "@/domains/media-management"
import {
  addItemToPool,
  convertMediaFileToPoolItem,
  convertSavedMediaFileToPoolItem,
  createEmptyMediaPool,
  createMediaBin,
  getItemsInBin,
  migrateMediaLibraryToPool,
  searchMediaPool,
  updateItemUsage,
} from "../../utils/media-pool-utils"

describe("Media Pool Utils", () => {
  // Мок данные
  const mockMediaFile: MediaFile = {
    id: "media-1",
    name: "test-video.mp4",
    path: "/path/to/video.mp4",
    relativePath: "video.mp4",
    size: 1000000,
    lastModified: Date.now(),
    isVideo: true,
    isAudio: false,
    isImage: false,
    isOffline: false,
    hash: "abc123",
    metadata: {
      duration: 120,
      createdAt: "2024-01-01",
      probeData: {
        streams: [
          {
            codec_type: "video",
            codec_name: "h264",
            width: 1920,
            height: 1080,
            r_frame_rate: "30/1",
          },
        ],
        format: {
          bit_rate: "8000000",
        },
      },
    },
  } as any

  const mockSavedMediaFile: SavedMediaFile = {
    id: "saved-1",
    originalPath: "/path/to/saved.mp4",
    relativePath: "saved.mp4",
    name: "saved-video.mp4",
    size: 2000000,
    lastModified: Date.now(),
    isVideo: true,
    isAudio: false,
    isImage: false,
    metadata: {
      duration: 60,
      createdAt: "2024-01-01",
      probeData: {
        streams: [
          {
            codec_type: "video",
            codec_name: "h265",
            width: 3840,
            height: 2160,
            r_frame_rate: "60/1",
          },
        ],
        format: {
          bit_rate: "20000000",
        },
      },
    },
    status: "available",
    alternativePaths: [],
    lastChecked: Date.now(),
  }

  describe("convertMediaFileToPoolItem", () => {
    it("должен конвертировать MediaFile в MediaPoolItem", () => {
      const result = convertMediaFileToPoolItem(mockMediaFile)

      expect(result).toMatchObject({
        id: "media-1",
        type: "video",
        name: "test-video.mp4",
        status: "online",
        binId: "root",
        metadata: {
          duration: 120,
          frameRate: 30,
          resolution: { width: 1920, height: 1080 },
          codec: "h264",
          bitRate: 8000000,
          fileSize: 1000000,
        },
        usage: {
          sequences: [],
          count: 0,
        },
        tags: [],
      })
    })

    it("должен обрабатывать оффлайн файлы", () => {
      const offlineFile = { ...mockMediaFile, isOffline: true }
      const result = convertMediaFileToPoolItem(offlineFile)

      expect(result.status).toBe("offline")
    })

    it("должен определять тип медиа", () => {
      const audioFile = { ...mockMediaFile, isVideo: false, isAudio: true }
      const audioResult = convertMediaFileToPoolItem(audioFile)
      expect(audioResult.type).toBe("audio")

      const imageFile = { ...mockMediaFile, isVideo: false, isImage: true }
      const imageResult = convertMediaFileToPoolItem(imageFile)
      expect(imageResult.type).toBe("image")
    })

    it("должен использовать указанный binId", () => {
      const result = convertMediaFileToPoolItem(mockMediaFile, "custom-bin")
      expect(result.binId).toBe("custom-bin")
    })
  })

  describe("convertSavedMediaFileToPoolItem", () => {
    it("должен конвертировать SavedMediaFile в MediaPoolItem", () => {
      const result = convertSavedMediaFileToPoolItem(mockSavedMediaFile)

      expect(result).toMatchObject({
        id: "saved-1",
        type: "video",
        name: "saved-video.mp4",
        status: "online",
        metadata: {
          duration: 60,
          frameRate: 60,
          resolution: { width: 3840, height: 2160 },
          codec: "h265",
          bitRate: 20000000,
        },
      })
    })

    it("должен правильно конвертировать статусы", () => {
      const missingFile = { ...mockSavedMediaFile, status: "missing" as const }
      const missingResult = convertSavedMediaFileToPoolItem(missingFile)
      expect(missingResult.status).toBe("missing")

      const movedFile = { ...mockSavedMediaFile, status: "moved" as const }
      const movedResult = convertSavedMediaFileToPoolItem(movedFile)
      expect(movedResult.status).toBe("offline")
    })
  })

  describe("createEmptyMediaPool", () => {
    it("должен создавать пустой Media Pool с правильной структурой", () => {
      const pool = createEmptyMediaPool()

      expect(pool.items.size).toBe(0)
      expect(pool.bins.size).toBe(1)
      expect(pool.bins.has("root")).toBe(true)
      expect(pool.smartCollections).toEqual([])
      expect(pool.viewSettings).toMatchObject({
        sortBy: "name",
        sortOrder: "asc",
        viewMode: "thumbnails",
        thumbnailSize: "medium",
        showOfflineMedia: true,
        showProxyBadge: true,
      })
      expect(pool.stats).toMatchObject({
        totalItems: 0,
        totalSize: 0,
        onlineItems: 0,
        offlineItems: 0,
        proxyItems: 0,
        unusedItems: 0,
      })
    })
  })

  describe("createMediaBin", () => {
    it("должен создавать новую папку", () => {
      const bin = createMediaBin("My Videos", "root")

      expect(bin).toMatchObject({
        name: "My Videos",
        parentId: "root",
        sortOrder: 0,
        isExpanded: false,
      })
      expect(bin.id).toBeTruthy()
      expect(bin.createdDate).toBeInstanceOf(Date)
    })

    it("должен создавать корневую папку если parentId не указан", () => {
      const bin = createMediaBin("Root Bin")
      expect(bin.parentId).toBe("root")
    })
  })

  describe("addItemToPool", () => {
    it("должен добавлять элемент в пул и обновлять статистику", () => {
      const pool = createEmptyMediaPool()
      const item = convertMediaFileToPoolItem(mockMediaFile)

      const updatedPool = addItemToPool(pool, item)

      expect(updatedPool.items.size).toBe(1)
      expect(updatedPool.items.get(item.id)).toEqual(item)
      expect(updatedPool.stats.totalItems).toBe(1)
      expect(updatedPool.stats.totalSize).toBe(1000000)
      expect(updatedPool.stats.onlineItems).toBe(1)
      expect(updatedPool.stats.offlineItems).toBe(0)
    })

    it("должен правильно считать оффлайн элементы", () => {
      const pool = createEmptyMediaPool()
      const offlineItem = { ...convertMediaFileToPoolItem(mockMediaFile), status: "offline" as const }

      const updatedPool = addItemToPool(pool, offlineItem)

      expect(updatedPool.stats.onlineItems).toBe(0)
      expect(updatedPool.stats.offlineItems).toBe(1)
    })
  })

  describe("searchMediaPool", () => {
    it("должен искать по имени файла", () => {
      const pool = createEmptyMediaPool()
      const item1 = { ...convertMediaFileToPoolItem(mockMediaFile), name: "vacation.mp4" }
      const item2 = { ...convertMediaFileToPoolItem(mockMediaFile), id: "2", name: "work.mp4" }

      pool.items.set(item1.id, item1)
      pool.items.set(item2.id, item2)

      const results = searchMediaPool(pool, "vacation")
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe("vacation.mp4")
    })

    it("должен искать по тегам", () => {
      const pool = createEmptyMediaPool()
      const item = {
        ...convertMediaFileToPoolItem(mockMediaFile),
        tags: ["summer", "beach", "2024"],
      }
      pool.items.set(item.id, item)

      const results = searchMediaPool(pool, "beach")
      expect(results).toHaveLength(1)
    })

    it("должен искать по заметкам", () => {
      const pool = createEmptyMediaPool()
      const item = {
        ...convertMediaFileToPoolItem(mockMediaFile),
        notes: "This is the final cut of the project",
      }
      pool.items.set(item.id, item)

      const results = searchMediaPool(pool, "final cut")
      expect(results).toHaveLength(1)
    })

    it("должен быть регистронезависимым", () => {
      const pool = createEmptyMediaPool()
      const item = { ...convertMediaFileToPoolItem(mockMediaFile), name: "VACATION.MP4" }
      pool.items.set(item.id, item)

      const results = searchMediaPool(pool, "vacation")
      expect(results).toHaveLength(1)
    })
  })

  describe("getItemsInBin", () => {
    it("должен возвращать элементы из указанной папки", () => {
      const pool = createEmptyMediaPool()
      const videoBin = createMediaBin("Videos")
      pool.bins.set(videoBin.id, videoBin)

      const item1 = { ...convertMediaFileToPoolItem(mockMediaFile), binId: videoBin.id }
      const item2 = { ...convertMediaFileToPoolItem(mockMediaFile), id: "2", binId: "root" }

      pool.items.set(item1.id, item1)
      pool.items.set(item2.id, item2)

      const results = getItemsInBin(pool, videoBin.id)
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(item1.id)
    })
  })

  describe("updateItemUsage", () => {
    it("должен увеличивать использование элемента", () => {
      const pool = createEmptyMediaPool()
      const item = convertMediaFileToPoolItem(mockMediaFile)
      pool.items.set(item.id, item)

      const updatedPool = updateItemUsage(pool, item.id, "sequence-1", true)
      const updatedItem = updatedPool.items.get(item.id)!

      expect(updatedItem.usage.count).toBe(1)
      expect(updatedItem.usage.sequences).toContain("sequence-1")
      expect(updatedItem.usage.lastUsed).toBeInstanceOf(Date)
    })

    it("должен уменьшать использование элемента", () => {
      const pool = createEmptyMediaPool()
      const item = {
        ...convertMediaFileToPoolItem(mockMediaFile),
        usage: { sequences: ["sequence-1"], count: 1, lastUsed: new Date() },
      }
      pool.items.set(item.id, item)

      const updatedPool = updateItemUsage(pool, item.id, "sequence-1", false)
      const updatedItem = updatedPool.items.get(item.id)!

      expect(updatedItem.usage.count).toBe(0)
      expect(updatedItem.usage.sequences).toHaveLength(0)
    })

    it("должен обновлять статистику неиспользуемых элементов", () => {
      const pool = createEmptyMediaPool()
      const item = {
        ...convertMediaFileToPoolItem(mockMediaFile),
        usage: { sequences: ["sequence-1"], count: 1 },
      }
      pool.items.set(item.id, item)

      const updatedPool = updateItemUsage(pool, item.id, "sequence-1", false)
      expect(updatedPool.stats.unusedItems).toBe(1)
    })
  })

  describe("migrateMediaLibraryToPool", () => {
    it("должен мигрировать старую MediaLibrary в новый Media Pool", () => {
      const mediaFiles: SavedMediaFile[] = [
        { ...mockSavedMediaFile, isVideo: true },
        { ...mockSavedMediaFile, id: "saved-2", isVideo: false, isImage: true },
      ]
      const musicFiles: SavedMusicFile[] = [
        { ...mockSavedMediaFile, id: "music-1", isVideo: false, isAudio: true } as SavedMusicFile,
      ]

      const pool = migrateMediaLibraryToPool(mediaFiles, musicFiles)

      // Проверяем, что созданы папки
      expect(pool.bins.size).toBe(5) // root + 4 категории
      expect(Array.from(pool.bins.values()).map((b) => b.name)).toContain("Videos")
      expect(Array.from(pool.bins.values()).map((b) => b.name)).toContain("Images")
      expect(Array.from(pool.bins.values()).map((b) => b.name)).toContain("Music")

      // Проверяем, что файлы распределены по папкам
      expect(pool.items.size).toBe(3)

      const items = Array.from(pool.items.values())
      const videoItem = items.find((i) => i.id === "saved-1")
      const imageItem = items.find((i) => i.id === "saved-2")
      const musicItem = items.find((i) => i.id === "music-1")

      expect(videoItem).toBeTruthy()
      expect(imageItem).toBeTruthy()
      expect(musicItem).toBeTruthy()

      // Проверяем статистику
      expect(pool.stats.totalItems).toBe(3)
      expect(pool.stats.unusedItems).toBe(3) // Все изначально неиспользуемые
    })
  })
})
