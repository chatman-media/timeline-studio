/**
 * App Machine - Project Management Domain
 *
 * Координирует все состояние приложения через backend
 * Перенесено из src/features/app-state/services/app-machine.ts
 */

import { assign, fromCallback, fromPromise, setup } from "xstate"
import { type BackendSync, getBackendSync } from "@/features/app-state/services/backend-sync"
import type {
  JsonValue,
  PlayerSource,
  ProjectCommand,
  ProjectEvent,
  ProjectSettings,
  ProjectState,
} from "@/types/generated/tauri-bindings"

// Context for the app machine
export interface AppMachineContext {
  projectState: ProjectState | null
  backendSync: BackendSync
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
    backendConnection: fromCallback(({ sendBack, input }: { sendBack: any; input: { backendSync: BackendSync } }) => {
      // Check if input and backendSync are available
      if (!input || !input.backendSync) {
        console.error("[Project Management] Backend sync service is not available")
        sendBack({ type: "CONNECTION_ERROR", error: "Backend sync service is not available" })
        return () => {}
      }

      const { backendSync } = input

      // Additional safety check
      if (!backendSync || typeof backendSync.connect !== "function") {
        console.error("[Project Management] Backend sync service is not properly initialized")
        sendBack({ type: "CONNECTION_ERROR", error: "Backend sync service is not properly initialized" })
        return () => {}
      }

      // Subscribe to backend events
      const unsubscribeEvent = backendSync.onEvent((event) => {
        sendBack({ type: "BACKEND_EVENT", event })
      })

      // Subscribe to state changes
      const unsubscribeState = backendSync.onStateChange((state) => {
        sendBack({ type: "STATE_UPDATED", state })
      })

      // Connect to backend
      try {
        backendSync
          .connect()
          .then(() => {
            console.log("[Project Management] Connected to backend")
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
        void backendSync.disconnect()
      }
    }),

    executeCommand: fromPromise(async ({ input }: { input: { command: ProjectCommand; backendSync: BackendSync } }) => {
      const { command, backendSync } = input
      const result = await backendSync.executeCommand(command)

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
    backendSync: getBackendSync(),
    isConnected: false,
    error: null,
    commandQueue: [],
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
        input: ({ context }) => ({ backendSync: context.backendSync }),
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
            console.log("[Project Management] Backend event:", event.event)
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
              backendSync: context.backendSync,
            }),
            onDone: {
              target: "idle",
              actions: [
                ({ context }) => {
                  // Remove executed command from queue
                  context.commandQueue.shift()
                },
                ({ event }) => {
                  console.log("Command executed successfully:", event.output)
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
                  console.error("Command execution failed:", event.error)
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
