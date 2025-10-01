import {
  ArrowDownUp,
  ArrowUpDown,
  Check,
  File,
  Filter,
  Folder,
  Grid2x2,
  List,
  ListFilterPlus,
  SortDesc,
  Star,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ViewMode } from "@/domains/browser"
import { cn } from "@/lib/utils"

// Конфигурация режимов просмотра
export interface ViewModeConfig {
  value: ViewMode
  icon: React.ComponentType<{ size?: number }>
  label: string
  testId?: string
}

export interface MediaToolbarProps {
  // Состояние
  searchQuery: string
  sortBy: string
  sortOrder: "asc" | "desc"
  filterType: string
  viewMode: ViewMode
  groupBy: string
  availableExtensions: string[]
  showFavoritesOnly: boolean

  // Опции для сортировки
  sortOptions: Array<{
    value: string
    label: string
  }>

  // Опции для группировки
  groupOptions: Array<{
    value: string
    label: string
  }>

  // Опции для фильтрации (опционально, для медиа)
  filterOptions?: Array<{
    value: string
    label: string
  }>

  // Доступные режимы просмотра (настраивается для каждой вкладки)
  availableViewModes?: ViewModeConfig[]

  // Колбэки
  onSearch: (query: string) => void
  onSort: (sortBy: string) => void
  onFilter: (filterType: string) => void
  onChangeOrder: () => void
  onChangeViewMode: (mode: ViewMode) => void
  onChangeGroupBy: (groupBy: string) => void
  onToggleFavorites: () => void

  // Импорт (опционально)
  onImportFile?: () => void
  onImportFolder?: () => void
  isImporting?: boolean

  // Зум (опционально, для медиа)
  onZoomIn?: () => void
  onZoomOut?: () => void
  canZoomIn?: boolean
  canZoomOut?: boolean

  // Настройки отображения
  showImport?: boolean
  showGroupBy?: boolean
  showZoom?: boolean
  className?: string

  // Дополнительные кнопки для конкретных вкладок
  extraButtons?: React.ReactNode
}

/**
 * Универсальный компонент тулбара для медиа и музыки
 * Предоставляет общую функциональность: поиск, сортировка, фильтрация, группировка
 */
