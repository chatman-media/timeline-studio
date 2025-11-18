"use client"

/**
 * AI Analysis Dashboard V2
 * Переработанная версия с детальным прогрессом и гибким выбором анализаторов
 */

import { Play, RefreshCw, Zap } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnalyzerCheckboxGroup, type AnalyzerType, type FileAnalysisProgress as FileProgress } from "@/features/ai-director"
import { FileAnalysisProgress } from "@/features/ai-director/components/file-analysis-progress"
import { createDemoFileProgress } from "@/features/ai-director/__mocks__/analysis-progress-demo"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AiAnalysisDashboardV2")

export function AIAnalysisDashboardV2() {
  // Selected analyzers
  const [selectedAnalyzers, setSelectedAnalyzers] = useState<Set<AnalyzerType>>(
    new Set(["scene_detection", "audio_quality", "moment_detection"]),
  )

  // Demo: file progress states
  const [filesProgress, setFilesProgress] = useState<FileProgress[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Start demo analysis
  const handleStartDemoAnalysis = () => {
    logger.infoSync("[Dashboard] Starting demo analysis", {
      selectedAnalyzers: Array.from(selectedAnalyzers),
    })

    setIsAnalyzing(true)

    // Load demo data
    const demoFiles = createDemoFileProgress()
    setFilesProgress(demoFiles)

    // Simulate completion after 5s
    setTimeout(() => {
      setIsAnalyzing(false)
      logger.infoSync("[Dashboard] Demo analysis completed")
    }, 5000)
  }

  // Reset all
  const handleReset = () => {
    logger.infoSync("[Dashboard] Resetting dashboard")
    setFilesProgress([])
    setIsAnalyzing(false)
    setSelectedAnalyzers(new Set(["scene_detection", "audio_quality", "moment_detection"]))
  }

  const showSetupPanel = !isAnalyzing && filesProgress.length === 0
  const showProgressPanel = filesProgress.length > 0

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-500" />
            AI Director 2.0
          </h1>
          <p className="text-muted-foreground mt-1">Детальный анализ с гибким выбором движков</p>
        </div>

        {/* Reset Button */}
        <Button onClick={handleReset} variant="outline" size="icon" className="h-10 w-10" title="Сбросить">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Analyzer Selection (25% width) */}
        {showSetupPanel && (
          <div className="lg:col-span-1">
            <AnalyzerCheckboxGroup selectedAnalyzers={selectedAnalyzers} onSelectionChange={setSelectedAnalyzers} />

            <Button
              onClick={handleStartDemoAnalysis}
              disabled={selectedAnalyzers.size === 0 || isAnalyzing}
              className="w-full mt-4 gap-2"
              size="lg"
            >
              <Play className="h-5 w-5" />
              {isAnalyzing ? "Анализ..." : "Начать анализ (Demo)"}
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-2">Demo режим: загрузит тестовые данные</p>
          </div>
        )}

        {/* Right Panel - Progress and Results */}
        <div className={showSetupPanel ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Progress Panel */}
          {showProgressPanel && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Прогресс анализа</h2>
                {!isAnalyzing && (
                  <Button onClick={handleReset} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Новый анализ
                  </Button>
                )}
              </div>

              {/* Files Progress */}
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {filesProgress.map((fileProgress) => (
                    <FileAnalysisProgress
                      key={fileProgress.fileId}
                      file={fileProgress}
                      defaultExpanded={fileProgress.status === "analyzing"}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Overall Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{filesProgress.length}</p>
                      <p className="text-sm text-muted-foreground">Всего файлов</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {filesProgress.filter((f) => f.status === "completed").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Завершено</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {filesProgress.filter((f) => f.status === "analyzing").length}
                      </p>
                      <p className="text-sm text-muted-foreground">В процессе</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {filesProgress.filter((f) => f.status === "error").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Ошибок</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty State */}
          {!showProgressPanel && (
            <Card>
              <CardContent className="py-16 text-center">
                <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Готов к анализу</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Выберите нужные анализаторы слева и нажмите "Начать анализ"
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Гибкий выбор движков позволяет точно настроить анализ под ваши задачи
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
