import { useCallback, useRef } from "react"

import { logInfo } from "@/lib/tauri-logger"
import type { MediaFile } from "@/features/media/types/media"

/**
 * Хук для создания и управления видео элементами
 * @returns Функции для работы с видео элементами
 */
export function useVideoElement() {
  logInfo("[useVideoElement] Инициализация хука")

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
        console.log(`[useVideoElement] Создаем новый видео элемент для ${video.id}`)

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
        console.log(
          `[useVideoElement] Добавлен видео элемент в глобальный реестр: ${video.id}, всего элементов: ${allVideoElementsRef.current.size}`,
        )

        // Определяем источник видео
        const source = video.startTime !== undefined ? "timeline" : "media"
        setVideoSource(video.id, source)
      } else {
        console.log(`[useVideoElement] Используем существующий видео элемент для ${video.id}`)
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
      console.log(`[useVideoElement] Обновляем src для видео ${video.id}: ${video.path}`)
      videoElement.src = video.path
      videoElement.load()
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
        if (videoElement && document.body.contains(videoElement)) {
          console.log(`[useVideoElement] Удаляем неиспользуемый видео элемент: ${id}`)

          // Останавливаем воспроизведение
          videoElement.pause()

          // Удаляем из DOM
          document.body.removeChild(videoElement)

          // Удаляем из глобального реестра
          allVideoElementsRef.current.delete(videoElement)

          // Удаляем из videoRefs

          delete videoRefs[id]
        }
      })

      console.log(`[useVideoElement] Очищено ${unusedVideoIds.length} неиспользуемых видео элементов`)
    },
    [],
  )

  return {
    getOrCreateVideoElement,
    updateVideoSrc,
    cleanupUnusedVideoElements,
    allVideoElementsRef,
  }
}
