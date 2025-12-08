"use client"

import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

import { useTimelineAnalysis } from "../hooks/use-timeline-analysis"
import { AnalysisDetail } from "./analysis/analysis-detail"
import { AnalysisFilters } from "./analysis/analysis-filters"
import { AnalysisList } from "./analysis/analysis-list"
import { AnalysisSettingsPanel } from "./analysis/analysis-settings-panel"

export function AnalysisView() {
  const { t } = useTranslation()
  const {
    filteredFiles,
    selectedFile,
    selectedFileId,
    setSelectedFileId,
    filters,
    setFilters,
    clearFilters,
    clearHistory,
    totalFiles,
    completedFiles,
    analyzingFiles,
    failedFiles,
  } = useTimelineAnalysis()

  // Режим правой панели: "new" - новый анализ, "details" - детали выбранного
  const [rightPanelMode, setRightPanelMode] = useState<"new" | "details">("new")

  // Обработчик выбора файла из списка
  const handleSelectFile = (fileId: string | null) => {
    setSelectedFileId(fileId)
    if (fileId) {
      setRightPanelMode("details")
    }
  }

  // Обработчик нажатия на "Новый анализ"
  const handleNewAnalysis = () => {
    setSelectedFileId(null)
    setRightPanelMode("new")
  }

  // Обработчик очистки истории
  const handleClearHistory = async () => {
    const confirmed = window.confirm("Вы уверены, что хотите очистить всю историю анализов?")
    if (confirmed) {
      await clearHistory()
      setRightPanelMode("new")
    }
  }

  return (
    <div className="flex h-full w-full flex-col">
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Левая панель - Процессы анализа контента */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
          <div className="flex h-full flex-col border-r bg-background">
            {/* Header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Процессы анализа</h2>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewAnalysis}
                    title="Новый анализ"
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearHistory}
                    title="Очистить историю"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={completedFiles + failedFiles === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {totalFiles > 0 ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Всего: {totalFiles} • Завершено: {completedFiles} • В процессе: {analyzingFiles}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Нет анализов</p>
              )}
            </div>

            {/* Фильтры */}
            <AnalysisFilters filters={filters} onFiltersChange={setFilters} onClearFilters={clearFilters} />

            {/* Список анализов */}
            <div className="flex-1 overflow-hidden">
              <AnalysisList files={filteredFiles} selectedFileId={selectedFileId} onSelectFile={handleSelectFile} />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Правая панель - Новый анализ или Детали */}
        <ResizablePanel defaultSize={65} minSize={50}>
          <div className="flex h-full flex-col bg-background">
            {rightPanelMode === "details" && selectedFile ? (
              // Детали выбранного анализа
              <>
                <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30">
                  <div className="text-sm font-medium">Результаты анализа</div>
                  <Button variant="ghost" size="sm" onClick={handleNewAnalysis}>
                    <Plus className="h-4 w-4 mr-2" />
                    Новый анализ
                  </Button>
                </div>
                <div className="flex-1 overflow-auto">
                  <AnalysisDetail file={selectedFile} />
                </div>
              </>
            ) : (
              // Настройки нового анализа
              <>
                <div className="border-b px-4 py-3 bg-muted/30">
                  <div className="text-sm font-medium">Настройка нового анализа</div>
                </div>
                <div className="flex-1 overflow-auto">
                  <AnalysisSettingsPanel />
                </div>
              </>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
