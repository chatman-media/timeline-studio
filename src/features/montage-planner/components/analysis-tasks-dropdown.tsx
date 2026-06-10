import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@timeline-studio/ui/components/dropdown-menu"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { AlertCircle, Brain, CheckCircle2, Clock, Loader2, StopCircle, Trash2, XCircle } from "lucide-react"
import type React from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import { cn } from "@/lib/utils"

import {
  formatAnalysisTaskDuration,
  getAnalysisTaskStatusColor,
  getAnalysisTaskStatusLabel,
  useAnalysisTasks,
} from "../hooks"
import { AnalysisPhase } from "../types"
import { type AnalysisTask, AnalysisTaskStatus } from "../types/analysis-task"

/**
 * Маппинг статуса FileAnalysisProgress на AnalysisTaskStatus
 */
function mapFileStatusToTaskStatus(status: string): AnalysisTaskStatus {
  switch (status) {
    case "pending":
      return AnalysisTaskStatus.Pending
    case "analyzing":
      return AnalysisTaskStatus.AnalyzingVideo
    case "completed":
      return AnalysisTaskStatus.Completed
    case "error":
      return AnalysisTaskStatus.Failed
    case "cancelled":
      return AnalysisTaskStatus.Cancelled
    default:
      return AnalysisTaskStatus.Pending
  }
}

