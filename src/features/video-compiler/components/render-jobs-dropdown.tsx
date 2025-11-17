import { AlertCircle, CheckCircle2, Clock, FileVideo, ListTodo, Loader2, StopCircle, XCircle } from "lucide-react"
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

import { formatJobDuration, getJobStatusColor, useRenderJobs } from "../hooks/use-render-jobs"
import { RenderStatus } from "../types/render"

export function RenderJobsDropdown() {
  const { t } = useTranslation()
  const { jobs, isLoading, error, cancelJob } = useRenderJobs()

  // Количество активных задач
  const activeJobsCount = jobs.filter(
    (job) => job.status === RenderStatus.Pending || job.status === RenderStatus.Processing,
  ).length

  // Иконка для статуса задачи
  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case RenderStatus.Pending:
        return <Clock className="h-4 w-4" />
      case RenderStatus.Processing:
        return <Loader2 className="h-4 w-4 animate-spin" />
      case RenderStatus.Completed:
        return <CheckCircle2 className="h-4 w-4" />
      case RenderStatus.Failed:
        return <XCircle className="h-4 w-4" />
      case RenderStatus.Cancelled:
        return <StopCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Функция для получения локализованного статуса
  const getLocalizedStatus = (status: RenderStatus) => {
    switch (status) {
      case RenderStatus.Pending:
        return t("videoCompiler.status.pending")
      case RenderStatus.Processing:
        return t("videoCompiler.status.processing")
      case RenderStatus.Completed:
        return t("videoCompiler.status.completed")
      case RenderStatus.Failed:
        return t("videoCompiler.status.failed")
      case RenderStatus.Cancelled:
        return t("videoCompiler.status.cancelled")
      default:
        return status
    }
  }

  // Обработчик отмены задачи
  const handleCancelJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(t("videoCompiler.cancelTask"))
    if (confirmed) {
      await cancelJob(jobId)
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
          <ListTodo className="h-5 w-5" />
          {activeJobsCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {activeJobsCount}
            </Badge>
          )}
          {jobs.some((job) => job.status === RenderStatus.Processing) && (
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-spin" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("videoCompiler.renderTasks")}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {error ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p>{t("videoCompiler.errorLoadingTasks")}</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("videoCompiler.noActiveTasks")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1", getJobStatusColor(job.status))}>
                          {getStatusIcon(job.status)}
                          <span className="text-xs font-medium">{getLocalizedStatus(job.status)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{formatJobDuration(job.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">{job.project_name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{job.output_path}</p>
                    </div>
                    {(job.status === RenderStatus.Pending || job.status === RenderStatus.Processing) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCancelJob(job.id, e)}
                        className="h-7 px-2"
                      >
                        <StopCircle className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {job.status === RenderStatus.Processing && job.progress && (
                    <div className="space-y-1">
                      <Progress value={job.progress.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{job.progress.stage}</span>
                        <span>
                          {job.progress.current_frame}/{job.progress.total_frames} {t("videoCompiler.frames")}
                        </span>
                      </div>
                      {job.progress.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{job.progress.message}</p>
                      )}
                    </div>
                  )}

                  {job.status === RenderStatus.Failed && job.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2">{job.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {jobs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("videoCompiler.totalTasks")}:</span>
                <span>{jobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("videoCompiler.activeTasks")}:</span>
                <span>{activeJobsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("videoCompiler.completedTasks")}:</span>
                <span>{jobs.filter((j) => j.status === RenderStatus.Completed).length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
