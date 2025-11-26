/**
 * Панель персон для Timeline
 * Показывает всех обнаруженных персон и их статистику
 */

import { Eye, EyeOff, Filter, Search, Settings, Users } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { useTimelinePersons } from "../../hooks/use-timeline-persons"

interface PersonsPanelProps {
  className?: string
}

export function PersonsPanel({ className }: PersonsPanelProps) {
  const {
    persons,
    state,
    analyzeTimelineForPersons,
    clearPersonsAnalysis,
    showPersonDetail,
    enablePersonDetection,
    setEnablePersonDetection,
    confidenceThreshold,
    setConfidenceThreshold,
  } = useTimelinePersons()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)

  // Фильтрация персон
  const filteredPersons = persons.filter((person) => {
    const matchesSearch =
      (person.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.notes || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => person.tags?.includes(tag))

    return matchesSearch && matchesTags
  })

  // Получение всех тегов
  const allTags = Array.from(new Set(persons.flatMap((p) => p.tags || [])))

  // Статистика
  const totalAppearances = state.appearances.length
  const avgConfidence =
    state.appearances.length > 0
      ? Math.round((state.appearances.reduce((sum, app) => sum + app.confidence, 0) / state.appearances.length) * 100)
      : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Персоны ({persons.length})
          </CardTitle>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-7 w-7 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Настройки обнаружения персон</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={analyzeTimelineForPersons}
                  disabled={state.isAnalyzing}
                  className="h-7 w-7 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Анализировать Timeline</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={clearPersonsAnalysis} className="h-7 w-7 p-0">
                  <EyeOff className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Очистить анализ</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Настройки */}
        {showSettings && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Автообнаружение</span>
              <Switch checked={enablePersonDetection} onCheckedChange={setEnablePersonDetection} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Уверенность</span>
                <span className="text-xs font-mono">{Math.round(confidenceThreshold * 100)}%</span>
              </div>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={([value]) => setConfidenceThreshold(value)}
                min={0.3}
                max={1.0}
                step={0.05}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Статистика */}
        {state.appearances.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>Появлений: {totalAppearances}</span>
            <span>Средняя уверенность: {avgConfidence}%</span>
          </div>
        )}

        {/* Прогресс анализа */}
        {state.isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Анализ...</span>
              <span>{state.analysisProgress}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${state.analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск персон..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>

        {/* Фильтр по тегам */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Теги:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="h-5 px-2 text-xs cursor-pointer"
                  onClick={() => {
                    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ошибка */}
        {state.error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{state.error}</div>}
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-64">
          {filteredPersons.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4">
              {persons.length === 0
                ? "Персоны не обнаружены. Запустите анализ Timeline."
                : "Персоны не найдены по заданным критериям."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPersons.map((person) => {
                const personAppearances = state.appearances.filter((app) => app.personId === person.id)
                const avgConfidence =
                  personAppearances.length > 0
                    ? Math.round(
                        (personAppearances.reduce((sum, app) => sum + app.confidence, 0) / personAppearances.length) *
                          100,
                      )
                    : 0

                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => showPersonDetail(person.id)}
                  >
                    {/* Аватар */}
                    <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center overflow-hidden shrink-0">
                      {person.thumbnails && person.thumbnails.length > 0 ? (
                        <img
                          src={person.thumbnails[0].imageUrl}
                          alt={person.name || "Person"}
                          className="h-8 w-8 object-cover"
                        />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Информация */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{person.name || "Безымянная персона"}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{personAppearances.length} появлений</span>
                        {avgConfidence > 0 && <span>{avgConfidence}%</span>}
                      </div>
                      {person.tags && person.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {person.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="h-4 px-1 text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {person.tags.length > 2 && (
                            <Badge variant="outline" className="h-4 px-1 text-xs">
                              +{person.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Индикатор уверенности */}
                    {avgConfidence > 0 && (
                      <div
                        className={`
                          h-2 w-2 rounded-full
                          ${avgConfidence >= 80 ? "bg-green-500" : avgConfidence >= 60 ? "bg-yellow-500" : "bg-red-500"}
                        `}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
