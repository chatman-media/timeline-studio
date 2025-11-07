import { readFile } from "@tauri-apps/plugin-fs"
import { Music } from "lucide-react"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { LiveAudioVisualizer } from "react-audio-visualize"

import type { MediaFile } from "@/features/media/types/media"
import type { TimelineResource } from "@/features/resources/types"
import { usePlayer } from "@/features/video-player"
import { createLogger } from "@/lib/tauri-logger"
import { convertToAssetUrl } from "@/lib/tauri-utils"

import { AddMediaButton } from "../layout/add-media-button"
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
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const { playerSetSource, playerSetMedia } = usePlayer()

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
    async (e: React.MouseEvent) => {
      e.preventDefault()
      logger.debugSync("Клик по аудио для воспроизведения/паузы", {
        fileName: file.name,
        isPlaying,
        hoverTime,
      })

      try {
        // Проверяем, что у файла есть id
        if (!file.id) {
          logger.errorSync("У аудио файла нет ID", { fileName: file.name, file })
          // Fallback к локальному воспроизведению
          if (audioRef.current) {
            if (isPlaying) {
              audioRef.current.pause()
              logger.debugSync("Fallback: Аудио на паузе (нет ID)", { fileName: file.name })
            } else {
              if (hoverTime !== null) {
                audioRef.current.currentTime = hoverTime
              }
              void audioRef.current.play()
              logger.debugSync("Fallback: Аудио воспроизводится (нет ID)", { fileName: file.name, time: hoverTime })
            }
            setIsPlaying(!isPlaying)
          }
          return
        }

        logger.debugSync("Отправляем аудио в главный плеер", {
          fileId: file.id,
          fileName: file.name,
          time: hoverTime || 0,
        })

        // Отправляем аудио в главный плеер через backend
        await playerSetSource("browser")
        await playerSetMedia(file.id, hoverTime || 0)

        logger.infoSync("Аудио успешно отправлено в плеер", {
          fileName: file.name,
          fileId: file.id,
          time: hoverTime || 0,
        })
      } catch (error) {
        logger.errorSync("Ошибка отправки аудио в плеер", {
          error: String(error),
          fileName: file.name,
          fileId: file.id,
        })

        // Fallback: локальное воспроизведение в превью
        if (!audioRef.current) return

        if (isPlaying) {
          audioRef.current.pause()
          logger.debugSync("Fallback: Аудио на паузе", { fileName: file.name })
        } else {
          if (hoverTime !== null) {
            audioRef.current.currentTime = hoverTime
          }
          void audioRef.current.play()
          logger.debugSync("Fallback: Аудио воспроизводится", { fileName: file.name, time: hoverTime })
        }
        setIsPlaying(!isPlaying)
      }
    },
    [hoverTime, file, playerSetSource, playerSetMedia, isPlaying],
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

  // Функция для чтения файла и создания объекта URL
  const loadAudioFile = useCallback(async (path: string) => {
    try {
      logger.debugSync("Начинаем загрузку аудио файла", { path })
      const fileData = await readFile(path)
      logger.debugSync("Аудио файл успешно прочитан", { path, dataSize: fileData.length })

      // Определяем тип аудио по расширению
      const extension = path.split(".").pop()?.toLowerCase()
      const audioMimeTypes: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        flac: "audio/flac",
        aac: "audio/aac",
        m4a: "audio/m4a",
      }
      const mimeType = audioMimeTypes[extension || ""] || "audio/mpeg"

      const blob = new Blob([fileData as BlobPart], { type: mimeType })
      const url = URL.createObjectURL(blob)
      logger.infoSync("Создан blob URL для аудио", { path, blobUrl: url, mimeType, extension })
      return url
    } catch (error) {
      logger.errorSync("Ошибка при загрузке аудио", {
        error: String(error),
        message: error instanceof Error ? error.message : String(error),
        path,
        stack: error instanceof Error ? error.stack : undefined,
      })
      // В случае ошибки используем convertToAssetUrl
      const assetUrl = convertToAssetUrl(path)
      logger.debugSync("Используем fallback asset URL для аудио", { assetUrl, originalPath: path })
      return assetUrl
    }
  }, [])

  // Эффект для загрузки аудио при монтировании компонента
  useEffect(() => {
    let isMounted = true
    logger.debugSync("Монтирование AudioPreview", { fileName: file.name, filePath: file.path })

    void loadAudioFile(file.path).then((url) => {
      if (isMounted) {
        setAudioUrl(url)
        logger.debugSync("URL аудио установлен", { url, fileName: file.name })
      }
    })

    // Очистка объекта URL при размонтировании компонента
    return () => {
      isMounted = false
      if (audioUrl?.startsWith("blob:")) {
        logger.debugSync("Размонтирование AudioPreview - очистка blob URL", {
          blobUrl: audioUrl,
          fileName: file.name,
        })
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [file.path, file.name, loadAudioFile]) // Убираем audioUrl из зависимостей

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
        setMediaRecorder(recorder)
        recorder.start()
        logger.infoSync("MediaRecorder запущен для визуализации", { fileName: file.name })
      } catch (error) {
        logger.errorSync("Ошибка инициализации AudioContext", {
          error: String(error),
          fileName: file.name,
        })
      }
    }

    setTimeout(initAudioContext, 100)

    return () => {
      logger.debugSync("Очистка AudioContext и MediaRecorder", { fileName: file.name })
      if (mediaRecorder) {
        mediaRecorder.stop()
        logger.debugSync("MediaRecorder остановлен", { fileName: file.name })
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        logger.debugSync("Audio source disconnected", { fileName: file.name })
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close()
        logger.debugSync("AudioContext closed", { fileName: file.name })
      }
    }
  }, [file.name, mediaRecorder])

  return (
    <div
      className={"group relative h-full flex-shrink-0"}
      style={{
        height: `${size}px`,
        width: `${(size * dimensions[0]) / dimensions[1]}px`,
      }}
      onMouseMove={handleMouseMove}
      onClick={handlePlayPause}
      onMouseLeave={handleMouseLeave}
    >
      <audio
        ref={audioRef}
        src={audioUrl || convertToAssetUrl(file.path)}
        preload="metadata"
        tabIndex={0}
        className="pointer-events-none absolute inset-0 h-full w-full focus:outline-none"
        onEnded={() => {
          setIsPlaying(false)
          logger.debugSync("Воспроизведение аудио завершено", { fileName: file.name })
        }}
        onLoadedMetadata={() => {
          setIsLoaded(true)
          logger.infoSync("Метаданные аудио загружены", { fileName: file.name })
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
      />

      {/* Иконка музыки */}
      <div
        className={`absolute ${size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5"} cursor-pointer rounded-xs bg-black/50 p-0.5`}
        style={{
          color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
        }}
      >
        <Music size={size > 100 ? 16 : 12} />
      </div>

      {/* Имя файла */}
      {showFileName && (
        <div
          className={`absolute font-medium ${size > 100 ? "top-1" : "top-0.5"} ${size > 100 ? "left-1" : "left-0.5"} ${
            size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"
          } line-clamp-1 max-w-[calc(60%)] rounded-xs bg-black/50 text-xs leading-[16px]`}
          style={{
            fontSize: size > 100 ? "13px" : "11px",
            color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
          }}
        >
          {file.name}
        </div>
      )}

      {/* Кнопка избранного */}
      <FavoriteButton file={file} size={size} type="media" />

      {/* кнопка добавления */}
      {isLoaded && (
        <AddMediaButton
          resource={
            {
              id: file.id,
              type: "media",
            } as TimelineResource
          }
          size={size}
          type="media"
        />
      )}

      {/* Аудио визуализация */}
      <div
        className="pointer-events-none absolute top-0 right-0 left-0 select-none"
        style={{
          height: `${size}px`,
          width: `${(size * dimensions[0]) / dimensions[1]}px`,
        }}
      >
        {mediaRecorder && (
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            width={(size * dimensions[0]) / dimensions[1]}
            height={size}
            barWidth={1}
            gap={0}
            barColor="#35d1c1"
            backgroundColor="transparent"
          />
        )}
      </div>
    </div>
  )
})
