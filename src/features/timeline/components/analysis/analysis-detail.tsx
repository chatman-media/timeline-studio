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
      return <CheckCircle2 className="h-4 w-4 text-green-500" data-oid="u-mr6zr" />
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" data-oid="hb4punx" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" data-oid="npbqx7o" />
    case "pending":
      return <Clock className="h-4 w-4 text-muted-foreground" data-oid="9.gypyy" />
    case "skipped":
      return <XCircle className="h-4 w-4 text-orange-500" data-oid="hfj2_0y" />
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
    <ScrollArea className="h-full" data-oid="3yzyuw-">
      <div className="space-y-6 p-6" data-oid="m_jzesy">
        {/* Общая информация */}
        <Card data-oid="4vh-xan">
          <CardHeader data-oid="vacl4w2">
            <CardTitle className="text-lg" data-oid="k0j:abr">
              Общая информация
            </CardTitle>
            <CardDescription className="break-words" data-oid="3b4ef1-">
              {file.filePath}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="bmvh8ug">
            {/* Прогресс */}
            <div className="space-y-2" data-oid="pa4cz-4">
              <div className="flex items-center justify-between text-sm" data-oid="gtq.tdl">
                <span className="text-muted-foreground" data-oid=":9x042y">
                  Общий прогресс
                </span>
                <span className="font-medium" data-oid="36-n2t7">
                  {file.progress}%
                </span>
              </div>
              <Progress value={file.progress} className="h-2" data-oid="ebysx16" />
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 gap-4 text-sm" data-oid="rcvy5d3">
              <div data-oid="d9fettq">
                <p className="text-muted-foreground" data-oid="u1halkp">
                  Всего анализаторов
                </p>
                <p className="text-lg font-semibold" data-oid="1cb17vt">
                  {totalAnalyzers}
                </p>
              </div>
              <div data-oid="j_orbje">
                <p className="text-muted-foreground" data-oid="o73etpy">
                  Завершено
                </p>
                <p className="text-lg font-semibold text-green-600" data-oid="jli9fpp">
                  {completedAnalyzers}
                </p>
              </div>
              {failedAnalyzers > 0 && (
                <div className="col-span-2" data-oid="-.wiqu4">
                  <p className="text-muted-foreground" data-oid="svxa-pn">
                    Ошибок
                  </p>
                  <p className="text-lg font-semibold text-red-600" data-oid="zg_c1g0">
                    {failedAnalyzers}
                  </p>
                </div>
              )}
            </div>

            {/* Время */}
            {file.duration && (
              <div className="pt-2 border-t" data-oid="7s79vuu">
                <p className="text-sm text-muted-foreground" data-oid="3-gy_.0">
                  Время выполнения
                </p>
                <p className="text-base font-medium" data-oid="wnt0v8t">
                  {formatDuration(file.duration)}
                </p>
              </div>
            )}

            {/* Текущая стадия */}
            {file.currentStage && file.status === "analyzing" && (
              <div className="pt-2 border-t" data-oid="79pn.--">
                <p className="text-sm text-muted-foreground" data-oid="71o9v.b">
                  Текущая стадия
                </p>
                <p className="text-base font-medium" data-oid="3fa56_5">
                  {file.currentStage}
                </p>
              </div>
            )}

            {/* Ошибка */}
            {file.error && (
              <div className="pt-2 border-t" data-oid="-_5_2kc">
                <p className="text-sm text-muted-foreground text-red-500" data-oid="s81vhcx">
                  Ошибка
                </p>
                <p className="text-sm" data-oid=":is1qd8">
                  {file.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Список анализаторов */}
        <Card data-oid="pjk8f6g">
          <CardHeader data-oid="yyuzlwe">
            <CardTitle className="text-lg" data-oid="ofzg1ea">
              Анализаторы ({file.analyzers.length})
            </CardTitle>
            <CardDescription data-oid="ptlve_q">Детальный прогресс по каждому анализатору</CardDescription>
          </CardHeader>
          <CardContent data-oid="l86b8d0">
            <div className="space-y-3" data-oid="q1alsur">
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
                    data-oid="3a:3t61"
                  >
                    <div className="space-y-2" data-oid="l-c_u4z">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2" data-oid="yl2i9q5">
                        <div className="flex items-center gap-2 flex-1 min-w-0" data-oid="4ol7vsf">
                          {getAnalyzerStatusIcon(analyzer.status)}
                          <span className="text-sm font-medium truncate" data-oid="ehl92ji">
                            {metadata.displayName}
                          </span>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs" data-oid="tmbdqjc">
                          {getAnalyzerStatusLabel(analyzer.status)}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground" data-oid="nh56ss5">
                        {metadata.description}
                      </p>

                      {/* Progress */}
                      {(analyzer.status === "running" || analyzer.status === "pending") && (
                        <div className="space-y-1" data-oid="-t8dwg1">
                          <div className="flex items-center justify-between text-xs" data-oid="7bc4dl5">
                            <span className="text-muted-foreground" data-oid="0:inl6i">
                              Прогресс
                            </span>
                            <span className="font-medium" data-oid="r7v671e">
                              {analyzer.progress}%
                            </span>
                          </div>
                          <Progress value={analyzer.progress} className="h-1" data-oid="p4znj4j" />
                          {analyzer.details && (
                            <p className="text-xs text-muted-foreground" data-oid="j8d0hmw">
                              {analyzer.details}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Duration */}
                      {analyzer.duration && analyzer.status === "completed" && (
                        <p className="text-xs text-muted-foreground" data-oid="f3p25iy">
                          Выполнено за {formatDuration(analyzer.duration)}
                        </p>
                      )}

                      {/* Error */}
                      {analyzer.error && (
                        <p className="text-xs text-red-500" data-oid="6cmn4y5">
                          {analyzer.error}
                        </p>
                      )}

                      {/* Result metadata */}
                      {analyzer.result?.metadata && (
                        <div className="text-xs text-muted-foreground space-y-1" data-oid="hi2cau.">
                          {analyzer.result.metadata.itemsFound !== undefined && (
                            <p data-oid="b2i5_a-">Найдено объектов: {analyzer.result.metadata.itemsFound}</p>
                          )}
                          {analyzer.result.metadata.confidence !== undefined && (
                            <p data-oid="ck-fzbd">Точность: {Math.round(analyzer.result.metadata.confidence * 100)}%</p>
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
