import { type Actor, assign, fromPromise, setup } from "xstate"
import type { IUpdateService } from "../ports/update-service.port"
import type { UpdateCheckResult, UpdateMachineContext, UpdateMachineEvent } from "../types/updates"

export interface UpdateMachineInput {
  updateService: IUpdateService
}

const createUpdateServices = (updateService: IUpdateService) => ({
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

export const createUpdateMachine = ({ updateService }: UpdateMachineInput) => {
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
      clearError: assign({
        error: () => undefined,
      }),
      saveCurrentVersion: assign({
        currentVersion: ({ event }: { event: any }) => {
          if (event.type === "xstate.done.actor.getCurrentVersion") {
            return event.output as string
          }
          return "unknown"
        },
      }),
      enableAutoCheck: assign({
        autoCheckEnabled: () => true,
        autoCheckInterval: ({ event }) => {
          return event.type === "ENABLE_AUTO_CHECK" ? event.intervalMinutes : 60
        },
      }),
      disableAutoCheck: assign({
        autoCheckEnabled: () => false,
      }),
      updateProgress: assign({
        progress: ({ event }) => {
          if (event.type === "UPDATE_PROGRESS") {
            return event.progress
          }
          return undefined
        },
      }),
      clearAvailableUpdate: assign({
        availableUpdate: () => undefined,
      }),
    },
    guards: {
      hasAvailableUpdate: ({ context }) => {
        return !!context.availableUpdate
      },
      isAutoCheckEnabled: ({ context }) => {
        return context.autoCheckEnabled
      },
    },
  }).createMachine({
    id: "core-update",
    context: {
      currentVersion: "unknown",
      autoCheckEnabled: false,
      autoCheckInterval: 60,
    },
    initial: "initializing",
    states: {
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
      readyToInstall: {
        on: {
          INSTALL_UPDATE: "installing",
          CANCEL_UPDATE: "updateAvailable",
        },
      },
      installing: {
        after: {
          2000: "installed",
        },
        on: {
          CANCEL_UPDATE: "readyToInstall",
        },
      },
      installed: {
        on: {
          DISMISS: {
            target: "idle",
            actions: "clearAvailableUpdate",
          },
        },
      },
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

export type UpdateMachine = ReturnType<typeof createUpdateMachine>
export type UpdateMachineActor = Actor<UpdateMachine>
