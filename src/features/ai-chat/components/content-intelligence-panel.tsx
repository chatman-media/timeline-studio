/**
 * Content Intelligence Panel - UI для AI анализа контента
 * Интегрирован с новой доменной архитектурой
 */

import { AlertCircle, Brain, Camera, FileVideo, Loader2, Settings } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentClassifier } from "@/domains/ai-services/services/content-classifier"
import type { ContentClassification, SceneAnalysis } from "@/domains/ai-services/types/content-analysis"
import type {
  ContentAnalysisResult,
  MotionAnalysisResult,
  QualityAnalysisResult,
  VideoMetadata,
} from "@/domains/ai-services/types/interfaces"
// Импортируем сервисы из доменов
import { cn } from "@/lib/utils"

// Локальный тип для результата детекции сцен (соответствует Rust структуре)
interface SceneDetectionData {
  scenes: Array<{
    start_time: number
    end_time: number
    confidence: number
  }>
  total_scenes: number
  average_scene_length: number
}

import { FFmpegAnalysisService } from "@/domains/ai-services/services/media-analysis"

interface ContentIntelligencePanelProps {
  videoPath?: string
  className?: string
  onAnalysisComplete?: (results: ContentAnalysisResult) => void
  autoStart?: boolean
}

interface AnalysisState {
  isAnalyzing: boolean
  progress: number
  currentStep: string
  results: {
    metadata?: VideoMetadata
    scenes?: SceneDetectionData
    classification?: ContentClassification
    quality?: QualityAnalysisResult
    motion?: MotionAnalysisResult
    platformOptimization?: any
  }
  error?: string
}

/**
 * Content Intelligence Panel компонент
 */