export function AnalysisTasksDropdown() {
  const { t } = useTranslation()
  const { tasks: storedTasks, isLoading, error, cancelTask, clearHistory } = useAnalysisTasks()

  // Получаем текущие активные анализы из useAIDirectorAnalysisV2
  const { filesProgress, isAnalyzing, cancelAnalysis } = useAIDirectorAnalysisV2()

  // Конвертируем filesProgress в формат AnalysisTask и объединяем с сохранёнными задачами
  const tasks = useMemo(() => {
    // Преобразуем текущие активные анализы
    const activeTasks: AnalysisTask[] = filesProgress.map((file) => ({
      id: file.id || `temp-${file.filePath}`, // Fallback ID для файлов без id
      video_path: file.filePath,
      video_name: file.fileName,
      status: mapFileStatusToTaskStatus(file.status),
      created_at: file.startTime || new Date().toISOString(),
      started_at: file.startTime,
      completed_at: file.endTime,
      progress: {
        percentage: file.progress,
        phase: (file.status === "analyzing" ? AnalysisPhase.AnalyzingVideo : AnalysisPhase.Initializing) as any,
        current_file: file.filePath,
        message: file.analyzers.find((a) => a.status === "running")?.type,
      },
    }))

    // Получаем пути активных задач для фильтрации дубликатов
    const activeFilePaths = new Set(activeTasks.map((t) => t.video_path))

    // Фильтруем сохранённые задачи, чтобы не дублировать активные
    const filteredStoredTasks = storedTasks.filter((t) => !activeFilePaths.has(t.video_path))

    // Активные задачи в начале списка
    return [...activeTasks, ...filteredStoredTasks]
  }, [filesProgress, storedTasks])

  // Количество активных задач
  const activeTasksCount = tasks.filter(
    (task) =>
      task.status === AnalysisTaskStatus.Pending ||
      task.status === AnalysisTaskStatus.Initializing ||
      task.status === AnalysisTaskStatus.AnalyzingVideo ||
      task.status === AnalysisTaskStatus.AnalyzingAudio ||
      task.status === AnalysisTaskStatus.DetectingMoments ||
      task.status === AnalysisTaskStatus.GeneratingPlan,
  ).length

  // Иконка для статуса задачи
  const getStatusIcon = (status: AnalysisTaskStatus) => {
    switch (status) {
      case AnalysisTaskStatus.Pending:
      case AnalysisTaskStatus.Initializing:
        return <Clock className="h-4 w-4" data-oid="c:fb7fw" />
      case AnalysisTaskStatus.AnalyzingVideo:
      case AnalysisTaskStatus.AnalyzingAudio:
      case AnalysisTaskStatus.DetectingMoments:
      case AnalysisTaskStatus.GeneratingPlan:
        return <Loader2 className="h-4 w-4 animate-spin" data-oid="-w9nll." />
      case AnalysisTaskStatus.Completed:
        return <CheckCircle2 className="h-4 w-4" data-oid="l01:kzy" />
      case AnalysisTaskStatus.Failed:
        return <XCircle className="h-4 w-4" data-oid="d9m6yeg" />
      case AnalysisTaskStatus.Cancelled:
        return <StopCircle className="h-4 w-4" data-oid="cw.mtx." />
      default:
        return <AlertCircle className="h-4 w-4" data-oid="rzgi:s4" />
    }
  }

  // Обработчик отмены задачи
  const handleCancelTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(t("montagePlanner.cancelTask"))
    if (confirmed) {
      // Проверяем, является ли это активной задачей из useAIDirectorAnalysisV2
      const isActiveTask = filesProgress.some((f) => f.id === taskId)
      if (isActiveTask) {
        cancelAnalysis()
      } else {
        await cancelTask(taskId)
      }
    }
  }

  // Обработчик очистки истории
  const handleClearHistory = async () => {
    const confirmed = window.confirm("Очистить всю историю анализов?")
    if (confirmed) {
      await clearHistory()
    }
  }

  // Количество завершённых задач (включая failed и cancelled)
  const finishedTasksCount = tasks.filter(
    (task) =>
      task.status === AnalysisTaskStatus.Completed ||
      task.status === AnalysisTaskStatus.Failed ||
      task.status === AnalysisTaskStatus.Cancelled,
  ).length

  return (
    <DropdownMenu data-oid="rmtu_cz">
      <DropdownMenuTrigger asChild data-oid="n859mwo">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-6 w-6 cursor-pointer hover:bg-[#D1D1D1] dark:hover:bg-[#464747] focus-visible:ring-0 focus-visible:ring-offset-0"
          data-oid="9_r7ji2"
        >
          <Brain className="h-5 w-5" data-oid="jkm68lq" />
          {activeTasksCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              data-oid="hej3_5a"
            >
              {activeTasksCount}
            </Badge>
          )}
          {tasks.some(
            (task) =>
              task.status === AnalysisTaskStatus.AnalyzingVideo ||
              task.status === AnalysisTaskStatus.AnalyzingAudio ||
              task.status === AnalysisTaskStatus.DetectingMoments ||
              task.status === AnalysisTaskStatus.GeneratingPlan,
          ) && (
            <div
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-pulse"
              data-oid="8zl5vo:"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96" data-oid="srtaip0">
        <DropdownMenuLabel className="flex items-center justify-between" data-oid="fff-je5">
          <span data-oid="x2p-rb:">{t("montagePlanner.analysisTasks")}</span>
          <div className="flex items-center gap-1" data-oid="6em8.4c">
            {(isLoading || isAnalyzing) && <Loader2 className="h-4 w-4 animate-spin" data-oid="h6c_13x" />}
            {finishedTasksCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="h-6 w-6 text-destructive hover:text-destructive"
                title="Очистить историю"
                data-oid="a74zk-j"
              >
                <Trash2 className="h-3.5 w-3.5" data-oid="r918y0_" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator data-oid="2ff0s9i" />

        <ScrollArea className="h-[400px]" data-oid="izj-mwr">
          {error ? (
            <div className="p-4 text-center text-sm text-muted-foreground" data-oid="meo--pg">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" data-oid="9-dgn51" />
              <p data-oid="937z0od">{t("montagePlanner.errorLoadingTasks")}</p>
              <p className="text-xs mt-1" data-oid="nogjv6t">
                {error}
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground" data-oid="tf9vyy5">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" data-oid="mtdtep4" />
              <p data-oid="vp8sjzl">{t("montagePlanner.noActiveTasks")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2" data-oid="au.kr8f">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  data-oid="h_f5vt:"
                >
                  <div className="flex items-start justify-between" data-oid="7ppnyse">
                    <div className="flex-1 space-y-1" data-oid="ff4y9g9">
                      <div className="flex items-center gap-2" data-oid="gs-qyw0">
                        <span
                          className={cn("flex items-center gap-1", getAnalysisTaskStatusColor(task.status))}
                          data-oid="gto4u.7"
                        >
                          {getStatusIcon(task.status)}
                          <span className="text-xs font-medium" data-oid="lwgqd5x">
                            {getAnalysisTaskStatusLabel(task.status, t)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground" data-oid="21s9iv:">
                          {formatAnalysisTaskDuration(task.created_at, task.completed_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1" data-oid="hz54xtj">
                        {task.video_name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1" data-oid=".::zb-3">
                        {task.video_path}
                      </p>
                    </div>
                    {(task.status === AnalysisTaskStatus.Pending ||
                      task.status === AnalysisTaskStatus.Initializing ||
                      task.status === AnalysisTaskStatus.AnalyzingVideo ||
                      task.status === AnalysisTaskStatus.AnalyzingAudio ||
                      task.status === AnalysisTaskStatus.DetectingMoments ||
                      task.status === AnalysisTaskStatus.GeneratingPlan) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCancelTask(task.id, e)}
                        className="h-7 px-2"
                        data-oid="-d-a4b1"
                      >
                        <StopCircle className="h-3 w-3" data-oid="6lye1k-" />
                      </Button>
                    )}
                  </div>

                  {(task.status === AnalysisTaskStatus.AnalyzingVideo ||
                    task.status === AnalysisTaskStatus.AnalyzingAudio ||
                    task.status === AnalysisTaskStatus.DetectingMoments ||
                    task.status === AnalysisTaskStatus.GeneratingPlan) &&
                    task.progress && (
                      <div className="space-y-1" data-oid="y-pcjdx">
                        <Progress value={task.progress.percentage} className="h-2" data-oid="x5mboxh" />
                        <div className="flex justify-between text-xs text-muted-foreground" data-oid="d_t-eqv">
                          <span data-oid="yf3-:09">{task.progress.phase}</span>
                          <span data-oid="w1pzlf:">{Math.round(task.progress.percentage)}%</span>
                        </div>
                        {task.progress.message && (
                          <p className="text-xs text-muted-foreground line-clamp-1" data-oid="2njls7:">
                            {task.progress.message}
                          </p>
                        )}
                        {task.progress.eta && (
                          <p className="text-xs text-muted-foreground" data-oid="4xinyh6">
                            {t("montagePlanner.eta")}: {Math.ceil(task.progress.eta / 60)} {t("montagePlanner.minutes")}
                          </p>
                        )}
                      </div>
                    )}

                  {task.status === AnalysisTaskStatus.Failed && task.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2" data-oid="vn:aihm">
                      {task.error_message}
                    </p>
                  )}

                  {task.status === AnalysisTaskStatus.Completed && task.results && (
                    <div className="text-xs text-muted-foreground space-y-1" data-oid="g91wzx2">
                      {task.results.momentScores && (
                        <p data-oid="dny8-s4">
                          {t("montagePlanner.momentsDetected")}: {task.results.momentScores.length}
                        </p>
                      )}
                      {task.results.montagePlan && (
                        <p data-oid=".5.vymh">
                          {t("montagePlanner.planGenerated")}: {task.results.montagePlan.sequences.length}{" "}
                          {t("montagePlanner.sequences")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {tasks.length > 0 && (
          <>
            <DropdownMenuSeparator data-oid="o1mw:9d" />
            <div className="p-2 text-xs text-muted-foreground" data-oid="fx-_un4">
              <div className="flex justify-between" data-oid="b1t5x30">
                <span data-oid=".33fl84">{t("montagePlanner.totalTasks")}:</span>
                <span data-oid="ty87k20">{tasks.length}</span>
              </div>
              <div className="flex justify-between" data-oid="e.9hm0l">
                <span data-oid="oxyz3bo">{t("montagePlanner.activeTasks")}:</span>
                <span data-oid="jxdne_k">{activeTasksCount}</span>
              </div>
              <div className="flex justify-between" data-oid="3fvlv2t">
                <span data-oid="tq8k00z">{t("montagePlanner.completedTasks")}:</span>
                <span data-oid="-fkqqmj">{tasks.filter((t) => t.status === AnalysisTaskStatus.Completed).length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
