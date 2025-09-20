/**
 * Project Management Orchestrator Service
 *
 * Координирует управление проектами, настройками и состоянием приложения
 */

import { type ActorRefFrom, createActor } from "xstate"
import { isServiceEnabled } from "@/shared/config/service-config"
import type { ProjectCommand, ProjectSettings, ProjectState } from "@/types/generated/tauri-bindings"
import { appMachine } from "../machines/app-machine"
import { type UserSettingsContextType, userSettingsMachine } from "../machines/user-settings-machine"

export class ProjectManagementOrchestrator {
  private appActor: ActorRefFrom<typeof appMachine>
  private userSettingsActor: ActorRefFrom<typeof userSettingsMachine>
  private autoSaveTimer: NodeJS.Timeout | null = null

  constructor() {
    console.log("[Project Management Orchestrator] Initializing...")

    // Создаем акторы для машин
    this.appActor = createActor(appMachine)
    this.userSettingsActor = createActor(userSettingsMachine)

    // Запускаем акторы
    this.appActor.start()
    this.userSettingsActor.start()

    // Настраиваем синхронизацию
    this.setupSynchronization()

    // Подключаемся к backend
    this.connect()

    console.log("[Project Management Orchestrator] Initialized successfully")
  }

  /**
   * Настройка синхронизации между машинами
   */
  private setupSynchronization() {
    // Подписываемся на изменения настроек для автосохранения
    this.userSettingsActor.subscribe((state) => {
      const settings = state.context
      if (settings.autoSaveEnabled) {
        this.enableAutoSave(settings.autoSaveInterval)
      } else {
        this.disableAutoSave()
      }
    })

    // Подписываемся на изменения состояния приложения
    this.appActor.subscribe((state) => {
      const context = state.context
      if (context.error) {
        console.error("[Project Management Orchestrator] App error:", context.error)
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
   * Выполнение команды
   */
  async executeCommand(command: ProjectCommand): Promise<any> {
    const startTime = performance.now()
    console.log(`[ProjectManagementOrchestrator] Executing command: ${command.type}`)

    return new Promise((resolve, reject) => {
      const subscription = this.appActor.subscribe((state) => {
        const duration = performance.now() - startTime

        if (state.matches({ connected: "idle" })) {
          subscription.unsubscribe()
          if (duration > 100) {
            console.warn(`[ProjectManagementOrchestrator] Command ${command.type} took ${duration}ms`)
          }
          resolve(true)
        } else if (state.matches("error")) {
          subscription.unsubscribe()
          console.error(`[ProjectManagementOrchestrator] Command ${command.type} failed after ${duration}ms`)
          reject(new Error(state.context.error || "Command failed"))
        }
      })

      this.appActor.send({
        type: "EXECUTE_COMMAND",
        command,
      })
    })
  }

  /**
   * Создание нового проекта
   */
  async createProject(settings: ProjectSettings) {
    console.log("[Project Management Orchestrator] Creating new project")

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
    console.log(`[Project Management Orchestrator] Opening project: ${path}`)

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
    console.log("[Project Management Orchestrator] Saving project")

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
    console.log(`[Project Management Orchestrator] Saving project as: ${path}`)

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
    console.log("[Project Management Orchestrator] Closing project")

    const command: ProjectCommand = {
      type: "CloseProject",
    }

    await this.executeCommand(command)
  }

  /**
   * Обновление пользовательских настроек
   */
  updateUserSettings(settings: Partial<UserSettingsContextType>) {
    console.log("[Project Management Orchestrator] Updating user settings")

    // Отправляем события для каждой настройки
    Object.entries(settings).forEach(([key, value]) => {
      const eventType = this.getSettingsEventType(key)
      if (eventType) {
        this.userSettingsActor.send({
          type: eventType,
          [key]: value,
        } as any)
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
      autoSaveEnabled: "UPDATE_AUTO_SAVE",
      autoSaveInterval: "UPDATE_AUTO_SAVE_INTERVAL",
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
      console.log("[Project Management Orchestrator] Auto-save is disabled by service config")
      return
    }

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }

    console.log(`[Project Management Orchestrator] Enabling auto-save with interval: ${interval}s`)

    let saveCounter = 0
    this.autoSaveTimer = setInterval(async () => {
      const startTime = performance.now()
      saveCounter++

      try {
        const projectState = this.getProjectState()
        if (projectState) {
          console.log(`[Project Management Orchestrator] Auto-save #${saveCounter} started`)
          await this.saveProject()
          const duration = performance.now() - startTime

          if (duration > 500) {
            // Если сохранение занимает более 500ms
            console.warn(
              `[Project Management Orchestrator] Auto-save #${saveCounter} took ${duration}ms - potential performance issue`,
            )
          } else {
            console.log(`[Project Management Orchestrator] Auto-save #${saveCounter} completed in ${duration}ms`)
          }
        }
      } catch (error) {
        console.error(`[Project Management Orchestrator] Auto-save #${saveCounter} failed:`, error)
      }
    }, interval * 1000)
  }

  /**
   * Отключение автосохранения
   */
  private disableAutoSave() {
    if (this.autoSaveTimer) {
      console.log("[Project Management Orchestrator] Disabling auto-save")
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * Получение состояния проекта
   */
  getProjectState(): ProjectState | null {
    return this.appActor.getSnapshot().context.projectState
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
   * Очистка ресурсов
   */
  dispose() {
    console.log("[Project Management Orchestrator] Disposing...")

    this.disableAutoSave()
    this.appActor.stop()
    this.userSettingsActor.stop()
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
