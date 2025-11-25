"use client"

/**
 * AI Director v3 Dashboard
 * Главный компонент для AI Director с minimalist design
 */

import { Settings, Zap } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBrowser } from "@/domains/browser"
import { useMediaManagement } from "@/domains/media-management"
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import { useModal } from "@/features/modals"
import { createLogger } from "@/lib/tauri-logger"
import type { AnalysisSettings as AnalysisSettingsType } from "./analysis-settings"
import { AnalysisSettings } from "./analysis-settings"
import { EmptyState } from "./empty-state"
import { FileAnalysisCard, type FileAnalysisCardData } from "./file-analysis-card"
import { MediaPoolSelector } from "./media-pool-selector"
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

  // Hooks
  const { browserState } = useBrowser()
  const { mediaPool } = useMediaManagement()
  const { openModal } = useModal()
  const { isAnalyzing, filesProgress, batchProgress, startBatchAnalysis, cancelAnalysis, reset } =
    useAIDirectorAnalysisV2()

  // Convert analyzers array to Set for backward compatibility
  const selectedAnalyzers = useMemo(() => new Set(analysisSettings.analyzers), [analysisSettings.analyzers])

  // Get selected files from media pool
  const selectedFilePaths = useMemo(() => {
    const mediaTabSelectedFiles = browserState?.selected_files?.media || []

    logger.infoSync("[Dashboard v3] Converting selected files to paths", {
      selectedFilesCount: mediaTabSelectedFiles.length,
      mediaPoolSize: mediaPool.size,
    })

    const paths: string[] = []
    mediaTabSelectedFiles.forEach((fileId) => {
      const mediaFile = mediaPool.get(fileId)
      if (mediaFile) {
        paths.push(mediaFile.path)
      }
    })

    logger.infoSync("[Dashboard v3] Final paths", { pathsCount: paths.length })
    return paths
  }, [browserState, mediaPool])

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
  const handleOpenMediaPool = () => {
    logger.infoSync("[Dashboard v3] Opening Browser modal")

    // NOTE: Browser tab is already open and functional
    // Files are selected from the Media tab in the Browser panel
    // This is a user instruction toast for better UX
    toast.info("Select files from Browser", {
      description: "Use the Media tab in Browser to select files for analysis",
      duration: 5000,
    })
  }

  const handleStartAnalysis = async () => {
    try {
      if (selectedFilePaths.length === 0) {
        logger.warnSync("[Dashboard v3] No files selected")
        toast.warning("No files selected", {
          description: "Please select files from the media pool first",
        })
        return
      }

      if (analysisSettings.analyzers.length === 0) {
        toast.warning("No analyzers selected", {
          description: "Please select at least one analyzer in Settings",
        })
        return
      }

      logger.infoSync("[Dashboard v3] Starting batch analysis", {
        filesCount: selectedFilePaths.length,
        analyzers: Array.from(selectedAnalyzers),
      })

      toast.success("Analysis started", {
        description: `Processing ${selectedFilePaths.length} file${selectedFilePaths.length > 1 ? "s" : ""}`,
      })

      await startBatchAnalysis(selectedFilePaths, selectedAnalyzers)

      logger.infoSync("[Dashboard v3] Analysis started successfully")
    } catch (error) {
      logger.errorSync("[Dashboard v3] Error starting analysis", error as Record<string, unknown>)
      toast.error("Failed to start analysis", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    }
  }

  const handleReset = () => {
    logger.infoSync("[Dashboard v3] Resetting dashboard")
    reset()
    toast.info("Dashboard reset", {
      description: "Ready for new analysis",
    })
  }

  const handleCancel = () => {
    logger.infoSync("[Dashboard v3] Cancelling analysis")

    // Cancel ongoing analysis
    cancelAnalysis()

    toast.info("Analysis cancelled", {
      description: "You can start a new analysis",
    })
  }

  // UI State
  const hasFiles = filesProgress.length > 0
  const showEmptyState = !hasFiles

  return (
    <TooltipProvider>
      <div className="flex h-full w-full flex-col p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
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
        </div>

        {/* Empty State */}
        {showEmptyState && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <EmptyState onSelectFiles={handleOpenMediaPool} currentSettings={analysisSettings} />
          </div>
        )}

        {/* Analysis Progress */}
        {hasFiles && (
          <div className="flex flex-col gap-6 flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                {fileCardsData.map((file, index) => (
                  <div
                    key={file.filePath}
                    className="animate-in fade-in slide-in-from-left-4 duration-500"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                  >
                    <FileAnalysisCard file={file} />
                  </div>
                ))}
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
            <div className="text-sm text-muted-foreground text-center">
              ⚡ Mode: {analysisSettings.mode} • {analysisSettings.analyzers.length} analyzer
              {analysisSettings.analyzers.length !== 1 ? "s" : ""} active
            </div>
          </div>
        )}

        {/* Start Analysis Button (when files selected but not analyzing) */}
        {!hasFiles && selectedFilePaths.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <MediaPoolSelector
              selectedCount={selectedFilePaths.length}
              onOpenMediaPool={handleOpenMediaPool}
              disabled={isAnalyzing}
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleStartAnalysis}
                  disabled={isAnalyzing || analysisSettings.analyzers.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? "Analyzing..." : "Start Analysis"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {analysisSettings.analyzers.length === 0
                    ? "Please select at least one analyzer in Settings"
                    : `Analyze ${selectedFilePaths.length} file${selectedFilePaths.length > 1 ? "s" : ""} with ${analysisSettings.analyzers.length} analyzer${analysisSettings.analyzers.length > 1 ? "s" : ""}`}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
