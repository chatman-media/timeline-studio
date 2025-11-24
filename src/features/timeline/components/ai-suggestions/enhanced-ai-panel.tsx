/**
 * Enhanced AI Panel - Real AI Content Intelligence Integration
 * Заменяет заглушку настоящей интеграцией с UnifiedDashboard
 */

import { AlertCircle, BarChart3, Bot, Globe, Sparkles, Target } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
// REMOVED: executeContentIntelligenceTool - legacy code deleted, will be replaced by AI Director v2
// import { executeContentIntelligenceTool } from "@/domains/ai-tools/tools/analysis/content-intelligence"
import { MediaInfo } from "@/domains/media-management"
import type { TimelineClip as DomainTimelineClip } from "@/domains/video-editing/types"
// MIGRATION NOTE: UnifiedDashboard removed - use AI Director integration instead
// import { UnifiedDashboard } from "@/features/ai-content-intelligence"
import { useTimeline } from "@/features/timeline"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

const logger = createLogger("EnhancedAiPanel")

interface EnhancedAIPanelProps {
  className?: string
}

interface QuickAnalysis {
  id: string
  name: string
  icon: React.ReactNode
  operation: string
  description: string
}

export function EnhancedAIPanel({ className }: EnhancedAIPanelProps) {
  const { clips, tracks, project } = useTimeline()
  const [error, setError] = useState<Error | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisType, setAnalysisType] = useState<string>("full")
  const [selectedOperation, setSelectedOperation] = useState<string>("analyze_content")
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  // Конвертируем клипы и треки в медиа файлы для AI анализа
  const getMediaFiles = useCallback((): MediaInfo[] => {
    if (!clips || clips.length === 0) {
      return []
    }

    return clips.map((clip, index) => ({
      id: clip.id || `clip-${index}`,
      name: clip.name || `Clip ${index + 1}`,
      path: clip.mediaFile?.path || "",
      type: "video", // По умолчанию - все клипы считаем видео
      duration: clip.duration || 0,
      size: clip.mediaFile?.size || 0,
      format: (clip.mediaFile as any)?.format || "mp4",
      width: clip.mediaFile?.width || 1920,
      height: clip.mediaFile?.height || 1080,
      fps: clip.mediaFile?.fps || 30,
      bitrate: (clip.mediaFile as any)?.bitrate || 0,
      codec: (clip.mediaFile as any)?.videoCodec || "h264",
      audioCodec: (clip.mediaFile as any)?.audioCodec || "aac",
      audioChannels: clip.mediaFile?.audioChannels || 2,
      metadata: {
        trackId: clip.trackId,
        startTime: clip.startTime,
        endTime: clip.startTime + clip.duration,
        trimStart: (clip as DomainTimelineClip).sourceIn || 0,
        trimEnd: (clip as DomainTimelineClip).sourceOut || clip.duration,
        mediaFile: clip.mediaFile,
      },
    })) as unknown as MediaInfo[]
  }, [clips])

  // MIGRATION NOTE: Removed Dashboard-specific handlers (handleFileUpload, handleAnalysisComplete, handleProcessingComplete)
  // These will be reimplemented with AI Director integration

  const handleError = useCallback((error: Error) => {
    logger.error("AI Panel: Error occurred", { error })
    setError(error)
    setIsProcessing(false)
  }, [])

  const mediaFiles = getMediaFiles()

  // Доступные операции AI анализа
  const quickAnalyses = useMemo<QuickAnalysis[]>(
    () => [
      {
        id: "scene_analysis",
        name: "Анализ сцен",
        icon: <BarChart3 className="h-4 w-4" />,
        operation: "detect_scenes",
        description: "Обнаружение границ сцен и ключевых кадров",
      },
      {
        id: "content_classification",
        name: "Классификация",
        icon: <Target className="h-4 w-4" />,
        operation: "classify_content",
        description: "Классификация контента по жанрам и тематике",
      },
      {
        id: "platform_adaptation",
        name: "Платформы",
        icon: <Globe className="h-4 w-4" />,
        operation: "adapt_platform",
        description: "Адаптация контента под разные платформы",
      },
      {
        id: "audience_analysis",
        name: "Аудитория",
        icon: <Bot className="h-4 w-4" />,
        operation: "analyze_audience",
        description: "Анализ целевой аудитории и предпочтений",
      },
    ],
    [],
  )

  // Выполнение быстрого анализа
  const handleQuickAnalysis = useCallback(
    async (analysis: QuickAnalysis) => {
      if (!clips || clips.length === 0) {
        setError(new Error("Нет медиа файлов для анализа"))
        return
      }

      setIsProcessing(true)
      setError(null)

      try {
        // REMOVED: executeContentIntelligenceTool - will be replaced by AI Director v2
        // const result = await executeContentIntelligenceTool(analysis.operation, {
        //   mediaFiles: mediaFiles,
        //   options: {
        //     projectTitle: project?.name || "Timeline Project",
        //     targetPlatforms: ["youtube", "instagram", "tiktok"],
        //     language: "ru",
        //     audience: "general",
        //   },
        // })

        // Temporary message until AI Director v2 is implemented
        setError(new Error("Эта функция будет доступна в AI Director v2. Используйте AI Chat для анализа."))
        logger.info(`AI Panel: ${analysis.name} temporary disabled, waiting for v2`)
      } catch (error) {
        logger.error(`AI Panel: ${analysis.name} failed`, { error })
        setError(error instanceof Error ? error : new Error("Ошибка анализа"))
      } finally {
        setIsProcessing(false)
      }
    },
    [clips, mediaFiles, project?.name],
  )

  return (
    <div className={cn("h-full w-full bg-muted/30 border-l border-border flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI Content Intelligence</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">AI анализ и предложения для улучшения контента</p>

        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {quickAnalyses.map((analysis) => (
            <Button
              key={analysis.id}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAnalysis(analysis)}
              disabled={isProcessing || !clips?.length}
              className="justify-start"
            >
              {analysis.icon}
              <span className="ml-2 text-xs">{analysis.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error.message || "Произошла ошибка при анализе контента"}</AlertDescription>
          </Alert>
        )}

        {/* Результаты анализа */}
        {analysisResults && (
          <div className="m-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100">{analysisResults.analysis} завершен</h4>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>Найдено рекомендаций: {analysisResults.results?.recommendations?.length || 0}</p>
              <p>Обнаружено проблем: {analysisResults.results?.warnings?.length || 0}</p>
            </div>
          </div>
        )}

        {clips && clips.length > 0 ? (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground max-w-md">
              <div className="mb-4">
                <Bot className="h-16 w-16 mx-auto text-blue-500 opacity-50" />
              </div>
              <p className="mb-2 text-lg font-medium">AI Dashboard временно недоступен</p>
              <p className="text-sm mb-4">Идет миграция на новый AI Director для более мощного анализа контента</p>
              <p className="text-xs text-muted-foreground/70">
                Используйте кнопки быстрого анализа выше для основных операций
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="mb-4">
                <Sparkles className="h-12 w-12 mx-auto text-blue-500 opacity-50" />
              </div>
              <p className="mb-2">Нет медиа файлов для анализа</p>
              <p className="text-sm">Добавьте видео или аудио в таймлайн, чтобы начать AI анализ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
