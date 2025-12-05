"use client"

/**
 * AI Director v3 Dashboard
 * Главный компонент для AI Director с minimalist design
 */

import { Settings, Zap } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBrowserState } from "@/domains/browser"
import { useMediaManagement } from "@/domains/media-management"
import { useModals, useNotifications } from "@/domains/system-integration"
import { createLogger } from "@/lib/tauri-logger"
import { useAIDirectorAnalysisV2 } from "../hooks/use-ai-director-analysis-v2"
import type { AnalysisSettings as AnalysisSettingsType } from "./analysis-settings"
import { AnalysisSettings } from "./analysis-settings"
import { EmptyState } from "./empty-state"
import { FileAnalysisCard, type FileAnalysisCardData } from "./file-analysis-card"
import { OverallProgressCard } from "./overall-progress-card"

const logger = createLogger("AIDirectorV3Dashboard")

export interface AIDirectorV3DashboardProps {
  /** Опционально: начальные файлы */
  initialFiles?: string[]
}

export function AIDirectorV3Dashboard(_props: AIDirectorV3DashboardProps) {
  // State
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettingsType>({
    mode: "balanced",
    analyzers: ["scene_detection", "audio_quality"],
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())

  // Hooks
  const { mediaPool } = useMediaManagement()
  const { showInfo, showSuccess, showWarning, showError } = useNotifications()
  const { closeModal } = useModals()
  const { switchTab } = useBrowserState()
  const { isAnalyzing, filesProgress, batchProgress, startBatchAnalysis, cancelAnalysis, reset } =
    useAIDirectorAnalysisV2()

  // Convert analyzers array to Set for backward compatibility
  const selectedAnalyzers = useMemo(() => new Set(analysisSettings.analyzers), [analysisSettings.analyzers])

  // Convert filesProgress to card data
  const fileCardsData = useMemo((): FileAnalysisCardData[] => {
    return filesProgress.map((file) => ({
      filePath: file.filePath,
      fileName: file.filePath.split("/").pop() || file.filePath,
      status: file.status as FileAnalysisCardData["status"],
      progress: file.progress,
      currentStage: file.currentStage,
      analyzers: file.analyzers.map((analyzer) => ({
        name: analyzer.type,
        status: analyzer.status as "pending" | "analyzing" | "completed" | "error",
      })),
      eta: file.eta,
      error: file.error,
    }))
  }, [filesProgress])

  // File statistics for overall card
  const fileStatistics = useMemo(() => {
    return {
      completed: filesProgress.filter((f) => f.status === "completed").length,
      analyzing: filesProgress.filter((f) => f.status === "analyzing").length,
      pending: filesProgress.filter((f) => f.status === "pending").length,
      error: filesProgress.filter((f) => f.status === "error").length,
    }
  }, [filesProgress])

  // Handlers
  const handleOpenMediaPool = useCallback(() => {
    logger.infoSync("[Dashboard v3] Opening Browser for import")
    // Закрываем модалку и переключаем на вкладку Media в Browser
    closeModal()
    switchTab("media")
  }, [closeModal, switchTab])

  const handleSelectionChange = useCallback((newSelection: Set<string>) => {
    setSelectedFileIds(newSelection)
  }, [])

  const handleStartAnalysisFromEmptyState = useCallback(
    async (fileIds: Set<string>) => {
      // Get paths from IDs
      const paths: string[] = []
      fileIds.forEach((fileId) => {
        const mediaFile = mediaPool.get(fileId)
        if (mediaFile) {
          paths.push(mediaFile.path)
        }
      })

      if (paths.length === 0) {
        showWarning("Файлы не выбраны", "Выберите файлы из медиапула")
        return
      }

      if (analysisSettings.analyzers.length === 0) {
        showWarning("Анализаторы не выбраны", "Выберите хотя бы один анализатор в настройках")
        return
      }

      try {
        logger.infoSync("[Dashboard v3] Starting batch analysis", {
          filesCount: paths.length,
          analyzers: analysisSettings.analyzers,
        })

        showSuccess("Анализ запущен", `Обработка ${paths.length} файл${paths.length > 1 ? "ов" : "а"}`)

        await startBatchAnalysis(paths, selectedAnalyzers)
        logger.infoSync("[Dashboard v3] Analysis started successfully")
      } catch (error) {
        logger.errorSync("[Dashboard v3] Error starting analysis", error as Record<string, unknown>)
        showError("Ошибка запуска анализа", error instanceof Error ? error.message : "Неизвестная ошибка")
      }
    },
    [mediaPool, analysisSettings.analyzers, selectedAnalyzers, startBatchAnalysis, showSuccess, showError, showWarning],
  )

  const handleReset = () => {
    logger.infoSync("[Dashboard v3] Resetting dashboard")
    reset()
    showInfo("Dashboard reset", "Ready for new analysis")
  }

  const handleCancel = () => {
    logger.infoSync("[Dashboard v3] Cancelling analysis")

    // Cancel ongoing analysis
    cancelAnalysis()

    showInfo("Analysis cancelled", "You can start a new analysis")
  }

  // UI State
  const hasFiles = filesProgress.length > 0
  const showEmptyState = !hasFiles

  return (
    <TooltipProvider>
      <div className="flex h-full w-full flex-col p-6 space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isAnalyzing ? 360 : 0 }}
              transition={{ duration: 2, repeat: isAnalyzing ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
            >
              <Zap className="h-8 w-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">AI Director v3</h1>
              <p className="text-sm text-muted-foreground">Batch analysis with real-time progress</p>
            </div>
          </div>

          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configure analysis settings</p>
              </TooltipContent>
            </Tooltip>
            <PopoverContent className="w-96" align="end">
              <AnalysisSettings
                settings={analysisSettings}
                onSettingsChange={setAnalysisSettings}
                disabled={isAnalyzing}
              />
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Empty State */}
        <AnimatePresence mode="wait">
          {showEmptyState && (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <EmptyState
                onSelectFiles={handleOpenMediaPool}
                onStartAnalysis={handleStartAnalysisFromEmptyState}
                mediaPool={mediaPool}
                selectedFileIds={selectedFileIds}
                onSelectionChange={handleSelectionChange}
                currentSettings={analysisSettings}
                isAnalyzing={isAnalyzing}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Analysis Progress */}
        {hasFiles && (
          <motion.div
            className="flex flex-col gap-6 flex-1 min-h-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Files Section Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                📁 Selected Files ({filesProgress.length})
              </h2>
              {!isAnalyzing && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={handleReset}>
                      New Analysis
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear current results and start over</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Files List */}
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                <AnimatePresence mode="popLayout">
                  {fileCardsData.map((file, index) => (
                    <motion.div
                      key={file.filePath}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      layout
                    >
                      <FileAnalysisCard file={file} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Overall Progress */}
            {batchProgress && (
              <OverallProgressCard
                progressData={{
                  progress: batchProgress.progress || 0,
                  completedFiles: batchProgress.completedFiles || 0,
                  totalFiles: batchProgress.totalFiles || 0,
                  estimatedTimeRemaining: batchProgress.estimatedTimeRemaining,
                  status: isAnalyzing ? "analyzing" : "completed",
                }}
                fileStatistics={fileStatistics}
                onCancel={isAnalyzing ? handleCancel : undefined}
              />
            )}

            {/* Active Analyzers Info */}
            <motion.div
              className="text-sm text-muted-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              ⚡ Mode: {analysisSettings.mode} • {analysisSettings.analyzers.length} analyzer
              {analysisSettings.analyzers.length !== 1 ? "s" : ""} active
            </motion.div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}
