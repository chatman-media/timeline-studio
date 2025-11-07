import { memo, useCallback } from "react"

import { useBrowserState } from "@/domains/browser"

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
  } = useBrowserState()

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
      />

      {/* Контент только для активной вкладки */}
      <TabContentContainer activeTab={activeTab} />
    </>
  )
})

BrowserContent.displayName = "BrowserContent"
