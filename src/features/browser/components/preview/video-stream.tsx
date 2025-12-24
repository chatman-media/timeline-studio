import { memo, useCallback, useRef, useState } from "react"
import type { FfprobeStream, MediaFile } from "@/domains/media-management"
import { useResources } from "@/domains/video-editing"
import { calculateAdaptiveWidth, calculateWidth, parseRotation } from "@/features/media/utils/video"
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
      (e: React.MouseEvent) => {
        e.preventDefault()

        // Локальное воспроизведение превью (не отправляем в плеер)
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
        logger.debugSync(`[VideoStream] Видео ${newPlayingState ? "запущено" : "остановлено"}`, {
          fileName: file.name,
        })
      },
      [hoverTime, file.name, isPlaying],
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

    // Вычисляем ширину для контейнера
    const containerWidth =
      ratio > 1 ? (ignoreRatio ? width : adaptiveWidth) : isMultipleStreams && ignoreRatio ? width : adaptiveWidth

    return (
      <div
        key={key}
        className={cn("flex flex-col shrink-0", isAdded && "pointer-events-none")}
        style={{
          width: containerWidth,
        }}
        data-oid="cg92joi"
      >
        <div
          className={cn("group relative bg-muted w-full", isAdded && "opacity-50 grayscale cursor-not-allowed")}
          style={{ height: `${size}px` }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          data-oid="z2o9y3q"
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
              data-oid="3724j:a"
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
            data-oid="kjlw6pr"
          />

          {/* Показываем overlay только если нет превью и видео не загружено */}
          {!isLoaded && !previewData && !file.thumbnailPath && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-center pointer-events-none"
              style={{ zIndex: 2 }}
              data-oid="agoowpg"
            >
              <div
                className="truncate px-2 text-sm text-foreground/90 font-medium"
                style={{ maxWidth: "90%" }}
                data-oid="nn.7b6n"
              >
                {file.name}
              </div>
              <div className="mt-2 text-xs text-muted-foreground animate-pulse" data-oid="2dhu21d">
                Загрузка...
              </div>
            </div>
          )}

          <VideoOverlays
            file={file}
            size={size}
            isLoaded={isLoaded}
            isMultipleStreams={isMultipleStreams}
            streamIndex={stream.index}
            streamWidth={videoWidth}
            streamHeight={videoHeight}
            showFileName={false}
            isLastStream={isLastStream}
            hoverTime={hoverTime}
            data-oid="8720tev"
          />
        </div>
        {/* Имя файла и разрешение ниже превью */}
        {showFileName && (
          <div className="mt-1 text-center" style={{ maxWidth: containerWidth }} data-oid="video-info">
            <div className="text-xs truncate text-foreground/80" data-oid="video-filename">
              {file.name}
            </div>
            {stream.width && stream.height && (
              <div className="text-xs text-foreground/60 mt-0.5" data-oid="video-resolution">
                {stream.width}×{stream.height}
              </div>
            )}
          </div>
        )}
      </div>
    )
  },
)

VideoStream.displayName = "VideoStream"
