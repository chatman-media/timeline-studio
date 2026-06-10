import { useEffect, useMemo, useRef, useState } from "react"
import { AspectRatio } from "@timeline-studio/ui/components/aspect-ratio"
import { Button } from "@timeline-studio/ui/components/button"
import { MediaType } from "@timeline-studio/core/types"
import { usePlayerAIIntegration } from "@/features/ai-chat"
import { useProjectSettings } from "@/features/project-settings"
import { ResizableTemplate } from "@/features/templates"
import { useTemplates } from "@/features/templates/hooks/use-templates"
import { TimelinePreview } from "@/features/timeline/components/preview/timeline-preview"
import { useTimelineEffects } from "@/features/timeline/hooks/effects/use-timeline-effects"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { usePlayer } from "@/features/timeline/providers/player-provider"
import { createLogger } from "@/lib/tauri-logger"
import { convertVideoSrc } from "@/lib/tauri-utils"
import { useVideoEvents } from "../hooks/use-video-events"
import { PlayerAIOverlay } from "./player-ai-overlay"
import { PlayerControls } from "./player-controls"

const logger = createLogger("video-player:video-player")

/**
 * Компонент медиа-плеера для воспроизведения видео
 */
export function VideoPlayer() {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const {
    currentVideo: video,
    setDuration,
    pause,
    isPlaying,
    currentTime,
    duration,
    volume,
    isSeeking,
    appliedTemplate,
  } = usePlayer()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { getTemplateById } = useTemplates()

  const { project } = useTimeline()
  const { applyEffect, removeEffect, applyFilter, removeFilter, getClipEffects, getClipFilters, getClipTransitions } =
    useTimelineEffects()
  const [showEffectsPreview, setShowEffectsPreview] = useState(true)

  // Подключаем AI интеграцию
  const { isReady: aiReady } = usePlayerAIIntegration()

  // DEBUG: Log video changes
  useEffect(() => {
    console.log("[VideoPlayer] video changed:", { name: video?.name, path: video?.path, hasVideo: !!video })

    // Проверяем количество video элементов на странице
    const allVideos = document.querySelectorAll("video")
    console.log("[VideoPlayer] Total video elements on page:", {
      count: allVideos.length,
      videos: Array.from(allVideos).map((v, i) => ({
        index: i,
        src: v.src,
        paused: v.paused,
        muted: v.muted,
        volume: v.volume,
        className: v.className,
      })),
    })
  }, [video])

  // DEBUG: Log effects and preview state
  useEffect(() => {
    const effectsExist = hasEffects()
    logger.debug("[VideoPlayer] Effects state:", {
      hasEffects: effectsExist,
      showEffectsPreview,
      videoDisplayed: !(showEffectsPreview && effectsExist),
    })
  }, [showEffectsPreview])

  // Создаем AppliedTemplate объект для ResizableTemplate
  const preparedAppliedTemplate = useMemo(() => {
    if (!appliedTemplate) return null

    const template = getTemplateById(appliedTemplate.id)
    if (!template) {
      logger.warn(`Template ${appliedTemplate.id} not found`)
      return null
    }

    return {
      template,
      videos: appliedTemplate.files,
    }
  }, [appliedTemplate, getTemplateById])

  // Мемоизируем handlers чтобы избежать бесконечного цикла в useVideoEvents
  const videoEventHandlers = useMemo(
    () => ({
      onEnded: () => {
        logger.debug("Video ended")
        pause().catch((error) => logger.error("Failed to pause on video end", { error }))
      },
      onError: (error: Error) => {
        logger.error("Video playback error", { error })
        pause().catch((err) => logger.error("Failed to pause on error", { err }))
      },
      onDurationChange: (duration: number) => {
        logger.debug("Video duration changed", { duration })
        setDuration(duration)
      },
      onLoadedMetadata: (metadata: { duration: number; videoWidth: number; videoHeight: number }) => {
        logger.debug("Video metadata loaded", metadata)
        setDuration(metadata.duration)
      },
    }),
    [pause, setDuration],
  )

  // Подписываемся на события video элемента
  useVideoEvents(videoRef, videoEventHandlers)

  // Синхронизация состояния isPlaying с video элементом
  useEffect(() => {
    const videoElement = videoRef.current

    console.log("[VideoPlayer] isPlaying sync effect", {
      isPlaying,
      hasVideoElement: !!videoElement,
      videoId: video?.id,
      readyState: videoElement?.readyState,
      paused: videoElement?.paused,
      muted: videoElement?.muted,
      volume: videoElement?.volume,
    })

    if (!videoElement) return

    // ЗАЩИТА: останавливаем все preview video когда запускаем основной плеер
    if (isPlaying) {
      const previewVideos = document.querySelectorAll("video:not([data-player-video])")
      console.log("[VideoPlayer] Stopping preview videos:", previewVideos.length)
      previewVideos.forEach((previewVideo) => {
        const vid = previewVideo as HTMLVideoElement
        if (!vid.paused) {
          console.log("[VideoPlayer] Pausing preview video:", vid.src)
          vid.pause()
          vid.currentTime = 0
        }
      })
    }

    if (isPlaying) {
      // Уже играет - не вызываем play() повторно (защита от двойного аудио)
      if (!videoElement.paused) {
        console.log("[VideoPlayer] Video already playing, skipping play()")
        return
      }

      // ВАЖНО: убеждаемся что volume и muted правильные ПЕРЕД play()
      const normalizedVolume = Math.max(0, Math.min(1, volume / 100))
      videoElement.volume = normalizedVolume
      videoElement.muted = false
      console.log("[VideoPlayer] Volume before play:", {
        volume: videoElement.volume,
        muted: videoElement.muted,
      })

      // Сразу пытаемся запустить воспроизведение без ожидания
      // Браузер сам обработает буферизацию если нужно
      console.log("[VideoPlayer] Calling videoElement.play() immediately")
      const playPromise = videoElement.play()

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(
              "[VideoPlayer] Play started successfully, volume:",
              videoElement.volume,
              "muted:",
              videoElement.muted,
            )
          })
          .catch((error) => {
            // Если ошибка из-за недостаточной загрузки, ждём canplay
            if (error.name === "NotSupportedError" || error.name === "NotAllowedError") {
              console.warn("[VideoPlayer] Play failed, waiting for canplay", error)
              const handleCanPlay = () => {
                videoElement.play().catch((err) => {
                  console.error("[VideoPlayer] Failed to play after canplay", err)
                })
                videoElement.removeEventListener("canplay", handleCanPlay)
              }
              videoElement.addEventListener("canplay", handleCanPlay, { once: true })
            } else {
              console.error("[VideoPlayer] Failed to play video", error)
            }
          })
      }
    } else {
      console.log("[VideoPlayer] Pausing video")
      videoElement.pause()
    }
  }, [isPlaying, video?.id])

  // Синхронизация currentTime с video элементом (только при seek, не во время воспроизведения)
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    // Валидация времени: если значение слишком большое, это Unix timestamp - игнорируем
    if (currentTime > 100000) return

    // НЕ синхронизируем во время воспроизведения - это вызывает audio glitches
    // Синхронизируем только когда видео на паузе или при явном seek
    if (isPlaying && !isSeeking) return

    const timeDifference = Math.abs(videoElement.currentTime - currentTime)

    // Синхронизируем только если разница больше 0.1 секунды
    if (timeDifference > 0.1) {
      // Для больших прыжков (>0.5 сек) делаем обычный seek
      if (timeDifference > 0.5) {
        videoElement.currentTime = currentTime
        logger.debug("Synced video currentTime (large jump)", { currentTime, timeDifference, isSeeking })
      } else {
        // Для малых корректировок используем плавную синхронизацию
        // чтобы избежать аудио артефактов
        const targetTime = currentTime
        const step = (targetTime - videoElement.currentTime) * 0.3 // 30% от разницы
        videoElement.currentTime += step
        logger.debug("Synced video currentTime (smooth)", { currentTime, step, isSeeking })
      }
    }
  }, [currentTime, isPlaying, isSeeking])

  // Инициализация громкости при монтировании
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    // ВАЖНО: volume в контексте в диапазоне 0-100, нужно делить на 100
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100))

    console.log("[VideoPlayer] Initial volume setup", {
      contextVolume: volume,
      normalizedVolume,
      videoVolume: videoElement.volume,
      muted: videoElement.muted,
    })

    // Устанавливаем начальную громкость
    videoElement.volume = normalizedVolume
    videoElement.muted = false

    console.log("[VideoPlayer] Volume initialized to", {
      volume: videoElement.volume,
      muted: videoElement.muted,
    })
  }, [video?.id]) // Пере-инициализируем при смене видео

  // Синхронизация громкости с video элементом
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) {
      console.log("[VideoPlayer] Volume sync: no video element")
      return
    }

    // ВАЖНО: volume в контексте в диапазоне 0-100, нужно делить на 100
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100))

    console.log("[VideoPlayer] BEFORE volume sync", {
      contextVolume: volume,
      normalizedVolume,
      currentVideoVolume: videoElement.volume,
      muted: videoElement.muted,
    })

    videoElement.volume = normalizedVolume
    videoElement.muted = false // Всегда выключаем mute

    console.log("[VideoPlayer] AFTER volume sync", {
      normalizedVolume,
      muted: videoElement.muted,
      actualVolume: videoElement.volume,
    })
  }, [volume])

  // Вычисляем соотношение сторон для AspectRatio
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  // Проверяем, есть ли активные эффекты
  const hasEffects = () => {
    if (!project) return false

    // Проверяем все клипы на наличие эффектов/фильтров/переходов
    for (const section of project.sections) {
      for (const track of section.tracks) {
        for (const clip of track.clips) {
          const effects = getClipEffects(clip.id)
          const filters = getClipFilters(clip.id)
          const transitions = getClipTransitions(clip.id)

          if (effects.length > 0 || filters.length > 0 || transitions.length > 0) {
            return true
          }
        }
      }
    }

    return false
  }

  // Если применен шаблон, рендерим ResizableTemplate
  if (preparedAppliedTemplate) {
    // Для шаблонов используем первое видео из списка для контролов
    const templateVideo = preparedAppliedTemplate.videos[0] || video
    return (
      <div className="media-player-container relative flex h-full flex-col" data-oid="template-player-wrapper">
        <div className="relative flex-1 bg-black overflow-hidden" data-oid="template-container">
          <ResizableTemplate
            appliedTemplate={preparedAppliedTemplate}
            videos={preparedAppliedTemplate.videos}
            activeVideoId={video?.id || null}
            data-oid="template-view"
          />
        </div>
        <PlayerControls currentTime={currentTime} file={templateVideo} data-oid="template-controls" />
      </div>
    )
  }

  // Вычисляем стили для контейнера видео
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }

  if (!video?.path) {
    const file = {
      id: "no-video",
      path: "",
      name: "Нет видео",
      size: 0,
      type: MediaType.Video,
    }
    return (
      <div className="media-player-container relative flex h-full flex-col" data-oid="9688-f.">
        <div className="relative flex-1 bg-black overflow-hidden" style={containerStyle} data-oid="sza.w.9">
          <div className="flex h-full w-full items-center justify-center" data-oid="hsdsy0t">
            <div className="max-h-full max-w-full" data-oid="-l2-:ll">
              <AspectRatio ratio={aspectRatioValue} className="bg-black" data-oid="a48d7di">
                <div className="absolute inset-0" data-oid="qcyhsoi">
                  <video
                    key={file.id || "no-file"}
                    src={"#"}
                    controls={false}
                    autoPlay={false}
                    loop={false}
                    disablePictureInPicture
                    preload="auto"
                    tabIndex={0}
                    playsInline
                    muted={false}
                    className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                    style={{
                      position: "absolute" as const,
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      display: "block",
                      zIndex: 1,
                    }}
                    data-oid="s8a5two"
                  />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={0} file={file} data-oid="3ff_-r4" />
      </div>
    )
  }

  return (
    <div className="media-player-container relative flex h-full flex-col" data-oid="1djfz84">
      <div className="relative flex-1 bg-black overflow-hidden" style={containerStyle} data-oid="0iyhzrb">
        <div className="flex h-full w-full items-center justify-center" data-oid="hpgq3a2">
          <div className="max-h-full max-w-full" data-oid="mhdt8l1">
            <AspectRatio ratio={aspectRatioValue} className="bg-black" data-oid="wf_5-98">
              <div className="absolute inset-0" data-oid="jaqsiv0">
                <video
                  ref={videoRef}
                  data-player-video // Атрибут для поиска через querySelector в usePlaybackTimeSync
                  key={video.id || "no-video"}
                  src={convertVideoSrc(video.path)}
                  controls={false}
                  autoPlay={false}
                  loop={false}
                  disablePictureInPicture
                  preload="metadata"
                  tabIndex={0}
                  playsInline
                  muted={false}
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget
                    console.log("[VideoPlayer] Video metadata loaded", {
                      muted: vid.muted,
                      volume: vid.volume,
                      duration: vid.duration,
                      readyState: vid.readyState,
                    })
                    // Убеждаемся что muted=false и громкость правильная
                    vid.muted = false
                    vid.volume = Math.max(0, Math.min(1, volume / 100)) // ВАЖНО: делим на 100
                  }}
                  onVolumeChange={(e) => {
                    const vid = e.currentTarget
                    console.log("[VideoPlayer] Volume changed by browser", {
                      volume: vid.volume,
                      muted: vid.muted,
                    })
                  }}
                  className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                  style={{
                    position: "absolute" as const,
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    display: "block", // Временно всегда показываем видео для дебага
                    zIndex: 1,
                  }}
                  data-oid="cw1:lzr"
                />

                {/* AI Analysis Overlay */}
                <PlayerAIOverlay className="z-10" data-oid="5vho-:e" />
                {/* WebGL Effects Preview */}
                {hasEffects() && showEffectsPreview && (
                  <TimelinePreview className="absolute inset-0 z-2" data-oid="iallc_a" />
                )}
              </div>
            </AspectRatio>
          </div>
        </div>
        {/* Effects Preview Toggle Button */}
        {hasEffects() && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2" data-oid="xg614w6">
            {showEffectsPreview && (
              <div className="bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs" data-oid="l589s7g">
                WebGL эффекты
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEffectsPreview(!showEffectsPreview)}
              className="bg-background/80 backdrop-blur-sm"
              data-oid="truqfa7"
            >
              {showEffectsPreview ? "Скрыть эффекты" : "Показать эффекты"}
            </Button>
          </div>
        )}
      </div>
      <PlayerControls currentTime={currentTime} file={video} duration={duration} data-oid="2z2cmnm" />
    </div>
  )
}

VideoPlayer.displayName = "VideoPlayer"
