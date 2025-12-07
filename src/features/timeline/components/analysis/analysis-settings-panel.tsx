"use client"

import { Play } from "lucide-react"
import { useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaFiles } from "@/domains/project-management/hooks/use-media-files"
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import { ANALYZER_METADATA, type AnalyzerType } from "@/features/ai-director/types/analysis-progress"
import { DEFAULT_PRESETS, type AnalyzerPreset } from "@/features/ai-director/types/analyzer-presets"

const ANALYZER_CATEGORIES = {
  video: ["scene_detection", "object_detection", "face_detection"] as AnalyzerType[],
  audio: ["audio_quality", "speech_recognition", "music_detection"] as AnalyzerType[],
  content: ["mood_analysis", "moment_detection"] as AnalyzerType[],
}

export function AnalysisSettingsPanel() {
  const { mediaFiles } = useMediaFiles()
  const { startBatchAnalysis, isAnalyzing } = useAIDirectorAnalysisV2()

  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectedAnalyzers, setSelectedAnalyzers] = useState<Set<AnalyzerType>>(new Set())
  const [activePreset, setActivePreset] = useState<string | null>(null)

  // Фильтруем только видео и аудио файлы
  const analyzableFiles = useMemo(() => {
    return mediaFiles.filter((file) => {
      const path = file.path || ""
      const ext = path.toLowerCase().split(".").pop()
      return ["mp4", "mov", "avi", "mkv", "webm", "mp3", "wav", "aac", "flac", "m4a"].includes(ext || "")
    })
  }, [mediaFiles])

  const handleFileToggle = useCallback((filePath: string) => {
    setSelectedFiles((prev) =>
      prev.includes(filePath) ? prev.filter((p) => p !== filePath) : [...prev, filePath],
    )
  }, [])

  const handleAnalyzerToggle = useCallback((analyzer: AnalyzerType) => {
    setSelectedAnalyzers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(analyzer)) {
        newSet.delete(analyzer)
      } else {
        newSet.add(analyzer)
      }
      return newSet
    })
    setActivePreset(null) // Сброс пресета при ручном изменении
  }, [])

  const handlePresetSelect = useCallback((preset: AnalyzerPreset) => {
    setSelectedAnalyzers(new Set(preset.analyzers))
    setActivePreset(preset.id)
  }, [])

  const handleSelectAllFiles = useCallback(() => {
    setSelectedFiles(analyzableFiles.map((f) => f.path || "").filter(Boolean))
  }, [analyzableFiles])

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([])
  }, [])

  const handleStartAnalysis = useCallback(async () => {
    if (selectedFiles.length === 0 || selectedAnalyzers.size === 0) return

    // startBatchAnalysis ожидает Set<AnalyzerType>
    await startBatchAnalysis(selectedFiles, selectedAnalyzers)
  }, [selectedFiles, selectedAnalyzers, startBatchAnalysis])

  const canStartAnalysis = selectedFiles.length > 0 && selectedAnalyzers.size > 0 && !isAnalyzing

  return (
    <Card className="border-b rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Настройки анализа</CardTitle>
            <CardDescription className="text-xs">Выберите файлы и настройте параметры анализа</CardDescription>
          </div>
          <Button onClick={handleStartAnalysis} disabled={!canStartAnalysis} className="gap-2">
            <Play className="h-4 w-4" />
            Начать анализ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">
              Файлы ({selectedFiles.length}/{analyzableFiles.length})
            </TabsTrigger>
            <TabsTrigger value="analyzers">Анализаторы ({selectedAnalyzers.size})</TabsTrigger>
            <TabsTrigger value="presets">Пресеты</TabsTrigger>
          </TabsList>

          {/* Вкладка выбора файлов */}
          <TabsContent value="files" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {analyzableFiles.length === 0
                  ? "Нет доступных файлов для анализа"
                  : "Выберите файлы для анализа из медиа пула"}
              </p>
              {analyzableFiles.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAllFiles}>
                    Выбрать все
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearFiles}>
                    Очистить
                  </Button>
                </div>
              )}
            </div>

            {analyzableFiles.length > 0 && (
              <ScrollArea className="h-[120px] w-full rounded-md border p-3">
                <div className="space-y-2">
                  {analyzableFiles.map((file) => (
                    <div key={file.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`file-${file.id}`}
                        checked={selectedFiles.includes(file.path || "")}
                        onCheckedChange={() => handleFileToggle(file.path || "")}
                      />
                      <Label htmlFor={`file-${file.id}`} className="text-sm font-normal cursor-pointer truncate flex-1">
                        {file.name || file.path?.split("/").pop() || "Unknown"}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Вкладка выбора анализаторов */}
          <TabsContent value="analyzers" className="space-y-3">
            <p className="text-sm text-muted-foreground">Выберите анализаторы для запуска</p>

            <div className="space-y-4">
              {Object.entries(ANALYZER_CATEGORIES).map(([category, analyzers]) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize">{category === "video" ? "Видео" : category === "audio" ? "Аудио" : "Контент"}</h4>
                  <div className="space-y-2 pl-2">
                    {analyzers.map((analyzer) => {
                      const metadata = ANALYZER_METADATA[analyzer]
                      return (
                        <div key={analyzer} className="flex items-start space-x-2">
                          <Checkbox
                            id={`analyzer-${analyzer}`}
                            checked={selectedAnalyzers.has(analyzer)}
                            onCheckedChange={() => handleAnalyzerToggle(analyzer)}
                          />
                          <div className="flex-1">
                            <Label htmlFor={`analyzer-${analyzer}`} className="text-sm font-normal cursor-pointer">
                              {metadata.displayName}
                            </Label>
                            <p className="text-xs text-muted-foreground">{metadata.description}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Вкладка пресетов */}
          <TabsContent value="presets" className="space-y-3">
            <p className="text-sm text-muted-foreground">Выберите готовый пресет анализа</p>

            <div className="grid gap-3">
              {DEFAULT_PRESETS.map((preset) => (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-colors ${
                    activePreset === preset.id ? "border-primary bg-accent" : "hover:border-accent-foreground/20"
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm">{preset.name}</CardTitle>
                    <CardDescription className="text-xs">{preset.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-xs text-muted-foreground">{preset.analyzers.size} анализаторов</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
