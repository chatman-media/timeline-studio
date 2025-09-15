/**
 * Вспомогательные функции для работы с браузером
 */

import type { BrowserFileInfo, BrowserStateAccess, FileGroup } from "../types"

// Глобальная переменная для доступа к состоянию браузера
let browserStateAccess: BrowserStateAccess | null = null

/**
 * Устанавливает доступ к состоянию браузера
 */
export function setBrowserStateAccess(access: BrowserStateAccess | null) {
  browserStateAccess = access
}

/**
 * Получает текущий доступ к браузеру
 */
export function getBrowserStateAccess(): BrowserStateAccess | null {
  return browserStateAccess
}

/**
 * Проверяет, настроен ли доступ к браузеру
 */
export function hasBrowserAccess(): boolean {
  return browserStateAccess !== null
}

/**
 * Получает текущую вкладку браузера
 */
export function getCurrentTab() {
  if (!browserStateAccess) {
    throw new Error("Browser state access не настроен")
  }
  return browserStateAccess.getCurrentTab()
}

/**
 * Получает файлы из браузера
 */
export function getBrowserFiles(tab?: any) {
  if (!browserStateAccess) {
    throw new Error("Browser state access не настроен")
  }
  return browserStateAccess.getFiles(tab)
}

/**
 * Получает выбранные файлы
 */
export function getSelectedFiles() {
  if (!browserStateAccess) {
    throw new Error("Browser state access не настроен")
  }
  return browserStateAccess.getSelectedFiles()
}

/**
 * Получает статистику браузера
 */
export function getBrowserStats() {
  if (!browserStateAccess) {
    throw new Error("Browser state access не настроен")
  }
  return browserStateAccess.getBrowserStats()
}

/**
 * Фильтрует файлы по критериям
 */
export function filterFiles(files: BrowserFileInfo[], filters: any): BrowserFileInfo[] {
  let filtered = [...files]

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    filtered = filtered.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        file.tags?.some((tag) => tag.toLowerCase().includes(query)),
    )
  }

  if (filters.fileTypes?.length) {
    filtered = filtered.filter((file) => {
      const fileType = getFileTypeCategory(file.type)
      return filters.fileTypes.includes(fileType)
    })
  }

  if (filters.dateRange) {
    const startDate = new Date(filters.dateRange.start)
    const endDate = new Date(filters.dateRange.end)
    filtered = filtered.filter((file) => {
      const fileDate = file.modifiedAt || file.createdAt
      if (!fileDate) return true
      return fileDate >= startDate && fileDate <= endDate
    })
  }

  if (filters.sizeRange) {
    filtered = filtered.filter((file) => {
      if (!file.size) return true
      return file.size >= filters.sizeRange.min && file.size <= filters.sizeRange.max
    })
  }

  if (filters.durationRange) {
    filtered = filtered.filter((file) => {
      if (!file.duration) return true
      return file.duration >= filters.durationRange.min && file.duration <= filters.durationRange.max
    })
  }

  if (filters.tags?.length) {
    filtered = filtered.filter((file) => filters.tags.some((tag: string) => file.tags?.includes(tag)))
  }

  if (filters.location) {
    filtered = filtered.filter((file) => file.location?.toLowerCase().includes(filters.location.toLowerCase()))
  }

  return filtered
}

/**
 * Сортирует файлы
 */
export function sortFiles(
  files: BrowserFileInfo[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "asc",
): BrowserFileInfo[] {
  const sorted = [...files].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase()
        bValue = b.name.toLowerCase()
        break
      case "date":
        aValue = a.modifiedAt || a.createdAt || new Date(0)
        bValue = b.modifiedAt || b.createdAt || new Date(0)
        break
      case "size":
        aValue = a.size || 0
        bValue = b.size || 0
        break
      case "duration":
        aValue = a.duration || 0
        bValue = b.duration || 0
        break
      case "type":
        aValue = a.type
        bValue = b.type
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
    if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
    return 0
  })

  return sorted
}

/**
 * Группирует файлы по критерию
 */
export function groupFiles(files: BrowserFileInfo[], groupBy: string): FileGroup[] {
  const groups: Record<string, BrowserFileInfo[]> = {}

  files.forEach((file) => {
    let key: string

    switch (groupBy) {
      case "type":
        key = getFileTypeCategory(file.type)
        break
      case "date": {
        const date = file.modifiedAt || file.createdAt
        key = date ? formatDateKey(date) : "Без даты"
        break
      }
      case "size":
        key = getSizeCategory(file.size || 0)
        break
      case "location":
        key = file.location || "Без папки"
        break
      case "tags":
        // Для тегов создаем группу для каждого тега
        if (file.tags?.length) {
          file.tags.forEach((tag) => {
            if (!groups[tag]) groups[tag] = []
            groups[tag].push(file)
          })
          return
        }
        key = "Без тегов"
        break
      default:
        key = "Другое"
        break
    }

    if (!groups[key]) groups[key] = []
    groups[key].push(file)
  })

  return Object.entries(groups).map(([name, groupFiles]) => ({
    id: `group_${groupBy}_${name}`,
    name,
    type: groupBy,
    files: groupFiles,
    totalSize: groupFiles.reduce((sum, f) => sum + (f.size || 0), 0),
    totalDuration: groupFiles.reduce((sum, f) => sum + (f.duration || 0), 0),
    count: groupFiles.length,
    criteria: { groupBy, key: name },
  }))
}

