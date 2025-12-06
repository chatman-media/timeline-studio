import { useCallback, useRef } from "react"
import type { MediaFile } from "@/domains/media-management"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("video-player:use-video-element")

/**
 * Хук для создания и управления видео элементами
 * @returns Функции для работы с видео элементами
 */
export function useVideoElement() {
  logger.debug("hook initialized")

  // Используем ref для отслеживания всех созданных видео элементов
  const allVideoElementsRef = useRef<Set<HTMLVideoElement>>(new Set())

  /**
   * Создает или возвращает существующий видео элемент
   * @param video Объект видео файла
   * @param videoRefs Объект для хранения ссылок на видео элементы
   * @param volume Громкость видео
   * @param setVideoSource Функция для установки источника видео
   * @returns Видео элемент
   */
  const getOrCreateVideoElement = useCallback(
    (
      video: MediaFile,
      videoRefs: Record<string, HTMLVideoElement>,
      volume: number,
      setVideoSource: (videoId: string, source: "media" | "timeline") => void,
    ): HTMLVideoElement => {
      // Получаем или создаем видео элемент
      let videoElement = videoRefs[video.id]

      // Если видео элемента нет или он был удален из DOM, создаем новый
      if (!videoElement || !document.body.contains(videoElement)) {
        logger.debug("creating new video element", { videoId: video.id })

        // Создаем видео элемент программно
        videoElement = document.createElement("video")
        videoElement.id = `video-${video.id}`
        videoElement.preload = "auto"
        videoElement.playsInline = true
        videoElement.controls = false
        videoElement.autoplay = false
        videoElement.loop = false
        videoElement.muted = false
        videoElement.volume = volume
        videoElement.src = video.path
        videoElement.dataset.videoId = video.id // Добавляем data-атрибут для идентификации

        // Добавляем элемент в DOM (скрытый)
        videoElement.style.position = "absolute"
        videoElement.style.width = "1px"
        videoElement.style.height = "1px"
        videoElement.style.opacity = "0"
        videoElement.style.pointerEvents = "none"
        document.body.appendChild(videoElement)

        // Сохраняем ссылку на элемент
        videoRefs[video.id] = videoElement

        // Добавляем видео элемент в глобальный реестр для отслеживания
        allVideoElementsRef.current.add(videoElement)
        logger.debug("video element added to registry", {
          videoId: video.id,
          totalElements: allVideoElementsRef.current.size,
        })

        // Определяем источник видео
        const source = video.startTime !== undefined ? "timeline" : "media"
        setVideoSource(video.id, source)
      } else {
        logger.debug("using existing video element", { videoId: video.id })
      }

      return videoElement
    },
    [],
  )

  /**
   * Обновляет src видео элемента, если необходимо
   * @param videoElement Видео элемент
   * @param video Объект видео файла
   */
  const updateVideoSrc = useCallback((videoElement: HTMLVideoElement, video: MediaFile) => {
    // Проверяем, что src установлен правильно
    if (videoElement && !videoElement.src?.includes(video.id) && video.path) {
      logger.debug("updating video src", { videoId: video.id, path: video.path })
      videoElement.src = video.path
      videoElement.load()
    }
  }, [])

  /**
   * Полностью очищает видео элемент и освобождает память
   * @param videoElement Видео элемент для очистки
   */
  const destroyVideoElement = useCallback((videoElement: HTMLVideoElement) => {
    try {
      // 1. Останавливаем воспроизведение
      videoElement.pause()

      // 2. Сохраняем src перед очисткой для revoke blob URLs
      const currentSrc = videoElement.src || videoElement.currentSrc

      // 3. Очищаем src и загружаем пустой источник для освобождения медиа буфера
      videoElement.removeAttribute("src")
      videoElement.load()

      // 4. Очищаем object URL если он был создан (делаем после removeAttribute)
      if (currentSrc && currentSrc.startsWith("blob:")) {
        URL.revokeObjectURL(currentSrc)
      }

      // 5. Удаляем из DOM
      if (document.body.contains(videoElement)) {
        document.body.removeChild(videoElement)
      }

      // 6. Удаляем из глобального реестра
      allVideoElementsRef.current.delete(videoElement)

      logger.debug("video element destroyed and memory released", {
        videoId: videoElement.dataset.videoId,
      })
    } catch (error) {
      logger.error("error destroying video element", { error })
    }
  }, [])

  /**
   * Очищает неиспользуемые видео элементы
   * @param activeVideoIds Массив ID активных видео
   * @param videoRefs Объект для хранения ссылок на видео элементы
   */
  const cleanupUnusedVideoElements = useCallback(
    (activeVideoIds: string[], videoRefs: Record<string, HTMLVideoElement>) => {
      // Получаем все ID видео из videoRefs
      const allVideoIds = Object.keys(videoRefs)

      // Находим ID видео, которые больше не используются
      const unusedVideoIds = allVideoIds.filter((id) => !activeVideoIds.includes(id))

      // Удаляем неиспользуемые видео элементы
      unusedVideoIds.forEach((id) => {
        const videoElement = videoRefs[id]
        if (videoElement) {
          logger.debug("removing unused video element", { videoId: id })

          // Полностью уничтожаем элемент и освобождаем память
          // (destroyVideoElement уже удаляет из глобального реестра)
          destroyVideoElement(videoElement)

          // Удаляем из videoRefs
          delete videoRefs[id]
        }
      })

      logger.debug("cleaned up unused video elements", { count: unusedVideoIds.length })
    },
    [destroyVideoElement],
  )

  return {
    getOrCreateVideoElement,
    updateVideoSrc,
    cleanupUnusedVideoElements,
    destroyVideoElement,
    allVideoElementsRef,
  }
}
