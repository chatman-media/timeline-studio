/**
 * AI Services Domain Provider с интеграцией BackendSync
 *
 * Provides centralized access to all AI services state machines and services
 * Добавлена синхронизация состояния AI сервисов с backend
 */

import { useActor } from "@xstate/react"
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import { aiIntelligenceMachine } from "../machines/ai-intelligence-machine"
// Import domain machines
import { ChatMachineContext, chatMachine } from "../machines/chat-machine"
import { MontagePlannerContext, montagePlannerMachine } from "../machines/montage-planner-machine"

// Import domain types
import type {
  AIIntelligenceContext,
  AIIntelligenceEvent,
  AIServicesDomainConfig,
  ChatMachineEvent,
  MontagePlannerEvent,
} from "../types"

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

  // AI Intelligence machine
  aiIntelligenceState: AIIntelligenceContext
  aiIntelligenceSend: (event: AIIntelligenceEvent) => void

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
  const [isBackendConnected, setIsBackendConnected] = useState(backendSync.isConnected())
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

  // Initialize AI intelligence machine
  const [aiIntelligenceState, aiIntelligenceSend] = useActor(aiIntelligenceMachine)

  // Синхронизация состояния AI с backend
  const syncAIState = async () => {
    if (!isBackendConnected) return

    try {
      const response = await backendSync.executeCommand({
        type: "AI",
        params: {
          type: "SyncAIServicesState",
          params: {
            config: domainConfig,
            chatHistory: chatState.messages,
            montageStatus: {
              isAnalyzing: montagePlannerState.isAnalyzing,
              currentPlan: montagePlannerState.montagePlan,
            },
            intelligenceStatus: {
              isAnalyzing: aiIntelligenceState.isAnalyzing,
              analysisResults: aiIntelligenceState.analysisResults,
            },
            usageStats: aiUsageStats,
          },
        },
      })

      if (response.success && response.data) {
        // Обновляем статистику использования от backend
        setAIUsageStats({
          totalRequests: response.data.totalRequests || 0,
          totalTokens: response.data.totalTokens || 0,
          lastSync: new Date(),
        })
      }

      console.log("[AIServicesDomain] AI state synced with backend")
    } catch (error) {
      console.error("[AIServicesDomain] Failed to sync AI state:", error)
    }
  }

  // Подписка на состояние backend и машин
  useEffect(() => {
    // Мониторинг соединения с backend
    const unsubscribeBackend = backendSync.onStateChange((state: ProjectState) => {
      setIsBackendConnected(true)
      
      // Восстанавливаем конфигурацию AI сервисов из backend
      if (state.ai_services_config) {
        setDomainConfig(state.ai_services_config as AIServicesDomainConfig)
      }
    })

    // Подписка на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      switch (event.type) {
        case "AI_CONFIG_UPDATED":
          // Backend обновил конфигурацию AI сервисов
          if (event.data.config) {
            setDomainConfig(event.data.config)
          }
          break
          
        case "AI_USAGE_UPDATED":
          // Backend обновил статистику использования
          if (event.data.stats) {
            setAIUsageStats(prev => ({
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
    }
  }, [backendSync])

  // Синхронизация при изменении состояния машин
  useEffect(() => {
    if (!isBackendConnected) return

    const syncTimeout = setTimeout(() => {
      syncAIState().catch(console.error)
    }, 2000) // Задержка 2 секунды для debouncing

    return () => clearTimeout(syncTimeout)
  }, [
    chatState.messages,
    montagePlannerState.montagePlan,
    aiIntelligenceState.analysisResults,
    isBackendConnected,
  ])

  // Расширенные domain-level действия с BackendSync
  const resetAllServices = async () => {
    chatSend({ type: "CLEAR_MESSAGES" })
    montagePlannerSend({ type: "RESET" })
    aiIntelligenceSend({ type: "RESET" })

    // Уведомляем backend о сбросе
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "AI",
        params: {
          type: "ResetAllAIServices",
          params: { timestamp: new Date().toISOString() },
        },
      })
    }
  }

  const enableService = async (service: keyof AIServicesDomainConfig) => {
    const newConfig = { ...domainConfig, [service]: true }
    setDomainConfig(newConfig)
    
    console.log(`[AI Services Domain] Enabling service: ${service}`)
    
    // Синхронизируем с backend
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "AI",
        params: {
          type: "UpdateAIServiceConfig",
          params: { service, enabled: true },
        },
      })
    }
  }

  const disableService = async (service: keyof AIServicesDomainConfig) => {
    const newConfig = { ...domainConfig, [service]: false }
    setDomainConfig(newConfig)
    
    console.log(`[AI Services Domain] Disabling service: ${service}`)
    
    // Синхронизируем с backend
    if (isBackendConnected) {
      await backendSync.executeCommand({
        type: "AI",
        params: {
          type: "UpdateAIServiceConfig",
          params: { service, enabled: false },
        },
      })
    }
  }

  // Отслеживание использования AI через перехват событий
  useEffect(() => {
    const originalChatSend = chatSend
    const originalMontageSend = montagePlannerSend
    const originalIntelligenceSend = aiIntelligenceSend

    // Перехватываем события для подсчета использования
    const wrappedChatSend = (event: ChatMachineEvent) => {
      if (event.type === "SEND_MESSAGE" && isBackendConnected) {
        setAIUsageStats(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
        }))
        
        // Логируем использование в backend
        backendSync.executeCommand({
          type: "Analytics",
          params: {
            type: "LogAIUsage",
            params: { 
              service: "chat", 
              eventType: "message_sent",
              timestamp: new Date().toISOString(),
            },
          },
        }).catch(console.error)
      }
      originalChatSend(event)
    }

    // Возвращаем оригинальные функции при размонтировании
    return () => {
      // Cleanup если нужно
    }
  }, [chatSend, montagePlannerSend, aiIntelligenceSend, isBackendConnected])

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