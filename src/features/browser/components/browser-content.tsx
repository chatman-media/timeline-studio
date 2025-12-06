import { memo, useCallback, useEffect } from "react"

import { useBrowserState } from "@/domains/browser"
import { useMediaManagement } from "@/domains/media-management"
import { useMusicImport } from "@/features/browser/hooks/use-music-import"
import { useMediaImport } from "@/features/media/hooks/use-media-import"

import { BrowserLoadingIndicator } from "./browser-loading-indicator"
import { BrowserToolbarWrapper } from "./browser-toolbar-wrapper"
import { LazyTabContent } from "./lazy-tab-content"

// Контейнер для контента вкладки
const TabContentContainer = memo(({ activeTab }: { activeTab: string }) => {
  const contentClassName = "bg-background m-0 flex-1 overflow-auto"

  return (
    <div className={contentClassName}>
      <LazyTabContent tabValue={activeTab} activeTab={activeTab} />
    </div>
  )
})

TabContentContainer.displayName = "TabContentContainer"

/**
 * Новая версия BrowserContent с использованием UniversalList и адаптеров
 * Поддерживает все типы контента через единую архитектуру
 */
export const BrowserContent = memo(() => {
  // Получаем состояние браузера
  const {
    activeTab,
    currentTabSettings,
    setSearchQuery,
    toggleFavorites,
    setSort,
    setGroupBy,
    setFilter,
    setViewMode,
    setPreviewSize,
    selectAllFiles,
    deselectAllFiles,
    selectedFiles,
  } = useBrowserState()

  // Получаем mediaPool для Cmd+A и removeMultipleMedia для Delete
  const { mediaPool, removeMultipleMedia } = useMediaManagement()

  // Извлекаем настройки для текущей вкладки
  const {
    search_query: searchQuery,
    show_favorites_only: showFavoritesOnly,
    view_mode: viewMode,
    sort_by: sortBy,
    filter_type: filterType,
    group_by: groupBy,
    sort_order: sortOrder,
    preview_size_index: previewSizeIndex,
  } = currentTabSettings

  // Импорт медиа
  const {
    importFile: importMediaFile,
    importFolder: importMediaFolder,
    isImporting: isImportingMedia,
  } = useMediaImport()

  // Импорт музыки
  const {
    importFile: importMusicFile,
    importDirectory: importMusicFolder,
    isImporting: isImportingMusic,
  } = useMusicImport()

  // Keyboard shortcuts для Browser
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Проверяем, что фокус не в поле ввода
      const activeElement = document.activeElement
      const isInInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true"

      if (isInInput) return

      // Cmd+A (macOS) или Ctrl+A (Windows/Linux) - выбрать все
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        // Только для вкладки media
        if (activeTab === "media" && mediaPool.size > 0) {
          event.preventDefault()
          const allFileIds = Array.from(mediaPool.keys())
          void selectAllFiles(allFileIds)
        }
      }

      // Delete или Backspace - удалить выбранные файлы
      if (event.key === "Delete" || event.key === "Backspace") {
        // Только для вкладки media и если есть выбранные файлы
        if (activeTab === "media" && selectedFiles.size > 0) {
          event.preventDefault()
          const selectedIds = Array.from(selectedFiles)
          void removeMultipleMedia(selectedIds).then(() => {
            // Очищаем выбор после удаления
            void deselectAllFiles()
          })
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, mediaPool, selectAllFiles, selectedFiles, removeMultipleMedia, deselectAllFiles])

  // Используем useCallback для стабильных ссылок на функции
  const handleSearch = useCallback((query: string) => setSearchQuery(query), [setSearchQuery])

  const handleSort = useCallback((sortBy: string, sortOrder: "asc" | "desc") => setSort(sortBy, sortOrder), [setSort])

  const handleFilter = useCallback((filterType: string) => setFilter(filterType), [setFilter])

  const handleViewModeChange = useCallback(
    (mode: "list" | "grid" | "thumbnails") => setViewMode(mode as any),
    [setViewMode],
  )

  const handleGroupBy = useCallback((groupBy: string) => setGroupBy(groupBy), [setGroupBy])

  const handleToggleFavorites = useCallback(() => toggleFavorites(), [toggleFavorites])

  const handleZoomIn = useCallback(() => {
    setPreviewSize(previewSizeIndex + 1)
  }, [previewSizeIndex, setPreviewSize])

  const handleZoomOut = useCallback(() => {
    setPreviewSize(previewSizeIndex - 1)
  }, [previewSizeIndex, setPreviewSize])

  return (
    <>
      {/* Индикатор загрузки ресурсов */}
      <BrowserLoadingIndicator />

      {/* Общий тулбар для всех вкладок */}
      <BrowserToolbarWrapper
        activeTab={activeTab}
        searchQuery={searchQuery}
        showFavoritesOnly={showFavoritesOnly}
        viewMode={viewMode}
        sortBy={sortBy}
        filterType={filterType}
        groupBy={groupBy}
        sortOrder={sortOrder}
        previewSizeIndex={previewSizeIndex}
        onSearch={handleSearch}
        onSort={handleSort}
        onFilter={handleFilter}
        onViewModeChange={handleViewModeChange}
        onGroupBy={handleGroupBy}
        onToggleFavorites={handleToggleFavorites}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        // Импорт медиа
        onImportMediaFile={activeTab === "media" ? importMediaFile : undefined}
        onImportMediaFolder={activeTab === "media" ? importMediaFolder : undefined}
        isImportingMedia={activeTab === "media" ? isImportingMedia : false}
        // Импорт музыки
        onImportMusicFile={activeTab === "music" ? importMusicFile : undefined}
        onImportMusicFolder={activeTab === "music" ? importMusicFolder : undefined}
        isImportingMusic={activeTab === "music" ? isImportingMusic : false}
      />

      {/* Контент только для активной вкладки */}
      <TabContentContainer activeTab={activeTab} />
    </>
  )
})

BrowserContent.displayName = "BrowserContent"
