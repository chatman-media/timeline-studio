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
    <div className="flex h-full flex-col" style={{ height }} data-oid="n4kbqi:">
      {/* Header */}
      {showHeader && (
        <div className="border-b p-4" data-oid="swqsn:f">
          <div className="flex items-center justify-between" data-oid="3ooj6z6">
            <div data-oid="9bj-tdg">
              <h2 className="text-2xl font-semibold" data-oid="ouct04i">
                Шаблоны проектов
              </h2>
              <p className="text-muted-foreground text-sm" data-oid="ue.leyz">
                Выберите шаблон для быстрого старта проекта
              </p>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} data-oid="txn586c">
                <X className="h-4 w-4" data-oid="id9608t" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b p-4" data-oid="fkx0_tw">
        {/* Search */}
        <div className="relative flex-1" data-oid="47dhfmn">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" data-oid="bm394gz" />
          <Input
            placeholder="Поиск шаблонов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
            data-oid="2n52z:w"
          />
        </div>

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} data-oid="gjd88wy">
          <TabsList data-oid="02w1s.r">
            <TabsTrigger value="grid" data-oid="ztiynin">
              <Grid className="h-4 w-4" data-oid="5w19i3-" />
            </TabsTrigger>
            <TabsTrigger value="list" data-oid=".szx27i">
              <List className="h-4 w-4" data-oid="ka6gnlb" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters toggle */}
        {showFilters && (
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen} data-oid="cgqnbsm">
            <PopoverTrigger asChild data-oid="uuz77cf">
              <Button variant="outline" size="icon" data-oid="sru20uq">
                <Filter className="h-4 w-4" data-oid="t7mzvd4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" data-oid="th5tn-u">
              <div className="space-y-4" data-oid="br25lk8">
                {/* Category filter */}
                <div className="space-y-2" data-oid="s__hc-8">
                  <Label data-oid="_e0g7rk">Категория</Label>
                  <Select
                    value={currentCategory || "all"}
                    onValueChange={(v) => setCategory(v === "all" ? null : v)}
                    data-oid="bv1512c"
                  >
                    <SelectTrigger data-oid="thkj51m">
                      <SelectValue placeholder="Все категории" data-oid="8-inudu" />
                    </SelectTrigger>
                    <SelectContent data-oid="eoyt694">
                      <SelectItem value="all" data-oid="ma:f9:h">
                        Все категории
                      </SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} data-oid="t4mf.g9">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Platform filter */}
                <div className="space-y-2" data-oid="t.0b.hi">
                  <Label data-oid="wrv7-_4">Платформа</Label>
                  <Select
                    value={currentPlatform || "all"}
                    onValueChange={(v) => setPlatform(v === "all" ? null : v)}
                    data-oid="e5.fkv5"
                  >
                    <SelectTrigger data-oid="aoepqtx">
                      <SelectValue placeholder="Все платформы" data-oid="kzv2ipg" />
                    </SelectTrigger>
                    <SelectContent data-oid=":se.66y">
                      <SelectItem value="all" data-oid="4bkpg3f">
                        Все платформы
                      </SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform} value={platform} data-oid="vkk_9j5">
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator data-oid=":h8l2p_" />

                {/* Clear filters button */}
                <Button variant="outline" className="w-full" onClick={handleClearFilters} data-oid=":-b8:-4">
                  Сбросить фильтры
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Templates grid/list */}
      <div className="flex-1 overflow-y-auto p-4" data-oid="5i.9du8">
        {templates.length === 0 ? (
          <div className="text-muted-foreground flex h-full items-center justify-center" data-oid="tofht6k">
            <p data-oid="zh-l61o">Шаблоны не найдены</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-oid="mj-b0zk">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={isSelected(template.id)}
                onClick={() => handleTemplateClick(template)}
                data-oid="futv6a."
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2" data-oid="ql1pf3.">
            {templates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                selected={isSelected(template.id)}
                onClick={() => handleTemplateClick(template)}
                data-oid="4aajsb_"
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer with selection info */}
      {mode === "multiple" && selectedTemplates.length > 0 && (
        <div className="border-t p-4" data-oid="t9a5vkp">
          <div className="flex items-center justify-between" data-oid="1cyslby">
            <div className="text-sm" data-oid="h._2om7">
              <span className="font-medium" data-oid="chkyhy-">
                {selectedTemplates.length}
              </span>{" "}
              {selectedTemplates.length === 1 ? "шаблон выбран" : "шаблонов выбрано"}
            </div>
            <div className="flex gap-2" data-oid="h_9h1zc">
              <Button variant="outline" onClick={clearSelection} data-oid="fs8:.ev">
                Очистить
              </Button>
              <Button onClick={onClose} data-oid="17y58nd">
                Продолжить
              </Button>
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
      data-oid="jokv5jj"
    >
      <CardHeader data-oid="wmasf98">
        <CardTitle className="flex items-center justify-between" data-oid="t8edt3:">
          <span data-oid="_6z2l6c">{template.name.ru || template.name.en}</span>
          {template.targetPlatform && (
            <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs" data-oid="v9a9-f7">
              {template.targetPlatform}
            </span>
          )}
        </CardTitle>
        <CardDescription data-oid="mui-yjy">
          {template.description?.ru || template.description?.en || ""}
        </CardDescription>
      </CardHeader>
      <CardContent data-oid="avuis1c">
        <div className="space-y-2 text-sm" data-oid="_n21rw.">
          <div className="flex justify-between" data-oid="r_alp-v">
            <span className="text-muted-foreground" data-oid="_arsmsm">
              Категория:
            </span>
            <span className="font-medium" data-oid="squg33g">
              {template.category}
            </span>
          </div>
          <div className="flex justify-between" data-oid="dhbn85n">
            <span className="text-muted-foreground" data-oid="vc80ek6">
              Длительность:
            </span>
            <span className="font-medium" data-oid="c:hn7hb">
              {Math.floor(template.estimatedDuration / 60)}: {String(template.estimatedDuration % 60).padStart(2, "0")}{" "}
              мин
            </span>
          </div>
          <div className="flex justify-between" data-oid="ptvdrei">
            <span className="text-muted-foreground" data-oid=":kbgm5o">
              Разрешение:
            </span>
            <span className="font-medium" data-oid="rp8dua3">
              {template.settings.resolution}
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
      data-oid="2zoq0c1"
    >
      <CardContent className="p-4" data-oid="-hqm_bn">
        <div className="flex items-center justify-between" data-oid="sts-fgl">
          <div className="flex-1" data-oid="3a731uk">
            <div className="flex items-center gap-2" data-oid="3wk0mu1">
              <h3 className="font-semibold" data-oid="1sy49sl">
                {template.name.ru || template.name.en}
              </h3>
              {template.targetPlatform && (
                <span className="bg-primary/10 text-primary rounded px-2 py-1 text-xs" data-oid="3wy9muh">
                  {template.targetPlatform}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm" data-oid="njl5a0n">
              {template.description?.ru || template.description?.en || ""}
            </p>
          </div>
          <div className="text-muted-foreground flex gap-4 text-sm" data-oid="9sbst4k">
            <div data-oid="3sdk_59">
              <div className="font-medium" data-oid="-j9gcwp">
                {template.category}
              </div>
              <div data-oid=":.oy86f">Категория</div>
            </div>
            <div data-oid="u7xlyby">
              <div className="font-medium" data-oid="ezkqz7:">
                {template.settings.resolution}
              </div>
              <div data-oid="ynu5rr6">Разрешение</div>
            </div>
            <div data-oid="r37e:y8">
              <div className="font-medium" data-oid=":mj_lci">
                {Math.floor(template.estimatedDuration / 60)}:{" "}
                {String(template.estimatedDuration % 60).padStart(2, "0")}
              </div>
              <div data-oid="42cot48">Длительность</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
