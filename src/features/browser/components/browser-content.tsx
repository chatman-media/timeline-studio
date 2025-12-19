import { Trash2 } from "lucide-react"
import { memo, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useBrowserState } from "@/domains/browser"
import { useMediaImport, useMediaManagement } from "@/domains/media-management"
import { useMusicImport } from "@/features/browser/hooks/use-music-import"
import { DeveloperToolsButton, DeveloperToolsModal } from "@/features/developer-tools"

import { BrowserLoadingIndicator } from "./browser-loading-indicator"
import { BrowserToolbarWrapper } from "./browser-toolbar-wrapper"
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

  const contentClassName = "bg-background m-0 px-0.5 flex-1 overflow-auto"

  return (
    <div className={contentClassName} data-oid="8qkh7.t">
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
  const { selectMediaFiles, isImporting: isImportingMedia } = useMediaImport()

  // Wrapper функции для импорта медиа
  const importMediaFile = useCallback(() => selectMediaFiles(), [selectMediaFiles])
  const importMediaFolder = useCallback(() => selectMediaFiles(), [selectMediaFiles])

  // Импорт музыки
  const {
    importFile: importMusicFile,
    importDirectory: importMusicFolder,
    isImporting: isImportingMusic,
  } = useMusicImport()

  // Обработчик очистки выбранных медиафайлов
  const handleClearSelectedMedia = useCallback(async () => {
    if (selectedFiles.size === 0) return

    const selectedIds = Array.from(selectedFiles)
    await removeMultipleMedia(selectedIds)
    await deselectAllFiles()
  }, [selectedFiles, removeMultipleMedia, deselectAllFiles])

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

  // Дополнительные кнопки для разных вкладок
  const extraButtons =
    activeTab === "effects" ? (
      <DeveloperToolsButton onClick={() => setShowDeveloperTools(true)} data-oid=":hl:yjm" />
    ) : activeTab === "media" && selectedFiles.size > 0 ? (
      <AlertDialog data-oid="4ewytq3">
        <Tooltip data-oid="ledfi0a">
          <TooltipTrigger asChild data-oid="01a9u4e">
            <AlertDialogTrigger asChild data-oid="2rq:qhd">
              <Button variant="ghost" size="icon" className="ml-2 h-6 w-6 cursor-pointer" data-oid="m_9f.n2">
                <Trash2 className="h-4 w-4" data-oid="w36j1g6" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent data-oid="q:xmres">{t("browser.clearSelected")}</TooltipContent>
        </Tooltip>
        <AlertDialogContent data-oid=":6.44mj">
          <AlertDialogHeader data-oid="i9i:5vw">
            <AlertDialogTitle data-oid="ewft_c9">{t("browser.clearSelectedConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription data-oid="4t3cl-w">
              {t("browser.clearSelectedConfirm.description")} ({selectedFiles.size}{" "}
              {t("common.files", { count: selectedFiles.size })})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="e6pz-3p">
            <AlertDialogCancel data-oid="-28qwvq">{t("browser.clearSelectedConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearSelectedMedia} data-oid="w.5goab">
              {t("browser.clearSelectedConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

      {/* Developer Tools модалка */}
      <DeveloperToolsModal open={showDeveloperTools} onOpenChange={setShowDeveloperTools} data-oid="aicu1h4" />
    </>
  )
})

BrowserContent.displayName = "BrowserContent"
