/**
 * System Integration Orchestrator Service
 *
 * Координирует системные функции: модальные окна, обновления, уведомления
 */

import { type ActorRefFrom, createActor } from "xstate"
import { createLogger } from "@/lib/tauri-logger"
import { type ModalData, type ModalType, modalMachine } from "../machines/modal-machine"
import { updateMachine } from "../machines/update-machine"
import type { SystemNotification } from "../types"

const logger = createLogger("SystemIntegrationOrchestrator")


export class SystemIntegrationOrchestrator {
  private modalActor: ActorRefFrom<typeof modalMachine>
  private updateActor: ActorRefFrom<typeof updateMachine>
  private notifications: SystemNotification[] = []
  private features: Record<string, boolean> = {}
  private notificationCounter = 0

  constructor() {
    logger.info("[System Integration Orchestrator] Initializing...")

    // Создаем акторы для машин
    this.modalActor = createActor(modalMachine)
    this.updateActor = createActor(updateMachine)

    // Запускаем акторы
    this.modalActor.start()
    this.updateActor.start()

    // Настраиваем синхронизацию
    this.setupSynchronization()

    logger.info("[System Integration Orchestrator] Initialized successfully")
  }

  /**
   * Настройка синхронизации между машинами
   */
  private setupSynchronization() {
    // Подписываемся на события модальных окон
    this.modalActor.subscribe((state) => {
      if (state.matches("opened")) {
        logger.info("[System Integration] Modal opened:", { state.context.modalType })
      }
    })

    // Подписываемся на события обновлений
    this.updateActor.subscribe((state) => {
      if (state.matches("updateAvailable")) {
        this.showNotification({
          type: "info",
          title: "Доступно обновление",
          message: `Версия ${state.context.availableUpdate?.version} готова к установке`,
          actions: [
            {
              label: "Установить",
              action: () => this.downloadUpdate(),
              style: "primary",
            },
          ],
        })
      }
    })
  }

  /**
   * Управление модальными окнами
   */
  openModal(modal: ModalType, data?: ModalData) {
    logger.info("[System Integration Orchestrator] Opening modal:", { modal })
    this.modalActor.send({
      type: "OPEN_MODAL",
      modalType: modal,
      modalData: data,
    })
  }

  closeModal() {
    logger.info("[System Integration Orchestrator] Closing modal")
    this.modalActor.send({ type: "CLOSE_MODAL" })
  }

  submitModal(data?: ModalData) {
    logger.info("[System Integration Orchestrator] Submitting modal")
    this.modalActor.send({
      type: "SUBMIT_MODAL",
      data,
    })
  }

  getActiveModal(): ModalType {
    const state = this.modalActor.getSnapshot()
    return state.context.modalType
  }

  getModalData(): ModalData | null {
    const state = this.modalActor.getSnapshot()
    return state.context.modalData
  }

  /**
   * Управление обновлениями
   */
  checkForUpdates() {
    logger.info("[System Integration Orchestrator] Checking for updates")
    this.updateActor.send({ type: "CHECK_FOR_UPDATES" })
  }

  downloadUpdate() {
    logger.info("[System Integration Orchestrator] Downloading update")
    this.updateActor.send({ type: "DOWNLOAD_UPDATE" })
  }

  installUpdate() {
    logger.info("[System Integration Orchestrator] Installing update")
    this.updateActor.send({ type: "INSTALL_UPDATE" })
  }

  dismissUpdate() {
    logger.info("[System Integration Orchestrator] Dismissing update")
    this.updateActor.send({ type: "DISMISS" })
  }

  enableAutoUpdate(intervalMinutes: number) {
    logger.info("[System Integration Orchestrator] Enabling auto-update with interval:", { intervalMinutes })
    this.updateActor.send({
      type: "ENABLE_AUTO_CHECK",
      intervalMinutes,
    })
  }

  disableAutoUpdate() {
    logger.info("[System Integration Orchestrator] Disabling auto-update")
    this.updateActor.send({ type: "DISABLE_AUTO_CHECK" })
  }

  /**
   * Управление уведомлениями
   */
  showNotification(notification: Omit<SystemNotification, "id" | "timestamp">): string {
    const id = `notification-${++this.notificationCounter}`
    const fullNotification: SystemNotification = {
      ...notification,
      id,
      timestamp: new Date(),
    }

    logger.info("[System Integration Orchestrator] Showing notification:", { notification.title })
    this.notifications.push(fullNotification)

    // Автоматически удаляем уведомление после заданного времени
    if (notification.duration) {
      const startTime = performance.now()
      logger.info("[System Integration Orchestrator] Scheduling notification dismissal in", { notification.duration })

      setTimeout(() => {
        const duration = performance.now() - startTime
        logger.debug(`[System Integration Orchestrator] Dismissing notification after ${duration.toFixed(2)}ms (scheduled: ${notification.duration}ms)`)
        this.dismissNotification(id)
      }, notification.duration)
    }

    return id
  }

  dismissNotification(id: string) {
    logger.info("[System Integration Orchestrator] Dismissing notification:", { id })
    this.notifications = this.notifications.filter((n) => n.id !== id)
  }

  clearNotifications() {
    logger.info("[System Integration Orchestrator] Clearing all notifications")
    this.notifications = []
  }

  getNotifications(): SystemNotification[] {
    return [...this.notifications]
  }

  /**
   * Управление функциями
   */
  toggleFeature(feature: string, enabled: boolean) {
    logger.info("[System Integration Orchestrator] Feature '${feature}'", { enabled ? "enabled" : "disabled" })
    this.features[feature] = enabled
  }

  isFeatureEnabled(feature: string): boolean {
    return this.features[feature] ?? false
  }

  /**
   * Получение состояния
   */
  getModalState() {
    return this.modalActor.getSnapshot()
  }

  getUpdateState() {
    return this.updateActor.getSnapshot()
  }

  /**
   * Подписка на изменения
   */
  subscribeToModals(callback: (state: any) => void) {
    return this.modalActor.subscribe(callback)
  }

  subscribeToUpdates(callback: (state: any) => void) {
    return this.updateActor.subscribe(callback)
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    logger.info("[System Integration Orchestrator] Disposing...")
    this.modalActor.stop()
    this.updateActor.stop()
    this.clearNotifications()
  }
}

// Singleton экземпляр
let orchestratorInstance: SystemIntegrationOrchestrator | null = null

/**
 * Получить экземпляр System Integration Orchestrator
 */
export function getSystemIntegrationOrchestrator(): SystemIntegrationOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new SystemIntegrationOrchestrator()
  }
  return orchestratorInstance
}

/**
 * Сбросить экземпляр orchestrator (для тестов)
 */
export function resetSystemIntegrationOrchestrator() {
  if (orchestratorInstance) {
    orchestratorInstance.dispose()
    orchestratorInstance = null
  }
}
