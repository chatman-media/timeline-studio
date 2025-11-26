/**
 * System Integration Orchestrator Service
 *
 * Координирует системные функции: модальные окна, обновления, уведомления
 * Интегрирован с BackendSync для синхронизации с Rust backend
 */

import { type ActorRefFrom, createActor } from "xstate"
import { getBackendSync } from "@/features/app-state/services/backend-sync"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectCommand, ProjectEvent } from "@/types/generated/tauri-bindings"
import { type ModalData, type ModalType, modalMachine } from "../machines/modal-machine"
import { updateMachine } from "../machines/update-machine"
import type { SystemNotification } from "../types"

const logger = createLogger("SystemIntegrationOrchestrator")

// Модальные окна, которые требуют синхронизации с backend
const BACKEND_SYNCED_MODALS: ModalType[] = [
  "project-settings",
  "export",
  "user-settings",
  "cache-settings",
  "missing-files",
]

export class SystemIntegrationOrchestrator {
  private modalActor: ActorRefFrom<typeof modalMachine>
  private updateActor: ActorRefFrom<typeof updateMachine>
  private notifications: SystemNotification[] = []
  private features: Record<string, boolean> = {}
  private notificationCounter = 0
  private backendSync = getBackendSync()
  private backendUnsubscribe: (() => void) | null = null

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
    this.setupBackendSync()

    logger.info("[System Integration Orchestrator] Initialized successfully")
  }

  /**
   * Настройка синхронизации между машинами
   */
  private setupSynchronization() {
    // Подписываемся на события модальных окон
    this.modalActor.subscribe((state) => {
      if (state.matches("opened")) {
        logger.info("[System Integration] Modal opened:", { modalType: state.context.modalType })
      }
    })

    // Подписываемся на события обновлений
    this.updateActor.subscribe((state) => {
      if (state.matches("updateAvailable")) {
        this.showNotification({
          notification_type: "info",
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
   * Настройка синхронизации с backend через BackendSync
   */
  private setupBackendSync() {
    // Подписываемся на backend события
    this.backendUnsubscribe = this.backendSync.onEvent((event: ProjectEvent) => {
      logger.info("[System Integration Orchestrator] Received backend event:", { eventType: event.type })

      // Обрабатываем события модальных окон
      // TODO: добавить когда в backend будут реализованы эти события
      // if (event.type === "ModalOpened") { ... }
      // if (event.type === "ModalClosed") { ... }
      // if (event.type === "ModalSubmitted") { ... }

      // Обрабатываем события обновлений
      // TODO: добавить когда в backend будут реализованы эти события
      // if (event.type === "UpdateAvailable") { ... }
      // if (event.type === "UpdateDownloaded") { ... }
    })
  }

  /**
   * Управление модальными окнами
   */
  async openModal(modal: ModalType, data?: ModalData): Promise<void> {
    logger.info("[System Integration Orchestrator] Opening modal:", { modal })

    // Оптимистичное обновление - обновляем машину сразу
    this.modalActor.send({
      type: "OPEN_MODAL",
      modalType: modal,
      modalData: data,
    })

    // Отправляем команду на backend только для важных модалов
    if (this.shouldSyncWithBackend(modal)) {
      try {
        const command: ProjectCommand = {
          type: "OpenModal" as any,
          params: {
            modal_type: modal,
            modal_data: data || null,
          },
        } as any

        await this.backendSync.executeCommand(command)
        logger.info("[System Integration Orchestrator] Modal open command sent to backend")
      } catch (error) {
        logger.error("[System Integration Orchestrator] Failed to sync modal open with backend:", { error })
        // Не бросаем ошибку - модал уже открыт в UI
      }
    }
  }

  async closeModal(): Promise<void> {
    logger.info("[System Integration Orchestrator] Closing modal")

    const currentModal = this.getActiveModal()

    // Оптимистичное обновление
    this.modalActor.send({ type: "CLOSE_MODAL" })

    // Отправляем команду на backend только для важных модалов
    if (this.shouldSyncWithBackend(currentModal)) {
      try {
        const command: ProjectCommand = {
          type: "CloseModal" as any,
        } as any

        await this.backendSync.executeCommand(command)
        logger.info("[System Integration Orchestrator] Modal close command sent to backend")
      } catch (error) {
        logger.error("[System Integration Orchestrator] Failed to sync modal close with backend:", { error })
      }
    }
  }

  async submitModal(data?: ModalData): Promise<void> {
    logger.info("[System Integration Orchestrator] Submitting modal")

    const currentModal = this.getActiveModal()

    // Оптимистичное обновление
    this.modalActor.send({
      type: "SUBMIT_MODAL",
      data,
    })

    // Отправляем команду на backend только для важных модалов
    if (this.shouldSyncWithBackend(currentModal)) {
      try {
        const command: ProjectCommand = {
          type: "SubmitModal" as any,
          params: {
            data: data || null,
          },
        } as any

        await this.backendSync.executeCommand(command)
        logger.info("[System Integration Orchestrator] Modal submit command sent to backend")
      } catch (error) {
        logger.error("[System Integration Orchestrator] Failed to sync modal submit with backend:", { error })
      }
    }
  }

  /**
   * Проверка, нужна ли backend синхронизация для модального окна
   */
  private shouldSyncWithBackend(modalType: ModalType): boolean {
    return BACKEND_SYNCED_MODALS.includes(modalType)
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
      notification_type: notification.type, // Ensure backend field is set
    }

    logger.info("[System Integration Orchestrator] Showing notification:", { title: notification.title })
    this.notifications.push(fullNotification)

    // Автоматически удаляем уведомление после заданного времени
    if (notification.duration) {
      const startTime = performance.now()
      logger.info("[System Integration Orchestrator] Scheduling notification dismissal in", {
        duration: notification.duration,
      })

      setTimeout(() => {
        const duration = performance.now() - startTime
        logger.debug(
          `[System Integration Orchestrator] Dismissing notification after ${duration.toFixed(2)}ms (scheduled: ${notification.duration}ms)`,
        )
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
    logger.info(`[System Integration Orchestrator] Feature '${feature}' ${enabled ? "enabled" : "disabled"}`)
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

    // Отписываемся от backend событий
    if (this.backendUnsubscribe) {
      this.backendUnsubscribe()
      this.backendUnsubscribe = null
    }

    // Останавливаем акторы
    this.modalActor.stop()
    this.updateActor.stop()

    // Очищаем уведомления
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
