/**
 * AI Orchestrator State Machine - AI Services Domain
 *
 * Координирует работу всех AI сервисов и управляет их взаимодействием
 * Обеспечивает централизованное управление ресурсами и приоритетами
 */

import { assign, emit, fromPromise, setup } from "xstate"
import type { AIIntelligenceEvent, ChatMachineEvent, MontagePlannerEvent } from "../types"

// Service status tracking
export interface ServiceInfo {
  name: string
  status: "idle" | "running" | "paused" | "error" | "completed"
  progress: number
  startTime?: Date
  endTime?: Date
  error?: string
  resources: {
    cpuUsage: number
    memoryUsage: number
    gpuUsage?: number
  }
}

export interface AIOrchestatorContext {
  // Service states
  services: Record<string, ServiceInfo>

  // Orchestration state
  activeOperations: string[]
  queuedOperations: Array<{
    id: string
    type: "chat" | "montage" | "intelligence" | "recognition"
    priority: "low" | "medium" | "high" | "critical"
    params: any
    dependencies?: string[]
  }>

  // Resource management
  resourceLimits: {
    maxConcurrentOperations: number
    maxMemoryUsage: number
    maxCpuUsage: number
    reservedMemory: number
  }

  currentResourceUsage: {
    totalMemory: number
    totalCpu: number
    totalGpu?: number
  }

  // Configuration
  config: {
    autoScaling: boolean
    priorityMode: "fifo" | "priority" | "resource_aware"
    failureHandling: "retry" | "skip" | "pause_all"
    maxRetries: number
  }

  // Statistics
  stats: {
    totalOperations: number
    completedOperations: number
    failedOperations: number
    averageOperationTime: number
    uptime: number
  }

  error?: string
}

export type AIOrchestatorEvent =
  // Service management
  | { type: "START_SERVICE"; serviceName: string; params?: any }
  | { type: "STOP_SERVICE"; serviceName: string }
  | { type: "PAUSE_SERVICE"; serviceName: string }
  | { type: "RESUME_SERVICE"; serviceName: string }
  | { type: "SERVICE_STATUS_UPDATE"; serviceName: string; status: ServiceInfo }

  // Operation management
  | {
      type: "QUEUE_OPERATION"
      operation: {
        id: string
        type: "chat" | "montage" | "intelligence" | "recognition"
        priority: "low" | "medium" | "high" | "critical"
        params: any
        dependencies?: string[]
      }
    }
  | { type: "CANCEL_OPERATION"; operationId: string }
  | { type: "OPERATION_COMPLETED"; operationId: string; result?: any }
  | { type: "OPERATION_FAILED"; operationId: string; error: string }

  // Resource management
  | { type: "UPDATE_RESOURCE_LIMITS"; limits: Partial<AIOrchestatorContext["resourceLimits"]> }
  | { type: "RESOURCE_WARNING"; resourceType: "memory" | "cpu" | "gpu"; usage: number; limit: number }
  | { type: "RESOURCE_CRITICAL"; resourceType: "memory" | "cpu" | "gpu"; usage: number }

  // Configuration
  | { type: "UPDATE_CONFIG"; config: Partial<AIOrchestatorContext["config"]> }
  | { type: "RESET_STATS" }

  // System management
  | { type: "HEALTH_CHECK" }
  | { type: "OPTIMIZE_RESOURCES" }
  | { type: "EMERGENCY_STOP" }
  | { type: "RESTART_ORCHESTRATOR" }

  // External events from child machines
  | { type: "CHAT_EVENT"; event: ChatMachineEvent }
  | { type: "MONTAGE_EVENT"; event: MontagePlannerEvent }
  | { type: "INTELLIGENCE_EVENT"; event: AIIntelligenceEvent }

// Actors for orchestration tasks
const resourceMonitorActor = fromPromise(async () => {
  console.log("[AI Orchestrator] Monitoring system resources")

  // This would get actual system resource usage
  return {
    totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
    totalCpu: 45, // 45%
    totalGpu: 20, // 20%
  }
})

const operationSchedulerActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      queuedOperations: AIOrchestatorContext["queuedOperations"]
      activeOperations: string[]
      resourceLimits: AIOrchestatorContext["resourceLimits"]
      currentUsage: AIOrchestatorContext["currentResourceUsage"]
    }
  }) => {
    console.log("[AI Orchestrator] Scheduling operations")

    const { queuedOperations, activeOperations, resourceLimits } = input

    // Simple scheduler - would be more sophisticated in real implementation
    const canStartMore = activeOperations.length < resourceLimits.maxConcurrentOperations

    if (!canStartMore) {
      return { operationsToStart: [], message: "Resource limits reached" }
    }

    // Sort by priority and start highest priority operations first
    const sortedOps = [...queuedOperations].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const operationsToStart = sortedOps.slice(0, resourceLimits.maxConcurrentOperations - activeOperations.length)

    return { operationsToStart, message: `Starting ${operationsToStart.length} operations` }
  },
)

const healthCheckActor = fromPromise(async ({ input }: { input: { services: Record<string, ServiceInfo> } }) => {
  console.log("[AI Orchestrator] Performing health check")

  const { services } = input
  const healthReport = {
    healthy: true,
    issues: [] as string[],
    services: Object.entries(services).map(([name, info]) => ({
      name,
      healthy: info.status !== "error",
      status: info.status,
      uptime: info.startTime ? Date.now() - info.startTime.getTime() : 0,
    })),
  }

  // Check for unhealthy services
  for (const [name, info] of Object.entries(services)) {
    if (info.status === "error") {
      healthReport.healthy = false
      healthReport.issues.push(`Service ${name} is in error state: ${info.error}`)
    }
  }

  return healthReport
})

