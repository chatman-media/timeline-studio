/**
 * Расширенная панель транскрипции с интеграцией Enhanced Subtitle Automation
 * Совмещает существующую функциональность с новыми AI возможностями
 */

import { open, save } from "@tauri-apps/plugin-dialog"
import {
  AlertCircle,
  Brain,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Mic,
  Play,
  RefreshCw,
  Settings,
  Sparkles,
  Users,
  Wand2,
  X,
} from "lucide-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNotifications } from "@/domains/system-integration"
import { type EnhancedSubtitleOptions, useEnhancedSubtitleAutomation } from "../hooks/use-enhanced-subtitle-automation"
// Импортируем существующие компоненты и хуки
import { useTranscription } from "../hooks/use-transcription"
// Типы
import type { SubtitleFormat, TranscriptionOptions } from "../types"
import { LanguageSelector } from "./language-selector"
import { ModelSizeSelector } from "./model-size-selector"
import { TranscriptionEditor } from "./transcription-editor"

interface EnhancedTranscriptionPanelProps {
  onAddToTimeline?: (segments: any[]) => void
}

export function EnhancedTranscriptionPanel({ onAddToTimeline }: EnhancedTranscriptionPanelProps) {
  const { t } = useTranslation()
  const { showError } = useNotifications()

  // Базовая транскрипция
  const {
    isTranscribing,
    progress: transcriptionProgress,
    result: transcriptionResult,
    error: transcriptionError,
    transcribe,
    generateSubtitles: generateBasicSubtitles,
    reset: resetTranscription,
  } = useTranscription()

  // Расширенная автоматизация субтитров
  const {
    isProcessing: isEnhancedProcessing,
    progress: enhancedProgress,
    result: enhancedResult,
    error: enhancedError,
    generateEnhancedSubtitles,
    quickGenerateFromVideo,
    extractFromScreenText,
    generateMultilingual,
    convertToTranscriptionResult,
    cancel: cancelEnhanced,
    reset: resetEnhanced,
  } = useEnhancedSubtitleAutomation()

  // Состояние компонента
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [selectedClipId, setSelectedClipId] = useState<string>("")
  const [mode, setMode] = useState<"basic" | "enhanced">("enhanced")

  // Настройки базовой транскрипции
  const [transcriptionOptions, setTranscriptionOptions] = useState<TranscriptionOptions>({
    language: "auto",
    task: "transcribe",
    modelSize: "base",
    wordTimestamps: true,
    vadFilter: true,
    provider: "faster-whisper",
    device: "auto",
    computeType: "auto",
  })

  // Настройки расширенной автоматизации
  const [enhancedOptions, setEnhancedOptions] = useState<EnhancedSubtitleOptions>({
    language: "ru",
    task: "transcribe",
    useContentIntelligence: true,
    useSpeechRecognition: true,
    useOCR: true,
    useSceneAnalysis: true,
    usePersonIdentification: false,
    autoCorrectGrammar: true,
    autoCapitalization: true,
    removeFiller: false,
    optimizeReading: true,
    includeEmotionalCues: false,
    includeSpeakerLabels: false,
    includeSceneDescriptions: false,
    styleTemplate: "standard",
    confidenceThreshold: 0.7,
    aiProvider: "unified",
  })

  // Определяем активное состояние и результат
  const isActive = mode === "basic" ? isTranscribing : isEnhancedProcessing
  const currentProgress = mode === "basic" ? transcriptionProgress : enhancedProgress
  const currentError = mode === "basic" ? transcriptionError : enhancedError
  const currentResult =
    mode === "basic" ? transcriptionResult : enhancedResult ? convertToTranscriptionResult(enhancedResult) : null

  /**
   * Выбор файла
   */
  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Media files",
            extensions: ["mp4", "avi", "mov", "mkv", "webm", "mp3", "wav", "m4a", "flac"],
          },
        ],
      })

      if (selected && typeof selected === "string") {
        setSelectedFile(selected)
        // Генерируем clipId из пути файла
        const clipId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        setSelectedClipId(clipId)
      }
    } catch (error) {
      showError(t("transcription.fileSelect.error", "Ошибка выбора файла"))
    }
  }

  /**
   * Запуск транскрипции (базовой)
   */
  const handleBasicTranscription = useCallback(async () => {
    if (!selectedFile) {
      showError(t("transcription.noFile", "Выберите файл"))
      return
    }

    await transcribe(selectedFile, transcriptionOptions)
  }, [selectedFile, transcriptionOptions, transcribe, showError])

  /**
   * Запуск расширенной автоматизации
   */
  const handleEnhancedGeneration = useCallback(async () => {
    if (!selectedFile || !selectedClipId) {
      showError(t("transcription.noFile", "Выберите файл"))
      return
    }

    await generateEnhancedSubtitles(selectedFile, selectedClipId, enhancedOptions)
  }, [selectedFile, selectedClipId, enhancedOptions, generateEnhancedSubtitles, showError])

  /**
   * Быстрая генерация субтитров
   */
  const handleQuickGeneration = useCallback(async () => {
    if (!selectedClipId) {
      showError(t("transcription.noFile", "Выберите файл"))
      return
    }

    await quickGenerateFromVideo(selectedClipId, enhancedOptions.language)
  }, [selectedClipId, enhancedOptions.language, quickGenerateFromVideo, showError])

  /**
   * Извлечение из визуального текста
   */
  const handleOCRExtraction = useCallback(async () => {
    if (!selectedClipId) {
      showError(t("transcription.noFile", "Выберите файл"))
      return
    }

    await extractFromScreenText(selectedClipId, enhancedOptions.language)
  }, [selectedClipId, enhancedOptions.language, extractFromScreenText, showError])

  /**
   * Сохранение субтитров
   */
  const handleSaveSubtitles = async (format: SubtitleFormat = "srt") => {
    if (!currentResult) return

    try {
      const filePath = await save({
        defaultPath: `subtitles.${format}`,
        filters: [
          {
            name: "Subtitle files",
            extensions: [format],
          },
        ],
      })

      if (filePath) {
        const subtitleContent =
          mode === "basic" ? await generateBasicSubtitles(format) : await generateBasicSubtitles(format) // Пока используем базовую генерацию

        if (subtitleContent) {
          showError(t("transcription.save.success", "Субтитры сохранены"))
        }
      }
    } catch (error) {
      showError(t("transcription.save.error", "Ошибка сохранения"))
    }
  }

  /**
   * Отмена операции
   */
  const handleCancel = () => {
    if (mode === "enhanced") {
      cancelEnhanced()
    }
    // Для базовой транскрипции пока нет метода отмены
  }

  /**
   * Сброс состояния
   */
  const handleReset = () => {
    resetTranscription()
    resetEnhanced()
    setSelectedFile(null)
    setSelectedClipId("")
  }

  return (
    <div className="w-full h-full flex flex-col space-y-4">
      {/* Заголовок и переключатель режима */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{t("transcription.enhanced.title", "AI Генерация субтитров")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("transcription.enhanced.description", "Автоматическое создание субтитров с использованием AI")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={mode === "basic" ? "secondary" : "default"}>
            {mode === "enhanced" ? "Enhanced AI" : "Standard"}
          </Badge>
          <Tabs value={mode} onValueChange={(value) => setMode(value as any)}>
            <TabsList>
              <TabsTrigger value="basic" className="flex items-center space-x-2">
                <Mic className="w-4 h-4" />
                <span>{t("transcription.mode.basic", "Базовая")}</span>
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>{t("transcription.mode.enhanced", "Enhanced AI")}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Выбор файла */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{t("transcription.file.title", "Выбор файла")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button onClick={handleSelectFile} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              {t("transcription.file.select", "Выбрать файл")}
            </Button>
            {selectedFile && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">{selectedFile.split("/").pop() || "Файл выбран"}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Настройки */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>{t("transcription.settings.title", "Настройки")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main">{t("transcription.settings.main", "Основные")}</TabsTrigger>
              <TabsTrigger value="ai" disabled={mode === "basic"}>
                {t("transcription.settings.ai", "AI функции")}
              </TabsTrigger>
              <TabsTrigger value="advanced">{t("transcription.settings.advanced", "Дополнительно")}</TabsTrigger>
            </TabsList>

            {/* Основные настройки */}
            <TabsContent value="main" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("transcription.language.label", "Язык")}</Label>
                  <LanguageSelector
                    value={mode === "basic" ? transcriptionOptions.language : enhancedOptions.language || "auto"}
                    onChange={(value) => {
                      if (mode === "basic") {
                        setTranscriptionOptions((prev: TranscriptionOptions) => ({ ...prev, language: value }))
                      } else {
                        setEnhancedOptions((prev: EnhancedSubtitleOptions) => ({ ...prev, language: value }))
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("transcription.task.label", "Задача")}</Label>
                  <Select
                    value={mode === "basic" ? transcriptionOptions.task : enhancedOptions.task}
                    onValueChange={(value: "transcribe" | "translate") => {
                      if (mode === "basic") {
                        setTranscriptionOptions((prev: TranscriptionOptions) => ({ ...prev, task: value }))
                      } else {
                        setEnhancedOptions((prev: EnhancedSubtitleOptions) => ({ ...prev, task: value }))
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transcribe">
                        {t("transcription.task.transcribe", "Транскрибировать")}
                      </SelectItem>
                      <SelectItem value="translate">{t("transcription.task.translate", "Переводить")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mode === "basic" && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Размер модели</Label>
                    <ModelSizeSelector
                      value={transcriptionOptions.modelSize}
                      onChange={(value) =>
                        setTranscriptionOptions((prev: TranscriptionOptions) => ({ ...prev, modelSize: value }))
                      }
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* AI функции (только для enhanced режима) */}
            <TabsContent value="ai" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>{t("transcription.ai.sources", "Источники данных")}</span>
                  </Label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm">{t("transcription.ai.speech", "Распознавание речи")}</span>
                      </div>
                      <Switch
                        checked={enhancedOptions.useSpeechRecognition}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, useSpeechRecognition: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">{t("transcription.ai.ocr", "Текст на экране (OCR)")}</span>
                      </div>
                      <Switch
                        checked={enhancedOptions.useOCR}
                        onCheckedChange={(checked) => setEnhancedOptions((prev) => ({ ...prev, useOCR: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm">{t("transcription.ai.scenes", "Анализ сцен")}</span>
                      </div>
                      <Switch
                        checked={enhancedOptions.useSceneAnalysis}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, useSceneAnalysis: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{t("transcription.ai.speakers", "Идентификация говорящих")}</span>
                      </div>
                      <Switch
                        checked={enhancedOptions.usePersonIdentification}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, usePersonIdentification: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center space-x-2">
                    <Wand2 className="w-4 h-4" />
                    <span>{t("transcription.ai.processing", "Обработка текста")}</span>
                  </Label>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("transcription.ai.grammar", "Исправление грамматики")}</span>
                      <Switch
                        checked={enhancedOptions.autoCorrectGrammar}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, autoCorrectGrammar: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("transcription.ai.capitalization", "Заглавные буквы")}</span>
                      <Switch
                        checked={enhancedOptions.autoCapitalization}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, autoCapitalization: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("transcription.ai.filler", "Убрать слова-паразиты")}</span>
                      <Switch
                        checked={enhancedOptions.removeFiller}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, removeFiller: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t("transcription.ai.optimize", "Оптимизация для чтения")}</span>
                      <Switch
                        checked={enhancedOptions.optimizeReading}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({ ...prev, optimizeReading: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Дополнительные настройки */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              {mode === "enhanced" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("transcription.ai.style", "Стиль субтитров")}</Label>
                    <Select
                      value={enhancedOptions.styleTemplate}
                      onValueChange={(value: any) => setEnhancedOptions((prev) => ({ ...prev, styleTemplate: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">{t("transcription.style.standard", "Стандартный")}</SelectItem>
                        <SelectItem value="broadcast">{t("transcription.style.broadcast", "Телевизионный")}</SelectItem>
                        <SelectItem value="social">{t("transcription.style.social", "Соцсети")}</SelectItem>
                        <SelectItem value="accessibility">
                          {t("transcription.style.accessibility", "Доступность")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("transcription.ai.provider", "AI провайдер")}</Label>
                    <Select
                      value={enhancedOptions.aiProvider}
                      onValueChange={(value: any) => setEnhancedOptions((prev) => ({ ...prev, aiProvider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unified">{t("transcription.provider.unified", "Unified AI")}</SelectItem>
                        <SelectItem value="whisper">{t("transcription.provider.whisper", "Whisper")}</SelectItem>
                        <SelectItem value="azure">{t("transcription.provider.azure", "Azure")}</SelectItem>
                        <SelectItem value="google">{t("transcription.provider.google", "Google")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Кнопки управления */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {mode === "enhanced" ? (
                <>
                  <Button
                    onClick={handleEnhancedGeneration}
                    disabled={!selectedFile || isActive}
                    className="flex items-center space-x-2"
                  >
                    <Brain className="w-4 h-4" />
                    <span>{t("transcription.enhanced.generate", "AI Генерация")}</span>
                  </Button>

                  <Button
                    onClick={handleQuickGeneration}
                    disabled={!selectedFile || isActive}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t("transcription.enhanced.quick", "Быстрая")}</span>
                  </Button>

                  <Button
                    onClick={handleOCRExtraction}
                    disabled={!selectedFile || isActive}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{t("transcription.enhanced.ocr", "OCR")}</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleBasicTranscription}
                  disabled={!selectedFile || isActive}
                  className="flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{t("transcription.basic.start", "Транскрибировать")}</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isActive && (
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="w-4 h-4 mr-2" />
                  {t("transcription.cancel", "Отменить")}
                </Button>
              )}

              <Button onClick={handleReset} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                {t("transcription.reset", "Сбросить")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Прогресс */}
      {isActive && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {mode === "enhanced"
                    ? t(`transcription.enhanced.stage.${enhancedProgress.stage}`, enhancedProgress.stage)
                    : t(`transcription.basic.stage.${transcriptionProgress.status}`, transcriptionProgress.status)}
                </span>
                <span className="text-sm text-muted-foreground">{Math.round(currentProgress.progress)}%</span>
              </div>
              <Progress value={currentProgress.progress} className="w-full" />
              {currentProgress.message && <p className="text-xs text-muted-foreground">{currentProgress.message}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ошибки */}
      {currentError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{currentError}</AlertDescription>
        </Alert>
      )}

      {/* Результаты */}
      {currentResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>{t("transcription.results.title", "Результаты")}</span>
              </div>
              <div className="flex items-center space-x-2">
                {mode === "enhanced" && enhancedResult && (
                  <Badge variant="outline" className="text-xs">
                    {t("transcription.enhanced.confidence", "Уверенность")}:{" "}
                    {Math.round(enhancedResult.quality.overallConfidence * 100)}%
                  </Badge>
                )}
                <Button onClick={() => handleSaveSubtitles("srt")} size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  {t("transcription.save.srt", "SRT")}
                </Button>
                {onAddToTimeline && (
                  <Button onClick={() => onAddToTimeline(currentResult.segments)} size="sm">
                    {t("transcription.addToTimeline", "Добавить в таймлайн")}
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full">
              <TranscriptionEditor result={currentResult} onAddToTimeline={onAddToTimeline} />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
