"use client"

import { AudioLines, Film, ImageIcon, Loader2, Play, Sparkles, Zap } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMediaFiles } from "@/domains/project-management/hooks/use-media-files"
import { useAIDirectorAnalysisV2 } from "@/features/ai-director/hooks/use-ai-director-analysis-v2"
import {
  ANALYZER_METADATA,
  type AnalyzerType,
  VLM_MODELS,
  type VlmModelType,
} from "@/features/ai-director/types/analysis-progress"
import {
  ANALYZER_CATEGORIES,
  type AnalysisLevel,
  detectMediaType,
  formatEstimatedTime,
  getMixedMediaPreset,
  getPresetsForMediaType,
  type MediaAnalysisType,
} from "@/features/ai-director/types/analyzer-presets"

/** Иконки для типов медиа */
const MEDIA_TYPE_ICONS = {
  video: Film,
  audio: AudioLines,
  image: ImageIcon,
}

/** Названия типов медиа */
const MEDIA_TYPE_NAMES = {
  video: "Видео",
  audio: "Аудио",
  image: "Изображения",
}

/** Иконки и названия уровней анализа */
const ANALYSIS_LEVEL_CONFIG = {
  quick: { icon: Zap, name: "Быстрый", nameEn: "Quick" },
  balanced: { icon: Sparkles, name: "Сбалансированный", nameEn: "Balanced" },
  comprehensive: { icon: Film, name: "Полный", nameEn: "Comprehensive" },
  custom: { icon: null, name: "Кастомный", nameEn: "Custom" },
}

/** Список всех VLM моделей */
const ALL_VLM_MODELS: VlmModelType[] = [
  "moondream2",
  "llava",
  "llava:13b",
  "llava:34b",
  "llama3.2-vision",
  "llama3.2-vision:11b",
  "llama3.2-vision:90b",
]

interface FileWithMediaType {
  id: string
  path: string
  name: string
  mediaType: MediaAnalysisType
}

