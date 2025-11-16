import { memo, useCallback, useState } from "react"
import type { MediaFile } from "@/features/media/types/media"
import { useResources } from "@/features/resources"
import { usePlayer } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"
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
    const { playerSetSource, playerSetMedia } = usePlayer()
    const { isAdded: isResourceAdded, removeResource } = useResources()
    const isAdded = isResourceAdded(file.id, "media")

    const handleClick = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault()

        // Не воспроизводим видео если оно уже добавлено
        if (isAdded) {
          logger.debugSync(`[VideoPlaceholder] Skipping playback - file already added: ${file.name}`)
          return
        }

        try {
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
      [hoverTime, file, playerSetSource, playerSetMedia, isPlaying, isAdded],
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
          logger.errorSync("[VideoPlaceholder] Ошибка загрузки видео:")
          logger.errorSync(`  - Путь файла: ${file.path}`)
          logger.errorSync(`  - URL: ${video.src}`)
          logger.errorSync(`  - Код ошибки: ${video.error.code}`)
          logger.errorSync(`  - Сообщение: ${video.error.message}`)

          if (video.error.code === 4) {
            logger.debugSync(`[VideoPlaceholder] Автоматическое удаление файла из проекта: ${file.name}`)
            void removeResource(file.id, "media")
          }
        }
      },
      [file, removeResource],
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
        className="relative shrink-0"
        style={{
          height: `${size}px`,
          width: `${size * (16 / 9)}px`,
        }}
      >
        <div
          className="group relative h-full w-full cursor-pointer"
          style={{ backgroundColor: "#1a1a1a" }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
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
          />

          <VideoOverlays file={file} size={size} isLoaded={isLoaded} isMultipleStreams={false} />
        </div>
      </div>
    )
  },
)

VideoPlaceholder.displayName = "VideoPlaceholder"
