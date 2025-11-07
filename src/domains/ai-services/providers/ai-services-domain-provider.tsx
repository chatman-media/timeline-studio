/**
 * AI Services Domain Provider с интеграцией BackendSync и AI Event Bridge
 *
 * Provides centralized access to all AI services state machines and services
 * Добавлена синхронизация состояния AI сервисов с backend
 * Интегрирован AI Event Bridge для синхронизации Tauri ↔ TypeScript events
 */

import { useActor } from "@xstate/react"
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectState } from "@/types/generated/tauri-bindings"
// NEW: Use AI Intelligence Machine V2 with AI Director integration
import {
  type AIIntelligenceContextV2,
  type AIIntelligenceEventV2,
  aiIntelligenceMachineV2,
} from "../machines/ai-intelligence-machine-v2"
// NEW: Import AI Event Bridge
import { aiEventBridge } from "../services/ai-event-bridge"

const logger = createLogger("AiServicesDomainProvider")

// Import domain machines
import { ChatMachineContext, chatMachine } from "../machines/chat-machine"
import { MontagePlannerContext, montagePlannerMachine } from "../machines/montage-planner-machine"

// Import domain types
import type { AIServicesDomainConfig, ChatMachineEvent, MontagePlannerEvent } from "../types"

// Domain Provider Context
interface AIServicesDomainContextValue {
  // Domain configuration
  config: AIServicesDomainConfig

  // Chat machine
  chatState: ChatMachineContext
  chatSend: (event: ChatMachineEvent) => void

  // Montage Planner machine
  montagePlannerState: MontagePlannerContext
  montagePlannerSend: (event: MontagePlannerEvent) => void

  // AI Intelligence machine V2
  aiIntelligenceState: AIIntelligenceContextV2
  aiIntelligenceSend: (event: AIIntelligenceEventV2) => void

  // Domain-level actions
  resetAllServices: () => void
  enableService: (service: keyof AIServicesDomainConfig) => void
  disableService: (service: keyof AIServicesDomainConfig) => void

  // BackendSync методы
  syncAIState: () => Promise<void>
  isBackendConnected: boolean
  aiUsageStats: {
    totalRequests: number
    totalTokens: number
    lastSync: Date | null
  }
}

const AIServicesDomainContext = createContext<AIServicesDomainContextValue | null>(null)

