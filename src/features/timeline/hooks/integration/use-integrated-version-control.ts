/**
 * Интегрированный hook для Timeline Undo/Redo + Project Version Control
 */

import { useCallback, useEffect, useState } from "react"
import { useVersionControl } from "@/features/version-control/hooks"
import {
  type VersionControlIntegrationConfig,
  versionControlIntegration,
} from "../../services/version-control-integration"
import { useUndoRedo } from "../state/use-undo-redo"

export interface UseIntegratedVersionControlReturn {
  // Undo/Redo операции (краткосрочные)
  undo: () => Promise<boolean>
  redo: () => Promise<boolean>
  undoMultiple: (count: number) => Promise<boolean>
  redoMultiple: (count: number) => Promise<boolean>
  canUndo: boolean
  canRedo: boolean

  // Version Control операции (долгосрочные)
  createSnapshot: (message?: string) => Promise<boolean>
  restoreVersion: (versionId: string) => Promise<boolean>
  switchBranch: (branchName: string) => Promise<boolean>

  // Интегрированные операции
  createCheckpoint: (reason?: string) => Promise<boolean>
  smartUndo: () => Promise<boolean> // Умная отмена с возможностью version restore
  clearUndoHistory: () => void

  // Состояние
  integrationStatus: ReturnType<typeof versionControlIntegration.getIntegrationStatus>
  versionControlState: {
    currentVersionId: string
    branchName: string
    hasUncommittedChanges: boolean
    lastSnapshotTime: string
  }

  // Конфигурация
  updateIntegrationConfig: (config: Partial<VersionControlIntegrationConfig>) => void
  setIntegrationEnabled: (enabled: boolean) => void

  // Статистика и информация
  getRecommendations: () => IntegrationRecommendation[]
}

export interface IntegrationRecommendation {
  type: "snapshot" | "branch" | "optimize" | "warning"
  priority: "low" | "medium" | "high"
  title: string
  description: string
  action?: () => void
}

