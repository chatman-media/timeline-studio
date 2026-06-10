/**
 * VideoPlayer с интегрированным WebGL2 Preview
 * Использует Timeline Preview для real-time эффектов
 */

import { memo, useState } from "react"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import { MediaType } from "@/core/types"
import { usePlayerAIIntegration } from "@/features/ai-chat"
import { useProjectSettings } from "@/features/project-settings"
import { TimelinePreview } from "@/features/timeline/components/preview/timeline-preview"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { usePlayer } from "@/features/timeline/providers/player-provider"
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
      <div className="media-player-container relative flex h-full flex-col" data-oid="32p_6j8">
        <div className="relative flex-1 bg-black" data-oid="nh91ulf">
          <div className="flex h-full w-full items-center justify-center" data-oid="1m4o5j0">
            <div className="text-muted-foreground" data-oid="9gzj1o4">
              Нет видео
            </div>
          </div>
        </div>
        <PlayerControls currentTime={0} file={file} data-oid="16e1oam" />
      </div>
    )
  }

  return (
    <div className="media-player-container relative flex h-full flex-col" data-oid="dn0:.r1">
      <div className="relative flex-1 bg-black" data-oid="vl0:ldw">
        <div className="flex h-full w-full items-center justify-center" data-oid="nes0qi5">
          <div className="h-full w-full" data-oid=".m.jkdu">
            <AspectRatio ratio={aspectRatioValue} className="bg-black" data-oid=":hs24c:">
              <div className="relative h-full w-full" data-oid="53fu1ne">
                {/* Переключение между обычным видео и WebGL preview */}
                {showEffectsPreview ? (
                  <TimelinePreview className="absolute inset-0" data-oid="v0.eri_" />
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
                    data-oid="-:bqi5v"
                  />
                )}

                {/* AI Analysis Overlay */}
                <PlayerAIOverlay className="z-10" data-oid="g2vakke" />

                {/* Кнопка переключения preview */}
                {hasEffects() && (
                  <div className="absolute top-4 right-4 z-20" data-oid="u7dhpck">
                    <Button
                      variant={showEffectsPreview ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowEffectsPreview(!showEffectsPreview)}
                      className="bg-black/50 hover:bg-black/70 backdrop-blur"
                      data-oid="8sseln4"
                    >
                      {showEffectsPreview ? "WebGL Preview" : "Original"}
                    </Button>
                  </div>
                )}

                {/* Индикатор эффектов */}
                {hasEffects() && (
                  <div className="absolute top-4 left-4 z-20" data-oid="knj228_">
                    <div className="bg-primary/20 backdrop-blur px-3 py-1 rounded" data-oid="ni.i1v1">
                      <span className="text-xs text-primary font-medium" data-oid="l22qtit">
                        Effects Active
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      <PlayerControls currentTime={0} file={video} data-oid="o3.34:5" />
    </div>
  )
})
