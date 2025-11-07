import {
  Activity,
  AlertCircle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  FileVideo,
  Grid3X3,
  List,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Square,
  Target,
  Upload,
  Zap,
} from "lucide-react"
import { type FC, useCallback, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PipelineProgress } from "@/domains/ai-services"
import { IntelligentContent, UnifiedContentAnalysis } from "@/domains/ai-services/types"
import { MediaInfo } from "@/domains/media-management"
import { createDefaultAIConfig } from "@/domains/shared/utils/config"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useAIIntelligence } from "../../hooks/use-ai-intelligence"
import { useContentPipeline } from "../../hooks/use-content-pipeline"
import { AnalysisViewer } from "../analysis-viewer/analysis-viewer"
import { PreviewGrid } from "../preview-grid/preview-grid"

const logger = createLogger({ module: "UnifiedDashboard" })

interface UnifiedDashboardProps {
  className?: string
  mediaFiles?: MediaInfo[]
  onFileUpload?: (files: File[]) => void
  onAnalysisComplete?: (analysis: UnifiedContentAnalysis) => void
  onProcessingComplete?: (content: IntelligentContent) => void
  onError?: (error: Error) => void
}

type DashboardView = "overview" | "analysis" | "processing" | "results" | "settings"
type ProcessingStatus = "idle" | "analyzing" | "generating" | "adapting" | "completed" | "error"

