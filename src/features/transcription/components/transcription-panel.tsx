import { AlertCircle, CheckCircle, Cpu, Download, FileAudio, Loader2, Mic, Upload, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranscription } from "../hooks/use-transcription"
import type { TranscriptionOptions } from "../types"
import { LanguageSelector } from "./language-selector"
import { ModelSelector } from "./model-selector"
import { TranscriptionEditor } from "./transcription-editor"

interface TranscriptionPanelProps {
  onAddToTimeline?: (segments: any[]) => void
}

export function TranscriptionPanel({ onAddToTimeline }: TranscriptionPanelProps = {}) {
  const { t } = useTranslation()
  const { isTranscribing, progress, result, error, transcribe, generateSubtitles, reset, service } = useTranscription()

  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [options, setOptions] = useState<TranscriptionOptions>({
    task: "transcribe",
    modelSize: "base",
    wordTimestamps: true,
    vadFilter: true,
    provider: "faster-whisper",
    device: "auto",
    computeType: "auto",
  })

  const handleFileSelect = async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    const file = await open({
      multiple: false,
      filters: [
        {
          name: "Media Files",
          extensions: ["mp4", "avi", "mov", "mkv", "mp3", "wav", "m4a", "flac", "webm"],
        },
      ],
    })

    if (file) {
      setSelectedFile(file as string)
      reset()
    }
  }

  const handleTranscribe = async () => {
    if (!selectedFile) return
    await transcribe(selectedFile, options)
  }

  const handleExportSubtitles = async (format: "srt" | "vtt" | "ass") => {
    const subtitles = await generateSubtitles(format)
    if (!subtitles) return

    const { save } = await import("@tauri-apps/plugin-dialog")
    const { writeTextFile } = await import("@tauri-apps/plugin-fs")

    const filePath = await save({
      filters: [
        {
          name: format.toUpperCase(),
          extensions: [format],
        },
      ],
    })

    if (filePath) {
      await writeTextFile(filePath, subtitles)
    }
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case "idle":
        return <FileAudio className="h-5 w-5 text-muted-foreground" />
      case "initializing":
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "cuda":
      case "mps":
        return <Zap className="h-4 w-4" />
      default:
        return <Cpu className="h-4 w-4" />
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          {t("transcription.title", "Транскрипция")}
        </CardTitle>
        <CardDescription>
          {t("transcription.description", "Автоматическое создание субтитров с помощью AI")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Выбор файла */}
        <div className="space-y-2">
          <Label>{t("transcription.selectFile", "Выберите медиафайл")}</Label>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleFileSelect}>
              <Upload className="mr-2 h-4 w-4" />
              {selectedFile ? selectedFile.split("/").pop() : t("transcription.chooseFile", "Выбрать файл")}
            </Button>
          </div>
        </div>

        {/* Настройки */}
        <Tabs defaultValue="basic" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">{t("transcription.basicSettings", "Основные")}</TabsTrigger>
            <TabsTrigger value="advanced">{t("transcription.advancedSettings", "Расширенные")}</TabsTrigger>
            <TabsTrigger value="models">{t("transcription.models", "Модели")}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            {/* Модель */}
            <div className="space-y-2">
              <Label>{t("transcription.model", "Модель")}</Label>
              <Select
                value={options.modelSize}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    modelSize: value as TranscriptionOptions["modelSize"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiny">Tiny (39M) - Быстрая</SelectItem>
                  <SelectItem value="base">Base (74M) - Баланс</SelectItem>
                  <SelectItem value="small">Small (244M) - Качественная</SelectItem>
                  <SelectItem value="medium">Medium (769M) - Точная</SelectItem>
                  <SelectItem value="large-v3">Large v3 (1.5G) - Максимальная</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Язык */}
            <LanguageSelector
              value={options.language}
              onChange={(language) => setOptions((prev: TranscriptionOptions) => ({ ...prev, language }))}
            />

            {/* Задача */}
            <div className="space-y-2">
              <Label>{t("transcription.task", "Задача")}</Label>
              <Select
                value={options.task}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    task: value as TranscriptionOptions["task"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transcribe">{t("transcription.transcribe", "Транскрипция")}</SelectItem>
                  <SelectItem value="translate">{t("transcription.translate", "Перевод на английский")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* Провайдер */}
            <div className="space-y-2">
              <Label>{t("transcription.provider", "Провайдер")}</Label>
              <Select
                value={options.provider}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    provider: value as TranscriptionOptions["provider"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="faster-whisper">Faster Whisper (Рекомендуется)</SelectItem>
                  <SelectItem value="openai">OpenAI Whisper API</SelectItem>
                  <SelectItem value="local">Локальный Whisper</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Устройство */}
            <div className="space-y-2">
              <Label>{t("transcription.device", "Устройство")}</Label>
              <Select
                value={options.device}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    device: value as TranscriptionOptions["device"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <div className="flex items-center gap-2">Авто</div>
                  </SelectItem>
                  <SelectItem value="cpu">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      CPU
                    </div>
                  </SelectItem>
                  <SelectItem value="cuda">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      NVIDIA GPU (CUDA)
                    </div>
                  </SelectItem>
                  <SelectItem value="mps">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Apple Silicon (Metal)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Дополнительные опции */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="word-timestamps">{t("transcription.wordTimestamps", "Временные метки слов")}</Label>
                <Switch
                  id="word-timestamps"
                  checked={options.wordTimestamps}
                  onCheckedChange={(checked) =>
                    setOptions((prev: TranscriptionOptions) => ({ ...prev, wordTimestamps: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="vad-filter">{t("transcription.vadFilter", "Фильтр активности голоса")}</Label>
                <Switch
                  id="vad-filter"
                  checked={options.vadFilter}
                  onCheckedChange={(checked) =>
                    setOptions((prev: TranscriptionOptions) => ({ ...prev, vadFilter: checked }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models">
            <ModelSelector />
          </TabsContent>
        </Tabs>

        {/* Прогресс */}
        {progress.status !== "idle" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span>{progress.message || t("transcription.processing", "Обработка...")}</span>
              </div>
              <span>{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} />
          </div>
        )}

        {/* Кнопка транскрипции */}
        <Button onClick={handleTranscribe} disabled={!selectedFile || isTranscribing} className="w-full">
          {isTranscribing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("transcription.processing", "Обработка...")}
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              {t("transcription.start", "Начать транскрипцию")}
            </>
          )}
        </Button>

        {/* Результаты */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{result.language.toUpperCase()}</Badge>
                <span className="text-sm text-muted-foreground">
                  {result.segments.length} сегментов • {Math.round(result.duration)}с
                </span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExportSubtitles("srt")}>
                  <Download className="mr-2 h-4 w-4" />
                  SRT
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportSubtitles("vtt")}>
                  <Download className="mr-2 h-4 w-4" />
                  VTT
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportSubtitles("ass")}>
                  <Download className="mr-2 h-4 w-4" />
                  ASS
                </Button>
              </div>
            </div>

            <TranscriptionEditor result={result} onAddToTimeline={onAddToTimeline} />
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
