import { type RefObject, useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"
import type { ResolutionOption } from "@/features/project-settings/types/project"
import { logError, logInfo } from "@/lib/tauri-logger"

import { cleanupMediaStream } from "../utils"

interface UseCameraStreamResult {
  isDeviceReady: boolean
  setIsDeviceReady: (ready: boolean) => void
  errorMessage: string
  initCamera: () => Promise<void>
  streamRef: RefObject<MediaStream | null>
}

/**
 * Хук для управления потоком с камеры
 */
export function useCameraStream(
  videoRef: RefObject<HTMLVideoElement | null>,
  selectedDevice: string,
  selectedAudioDevice: string,
  selectedResolution: string,
  frameRate: number,
  availableResolutions: ResolutionOption[],
  setErrorMessage: (message: string) => void,
): UseCameraStreamResult {
  const { t } = useTranslation()
  const [isDeviceReady, setIsDeviceReady] = useState<boolean>(false)
  const [errorMessage, setLocalErrorMessage] = useState<string>("")
  const streamRef = useRef<MediaStream | null>(null)
  const initializingRef = useRef<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Синхронизируем локальное состояние ошибки с внешним
  const updateErrorMessage = useCallback(
    (message: string) => {
      setLocalErrorMessage(message)
      setErrorMessage(message)
    },
    [setErrorMessage],
  )

  // Инициализация потока с камеры
  const initCamera = useCallback(async () => {
    logInfo("[useCameraStream] Инициализация потока с камеры")
    // Предотвращаем параллельные вызовы
    if (initializingRef.current) {
      logInfo("[useCameraStream] Инициализация камеры уже в процессе, пропускаем вызов")
      return
    }

    if (!selectedDevice) {
      logInfo("[useCameraStream] Устройство не выбрано")
      return
    }

    // Проверяем доступность API mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      logError("[useCameraStream] MediaDevices API недоступен", { error: new Error("API not available") })
      updateErrorMessage(
        t(
          "dialogs.cameraCapture.mediaDevicesNotSupported",
          "Запись с камеры не поддерживается в данном приложении. Функция доступна только в веб-браузере.",
        ),
      )
      setIsDeviceReady(false)
      return
    }

    // Устанавливаем флаг инициализации
    initializingRef.current = true

    // Отменяем предыдущий запрос, если есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Создаём новый AbortController для текущего запроса
    abortControllerRef.current = new AbortController()
    const currentAbortController = abortControllerRef.current

    try {
      logInfo("[useCameraStream] Инициализация камеры с устройством", { device: selectedDevice })

      // Проверяем, не была ли операция отменена
      if (currentAbortController.signal.aborted) {
        logInfo("[useCameraStream] Инициализация камеры отменена")
        return
      }

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Camera stream cleanup")
        streamRef.current = null
      }

      // Извлекаем выбранное разрешение
      let width = 1920
      let height = 1080

      if (selectedResolution) {
        // Извлекаем числа из строки разрешения (например, "1920x1080")
        logInfo("[useCameraStream] Выбранное разрешение для обработки", { resolution: selectedResolution })

        const resolutionMatch = /(\d+)x(\d+)/.exec(selectedResolution)
        if (resolutionMatch && resolutionMatch.length >= 3) {
          width = Number.parseInt(resolutionMatch[1], 10)
          height = Number.parseInt(resolutionMatch[2], 10)
          logInfo("[useCameraStream] Извлечено разрешение", { width, height })
        } else {
          logInfo("[useCameraStream] Не удалось извлечь разрешение из строки", { resolution: selectedResolution })

          // Ищем разрешение в доступных разрешениях
          const resolution = availableResolutions.find((r) => r.value === selectedResolution)
          if (resolution) {
            width = resolution.width
            height = resolution.height
            logInfo("[useCameraStream] Найдено разрешение в списке", { width, height })
          }
        }
      } else {
        // Если разрешение не выбрано, используем максимальное из доступных
        if (availableResolutions.length > 0) {
          // Сортируем по убыванию (сначала самые высокие разрешения)
          const sortedResolutions = [...availableResolutions].sort((a, b) => {
            const pixelsA = a.width * a.height
            const pixelsB = b.width * b.height
            return pixelsB - pixelsA
          })

          // Берем максимальное разрешение
          const maxResolution = sortedResolutions[0]
          width = maxResolution.width
          height = maxResolution.height

          logInfo("[useCameraStream] Разрешение не выбрано, используем максимальное", { width, height })
        }
      }

      logInfo("[useCameraStream] Запрашиваем разрешение", { width, height, frameRate })

      // Проверяем, что разрешение имеет разумные значения
      if (width < 640 || height < 480) {
        logInfo("[useCameraStream] Обнаружено слишком низкое разрешение, устанавливаем минимальное", { width, height })
        width = 640
        height = 480
      }

      // Проверяем снова, не была ли операция отменена перед запросом потока
      if (currentAbortController.signal.aborted) {
        logInfo("[useCameraStream] Инициализация камеры отменена перед запросом медиа-потока")
        return
      }

      // Настраиваем ограничения для видео потока
      // Используем exact для устройства и ideal для разрешения
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
        },
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
      }

      logInfo("[useCameraStream] Запрашиваем медиа-поток с ограничениями", { constraints })
      try {
        const stream = await navigator.mediaDevices?.getUserMedia?.(constraints)

        // Проверяем после асинхронной операции
        if (currentAbortController.signal.aborted) {
          logInfo("[useCameraStream] Инициализация камеры отменена после получения потока")
          if (stream) {
            cleanupMediaStream(stream, "Aborted stream cleanup")
          }
          return
        }

        logInfo("[useCameraStream] Поток получен")

        if (!stream) {
          logError("[useCameraStream] Не удалось получить медиа-поток", { error: new Error("Stream is null") })
          throw new Error("Медиа-поток недоступен")
        }

        streamRef.current = stream

        // Получаем информацию о фактическом разрешении из трека
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const settings = videoTrack.getSettings()
          logInfo("[useCameraStream] Фактические настройки трека", { settings })
          if (settings.width && settings.height) {
            logInfo("[useCameraStream] Фактическое разрешение трека", {
              width: settings.width,
              height: settings.height,
            })
          }
        }
      } catch (error) {
        // Проверяем, не была ли операция отменена
        if (currentAbortController.signal.aborted) {
          logInfo("[useCameraStream] Инициализация камеры отменена во время обработки ошибки")
          return
        }

        logError("[useCameraStream] Ошибка при получении потока с запрошенным разрешением", { error })
        updateErrorMessage(
          t(
            "dialogs.cameraCapture.errorRequestingStream",
            "Не удалось получить поток с запрошенным разрешением. Пробуем получить поток с настройками по умолчанию.",
          ),
        )

        // Пробуем получить поток без указания разрешения
        logInfo("[useCameraStream] Пробуем получить поток без указания разрешения")
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedDevice },
          },
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
        }

        try {
          const stream = await navigator.mediaDevices?.getUserMedia?.(fallbackConstraints)

          // Проверяем после асинхронной операции
          if (currentAbortController.signal.aborted) {
            logInfo("[useCameraStream] Инициализация камеры отменена после получения fallback потока")
            if (stream) {
              cleanupMediaStream(stream, "Aborted fallback stream cleanup")
            }
            return
          }

          logInfo("[useCameraStream] Поток получен с резервными настройками")

          if (!stream) {
            logError("[useCameraStream] Не удалось получить медиа-поток с резервными настройками", {
              error: new Error("Stream is null"),
            })
            throw new Error("Медиа-поток недоступен")
          }

          streamRef.current = stream
        } catch (fallbackError) {
          // Проверяем, не была ли операция отменена
          if (currentAbortController.signal.aborted) {
            logInfo("[useCameraStream] Инициализация камеры отменена во время обработки fallback ошибки")
            return
          }

          logError("[useCameraStream] Ошибка при получении потока с резервными настройками", { error: fallbackError })
          updateErrorMessage(
            t(
              "dialogs.cameraCapture.errorRequestingStreamFallback",
              "Не удалось получить поток с камеры. Пожалуйста, проверьте настройки камеры и разрешения.",
            ),
          )
          setIsDeviceReady(false)
          return
        }
      }

      // Финальная проверка перед установкой видео элемента
      if (currentAbortController.signal.aborted) {
        logInfo("[useCameraStream] Инициализация камеры отменена перед установкой видео элемента")
        return
      }

      if (videoRef.current && streamRef.current) {
        logInfo("[useCameraStream] Устанавливаем srcObject для видео элемента")
        // Дополнительная проверка, что videoRef.current не null
        const video = videoRef.current
        if (video) {
          video.srcObject = streamRef.current

          // Добавляем обработчик события loadedmetadata
          video.onloadedmetadata = () => {
            // Проверяем, не была ли операция отменена
            if (currentAbortController.signal.aborted) {
              logInfo("[useCameraStream] Инициализация камеры отменена в onloadedmetadata")
              return
            }

            logInfo("[useCameraStream] Видео метаданные загружены, начинаем воспроизведение")
            video.play().catch((e: unknown) => logError("[useCameraStream] Ошибка воспроизведения", { error: e }))

            // Получаем фактическое разрешение видео для логирования
            const actualWidth = video.videoWidth
            const actualHeight = video.videoHeight
            logInfo("[useCameraStream] Фактическое разрешение видео", { width: actualWidth, height: actualHeight })

            setIsDeviceReady(true)
          }

          // Добавляем обработчик ошибок
          video.onerror = (_e) => {
            logError("[useCameraStream] Ошибка видео элемента", { error: new Error("Video element error") })
            updateErrorMessage(
              t(
                "dialogs.cameraCapture.videoElementError",
                "Ошибка при инициализации видео элемента. Пожалуйста, попробуйте другое устройство или разрешение.",
              ),
            )
            setIsDeviceReady(false)
          }
        } else {
          logError("[useCameraStream] Ссылка на видео элемент отсутствует", { error: new Error("Video ref is null") })
          setIsDeviceReady(false)
        }
      } else {
        logError("[useCameraStream] Ссылка на видео элемент или поток отсутствует", {
          error: new Error("Video ref or stream is null"),
        })
        setIsDeviceReady(false)
      }
    } catch (error) {
      // Проверяем, не была ли операция отменена
      if (currentAbortController.signal.aborted) {
        logInfo("[useCameraStream] Инициализация камеры отменена в блоке catch")
        return
      }

      logError("[useCameraStream] Ошибка при инициализации камеры", { error })
      updateErrorMessage(
        t(
          "dialogs.cameraCapture.cameraInitError",
          "Ошибка при инициализации камеры. Пожалуйста, проверьте настройки камеры и разрешения.",
        ),
      )
      setIsDeviceReady(false)
    } finally {
      // Сбрасываем флаг инициализации только для текущего запроса
      if (abortControllerRef.current === currentAbortController) {
        initializingRef.current = false
        abortControllerRef.current = null
        logInfo("[useCameraStream] Инициализация камеры завершена, флаги сброшены")
      } else {
        logInfo("[useCameraStream] Инициализация камеры завершена для устаревшего запроса")
      }
    }
  }, [
    selectedDevice,
    selectedAudioDevice,
    selectedResolution,
    frameRate,
    availableResolutions,
    videoRef,
    t,
    updateErrorMessage,
  ])

  // Очищаем ресурсы при размонтировании или изменении устройства
  useEffect(() => {
    // Очищаем предыдущий поток при изменении устройства
    return () => {
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Camera stream device change cleanup")
        streamRef.current = null
      }

      // Отменяем текущую инициализацию при изменении устройства
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      initializingRef.current = false
    }
  }, [selectedDevice, selectedAudioDevice])

  // Общая очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Camera stream final cleanup")
        streamRef.current = null
      }

      // Отменяем любую текущую инициализацию при размонтировании
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      initializingRef.current = false
    }
  }, [])

  return {
    isDeviceReady,
    setIsDeviceReady,
    errorMessage,
    initCamera,
    streamRef,
  }
}