export function useIntegratedVersionControl(): UseIntegratedVersionControlReturn {
  const versionControl = useVersionControl()
  const undoRedo = useUndoRedo()
  const [integrationStatus, setIntegrationStatus] = useState(versionControlIntegration.getIntegrationStatus())

  // Инициализация интеграции
  useEffect(() => {
    // Инициализируем интеграцию с undo/redo сервисом
    const undoRedoService = (undoRedo as any).serviceRef?.current
    if (undoRedoService) {
      versionControlIntegration.initialize(undoRedoService)
    }

    // Устанавливаем hook version control
    versionControlIntegration.setVersionControlHook(versionControl)

    // Обновляем статус каждые 5 секунд
    const interval = setInterval(() => {
      setIntegrationStatus(versionControlIntegration.getIntegrationStatus())
    }, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [versionControl, undoRedo])

  // Обработка действий undo/redo для интеграции
  const integratedUndo = useCallback(async (): Promise<boolean> => {
    const success = await undoRedo.undo()
    if (success) {
      versionControlIntegration.onUndoRedoAction("UNDO")
    }
    return success
  }, [undoRedo])

  const integratedRedo = useCallback(async (): Promise<boolean> => {
    const success = await undoRedo.redo()
    if (success) {
      versionControlIntegration.onUndoRedoAction("REDO")
    }
    return success
  }, [undoRedo])

  // Множественные операции
  const integratedUndoMultiple = useCallback(
    async (count: number): Promise<boolean> => {
      const success = await undoRedo.undoMultiple(count)
      if (success) {
        versionControlIntegration.onUndoRedoAction(`UNDO_MULTIPLE_${count}`)
      }
      return success
    },
    [undoRedo],
  )

  const integratedRedoMultiple = useCallback(
    async (count: number): Promise<boolean> => {
      const success = await undoRedo.redoMultiple(count)
      if (success) {
        versionControlIntegration.onUndoRedoAction(`REDO_MULTIPLE_${count}`)
      }
      return success
    },
    [undoRedo],
  )

  // Интегрированные операции
  const createCheckpoint = useCallback(async (reason?: string): Promise<boolean> => {
    return await versionControlIntegration.createManualSnapshot(reason || "Ручной checkpoint")
  }, [])

  const smartUndo = useCallback(async (): Promise<boolean> => {
    // Если есть что отменить в undo/redo, делаем это
    if (undoRedo.canUndo) {
      return await integratedUndo()
    }

    // Если нет undo истории, но есть версии проекта, предлагаем восстановить предыдущую версию
    const history = await versionControl.getVersionHistory(5)
    if (history && history.length > 1) {
      const shouldRestore = window.confirm(
        `Нет действий для отмены. Восстановить предыдущую версию проекта (${history[1].message || "без описания"})?`,
      )

      if (shouldRestore) {
        return await versionControl.restoreVersion(history[1].id)
      }
    }

    return false
  }, [undoRedo.canUndo, integratedUndo, versionControl])

  const clearUndoHistory = useCallback(() => {
    undoRedo.clearHistory()
    versionControlIntegration.onUndoRedoAction("CLEAR_HISTORY")
  }, [undoRedo])

  // Обработка событий version control
  const integratedCreateSnapshot = useCallback(
    async (message?: string): Promise<boolean> => {
      const success = await versionControl.createSnapshot(message)
      if (success) {
        // При создании снапшота можем оставить undo/redo историю или очистить
        // Пока оставляем, но помечаем что снапшот создан
        versionControlIntegration.onUndoRedoAction("CREATE_SNAPSHOT")
      }
      return success
    },
    [versionControl],
  )

  const integratedRestoreVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      // Получаем информацию о версии
      const history = await versionControl.getVersionHistory(100)
      const versionInfo = history?.find((v) => v.id === versionId)

      await versionControlIntegration.onVersionRestore(versionId, versionInfo)
      return await versionControl.restoreVersion(versionId)
    },
    [versionControl],
  )

  const integratedSwitchBranch = useCallback(
    async (branchName: string): Promise<boolean> => {
      const currentBranch = versionControl.branchName
      await versionControlIntegration.onBranchSwitch(currentBranch, branchName)
      return await versionControl.switchBranch(branchName)
    },
    [versionControl],
  )

  // Конфигурация
  const updateIntegrationConfig = useCallback((config: Partial<VersionControlIntegrationConfig>) => {
    versionControlIntegration.updateConfig(config)
    setIntegrationStatus(versionControlIntegration.getIntegrationStatus())
  }, [])

  const setIntegrationEnabled = useCallback((enabled: boolean) => {
    versionControlIntegration.setEnabled(enabled)
    setIntegrationStatus(versionControlIntegration.getIntegrationStatus())
  }, [])

  // Рекомендации
  const getRecommendations = useCallback((): IntegrationRecommendation[] => {
    const recommendations: IntegrationRecommendation[] = []
    const status = integrationStatus

    // Рекомендация создать снапшот
    if (status.shouldCreateSnapshot && status.pendingActions > 20) {
      recommendations.push({
        type: "snapshot",
        priority: "high",
        title: "Рекомендуется создать снапшот",
        description: `У вас ${status.pendingActions} несохраненных действий. Создайте снапшот для безопасности.`,
        action: () => createCheckpoint("По рекомендации системы"),
      })
    }

    // Рекомендация по ветвлению
    if (status.pendingActions > 50 && !versionControl.branchName.includes("experiment")) {
      recommendations.push({
        type: "branch",
        priority: "medium",
        title: "Рассмотрите создание экспериментальной ветки",
        description: "Большое количество изменений. Создайте ветку для экспериментов.",
      })
    }

    // Рекомендация оптимизировать
    if (undoRedo.historyStats.historySize > 80) {
      recommendations.push({
        type: "optimize",
        priority: "low",
        title: "Оптимизируйте историю отмен",
        description: "История отмен становится длинной. Рекомендуется оптимизация.",
        action: () => undoRedo.optimizeHistory(),
      })
    }

    // Предупреждения
    if (!status.isEnabled) {
      recommendations.push({
        type: "warning",
        priority: "medium",
        title: "Интеграция версий отключена",
        description: "Автоматические снапшоты не создаются.",
        action: () => setIntegrationEnabled(true),
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }, [integrationStatus, undoRedo, versionControl, createCheckpoint, setIntegrationEnabled])

  return {
    // Undo/Redo операции
    undo: integratedUndo,
    redo: integratedRedo,
    undoMultiple: integratedUndoMultiple,
    redoMultiple: integratedRedoMultiple,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,

    // Version Control операции
    createSnapshot: integratedCreateSnapshot,
    restoreVersion: integratedRestoreVersion,
    switchBranch: integratedSwitchBranch,

    // Интегрированные операции
    createCheckpoint,
    smartUndo,
    clearUndoHistory,

    // Состояние
    integrationStatus,
    versionControlState: {
      currentVersionId: versionControl.currentVersionId || "",
      branchName: versionControl.branchName || "main",
      hasUncommittedChanges: versionControl.hasUncommittedChanges || false,
      lastSnapshotTime:
        typeof versionControl.lastSnapshotTime === "string"
          ? versionControl.lastSnapshotTime
          : versionControl.lastSnapshotTime instanceof Date
            ? versionControl.lastSnapshotTime.toISOString()
            : "",
    },

    // Конфигурация
    updateIntegrationConfig,
    setIntegrationEnabled,

    // Рекомендации
    getRecommendations,
  }
}
