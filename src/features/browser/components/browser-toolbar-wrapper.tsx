import { memo } from "react"
import type { BrowserTab } from "@/core/types"
import { MediaToolbar } from "@/features/browser/components/media-toolbar"
import { getToolbarConfigForContent } from "@/features/browser/components/media-toolbar-configs"
import { PREVIEW_SIZES } from "@/features/media/utils/preview-sizes"

interface BrowserToolbarWrapperProps {
  activeTab: BrowserTab
  searchQuery: string
  showFavoritesOnly: boolean
  viewMode: "list" | "thumbnails"
  sortBy: string
  filterType: string
  groupBy: string
  sortOrder: "asc" | "desc"
  previewSizeIndex: number
  onSearch: (query: string) => void
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void
  onFilter: (filterType: string) => void
  onViewModeChange: (mode: "list" | "thumbnails") => void
  onGroupBy: (groupBy: string) => void
  onToggleFavorites: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  // Импорт медиа
  onImportMediaFile?: () => void
  onImportMediaFolder?: () => void
  isImportingMedia?: boolean
  // Импорт музыки
  onImportMusicFile?: () => void
  onImportMusicFolder?: () => void
  isImportingMusic?: boolean
  // Дополнительные кнопки
  extraButtons?: React.ReactNode
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
    // Импорт
    onImportMediaFile,
    onImportMediaFolder,
    isImportingMedia,
    onImportMusicFile,
    onImportMusicFolder,
    isImportingMusic,
    // Дополнительные кнопки
    extraButtons,
  }: BrowserToolbarWrapperProps) => {
    // Получаем конфигурацию тулбара для текущей вкладки
    const toolbarConfig = getToolbarConfigForContent(
      activeTab as
        | "media"
        | "music"
        | "effects"
        | "filters"
        | "transitions"
        | "subtitles"
        | "templates"
        | "style_templates",
    )

    const handleChangeOrder = () => {
      const newOrder = sortOrder === "asc" ? "desc" : "asc"
      onSort(sortBy, newOrder)
    }

    const canZoomIn = previewSizeIndex < PREVIEW_SIZES.length - 1
    const canZoomOut = previewSizeIndex > 0

    // Определяем обработчики импорта в зависимости от активной вкладки
    const onImportFile =
      activeTab === "media" ? onImportMediaFile : activeTab === "music" ? onImportMusicFile : undefined
    const onImportFolder =
      activeTab === "media" ? onImportMediaFolder : activeTab === "music" ? onImportMusicFolder : undefined
    const isImporting = activeTab === "media" ? isImportingMedia : activeTab === "music" ? isImportingMusic : false

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
        // Импорт
        onImportFile={onImportFile}
        onImportFolder={onImportFolder}
        isImporting={isImporting}
        // Зум
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        // Дополнительные кнопки
        extraButtons={extraButtons}
        data-oid="sq:alxo"
      />
    )
  },
)

BrowserToolbarWrapper.displayName = "BrowserToolbarWrapper"
