/**
 * Media Import State Machine - Media Management Domain
 *
 * Управляет процессом импорта медиа файлов в проект
 */

import { invoke } from "@tauri-apps/api/core"
import { assign, fromPromise, sendParent, setup } from "xstate"
import { createLogger } from "@/lib/tauri-logger"
import type { MediaFileOperation, MediaImportContext, MediaImportEvent, MediaImportOptions } from "../types"

const logger = createLogger("MediaImportMachine")


const defaultOptions: MediaImportOptions = {
  copyToProject: true,
  createProxies: false,
  analyzeContent: true,
  generateThumbnails: true,
  preserveMetadata: true,
}

const initialContext: MediaImportContext = {
  files: [],
  options: defaultOptions,
  operations: [],
  currentOperation: null,
  totalProgress: 0,
  errors: [],
}

// Actors for import tasks
const importFilesActor = fromPromise(async ({ input }: { input: { files: string[]; options: MediaImportOptions } }) => {
  logger.info("[Media Import] Importing files", { filesCount: input.files.length })

  try {
    // Call Tauri command to import files
    const result = await invoke("import_media_files", {
      paths: input.files,
      options: {
        copy_to_project: input.options.copyToProject,
        create_proxies: input.options.createProxies,
        analyze_content: input.options.analyzeContent,
        generate_thumbnails: input.options.generateThumbnails,
        preserve_metadata: input.options.preserveMetadata,
      },
    })

    return result
  } catch (error) {
    logger.error("[Media Import] Import failed:", { error })
    throw error
  }
})

export const mediaImportMachine = setup({
  types: {
    context: {} as MediaImportContext,
    events: {} as MediaImportEvent,
  },
  actors: {
    importFiles: importFilesActor,
  },
  actions: {
    addFiles: assign({
      files: ({ context, event }) => {
        if (event.type !== "ADD_FILES") return context.files
        // Remove duplicates
        const newFiles = [...new Set([...context.files, ...event.files])]
        logger.info(`[Media Import] Added ${event.files.length} files`, { totalFiles: newFiles.length })
        return newFiles
      },
    }),

    removeFile: assign({
      files: ({ context, event }) => {
        if (event.type !== "REMOVE_FILE") return context.files
        const newFiles = context.files.filter((f) => f !== event.file)
        logger.info("[Media Import] Removed file", { filePath: event.file })
        return newFiles
      },
    }),

    updateOptions: assign({
      options: ({ context, event }) => {
        if (event.type !== "UPDATE_OPTIONS") return context.options
        const newOptions = { ...context.options, ...event.options }
        logger.debug("[Media Import] Updated options:", { data: event.options })
        return newOptions
      },
    }),

    createOperations: assign({
      operations: ({ context }) => {
        const operations: MediaFileOperation[] = context.files.map((_file, index) => ({
          id: `import-${Date.now()}-${index}`,
          type: "import",
          status: "pending",
          progress: 0,
        }))
        logger.info("[Media Import] Created operations", { operationsCount: operations.length })
        return operations
      },
    }),

    updateProgress: assign({
      operations: ({ context, event }) => {
        if (event.type !== "IMPORT_PROGRESS") return context.operations
        return context.operations.map((op) =>
          op.id === event.operationId ? { ...op, status: "processing" as const, progress: event.progress } : op,
        )
      },
      totalProgress: ({ context }) => {
        const total = context.operations.reduce((sum, op) => sum + op.progress, 0)
        return Math.round(total / context.operations.length)
      },
    }),

    completeOperation: assign({
      operations: ({ context, event }) => {
        if (event.type !== "IMPORT_COMPLETE") return context.operations
        return context.operations.map((op) =>
          op.id === event.operationId
            ? { ...op, status: "completed" as const, progress: 100, result: event.result }
            : op,
        )
      },
    }),

    failOperation: assign({
      operations: ({ context, event }) => {
        if (event.type !== "IMPORT_FAILED") return context.operations
        return context.operations.map((op) =>
          op.id === event.operationId ? { ...op, status: "failed" as const, error: event.error } : op,
        )
      },
      errors: ({ context, event }) => {
        if (event.type !== "IMPORT_FAILED") return context.errors
        return [...context.errors, `${event.operationId}: ${event.error}`]
      },
    }),

    resetContext: assign(() => initialContext),

    // Send events to parent (file operations machine)
    notifyFileOperations: ({ context }) => {
      // Send multiple events by calling sendParent for each operation
      context.operations.forEach((op) => {
        sendParent({
          type: "START_OPERATION",
          operation: op,
        })
      })
    },

    notifyProgress: sendParent(({ event }) => {
      if (event.type !== "IMPORT_PROGRESS") return { type: "NOOP" }
      return {
        type: "UPDATE_PROGRESS",
        operationId: event.operationId,
        progress: event.progress,
      }
    }),

    notifyComplete: sendParent(({ event }) => {
      if (event.type !== "IMPORT_COMPLETE") return { type: "NOOP" }
      return {
        type: "COMPLETE_OPERATION",
        operationId: event.operationId,
        result: event.result,
      }
    }),

    notifyFailed: sendParent(({ event }) => {
      if (event.type !== "IMPORT_FAILED") return { type: "NOOP" }
      return {
        type: "FAIL_OPERATION",
        operationId: event.operationId,
        error: event.error,
      }
    }),
  },
}).createMachine({
  id: "media-management-import",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        ADD_FILES: {
          actions: ["addFiles"],
        },
        REMOVE_FILE: {
          actions: ["removeFile"],
        },
        UPDATE_OPTIONS: {
          actions: ["updateOptions"],
        },
        START_IMPORT: {
          target: "importing",
          guard: ({ context }) => context.files.length > 0,
          actions: ["createOperations", "notifyFileOperations"],
        },
      },
    },

    importing: {
      invoke: {
        src: "importFiles",
        input: ({ context }) => ({
          files: context.files,
          options: context.options,
        }),
        onDone: {
          target: "completed",
          actions: [
            assign({
              operations: ({ context }) =>
                context.operations.map((op) => ({
                  ...op,
                  status: "completed" as const,
                  progress: 100,
                })),
              totalProgress: () => 100,
            }),
          ],
        },
        onError: {
          target: "failed",
          actions: [
            assign({
              errors: ({ context, event }) => [...context.errors, `Import failed: ${event.error}`],
            }),
          ],
        },
      },
      on: {
        IMPORT_PROGRESS: {
          actions: ["updateProgress", "notifyProgress"],
        },
        IMPORT_COMPLETE: {
          actions: ["completeOperation", "notifyComplete"],
        },
        IMPORT_FAILED: {
          actions: ["failOperation", "notifyFailed"],
        },
        CANCEL_IMPORT: {
          target: "cancelled",
        },
      },
    },

    completed: {
      entry: () => logger.info("[Media Import] Import completed successfully"),
      on: {
        RESET: {
          target: "idle",
          actions: ["resetContext"],
        },
      },
    },

    failed: {
      entry: () => logger.error("Error occurred", { error: "[Media Import] Import failed" }),
      on: {
        RESET: {
          target: "idle",
          actions: ["resetContext"],
        },
        START_IMPORT: {
          target: "importing",
          actions: ["createOperations", "notifyFileOperations"],
        },
      },
    },

    cancelled: {
      entry: () => logger.info("[Media Import] Import cancelled"),
      on: {
        RESET: {
          target: "idle",
          actions: ["resetContext"],
        },
      },
    },
  },
})

export type MediaImportMachine = typeof mediaImportMachine
