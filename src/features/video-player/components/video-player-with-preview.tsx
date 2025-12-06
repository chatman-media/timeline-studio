/**
 * VideoPlayer с интегрированным WebGL2 Preview
 * Использует Timeline Preview для real-time эффектов
 */

import { memo, useState } from "react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { usePlayer } from "@/domains/video-editing/providers"
import { usePlayerAIIntegration } from "@/features/ai-chat"
import { MediaType } from "@/domains/media-management"
import { useProjectSettings } from "@/features/project-settings"
import { TimelinePreview } from "@/features/timeline/components/preview/timeline-preview"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { convertVideoSrc } from "@/lib/tauri-utils"
import { PlayerAIOverlay } from "./player-ai-overlay"
import { PlayerControls } from "./player-controls"

export const VideoPlayerWithPreview = memo(function VideoPlayerWithPreview() {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const { currentVideo: video } = usePlayer()
  const { project } = useTimeline()
  const [showEffectsPreview, setShowEffectsPreview] = useState(false)

  // Подключаем AI интеграцию
  const { isReady: aiReady } = usePlayerAIIntegration()

  // Вычисляем соотношение сторон для AspectRatio
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  // Проверяем, есть ли активные эффекты
  const hasEffects = () => {
    if (!project) return false

    // Проверяем все клипы на наличие эффектов/фильтров/переходов
    for (const section of project.sections) {
      for (const track of section.tracks) {
        for (const clip of track.clips) {
          if (clip.effects.length > 0 || clip.filters.length > 0 || clip.transitions.length > 0) {
            return true
          }
        }
      }
    }

    return false
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
        <div className="relative flex-1 bg-black">
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-muted-foreground">Нет видео</div>
          </div>
        </div>
        <PlayerControls currentTime={0} file={file} />
      </div>
    )
  }

  return (
    <div className="media-player-container relative flex h-full flex-col">
      <div className="relative flex-1 bg-black">
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-full w-full">
            <AspectRatio ratio={aspectRatioValue} className="bg-black">
              <div className="relative h-full w-full">
                {/* Переключение между обычным видео и WebGL preview */}
                {showEffectsPreview ? (
                  <TimelinePreview className="absolute inset-0" />
                ) : (
                  <video
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
                  />
                )}

                {/* AI Analysis Overlay */}
                <PlayerAIOverlay className="z-10" />

                {/* Кнопка переключения preview */}
                {hasEffects() && (
                  <div className="absolute top-4 right-4 z-20">
                    <Button
                      variant={showEffectsPreview ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowEffectsPreview(!showEffectsPreview)}
                      className="bg-black/50 hover:bg-black/70 backdrop-blur"
                    >
                      {showEffectsPreview ? "WebGL Preview" : "Original"}
                    </Button>
                  </div>
                )}

                {/* Индикатор эффектов */}
                {hasEffects() && (
                  <div className="absolute top-4 left-4 z-20">
                    <div className="bg-primary/20 backdrop-blur px-3 py-1 rounded">
                      <span className="text-xs text-primary font-medium">Effects Active</span>
                    </div>
                  </div>
                )}
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      <PlayerControls currentTime={0} file={video} />
    </div>
  )
})