export function ContentIntelligencePanel({
  videoPath,
  className,
  onAnalysisComplete,
  autoStart = false,
}: ContentIntelligencePanelProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<AnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: "",
    results: {},
  })

  // Инициализируем сервисы
  const ffmpegService = FFmpegAnalysisService.getInstance()
  const contentClassifier = ContentClassifier.getInstance()

  const analyzeContent = useCallback(async () => {
    if (!videoPath) {
      setState((prev) => ({
        ...prev,
        error: t("ai.analysis.noVideoSelected"),
      }))
      return
    }

    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      progress: 0,
      currentStep: t("ai.analysis.starting"),
      error: undefined,
    }))

    try {
      // Шаг 1: Базовый анализ FFmpeg
      setState((prev) => ({
        ...prev,
        progress: 20,
        currentStep: t("ai.analysis.analyzingVideo"),
      }))

      const metadata = await ffmpegService.getVideoMetadata(videoPath)
      const quality = await ffmpegService.analyzeQuality(videoPath)

      setState((prev) => ({
        ...prev,
        progress: 40,
        currentStep: t("ai.analysis.detectingScenes"),
        results: { ...prev.results, metadata, quality },
      }))

      // Шаг 2: Детекция сцен
      const scenes = (await ffmpegService.detectScenes(videoPath)) as unknown as SceneDetectionData

      setState((prev) => ({
        ...prev,
        progress: 60,
        currentStep: t("ai.analysis.analyzingMotion"),
        results: { ...prev.results, scenes },
      }))

      // Шаг 3: Анализ движения
      const motion = await ffmpegService.analyzeMotion(videoPath)

      setState((prev) => ({
        ...prev,
        progress: 80,
        currentStep: t("ai.analysis.classifyingContent"),
        results: { ...prev.results, motion },
      }))

      // Шаг 4: Классификация контента (если есть API ключи)
      let classification: ContentClassification | undefined
      try {
        // Преобразуем сцены из SceneDetectionResult в SceneAnalysis для классификатора
        const sceneAnalyses: SceneAnalysis[] = scenes.scenes.map((scene, index) => ({
          id: `scene-${index}`,
          startTime: scene.start_time,
          endTime: scene.end_time,
          duration: scene.end_time - scene.start_time,
          type: "general" as any, // ContentClassifier определит тип
          confidence: scene.confidence,
          keyFrames: [],
          quality: quality?.video || {
            overall: 0,
            sharpness: 0,
            brightness: 0,
            contrast: 0,
            saturation: 0,
            stability: 0,
            noise: 0,
          },
          content: {
            objects: [],
            faces: [],
            text: [],
            activities: [],
          },
          transitions: [],
        }))

        classification = await contentClassifier.classify(sceneAnalyses, metadata)
        setState((prev) => ({
          ...prev,
          results: { ...prev.results, classification },
        }))
      } catch (error) {
        console.warn("Classification skipped:", error)
      }

      // Финальные результаты
      const finalResults = {
        videoId: videoPath,
        metadata,
        scenes,
        classification,
        quality,
        motion,
        timestamp: new Date().toISOString(),
      } as any as ContentAnalysisResult

      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
        currentStep: t("ai.analysis.complete"),
      }))

      onAnalysisComplete?.(finalResults)
    } catch (error) {
      console.error("Content analysis error:", error)
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : t("ai.analysis.error"),
      }))
    }
  }, [videoPath, t, ffmpegService, contentClassifier, onAnalysisComplete])

  useEffect(() => {
    if (autoStart && videoPath) {
      analyzeContent()
    }
  }, [autoStart, videoPath, analyzeContent])

  if (!videoPath && !state.results.metadata) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileVideo className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-center text-muted-foreground">{t("ai.contentIntelligence.selectVideo")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Main Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            {t("ai.contentIntelligence.title")}
          </CardTitle>
          <CardDescription>{t("ai.contentIntelligence.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {state.error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{state.error}</span>
            </div>
          )}

          {state.isAnalyzing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{state.currentStep}</span>
              </div>
              <Progress value={state.progress} />
            </div>
          ) : (
            <Button onClick={analyzeContent} className="w-full">
              {t("ai.contentIntelligence.analyze")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results Tabs */}
      {Object.keys(state.results).length > 0 && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">{t("ai.analysis.overview")}</TabsTrigger>
            <TabsTrigger value="scenes">{t("ai.analysis.scenes")}</TabsTrigger>
            <TabsTrigger value="quality">{t("ai.analysis.quality")}</TabsTrigger>
            <TabsTrigger value="classification">{t("ai.analysis.classification")}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("ai.analysis.videoOverview")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.results.metadata && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <FileVideo className="h-4 w-4" />
                      {t("ai.analysis.videoInformation")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t("ai.analysis.format")}:</span>{" "}
                        {state.results.metadata.format}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("ai.analysis.resolution")}:</span>{" "}
                        {state.results.metadata.width}x{state.results.metadata.height}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("ai.analysis.duration")}:</span>{" "}
                        {state.results.metadata.duration.toFixed(2)}s
                      </div>
                      <div>
                        <span className="text-muted-foreground">FPS:</span> {state.results.metadata.fps}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("ai.analysis.bitrate")}:</span>{" "}
                        {Math.round(state.results.metadata.bitrate / 1000)}k
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t("ai.analysis.audio")}:</span>{" "}
                        {state.results.metadata.hasAudio ? t("common.yes") : t("common.no")}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary">{state.results.metadata.format}</Badge>
                      {state.results.quality && (
                        <Badge variant={state.results.quality.overall >= 80 ? "default" : "secondary"}>
                          {t("ai.analysis.quality")}: {state.results.quality.overall}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scenes Tab */}
          <TabsContent value="scenes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4" />
                  {t("ai.analysis.sceneAnalysis")}
                </CardTitle>
                {state.results.scenes && (
                  <CardDescription>
                    {t("ai.analysis.scenesDetected", { count: state.results.scenes.total_scenes })}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {state.results.scenes ? (
                  <div className="space-y-3">
                    {state.results.scenes.scenes.slice(0, 10).map((scene, index) => (
                      <div key={`scene-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">#{index + 1}</span>
                          <div>
                            <p className="text-sm">
                              {t("ai.analysis.duration")}: {(scene.end_time - scene.start_time).toFixed(2)}s
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {scene.start_time.toFixed(2)}s - {scene.end_time.toFixed(2)}s
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={scene.confidence * 100} className="w-20" />
                          <span className="text-xs">{(scene.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                    {state.results.scenes.scenes.length > 10 && (
                      <p className="text-sm text-muted-foreground text-center">
                        {t("ai.analysis.andMore", { count: state.results.scenes.scenes.length - 10 })}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("ai.analysis.noScenesDetected")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  {t("ai.analysis.qualityMetrics")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.results.quality ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("ai.analysis.overallQuality")}:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={state.results.quality.overall} className="w-20 h-2" />
                          <span className="text-xs font-medium">{state.results.quality.overall}%</span>
                        </div>
                      </div>
                      {state.results.quality.video && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t("ai.analysis.sharpness")}:</span>
                            <span className="text-xs">{Math.round(state.results.quality.video.sharpness * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t("ai.analysis.brightness")}:</span>
                            <span className="text-xs">{Math.round(state.results.quality.video.brightness * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t("ai.analysis.stability")}:</span>
                            <span className="text-xs">{Math.round(state.results.quality.video.stability * 100)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t("ai.analysis.noise")}:</span>
                            <span className="text-xs">{Math.round(state.results.quality.video.noise * 100)}%</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Motion Analysis */}
                    {state.results.motion && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">{t("ai.analysis.motionAnalysis")}</h4>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">{t("ai.analysis.motionIntensity")}:</span>
                            <span className="text-sm">{Math.round(state.results.motion.motionIntensity * 100)}%</span>
                          </div>
                          {state.results.motion.cameraMovement && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">{t("ai.analysis.cameraMovement")}:</span>
                              <span className="text-sm">{state.results.motion.cameraMovement.type}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">{t("ai.analysis.noQualityData")}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4" />
                  {t("ai.analysis.contentClassification")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.results.classification ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">{t("ai.analysis.category")}</p>
                        <p className="text-sm text-muted-foreground">{state.results.classification.primary.category}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t("ai.analysis.confidence")}</p>
                        <p className="text-sm text-muted-foreground">
                          {(state.results.classification.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      {state.results.classification.primary.subcategory && (
                        <div>
                          <p className="text-sm font-medium">{t("ai.analysis.subcategory")}</p>
                          <p className="text-sm text-muted-foreground">
                            {state.results.classification.primary.subcategory}
                          </p>
                        </div>
                      )}
                      {state.results.classification.primary.reasoning && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium">{t("ai.analysis.reasoning")}</p>
                          <p className="text-sm text-muted-foreground">
                            {state.results.classification.primary.reasoning}
                          </p>
                        </div>
                      )}
                    </div>

                    {state.results.classification.tags && state.results.classification.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t("ai.analysis.tags")}</p>
                        <div className="flex flex-wrap gap-2">
                          {state.results.classification.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {state.results.classification.secondary && state.results.classification.secondary.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">{t("ai.analysis.alternativeClassifications")}</p>
                        <div className="space-y-1">
                          {state.results.classification.secondary.map((sec, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground">
                              {sec.category} ({(sec.confidence * 100).toFixed(0)}%)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("ai.analysis.noClassificationData")}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
