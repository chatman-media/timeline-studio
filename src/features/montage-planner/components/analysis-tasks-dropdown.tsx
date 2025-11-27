import { AlertCircle, Brain, CheckCircle2, Clock, Loader2, StopCircle, XCircle } from "lucide-react"
import type React from "react"
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
import { cn } from "@/lib/utils"

import {
  formatAnalysisTaskDuration,
  getAnalysisTaskStatusColor,
  getAnalysisTaskStatusLabel,
  useAnalysisTasks,
} from "../hooks"
import type { AnalysisTaskStatus } from "../types/analysis-task"

export function AnalysisTasksDropdown() {
  const { t } = useTranslation()
  const { tasks, isLoading, error, cancelTask } = useAnalysisTasks()

  // Количество активных задач
  const activeTasksCount = tasks.filter(
    (task) =>
      task.status === "pending" ||
      task.status === "initializing" ||
      task.status === "analyzing_video" ||
      task.status === "analyzing_audio" ||
      task.status === "detecting_moments" ||
      task.status === "generating_plan",
  ).length

  // Иконка для статуса задачи
  const getStatusIcon = (status: AnalysisTaskStatus) => {
    switch (status) {
      case "pending":
      case "initializing":
        return <Clock className="h-4 w-4" />
      case "analyzing_video":
      case "analyzing_audio":
      case "detecting_moments":
      case "generating_plan":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "cancelled":
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
      await cancelTask(taskId)
    }
  }

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
              task.status === "analyzing_video" ||
              task.status === "analyzing_audio" ||
              task.status === "detecting_moments" ||
              task.status === "generating_plan",
          ) && <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-pulse" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("montagePlanner.analysisTasks")}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
                    {(task.status === "pending" ||
                      task.status === "initializing" ||
                      task.status === "analyzing_video" ||
                      task.status === "analyzing_audio" ||
                      task.status === "detecting_moments" ||
                      task.status === "generating_plan") && (
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

                  {(task.status === "analyzing_video" ||
                    task.status === "analyzing_audio" ||
                    task.status === "detecting_moments" ||
                    task.status === "generating_plan") &&
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

                  {task.status === "failed" && task.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2">{task.error_message}</p>
                  )}

                  {task.status === "completed" && task.results && (
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
                <span>{tasks.filter((t) => t.status === "completed").length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
