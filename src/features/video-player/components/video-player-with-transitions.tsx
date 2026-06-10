/**
 * VideoPlayer с поддержкой предпросмотра переходов
 * Интегрирует существующий VideoPlayer с TransitionsPreviewService
 */

import { useEffect, useRef } from "react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { MediaType } from "@timeline-studio/core/types"
import { usePlayerAIIntegration } from "@/features/ai-chat"
import { useProjectSettings } from "@/features/project-settings"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { usePlayer } from "@/features/timeline/providers/player-provider"
import { convertVideoSrc } from "@/lib/tauri-utils"
import { useTransitionPreview } from "../hooks/use-transition-preview"
import { PlayerAIOverlay } from "./player-ai-overlay"
import { PlayerControls } from "./player-controls"
import { TransitionMiniIndicator, TransitionPlayerOverlay } from "./transition-player-overlay"

interface VideoPlayerWithTransitionsProps {
  className?: string
  showTransitionOverlay?: boolean
  showMiniIndicator?: boolean
  enableTransitionPreview?: boolean
}

/**
 * VideoPlayer с поддержкой предпросмотра переходов в реальном времени
 */
export function VideoPlayerWithTransitions({
  className,
  showTransitionOverlay = false,
  showMiniIndicator = true,
  enableTransitionPreview = true,
}: VideoPlayerWithTransitionsProps) {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const { currentVideo: video } = usePlayer()
  const { currentTime } = useTimeline()

  // Подключаем AI интеграцию
  const { isReady: aiReady } = usePlayerAIIntegration()

  // Refs для видео элементов и canvas
  const videoRefA = useRef<HTMLVideoElement>(null)
  const videoRefB = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Хук для управления предпросмотром переходов
  const {
    state: transitionState,
    renderTransition,
    isTransitionActive,
  } = useTransitionPreview({
    enablePreview: enableTransitionPreview,
    autoPlay: false, // Управляется вручную через timeline
    loop: false,
  })

  // Вычисляем соотношение сторон
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  // Рендеринг переходов при изменении состояния
  useEffect(() => {
    if (
      transitionState.activeTransition &&
      canvasRef.current &&
      videoRefA.current &&
      videoRefB.current &&
      enableTransitionPreview
    ) {
      renderTransition(videoRefA.current, videoRefB.current, canvasRef.current)
    }
  }, [transitionState, renderTransition, enableTransitionPreview])

  // Стили контейнера
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }

  // Если нет видео
  if (!video?.path) {
    const file = {
      id: "no-video",
      path: "",
      name: "Нет видео",
      size: 0,
      type: MediaType.Video,
    }

    return (
      <div className={`media-player-container relative flex h-full flex-col ${className || ""}`} data-oid=":-wj06t">
        <div className="relative flex-1 bg-black overflow-hidden" style={containerStyle} data-oid="fhtvskl">
          <div className="flex h-full w-full items-center justify-center" data-oid="44epkfp">
            <div className="h-full w-full" data-oid="3602m92">
              <AspectRatio ratio={aspectRatioValue} className="bg-black" data-oid="mpsoh69">
                <div className="relative h-full w-full" data-oid="6d1ierc">
                  <video
                    key={file.id}
                    src="#"
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
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "block",
                      zIndex: 1,
                    }}
                    data-oid="aw5:-pv"
                  />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={0} file={file} data-oid="3h355dv" />
      </div>
    )
  }

  return (
    <div className={`media-player-container relative flex h-full flex-col ${className || ""}`} data-oid="_ky-:xm">
      <div className="relative flex-1 bg-black overflow-hidden" style={containerStyle} data-oid="pws0_jh">
        <div className="flex h-full w-full items-center justify-center" data-oid="07cd2d-">
          <div className="h-full w-full" data-oid="ru1um86">
            <AspectRatio ratio={aspectRatioValue} className="bg-black" data-oid="kzvngr5">
              <div className="relative h-full w-full" data-oid="ft-f.iu">
                {/* Основное видео */}
                <video
                  ref={videoRefA}
                  key={video.id || "video-a"}
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
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: isTransitionActive() ? "none" : "block",
                    zIndex: 1,
                  }}
                  data-oid="s-5bfz7"
                />

                {/* Второе видео для переходов (скрыто) */}
                <video
                  ref={videoRefB}
                  key={`${video.id}-b`}
                  src={convertVideoSrc(video.path)} // TODO: Получить следующий клип
                  controls={false}
                  autoPlay={false}
                  loop={false}
                  disablePictureInPicture
                  preload="auto"
                  playsInline
                  muted={false}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: "none", // Всегда скрыто, используется только для переходов
                    zIndex: 0,
                  }}
                  data-oid="a8mn4yx"
                />

                {/* Canvas для рендеринга переходов */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    display: isTransitionActive() ? "block" : "none",
                    zIndex: 2,
                  }}
                  width={aspectRatio.value.width}
                  height={aspectRatio.value.height}
                  data-oid="eu3nsa7"
                />

                {/* AI оверлей */}
                {aiReady && <PlayerAIOverlay data-oid="o4k1xhs" />}

                {/* Transition overlay для дополнительной информации */}
                {showTransitionOverlay && transitionState.activeTransition && (
                  <TransitionPlayerOverlay
                    transition={transitionState.activeTransition}
                    progress={transitionState.progress}
                    onClose={() => {
                      // Callback для закрытия оверлея
                    }}
                    data-oid="m75wg4q"
                  />
                )}

                {/* Мини-индикатор перехода */}
                {showMiniIndicator && transitionState.activeTransition && (
                  <TransitionMiniIndicator
                    transition={transitionState.activeTransition}
                    progress={transitionState.progress}
                    data-oid="f:f7afl"
                  />
                )}
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>

      <PlayerControls
        currentTime={currentTime}
        file={{
          id: video.id,
          path: video.path,
          name: video.name || "Video",
          type: video.type || MediaType.Video,
          size: video.size || 0,
        }}
        data-oid="57bp4we"
      />
    </div>
  )
}
