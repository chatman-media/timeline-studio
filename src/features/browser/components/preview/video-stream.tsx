import { memo, useCallback, useRef, useState } from "react"
import type { FfprobeStream, MediaFile } from "@/domains/media-management"
import { useResources } from "@/domains/video-editing/providers"
import { calculateAdaptiveWidth, calculateWidth, parseRotation } from "@/features/media/utils/video"
import { usePlayer } from "@/features/video-player"
import { createThumbnailUrl } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { VideoElement } from "./video-element"
import { VideoOverlays } from "./video-overlays"

const logger = createLogger("VideoStream")

interface VideoStreamProps {
  file: MediaFile
  stream: FfprobeStream
  size: number
  videoUrl: string
  previewData: string | null
  isMultipleStreams: boolean
  ignoreRatio: boolean
  showFileName?: boolean
  hoverTime: number | null
  onHoverTimeChange: (time: number | null) => void
  isLastStream: boolean
}

/**
 * Компонент для отображения одного видеопотока
 */
export const VideoStream = memo(
  ({
    file,
    stream,
    size,
    videoUrl,
    previewData,
    isMultipleStreams,
    ignoreRatio,
    showFileName,
    hoverTime,
    onHoverTimeChange,
    isLastStream,
  }: VideoStreamProps) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const lastUpdateTimeRef = useRef(0)
    const { playerSetSource, playerSetMedia, setCurrentVideo, play } = usePlayer()
    const { isAdded: isResourceAdded, removeResource } = useResources()
    const isAdded = isResourceAdded(file.id, "media")

    const key = stream.streamKey ?? `stream-${stream.index}`

    // Вычисляем размеры
    const videoWidth = stream.width || 1920
    const videoHeight = stream.height || 1080
    const width = calculateWidth(videoWidth, videoHeight, size, parseRotation(stream.rotation))
    const adaptiveWidth = calculateAdaptiveWidth(width, isMultipleStreams, stream.display_aspect_ratio || "16:9")
    const aspectRatio = stream.display_aspect_ratio?.split(":").map(Number) ?? [16, 9]
    const ratio = aspectRatio[0] / aspectRatio[1]

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPlaying) return

        const now = Date.now()
        if (now - lastUpdateTimeRef.current < 33) return
        lastUpdateTimeRef.current = now

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = percentage * (file.duration ?? 0)

        onHoverTimeChange(newTime)

        if (videoRef.current && !isPlaying) {
          videoRef.current.currentTime = newTime
          videoRef.current.pause()
        }
      },
      [file.duration, isPlaying, onHoverTimeChange],
    )

    const handleMouseLeave = useCallback(() => {
      onHoverTimeChange(null)
      if (isPlaying) {
        setIsPlaying(false)
      }
    }, [isPlaying, onHoverTimeChange])

    const handleClick = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault()

        // Не воспроизводим видео если оно уже добавлено
        if (isAdded) {
          logger.debugSync(`[VideoStream] Skipping playback - file already added: ${file.name}`)
          return
        }

        try {
          // Устанавливаем видео в локальное состояние плеера
          setCurrentVideo(file)

          await playerSetSource("browser")
          await playerSetMedia(file.id, hoverTime || 0)
          await play()
          logger.debugSync(`[VideoStream] Video sent to main player: ${file.name} at time ${hoverTime || 0}`)
        } catch (error) {
          logger.errorSync("[VideoStream] Failed to send video to main player:", { error })

          // Fallback: локальное воспроизведение
          if (!videoRef.current) return

          const newPlayingState = !isPlaying

          if (newPlayingState) {
            if (hoverTime !== null) {
              videoRef.current.currentTime = hoverTime
            }
            videoRef.current.play().catch((err: unknown) =>
              logger.errorSync("[VideoStream] Ошибка воспроизведения:", {
                err,
              }),
            )
          } else {
            videoRef.current.pause()
          }

          setIsPlaying(newPlayingState)
          logger.debugSync(`[VideoStream] Fallback: Видео ${newPlayingState ? "запущено" : "остановлено"}`, {
            fileName: file.name,
          })
        }
      },
      [hoverTime, file, playerSetSource, playerSetMedia, play, isPlaying, isAdded, setCurrentVideo],
    )

    const handleLoadedData = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        logger.debugSync("Video loaded for stream", {
          streamIndex: typeof stream.index !== "undefined" ? stream.index : key,
        })
        setIsLoaded(true)

        const video = e.currentTarget
        video.currentTime = 0
        video.pause()

        logger.debugSync(`[VideoStream] Video dimensions: ${video.videoWidth}x${video.videoHeight}`)
        logger.debugSync(`[VideoStream] Video src: ${video.src}`)

        if (!file.probeData?.streams || file.probeData.streams.length === 0) {
          logger.debugSync("No streams found in probeData for file", {
            fileName: file.name,
          })
        }
      },
      [file, key, stream.index],
    )

    const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget
      video.currentTime = 0
      video.pause()
    }, [])

    const handleEnded = useCallback(() => {
      logger.debugSync("Video ended for stream", { streamIndex: stream.index })
      setIsPlaying(false)
    }, [stream.index])

    const handlePlay = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        logger.debugSync("Video playing for stream", {
          streamIndex: stream.index,
        })
        const video = e.currentTarget
        if (hoverTime !== null) {
          video.currentTime = hoverTime
        }
      },
      [hoverTime, stream.index],
    )

    const handleTimeUpdate = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const now = Date.now()
        if (now - lastUpdateTimeRef.current > 500) {
          lastUpdateTimeRef.current = now
          logger.debugSync("Time update for stream", {
            streamIndex: typeof stream.index !== "undefined" ? stream.index : key,
            currentTime: e.currentTarget.currentTime.toFixed(2),
          })
        }
      },
      [key, stream.index],
    )

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        logger.debugSync("Video error for stream", {
          streamIndex: typeof stream.index !== "undefined" ? stream.index : key,
        })

        const video = e.currentTarget

        if (video.error) {
          const errorMessages = [
            "MEDIA_ERR_ABORTED (1): Загрузка прервана пользователем",
            "MEDIA_ERR_NETWORK (2): Сетевая ошибка",
            "MEDIA_ERR_DECODE (3): Ошибка декодирования",
            "MEDIA_ERR_SRC_NOT_SUPPORTED (4): Формат не поддерживается или URL недоступен",
          ]
          logger.errorSync("[VideoStream] Ошибка загрузки видео", {
            code: video.error.code,
            message: video.error.message,
            fileName: file.name,
            filePath: file.path,
            videoSrc: video.src,
            errorDescription: errorMessages[video.error.code - 1] || "Unknown error",
          })

          if (video.error.code === 4) {
            logger.debugSync(`[VideoStream] Автоматическое удаление файла из проекта: ${file.name}`)
            void removeResource(file.id, "media")
          }
        }
      },
      [file, key, removeResource, stream.index],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLVideoElement>) => {
        if (e.code === "Space") {
          e.preventDefault()
          void handleClick(e as unknown as React.MouseEvent)
        }
      },
      [handleClick],
    )

    return (
      <div
        key={key}
        className={cn("relative shrink-0", isAdded && "pointer-events-none")}
        style={{
          height: `${size}px`,
          width:
            ratio > 1
              ? ignoreRatio
                ? width
                : adaptiveWidth
              : isMultipleStreams && ignoreRatio
                ? width
                : adaptiveWidth,
        }}
      >
        <div
          className={cn("group relative h-full w-full bg-muted", isAdded && "opacity-50 grayscale cursor-not-allowed")}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          {/* Preview background - показывается сразу */}
          {(previewData || file.thumbnailPath) && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: previewData
                  ? `url(data:image/jpeg;base64,${previewData})`
                  : file.thumbnailPath
                    ? `url(${createThumbnailUrl(file.thumbnailPath)})`
                    : undefined,
                zIndex: 0,
              }}
            />
          )}

          <VideoElement
            file={file}
            videoUrl={videoUrl}
            previewData={previewData}
            isAdded={isAdded}
            isPlaying={isPlaying}
            videoRef={videoRef}
            onLoadedData={handleLoadedData}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onEnded={handleEnded}
            onPlay={handlePlay}
            onTimeUpdate={handleTimeUpdate}
            onKeyDown={handleKeyDown}
            streamIndex={stream.index}
            streamKey={key}
          />

          {/* Показываем overlay только если нет превью и видео не загружено */}
          {!isLoaded && !previewData && !file.thumbnailPath && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-center pointer-events-none"
              style={{ zIndex: 2 }}
            >
              <div className="truncate px-2 text-sm text-foreground/90 font-medium" style={{ maxWidth: "90%" }}>
                {file.name}
              </div>
              <div className="mt-2 text-xs text-muted-foreground animate-pulse">Загрузка...</div>
            </div>
          )}

          <VideoOverlays
            file={file}
            size={size}
            isLoaded={isLoaded}
            isMultipleStreams={isMultipleStreams}
            streamIndex={stream.index}
            streamWidth={stream.width}
            streamHeight={stream.height}
            showFileName={showFileName}
            isLastStream={isLastStream}
          />
        </div>
      </div>
    )
  },
)

VideoStream.displayName = "VideoStream"
