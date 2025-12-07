import { type MutableRefObject, memo } from "react"
import type { MediaFile } from "@/domains/media-management"
import { createThumbnailUrl } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("VideoElement")

interface VideoElementProps {
  file: MediaFile
  videoUrl: string
  previewData: string | null
  isAdded: boolean
  isPlaying: boolean
  videoRef?: MutableRefObject<HTMLVideoElement | null>
  onLoadedData?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  onError?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  onEnded?: () => void
  onPlay?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLVideoElement>) => void
  streamIndex?: number
  streamKey?: string
}

/**
 * Общий компонент для video элемента
 */
export const VideoElement = memo(
  ({
    file,
    videoUrl,
    previewData,
    // isAdded,
    videoRef,
    onLoadedData,
    onLoadedMetadata,
    onError,
    onEnded,
    onPlay,
    onTimeUpdate,
    onKeyDown,
    streamIndex,
    streamKey,
  }: VideoElementProps) => {
    const posterUrl = previewData
      ? `data:image/jpeg;base64,${previewData}`
      : file.thumbnailPath
        ? createThumbnailUrl(file.thumbnailPath)
        : undefined

    return (
      <video
        key={streamKey ? `video-${file.id}-${streamIndex}` : undefined}
        ref={
          videoRef
            ? (el) => {
                if (videoRef.current !== el) videoRef.current = el
              }
            : undefined
        }
        src={videoUrl || undefined}
        poster={posterUrl}
        preload="metadata"
        autoPlay={false}
        tabIndex={0}
        playsInline
        muted
        className="h-full w-full object-cover focus:outline-none"
        style={{
          transition: "opacity 0.2s ease-in-out",
          backgroundColor: "black",
          zIndex: 1,
          objectFit: "cover",
          visibility: "visible",
          display: "block",
          width: "100%",
          height: "100%",
          position: "relative",
        }}
        onLoadedData={onLoadedData}
        onLoadedMetadata={onLoadedMetadata}
        onError={onError}
        onEnded={onEnded}
        onPlay={onPlay}
        onTimeUpdate={onTimeUpdate}
        onKeyDown={onKeyDown}
      />
    )
  },
)

VideoElement.displayName = "VideoElement"
