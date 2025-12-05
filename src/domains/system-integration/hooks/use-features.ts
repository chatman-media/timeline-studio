/**
 * Hook для работы с feature flags
 */

import { useCallback, useEffect, useState } from "react"
import { isServiceEnabled } from "@/config/service-config"
import { createLogger } from "@/lib/tauri-logger"
import { getSystemIntegrationOrchestrator } from "../services/system-integration-orchestrator"

const logger = createLogger("UseFeatures")

export function useFeatures() {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [features, setFeatures] = useState<Record<string, boolean>>({})

  // Получаем список всех известных фич (вынесли за пределы updateFeatures для доступа в useEffect)
  const knownFeatures = [
    "aiAnalysis",
    "smartMontage",
    "visionService",
    "multiCamera",
    "cloudSync",
    "collaboration",
    "advancedColorGrading",
    "aiVoiceGeneration",
    "motionTracking",
    "3dEffects",
    "neuralFilters",
    "remoteControl",
  ]

  // Обновление списка фич
  const updateFeatures = useCallback(() => {
    const currentFeatures: Record<string, boolean> = {}
    knownFeatures.forEach((feature) => {
      currentFeatures[feature] = orchestrator.isFeatureEnabled(feature)
    })

    setFeatures(currentFeatures)
  }, [orchestrator, knownFeatures])

  // Инициализация и периодическое обновление
  useEffect(() => {
    // Проверяем, разрешены ли обновления фич
    if (!isServiceEnabled("FEATURES")) {
      logger.info("[useFeatures] Features updates are disabled by service config")
      // Устанавливаем дефолтные значения и выходим
      const defaultFeatures: Record<string, boolean> = {}
      knownFeatures.forEach((feature) => {
        defaultFeatures[feature] = false // Все фичи отключены по умолчанию
      })
      setFeatures(defaultFeatures)
      return
    }

    logger.info("[useFeatures] Setting up features update interval")
    updateFeatures()

    let updateCount = 0
    // Обновляем при изменениях (можно заменить на подписку если добавим events)
    const interval = setInterval(() => {
      updateCount++
      const startTime = performance.now()

      updateFeatures()

      const duration = performance.now() - startTime
      if (duration > 10) {
        logger.warn(`[useFeatures] Features update #${updateCount} took ${duration.toFixed(2)}ms`)
      }

      // Логируем каждые 60 обновлений (раз в минуту)
      if (updateCount % 60 === 0) {
        logger.info("[useFeatures] Processed", { updateCount })
      }
    }, 1000)

    return () => {
      logger.info("[useFeatures] Cleaning up features interval (processed", { updateCount })
      clearInterval(interval)
    }
  }, [updateFeatures, knownFeatures])

  // Переключение фичи
  const toggleFeature = useCallback(
    (feature: string, enabled?: boolean) => {
      const newState = enabled ?? !orchestrator.isFeatureEnabled(feature)
      orchestrator.toggleFeature(feature, newState)
      updateFeatures()
    },
    [orchestrator, updateFeatures],
  )

  // Проверка доступности фичи
  const isFeatureEnabled = useCallback(
    (feature: string): boolean => {
      return orchestrator.isFeatureEnabled(feature)
    },
    [orchestrator],
  )

  // Включение фичи
  const enableFeature = useCallback(
    (feature: string) => {
      toggleFeature(feature, true)
    },
    [toggleFeature],
  )

  // Отключение фичи
  const disableFeature = useCallback(
    (feature: string) => {
      toggleFeature(feature, false)
    },
    [toggleFeature],
  )

  // Включение/отключение группы фич
  const _setFeatures = useCallback(
    (featureMap: Record<string, boolean>) => {
      Object.entries(featureMap).forEach(([feature, enabled]) => {
        orchestrator.toggleFeature(feature, enabled)
      })
      updateFeatures()
    },
    [orchestrator, updateFeatures],
  )

  return {
    // Состояние
    features,

    // Методы
    toggleFeature,
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    setFeatures: _setFeatures,

    // Удобные геттеры для популярных фич
    aiAnalysisEnabled: features.aiAnalysis ?? false,
    smartMontageEnabled: features.smartMontage ?? false,
    visionServiceEnabled: features.visionService ?? false,
    multiCameraEnabled: features.multiCamera ?? false,
    cloudSyncEnabled: features.cloudSync ?? false,
    collaborationEnabled: features.collaboration ?? false,
    advancedColorGradingEnabled: features.advancedColorGrading ?? false,
  }
}
