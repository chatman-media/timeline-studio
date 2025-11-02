/**
 * AI Director Progress Component
 * Показывает real-time прогресс анализа
 */

import { useAIDirectorAnalysis } from "../hooks/use-ai-director-analysis"

export interface AIDirectorProgressProps {
  /** Показывать только когда анализ активен */
  showOnlyWhenActive?: boolean
}

export function AIDirectorProgress({ showOnlyWhenActive = false }: AIDirectorProgressProps) {
  const {
    isAnalyzing,
    currentProgress,
    progressPercentage,
    currentStage,
    estimatedTimeRemaining,
    errors,
    clearErrors,
  } = useAIDirectorAnalysis()

  // Hide when not active if requested
  if (showOnlyWhenActive && !isAnalyzing && !currentProgress) {
    return null
  }

  const formatTimeRemaining = (seconds: number | null): string => {
    if (!seconds) return ""

    if (seconds < 60) {
      return `${seconds}s remaining`
    }
    if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60)
      return `${minutes}m remaining`
    }
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.ceil((seconds % 3600) / 60)
    return `${hours}h ${minutes}m remaining`
  }

  const getStageDisplayName = (stage: string): string => {
    switch (stage) {
      case "initialization":
        return "Initializing"
      case "audio":
        return "Audio Analysis"
      case "video":
        return "Video Analysis"
      case "integration":
        return "Integrating Results"
      case "complete":
        return "Complete"
      default:
        return stage
    }
  }

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case "initialization":
        return "bg-blue-500"
      case "audio":
        return "bg-green-500"
      case "video":
        return "bg-purple-500"
      case "integration":
        return "bg-orange-500"
      case "complete":
        return "bg-emerald-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="ai-director-progress bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">AI Director Analysis</h3>

        {errors.length > 0 && (
          <button onClick={clearErrors} className="text-sm text-red-600 hover:text-red-800 underline">
            Clear {errors.length} error{errors.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${isAnalyzing ? "bg-blue-500 animate-pulse" : "bg-gray-300"}`} />
        <span className="text-sm font-medium text-gray-700">{isAnalyzing ? "Analyzing..." : "Ready"}</span>
      </div>

      {/* Progress Bar */}
      {(isAnalyzing || currentProgress) && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{getStageDisplayName(currentStage)}</span>
            <span className="text-sm text-gray-500">{progressPercentage}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getStageColor(currentStage)}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Status Message */}
      {currentProgress?.message && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 italic">{currentProgress.message}</p>
        </div>
      )}

      {/* Time Remaining */}
      {estimatedTimeRemaining && (
        <div className="mb-3">
          <p className="text-sm text-gray-500">{formatTimeRemaining(estimatedTimeRemaining)}</p>
        </div>
      )}

      {/* Stage Indicators */}
      {(isAnalyzing || currentProgress) && (
        <div className="flex justify-between items-center mb-4">
          {["initialization", "audio", "video", "integration", "complete"].map((stage, index) => {
            const isCurrent = currentStage === stage
            const isCompleted = ["initialization", "audio", "video", "integration"].indexOf(currentStage) > index

            return (
              <div key={stage} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? `${getStageColor(stage)} text-white animate-pulse`
                      : isCompleted
                        ? "bg-gray-400 text-white"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs text-gray-500 mt-1 text-center">{getStageDisplayName(stage)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800 mb-2">Analysis Errors ({errors.length})</h4>
          <div className="space-y-1">
            {errors.slice(0, 3).map((error, index) => (
              <p key={index} className="text-sm text-red-600">
                <span className="font-medium">{error.stage}:</span> {error.error}
              </p>
            ))}
            {errors.length > 3 && (
              <p className="text-sm text-red-500 italic">... and {errors.length - 3} more errors</p>
            )}
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && currentProgress && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
          <pre className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded overflow-auto">
            {JSON.stringify(currentProgress, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
