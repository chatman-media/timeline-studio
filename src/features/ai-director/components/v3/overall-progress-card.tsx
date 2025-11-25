"use client"

/**
 * Overall Progress Card Component for AI Director v3
 * Общий прогресс batch анализа
 */

import { CheckCircle2, Circle, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export interface OverallProgressData {
  progress: number // 0-100
  completedFiles: number
  totalFiles: number
  estimatedTimeRemaining?: number // seconds
  status: "analyzing" | "completed" | "idle"
}

export interface OverallProgressCardProps {
  progressData: OverallProgressData
  fileStatistics: {
    completed: number
    analyzing: number
    pending: number
    error: number
  }
  onCancel?: () => void
  onPause?: () => void // Phase 3 optional
}

export function OverallProgressCard({ progressData, fileStatistics, onCancel, onPause }: OverallProgressCardProps) {
  const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (minutes < 60) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📊 Overall Progress</h3>
          {progressData.status === "analyzing" && (
            <div className="flex gap-2">
              {onPause && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  Pause
                </Button>
              )}
              {onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel Analysis
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Progress Info */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{progressData.progress}%</span>
              <span className="text-sm text-muted-foreground">
                Complete ({progressData.completedFiles}/{progressData.totalFiles} files)
              </span>
            </div>
            {progressData.estimatedTimeRemaining && progressData.status === "analyzing" && (
              <div className="text-sm text-muted-foreground">ETA: {formatETA(progressData.estimatedTimeRemaining)}</div>
            )}
          </div>

          {/* Progress Bar */}
          <Progress value={progressData.progress} className="h-3" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-3 pt-4 border-t">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-green-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">{fileStatistics.completed}</span>
            </div>
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-blue-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">{fileStatistics.analyzing}</span>
            </div>
            <span className="text-xs text-muted-foreground">Analyzing</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Circle className="h-4 w-4" />
              <span className="font-semibold">{fileStatistics.pending}</span>
            </div>
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-red-600 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="font-semibold">{fileStatistics.error}</span>
            </div>
            <span className="text-xs text-muted-foreground">Errors</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
