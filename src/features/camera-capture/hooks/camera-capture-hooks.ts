import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

import { logError, logInfo } from "@/lib/tauri-logger"
import { COMMON_FRAMERATES, COMMON_RESOLUTIONS, type ResolutionOption } from "../../project-settings/types/project"

interface UseCameraPermissionsResult {
  permissionStatus: "pending" | "granted" | "denied" | "error"
  errorMessage: string
  requestPermissions: () => Promise<void>
}

/**
 * Хук для запроса разрешений на доступ к камере и микрофону
 */
export function useCameraPermissions(getDevices: () => Promise<boolean>): UseCameraPermissionsResult {
  const { t } = useTranslation()
  const [permissionStatus, setPermissionStatus] = useState<"pending" | "granted" | "denied" | "error">("pending")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const requestPermissions = useCallback(async () => {
    logInfo("[useCameraPermissions] Запрос разрешений на доступ к камере и микрофону")
    try {
      setPermissionStatus("pending")
      setErrorMessage("")

      // Запрашиваем доступ к камере и микрофону, чтобы получить метки устройств
      const tempStream = await navigator.mediaDevices?.getUserMedia?.({
        video: true,
        audio: true,
      })

      if (!tempStream) {
        setPermissionStatus("error")
        setErrorMessage(
          t("camera.permissionError", "Не удалось получить доступ к камере и микрофону. Проверьте настройки."),
        )
        logError("[useCameraPermissions] Не удалось получить поток", new Error("No stream received"))
        return
      }

      // После получения доступа останавливаем временный поток
      tempStream.getTracks().forEach((track) => track.stop())

      // Теперь можем получить полный список устройств с названиями
      setPermissionStatus("granted")
      logInfo("[useCameraPermissions] Разрешения предоставлены")
      await getDevices()
    } catch (error) {
      logError("[useCameraPermissions] Ошибка при запросе разрешений", error)
      setPermissionStatus("error")

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          setErrorMessage(
            t(
              "dialogs.cameraCapture.permissionDenied",
              "Camera and microphone access denied. Please allow access in browser settings.",
            ),
          )
          setPermissionStatus("denied")
        } else if (error.name === "NotFoundError") {
          setErrorMessage(
            t(
              "dialogs.cameraCapture.deviceNotFound",
              "Camera or microphone not found. Please connect devices and try again.",
            ),
          )
        } else {
          setErrorMessage(`${t("dialogs.cameraCapture.errorAccess", "Error accessing devices:")} ${error.message}`)
        }
      } else {
        setErrorMessage(t("dialogs.cameraCapture.unknownError", "Unknown error requesting device access"))
      }
    }
  }, [getDevices, t])

  return { permissionStatus, errorMessage, requestPermissions }
}

interface UseDeviceCapabilitiesResult {
  availableResolutions: ResolutionOption[]
  supportedResolutions: ResolutionOption[]
  supportedFrameRates: number[]
  isLoadingCapabilities: boolean
  getDeviceCapabilities: (deviceId: string) => Promise<void>
}

/**
 * Хук для получения возможностей устройства (разрешения, частоты кадров)
 */
