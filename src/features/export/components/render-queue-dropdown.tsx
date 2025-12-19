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
        return <Clock className="h-4 w-4" data-oid="mh6epep" />
      case "Processing":
        return <Loader2 className="h-4 w-4 animate-spin" data-oid="g4cqf2v" />
      case "Completed":
        return <CheckCircle2 className="h-4 w-4" data-oid="r.v1b2t" />
      case "Failed":
        return <XCircle className="h-4 w-4" data-oid="3z0w2l3" />
      case "Cancelled":
        return <StopCircle className="h-4 w-4" data-oid="cqm:gz8" />
      default:
        return <AlertCircle className="h-4 w-4" data-oid="z4be2ro" />
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
    <DropdownMenu data-oid="w.irdrm">
      <DropdownMenuTrigger asChild data-oid="g5_0-x2">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-6 w-6 cursor-pointer hover:bg-[#D1D1D1] dark:hover:bg-[#464747] focus-visible:ring-0 focus-visible:ring-offset-0"
          data-oid="sgyv-l9"
        >
          <Upload className="h-5 w-5" data-oid="uuigkbi" />
          {activeJobsCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              data-oid="li9uoh6"
            >
              {activeJobsCount}
            </Badge>
          )}
          {renderJobs.some((job) => (job.status as any) === "Processing") && (
            <div
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-pulse"
              data-oid="t76q-3l"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96" data-oid=".p85a1c">
        <DropdownMenuLabel className="flex items-center justify-between" data-oid="bcd5cww">
          <span data-oid="1ju38j2">{t("export.renderQueue")}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator data-oid="lxg-ila" />

        <ScrollArea className="h-[400px]" data-oid="9w7uddf">
          {renderJobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground" data-oid="z8yx8mj">
              <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" data-oid="ct1npij" />
              <p data-oid="gk15yh4">{t("export.noActiveJobs")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2" data-oid="8wgbxc5">
              {renderJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  data-oid="4dd-_0s"
                >
                  <div className="flex items-start justify-between" data-oid="l97y30y">
                    <div className="flex-1 space-y-1" data-oid="e1q5ruh">
                      <div className="flex items-center gap-2" data-oid="gtl8wzj">
                        <span className={cn("flex items-center gap-1", getStatusColor(job.status))} data-oid="an.k5bw">
                          {getStatusIcon(job.status)}
                          <span className="text-xs font-medium" data-oid="l5:2bp:">
                            {getStatusLabel(job.status, t)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground" data-oid=".jak1t:">
                          {formatDuration(job.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1" data-oid="2gltlqk">
                        {job.project_name || job.output_path.split("/").pop()}
                      </p>
                      {job.output_path && (
                        <p
                          className="text-xs text-muted-foreground line-clamp-1"
                          title={job.output_path}
                          data-oid="7uh3bmb"
                        >
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
                        data-oid="mr36ke3"
                      >
                        <StopCircle className="h-3 w-3" data-oid="q.a6zpq" />
                      </Button>
                    )}
                  </div>

                  {(job.status as any) === "Processing" && job.progress && (
                    <div className="space-y-1" data-oid="xq0fq3:">
                      <Progress value={job.progress.percentage} className="h-2" data-oid="3f2xsrn" />
                      <div className="flex justify-between text-xs text-muted-foreground" data-oid="yxcye4l">
                        <span data-oid=":uvvv1_">{job.progress.stage || t("export.rendering")}</span>
                        <span data-oid="4fj7dqu">{Math.round(job.progress.percentage)}%</span>
                      </div>
                      {job.progress.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1" data-oid="6usdl7u">
                          {job.progress.message}
                        </p>
                      )}
                    </div>
                  )}

                  {(job.status as any) === "Failed" && job.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2" data-oid="j.ex5rw">
                      {job.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {renderJobs.length > 0 && (
          <>
            <DropdownMenuSeparator data-oid="01lpw-h" />
            <div className="p-2 text-xs text-muted-foreground" data-oid="::.ngn8">
              <div className="flex justify-between" data-oid="4ebb3lm">
                <span data-oid="6tealb5">{t("export.totalJobs")}:</span>
                <span data-oid="o:.c.xv">{renderJobs.length}</span>
              </div>
              <div className="flex justify-between" data-oid="k9i-maq">
                <span data-oid="1l1esbs">{t("export.activeJobs")}:</span>
                <span data-oid="lz0dip3">{activeJobsCount}</span>
              </div>
              <div className="flex justify-between" data-oid="rrv9e3o">
                <span data-oid="ea9yl8d">{t("export.completedJobs")}:</span>
                <span data-oid="um5m3mc">{renderJobs.filter((j) => (j.status as any) === "Completed").length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
