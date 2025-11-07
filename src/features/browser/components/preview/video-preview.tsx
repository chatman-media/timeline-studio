import { useDraggable } from "@dnd-kit/core"
import { Film } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMediaPreview } from "@/features/media/hooks/use-media-preview"
import type { FfprobeStream } from "@/features/media/types/ffprobe"
import type { MediaFile } from "@/features/media/types/media"
import { calculateAdaptiveWidth, calculateWidth, parseRotation } from "@/features/media/utils/video"
import { useResources } from "@/features/resources"
import type { TimelineResource } from "@/features/resources/types"
import type { DragData } from "@/features/timeline/types/drag-drop"
import { getTrackTypeForMediaFile } from "@/features/timeline/utils/drag-calculations"
import { usePlayer } from "@/features/video-player"
import { formatDuration } from "@/lib/date"
import { createLogger } from "@/lib/tauri-logger"
import { checkFileAccess, convertToAssetUrl, convertVideoSrc } from "@/lib/tauri-utils"
import { cn, formatResolution } from "@/lib/utils"
import { ApplyButton } from "../layout"
import { AddMediaButton } from "../layout/add-media-button"
import { FavoriteButton } from "../layout/favorite-button"

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
    const [isPlaying, setIsPlaying] = useState(false)
    const [hoverTime, setHoverTime] = useState<number | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)
    const [previewData, setPreviewData] = useState<string | null>(null)
    const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
    const { isAdded: isResourceAdded, removeResource } = useResources()
    const isAdded = isResourceAdded(file.id, "media")
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

    // Обработчик применения видео - теперь отправляем в главный плеер через backend
    const handleApplyVideo = useCallback(
      async (_resource: TimelineResource, _type: string) => {
        try {
          // Проверяем, что у файла есть id
          if (!file.id) {
            logger.errorSync("[VideoPreview] File has no id:", file)
            setPreviewMedia(file)
            return
          }

          // Устанавливаем плеер в режим браузера
          await playerSetSource("browser")

          // Устанавливаем медиа в плеер
          await playerSetMedia(file.id, 0)

          logger.debugSync(`[VideoPreview] Media sent to main player: ${file.name}`)
        } catch (error) {
          logger.errorSync("[VideoPreview] Failed to send media to player:", error)
          // Fallback к старому поведению
          setPreviewMedia(file)
        }
      },
      [file, playerSetSource, playerSetMedia, setPreviewMedia],
    )

    // Используем useRef для хранения времени последнего обновления
    const lastUpdateTimeRef = useRef(0)

    // Создаем стабильные ключи для рефов
    useEffect(() => {
      const videoStreams = file.probeData?.streams.filter((s) => s.codec_type === "video") ?? []
      videoStreams.forEach((stream) => {
        const key = stream.streamKey ?? `stream-${stream.index}`
        videoRefs.current[key] ??= null
      })
    }, [file.probeData?.streams])

    // Используем useRef для хранения hoverTime вместо useState
    // чтобы избежать ререндеров при движении мыши
    const hoverTimeRef = useRef<number | null>(null)

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

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>, stream: FfprobeStream) => {
        // Не обновляем состояние во время воспроизведения
        if (isPlaying) return

        const now = Date.now()
        // Ограничиваем обновления до 30 fps для производительности
        if (now - lastUpdateTimeRef.current < 33) return
        lastUpdateTimeRef.current = now

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const percentage = x / rect.width
        const newTime = percentage * (file.duration ?? 0)

        // Обновляем ref
        hoverTimeRef.current = newTime
        // Обновляем состояние с дебаунсингом
        setHoverTime(newTime)

        const key = stream.streamKey ?? `stream-${stream.index}`
        const videoRef = videoRefs.current[key]
        if (videoRef && !isPlaying) {
          videoRef.currentTime = newTime
          videoRef.pause() // Явно останавливаем после изменения currentTime
        }
      },
      [file.duration, isPlaying],
    )

    const handleMouseLeave = useCallback(() => {
      setHoverTime(null)
      // При уходе мыши останавливаем воспроизведение всех видео, кроме видео в шаблоне
      if (isPlaying) {
        setIsPlaying(false)
      }
    }, [isPlaying])

    // Функция handlePlayPause - теперь отправляем видео в главный плеер
    const handlePlayPause = useCallback(
      async (e: React.MouseEvent, stream: FfprobeStream) => {
        e.preventDefault()

        try {
          // Отправляем видео в главный плеер через backend
          await playerSetSource("browser")
          await playerSetMedia(file.id, hoverTime || 0)

          logger.debugSync(
            `[VideoPreview] Video sent to main player from preview: ${file.name} at time ${hoverTime || 0}`,
          )
        } catch (error) {
          logger.errorSync("[VideoPreview] Failed to send video to main player:", error)

          // Fallback: локальное воспроизведение в превью (старое поведение)
          const key = stream.streamKey ?? `stream-${stream.index}`
          const videoRef = videoRefs.current[key]
          if (!videoRef) return

          const newPlayingState = !isPlaying

          if (newPlayingState) {
            if (hoverTime !== null) {
              videoRef.currentTime = hoverTime
            }
            videoRef
              .play()
              .catch((err: unknown) => logger.errorSync("[VideoPreview] Ошибка воспроизведения в превью:", err))
          } else {
            videoRef.pause()
          }

          setIsPlaying(newPlayingState)
          logger.debugSync(
            `[VideoPreview] Fallback: Видео ${newPlayingState ? "запущено" : "остановлено"} в превью:`,
            file.name,
          )
        }
      },
      [hoverTime, file, playerSetSource, playerSetMedia, isPlaying],
    )

    // Состояние для хранения объекта URL
    const [videoUrl, setVideoUrl] = useState<string>("")

    // Мемоизируем URL, чтобы он не менялся без необходимости
    const memoizedVideoUrl = useMemo(() => videoUrl, [videoUrl])

    // Функция для получения URL видео без загрузки в память
    const loadVideoFile = useCallback(async (path: string) => {
      if (typeof window !== "undefined") {
        const windowWithTauri = window as any
        const hasTauri = windowWithTauri.__TAURI__ !== undefined
        const hasTauriInternals = windowWithTauri.__TAURI_INTERNALS__ !== undefined
        logger.debugSync("[VideoPreview] Tauri environment check:", {
          hasTauri,
          hasTauriInternals,
          isTauriEnv: hasTauri || hasTauriInternals,
        })
      }

      // Используем file:// протокол для видео через convertVideoSrc
      const videoUrl = convertVideoSrc(path)
      logger.debugSync("[VideoPreview] Converting path:")
      logger.debugSync(`  Original: ${path}`)
      logger.debugSync(`  Video URL: ${videoUrl}`)
      logger.debugSync(`  URL starts with asset://: ${videoUrl.startsWith("asset://")}`)
      return videoUrl
    }, [])

    // Мемоизируем путь к файлу для предотвращения лишних перезагрузок
    const filePath = useMemo(() => file.path, [file.path])

    // Эффект для загрузки видео при монтировании компонента
    useEffect(() => {
      let isMounted = true

      logger.debugSync(`[VideoPreview] Attempting to load video from path: ${filePath}`)

      // Проверяем доступ к файлу через Tauri API
      void checkFileAccess(filePath).then((hasAccess) => {
        logger.debugSync(`[VideoPreview] File access check result: ${hasAccess}`)
        if (!hasAccess) {
          logger.errorSync(`[VideoPreview] No access to file: ${filePath}`)
          // Попробуем загрузить все равно, может проблема в проверке доступа
        }

        void loadVideoFile(filePath).then((url) => {
          if (isMounted) {
            logger.debugSync(`[VideoPreview] Video URL generated: ${url}`)
            logger.debugSync(`[VideoPreview] URL protocol: ${url.split(":")[0]}`)
            setVideoUrl(url)
          }
        })
      })

      // Очистка при размонтировании компонента
      return () => {
        isMounted = false
      }
    }, [filePath, loadVideoFile]) // Используем мемоизированный путь

    // Оптимизируем вычисления с помощью useMemo
    const videoData = useMemo(() => {
      const videoStreams = file.probeData?.streams.filter((s) => s.codec_type === "video") ?? []
      const isMultipleStreams = videoStreams.length > 1

      return { videoStreams, isMultipleStreams }
    }, [file.probeData?.streams])

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
          // Плейсхолдер с соотношением 16:9 пока метаданные не загрузились
          <div
            className="relative flex-shrink-0"
            style={{
              height: `${size}px`,
              width: `${size * (16 / 9)}px`,
            }}
          >
            <div
              className="group relative h-full w-full cursor-pointer"
              style={{ backgroundColor: "#1a1a1a" }}
              onClick={async (e) => {
                e.preventDefault()

                try {
                  // Отправляем видео в главный плеер
                  await playerSetSource("browser")
                  await playerSetMedia(file.id, hoverTime || 0)

                  logger.debugSync(
                    `[VideoPreview] Video sent to main player from placeholder: ${file.name} at time ${hoverTime || 0}`,
                  )
                } catch (error) {
                  logger.errorSync("[VideoPreview] Failed to send video to main player from placeholder:", error)

                  // Fallback: локальное воспроизведение
                  const video = e.currentTarget.querySelector("video")
                  if (!video) return

                  const newPlayingState = !isPlaying

                  if (newPlayingState) {
                    video
                      .play()
                      .catch((err: unknown) => logger.errorSync("[VideoPreview] Ошибка воспроизведения:", err))
                  } else {
                    video.pause()
                  }

                  setIsPlaying(newPlayingState)
                  logger.debugSync(
                    `[VideoPreview] Fallback: Видео ${newPlayingState ? "запущено" : "остановлено"} в плейсхолдере:`,
                    file.name,
                  )
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = x / rect.width
                const newTime = percentage * (file.duration ?? 0)

                setHoverTime(newTime)
                const video = e.currentTarget.querySelector("video")
                if (video && !isPlaying) {
                  video.currentTime = newTime
                  video.pause() // Явно останавливаем после изменения currentTime
                }
              }}
              onMouseLeave={() => {
                setHoverTime(null)
                if (isPlaying) {
                  setIsPlaying(false)
                }
              }}
            >
              <video
                src={videoUrl || undefined}
                poster={
                  previewData
                    ? `data:image/jpeg;base64,${previewData}`
                    : file.thumbnailPath
                      ? convertToAssetUrl(file.thumbnailPath)
                      : undefined
                }
                preload="metadata"
                autoPlay={false}
                muted
                tabIndex={0}
                playsInline
                className={cn("h-full w-full object-cover focus:outline-none", isAdded ? "opacity-50" : "opacity-100")}
                style={{
                  transition: "opacity 0.2s ease-in-out",
                  backgroundColor: "black",
                  zIndex: 1,
                  objectFit: "cover",
                  visibility: "visible",
                  display: "block",
                }}
                onLoadedData={(e) => {
                  logger.debugSync("Video loaded (placeholder)")
                  setIsLoaded(true)
                  // Устанавливаем на первый кадр и останавливаем автопроигрывание
                  const video = e.currentTarget as HTMLVideoElement
                  video.currentTime = 0
                  video.pause()
                }}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget as HTMLVideoElement
                  logger.debugSync(`[VideoPreview] Metadata loaded: ${video.videoWidth}x${video.videoHeight}`)
                  // Устанавливаем на первый кадр и останавливаем
                  video.currentTime = 0
                  video.pause()
                }}
                onLoadStart={() => {
                  logger.debugSync("[VideoPreview] Load start for placeholder")
                }}
                onCanPlayThrough={() => {
                  logger.debugSync("[VideoPreview] Can play through for placeholder")
                }}
                onKeyDown={(e) => {
                  if (e.code === "Space") {
                    e.preventDefault()
                    const video = e.currentTarget as HTMLVideoElement
                    const newPlayingState = !isPlaying

                    if (newPlayingState) {
                      video
                        .play()
                        .catch((err: unknown) => logger.errorSync("[VideoPreview] Ошибка воспроизведения:", err))
                    } else {
                      video.pause()
                    }

                    setIsPlaying(newPlayingState)
                  }
                }}
                onError={(e) => {
                  const video = e.currentTarget as HTMLVideoElement
                  if (video.error) {
                    logger.errorSync("[VideoPreview Placeholder] Ошибка загрузки видео:")
                    logger.errorSync(`  - Путь файла: ${file.path}`)
                    logger.errorSync(`  - URL: ${video.src}`)
                    logger.errorSync(`  - Код ошибки: ${video.error.code}`)
                    logger.errorSync(`  - Сообщение: ${video.error.message}`)

                    // Автоматически удаляем файл из проекта при ошибке 4 (файл не найден или не поддерживается)
                    if (video.error.code === 4) {
                      logger.debugSync(
                        `[VideoPreview Placeholder] Автоматическое удаление файла из проекта: ${file.name}`,
                      )
                      void removeResource(file.id, "media")
                      return // Прекращаем дальнейшую обработку
                    }
                  }
                }}
              />

              {/* Иконка видео для плейсхолдера */}
              <div
                className={cn(
                  "pointer-events-none absolute rounded-xs bg-black/60 p-0.5",
                  size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5",
                )}
                style={{
                  color: "#ffffff",
                  zIndex: 10,
                }}
              >
                <Film size={size > 100 ? 16 : 12} />
              </div>

              {/* Продолжительность видео для плейсхолдера */}
              {file.duration && file.duration > 0 && (
                <div
                  className={cn(
                    "pointer-events-none absolute rounded-xs bg-black/60 text-xs leading-[16px]",
                    size > 100 ? "top-1 right-1 px-[4px] py-[2px]" : "top-0.5 right-0.5 px-[2px] py-0",
                  )}
                  style={{
                    fontSize: size > 100 ? "13px" : "11px",
                    color: "#ffffff",
                    zIndex: 20,
                  }}
                >
                  {formatDuration(file.duration, 0, true)}
                </div>
              )}

              {/* Кнопка избранного для плейсхолдера */}
              <FavoriteButton file={file} size={size} type="media" />

              {/* Кнопка добавления для плейсхолдера */}
              <AddMediaButton resource={{ id: file.id, type: "media" } as TimelineResource} size={size} type="media" />
            </div>
          </div>
        ) : (
          videoData.videoStreams.map((stream: FfprobeStream) => {
            const key = stream.streamKey ?? `stream-${stream.index}`
            const isMultipleStreams = videoData.isMultipleStreams

            // Используем размеры из метаданных или значения по умолчанию для 16:9
            const videoWidth = stream.width || 1920
            const videoHeight = stream.height || 1080

            const width = calculateWidth(videoWidth, videoHeight, size, parseRotation(stream.rotation))

            const adptivedWidth = calculateAdaptiveWidth(
              width,
              isMultipleStreams,
              stream.display_aspect_ratio || "16:9",
            )

            // Используем соотношение сторон из метаданных или 16:9 по умолчанию
            const aspectRatio = stream.display_aspect_ratio?.split(":").map(Number) ?? [16, 9]
            const ratio = aspectRatio[0] / aspectRatio[1]

            return (
              <div
                key={key}
                className="relative flex-shrink-0"
                style={{
                  height: `${size}px`,
                  width:
                    ratio > 1
                      ? ignoreRatio
                        ? width
                        : adptivedWidth
                      : isMultipleStreams && ignoreRatio
                        ? width
                        : adptivedWidth,
                }}
              >
                <div
                  className="group relative h-full w-full overflow-hidden"
                  onMouseMove={(e) => handleMouseMove(e, stream)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => handlePlayPause(e, stream)}
                  style={{ backgroundColor: "#1a1a1a" }}
                >
                  <video
                    key={`video-${file.id}-${stream.index}`}
                    ref={(el) => {
                      if (el && videoRefs.current[key] !== el) {
                        videoRefs.current[key] = el
                      }
                    }}
                    src={memoizedVideoUrl || undefined}
                    poster={
                      previewData
                        ? `data:image/jpeg;base64,${previewData}`
                        : file.thumbnailPath
                          ? convertToAssetUrl(file.thumbnailPath)
                          : undefined
                    }
                    preload="metadata"
                    autoPlay={false}
                    tabIndex={0}
                    playsInline
                    muted
                    className={cn("h-full w-full object-cover focus:outline-none", isAdded ? "opacity-50" : "")}
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
                    onEnded={() => {
                      logger.debugSync("Video ended for stream:", stream.index)
                      setIsPlaying(false)
                    }}
                    onPlay={(e) => {
                      logger.debugSync("Video playing for stream:", stream.index)
                      const video = e.currentTarget
                      const currentTime = hoverTime
                      if (currentTime !== null) {
                        video.currentTime = currentTime
                      }
                    }}
                    onTimeUpdate={(e) => {
                      // Обновляем только каждые 500 мс вместо случайного выбора
                      const now = Date.now()
                      if (now - lastUpdateTimeRef.current > 500) {
                        lastUpdateTimeRef.current = now
                        logger.debugSync(
                          "Time update for stream:",
                          typeof stream.index !== "undefined" ? stream.index : key,
                          "current time:",
                          e.currentTarget.currentTime.toFixed(2),
                        )
                      }
                    }}
                    onError={(e) => {
                      logger.debugSync(
                        "Video error for stream:",
                        typeof stream.index !== "undefined" ? stream.index : key,
                        e,
                      )

                      // Получаем элемент видео
                      const video = e.currentTarget as HTMLVideoElement

                      // Проверяем, какая ошибка произошла
                      if (video.error) {
                        logger.errorSync(
                          "[VideoPreview] Ошибка загрузки видео:",
                          video.error.code,
                          video.error.message,
                          "для файла:",
                          file.name,
                          "URL:",
                          video.src,
                        )

                        // Дополнительная диагностика
                        logger.errorSync("[VideoPreview] Детали ошибки:")
                        logger.errorSync(`  - Путь файла: ${file.path}`)
                        logger.errorSync(`  - Сгенерированный URL: ${videoUrl}`)
                        logger.errorSync(`  - Код ошибки: ${video.error.code}`)
                        logger.errorSync("  - MEDIA_ERR_ABORTED (1): Загрузка прервана пользователем")
                        logger.errorSync("  - MEDIA_ERR_NETWORK (2): Сетевая ошибка")
                        logger.errorSync("  - MEDIA_ERR_DECODE (3): Ошибка декодирования")
                        logger.errorSync(
                          "  - MEDIA_ERR_SRC_NOT_SUPPORTED (4): Формат не поддерживается или URL недоступен",
                        )

                        // Автоматически удаляем файл из проекта при ошибке 4 (файл не найден или не поддерживается)
                        if (video.error.code === 4) {
                          logger.debugSync(`[VideoPreview] Автоматическое удаление файла из проекта: ${file.name}`)
                          void removeResource(file.id, "media")
                          return // Прекращаем дальнейшую обработку
                        }

                        // Попробуем альтернативный подход для видео
                        if (video.error.code === 4 && videoUrl && videoUrl.includes("asset.localhost")) {
                          logger.debugSync("[VideoPreview] Trying alternative approach...")
                          // Попробуем использовать прямой путь к файлу (только для диагностики)
                          const testUrl = `http://localhost:3000/api/video?path=${encodeURIComponent(file.path)}`
                          logger.debugSync("[VideoPreview] Test URL:", testUrl)
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.code === "Space") {
                        e.preventDefault()
                        void handlePlayPause(e as unknown as React.MouseEvent, stream)
                      }
                    }}
                    onLoadedData={(e) => {
                      logger.debugSync(
                        "Video loaded for stream:",
                        typeof stream.index !== "undefined" ? stream.index : key,
                      )
                      setIsLoaded(true)

                      // Устанавливаем на первый кадр и останавливаем
                      const video = e.currentTarget as HTMLVideoElement
                      video.currentTime = 0
                      video.pause()

                      // Отладочная информация
                      logger.debugSync(`[VideoPreview] Video dimensions: ${video.videoWidth}x${video.videoHeight}`)
                      logger.debugSync(`[VideoPreview] Video src: ${video.src}`)
                      logger.debugSync(`[VideoPreview] Video visibility: ${getComputedStyle(video).visibility}`)
                      logger.debugSync(`[VideoPreview] Video display: ${getComputedStyle(video).display}`)

                      // Проверяем, есть ли у файла probeData и streams
                      if (!file.probeData?.streams || file.probeData.streams.length === 0) {
                        logger.debugSync("No streams found in probeData for file:", file.name)
                      }
                    }}
                    onLoadedMetadata={(e) => {
                      // Устанавливаем на первый кадр при загрузке метаданных
                      const video = e.currentTarget as HTMLVideoElement
                      video.currentTime = 0
                      video.pause()
                    }}
                  />

                  {/* Продолжительность видео */}
                  {file.duration &&
                    file.duration > 0 &&
                    !(isMultipleStreams && typeof stream.index !== "undefined" && stream.index !== 0) && (
                      <div
                        className={cn(
                          "pointer-events-none absolute rounded-xs bg-black/60 text-xs leading-[16px]",
                          size > 100 ? "top-1 right-1 px-[4px] py-[2px]" : "top-0.5 right-0.5 px-[2px] py-0",
                        )}
                        style={{
                          fontSize: size > 100 ? "13px" : "11px",
                          color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
                          zIndex: 20,
                        }}
                      >
                        {formatDuration(file.duration, 0, true)}
                      </div>
                    )}

                  {/* Иконка видео */}
                  {!(isMultipleStreams && typeof stream.index !== "undefined" && stream.index !== 0) && (
                    <div
                      className={cn(
                        "pointer-events-none absolute rounded-xs bg-black/60 p-0.5",
                        size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5",
                      )}
                      style={{
                        color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
                        zIndex: 10,
                      }}
                    >
                      <Film size={size > 100 ? 16 : 12} />
                    </div>
                  )}

                  {/* Кнопка избранного */}
                  {!(isMultipleStreams && typeof stream.index !== "undefined" && stream.index !== 0) && (
                    <FavoriteButton file={file} size={size} type="media" />
                  )}

                  {/* Разрешение видео */}
                  {isLoaded && !(isMultipleStreams && typeof stream.index !== "undefined" && stream.index !== 0) && (
                    <div
                      className={`pointer-events-none absolute ${
                        size > 100 ? "left-[28px]" : "left-[22px]"
                      } rounded-xs bg-black/60 text-xs leading-[16px] ${size > 100 ? "bottom-1" : "bottom-0.5"} ${
                        size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                      }`}
                      style={{
                        fontSize: size > 100 ? "13px" : "11px",
                        color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
                        zIndex: 20,
                      }}
                    >
                      {formatResolution(stream.width ?? 0, stream.height ?? 0)}
                    </div>
                  )}

                  {/* Имя файла */}
                  {showFileName &&
                    !(isMultipleStreams && typeof stream.index !== "undefined" && stream.index !== 0) && (
                      <div
                        className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${
                          size > 100 ? "left-1" : "left-0.5"
                        } ${
                          size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
                        } line-clamp-1 rounded-xs bg-black/60 text-xs leading-[16px] ${isMultipleStreams ? "max-w-[100%]" : "max-w-[60%]"}`}
                        style={{
                          fontSize: size > 100 ? "12px" : "11px",
                          color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
                          zIndex: 10,
                        }}
                      >
                        {file.name}
                      </div>
                    )}

                  <ApplyButton
                    resource={{ id: file.id, type: "media" } as TimelineResource}
                    size={size}
                    type="media"
                    onApply={handleApplyVideo}
                  />

                  {/* Кнопка добавления */}
                  {isLoaded &&
                    typeof stream.index !== "undefined" &&
                    stream.index ===
                      (file.probeData?.streams.filter((s) => s.codec_type === "video").length ?? 0) - 1 && (
                      <AddMediaButton
                        resource={{ id: file.id, type: "media", name: file.name } as TimelineResource}
                        size={size}
                        type="media"
                      />
                    )}
                </div>
              </div>
            )
          })
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
