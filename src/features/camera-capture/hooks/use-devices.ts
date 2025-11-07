import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

import { logError, logInfo } from "@/lib/tauri-logger"
import type { CaptureDevice } from "../types"

interface UseDevicesResult {
  devices: CaptureDevice[]
  audioDevices: CaptureDevice[]
  selectedDevice: string
  selectedAudioDevice: string
  setSelectedDevice: (deviceId: string) => void
  setSelectedAudioDevice: (deviceId: string) => void
  getDevices: () => Promise<boolean>
}

/**
 * Хук для получения списка устройств (камеры и микрофоны)
 */
export function useDevices(
  getDeviceCapabilities: (deviceId: string) => Promise<void>,
  setErrorMessage: (message: string) => void,
): UseDevicesResult {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<CaptureDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [audioDevices, setAudioDevices] = useState<CaptureDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("")

  const getDevices = useCallback(async () => {
    logInfo("[useDevices] Получение списка устройств")
    // Проверяем доступность API mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      logError("[useDevices] MediaDevices API недоступен", new Error("API not available"))
      setErrorMessage(
        t(
          "dialogs.cameraCapture.mediaDevicesNotSupported",
          "Запись с камеры не поддерживается в данном приложении. Функция доступна только в веб-браузере.",
        ),
      )
      return false
    }

    try {
      const devices = (await navigator.mediaDevices?.enumerateDevices?.()) || []

      const videoDevices = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => {
          // Очищаем названия устройств от текста в скобках
          let label =
            device.label ||
            t("timeline.tracks.cameraWithNumber", {
              number: devices.indexOf(device) + 1,
              defaultValue: `Camera ${devices.indexOf(device) + 1}`,
            })
          // Удаляем текст в скобках, если он присутствует
          label = label.replace(/\s*\([^)]*\)\s*$/, "")

          return {
            deviceId: device.deviceId || `camera-${devices.indexOf(device)}`,
            label: label,
          }
        })

      const audioDevices = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => {
          // Очищаем названия устройств от текста в скобках
          let label =
            device.label ||
            t("timeline.tracks.audioWithNumber", {
              number: devices.indexOf(device) + 1,
              defaultValue: `Microphone ${devices.indexOf(device) + 1}`,
            })
          // Удаляем текст в скобках, если он присутствует
          label = label.replace(/\s*\([^)]*\)\s*$/, "")

          return {
            deviceId: device.deviceId || `mic-${devices.indexOf(device)}`,
            label: label,
          }
        })

      setDevices(videoDevices)
      setAudioDevices(audioDevices)

      logInfo("[useDevices] Найдены видео устройства", { count: videoDevices.length, devices: videoDevices })
      logInfo("[useDevices] Найдены аудио устройства", { count: audioDevices.length, devices: audioDevices })

      // Выбираем первое устройство, если еще не выбрано
      let deviceIdToUse = selectedDevice
      if (videoDevices.length > 0 && !selectedDevice) {
        deviceIdToUse = videoDevices[0].deviceId
        setSelectedDevice(deviceIdToUse)
      }

      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId)
      }

      // Запрашиваем возможности выбранного устройства
      if (deviceIdToUse) {
        await getDeviceCapabilities(deviceIdToUse)
      }

      return true
    } catch (error) {
      logError("[useDevices] Ошибка при получении устройств", error)
      if (setErrorMessage) {
        setErrorMessage(t("dialogs.cameraCapture.errorGettingDevices", "Failed to get device list"))
      }
      return false
    }
  }, [selectedDevice, selectedAudioDevice, getDeviceCapabilities, t, setErrorMessage])

  return {
    devices,
    audioDevices,
    selectedDevice,
    selectedAudioDevice,
    setSelectedDevice,
    setSelectedAudioDevice,
    getDevices,
  }
}
