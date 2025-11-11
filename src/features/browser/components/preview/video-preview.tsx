import { useDraggable } from "@dnd-kit/core"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useMediaPreview } from "@/features/media/hooks/use-media-preview"
import type { MediaFile } from "@/features/media/types/media"
import type { TimelineResource } from "@/features/resources/types"
import type { DragData } from "@/features/timeline/types/drag-drop"
import { getTrackTypeForMediaFile } from "@/features/timeline/utils/drag-calculations"
import { usePlayer } from "@/features/video-player"
import { createVideoUrl } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"
import { checkFileAccess } from "@/lib/tauri-utils"
import { cn } from "@/lib/utils"
import { VideoPlaceholder } from "./video-placeholder"
import { VideoStream } from "./video-stream"

const logger = createLogger("VideoPreview")

interface VideoPreviewProps {
  file: MediaFile
  size?: number
  showFileName?: boolean
  dimensions?: [number, number]
  ignoreRatio?: boolean
}

/**
 * Предварительный просмотр видеофайла
 *
 * Функционал:
 * - Отображает превью видеофайла с поддержкой ленивой загрузки
 * - Адаптивный размер контейнера с соотношением сторон 16:9
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла (по умолчанию false)
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 * @param ignoreRatio - Флаг для игнорирования соотношения сторон (по умолчанию false)
 */
export const VideoPreview = memo(
  function VideoPreview({ file, size = 150, showFileName = false, ignoreRatio = false }: VideoPreviewProps) {
    const [hoverTime, setHoverTime] = useState<number | null>(null)
    const [previewData, setPreviewData] = useState<string | null>(null)
    const [videoUrl, setVideoUrl] = useState<string>("")
    const { setPreviewMedia, playerSetSource, playerSetMedia } = usePlayer()

    // Используем Preview Manager для получения данных превью
    const { getPreviewData } = useMediaPreview()

    // Загружаем preview data при монтировании
    useEffect(() => {
      void getPreviewData(file.id).then((data) => {
        if (data?.browser_thumbnail?.base64_data) {
          setPreviewData(data.browser_thumbnail.base64_data)
        }
      })
    }, [file.id, getPreviewData])

    // Обработчик применения видео - отправляем в главный плеер через backend
    const handleApplyVideo = useCallback(
      async (_resource: TimelineResource, _type: string) => {
        try {
          if (!file.id) {
            logger.errorSync("[VideoPreview] File has no id:", { file })
            setPreviewMedia(file)
            return
          }

          await playerSetSource("browser")
          await playerSetMedia(file.id, 0)

          logger.debugSync(`[VideoPreview] Media sent to main player: ${file.name}`)
        } catch (error) {
          logger.errorSync("[VideoPreview] Failed to send media to player:", { error })
          setPreviewMedia(file)
        }
      },
      [file, playerSetSource, playerSetMedia, setPreviewMedia],
    )

    // Функция для получения URL видео
    const loadVideoFile = useCallback(async (path: string) => {
      const videoUrl = createVideoUrl(path)
      logger.debugSync("[VideoPreview] Created video URL", {
        original: path,
        videoUrl,
        isAsset: videoUrl.startsWith("asset://"),
      })
      return videoUrl
    }, [])

    // Мемоизируем путь к файлу для предотвращения лишних перезагрузок
    const filePath = useMemo(() => file.path, [file.path])

    // Эффект для загрузки видео при монтировании компонента
    useEffect(() => {
      let isMounted = true

      logger.debugSync(`[VideoPreview] Attempting to load video from path: ${filePath}`)

      void checkFileAccess(filePath).then((hasAccess) => {
        logger.debugSync(`[VideoPreview] File access check result: ${hasAccess}`)
        if (!hasAccess) {
          logger.errorSync(`[VideoPreview] No access to file: ${filePath}`, { filePath })
        }

        void loadVideoFile(filePath).then((url) => {
          if (isMounted) {
            logger.debugSync(`[VideoPreview] Video URL generated: ${url}`)
            setVideoUrl(url)
          }
        })
      })

      return () => {
        isMounted = false
      }
    }, [filePath, loadVideoFile])

    // Оптимизируем вычисления с помощью useMemo
    const videoData = useMemo(() => {
      const videoStreams = file.probeData?.streams.filter((s) => s.codec_type === "video") ?? []
      const isMultipleStreams = videoStreams.length > 1

      return { videoStreams, isMultipleStreams }
    }, [file.probeData?.streams])

    // Setup draggable functionality
    const dragData: DragData = useMemo(
      () => ({
        type:
          getTrackTypeForMediaFile(file) === "video"
            ? "video"
            : getTrackTypeForMediaFile(file) === "audio"
              ? "audio"
              : "image",
        mediaFile: file,
      }),
      [file],
    )

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `video-${file.id}`,
      data: dragData,
    })

    // Transform style for drag feedback
    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
        }
      : undefined

    return (
      <div
        ref={setNodeRef}
        className={cn("flex h-full w-full items-center justify-center", isDragging && "cursor-grabbing")}
        style={style}
        {...(listeners && typeof listeners === "object" ? listeners : {})}
        {...(attributes && typeof attributes === "object" ? attributes : {})}
      >
        {videoData.videoStreams.length === 0 ? (
          <VideoPlaceholder
            file={file}
            size={size}
            videoUrl={videoUrl}
            previewData={previewData}
            hoverTime={hoverTime}
            onHoverTimeChange={setHoverTime}
          />
        ) : (
          videoData.videoStreams.map((stream, index) => (
            <VideoStream
              key={stream.streamKey ?? `stream-${stream.index}`}
              file={file}
              stream={stream}
              size={size}
              videoUrl={videoUrl}
              previewData={previewData}
              isMultipleStreams={videoData.isMultipleStreams}
              ignoreRatio={ignoreRatio}
              showFileName={showFileName}
              hoverTime={hoverTime}
              onHoverTimeChange={setHoverTime}
              onApply={handleApplyVideo}
              isLastStream={index === videoData.videoStreams.length - 1}
            />
          ))
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Сравниваем только важные свойства для предотвращения лишних перерендеров
    const isSameFile = prevProps.file.path === nextProps.file.path
    const isSameMetadataState = prevProps.file.isLoadingMetadata === nextProps.file.isLoadingMetadata
    const isSameThumbnail = prevProps.file.thumbnailPath === nextProps.file.thumbnailPath
    const isSameProps =
      prevProps.size === nextProps.size &&
      prevProps.showFileName === nextProps.showFileName &&
      prevProps.ignoreRatio === nextProps.ignoreRatio

    // Сравниваем количество потоков (главный индикатор изменения метаданных)
    const prevStreamsCount = prevProps.file.probeData?.streams?.length ?? 0
    const nextStreamsCount = nextProps.file.probeData?.streams?.length ?? 0
    const isSameStreamsCount = prevStreamsCount === nextStreamsCount

    const shouldSkipRender =
      !nextProps.file.isLoadingMetadata && isSameStreamsCount && isSameFile && isSameProps && isSameThumbnail

    if (!shouldSkipRender) {
      logger.debugSync(`[VideoPreview] Re-rendering ${nextProps.file.name}:`, {
        isSameFile,
        isSameMetadataState,
        isSameThumbnail,
        isSameProps,
        isSameStreamsCount,
        isLoadingMetadata: nextProps.file.isLoadingMetadata,
      })
    }

    return shouldSkipRender
  },
)