/**
 * Получает категорию типа файла
 */
export function getFileTypeCategory(type: string): string {
  const lowerType = type.toLowerCase()

  if (lowerType.includes("video") || ["mp4", "avi", "mov", "mkv", "wmv"].some((ext) => lowerType.includes(ext))) {
    return "video"
  }
  if (lowerType.includes("audio") || ["mp3", "wav", "aac", "flac", "ogg"].some((ext) => lowerType.includes(ext))) {
    return "audio"
  }
  if (
    lowerType.includes("image") ||
    ["jpg", "jpeg", "png", "gif", "bmp", "svg"].some((ext) => lowerType.includes(ext))
  ) {
    return "image"
  }

  return "other"
}

/**
 * Форматирует дату для группировки
 */
export function formatDateKey(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (date >= today) {
    return "Сегодня"
  }
  if (date >= yesterday) {
    return "Вчера"
  }
  if (date >= weekAgo) {
    return "На этой неделе"
  }
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
  })
}

/**
 * Получает категорию размера файла
 */
export function getSizeCategory(size: number): string {
  if (size < 1024 * 1024) {
    return "Маленькие (< 1MB)"
  }
  if (size < 10 * 1024 * 1024) {
    return "Средние (1-10MB)"
  }
  if (size < 100 * 1024 * 1024) {
    return "Большие (10-100MB)"
  }
  return "Очень большие (> 100MB)"
}

/**
 * Форматирует размер файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}

/**
 * Форматирует длительность
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}:${minutes.toString().padStart(2, "0")}:00`
}

/**
 * Анализирует связи между файлами
 */
export function analyzeFileRelationships(files: BrowserFileInfo[], analysisType: string): any {
  switch (analysisType) {
    case "series":
      return findFileSeries(files)
    case "similarity":
      return findSimilarFiles(files)
    case "dependencies":
      return findFileDependencies(files)
    default:
      return { relationships: [], analysis: "Неподдерживаемый тип анализа" }
  }
}

/**
 * Находит серии файлов
 */
function findFileSeries(files: BrowserFileInfo[]): any {
  const series: Record<string, BrowserFileInfo[]> = {}

  files.forEach((file) => {
    // Простой алгоритм поиска серий по именам файлов
    const baseName = file.name.replace(/\d+/, "#").replace(/\.[^.]+$/, "")
    if (!series[baseName]) series[baseName] = []
    series[baseName].push(file)
  })

  // Фильтруем серии с более чем одним файлом
  const actualSeries = Object.entries(series)
    .filter(([_, seriesFiles]) => seriesFiles.length > 1)
    .map(([name, seriesFiles]) => ({
      name: name.replace("#", "X"),
      files: seriesFiles,
      count: seriesFiles.length,
    }))

  return {
    series: actualSeries,
    totalSeries: actualSeries.length,
    filesInSeries: actualSeries.reduce((sum, s) => sum + s.count, 0),
  }
}

/**
 * Находит похожие файлы
 */
function findSimilarFiles(files: BrowserFileInfo[]): any {
  const similar: Array<{ name: string; files: BrowserFileInfo[]; similarity: string }> = []

  // Группируем по размеру (примерно одинаковые файлы)
  const sizeGroups: Record<string, BrowserFileInfo[]> = {}

  files.forEach((file) => {
    const sizeKey = Math.floor((file.size || 0) / (1024 * 1024)) // MB
    const key = `${sizeKey}MB_${getFileTypeCategory(file.type)}`
    if (!sizeGroups[key]) sizeGroups[key] = []
    sizeGroups[key].push(file)
  })

  Object.entries(sizeGroups)
    .filter(([_, groupFiles]) => groupFiles.length > 1)
    .forEach(([key, groupFiles]) => {
      similar.push({
        name: `Похожие файлы (${key})`,
        files: groupFiles,
        similarity: "size_and_type",
      })
    })

  return {
    similar,
    totalGroups: similar.length,
    filesWithSimilar: similar.reduce((sum, s) => sum + s.files.length, 0),
  }
}

/**
 * Находит зависимости между файлами
 */
function findFileDependencies(_files: BrowserFileInfo[]): any {
  // В реальной реализации здесь будет анализ метаданных и связей
  return {
    dependencies: [],
    analysis: "Анализ зависимостей требует дополнительной реализации",
  }
}

/**
 * Генерирует случайную выборку файлов
 */
export function getRandomFiles(files: BrowserFileInfo[], count: number): BrowserFileInfo[] {
  const shuffled = [...files].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Находит файлы по шаблону
 */
export function findFilesByPattern(files: BrowserFileInfo[], pattern: string): BrowserFileInfo[] {
  const regex = new RegExp(pattern.replace(/\*/g, ".*"), "i")
  return files.filter((file) => regex.test(file.name) || regex.test(file.path))
}
