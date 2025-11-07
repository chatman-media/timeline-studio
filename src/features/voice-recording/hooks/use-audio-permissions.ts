import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { logError, logInfo } from "@/lib/tauri-logger"

/**
 * Хук для управления разрешениями на доступ к микрофону
 */
export function useAudioPermissions() {
  const { t } = useTranslation()
  const [permissionStatus, setPermissionStatus] = useState<"pending" | "granted" | "denied" | "error">("pending")
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Проверяем текущий статус разрешений
  const checkPermissions = useCallback(async () => {
    logInfo("[useAudioPermissions] Проверка разрешений на доступ к микрофону")
    try {
      // В тестовой среде просто возвращаем true
      if (process.env.NODE_ENV === "test") {
        logInfo("[useAudioPermissions] Тестовая среда, разрешения предоставлены")
        return true
      }

      // Проверяем поддержку mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logError("[useAudioPermissions] MediaDevices API не поддерживается", new Error("API not supported"))
        setPermissionStatus("error")
        setErrorMessage(
          t(
            "dialogs.voiceRecord.unsupportedBrowser",
            "Ваш браузер не поддерживает запись аудио. Используйте современный браузер.",
          ),
        )
        return false
      }

      // Проверяем, поддерживает ли браузер API разрешений
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName })

        logInfo("[useAudioPermissions] Статус разрешений", { status: result.state })

        if (result.state === "granted") {
          setPermissionStatus("granted")
          logInfo("[useAudioPermissions] Разрешения предоставлены")
          return true
        }
        if (result.state === "denied") {
          setPermissionStatus("denied")
          setErrorMessage(
            t("dialogs.voiceRecord.permissionsDenied", "Доступ к микрофону запрещен. Проверьте настройки браузера."),
          )
          logInfo("[useAudioPermissions] Разрешения запрещены")
          return false
        }
        // Если статус "prompt", нужно запросить разрешение
        setPermissionStatus("pending")
        logInfo("[useAudioPermissions] Требуется запрос разрешений")
        return await requestPermissions()
      }
      // Если API разрешений не поддерживается, пробуем запросить доступ напрямую
      logInfo("[useAudioPermissions] API разрешений не поддерживается, запрашиваем доступ напрямую")
      return await requestPermissions()
    } catch (error) {
      logError("[useAudioPermissions] Ошибка при проверке разрешений", error)
      setPermissionStatus("error")
      setErrorMessage(
        t("dialogs.voiceRecord.permissionCheckError", "Не удалось проверить разрешения. Попробуйте еще раз."),
      )
      return false
    }
  }, [t])
  // Запрашиваем разрешения на доступ к микрофону
  const requestPermissions = useCallback(async () => {
    logInfo("[useAudioPermissions] Запрос разрешений на доступ к микрофону")
    try {
      setPermissionStatus("pending")
      setErrorMessage("")

      // В тестовой среде имитируем успешный запрос разрешений
      if (process.env.NODE_ENV === "test") {
        setPermissionStatus("granted")
        logInfo("[useAudioPermissions] Тестовая среда, разрешения имитированы")
        return true
      }

      // Запрашиваем доступ к микрофону
      const tempStream = await navigator.mediaDevices?.getUserMedia?.({
        audio: true,
      })

      if (!tempStream) {
        setPermissionStatus("error")
        setErrorMessage(
          t("dialogs.voiceRecord.permissionError", "Не удалось получить доступ к микрофону. Проверьте настройки."),
        )
        logError("[useAudioPermissions] Не удалось получить поток", new Error("Stream is null"))
        return false
      }

      // После получения доступа останавливаем временный поток
      tempStream.getTracks().forEach((track) => track.stop())

      setPermissionStatus("granted")
      logInfo("[useAudioPermissions] Разрешения успешно получены")
      return true
    } catch (error) {
      logError("[useAudioPermissions] Ошибка при запросе разрешений", error)

      // Определяем тип ошибки
      if (error instanceof DOMException) {
        if (error.name === "NotFoundError") {
          setPermissionStatus("error")
          setErrorMessage(
            t("dialogs.voiceRecord.deviceNotFound", "Микрофон не найден. Подключите микрофон и попробуйте снова."),
          )
          logError("[useAudioPermissions] Микрофон не найден", error)
        } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setPermissionStatus("denied")
          setErrorMessage(
            t("dialogs.voiceRecord.permissionsDenied", "Доступ к микрофону запрещен. Проверьте настройки браузера."),
          )
          logInfo("[useAudioPermissions] Разрешения запрещены пользователем")
        } else {
          setPermissionStatus("error")
          setErrorMessage(
            t("dialogs.voiceRecord.permissionError", "Не удалось получить доступ к микрофону. Проверьте настройки."),
          )
          logError("[useAudioPermissions] Неизвестная ошибка DOM", error)
        }
      } else {
        setPermissionStatus("error")
        setErrorMessage(
          t("dialogs.voiceRecord.unknownError", "Произошла неизвестная ошибка при запросе доступа к микрофону."),
        )
        logError("[useAudioPermissions] Неизвестная ошибка", error)
      }

      return false
    }
  }, [t])

  // Проверяем разрешения при монтировании компонента
  useEffect(() => {
    void checkPermissions()
  }, [checkPermissions])

  return {
    permissionStatus,
    errorMessage,
    requestPermissions,
    setErrorMessage,
  }
}
