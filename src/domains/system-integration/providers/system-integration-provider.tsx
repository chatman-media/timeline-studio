/**
 * System Integration Domain Provider с интеграцией BackendSync
 *
 * Предоставляет контекст для работы с System Integration доменом
 * с синхронизацией системных настроек и feature flags через backend
 */

import React, { createContext, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import {

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("SystemIntegrationProvider")

  getSystemIntegrationOrchestrator,
  type SystemIntegrationOrchestrator,
} from "../services/system-integration-orchestrator"

interface SystemIntegrationContextValue {
  orchestrator: SystemIntegrationOrchestrator
  // BackendSync status
  isConnected: boolean
  error: string | null
  // Feature flags состояние
  features: Record<string, boolean>
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
 * Синхронизирует системные настройки, feature flags и уведомления с backend
 */
export function SystemIntegrationProvider({ children, initialFeatures = {} }: SystemIntegrationProviderProps) {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [features, setFeatures] = useState<Record<string, boolean>>(initialFeatures)
  const backendSync = getBackendSync()

  // Синхронизация с backend
  useEffect(() => {
    logger.info("[System Integration Provider] Initializing with BackendSync")

    // Подписываемся на изменения backend состояния
    const unsubscribe = backendSync.onStateChange((state: ProjectState) => {
      setIsConnected(true)

      // Синхронизируем feature flags из backend
      if (state.system_state?.feature_flags) {
        const backendFeatures = state.system_state.feature_flags
        setFeatures(backendFeatures)

        // Обновляем feature flags в оркестраторе
        Object.entries(backendFeatures).forEach(([feature, enabled]) => {
          orchestrator.toggleFeature(feature, enabled as boolean)
        })

        logger.debug("[System Integration] Feature flags synced from backend:", { data: backendFeatures })
      }

      // Синхронизируем системные уведомления
      if (state.system_state?.notifications) {
        state.system_state.notifications.forEach((notification: any) => {
          orchestrator.showNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actions: notification.actions,
          })
        })
      }
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      switch (event.type) {
        case "SYSTEM_NOTIFICATION":
          orchestrator.showNotification({
            type: event.data.type,
            title: event.data.title,
            message: event.data.message,
            actions: event.data.actions,
          })
          break

        case "FEATURE_FLAG_UPDATED":
          orchestrator.toggleFeature(event.data.feature, event.data.enabled)
          setFeatures((prev) => ({
            ...prev,
            [event.data.feature]: event.data.enabled,
          }))
          break

        case "UPDATE_AVAILABLE":
          orchestrator.checkForUpdates()
          break
      }
    })

    // Устанавливаем начальные feature flags
    const defaultFeatures = {
      aiAnalysis: true,
      smartMontage: true,
      visionService: true,
      multiCamera: true,
      ...initialFeatures,
    }

    // Синхронизируем начальные feature flags с backend
    backendSync
      .executeCommand({
        type: "System",
        params: {
          type: "UpdateFeatureFlags",
          params: {
            features: defaultFeatures,
          },
        },
      })
      .then(() => {
        setFeatures(defaultFeatures)
        Object.entries(defaultFeatures).forEach(([feature, enabled]) => {
          orchestrator.toggleFeature(feature, enabled)
        })
      })
      .catch((err) => {
        logger.error("[System Integration] Failed to sync feature flags:", { error: err })
        setError(err.message)
      })

    return () => {
      logger.info("[System Integration Provider] Cleanup")
      unsubscribe()
      unsubscribeEvents()
    }
  }, [orchestrator, initialFeatures, backendSync])

  // Синхронизация изменений feature flags
  useEffect(() => {
    // Подписываемся на изменения feature flags в оркестраторе
    const handleFeatureToggle = (feature: string, enabled: boolean) => {
      // Синхронизируем изменение с backend
      backendSync
        .executeCommand({
          type: "System",
          params: {
            type: "UpdateFeatureFlag",
            params: {
              feature,
              enabled,
            },
          },
        })
        .catch((err) => {
          logger.error("[System Integration] Failed to sync feature flag", { feature, err })
          setError(err.message)
        })
    }

    // Здесь можно добавить подписку на события оркестратора
    // если он поддерживает event emitter

    return () => {
      // Cleanup
    }
  }, [backendSync])

  // Синхронизация системных уведомлений
  useEffect(() => {
    // Периодически синхронизируем непрочитанные уведомления с backend
    const syncNotifications = () => {
      const notifications = orchestrator.getNotifications()
      const unreadNotifications = notifications.filter((n) => !n.read)

      if (unreadNotifications.length > 0) {
        backendSync
          .executeCommand({
            type: "System",
            params: {
              type: "SyncNotifications",
              params: {
                notifications: unreadNotifications,
              },
            },
          })
          .catch((err) => {
            logger.error("[System Integration] Failed to sync notifications:", { error: err })
          })
      }
    }

    const interval = setInterval(syncNotifications, 30000) // Каждые 30 секунд

    return () => {
      clearInterval(interval)
    }
  }, [orchestrator, backendSync])

  const value: SystemIntegrationContextValue = {
    orchestrator,
    isConnected,
    error,
    features,
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
 */
export function useFeatureFlags() {
  const { features, orchestrator, isConnected } = useSystemIntegrationContext()

  const toggleFeature = (feature: string, enabled: boolean) => {
    if (!isConnected) {
      logger.warn("Warning", { data: "[System Integration] Backend not connected, feature flag change may not persist" })
    }
    orchestrator.toggleFeature(feature, enabled)
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
