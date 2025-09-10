/**
 * Pipeline Status Component
 * Отображает прогресс обработки pipeline
 */

import { PipelineProgress } from "@/domains/ai-services"
import { ProcessingStatus } from "@/domains/ai-services/types"
import { cn } from "@/lib/utils"

interface PipelineStatusProps {
  progress: PipelineProgress | null
  className?: string
}

export function PipelineStatus({ progress, className }: PipelineStatusProps) {
  if (!progress) return null

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return "bg-green-500"
      case ProcessingStatus.RUNNING:
        return "bg-blue-500"
      case ProcessingStatus.FAILED:
        return "bg-red-500"
      case ProcessingStatus.SKIPPED:
        return "bg-gray-400"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.COMPLETED:
        return "✓"
      case ProcessingStatus.RUNNING:
        return "⟳"
      case ProcessingStatus.FAILED:
        return "✗"
      case ProcessingStatus.SKIPPED:
        return "⊘"
      default:
        return "○"
    }
  }

  return (
    <div className={cn("bg-muted rounded-lg p-4", className)}>
      <div className="space-y-3">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Processing Pipeline</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress.overall)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progress.overall}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        {progress.currentStep && <div className="text-sm text-muted-foreground">Current: {progress.currentStep}</div>}

        {/* Step Details */}
        <div className="space-y-2">
          {progress.steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-xs text-white",
                  getStatusColor(step.status),
                )}
              >
                {getStatusIcon(step.status)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{step.name}</span>
                  {step.status === ProcessingStatus.RUNNING && (
                    <span className="text-xs text-muted-foreground">{step.progress}%</span>
                  )}
                </div>
                {step.subSteps && step.subSteps.length > 0 && (
                  <div className="ml-4 mt-1 space-y-1">
                    {step.subSteps.map((subStep, subIndex) => (
                      <div key={subIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-xs text-muted-foreground">
                          {subStep.name} ({subStep.progress}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Time Remaining */}
        {progress.estimatedTimeRemaining && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Estimated time remaining: {formatTime(progress.estimatedTimeRemaining)}
          </div>
        )}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`
}
