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
import type { MediaFile } from "@timeline-studio/core/types"
import { MediaType } from "@timeline-studio/core/types"
import { useMediaFiles } from "@timeline-studio/core/hooks"
import { createLogger } from "@/lib/tauri-logger"
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
    <div className="flex flex-col gap-4 p-4" data-oid="k_g-2.9">
      {/* Header */}
      <div className="flex items-center justify-between" data-oid="k-_96ba">
        <div data-oid="0kn770x">
          <h2 className="text-2xl font-bold" data-oid="a7qu_-7">
            Smart Montage Planner
          </h2>
          <p className="text-muted-foreground" data-oid="tsuoory">
            AI-powered automatic montage plan generation with YOLO and FFmpeg analysis
          </p>
        </div>
        <div className="flex gap-2" data-oid="vb_vame">
          {hasPlan && (
            <Button variant="outline" size="sm" onClick={handleExportPlan} data-oid="zxjpu4-">
              <Download className="mr-2 h-4 w-4" data-oid="j78x9.q" />
              Export Plan
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" data-oid="0151io2">
          <AlertCircle className="h-4 w-4" data-oid="qos8txi" />
          <AlertDescription data-oid="apdtlxh">
            <span data-oid="p88llfg">{error}</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {(isAnalyzing || isGenerating) && (
        <Card data-oid="p4xi8bq">
          <CardContent className="pt-6" data-oid="0w0zovj">
            <div className="space-y-2" data-oid="vg01cn6">
              <div className="flex justify-between text-sm" data-oid="sxd80x8">
                <span data-oid="4dnlxwq">
                  {isAnalyzing ? "Analyzing media files..." : "Generating montage plan..."}
                </span>
                <span data-oid="403mf:d">{Math.round(isAnalyzing ? analysisProgress : generationProgress)}%</span>
              </div>
              <Progress value={isAnalyzing ? analysisProgress : generationProgress} data-oid=":2zy7k2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Control Panel */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-oid="934lolj">
        {/* Project Overview */}
        <Card data-oid="mx33t9s">
          <CardHeader data-oid="cv_aupf">
            <CardTitle data-oid=":ohuv3i">Project Overview</CardTitle>
            <CardDescription data-oid="bc0fzcj">Current project statistics</CardDescription>
          </CardHeader>
          <CardContent data-oid="1n_cgc3">
            <div className="space-y-2" data-oid="0-y59d:">
              <div className="flex justify-between" data-oid="-cy40c6">
                <span className="text-muted-foreground" data-oid=":m3trq5">
                  Media Files
                </span>
                <span className="font-medium" data-oid="29yk9ti">
                  {mediaFiles.length}
                </span>
              </div>
              <div className="flex justify-between" data-oid="4cjpd6q">
                <span className="text-muted-foreground" data-oid="a3ptf6j">
                  Total Duration
                </span>
                <span className="font-medium" data-oid="_nxuqhi">
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
                  <div className="flex justify-between" data-oid="s00vlw0">
                    <span className="text-muted-foreground" data-oid=":ls2nl0">
                      Video Files
                    </span>
                    <span className="font-medium" data-oid="kfqi8u4">
                      {analysisResults.videoCount}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="ekusk06">
                    <span className="text-muted-foreground" data-oid="pl_4669">
                      Audio Files
                    </span>
                    <span className="font-medium" data-oid="ynl0362">
                      {analysisResults.audioCount}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="6wn2ocy">
                    <span className="text-muted-foreground" data-oid="6wzw60j">
                      Key Moments
                    </span>
                    <span className="font-medium" data-oid="mccsyhv">
                      {analysisResults.momentsDetected}
                    </span>
                  </div>
                  <div className="flex justify-between" data-oid="lfj2i4v">
                    <span className="text-muted-foreground" data-oid="ho4hrc.">
                      Avg Quality
                    </span>
                    <span className="font-medium" data-oid="f_.bj89">
                      {analysisResults.averageQuality.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Montage Settings */}
        <Card data-oid="2-oyaaf">
          <CardHeader data-oid="f3y7_y-">
            <CardTitle data-oid=":1hm9re">Montage Settings</CardTitle>
            <CardDescription data-oid="dnbg9:6">Configure your montage plan</CardDescription>
          </CardHeader>
          <CardContent data-oid="t_j2huo">
            <div className="space-y-4" data-oid="h_t5_2c">
              {/* Style Selection */}
              <div className="space-y-2" data-oid="7k9uuw4">
                <label className="text-sm font-medium" data-oid="h8fsurd">
                  Style
                </label>
                <Select value={selectedStyle} onValueChange={setSelectedStyle} data-oid="wj:31ci">
                  <SelectTrigger data-oid="w9addkc">
                    <SelectValue data-oid="fphg41i" />
                  </SelectTrigger>
                  <SelectContent data-oid="u-g0b:z">
                    {Object.entries(MONTAGE_STYLES).map(([key, style]) => (
                      <SelectItem key={key} value={key} data-oid="c-g43a6">
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground" data-oid="k5a0:0s">
                  {selectedStyle in MONTAGE_STYLES ? MONTAGE_STYLES[selectedStyle].description : ""}
                </p>
              </div>

              {/* Target Duration */}
              <div className="space-y-2" data-oid=".lbrfdf">
                <label className="text-sm font-medium" data-oid=".zij17y">
                  Target Duration: {formatDuration(targetDuration[0])}
                </label>
                <Slider
                  value={targetDuration}
                  onValueChange={setTargetDuration}
                  min={30}
                  max={600}
                  step={15}
                  className="w-full"
                  data-oid="1sc0y:j"
                />

                <div className="flex justify-between text-xs text-muted-foreground" data-oid="h3nv4mj">
                  <span data-oid="x09soi-">30s</span>
                  <span data-oid="900ke9h">10min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card data-oid="o970-gd">
          <CardHeader data-oid="h1i_zz-">
            <CardTitle data-oid="hsb9sh_">Actions</CardTitle>
            <CardDescription data-oid="6vz1p.5">Montage planning workflow</CardDescription>
          </CardHeader>
          <CardContent data-oid="ncdob15">
            <div className="space-y-2" data-oid="8bzhyvi">
              <Button
                className="w-full"
                onClick={handleAnalyzeProject}
                disabled={!canAnalyze}
                variant={hasMedia ? "default" : "outline"}
                data-oid="9fsvh84"
              >
                <Upload className="mr-2 h-4 w-4" data-oid="1sf0xc2" />
                {isAnalyzing ? "Analyzing..." : "Analyze Project"}
              </Button>

              <Button
                className="w-full"
                onClick={handleGenerateSmartPlan}
                disabled={!canGenerate}
                variant={hasAnalysis ? "default" : "outline"}
                data-oid="ur7o:x9"
              >
                <Wand2 className="mr-2 h-4 w-4" data-oid="cai5sq:" />
                {isGenerating ? "Generating..." : "Generate Smart Plan"}
              </Button>

              {hasPlan && (
                <Button
                  className="w-full"
                  onClick={planGenerator.optimizePlan}
                  disabled={planGenerator.isOptimizing}
                  variant="outline"
                  data-oid="y2vw:5-"
                >
                  <Settings className="mr-2 h-4 w-4" data-oid="4a3:rxc" />
                  {planGenerator.isOptimizing ? "Optimizing..." : "Optimize Plan"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backend Integration Status */}
      <Card data-oid="ugci4dp">
        <CardHeader data-oid="m1k:v3o">
          <CardTitle data-oid="qpxtx01">Backend Integration Status</CardTitle>
          <CardDescription data-oid="lfkw9ly">Real-time connection to Tauri backend commands</CardDescription>
        </CardHeader>
        <CardContent data-oid="ph.p9_j">
          <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6" data-oid="pbx3865">
            <div className="flex items-center gap-2 text-sm" data-oid="ei2lc6b">
              <div className="w-2 h-2 rounded-full bg-green-500" data-oid="td1cy3q" />
              <span data-oid="d6w.ue7">YOLO Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-sm" data-oid="5a57v12">
              <div className="w-2 h-2 rounded-full bg-green-500" data-oid="x84war:" />
              <span data-oid="5c8l-7-">FFmpeg Video</span>
            </div>
            <div className="flex items-center gap-2 text-sm" data-oid="vozctfl">
              <div className="w-2 h-2 rounded-full bg-green-500" data-oid=":bmjqvx" />
              <span data-oid="7pyu08k">FFmpeg Audio</span>
            </div>
            <div className="flex items-center gap-2 text-sm" data-oid="rn1q6de">
              <div className="w-2 h-2 rounded-full bg-green-500" data-oid="vlpkz6a" />
              <span data-oid="vwo0j18">Moment Detection</span>
            </div>
            <div className="flex items-center gap-2 text-sm" data-oid="9bvlc6l">
              <div className="w-2 h-2 rounded-full bg-green-500" data-oid="qpu2xcs" />
              <span data-oid="gsd5dk1">Plan Generation</span>
            </div>
            <div className="flex items-center gap-2 text-sm" data-oid="is2tou-">
              <div className="w-2 h-2 rounded-full bg-green-500" data-oid="tm_wsau" />
              <span data-oid="yhy8owl">Timeline Integration</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {hasAnalysis && <ProjectAnalyzer data-oid="m.8qnr:" />}

      {/* Plan Viewer */}
      {hasPlan && planGenerator.currentPlan && <PlanViewer plan={planGenerator.currentPlan} data-oid="ac6i0tg" />}

      {/* Suggestions */}
      {hasPlan && <Suggestions data-oid=":ai-y.8" />}
    </div>
  )
}
