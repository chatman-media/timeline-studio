"use client"

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

  return (
    <div className="flex h-full w-full flex-col">
      {/* Панель настроек анализа */}
      <AnalysisSettingsPanel />

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Левая панель - список анализов */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
          <div className="flex h-full flex-col border-r bg-background">
            {/* Header с статистикой */}
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Анализы</h2>
              {totalFiles > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Всего: {totalFiles} • Завершено: {completedFiles} • В процессе: {analyzingFiles}
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
