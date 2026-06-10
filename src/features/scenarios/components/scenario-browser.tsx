/**
 * Scenario Browser Component
 * Браузер сценариев монтажа с фильтрами и поиском
 */

import { Clock, Filter, Grid, List, Search, Sparkles, X, Zap } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Popover, PopoverContent, PopoverTrigger } from "@timeline-studio/ui/components/popover"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Tabs, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"

import { useScenario } from "../hooks/use-scenario"
import type { Scenario } from "../types/scenario"

export interface ScenarioBrowserProps {
  /** Показывать заголовок */
  showHeader?: boolean

  /** Показывать фильтры */
  showFilters?: boolean

  /** Callback при выборе сценария */
  onSelect?: (scenario: Scenario) => void

  /** Callback при закрытии */
  onClose?: () => void

  /** Высота компонента */
  height?: string | number
}

export const ScenarioBrowser: React.FC<ScenarioBrowserProps> = ({
  showHeader = true,
  showFilters = true,
  onSelect,
  onClose,
  height = "600px",
}) => {
  const { scenarios, selectedScenario, selectScenario, searchScenarios, filterScenarios, sortScenarios, resetFilters } =
    useScenario()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [currentDifficulty, setCurrentDifficulty] = useState<string | null>(null)

  /**
   * Обработчик выбора сценария
   */
  const handleScenarioClick = useCallback(
    (scenario: Scenario) => {
      selectScenario(scenario.id)
      onSelect?.(scenario)
    },
    [selectScenario, onSelect],
  )

  /**
   * Обработчик поиска
   */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      searchScenarios(query)
    },
    [searchScenarios],
  )

  /**
   * Применение фильтров
   */
  const handleApplyFilters = useCallback(() => {
    filterScenarios({
      category: currentCategory || undefined,
      difficulty: currentDifficulty || undefined,
    })
    setFiltersOpen(false)
  }, [currentCategory, currentDifficulty, filterScenarios])

  /**
   * Очистка фильтров
   */
  const handleClearFilters = useCallback(() => {
    setSearchQuery("")
    setCurrentCategory(null)
    setCurrentDifficulty(null)
    resetFilters()
  }, [resetFilters])

  /**
   * Форматирование времени
   */
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} мин`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`
  }

  /**
   * Рендеринг карточки сценария
   */
  const renderScenarioCard = (scenario: Scenario) => {
    const isSelected = selectedScenario?.id === scenario.id
    const difficultyColor = {
      beginner: "bg-green-500/10 text-green-500",
      intermediate: "bg-yellow-500/10 text-yellow-500",
      advanced: "bg-red-500/10 text-red-500",
    }[scenario.difficulty]

    return (
      <Card
        key={scenario.id}
        className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
        onClick={() => handleScenarioClick(scenario)}
        data-oid="tp4t4dz"
      >
        <CardHeader data-oid="ezb7n87">
          <div className="flex items-start justify-between gap-2" data-oid="77ct3n_">
            <div className="flex-1" data-oid="a-wb5bw">
              <CardTitle className="text-base" data-oid="76935d6">
                {scenario.name.ru}
              </CardTitle>
              <CardDescription className="text-xs" data-oid="1c-g1hq">
                {scenario.description.ru}
              </CardDescription>
            </div>
            {scenario.requirements.aiAssisted && (
              <Badge variant="secondary" className="flex items-center gap-1" data-oid="6oepz-.">
                <Sparkles className="h-3 w-3" data-oid="aj4:jws" />
                AI
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="4guryev">
          {/* Статистика */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground" data-oid="ln2n.0c">
            <div className="flex items-center gap-1" data-oid="ks_k639">
              <Clock className="h-3 w-3" data-oid="543tupg" />
              {formatTime(scenario.estimatedTime)}
            </div>
            <div className="flex items-center gap-1" data-oid="_p-dnug">
              <Zap className="h-3 w-3" data-oid="3.ze1ja" />
              {scenario.steps.length} шагов
            </div>
          </div>

          {/* Бейджи */}
          <div className="flex flex-wrap gap-2" data-oid="1tj-.iq">
            <Badge variant="outline" className={difficultyColor} data-oid=":_8fvjr">
              {scenario.difficulty === "beginner"
                ? "Начальный"
                : scenario.difficulty === "intermediate"
                  ? "Средний"
                  : "Продвинутый"}
            </Badge>
            <Badge variant="outline" data-oid="94csaj3">
              {scenario.category}
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-full flex-col" style={{ height }} data-oid="uiy_-0p">
      {/* Header */}
      {showHeader && (
        <div className="border-b p-4" data-oid="rq6_f4u">
          <div className="flex items-center justify-between" data-oid="3c.z9_.">
            <div data-oid="u7d_ezf">
              <h2 className="text-2xl font-semibold" data-oid=":.9b.79">
                Сценарии монтажа
              </h2>
              <p className="text-muted-foreground text-sm" data-oid="nlohidg">
                Выберите сценарий для автоматического монтажа
              </p>
            </div>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} data-oid="mxt_cry">
                <X className="h-4 w-4" data-oid="xhsvx-l" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b p-4" data-oid="qzumtr:">
        {/* Search */}
        <div className="relative flex-1" data-oid="bioz8wu">
          <Search className="text-muted-foreground absolute left-2 top-2.5 h-4 w-4" data-oid="2gdn.ni" />
          <Input
            placeholder="Поиск сценариев..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
            data-oid="dobjd:w"
          />
        </div>

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} data-oid="7dkkdew">
          <TabsList data-oid=":s_zsu.">
            <TabsTrigger value="grid" data-oid="uqmag08">
              <Grid className="h-4 w-4" data-oid="0_t6j_w" />
            </TabsTrigger>
            <TabsTrigger value="list" data-oid="ro.:0-n">
              <List className="h-4 w-4" data-oid="e5pcofd" />
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters toggle */}
        {showFilters && (
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen} data-oid="9ygt0gw">
            <PopoverTrigger asChild data-oid="5:11iu1">
              <Button variant="outline" size="icon" data-oid="xl5omm:">
                <Filter className="h-4 w-4" data-oid="opn-bhu" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" data-oid="ag5_n1k">
              <div className="space-y-4" data-oid="2jn_:g8">
                <div className="space-y-2" data-oid="g-zim1k">
                  <h4 className="font-medium" data-oid="d-fo4p1">
                    Фильтры
                  </h4>
                  <p className="text-muted-foreground text-xs" data-oid="43xm93p">
                    Уточните поиск сценариев
                  </p>
                </div>

                <Separator data-oid="_zeaes9" />

                {/* Category filter */}
                <div className="space-y-2" data-oid="l4hy1oj">
                  <Label data-oid="ze6siil">Категория</Label>
                  <Select
                    value={currentCategory || "all"}
                    onValueChange={(v) => setCurrentCategory(v === "all" ? null : v)}
                    data-oid=".06r755"
                  >
                    <SelectTrigger data-oid="vyn07yl">
                      <SelectValue placeholder="Все категории" data-oid="_wvmmu5" />
                    </SelectTrigger>
                    <SelectContent data-oid="kz8w.yb">
                      <SelectItem value="all" data-oid="ihhzk58">
                        Все категории
                      </SelectItem>
                      <SelectItem value="automation" data-oid="7kqmqeh">
                        Автоматизация
                      </SelectItem>
                      <SelectItem value="structure" data-oid="o3jtcv1">
                        Структура
                      </SelectItem>
                      <SelectItem value="effects" data-oid="t8nxwc2">
                        Эффекты
                      </SelectItem>
                      <SelectItem value="workflow" data-oid="d241nti">
                        Workflow
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty filter */}
                <div className="space-y-2" data-oid="rcihodt">
                  <Label data-oid="3srt87q">Сложность</Label>
                  <Select
                    value={currentDifficulty || "all"}
                    onValueChange={(v) => setCurrentDifficulty(v === "all" ? null : v)}
                    data-oid="pvd.xy8"
                  >
                    <SelectTrigger data-oid="-:743th">
                      <SelectValue placeholder="Любая сложность" data-oid="pghqb_w" />
                    </SelectTrigger>
                    <SelectContent data-oid=":3zbnl-">
                      <SelectItem value="all" data-oid="xd5eici">
                        Любая сложность
                      </SelectItem>
                      <SelectItem value="beginner" data-oid="qwpubyi">
                        Начальный
                      </SelectItem>
                      <SelectItem value="intermediate" data-oid="g09ruqi">
                        Средний
                      </SelectItem>
                      <SelectItem value="advanced" data-oid="wbaf665">
                        Продвинутый
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator data-oid="sle-::3" />

                {/* Actions */}
                <div className="flex gap-2" data-oid="rjygck5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleClearFilters}
                    data-oid="x6nxtrc"
                  >
                    Сбросить
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleApplyFilters} data-oid="di1:mhx">
                    Применить
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1" data-oid="g-s24xp">
        <div className="p-4" data-oid="_7u4qrm">
          {scenarios.length === 0 ? (
            <div
              className="text-muted-foreground flex h-[300px] items-center justify-center text-center"
              data-oid=".ghhqv-"
            >
              <div data-oid="-r24g1r">
                <p className="text-lg font-medium" data-oid="5ah-agk">
                  Сценарии не найдены
                </p>
                <p className="text-sm" data-oid="ub:--_7">
                  Попробуйте изменить фильтры или поисковый запрос
                </p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" data-oid="t5lth7e">
              {scenarios.map(renderScenarioCard)}
            </div>
          ) : (
            <div className="space-y-2" data-oid="n6ukqzu">
              {scenarios.map(renderScenarioCard)}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4" data-oid="_ycc946">
        <div className="flex items-center justify-between" data-oid="i1e1dc4">
          <p className="text-muted-foreground text-sm" data-oid="piovzb-">
            Найдено сценариев:{" "}
            <span className="font-medium" data-oid="_4930tu">
              {scenarios.length}
            </span>
          </p>
          {selectedScenario && (
            <Button onClick={() => onSelect?.(selectedScenario)} data-oid=":h0jt6l">
              Выбрать сценарий
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
