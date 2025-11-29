import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModals } from "@/domains/system-integration"
import type { MediaFile } from "@/features/media/types/media"
import { MediaType } from "@/features/media/types/media"
import { useResources } from "@/features/resources"
import { createLogger } from "@/lib/tauri-logger"
import { useAudioDevices } from "../hooks/use-audio-devices"
import { useAudioPermissions } from "../hooks/use-audio-permissions"
import { useVoiceRecording } from "../hooks/use-voice-recording"
import {
  type AudioFormat,
  type AudioFormatInfo,
  blobToBase64,
  getSupportedAudioFormats,
  isFormatSupportedByMediaRecorder,
  saveVoiceRecording,
} from "../types/tauri"
import { AudioPermissionRequest } from "./audio-permission-request"

const logger = createLogger({ module: "VoiceRecordingModal" })

export function VoiceRecordModal() {
  const { t } = useTranslation()
  const [savePath, setSavePath] = useState<string>("")
  const [isMuted] = useState<boolean>(true)
  const [selectedFormat, setSelectedFormat] = useState<AudioFormat>("webm")
  const [audioFormats, setAudioFormats] = useState<AudioFormatInfo[]>([])
  const { isModalOpen, closeModal } = useModals()
  const { addMedia } = useResources()

  // Проверяем поддержку MediaDevices API
  const [isMediaDevicesSupported] = useState(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  })

  // Используем хук для управления разрешениями на доступ к микрофону
  const { permissionStatus, errorMessage, requestPermissions, setErrorMessage } = useAudioPermissions()

  // Используем хук для управления аудио устройствами
  const { audioDevices, selectedAudioDevice, setSelectedAudioDevice, getDevices } = useAudioDevices({
    setErrorMessage,
  })

  // Функция для сохранения аудиозаписи через Tauri
  const saveAudioToServer = useCallback(
    async (blob: Blob, fileName: string) => {
      try {
        // Конвертируем blob в base64
        const base64Data = await blobToBase64(blob)

        // Убираем расширение из имени файла если есть
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "")

        // Сохраняем через Tauri
        const result = await saveVoiceRecording({
          audioData: base64Data,
          fileName: fileNameWithoutExt,
          format: selectedFormat,
          useSubdirectory: true,
        })

        logger.info("Аудиозапись сохранена", {
          filePath: result.filePath,
          fileName: result.fileName,
          fileSize: result.fileSize,
        })

        // Создаем объект MediaFile для добавления в медиатеку
        const mediaFile: MediaFile = {
          id: `audio-${Date.now()}`, // Генерируем временный ID
          path: result.filePath,
          name: result.fileName,
          type: MediaType.Audio,
          size: result.fileSize,
          isAudio: true,
          isVideo: false,
          isImage: false,
          createdAt: new Date(),
          // Дополнительные поля можно будет заполнить позже через getMediaMetadata
        }

        // Добавляем в медиатеку
        await addMedia(mediaFile)

        // Закрываем диалог после успешного сохранения
        closeModal()
      } catch (error) {
        logger.error("Ошибка при сохранении аудиозаписи", { error })
        setErrorMessage(t("dialogs.voiceRecord.saveError", "Ошибка при сохранении аудиозаписи"))
      }
    },
    [closeModal, setErrorMessage, t, selectedFormat, addMedia],
  )

  // Используем хук для управления записью голоса
  const {
    isRecording,
    showCountdown,
    recordingTime,
    isDeviceReady,
    countdown,
    setCountdown,
    audioRef,
    formatTime,
    stopRecording,
    startCountdown,
    initAudio,
    cleanup,
  } = useVoiceRecording({
    selectedAudioDevice,
    isMuted,
    setErrorMessage,
    onSaveRecording: saveAudioToServer,
    audioFormat: selectedFormat,
  })

  // Получаем устройства после получения разрешений
  const getDevicesAfterPermissions = useCallback(async () => {
    try {
      // Запрашиваем разрешения с помощью хука
      const permissionGranted = await requestPermissions()

      if (permissionGranted) {
        // Если разрешения получены, получаем список устройств
        await getDevices()
      }
    } catch (error) {
      logger.error("Ошибка при получении устройств после разрешений", { error })
    }
  }, [requestPermissions, getDevices])

  // Загружаем поддерживаемые форматы при открытии
  useEffect(() => {
    if (isModalOpen) {
      void getSupportedAudioFormats().then((formats) => {
        // Фильтруем форматы, которые поддерживаются MediaRecorder
        const supportedFormats = formats.filter((format) => isFormatSupportedByMediaRecorder(format.format))
        setAudioFormats(supportedFormats)

        // Если текущий формат не поддерживается, выбираем первый доступный
        if (!supportedFormats.some((f) => f.format === selectedFormat)) {
          setSelectedFormat(supportedFormats[0]?.format || "webm")
        }
      })
    }
  }, [isModalOpen, selectedFormat])

  // Запрашиваем устройства и запускаем микрофон при открытии модального окна
  useEffect(() => {
    if (isModalOpen) {
      void getDevicesAfterPermissions()
    } else {
      cleanup()
    }
  }, [isModalOpen, getDevicesAfterPermissions, cleanup])

  // Инициализируем микрофон при изменении устройства
  useEffect(() => {
    if (isModalOpen && selectedAudioDevice) {
      void initAudio()
    }
  }, [isModalOpen, selectedAudioDevice, initAudio])

  // Если MediaDevices не поддерживается, показываем сообщение
  if (!isMediaDevicesSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-lg font-semibold mb-4">
          {t("dialogs.voiceRecord.notSupported", "Запись звука недоступна")}
        </h3>
        <p className="text-muted-foreground mb-6">
          {t(
            "dialogs.voiceRecord.notSupportedDescription",
            "Запись звука не поддерживается в десктопном приложении. Эта функция доступна только при использовании Timeline Studio в веб-браузере.",
          )}
        </p>
        <Button onClick={closeModal} variant="outline">
          {t("common.close", "Закрыть")}
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Отображаем компонент запроса разрешений */}
      <AudioPermissionRequest
        permissionStatus={permissionStatus}
        errorMessage={errorMessage}
        onRequestPermissions={requestPermissions}
      />

      {/* Основной контент */}
      {permissionStatus === "granted" && (
        <>
          {/* Аудио элемент для предпросмотра (скрытый) */}
          <audio ref={audioRef} autoPlay muted={isMuted} />

          {/* Настройки устройств */}
          <div className="mb-8 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5">
            <div className="text-sm text-gray-300">{t("dialogs.voiceRecord.device", { defaultValue: "Device" })}:</div>
            <div className="flex items-center gap-2">
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice} disabled={isRecording}>
                <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full border-[#444] bg-[#222]">
                  {audioDevices.map(
                    (device) =>
                      device.deviceId && (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId}
                          className="text-white hover:bg-[#333] focus:bg-[#333]"
                        >
                          {device.label}
                        </SelectItem>
                      ),
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-[#444] bg-[#222] hover:bg-[#333]"
                onClick={getDevices}
                title={t("dialogs.voiceRecord.refreshDevices", {
                  defaultValue: "Refresh devices",
                })}
              >
                <RefreshCw size={16} />
              </Button>
            </div>

            <div className="text-sm text-gray-300">
              {t("dialogs.voiceRecord.savePath", { defaultValue: "Save to" })}:
            </div>
            <Input
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
              className="border-[#444] bg-[#222] text-white focus:border-[#666]"
              placeholder="/Users/username/Movies"
              disabled={isRecording}
            />

            <div className="text-sm text-gray-300">
              {t("dialogs.voiceRecord.countdown", { defaultValue: "Countdown" })}:
            </div>
            <Input
              type="number"
              min="0"
              max="10"
              value={countdown}
              onChange={(e) => setCountdown(Number.parseInt(e.target.value, 10) || 0)}
              className="w-20 border-[#444] bg-[#222] text-white focus:border-[#666]"
              disabled={isRecording}
            />

            <div className="text-sm text-gray-300">{t("dialogs.voiceRecord.format", { defaultValue: "Format" })}:</div>
            <Select
              value={selectedFormat}
              onValueChange={(value) => setSelectedFormat(value as AudioFormat)}
              disabled={isRecording}
            >
              <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-full border-[#444] bg-[#222]">
                {audioFormats.map((format) => (
                  <SelectItem
                    key={format.format}
                    value={format.format}
                    className="text-white hover:bg-[#333] focus:bg-[#333]"
                  >
                    <div className="flex flex-col items-start">
                      <span>{format.name}</span>
                      <span className="text-xs text-gray-400">{format.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Запись */}
          <div className="mt-auto flex flex-col items-center pt-4">
            {/* Отображаем обратный отсчет */}
            {showCountdown && (
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-4xl font-bold">
                {countdown}
              </div>
            )}

            {/* Отображаем время записи */}
            {isRecording && (
              <div className="mb-4 text-center">
                <div className="text-lg font-semibold">
                  {t("dialogs.voiceRecord.recordingTime", { defaultValue: "Recording time" })}{" "}
                  {formatTime(recordingTime)}
                </div>
                <div className="mt-2 h-2 w-full bg-gray-700">
                  <div className="h-2 bg-red-600" style={{ width: `${Math.min(100, (recordingTime / 300) * 100)}%` }} />
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-center gap-6">
              {!isRecording ? (
                <Button
                  className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                  onClick={startCountdown}
                  disabled={!isDeviceReady}
                  title={t("dialogs.voiceRecord.startRecording", {
                    defaultValue: "Start Recording",
                  })}
                  aria-label={t("dialogs.voiceRecord.startRecording", {
                    defaultValue: "Start Recording",
                  })}
                >
                  <div className="h-5 w-5 animate-pulse rounded-full bg-white" />
                </Button>
              ) : (
                <Button
                  className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                  onClick={stopRecording}
                  title={t("dialogs.voiceRecord.stopRecording", {
                    defaultValue: "Stop Recording",
                  })}
                  aria-label={t("dialogs.voiceRecord.stopRecording", {
                    defaultValue: "Stop Recording",
                  })}
                >
                  <div className="h-5 w-5 rounded bg-white" />
                </Button>
              )}
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">
              {t("dialogs.voiceRecord.hint", {
                defaultValue:
                  "Click the record button to start. The recording will be automatically added to the media library.",
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
