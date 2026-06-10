import { useDraggable } from "@dnd-kit/core"
import { Music } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LiveAudioVisualizer } from "react-audio-visualize"

import type { MediaFile, TimelineResource } from "@timeline-studio/core/types"
import type { DragData } from "@/features/timeline/types/drag-drop"
import { createAudioUrl } from "@/lib/media-url-utils"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"

import { AddMediaButton } from "../layout/add-media-button"
import { ApplyButton } from "../layout/apply-button"
import { FavoriteButton } from "../layout/favorite-button"

const logger = createLogger("AudioPreview")

interface AudioPreviewProps {
  file: MediaFile
  size?: number
  showFileName?: boolean
  dimensions?: [number, number]
}

/**
 * Предварительный просмотр аудиофайла
 *
 * Функционал:
 * - Отображает превью аудиофайла с поддержкой ленивой загрузки
 * - Адаптивный размер контейнера с соотношением сторон 16:9
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const AudioPreview = memo(function AudioPreview({
  file,
  size = 60,
  showFileName = false,
  dimensions = [16, 9],
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = x / rect.width
      const newTime = percentage * (file.duration ?? 0)
      setHoverTime(newTime)

      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
    },
    [file.duration],
  )

  const handlePlayPause = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      logger.debugSync("Клик по аудио для воспроизведения/паузы", {
        fileName: file.name,
        isPlaying,
        hoverTime,
      })

      // Локальное воспроизведение превью (не отправляем в плеер)
      if (!audioRef.current) return

      if (isPlaying) {
        audioRef.current.pause()
        logger.debugSync("Аудио на паузе", { fileName: file.name })
      } else {
        if (hoverTime !== null) {
          audioRef.current.currentTime = hoverTime
        }
        void audioRef.current.play()
        logger.debugSync("Аудио воспроизводится", {
          fileName: file.name,
          time: hoverTime,
        })
      }
      setIsPlaying(!isPlaying)
    },
    [hoverTime, file.name, isPlaying],
  )

  const handleMouseLeave = useCallback(() => {
    setHoverTime(null)
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [isPlaying])

  // Состояние для хранения объекта URL
  const [audioUrl, setAudioUrl] = useState<string>("")

  // Функция для получения URL аудио без загрузки в память
  const loadAudioFile = useCallback(async (path: string) => {
    // Используем унифицированную утилиту для создания audio URL
    const audioUrl = createAudioUrl(path)
    logger.debugSync("[AudioPreview] Created audio URL", {
      original: path,
      audioUrl,
      isAsset: audioUrl.startsWith("asset://"),
    })
    return audioUrl
  }, [])

  // Эффект для загрузки аудио при монтировании компонента
  useEffect(() => {
    let isMounted = true
    logger.debugSync("Монтирование AudioPreview", {
      fileName: file.name,
      filePath: file.path,
    })

    void loadAudioFile(file.path).then((url) => {
      if (isMounted) {
        setAudioUrl(url)
        logger.debugSync("URL аудио установлен", { url, fileName: file.name })
      }
    })

    // Cleanup при размонтировании компонента
    return () => {
      isMounted = false
      logger.debugSync("Размонтирование AudioPreview", { fileName: file.name })
    }
  }, [file.path, file.name, loadAudioFile])

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) {
      logger.debugSync("AudioElement не доступен для инициализации AudioContext", { fileName: file.name })
      return
    }

    const initAudioContext = () => {
      try {
        logger.debugSync("Инициализация AudioContext", { fileName: file.name })
        audioContextRef.current ??= new AudioContext()

        const audioContext = audioContextRef.current
        logger.debugSync("AudioContext создан/получен", {
          fileName: file.name,
          state: audioContext.state,
          sampleRate: audioContext.sampleRate,
        })

        sourceRef.current ??= audioContext.createMediaElementSource(audioElement)
        logger.debugSync("MediaElementSource создан", { fileName: file.name })

        const destination = audioContext.createMediaStreamDestination()
        sourceRef.current.connect(destination)
        sourceRef.current.connect(audioContext.destination)
        logger.debugSync("Audio nodes connected", { fileName: file.name })

        const recorder = new MediaRecorder(destination.stream)
        mediaRecorderRef.current = recorder
        setMediaRecorder(recorder)
        recorder.start()
        logger.infoSync("MediaRecorder запущен для визуализации", {
          fileName: file.name,
        })
      } catch (error) {
        logger.errorSync("Ошибка инициализации AudioContext", {
          error: String(error),
          fileName: file.name,
        })
      }
    }

    setTimeout(initAudioContext, 100)

    return () => {
      logger.debugSync("Очистка AudioContext и MediaRecorder", {
        fileName: file.name,
      })
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
        logger.debugSync("MediaRecorder остановлен", { fileName: file.name })
        mediaRecorderRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        logger.debugSync("Audio source disconnected", { fileName: file.name })
        sourceRef.current = null
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close()
        logger.debugSync("AudioContext closed", { fileName: file.name })
        audioContextRef.current = null
      }
    }
  }, [file.name])

  const containerWidth = (size * dimensions[0]) / dimensions[1]

  // Setup draggable functionality
  const dragData: DragData = useMemo(
    () => ({
      type: "audio",
      mediaFile: file,
    }),
    [file],
  )

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `audio-${file.id}`,
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
      className={cn("flex flex-col shrink-0", isDragging && "cursor-grabbing")}
      style={{
        width: `${containerWidth}px`,
        ...style,
      }}
      {...(listeners && typeof listeners === "object" ? listeners : {})}
      {...(attributes && typeof attributes === "object" ? attributes : {})}
      data-oid="k6lrzv0"
    >
      <div
        className="group relative"
        style={{ height: `${size}px` }}
        onMouseMove={handleMouseMove}
        onClick={handlePlayPause}
        onMouseLeave={handleMouseLeave}
        data-oid="audio-container"
      >
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          preload="metadata"
          tabIndex={0}
          className="pointer-events-none absolute inset-0 h-full w-full focus:outline-none"
          onEnded={() => {
            setIsPlaying(false)
            logger.debugSync("Воспроизведение аудио завершено", {
              fileName: file.name,
            })
          }}
          onLoadedMetadata={() => {
            setIsLoaded(true)
            logger.infoSync("Метаданные аудио загружены", {
              fileName: file.name,
            })
          }}
          onError={(e) => {
            const audio = e.currentTarget as HTMLAudioElement
            const errorInfo = {
              fileName: file.name,
              src: audio.src,
              error: audio.error
                ? {
                    code: audio.error.code,
                    message: audio.error.message,
                  }
                : null,
            }
            logger.errorSync("Ошибка загрузки аудио", errorInfo)
          }}
          onKeyDown={(e) => {
            if (e.code === "Space") {
              e.preventDefault()
              void handlePlayPause(e as unknown as React.MouseEvent)
            }
          }}
          data-oid="xde3.6:"
        />

        {/* Иконка музыки */}
        <div
          className={`absolute ${size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5"} cursor-pointer rounded-xs bg-black/50 p-0.5`}
          style={{
            color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
          }}
          data-oid="thcn:xd"
        >
          <Music size={size > 100 ? 16 : 12} data-oid="bzpm79s" />
        </div>

        {/* Кнопка избранного */}
        <FavoriteButton file={file} size={size} type="media" data-oid="hdcvap5" />

        {/* Кнопка отправки в плеер */}
        {isLoaded && <ApplyButton file={file} size={size} hoverTime={hoverTime} data-oid="apply-audio" />}

        {/* кнопка добавления */}
        {isLoaded && (
          <AddMediaButton
            resource={
              {
                id: file.id,
                type: "media",
                file,
              } as TimelineResource
            }
            size={size}
            type="media"
            data-oid="equb..1"
          />
        )}

        {/* Аудио визуализация */}
        <div
          className="pointer-events-none absolute top-0 right-0 left-0 select-none"
          style={{
            height: `${size}px`,
            width: `${containerWidth}px`,
          }}
          data-oid="_nseu0q"
        >
          {mediaRecorder && (
            <LiveAudioVisualizer
              mediaRecorder={mediaRecorder}
              width={containerWidth}
              height={size}
              barWidth={1}
              gap={0}
              barColor="#35d1c1"
              backgroundColor="transparent"
              data-oid="mq4p.c6"
            />
          )}
        </div>
      </div>
      {/* Имя файла ниже превью */}
      {showFileName && (
        <div
          className="mt-1 text-xs text-center truncate text-foreground/80"
          style={{ maxWidth: containerWidth }}
          data-oid="audio-filename"
        >
          {file.name}
        </div>
      )}
    </div>
  )
})
