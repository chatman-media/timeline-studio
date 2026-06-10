/**
 * App Machine - Project Management Domain
 *
 * Координирует все состояние приложения через backend
 * Использует IBackendService из DI контейнера для независимости от платформы
 */

import { assign, fromCallback, fromPromise, setup } from "xstate"
import { getBackend } from "@timeline-studio/core"
import type { IBackendService } from "@timeline-studio/core/ports"
import { createLogger } from "@/lib/tauri-logger"
import type {
  JsonValue,
  PlayerSource,
  ProjectCommand,
  ProjectEvent,
  ProjectSettings,
  ProjectState,
} from "@/types/generated/tauri-bindings"

const logger = createLogger("AppMachine")

// Context for the app machine
export interface AppMachineContext {
  projectState: ProjectState | null
  isConnected: boolean
  error: string | null
  commandQueue: ProjectCommand[]
}

// Events for the app machine
export type AppMachineEvent =
  | { type: "CONNECT" }
  | { type: "DISCONNECT" }
  | { type: "BACKEND_EVENT"; event: ProjectEvent }
  | { type: "STATE_UPDATED"; state: ProjectState }
  | { type: "EXECUTE_COMMAND"; command: ProjectCommand }
  | { type: "COMMAND_SUCCESS"; data?: any }
  | { type: "COMMAND_ERROR"; error: string }
  | { type: "CONNECTION_ERROR"; error: string }
  | { type: "RETRY_CONNECTION" }

// Create the app machine
export const appMachine = setup({
  types: {} as {
    context: AppMachineContext
    events: AppMachineEvent
  },

  actions: {
    setProjectState: assign({
      projectState: (_, params: { state: ProjectState }) => params.state,
    }),

    setError: assign({
      error: (_, params: { error: string }) => params.error,
    }),

    clearError: assign({
      error: () => null,
    }),

    setConnected: assign({
      isConnected: () => true,
    }),

    setDisconnected: assign({
      isConnected: () => false,
    }),

    queueCommand: assign({
      commandQueue: ({ context }, params: { command: ProjectCommand }) => [...context.commandQueue, params.command],
    }),

    clearCommandQueue: assign({
      commandQueue: () => [],
    }),
  },

  actors: {
    backendConnection: fromCallback(({ sendBack }: { sendBack: any }) => {
      // Get backend from container at connection time (not from context)
      // This ensures we get the backend after AppInitProvider has initialized
      let backend: IBackendService | null = null
      try {
        backend = getBackend()
      } catch {
        logger.warnSync("Backend service is not available yet, will retry")
        sendBack({ type: "CONNECTION_ERROR", error: "Backend service is not available yet" })
        return () => {}
      }

      // Additional safety check
      if (!backend || typeof backend.connect !== "function") {
        logger.errorSync("Backend service is not properly initialized")
        sendBack({ type: "CONNECTION_ERROR", error: "Backend service is not properly initialized" })
        return () => {}
      }

      // Subscribe to backend events
      const unsubscribeEvent = backend.onEvent((event: ProjectEvent) => {
        sendBack({ type: "BACKEND_EVENT", event })
      })

      // Subscribe to state changes
      const unsubscribeState = backend.onStateChange((state: ProjectState) => {
        sendBack({ type: "STATE_UPDATED", state })
      })

      // Connect to backend
      try {
        backend
          .connect()
          .then(() => {
            logger.infoSync("Connected to backend")
            sendBack({ type: "CONNECT" })
          })
          .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error)
            sendBack({ type: "CONNECTION_ERROR", error: errorMessage })
          })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        sendBack({ type: "CONNECTION_ERROR", error: errorMessage })
      }

      // Cleanup function
      return () => {
        unsubscribeEvent()
        unsubscribeState()
        void backend.disconnect()
      }
    }),

    executeCommand: fromPromise(async ({ input }: { input: { command: ProjectCommand } }) => {
      const { command } = input
      // Get backend from container at execution time
      const backend = getBackend()
      const result = await backend.executeCommand(command)

      if (!result.success) {
        throw new Error(result.error || "Command failed")
      }

      return result.data
    }),
  },

  guards: {
    hasQueuedCommands: ({ context }) => context.commandQueue.length > 0,
  },
}).createMachine({
  id: "project-management-app",
  initial: "disconnected",

  context: {
    projectState: null,
    isConnected: false,
    error: null,
    commandQueue: [],
  },

  // Global event handlers - work in all states
  on: {
    STATE_UPDATED: {
      actions: {
        type: "setProjectState",
        params: ({ event }) => ({ state: event.state }),
      },
    },
  },

  states: {
    disconnected: {
      entry: "clearError",

      on: {
        CONNECT: "connecting",
      },
    },

    connecting: {
      invoke: {
        id: "backendConnection",
        src: "backendConnection",
        // Backend is fetched from container inside the actor, not from context
      },

      on: {
        CONNECT: {
          target: "connected",
          actions: ["setConnected", "clearError"],
        },

        CONNECTION_ERROR: {
          target: "error",
          actions: {
            type: "setError",
            params: ({ event }) => ({ error: event.error }),
          },
        },

        STATE_UPDATED: {
          actions: {
            type: "setProjectState",
            params: ({ event }) => ({ state: event.state }),
          },
        },
      },
    },

    connected: {
      initial: "idle",

      on: {
        DISCONNECT: {
          target: "disconnected",
          actions: "setDisconnected",
        },

        BACKEND_EVENT: {
          // Log event for debugging
          actions: ({ event }) => {
            logger.debugSync("Backend event", { event: event.event })
          },
        },

        STATE_UPDATED: {
          actions: {
            type: "setProjectState",
            params: ({ event }) => ({ state: event.state }),
          },
        },

        CONNECTION_ERROR: {
          target: "error",
          actions: {
            type: "setError",
            params: ({ event }) => ({ error: event.error }),
          },
        },
      },

      states: {
        idle: {
          always: [
            {
              target: "processingQueue",
              guard: "hasQueuedCommands",
            },
          ],

          on: {
            EXECUTE_COMMAND: {
              target: "executing",
              actions: {
                type: "queueCommand",
                params: ({ event }) => ({ command: event.command }),
              },
            },
          },
        },

        executing: {
          invoke: {
            id: "executeCommand",
            src: "executeCommand",
            input: ({ context }) => ({
              command: context.commandQueue[0],
            }),
            onDone: {
              target: "idle",
              actions: [
                ({ context }) => {
                  // Remove executed command from queue
                  context.commandQueue.shift()
                },
                ({ event }) => {
                  logger.infoSync("Command executed successfully", { output: event.output })
                },
              ],
            },
            onError: {
              target: "idle",
              actions: [
                ({ context }) => {
                  // Remove failed command from queue
                  context.commandQueue.shift()
                },
                ({ event }) => {
                  logger.errorSync("Command execution failed", { error: event.error })
                },
              ],
            },
          },
        },

        processingQueue: {
          always: {
            target: "executing",
          },
        },
      },
    },

    error: {
      on: {
        RETRY_CONNECTION: "connecting",

        CONNECT: "connecting",
      },
    },
  },
})

