// Analysis control panel for Timeline

import { AnimatePresence, motion } from "framer-motion"
import {
  AlertTriangle,
  BarChart3,
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Link,
  Play,
  RefreshCw,
  Search,
  Settings,
  Square,
  Star,
  Unlink,
  Users,
  Zap,
} from "lucide-react"
import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAnalysis } from "@/features/analysis-dashboard/hooks/use-analysis"
import { cn } from "@/lib/utils"
import { useTimelineAnalysis } from "../../hooks/use-timeline-analysis"

interface AnalysisControlPanelProps {
  className?: string
  onClose?: () => void
}

export function AnalysisControlPanel({ className, onClose }: AnalysisControlPanelProps) {
  const timelineAnalysis = useTimelineAnalysis()
  const analysis = useAnalysis()

  const [isExpanded, setIsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)

  const { state, markers, visibleMarkerTypes } = timelineAnalysis

  // Marker type configurations
  const markerTypes = [
    {
      type: "scene",
      icon: Camera,
      label: "Сцены",
      color: "#3b82f6",
      count: markers.filter((m) => m.type === "scene").length,
    },
    {
      type: "moment",
      icon: Star,
      label: "Моменты",
      color: "#f59e0b",
      count: markers.filter((m) => m.type === "moment").length,
    },
    {
      type: "quality",
      icon: AlertTriangle,
      label: "Качество",
      color: "#ef4444",
      count: markers.filter((m) => m.type === "quality").length,
    },
    {
      type: "person",
      icon: Users,
      label: "Персоны",
      color: "#8b5cf6",
      count: markers.filter((m) => m.type === "person").length,
    },
  ]

  const handleSearch = () => {
    if (searchQuery.trim()) {
      timelineAnalysis.searchInAnalysis(searchQuery.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <TooltipProvider>
      <Card className={cn("w-80 shadow-lg", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              AI Анализ
            </CardTitle>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isExpanded ? "Свернуть" : "Развернуть"}</TooltipContent>
              </Tooltip>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              )}
            </div>
          </div>

          {/* Project status */}
          <div className="flex items-center gap-2 text-sm">
            {state.activeProject ? (
              <>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  Подключен
                </Badge>
                <span className="text-muted-foreground truncate">{state.activeProject.name}</span>
              </>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Unlink className="w-3 h-3" />
                Не подключен
              </Badge>
            )}
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="space-y-4">
                {/* Analysis Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {!state.activeProject ? (
                      <Button
                        onClick={timelineAnalysis.createProjectFromTimeline}
                        className="flex-1 gap-2"
                        disabled={analysis.loading}
                      >
                        <Zap className="w-4 h-4" />
                        Создать проект анализа
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button
                          onClick={timelineAnalysis.startAnalysis}
                          disabled={state.isAnalyzing || analysis.loading}
                          className="flex-1 gap-2"
                          variant={state.isAnalyzing ? "secondary" : "default"}
                        >
                          {state.isAnalyzing ? (
                            <>
                              <Square className="w-4 h-4" />
                              Остановить
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Запустить
                            </>
                          )}
                        </Button>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={timelineAnalysis.refreshAnalysis}
                              disabled={state.isAnalyzing}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Обновить данные</TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {state.isAnalyzing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Прогресс анализа</span>
                        <span>{state.analysisProgress}%</span>
                      </div>
                      <Progress value={state.analysisProgress} className="h-2" />
                    </div>
                  )}

                  {/* Error */}
                  {state.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {state.error}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Поиск в анализе</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Поиск сцен, моментов..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleSearch} disabled={!searchQuery.trim()}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Marker Types */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Слои маркеров</Label>
                  <div className="space-y-2">
                    {markerTypes.map(({ type, icon: Icon, label, color, count }) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => timelineAnalysis.toggleMarkerType(type)}
                            className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                              visibleMarkerTypes.has(type) ? "border-transparent" : "border-gray-300 bg-transparent",
                            )}
                            style={{
                              backgroundColor: visibleMarkerTypes.has(type) ? color : undefined,
                            }}
                          >
                            {visibleMarkerTypes.has(type) && <Icon className="w-2.5 h-2.5 text-white" />}
                          </button>
                          <span className="text-sm">{label}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Settings */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="flex items-center justify-between w-full text-sm font-medium"
                  >
                    <span>Настройки</span>
                    <Settings className="w-4 h-4" />
                  </button>

                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3"
                    >
                      {/* Auto analyze */}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Автоанализ</Label>
                        <Switch
                          checked={timelineAnalysis.autoAnalyzeNewClips}
                          onCheckedChange={timelineAnalysis.setAutoAnalyzeNewClips}
                        />
                      </div>

                      {/* Marker opacity */}
                      <div className="space-y-2">
                        <Label className="text-sm">
                          Прозрачность маркеров: {Math.round(timelineAnalysis.markerOpacity * 100)}%
                        </Label>
                        <Slider
                          value={[timelineAnalysis.markerOpacity]}
                          onValueChange={([value]) => timelineAnalysis.setMarkerOpacity(value)}
                          min={0.1}
                          max={1}
                          step={0.1}
                          className="w-full"
                        />
                      </div>

                      {/* Project management */}
                      {state.activeProject && (
                        <div className="space-y-2">
                          <Label className="text-sm">Проект</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={timelineAnalysis.unlinkFromProject}
                              className="flex-1"
                            >
                              Отключить
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Open analysis dashboard for this project
                                window.open(`#/analysis/${state.activeProject?.id}`, "_blank")
                              }}
                              className="flex-1"
                            >
                              Открыть в Dashboard
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Statistics */}
                {(state.scenes.length > 0 || state.keyMoments.length > 0) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Статистика</Label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="font-semibold">{state.scenes.length}</div>
                          <div className="text-muted-foreground">Сцен</div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="font-semibold">{state.keyMoments.length}</div>
                          <div className="text-muted-foreground">Моментов</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </TooltipProvider>
  )
}
