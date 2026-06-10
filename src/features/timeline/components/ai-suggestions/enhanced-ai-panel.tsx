/**
 * Enhanced AI Panel - Real AI Content Intelligence Integration
 * Заменяет заглушку настоящей интеграцией с UnifiedDashboard
 */

import { AlertCircle, BarChart3, Bot, Globe, Sparkles, Target } from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Button } from "@timeline-studio/ui/components/button"
// REMOVED: executeContentIntelligenceTool - legacy code deleted, will be replaced by AI Director v2
// import { executeContentIntelligenceTool } from "@timeline-studio/domains/ai-tools/tools/analysis/content-intelligence"
import { MediaInfo } from "@timeline-studio/core/types"
import type { TimelineClip as CoreTimelineClip } from "@timeline-studio/core/types/timeline"
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
        trimStart: (clip as CoreTimelineClip).sourceIn || 0,
        trimEnd: (clip as CoreTimelineClip).sourceOut || clip.duration,
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
        icon: <BarChart3 className="h-4 w-4" data-oid="xud3-p:" />,
        operation: "detect_scenes",
        description: "Обнаружение границ сцен и ключевых кадров",
      },
      {
        id: "content_classification",
        name: "Классификация",
        icon: <Target className="h-4 w-4" data-oid="84vb9au" />,
        operation: "classify_content",
        description: "Классификация контента по жанрам и тематике",
      },
      {
        id: "platform_adaptation",
        name: "Платформы",
        icon: <Globe className="h-4 w-4" data-oid="ft2jhhk" />,
        operation: "adapt_platform",
        description: "Адаптация контента под разные платформы",
      },
      {
        id: "audience_analysis",
        name: "Аудитория",
        icon: <Bot className="h-4 w-4" data-oid="ezr9ty3" />,
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
    <div className={cn("h-full w-full bg-muted/30 border-l border-border flex flex-col", className)} data-oid="8zecv8u">
      <div className="p-4 border-b border-border" data-oid="d:mqx37">
        <div className="flex items-center gap-2 mb-2" data-oid="2:3higr">
          <Sparkles className="h-5 w-5 text-blue-500" data-oid="_6_7h83" />
          <h3 className="text-lg font-semibold" data-oid="cr0i5y2">
            AI Content Intelligence
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3" data-oid="xu8j0d3">
          AI анализ и предложения для улучшения контента
        </p>

        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-2 mt-3" data-oid="k-a8o4y">
          {quickAnalyses.map((analysis) => (
            <Button
              key={analysis.id}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAnalysis(analysis)}
              disabled={isProcessing || !clips?.length}
              className="justify-start"
              data-oid="pfne.02"
            >
              {analysis.icon}
              <span className="ml-2 text-xs" data-oid="2mi2kub">
                {analysis.name}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden" data-oid="h6il3aq">
        {error && (
          <Alert variant="destructive" className="m-4" data-oid="se_nx_i">
            <AlertCircle className="h-4 w-4" data-oid="r746mb4" />
            <AlertDescription data-oid="eznlw3w">
              {error.message || "Произошла ошибка при анализе контента"}
            </AlertDescription>
          </Alert>
        )}

        {/* Результаты анализа */}
        {analysisResults && (
          <div
            className="m-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800"
            data-oid="8::6og4"
          >
            <div className="flex items-center gap-2 mb-2" data-oid="p9zzk3j">
              <Sparkles className="h-4 w-4 text-blue-600" data-oid="9prk8-x" />
              <h4 className="font-medium text-blue-900 dark:text-blue-100" data-oid="e:2ix36">
                {analysisResults.analysis} завершен
              </h4>
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-200" data-oid="dy5dx28">
              <p data-oid="pps_1_t">Найдено рекомендаций: {analysisResults.results?.recommendations?.length || 0}</p>
              <p data-oid="eh9j_eu">Обнаружено проблем: {analysisResults.results?.warnings?.length || 0}</p>
            </div>
          </div>
        )}

        {clips && clips.length > 0 ? (
          <div className="flex-1 p-4 flex items-center justify-center" data-oid="gbrkx72">
            <div className="text-center text-muted-foreground max-w-md" data-oid="_-l-gzq">
              <div className="mb-4" data-oid="bt3xbfq">
                <Bot className="h-16 w-16 mx-auto text-blue-500 opacity-50" data-oid="rc3.:zl" />
              </div>
              <p className="mb-2 text-lg font-medium" data-oid="qz5o95l">
                AI Dashboard временно недоступен
              </p>
              <p className="text-sm mb-4" data-oid="8e9ktr-">
                Идет миграция на новый AI Director для более мощного анализа контента
              </p>
              <p className="text-xs text-muted-foreground/70" data-oid="ek4eqgw">
                Используйте кнопки быстрого анализа выше для основных операций
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 flex items-center justify-center" data-oid="7xfwdya">
            <div className="text-center text-muted-foreground" data-oid="iv3gges">
              <div className="mb-4" data-oid="51bk_8i">
                <Sparkles className="h-12 w-12 mx-auto text-blue-500 opacity-50" data-oid="hjib73_" />
              </div>
              <p className="mb-2" data-oid="gs-c6df">
                Нет медиа файлов для анализа
              </p>
              <p className="text-sm" data-oid="4ut24:c">
                Добавьте видео или аудио в таймлайн, чтобы начать AI анализ
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
