/**
 * Утилиты для работы с Media Pool
 */

import { nanoid } from "nanoid"

import type { MediaFile } from "../types/media"
import type { MediaBin, MediaItemStatus, MediaItemType, MediaPool, MediaPoolItem } from "../types/media-pool"
import type { SavedMediaFile, SavedMusicFile } from "../types/saved-media"

/**
 * Конвертация MediaFile в MediaPoolItem
 */
export function convertMediaFileToPoolItem(file: MediaFile, binId = "root"): MediaPoolItem {
  const type = getMediaItemType(file)

  return {
    id: file.id,
    type,
    name: file.name,
    source: {
      path: file.path,
      relativePath: (file as any).relativePath,
      hash: (file as any).hash,
    },
    status: (file as any).isOffline ? "offline" : "online",
    binId,
    metadata: {
      duration: (file as any).metadata?.duration,
      frameRate: extractFrameRate(file),
      resolution: extractResolution(file),
      codec: extractCodec(file),
      bitRate: extractBitRate(file),
      fileSize: file.size || 0,
      createdDate: new Date((file as any).metadata?.createdAt || Date.now()),
      modifiedDate: new Date((file as any).lastModified || Date.now()),
      importedDate: new Date(),
    },
    usage: {
      sequences: [],
      count: 0,
    },
    tags: [],
  }
}

/**
 * Конвертация SavedMediaFile в MediaPoolItem
 */
export function convertSavedMediaFileToPoolItem(saved: SavedMediaFile | SavedMusicFile, binId = "root"): MediaPoolItem {
  return {
    id: saved.id,
    type: getMediaItemTypeFromSaved(saved),
    name: saved.name,
    source: {
      path: saved.originalPath,
      relativePath: saved.relativePath,
    },
    status: getMediaItemStatus(saved.status),
    binId,
    metadata: {
      duration: saved.metadata.duration,
      frameRate: extractFrameRateFromProbe(saved.metadata.probeData),
      resolution: extractResolutionFromProbe(saved.metadata.probeData),
      codec: extractCodecFromProbe(saved.metadata.probeData),
      bitRate: extractBitRateFromProbe(saved.metadata.probeData),
      fileSize: saved.size,
      createdDate: saved.metadata.createdAt ? new Date(saved.metadata.createdAt) : new Date(),
      modifiedDate: new Date(saved.lastModified),
      importedDate: new Date(),
    },
    usage: {
      sequences: [],
      count: 0,
    },
    tags: [],
  }
}

/**
 * Определение типа медиа элемента
 */
function getMediaItemType(file: MediaFile): MediaItemType {
  if (file.isVideo) return "video"
  if (file.isAudio) return "audio"
  if (file.isImage) return "image"
  return "video" // По умолчанию
}

/**
 * Определение типа из сохраненного файла
 */
function getMediaItemTypeFromSaved(saved: SavedMediaFile): MediaItemType {
  if (saved.isVideo) return "video"
  if (saved.isAudio) return "audio"
  if (saved.isImage) return "image"
  return "video"
}

/**
 * Конвертация статуса файла
 */
function getMediaItemStatus(status: string): MediaItemStatus {
  switch (status) {
    case "available":
      return "online"
    case "missing":
      return "missing"
    case "moved":
      return "offline"
    default:
      return "offline"
  }
}

/**
 * Извлечение частоты кадров
 */
function extractFrameRate(file: MediaFile): number | undefined {
  if ((file as any).metadata?.probeData?.streams) {
    const videoStream = (file as any).metadata.probeData.streams.find((s: any) => s.codec_type === "video")
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split("/")
      return Number.parseInt(num, 10) / Number.parseInt(den, 10)
    }
  }
  return undefined
}

function extractFrameRateFromProbe(probeData: any): number | undefined {
  if (probeData?.streams) {
    const videoStream = probeData.streams.find((s: any) => s.codec_type === "video")
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split("/")
      return Number.parseInt(num, 10) / Number.parseInt(den, 10)
    }
  }
  return undefined
}

/**
 * Извлечение разрешения
 */
function extractResolution(file: MediaFile): { width: number; height: number } | undefined {
  if ((file as any).metadata?.probeData?.streams) {
    const videoStream = (file as any).metadata.probeData.streams.find((s: any) => s.codec_type === "video")
    if (videoStream?.width && videoStream?.height) {
      return {
        width: videoStream.width,
        height: videoStream.height,
      }
    }
  }
  return undefined
}

function extractResolutionFromProbe(probeData: any): { width: number; height: number } | undefined {
  if (probeData?.streams) {
    const videoStream = probeData.streams.find((s: any) => s.codec_type === "video")
    if (videoStream?.width && videoStream?.height) {
      return {
        width: videoStream.width,
        height: videoStream.height,
      }
    }
  }
  return undefined
}

/**
 * Извлечение кодека
 */
function extractCodec(file: MediaFile): string | undefined {
  if ((file as any).metadata?.probeData?.streams) {
    const stream = (file as any).metadata.probeData.streams[0]
    return stream?.codec_name
  }
  return undefined
}

function extractCodecFromProbe(probeData: any): string | undefined {
  if (probeData?.streams && probeData.streams.length > 0) {
    return probeData.streams[0]?.codec_name
  }
  return undefined
}

/**
 * Извлечение битрейта
 */
function extractBitRate(file: MediaFile): number | undefined {
  if ((file as any).metadata?.probeData?.format?.bit_rate) {
    return Number.parseInt((file as any).metadata.probeData.format.bit_rate, 10)
  }
  return undefined
}

