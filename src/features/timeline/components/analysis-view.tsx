"use client"

import { Button } from "@timeline-studio/ui/components/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@timeline-studio/ui/components/resizable"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useTimelineAnalysis } from "../hooks/state/use-timeline-analysis"
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
    <div className="flex h-full w-full flex-col" data-oid="05.9a5c">
      <ResizablePanelGroup direction="horizontal" className="flex-1" data-oid="7.tm4p6">
        {/* Левая панель - Процессы анализа контента */}
        <ResizablePanel defaultSize={35} minSize={25} maxSize={50} data-oid="06q--eb">
          <div className="flex h-full flex-col border-r bg-background" data-oid="rbkll3c">
            {/* Header */}
            <div className="border-b p-4" data-oid="j_.gm33">
              <div className="flex items-center justify-between" data-oid="7273-u4">
                <h2 className="text-lg font-semibold" data-oid="jf8le_4">
                  Процессы анализа
                </h2>
                <div className="flex items-center gap-1" data-oid="788nf.4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewAnalysis}
                    title="Новый анализ"
                    className="h-8 w-8"
                    data-oid="r_o9:55"
                  >
                    <Plus className="h-4 w-4" data-oid="er6bbec" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearHistory}
                    title="Очистить историю"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={completedFiles + failedFiles === 0}
                    data-oid="xeox8:w"
                  >
                    <Trash2 className="h-4 w-4" data-oid="seq_v_e" />
                  </Button>
                </div>
              </div>
              {totalFiles > 0 ? (
                <p className="text-xs text-muted-foreground mt-1" data-oid="v5p249k">
                  Всего: {totalFiles} • Завершено: {completedFiles} • В процессе: {analyzingFiles}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1" data-oid="xm3b174">
                  Нет анализов
                </p>
              )}
            </div>

            {/* Фильтры */}
            <AnalysisFilters
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={clearFilters}
              data-oid="kavh893"
            />

            {/* Список анализов */}
            <div className="flex-1 overflow-hidden" data-oid=":s-95ef">
              <AnalysisList
                files={filteredFiles}
                selectedFileId={selectedFileId}
                onSelectFile={handleSelectFile}
                data-oid="0d81m44"
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle data-oid="g5xowta" />

        {/* Правая панель - Новый анализ или Детали */}
        <ResizablePanel defaultSize={65} minSize={50} data-oid="-p0h2-z">
          <div className="flex h-full flex-col bg-background" data-oid="rjltc:b">
            {rightPanelMode === "details" && selectedFile ? (
              // Детали выбранного анализа
              <>
                <div className="border-b px-4 py-3 flex items-center justify-between bg-muted/30" data-oid="yuzja8.">
                  <div className="text-sm font-medium" data-oid="aoexhj7">
                    {t("timeline.analysisPanel.results")}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleNewAnalysis} data-oid="l:h8qzz">
                    <Plus className="h-4 w-4 mr-2" data-oid="77.s3.n" />
                    {t("timeline.analysisPanel.newAnalysis")}
                  </Button>
                </div>
                <div className="flex-1 overflow-auto" data-oid="lol12ho">
                  <AnalysisDetail file={selectedFile} data-oid="xqf5q.c" />
                </div>
              </>
            ) : (
              // Настройки нового анализа
              <>
                <div className="border-b px-4 py-3 bg-muted/30" data-oid="hk3v51i">
                  <div className="text-sm font-medium" data-oid="oy-qea_">
                    {t("timeline.analysisPanel.newAnalysisSettings")}
                  </div>
                </div>
                <div className="flex-1 overflow-auto" data-oid="34pfskl">
                  <AnalysisSettingsPanel data-oid=".m:_3za" />
                </div>
              </>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
