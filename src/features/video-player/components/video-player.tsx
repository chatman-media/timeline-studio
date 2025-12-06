import { useRef, useState } from "react"
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
  const { currentVideo: video, setDuration, pause } = usePlayer()
  const videoRef = useRef<HTMLVideoElement>(null)

  const { project } = useTimeline()
  const { applyEffect, removeEffect, applyFilter, removeFilter, getClipEffects, getClipFilters, getClipTransitions } =
    useTimelineEffects()
  const [showEffectsPreview, setShowEffectsPreview] = useState(true)

  // Подключаем AI интеграцию
  const { isReady: aiReady } = usePlayerAIIntegration()

  // Подписываемся на события video элемента
  useVideoEvents(videoRef, {
    onEnded: () => {
      logger.debug("Video ended")
      pause().catch((error) => logger.error("Failed to pause on video end", { error }))
    },
    onError: (error) => {
      logger.error("Video playback error", { error })
    },
    onDurationChange: (duration) => {
      logger.debug("Video duration changed", { duration })
      setDuration(duration)
    },
    onLoadedMetadata: (metadata) => {
      logger.debug("Video metadata loaded", metadata)
      setDuration(metadata.duration)
    },
  })

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
                {/* AI Analysis Overlay */}
                <PlayerAIOverlay className="z-10" />
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
      <PlayerControls currentTime={0} file={video} />
    </div>
  )
}

VideoPlayer.displayName = "VideoPlayer"
