/**
 * Main dashboard component for Smart Montage Planner
 * Provides overview and control of the montage planning process
 */

import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Progress } from "@timeline-studio/ui/components/progress"
import { AlertCircle, Download, Play, Settings, Sparkles, Upload } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useMontagePlanner } from "../../hooks/use-montage-planner"
import { ExportFormat, MONTAGE_STYLES } from "../../types"
import { PlanViewer } from "./plan-viewer"
import { ProjectAnalyzer } from "./project-analyzer"
import { Suggestions } from "./suggestions"

export function PlannerDashboard() {
  const { t } = useTranslation()
  const {
    // State
    videos,
    fragments,
    currentPlan,
    selectedStyle,
    targetDuration,
    error,

    // Status
    isAnalyzing,
    isGenerating,
    isOptimizing,
    hasVideos,
    hasFragments,
    hasPlan,
    canGeneratePlan,
    canOptimizePlan,
    isBusy,

    // Progress
    progress,
    progressMessage,

    // Statistics
    videoCount,
    fragmentCount,
    totalVideoDuration,
    planDuration,
    utilizationRate,

    // Actions
    startAnalysis,
    generatePlan,
    optimizePlan,
    applyPlanToTimeline,
    exportPlan,
    reset,
    clearError,

    // Helpers
    formatDuration,
    getStyleName,
  } = useMontagePlanner()

  const handleApplyToTimeline = () => {
    applyPlanToTimeline()
    // TODO: Show success notification
  }

  const handleExport = () => {
    exportPlan(ExportFormat.JSON)
    // TODO: Show export dialog with format options
  }

  return (
    <div className="flex flex-col gap-4 p-4" data-oid="m1cndcu">
      {/* Header */}
      <div className="flex items-center justify-between" data-oid="dae:j1y">
        <div data-oid="c1ra8n7">
          <h2 className="text-2xl font-bold" data-oid="sd:m6.u">
            {t("montage-planner.title")}
          </h2>
          <p className="text-muted-foreground" data-oid="te0rtd-">
            {t("montage-planner.description")}
          </p>
        </div>
        <div className="flex gap-2" data-oid="i5912v.">
          {hasPlan && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={isBusy} data-oid="ujymv7x">
                <Download className="mr-2 h-4 w-4" data-oid="p79c258" />
                {t("topBar.export")}
              </Button>
              <Button variant="default" size="sm" onClick={handleApplyToTimeline} disabled={isBusy} data-oid="kjr3073">
                <Play className="mr-2 h-4 w-4" data-oid="hwkswaa" />
                {t("montage-planner.timeline.applyToTimeline")}
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={reset} disabled={isBusy} data-oid="mufjz_2">
            {t("common.reset")}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" data-oid="y6oc8it">
          <AlertCircle className="h-4 w-4" data-oid="v8_wpz6" />
          <AlertDescription className="flex items-center justify-between" data-oid="p8h-tj:">
            <span data-oid="4yi8ilf">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError} data-oid=":ugq.mc">
              {t("common.close")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {isBusy && (
        <Card data-oid="1za4:9c">
          <CardContent className="pt-6" data-oid=".325olu">
            <div className="space-y-2" data-oid="ptk:45t">
              <div className="flex justify-between text-sm" data-oid="dheb1ds">
                <span data-oid="1e7t1cz">{progressMessage}</span>
                <span data-oid="-8h88_4">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} data-oid="77_wvr3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-oid="sse4eqg">
        {/* Project Overview */}
        <Card data-oid="9xu_xdt">
          <CardHeader data-oid="xjfs6w4">
            <CardTitle data-oid=".z9664c">{t("common.projectOverview")}</CardTitle>
            <CardDescription data-oid="88gas74">{t("common.currentProjectStatistics")}</CardDescription>
          </CardHeader>
          <CardContent data-oid="drxjqwr">
            <div className="space-y-2" data-oid="tqy3o4n">
              <div className="flex justify-between" data-oid="k1ln.r3">
                <span className="text-muted-foreground" data-oid="-i.1ysd">
                  {t("common.videos")}
                </span>
                <span className="font-medium" data-oid="e6pxidu">
                  {videoCount}
                </span>
              </div>
              <div className="flex justify-between" data-oid="nnyiyga">
                <span className="text-muted-foreground" data-oid="rg6nuwk">
                  {t("common.totalDuration")}
                </span>
                <span className="font-medium" data-oid="1_w2-23">
                  {formatDuration(totalVideoDuration)}
                </span>
              </div>
              <div className="flex justify-between" data-oid="0ho2nlx">
                <span className="text-muted-foreground" data-oid="n86r1ww">
                  {t("common.fragmentsDetected")}
                </span>
                <span className="font-medium" data-oid="o4sjle1">
                  {fragmentCount}
                </span>
              </div>
              <div className="flex justify-between" data-oid="_ekegy:">
                <span className="text-muted-foreground" data-oid="u4l55xr">
                  {t("common.utilizationRate")}
                </span>
                <span className="font-medium" data-oid="8cm4c5w">
                  {utilizationRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Montage Style */}
        <Card data-oid=".bcui25">
          <CardHeader data-oid="69o1f.t">
            <CardTitle data-oid="njykpxt">{t("montage-planner.planning.style")}</CardTitle>
            <CardDescription data-oid="bluclxh">{t("montage-planner.planning.preferences")}</CardDescription>
          </CardHeader>
          <CardContent data-oid="gybi4hv">
            <div className="space-y-4" data-oid="j_r9cg:">
              <div data-oid="o_m4t41">
                <p className="font-medium" data-oid=".m55bhe">
                  {getStyleName(selectedStyle)}
                </p>
                <p className="text-sm text-muted-foreground" data-oid="rhhst3_">
                  {(MONTAGE_STYLES as any)[selectedStyle]?.description}
                </p>
              </div>
              {targetDuration && (
                <div className="flex justify-between text-sm" data-oid="r_0jjt4">
                  <span className="text-muted-foreground" data-oid="m2996ow">
                    {t("montage-planner.planning.duration")}
                  </span>
                  <span data-oid="8c9iq8u">{formatDuration(targetDuration)}</span>
                </div>
              )}
              {hasPlan && (
                <div className="flex justify-between text-sm" data-oid="z-7vs_d">
                  <span className="text-muted-foreground" data-oid="w4d896p">
                    {t("common.planDuration")}
                  </span>
                  <span
                    className={targetDuration && Math.abs(planDuration - targetDuration) > 10 ? "text-yellow-600" : ""}
                    data-oid="khf8xza"
                  >
                    {formatDuration(planDuration)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card data-oid="tm:j9em">
          <CardHeader data-oid="v._hijg">
            <CardTitle data-oid="m8h8thz">{t("common.actions")}</CardTitle>
            <CardDescription data-oid="wtobzbl">{t("montage-planner.navigation.planning")}</CardDescription>
          </CardHeader>
          <CardContent data-oid="f3i3gtx">
            <div className="space-y-2" data-oid="y8pv8c8">
              <Button className="w-full" onClick={startAnalysis} disabled={!hasVideos || isBusy} data-oid="l5.s.--">
                <Upload className="mr-2 h-4 w-4" data-oid="vjdmqkb" />
                {t("montage-planner.analysis.analyzeVideos")}
              </Button>
              <Button
                className="w-full"
                onClick={generatePlan}
                disabled={!canGeneratePlan}
                variant={hasFragments ? "default" : "outline"}
                data-oid="_dc-w5m"
              >
                <Sparkles className="mr-2 h-4 w-4" data-oid="unut6bs" />
                {t("montage-planner.planning.generatePlan")}
              </Button>
              <Button
                className="w-full"
                onClick={optimizePlan}
                disabled={!canOptimizePlan}
                variant="outline"
                data-oid="i2.dn4b"
              >
                <Settings className="mr-2 h-4 w-4" data-oid="u_8k7a-" />
                {t("common.optimizePlan")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {hasFragments && <ProjectAnalyzer data-oid="35aq13." />}

      {/* Plan Viewer */}
      {hasPlan && currentPlan && <PlanViewer plan={currentPlan} data-oid="ev2sb:1" />}

      {/* Suggestions */}
      {hasPlan && <Suggestions data-oid="o7i67ra" />}
    </div>
  )
}
