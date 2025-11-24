/**
 * Scenario Browser Component
 * Браузер сценариев монтажа с фильтрами и поиском
 */

import { Clock, Filter, Grid, List, Search, Sparkles, X, Zap } from "lucide-react"
import type React from "react"
import { useCallback, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base">{scenario.name.ru}</CardTitle>
              <CardDescription className="text-xs">{scenario.description.ru}</CardDescription>
            </div>
            {scenario.requirements.aiAssisted && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Статистика */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(scenario.estimatedTime)}
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {scenario.steps.length} шагов
            </div>
          </div>

          {/* Бейджи */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={difficultyColor}>
              {scenario.difficulty === "beginner"
                ? "Начальный"
                : scenario.difficulty === "intermediate"
                  ? "Средний"
                  : "Продвинутый"}
            </Badge>
            <Badge variant="outline">{scenario.category}</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex h-full flex-col" style={{ height }}>
      {/* Header */}
      {showHeader && (
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Сценарии монтажа</h2>
              <p className="text-muted-foreground text-sm">Выберите сценарий для автоматического монтажа</p>
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
            placeholder="Поиск сценариев..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
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
                <div className="space-y-2">
                  <h4 className="font-medium">Фильтры</h4>
                  <p className="text-muted-foreground text-xs">Уточните поиск сценариев</p>
                </div>

                <Separator />

                {/* Category filter */}
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select
                    value={currentCategory || "all"}
                    onValueChange={(v) => setCurrentCategory(v === "all" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Все категории" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      <SelectItem value="automation">Автоматизация</SelectItem>
                      <SelectItem value="structure">Структура</SelectItem>
                      <SelectItem value="effects">Эффекты</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Difficulty filter */}
                <div className="space-y-2">
                  <Label>Сложность</Label>
                  <Select
                    value={currentDifficulty || "all"}
                    onValueChange={(v) => setCurrentDifficulty(v === "all" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Любая сложность" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Любая сложность</SelectItem>
                      <SelectItem value="beginner">Начальный</SelectItem>
                      <SelectItem value="intermediate">Средний</SelectItem>
                      <SelectItem value="advanced">Продвинутый</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={handleClearFilters}>
                    Сбросить
                  </Button>
                  <Button size="sm" className="flex-1" onClick={handleApplyFilters}>
                    Применить
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {scenarios.length === 0 ? (
            <div className="text-muted-foreground flex h-[300px] items-center justify-center text-center">
              <div>
                <p className="text-lg font-medium">Сценарии не найдены</p>
                <p className="text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scenarios.map(renderScenarioCard)}
            </div>
          ) : (
            <div className="space-y-2">{scenarios.map(renderScenarioCard)}</div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Найдено сценариев: <span className="font-medium">{scenarios.length}</span>
          </p>
          {selectedScenario && <Button onClick={() => onSelect?.(selectedScenario)}>Выбрать сценарий</Button>}
        </div>
      </div>
    </div>
  )
}
