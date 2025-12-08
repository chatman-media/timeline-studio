"use client"

import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { AnalyzerProgress, FileAnalysisProgress } from "@/features/ai-director/types/analysis-progress"
import { ANALYZER_METADATA } from "@/features/ai-director/types/analysis-progress"
import { cn } from "@/lib/utils"

interface AnalysisDetailProps {
  file: FileAnalysisProgress
}

function getAnalyzerStatusIcon(status: AnalyzerProgress["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "pending":
      return <Clock className="h-4 w-4 text-muted-foreground" />
    case "skipped":
      return <XCircle className="h-4 w-4 text-orange-500" />
    default:
      return null
  }
}

function getAnalyzerStatusLabel(status: AnalyzerProgress["status"]) {
  switch (status) {
    case "completed":
      return "Завершено"
    case "running":
      return "Выполняется"
    case "error":
      return "Ошибка"
    case "pending":
      return "Ожидает"
    case "skipped":
      return "Пропущено"
    default:
      return status
  }
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}с`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}м ${remainingSeconds}с`
}

export function AnalysisDetail({ file }: AnalysisDetailProps) {
  const completedAnalyzers = file.stats?.completedAnalyzers || 0
  const totalAnalyzers = file.stats?.totalAnalyzers || 0
  const failedAnalyzers = file.stats?.failedAnalyzers || 0

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* Общая информация */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Общая информация</CardTitle>
            <CardDescription className="break-words">{file.filePath}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Прогресс */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Общий прогресс</span>
                <span className="font-medium">{file.progress}%</span>
              </div>
              <Progress value={file.progress} className="h-2" />
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Всего анализаторов</p>
                <p className="text-lg font-semibold">{totalAnalyzers}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Завершено</p>
                <p className="text-lg font-semibold text-green-600">{completedAnalyzers}</p>
              </div>
              {failedAnalyzers > 0 && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Ошибок</p>
                  <p className="text-lg font-semibold text-red-600">{failedAnalyzers}</p>
                </div>
              )}
            </div>

            {/* Время */}
            {file.duration && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Время выполнения</p>
                <p className="text-base font-medium">{formatDuration(file.duration)}</p>
              </div>
            )}

            {/* Текущая стадия */}
            {file.currentStage && file.status === "analyzing" && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Текущая стадия</p>
                <p className="text-base font-medium">{file.currentStage}</p>
              </div>
            )}

            {/* Ошибка */}
            {file.error && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground text-red-500">Ошибка</p>
                <p className="text-sm">{file.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Список анализаторов */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Анализаторы ({file.analyzers.length})</CardTitle>
            <CardDescription>Детальный прогресс по каждому анализатору</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {file.analyzers.map((analyzer) => {
                const metadata = ANALYZER_METADATA[analyzer.type]

                return (
                  <div
                    key={analyzer.type}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      analyzer.status === "running" && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
                      analyzer.status === "completed" && "border-green-500/30 bg-green-50/30 dark:bg-green-950/20",
                      analyzer.status === "error" && "border-red-500/30 bg-red-50/30 dark:bg-red-950/20",
                    )}
                  >
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getAnalyzerStatusIcon(analyzer.status)}
                          <span className="text-sm font-medium truncate">{metadata.displayName}</span>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {getAnalyzerStatusLabel(analyzer.status)}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground">{metadata.description}</p>

                      {/* Progress */}
                      {(analyzer.status === "running" || analyzer.status === "pending") && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Прогресс</span>
                            <span className="font-medium">{analyzer.progress}%</span>
                          </div>
                          <Progress value={analyzer.progress} className="h-1" />
                          {analyzer.details && <p className="text-xs text-muted-foreground">{analyzer.details}</p>}
                        </div>
                      )}

                      {/* Duration */}
                      {analyzer.duration && analyzer.status === "completed" && (
                        <p className="text-xs text-muted-foreground">
                          Выполнено за {formatDuration(analyzer.duration)}
                        </p>
                      )}

                      {/* Error */}
                      {analyzer.error && <p className="text-xs text-red-500">{analyzer.error}</p>}

                      {/* Result metadata */}
                      {analyzer.result?.metadata && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {analyzer.result.metadata.itemsFound !== undefined && (
                            <p>Найдено объектов: {analyzer.result.metadata.itemsFound}</p>
                          )}
                          {analyzer.result.metadata.confidence !== undefined && (
                            <p>Точность: {Math.round(analyzer.result.metadata.confidence * 100)}%</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
