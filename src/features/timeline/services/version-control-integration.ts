/**
 * Интеграция между Timeline Undo/Redo и Project Version Control
 * Объединяет краткосрочные операции отмены с долгосрочным управлением версиями
 */

import type { VersionInfo } from "@/features/version-control/types"
import { isServiceEnabled } from "@/shared/config/service-config"
import type { UndoRedoService } from "./undo-redo-service"

export interface VersionControlIntegrationConfig {
  // Автоматическое создание снапшотов
  autoSnapshotEnabled: boolean
  autoSnapshotThreshold: number // Количество undo/redo действий после которого создается снапшот
  autoSnapshotInterval: number // Интервал в минутах для принудительного снапшота

  // Очистка истории при переключении веток
  clearHistoryOnBranchSwitch: boolean
  clearHistoryOnVersionRestore: boolean

  // Создание checkpoint'ов
  createCheckpointsForGroups: boolean // Создавать снапшоты для групп действий
  createCheckpointsForBatchOps: boolean // Создавать снапшоты для batch операций
}

export interface IntegrationState {
  lastSnapshotActionCount: number
  lastSnapshotTime: Date
  pendingActions: number
  isIntegrationEnabled: boolean
  config: VersionControlIntegrationConfig
}

export interface CheckpointInfo {
  actionCount: number
  lastActionType: string
  groupCount: number
  timestamp: Date
  reason: "threshold" | "interval" | "group" | "batch" | "manual"
}

export class VersionControlIntegration {
  private state: IntegrationState
  private undoRedoService: UndoRedoService | null = null
  private versionControlHook: any = null // Будет инициализирован через setVersionControlHook

  constructor(config?: Partial<VersionControlIntegrationConfig>) {
    this.state = {
      lastSnapshotActionCount: 0,
      lastSnapshotTime: new Date(),
      pendingActions: 0,
      isIntegrationEnabled: true,
      config: {
        autoSnapshotEnabled: isServiceEnabled("AUTO_SNAPSHOT"),
        autoSnapshotThreshold: 50, // После 50 действий
        autoSnapshotInterval: 15, // Каждые 15 минут
        clearHistoryOnBranchSwitch: true,
        clearHistoryOnVersionRestore: true,
        createCheckpointsForGroups: true,
        createCheckpointsForBatchOps: true,
        ...config,
      },
    }
  }

  /**
   * Инициализация интеграции
   */
  initialize(undoRedoService: UndoRedoService) {
    this.undoRedoService = undoRedoService
    this.startAutoSnapshotTimer()
  }

  /**
   * Установка hook версий контроля (вызывается из React компонента)
   */
  setVersionControlHook(hook: any) {
    this.versionControlHook = hook
  }

  /**
   * Обработка нового действия в Undo/Redo
   */
  onUndoRedoAction(actionType: string, isGroupEnd?: boolean): void {
    if (!this.state.isIntegrationEnabled || !this.undoRedoService) return

    this.state.pendingActions++
    const stats = this.undoRedoService.getHistoryStats()

    // Проверяем условия для автоматического снапшота
    const actionsSinceSnapshot = stats.totalActions - this.state.lastSnapshotActionCount

    if (this.shouldCreateAutoSnapshot(actionsSinceSnapshot, actionType, isGroupEnd)) {
      this.createAutoSnapshot("threshold", {
        actionCount: actionsSinceSnapshot,
        lastActionType: actionType,
        groupCount: 0,
        timestamp: new Date(),
        reason: "threshold",
      })
    }
  }

  /**
   * Обработка переключения ветки
   */
  async onBranchSwitch(_fromBranch: string, toBranch: string): Promise<void> {
    if (!this.state.config.clearHistoryOnBranchSwitch) return

    // Предлагаем создать снапшот перед переключением
    if (this.state.pendingActions > 0) {
      const shouldSnapshot = await this.promptForSnapshot(
        `Переключение на ветку "${toBranch}". Создать снапшот текущих изменений?`,
      )

      if (shouldSnapshot) {
        await this.createManualSnapshot(`Перед переключением на ${toBranch}`)
      }
    }

    // Очищаем историю Undo/Redo
    this.undoRedoService?.clearHistory()
    this.state.pendingActions = 0
    this.state.lastSnapshotActionCount = 0
  }