// AI Orchestrator Machine
export const aiOrchestratorMachine = setup({
  types: {} as {
    context: AIOrchestatorContext
    events: AIOrchestatorEvent
  },
  actors: {
    resourceMonitorActor,
    operationSchedulerActor,
    healthCheckActor,
  },
  actions: {
    // Service management actions
    updateServiceStatus: assign({
      services: ({ context, event }) => {
        if (event.type !== "SERVICE_STATUS_UPDATE") return context.services

        return {
          ...context.services,
          [event.serviceName]: event.status,
        }
      },
    }),

    startService: assign({
      services: ({ context, event }) => {
        if (event.type !== "START_SERVICE") return context.services

        return {
          ...context.services,
          [event.serviceName]: {
            name: event.serviceName,
            status: "running",
            progress: 0,
            startTime: new Date(),
            resources: { cpuUsage: 0, memoryUsage: 0, gpuUsage: 0 },
          },
        }
      },
    }),

    stopService: assign({
      services: ({ context, event }) => {
        if (event.type !== "STOP_SERVICE") return context.services

        const updatedServices = { ...context.services }
        if (updatedServices[event.serviceName]) {
          updatedServices[event.serviceName] = {
            ...updatedServices[event.serviceName],
            status: "idle",
            endTime: new Date(),
          }
        }
        return updatedServices
      },
    }),

    // Operation management actions
    queueOperation: assign({
      queuedOperations: ({ context, event }) => {
        if (event.type !== "QUEUE_OPERATION") return context.queuedOperations

        return [...context.queuedOperations, event.operation]
      },
    }),

    startOperation: assign({
      activeOperations: ({ context }, params: { operationId: string }) => {
        return [...context.activeOperations, params.operationId]
      },
      queuedOperations: ({ context }, params: { operationId: string }) => {
        return context.queuedOperations.filter((op) => op.id !== params.operationId)
      },
    }),

    completeOperation: assign({
      activeOperations: ({ context, event }) => {
        if (event.type !== "OPERATION_COMPLETED") return context.activeOperations
        return context.activeOperations.filter((id) => id !== event.operationId)
      },
      stats: ({ context, event }) => {
        if (event.type !== "OPERATION_COMPLETED") return context.stats
        return {
          ...context.stats,
          completedOperations: context.stats.completedOperations + 1,
        }
      },
    }),

    failOperation: assign({
      activeOperations: ({ context, event }) => {
        if (event.type !== "OPERATION_FAILED") return context.activeOperations
        return context.activeOperations.filter((id) => id !== event.operationId)
      },
      stats: ({ context, event }) => {
        if (event.type !== "OPERATION_FAILED") return context.stats
        return {
          ...context.stats,
          failedOperations: context.stats.failedOperations + 1,
        }
      },
    }),

    // Resource management actions
    updateResourceUsage: assign({
      currentResourceUsage: ({ context }) => {
        // Resource monitoring would be handled by actual monitoring service
        return context.currentResourceUsage
      },
    }),

    updateResourceLimits: assign({
      resourceLimits: ({ context, event }) => {
        if (event.type !== "UPDATE_RESOURCE_LIMITS") return context.resourceLimits
        return { ...context.resourceLimits, ...event.limits }
      },
    }),

    // Configuration actions
    updateConfig: assign({
      config: ({ context, event }) => {
        if (event.type !== "UPDATE_CONFIG") return context.config
        return { ...context.config, ...event.config }
      },
    }),

    resetStats: assign({
      stats: ({ context }) => ({
        ...context.stats,
        totalOperations: 0,
        completedOperations: 0,
        failedOperations: 0,
        averageOperationTime: 0,
      }),
    }),

    // Error handling
    setError: assign({
      error: (_, params: { message: string }) => params.message,
    }),

    clearError: assign({
      error: undefined,
    }),

    // Event emission
    emitResourceWarning: emit(({ event }) => {
      if (event.type === "RESOURCE_WARNING") {
        return {
          type: "orchestrator.resource.warning" as const,
          resourceType: event.type,
          usage: event.usage,
          limit: event.limit,
        }
      }
      return { type: "orchestrator.noop" as const }
    }),

    emitOperationUpdate: emit(({ context }) => ({
      type: "orchestrator.operation.update" as const,
      activeCount: context.activeOperations.length,
      queuedCount: context.queuedOperations.length,
      stats: context.stats,
    })),

    emitHealthStatus: emit(({ context }) => ({
      type: "orchestrator.health.status" as const,
      services: context.services,
      resourceUsage: context.currentResourceUsage,
      activeOperations: context.activeOperations.length,
    })),

    // Reset action
    resetOrchestrator: assign({
      services: () => ({}),
      activeOperations: () => [],
      queuedOperations: () => [],
      currentResourceUsage: () => ({
        totalMemory: 0,
        totalCpu: 0,
        totalGpu: 0,
      }),
      stats: () => ({
        totalOperations: 0,
        completedOperations: 0,
        failedOperations: 0,
        averageOperationTime: 0,
        uptime: 0,
      }),
      error: () => undefined,
    }),
  },
}).createMachine({
  id: "ai-services-orchestrator",
  initial: "initializing",
  context: {
    services: {},
    activeOperations: [],
    queuedOperations: [],
    resourceLimits: {
      maxConcurrentOperations: 3,
      maxMemoryUsage: 12 * 1024 * 1024 * 1024, // 12GB
      maxCpuUsage: 80, // 80%
      reservedMemory: 2 * 1024 * 1024 * 1024, // 2GB
    },
    currentResourceUsage: {
      totalMemory: 0,
      totalCpu: 0,
      totalGpu: 0,
    },
    config: {
      autoScaling: true,
      priorityMode: "priority",
      failureHandling: "retry",
      maxRetries: 3,
    },
    stats: {
      totalOperations: 0,
      completedOperations: 0,
      failedOperations: 0,
      averageOperationTime: 0,
      uptime: 0,
    },
  },
  states: {
    initializing: {
      entry: "emitHealthStatus",
      after: {
        1000: "idle",
      },
    },

    idle: {
      entry: "emitOperationUpdate",
      invoke: {
        id: "resourceMonitor",
        src: "resourceMonitorActor",
        onDone: {
          actions: ["updateResourceUsage", "emitHealthStatus"],
        },
      },
      on: {
        START_SERVICE: {
          actions: ["startService", "emitHealthStatus"],
        },
        STOP_SERVICE: {
          actions: ["stopService", "emitHealthStatus"],
        },
        QUEUE_OPERATION: {
          target: "scheduling",
          actions: ["queueOperation"],
        },
        HEALTH_CHECK: {
          target: "healthChecking",
        },
        UPDATE_CONFIG: {
          actions: ["updateConfig"],
        },
        UPDATE_RESOURCE_LIMITS: {
          actions: ["updateResourceLimits"],
        },
        RESOURCE_WARNING: {
          actions: ["emitResourceWarning"],
        },
        RESOURCE_CRITICAL: {
          target: "resourceCritical",
        },
        EMERGENCY_STOP: {
          target: "emergencyStopped",
        },
        RESTART_ORCHESTRATOR: {
          target: "initializing",
          actions: ["resetOrchestrator"],
        },
      },
    },

    scheduling: {
      invoke: {
        id: "operationScheduler",
        src: "operationSchedulerActor",
        input: ({ context }) => ({
          queuedOperations: context.queuedOperations,
          activeOperations: context.activeOperations,
          resourceLimits: context.resourceLimits,
          currentUsage: context.currentResourceUsage,
        }),
        onDone: {
          target: "idle",
          actions: [
            ({ event }) => {
              // Start the scheduled operations
              const { operationsToStart } = event.output
              for (const operation of operationsToStart) {
                console.log("[AI Orchestrator] Starting operation:", operation.id)
              }
            },
            "emitOperationUpdate",
          ],
        },
        onError: {
          target: "idle",
          actions: [{ type: "setError", params: ({ event }: any) => ({ message: event.error.message }) }],
        },
      },
      on: {
        CANCEL_OPERATION: {
          target: "idle",
        },
      },
    },

    healthChecking: {
      invoke: {
        id: "healthCheck",
        src: "healthCheckActor",
        input: ({ context }) => ({
          services: context.services,
        }),
        onDone: {
          target: "idle",
          actions: [
            ({ event }) => {
              const healthReport = event.output
              console.log(
                "[AI Orchestrator] Health check completed:",
                healthReport.healthy ? "HEALTHY" : "ISSUES FOUND",
              )
              if (!healthReport.healthy) {
                console.warn("[AI Orchestrator] Health issues:", healthReport.issues)
              }
            },
            "emitHealthStatus",
          ],
        },
        onError: {
          target: "idle",
          actions: [
            {
              type: "setError",
              params: ({ event }: any) => ({ message: `Health check failed: ${event.error.message}` }),
            },
          ],
        },
      },
    },

    resourceCritical: {
      entry: [{ type: "setError", params: { message: "Critical resource usage detected" } }, "emitResourceWarning"],
      on: {
        OPTIMIZE_RESOURCES: {
          target: "optimizing",
        },
        EMERGENCY_STOP: {
          target: "emergencyStopped",
        },
      },
      after: {
        5000: "idle", // Auto-recover after 5 seconds
      },
    },

    optimizing: {
      entry: [
        () => {
          console.log("[AI Orchestrator] Optimizing resources...")
          // Pause low-priority operations
          // Clear caches
          // Reduce concurrent operations
        },
      ],
      after: {
        2000: {
          target: "idle",
          actions: ["clearError"],
        },
      },
    },

    emergencyStopped: {
      entry: ["resetOrchestrator", { type: "setError", params: { message: "Emergency stop activated" } }],
      on: {
        RESTART_ORCHESTRATOR: {
          target: "initializing",
          actions: ["clearError"],
        },
      },
    },
  },

  on: {
    SERVICE_STATUS_UPDATE: {
      actions: ["updateServiceStatus", "emitHealthStatus"],
    },
    OPERATION_COMPLETED: {
      actions: ["completeOperation", "emitOperationUpdate"],
    },
    OPERATION_FAILED: {
      actions: ["failOperation", "emitOperationUpdate"],
    },
    PAUSE_SERVICE: {
      actions: [
        ({ event }) => {
          if (event.type === "PAUSE_SERVICE") {
            console.log("[AI Orchestrator] Pausing service:", event.serviceName)
          }
        },
      ],
    },
    RESUME_SERVICE: {
      actions: [
        ({ event }) => {
          if (event.type === "RESUME_SERVICE") {
            console.log("[AI Orchestrator] Resuming service:", event.serviceName)
          }
        },
      ],
    },
    RESET_STATS: {
      actions: ["resetStats", "emitOperationUpdate"],
    },
  },
})

/**
 * Тип машины состояний AI Orchestrator
 */
export type AIOrchestratorMachine = typeof aiOrchestratorMachine
