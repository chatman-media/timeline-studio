/**
 * File Operations State Machine - Media Management Domain
 *
 * Управляет файловыми операциями: импорт, экспорт, конвертация
 */

import { assign, emit, setup } from "xstate"
import type { FileOperationsContext, FileOperationsEvent } from "../types"

const initialContext: FileOperationsContext = {
  operations: new Map(),
  activeOperations: [],
  completedOperations: [],
  failedOperations: [],
}

export const fileOperationsMachine = setup({
  types: {
    context: {} as FileOperationsContext,
    events: {} as FileOperationsEvent,
  },
  actions: {
    startOperation: assign({
      operations: ({ context, event }) => {
        if (event.type !== "START_OPERATION") return context.operations
        const newOperations = new Map(context.operations)
        newOperations.set(event.operation.id, event.operation)
        console.log(`[File Operations] Starting operation ${event.operation.id} (${event.operation.type})`)
        return newOperations
      },
      activeOperations: ({ context, event }) => {
        if (event.type !== "START_OPERATION") return context.activeOperations
        return [...context.activeOperations, event.operation.id]
      },
    }),

    updateProgress: assign({
      operations: ({ context, event }) => {
        if (event.type !== "UPDATE_PROGRESS") return context.operations
        const operation = context.operations.get(event.operationId)
        if (!operation) return context.operations

        const newOperations = new Map(context.operations)
        newOperations.set(event.operationId, {
          ...operation,
          progress: event.progress,
          status: "processing",
        })
        console.log(`[File Operations] Progress ${event.operationId}: ${event.progress}%`)
        return newOperations
      },
    }),

    completeOperation: assign({
      operations: ({ context, event }) => {
        if (event.type !== "COMPLETE_OPERATION") return context.operations
        const operation = context.operations.get(event.operationId)
        if (!operation) return context.operations

        const newOperations = new Map(context.operations)
        newOperations.set(event.operationId, {
          ...operation,
          status: "completed",
          progress: 100,
          result: event.result,
        })
        console.log(`[File Operations] Completed ${event.operationId}`)
        return newOperations
      },
      activeOperations: ({ context, event }) => {
        if (event.type !== "COMPLETE_OPERATION") return context.activeOperations
        return context.activeOperations.filter((id) => id !== event.operationId)
      },
      completedOperations: ({ context, event }) => {
        if (event.type !== "COMPLETE_OPERATION") return context.completedOperations
        return [...context.completedOperations, event.operationId]
      },
    }),

    failOperation: assign({
      operations: ({ context, event }) => {
        if (event.type !== "FAIL_OPERATION") return context.operations
        const operation = context.operations.get(event.operationId)
        if (!operation) return context.operations

        const newOperations = new Map(context.operations)
        newOperations.set(event.operationId, {
          ...operation,
          status: "failed",
          error: event.error,
        })
        console.error(`[File Operations] Failed ${event.operationId}:`, event.error)
        return newOperations
      },
      activeOperations: ({ context, event }) => {
        if (event.type !== "FAIL_OPERATION") return context.activeOperations
        return context.activeOperations.filter((id) => id !== event.operationId)
      },
      failedOperations: ({ context, event }) => {
        if (event.type !== "FAIL_OPERATION") return context.failedOperations
        return [...context.failedOperations, event.operationId]
      },
    }),

    cancelOperation: assign({
      operations: ({ context, event }) => {
        if (event.type !== "CANCEL_OPERATION") return context.operations
        const newOperations = new Map(context.operations)
        newOperations.delete(event.operationId)
        console.log(`[File Operations] Cancelled ${event.operationId}`)
        return newOperations
      },
      activeOperations: ({ context, event }) => {
        if (event.type !== "CANCEL_OPERATION") return context.activeOperations
        return context.activeOperations.filter((id) => id !== event.operationId)
      },
    }),

    clearCompleted: assign({
      operations: ({ context }) => {
        const newOperations = new Map()
        context.operations.forEach((op, id) => {
          if (op.status !== "completed") {
            newOperations.set(id, op)
          }
        })
        console.log(`[File Operations] Cleared ${context.completedOperations.length} completed operations`)
        return newOperations
      },
      completedOperations: () => [],
    }),

    retryFailed: assign({
      operations: ({ context, event }) => {
        if (event.type !== "RETRY_FAILED") return context.operations
        const operation = context.operations.get(event.operationId)
        if (!operation || operation.status !== "failed") return context.operations

        const newOperations = new Map(context.operations)
        newOperations.set(event.operationId, {
          ...operation,
          status: "pending",
          progress: 0,
          error: undefined,
        })
        console.log(`[File Operations] Retrying ${event.operationId}`)
        return newOperations
      },
      failedOperations: ({ context, event }) => {
        if (event.type !== "RETRY_FAILED") return context.failedOperations
        return context.failedOperations.filter((id) => id !== event.operationId)
      },
      activeOperations: ({ context, event }) => {
        if (event.type !== "RETRY_FAILED") return context.activeOperations
        return [...context.activeOperations, event.operationId]
      },
    }),

    // Emit events for external listeners
    emitOperationStarted: emit(({ event }) => {
      if (event.type !== "START_OPERATION") return { type: "NOOP" }
      return {
        type: "file.operation.started",
        operation: event.operation,
      }
    }),

    emitOperationCompleted: emit(({ event }) => {
      if (event.type !== "COMPLETE_OPERATION") return { type: "NOOP" }
      return {
        type: "file.operation.completed",
        operationId: event.operationId,
        result: event.result,
      }
    }),

    emitOperationFailed: emit(({ event }) => {
      if (event.type !== "FAIL_OPERATION") return { type: "NOOP" }
      return {
        type: "file.operation.failed",
        operationId: event.operationId,
        error: event.error,
      }
    }),
  },
}).createMachine({
  id: "media-management-file-operations",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        START_OPERATION: {
          actions: ["startOperation", "emitOperationStarted"],
        },
        UPDATE_PROGRESS: {
          actions: ["updateProgress"],
        },
        COMPLETE_OPERATION: {
          actions: ["completeOperation", "emitOperationCompleted"],
        },
        FAIL_OPERATION: {
          actions: ["failOperation", "emitOperationFailed"],
        },
        CANCEL_OPERATION: {
          actions: ["cancelOperation"],
        },
        CLEAR_COMPLETED: {
          actions: ["clearCompleted"],
        },
        RETRY_FAILED: {
          actions: ["retryFailed", "emitOperationStarted"],
        },
      },
    },
  },
})

export type FileOperationsMachine = typeof fileOperationsMachine
