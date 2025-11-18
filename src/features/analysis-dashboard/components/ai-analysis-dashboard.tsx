"use client"

/**
 * AI Analysis Dashboard - Direct AI Director Integration
 * Simplified dashboard working directly with AI Director (file-centric, not project-based)
 */

import { CheckCircle2, Circle, FileVideo, Play, RefreshCw, Settings, Video, Zap } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIDirectorProgress } from "@/features/ai-director/components/ai-director-progress"
import { useAIDirectorAnalysis } from "@/features/ai-director/hooks/use-ai-director-analysis"
import { useMediaFiles } from "@/features/app-state/hooks/use-media-files"
import type { LogContext } from "@/lib/tauri-logger"
import { createLogger } from "@/lib/tauri-logger"

// AI Director types are not in tauri-bindings yet, using placeholder types
type AIDirectorConfig = any
type ComprehensiveAnalysisResult = any
type SceneAnalysis = any

const logger = createLogger("AiAnalysisDashboard")

type AnalysisMode = "fast" | "balanced" | "quality"

// Helper types for rendering (using generated types)
type SceneData = SceneAnalysis

type MomentData = {
  id?: string
  timestamp: number
  moment_type: string
  importance_score: number
  description?: string
  content_tags?: string[]
}

type AudioAnalysisData = {
  rms_level: number
  peak_level: number
  spectral_centroid: number
  energy: number
  has_music: boolean
  music_confidence: number
  has_speech: boolean
  speech_confidence: number
  silence_ratio: number
}

type ContentAnalysisData = {
  mood: string
  mood_confidence: number
  style: string
  style_confidence: number
  tags: string[]
  overall_quality: number
  visual_quality: number
  audio_quality: number
}

type VisionAnalysisData = {
  faces_count: number
  objects_detected: string[]
  avg_composition_score: number
}

// Extended result type with UI-specific fields
type DashboardAnalysisResult = ComprehensiveAnalysisResult & {
  analysis_status?: string
  success_rate?: number
  scene_analysis?: {
    total_scenes: number
    avg_scene_duration: number
    scenes: SceneData[]
  }
  moment_analysis?: {
    total_moments: number
    avg_importance_score: number
    top_moments?: MomentData[]
    moments: MomentData[]
  }
  audio_analysis?: AudioAnalysisData
  content_analysis?: ContentAnalysisData
  vision_analysis?: VisionAnalysisData
}

