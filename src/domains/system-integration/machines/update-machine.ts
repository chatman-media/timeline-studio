/**
 * Update Machine - System Integration Domain
 *
 * XState машина для управления процессом обновлений
 * Управляет состояниями проверки, загрузки и установки обновлений
 * Перенесено из src/features/updates/services/update-machine.ts
 */

import { type Actor, assign, fromPromise, setup } from "xstate"
import type { UpdateService } from "@/features/updates/services/update-service"
import { updateService as defaultUpdateService } from "@/features/updates/services/update-service"
import type { UpdateCheckResult, UpdateMachineContext, UpdateMachineEvent } from "@/features/updates/types"

/**
 * Интерфейс для инъекции зависимостей
 */
export interface UpdateMachineInput {
  updateService?: UpdateService
}

/**
 * Фабрика для создания сервисов с возможностью инъекции зависимостей
 */
const createUpdateServices = (updateService: UpdateService) => ({
  checkForUpdates: fromPromise(async (): Promise<UpdateCheckResult> => {
    return await updateService.checkForUpdates()
  }),
  downloadAndInstall: fromPromise(async (): Promise<void> => {
    await updateService.downloadAndInstall()
  }),
  getCurrentVersion: fromPromise(async (): Promise<string> => {
    return await updateService.getCurrentVersion()
  }),
})

/**
 * XState машина для управления обновлениями
 * @param input - Опциональные зависимости (для тестирования)
 */
export const createUpdateMachine = (input: UpdateMachineInput = {}) => {
  const updateService = input.updateService ?? defaultUpdateService
  const services = createUpdateServices(updateService)

  return setup({
    types: {
      context: {} as UpdateMachineContext,
      events: {} as UpdateMachineEvent,
    },
    actors: {
      checkForUpdates: services.checkForUpdates,
      downloadAndInstall: services.downloadAndInstall,
      getCurrentVersion: services.getCurrentVersion,
    },
    actions: {
      // Сохранить результат проверки обновлений
      saveUpdateCheckResult: assign({
        availableUpdate: ({ event }: { event: any }) => {
          if (event.type === "xstate.done.actor.checkForUpdates") {
            const result = event.output as UpdateCheckResult
            return result.available ? result.update_info : undefined
          }
          return undefined
        },
        lastCheckTime: () => new Date(),
        error: () => undefined,
      }),

      // Сохранить ошибку
      saveError: assign({
        error: ({ event }: { event: any }) => {
          if (
            event.type === "xstate.error.actor.checkForUpdates" ||
            event.type === "xstate.error.actor.downloadAndInstall"
          ) {
            return event.error instanceof Error ? event.error.message : String(event.error)
          }
          return undefined
        },
      }),

      // Очистить ошибку
      clearError: assign({
        error: () => undefined,
      }),

      // Сохранить текущую версию
      saveCurrentVersion: assign({
        currentVersion: ({ event }: { event: any }) => {
          if (event.type === "xstate.done.actor.getCurrentVersion") {
            return event.output as string
          }
          return "unknown"
        },
      }),

      // Включить автопроверку
      enableAutoCheck: assign({
        autoCheckEnabled: () => true,
        autoCheckInterval: ({ event }) => {
          return event.type === "ENABLE_AUTO_CHECK" ? event.intervalMinutes : 60
        },
      }),

      // Отключить автопроверку
      disableAutoCheck: assign({
        autoCheckEnabled: () => false,
      }),

      // Обновить прогресс загрузки
      updateProgress: assign({
        progress: ({ event }) => {
          if (event.type === "UPDATE_PROGRESS") {
            return event.progress
          }
          return undefined
        },
      }),

      // Очистить доступное обновление
      clearAvailableUpdate: assign({
        availableUpdate: () => undefined,
      }),
    },
    guards: {
      // Проверить, доступно ли обновление
      hasAvailableUpdate: ({ context }) => {
        return !!context.availableUpdate
      },

      // Проверить, включена ли автопроверка
      isAutoCheckEnabled: ({ context }) => {
        return context.autoCheckEnabled
      },
    },
  }).createMachine({
    id: "system-integration-update",

    context: {
      currentVersion: "unknown",
      autoCheckEnabled: false,
      autoCheckInterval: 60,
    },

    initial: "initializing",

    states: {
      // Инициализация - получение текущей версии
      initializing: {
        invoke: {
          id: "getCurrentVersion",
          src: "getCurrentVersion",
          onDone: {
            target: "idle",
            actions: "saveCurrentVersion",
          },
          onError: {
            target: "idle",
            actions: "saveError",
          },
        },
      },

      // Ожидание действий пользователя
      idle: {
        on: {
          CHECK_FOR_UPDATES: "checking",
          ENABLE_AUTO_CHECK: {
            actions: ["enableAutoCheck"],
          },
          DISABLE_AUTO_CHECK: {
            actions: ["disableAutoCheck"],
          },
        },
      },

      // Проверка обновлений
      checking: {
        invoke: {
          id: "checkForUpdates",
          src: "checkForUpdates",
          onDone: [
            {
              target: "updateAvailable",
              guard: ({ event }) => {
                const result = event.output
                return result.available
              },
              actions: "saveUpdateCheckResult",
            },
            {
              target: "idle",
              actions: "saveUpdateCheckResult",
            },
          ],
          onError: {
            target: "error",
            actions: "saveError",
          },
        },
        on: {
          CANCEL_UPDATE: "idle",
        },
      },

      // Обновление доступно
      updateAvailable: {
        on: {
          DOWNLOAD_UPDATE: "downloading",
          DISMISS: {
            target: "idle",
            actions: "clearAvailableUpdate",
          },
          CHECK_FOR_UPDATES: "checking",
        },
      },

      // Загрузка обновления
      downloading: {
        invoke: {
          id: "downloadAndInstall",
          src: "downloadAndInstall",
          onDone: {
            target: "readyToInstall",
            actions: "clearError",
          },
          onError: {
            target: "error",
            actions: "saveError",
          },
        },
        on: {
          CANCEL_UPDATE: "updateAvailable",
          UPDATE_PROGRESS: {
            actions: "updateProgress",
          },
        },
      },

      // Готово к установке
      readyToInstall: {
        on: {
          INSTALL_UPDATE: "installing",
          CANCEL_UPDATE: "updateAvailable",
        },
      },

      // Установка обновления
      installing: {
        // В реальной реализации здесь может быть отдельный сервис для установки
        after: {
          2000: "installed", // Симуляция времени установки
        },
        on: {
          CANCEL_UPDATE: "readyToInstall",
        },
      },

      // Обновление установлено
      installed: {
        on: {
          DISMISS: {
            target: "idle",
            actions: "clearAvailableUpdate",
          },
        },
      },

      // Состояние ошибки
      error: {
        on: {
          RETRY: "idle",
          DISMISS: {
            target: "idle",
            actions: "clearError",
          },
          CHECK_FOR_UPDATES: {
            target: "checking",
            actions: "clearError",
          },
        },
      },
    },
  })
}

// Экспортируем машину с дефолтными зависимостями для обратной совместимости
export const updateMachine = createUpdateMachine()

export type UpdateMachine = ReturnType<typeof createUpdateMachine>
export type UpdateMachineActor = Actor<UpdateMachine>
