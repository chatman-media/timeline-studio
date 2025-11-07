import { useCallback, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { logError, logInfo } from "@/lib/tauri-logger"

interface UseVoiceRecordingProps {
  selectedAudioDevice: string
  isMuted: boolean
  setErrorMessage: (message: string) => void
  onSaveRecording: (blob: Blob, fileName: string) => Promise<void>
  audioFormat?: string
}

export function useVoiceRecording({
  selectedAudioDevice,
  isMuted,
  setErrorMessage,
  onSaveRecording,
  audioFormat = "webm",
}: UseVoiceRecordingProps) {
  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [showCountdown, setShowCountdown] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isDeviceReady, setIsDeviceReady] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(3)

  // Refs для управления потоком и записью
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Форматируем время записи в формат MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Останавливаем запись
  const stopRecording = useCallback(() => {
    logInfo("[useVoiceRecording] Остановка записи")
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
    setRecordingTime(0)
    logInfo("[useVoiceRecording] Запись остановлена")
  }, [])

  // Запускаем запись
  const startRecording = useCallback(() => {
    logInfo("[useVoiceRecording] Начало записи")
    if (!streamRef.current) {
      logError("[useVoiceRecording] Поток не доступен", new Error("Stream is null"))
      return
    }

    chunksRef.current = []

    // Определяем MIME тип на основе формата
    const mimeTypes: Record<string, string> = {
      webm: "audio/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    }
    const mimeType = mimeTypes[audioFormat] || "audio/webm"

    // Пробуем создать MediaRecorder с нужным форматом
    let options: MediaRecorderOptions = { mimeType }

    // Для WebM пробуем разные кодеки
    if (audioFormat === "webm") {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options = { mimeType: "audio/webm;codecs=opus" }
      } else if (MediaRecorder.isTypeSupported("audio/webm;codecs=vorbis")) {
        options = { mimeType: "audio/webm;codecs=vorbis" }
      }
    }

    logInfo("[useVoiceRecording] Параметры записи", { format: audioFormat, mimeType: options.mimeType })

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
    } catch (e) {
      logError("[useVoiceRecording] MediaRecorder не поддерживает данный формат", e)
      try {
        // Пробуем без опций
        mediaRecorderRef.current = new MediaRecorder(streamRef.current)
      } catch (e) {
        logError("[useVoiceRecording] MediaRecorder не поддерживается браузером", e)
        setErrorMessage(t("dialogs.voiceRecord.recordingNotSupported", "Запись не поддерживается браузером"))
        return
      }
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
        logInfo("[useVoiceRecording] Получена часть аудио данных", { size: event.data.size })
      }
    }

    mediaRecorderRef.current.onstop = () => {
      const blobType = mimeType.split(";")[0] // Убираем кодеки из MIME типа
      const blob = new Blob(chunksRef.current, { type: blobType })
      const now = new Date()
      const fileName = `voice_recording_${now.toISOString().replace(/:/g, "-")}.${audioFormat}`
      logInfo("[useVoiceRecording] Запись завершена", { fileName, size: blob.size })
      void onSaveRecording(blob, fileName)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)
    logInfo("[useVoiceRecording] MediaRecorder запущен")

    // Запускаем таймер для отслеживания времени записи
    let seconds = 0
    timerRef.current = window.setInterval(() => {
      seconds++
      setRecordingTime(seconds)
    }, 1000)
  }, [onSaveRecording, audioFormat, setErrorMessage, t])

  // Запускаем обратный отсчет перед записью
  const startCountdown = useCallback(() => {
    logInfo("[useVoiceRecording] Запуск обратного отсчета", { countdown })
    if (!isDeviceReady) {
      logError("[useVoiceRecording] Устройство не готово", new Error("Device not ready"))
      return
    }

    setShowCountdown(true)
    let count = countdown
    setCountdown(count)

    countdownTimerRef.current = window.setInterval(() => {
      count--
      setCountdown(count)
      logInfo("[useVoiceRecording] Обратный отсчет", { current: count })

      if (count <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
        setShowCountdown(false)
        logInfo("[useVoiceRecording] Обратный отсчет завершен, начинаем запись")
        startRecording()
      }
    }, 1000)
  }, [isDeviceReady, countdown, startRecording])

  // Инициализация потока с микрофона
  const initAudio = useCallback(async () => {
    logInfo("[useVoiceRecording] Инициализация микрофона")
    if (!selectedAudioDevice) {
      logInfo("[useVoiceRecording] Устройство не выбрано")
      return
    }

    // Проверяем доступность API mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      logError("[useVoiceRecording] MediaDevices API недоступен", new Error("API not available"))
      setErrorMessage(
        t(
          "dialogs.voiceRecord.mediaDevicesNotSupported",
          "Запись звука не поддерживается в данном приложении. Функция доступна только в веб-браузере.",
        ),
      )
      setIsDeviceReady(false)
      return
    }

    try {
      logInfo("[useVoiceRecording] Инициализация микрофона с устройством", { device: selectedAudioDevice })

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Настраиваем ограничения для аудио потока
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: { exact: selectedAudioDevice },
        },
      }

      // Запрашиваем поток с микрофона
      const stream = await navigator.mediaDevices?.getUserMedia?.(constraints)

      if (!stream) {
        logError("[useVoiceRecording] Не удалось получить поток с микрофона", new Error("Stream is null"))
        setErrorMessage(t("dialogs.voiceRecord.streamError", "Не удалось инициализировать микрофон"))
        setIsDeviceReady(false)
        return
      }

      streamRef.current = stream

      // Создаем аудио элемент для предпросмотра
      if (audioRef.current) {
        audioRef.current.srcObject = stream
        audioRef.current.muted = isMuted
      }

      setIsDeviceReady(true)
      logInfo("[useVoiceRecording] Микрофон инициализирован успешно")
    } catch (error) {
      logError("[useVoiceRecording] Ошибка при инициализации микрофона", error)
      setErrorMessage(
        t("dialogs.voiceRecord.initError", {
          defaultValue: "Failed to initialize microphone. Please check settings and permissions.",
        }),
      )
      setIsDeviceReady(false)
    }
  }, [selectedAudioDevice, isMuted, t, setErrorMessage])

  // Очистка ресурсов
  const cleanup = useCallback(() => {
    logInfo("[useVoiceRecording] Очистка ресурсов")
    if (isRecording) {
      stopRecording()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    setIsDeviceReady(false)
    logInfo("[useVoiceRecording] Ресурсы очищены")
  }, [isRecording, stopRecording])

  return {
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
  }
}
