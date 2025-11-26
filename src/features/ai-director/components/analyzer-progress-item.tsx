"use client"

/**
 * AnalyzerProgressItem Component
 * Отображает прогресс одного анализатора с иконкой статуса и прогресс-баром
 */

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"
import { useMemo } from "react"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import type { AnalyzerProgress, AnalyzerStatus } from "../types/analysis-progress"
import { getAnalyzerMetadata } from "../types/analysis-progress"

interface AnalyzerProgressItemProps {
  analyzer: AnalyzerProgress
  className?: string
  compact?: boolean
}

export function AnalyzerProgressItem({ analyzer, className, compact = false }: AnalyzerProgressItemProps) {
  const metadata = useMemo(() => getAnalyzerMetadata(analyzer.type), [analyzer.type])

  // Получаем иконку и цвет на основе статуса
  const statusConfig = useMemo(() => {
    const configs: Record<
      AnalyzerStatus,
      {
        icon: React.ComponentType<{ className?: string }>
        color: string
        bgColor: string
        textColor: string
      }
    > = {
      pending: {
        icon: Circle,
        color: "text-gray-400",
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
      },
      running: {
        icon: Loader2,
        color: "text-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
      },
      completed: {
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
      },
      error: {
        icon: XCircle,
        color: "text-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
      },
      skipped: {
        icon: Circle,
        color: "text-gray-300",
        bgColor: "bg-gray-50",
        textColor: "text-gray-500",
      },
    }

    return configs[analyzer.status]
  }, [analyzer.status])

  const StatusIcon = statusConfig.icon
  const isAnimated = analyzer.status === "running"

  // Форматирование времени
  const formattedDuration = useMemo(() => {
    if (!analyzer.duration) return null
    const seconds = Math.round(analyzer.duration / 1000)
    return `${seconds}s`
  }, [analyzer.duration])

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 py-1", className)}>
        <StatusIcon className={cn("h-3 w-3 shrink-0", statusConfig.color, isAnimated && "animate-spin")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs truncate">{metadata.displayName}</span>
            {analyzer.status !== "pending" && (
              <span className={cn("text-xs tabular-nums", statusConfig.textColor)}>{analyzer.progress}%</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-start gap-3 p-2 rounded-md transition-colors", statusConfig.bgColor, className)}>
      {/* Status Icon */}
      <div className="pt-0.5">
        <StatusIcon className={cn("h-4 w-4", statusConfig.color, isAnimated && "animate-spin")} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className={cn("text-sm font-medium truncate", statusConfig.textColor)}>{metadata.displayName}</h4>
            {analyzer.details && <p className="text-xs text-muted-foreground mt-0.5 truncate">{analyzer.details}</p>}
          </div>

          {/* Progress percentage */}
          {analyzer.status !== "pending" && analyzer.status !== "skipped" && (
            <div className="flex items-center gap-2">
              {formattedDuration && <span className="text-xs text-muted-foreground">{formattedDuration}</span>}
              <span className={cn("text-sm font-medium tabular-nums", statusConfig.textColor)}>
                {analyzer.progress}%
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {analyzer.status === "running" && <Progress value={analyzer.progress} className="h-1" />}

        {/* Error Message */}
        {analyzer.error && <p className="text-xs text-red-600 mt-1">{analyzer.error}</p>}

        {/* Result metadata */}
        {analyzer.result?.metadata && analyzer.status === "completed" && (
          <div className="flex flex-wrap gap-2 mt-1">
            {analyzer.result.metadata.itemsFound !== undefined && (
              <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                {analyzer.result.metadata.itemsFound} items
              </span>
            )}
            {analyzer.result.metadata.confidence !== undefined && (
              <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                {Math.round(analyzer.result.metadata.confidence * 100)}% confidence
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
