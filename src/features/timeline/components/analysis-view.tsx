"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import { useTimelineAnalysis } from "../hooks/use-timeline-analysis"
import { AnalysisDetail } from "./analysis/analysis-detail"
import { AnalysisFilters } from "./analysis/analysis-filters"
import { AnalysisList } from "./analysis/analysis-list"
import { AnalysisSettingsPanel } from "./analysis/analysis-settings-panel"

export function AnalysisView() {
  const {
    filteredFiles,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    filters,
    setFilters,
    clearFilters,
    totalFiles,
    completedFiles,
    analyzingFiles,
  } = useTimelineAnalysis()

  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="flex h-full w-full flex-col">
      {/* Кнопка для показа настроек */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-muted/30">
        <div className="text-sm font-medium text-muted-foreground">
          {showSettings ? "Настройка нового анализа" : "Результаты анализов"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="gap-2"
        >
          {showSettings ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Скрыть настройки
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Настроить новый анализ
            </>
          )}
        </Button>
      </div>

      {/* Панель настроек анализа (сворачиваемая) */}
      {showSettings && <AnalysisSettingsPanel />}

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Левая панель - список анализов */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
          <div className="flex h-full flex-col border-r bg-background">
            {/* Header с статистикой */}
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">История анализов</h2>
              {totalFiles > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Всего файлов: {totalFiles} • Завершено: {completedFiles} • В процессе: {analyzingFiles}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  Нет запущенных анализов
                </p>
              )}
            </div>

            {/* Фильтры */}
            <AnalysisFilters filters={filters} onFiltersChange={setFilters} onClearFilters={clearFilters} />

            {/* Список анализов */}
            <div className="flex-1 overflow-hidden">
              <AnalysisList
                files={filteredFiles}
                selectedFileId={selectedFileId}
                onSelectFile={setSelectedFileId}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Правая панель - детали анализа */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="flex h-full flex-col bg-background">
            {selectedFile ? (
              <AnalysisDetail file={selectedFile} />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Выберите анализ для просмотра деталей</p>
                  <p className="text-xs text-muted-foreground">
                    Кликните на файл из списка слева, чтобы увидеть подробную информацию
                  </p>
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