// Helper functions for common commands
export const AppCommands = {
  // Project commands
  createProject: (name: string, settings: ProjectSettings): ProjectCommand => ({
    type: "CreateProject",
    params: { name, settings },
  }),

  saveProject: (path?: string): ProjectCommand => ({
    type: "SaveProject",
    params: { path: path ?? null },
  }),

  // Timeline commands
  addClip: (trackId: string, mediaId: string, time: number): ProjectCommand => ({
    type: "AddClip",
    params: { track_id: trackId, media_id: mediaId, time },
  }),

  moveClip: (clipId: string, trackId: string, time: number): ProjectCommand => ({
    type: "MoveClip",
    params: { clip_id: clipId, track_id: trackId, time },
  }),

  // Basic playback commands
  play: (): ProjectCommand => ({
    type: "Play",
  }),

  pause: (): ProjectCommand => ({
    type: "Pause",
  }),

  seek: (time: number): ProjectCommand => ({
    type: "Seek",
    params: { time },
  }),

  // Player commands
  playerSetMedia: (mediaId: string, startTime?: number): ProjectCommand => ({
    type: "PlayerSetMedia",
    params: { media_id: mediaId, start_time: startTime ?? null },
  }),

  playerSetVolume: (volume: number): ProjectCommand => ({
    type: "PlayerSetVolume",
    params: { volume },
  }),

  playerSelectClip: (clipId: string): ProjectCommand => ({
    type: "PlayerSelectClip",
    params: { clip_id: clipId },
  }),

  playerClearSelection: (): ProjectCommand => ({
    type: "PlayerClearSelection",
  }),

  playerSetSource: (source: PlayerSource): ProjectCommand => ({
    type: "PlayerSetSource",
    params: { source },
  }),

  playerApplyEffect: (effectId: string, params: JsonValue): ProjectCommand => ({
    type: "PlayerApplyEffect",
    params: { effect_id: effectId, params },
  }),

  playerApplyFilter: (filterId: string, params: JsonValue): ProjectCommand => ({
    type: "PlayerApplyFilter",
    params: { filter_id: filterId, params },
  }),

  playerApplyTemplate: (templateId: string, mediaIds: string[]): ProjectCommand => ({
    type: "PlayerApplyTemplate",
    params: { template_id: templateId, media_ids: mediaIds },
  }),

  playerClearEffects: (): ProjectCommand => ({
    type: "PlayerClearEffects",
  }),

  playerClearFilters: (): ProjectCommand => ({
    type: "PlayerClearFilters",
  }),

  playerClearTemplate: (): ProjectCommand => ({
    type: "PlayerClearTemplate",
  }),

  // Media management commands
  addMedia: (path: string, mediaType: any): ProjectCommand => ({
    type: "AddMedia",
    params: { path, media_type: mediaType },
  }),

  removeMedia: (mediaId: string): ProjectCommand => ({
    type: "RemoveMedia",
    params: { media_id: mediaId },
  }),

  updateMedia: (mediaId: string, updates: any): ProjectCommand => ({
    type: "UpdateMedia",
    params: { media_id: mediaId, updates },
  }),
}

// Legacy export для обратной совместимости
export { appMachine as appMachineV2 }
