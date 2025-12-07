/**
 * Project Management Orchestrator Service
 *
 * Координирует управление проектами, настройками и состоянием приложения
 */

import { type ActorRefFrom, createActor } from "xstate"
import { isServiceEnabled } from "@/config/service-config"
import { getBackend } from "@/core"
import { createLogger } from "@/lib/tauri-logger"
import type { ProjectCommand, ProjectSettings, ProjectState } from "@/types/generated/tauri-bindings"
import { appMachine } from "../machines/app-machine"
import { type UserSettingsContextType, userSettingsMachine } from "../machines/user-settings-machine"
import { getPerformanceMetricsTracker } from "./performance-metrics"
import { storeService } from "./store-service"

const logger = createLogger("ProjectManagementOrchestrator")

export class ProjectManagementOrchestrator {
  private appActor: ActorRefFrom<typeof appMachine>
  private userSettingsActor: ActorRefFrom<typeof userSettingsMachine>
  private autoSaveTimer: NodeJS.Timeout | null = null
  private isLoadingSettings = false
  private metricsTracker = getPerformanceMetricsTracker()

  constructor() {
    logger.info("[Project Management Orchestrator] Initializing...")

    // Создаем акторы для машин
    this.appActor = createActor(appMachine)
    this.userSettingsActor = createActor(userSettingsMachine)

    // Запускаем акторы
    this.appActor.start()
    this.userSettingsActor.start()

    // Настраиваем синхронизацию
    this.setupSynchronization()

    // Загружаем настройки из хранилища
    this.loadUserSettings()

    // Подключаемся к backend
    this.connect()

    logger.info("[Project Management Orchestrator] Initialized successfully")
  }

  /**
   * Настройка синхронизации между машинами
   */
  private setupSynchronization() {
    // Подписываемся на изменения настроек для автосохранения и персистентности
    this.userSettingsActor.subscribe((state) => {
      const settings = state.context

      // Автосохранение проектов
      if (settings.autoSaveEnabled) {
        this.enableAutoSave(settings.autoSaveInterval)
      } else {
        this.disableAutoSave()
      }

      // Сохраняем настройки в Tauri Store (только если не загружаем)
      if (!this.isLoadingSettings) {
        this.saveUserSettingsToStore(settings).catch((error) => {
          logger.error("[Project Management Orchestrator] Failed to persist settings:", { error })
        })
      }
    })

    // Подписываемся на изменения состояния приложения
    this.appActor.subscribe((state) => {
      const context = state.context
      if (context.error) {
        logger.error("[Project Management Orchestrator] App error:", { error: context.error })
      }
    })
  }

  /**
   * Подключение к backend
   */
  private connect() {
    this.appActor.send({ type: "CONNECT" })
  }

