import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@timeline-studio/ui/components/button"
import { useNotifications } from "@timeline-studio/core/hooks"
import { createLogger } from "@/lib/tauri-logger"
import {
  useCameraPermissions,
  useCameraStream,
  useDeviceCapabilities,
  useDevices,
  useRecording,
  useScreenCapture,
} from "../hooks"
import { cleanupMediaStream, cleanupVideoElement } from "../utils"
import { CameraPermissionRequest, CameraPreview, CameraSettings, RecordingControls } from "."

const logger = createLogger({ module: "CameraCaptureModal" })

interface CameraCaptureModalProps {
  isOpen?: boolean
  onClose?: () => void | Promise<void>
  "data-oid"?: string
}

const noop = () => {}

/**
 * Модальное окно для захвата видео с камеры
 */
export function CameraCaptureModal({ isOpen = true, onClose = noop }: CameraCaptureModalProps) {
  const { t } = useTranslation()
  const { showSuccess, showError } = useNotifications()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [captureMode, setCaptureMode] = useState<"camera" | "screen">("camera")

  // Проверяем поддержку MediaDevices API
  const [isMediaDevicesSupported] = useState(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  })

  // Получаем возможности устройства (разрешения, частоты кадров)
  const [selectedResolution, setSelectedResolution] = useState<string>("")
  const [frameRate, setFrameRate] = useState<number>(30)
  const {
    availableResolutions,
    supportedResolutions,
    supportedFrameRates,
    isLoadingCapabilities,
    getDeviceCapabilities,
  } = useDeviceCapabilities(setSelectedResolution, setFrameRate)

  // Получаем список устройств
  const {
    devices,
    audioDevices,
    selectedDevice,
    selectedAudioDevice,
    setSelectedDevice,
    setSelectedAudioDevice,
    getDevices,
  } = useDevices(getDeviceCapabilities, setErrorMessage)

  // Запрашиваем разрешения на доступ к камере и микрофону
  const { permissionStatus, errorMessage: permissionError, requestPermissions } = useCameraPermissions(getDevices)

  // Управляем потоком с камеры
  const { isDeviceReady, setIsDeviceReady, initCamera, streamRef } = useCameraStream(
    videoRef,
    selectedDevice,
    selectedAudioDevice,
    selectedResolution,
    frameRate,
    availableResolutions,
    setErrorMessage,
  )

  // Управляем записью экрана
  const {
    screenStream,
    isScreenSharing,
    error: screenError,
    startScreenCapture,
    stopScreenCapture,
  } = useScreenCapture()

  const [isSaving, setIsSaving] = useState(false)

  const handleClose = () => {
    void onClose()
  }

  // Обработка записанного видео
  const handleVideoRecorded = async (blob: Blob, fileName: string) => {
    setIsSaving(true)
    try {
      // Создаем временный путь для записи файла
      const timestamp = Date.now()
      const tempFileName = `camera_recording_${timestamp}_${fileName}`

      // Конвертируем blob в Uint8Array
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Сохраняем файл через Tauri FS API
      const { writeFile } = await import("@tauri-apps/plugin-fs")
      const { BaseDirectory } = await import("@tauri-apps/plugin-fs")
      const tempPath = `recordings/${tempFileName}`

      // Создаем директорию если не существует
      const { mkdir } = await import("@tauri-apps/plugin-fs")
      try {
        await mkdir("recordings", {
          baseDir: BaseDirectory.AppLocalData,
          recursive: true,
        })
      } catch {
        // Директория уже существует
      } // Записываем файл
      await writeFile(tempPath, uint8Array, {
        baseDir: BaseDirectory.AppLocalData,
      })

      // Получаем полный путь к файлу для импорта
      const { resolve } = await import("@tauri-apps/api/path")
      const { appLocalDataDir } = await import("@tauri-apps/api/path")
      const localDataPath = await appLocalDataDir()
      const fullPath = await resolve(localDataPath, "recordings", tempFileName)

      showSuccess(t("dialogs.cameraCapture.recordingSuccess", "Запись успешно сохранена"), fileName)

      logger.info(`Запись сохранена: ${fullPath}`)

      // Закрываем модальное окно
      handleClose()
    } catch (error) {
      logger.error("Ошибка при сохранении записи:", { error })
      showError(t("dialogs.cameraCapture.recordingError", "Ошибка при сохранении записи"), String(error))
    } finally {
      setIsSaving(false)
    }
  }

  // Определяем какой поток использовать для записи
  const activeStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Очищаем предыдущую ссылку
    activeStreamRef.current = null

    if (captureMode === "screen" && screenStream) {
      activeStreamRef.current = screenStream
      // Устанавливаем поток экрана в video элемент
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream
      }
    } else if (captureMode === "camera" && streamRef.current) {
      activeStreamRef.current = streamRef.current
      // Поток камеры уже устанавливается в useCameraStream
    } else {
      // Очищаем video элемент если нет активного потока
      cleanupVideoElement(videoRef.current, "Stream switch video cleanup")
    }
  }, [captureMode, screenStream, streamRef])

  // Управляем записью
  const {
    isRecording,
    recordingTime,
    showCountdown,
    countdown,
    setCountdown,
    startCountdown,
    stopRecording,
    formatRecordingTime,
  } = useRecording(activeStreamRef, 3, handleVideoRecorded)

  // Инициализируем камеру при изменении выбранного устройства или разрешения
  useEffect(() => {
    if (selectedDevice && permissionStatus === "granted") {
      void initCamera()
    }
  }, [selectedDevice, selectedResolution, frameRate, permissionStatus, initCamera])

  // Запрашиваем разрешения при открытии модального окна и останавливаем камеру при закрытии
  useEffect(() => {
    if (isOpen) {
      void requestPermissions()
    } else {
      logger.info("Закрытие модального окна - полная очистка ресурсов")

      // Останавливаем текущую запись
      if (isRecording) {
        stopRecording()
      }

      // Очищаем activeStreamRef
      activeStreamRef.current = null

      // Останавливаем все треки камеры
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Modal close camera cleanup")
        streamRef.current = null
      }

      // Останавливаем запись экрана
      if (isScreenSharing) {
        stopScreenCapture()
      }

      // Очищаем video элемент
      cleanupVideoElement(videoRef.current, "Modal close video cleanup")

      // Сбрасываем состояния
      setIsDeviceReady(false)
      setCaptureMode("camera") // Сбрасываем на камеру
      setErrorMessage("") // Очищаем ошибки
    }
  }, [isOpen, requestPermissions, streamRef, isScreenSharing, stopScreenCapture, isRecording, stopRecording])

  // Обработчик изменения устройства
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId)
    void getDeviceCapabilities(deviceId)
  }

  // Обработчик изменения аудио устройства
  const handleAudioDeviceChange = (deviceId: string) => {
    setSelectedAudioDevice(deviceId)
  }

  // Обработчик изменения разрешения
  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution)
  }

  // Обработчик изменения частоты кадров
  const handleFrameRateChange = (fps: number) => {
    setFrameRate(fps)
  }

  // Обработчик изменения обратного отсчета
  const handleCountdownChange = (value: number) => {
    setCountdown(value)
  }

  // Обработчик переключения режима захвата
  const handleCaptureModeChange = async (mode: "camera" | "screen") => {
    // Останавливаем текущую запись
    if (isRecording) {
      stopRecording()
    }

    // Очищаем activeStreamRef перед переключением
    activeStreamRef.current = null

    // Останавливаем текущий поток с улучшенной очисткой
    if (captureMode === "screen" && isScreenSharing) {
      logger.info("Остановка screen capture при переключении режима")
      stopScreenCapture()
    } else if (captureMode === "camera" && streamRef.current) {
      logger.info("Остановка camera stream при переключении режима")
      cleanupMediaStream(streamRef.current, "Mode switch camera cleanup")
      streamRef.current = null
      setIsDeviceReady(false)
    }

    // Очищаем video элемент
    cleanupVideoElement(videoRef.current, "Mode switch video cleanup")

    // Меняем режим
    setCaptureMode(mode)

    // Запускаем новый поток
    if (mode === "screen") {
      try {
        await startScreenCapture({
          video: true,
          audio: !!selectedAudioDevice,
        })
      } catch (error) {
        logger.error("Failed to start screen capture:", { error })
        setErrorMessage(screenError || "Failed to start screen capture")
      }
    } else if (mode === "camera") {
      if (selectedDevice && permissionStatus === "granted") {
        await initCamera()
      }
    }
  }

  // Если MediaDevices не поддерживается, показываем сообщение
  if (!isMediaDevicesSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center" data-oid="ift6en9">
        <h3 className="text-lg font-semibold mb-4" data-oid="dyv-cx0">
          {t("dialogs.cameraCapture.notSupported", "Запись с камеры недоступна")}
        </h3>
        <p className="text-muted-foreground mb-6" data-oid=".p3sao4">
          {t(
            "dialogs.cameraCapture.notSupportedDescription",
            "Запись с камеры не поддерживается в десктопном приложении. Эта функция доступна только при использовании Timeline Studio в веб-браузере.",
          )}
        </p>
        <Button onClick={handleClose} variant="outline" data-oid="omdb6gg">
          {t("common.close", "Закрыть")}
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Запрос разрешений */}
      <CameraPermissionRequest
        permissionStatus={permissionStatus}
        errorMessage={permissionError || errorMessage}
        onRequestPermissions={requestPermissions}
        data-oid="pfcbqoc"
      />

      <div className="flex flex-row gap-4" data-oid="enm9j9q">
        {/* Левая колонка - видео */}
        <div className="flex flex-col w-3/5" data-oid="1ybqcus">
          {/* Кнопки переключения режима */}
          <div className="flex gap-2 mb-4" data-oid="2eyibg4">
            <Button
              variant={captureMode === "camera" ? "default" : "outline"}
              onClick={() => handleCaptureModeChange("camera")}
              disabled={isRecording}
              className="flex-1"
              data-oid="lubmduz"
            >
              {t("cameraCapture.cameraMode", "Camera")}
            </Button>
            <Button
              variant={captureMode === "screen" ? "default" : "outline"}
              onClick={() => handleCaptureModeChange("screen")}
              disabled={isRecording}
              className="flex-1"
              data-oid="xfhgt:b"
            >
              {t("cameraCapture.screenMode", "Screen")}
            </Button>
          </div>

          {/* Предпросмотр видео */}
          <CameraPreview
            videoRef={videoRef}
            isDeviceReady={captureMode === "camera" ? isDeviceReady : isScreenSharing}
            showCountdown={showCountdown}
            countdown={countdown}
            data-oid="4_2351j"
          />

          {/* Управление записью */}
          <RecordingControls
            isRecording={isRecording}
            recordingTime={recordingTime}
            isDeviceReady={captureMode === "camera" ? isDeviceReady : isScreenSharing}
            onStartRecording={startCountdown}
            onStopRecording={stopRecording}
            formatRecordingTime={formatRecordingTime}
            data-oid="k5cg:yw"
          />

          {/* Индикатор сохранения */}
          {isSaving && (
            <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md text-center" data-oid="npo5.9z">
              <div className="text-sm text-blue-700 dark:text-blue-300" data-oid="_mbtkee">
                {t("cameraCapture.saving", "Сохранение записи...")}
              </div>
            </div>
          )}
        </div>

        {/* Правая колонка - настройки */}
        <div className="flex flex-col w-2/5" data-oid="5i7stpm">
          {/* Настройки камеры - показываем только в режиме камеры */}
          {captureMode === "camera" ? (
            <CameraSettings
              devices={devices}
              selectedDevice={selectedDevice}
              onDeviceChange={handleDeviceChange}
              audioDevices={audioDevices}
              selectedAudioDevice={selectedAudioDevice}
              onAudioDeviceChange={handleAudioDeviceChange}
              availableResolutions={availableResolutions}
              selectedResolution={selectedResolution}
              onResolutionChange={handleResolutionChange}
              supportedResolutions={supportedResolutions}
              frameRate={frameRate}
              onFrameRateChange={handleFrameRateChange}
              supportedFrameRates={supportedFrameRates}
              countdown={countdown}
              onCountdownChange={handleCountdownChange}
              isRecording={isRecording}
              isLoadingCapabilities={isLoadingCapabilities}
              data-oid="4a5ik8_"
            />
          ) : (
            // Настройки для записи экрана
            <div className="space-y-4 p-4" data-oid="g2rppq_">
              <h3 className="text-lg font-semibold" data-oid="owqq4dn">
                {t("cameraCapture.screenSettings", "Screen Recording Settings")}
              </h3>

              <div className="text-sm text-muted-foreground" data-oid="nnjtzye">
                {t("cameraCapture.screenInfo", "Select a window, tab, or entire screen to record")}
              </div>

              {/* Аудио устройство для записи экрана */}
              <div className="space-y-2" data-oid="9.qa17d">
                <label className="text-sm font-medium" data-oid="::.34ly">
                  {t("cameraCapture.microphone", "Microphone")}
                </label>
                <select
                  value={selectedAudioDevice || ""}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={isRecording}
                  data-oid="scarc.2"
                >
                  <option value="" data-oid="9.s986i">
                    {t("cameraCapture.noAudio", "No Audio")}
                  </option>
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId} data-oid="qucpzq2">
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Настройки обратного отсчета */}
              <div className="space-y-2" data-oid=":p-b20b">
                <label className="text-sm font-medium" data-oid="alr:95n">
                  {t("cameraCapture.countdown", "Countdown")}
                </label>
                <select
                  value={countdown}
                  onChange={(e) => handleCountdownChange(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={isRecording}
                  data-oid="evs_qx."
                >
                  <option value={0} data-oid="_6ck8g2">
                    {t("cameraCapture.noCountdown", "No countdown")}
                  </option>
                  <option value={3} data-oid="6-_njm6">
                    3 {t("cameraCapture.seconds", "seconds")}
                  </option>
                  <option value={5} data-oid="vpjn843">
                    5 {t("cameraCapture.seconds", "seconds")}
                  </option>
                  <option value={10} data-oid="nhkdxrk">
                    10 {t("cameraCapture.seconds", "seconds")}
                  </option>
                </select>
              </div>

              {screenError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" data-oid="fcyrf2h">
                  {screenError}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-[#333] p-4" data-oid="djc.320">
        <Button
          className="bg-[#0CC] px-6 font-medium text-black hover:bg-[#0AA]"
          onClick={handleClose}
          data-oid="stf77oc"
        >
          {t("common.ok")}
        </Button>
      </div>
    </>
  )
}