function extractBitRateFromProbe(probeData: any): number | undefined {
  if (probeData?.format?.bit_rate) {
    return Number.parseInt(probeData.format.bit_rate, 10)
  }
  return undefined
}

/**
 * Создание пустого Media Pool
 */
export function createEmptyMediaPool(): MediaPool {
  const rootBin: MediaBin = {
    id: "root",
    name: "Media Pool",
    parentId: null,
    sortOrder: 0,
    createdDate: new Date(),
    isExpanded: true,
  }

  return {
    items: new Map(),
    bins: new Map([["root", rootBin]]),
    smartCollections: [],
    viewSettings: {
      sortBy: "name",
      sortOrder: "asc",
      viewMode: "thumbnails",
      thumbnailSize: "medium",
      showOfflineMedia: true,
      showProxyBadge: true,
    },
    stats: {
      totalItems: 0,
      totalSize: 0,
      onlineItems: 0,
      offlineItems: 0,
      proxyItems: 0,
      unusedItems: 0,
    },
  }
}

/**
 * Создание новой папки (bin)
 */
export function createMediaBin(name: string, parentId: string | null = "root"): MediaBin {
  return {
    id: nanoid(),
    name,
    parentId,
    sortOrder: 0,
    createdDate: new Date(),
    isExpanded: false,
  }
}

/**
 * Добавление элемента в Media Pool
 */
export function addItemToPool(pool: MediaPool, item: MediaPoolItem): MediaPool {
  if (!pool || !pool.items) {
    throw new Error("Invalid media pool: missing items map")
  }

  const newPool = { ...pool }
  newPool.items = new Map(pool.items)
  newPool.items.set(item.id, item)

  // Обновляем статистику
  newPool.stats = {
    ...newPool.stats,
    totalItems: newPool.items.size,
    totalSize: Array.from(newPool.items.values()).reduce((sum, item) => sum + item.metadata.fileSize, 0),
    onlineItems: Array.from(newPool.items.values()).filter((item) => item.status === "online").length,
    offlineItems: Array.from(newPool.items.values()).filter(
      (item) => item.status === "offline" || item.status === "missing",
    ).length,
  }

  return newPool
}

/**
 * Поиск элементов в Media Pool
 */
export function searchMediaPool(pool: MediaPool, query: string): MediaPoolItem[] {
  const lowerQuery = query.toLowerCase()
  return Array.from(pool.items.values()).filter(
    (item) =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      item.notes?.toLowerCase().includes(lowerQuery),
  )
}

/**
 * Получение элементов из конкретной папки
 */
export function getItemsInBin(pool: MediaPool, binId: string): MediaPoolItem[] {
  return Array.from(pool.items.values()).filter((item) => item.binId === binId)
}

/**
 * Обновление использования элемента
 */
export function updateItemUsage(pool: MediaPool, itemId: string, sequenceId: string, increment = true): MediaPool {
  const newPool = { ...pool }
  const item = newPool.items.get(itemId)

  if (item) {
    const updatedItem = { ...item }

    if (increment) {
      if (!updatedItem.usage.sequences.includes(sequenceId)) {
        updatedItem.usage.sequences.push(sequenceId)
      }
      updatedItem.usage.count++
    } else {
      updatedItem.usage.sequences = updatedItem.usage.sequences.filter((id) => id !== sequenceId)
      updatedItem.usage.count = Math.max(0, updatedItem.usage.count - 1)
    }

    updatedItem.usage.lastUsed = new Date()

    newPool.items = new Map(pool.items)
    newPool.items.set(itemId, updatedItem)

    // Обновляем статистику неиспользуемых элементов
    newPool.stats = {
      ...newPool.stats,
      unusedItems: Array.from(newPool.items.values()).filter((item) => item.usage.count === 0).length,
    }
  }

  return newPool
}

/**
 * Миграция старой MediaLibrary в новый Media Pool
 */
export function migrateMediaLibraryToPool(mediaFiles: SavedMediaFile[], musicFiles: SavedMusicFile[]): MediaPool {
  const pool = createEmptyMediaPool()

  // Создаем папки для организации
  const videoBin = createMediaBin("Videos", "root")
  const audioBin = createMediaBin("Audio", "root")
  const imageBin = createMediaBin("Images", "root")
  const musicBin = createMediaBin("Music", "root")

  pool.bins.set(videoBin.id, videoBin)
  pool.bins.set(audioBin.id, audioBin)
  pool.bins.set(imageBin.id, imageBin)
  pool.bins.set(musicBin.id, musicBin)

  // Конвертируем медиафайлы
  for (const saved of mediaFiles) {
    const binId = saved.isVideo ? videoBin.id : saved.isImage ? imageBin.id : audioBin.id
    const item = convertSavedMediaFileToPoolItem(saved, binId)
    pool.items.set(item.id, item)
  }

  // Конвертируем музыкальные файлы
  for (const saved of musicFiles) {
    const item = convertSavedMediaFileToPoolItem(saved, musicBin.id)
    pool.items.set(item.id, item)
  }

  // Обновляем статистику
  pool.stats = {
    totalItems: pool.items.size,
    totalSize: Array.from(pool.items.values()).reduce((sum, item) => sum + item.metadata.fileSize, 0),
    onlineItems: Array.from(pool.items.values()).filter((item) => item.status === "online").length,
    offlineItems: Array.from(pool.items.values()).filter(
      (item) => item.status === "offline" || item.status === "missing",
    ).length,
    proxyItems: 0,
    unusedItems: pool.items.size, // Все элементы изначально неиспользуемые
  }

  return pool
}
