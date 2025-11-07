/**
 * System Integration Domain Provider с интеграцией BackendSync
 *
 * Предоставляет контекст для работы с System Integration доменом
 * с синхронизацией системных настроек и feature flags через backend
 */

import React, { createContext, useContext, useEffect, useState } from "react"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectState } from "@/types/generated/tauri-bindings"
import {
  getSystemIntegrationOrchestrator,
  type SystemIntegrationOrchestrator,
} from "../services/system-integration-orchestrator"

const logger = createLogger("SystemIntegrationProvider")

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
    const unsubscribe = backendSync.onStateChange((_state: ProjectState) => {
      setIsConnected(true)
      logger.debug("[System Integration] State synced from backend")
    })

    // Подписываемся на события backend
    const unsubscribeEvents = backendSync.onEvent((event) => {
      switch (event.type) {
        case "NotificationShown":
          if (event.payload && "notification" in event.payload) {
            const notification = event.payload.notification
            orchestrator.showNotification({
              notification_type: notification.notification_type,
              type: notification.notification_type as "info" | "success" | "warning" | "error",
              title: notification.title,
              message: notification.message,
              duration: notification.duration ?? undefined,
            })
          }
          break

        case "FeatureToggled":
          if (event.payload && "feature" in event.payload && "enabled" in event.payload) {
            const { feature, enabled } = event.payload
            orchestrator.toggleFeature(feature, enabled)
            setFeatures((prev) => ({
              ...prev,
              [feature]: enabled,
            }))
          }
          break

        case "UpdateAvailable":
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

    // Инициализируем feature flags локально
    // TODO: Когда backend будет поддерживать feature flags, добавить синхронизацию
    setFeatures(defaultFeatures)
    Object.entries(defaultFeatures).forEach(([feature, enabled]) => {
      orchestrator.toggleFeature(feature, enabled)
    })

    return () => {
      logger.info("[System Integration Provider] Cleanup")
      unsubscribe()
      unsubscribeEvents()
    }
  }, [orchestrator, initialFeatures, backendSync])

  // Синхронизация изменений feature flags
  useEffect(() => {
    // TODO: Когда backend будет поддерживать feature flag commands,
    // добавить синхронизацию изменений с backend
    // Пока feature flags управляются только локально

    return () => {
      // Cleanup
    }
  }, [backendSync])

  // Синхронизация системных уведомлений
  useEffect(() => {
    // TODO: Когда backend будет поддерживать notification sync commands,
    // добавить периодическую синхронизацию непрочитанных уведомлений
    // Пока уведомления управляются только локально

    return () => {
      // Cleanup
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
      logger.warn("Warning", {
        data: "[System Integration] Backend not connected, feature flag change may not persist",
      })
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
