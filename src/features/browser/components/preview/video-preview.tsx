import { useDraggable } from "@dnd-kit/core"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import type { MediaFile } from "@/domains/media-management"
import { useAutoProxy, useMediaPreview } from "@/domains/media-management"
import { getTrackTypeForMediaFile } from "@/features/timeline"
import type { DragData } from "@/features/timeline/types/drag-drop"
import { createVideoUrl, getPlaybackPath } from "@/lib/media-url-utils"
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
    const [proxyPath, setProxyPath] = useState<string | null>(null)
    // Используем Preview Manager для получения данных превью
    const { getPreviewData } = useMediaPreview()

    // Auto proxy для H.265 видео (генерация временно отключена)
    const { getProxyPath } = useAutoProxy()

    // Логируем codec информацию для отладки H.265 детекции
    useEffect(() => {
      logger.infoSync(`[VideoPreview] File loaded: ${file.name}`, {
        videoCodec: file.videoCodec,
        streamCodec: file.probeData?.streams?.find((s) => s.codec_type === "video")?.codec_name,
        hasProxy: !!file.proxy?.path,
        isVideo: file.isVideo,
      })
    }, [file.id, file.videoCodec, file.probeData?.streams, file.proxy?.path, file.isVideo, file.name])

    // Загружаем preview data при монтировании
    useEffect(() => {
      void getPreviewData(file.id).then((data) => {
        if (data?.browser_thumbnail?.base64_data) {
          setPreviewData(data.browser_thumbnail.base64_data)
        }
      })
    }, [file.id, getPreviewData])

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
    // Используем прокси путь если файл H.265/HEVC и прокси доступен (из file.proxy или локального состояния)
    const filePath = useMemo(() => {
      // Приоритет: локальный proxyPath > file.proxy?.path > оригинальный path
      if (proxyPath) return proxyPath
      return getPlaybackPath(file)
    }, [file.path, file.proxy?.path, file.videoCodec, file.probeData?.streams, proxyPath])

    // Эффект для загрузки прокси из кэша (генерация временно отключена)
    useEffect(() => {
      // Проверяем, есть ли уже прокси в кэше (используем file.path вместо file.id)
      const cachedProxy = getProxyPath(file.path)
      if (cachedProxy) {
        setProxyPath(cachedProxy)
      }
      // TODO: Генерация прокси временно отключена
      // if (proxyNeeded && !isGeneratingProxy) {
      //   void generateProxy(file)
      // }
    }, [file.path, getProxyPath])

    // Эффект для загрузки видео при монтировании компонента
    useEffect(() => {
      let isMounted = true

      logger.debugSync(`[VideoPreview] Attempting to load video from path: ${filePath}`)

      void checkFileAccess(filePath).then((hasAccess) => {
        logger.debugSync(`[VideoPreview] File access check result: ${hasAccess}`)
        if (!hasAccess) {
          logger.errorSync(`[VideoPreview] No access to file: ${filePath}`, {
            filePath,
          })
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
    }, [filePath, loadVideoFile, file.id, file.name])

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

    // Показываем плейсхолдер если метаданные ещё загружаются или потоки не найдены
    const showPlaceholder = file.isLoadingMetadata || videoData.videoStreams.length === 0

    return (
      <div
        ref={setNodeRef}
        className={cn("flex h-full w-full items-center justify-center relative", isDragging && "cursor-grabbing")}
        style={{
          ...style,
          minHeight: `${size}px`,
          minWidth: `${size * (16 / 9)}px`,
        }}
        {...(listeners && typeof listeners === "object" ? listeners : {})}
        {...(attributes && typeof attributes === "object" ? attributes : {})}
        data-oid="1lf:4-1"
      >
        {showPlaceholder ? (
          <VideoPlaceholder
            file={file}
            size={size}
            videoUrl={videoUrl}
            previewData={previewData}
            hoverTime={hoverTime}
            onHoverTimeChange={setHoverTime}
            data-oid="0jpd6my"
          />
        ) : videoData.videoStreams.length === 0 ? (
          // Fallback если нет потоков но не показываем placeholder
          <div
            className="flex items-center justify-center bg-red-900/20 border-2 border-red-500"
            style={{
              width: `${size * (16 / 9)}px`,
              height: `${size}px`,
            }}
            data-oid="93-ft__"
          >
            <div className="text-xs text-red-400 text-center px-2" data-oid="7zeem7-">
              No video streams found
              <br data-oid="4cp41qj" />
              {file.name}
            </div>
          </div>
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
              isLastStream={index === videoData.videoStreams.length - 1}
              data-oid="2yil8l0"
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
    const isSameProxy = prevProps.file.proxy?.path === nextProps.file.proxy?.path
    const isSameProps =
      prevProps.size === nextProps.size &&
      prevProps.showFileName === nextProps.showFileName &&
      prevProps.ignoreRatio === nextProps.ignoreRatio

    // Сравниваем количество потоков (главный индикатор изменения метаданных)
    const prevStreamsCount = prevProps.file.probeData?.streams?.length ?? 0
    const nextStreamsCount = nextProps.file.probeData?.streams?.length ?? 0
    const isSameStreamsCount = prevStreamsCount === nextStreamsCount

    const shouldSkipRender =
      !nextProps.file.isLoadingMetadata &&
      isSameStreamsCount &&
      isSameFile &&
      isSameProps &&
      isSameThumbnail &&
      isSameProxy

    if (!shouldSkipRender) {
      logger.debugSync(`[VideoPreview] Re-rendering ${nextProps.file.name}:`, {
        isSameFile,
        isSameMetadataState,
        isSameThumbnail,
        isSameProxy,
        isSameProps,
        isSameStreamsCount,
        isLoadingMetadata: nextProps.file.isLoadingMetadata,
      })
    }

    return shouldSkipRender
  },
)
