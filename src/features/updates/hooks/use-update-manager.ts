/**
 * useUpdateManager - React hook для управления обновлениями приложения
 * Предоставляет интерфейс для работы с XState машиной обновлений
 */

import { useMachine } from "@xstate/react"
import { useEffect } from "react"
// Используем машину из домена
import { updateMachine } from "@/domains/system-integration/machines/update-machine"
import { updateService } from ".."
import type { AutoCheckSettings, UpdateAvailability, UpdateEventPayload, UpdateMachineContext } from "../types"

export interface UseUpdateManagerReturn {
  // Состояние
  state: string
  context: UpdateMachineContext

  // Флаги состояния
  isInitializing: boolean
  isIdle: boolean
  isChecking: boolean
  isUpdateAvailable: boolean
  isDownloading: boolean
  isReadyToInstall: boolean
  isInstalling: boolean
  isInstalled: boolean
  isError: boolean

  // Данные
  currentVersion: string
  availableUpdate?: UpdateMachineContext["availableUpdate"]
  error?: string
  progress?: UpdateMachineContext["progress"]
  autoCheckSettings: AutoCheckSettings

  // Действия
  checkForUpdates: () => void
  downloadUpdate: () => void
  installUpdate: () => void
  cancelUpdate: () => void
  retry: () => void
  dismiss: () => void
  enableAutoCheck: (intervalMinutes?: number) => void
  disableAutoCheck: () => void
}

/**
 * Hook для управления обновлениями приложения
 */
export function useUpdateManager(): UseUpdateManagerReturn {
  const [state, send] = useMachine(updateMachine)

  const { context } = state

  // Подписка на события UpdateService для синхронизации прогресса
  useEffect(() => {
    const unsubscribe = updateService.subscribe((payload: UpdateEventPayload) => {
      // Синхронизируем прогресс загрузки
      if (payload.progress) {
        const progress = {
          downloaded: payload.progress.downloaded,
          total: payload.progress.content_length,
          percentage: payload.progress.content_length
            ? Math.round((payload.progress.downloaded / payload.progress.content_length) * 100)
            : 0,
          chunk_length: payload.progress.chunk_length,
          content_length: payload.progress.content_length,
        }
        send({ type: "UPDATE_PROGRESS", progress })
      }
    })

    return unsubscribe
  }, [send])

  // Настройка автопроверки при изменении настроек
  useEffect(() => {
    if (context.autoCheckEnabled) {
      updateService.enableAutoCheck(context.autoCheckInterval)
    } else {
      updateService.disableAutoCheck()
    }

    return () => {
      updateService.disableAutoCheck()
    }
  }, [context.autoCheckEnabled, context.autoCheckInterval])

  // Флаги состояния для удобства использования
  const isInitializing = state.matches("initializing")
  const isIdle = state.matches("idle")
  const isChecking = state.matches("checking")
  const isUpdateAvailable = state.matches("updateAvailable")
  const isDownloading = state.matches("downloading")
  const isReadyToInstall = state.matches("readyToInstall")
  const isInstalling = state.matches("installing")
  const isInstalled = state.matches("installed")
  const isError = state.matches("error")

  // Действия
  const checkForUpdates = () => {
    send({ type: "CHECK_FOR_UPDATES" })
  }

  const downloadUpdate = () => {
    send({ type: "DOWNLOAD_UPDATE" })
  }

  const installUpdate = () => {
    send({ type: "INSTALL_UPDATE" })
  }

  const cancelUpdate = () => {
    send({ type: "CANCEL_UPDATE" })
  }

  const retry = () => {
    send({ type: "RETRY" })
  }

  const dismiss = () => {
    send({ type: "DISMISS" })
  }

  const enableAutoCheck = (intervalMinutes = 60) => {
    send({ type: "ENABLE_AUTO_CHECK", intervalMinutes })
  }

  const disableAutoCheck = () => {
    send({ type: "DISABLE_AUTO_CHECK" })
  }

  return {
    // Состояние
    state: state.value as string,
    context,

    // Флаги состояния
    isInitializing,
    isIdle,
    isChecking,
    isUpdateAvailable,
    isDownloading,
    isReadyToInstall,
    isInstalling,
    isInstalled,
    isError,

    // Данные
    currentVersion: context.currentVersion,
    availableUpdate: context.availableUpdate,
    error: context.error,
    progress: context.progress,
    autoCheckSettings: {
      enabled: context.autoCheckEnabled,
      intervalMinutes: context.autoCheckInterval,
    },

    // Действия
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    cancelUpdate,
    retry,
    dismiss,
    enableAutoCheck,
    disableAutoCheck,
  }
}

/**
 * Hook для простой проверки доступности обновлений
 * Упрощенная версия для компонентов, которым нужна только информация о доступности
 */
export function useUpdateAvailability(): UpdateAvailability {
  const { isUpdateAvailable, availableUpdate, checkForUpdates, currentVersion } = useUpdateManager()

  return {
    hasUpdate: isUpdateAvailable,
    updateInfo: availableUpdate,
    currentVersion,
    checkForUpdates,
  }
}