  /**
   * Обработка восстановления версии
   */
  async onVersionRestore(_versionId: string, _versionInfo?: VersionInfo): Promise<void> {
    if (!this.state.config.clearHistoryOnVersionRestore) return

    // Предлагаем создать снапшот перед восстановлением
    if (this.state.pendingActions > 0) {
      const shouldSnapshot = await this.promptForSnapshot(
        "Восстановление версии удалит текущие изменения. Создать снапшот?",
      )

      if (shouldSnapshot) {
        await this.createManualSnapshot("Перед восстановлением версии")
      }
    }

    // Очищаем историю Undo/Redo
    this.undoRedoService?.clearHistory()
    this.state.pendingActions = 0
    this.state.lastSnapshotActionCount = 0
  }

  /**
   * Создание checkpoint'а для группы действий
   */
  async createGroupCheckpoint(_groupId: string, description: string): Promise<boolean> {
    if (!this.state.config.createCheckpointsForGroups) return false

    return await this.createAutoSnapshot(
      "group",
      {
        actionCount: this.state.pendingActions,
        lastActionType: "GROUP",
        groupCount: 1,
        timestamp: new Date(),
        reason: "group",
      },
      `Группа: ${description}`,
    )
  }

  /**
   * Создание checkpoint'а для batch операции
   */
  async createBatchCheckpoint(batchDescription: string, affectedClips: number): Promise<boolean> {
    if (!this.state.config.createCheckpointsForBatchOps) return false

    return await this.createAutoSnapshot(
      "batch",
      {
        actionCount: this.state.pendingActions,
        lastActionType: "BATCH",
        groupCount: 0,
        timestamp: new Date(),
        reason: "batch",
      },
      `Batch: ${batchDescription} (${affectedClips} клипов)`,
    )
  }

  /**
   * Ручное создание снапшота
   */
  async createManualSnapshot(message?: string): Promise<boolean> {
    if (!this.versionControlHook?.createSnapshot) return false

    const success = await this.versionControlHook.createSnapshot(
      message || `Ручной снапшот (${this.state.pendingActions} действий)`,
    )

    if (success) {
      this.updateSnapshotState("manual")
    }

    return success
  }

  /**
   * Получение статуса интеграции
   */
  getIntegrationStatus() {
    const undoRedoStats = this.undoRedoService?.getHistoryStats()

    return {
      // Состояние интеграции
      isEnabled: this.state.isIntegrationEnabled,
      pendingActions: this.state.pendingActions,
      lastSnapshotTime: this.state.lastSnapshotTime,
      actionsSinceSnapshot: undoRedoStats ? undoRedoStats.totalActions - this.state.lastSnapshotActionCount : 0,

      // Конфигурация
      config: this.state.config,

      // Рекомендации
      shouldCreateSnapshot: this.shouldCreateAutoSnapshot(
        undoRedoStats ? undoRedoStats.totalActions - this.state.lastSnapshotActionCount : 0,
        "CHECK",
      ),

      // Статистика
      undoRedoStats,
    }
  }

  /**
   * Обновление конфигурации
   */
  updateConfig(updates: Partial<VersionControlIntegrationConfig>): void {
    this.state.config = { ...this.state.config, ...updates }
  }

  /**
   * Включение/отключение интеграции
   */
  setEnabled(enabled: boolean): void {
    this.state.isIntegrationEnabled = enabled

    if (enabled) {
      this.startAutoSnapshotTimer()
    } else {
      this.stopAutoSnapshotTimer()
    }
  }

  // Приватные методы

  private shouldCreateAutoSnapshot(actionsSinceSnapshot: number, _actionType?: string, isGroupEnd?: boolean): boolean {
    if (!this.state.config.autoSnapshotEnabled) return false

    // По количеству действий
    if (actionsSinceSnapshot >= this.state.config.autoSnapshotThreshold) {
      return true
    }

    // По времени
    const minutesSinceSnapshot = (Date.now() - this.state.lastSnapshotTime.getTime()) / (1000 * 60)
    if (minutesSinceSnapshot >= this.state.config.autoSnapshotInterval) {
      return true
    }

    // В конце группы действий
    if (isGroupEnd && this.state.config.createCheckpointsForGroups && actionsSinceSnapshot > 5) {
      return true
    }

    return false
  }

