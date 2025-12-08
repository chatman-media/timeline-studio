"use client"

import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AnalyzerType, FileAnalysisStatus } from "@/features/ai-director/types/analysis-progress"
import type { AnalysisFilters as Filters } from "../../hooks/use-timeline-analysis"

interface AnalysisFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Partial<Filters>) => void
  onClearFilters: () => void
}

const STATUS_OPTIONS: { value: FileAnalysisStatus | "all"; label: string }[] = [
  { value: "all", label: "Все статусы" },
  { value: "pending", label: "Ожидает" },
  { value: "analyzing", label: "Анализируется" },
  { value: "completed", label: "Завершено" },
  { value: "error", label: "Ошибка" },
  { value: "cancelled", label: "Отменено" },
]

const ANALYZER_TYPE_OPTIONS: { value: AnalyzerType | "all"; label: string }[] = [
  { value: "all", label: "Все типы" },
  { value: "scene_detection", label: "Детекция сцен" },
  { value: "object_detection", label: "Детекция объектов" },
  { value: "face_detection", label: "Детекция лиц" },
  { value: "audio_quality", label: "Качество аудио" },
  { value: "speech_recognition", label: "Распознавание речи" },
  { value: "music_detection", label: "Детекция музыки" },
  { value: "mood_analysis", label: "Анализ настроения" },
  { value: "moment_detection", label: "Поиск моментов" },
]

export function AnalysisFilters({ filters, onFiltersChange, onClearFilters }: AnalysisFiltersProps) {
  const hasActiveFilters = filters.status !== "all" || filters.analyzerType !== "all"

  return (
    <div className="space-y-4 border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Фильтры</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-7 gap-1 text-xs">
            <X className="h-3 w-3" />
            Очистить
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {/* Фильтр по статусу */}
        <div className="space-y-1.5">
          <Label htmlFor="status-filter" className="text-xs font-medium">
            Статус
          </Label>
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ status: value as FileAnalysisStatus | "all" })}
          >
            <SelectTrigger id="status-filter" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Фильтр по типу анализатора */}
        <div className="space-y-1.5">
          <Label htmlFor="analyzer-filter" className="text-xs font-medium">
            Тип анализа
          </Label>
          <Select
            value={filters.analyzerType}
            onValueChange={(value) => onFiltersChange({ analyzerType: value as AnalyzerType | "all" })}
          >
            <SelectTrigger id="analyzer-filter" className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANALYZER_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
