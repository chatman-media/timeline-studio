import { Badge } from "@timeline-studio/ui/components/badge"
import { Button } from "@timeline-studio/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@timeline-studio/ui/components/card"
import { Label } from "@timeline-studio/ui/components/label"
import { Progress } from "@timeline-studio/ui/components/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@timeline-studio/ui/components/tabs"
import { AlertCircle, CheckCircle, Cpu, Download, FileAudio, Loader2, Mic, Upload, Zap } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
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
        return <FileAudio className="h-5 w-5 text-muted-foreground" data-oid="8e51355" />
      case "initializing":
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin" data-oid="vs.zxb7" />
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" data-oid="48o6qip" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" data-oid="2odv1-o" />
    }
  }

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "cuda":
      case "mps":
        return <Zap className="h-4 w-4" data-oid="izdwg3n" />
      default:
        return <Cpu className="h-4 w-4" data-oid=":uplzov" />
    }
  }

  return (
    <Card className="h-full flex flex-col" data-oid="kev1eg5">
      <CardHeader data-oid="6p_pp3e">
        <CardTitle className="flex items-center gap-2" data-oid="3y1m048">
          <Mic className="h-5 w-5" data-oid="a4acaml" />
          {t("transcription.title", "Транскрипция")}
        </CardTitle>
        <CardDescription data-oid="a0w3q7i">
          {t("transcription.description", "Автоматическое создание субтитров с помощью AI")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4" data-oid="hwuwsk6">
        {/* Выбор файла */}
        <div className="space-y-2" data-oid="k-_d0de">
          <Label data-oid="2_g:qyq">{t("transcription.selectFile", "Выберите медиафайл")}</Label>
          <div className="flex gap-2" data-oid="g6.-m16">
            <Button variant="outline" className="flex-1" onClick={handleFileSelect} data-oid="r9o43hx">
              <Upload className="mr-2 h-4 w-4" data-oid="202xmtb" />
              {selectedFile ? selectedFile.split("/").pop() : t("transcription.chooseFile", "Выбрать файл")}
            </Button>
          </div>
        </div>

        {/* Настройки */}
        <Tabs defaultValue="basic" className="flex-1" data-oid="to_2_w3">
          <TabsList className="grid w-full grid-cols-3" data-oid="t-udmm0">
            <TabsTrigger value="basic" data-oid="o5kd.h7">
              {t("transcription.basicSettings", "Основные")}
            </TabsTrigger>
            <TabsTrigger value="advanced" data-oid="a7sbm-h">
              {t("transcription.advancedSettings", "Расширенные")}
            </TabsTrigger>
            <TabsTrigger value="models" data-oid="0qzxcml">
              {t("transcription.models", "Модели")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4" data-oid="qg7i3m:">
            {/* Модель */}
            <div className="space-y-2" data-oid="3i:xv63">
              <Label data-oid="-u368vs">{t("transcription.model", "Модель")}</Label>
              <Select
                value={options.modelSize}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    modelSize: value as TranscriptionOptions["modelSize"],
                  }))
                }
                data-oid="busie_m"
              >
                <SelectTrigger data-oid="s.nk.60">
                  <SelectValue data-oid="7vrigoa" />
                </SelectTrigger>
                <SelectContent data-oid="qz0czbp">
                  <SelectItem value="tiny" data-oid="veo57h0">
                    Tiny (39M) - Быстрая
                  </SelectItem>
                  <SelectItem value="base" data-oid="ybmp29-">
                    Base (74M) - Баланс
                  </SelectItem>
                  <SelectItem value="small" data-oid="0qhn_.z">
                    Small (244M) - Качественная
                  </SelectItem>
                  <SelectItem value="medium" data-oid="lomtv6z">
                    Medium (769M) - Точная
                  </SelectItem>
                  <SelectItem value="large-v3" data-oid="r-crcgc">
                    Large v3 (1.5G) - Максимальная
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Язык */}
            <LanguageSelector
              value={options.language}
              onChange={(language) =>
                setOptions((prev: TranscriptionOptions) => ({
                  ...prev,
                  language,
                }))
              }
              data-oid="8s8ghmd"
            />

            {/* Задача */}
            <div className="space-y-2" data-oid="9ca:sj4">
              <Label data-oid="gevbu3b">{t("transcription.task.label")}</Label>
              <Select
                value={options.task}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    task: value as TranscriptionOptions["task"],
                  }))
                }
                data-oid="9nxvwq6"
              >
                <SelectTrigger data-oid="c_.4tn1">
                  <SelectValue data-oid="7urf8ie" />
                </SelectTrigger>
                <SelectContent data-oid="txx91mr">
                  <SelectItem value="transcribe" data-oid="n0lh4zx">
                    {t("transcription.transcribe", "Транскрипция")}
                  </SelectItem>
                  <SelectItem value="translate" data-oid="56uhk-m">
                    {t("transcription.translate", "Перевод на английский")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4" data-oid="bz9g52y">
            {/* Провайдер */}
            <div className="space-y-2" data-oid="9fri5.9">
              <Label data-oid="8t6kce-">{t("transcription.provider.label", "Провайдер")}</Label>
              <Select
                value={options.provider}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    provider: value as TranscriptionOptions["provider"],
                  }))
                }
                data-oid="jwjxxxx"
              >
                <SelectTrigger data-oid="k2jg:71">
                  <SelectValue data-oid="lk_rf6h" />
                </SelectTrigger>
                <SelectContent data-oid="bwvdwfw">
                  <SelectItem value="faster-whisper" data-oid="k:c:hda">
                    Faster Whisper (Рекомендуется)
                  </SelectItem>
                  <SelectItem value="openai" data-oid="-49:f90">
                    OpenAI Whisper API
                  </SelectItem>
                  <SelectItem value="local" data-oid="t2q3.iq">
                    Локальный Whisper
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Устройство */}
            <div className="space-y-2" data-oid="8ha_2-a">
              <Label data-oid="pp4s4zc">{t("transcription.device", "Устройство")}</Label>
              <Select
                value={options.device}
                onValueChange={(value) =>
                  setOptions((prev: TranscriptionOptions) => ({
                    ...prev,
                    device: value as TranscriptionOptions["device"],
                  }))
                }
                data-oid="0mcql24"
              >
                <SelectTrigger data-oid="6:hyzgv">
                  <SelectValue data-oid="hhc0-.t" />
                </SelectTrigger>
                <SelectContent data-oid="v294o8_">
                  <SelectItem value="auto" data-oid="-d6qz.s">
                    <div className="flex items-center gap-2" data-oid="cppdch8">
                      Авто
                    </div>
                  </SelectItem>
                  <SelectItem value="cpu" data-oid="6k.2m6i">
                    <div className="flex items-center gap-2" data-oid="uz3-5am">
                      <Cpu className="h-4 w-4" data-oid="t74s3rn" />
                      CPU
                    </div>
                  </SelectItem>
                  <SelectItem value="cuda" data-oid="-s9tl1_">
                    <div className="flex items-center gap-2" data-oid="_25:m_d">
                      <Zap className="h-4 w-4" data-oid="xczqhg:" />
                      NVIDIA GPU (CUDA)
                    </div>
                  </SelectItem>
                  <SelectItem value="mps" data-oid="g8mzy-a">
                    <div className="flex items-center gap-2" data-oid="yt-ydy3">
                      <Zap className="h-4 w-4" data-oid="7i8q671" />
                      Apple Silicon (Metal)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Дополнительные опции */}
            <div className="space-y-3" data-oid="p1ozxr:">
              <div className="flex items-center justify-between" data-oid="225v8g2">
                <Label htmlFor="word-timestamps" data-oid="mvdqfzf">
                  {t("transcription.wordTimestamps", "Временные метки слов")}
                </Label>
                <Switch
                  id="word-timestamps"
                  checked={options.wordTimestamps}
                  onCheckedChange={(checked) =>
                    setOptions((prev: TranscriptionOptions) => ({
                      ...prev,
                      wordTimestamps: checked,
                    }))
                  }
                  data-oid="qcsr9_o"
                />
              </div>

              <div className="flex items-center justify-between" data-oid="wu.6.6z">
                <Label htmlFor="vad-filter" data-oid="6yf99u.">
                  {t("transcription.vadFilter", "Фильтр активности голоса")}
                </Label>
                <Switch
                  id="vad-filter"
                  checked={options.vadFilter}
                  onCheckedChange={(checked) =>
                    setOptions((prev: TranscriptionOptions) => ({
                      ...prev,
                      vadFilter: checked,
                    }))
                  }
                  data-oid="ru_1vnd"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="models" data-oid=".6qm34c">
            <ModelSelector data-oid="eqwl4ud" />
          </TabsContent>
        </Tabs>

        {/* Прогресс */}
        {progress.status !== "idle" && (
          <div className="space-y-2" data-oid="kswja30">
            <div className="flex items-center justify-between text-sm" data-oid="0dheejc">
              <div className="flex items-center gap-2" data-oid="7ikp9zm">
                {getStatusIcon()}
                <span data-oid="m370d7l">{progress.message || t("transcription.processing", "Обработка...")}</span>
              </div>
              <span data-oid="ls:am3q">{Math.round(progress.progress)}%</span>
            </div>
            <Progress value={progress.progress} data-oid="bgbp1gh" />
          </div>
        )}

        {/* Кнопка транскрипции */}
        <Button
          onClick={handleTranscribe}
          disabled={!selectedFile || isTranscribing}
          className="w-full"
          data-oid="6u9dik."
        >
          {isTranscribing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid=".fy01t2" />
              {t("transcription.processing", "Обработка...")}
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" data-oid="oerpann" />
              {t("transcription.start", "Начать транскрипцию")}
            </>
          )}
        </Button>

        {/* Результаты */}
        {result && (
          <div className="space-y-4" data-oid="8u:325_">
            <div className="flex items-center justify-between" data-oid="kqlpsna">
              <div className="flex items-center gap-2" data-oid="-c-1e:w">
                <Badge variant="secondary" data-oid="cm3:4hf">
                  {result.language.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground" data-oid="ny.1-q-">
                  {result.segments.length} сегментов • {Math.round(result.duration)}с
                </span>
              </div>

              <div className="flex gap-2" data-oid="ckaw4l4">
                <Button size="sm" variant="outline" onClick={() => handleExportSubtitles("srt")} data-oid="m5z.p2c">
                  <Download className="mr-2 h-4 w-4" data-oid="-d82bs1" />
                  SRT
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportSubtitles("vtt")} data-oid="rat48.z">
                  <Download className="mr-2 h-4 w-4" data-oid="h:-ybqr" />
                  VTT
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExportSubtitles("ass")} data-oid="yrwvv53">
                  <Download className="mr-2 h-4 w-4" data-oid="clvseju" />
                  ASS
                </Button>
              </div>
            </div>

            <TranscriptionEditor result={result} onAddToTimeline={onAddToTimeline} data-oid="c7t10q7" />
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4" data-oid="0ie5fmv">
            <div className="flex items-center gap-2 text-red-800" data-oid="n7xw6cy">
              <AlertCircle className="h-5 w-5" data-oid="qsu:4ar" />
              <p className="text-sm font-medium" data-oid="syik.r3">
                {error}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
