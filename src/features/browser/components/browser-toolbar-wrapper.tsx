import { memo } from "react"
import { BrowserTab } from "@/domains/browser"
import { MediaToolbar } from "@/features/browser/components/media-toolbar"
import { getToolbarConfigForContent } from "@/features/browser/components/media-toolbar-configs"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"

interface BrowserToolbarWrapperProps {
  activeTab: BrowserTab
  searchQuery: string
  showFavoritesOnly: boolean
  viewMode: "list" | "grid" | "thumbnails"
  sortBy: string
  filterType: string
  groupBy: string
  sortOrder: "asc" | "desc"
  previewSizeIndex: number
  onSearch: (query: string) => void
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void
  onFilter: (filterType: string) => void
  onViewModeChange: (mode: "list" | "grid" | "thumbnails") => void
  onGroupBy: (groupBy: string) => void
  onToggleFavorites: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

/**
 * Обертка для тулбара браузера, чтобы изолировать ререндеры
 */
export const BrowserToolbarWrapper = memo(
  ({
    activeTab,
    searchQuery,
    showFavoritesOnly,
    viewMode,
    sortBy,
    filterType,
    groupBy,
    sortOrder,
    previewSizeIndex,
    onSearch,
    onSort,
    onFilter,
    onViewModeChange,
    onGroupBy,
    onToggleFavorites,
    onZoomIn,
    onZoomOut,
  }: BrowserToolbarWrapperProps) => {
    // Получаем конфигурацию тулбара для текущей вкладки
    const toolbarConfig = getToolbarConfigForContent(activeTab)

    const handleChangeOrder = () => {
      const newOrder = sortOrder === "asc" ? "desc" : "asc"
      onSort(sortBy, newOrder)
    }

    const canZoomIn = previewSizeIndex < PREVIEW_SIZES.length - 1
    const canZoomOut = previewSizeIndex > 0

    return (
      <MediaToolbar
        // Состояние
        searchQuery={searchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterType={filterType}
        groupBy={groupBy}
        viewMode={viewMode}
        showFavoritesOnly={showFavoritesOnly}
        // Конфигурация из toolbarConfig
        availableExtensions={[]}
        sortOptions={toolbarConfig.sortOptions}
        groupOptions={toolbarConfig.groupOptions}
        filterOptions={toolbarConfig.filterOptions}
        availableViewModes={toolbarConfig.viewModes}
        // Настройки отображения
        showImport={activeTab === "media" || activeTab === "music"}
        showGroupBy={toolbarConfig.showGroupBy}
        showZoom={toolbarConfig.showZoom}
        // Колбэки
        onSearch={onSearch}
        onSort={(sortBy) => onSort(sortBy, sortOrder)}
        onFilter={onFilter}
        onChangeOrder={handleChangeOrder}
        onChangeViewMode={onViewModeChange}
        onChangeGroupBy={onGroupBy}
        onToggleFavorites={onToggleFavorites}
        // Импорт (пока отключен, так как адаптеры загружаются лениво)
        onImportFile={undefined}
        onImportFolder={undefined}
        isImporting={false}
        // Зум
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
      />
    )
  },
)

BrowserToolbarWrapper.displayName = "BrowserToolbarWrapper"
