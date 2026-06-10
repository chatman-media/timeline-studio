/**
 * Панель персон для Timeline
 * Показывает всех обнаруженных персон и их статистику
 */

import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Input } from "@timeline-studio/ui/components/input"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Slider } from "@timeline-studio/ui/components/slider"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@timeline-studio/ui/components/tooltip"
import { Eye, EyeOff, Filter, Search, Settings, Users } from "lucide-react"
import { useState } from "react"

import { useTimelinePersons } from "../../hooks/state/use-timeline-persons"

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
    <Card className={className} data-oid="sftu1f5">
      <CardHeader className="pb-3" data-oid="ec2vz1x">
        <div className="flex items-center justify-between" data-oid="qpp40o.">
          <CardTitle className="text-sm flex items-center gap-2" data-oid="yun89yj">
            <Users className="h-4 w-4" data-oid="dk:5y8z" />
            Персоны ({persons.length})
          </CardTitle>
          <div className="flex items-center gap-1" data-oid="lg-bv30">
            <Tooltip data-oid="l5nnyml">
              <TooltipTrigger asChild data-oid="5s3h8uw">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-7 w-7 p-0"
                  data-oid="zbh0pa1"
                >
                  <Settings className="h-3 w-3" data-oid="3z9:dm7" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="-4lw4hm">Настройки обнаружения персон</TooltipContent>
            </Tooltip>

            <Tooltip data-oid="r2c7yrj">
              <TooltipTrigger asChild data-oid="atrgzo0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={analyzeTimelineForPersons}
                  disabled={state.isAnalyzing}
                  className="h-7 w-7 p-0"
                  data-oid="th6lfvp"
                >
                  <Eye className="h-3 w-3" data-oid="e-c8c4t" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="lxywjks">Анализировать Timeline</TooltipContent>
            </Tooltip>

            <Tooltip data-oid="nylhv:l">
              <TooltipTrigger asChild data-oid="okontoq">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearPersonsAnalysis}
                  className="h-7 w-7 p-0"
                  data-oid="s.xj_fp"
                >
                  <EyeOff className="h-3 w-3" data-oid="efq0s86" />
                </Button>
              </TooltipTrigger>
              <TooltipContent data-oid="f:2bu.-">Очистить анализ</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Настройки */}
        {showSettings && (
          <div className="space-y-3 pt-2 border-t" data-oid="nbtaysy">
            <div className="flex items-center justify-between" data-oid="w9cb34t">
              <span className="text-xs text-muted-foreground" data-oid="ntoq33v">
                Автообнаружение
              </span>
              <Switch checked={enablePersonDetection} onCheckedChange={setEnablePersonDetection} data-oid="6sfvdku" />
            </div>

            <div className="space-y-2" data-oid="a7nkdz3">
              <div className="flex items-center justify-between" data-oid="v-ts9.g">
                <span className="text-xs text-muted-foreground" data-oid="hxheo5w">
                  Уверенность
                </span>
                <span className="text-xs font-mono" data-oid="86sjyq4">
                  {Math.round(confidenceThreshold * 100)}%
                </span>
              </div>
              <Slider
                value={[confidenceThreshold]}
                onValueChange={([value]) => setConfidenceThreshold(value)}
                min={0.3}
                max={1.0}
                step={0.05}
                className="w-full"
                data-oid="0442rx8"
              />
            </div>
          </div>
        )}

        {/* Статистика */}
        {state.appearances.length > 0 && (
          <div className="flex gap-2 text-xs text-muted-foreground" data-oid="rb1bhcb">
            <span data-oid="1ru.j79">Появлений: {totalAppearances}</span>
            <span data-oid="52.lsw9">Средняя уверенность: {avgConfidence}%</span>
          </div>
        )}

        {/* Прогресс анализа */}
        {state.isAnalyzing && (
          <div className="space-y-2" data-oid="2aphh3n">
            <div className="flex items-center justify-between text-xs" data-oid="t:_8r8n">
              <span data-oid="wv4k.c:">Анализ...</span>
              <span data-oid="em-cn8-">{state.analysisProgress}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden" data-oid="g7qa-qy">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${state.analysisProgress}%` }}
                data-oid="fsk:.qr"
              />
            </div>
          </div>
        )}

        {/* Поиск */}
        <div className="relative" data-oid="rjjpx3a">
          <Search
            className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
            data-oid="mvb-cmv"
          />

          <Input
            placeholder="Поиск персон..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
            data-oid="pm2bsbv"
          />
        </div>

        {/* Фильтр по тегам */}
        {allTags.length > 0 && (
          <div className="space-y-2" data-oid="n.w7qda">
            <div className="flex items-center gap-2" data-oid="27hvu51">
              <Filter className="h-3 w-3 text-muted-foreground" data-oid="7a4z62t" />
              <span className="text-xs text-muted-foreground" data-oid="cu6c3gt">
                Теги:
              </span>
            </div>
            <div className="flex flex-wrap gap-1" data-oid="bsj2-97">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="h-5 px-2 text-xs cursor-pointer"
                  onClick={() => {
                    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                  }}
                  data-oid="20-3:b:"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Ошибка */}
        {state.error && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded" data-oid="4q6dicy">
            {state.error}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0" data-oid="65qrx2:">
        <ScrollArea className="h-64" data-oid="btz20s2">
          {filteredPersons.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-4" data-oid="0rbjox1">
              {persons.length === 0
                ? "Персоны не обнаружены. Запустите анализ Timeline."
                : "Персоны не найдены по заданным критериям."}
            </div>
          ) : (
            <div className="space-y-2" data-oid="-r9omtp">
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
                    data-oid="0u-yhtg"
                  >
                    {/* Аватар */}
                    <div
                      className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center overflow-hidden shrink-0"
                      data-oid="5lwlg13"
                    >
                      {person.thumbnails && person.thumbnails.length > 0 ? (
                        <img
                          src={person.thumbnails[0].imageUrl}
                          alt={person.name || "Person"}
                          className="h-8 w-8 object-cover"
                          data-oid="6nnq1.y"
                        />
                      ) : (
                        <Users className="h-4 w-4 text-muted-foreground" data-oid="7u6:1_0" />
                      )}
                    </div>

                    {/* Информация */}
                    <div className="flex-1 min-w-0" data-oid="s4gldq2">
                      <div className="text-xs font-medium truncate" data-oid="haqp-cp">
                        {person.name || "Безымянная персона"}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground" data-oid="nuf6b0j">
                        <span data-oid="4wc83-d">{personAppearances.length} появлений</span>
                        {avgConfidence > 0 && <span data-oid="a7gt5rw">{avgConfidence}%</span>}
                      </div>
                      {person.tags && person.tags.length > 0 && (
                        <div className="flex gap-1 mt-1" data-oid="9-t9it5">
                          {person.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="h-4 px-1 text-xs" data-oid="74u1zpi">
                              {tag}
                            </Badge>
                          ))}
                          {person.tags.length > 2 && (
                            <Badge variant="outline" className="h-4 px-1 text-xs" data-oid="pltn7il">
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
                        data-oid="mof._h5"
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
