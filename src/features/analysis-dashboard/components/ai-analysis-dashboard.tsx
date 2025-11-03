"use client"

/**
 * AI Analysis Dashboard - Direct AI Director Integration
 * Simplified dashboard working directly with AI Director (file-centric, not project-based)
 */

import { FileVideo, Play, Settings, Zap } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIDirectorProgress } from "@/features/ai-director/components/ai-director-progress"
import { useAIDirector } from "@/features/ai-director/hooks/use-ai-director"
import { useAIDirectorAnalysis } from "@/features/ai-director/hooks/use-ai-director-analysis"
import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"

type AnalysisMode = "fast" | "balanced" | "quality"

export function AIAnalysisDashboard() {
  const { analyzeComprehensive, analyzeQuick, state } = useAIDirector()
  const {
    isAnalyzing,
    currentProgress,
    result,
    errors,
    progressPercentage,
    currentStage,
  } = useAIDirectorAnalysis()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("balanced")

  // File selection
  const handleSelectFile = async () => {
    try {
      const selected = await open({
        title: "Выберите видео для анализа",
        multiple: false,
        filters: [
          {
            name: "Видео",
            extensions: ["mp4", "mov", "avi", "mkv", "webm"],
          },
        ],
      })

      if (selected && typeof selected === "string") {
        setSelectedFile(selected)
      }
    } catch (error) {
      console.error("Failed to select file:", error)
    }
  }

  // Start analysis
  const handleStartAnalysis = async () => {
    if (!selectedFile) return

    try {
      if (analysisMode === "fast") {
        await analyzeQuick(selectedFile)
      } else {
        const config = await invoke("ai_director_get_default_config", { mode: analysisMode })
        await analyzeComprehensive(selectedFile, config)
      }
    } catch (error) {
      console.error("Failed to start analysis:", error)
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
          <p className="text-muted-foreground mt-1">
            Комплексный AI анализ видео - сцены, моменты, аудио, контент
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-1 space-y-4">
          {/* File Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="h-5 w-5" />
                Выбор файла
              </CardTitle>
              <CardDescription>Выберите видео для анализа</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSelectFile} variant="outline" className="w-full">
                {selectedFile ? "Изменить файл" : "Выбрать видео"}
              </Button>

              {selectedFile && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium truncate">{selectedFile.split("/").pop()}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">{selectedFile}</p>
                </div>
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
                disabled={!selectedFile || isAnalyzing}
                className="w-full mt-4 gap-2"
              >
                <Play className="h-4 w-4" />
                {isAnalyzing ? "Анализ..." : "Начать анализ"}
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

        {/* Right Panel - Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress */}
          {(isAnalyzing || currentProgress) && <AIDirectorProgress showOnlyWhenActive />}

          {/* Results */}
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
                              <p className="text-2xl font-bold">{result.scene_analysis.total_scenes}</p>
                              <p className="text-sm text-muted-foreground">Всего сцен</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.scene_analysis.avg_scene_duration?.toFixed(1)}s
                              </p>
                              <p className="text-sm text-muted-foreground">Средняя длительность</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.scene_analysis.scenes.length}</p>
                              <p className="text-sm text-muted-foreground">Детектировано</p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.scene_analysis.scenes.slice(0, 5).map((scene, index) => (
                          <Card key={scene.id}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    Сцена {index + 1}: {scene.scene_type}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {scene.start_time.toFixed(1)}s - {scene.end_time.toFixed(1)}s ({scene.duration.toFixed(1)}s)
                                  </p>
                                  {scene.description && (
                                    <p className="text-sm mt-1">{scene.description}</p>
                                  )}
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
                              <p className="text-2xl font-bold">{result.moment_analysis.total_moments}</p>
                              <p className="text-sm text-muted-foreground">Всего моментов</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.moment_analysis.top_moments?.length || 0}
                              </p>
                              <p className="text-sm text-muted-foreground">Топ моментов</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {(result.moment_analysis.avg_importance_score * 100).toFixed(0)}
                              </p>
                              <p className="text-sm text-muted-foreground">Средняя важность</p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.moment_analysis.moments.slice(0, 10).map((moment, index) => (
                          <Card key={moment.id || index}>
                            <CardContent className="pt-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium">{moment.moment_type}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {moment.timestamp.toFixed(1)}s
                                  </p>
                                  {moment.description && (
                                    <p className="text-sm mt-1">{moment.description}</p>
                                  )}
                                  {moment.content_tags && moment.content_tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {moment.content_tags.map((tag, i) => (
                                        <span
                                          key={i}
                                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                                        >
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
                        ))}
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
                              <p className="text-2xl font-bold">{result.audio_analysis.rms_level.toFixed(3)}</p>
                              <p className="text-sm text-muted-foreground">RMS Level</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.audio_analysis.peak_level.toFixed(3)}</p>
                              <p className="text-sm text-muted-foreground">Peak Level</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {Math.round(result.audio_analysis.spectral_centroid)}Hz
                              </p>
                              <p className="text-sm text-muted-foreground">Spectral Centroid</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">{result.audio_analysis.energy.toFixed(3)}</p>
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
                                {Math.round(result.audio_analysis.music_confidence * 100)}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Речь:</span>
                              <span className="font-medium">
                                {result.audio_analysis.has_speech ? "Да" : "Нет"} (
                                {Math.round(result.audio_analysis.speech_confidence * 100)}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Silence Ratio:</span>
                              <span className="font-medium">
                                {Math.round(result.audio_analysis.silence_ratio * 100)}%
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
                              <p className="text-xl font-medium">{result.content_analysis.mood}</p>
                              <p className="text-sm text-muted-foreground">
                                Confidence: {Math.round(result.content_analysis.mood_confidence * 100)}%
                              </p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Стиль</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-xl font-medium">{result.content_analysis.style}</p>
                              <p className="text-sm text-muted-foreground">
                                Confidence: {Math.round(result.content_analysis.style_confidence * 100)}%
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
                                {result.content_analysis.tags.map((tag, i) => (
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
                                  {Math.round(result.content_analysis.overall_quality * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Визуальное качество:</span>
                                <span className="font-medium">
                                  {Math.round(result.content_analysis.visual_quality * 100)}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Качество аудио:</span>
                                <span className="font-medium">
                                  {Math.round(result.content_analysis.audio_quality * 100)}%
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
                              <p className="text-2xl font-bold">{result.vision_analysis.faces_count}</p>
                              <p className="text-sm text-muted-foreground">Лиц обнаружено</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {result.vision_analysis.objects_detected.length}
                              </p>
                              <p className="text-sm text-muted-foreground">Объектов</p>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-2xl font-bold">
                                {Math.round(result.vision_analysis.avg_composition_score * 100)}
                              </p>
                              <p className="text-sm text-muted-foreground">Композиция</p>
                            </CardContent>
                          </Card>
                        </div>

                        {result.vision_analysis.objects_detected.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Обнаруженные объекты</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex flex-wrap gap-2">
                                {result.vision_analysis.objects_detected.map((obj, i) => (
                                  <span key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
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
