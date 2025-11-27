/**
 * Backend Port Interface
 *
 * Определяет контракт для взаимодействия с бэкендом.
 * Реализации: TauriBackend, MockBackend, HttpBackend
 */

import type {
  CommandResult,
  EventEnvelope,
  ProjectCommand,
  ProjectEvent,
  ProjectState,
} from "@/types/generated/tauri-bindings"

export type Unsubscribe = () => void

export interface IBackendService {
  /**
   * Lifecycle
   */
  connect(): Promise<void>
  disconnect(): Promise<void>
  readonly connected: boolean

  /**
   * Выполнение команды на бэкенде
   */
  executeCommand(command: ProjectCommand): Promise<CommandResult>

  /**
   * Получение полного состояния проекта
   */
  getProjectState(): Promise<ProjectState | null>

  /**
   * Получение истории событий с определённой версии
   */
  getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]>

  /**
   * Подписка на события от бэкенда
   */
  onEvent(handler: (event: ProjectEvent) => void): Unsubscribe

  /**
   * Подписка на изменения состояния
   */
  onStateChange(handler: (state: ProjectState) => void): Unsubscribe
}
