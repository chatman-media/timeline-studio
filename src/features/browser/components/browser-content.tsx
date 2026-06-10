import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMusicImport } from "@/features/browser/hooks/use-music-import"
import { useBrowserState } from "@/features/browser/services"
import { DeveloperToolsButton, DeveloperToolsModal } from "@/features/developer-tools"
import { useMediaImport, useMediaManagement } from "@/features/media/hooks/media-management"

import { BrowserLoadingIndicator } from "./browser-loading-indicator"
import { BrowserToolbarWrapper } from "./browser-toolbar-wrapper"
import { MediaStatusBarWrapper } from "./layout/media-status-bar-wrapper"
import { LazyTabContent } from "./lazy-tab-content"

/**
 * Список всех возможных вкладок браузера
 */
const ALL_BROWSER_TABS = [
  "media",
  "music",
  "effects",
  "filters",
  "transitions",
  "subtitles",
  "templates",
  "style_templates",
] as const

/**
 * Контейнер для контента вкладок с кэшированием
 * Сохраняет посещённые вкладки смонтированными, скрывая их через CSS
 */
const TabContentContainer = memo(({ activeTab }: { activeTab: string }) => {
  // Отслеживаем какие вкладки уже были посещены
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set([activeTab]))

  // Добавляем новую вкладку в посещённые при её активации
  useEffect(() => {
    setVisitedTabs((prev) => {
      if (prev.has(activeTab)) return prev
      const next = new Set(prev)
      next.add(activeTab)
      return next
    })
  }, [activeTab])

  const containerRef = useRef<HTMLDivElement>(null)

  // Блокируем скролл во время drag чтобы не скроллился браузер при перетаскивании
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleDragStart = () => {
      // Блокируем скролл на контейнере во время drag
      container.style.overflow = "hidden"
      container.style.overscrollBehavior = "contain"
    }

    const handleDragEnd = () => {
      // Восстанавливаем скролл после окончания drag
      container.style.overflow = "auto"
      container.style.overscrollBehavior = ""
    }

    // Слушаем события на document чтобы ловить drag из любого места
    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("dragend", handleDragEnd)
    document.addEventListener("drop", handleDragEnd)

    return () => {
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("dragend", handleDragEnd)
      document.removeEventListener("drop", handleDragEnd)
    }
  }, [])

  const contentClassName = "bg-background m-0 px-1.5 flex-1 overflow-auto overscroll-contain"

  return (
    <div ref={containerRef} className={contentClassName} data-oid="8qkh7.t">
      {ALL_BROWSER_TABS.map((tabValue) => {
        // Рендерим только посещённые вкладки
        if (!visitedTabs.has(tabValue)) return null

        return <LazyTabContent key={tabValue} tabValue={tabValue} activeTab={activeTab} data-oid="jocd.dx" />
      })}
    </div>
  )
})

TabContentContainer.displayName = "TabContentContainer"

/**
 * Новая версия BrowserContent с использованием UniversalList и адаптеров
 * Поддерживает все типы контента через единую архитектуру
 */
export const BrowserContent = memo(() => {
  const { t } = useTranslation()

  // Developer Tools модалка
  const [showDeveloperTools, setShowDeveloperTools] = useState(false)

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
    resetTabSettings,
  } = useBrowserState()

  // TEMPORARY: Reset media tab settings to fix view_mode
  useEffect(() => {
    const resetOnce = async () => {
      const hasReset = localStorage.getItem("browser_media_reset_20250122")
      if (!hasReset) {
        await resetTabSettings("media")
        localStorage.setItem("browser_media_reset_20250122", "true")
        console.log("✅ Media tab settings reset to defaults")
      }
    }
    void resetOnce()
  }, [resetTabSettings])

  // Получаем mediaPool для Cmd+A
  const { mediaPool } = useMediaManagement()

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
  const { selectMediaFiles, selectMediaDirectory, isImporting: isImportingMedia } = useMediaImport()

  // Wrapper функции для импорта медиа
  const importMediaFile = useCallback(() => selectMediaFiles(), [selectMediaFiles])
  const importMediaFolder = useCallback(() => selectMediaDirectory(), [selectMediaDirectory])

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
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [activeTab, mediaPool, selectAllFiles])

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

  // Дополнительные кнопки для разных вкладок
  // Удаление медиа доступно только через контекстное меню
  const extraButtons =
    activeTab === "effects" ? (
      <DeveloperToolsButton onClick={() => setShowDeveloperTools(true)} data-oid=":hl:yjm" />
    ) : undefined

  return (
    <>
      {/* Индикатор загрузки ресурсов */}
      <BrowserLoadingIndicator data-oid="stnv5za" />

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
        // Импорт медиа (всегда доступен)
        onImportMediaFile={importMediaFile}
        onImportMediaFolder={importMediaFolder}
        isImportingMedia={isImportingMedia}
        // Импорт музыки (всегда доступен)
        onImportMusicFile={importMusicFile}
        onImportMusicFolder={importMusicFolder}
        isImportingMusic={isImportingMusic}
        // Дополнительные кнопки для конкретных вкладок
        extraButtons={extraButtons}
        data-oid="zt0-4u3"
      />

      {/* Контент только для активной вкладки */}
      <TabContentContainer activeTab={activeTab} data-oid="35equkz" />

      {/* Статус бар для media вкладки с bulk операциями */}
      {activeTab === "media" && <MediaStatusBarWrapper data-oid="media-status-bar-wrapper" />}

      {/* Developer Tools модалка */}
      <DeveloperToolsModal open={showDeveloperTools} onOpenChange={setShowDeveloperTools} data-oid="aicu1h4" />
    </>
  )
})

BrowserContent.displayName = "BrowserContent"
