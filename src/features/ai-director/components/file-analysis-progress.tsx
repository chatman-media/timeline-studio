"use client"

/**
 * FileAnalysisProgress Component
 * Отображает детальный прогресс анализа одного файла со всеми анализаторами
 */

import { CheckCircle2, ChevronDown, ChevronRight, FileVideo, Loader2, XCircle } from "lucide-react"
import { useMemo, useState } from "react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type { FileAnalysisStatus, FileAnalysisProgress as FileProgress } from "../types/analysis-progress"
import { AnalyzerProgressItem } from "./analyzer-progress-item"

interface FileAnalysisProgressProps {
  file: FileProgress
  className?: string
  defaultExpanded?: boolean
}

export function FileAnalysisProgress({ file, className, defaultExpanded = false }: FileAnalysisProgressProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Конфигурация статуса файла
  const statusConfig = useMemo(() => {
    const configs: Record<
      FileAnalysisStatus,
      {
        icon: React.ComponentType<{ className?: string }>
        color: string
        label: string
      }
    > = {
      pending: {
        icon: FileVideo,
        color: "text-gray-400",
        label: "Ожидание",
      },
      analyzing: {
        icon: Loader2,
        color: "text-blue-500",
        label: "Анализ",
      },
      completed: {
        icon: CheckCircle2,
        color: "text-green-500",
        label: "Завершено",
      },
      error: {
        icon: XCircle,
        color: "text-red-500",
        label: "Ошибка",
      },
      cancelled: {
        icon: XCircle,
        color: "text-orange-500",
        label: "Отменено",
      },
    }

    return configs[file.status]
  }, [file.status])

  const StatusIcon = statusConfig.icon
  const isAnimated = file.status === "analyzing"

  // Форматирование времени
  const formattedDuration = useMemo(() => {
    if (!file.duration) return null
    const seconds = Math.round(file.duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }, [file.duration])

  // Группировка анализаторов по категориям
  const analyzersByCategory = useMemo(() => {
    const video = file.analyzers.filter((a) => {
      const type = a.type
      return (
        type === "scene_detection" ||
        type === "object_detection" ||
        type === "face_detection" ||
        type === "motion_analysis" ||
        type === "composition_analysis"
      )
    })

    const audio = file.analyzers.filter((a) => {
      const type = a.type
      return (
        type === "audio_quality" ||
        type === "speech_recognition" ||
        type === "music_detection" ||
        type === "sound_events" ||
        type === "silence_detection"
      )
    })

    const content = file.analyzers.filter((a) => {
      const type = a.type
      return (
        type === "mood_analysis" ||
        type === "content_classification" ||
        type === "quality_assessment" ||
        type === "moment_detection" ||
        type === "vlm_analysis"
      )
    })

    return { video, audio, content }
  }, [file.analyzers])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="p-4">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-3 w-full text-left hover:opacity-80 transition-opacity">
              {/* Expand Icon */}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}

              {/* Status Icon */}
              <StatusIcon className={cn("h-5 w-5 flex-shrink-0", statusConfig.color, isAnimated && "animate-spin")} />

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium truncate">{file.fileName}</h3>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Duration */}
                    {formattedDuration && <span className="text-sm text-muted-foreground">{formattedDuration}</span>}

                    {/* Progress */}
                    <span className={cn("text-sm font-medium tabular-nums", statusConfig.color)}>{file.progress}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                {file.status === "analyzing" && <Progress value={file.progress} className="h-1.5 mt-2" />}

                {/* Stats */}
                {file.stats && (
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>
                      {file.stats.completedAnalyzers}/{file.stats.totalAnalyzers} анализаторов
                    </span>
                    {file.stats.failedAnalyzers > 0 && (
                      <span className="text-red-600">{file.stats.failedAnalyzers} ошибок</span>
                    )}
                  </div>
                )}
              </div>
            </button>
          </CollapsibleTrigger>

          {/* Error message (when collapsed) */}
          {!isExpanded && file.error && (
            <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">{file.error}</div>
          )}
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Error message (when expanded) */}
            {file.error && <div className="p-3 bg-red-50 rounded text-sm text-red-600">{file.error}</div>}

            {/* Video Analyzers */}
            {analyzersByCategory.video.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Видео</h4>
                <div className="space-y-1">
                  {analyzersByCategory.video.map((analyzer) => (
                    <AnalyzerProgressItem key={analyzer.type} analyzer={analyzer} />
                  ))}
                </div>
              </div>
            )}

            {/* Audio Analyzers */}
            {analyzersByCategory.audio.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Аудио</h4>
                <div className="space-y-1">
                  {analyzersByCategory.audio.map((analyzer) => (
                    <AnalyzerProgressItem key={analyzer.type} analyzer={analyzer} />
                  ))}
                </div>
              </div>
            )}

            {/* Content Analyzers */}
            {analyzersByCategory.content.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Контент</h4>
                <div className="space-y-1">
                  {analyzersByCategory.content.map((analyzer) => (
                    <AnalyzerProgressItem key={analyzer.type} analyzer={analyzer} />
                  ))}
                </div>
              </div>
            )}

            {/* File path */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground truncate">{file.filePath}</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