export const UnifiedDashboard: FC<UnifiedDashboardProps> = ({
  className,
  mediaFiles = [],
  onFileUpload,
  onAnalysisComplete,
  onProcessingComplete,
  onError,
}) => {
  const [activeView, setActiveView] = useState<DashboardView>("overview")
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("idle")
  const [currentAnalysis, setCurrentAnalysis] = useState<UnifiedContentAnalysis | null>(null)
  const [processingResults, setProcessingResults] = useState<IntelligentContent | null>(null)
  const [processingProgress, setProcessingProgress] = useState<PipelineProgress | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  // AI Intelligence Hook
  const {
    isProcessing: aiProcessing,
    progress: aiProgress,
    error: aiError,
    result: aiResult,
    analyzeContent,
    processProject,
    pausePipeline,
    resumePipeline,
    cancelPipeline,
    reset: resetAI,
  } = useAIIntelligence({
    onProgress: setProcessingProgress,
    onComplete: (result) => {
      setProcessingResults(result)
      setProcessingStatus("completed")
      onProcessingComplete?.(result)
    },
    onError: (error) => {
      setProcessingStatus("error")
      onError?.(error)
    },
  })

  // Content Pipeline Hook
  const {
    isRunning: pipelineRunning,
    isPaused: pipelinePaused,
    results: pipelineResults,
    startPipeline,
    pausePipeline: pauseContentPipeline,
    resumePipeline: resumeContentPipeline,
    stopPipeline,
  } = useContentPipeline()

  // Combined processing state
  const isProcessing = aiProcessing || pipelineRunning
  const isPaused = pipelinePaused
  const currentProgress = aiProgress || processingProgress

  // Handle file upload
  const handleFileUpload = useCallback(
    (files: File[]) => {
      onFileUpload?.(files)
      setProcessingStatus("idle")
      setCurrentAnalysis(null)
      setProcessingResults(null)
      setProcessingProgress(null)
    },
    [onFileUpload],
  )

  // Start AI analysis
  const handleStartAnalysis = useCallback(async () => {
    if (mediaFiles.length === 0) return

    try {
      setProcessingStatus("analyzing")
      setActiveView("processing")

      const config = createDefaultAIConfig({
        features: {
          sceneAnalysis: true,
          scriptGeneration: true,
          multiPlatform: true,
          contentClassification: true,
          qualityEnhancement: true,
          autoSuggestions: false,
        },
        platforms: [],
      })

      const analysis = await analyzeContent(mediaFiles, config)
      setCurrentAnalysis(analysis)
      setProcessingStatus("completed")
      setActiveView("analysis")
      onAnalysisComplete?.(analysis)
    } catch (error) {
      setProcessingStatus("error")
      onError?.(error as Error)
    }
  }, [mediaFiles, analyzeContent, onAnalysisComplete, onError])

  // Start full AI processing
  const handleStartProcessing = useCallback(async () => {
    if (mediaFiles.length === 0) return

    try {
      setProcessingStatus("analyzing")
      setActiveView("processing")

      const config = createDefaultAIConfig({
        features: {
          sceneAnalysis: true,
          scriptGeneration: true,
          multiPlatform: true,
          contentClassification: true,
          qualityEnhancement: true,
          autoSuggestions: false,
        },
        platforms: [],
      })

      await processProject(mediaFiles, config)
    } catch (error) {
      setProcessingStatus("error")
      onError?.(error as Error)
    }
  }, [mediaFiles, processProject, onError])

  // Control functions
  const handlePause = useCallback(async () => {
    await pausePipeline()
    await pauseContentPipeline()
  }, [pausePipeline, pauseContentPipeline])

  const handleResume = useCallback(async () => {
    await resumePipeline()
    await resumeContentPipeline()
  }, [resumePipeline, resumeContentPipeline])

  const handleStop = useCallback(async () => {
    await cancelPipeline()
    await stopPipeline()
    setProcessingStatus("idle")
    setProcessingProgress(null)
    setActiveView("overview")
  }, [cancelPipeline, stopPipeline])

  const handleReset = useCallback(() => {
    resetAI()
    setProcessingStatus("idle")
    setCurrentAnalysis(null)
    setProcessingResults(null)
    setProcessingProgress(null)
    setSelectedFiles(new Set())
    setActiveView("overview")
  }, [resetAI])

  // Statistics for overview
  const stats = useMemo(() => {
    const totalFiles = mediaFiles.length
    const processedFiles = currentAnalysis ? 1 : 0
    const analysisComplete = currentAnalysis !== null
    const processingComplete = processingResults !== null

    return {
      totalFiles,
      processedFiles,
      analysisComplete,
      processingComplete,
      successRate: totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0,
    }
  }, [mediaFiles, currentAnalysis, processingResults])

  return (
    <div className={cn("unified-dashboard h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">AI Content Intelligence</h1>
          </div>
          <Badge variant="secondary" className="ml-2">
            {stats.totalFiles} файлов
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Processing Controls */}
          {isProcessing && (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Button size="sm" onClick={handleResume}>
                  <Play className="w-4 h-4 mr-2" />
                  Продолжить
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handlePause}>
                  <Pause className="w-4 h-4 mr-2" />
                  Пауза
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={handleStop}>
                <Square className="w-4 h-4 mr-2" />
                Остановить
              </Button>
            </div>
          )}

          {/* Main Actions */}
          {!isProcessing && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveView("settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Настройки
              </Button>

              <Button size="sm" onClick={handleStartAnalysis} disabled={mediaFiles.length === 0}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Анализ
              </Button>

              <Button onClick={handleStartProcessing} disabled={mediaFiles.length === 0}>
                <Zap className="w-4 h-4 mr-2" />
                Полная обработка
              </Button>
            </div>
          )}

          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isProcessing && currentProgress && (
        <div className="px-6 py-3 border-b bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">{currentProgress.currentStep}</span>
              {isPaused && (
                <Badge variant="secondary" className="text-xs">
                  Пауза
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">{currentProgress.overall}%</span>
          </div>
          <Progress value={currentProgress.overall} className="h-2" />
          {currentProgress.details && <p className="text-xs text-muted-foreground mt-1">{currentProgress.details}</p>}
        </div>
      )}

      {/* Navigation Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as DashboardView)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start px-6 py-0 h-12 bg-transparent border-b rounded-none">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!currentAnalysis}>
            <BarChart3 className="w-4 h-4" />
            Анализ
          </TabsTrigger>
          <TabsTrigger value="processing" className="flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Обработка
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!processingResults}>
            <Target className="w-4 h-4" />
            Результаты
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Настройки
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="overview" className="h-full mt-0">
            <OverviewTab
              stats={stats}
              mediaFiles={mediaFiles}
              processingStatus={processingStatus}
              onFileUpload={handleFileUpload}
              onStartAnalysis={handleStartAnalysis}
              onStartProcessing={handleStartProcessing}
            />
          </TabsContent>

          <TabsContent value="analysis" className="h-full mt-0">
            <AnalysisTab
              analysis={currentAnalysis}
              onSceneSelect={(sceneId) => logger.info("Scene selected:", sceneId)}
              onMomentSelect={(momentId) => logger.info("Moment selected:", momentId)}
            />
          </TabsContent>

          <TabsContent value="processing" className="h-full mt-0">
            <ProcessingTab
              status={processingStatus}
              progress={currentProgress}
              isProcessing={isProcessing}
              isPaused={isPaused}
              error={aiError}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
            />
          </TabsContent>

          <TabsContent value="results" className="h-full mt-0">
            <ResultsTab results={processingResults} analysis={currentAnalysis} />
          </TabsContent>

          <TabsContent value="settings" className="h-full mt-0">
            <SettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// Overview Tab Component
interface OverviewTabProps {
  stats: {
    totalFiles: number
    processedFiles: number
    analysisComplete: boolean
    processingComplete: boolean
    successRate: number
  }
  mediaFiles: MediaInfo[]
  processingStatus: ProcessingStatus
  onFileUpload: (files: File[]) => void
  onStartAnalysis: () => void
  onStartProcessing: () => void
}

const OverviewTab: FC<OverviewTabProps> = ({
  stats,
  mediaFiles,
  processingStatus,
  onFileUpload,
  onStartAnalysis,
  onStartProcessing,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Загружено файлов"
            value={stats.totalFiles}
            icon={<FileVideo className="w-5 h-5" />}
            color="blue"
          />
          <StatsCard
            title="Обработано"
            value={stats.processedFiles}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Успешность"
            value={`${stats.successRate.toFixed(0)}%`}
            icon={<BarChart3 className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="Статус"
            value={getStatusText(processingStatus)}
            icon={getStatusIcon(processingStatus)}
            color={getStatusColor(processingStatus)}
          />
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="w-6 h-6" />
                <span>Загрузить файлы</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2"
                onClick={onStartAnalysis}
                disabled={mediaFiles.length === 0}
              >
                <BarChart3 className="w-6 h-6" />
                <span>Начать анализ</span>
              </Button>

              <Button
                className="h-20 flex flex-col gap-2"
                onClick={onStartProcessing}
                disabled={mediaFiles.length === 0}
              >
                <Brain className="w-6 h-6" />
                <span>AI обработка</span>
              </Button>
            </div>

            <input
              id="file-upload"
              type="file"
              multiple
              accept="video/*,audio/*"
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                onFileUpload(files)
              }}
            />
          </CardContent>
        </Card>

        {/* Recent Files */}
        {mediaFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5" />
                Загруженные файлы
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mediaFiles.slice(0, 5).map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileVideo className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {formatDuration(file.duration)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{file.format}</Badge>
                  </div>
                ))}

                {mediaFiles.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    и еще {mediaFiles.length - 5} файлов...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

// Analysis Tab Component
interface AnalysisTabProps {
  analysis: UnifiedContentAnalysis | null
  onSceneSelect: (sceneId: string) => void
  onMomentSelect: (momentId: string) => void
}

const AnalysisTab: FC<AnalysisTabProps> = ({ analysis, onSceneSelect, onMomentSelect }) => {
  return (
    <div className="h-full">
      <AnalysisViewer
        analysis={analysis}
        className="h-full"
        onSceneSelect={onSceneSelect}
        onMomentSelect={onMomentSelect}
      />
    </div>
  )
}

// Processing Tab Component
interface ProcessingTabProps {
  status: ProcessingStatus
  progress: PipelineProgress | null
  isProcessing: boolean
  isPaused: boolean
  error: Error | null
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

const ProcessingTab: FC<ProcessingTabProps> = ({
  status,
  progress,
  isProcessing,
  isPaused,
  error,
  onPause,
  onResume,
  onStop,
}) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Processing Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cpu className="w-5 h-5" />}
              Состояние обработки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Статус:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span>{getStatusText(status)}</span>
                  {isPaused && <Badge variant="secondary">Пауза</Badge>}
                </div>
              </div>

              {progress && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Прогресс:</span>
                      <span className="text-sm text-muted-foreground">{progress.overall}%</span>
                    </div>
                    <Progress value={progress.overall} />
                  </div>

                  {progress.currentStep && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Текущий шаг:</span>
                      <span className="text-sm">{progress.currentStep}</span>
                    </div>
                  )}

                  {progress.details && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Детали:</span>
                      <span className="text-sm text-muted-foreground">{progress.details}</span>
                    </div>
                  )}
                </>
              )}

              {/* Control Buttons */}
              {isProcessing && (
                <div className="flex items-center gap-2 pt-4">
                  {isPaused ? (
                    <Button onClick={onResume}>
                      <Play className="w-4 h-4 mr-2" />
                      Продолжить
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={onPause}>
                      <Pause className="w-4 h-4 mr-2" />
                      Пауза
                    </Button>
                  )}
                  <Button variant="destructive" onClick={onStop}>
                    <Square className="w-4 h-4 mr-2" />
                    Остановить
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Ошибка обработки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Processing Steps Info */}
        <Card>
          <CardHeader>
            <CardTitle>Этапы обработки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ProcessingStep
                title="Анализ контента"
                description="Определение сцен, объектов, лиц и текста"
                status={getStepStatus("analyzing", status)}
              />
              <ProcessingStep
                title="Генерация скрипта"
                description="Создание нарративной структуры и диалогов"
                status={getStepStatus("generating", status)}
              />
              <ProcessingStep
                title="Адаптация для платформ"
                description="Оптимизация для различных социальных сетей"
                status={getStepStatus("adapting", status)}
              />
              <ProcessingStep
                title="Завершение"
                description="Финализация и подготовка результатов"
                status={getStepStatus("completed", status)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// Results Tab Component
interface ResultsTabProps {
  results: IntelligentContent | null
  analysis: UnifiedContentAnalysis | null
}

const ResultsTab: FC<ResultsTabProps> = ({ results, analysis }) => {
  const [previewMode, setPreviewMode] = useState<"grid" | "list">("grid")

  if (!results && !analysis) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Результаты появятся после завершения обработки</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Results Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-semibold">Результаты обработки</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          <div className="flex items-center border rounded">
            <Button
              variant={previewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="flex-1 overflow-hidden">
        {analysis && (
          <PreviewGrid
            analysis={analysis}
            viewMode={previewMode}
            className="h-full"
            enableSelection={true}
            onItemSelect={(item) => logger.info("Item selected:", item)}
            onItemPlay={(item) => logger.info("Play item:", item)}
            onItemDownload={(item) => logger.info("Download item:", item)}
          />
        )}
      </div>
    </div>
  )
}

// Settings Tab Component
const SettingsTab: FC = () => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Настройки анализа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Детекция сцен</span>
                <Badge variant="secondary">Включено</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Распознавание объектов</span>
                <Badge variant="secondary">Включено</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Анализ аудио</span>
                <Badge variant="secondary">Включено</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Генерация скрипта</span>
                <Badge variant="secondary">Включено</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Настройки экспорта</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Формат результатов</span>
                <Badge variant="outline">JSON</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Включать превью</span>
                <Badge variant="secondary">Да</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Качество превью</span>
                <Badge variant="outline">Высокое</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}

// Helper Components
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: "blue" | "green" | "purple" | "red" | "yellow"
}