export function AnalysisSettingsPanel() {
  const { mediaFiles } = useMediaFiles()
  const { startBatchAnalysis, isAnalyzing } = useAIDirectorAnalysisV2()

  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [selectedAnalyzers, setSelectedAnalyzers] = useState<Set<AnalyzerType>>(new Set())
  const [analysisLevel, setAnalysisLevel] = useState<AnalysisLevel>("balanced")
  const [vlmModel, setVlmModel] = useState<VlmModelType>("moondream2")

  // Обогащаем файлы информацией о типе медиа
  const analyzableFiles = useMemo<FileWithMediaType[]>(() => {
    return mediaFiles
      .filter((file) => {
        const path = file.path || ""
        const ext = path.toLowerCase().split(".").pop() || ""
        const supportedExts = [
          // Video
          "mp4",
          "mov",
          "avi",
          "mkv",
          "webm",
          "m4v",
          "wmv",
          "flv",
          // Audio
          "mp3",
          "wav",
          "aac",
          "flac",
          "m4a",
          "ogg",
          "wma",
          // Image
          "jpg",
          "jpeg",
          "png",
          "gif",
          "bmp",
          "webp",
          "tiff",
          "heic",
        ]
        return supportedExts.includes(ext)
      })
      .map((file) => ({
        id: file.id,
        path: file.path || "",
        name: file.name || file.path?.split("/").pop() || "Unknown",
        mediaType: detectMediaType(file.path || ""),
      }))
  }, [mediaFiles])

  // Группируем файлы по типу медиа
  const filesByMediaType = useMemo(() => {
    const groups: Record<MediaAnalysisType, FileWithMediaType[]> = {
      video: [],
      audio: [],
      image: [],
    }
    for (const file of analyzableFiles) {
      groups[file.mediaType].push(file)
    }
    return groups
  }, [analyzableFiles])

  // Определяем какие типы медиа выбраны
  const selectedMediaTypes = useMemo<Set<MediaAnalysisType>>(() => {
    const types = new Set<MediaAnalysisType>()
    for (const filePath of selectedFiles) {
      const file = analyzableFiles.find((f) => f.path === filePath)
      if (file) {
        types.add(file.mediaType)
      }
    }
    return types
  }, [selectedFiles, analyzableFiles])

  // Статистика по выбранным файлам
  const selectionStats = useMemo(() => {
    const stats = { video: 0, audio: 0, image: 0 }
    for (const filePath of selectedFiles) {
      const file = analyzableFiles.find((f) => f.path === filePath)
      if (file) {
        stats[file.mediaType]++
      }
    }
    return stats
  }, [selectedFiles, analyzableFiles])

  // Получаем доступные категории анализаторов для выбранных типов медиа
  const availableCategories = useMemo(() => {
    if (selectedMediaTypes.size === 0) {
      return ANALYZER_CATEGORIES
    }
    // Показываем категории, доступные для любого из выбранных типов
    return ANALYZER_CATEGORIES.filter((cat) => [...selectedMediaTypes].some((type) => cat.availableFor.includes(type)))
  }, [selectedMediaTypes])

  // Обновляем анализаторы при смене уровня анализа
  const handleLevelChange = useCallback(
    (level: AnalysisLevel) => {
      setAnalysisLevel(level)
      if (level !== "custom") {
        const mediaTypesArray = [...selectedMediaTypes]
        if (mediaTypesArray.length === 0) {
          // Если файлы не выбраны, берём пресет для видео по умолчанию
          const preset = getMixedMediaPreset(["video"], level)
          setSelectedAnalyzers(preset)
        } else {
          const preset = getMixedMediaPreset(mediaTypesArray, level)
          setSelectedAnalyzers(preset)
        }
      }
    },
    [selectedMediaTypes],
  )

  // Обработчики выбора файлов
  const handleFileToggle = useCallback((filePath: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(filePath)) {
        newSet.delete(filePath)
      } else {
        newSet.add(filePath)
      }
      return newSet
    })
  }, [])

  const handleSelectAllOfType = useCallback(
    (mediaType: MediaAnalysisType) => {
      setSelectedFiles((prev) => {
        const newSet = new Set(prev)
        for (const file of filesByMediaType[mediaType]) {
          newSet.add(file.path)
        }
        return newSet
      })
    },
    [filesByMediaType],
  )

  const handleClearType = useCallback(
    (mediaType: MediaAnalysisType) => {
      setSelectedFiles((prev) => {
        const newSet = new Set(prev)
        for (const file of filesByMediaType[mediaType]) {
          newSet.delete(file.path)
        }
        return newSet
      })
    },
    [filesByMediaType],
  )

  const handleSelectAll = useCallback(() => {
    setSelectedFiles(new Set(analyzableFiles.map((f) => f.path)))
  }, [analyzableFiles])

  const handleClearAll = useCallback(() => {
    setSelectedFiles(new Set())
  }, [])

  // Обработчики выбора анализаторов
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
    setAnalysisLevel("custom")
  }, [])

  const handleCategoryToggle = useCallback((categoryId: string, checked: boolean) => {
    const category = ANALYZER_CATEGORIES.find((c) => c.id === categoryId)
    if (!category) return

    setSelectedAnalyzers((prev) => {
      const newSet = new Set(prev)
      for (const analyzer of category.analyzers) {
        if (checked) {
          newSet.add(analyzer)
        } else {
          newSet.delete(analyzer)
        }
      }
      return newSet
    })
    setAnalysisLevel("custom")
  }, [])

  // Запуск анализа
  const handleStartAnalysis = useCallback(() => {
    if (selectedFiles.size === 0 || selectedAnalyzers.size === 0) return

    const vlmOptions = selectedAnalyzers.has("vlm_analysis") ? { model: vlmModel } : undefined

    // Запускаем без await, чтобы кнопка не зависала
    // Состояние isAnalyzing управляется внутри хука
    void startBatchAnalysis([...selectedFiles], selectedAnalyzers, vlmOptions)
  }, [selectedFiles, selectedAnalyzers, vlmModel, startBatchAnalysis])

  const canStartAnalysis = selectedFiles.size > 0 && selectedAnalyzers.size > 0 && !isAnalyzing

  // Подсчёт примерного времени
  const estimatedTime = useMemo(() => {
    if (selectedAnalyzers.size === 0 || selectedFiles.size === 0) return null
    // Базовое время зависит от кол-ва анализаторов
    const baseTime = selectedAnalyzers.size * 15 // ~15 сек на анализатор
    const totalTime = baseTime * selectedFiles.size
    return formatEstimatedTime(totalTime)
  }, [selectedAnalyzers, selectedFiles])

  return (
    <Card className="border-b rounded-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Настройки анализа</CardTitle>
            <CardDescription className="text-xs">Выберите файлы и настройте параметры анализа</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {estimatedTime && <span className="text-xs text-muted-foreground">Примерно: {estimatedTime}</span>}
            <Button onClick={handleStartAnalysis} disabled={!canStartAnalysis} className="gap-2">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Анализируем...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Начать анализ
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Бейджи с выбранными типами */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Выбрано:</span>
            {selectionStats.video > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Film className="h-3 w-3" />
                {selectionStats.video} видео
              </Badge>
            )}
            {selectionStats.audio > 0 && (
              <Badge variant="secondary" className="gap-1">
                <AudioLines className="h-3 w-3" />
                {selectionStats.audio} аудио
              </Badge>
            )}
            {selectionStats.image > 0 && (
              <Badge variant="secondary" className="gap-1">
                <ImageIcon className="h-3 w-3" />
                {selectionStats.image} изображений
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">
              Файлы ({selectedFiles.size}/{analyzableFiles.length})
            </TabsTrigger>
            <TabsTrigger value="analyzers">Анализаторы ({selectedAnalyzers.size})</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          {/* Вкладка выбора файлов - сгруппированная по типам */}
          <TabsContent value="files" className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {analyzableFiles.length === 0 ? "Нет доступных файлов для анализа" : "Выберите файлы для анализа"}
              </p>
              {analyzableFiles.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Выбрать все
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    Очистить
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[180px] w-full rounded-md border p-3">
              <div className="space-y-4">
                {(["video", "audio", "image"] as MediaAnalysisType[]).map((mediaType) => {
                  const files = filesByMediaType[mediaType]
                  if (files.length === 0) return null

                  const Icon = MEDIA_TYPE_ICONS[mediaType]
                  const selectedCount = files.filter((f) => selectedFiles.has(f.path)).length

                  return (
                    <div key={mediaType} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{MEDIA_TYPE_NAMES[mediaType]}</span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedCount}/{files.length})
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleSelectAllOfType(mediaType)}
                          >
                            Все
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleClearType(mediaType)}
                          >
                            Снять
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 pl-6">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`file-${file.id}`}
                              checked={selectedFiles.has(file.path)}
                              onCheckedChange={() => handleFileToggle(file.path)}
                            />
                            <Label
                              htmlFor={`file-${file.id}`}
                              className="text-sm font-normal cursor-pointer truncate flex-1"
                            >
                              {file.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {analyzableFiles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Добавьте медиафайлы в проект для анализа
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Вкладка выбора анализаторов */}
          <TabsContent value="analyzers" className="space-y-3">
            {/* Уровень анализа */}
            <div className="flex items-center gap-4 pb-2 border-b">
              <span className="text-sm font-medium">Уровень:</span>
              <div className="flex gap-2">
                {(["quick", "balanced", "comprehensive"] as AnalysisLevel[]).map((level) => {
                  const config = ANALYSIS_LEVEL_CONFIG[level]
                  const LevelIcon = config.icon
                  return (
                    <Button
                      key={level}
                      variant={analysisLevel === level ? "default" : "outline"}
                      size="sm"
                      className="gap-1"
                      onClick={() => handleLevelChange(level)}
                    >
                      {LevelIcon && <LevelIcon className="h-3 w-3" />}
                      {config.name}
                    </Button>
                  )
                })}
                {analysisLevel === "custom" && <Badge variant="secondary">Кастомный</Badge>}
              </div>
            </div>

            <ScrollArea className="h-[140px] w-full">
              <div className="space-y-4 pr-3">
                {availableCategories.map((category) => {
                  const categorySelected = category.analyzers.filter((a) => selectedAnalyzers.has(a)).length
                  const isFullySelected = categorySelected === category.analyzers.length
                  const isPartiallySelected = categorySelected > 0 && !isFullySelected

                  // Показываем только анализаторы, доступные для выбранных типов медиа
                  const availableAnalyzers =
                    selectedMediaTypes.size > 0
                      ? category.analyzers.filter((analyzer) => {
                          // Проверяем, что анализатор доступен хотя бы для одного выбранного типа
                          const analyzerCategories = ANALYZER_CATEGORIES.filter((c) => c.analyzers.includes(analyzer))
                          return analyzerCategories.some((c) =>
                            [...selectedMediaTypes].some((type) => c.availableFor.includes(type)),
                          )
                        })
                      : category.analyzers

                  if (availableAnalyzers.length === 0) return null

                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={isPartiallySelected ? "indeterminate" : isFullySelected}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm font-medium cursor-pointer">
                          {category.nameRu}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          ({categorySelected}/{availableAnalyzers.length})
                        </span>
                      </div>

                      <div className="space-y-1 pl-6">
                        {availableAnalyzers.map((analyzer) => {
                          const metadata = ANALYZER_METADATA[analyzer]
                          if (!metadata) return null

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
                  )
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Вкладка дополнительных настроек */}
          <TabsContent value="settings" className="space-y-4">
            {/* VLM модель */}
            {selectedAnalyzers.has("vlm_analysis") && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">VLM модель</Label>
                <Select value={vlmModel} onValueChange={(v) => setVlmModel(v as VlmModelType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Выберите модель" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_VLM_MODELS.map((modelId) => {
                      const model = VLM_MODELS[modelId]
                      return (
                        <SelectItem key={modelId} value={modelId}>
                          <div className="flex flex-col">
                            <span>{model.displayName}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Vision Language Model для глубокого анализа контента</p>
              </div>
            )}

            {/* Пресеты для выбранного типа медиа */}
            {selectedMediaTypes.size > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Рекомендуемые пресеты</Label>
                <div className="grid gap-2">
                  {[...selectedMediaTypes].slice(0, 1).map((mediaType) => {
                    const presets = getPresetsForMediaType(mediaType)
                    return presets.map((preset) => (
                      <Card
                        key={`${mediaType}-${preset.level}`}
                        className="cursor-pointer hover:border-primary transition-colors p-3"
                        onClick={() => {
                          setSelectedAnalyzers(new Set(preset.analyzers))
                          setAnalysisLevel(preset.level)
                          if (preset.vlmModel) {
                            setVlmModel(preset.vlmModel)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {ANALYSIS_LEVEL_CONFIG[preset.level].name} ({MEDIA_TYPE_NAMES[mediaType]})
                            </p>
                            <p className="text-xs text-muted-foreground">{preset.descriptionRu}</p>
                          </div>
                          <Badge variant="outline">{formatEstimatedTime(preset.estimatedTimeSeconds)}</Badge>
                        </div>
                      </Card>
                    ))
                  })}
                </div>
              </div>
            )}

            {selectedMediaTypes.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Выберите файлы, чтобы увидеть рекомендуемые пресеты
              </p>
            )}

            {!selectedAnalyzers.has("vlm_analysis") && selectedMediaTypes.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Включите VLM Analysis для настройки AI Vision модели
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
