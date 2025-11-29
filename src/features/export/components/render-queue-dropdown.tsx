import { AlertCircle, CheckCircle2, Clock, Loader2, StopCircle, Upload, XCircle } from "lucide-react"
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
import type { RenderStatus } from "@/core/types"
import { cn } from "@/lib/utils"

import { useRenderQueue } from "../hooks/use-render-queue"

export function RenderQueueDropdown() {
  const { t } = useTranslation()
  const { renderJobs, activeJobsCount, cancelJob } = useRenderQueue()

  // Вспомогательная функция для получения цвета статуса
  const getStatusColor = (status: RenderStatus) => {
    switch (status as any) {
      case "Pending":
        return "text-yellow-500"
      case "Processing":
        return "text-blue-500"
      case "Completed":
        return "text-green-500"
      case "Failed":
        return "text-red-500"
      case "Cancelled":
        return "text-gray-500"
      default:
        return "text-muted-foreground"
    }
  }

  // Вспомогательная функция для получения метки статуса
  const getStatusLabel = (status: RenderStatus, t: any) => {
    switch (status as any) {
      case "Pending":
        return t("export.status.pending")
      case "Processing":
        return t("export.status.processing")
      case "Completed":
        return t("export.status.completed")
      case "Failed":
        return t("export.status.failed")
      case "Cancelled":
        return t("export.status.cancelled")
      default:
        return t("export.status.unknown")
    }
  }

  // Вспомогательная функция для форматирования длительности
  const formatDuration = (timestamp?: string) => {
    if (!timestamp) return ""
    const now = Date.now()
    const created = new Date(timestamp).getTime()
    const diff = now - created
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return t("export.duration.hours", { count: hours })
    }
    if (minutes > 0) {
      return t("export.duration.minutes", { count: minutes })
    }
    return t("export.duration.justNow")
  }

  // Иконка для статуса задачи
  const getStatusIcon = (status: RenderStatus) => {
    switch (status as any) {
      case "Pending":
        return <Clock className="h-4 w-4" />
      case "Processing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "Completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "Failed":
        return <XCircle className="h-4 w-4" />
      case "Cancelled":
        return <StopCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Обработчик отмены задачи
  const handleCancelJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(t("export.confirmCancel"))
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
          <Upload className="h-5 w-5" />
          {activeJobsCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {activeJobsCount}
            </Badge>
          )}
          {renderJobs.some((job) => (job.status as any) === "Processing") && (
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("export.renderQueue")}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ScrollArea className="h-[400px]">
          {renderJobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("export.noActiveJobs")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {renderJobs.map((job) => (
                <div key={job.id} className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex items-center gap-1", getStatusColor(job.status))}>
                          {getStatusIcon(job.status)}
                          <span className="text-xs font-medium">{getStatusLabel(job.status, t)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDuration(job.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1">
                        {job.project_name || job.output_path.split("/").pop()}
                      </p>
                      {job.output_path && (
                        <p className="text-xs text-muted-foreground line-clamp-1" title={job.output_path}>
                          {job.output_path}
                        </p>
                      )}
                    </div>
                    {((job.status as any) === "Pending" || (job.status as any) === "Processing") && (
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

                  {(job.status as any) === "Processing" && job.progress && (
                    <div className="space-y-1">
                      <Progress value={job.progress.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{job.progress.stage || t("export.rendering")}</span>
                        <span>{Math.round(job.progress.percentage)}%</span>
                      </div>
                      {job.progress.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{job.progress.message}</p>
                      )}
                    </div>
                  )}

                  {(job.status as any) === "Failed" && job.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2">{job.error_message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {renderJobs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t("export.totalJobs")}:</span>
                <span>{renderJobs.length}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("export.activeJobs")}:</span>
                <span>{activeJobsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("export.completedJobs")}:</span>
                <span>{renderJobs.filter((j) => (j.status as any) === "Completed").length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
