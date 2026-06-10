import { Activity, AudioWaveform, Loader2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useMediaFiles, useNotifications } from "@/core/hooks"
import { analyzeAudioPeaks } from "@/core/services/subtitles"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { useTracks } from "@/features/timeline/hooks/state/use-tracks"
import type { TrackType } from "@/features/timeline/types"
import { createLogger } from "@/lib/tauri-logger"
import type { SubtitleClip } from "../types/subtitles"

const logger = createLogger("SubtitleAutoSync")

interface AudioPeak {
  time: number
  amplitude: number
}

interface SyncResult {
  originalTime: number
  newTime: number
  confidence: number
}

/**
 * Компонент для автоматической синхронизации субтитров с аудио
 * Использует анализ аудио волны для определения пауз и речи
 */
export function SubtitleAutoSync() {
  const { t } = useTranslation()
  const { tracks } = useTracks()
  const { updateClip } = useTimeline()
  const { mediaFiles } = useMediaFiles()
  const { showSuccess, showError, showInfo } = useNotifications()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<string>("")
  const [syncMode, setSyncMode] = useState<"voice-detection" | "silence-detection" | "beat-detection">(
    "voice-detection",
  )
  const [sensitivity, setSensitivity] = useState([0.5])

  /**
   * Проверяет, является ли клип субтитром
   */
  const isSubtitleClip = (clip: any): clip is SubtitleClip => {
    return (
      clip.type === "subtitle" &&
      typeof clip.text === "string" &&
      typeof clip.startTime === "number" &&
      typeof clip.duration === "number"
    )
  }

  /**
   * Получает все субтитры из таймлайна
   */
  const getSubtitlesFromTimeline = (): SubtitleClip[] => {
    const subtitles: SubtitleClip[] = []
    const subtitleType: TrackType = "subtitle"

    for (const track of tracks) {
      if (track.type === subtitleType) {
        for (const clip of track.clips) {
          if (isSubtitleClip(clip)) {
            subtitles.push(clip)
          }
        }
      }
    }

    return subtitles.sort((a, b) => a.startTime - b.startTime)
  }

  /**
   * Получает аудио треки из таймлайна
   */
  const getAudioTracks = () => {
    return tracks.filter((track) => track.type === "audio" || track.type === "voiceover" || track.type === "music")
  }

  /**
   * Анализирует аудио и находит моменты речи/тишины
   */
  const analyzeAudio = async (audioPath: string): Promise<AudioPeak[]> => {
    try {
      // Вызываем domain service для анализа аудио
      const result = await analyzeAudioPeaks(audioPath, {
        windowSize: 1024,
        hopSize: 512,
        threshold: sensitivity[0],
      })

      return result.peaks
    } catch (error) {
      logger.error("Ошибка анализа аудио:", { error })
      throw error
    }
  }

  /**
   * Определяет моменты начала речи на основе аудио пиков
   */
  const detectSpeechOnsets = (peaks: AudioPeak[]): number[] => {
    const speechOnsets: number[] = []
    const threshold = sensitivity[0]
    const minSilenceDuration = 0.3 // минимальная длительность тишины в секундах

    let inSpeech = false
    let lastSpeechTime = 0

    for (let i = 0; i < peaks.length; i++) {
      const peak = peaks[i]

      if (!inSpeech && peak.amplitude > threshold) {
        // Начало речи
        if (peak.time - lastSpeechTime > minSilenceDuration) {
          speechOnsets.push(peak.time)
        }
        inSpeech = true
      } else if (inSpeech && peak.amplitude < threshold * 0.7) {
        // Конец речи
        inSpeech = false
        lastSpeechTime = peak.time
      }
    }

    return speechOnsets
  }

  /**
   * Сопоставляет субтитры с моментами речи
   */
  const matchSubtitlesToSpeech = (subtitles: SubtitleClip[], speechOnsets: number[]): SyncResult[] => {
    const results: SyncResult[] = []

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]

      // Находим ближайший момент начала речи
      let closestOnset = speechOnsets[0]
      let minDistance = Math.abs(subtitle.startTime - speechOnsets[0])

      for (const onset of speechOnsets) {
        const distance = Math.abs(subtitle.startTime - onset)
        if (distance < minDistance) {
          minDistance = distance
          closestOnset = onset
        }
      }

      // Вычисляем уверенность на основе расстояния
      const maxAcceptableDistance = 2.0 // секунды
      const confidence = Math.max(0, 1 - minDistance / maxAcceptableDistance)

      results.push({
        originalTime: subtitle.startTime,
        newTime: closestOnset,
        confidence,
      })

      // Удаляем использованный onset из списка
      const usedIndex = speechOnsets.indexOf(closestOnset)
      if (usedIndex > -1) {
        speechOnsets.splice(usedIndex, 1)
      }
    }

    return results
  }

  /**
   * Выполняет автоматическую синхронизацию
   */
  const performAutoSync = async () => {
    if (!selectedAudioTrack) {
      showError(t("subtitles.autoSync.selectAudio", "Выберите аудио трек"), "")
      return
    }

    const subtitles = getSubtitlesFromTimeline()
    if (subtitles.length === 0) {
      showError(t("subtitles.autoSync.noSubtitles", "Нет субтитров для синхронизации"), "")
      return
    }

    setIsAnalyzing(true)
    setProgress(0)

    try {
      // Этап 1: Анализ аудио
      showInfo(t("subtitles.autoSync.analyzing", "Анализ аудио..."), "")
      setProgress(20)

      const audioPeaks = await analyzeAudio(selectedAudioTrack)
      setProgress(40)

      // Этап 2: Определение моментов речи
      showInfo(t("subtitles.autoSync.detectingSpeech", "Определение моментов речи..."), "")
      const speechOnsets = detectSpeechOnsets(audioPeaks)
      setProgress(60)

      if (speechOnsets.length === 0) {
        throw new Error(t("subtitles.autoSync.noSpeechDetected", "Речь не обнаружена"))
      }

      // Этап 3: Сопоставление субтитров
      showInfo(t("subtitles.autoSync.matching", "Сопоставление субтитров..."), "")
      const syncResults = matchSubtitlesToSpeech([...subtitles], [...speechOnsets])
      setProgress(80)

      // Этап 4: Применение изменений
      setIsSyncing(true)
      let syncedCount = 0
      let highConfidenceCount = 0

      for (let i = 0; i < syncResults.length; i++) {
        const result = syncResults[i]
        const subtitle = subtitles[i]

        // Применяем только изменения с достаточной уверенностью
        if (result.confidence > 0.3) {
          await updateClip(subtitle.id, {
            startTime: result.newTime,
          })
          syncedCount++

          if (result.confidence > 0.7) {
            highConfidenceCount++
          }
        }

        setProgress(80 + (20 * (i + 1)) / syncResults.length)
      }

      showSuccess(
        t("subtitles.autoSync.success", "Синхронизация завершена"),
        t(
          "subtitles.autoSync.successDesc",
          "Синхронизировано {{synced}} из {{total}} субтитров ({{confident}} с высокой точностью)",
          {
            synced: syncedCount,
            total: subtitles.length,
            confident: highConfidenceCount,
          },
        ),
      )
    } catch (error) {
      logger.error("Ошибка автосинхронизации:", { error })
      showError(
        t("subtitles.autoSync.error", "Ошибка синхронизации"),
        error instanceof Error
          ? error.message
          : t("subtitles.autoSync.errorDesc", "Не удалось выполнить автоматическую синхронизацию"),
      )
    } finally {
      setIsAnalyzing(false)
      setIsSyncing(false)
      setProgress(0)
    }
  }

  const audioTracks = getAudioTracks()
  const audioFiles = mediaFiles.filter((file) => {
    const mediaTypeStr = (file.media_type as any as string).toLowerCase()
    return mediaTypeStr === "audio" || mediaTypeStr.includes("video")
  })

  return (
    <Card data-oid="148r0sp">
      <CardHeader data-oid=".9xg3hb">
        <CardTitle className="flex items-center gap-2" data-oid="94e1m4k">
          <AudioWaveform className="h-5 w-5" data-oid="80_r6w8" />
          {t("subtitles.autoSync.title", "Автоматическая синхронизация")}
        </CardTitle>
        <CardDescription data-oid="aaj:w9u">
          {t("subtitles.autoSync.description", "Синхронизация субтитров с аудио на основе анализа речи")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" data-oid="28-rsul">
        {/* Выбор аудио источника */}
        <div className="space-y-2" data-oid="5xmz61.">
          <Label data-oid="nh7t8hu">{t("subtitles.autoSync.audioSource", "Источник аудио")}</Label>
          <Select value={selectedAudioTrack} onValueChange={setSelectedAudioTrack} data-oid="llf0r81">
            <SelectTrigger data-oid="k1mi_3u">
              <SelectValue
                placeholder={t("subtitles.autoSync.selectAudioPlaceholder", "Выберите аудио трек или файл")}
                data-oid="gip8ccp"
              />
            </SelectTrigger>
            <SelectContent data-oid="60e8u5y">
              {audioTracks.length > 0 && (
                <>
                  <SelectItem value="__separator__" disabled data-oid="oq2fhc2">
                    {t("subtitles.autoSync.tracksSection", "Треки на таймлайне")}
                  </SelectItem>
                  {audioTracks.map((track) => (
                    <SelectItem key={track.id} value={track.id} data-oid="gqrioah">
                      {track.name}
                    </SelectItem>
                  ))}
                </>
              )}
              {audioFiles.length > 0 && (
                <>
                  <SelectItem value="__separator2__" disabled data-oid="fc:r6m6">
                    {t("subtitles.autoSync.filesSection", "Медиафайлы")}
                  </SelectItem>
                  {audioFiles.map((file) => (
                    <SelectItem key={file.id} value={file.path} data-oid="oxof1-v">
                      {file.name}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Режим синхронизации */}
        <div className="space-y-2" data-oid="15_nvya">
          <Label data-oid="gj98vmg">{t("subtitles.autoSync.mode", "Режим синхронизации")}</Label>
          <RadioGroup value={syncMode} onValueChange={(value: any) => setSyncMode(value)} data-oid="4xpgt8j">
            <div className="flex items-center space-x-2" data-oid="0jxdy-d">
              <RadioGroupItem value="voice-detection" id="voice" data-oid="8wtx_hg" />
              <Label htmlFor="voice" className="font-normal" data-oid="f.w5ian">
                {t("subtitles.autoSync.voiceDetection", "Определение голоса")}
              </Label>
            </div>
            <div className="flex items-center space-x-2" data-oid="zhaowtb">
              <RadioGroupItem value="silence-detection" id="silence" data-oid="a3ite7d" />
              <Label htmlFor="silence" className="font-normal" data-oid="ejn8f8w">
                {t("subtitles.autoSync.silenceDetection", "Определение пауз")}
              </Label>
            </div>
            <div className="flex items-center space-x-2" data-oid="f_tc4:y">
              <RadioGroupItem value="beat-detection" id="beat" data-oid="ok5h4:a" />
              <Label htmlFor="beat" className="font-normal" data-oid="5efc:m_">
                {t("subtitles.autoSync.beatDetection", "Синхронизация с ритмом")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Чувствительность */}
        <div className="space-y-2" data-oid="8rmf-z7">
          <Label data-oid="pfcm6p6">{t("subtitles.autoSync.sensitivity", "Чувствительность")}</Label>
          <div className="flex items-center gap-4" data-oid="moc0skv">
            <Activity className="h-4 w-4 text-muted-foreground" data-oid="px6_h44" />
            <Slider
              value={sensitivity}
              onValueChange={setSensitivity}
              min={0.1}
              max={0.9}
              step={0.1}
              className="flex-1"
              data-oid="4z6c11g"
            />

            <span className="text-sm text-muted-foreground w-12" data-oid=".hrfeav">
              {Math.round(sensitivity[0] * 100)}%
            </span>
          </div>
        </div>

        {/* Прогресс */}
        {(isAnalyzing || isSyncing) && (
          <div className="space-y-2" data-oid="6pvy3.u">
            <div className="flex items-center justify-between text-sm" data-oid=".l98gby">
              <span data-oid="yoi1dgq">{t("subtitles.autoSync.progress", "Прогресс")}</span>
              <span data-oid="jye4nrt">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} data-oid="hi:_-e3" />
          </div>
        )}

        {/* Кнопка запуска */}
        <Button
          onClick={performAutoSync}
          disabled={!selectedAudioTrack || isAnalyzing || isSyncing}
          className="w-full"
          data-oid="vs-h:sl"
        >
          {(isAnalyzing || isSyncing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" data-oid=":nz709-" />}
          {isAnalyzing
            ? t("subtitles.autoSync.analyzing", "Анализ аудио...")
            : isSyncing
              ? t("subtitles.autoSync.syncing", "Синхронизация...")
              : t("subtitles.autoSync.start", "Начать синхронизацию")}
        </Button>

        {/* Подсказка */}
        <p className="text-xs text-muted-foreground" data-oid=".m.e2m_">
          {t(
            "subtitles.autoSync.hint",
            "Алгоритм анализирует аудио волну для определения моментов начала речи и автоматически выравнивает субтитры",
          )}
        </p>
      </CardContent>
    </Card>
  )
}
