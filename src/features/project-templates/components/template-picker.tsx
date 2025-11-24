/**
 * Template Picker Component
 * UI для выбора шаблона проекта с фильтрами и поиском
 */

import { Filter, Grid, List, Search, X } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { type UseTemplatePickerOptions, useTemplatePicker } from "../hooks/use-template-picker"
import type { ProjectTemplate } from "../types/project-template"

export interface TemplatePickerProps extends UseTemplatePickerOptions {
  /** Показывать заголовок */
  showHeader?: boolean

  /** Показывать фильтры */
  showFilters?: boolean

  /** Callback при закрытии */
  onClose?: () => void

  /** Высота компонента */
  height?: string | number
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({
  initialFilter,
  initialCategory,
  mode = "single",
  onSelect,
  onSelectionChange,
  showHeader = true,
  showFilters = true,
  onClose,
  height = "600px",
}) => {
  const {
    templates,
    selectedTemplates,
    categories,
    platforms,
    currentCategory,
    currentPlatform,
    searchQuery,
    viewMode,
    selectTemplate,
    toggleTemplate,
    clearSelection,
    isSelected,
    setCategory,
    setPlatform,
    setSearchQuery,
    clearFilters,
    setViewMode,
  } = useTemplatePicker({
    initialFilter,
    initialCategory,
    mode,
    onSelect,
    onSelectionChange,
  })

  const [filtersOpen, setFiltersOpen] = useState(false)

  /**
   * Обработчик выбора шаблона
   */
  const handleTemplateClick = useCallback(
    (template: ProjectTemplate) => {
      if (mode === "single") {
        selectTemplate(template)
        onClose?.()
      } else {
        toggleTemplate(template)
      }
    },
    [mode, selectTemplate, toggleTemplate, onClose],
  )

  /**
   * Очистка всех фильтров
   */
  const handleClearFilters = useCallback(() => {
    clearFilters()
    setSearchQuery("")
  }, [clearFilters, setSearchQuery])

  return (
    <div className="flex h-full flex-col" style={{ height }}>
      {/* Header */}
      {showHeader && (
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Шаблоны проектов</h2>
              <p className="text-muted-foreground text-sm">Выберите шаблон для быстрого старта проекта</p>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b p-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" />
          <Input
            placeholder="Поиск шаблонов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
          <TabsList>
            <TabsTrigger value="grid">
              <Grid className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters toggle */}
        {showFilters && (
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                {/* Category filter */}
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select value={currentCategory || "all"} onValueChange={(v) => setCategory(v === "all" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform filter */}
                <div className="space-y-2">
                  <Label>Платформа</Label>
                  <Select value={currentPlatform || "all"} onValueChange={(v) => setPlatform(v === "all" ? null : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все платформы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все платформы</SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Clear filters button */}
                <Button variant="outline" className="w-full" onClick={handleClearFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Templates grid/list */}
      <div className="flex-1 overflow-y-auto p-4">
        {templates.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center">
            <p>Шаблоны не найдены</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={isSelected(template.id)}
                onClick={() => handleTemplateClick(template)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                selected={isSelected(template.id)}
                onClick={() => handleTemplateClick(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with selection info */}
      {mode === "multiple" && selectedTemplates.length > 0 && (
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{selectedTemplates.length}</span>{" "}
              {selectedTemplates.length === 1 ? "шаблон выбран" : "шаблонов выбрано"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearSelection}>
                Очистить
              </Button>
              <Button onClick={onClose}>Продолжить</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Template Card Component - Grid view
 */
interface TemplateCardProps {
  template: ProjectTemplate
  selected: boolean
  onClick: () => void
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, selected, onClick }) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? "border-primary ring-2 ring-primary ring-offset-2" : ""}`}
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{template.name.ru || template.name.en}</span>
          {template.targetPlatform && (
            <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">{template.targetPlatform}</span>
          )}
        </CardTitle>
        <CardDescription>{template.description?.ru || template.description?.en || ""}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Категория:</span>
            <span className="font-medium">{template.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Длительность:</span>
            <span className="font-medium">
              {Math.floor(template.estimatedDuration / 60)}: {String(template.estimatedDuration % 60).padStart(2, "0")}{" "}
              мин
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Разрешение:</span>
            <span className="font-medium">
              {template.settings.resolution.width}x{template.settings.resolution.height}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Template List Item Component - List view
 */
interface TemplateListItemProps {
  template: ProjectTemplate
  selected: boolean
  onClick: () => void
}

const TemplateListItem: React.FC<TemplateListItemProps> = ({ template, selected, onClick }) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-sm ${selected ? "border-primary ring-2 ring-primary" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{template.name.ru || template.name.en}</h3>
              {template.targetPlatform && (
                <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs">{template.targetPlatform}</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {template.description?.ru || template.description?.en || ""}
            </p>
          </div>
          <div className="text-muted-foreground flex gap-4 text-sm">
            <div>
              <div className="font-medium">{template.category}</div>
              <div>Категория</div>
            </div>
            <div>
              <div className="font-medium">
                {template.settings.resolution.width}x{template.settings.resolution.height}
              </div>
              <div>Разрешение</div>
            </div>
            <div>
              <div className="font-medium">
                {Math.floor(template.estimatedDuration / 60)}:{" "}
                {String(template.estimatedDuration % 60).padStart(2, "0")}
              </div>
              <div>Длительность</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
