"use client"

import { useMediaFiles } from "@timeline-studio/core/hooks/use-media-files"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Checkbox } from "@timeline-studio/ui/components/checkbox"
import { Label } from "@timeline-studio/ui/components/label"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { AudioLines, Film, ImageIcon, Loader2, Play, Sparkles, Zap } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
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

/** English names for media types */
const MEDIA_TYPE_NAMES_EN = {
  video: "Video",
  audio: "Audio",
  image: "Images",
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
  const { i18n } = useTranslation()
  const isRu = i18n.language === "ru"
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
    <Card className="border-b rounded-none" data-oid="sxgccol">
      <CardHeader className="pb-3" data-oid="ar9wjtr">
        <div className="flex items-center justify-between" data-oid="ifqc9gh">
          <div data-oid="rdld9ty">
            <CardTitle className="text-base" data-oid="i0kw3ku">
              {isRu ? "Настройки анализа" : "Analysis settings"}
            </CardTitle>
            <CardDescription className="text-xs" data-oid="825b0ma">
              {isRu ? "Выберите файлы и настройте параметры анализа" : "Select files and configure analysis parameters"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3" data-oid="pwk9d8i">
            {estimatedTime && (
              <span className="text-xs text-muted-foreground" data-oid="n8k.pxh">
                {isRu ? "Примерно" : "About"}: {estimatedTime}
              </span>
            )}
            <Button onClick={handleStartAnalysis} disabled={!canStartAnalysis} className="gap-2" data-oid="tz-7otl">
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" data-oid="au1hvn5" />
                  {isRu ? "Анализируем..." : "Analyzing..."}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" data-oid="fi:510k" />
                  {isRu ? "Начать анализ" : "Start analysis"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Бейджи с выбранными типами */}
        {selectedFiles.size > 0 && (
          <div className="flex items-center gap-2 mt-2" data-oid="y-pagki">
            <span className="text-xs text-muted-foreground" data-oid="yd8hn-.">
              {isRu ? "Выбрано:" : "Selected:"}
            </span>
            {selectionStats.video > 0 && (
              <Badge variant="secondary" className="gap-1" data-oid="zmiowi6">
                <Film className="h-3 w-3" data-oid="ii.zju1" />
                {selectionStats.video} {isRu ? "видео" : "video"}
              </Badge>
            )}
            {selectionStats.audio > 0 && (
              <Badge variant="secondary" className="gap-1" data-oid="qzqqcrk">
                <AudioLines className="h-3 w-3" data-oid="ijqggp1" />
                {selectionStats.audio} {isRu ? "аудио" : "audio"}
              </Badge>
            )}
            {selectionStats.image > 0 && (
              <Badge variant="secondary" className="gap-1" data-oid="erg9:44">
                <ImageIcon className="h-3 w-3" data-oid="tz95qa:" />
                {selectionStats.image} {isRu ? "изображений" : "images"}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent data-oid="etzqxcw">
        <Tabs defaultValue="files" className="w-full" data-oid="b:5b.nj">
          <TabsList className="grid w-full grid-cols-3" data-oid="5:xq5r.">
            <TabsTrigger value="files" data-oid="exg5mon">
              {isRu ? "Файлы" : "Files"} ({selectedFiles.size}/{analyzableFiles.length})
            </TabsTrigger>
            <TabsTrigger value="analyzers" data-oid="eu:dp5f">
              {isRu ? "Анализаторы" : "Analyzers"} ({selectedAnalyzers.size})
            </TabsTrigger>
            <TabsTrigger value="settings" data-oid="98zkr.j">
              {isRu ? "Настройки" : "Settings"}
            </TabsTrigger>
          </TabsList>

          {/* Вкладка выбора файлов - сгруппированная по типам */}
          <TabsContent value="files" className="space-y-3" data-oid="ppwo9kj">
            <div className="flex items-center justify-between" data-oid="a0bqmb6">
              <p className="text-sm text-muted-foreground" data-oid="oc_x7s6">
                {analyzableFiles.length === 0
                  ? isRu
                    ? "Нет доступных файлов для анализа"
                    : "No files available for analysis"
                  : isRu
                    ? "Выберите файлы для анализа"
                    : "Select files to analyze"}
              </p>
              {analyzableFiles.length > 0 && (
                <div className="flex gap-2" data-oid="x9w6rqg">
                  <Button variant="outline" size="sm" onClick={handleSelectAll} data-oid="7hembgk">
                    {isRu ? "Выбрать все" : "Select all"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll} data-oid="wtmoi:v">
                    {isRu ? "Очистить" : "Clear"}
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="h-[180px] w-full rounded-md border p-3" data-oid="sc_6ak_">
              <div className="space-y-4" data-oid="i62pcly">
                {(["video", "audio", "image"] as MediaAnalysisType[]).map((mediaType) => {
                  const files = filesByMediaType[mediaType]
                  if (files.length === 0) return null

                  const Icon = MEDIA_TYPE_ICONS[mediaType]
                  const selectedCount = files.filter((f) => selectedFiles.has(f.path)).length

                  return (
                    <div key={mediaType} className="space-y-2" data-oid="1trfdr1">
                      <div className="flex items-center justify-between" data-oid="2c1edr1">
                        <div className="flex items-center gap-2" data-oid="xkj8s_g">
                          <Icon className="h-4 w-4 text-muted-foreground" data-oid="f6zwuwa" />
                          <span className="text-sm font-medium" data-oid="q6j3_8p">
                            {isRu ? MEDIA_TYPE_NAMES[mediaType] : MEDIA_TYPE_NAMES_EN[mediaType]}
                          </span>
                          <span className="text-xs text-muted-foreground" data-oid="pzej058">
                            ({selectedCount}/{files.length})
                          </span>
                        </div>
                        <div className="flex gap-1" data-oid="ksscche">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleSelectAllOfType(mediaType)}
                            data-oid="x1lcd:5"
                          >
                            {isRu ? "Все" : "All"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleClearType(mediaType)}
                            data-oid="4itlryk"
                          >
                            {isRu ? "Снять" : "None"}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 pl-6" data-oid="bm:rvpn">
                        {files.map((file) => (
                          <div key={file.id} className="flex items-center space-x-2" data-oid="4lp2hy_">
                            <Checkbox
                              id={`file-${file.id}`}
                              checked={selectedFiles.has(file.path)}
                              onCheckedChange={() => handleFileToggle(file.path)}
                              data-oid="hp7hej9"
                            />

                            <Label
                              htmlFor={`file-${file.id}`}
                              className="text-sm font-normal cursor-pointer truncate flex-1"
                              data-oid="elyslrn"
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
                  <p className="text-sm text-muted-foreground text-center py-4" data-oid="gm.hzs4">
                    {isRu ? "Добавьте медиафайлы в проект для анализа" : "Add media files to the project to analyze"}
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Вкладка выбора анализаторов */}
          <TabsContent value="analyzers" className="space-y-3" data-oid="ang3oxf">
            {/* Уровень анализа */}
            <div className="flex items-center gap-4 pb-2 border-b" data-oid="m3iz8oo">
              <span className="text-sm font-medium" data-oid="v8dd5zd">
                {isRu ? "Уровень:" : "Level:"}
              </span>
              <div className="flex gap-2" data-oid="xo4i_cs">
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
                      data-oid="7oav6zs"
                    >
                      {LevelIcon && <LevelIcon className="h-3 w-3" data-oid="yah..r." />}
                      {isRu ? config.name : config.nameEn}
                    </Button>
                  )
                })}
                {analysisLevel === "custom" && (
                  <Badge variant="secondary" data-oid="fq4x31m">
                    {isRu ? ANALYSIS_LEVEL_CONFIG.custom.name : ANALYSIS_LEVEL_CONFIG.custom.nameEn}
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="h-[140px] w-full" data-oid="4kkbs8r">
              <div className="space-y-4 pr-3" data-oid="v-de0tr">
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
                    <div key={category.id} className="space-y-2" data-oid="tnm:e24">
                      <div className="flex items-center space-x-2" data-oid="ofzkc7u">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={isPartiallySelected ? "indeterminate" : isFullySelected}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                          data-oid="2v84m7k"
                        />

                        <Label
                          htmlFor={`category-${category.id}`}
                          className="text-sm font-medium cursor-pointer"
                          data-oid=":q2idz."
                        >
                          {isRu ? category.nameRu : category.name}
                        </Label>
                        <span className="text-xs text-muted-foreground" data-oid="02knopj">
                          ({categorySelected}/{availableAnalyzers.length})
                        </span>
                      </div>

                      <div className="space-y-1 pl-6" data-oid="yi3ivhi">
                        {availableAnalyzers.map((analyzer) => {
                          const metadata = ANALYZER_METADATA[analyzer]
                          if (!metadata) return null

                          return (
                            <div key={analyzer} className="flex items-start space-x-2" data-oid="r7k8gy1">
                              <Checkbox
                                id={`analyzer-${analyzer}`}
                                checked={selectedAnalyzers.has(analyzer)}
                                onCheckedChange={() => handleAnalyzerToggle(analyzer)}
                                data-oid="a:df:h1"
                              />

                              <div className="flex-1" data-oid="5qq0kp4">
                                <Label
                                  htmlFor={`analyzer-${analyzer}`}
                                  className="text-sm font-normal cursor-pointer"
                                  data-oid="h5hpoou"
                                >
                                  {metadata.displayName}
                                </Label>
                                <p className="text-xs text-muted-foreground" data-oid="t9_fbry">
                                  {isRu ? metadata.description : metadata.descriptionEn}
                                </p>
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
          <TabsContent value="settings" className="space-y-4" data-oid="erh0ghj">
            {/* VLM модель */}
            {selectedAnalyzers.has("vlm_analysis") && (
              <div className="space-y-2" data-oid="e:9cxie">
                <Label className="text-sm font-medium" data-oid="u7kfbtd">
                  {isRu ? "VLM модель" : "VLM model"}
                </Label>
                <Select value={vlmModel} onValueChange={(v) => setVlmModel(v as VlmModelType)} data-oid="18i-80j">
                  <SelectTrigger className="w-full" data-oid="rec00a:">
                    <SelectValue placeholder={isRu ? "Выберите модель" : "Select a model"} data-oid="4z49rff" />
                  </SelectTrigger>
                  <SelectContent data-oid="stnfwgt">
                    {ALL_VLM_MODELS.map((modelId) => {
                      const model = VLM_MODELS[modelId]
                      return (
                        <SelectItem key={modelId} value={modelId} data-oid="ui4:7jr">
                          <div className="flex flex-col" data-oid="1pr2a8k">
                            <span data-oid="rj_2-2f">{model.displayName}</span>
                            <span className="text-xs text-muted-foreground" data-oid="uk4wwq9">
                              {isRu ? model.description : model.descriptionEn}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground" data-oid="b:piop.">
                  {isRu
                    ? "Vision Language Model для глубокого анализа контента"
                    : "Vision Language Model for deep content analysis"}
                </p>
              </div>
            )}

            {/* Пресеты для выбранного типа медиа */}
            {selectedMediaTypes.size > 0 && (
              <div className="space-y-2" data-oid="ntboslf">
                <Label className="text-sm font-medium" data-oid="vft_2ju">
                  {isRu ? "Рекомендуемые пресеты" : "Recommended presets"}
                </Label>
                <div className="grid gap-2" data-oid="4v00_t_">
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
                        data-oid="43bsshi"
                      >
                        <div className="flex items-center justify-between" data-oid="24tdtj5">
                          <div data-oid="52v6tv3">
                            <p className="text-sm font-medium" data-oid="c6mib6e">
                              {isRu
                                ? ANALYSIS_LEVEL_CONFIG[preset.level].name
                                : ANALYSIS_LEVEL_CONFIG[preset.level].nameEn}{" "}
                              ({isRu ? MEDIA_TYPE_NAMES[mediaType] : MEDIA_TYPE_NAMES_EN[mediaType]})
                            </p>
                            <p className="text-xs text-muted-foreground" data-oid="qwrcx4k">
                              {isRu ? preset.descriptionRu : preset.description}
                            </p>
                          </div>
                          <Badge variant="outline" data-oid="e1ygc.6">
                            {formatEstimatedTime(preset.estimatedTimeSeconds)}
                          </Badge>
                        </div>
                      </Card>
                    ))
                  })}
                </div>
              </div>
            )}

            {selectedMediaTypes.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4" data-oid="c150a9i">
                {isRu
                  ? "Выберите файлы, чтобы увидеть рекомендуемые пресеты"
                  : "Select files to see recommended presets"}
              </p>
            )}

            {!selectedAnalyzers.has("vlm_analysis") && selectedMediaTypes.size === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4" data-oid="lx4prge">
                {isRu
                  ? "Включите VLM Analysis для настройки AI Vision модели"
                  : "Enable VLM Analysis to configure the AI Vision model"}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
