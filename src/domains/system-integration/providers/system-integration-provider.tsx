/**
 * System Integration Domain Provider с интеграцией BackendSync
 *
 * Предоставляет контекст для работы с System Integration доменом
 * с синхронизацией системных настроек и feature flags через backend
 *
 * АРХИТЕКТУРА: Event-Driven с BackendSync
 * - Подписывается на backend события через backendSync.onEvent()
 * - Обрабатывает события через backend-event-handlers
 * - Синхронизирует feature flags, notifications и updates с backend
 */

import React, { createContext, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import { type SystemIntegrationContext as BackendContext, handleBackendEvent } from "../machines/backend-event-handlers"
import {
  getSystemIntegrationOrchestrator,
  type SystemIntegrationOrchestrator,
} from "../services/system-integration-orchestrator"
import type { SystemNotification } from "../types"

const logger = createLogger("SystemIntegrationProvider")

interface SystemIntegrationContextValue {
  orchestrator: SystemIntegrationOrchestrator
  // BackendSync status
  isConnected: boolean
  error: string | null
  // Feature flags состояние (синхронизируется с backend)
  features: Record<string, boolean>
  // Notifications состояние (синхронизируется с backend)
  notifications: SystemNotification[]
  // Update state (синхронизируется с backend)
  updateAvailable: boolean
  updateInfo: any | null
}

const SystemIntegrationContext = createContext<SystemIntegrationContextValue | null>(null)

interface SystemIntegrationProviderProps {
  children: React.ReactNode
  // Опциональные начальные feature flags
  initialFeatures?: Record<string, boolean>
}

/**
 * System Integration Provider с интеграцией BackendSync
 *
 * EVENT-DRIVEN АРХИТЕКТУРА:
 * - Все изменения происходят через backend события
 * - Feature flags синхронизируются через FeatureToggled события
 * - Notifications синхронизируются через NotificationShown/Dismissed события
 * - Updates синхронизируются через UpdateAvailable/CheckCompleted события
 */
export function SystemIntegrationProvider({ children, initialFeatures = {} }: SystemIntegrationProviderProps) {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State управляется через backend события
  const [backendContext, setBackendContext] = useState<BackendContext>({
    features: initialFeatures,
    notifications: [],
    updateAvailable: false,
    updateInfo: null,
    isConnected: false,
    error: null,
  })

  const backendSync = getBackendSync()

  // ✅ EVENT-DRIVEN: Подписка на backend события
  useEffect(() => {
    logger.info("[System Integration Provider] Initializing with BackendSync (Event-Driven)")

    // Подключаемся к backend
    if (!backendSync.connected) {
      backendSync.connect().catch((error) => {
        logger.error("Failed to connect backend sync", { error })
        setError(error.message || "Failed to connect to backend")
      })
    }

    // ✅ НОВАЯ АРХИТЕКТУРА: Подписываемся на backend СОБЫТИЯ
    const unsubscribeEvents = backendSync.onEvent((event) => {
      logger.info("[SystemIntegrationProvider] Received backend event", { eventType: event.type })

      // Обрабатываем событие через backend-event-handlers
      const updates = handleBackendEvent(backendContext, event)

      // Применяем обновления к контексту
      if (Object.keys(updates).length > 0) {
        setBackendContext((prev) => ({
          ...prev,
          ...updates,
        }))

        // Синхронизируем с orchestrator для обратной совместимости
        if (updates.features) {
          Object.entries(updates.features).forEach(([feature, enabled]) => {
            orchestrator.toggleFeature(feature, enabled)
          })
        }

        if (updates.notifications) {
          // Orchestrator уже управляет своими notifications
          // Здесь мы просто синхронизируем state
        }
      }
    })

    // Подписываемся на изменения backend состояния (для connection status)
    const unsubscribeState = backendSync.onStateChange((_state: ProjectState) => {
      setIsConnected(true)
      setBackendContext((prev) => ({
        ...prev,
        isConnected: true,
      }))
      logger.debug("[System Integration] Backend connected")
    })

    // ✅ Инициализация начальных feature flags через backend команду
    const initializeFeatureFlags = async () => {
      const defaultFeatures = {
        aiAnalysis: true,
        smartMontage: true,
        visionService: true,
        multiCamera: true,
        ...initialFeatures,
      }

      // Отправляем начальные feature flags в backend
      for (const [feature, enabled] of Object.entries(defaultFeatures)) {
        try {
          await backendSync.executeCommand({
            type: "ToggleFeature",
            params: { feature, enabled },
          })
          logger.debug(`[System Integration] Initialized feature flag: ${feature} = ${enabled}`)
        } catch (error) {
          logger.warn(`Failed to initialize feature flag ${feature}:`, { error })
          // Fallback: устанавливаем локально
          orchestrator.toggleFeature(feature, enabled)
        }
      }
    }

    initializeFeatureFlags()

    return () => {
      logger.info("[System Integration Provider] Cleanup")
      unsubscribeEvents()
      unsubscribeState()
    }
  }, [orchestrator, initialFeatures, backendSync])

  const value: SystemIntegrationContextValue = {
    orchestrator,
    isConnected,
    error,
    features: backendContext.features,
    notifications: backendContext.notifications,
    updateAvailable: backendContext.updateAvailable,
    updateInfo: backendContext.updateInfo,
  }

  return <SystemIntegrationContext.Provider value={value}>{children}</SystemIntegrationContext.Provider>
}

/**
 * Hook для доступа к System Integration контексту
 */
export function useSystemIntegrationContext() {
  const context = useContext(SystemIntegrationContext)

  if (!context) {
    throw new Error("useSystemIntegrationContext must be used within SystemIntegrationProvider")
  }

  return context
}

/**
 * Hook для работы с feature flags
 *
 * EVENT-DRIVEN: Все изменения feature flags проходят через backend команды
 * и обновляются через события FeatureToggled
 */
export function useFeatureFlags() {
  const { features, orchestrator, isConnected } = useSystemIntegrationContext()
  const backendSync = getBackendSync()

  const toggleFeature = async (feature: string, enabled: boolean) => {
    if (!isConnected) {
      logger.warn("Warning", {
        data: "[System Integration] Backend not connected, feature flag change may not persist",
      })
    }

    try {
      // ✅ Отправляем команду в backend - state обновится через событие FeatureToggled
      await backendSync.executeCommand({
        type: "ToggleFeature",
        params: { feature, enabled },
      })
      logger.info(`[System Integration] Feature flag toggled: ${feature} = ${enabled}`)

      // Также обновляем orchestrator для обратной совместимости
      orchestrator.toggleFeature(feature, enabled)
    } catch (error) {
      logger.error(`Failed to toggle feature ${feature}:`, { error })
      // Fallback: обновляем локально
      orchestrator.toggleFeature(feature, enabled)
      throw error
    }
  }

  const isFeatureEnabled = (feature: string): boolean => {
    return features[feature] || false
  }

  return {
    features,
    toggleFeature,
    isFeatureEnabled,
    isConnected,
  }
}
