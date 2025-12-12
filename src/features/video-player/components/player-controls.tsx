import {
  Camera,
  ChevronFirst,
  ChevronLast,
  CircleDot,
  ImagePlay,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  StepBack,
  StepForward,
  TvMinimalPlay,
  UnfoldHorizontal,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { MediaFile } from "@/domains/media-management"
import { getFrameTime } from "@/features/media/utils/video"
import { useMulticam } from "@/features/multicam"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

const logger = createLogger("video-player:player-controls")

import { usePlayer } from "@/domains/video-editing"

/**
 * Форматирует время в секундах в timecode формат (HH:MM:SS:FF)
 * Валидирует значение и возвращает "00:00:00:00" для некорректных значений
 */
function formatTimeToTimecode(timeInSeconds: number | undefined | null, fps = 25): string {
  // Валидация: проверяем на undefined/null, не-число, NaN, и Unix timestamp
  if (
    timeInSeconds === undefined ||
    timeInSeconds === null ||
    typeof timeInSeconds !== "number" ||
    !Number.isFinite(timeInSeconds) ||
    timeInSeconds < 0 ||
    timeInSeconds > 100000 // Больше ~27 часов - вероятно Unix timestamp
  ) {
    return "00:00:00:00"
  }

  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const frames = Math.floor((timeInSeconds % 1) * fps)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}

import { useDebouncedSeek } from "../hooks/use-debounced-seek"
import { useFullscreen } from "../hooks/use-fullscreen"
import { PlaybackSpeedControl } from "./playback-speed-control"
import { PlayerAIControls } from "./player-ai-controls"
import { PrerenderControls } from "./prerender-controls"
import { VolumeSlider } from "./volume-slider"

interface PlayerControlsProps {
  /**
   * Текущее время воспроизведения в секундах
   */
  currentTime: number

  /**
   * Медиафайл для воспроизведения (опционально)
   */
  file: MediaFile

  /**
   * Длительность видео в секундах (из провайдера)
   */
  duration?: number
}

export function PlayerControls({ currentTime, file, duration: providerDuration }: PlayerControlsProps) {
  const { t } = useTranslation()
  const {
    isPlaying,
    play,
    pause,
    seek,
    volume,
    setVolume,
    isRecording,
    setIsRecording,
    setIsSeeking,
    isChangingCamera,
    isResizableMode,
    setIsResizableMode,
    videoSource,
    setVideoSource,
    selectedClipId,
  } = usePlayer()

  // Используем состояние для хранения текущего времени воспроизведения
  const [localDisplayTime, setLocalDisplayTime] = useState(0)
  const [parallelVideos] = useState<MediaFile[]>([])
  const [activeCameraIndex, setActiveCameraIndex] = useState(0)

  // Используем выбранный клип как базовый для мультикамеры
  const multicam = useMulticam(selectedClipId || undefined)

  // Используем хук для отслеживания полноэкранного режима
  const { isFullscreen, toggleFullscreen } = useFullscreen()

  // Используем debounced seek для оптимизации
  const { debouncedSeek, immediateSeek } = useDebouncedSeek(seek, {
    delay: 100, // Задержка 100ms для debounce
    onSeekStart: (time) => {
      setLocalDisplayTime(time) // Мгновенное обновление UI
      setIsSeeking(true)
    },
    onSeekEnd: () => {
      setIsSeeking(false) // Сброс флага после завершения seek
    },
  })

  // Создаем ref для хранения текущего значения громкости
  const volumeRef = useRef<number>(volume)

  // Функция для переключения полноэкранного режима
  const handleFullscreen = useCallback(() => {
    // Находим контейнер медиаплеера
    const playerContainer = document.querySelector(".media-player-container")

    if (!playerContainer) {
      logger.error("media player container not found")
      return
    }
    toggleFullscreen(playerContainer as HTMLElement)

    logger.debug("fullscreen toggled", { isFullscreen })
  }, [isFullscreen])

  // Нормализуем currentTime для отображения, если это Unix timestamp
  const calculatedDisplayTime = useMemo(() => {
    // Проверяем на валидность значений
    if (typeof currentTime !== "number" || Number.isNaN(currentTime)) {
      return 0
    }
    if (currentTime > 365 * 24 * 60 * 60) {
      // Если время больше года в секундах, это, вероятно, Unix timestamp
      // Используем локальное время для отображения
      return typeof localDisplayTime === "number" && !Number.isNaN(localDisplayTime) ? localDisplayTime : 0
    }
    return currentTime
  }, [currentTime, localDisplayTime])

  // Эффективная длительность: приоритет providerDuration (из video элемента), затем file.duration
  const effectiveDuration = useMemo(() => {
    if (typeof providerDuration === "number" && Number.isFinite(providerDuration) && providerDuration > 0) {
      return providerDuration
    }
    if (typeof file.duration === "number" && Number.isFinite(file.duration) && file.duration > 0) {
      return file.duration
    }
    return 0
  }, [providerDuration, file.duration])

  // Получаем frameTime с помощью функции getFrameTime
  const frameTime = getFrameTime(file)

  // Определяем isFirstFrame и isLastFrame на основе мемоизированных значений
  const isFirstFrame = useMemo(() => {
    return Math.abs(currentTime - (file.startTime ?? 0)) < frameTime
  }, [currentTime, file.startTime, frameTime])

  const isLastFrame = useMemo(() => {
    return Math.abs(currentTime - (file.endTime ?? 0)) < frameTime
  }, [currentTime, file.endTime, frameTime])

  const handleTimeChange = useCallback(
    (value: number[]) => {
      const newTime = value[0]
      // Используем debounced seek для плавного перетаскивания слайдера
      debouncedSeek(newTime)
    },
    [debouncedSeek],
  )

  const handleRecordToggle = useCallback(() => {
    setIsRecording(!isRecording)
  }, [isRecording, setIsRecording])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause().catch((error) => logger.error("pause failed", { error }))
    } else {
      play().catch((error) => logger.error("play failed", { error }))
    }
  }, [isPlaying, play, pause])

  const handleSkipForward = useCallback(() => {
    const newTime = Math.min(currentTime + frameTime, file.endTime ?? effectiveDuration)
    // Используем immediate seek для мгновенной навигации
    immediateSeek(newTime).catch((error) => logger.error("Operation failed", { error }))
  }, [currentTime, frameTime, file.endTime, effectiveDuration, immediateSeek])

  const handleSkipBackward = useCallback(() => {
    const newTime = Math.max(currentTime - frameTime, file.startTime ?? 0)
    // Используем immediate seek для мгновенной навигации
    immediateSeek(newTime).catch((error) => logger.error("Operation failed", { error }))
  }, [currentTime, frameTime, file.startTime, immediateSeek])

  const handleChevronFirst = useCallback(() => {
    const newTime = file.startTime ?? 0
    // Используем immediate seek для мгновенной навигации
    immediateSeek(newTime).catch((error) => logger.error("Operation failed", { error }))
  }, [file.startTime, immediateSeek])

  const handleChevronLast = useCallback(() => {
    const newTime = file.endTime ?? 0
    // Используем immediate seek для мгновенной навигации
    immediateSeek(newTime).catch((error) => logger.error("Operation failed", { error }))
  }, [file.endTime, immediateSeek])

  // Функция для переключения звука (вкл/выкл)
  const handleToggleMute = useCallback(() => {
    // Если звук выключен, устанавливаем последнее сохраненное значение или 100%
    if (volume === 0) {
      const newVolume = volumeRef.current > 0 ? volumeRef.current : 100
      setVolume(newVolume)
      logger.debug("unmute", { volume: newVolume })
    } else {
      // Сохраняем текущее значение громкости перед выключением
      volumeRef.current = volume
      setVolume(0)
      logger.debug("mute", { savedVolume: volumeRef.current })
    }
  }, [volume, setVolume])

  // Функция для изменения громкости
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] // Значение уже в диапазоне 0-100
      setVolume(newVolume)
    },
    [setVolume],
  )

  // Функция, вызываемая при завершении изменения громкости
  const handleVolumeChangeEnd = useCallback(() => {
    logger.debug("volume change completed", { volume })
  }, [volume])

  // Функция для переключения источника видео
  const handleToggleSource = useCallback(() => {
    setVideoSource(videoSource === "timeline" ? "browser" : "timeline")
  }, [videoSource, setVideoSource])

  // Функция для переключения камеры в мультикамерном режиме
  const handleSwitchCamera = useCallback(() => {
    // Если есть мультикамерная поддержка, используем хук
    if (multicam.hasMulticamSupport) {
      multicam.switchToNextAngle()
      return
    }

    // Иначе используем локальную логику (временно)
    if (!parallelVideos || parallelVideos.length <= 1) return

    // Переключаемся на следующую камеру по кругу
    const nextIndex = (activeCameraIndex + 1) % parallelVideos.length
    setActiveCameraIndex(nextIndex)

    // TODO: Здесь нужно будет вызвать функцию переключения на другой клип
    // через timeline API или player API
    logger.debug("switching camera", { cameraIndex: nextIndex + 1 })
  }, [activeCameraIndex, parallelVideos, multicam])

  return (
    <div className="flex w-full flex-col">
      {/* Прогресс-бар и время */}
      <div className="px-2 pl-4 py-1">
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <div className="relative h-1 w-full rounded-full border border-teal dark:border-teal bg-white dark:bg-black">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-teal dark:bg-white transition-all duration-200 ease-out"
                style={{
                  width: `${typeof calculatedDisplayTime === "number" && !Number.isNaN(calculatedDisplayTime) && typeof effectiveDuration === "number" && !Number.isNaN(effectiveDuration) && effectiveDuration > 0 ? (Math.max(0, calculatedDisplayTime) / effectiveDuration) * 100 : 0}%`,
                }}
              />
              <div
                className="absolute top-1/2 h-[14px] w-[14px] -translate-y-1/2 rounded-full border border-teal dark:border-teal bg-teal transition-all duration-200 ease-out"
                style={{
                  left: `calc(${typeof calculatedDisplayTime === "number" && !Number.isNaN(calculatedDisplayTime) && typeof effectiveDuration === "number" && !Number.isNaN(effectiveDuration) && effectiveDuration > 0 ? (Math.max(0, calculatedDisplayTime) / effectiveDuration) * 100 : 0}% - 7px)`,
                }}
              />
              <Slider
                value={[Math.max(0, calculatedDisplayTime)]}
                min={0}
                max={effectiveDuration ?? 100}
                step={0.001}
                onValueChange={handleTimeChange}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                disabled={isChangingCamera} // Отключаем слайдер во время переключения камеры
                data-testid="slider"
              />
            </div>
          </div>
          <span className="rounded-xs bg-white font-light px-1.5 py-0.5 text-[11px] text-black transition-opacity duration-200 ease-out dark:bg-black dark:text-white ml-1 font-mono min-w-[85px] text-center inline-block">
            {formatTimeToTimecode(calculatedDisplayTime)}
          </span>
          <span className="mb-[3px]">/</span>
          <span className="rounded-xs bg-white font-light px-1.5 py-0.5 text-[11px] text-black transition-opacity duration-200 ease-out dark:bg-background dark:text-white font-mono min-w-[85px] text-center inline-block">
            {formatTimeToTimecode(effectiveDuration)}
          </span>

          {/* Скрытый элемент для обновления компонента при воспроизведении */}
          {currentTime > 365 * 24 * 60 * 60 && (
            <span className="hidden">
              {localDisplayTime.toFixed(3)} - {calculatedDisplayTime.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="h-full w-full p-1">
        <div className="flex items-center justify-between px-1 py-0">
          {/* Левая часть: индикатор источника, кнопки для камер и шаблонов */}
          <div className="flex items-center gap-2">
            {/* Индикатор источника видео - всегда отображается и работает как переключатель */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                videoSource === "timeline"
                  ? t("timeline.source.timeline", "Таймлайн")
                  : t("timeline.source.browser", "Браузер")
              }
              onClick={handleToggleSource}
            >
              {videoSource === "timeline" ? <TvMinimalPlay className="h-8 w-8" /> : <ImagePlay className="h-8 w-8" />}
            </Button>

            {/* Кнопка переключения режима resizable - показываем только если применен шаблон */}
            <Button
              className={`h-8 w-8 cursor-pointer ${isResizableMode ? "bg-[#45444b] hover:bg-[#45444b]/80" : "hover:bg-[#45444b]/80"}`}
              variant="ghost"
              size="icon"
              title={
                isResizableMode ? t("timeline.controlsMain.fixedSizeMode") : t("timeline.controlsMain.resizableMode")
              }
              onClick={() => setIsResizableMode(!isResizableMode)}
              disabled={!file.probeData}
            >
              {<UnfoldHorizontal className="h-8 w-8" />}
            </Button>
            <PrerenderControls currentTime={currentTime} duration={effectiveDuration ?? 0} />

            {/* Управление скоростью воспроизведения */}
            {file.probeData && <PlaybackSpeedControl />}
            {/* Кнопка снимка экрана */}
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.takeSnapshot") : "Take snapshot"}
              // onClick={takeSnapshot}
              disabled={isChangingCamera || isPlaying || !file.probeData} // Отключаем кнопку во время переключения камеры
            >
              <Camera className="h-8 w-8" />
            </Button>
          </div>

          {/* Центральная часть: кнопки управления воспроизведением */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ flex: "1", marginLeft: "auto", marginRight: "auto" }}
          >
            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.firstFrame") : "First frame"}
              onClick={handleChevronFirst}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <ChevronFirst className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.previousFrame") : "Previous frame"}
              onClick={handleSkipBackward}
              disabled={isFirstFrame || isPlaying || isChangingCamera}
            >
              <StepBack className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={isPlaying ? t("timeline.controls.pause") : t("timeline.controls.play")}
              onClick={handlePlayPause}
              disabled={isChangingCamera}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
            </Button>

            <Button
              className={"h-8 w-8 cursor-pointer"}
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isRecording
                    ? t("timeline.controls.stopRecord")
                    : t("timeline.controls.record")
                  : "Record"
              }
              onClick={handleRecordToggle}
              disabled={isChangingCamera || !file.probeData} // Отключаем кнопку во время переключения камеры
            >
              <CircleDot
                className={cn(
                  "h-8 w-8",
                  isRecording ? "animate-pulse text-red-500 hover:text-red-600" : "text-gray-300 hover:text-gray-400",
                )}
              />
            </Button>

            {/* Кнопка переключения между камерами - показываем только если есть параллельные видео */}
            {parallelVideos && parallelVideos.length > 1 && (
              <Button
                className={`h-8 w-8 cursor-pointer ${isChangingCamera ? "animate-pulse" : ""}`}
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? `${t("timeline.controlsMain.switchCamera")} (${parallelVideos.findIndex((v) => v.id === file?.id) + 1}/${parallelVideos.length})`
                    : "Switch Camera"
                }
                onClick={handleSwitchCamera}
                disabled={isChangingCamera || (!multicam.hasMulticamSupport && parallelVideos.length <= 1)}
              >
                {multicam.hasMulticamSupport ? multicam.activeAngleIndex + 1 : activeCameraIndex + 1}
              </Button>
            )}

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.nextFrame") : "Next frame"}
              onClick={handleSkipForward}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <StepForward className="h-8 w-8" />
            </Button>

            <Button
              className="h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={typeof window !== "undefined" ? t("timeline.controls.lastFrame") : "Last frame"}
              onClick={handleChevronLast}
              disabled={isLastFrame || isPlaying || isChangingCamera}
            >
              <ChevronLast className="h-8 w-8" />
            </Button>
          </div>

          {/* Правая часть: AI controls, кнопки управления звуком и полноэкранным режимом */}
          <div className="flex items-center gap-2" style={{ justifyContent: "flex-end" }}>
            {/* AI Controls */}
            <PlayerAIControls className="mr-2" />

            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 cursor-pointer"
                variant="ghost"
                size="icon"
                title={
                  typeof window !== "undefined"
                    ? volume === 0
                      ? t("timeline.controls.unmuteAudio")
                      : t("timeline.controls.muteAudio")
                    : "Mute audio"
                }
                onClick={handleToggleMute}
              >
                {volume === 0 ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
              </Button>
              <VolumeSlider
                volume={volume}
                volumeRef={volumeRef}
                onValueChange={handleVolumeChange}
                onValueCommit={handleVolumeChangeEnd}
              />
            </div>
            <Button
              className="ml-1 h-8 w-8 cursor-pointer"
              variant="ghost"
              size="icon"
              title={
                typeof window !== "undefined"
                  ? isFullscreen
                    ? t("timeline.controls.exitFullscreen")
                    : t("timeline.controls.fullscreen")
                  : "Fullscreen"
              }
              onClick={handleFullscreen}
              disabled={!file}
            >
              {isFullscreen ? <Minimize2 className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
