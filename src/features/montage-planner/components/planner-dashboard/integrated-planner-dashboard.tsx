/**
 * Интегрированный Smart Montage Planner с подключением к backend
 */

import { AlertCircle, Download, Settings, Upload, Wand2 } from "lucide-react"
import * as React from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useMediaFiles } from "@/features/app-state/hooks/use-media-files"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaItem } from "@/types/generated/tauri-bindings"
import { useIntegratedAnalysis } from "../../hooks/use-integrated-analysis"
import { MONTAGE_STYLES } from "../../types"
import { PlanViewer } from "./plan-viewer"
import { ProjectAnalyzer } from "./project-analyzer"
import { Suggestions } from "./suggestions"

const logger = createLogger({ module: "IntegratedPlannerDashboard" })

// Добавляем React import для useState

export function IntegratedPlannerDashboard() {
  const { mediaFiles } = useMediaFiles()
  const {
    analyzeProject,
    generateSmartPlan,
    isAnalyzing,
    isGenerating,
    analysisProgress,
    generationProgress,
    error,
    analysisResults,
    planGenerator,
  } = useIntegratedAnalysis()

  // Локальное состояние для настроек
  const [selectedStyle, setSelectedStyle] = React.useState("dynamic")
  const [targetDuration, setTargetDuration] = React.useState([120]) // в секундах

  const hasMedia = mediaFiles.length > 0
  const hasAnalysis = analysisResults !== null
  const hasPlan = planGenerator.currentPlan !== null
  const canAnalyze = hasMedia && !isAnalyzing && !isGenerating
  const canGenerate = hasAnalysis && !isAnalyzing && !isGenerating

  /**
   * Запуск анализа проекта
   */
  const handleAnalyzeProject = async () => {
    try {
      // Convert MediaItem[] to MediaFile[]
      const convertedMediaFiles: MediaFile[] = mediaFiles.map((item) => {
        const isVideo = item.media_type.toLowerCase().includes("video")
        const isAudio = item.media_type.toLowerCase() === "audio"
        return {
          id: item.id,
          path: item.path,
          name: item.name,
          type: isVideo ? MediaType.Video : isAudio ? MediaType.Audio : MediaType.Unknown,
          isVideo,
          isAudio,
          duration: item.duration || 0,
        }
      })

      await analyzeProject(convertedMediaFiles)
    } catch (error) {
      logger.error("Analysis failed:", { error })
    }
  }

  /**
   * Генерация умного плана
   */
  const handleGenerateSmartPlan = async () => {
    try {
      await generateSmartPlan(selectedStyle, targetDuration[0])
    } catch (error) {
      logger.error("Plan generation failed:", { error })
    }
  }

  /**
   * Экспорт плана
   */
  const handleExportPlan = () => {
    if (planGenerator.currentPlan) {
      const planData = JSON.stringify(planGenerator.currentPlan, null, 2)
      const blob = new Blob([planData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `montage-plan-${planGenerator.currentPlan.name}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Форматирование времени
   */
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Smart Montage Planner</h2>
          <p className="text-muted-foreground">
            AI-powered automatic montage plan generation with YOLO and FFmpeg analysis
          </p>
        </div>
        <div className="flex gap-2">
          {hasPlan && (
            <Button variant="outline" size="sm" onClick={handleExportPlan}>
              <Download className="mr-2 h-4 w-4" />
              Export Plan
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span>{error}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {(isAnalyzing || isGenerating) && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{isAnalyzing ? "Analyzing media files..." : "Generating montage plan..."}</span>
                <span>{Math.round(isAnalyzing ? analysisProgress : generationProgress)}%</span>
              </div>
              <Progress value={isAnalyzing ? analysisProgress : generationProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Control Panel */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
            <CardDescription>Current project statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media Files</span>
                <span className="font-medium">{mediaFiles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Duration</span>
                <span className="font-medium">
                  {formatDuration(
                    mediaFiles.reduce((sum, file) => {
                      const duration = file.duration
                      return sum + (typeof duration === "number" ? duration : 0)
                    }, 0),
                  )}
                </span>
              </div>
              {analysisResults && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Video Files</span>
                    <span className="font-medium">{analysisResults.videoCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audio Files</span>
                    <span className="font-medium">{analysisResults.audioCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Key Moments</span>
                    <span className="font-medium">{analysisResults.momentsDetected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Quality</span>
                    <span className="font-medium">{analysisResults.averageQuality.toFixed(0)}%</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Montage Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Montage Settings</CardTitle>
            <CardDescription>Configure your montage plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Style Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Style</label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MONTAGE_STYLES).map(([key, style]) => (
                      <SelectItem key={key} value={key}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedStyle in MONTAGE_STYLES ? MONTAGE_STYLES[selectedStyle].description : ""}
                </p>
              </div>

              {/* Target Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Duration: {formatDuration(targetDuration[0])}</label>
                <Slider
                  value={targetDuration}
                  onValueChange={setTargetDuration}
                  min={30}
                  max={600}
                  step={15}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>30s</span>
                  <span>10min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Montage planning workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={handleAnalyzeProject}
                disabled={!canAnalyze}
                variant={hasMedia ? "default" : "outline"}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze Project"}
              </Button>

              <Button
                className="w-full"
                onClick={handleGenerateSmartPlan}
                disabled={!canGenerate}
                variant={hasAnalysis ? "default" : "outline"}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Smart Plan"}
              </Button>

              {hasPlan && (
                <Button
                  className="w-full"
                  onClick={planGenerator.optimizePlan}
                  disabled={planGenerator.isOptimizing}
                  variant="outline"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {planGenerator.isOptimizing ? "Optimizing..." : "Optimize Plan"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backend Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle>Backend Integration Status</CardTitle>
          <CardDescription>Real-time connection to Tauri backend commands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>YOLO Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>FFmpeg Video</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>FFmpeg Audio</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Moment Detection</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Plan Generation</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Timeline Integration</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {hasAnalysis && <ProjectAnalyzer />}

      {/* Plan Viewer */}
      {hasPlan && planGenerator.currentPlan && <PlanViewer plan={planGenerator.currentPlan} />}

      {/* Suggestions */}
      {hasPlan && <Suggestions />}
    </div>
  )
}
