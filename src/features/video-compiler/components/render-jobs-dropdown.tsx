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
import { AlertCircle, CheckCircle2, Clock, FileVideo, ListTodo, Loader2, StopCircle, XCircle } from "lucide-react"
import type React from "react"
import { useTranslation } from "react-i18next"
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
        return <Clock className="h-4 w-4" data-oid="is1gow4" />
      case RenderStatus.Processing:
        return <Loader2 className="h-4 w-4 animate-spin" data-oid="v_1vt5_" />
      case RenderStatus.Completed:
        return <CheckCircle2 className="h-4 w-4" data-oid="gakmnyv" />
      case RenderStatus.Failed:
        return <XCircle className="h-4 w-4" data-oid="wafmbn:" />
      case RenderStatus.Cancelled:
        return <StopCircle className="h-4 w-4" data-oid="sekw:u2" />
      default:
        return <AlertCircle className="h-4 w-4" data-oid="aoqpwts" />
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
    <DropdownMenu data-oid="f794w71">
      <DropdownMenuTrigger asChild data-oid="08u.wmr">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-6 w-6 cursor-pointer hover:bg-[#D1D1D1] dark:hover:bg-[#464747] focus-visible:ring-0 focus-visible:ring-offset-0"
          data-oid="zia0p71"
        >
          <ListTodo className="h-5 w-5" data-oid="zr189kt" />
          {activeJobsCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              data-oid="--:uz-s"
            >
              {activeJobsCount}
            </Badge>
          )}
          {jobs.some((job) => job.status === RenderStatus.Processing) && (
            <div
              className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-teal animate-spin"
              data-oid="28cki-q"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96" data-oid="5ajpu:w">
        <DropdownMenuLabel className="flex items-center justify-between" data-oid="o5rh-u2">
          <span data-oid="ktchci6">{t("videoCompiler.renderTasks")}</span>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" data-oid="4m55-wv" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator data-oid="ptj2_ps" />

        <ScrollArea className="h-[400px]" data-oid="5ws2ydy">
          {error ? (
            <div className="p-4 text-center text-sm text-muted-foreground" data-oid="8l9wuv2">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" data-oid="g9sy78u" />
              <p data-oid="jwxu:j0">{t("videoCompiler.errorLoadingTasks")}</p>
              <p className="text-xs mt-1" data-oid="7yprcn7">
                {error}
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground" data-oid="fv--pad">
              <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" data-oid="dd7j8qp" />
              <p data-oid="163x577">{t("videoCompiler.noActiveTasks")}</p>
            </div>
          ) : (
            <div className="space-y-2 p-2" data-oid="sc_qme4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-accent/50 transition-colors"
                  data-oid="4h3j1:c"
                >
                  <div className="flex items-start justify-between" data-oid="obuvuem">
                    <div className="flex-1 space-y-1" data-oid="wrq4xzp">
                      <div className="flex items-center gap-2" data-oid="exjdbgc">
                        <span
                          className={cn("flex items-center gap-1", getJobStatusColor(job.status))}
                          data-oid="0b-0e:f"
                        >
                          {getStatusIcon(job.status)}
                          <span className="text-xs font-medium" data-oid="g28ksim">
                            {getLocalizedStatus(job.status)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground" data-oid="iog9pe2">
                          {formatJobDuration(job.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium line-clamp-1" data-oid="4dffl8n">
                        {job.project_name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1" data-oid="3s5pcir">
                        {job.output_path}
                      </p>
                    </div>
                    {(job.status === RenderStatus.Pending || job.status === RenderStatus.Processing) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCancelJob(job.id, e)}
                        className="h-7 px-2"
                        data-oid="t7w2_-p"
                      >
                        <StopCircle className="h-3 w-3" data-oid="9cuw1_o" />
                      </Button>
                    )}
                  </div>

                  {job.status === RenderStatus.Processing && job.progress && (
                    <div className="space-y-1" data-oid="n83e47w">
                      <Progress value={job.progress.percentage} className="h-2" data-oid="_-imx:4" />
                      <div className="flex justify-between text-xs text-muted-foreground" data-oid="hva.f1c">
                        <span data-oid="e0zqj53">{job.progress.stage}</span>
                        <span data-oid="g2d1b0x">
                          {job.progress.current_frame}/{job.progress.total_frames} {t("videoCompiler.frames")}
                        </span>
                      </div>
                      {job.progress.message && (
                        <p className="text-xs text-muted-foreground line-clamp-1" data-oid="mbynhcq">
                          {job.progress.message}
                        </p>
                      )}
                    </div>
                  )}

                  {job.status === RenderStatus.Failed && job.error_message && (
                    <p className="text-xs text-red-500 line-clamp-2" data-oid="l58x6p0">
                      {job.error_message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {jobs.length > 0 && (
          <>
            <DropdownMenuSeparator data-oid="ppnowgj" />
            <div className="p-2 text-xs text-muted-foreground" data-oid="d.up38a">
              <div className="flex justify-between" data-oid="qy:5.0_">
                <span data-oid="xmydgjt">{t("videoCompiler.totalTasks")}:</span>
                <span data-oid="x2-jy-6">{jobs.length}</span>
              </div>
              <div className="flex justify-between" data-oid="2ubap.z">
                <span data-oid=".549m0h">{t("videoCompiler.activeTasks")}:</span>
                <span data-oid="tr0pbm4">{activeJobsCount}</span>
              </div>
              <div className="flex justify-between" data-oid="334ugot">
                <span data-oid=".uc:as3">{t("videoCompiler.completedTasks")}:</span>
                <span data-oid="0mqwl.w">{jobs.filter((j) => j.status === RenderStatus.Completed).length}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
