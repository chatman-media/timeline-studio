"use client"

/**
 * AnalyzerCheckboxGroup Component
 * Компонент для выбора анализаторов через чекбоксы, сгруппированные по категориям
 */

import { CheckCircle2, Circle, Eye, Music, Video } from "lucide-react"
import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { AnalyzerType } from "../types/analysis-progress"
import { ANALYZER_METADATA, getAnalyzersByCategory } from "../types/analysis-progress"

interface AnalyzerCheckboxGroupProps {
  selectedAnalyzers: Set<AnalyzerType>
  onSelectionChange: (analyzers: Set<AnalyzerType>) => void
  className?: string
}

export function AnalyzerCheckboxGroup({ selectedAnalyzers, onSelectionChange, className }: AnalyzerCheckboxGroupProps) {
  // Группировка анализаторов по категориям
  const videoAnalyzers = useMemo(() => getAnalyzersByCategory("video"), [])
  const audioAnalyzers = useMemo(() => getAnalyzersByCategory("audio"), [])
  const contentAnalyzers = useMemo(() => getAnalyzersByCategory("content"), [])

  // Toggle одного анализатора
  const toggleAnalyzer = (type: AnalyzerType) => {
    const newSelection = new Set(selectedAnalyzers)
    if (newSelection.has(type)) {
      newSelection.delete(type)
    } else {
      newSelection.add(type)
    }
    onSelectionChange(newSelection)
  }

  // Select all в категории
  const selectAllInCategory = (category: "video" | "audio" | "content") => {
    const analyzers = getAnalyzersByCategory(category)
    const newSelection = new Set(selectedAnalyzers)
    analyzers.forEach((meta) => newSelection.add(meta.type))
    onSelectionChange(newSelection)
  }

  // Deselect all в категории
  const deselectAllInCategory = (category: "video" | "audio" | "content") => {
    const analyzers = getAnalyzersByCategory(category)
    const newSelection = new Set(selectedAnalyzers)
    analyzers.forEach((meta) => newSelection.delete(meta.type))
    onSelectionChange(newSelection)
  }

  // Select all analyzers
  const selectAll = () => {
    const allAnalyzers = Object.keys(ANALYZER_METADATA) as AnalyzerType[]
    onSelectionChange(new Set(allAnalyzers))
  }

  // Deselect all analyzers
  const deselectAll = () => {
    onSelectionChange(new Set())
  }

  // Проверка, все ли выбраны в категории
  const isAllSelectedInCategory = (category: "video" | "audio" | "content"): boolean => {
    const analyzers = getAnalyzersByCategory(category)
    return analyzers.every((meta) => selectedAnalyzers.has(meta.type))
  }

  // Посчитать выбранные в категории
  const countSelectedInCategory = (category: "video" | "audio" | "content"): number => {
    const analyzers = getAnalyzersByCategory(category)
    return analyzers.filter((meta) => selectedAnalyzers.has(meta.type)).length
  }

  // Подсчет общего времени
  const estimatedTotalDuration = useMemo(() => {
    let total = 0
    selectedAnalyzers.forEach((type) => {
      const meta = ANALYZER_METADATA[type]
      if (meta) total += meta.estimatedDuration
    })
    return total
  }, [selectedAnalyzers])

  const formatEstimatedTime = (seconds: number): string => {
    if (seconds < 60) return `~${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (remainingSeconds === 0) return `~${minutes}m`
    return `~${minutes}m ${remainingSeconds}s`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Анализаторы
        </CardTitle>
        <CardDescription>Выберите анализаторы для обработки ({selectedAnalyzers.size} выбрано)</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Global Actions */}
        <div className="flex gap-2">
          <Button onClick={selectAll} variant="outline" size="sm" className="flex-1 gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Все
          </Button>
          <Button onClick={deselectAll} variant="outline" size="sm" className="flex-1 gap-1">
            <Circle className="h-3.5 w-3.5" />
            Снять
          </Button>
        </div>

        {/* Estimated Time */}
        {selectedAnalyzers.size > 0 && (
          <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
            <p className="text-sm font-medium text-blue-900">
              Примерное время: {formatEstimatedTime(estimatedTotalDuration)}
            </p>
            <p className="text-xs text-blue-700 mt-1">На 1 минуту видео</p>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {/* Video Analyzers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-semibold">
                    Видео{" "}
                    <span className="text-muted-foreground font-normal">
                      ({countSelectedInCategory("video")}/{videoAnalyzers.length})
                    </span>
                  </h4>
                </div>
                <div className="flex gap-1">
                  {!isAllSelectedInCategory("video") && (
                    <Button
                      onClick={() => selectAllInCategory("video")}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Все
                    </Button>
                  )}
                  {countSelectedInCategory("video") > 0 && (
                    <Button
                      onClick={() => deselectAllInCategory("video")}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Снять
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pl-6">
                {videoAnalyzers.map((meta) => (
                  <div key={meta.type} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                    <Checkbox
                      id={meta.type}
                      checked={selectedAnalyzers.has(meta.type)}
                      onCheckedChange={() => toggleAnalyzer(meta.type)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor={meta.type} className="cursor-pointer font-medium text-sm">
                        {meta.displayName}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~
                        {meta.estimatedDuration < 60
                          ? `${meta.estimatedDuration}s`
                          : `${Math.round(meta.estimatedDuration / 60)}m`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Analyzers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold">
                    Аудио{" "}
                    <span className="text-muted-foreground font-normal">
                      ({countSelectedInCategory("audio")}/{audioAnalyzers.length})
                    </span>
                  </h4>
                </div>
                <div className="flex gap-1">
                  {!isAllSelectedInCategory("audio") && (
                    <Button
                      onClick={() => selectAllInCategory("audio")}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Все
                    </Button>
                  )}
                  {countSelectedInCategory("audio") > 0 && (
                    <Button
                      onClick={() => deselectAllInCategory("audio")}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Снять
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pl-6">
                {audioAnalyzers.map((meta) => (
                  <div key={meta.type} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                    <Checkbox
                      id={meta.type}
                      checked={selectedAnalyzers.has(meta.type)}
                      onCheckedChange={() => toggleAnalyzer(meta.type)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor={meta.type} className="cursor-pointer font-medium text-sm">
                        {meta.displayName}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~
                        {meta.estimatedDuration < 60
                          ? `${meta.estimatedDuration}s`
                          : `${Math.round(meta.estimatedDuration / 60)}m`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Analyzers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <h4 className="text-sm font-semibold">
                    Контент{" "}
                    <span className="text-muted-foreground font-normal">
                      ({countSelectedInCategory("content")}/{contentAnalyzers.length})
                    </span>
                  </h4>
                </div>
                <div className="flex gap-1">
                  {!isAllSelectedInCategory("content") && (
                    <Button
                      onClick={() => selectAllInCategory("content")}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Все
                    </Button>
                  )}
                  {countSelectedInCategory("content") > 0 && (
                    <Button
                      onClick={() => deselectAllInCategory("content")}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      Снять
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pl-6">
                {contentAnalyzers.map((meta) => (
                  <div key={meta.type} className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
                    <Checkbox
                      id={meta.type}
                      checked={selectedAnalyzers.has(meta.type)}
                      onCheckedChange={() => toggleAnalyzer(meta.type)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <Label htmlFor={meta.type} className="cursor-pointer font-medium text-sm">
                        {meta.displayName}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~
                        {meta.estimatedDuration < 60
                          ? `${meta.estimatedDuration}s`
                          : `${Math.round(meta.estimatedDuration / 60)}m`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
