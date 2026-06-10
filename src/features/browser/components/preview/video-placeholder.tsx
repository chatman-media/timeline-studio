import { memo, useCallback, useState } from "react"
import type { MediaFile } from "@/core/types"
import { useResources } from "@/features/timeline/providers/resources-provider"
import { usePlayer } from "@/features/video-player"
import { createThumbnailUrl } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { VideoElement } from "./video-element"
import { VideoOverlays } from "./video-overlays"

const logger = createLogger("VideoPlaceholder")

interface VideoPlaceholderProps {
  file: MediaFile
  size: number
  videoUrl: string
  previewData: string | null
  hoverTime: number | null
  onHoverTimeChange: (time: number | null) => void
}

/**
 * Плейсхолдер видео для случаев когда метаданные еще не загрузились
 * Использует соотношение сторон 16:9
 */
export const VideoPlaceholder = memo(
  ({ file, size, videoUrl, previewData, hoverTime, onHoverTimeChange }: VideoPlaceholderProps) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [hasError, setHasError] = useState(false)
    const { playerSetSource, playerSetMedia, setCurrentVideo } = usePlayer()
    const { isAdded: isResourceAdded } = useResources()
    const isAdded = isResourceAdded(file.id, "media")

    // Логируем состояние превью для отладки
    logger.debugSync(`[VideoPlaceholder] Rendering for ${file.name}`, {
      hasPreviewData: !!previewData,
      hasThumbnailPath: !!file.thumbnailPath,
      thumbnailPath: file.thumbnailPath,
      videoCodec: file.videoCodec,
      isLoadingMetadata: file.isLoadingMetadata,
    })

    const handleClick = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault()

        // Не воспроизводим видео если оно уже добавлено
        if (isAdded) {
          logger.debugSync(`[VideoPlaceholder] Skipping playback - file already added: ${file.name}`)
          return
        }

        try {
          // Устанавливаем видео в плеер (важно для локального fallback режима)
          setCurrentVideo(file)
          await playerSetSource("browser")
          await playerSetMedia(file.id, hoverTime || 0)
          logger.debugSync(`[VideoPlaceholder] Video sent to main player: ${file.name} at time ${hoverTime || 0}`)
        } catch (error) {
          logger.errorSync("[VideoPlaceholder] Failed to send video to main player:", { error })

          // Fallback: локальное воспроизведение
          const video = e.currentTarget.querySelector("video")
          if (!video) return

          const newPlayingState = !isPlaying

          if (newPlayingState) {
            video.play().catch((err: unknown) =>
              logger.errorSync("[VideoPlaceholder] Ошибка воспроизведения:", {
                err,
              }),
            )
          } else {
            video.pause()
          }

          setIsPlaying(newPlayingState)
          logger.debugSync(`[VideoPlaceholder] Fallback: Видео ${newPlayingState ? "запущено" : "остановлено"}`, {
            fileName: file.name,
          })
        }
      },
      [hoverTime, file, playerSetSource, playerSetMedia, setCurrentVideo, isPlaying, isAdded],
    )

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = percentage * (file.duration ?? 0)

        onHoverTimeChange(newTime)
        const video = e.currentTarget.querySelector("video")
        if (video && !isPlaying) {
          video.currentTime = newTime
          video.pause()
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

    const handleLoadedData = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      logger.debugSync("Video loaded (placeholder)")
      setIsLoaded(true)
      const video = e.currentTarget
      video.currentTime = 0
      video.pause()
    }, [])

    const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = e.currentTarget
      logger.debugSync(`[VideoPlaceholder] Metadata loaded: ${video.videoWidth}x${video.videoHeight}`)
      video.currentTime = 0
      video.pause()
    }, [])

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget
        if (video.error) {
          // MEDIA_ERR_SRC_NOT_SUPPORTED (код 4) - кодек не поддерживается браузером
          // Это ожидаемое поведение для H.265/HEVC видео с дронов - не спамим в консоль
          if (video.error.code === 4) {
            logger.debugSync(`[VideoPlaceholder] Кодек не поддерживается браузером: ${file.name} - используем превью`)
          } else {
            // Для других ошибок логируем подробно
            logger.errorSync("[VideoPlaceholder] Ошибка загрузки видео:")
            logger.errorSync(`  - Путь файла: ${file.path}`)
            logger.errorSync(`  - URL: ${video.src}`)
            logger.errorSync(`  - Код ошибки: ${video.error.code}`)
            logger.errorSync(`  - Сообщение: ${video.error.message}`)
          }

          // Устанавливаем флаг ошибки чтобы убрать "Загрузка..."
          setHasError(true)
        }
      },
      [file],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLVideoElement>) => {
        if (e.code === "Space") {
          e.preventDefault()
          const video = e.currentTarget
          const newPlayingState = !isPlaying

          if (newPlayingState) {
            video.play().catch((err: unknown) =>
              logger.errorSync("[VideoPlaceholder] Ошибка воспроизведения:", {
                err,
              }),
            )
          } else {
            video.pause()
          }

          setIsPlaying(newPlayingState)
        }
      },
      [isPlaying],
    )

    return (
      <div
        className={cn("relative shrink-0", isAdded && "pointer-events-none")}
        style={{
          height: `${size}px`,
          width: `${size * (16 / 9)}px`,
        }}
        data-oid="dnud_le"
      >
        <div
          className={cn(
            "group relative h-full w-full cursor-pointer bg-muted",
            isAdded && "opacity-50 grayscale cursor-not-allowed",
          )}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          data-oid="rxce.9w"
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
              data-oid="ik2bdzz"
            />
          )}

          <VideoElement
            file={file}
            videoUrl={videoUrl}
            previewData={previewData}
            isAdded={isAdded}
            isPlaying={isPlaying}
            onLoadedData={handleLoadedData}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onKeyDown={handleKeyDown}
            data-oid="wacev_-"
          />

          {/* Показываем имя файла и статус загрузки - всегда когда не полностью загружено */}
          {(!isLoaded || !previewData || file.isLoadingMetadata) && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 text-center"
              style={{ zIndex: 2 }}
              data-oid="5s1m.i2"
            >
              <div
                className="truncate px-2 text-sm text-foreground/90 font-medium"
                style={{ maxWidth: "90%" }}
                data-oid="x5nej6z"
              >
                {file.name}
              </div>
              {hasError ? (
                <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400" data-oid="ppwl-vx">
                  Ожидаем превью...
                </div>
              ) : file.isLoadingMetadata || (!previewData && !file.thumbnailPath) ? (
                <div className="mt-2 text-xs text-muted-foreground animate-pulse" data-oid="hl6129r">
                  Загрузка метаданных...
                </div>
              ) : !isLoaded ? (
                <div className="mt-2 text-xs text-muted-foreground animate-pulse" data-oid="abf2u6a">
                  Загрузка видео...
                </div>
              ) : null}
            </div>
          )}

          <VideoOverlays
            file={file}
            size={size}
            isLoaded={isLoaded}
            isMultipleStreams={false}
            hoverTime={hoverTime}
            data-oid="zc:oh8."
          />
        </div>
      </div>
    )
  },
)

VideoPlaceholder.displayName = "VideoPlaceholder"
