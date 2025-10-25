/**
 * System Integration Domain Provider
 *
 * Предоставляет контекст для работы с System Integration доменом
 */

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  getSystemIntegrationOrchestrator,
  type SystemIntegrationOrchestrator,
} from "../services/system-integration-orchestrator"

interface SystemIntegrationContextValue {
  orchestrator: SystemIntegrationOrchestrator
}

const SystemIntegrationContext = createContext<SystemIntegrationContextValue | null>(null)

interface SystemIntegrationProviderProps {
  children: React.ReactNode
  // Опциональные начальные feature flags
  initialFeatures?: Record<string, boolean>
}

export function SystemIntegrationProvider({ children, initialFeatures = {} }: SystemIntegrationProviderProps) {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())

  useEffect(() => {
    console.log("[System Integration Provider] Initialized")

    // Устанавливаем начальные feature flags
    Object.entries(initialFeatures).forEach(([feature, enabled]) => {
      orchestrator.toggleFeature(feature, enabled)
    })

    // Включаем некоторые фичи по умолчанию
    const defaultFeatures = {
      aiAnalysis: true,
      smartMontage: true,
      visionService: true,
      multiCamera: true,
    }

    Object.entries(defaultFeatures).forEach(([feature, enabled]) => {
      if (!(feature in initialFeatures)) {
        orchestrator.toggleFeature(feature, enabled)
      }
    })

    return () => {
      console.log("[System Integration Provider] Cleanup")
    }
  }, [orchestrator, initialFeatures])

  const value: SystemIntegrationContextValue = {
    orchestrator,
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