export function useDeviceCapabilities(
  setSelectedResolution: (resolution: string) => void,
  setFrameRate: (frameRate: number) => void,
): UseDeviceCapabilitiesResult {
  const { t } = useTranslation()
  const [availableResolutions, setAvailableResolutions] = useState<ResolutionOption[]>([])
  const [supportedResolutions, setSupportedResolutions] = useState<ResolutionOption[]>([])
  const [supportedFrameRates, setSupportedFrameRates] = useState<number[]>([])
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState<boolean>(false)

  const getDeviceCapabilities = useCallback(
    async (deviceId: string) => {
      logInfo("[useDeviceCapabilities] Получение возможностей устройства", { deviceId })
      setIsLoadingCapabilities(true)
      try {
        // Временно запрашиваем поток для определения возможностей
        const stream = await navigator.mediaDevices?.getUserMedia?.({
          video: {
            deviceId: { exact: deviceId },
          },
        })

        if (!stream) {
          logError("[useDeviceCapabilities] Не удалось получить поток", new Error("Stream is null"))
          return
        }

        // Получаем трек
        const videoTrack = stream.getVideoTracks()[0]

        if (videoTrack && "getCapabilities" in videoTrack) {
          // Современный подход через getCapabilities
          const capabilities = videoTrack.getCapabilities()
          logInfo("[useDeviceCapabilities] Возможности камеры получены", { capabilities })

          // Получаем разрешения
          const resolutions: ResolutionOption[] = []

          if (capabilities.width && capabilities.height) {
            // Получаем максимальное разрешение устройства
            const deviceWidthMax = capabilities.width?.max || 1920
            const deviceHeightMax = capabilities.height?.max || 1080

            logInfo("[useDeviceCapabilities] Максимальное разрешение устройства", {
              width: deviceWidthMax,
              height: deviceHeightMax,
            })

            // Проверяем, что максимальное разрешение имеет стандартное соотношение сторон
            const aspectRatio = deviceWidthMax / deviceHeightMax
            const isStandardAspectRatio =
              Math.abs(aspectRatio - 16 / 9) < 0.1 || // 16:9
              Math.abs(aspectRatio - 9 / 16) < 0.1 || // 9:16
              Math.abs(aspectRatio - 1) < 0.1 || // 1:1
              Math.abs(aspectRatio - 4 / 3) < 0.1 || // 4:3
              Math.abs(aspectRatio - 4 / 5) < 0.1 || // 4:5
              Math.abs(aspectRatio - 21 / 9) < 0.1 // 21:9

            // Добавляем максимальное разрешение устройства только если оно имеет стандартное соотношение сторон
            if (isStandardAspectRatio) {
              resolutions.push({
                width: deviceWidthMax,
                height: deviceHeightMax,
                label: `${deviceWidthMax}x${deviceHeightMax}`,
                value: `${deviceWidthMax}x${deviceHeightMax}`,
              })
            } else {
              logInfo("[useDeviceCapabilities] Нестандартное соотношение сторон", {
                resolution: `${deviceWidthMax}x${deviceHeightMax}`,
                aspectRatio: aspectRatio.toFixed(2),
              })
            }

            // Добавляем стандартные разрешения, которые меньше максимального
            for (const res of COMMON_RESOLUTIONS) {
              if (res.width <= deviceWidthMax && res.height <= deviceHeightMax) {
                // Проверяем, что такого разрешения еще нет в списке
                if (!resolutions.some((r) => r.width === res.width && r.height === res.height)) {
                  resolutions.push(res)
                }
              }
            }

            // Получаем частоты кадров
            let frameRates: number[] = []
            if (capabilities.frameRate) {
              const frMin = capabilities.frameRate.min || 0
              const frMax = capabilities.frameRate.max || 60

              logInfo("[useDeviceCapabilities] Диапазон частот кадров", { min: frMin, max: frMax })

              // Добавляем стандартные частоты кадров, которые в пределах диапазона
              const standard = [24, 25, 30, 50, 60]
              frameRates = standard.filter((fps) => fps >= frMin && fps <= frMax)

              // Добавляем максимальную частоту, если она не стандартная
              const maxFps = Math.floor(frMax)
              if (!frameRates.includes(maxFps) && maxFps > 0) {
                frameRates.push(maxFps)
              }

              // Сортируем
              frameRates.sort((a, b) => a - b)
            }

            // Сортируем разрешения от большего к меньшему
            const sortedResolutions = [...resolutions].sort((a, b) => {
              // Сравниваем по общему количеству пикселей
              const pixelsA = a.width * a.height
              const pixelsB = b.width * b.height
              return pixelsB - pixelsA
            })

            logInfo("[useDeviceCapabilities] Доступные разрешения", {
              resolutions: sortedResolutions.map((r) => r.label),
            })

            // Устанавливаем отсортированные разрешения
            setSupportedResolutions(sortedResolutions)
            setAvailableResolutions(sortedResolutions)

            // Всегда выбираем максимальное разрешение по умолчанию
            if (sortedResolutions.length > 0) {
              const maxResolution = sortedResolutions[0]
              logInfo("[useDeviceCapabilities] Выбрано максимальное разрешение", { resolution: maxResolution.label })
              setSelectedResolution(maxResolution.value)
            } else {
              // Если по какой-то причине нет разрешений, используем стандартные
              logInfo("[useDeviceCapabilities] Разрешения не найдены, используем стандартные")
              setAvailableResolutions(COMMON_RESOLUTIONS)
              setSupportedResolutions(COMMON_RESOLUTIONS)
              setSelectedResolution(COMMON_RESOLUTIONS[0].value)
            }

            if (frameRates.length > 0) {
              setSupportedFrameRates(frameRates)

              // Устанавливаем частоту по умолчанию (30 fps или лучшее доступное)
              const defaultFps = frameRates.find((fps) => fps === 30) || frameRates[0]
              setFrameRate(defaultFps)
            } else {
              setSupportedFrameRates(COMMON_FRAMERATES)
              setFrameRate(30)
            }
          } else {
            // Если нет информации о разрешении, используем стандартные значения
            logInfo("[useDeviceCapabilities] Нет информации о разрешении, используем стандартные значения")
            setAvailableResolutions(COMMON_RESOLUTIONS)
            setSupportedResolutions(COMMON_RESOLUTIONS)
            setSelectedResolution(COMMON_RESOLUTIONS[0].value)
            setSupportedFrameRates(COMMON_FRAMERATES)
            setFrameRate(30)
          }
        } else {
          // Для старых браузеров используем предопределенные разрешения
          logInfo("[useDeviceCapabilities] Браузер не поддерживает getCapabilities, используем стандартные значения")
          setAvailableResolutions(COMMON_RESOLUTIONS)
          setSupportedResolutions(COMMON_RESOLUTIONS)
          setSelectedResolution(COMMON_RESOLUTIONS[0].value)
          setSupportedFrameRates(COMMON_FRAMERATES)
          setFrameRate(30)
        }

        // Завершаем поток
        stream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        logError("[useDeviceCapabilities] Ошибка при получении возможностей устройства", error)
        // Используем стандартные значения в случае ошибки
        setAvailableResolutions(COMMON_RESOLUTIONS)
        setSupportedResolutions(COMMON_RESOLUTIONS)
        setSelectedResolution(COMMON_RESOLUTIONS[0].value)
        setSupportedFrameRates(COMMON_FRAMERATES)
        setFrameRate(30)
      } finally {
        setIsLoadingCapabilities(false)
      }
    },
    [t, setSelectedResolution, setFrameRate],
  )

  return {
    availableResolutions,
    supportedResolutions,
    supportedFrameRates,
    isLoadingCapabilities,
    getDeviceCapabilities,
  }
}
