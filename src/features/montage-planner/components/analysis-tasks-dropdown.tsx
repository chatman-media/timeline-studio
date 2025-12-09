import { AlertCircle, Brain, CheckCircle2, Clock, Loader2, StopCircle, Trash2, XCircle } from "lucide-react"
import type React from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
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
        return <Clock className="h-4 w-4" />
      case AnalysisTaskStatus.AnalyzingVideo:
      case AnalysisTaskStatus.AnalyzingAudio:
      case AnalysisTaskStatus.DetectingMoments:
      case AnalysisTaskStatus.GeneratingPlan:
        return <Loader2 className="h-4 w-4 animate-spin" />
      case AnalysisTaskStatus.Completed:
        return <CheckCircle2 className="h-4 w-4" />
      case AnalysisTaskStatus.Failed:
        return <XCircle className="h-4 w-4" />
      case AnalysisTaskStatus.Cancelled:
        return <StopCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-6 w-6 cursor-pointer hover:bg-[#D1D1D1] dark:hover:bg-[#464747] focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          <Brain className="h-5 w-5" />
          {activeTasksCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
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
          ) && <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-pulse" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("montagePlanner.analysisTasks")}</span>
          <div className="flex items-center gap-1">
            {(isLoading || isAnalyzing) && <Loader2 className="h-4 w-4 animate-spin" />}
            {finishedTasksCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="h-6 w-6 text-destructive hover:text-destructive"
                title="Очистить историю"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {error ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p>{t("montagePlanner.errorLoadingTasks")}</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("montagePlanner.noActiveTasks")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1", getAnalysisTaskStatusColor(task.status))}>
                          {getStatusIcon(task.status)}
                          <span className="text-xs font-medium">{getAnalysisTaskStatusLabel(task.status, t)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatAnalysisTaskDuration(task.created_at, task.completed_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{task.video_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{task.video_path}</p>
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
                      >
                        <StopCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {(task.status === AnalysisTaskStatus.AnalyzingVideo ||
                    task.status === AnalysisTaskStatus.AnalyzingAudio ||
                    task.status === AnalysisTaskStatus.DetectingMoments ||
                    task.status === AnalysisTaskStatus.GeneratingPlan) &&
                    task.progress && (
                      <div className="space-y-1">
                        <Progress value={task.progress.percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{task.progress.phase}</span>
                          <span>{Math.round(task.progress.percentage)}%</span>
                        </div>
                        {task.progress.message && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{task.progress.message}</p>
                        )}
                        {task.progress.eta && (
                          <p className="text-xs text-muted-foreground">
                            {t("montagePlanner.eta")}: {Math.ceil(task.progress.eta / 60)} {t("montagePlanner.minutes")}
                          </p>
                        )}
                      </div>
                    )}

                  {task.status === AnalysisTaskStatus.Failed && task.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2">{task.error_message}</p>
                  )}

                  {task.status === AnalysisTaskStatus.Completed && task.results && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      {task.results.momentScores && (
                        <p>
                          {t("montagePlanner.momentsDetected")}: {task.results.momentScores.length}
                        </p>
                      )}
                      {task.results.montagePlan && (
                        <p>
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
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("montagePlanner.totalTasks")}:</span>
                <span>{tasks.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("montagePlanner.activeTasks")}:</span>
                <span>{activeTasksCount}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("montagePlanner.completedTasks")}:</span>
                <span>{tasks.filter((t) => t.status === AnalysisTaskStatus.Completed).length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
