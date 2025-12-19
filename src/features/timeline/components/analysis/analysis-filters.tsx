"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AnalyzerType, FileAnalysisStatus } from "@/features/ai-director/types/analysis-progress"
import type { AnalysisFilters as Filters } from "../../hooks/state/use-timeline-analysis"

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
  { value: "scene_detection", label: "Сцены" },
  { value: "object_detection", label: "Объекты" },
  { value: "face_detection", label: "Лица" },
  { value: "audio_quality", label: "Аудио" },
  { value: "speech_recognition", label: "Речь" },
  { value: "music_detection", label: "Музыка" },
  { value: "mood_analysis", label: "Настроение" },
  { value: "moment_detection", label: "Моменты" },
]

export function AnalysisFilters({ filters, onFiltersChange, onClearFilters }: AnalysisFiltersProps) {
  const hasActiveFilters = filters.status !== "all" || filters.analyzerType !== "all"

  return (
    <div className="flex items-center gap-2 border-b px-4 py-2" data-oid="de96hli">
      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ status: value as FileAnalysisStatus | "all" })}
        data-oid="mwvxw2c"
      >
        <SelectTrigger className="h-7 w-[130px] text-xs" data-oid="wds1l1i">
          <SelectValue data-oid="tvdnw_c" />
        </SelectTrigger>
        <SelectContent data-oid="o5-h198">
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs" data-oid="28svfuj">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.analyzerType}
        onValueChange={(value) => onFiltersChange({ analyzerType: value as AnalyzerType | "all" })}
        data-oid="330r:b6"
      >
        <SelectTrigger className="h-7 w-[120px] text-xs" data-oid="qqg7d22">
          <SelectValue data-oid="leb.1sh" />
        </SelectTrigger>
        <SelectContent data-oid="0dk0x5z">
          {ANALYZER_TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-xs" data-oid="i.hnmpy">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={onClearFilters} className="h-7 w-7" data-oid="8jgtkt-">
          <X className="h-3.5 w-3.5" data-oid="dql5:5c" />
        </Button>
      )}
    </div>
  )
}