  /**
   * Выполнение команды с улучшенной обработкой ошибок
   */
  async executeCommand(command: ProjectCommand): Promise<any> {
    const startTime = performance.now()
    logger.info("[ProjectManagementOrchestrator] Executing command:", { data: command.type })

    try {
      return await new Promise((resolve, reject) => {
        // Таймаут для команды (30 секунд)
        const timeout = setTimeout(() => {
          subscription.unsubscribe()
          const duration = performance.now() - startTime
          const timeoutError = new Error(
            `Command ${command.type} timed out after ${duration}ms. This might indicate a backend issue.`,
          )
          logger.error("[ProjectManagementOrchestrator] Command timeout:", {
            command: command.type,
            duration,
          })
          reject(timeoutError)
        }, 30000)

        const subscription = this.appActor.subscribe((state) => {
          const duration = performance.now() - startTime

          if (state.matches({ connected: "idle" })) {
            clearTimeout(timeout)
            subscription.unsubscribe()

            // Записываем метрику успешной команды
            this.metricsTracker.recordCommand({
              commandType: command.type,
              executionTime: duration,
              timestamp: Date.now(),
              success: true,
            })

            // Предупреждение о медленной команде
            if (duration > 100) {
              logger.warn("Warning", {
                data: `[ProjectManagementOrchestrator] Command ${command.type} took ${duration}ms`,
              })
            }

            resolve(true)
          } else if (state.matches("error")) {
            clearTimeout(timeout)
            subscription.unsubscribe()

            const errorMessage = state.context.error || "Command failed"

            // Записываем метрику неудачной команды
            this.metricsTracker.recordCommand({
              commandType: command.type,
              executionTime: duration,
              timestamp: Date.now(),
              success: false,
              error: errorMessage,
            })

            logger.error("Error occurred", {
              error: `[ProjectManagementOrchestrator] Command ${command.type} failed after ${duration}ms: ${errorMessage}`,
            })

            // Создаем понятное пользователю сообщение об ошибке
            const userFriendlyError = this.getUserFriendlyErrorMessage(command.type, errorMessage)
            reject(new Error(userFriendlyError))
          }
        })

        try {
          this.appActor.send({
            type: "EXECUTE_COMMAND",
            command,
          })
        } catch (error) {
          clearTimeout(timeout)
          subscription.unsubscribe()
          const errorMessage = error instanceof Error ? error.message : "Unknown error"
          logger.error("[ProjectManagementOrchestrator] Failed to send command:", {
            command: command.type,
            error: errorMessage,
          })
          reject(new Error(`Failed to execute ${command.type}: ${errorMessage}`))
        }
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      logger.error("[ProjectManagementOrchestrator] Command execution error:", {
        command: command.type,
        duration,
        error: errorMessage,
      })

      throw error
    }
  }

  /**
   * Получить понятное пользователю сообщение об ошибке
   */
  private getUserFriendlyErrorMessage(commandType: string, backendError: string): string {
    // Маппинг backend ошибок на понятные пользователю сообщения
    const errorMappings: Record<string, string> = {
      CreateProject: "Failed to create project. Please check your project settings and try again.",
      OpenProject: "Failed to open project. The file might be corrupted or in an incompatible format.",
      SaveProject: "Failed to save project. Please check if you have write permissions and enough disk space.",
      CloseProject: "Failed to close project. Some resources might still be in use.",
      AddMedia: "Failed to add media file. The file might be corrupted or in an unsupported format.",
      RemoveMedia: "Failed to remove media file from project.",
      UpdateMedia: "Failed to update media file properties.",
    }

    const friendlyMessage = errorMappings[commandType]
    if (friendlyMessage) {
      return `${friendlyMessage}\n\nTechnical details: ${backendError}`
    }

    // Fallback для неизвестных команд
    return `Command ${commandType} failed: ${backendError}`
  }

  /**
   * Создание нового проекта
   */
  async createProject(settings: ProjectSettings) {
    logger.info("[Project Management Orchestrator] Creating new project")

    const command: ProjectCommand = {
      type: "CreateProject",
      params: { name: `${settings.resolution.width}x${settings.resolution.height} Project`, settings },
    }

    await this.executeCommand(command)
  }

  /**
   * Открытие проекта
   */
  async openProject(path: string) {
    logger.info("[Project Management Orchestrator] Opening project:", { path })

    const command: ProjectCommand = {
      type: "OpenProject",
      params: { path },
    }

    await this.executeCommand(command)
  }

  /**
   * Сохранение проекта
   */
  async saveProject() {
    logger.info("[Project Management Orchestrator] Saving project")

    const command: ProjectCommand = {
      type: "SaveProject",
      params: { path: null },
    }

    await this.executeCommand(command)
  }

  /**
   * Сохранение проекта как
   */
  async saveProjectAs(path: string) {
    logger.info("[Project Management Orchestrator] Saving project as:", { path })

    const command: ProjectCommand = {
      type: "SaveProject",
      params: { path },
    }

    await this.executeCommand(command)
  }

  /**
   * Закрытие проекта
   */
  async closeProject() {
    logger.info("[Project Management Orchestrator] Closing project")

    const command: ProjectCommand = {
      type: "CloseProject",
    }

    await this.executeCommand(command)
  }

  /**
   * Обновление пользовательских настроек
   */
  updateUserSettings(settings: Partial<UserSettingsContextType>) {
    logger.info("[Project Management Orchestrator] Updating user settings")

    // Отправляем события для каждой настройки
    Object.entries(settings).forEach(([key, value]) => {
      const eventType = this.getSettingsEventType(key)
      if (eventType) {
        // TOGGLE события не принимают параметров - они просто инвертируют значение
        if (eventType.startsWith("TOGGLE_")) {
          this.userSettingsActor.send({
            type: eventType,
          } as any)
        } else if (key === "autoSaveEnabled") {
          // Специальная обработка для autoSaveEnabled - machine ожидает поле "enabled"
          this.userSettingsActor.send({
            type: eventType,
            enabled: value,
          } as any)
        } else if (key === "autoSaveInterval") {
          // Специальная обработка для autoSaveInterval - machine ожидает поле "interval"
          this.userSettingsActor.send({
            type: eventType,
            interval: value,
          } as any)
        } else if (key === "openAiApiKey") {
          // Специальная обработка для API ключей - machine ожидает поле "apiKey"
          this.userSettingsActor.send({
            type: eventType,
            apiKey: value,
          } as any)
        } else if (key === "claudeApiKey") {
          // Специальная обработка для API ключей - machine ожидает поле "apiKey"
          this.userSettingsActor.send({
            type: eventType,
            apiKey: value,
          } as any)
        } else if (key === "gpuAccelerationEnabled") {
          // Специальная обработка для GPU - machine ожидает поле "enabled"
          this.userSettingsActor.send({
            type: eventType,
            enabled: value,
          } as any)
        } else if (key === "playerVolume") {
          // Специальная обработка для volume - machine ожидает поле "volume"
          this.userSettingsActor.send({
            type: eventType,
            volume: value,
          } as any)
        } else if (key === "activeTab") {
          // Специальная обработка для activeTab - machine ожидает поле "tab"
          this.userSettingsActor.send({
            type: eventType,
            tab: value,
          } as any)
        } else {
          // Обычные события передают значение с оригинальным ключом
          this.userSettingsActor.send({
            type: eventType,
            [key]: value,
          } as any)
        }
      }
    })
  }

  /**
   * Получение типа события для настройки
   */
  private getSettingsEventType(key: string): string | null {
    const eventMap: Record<string, string> = {
      layoutMode: "UPDATE_LAYOUT_MODE",
      activeTab: "UPDATE_ACTIVE_TAB",
      openAiApiKey: "UPDATE_OPENAI_API_KEY",
      claudeApiKey: "UPDATE_CLAUDE_API_KEY",
      gpuAccelerationEnabled: "UPDATE_GPU_ACCELERATION",
      autoSaveEnabled: "UPDATE_AUTO_SAVE_ENABLED",
      autoSaveInterval: "UPDATE_AUTO_SAVE_INTERVAL",
      // События переключения видимости панелей
      isBrowserVisible: "TOGGLE_BROWSER_VISIBILITY",
      isTimelineVisible: "TOGGLE_TIMELINE_VISIBILITY",
      isOptionsVisible: "TOGGLE_OPTIONS_VISIBILITY",
      isAIAssistantVisible: "TOGGLE_AI_ASSISTANT_VISIBILITY",
      // Добавьте остальные маппинги по мере необходимости
    }

    return eventMap[key] || null
  }

  /**
   * Включение автосохранения
   */
  private enableAutoSave(interval: number) {
    // Проверяем, разрешено ли автосохранение
    if (!isServiceEnabled("AUTO_SAVE")) {
      logger.info("[Project Management Orchestrator] Auto-save is disabled by service config")
      return
    }

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    logger.info("[Project Management Orchestrator] Enabling auto-save with interval:", { interval })

    let saveCounter = 0
    this.autoSaveTimer = setInterval(async () => {
      const startTime = performance.now()
      saveCounter++

      try {
        const projectState = this.getProjectState()
        if (projectState) {
          logger.info("[Project Management Orchestrator] Auto-save #", { saveCounter })
          await this.saveProject()
          const duration = performance.now() - startTime

          if (duration > 500) {
            // Если сохранение занимает более 500ms
            logger.warn("Warning", {
              data: `[Project Management Orchestrator] Auto-save #${saveCounter} took ${duration}ms - potential performance issue`,
            })
          } else {
            logger.info(`[Project Management Orchestrator] Auto-save #${saveCounter} completed in`, { duration })
          }
        }
      } catch (error) {
        logger.error("[Project Management Orchestrator] Auto-save #", { saveCounter, error })
      }
    }, interval * 1000)
  }

  /**
   * Отключение автосохранения
   */
  private disableAutoSave() {
    if (this.autoSaveTimer) {
      logger.info("[Project Management Orchestrator] Disabling auto-save")
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * Получение состояния проекта из actor snapshot
   */
  getProjectState(): ProjectState | null {
    return this.appActor.getSnapshot().context.projectState
  }

  /**
   * Загрузка состояния проекта напрямую из backend
   * Используется при инициализации для bypass race conditions
   */
  async loadProjectStateFromBackend(): Promise<ProjectState | null> {
    try {
      const backend = getBackend()
      const state = await backend.getProjectState()
      return state
    } catch (error) {
      logger.error("[ProjectManagementOrchestrator] Failed to load project state from backend", { error })
      return null
    }
  }

  /**
   * Получение пользовательских настроек
   */
  getUserSettings(): UserSettingsContextType {
    return this.userSettingsActor.getSnapshot().context
  }

  /**
   * Получение состояния подключения
   */
  isConnected(): boolean {
    return this.appActor.getSnapshot().context.isConnected
  }

  /**
   * Получение ошибки подключения
   */
  getConnectionError(): string | null {
    return this.appActor.getSnapshot().context.error
  }

  /**
   * Подписка на изменения состояния проекта
   */
  subscribeToProjectState(callback: (state: ProjectState | null) => void) {
    return this.appActor.subscribe((state) => {
      callback(state.context.projectState)
    })
  }

  /**
   * Подписка на изменения пользовательских настроек
   */
  subscribeToUserSettings(callback: (settings: UserSettingsContextType) => void) {
    return this.userSettingsActor.subscribe((state) => {
      callback(state.context)
    })
  }

  /**
   * Получение app actor
   */
  getAppActor(): ActorRefFrom<typeof appMachine> {
    return this.appActor
  }

  /**
   * Получение user settings actor
   */
  getUserSettingsActor(): ActorRefFrom<typeof userSettingsMachine> {
    return this.userSettingsActor
  }

  /**
   * Загрузка пользовательских настроек из хранилища
   */
  private async loadUserSettings() {
    try {
      this.isLoadingSettings = true
      logger.info("[Project Management Orchestrator] Loading user settings from store...")

      // Инициализируем store если нужно
      await storeService.initialize()

      // Загружаем настройки
      const savedSettings = await storeService.getUserSettings()

      // Получаем пути из AppDirectories для инициализации
      let defaultPaths: { screenshotsPath?: string; playerScreenshotsPath?: string } = {}

      try {
        // Проверяем, доступен ли Tauri API
        if (isServiceEnabled("platform")) {
          const { appDirectoriesService } = await import("./app-directories-service")
          const directories = await appDirectoriesService.getAppDirectories()

          // Используем пути из пользовательской директории
          defaultPaths = {
            screenshotsPath: directories.snapshot_dir,
            playerScreenshotsPath: directories.media_dir,
          }

          logger.info("[Project Management Orchestrator] Initialized paths from AppDirectories:", {
            data: defaultPaths,
          })
        }
      } catch (error) {
        // В случае ошибки (например, в тестовом окружении) используем пустые строки
        logger.warn("[Project Management Orchestrator] Could not load AppDirectories, paths will be empty:", {
          error,
        })
      }

      if (savedSettings) {
        logger.info("[Project Management Orchestrator] Loaded user settings from store")

        // Обновляем актора с загруженными настройками
        // Если пути не были сохранены ранее, используем значения из AppDirectories
        this.userSettingsActor.send({
          type: "UPDATE_ALL",
          settings: {
            ...savedSettings,
            // Используем сохраненные пути, если они есть, иначе пути из AppDirectories
            screenshotsPath: savedSettings.screenshotsPath || defaultPaths.screenshotsPath || "",
            playerScreenshotsPath: savedSettings.playerScreenshotsPath || defaultPaths.playerScreenshotsPath || "",
          },
        })
      } else {
        logger.info("[Project Management Orchestrator] No saved settings found, initializing with AppDirectories paths")

        // Если нет сохраненных настроек, инициализируем пути из AppDirectories
        if (defaultPaths.screenshotsPath || defaultPaths.playerScreenshotsPath) {
          this.userSettingsActor.send({
            type: "UPDATE_ALL",
            settings: defaultPaths,
          })
        }
      }
    } catch (error) {
      logger.error("[Project Management Orchestrator] Failed to load user settings:", { error })
    } finally {
      this.isLoadingSettings = false
    }
  }

  /**
   * Сохранение пользовательских настроек в хранилище
   */
  private async saveUserSettingsToStore(settings: UserSettingsContextType) {
    try {
      await storeService.saveUserSettings(settings)
      // Не логируем для уменьшения шума
      // logger.info("[Project Management Orchestrator] Saved user settings to store")
    } catch (error) {
      logger.error("[Project Management Orchestrator] Failed to save user settings:", { error })
      throw error
    }
  }

  /**
   * Получить метрики производительности
   */
  getPerformanceReport() {
    return this.metricsTracker.getReport()
  }

  /**
   * Логировать метрики производительности
   */
  logPerformanceReport() {
    this.metricsTracker.logReport()
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    logger.info("[Project Management Orchestrator] Disposing...")

    this.disableAutoSave()
    this.appActor.stop()
    this.userSettingsActor.stop()

    // Логируем финальный отчет о производительности
    this.metricsTracker.logReport()
  }
}

// Singleton экземпляр
let orchestratorInstance: ProjectManagementOrchestrator | null = null

/**
 * Получить экземпляр Project Management Orchestrator
 */
export function getProjectManagementOrchestrator(): ProjectManagementOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ProjectManagementOrchestrator()
  }
  return orchestratorInstance
}

/**
 * Сбросить экземпляр orchestrator (для тестов)
 */
export function resetProjectManagementOrchestrator() {
  if (orchestratorInstance) {
    orchestratorInstance.dispose()
    orchestratorInstance = null
  }
}