export function AIAnalysisDashboard() {
  const {
    isAnalyzing,
    currentProgress,
    result: rawResult,
    errors,
    progressPercentage,
    currentStage,
    startAnalysis,
    startQuickAnalysis,
    clearResult,
  } = useAIDirectorAnalysis()

  const { mediaFiles } = useMediaFiles()

  // Cast result to dashboard type for UI rendering
  const result = rawResult as DashboardAnalysisResult | null

  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set())
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("balanced")

  // Debug: отслеживаем получение результата в компоненте
  useEffect(() => {
    logger.infoSync("[AIAnalysisDashboard] Результат изменился", {
      hasRawResult: !!rawResult,
      hasResult: !!result,
      isAnalyzing,
      showSetupPanelWillBe: !isAnalyzing && !result,
    })
  }, [rawResult, result, isAnalyzing])

  // Reset all state to default
  const handleReset = () => {
    logger.infoSync("[AIAnalysisDashboard] Сброс всего состояния дашборда")
    clearResult()
    setSelectedMediaIds(new Set())
    setAnalysisMode("balanced")
  }

  // Show setup panel only when no analysis is running and no results exist
  const showSetupPanel = !isAnalyzing && !result

  // Filter only video files
  const videoFiles = useMemo(() => {
    return mediaFiles.filter((media) => media.media_type === "Video")
  }, [mediaFiles])

  // Get selected file paths
  const selectedFiles = useMemo(() => {
    return Array.from(selectedMediaIds)
      .map((id) => videoFiles.find((m) => m.id === id))
      .filter((media) => media !== undefined)
      .map((media) => media.path)
  }, [selectedMediaIds, videoFiles])

  // Toggle video selection
  const toggleVideoSelection = (videoId: string) => {
    const newSelection = new Set(selectedMediaIds)
    if (newSelection.has(videoId)) {
      newSelection.delete(videoId)
    } else {
      newSelection.add(videoId)
    }
    setSelectedMediaIds(newSelection)
  }

  // Select all videos
  const selectAllVideos = () => {
    setSelectedMediaIds(new Set(videoFiles.map((v) => v.id)))
  }

  // Deselect all videos
  const deselectAllVideos = () => {
    setSelectedMediaIds(new Set())
  }

  // Start analysis
  const handleStartAnalysis = async () => {
    if (selectedFiles.length === 0) return

    try {
      // Analyze each selected file sequentially
      for (const filePath of selectedFiles) {
        if (analysisMode === "fast") {
          await startQuickAnalysis(filePath)
        } else {
          // Use default config based on mode
          const config: AIDirectorConfig = {
            performance_mode: "Balanced",
            enable_audio_analysis: true,
            enable_scene_detection: true,
            enable_video_analysis: analysisMode === "quality",
            enable_vision_analysis: analysisMode === "quality",
            enable_face_detection: analysisMode === "quality",
            enable_face_analysis: analysisMode === "quality",
            enable_object_detection: analysisMode === "quality",
            enable_object_analysis: analysisMode === "quality",
            enable_emotion_analysis: false,
            enable_moment_detection: true,
            enable_content_classification: true,
            enable_composition_analysis: analysisMode === "quality",
            enable_mood_analysis: true,
            enable_quality_analysis: analysisMode === "quality",
            enable_vision_language_model: true, // ✅ Всегда включено (Ollama бесплатно)
            vlm_model: "llava", // Ollama vision модель по умолчанию
            vlm_num_frames: analysisMode === "quality" ? 10 : 5, // Больше кадров для quality
            vlm_temperature: 0.7,
            vlm_max_tokens: 1024,
            max_processing_time: null,
            quality_threshold: 0.5,
            max_key_moments: null,
            enable_caching: true,
            generate_editing_recommendations: true,
            enable_mcp_agents: false,
            ai_provider: null,
            ai_model: null,
            ai_api_key: null,
            enable_ai_enhanced_analysis: analysisMode === "quality",
            enable_ai_descriptions: analysisMode === "quality",
            enable_ai_mood_analysis: true,
          }
          await startAnalysis(filePath, config)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error("Failed to start analysis:", { error: errorMessage } as LogContext)
    }
  }

  const getModeDescription = (mode: AnalysisMode): string => {
    switch (mode) {
      case "fast":
        return "~30 секунд • Только аудио анализ"
      case "balanced":
        return "~2 минуты • Аудио + Сцены + Видение + Моменты"
      case "quality":
        return "~10 минут • Полный анализ всеми движками"
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-500" />
            AI Director Analysis
          </h1>
          <p className="text-muted-foreground mt-1">Комплексный AI анализ видео - сцены, моменты, аудио, контент</p>
        </div>

        {/* Reset Button */}
        <Button
          onClick={handleReset}
          variant="outline"
          size="icon"
          className="h-10 w-10"
          title="Сбросить все настройки и результаты"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        {showSetupPanel ? (
          <div className="lg:col-span-1 space-y-4">
            {/* File Selection */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Выбор видео
              </CardTitle>
              <CardDescription>Выберите видео из медиапула ({selectedMediaIds.size} выбрано)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {videoFiles.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">Нет доступных видео</p>
                  <p className="text-xs mt-1">Добавьте видео в браузер медиа</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button onClick={selectAllVideos} variant="outline" size="sm" className="flex-1">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Выбрать все
                    </Button>
                    <Button onClick={deselectAllVideos} variant="outline" size="sm" className="flex-1">
                      <Circle className="h-4 w-4 mr-2" />
                      Снять всё
                    </Button>
                  </div>

                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {videoFiles.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-start gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => toggleVideoSelection(video.id)}
                        >
                          <Checkbox
                            checked={selectedMediaIds.has(video.id)}
                            onCheckedChange={() => toggleVideoSelection(video.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <FileVideo className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{video.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-1">{video.path}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>

          {/* Analysis Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Режим анализа
              </CardTitle>
              <CardDescription>Выберите скорость и глубину анализа</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={analysisMode} onValueChange={(v) => setAnalysisMode(v as AnalysisMode)}>
                <div className="flex items-center space-x-2 p-3 rounded-md border">
                  <RadioGroupItem value="fast" id="fast" />
                  <div className="flex-1">
                    <Label htmlFor="fast" className="font-medium cursor-pointer">
                      Fast
                    </Label>
                    <p className="text-xs text-muted-foreground">{getModeDescription("fast")}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-md border mt-2">
                  <RadioGroupItem value="balanced" id="balanced" />
                  <div className="flex-1">
                    <Label htmlFor="balanced" className="font-medium cursor-pointer">
                      Balanced
                    </Label>
                    <p className="text-xs text-muted-foreground">{getModeDescription("balanced")}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 p-3 rounded-md border mt-2">
                  <RadioGroupItem value="quality" id="quality" />
                  <div className="flex-1">
                    <Label htmlFor="quality" className="font-medium cursor-pointer">
                      Quality
                    </Label>
                    <p className="text-xs text-muted-foreground">{getModeDescription("quality")}</p>
                  </div>
                </div>
              </RadioGroup>

              <Button
                onClick={handleStartAnalysis}
                disabled={selectedFiles.length === 0 || isAnalyzing}
                className="w-full mt-4 gap-2"
              >
                <Play className="h-4 w-4" />
                {isAnalyzing
                  ? "Анализ..."
                  : selectedFiles.length > 1
                    ? `Анализировать ${selectedFiles.length} видео`
                    : "Начать анализ"}
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>Статус системы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AI Director:</span>
                <span className="font-medium text-green-600">Готов</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Движков:</span>
                <span className="font-medium">5 активных</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GPU:</span>
                <span className="font-medium">Не используется</span>
              </div>
            </CardContent>
          </Card>
        </div>
        ) : null}

        {/* Right Panel - Results */}
        <div className={showSetupPanel ? "lg:col-span-2" : "lg:col-span-3"}>
          {/* New Analysis Button */}
          {(result || isAnalyzing) && (
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Результаты анализа</h2>
              {!isAnalyzing && (
                <Button onClick={clearResult} variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Новый анализ
                </Button>
              )}
            </div>
          )}

          {/* Progress */}
          {(isAnalyzing || currentProgress) && <AIDirectorProgress showOnlyWhenActive />}

          {/* Results */}
          {(() => {
            logger.infoSync("[AIAnalysisDashboard] Проверка условия рендеринга результатов", {
              hasResult: !!result,
              isAnalyzing,
              willRender: !!(result && !isAnalyzing),
            })
            return null
          })()}
          {result && !isAnalyzing && (
            <Card>
              <CardHeader>
                <CardTitle>Результаты анализа</CardTitle>
                <CardDescription>
                  Статус: {result.analysis_status} • Успешность: {Math.round((result.success_rate || 0) * 100)}%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="scenes">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="scenes">Сцены</TabsTrigger>
                    <TabsTrigger value="moments">Моменты</TabsTrigger>
                    <TabsTrigger value="audio">Аудио</TabsTrigger>
                    <TabsTrigger value="content">Контент</TabsTrigger>
                    <TabsTrigger value="vision">Видение</TabsTrigger>
                  </TabsList>

                  {/* Scenes Tab */}
                  <TabsContent value="scenes" className="space-y-4 mt-4">
                    {result.scene_analysis ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.scene_analysis.total_scenes || 0}</p>
                              <p className="text-sm text-muted-foreground">Всего сцен</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.scene_analysis.avg_scene_duration
                                  ? result.scene_analysis.avg_scene_duration.toFixed(1)
                                  : "0"}
                                s
                              </p>
                              <p className="text-sm text-muted-foreground">Средняя длительность</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.scene_analysis.scenes?.length || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">Детектировано</p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.scene_analysis.scenes && result.scene_analysis.scenes.length > 0 ? (
                          <>
                            {result.scene_analysis.scenes.slice(0, 5).map((scene: any, index: number) => (
                              <Card key={scene.id}>
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">
                                        Сцена {index + 1}: {scene.sceneType}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {scene.startTime.toFixed(1)}s - {scene.endTime.toFixed(1)}s (
                                        {scene.duration.toFixed(1)}s)
                                      </p>
                                      {scene.description && <p className="text-sm mt-1">{scene.description}</p>}
                                    </div>
                                    <span className="text-sm font-medium text-blue-600">
                                      {Math.round(scene.confidence * 100)}%
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}

                            {result.scene_analysis.scenes.length > 5 && (
                              <p className="text-sm text-muted-foreground text-center">
                                ... и еще {result.scene_analysis.scenes.length - 5} сцен
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Сцены не найдены</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Нет данных о сценах</p>
                    )}
                  </TabsContent>

                  {/* Moments Tab */}
                  <TabsContent value="moments" className="space-y-4 mt-4">
                    {result.moment_analysis ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.moment_analysis.total_moments || 0}</p>
                              <p className="text-sm text-muted-foreground">Всего моментов</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.moment_analysis.top_moments?.length || 0}</p>
                              <p className="text-sm text-muted-foreground">Топ моментов</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.moment_analysis.avg_importance_score
                                  ? (result.moment_analysis.avg_importance_score * 100).toFixed(0)
                                  : 0}
                              </p>
                              <p className="text-sm text-muted-foreground">Средняя важность</p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.moment_analysis.moments && result.moment_analysis.moments.length > 0 ? (
                          result.moment_analysis.moments.slice(0, 10).map((moment: MomentData, index: number) => (
                            <Card key={moment.id || index}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium">{moment.moment_type}</p>
                                    <p className="text-sm text-muted-foreground">{moment.timestamp.toFixed(1)}s</p>
                                    {moment.description && <p className="text-sm mt-1">{moment.description}</p>}
                                    {moment.content_tags && moment.content_tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {moment.content_tags.map((tag: string, i: number) => (
                                          <span key={i} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className="text-sm font-medium text-blue-600">
                                      {Math.round(moment.importance_score * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Моменты не найдены</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Нет данных о моментах</p>
                    )}
                  </TabsContent>

                  {/* Audio Tab */}
                  <TabsContent value="audio" className="space-y-4 mt-4">
                    {result.audio_analysis ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.audio_analysis.rms_level?.toFixed(3) || "0.000"}
                              </p>
                              <p className="text-sm text-muted-foreground">RMS Level</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.audio_analysis.peak_level?.toFixed(3) || "0.000"}
                              </p>
                              <p className="text-sm text-muted-foreground">Peak Level</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.audio_analysis.spectral_centroid
                                  ? Math.round(result.audio_analysis.spectral_centroid)
                                  : 0}
                                Hz
                              </p>
                              <p className="text-sm text-muted-foreground">Spectral Centroid</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.audio_analysis.energy?.toFixed(3) || "0.000"}
                              </p>
                              <p className="text-sm text-muted-foreground">Energy</p>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader>
                            <CardTitle>Детекция контента</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between">
                              <span>Музыка:</span>
                              <span className="font-medium">
                                {result.audio_analysis.has_music ? "Да" : "Нет"} (
                                {result.audio_analysis.music_confidence
                                  ? Math.round(result.audio_analysis.music_confidence * 100)
                                  : 0}
                                %)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Речь:</span>
                              <span className="font-medium">
                                {result.audio_analysis.has_speech ? "Да" : "Нет"} (
                                {result.audio_analysis.speech_confidence
                                  ? Math.round(result.audio_analysis.speech_confidence * 100)
                                  : 0}
                                %)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Silence Ratio:</span>
                              <span className="font-medium">
                                {result.audio_analysis.silence_ratio
                                  ? Math.round(result.audio_analysis.silence_ratio * 100)
                                  : 0}
                                %
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Нет данных об аудио</p>
                    )}
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content" className="space-y-4 mt-4">
                    {result.content_analysis ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Настроение</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xl font-medium">{result.content_analysis.mood || "Неизвестно"}</p>
                              <p className="text-sm text-muted-foreground">
                                Confidence:{" "}
                                {result.content_analysis.mood_confidence
                                  ? Math.round(result.content_analysis.mood_confidence * 100)
                                  : 0}
                                %
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Стиль</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xl font-medium">{result.content_analysis.style || "Неизвестен"}</p>
                              <p className="text-sm text-muted-foreground">
                                Confidence:{" "}
                                {result.content_analysis.style_confidence
                                  ? Math.round(result.content_analysis.style_confidence * 100)
                                  : 0}
                                %
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.content_analysis.tags && result.content_analysis.tags.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Теги</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {result.content_analysis.tags.map((tag: string, i: number) => (
                                  <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Card>
                          <CardHeader>
                            <CardTitle>Качество</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Общее качество:</span>
                                <span className="font-medium">
                                  {result.content_analysis.overall_quality
                                    ? Math.round(result.content_analysis.overall_quality * 100)
                                    : 0}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Визуальное качество:</span>
                                <span className="font-medium">
                                  {result.content_analysis.visual_quality
                                    ? Math.round(result.content_analysis.visual_quality * 100)
                                    : 0}
                                  %
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Качество аудио:</span>
                                <span className="font-medium">
                                  {result.content_analysis.audio_quality
                                    ? Math.round(result.content_analysis.audio_quality * 100)
                                    : 0}
                                  %
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Нет данных о контенте</p>
                    )}
                  </TabsContent>

                  {/* Vision Tab */}
                  <TabsContent value="vision" className="space-y-4 mt-4">
                    {result.vision_analysis ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.vision_analysis.faces_count || 0}</p>
                              <p className="text-sm text-muted-foreground">Лиц обнаружено</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.vision_analysis.objects_detected?.length || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">Объектов</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.vision_analysis.avg_composition_score
                                  ? Math.round(result.vision_analysis.avg_composition_score * 100)
                                  : 0}
                              </p>
                              <p className="text-sm text-muted-foreground">Композиция</p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.vision_analysis.objects_detected && result.vision_analysis.objects_detected.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Обнаруженные объекты</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {result.vision_analysis.objects_detected.map((obj: string, i: number) => (
                                  <span
                                    key={i}
                                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                                  >
                                    {obj}
                                  </span>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Нет данных о видении</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Ошибки анализа</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-md">
                      <p className="font-medium text-red-800">{error.stage}</p>
                      <p className="text-sm text-red-600">{error.error}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isAnalyzing && !result && !currentProgress && (
            <Card>
              <CardContent className="py-16 text-center">
                <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Готов к анализу</p>
                <p className="text-sm text-muted-foreground">
                  Выберите видео и режим анализа, затем нажмите "Начать анализ"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