export function MediaToolbar({
  // Состояние
  searchQuery,
  sortBy,
  sortOrder,
  filterType,
  viewMode,
  groupBy,
  availableExtensions,
  showFavoritesOnly,

  // Опции
  sortOptions,
  groupOptions,
  filterOptions,
  availableViewModes,

  // Колбэки
  onSearch,
  onSort,
  onFilter,
  onChangeOrder,
  onChangeViewMode,
  onChangeGroupBy,
  onToggleFavorites,

  // Импорт
  onImportFile,
  onImportFolder,
  isImporting = false,

  // Зум
  onZoomIn,
  onZoomOut,
  canZoomIn = false,
  canZoomOut = false,

  // Настройки
  showImport = true,
  showGroupBy = true,
  showZoom = false,
  className,

  // Дополнительные кнопки
  extraButtons,
}: MediaToolbarProps) {
  const { t } = useTranslation()

  // Дефолтные режимы просмотра (если не переданы)
  const defaultViewModes: ViewModeConfig[] = [
    {
      value: "list",
      icon: List,
      label: "browser.toolbar.list",
      testId: "list-view-button",
    },
    {
      value: "thumbnails",
      icon: Grid2x2,
      label: "browser.toolbar.thumbnails",
      testId: "thumbnails-view-button",
    },
  ]

  // Используем переданные режимы или дефолтные
  const viewModes = availableViewModes || defaultViewModes

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value)
  }

  return (
    <div className={cn("flex items-center justify-between py-2 px-1 bg-background", className)}>
      <div className="flex h-7 w-[calc(100%-100px)] items-center gap-2">
        {/* Кнопка импорта */}
        {showImport && onImportFile && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex cursor-pointer items-center gap-1 bg-[#DDDDDD] px-1 h-7 ml-1 text-xs hover:bg-[#D1D1D1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25 dark:text-teal rounded-sm",
              isImporting && "opacity-70 cursor-wait",
            )}
            onClick={onImportFile}
            disabled={isImporting}
          >
            <span className="px-2 text-xs">
              {isImporting ? t("common.importing") || "Importing..." : t("common.import")}
            </span>
            <div className="flex items-center gap-1">
              {onImportFile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "cursor-pointer rounded-sm p-0.5 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25",
                        isImporting && "opacity-50 cursor-wait",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isImporting) onImportFile()
                      }}
                      data-testid="add-media-button"
                    >
                      <File size={12} className={isImporting ? "animate-pulse" : ""} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t("browser.media.addMedia")}</TooltipContent>
                </Tooltip>
              )}
              {onImportFolder && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "cursor-pointer rounded-sm p-0.5 hover:bg-[#efefef] dark:hover:bg-[#dddbdd]/25",
                        isImporting && "opacity-50 cursor-wait",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!isImporting) onImportFolder()
                      }}
                      data-testid="add-folder-button"
                    >
                      <Folder size={12} className={isImporting ? "animate-pulse" : ""} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t("browser.media.addFolder")}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </Button>
        )}

        {/* Поле поиска */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="flex items-end gap-2">
        {/* Дополнительные кнопки для конкретных вкладок */}
        {extraButtons}

        {/* Кнопка избранного */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("mr-1 h-6 w-6 cursor-pointer", showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "")}
                onClick={onToggleFavorites}
              >
                <Star size={16} className={showFavoritesOnly ? "fill-current" : ""} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("browser.media.favorites")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Кнопки режима отображения - показываем только если режимов больше одного */}
        {viewModes.length > 1 && (
          <TooltipProvider>
            <div className="flex overflow-hidden rounded-md">
              {viewModes.map((mode, index) => {
                const IconComponent = mode.icon
                return (
                  <Tooltip key={mode.value}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6 cursor-pointer",
                          index < viewModes.length - 1 ? "mr-1" : "mr-1",
                          viewMode === mode.value && "bg-[#dddbdd] dark:bg-[#45444b]",
                        )}
                        onClick={() => onChangeViewMode(mode.value)}
                        data-testid={mode.testId}
                      >
                        <IconComponent size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t(mode.label)}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>
        )}

        {/* Dropdown сортировки */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      sortBy !== sortOptions[0]?.value ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                  >
                    <SortDesc size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.sort")}</TooltipContent>
              <DropdownMenuContent className="space-y-1" align="end">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className="h-6 cursor-pointer"
                    onClick={() => onSort(option.value)}
                  >
                    <div className="flex items-center gap-2">
                      {sortBy === option.value && <Check className="h-4 w-4" />}
                      <span>{t(option.label)}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Dropdown фильтрации */}
        <TooltipProvider>
          <Tooltip>
            <DropdownMenu>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      filterType !== "all" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                  >
                    <Filter size={16} />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>{t("browser.toolbar.filter")}</TooltipContent>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFilter("all")}>
                  <div className="flex items-center gap-2">
                    {filterType === "all" && <Check className="h-4 w-4" />}
                    <span>{t("browser.toolbar.filterBy.all")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Кастомные опции фильтров (для медиа) */}
                {filterOptions
                  ? filterOptions.map((option) => (
                      <DropdownMenuItem key={option.value} onClick={() => onFilter(option.value)}>
                        <div className="flex items-center gap-2">
                          {filterType === option.value && <Check className="h-4 w-4" />}
                          <span>{t(option.label)}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  : /* Дефолтные фильтры по расширениям (для музыки) */
                    availableExtensions.map((extension) => (
                      <DropdownMenuItem key={extension} onClick={() => onFilter(extension)}>
                        <div className="flex items-center gap-2">
                          {filterType === extension && <Check className="h-4 w-4" />}
                          <span>{extension.toUpperCase()}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Dropdown группировки */}
        {showGroupBy && (
          <TooltipProvider>
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 cursor-pointer",
                        groupBy !== groupOptions[0]?.value ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                      )}
                    >
                      <ListFilterPlus size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.group")}</TooltipContent>
                <DropdownMenuContent align="end">
                  {groupOptions.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => onChangeGroupBy(option.value)}>
                      <div className="flex items-center gap-2">
                        {groupBy === option.value && <Check className="h-4 w-4" />}
                        <span>{t(option.label)}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Кнопки зума */}
        {showZoom && (
          <TooltipProvider>
            <div className="ml-1 flex overflow-hidden rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("mr-1 h-6 w-6 cursor-pointer", !canZoomOut && "cursor-not-allowed opacity-50")}
                    onClick={onZoomOut}
                    disabled={!canZoomOut}
                  >
                    <ZoomOut size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomOut")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("mr-1 h-6 w-6 cursor-pointer", !canZoomIn && "cursor-not-allowed opacity-50")}
                    onClick={onZoomIn}
                    disabled={!canZoomIn}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomIn")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        {/* Кнопка изменения порядка сортировки */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer" onClick={onChangeOrder}>
                {sortOrder === "asc" ? <ArrowDownUp size={16} /> : <ArrowUpDown size={16} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sortOrder === "asc" ? t("browser.toolbar.sortOrder.desc") : t("browser.toolbar.sortOrder.asc")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}
