"use client"

/**
 * AI Analysis Dashboard V2
 * Переработанная версия с детальным прогрессом и гибким выбором анализаторов
 */

import { Play, RefreshCw, Zap } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBrowser } from "@/domains/browser"
import { useMediaManagement } from "@/domains/media-management"
import {
  AIDirectorChat,
  AIDirectorDashboard,
  AnalyzerCheckboxGroup,
  AnalyzerPresetSelector,
  type AnalyzerType,
  useAIDirectorAnalysisV2,
  useAIDirectorDashboard,
  useAnalyzerPresets,
} from "@/features/ai-director"
import { FileAnalysisProgress } from "@/features/ai-director/components/file-analysis-progress"
import { useTimeline } from "@/features/timeline"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AiAnalysisDashboardV2")

export function AIAnalysisDashboardV2() {
  // Selected analyzers
  const [selectedAnalyzers, setSelectedAnalyzers] = useState<Set<AnalyzerType>>(
    new Set(["scene_detection", "audio_quality", "moment_detection"]),
  )

  // Get selected files from media pool
  const { browserState } = useBrowser()
  const { mediaPool } = useMediaManagement()
  const { project } = useTimeline()

  // Convert selected file IDs to full paths
  // ВАЖНО: Берем файлы именно из вкладки "media", а не из activeTab
  const selectedFilePaths = useMemo(() => {
    const mediaTabSelectedFiles = browserState?.selected_files?.["media"] || []

    logger.infoSync("[Dashboard] Converting selected files to paths", {
      selectedFilesCount: mediaTabSelectedFiles.length,
      mediaPoolSize: mediaPool.size,
      hasProject: !!project,
      selectedFileIds: mediaTabSelectedFiles,
    })

    const paths: string[] = []
    mediaTabSelectedFiles.forEach((fileId) => {
      // Try mediaPool first
      const mediaFile = mediaPool.get(fileId)

      logger.infoSync(`[Dashboard] Checking file ${fileId}`, {
        foundInMediaPool: !!mediaFile,
        path: mediaFile?.path,
      })

      if (mediaFile) {
        paths.push(mediaFile.path)
      }
    })

    logger.infoSync("[Dashboard] Final paths", { pathsCount: paths.length, paths })
    return paths
  }, [browserState, mediaPool])

  // Use AI Director Analysis V2 hook
  const { isAnalyzing, filesProgress, startBatchAnalysis, reset } = useAIDirectorAnalysisV2()

  // Use analyzer presets hook
  const { customPresets, savePreset, deletePreset, applyPreset } = useAnalyzerPresets()

  // Use AI Director Dashboard hook
  const { agents, stats, startWorkflow, updateAgent, clearCompleted } = useAIDirectorDashboard(filesProgress)

  // Handle start analysis with files from media pool
  const handleStartAnalysis = async () => {
    try {
      if (selectedFilePaths.length === 0) {
        logger.warnSync("[Dashboard] No files selected in media pool")
        return
      }

      logger.infoSync("[Dashboard] Starting analysis for selected files from media pool", {
        filesCount: selectedFilePaths.length,
        analyzers: Array.from(selectedAnalyzers),
      })

      // Start analysis
      await startBatchAnalysis(selectedFilePaths, selectedAnalyzers)

      logger.infoSync("[Dashboard] Analysis started successfully")
    } catch (error) {
      logger.errorSync("[Dashboard] Error starting analysis", error as Record<string, unknown>)
    }
  }

  // Reset all
  const handleReset = () => {
    logger.infoSync("[Dashboard] Resetting dashboard")
    reset()
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
          <div className="lg:col-span-1 space-y-4">
            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets">Preset'ы</TabsTrigger>
                <TabsTrigger value="manual">Ручной выбор</TabsTrigger>
              </TabsList>

              <TabsContent value="presets" className="mt-4">
                <AnalyzerPresetSelector
                  selectedAnalyzers={selectedAnalyzers}
                  customPresets={customPresets}
                  onApplyPreset={(preset) => applyPreset(preset, setSelectedAnalyzers)}
                  onSavePreset={savePreset}
                  onDeletePreset={deletePreset}
                />
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <AnalyzerCheckboxGroup selectedAnalyzers={selectedAnalyzers} onSelectionChange={setSelectedAnalyzers} />
              </TabsContent>
            </Tabs>

            <Button
              onClick={handleStartAnalysis}
              disabled={selectedAnalyzers.size === 0 || isAnalyzing || selectedFilePaths.length === 0}
              className="w-full gap-2"
              size="lg"
            >
              <Play className="h-5 w-5" />
              {isAnalyzing ? "Анализ..." : "Начать анализ"}
            </Button>

            {selectedFilePaths.length > 0 ? (
              <p className="text-xs text-muted-foreground text-center">
                Выбрано файлов: <span className="font-semibold">{selectedFilePaths.length}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Выберите файлы в медиа пуле для анализа</p>
            )}
          </div>
        )}

        {/* Right Panel - Progress and Results */}
        <div className={showSetupPanel ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Progress Panel */}
          {showProgressPanel && (
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="progress">Прогресс анализа</TabsTrigger>
                <TabsTrigger value="dashboard">AI Dashboard</TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-4 mt-4">
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

                {/* AI Director Chat - показываем когда есть завершенные файлы */}
                {filesProgress.some((f) => f.status === "completed") && (
                  <AIDirectorChat filesProgress={filesProgress} className="mt-6" />
                )}
              </TabsContent>

              <TabsContent value="dashboard" className="mt-4">
                <AIDirectorDashboard agents={agents} stats={stats} onWorkflowSelect={startWorkflow} />
              </TabsContent>
            </Tabs>
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
