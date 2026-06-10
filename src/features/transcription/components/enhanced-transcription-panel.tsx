/**
 * Расширенная панель транскрипции с интеграцией Enhanced Subtitle Automation
 * Совмещает существующую функциональность с новыми AI возможностями
 */

import { container } from "@timeline-studio/core"
import { useNotifications } from "@timeline-studio/core/hooks"
import { Alert, AlertDescription } from "@timeline-studio/ui/components/alert"
import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
import { ScrollArea } from "@timeline-studio/ui/components/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Separator } from "@timeline-studio/ui/components/separator"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
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
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
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
  const { showError, showSuccess } = useNotifications()
  const platform = useMemo(() => {
    try {
      return container.hasPlatform() ? container.getPlatform() : null
    } catch {
      return null
    }
  }, [])

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
    if (!platform) {
      showError("Ошибка", "Platform service недоступен")
      return
    }

    try {
      const selected = await platform.showOpenDialog({
        multiple: false,
        filters: [
          {
            name: "Media files",
            extensions: ["mp4", "avi", "mov", "mkv", "webm", "mp3", "wav", "m4a", "flac"],
          },
        ],
      })

      if (selected && selected.length > 0) {
        setSelectedFile(selected[0])
        // Генерируем clipId из пути файла
        const clipId = `clip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        setSelectedClipId(clipId)
      }
    } catch (error) {
      showError("Ошибка", t("transcription.fileSelect.error", "Ошибка выбора файла"))
    }
  }

  /**
   * Запуск транскрипции (базовой)
   */
  const handleBasicTranscription = useCallback(async () => {
    if (!selectedFile) {
      showError(t("transcription.error", "Ошибка"), t("transcription.noFile", "Выберите файл"))
      return
    }

    await transcribe(selectedFile, transcriptionOptions)
  }, [selectedFile, transcriptionOptions, transcribe, showError, t])

  /**
   * Запуск расширенной автоматизации
   */
  const handleEnhancedGeneration = useCallback(async () => {
    if (!selectedFile || !selectedClipId) {
      showError(t("transcription.error", "Ошибка"), t("transcription.noFile", "Выберите файл"))
      return
    }

    await generateEnhancedSubtitles(selectedFile, selectedClipId, enhancedOptions)
  }, [selectedFile, selectedClipId, enhancedOptions, generateEnhancedSubtitles, showError, t])

  /**
   * Быстрая генерация субтитров
   */
  const handleQuickGeneration = useCallback(async () => {
    if (!selectedClipId) {
      showError(t("transcription.error", "Ошибка"), t("transcription.noFile", "Выберите файл"))
      return
    }

    await quickGenerateFromVideo(selectedClipId, enhancedOptions.language)
  }, [selectedClipId, enhancedOptions.language, quickGenerateFromVideo, showError, t])

  /**
   * Извлечение из визуального текста
   */
  const handleOCRExtraction = useCallback(async () => {
    if (!selectedClipId) {
      showError(t("transcription.error", "Ошибка"), t("transcription.noFile", "Выберите файл"))
      return
    }

    await extractFromScreenText(selectedClipId, enhancedOptions.language)
  }, [selectedClipId, enhancedOptions.language, extractFromScreenText, showError, t])

  /**
   * Сохранение субтитров
   */
  const handleSaveSubtitles = async (format: SubtitleFormat = "srt") => {
    if (!currentResult) return
    if (!platform) {
      showError("Ошибка", "Platform service недоступен")
      return
    }

    try {
      const filePath = await platform.showSaveDialog({
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
          showSuccess(t("transcription.save.success", "Субтитры сохранены"), "")
        }
      }
    } catch (error) {
      showError(t("transcription.error", "Ошибка"), t("transcription.save.error", "Ошибка сохранения"))
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
    <div className="w-full h-full flex flex-col space-y-4" data-oid="0y.b3h-">
      {/* Заголовок и переключатель режима */}
      <div className="flex items-center justify-between" data-oid="rcotwr6">
        <div data-oid=".xxwqxd">
          <h2 className="text-2xl font-semibold" data-oid="e1f09n1">
            {t("transcription.enhanced.title", "AI Генерация субтитров")}
          </h2>
          <p className="text-sm text-muted-foreground" data-oid="h1hhcli">
            {t("transcription.enhanced.description", "Автоматическое создание субтитров с использованием AI")}
          </p>
        </div>
        <div className="flex items-center space-x-2" data-oid="uscxrrf">
          <Badge variant={mode === "basic" ? "secondary" : "default"} data-oid="4vr24pu">
            {mode === "enhanced" ? "Enhanced AI" : "Standard"}
          </Badge>
          <Tabs value={mode} onValueChange={(value) => setMode(value as any)} data-oid="cmvbf4n">
            <TabsList data-oid="j4y7tm3">
              <TabsTrigger value="basic" className="flex items-center space-x-2" data-oid="4y93alb">
                <Mic className="w-4 h-4" data-oid="zp_2r5m" />
                <span data-oid="twff58r">{t("transcription.mode.basic", "Базовая")}</span>
              </TabsTrigger>
              <TabsTrigger value="enhanced" className="flex items-center space-x-2" data-oid="g721fug">
                <Brain className="w-4 h-4" data-oid="otzbhks" />
                <span data-oid="o_1qy37">{t("transcription.mode.enhanced", "Enhanced AI")}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Выбор файла */}
      <Card data-oid="kt.bltt">
        <CardHeader data-oid="i7t09vl">
          <CardTitle className="flex items-center space-x-2" data-oid="t_txjql">
            <FileText className="w-5 h-5" data-oid="zny92d8" />
            <span data-oid="1.v7hoe">{t("transcription.file.title", "Выбор файла")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="k9h7yk:">
          <div className="flex items-center space-x-4" data-oid="2xcj2lh">
            <Button onClick={handleSelectFile} variant="outline" data-oid="r6o1vhn">
              <FileText className="w-4 h-4 mr-2" data-oid="2skjf2:" />
              {t("transcription.file.select", "Выбрать файл")}
            </Button>
            {selectedFile && (
              <div className="flex items-center space-x-2" data-oid="o_jv0-f">
                <CheckCircle className="w-4 h-4 text-green-500" data-oid="3xj4i18" />
                <span className="text-sm font-medium" data-oid=":cge6fx">
                  {selectedFile.split("/").pop() || "Файл выбран"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Настройки */}
      <Card data-oid="cqsyget">
        <CardHeader data-oid="6bf:7cp">
          <CardTitle className="flex items-center space-x-2" data-oid="rj.76pe">
            <Settings className="w-5 h-5" data-oid="2:i5ano" />
            <span data-oid="te5sks4">{t("transcription.settings.title", "Настройки")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="mlp6i2b">
          <Tabs defaultValue="main" className="w-full" data-oid="5v0jk-b">
            <TabsList className="grid w-full grid-cols-3" data-oid="c:jtshb">
              <TabsTrigger value="main" data-oid="t.0h_1w">
                {t("transcription.settings.main", "Основные")}
              </TabsTrigger>
              <TabsTrigger value="ai" disabled={mode === "basic"} data-oid="dycwzc5">
                {t("transcription.settings.ai", "AI функции")}
              </TabsTrigger>
              <TabsTrigger value="advanced" data-oid="2_1ivdd">
                {t("transcription.settings.advanced", "Дополнительно")}
              </TabsTrigger>
            </TabsList>

            {/* Основные настройки */}
            <TabsContent value="main" className="space-y-4 mt-4" data-oid="6:kr_jp">
              <div className="grid grid-cols-2 gap-4" data-oid="jh5_8i9">
                <div className="space-y-2" data-oid="p0n5c_2">
                  <Label data-oid="qclfi7a">{t("transcription.language.label", "Язык")}</Label>
                  <LanguageSelector
                    value={mode === "basic" ? transcriptionOptions.language : enhancedOptions.language || "auto"}
                    onChange={(value) => {
                      if (mode === "basic") {
                        setTranscriptionOptions((prev: TranscriptionOptions) => ({
                          ...prev,
                          language: value,
                        }))
                      } else {
                        setEnhancedOptions((prev: EnhancedSubtitleOptions) => ({
                          ...prev,
                          language: value,
                        }))
                      }
                    }}
                    data-oid="8n7sa9s"
                  />
                </div>

                <div className="space-y-2" data-oid="otux-qr">
                  <Label data-oid="j:-mb8u">{t("transcription.task.label", "Задача")}</Label>
                  <Select
                    value={mode === "basic" ? transcriptionOptions.task : enhancedOptions.task}
                    onValueChange={(value: "transcribe" | "translate") => {
                      if (mode === "basic") {
                        setTranscriptionOptions((prev: TranscriptionOptions) => ({
                          ...prev,
                          task: value,
                        }))
                      } else {
                        setEnhancedOptions((prev: EnhancedSubtitleOptions) => ({
                          ...prev,
                          task: value,
                        }))
                      }
                    }}
                    data-oid="cmakahu"
                  >
                    <SelectTrigger data-oid="6hw0lhj">
                      <SelectValue data-oid="kxed.ho" />
                    </SelectTrigger>
                    <SelectContent data-oid="o06w6do">
                      <SelectItem value="transcribe" data-oid="x-tnldv">
                        {t("transcription.task.transcribe", "Транскрибировать")}
                      </SelectItem>
                      <SelectItem value="translate" data-oid="h3c5r2y">
                        {t("transcription.task.translate", "Переводить")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {mode === "basic" && (
                <>
                  <Separator data-oid="-2xelpy" />
                  <div className="space-y-2" data-oid="4qkxxrh">
                    <Label data-oid="3r0awfy">Размер модели</Label>
                    <ModelSizeSelector
                      value={transcriptionOptions.modelSize}
                      onChange={(value) =>
                        setTranscriptionOptions((prev: TranscriptionOptions) => ({
                          ...prev,
                          modelSize: value,
                        }))
                      }
                      data-oid="9nabdj."
                    />
                  </div>
                </>
              )}
            </TabsContent>

            {/* AI функции (только для enhanced режима) */}
            <TabsContent value="ai" className="space-y-4 mt-4" data-oid="ma2vkvj">
              <div className="grid grid-cols-2 gap-4" data-oid="x-k3xkp">
                <div className="space-y-4" data-oid="ws0_ua8">
                  <Label className="flex items-center space-x-2" data-oid="ow:scpd">
                    <Brain className="w-4 h-4" data-oid="v8cbr77" />
                    <span data-oid="eezt6nu">{t("transcription.ai.sources", "Источники данных")}</span>
                  </Label>

                  <div className="space-y-3" data-oid="ud1ky0c">
                    <div className="flex items-center justify-between" data-oid="3-0.wf0">
                      <div className="flex items-center space-x-2" data-oid="h2ifu.p">
                        <Mic className="w-4 h-4" data-oid="-a5xoul" />
                        <span className="text-sm" data-oid="sq6.9cg">
                          {t("transcription.ai.speech", "Распознавание речи")}
                        </span>
                      </div>
                      <Switch
                        checked={enhancedOptions.useSpeechRecognition}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            useSpeechRecognition: checked,
                          }))
                        }
                        data-oid="z7m8e5n"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-oid="nly7.lh">
                      <div className="flex items-center space-x-2" data-oid="6mo:01g">
                        <Eye className="w-4 h-4" data-oid="0lbnd.c" />
                        <span className="text-sm" data-oid="r8xtzlq">
                          {t("transcription.ai.ocr", "Текст на экране (OCR)")}
                        </span>
                      </div>
                      <Switch
                        checked={enhancedOptions.useOCR}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            useOCR: checked,
                          }))
                        }
                        data-oid="jp97_mp"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-oid="8ejztsx">
                      <div className="flex items-center space-x-2" data-oid="5uwfvf3">
                        <Sparkles className="w-4 h-4" data-oid="bhb:dei" />
                        <span className="text-sm" data-oid="u4pii4y">
                          {t("transcription.ai.scenes", "Анализ сцен")}
                        </span>
                      </div>
                      <Switch
                        checked={enhancedOptions.useSceneAnalysis}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            useSceneAnalysis: checked,
                          }))
                        }
                        data-oid="7hsr0f4"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-oid="dw:_ecr">
                      <div className="flex items-center space-x-2" data-oid="hbo7d3g">
                        <Users className="w-4 h-4" data-oid="h-ssu:v" />
                        <span className="text-sm" data-oid="h.dy3v_">
                          {t("transcription.ai.speakers", "Идентификация говорящих")}
                        </span>
                      </div>
                      <Switch
                        checked={enhancedOptions.usePersonIdentification}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            usePersonIdentification: checked,
                          }))
                        }
                        data-oid="kbhnzxm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4" data-oid="witg9ao">
                  <Label className="flex items-center space-x-2" data-oid="jvjeb-n">
                    <Wand2 className="w-4 h-4" data-oid="39mnkzw" />
                    <span data-oid="8.0m0ry">{t("transcription.ai.processing", "Обработка текста")}</span>
                  </Label>

                  <div className="space-y-3" data-oid="ef6_1gz">
                    <div className="flex items-center justify-between" data-oid="-jcom_x">
                      <span className="text-sm" data-oid="xq:36p_">
                        {t("transcription.ai.grammar", "Исправление грамматики")}
                      </span>
                      <Switch
                        checked={enhancedOptions.autoCorrectGrammar}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            autoCorrectGrammar: checked,
                          }))
                        }
                        data-oid="0275pxf"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-oid="_uhai1.">
                      <span className="text-sm" data-oid="l4uj9ug">
                        {t("transcription.ai.capitalization", "Заглавные буквы")}
                      </span>
                      <Switch
                        checked={enhancedOptions.autoCapitalization}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            autoCapitalization: checked,
                          }))
                        }
                        data-oid="i.ke4un"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-oid=":p85o.9">
                      <span className="text-sm" data-oid="zi0p5l1">
                        {t("transcription.ai.filler", "Убрать слова-паразиты")}
                      </span>
                      <Switch
                        checked={enhancedOptions.removeFiller}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            removeFiller: checked,
                          }))
                        }
                        data-oid="a8ug-wk"
                      />
                    </div>

                    <div className="flex items-center justify-between" data-oid="xv.:vzl">
                      <span className="text-sm" data-oid="sq1_4ro">
                        {t("transcription.ai.optimize", "Оптимизация для чтения")}
                      </span>
                      <Switch
                        checked={enhancedOptions.optimizeReading}
                        onCheckedChange={(checked) =>
                          setEnhancedOptions((prev) => ({
                            ...prev,
                            optimizeReading: checked,
                          }))
                        }
                        data-oid="9snj1c-"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Дополнительные настройки */}
            <TabsContent value="advanced" className="space-y-4 mt-4" data-oid="0go424x">
              {mode === "enhanced" && (
                <div className="grid grid-cols-2 gap-4" data-oid="brogojd">
                  <div className="space-y-2" data-oid="kd4u:p3">
                    <Label data-oid="er9a_if">{t("transcription.ai.style", "Стиль субтитров")}</Label>
                    <Select
                      value={enhancedOptions.styleTemplate}
                      onValueChange={(value: any) =>
                        setEnhancedOptions((prev) => ({
                          ...prev,
                          styleTemplate: value,
                        }))
                      }
                      data-oid="62gp_0m"
                    >
                      <SelectTrigger data-oid="mpp.7_e">
                        <SelectValue data-oid="db.hqca" />
                      </SelectTrigger>
                      <SelectContent data-oid="yco87:o">
                        <SelectItem value="standard" data-oid="v1jvavv">
                          {t("transcription.style.standard", "Стандартный")}
                        </SelectItem>
                        <SelectItem value="broadcast" data-oid="130a-_5">
                          {t("transcription.style.broadcast", "Телевизионный")}
                        </SelectItem>
                        <SelectItem value="social" data-oid="23e-.iu">
                          {t("transcription.style.social", "Соцсети")}
                        </SelectItem>
                        <SelectItem value="accessibility" data-oid="6mk9l2i">
                          {t("transcription.style.accessibility", "Доступность")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2" data-oid="gxh6cmg">
                    <Label data-oid="f0_djfe">{t("transcription.ai.provider", "AI провайдер")}</Label>
                    <Select
                      value={enhancedOptions.aiProvider}
                      onValueChange={(value: any) =>
                        setEnhancedOptions((prev) => ({
                          ...prev,
                          aiProvider: value,
                        }))
                      }
                      data-oid="_5i7p:q"
                    >
                      <SelectTrigger data-oid=":iz3yy4">
                        <SelectValue data-oid="h36p.4s" />
                      </SelectTrigger>
                      <SelectContent data-oid="a17i.fp">
                        <SelectItem value="unified" data-oid="lw7kq9i">
                          {t("transcription.provider.unified", "Unified AI")}
                        </SelectItem>
                        <SelectItem value="whisper" data-oid="38lkdfu">
                          {t("transcription.provider.whisper", "Whisper")}
                        </SelectItem>
                        <SelectItem value="azure" data-oid="_m8-1w.">
                          {t("transcription.provider.azure", "Azure")}
                        </SelectItem>
                        <SelectItem value="google" data-oid="1o_8423">
                          {t("transcription.provider.google", "Google")}
                        </SelectItem>
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
      <Card data-oid="pi5cgua">
        <CardContent className="pt-6" data-oid="6y:-a2x">
          <div className="flex items-center justify-between" data-oid="04196d8">
            <div className="flex items-center space-x-2" data-oid="c9lltra">
              {mode === "enhanced" ? (
                <>
                  <Button
                    onClick={handleEnhancedGeneration}
                    disabled={!selectedFile || isActive}
                    className="flex items-center space-x-2"
                    data-oid="3_54_dv"
                  >
                    <Brain className="w-4 h-4" data-oid="qgh6z2b" />
                    <span data-oid="egk.cq3">{t("transcription.enhanced.generate", "AI Генерация")}</span>
                  </Button>

                  <Button
                    onClick={handleQuickGeneration}
                    disabled={!selectedFile || isActive}
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-oid="mkvy6hw"
                  >
                    <Sparkles className="w-4 h-4" data-oid="q54io0d" />
                    <span data-oid="zbephno">{t("transcription.enhanced.quick", "Быстрая")}</span>
                  </Button>

                  <Button
                    onClick={handleOCRExtraction}
                    disabled={!selectedFile || isActive}
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-oid="dz0_vlh"
                  >
                    <Eye className="w-4 h-4" data-oid="8nf4rc_" />
                    <span data-oid="9yxj-gc">{t("transcription.enhanced.ocr", "OCR")}</span>
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleBasicTranscription}
                  disabled={!selectedFile || isActive}
                  className="flex items-center space-x-2"
                  data-oid="phn:km6"
                >
                  <Play className="w-4 h-4" data-oid="kvctxov" />
                  <span data-oid="c5hfr69">{t("transcription.basic.start", "Транскрибировать")}</span>
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2" data-oid="gi.5jh3">
              {isActive && (
                <Button onClick={handleCancel} variant="outline" size="sm" data-oid="i.glxp9">
                  <X className="w-4 h-4 mr-2" data-oid="zazz0sq" />
                  {t("transcription.cancel", "Отменить")}
                </Button>
              )}

              <Button onClick={handleReset} variant="outline" size="sm" data-oid="ysvu58l">
                <RefreshCw className="w-4 h-4 mr-2" data-oid="c9:r3pi" />
                {t("transcription.reset", "Сбросить")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Прогресс */}
      {isActive && (
        <Card data-oid="-5nuv9v">
          <CardContent className="pt-6" data-oid="00_8:7h">
            <div className="space-y-3" data-oid="ugm518d">
              <div className="flex items-center justify-between" data-oid="b9-y2.j">
                <span className="text-sm font-medium" data-oid="rrq64s1">
                  {mode === "enhanced"
                    ? t(`transcription.enhanced.stage.${enhancedProgress.stage}`, enhancedProgress.stage)
                    : t(`transcription.basic.stage.${transcriptionProgress.status}`, transcriptionProgress.status)}
                </span>
                <span className="text-sm text-muted-foreground" data-oid="of-s:n9">
                  {Math.round(currentProgress.progress)}%
                </span>
              </div>
              <Progress value={currentProgress.progress} className="w-full" data-oid="2g4e:uk" />
              {currentProgress.message && (
                <p className="text-xs text-muted-foreground" data-oid="wd_ywwr">
                  {currentProgress.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ошибки */}
      {currentError && (
        <Alert variant="destructive" data-oid="9:h6zgl">
          <AlertCircle className="h-4 w-4" data-oid="iyz6iub" />
          <AlertDescription data-oid="s3qhn0e">{currentError}</AlertDescription>
        </Alert>
      )}

      {/* Результаты */}
      {currentResult && (
        <Card data-oid="jt50im_">
          <CardHeader data-oid="llpuwpo">
            <CardTitle className="flex items-center justify-between" data-oid="uy1_2b_">
              <div className="flex items-center space-x-2" data-oid="99nxees">
                <CheckCircle className="w-5 h-5 text-green-500" data-oid="yl2-p9l" />
                <span data-oid="ct1k7_g">{t("transcription.results.title", "Результаты")}</span>
              </div>
              <div className="flex items-center space-x-2" data-oid="eajv72c">
                {mode === "enhanced" && enhancedResult && (
                  <Badge variant="outline" className="text-xs" data-oid="cfb2-wm">
                    {t("transcription.enhanced.confidence", "Уверенность")}:{" "}
                    {Math.round(enhancedResult.quality.overallConfidence * 100)}%
                  </Badge>
                )}
                <Button onClick={() => handleSaveSubtitles("srt")} size="sm" variant="outline" data-oid="wnpyidn">
                  <Download className="w-4 h-4 mr-2" data-oid="7-d99t3" />
                  {t("transcription.save.srt", "SRT")}
                </Button>
                {onAddToTimeline && (
                  <Button onClick={() => onAddToTimeline(currentResult.segments)} size="sm" data-oid="oqd4u2s">
                    {t("transcription.addToTimeline", "Добавить в таймлайн")}
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent data-oid="w9gudnq">
            <ScrollArea className="h-[300px] w-full" data-oid="w8j_9k.">
              <TranscriptionEditor result={currentResult} onAddToTimeline={onAddToTimeline} data-oid="g7gww:1" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
