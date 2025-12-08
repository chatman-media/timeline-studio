import { useEffect, useMemo, useRef, useState } from "react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { MediaType } from "@/domains/media-management"
import { usePlayer } from "@/domains/video-editing/providers"
import { usePlayerAIIntegration } from "@/features/ai-chat"
import { useProjectSettings } from "@/features/project-settings"
import { TimelinePreview } from "@/features/timeline/components/preview/timeline-preview"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useTimelineEffects } from "@/features/timeline/hooks/use-timeline-effects"
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
  const { currentVideo: video, setDuration, pause, isPlaying, currentTime, duration, volume, isSeeking } = usePlayer()
  const videoRef = useRef<HTMLVideoElement>(null)

  const { project } = useTimeline()
  const { applyEffect, removeEffect, applyFilter, removeFilter, getClipEffects, getClipFilters, getClipTransitions } =
    useTimelineEffects()
  const [showEffectsPreview, setShowEffectsPreview] = useState(true)

  // Подключаем AI интеграцию
  const { isReady: aiReady } = usePlayerAIIntegration()

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
    logger.debug("isPlaying sync effect", {
      isPlaying,
      hasVideoElement: !!videoElement,
      videoId: video?.id,
      readyState: videoElement?.readyState,
      paused: videoElement?.paused,
    })

    if (!videoElement) return

    if (isPlaying) {
      // Уже играет - не вызываем play() повторно (защита от двойного аудио)
      if (!videoElement.paused) {
        logger.debug("Video already playing, skipping play()")
        return
      }

      // Проверяем, что видео достаточно загружено для воспроизведения
      // readyState >= 2 означает HAVE_CURRENT_DATA (есть данные для текущего кадра)
      if (videoElement.readyState >= 2) {
        logger.debug("Calling videoElement.play() - readyState OK")
        videoElement.play().catch((error) => {
          logger.error("Failed to play video", { error })
        })
      } else {
        logger.debug("Waiting for canplay event", { readyState: videoElement.readyState })
        // Если видео не готово, ждём события canplay
        const handleCanPlay = () => {
          // Повторная проверка - может видео уже играет из-за другого события
          if (!videoElement.paused) {
            logger.debug("canplay: Video already playing, skipping")
            videoElement.removeEventListener("canplay", handleCanPlay)
            return
          }
          logger.debug("canplay event fired, calling play()")
          videoElement.play().catch((error) => {
            logger.error("Failed to play video after canplay", { error })
          })
          videoElement.removeEventListener("canplay", handleCanPlay)
        }
        videoElement.addEventListener("canplay", handleCanPlay)
        return () => {
          videoElement.removeEventListener("canplay", handleCanPlay)
        }
      }
    } else {
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

    // Синхронизируем только если разница больше 0.1 секунды
    if (Math.abs(videoElement.currentTime - currentTime) > 0.1) {
      videoElement.currentTime = currentTime
      logger.debug("Synced video currentTime", { currentTime, isSeeking })
    }
  }, [currentTime, isPlaying, isSeeking])

  // Синхронизация громкости с video элементом
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    // volume в контексте уже в диапазоне 0-1
    videoElement.volume = Math.max(0, Math.min(1, volume))
    logger.debug("Synced video volume", { volume })
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

  // Вычисляем стили для контейнера видео
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black" style={containerStyle}>
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-full w-full">
              <AspectRatio ratio={aspectRatioValue} className="bg-black">
                <div className="relative h-full w-full">
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
                  />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={0} file={file} />
      </div>
    )
  }

  return (
    <div className="media-player-container relative flex h-full flex-col">
      <div className="relative flex-1 bg-black" style={containerStyle}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-full w-full">
            <AspectRatio ratio={aspectRatioValue} className="bg-black">
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  data-player-video // Атрибут для поиска через querySelector в usePlaybackTimeSync
                  key={video.id || "no-video"}
                  src={convertVideoSrc(video.path)}
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
                    display: showEffectsPreview && hasEffects() ? "none" : "block",
                    zIndex: 1,
                  }}
                />
                {/* AI Analysis Overlay */}
                <PlayerAIOverlay className="z-10" />
                {/* WebGL Effects Preview */}
                {hasEffects() && showEffectsPreview && <TimelinePreview className="absolute inset-0 z-2" />}
              </div>
            </AspectRatio>
          </div>
        </div>
        {/* Effects Preview Toggle Button */}
        {hasEffects() && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            {showEffectsPreview && (
              <div className="bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs">WebGL эффекты</div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEffectsPreview(!showEffectsPreview)}
              className="bg-background/80 backdrop-blur-sm"
            >
              {showEffectsPreview ? "Скрыть эффекты" : "Показать эффекты"}
            </Button>
          </div>
        )}
      </div>
      <PlayerControls currentTime={currentTime} file={video} duration={duration} />
    </div>
  )
}

VideoPlayer.displayName = "VideoPlayer"
