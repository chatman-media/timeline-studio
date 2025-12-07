"use client"

import { CheckCircle2, Circle, FileVideo, Loader2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

import type { FileAnalysisProgress } from "@/features/ai-director/types/analysis-progress"

interface AnalysisListProps {
  files: FileAnalysisProgress[]
  selectedFileId: string | null
  onSelectFile: (fileId: string) => void
}

function getStatusIcon(status: FileAnalysisProgress["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "analyzing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "pending":
      return <Circle className="h-4 w-4 text-muted-foreground" />
    case "cancelled":
      return <XCircle className="h-4 w-4 text-orange-500" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />
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
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <FileVideo className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">Нет анализов для отображения</p>
          <p className="text-xs text-muted-foreground">Запустите анализ файлов через AI Director</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
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
            >
              <div className="space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(file.status)}
                      <h4 className="text-sm font-medium truncate">{file.fileName}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{file.filePath}</p>
                  </div>
                  <Badge variant={getStatusVariant(file.status)} className="shrink-0 text-xs">
                    {getStatusLabel(file.status)}
                  </Badge>
                </div>

                {/* Progress */}
                {file.status === "analyzing" || file.status === "pending" ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {completedAnalyzers} / {totalAnalyzers} анализаторов
                      </span>
                      <span className="font-medium">{file.progress}%</span>
                    </div>
                    <Progress value={file.progress} className="h-1.5" />
                    {file.currentStage && (
                      <p className="text-xs text-muted-foreground">{file.currentStage}</p>
                    )}
                  </div>
                ) : file.status === "completed" ? (
                  <div className="text-xs text-muted-foreground">
                    {totalAnalyzers} анализаторов завершено
                    {file.duration && ` • ${Math.round(file.duration / 1000)}с`}
                  </div>
                ) : file.status === "error" ? (
                  <div className="text-xs text-red-500">{file.error || "Произошла ошибка"}</div>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