const StatsCard: FC<StatsCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
    red: "text-red-600 bg-red-50",
    yellow: "text-yellow-600 bg-yellow-50",
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ProcessingStepProps {
  title: string
  description: string
  status: "pending" | "active" | "completed" | "error"
}

const ProcessingStep: FC<ProcessingStepProps> = ({ title, description, status }) => {
  const getIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "active":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex items-start gap-3">
      {getIcon()}
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

// Utility Functions
function getStatusText(status: ProcessingStatus): string {
  switch (status) {
    case "idle":
      return "Ожидание"
    case "analyzing":
      return "Анализ"
    case "generating":
      return "Генерация"
    case "adapting":
      return "Адаптация"
    case "completed":
      return "Завершено"
    case "error":
      return "Ошибка"
    default:
      return "Неизвестно"
  }
}

function getStatusIcon(status: ProcessingStatus): React.ReactNode {
  switch (status) {
    case "idle":
      return <Clock className="w-4 h-4 text-muted-foreground" />
    case "analyzing":
    case "generating":
    case "adapting":
      return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
    case "completed":
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-600" />
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />
  }
}

function getStatusColor(status: ProcessingStatus): "blue" | "green" | "purple" | "red" | "yellow" {
  switch (status) {
    case "idle":
      return "blue"
    case "analyzing":
    case "generating":
    case "adapting":
      return "yellow"
    case "completed":
      return "green"
    case "error":
      return "red"
    default:
      return "blue"
  }
}

function getStepStatus(step: string, currentStatus: ProcessingStatus): "pending" | "active" | "completed" | "error" {
  if (currentStatus === "error") return "error"
  if (currentStatus === "completed") return "completed"
  if (currentStatus === step) return "active"

  const steps = ["analyzing", "generating", "adapting", "completed"]
  const currentIndex = steps.indexOf(currentStatus)
  const stepIndex = steps.indexOf(step)

  if (stepIndex < currentIndex) return "completed"
  if (stepIndex === currentIndex) return "active"
  return "pending"
}

function formatFileSize(bytes: number): string {
  const units = ["Б", "КБ", "МБ", "ГБ"]
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`
}