// Domain Provider Component
export function AIServicesDomainProvider({ children }: PropsWithChildren) {
  const backendSync = getBackendSync()
  const [isBackendConnected, setIsBackendConnected] = useState(backendSync.connected)
  const [aiUsageStats, setAIUsageStats] = useState({
    totalRequests: 0,
    totalTokens: 0,
    lastSync: null as Date | null,
  })

  // Initialize domain configuration
  const [domainConfig, setDomainConfig] = useState<AIServicesDomainConfig>({
    chatEnabled: true,
    intelligenceEnabled: true,
    montagePlannerEnabled: true,
    recognitionEnabled: true,
  })

  // Initialize chat machine
  const [chatState, chatSend] = useActor(chatMachine)

  // Initialize montage planner machine
  const [montagePlannerState, montagePlannerSend] = useActor(montagePlannerMachine)

  // Initialize AI intelligence machine V2 (with AI Director integration)
  const [aiIntelligenceState, aiIntelligenceSend] = useActor(aiIntelligenceMachineV2)

  // Синхронизация состояния AI с backend
  const syncAIState = async () => {
    if (!isBackendConnected) return

    try {
      const response = await backendSync.executeCommand({
        type: "SyncState" as any,
        timestamp: new Date().toISOString(),
        config: domainConfig,
        chatHistory: chatState.context.chatMessages || [],
        montageStatus: {
          isAnalyzing: montagePlannerState.context.isAnalyzing || false,
          currentPlan: montagePlannerState.context.currentPlan,
        },
        intelligenceStatus: {
          isAnalyzing: aiIntelligenceState.context.isAnalyzing || false,
          analysisResults: aiIntelligenceState.context.unifiedAnalyses,
          currentWorkflow: aiIntelligenceState.context.currentWorkflowId,
        },
        usageStats: aiUsageStats,
      } as any)

      if (response.success && response.data) {
        // Обновляем статистику использования от backend
        const data = response.data as any
        setAIUsageStats({
          totalRequests: data.totalRequests || 0,
          totalTokens: data.totalTokens || 0,
          lastSync: new Date(),
        })
      }

      logger.debug("[AIServicesDomain] AI state synced with backend")
    } catch (error) {
      logger.error("[AIServicesDomain] Failed to sync AI state:", { error: error })
    }
  }

  // Подписка на состояние backend и машин + Инициализация AI Event Bridge
  useEffect(() => {
    // NEW: Инициализируем AI Event Bridge для синхронизации Tauri events
    let bridgeInitialized = false
    aiEventBridge
      .initialize()
      .then(() => {
        bridgeInitialized = true
        logger.info("AI Event Bridge successfully initialized")
      })
      .catch((error) => {
        logger.error("Failed to initialize AI Event Bridge", { error })
      })

    // Мониторинг соединения с backend
    const unsubscribeBackend = backendSync.onStateChange((state: ProjectState) => {
      setIsBackendConnected(true)

      // Восстанавливаем конфигурацию AI сервисов из backend
      if ((state as any).ai_services_config) {
        setDomainConfig((state as any).ai_services_config)
      }
    })

    // Подписка на события backend
    const unsubscribeEvents = backendSync.onEvent((event: any) => {
      switch (event.type) {
        case "AI_CONFIG_UPDATED":
          // Backend обновил конфигурацию AI сервисов
          if (event.data?.config) {
            setDomainConfig(event.data.config)
          }
          break

        case "AI_USAGE_UPDATED":
          // Backend обновил статистику использования
          if (event.data?.stats) {
            setAIUsageStats((prev) => ({
              ...prev,
              ...event.data.stats,
            }))
          }
          break
      }
    })

    return () => {
      unsubscribeBackend()
      unsubscribeEvents()

      // NEW: Cleanup AI Event Bridge
      if (bridgeInitialized) {
        aiEventBridge.cleanup().catch((error) => logger.error("Failed to cleanup AI Event Bridge", { error }))
      }
    }
  }, [backendSync])

  // Синхронизация при изменении состояния машин
  useEffect(() => {
    if (!isBackendConnected) return

    const syncTimeout = setTimeout(() => {
      syncAIState().catch((error) => logger.error("Operation failed", { error }))
    }, 2000) // Задержка 2 секунды для debouncing

    return () => clearTimeout(syncTimeout)
  }, [
    chatState.context.chatMessages,
    montagePlannerState.context.currentPlan,
    aiIntelligenceState.context.currentWorkflowId,
    aiIntelligenceState.context.unifiedAnalyses,
    isBackendConnected,
  ])

  // Расширенные domain-level действия с BackendSync
  const resetAllServices = async () => {
    chatSend({ type: "CLEAR_MESSAGES" })
    montagePlannerSend({ type: "RESET" })
    aiIntelligenceSend({ type: "RESET" })

    // Уведомляем backend о сбросе
    if (isBackendConnected) {
      await (backendSync as any).executeCommand?.({
        type: "ResetAllAIServices",
        timestamp: new Date().toISOString(),
      })
    }
  }

  const enableService = async (service: keyof AIServicesDomainConfig) => {
    const newConfig = { ...domainConfig, [service]: true }
    setDomainConfig(newConfig)

    logger.info(`Enabling service: ${service}`, { module: "AI Services Domain" })

    // Синхронизируем с backend
    if (isBackendConnected) {
      await (backendSync as any).executeCommand?.({
        type: "UpdateAIServiceConfig",
        service,
        enabled: true,
      })
    }
  }

  const disableService = async (service: keyof AIServicesDomainConfig) => {
    const newConfig = { ...domainConfig, [service]: false }
    setDomainConfig(newConfig)

    logger.info(`Disabling service: ${service}`, { module: "AI Services Domain" })

    // Синхронизируем с backend
    if (isBackendConnected) {
      await (backendSync as any).executeCommand?.({
        type: "UpdateAIServiceConfig",
        service,
        enabled: false,
      })
    }
  }

  // Отслеживание использования AI через события
  useEffect(() => {
    // Подсчет использования для событий чата
    if (chatState.context.chatMessages?.length && chatState.context.chatMessages.length > 0 && isBackendConnected) {
      setAIUsageStats((prev) => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
      }))

      // Логируем использование в backend
      ;(backendSync as any)
        .executeCommand?.({
          type: "LogAIUsage",
          service: "chat",
          eventType: "message_sent",
          timestamp: new Date().toISOString(),
        })
        .catch((error) => logger.error("Operation failed", { error }))
    }
  }, [chatState.context.chatMessages?.length, isBackendConnected, backendSync])

  const contextValue: AIServicesDomainContextValue = {
    config: domainConfig,
    chatState: chatState.context,
    chatSend,
    montagePlannerState: montagePlannerState.context,
    montagePlannerSend,
    aiIntelligenceState: aiIntelligenceState.context,
    aiIntelligenceSend,
    resetAllServices,
    enableService,
    disableService,
    syncAIState,
    isBackendConnected,
    aiUsageStats,
  }

  return <AIServicesDomainContext.Provider value={contextValue}>{children}</AIServicesDomainContext.Provider>
}

// Domain Hook
export function useAIServicesDomain() {
  const context = useContext(AIServicesDomainContext)
  if (!context) {
    throw new Error("useAIServicesDomain must be used within AIServicesDomainProvider")
  }
  return context
}

// Specific service hooks for backward compatibility
export function useAIServicesChat() {
  const { chatState, chatSend } = useAIServicesDomain()
  return { chatState, chatSend }
}

export function useAIServicesMontage() {
  const { montagePlannerState, montagePlannerSend } = useAIServicesDomain()
  return { montagePlannerState, montagePlannerSend }
}

export function useAIServicesIntelligence() {
  const { aiIntelligenceState, aiIntelligenceSend } = useAIServicesDomain()
  return { aiIntelligenceState, aiIntelligenceSend }
}

// Domain utilities
export function useAIServicesDomainStatus() {
  const { config, aiUsageStats, isBackendConnected } = useAIServicesDomain()

  return {
    isServiceEnabled: (service: keyof AIServicesDomainConfig) => config[service],
    enabledServices: Object.entries(config)
      .filter(([, enabled]) => enabled)
      .map(([service]) => service),
    disabledServices: Object.entries(config)
      .filter(([, enabled]) => !enabled)
      .map(([service]) => service),
    usageStats: aiUsageStats,
    isBackendConnected,
  }
}

// Новый хук для мониторинга AI использования
export function useAIUsageMonitor() {
  const { aiUsageStats, syncAIState, isBackendConnected } = useAIServicesDomain()

  return {
    stats: aiUsageStats,
    isConnected: isBackendConnected,
    forceSync: syncAIState,
    canSync: isBackendConnected && aiUsageStats.totalRequests > 0,
  }
}
