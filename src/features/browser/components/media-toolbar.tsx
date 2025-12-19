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
    <div className={cn("flex items-center justify-between py-2 px-1 bg-background", className)} data-oid="a5p74a5">
      <div className="flex h-7 w-[calc(100%-100px)] items-center gap-2" data-oid=":u8o629">
        {/* Кнопка импорта */}
        {showImport && onImportFile && (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex cursor-pointer items-center gap-1 bg-[#DDDDDD] px-1 h-7 text-xs hover:bg-[#D1D1D1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25 dark:text-teal rounded-sm",
              isImporting && "opacity-70 cursor-wait",
            )}
            onClick={onImportFile}
            disabled={isImporting}
            data-oid="k7q0n61"
          >
            <span className="px-2 text-xs" data-oid="we0kgdv">
              {isImporting ? t("common.importing") || "Importing..." : t("common.import")}
            </span>
            <div className="flex items-center gap-1" data-oid="uk-9t7e">
              {onImportFile && (
                <Tooltip data-oid="go-jbjm">
                  <TooltipTrigger asChild data-oid=".-qx.o0">
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
                      data-oid="3.rk:xk"
                    >
                      <File size={12} className={isImporting ? "animate-pulse" : ""} data-oid="o5ozkww" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent data-oid="cx4dtcj">{t("browser.media.addMedia")}</TooltipContent>
                </Tooltip>
              )}
              {onImportFolder && (
                <Tooltip data-oid="p1.0vzv">
                  <TooltipTrigger asChild data-oid=".wqw_yo">
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
                      data-oid="vqb7s9e"
                    >
                      <Folder size={12} className={isImporting ? "animate-pulse" : ""} data-oid="bbx0q-j" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent data-oid="s4xq7tx">{t("browser.media.addFolder")}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </Button>
        )}

        {/* Поле поиска */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-2 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          value={searchQuery}
          onChange={handleSearchChange}
          data-oid="zucufk1"
        />
      </div>

      <div className="flex items-end gap-2" data-oid="y:y:7m-">
        {/* Кнопка избранного */}
        <TooltipProvider data-oid="gtlnmr1">
          <Tooltip data-oid="tala:ca">
            <TooltipTrigger asChild data-oid="0-k2pni">
              <Button
                variant="ghost"
                size="icon"
                className={cn("mr-1 h-6 w-6 cursor-pointer", showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "")}
                onClick={onToggleFavorites}
                data-oid="lx3fp6p"
              >
                <Star size={16} className={showFavoritesOnly ? "fill-current" : ""} data-oid="ttl-hnv" />
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="dwbnc9s">{t("browser.media.favorites")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Кнопки режима отображения - показываем только если режимов больше одного */}
        {viewModes.length > 1 && (
          <TooltipProvider data-oid=":k3gkfw">
            <div className="flex overflow-hidden rounded-md" data-oid="flh4wpt">
              {viewModes.map((mode, index) => {
                const IconComponent = mode.icon
                return (
                  <Tooltip key={mode.value} data-oid="la6ihkx">
                    <TooltipTrigger asChild data-oid="5dc:mtr">
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
                        data-oid="gqpbrct"
                      >
                        <IconComponent size={16} data-oid="5p.j4fn" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent data-oid="o9x-cm:">{t(mode.label)}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </TooltipProvider>
        )}

        {/* Dropdown сортировки */}
        <TooltipProvider data-oid="ij4jj.e">
          <Tooltip data-oid="xzuyd38">
            <DropdownMenu data-oid="z7imtf7">
              <TooltipTrigger asChild data-oid="d8dfpbc">
                <DropdownMenuTrigger asChild data-oid="tm6p1h5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      sortBy !== sortOptions[0]?.value ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                    data-oid="i2pb9h3"
                  >
                    <SortDesc size={16} data-oid="ha3vq16" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent data-oid="upiaone">{t("browser.toolbar.sort")}</TooltipContent>
              <DropdownMenuContent className="space-y-1" align="end" data-oid="7uqpjor">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    className="h-6 cursor-pointer"
                    onClick={() => onSort(option.value)}
                    data-oid="3-pqyrb"
                  >
                    <div className="flex items-center gap-2" data-oid="2y2sxcs">
                      {sortBy === option.value && <Check className="h-4 w-4" data-oid="2_6oj6z" />}
                      <span data-oid="7gw4nfo">{t(option.label)}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Dropdown фильтрации */}
        <TooltipProvider data-oid="sfyh4v1">
          <Tooltip data-oid="6u8lc:u">
            <DropdownMenu data-oid="mj0gf1q">
              <TooltipTrigger asChild data-oid="j4tggzs">
                <DropdownMenuTrigger asChild data-oid="7:5gw9r">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 cursor-pointer",
                      filterType !== "all" ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                    data-oid="6_225ti"
                  >
                    <Filter size={16} data-oid="4g55g4-" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent data-oid="95_5i6f">{t("browser.toolbar.filter")}</TooltipContent>
              <DropdownMenuContent align="end" data-oid="2qa6aen">
                <DropdownMenuItem onClick={() => onFilter("all")} data-oid=".82q4g3">
                  <div className="flex items-center gap-2" data-oid="i1z42w4">
                    {filterType === "all" && <Check className="h-4 w-4" data-oid="qigk8lc" />}
                    <span data-oid="xljik82">{t("browser.toolbar.filterBy.all")}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator data-oid="vlm.hf2" />

                {/* Кастомные опции фильтров (для медиа) */}
                {filterOptions
                  ? filterOptions.map((option) => (
                      <DropdownMenuItem key={option.value} onClick={() => onFilter(option.value)} data-oid="3m8_f6l">
                        <div className="flex items-center gap-2" data-oid="09bg316">
                          {filterType === option.value && <Check className="h-4 w-4" data-oid="p4g_qn7" />}
                          <span data-oid="6ge-k-g">{t(option.label)}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  : /* Дефолтные фильтры по расширениям (для музыки) */
                    availableExtensions.map((extension) => (
                      <DropdownMenuItem key={extension} onClick={() => onFilter(extension)} data-oid="p6gmop7">
                        <div className="flex items-center gap-2" data-oid="tqvxn42">
                          {filterType === extension && <Check className="h-4 w-4" data-oid="dtjh6tv" />}
                          <span data-oid="26qj_71">{extension.toUpperCase()}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Tooltip>
        </TooltipProvider>

        {/* Dropdown группировки */}
        {showGroupBy && (
          <TooltipProvider data-oid="8p_1p1i">
            <Tooltip data-oid="p6b08mf">
              <DropdownMenu data-oid="gjoqkb5">
                <TooltipTrigger asChild data-oid="d2hobm3">
                  <DropdownMenuTrigger asChild data-oid="zfzho_a">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 cursor-pointer",
                        groupBy !== groupOptions[0]?.value ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                      )}
                      data-oid="gjyzp3r"
                    >
                      <ListFilterPlus size={16} data-oid="hrb40xs" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent data-oid="_toefw9">{t("browser.toolbar.group")}</TooltipContent>
                <DropdownMenuContent align="end" data-oid="tzb1p4a">
                  {groupOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onChangeGroupBy(option.value)}
                      data-oid="t0cy7oy"
                    >
                      <div className="flex items-center gap-2" data-oid="lwaiv8d">
                        {groupBy === option.value && <Check className="h-4 w-4" data-oid="7m07b9j" />}
                        <span data-oid="io88ga1">{t(option.label)}</span>
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
          <TooltipProvider data-oid="na6sxns">
            <div className="ml-1 flex overflow-hidden rounded-md" data-oid="lx3skqg">
              <Tooltip data-oid="98.cysw">
                <TooltipTrigger asChild data-oid="h.8uj4q">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("mr-1 h-6 w-6 cursor-pointer", !canZoomOut && "cursor-not-allowed opacity-50")}
                    onClick={onZoomOut}
                    disabled={!canZoomOut}
                    data-oid="9hx-j69"
                  >
                    <ZoomOut size={16} data-oid="p3k0g19" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="vvz7v3t">{t("browser.toolbar.zoomOut")}</TooltipContent>
              </Tooltip>

              <Tooltip data-oid="wqihef:">
                <TooltipTrigger asChild data-oid="iu5qzc1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("mr-1 h-6 w-6 cursor-pointer", !canZoomIn && "cursor-not-allowed opacity-50")}
                    onClick={onZoomIn}
                    disabled={!canZoomIn}
                    data-oid="lzbx249"
                  >
                    <ZoomIn size={16} data-oid="6jzapwa" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent data-oid="omw00:-">{t("browser.toolbar.zoomIn")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}

        {/* Кнопка изменения порядка сортировки */}
        <TooltipProvider data-oid="fy4_nux">
          <Tooltip data-oid="236yh7h">
            <TooltipTrigger asChild data-oid="30wp-ed">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
                onClick={onChangeOrder}
                data-oid="q76e_xw"
              >
                {sortOrder === "asc" ? (
                  <ArrowDownUp size={16} data-oid="8322zyx" />
                ) : (
                  <ArrowUpDown size={16} data-oid="ggo0xj4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent data-oid="q.anked">
              {sortOrder === "asc" ? t("browser.toolbar.sortOrder.desc") : t("browser.toolbar.sortOrder.asc")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Дополнительные кнопки для конкретных вкладок (в конце тулбара) */}
        {extraButtons}
      </div>
    </div>
  )
}
