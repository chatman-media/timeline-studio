import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import type { MediaFile } from "@/domains/media-management"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "VideoPanelComponent" })

interface VideoPanelProps {
  video: MediaFile
  isActive: boolean
  videoRefs?: Record<string, HTMLVideoElement>
  index?: number
  hideLabel?: boolean
  labelPosition?: "left" | "right" | "center"
}

/**
 * Компонент для отображения видео в шаблоне
 * Используем React.memo с функцией сравнения для предотвращения лишних рендеров
 */
export function VideoPanelComponent({
  video,
  isActive,
  videoRefs,
  hideLabel = false,
  labelPosition = "center",
}: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isReady] = useState(false)
  const { t } = useTranslation()

  // Эффект для регистрации видео в videoRefs и обновления src при изменении источника
  useEffect(() => {
    if (videoRef.current && video.id && videoRefs) {
      logger.info("[VideoPanel] Регистрация видео", { videoId: video.id, startTime: video.startTime })

      // Сохраняем ссылку на видео элемент
      videoRefs[video.id] = videoRef.current

      // Проверяем, что src установлен правильно
      if (video.path && !videoRef.current.src?.includes(video.id)) {
        logger.info("[VideoPanel] Принудительно обновляем src для видео", { videoId: video.id, path: video.path })

        // Сохраняем текущее время и состояние воспроизведения
        const currentTime = videoRef.current.currentTime
        const wasPlaying = !videoRef.current.paused

        // Обновляем src с небольшой задержкой для предотвращения черного экрана
        setTimeout(() => {
          if (videoRef.current) {
            // Обновляем src
            videoRef.current.src = video.path
            videoRef.current.load()

            // Восстанавливаем время и состояние воспроизведения
            if (currentTime > 0) {
              videoRef.current.currentTime = currentTime
            }

            if (wasPlaying) {
              videoRef.current
                .play()
                .catch((e: unknown) =>
                  logger.error(`[VideoPanel] Ошибка воспроизведения видео ${video.id}:`, { error: e }),
                )
            }
          }
        }, 100)
      }

      return () => {
        // Не удаляем ссылку на видео элемент при размонтировании компонента
        // Это позволяет избежать черного экрана при переключении между видео
        // delete videoRefs[video.id]
      }
    }
  }, [video, videoRefs])

  const videoKey = video.path ? video.path : `empty-${video.id}`

  logger.info("[VideoPanel] Рендеринг видео", { videoKey })

  return (
    <div
      className="video-panel-template relative h-full w-full cursor-pointer"
      style={{ overflow: "visible" }}
      key={`panel-${videoKey}`}
    >
      <div
        className={`absolute inset-0 ${isActive ? "border-2 border-white" : ""}`}
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          transition: "border 0.2s ease-in-out", // Добавляем плавный переход для рамки
        }}
      >
        {video.path ? (
          <video
            key={videoKey}
            ref={videoRef}
            src={video.path}
            className="absolute"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
            playsInline
            preload="auto"
            controls={false}
            autoPlay={false}
            loop={false}
            disablePictureInPicture
            muted={!isActive} // Звук только из активного видео
            data-video-id={video.id}
            data-start-time={video.startTime}
          />
        ) : (
          // Если нет пути к видео, отображаем сообщение
          <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
            <div className="text-center">
              <div className="mb-2 text-3xl">📹</div>
              <div className="text-sm">{t("timeline.player.noVideoSelected")}</div>
            </div>
          </div>
        )}

        {/* Индикатор активного видео - всегда рендерим, но скрываем через opacity */}
        <div
          className="absolute top-2 right-2 h-4 w-4 rounded-full bg-white"
          style={{
            opacity: isActive && video.path ? 1 : 0,
            transition: "opacity 0.2s ease-in-out", // Плавное появление/исчезновение
          }}
        />

        {/* Надпись с названием камеры - всегда рендерим, но скрываем через opacity */}
        <div
          className={`absolute bottom-2 ${
            labelPosition === "left" ? "left-2" : labelPosition === "right" ? "right-2" : "left-1/2 -translate-x-1/2"
          } bg-opacity-50 rounded bg-black px-2 py-1 text-xs text-white`}
          style={{
            opacity: !hideLabel && video.name && video.path ? 1 : 0,
            transition: "opacity 0.2s ease-in-out", // Плавное появление/исчезновение
            pointerEvents: !hideLabel && video.name && video.path ? "auto" : "none", // Отключаем события мыши, когда скрыто
          }}
        >
          {video.name || ""}
        </div>

        {/* Индикатор загрузки - всегда рендерим, но скрываем через opacity */}
        <div
          className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black"
          style={{
            opacity: !isReady && video.path ? 1 : 0,
            transition: "opacity 0.3s ease-in-out", // Плавное появление/исчезновение
            pointerEvents: !isReady && video.path ? "auto" : "none", // Отключаем события мыши, когда скрыто
          }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      </div>
    </div>
  )
}
