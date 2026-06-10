"use client"

import { CheckCircle2, Circle, FileVideo, Loader2, XCircle } from "lucide-react"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import type { FileAnalysisProgress } from "@/features/ai-director/types/analysis-progress"
import { cn } from "@/lib/utils"

interface AnalysisListProps {
  files: FileAnalysisProgress[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
}

function getStatusIcon(status: FileAnalysisProgress["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" data-oid="b_x0lz2" />
    case "analyzing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" data-oid="16z73v7" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" data-oid="9y33zrn" />
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground" data-oid="ng4796y" />
    case "cancelled":
      return <XCircle className="h-4 w-4 text-orange-500" data-oid="nvky__z" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" data-oid="7mmibqm" />
  }
}

function getStatusLabel(status: FileAnalysisProgress["status"]) {
  switch (status) {
    case "completed":
      return "Завершено"
    case "analyzing":
      return "Анализируется"
    case "error":
      return "Ошибка"
    case "pending":
      return "Ожидает"
    case "cancelled":
      return "Отменено"
    default:
      return status
  }
}

function getStatusVariant(status: FileAnalysisProgress["status"]) {
  switch (status) {
    case "completed":
      return "default"
    case "analyzing":
      return "secondary"
    case "error":
      return "destructive"
    case "pending":
      return "outline"
    case "cancelled":
      return "outline"
    default:
      return "outline"
  }
}

export function AnalysisList({ files, selectedFileId, onSelectFile }: AnalysisListProps) {
  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center" data-oid="s0tbfpz">
        <div className="space-y-2" data-oid="b_15.hr">
          <FileVideo className="mx-auto h-12 w-12 text-muted-foreground opacity-50" data-oid="1i1flga" />
          <p className="text-sm font-medium" data-oid="05qhb.0">
            Нет запущенных анализов
          </p>
          <p className="text-xs text-muted-foreground" data-oid="dpuypw2">
            Нажмите "Настроить новый анализ" вверху,
            <br data-oid="go9:7wp" />
            чтобы выбрать файлы и запустить анализ
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full" data-oid="-mjxpzg">
      <div className="space-y-2 p-4" data-oid="-54.36q">
        {files.map((file) => {
          const fileId = file.id || file.fileId
          const isSelected = fileId === selectedFileId
          const completedAnalyzers = file.stats?.completedAnalyzers || 0
          const totalAnalyzers = file.stats?.totalAnalyzers || 0

          return (
            <button
              key={fileId}
              onClick={() => onSelectFile(fileId)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                "hover:bg-accent hover:border-accent-foreground/20",
                isSelected && "border-primary bg-accent",
              )}
              data-oid="6qt902u"
            >
              <div className="space-y-2" data-oid="ey.cq7x">
                {/* Header */}
                <div className="flex items-start justify-between gap-2" data-oid="1tpi4_9">
                  <div className="flex-1 min-w-0" data-oid="m4wxyi5">
                    <div className="flex items-center gap-2" data-oid="3t32:6g">
                      {getStatusIcon(file.status)}
                      <h4 className="text-sm font-medium truncate" data-oid="-eac8.p">
                        {file.fileName}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1" data-oid="nnoqxx4">
                      {file.filePath}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(file.status)} className="shrink-0 text-xs" data-oid="5ncus0a">
                    {getStatusLabel(file.status)}
                  </Badge>
                </div>

                {/* Progress */}
                {file.status === "analyzing" || file.status === "pending" ? (
                  <div className="space-y-1" data-oid="4a9yn4n">
                    <div className="flex items-center justify-between text-xs" data-oid="83zbns8">
                      <span className="text-muted-foreground" data-oid="w8v66_l">
                        {completedAnalyzers} / {totalAnalyzers} анализаторов
                      </span>
                      <span className="font-medium" data-oid="dwr-cb7">
                        {file.progress}%
                      </span>
                    </div>
                    <Progress value={file.progress} className="h-1.5" data-oid="6rm95ap" />
                    {file.currentStage && (
                      <p className="text-xs text-muted-foreground" data-oid="j4x-w9w">
                        {file.currentStage}
                      </p>
                    )}
                  </div>
                ) : file.status === "completed" ? (
                  <div className="text-xs text-muted-foreground" data-oid="1qlowb-">
                    {totalAnalyzers} анализаторов завершено
                    {file.duration && ` • ${Math.round(file.duration / 1000)}с`}
                  </div>
                ) : file.status === "error" ? (
                  <div className="text-xs text-red-500" data-oid="862revh">
                    {file.error || "Произошла ошибка"}
                  </div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