  private async createAutoSnapshot(
    reason: CheckpointInfo["reason"],
    info: CheckpointInfo,
    customMessage?: string,
  ): Promise<boolean> {
    if (!this.versionControlHook?.createSnapshot) return false

    const message = customMessage || this.generateSnapshotMessage(reason, info)
    const success = await this.versionControlHook.createSnapshot(message)

    if (success) {
      this.updateSnapshotState(reason)
    }

    return success
  }

  private generateSnapshotMessage(reason: CheckpointInfo["reason"], info: CheckpointInfo): string {
    switch (reason) {
      case "threshold":
        return `Авто-снапшот: ${info.actionCount} действий`
      case "interval":
        return `Авто-снапшот: по таймеру (${Math.round((Date.now() - this.state.lastSnapshotTime.getTime()) / (1000 * 60))}мин)`
      case "group":
        return "Авто-снапшот: завершение группы действий"
      case "batch":
        return "Авто-снапшот: batch операция"
      case "manual":
        return "Ручной снапшот"
      default:
        return `Снапшот: ${info.actionCount} действий`
    }
  }

  private updateSnapshotState(_reason: CheckpointInfo["reason"]): void {
    const stats = this.undoRedoService?.getHistoryStats()
    if (stats) {
      this.state.lastSnapshotActionCount = stats.totalActions
    }

    this.state.lastSnapshotTime = new Date()
    this.state.pendingActions = 0
  }

  private async promptForSnapshot(message: string): Promise<boolean> {
    // В реальном приложении это может быть красивый диалог
    // Сейчас используем простой confirm для демонстрации
    return window.confirm(message)
  }

  // Таймер для автоматических снапшотов
  private autoSnapshotTimer: NodeJS.Timeout | null = null

  private startAutoSnapshotTimer(): void {
    this.stopAutoSnapshotTimer()

    if (!this.state.config.autoSnapshotEnabled) return

    // Проверяем, разрешены ли автоснапшоты
    if (!isServiceEnabled("AUTO_SNAPSHOT")) {
      console.log("[VersionControlIntegration] Auto-snapshot is disabled by service config")
      return
    }

    console.log("[VersionControlIntegration] Starting auto-snapshot timer")
    let timerRuns = 0

    this.autoSnapshotTimer = setInterval(() => {
      timerRuns++
      const startTime = performance.now()
      console.log(`[VersionControlIntegration] Auto-snapshot timer run #${timerRuns}`)

      if (this.state.pendingActions > 0) {
        const minutesSinceSnapshot = (Date.now() - this.state.lastSnapshotTime.getTime()) / (1000 * 60)
        console.log(
          `[VersionControlIntegration] Minutes since snapshot: ${minutesSinceSnapshot.toFixed(1)}, pending actions: ${this.state.pendingActions}`,
        )

        if (minutesSinceSnapshot >= this.state.config.autoSnapshotInterval) {
          console.log(
            `[VersionControlIntegration] Creating auto-snapshot by timer (interval: ${this.state.config.autoSnapshotInterval}min)`,
          )
          this.createAutoSnapshot("interval", {
            actionCount: this.state.pendingActions,
            lastActionType: "TIMER",
            groupCount: 0,
            timestamp: new Date(),
            reason: "interval",
          }).then((success) => {
            const duration = performance.now() - startTime
            console.log(
              `[VersionControlIntegration] Auto-snapshot creation ${success ? "succeeded" : "failed"} in ${duration.toFixed(2)}ms`,
            )
          })
        }
      } else {
        console.log("[VersionControlIntegration] No pending actions, skipping snapshot creation")
      }

      const totalDuration = performance.now() - startTime
      if (totalDuration > 50) {
        console.warn(
          `[VersionControlIntegration] WARNING: Auto-snapshot timer run #${timerRuns} took ${totalDuration.toFixed(2)}ms`,
        )
      }
    }, 60000) // Проверяем каждую минуту
  }

  private stopAutoSnapshotTimer(): void {
    if (this.autoSnapshotTimer) {
      clearInterval(this.autoSnapshotTimer)
      this.autoSnapshotTimer = null
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSnapshotTimer()
    this.undoRedoService = null
    this.versionControlHook = null
  }
}

// Singleton instance для использования по всему приложению
export const versionControlIntegration = new VersionControlIntegration()
