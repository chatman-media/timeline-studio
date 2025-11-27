/**
 * UpdateService - сервис для управления обновлениями приложения
 * Обеспечивает взаимодействие с Tauri backend для проверки и установки обновлений
 */

import { invoke } from "@tauri-apps/api/core"
import { emit, listen } from "@tauri-apps/api/event"

import { createLogger } from "@/lib/tauri-logger"
import {
  checkForUpdate as checkForUpdateTauri,
  downloadAndInstallUpdate as downloadAndInstallUpdateTauri,
} from "../../tauri/update-commands"

import type { UpdateCheckResult, UpdateEventPayload, UpdateProgress, UpdateStatus } from "../../types"

/**
 * Сервис для управления обновлениями приложения
 */
export class UpdateService {
  private static instance: UpdateService | null = null
  private static logger = createLogger("UpdateService")
  private currentStatus: UpdateStatus = "idle"
  private listeners: Array<(payload: UpdateEventPayload) => void> = []
  private checkInterval: NodeJS.Timeout | null = null
  private autoCheckEnabled = false
  private autoCheckIntervalMinutes = 60 // Проверка каждый час по умолчанию

  private constructor() {
    UpdateService.logger.infoSync("Initializing UpdateService")
    // Инициализируем слушатели только на клиенте
    if (typeof window !== "undefined") {
      void this.setupEventListeners()
    }
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService()
    }
    return UpdateService.instance
  }

  /**
   * Настроить слушатели событий обновления
   */
  private async setupEventListeners(): Promise<void> {
    try {
      // Слушаем события прогресса загрузки (если они будут добавлены в backend)
      await listen("update-progress", (event: any) => {
        const progress = event.payload as UpdateProgress
        this.updateStatus("downloading", { progress })
      })

      // Слушаем события завершения загрузки
      await listen("update-downloaded", () => {
        this.updateStatus("downloaded")
      })

      // Слушаем события ошибок
      await listen("update-error", (event: any) => {
        this.updateStatus("error", { error: event.payload })
      })
    } catch (error) {
      UpdateService.logger.warnSync("Failed to setup update event listeners", { error: String(error) })
    }
  }

  /**
   * Проверить доступность обновлений
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      this.updateStatus("checking")

      const result = await checkForUpdateTauri()

      if (result.available && result.update_info) {
        this.updateStatus("available", { update_info: result.update_info })
      } else {
        this.updateStatus("idle")
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.updateStatus("error", { error: errorMessage })
      throw error
    }
  }

  /**
   * Загрузить и установить обновление
   */
  async downloadAndInstall(): Promise<void> {
    try {
      this.updateStatus("downloading")

      await downloadAndInstallUpdateTauri()

      this.updateStatus("installed")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.updateStatus("error", { error: errorMessage })
      throw error
    }
  }

  /**
   * Получить текущую версию приложения
   */
  async getCurrentVersion(): Promise<string> {
    try {
      return await invoke<string>("get_current_version")
    } catch (error) {
      void UpdateService.logger.error("Failed to get current version", { error: String(error) })
      return "unknown"
    }
  }

  /**
   * Проверить доступность системы обновлений
   */
  async isUpdaterAvailable(): Promise<boolean> {
    try {
      return await invoke<boolean>("is_updater_available")
    } catch (error) {
      void UpdateService.logger.error("Failed to check updater availability", { error: String(error) })
      return false
    }
  }

  /**
   * Включить автоматическую проверку обновлений
   */
  enableAutoCheck(intervalMinutes = 60): void {
    this.autoCheckEnabled = true
    this.autoCheckIntervalMinutes = intervalMinutes

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    UpdateService.logger.infoSync("Starting auto-check", { intervalMinutes })
    let checkCount = 0

    this.checkInterval = setInterval(
      () => {
        checkCount++
        const startTime = performance.now()
        UpdateService.logger.debugSync("Running auto-check", { checkNumber: checkCount })

        this.checkForUpdatesQuietly().finally(() => {
          const duration = performance.now() - startTime
          UpdateService.logger.debugSync("Auto-check completed", {
            checkNumber: checkCount,
            durationMs: duration.toFixed(2),
          })

          if (duration > 5000) {
            UpdateService.logger.warnSync("Auto-check took too long", {
              checkNumber: checkCount,
              durationMs: duration.toFixed(2),
              message: "This might block the UI",
            })
          }
        })
      },
      intervalMinutes * 60 * 1000,
    )

    // Первая проверка через 30 секунд после включения
    setTimeout(() => {
      UpdateService.logger.debugSync("Running initial auto-check")
      this.checkForUpdatesQuietly()
    }, 30000)
  }

  /**
   * Отключить автоматическую проверку обновлений
   */
  disableAutoCheck(): void {
    this.autoCheckEnabled = false

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Тихая проверка обновлений (без изменения статуса UI)
   */
  private async checkForUpdatesQuietly(): Promise<void> {
    try {
      const result = await invoke<UpdateCheckResult>("check_for_update")

      if (result.available && result.update_info) {
        // Отправляем событие о доступном обновлении
        await emit("update-available", result.update_info)
        this.updateStatus("available", { update_info: result.update_info })
      }
    } catch (error) {
      void UpdateService.logger.error("Silent update check failed", { error: String(error) })
    }
  }

  /**
   * Получить текущий статус обновления
   */
  getCurrentStatus(): UpdateStatus {
    return this.currentStatus
  }

  /**
   * Подписаться на события обновления
   */
  subscribe(listener: (payload: UpdateEventPayload) => void): () => void {
    this.listeners.push(listener)

    // Возвращаем функцию отписки
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Обновить статус и уведомить слушателей
   */
  private updateStatus(status: UpdateStatus, extra?: Partial<UpdateEventPayload>): void {
    this.currentStatus = status

    const payload: UpdateEventPayload = {
      status,
      ...extra,
    }

    // Уведомляем всех слушателей
    this.listeners.forEach((listener) => {
      try {
        listener(payload)
      } catch (error) {
        void UpdateService.logger.error("Update listener error", { error: String(error) })
      }
    })
  }

  /**
   * Сбросить статус в idle
   */
  reset(): void {
    this.updateStatus("idle")
  }

  /**
   * Получить настройки автопроверки
   */
  getAutoCheckSettings(): { enabled: boolean; intervalMinutes: number } {
    return {
      enabled: this.autoCheckEnabled,
      intervalMinutes: this.autoCheckIntervalMinutes,
    }
  }

  /**
   * Очистка ресурсов при завершении работы
   */
  dispose(): void {
    this.disableAutoCheck()
    this.listeners.length = 0
  }
}

// Экспортируем экземпляр для использования в приложении
// Создаем только на клиенте для избежания ошибок SSR
export const updateService =
  typeof window !== "undefined" ? UpdateService.getInstance() : (null as unknown as UpdateService)
