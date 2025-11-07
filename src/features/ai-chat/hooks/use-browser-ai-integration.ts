import { useCallback, useEffect } from "react"
import type { BrowserStateAccess } from "@/features/ai-chat/tools/core/browser/types"
import { setBrowserStateAccess } from "@/features/ai-chat/tools/core/browser/utils/helpers"
import { useApp } from "@/features/app-state/services/app-provider"
import { useBrowserState } from "@/features/browser/services/browser-state-provider"
import type { MediaFile } from "@/features/media/types/media"
import { logInfo } from "@/lib/tauri-logger"

/**
 * Хук для интеграции Browser с AI функциональностью
 * Предоставляет доступ к состоянию браузера для AI инструментов
 */
export function useBrowserAIIntegration() {
  logInfo("[useBrowserAIIntegration] Инициализация")

  const browserState = useBrowserState()
  const { projectState } = useApp()

  // Получаем медиафайлы из project state
  const mediaFiles = projectState?.mediaFiles || []
  const isLoading = false

  // Функция для получения файлов из текущей вкладки
  const getTabFiles = useCallback((): MediaFile[] => {
    const { activeTab } = browserState

    // Фильтруем файлы в зависимости от активной вкладки
    let files: MediaFile[] = []
    switch (activeTab) {
      case "media":
        files = mediaFiles.filter((file: MediaFile) => file.isVideo || file.isImage)
        break
      case "music":
        files = mediaFiles.filter((file: MediaFile) => file.isAudio)
        break
      default:
        // Для остальных вкладок возвращаем пустой массив
        // так как они не связаны с медиафайлами
        files = []
    }

    logInfo("[useBrowserAIIntegration] Получены файлы вкладки", { activeTab, count: files.length })
    return files
  }, [browserState.activeTab, mediaFiles])

  // Функция для получения выбранных файлов
  const getSelectedFiles = useCallback((): MediaFile[] => {
    const selectedIds = browserState.selectedFiles
    const tabFiles = getTabFiles()
    const selected = tabFiles.filter((file: MediaFile) => selectedIds.has(file.id))
    logInfo("[useBrowserAIIntegration] Выбрано файлов", { count: selected.length })
    return selected
  }, [browserState.selectedFiles, getTabFiles])

  // Функция для получения файлов с фильтрами
  const getFilteredFiles = useCallback((): MediaFile[] => {
    const tabFiles = getTabFiles()
    const { currentTabSettings } = browserState

    let filtered = [...tabFiles]

    // Применяем поиск
    if (currentTabSettings.searchQuery) {
      const query = currentTabSettings.searchQuery.toLowerCase()
      filtered = filtered.filter((file) => file.name.toLowerCase().includes(query))
    }

    // Применяем фильтр по избранным
    if (currentTabSettings.showFavoritesOnly) {
      // В текущей реализации нет функционала избранного
      // Оставляем как есть
    }

    // Применяем сортировку
    filtered.sort((a, b) => {
      const { sortBy, sortOrder } = currentTabSettings
      let comparison = 0

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "date":
          comparison = (a.lastCheckedAt || 0) - (b.lastCheckedAt || 0)
          break
        case "size":
          comparison = (a.size || 0) - (b.size || 0)
          break
        case "duration":
          comparison = (a.duration || 0) - (b.duration || 0)
          break
        default:
          // По умолчанию сортируем по имени
          comparison = a.name.localeCompare(b.name)
          break
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    logInfo("[useBrowserAIIntegration] Отфильтровано файлов", { count: filtered.length })
    return filtered
  }, [getTabFiles, browserState])

  // Эффект для установки доступа к состоянию браузера
  useEffect(() => {
    const browserAccess: BrowserStateAccess = {
      getCurrentTab: () => browserState.activeTab,
      getFiles: (tab?: any) => {
        if (tab) {
          // Фильтруем файлы для конкретной вкладки
          switch (tab) {
            case "media":
              return mediaFiles.filter((file: MediaFile) => file.isVideo || file.isImage)
            case "music":
              return mediaFiles.filter((file: MediaFile) => file.isAudio)
            default:
              return []
          }
        }
        return getTabFiles()
      },
      getSelectedFiles,
      getFilters: () => browserState.currentTabSettings,
      setFilters: (filters: any) => {
        logInfo("[useBrowserAIIntegration] Установка фильтров", filters)
        // Применяем фильтры к текущей вкладке
        if (filters.searchQuery !== undefined) {
          browserState.setSearchQuery(filters.searchQuery)
        }
        if (filters.sortBy && filters.sortOrder) {
          browserState.setSort(filters.sortBy, filters.sortOrder)
        }
      },
      selectFiles: (fileIds: string[]) => {
        logInfo("[useBrowserAIIntegration] Выбор файлов", { count: fileIds.length })
        // Выбираем все переданные файлы
        fileIds.forEach((fileId) => browserState.selectFile(fileId))
      },
      deselectFiles: (fileIds: string[]) => {
        logInfo("[useBrowserAIIntegration] Снятие выбора файлов", { count: fileIds.length })
        // Отменяем выбор всех переданных файлов
        fileIds.forEach((fileId) => browserState.deselectFile(fileId))
      },
      searchFiles: (query: string) => {
        logInfo("[useBrowserAIIntegration] Поиск файлов", { query })
        const filtered = getTabFiles().filter((file: MediaFile) =>
          file.name.toLowerCase().includes(query.toLowerCase()),
        )
        logInfo("[useBrowserAIIntegration] Найдено файлов", { count: filtered.length })
        return filtered
      },
      getFileGroups: (groupBy: string) => {
        logInfo("[useBrowserAIIntegration] Группировка файлов", { groupBy })
        // Группировка файлов
        const files = getTabFiles()
        const groups: Record<string, MediaFile[]> = {}

        files.forEach((file: MediaFile) => {
          let groupKey = ""
          switch (groupBy) {
            case "type":
              groupKey = file.isVideo ? "video" : file.isAudio ? "audio" : file.isImage ? "image" : "other"
              break
            case "date": {
              const date = new Date(file.createdAt || file.updatedAt || Date.now())
              groupKey = date.toISOString().split("T")[0]
              break
            }
            default:
              groupKey = "all"
          }

          if (!groups[groupKey]) {
            groups[groupKey] = []
          }
          groups[groupKey].push(file)
        })

        const result = Object.entries(groups).map(([key, files]) => ({
          id: key,
          name: key,
          files,
          count: files.length,
        }))
        logInfo("[useBrowserAIIntegration] Группы файлов", { groupsCount: result.length })
        return result
      },
      getBrowserStats: () => {
        const files = getTabFiles()
        const filesByType: Record<string, number> = {}
        let totalSize = 0

        files.forEach((file: MediaFile) => {
          const type = file.isVideo ? "video" : file.isAudio ? "audio" : file.isImage ? "image" : "other"
          filesByType[type] = (filesByType[type] || 0) + 1
          totalSize += file.size || 0
        })

        const selectedFilesCount = browserState.selectedFiles.size

        const stats = {
          totalFiles: files.length,
          selectedFiles: selectedFilesCount,
          filesByType,
          totalSize,
        }
        logInfo("[useBrowserAIIntegration] Статистика браузера", stats)
        return stats
      },
    }

    // Устанавливаем доступ для AI инструментов
    setBrowserStateAccess(browserAccess)
    logInfo("[useBrowserAIIntegration] Доступ к браузеру установлен")

    // Очищаем при размонтировании
    return () => {
      setBrowserStateAccess(null)
      logInfo("[useBrowserAIIntegration] Доступ к браузеру очищен")
    }
  }, [browserState, mediaFiles, isLoading, getTabFiles, getSelectedFiles, getFilteredFiles])

  const result = {
    isReady: !isLoading && mediaFiles.length > 0,
    filesCount: mediaFiles.length,
    activeTab: browserState.activeTab,
  }

  logInfo("[useBrowserAIIntegration] Готов", result)
  return result
}
