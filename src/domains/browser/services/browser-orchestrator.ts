/**
 * Browser Orchestrator Service
 *
 * Координирует управление состоянием браузера медиафайлов
 * Использует IBackendService из DI контейнера для синхронизации
 */

import { type ActorRefFrom, createActor } from "xstate"
import { container } from "@/core"
import type { IBackendService } from "@/core/ports"
import { createLogger } from "@/lib/tauri-logger"
import type {
  BrowserEvent,
  BrowserState,
  BrowserTab,
  ProjectEvent,
  TabSettings,
  ViewMode,
} from "@/types/generated/tauri-bindings"
import { type BrowserMachineContext, browserMachine } from "../machines/browser-machine"

const logger = createLogger("BrowserOrchestrator")

export class BrowserOrchestrator {
  private browserActor: ActorRefFrom<typeof browserMachine>
  private backend: IBackendService | null = null
  private unsubscribeEvents: (() => void) | null = null
  private unsubscribeState: (() => void) | null = null

  constructor() {
    logger.info("[Browser Orchestrator] Initializing...")

    // Создаем актор для машины
    this.browserActor = createActor(browserMachine)

    // Запускаем актор
    this.browserActor.start()

    // Получаем backend из контейнера (может быть null если контейнер не инициализирован)
    try {
      if (container.hasBackend()) {
        this.backend = container.getBackend()
      }
    } catch {
      logger.warn("[BrowserOrchestrator] Backend not available yet")
    }

    // Настраиваем синхронизацию с backend
    this.setupBackendSync()

    logger.info("[Browser Orchestrator] Initialized successfully")
  }

  /**
   * Настройка синхронизации с backend
   */
  private setupBackendSync() {
    if (!this.backend) {
      logger.warn("[BrowserOrchestrator] Backend not available, skipping sync setup")
      return
    }

    // Подписываемся на backend события
    this.unsubscribeEvents = this.backend.onEvent((event: ProjectEvent) => {
      // Проверяем, является ли это Browser событием
      if (event.type === "Browser") {
        const browserEvent = event.payload as BrowserEvent

        logger.info("[BrowserOrchestrator] Received backend event", {
          eventType: browserEvent.event_type,
        })

        // Отправляем событие в машину для инкрементальных обновлений
        this.browserActor.send({
          type: "BACKEND_EVENT",
          event: browserEvent,
        })
      }
    })

    // Подписываемся на state changes для инициализации
    this.unsubscribeState = this.backend.onStateChange((state) => {
      if (state?.browser_state) {
        this.initializeFromBackendState(state.browser_state)
      }
    })

    // Загружаем начальное состояние
    this.loadInitialState()
  }

  /**
   * Загрузка начального состояния из backend
   */
  private async loadInitialState() {
    if (!this.backend) {
      return
    }

    this.browserActor.send({ type: "SET_LOADING", isLoading: true })

    try {
      const state = await this.backend.getProjectState()
      if (state?.browser_state) {
        this.initializeFromBackendState(state.browser_state)
      }
    } catch (err) {
      logger.error("[BrowserOrchestrator] Failed to load initial state:", { error: err })
      this.browserActor.send({
        type: "SET_ERROR",
        error: err instanceof Error ? err.message : "Failed to load state",
      })
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Инициализация из состояния backend
   */
  private initializeFromBackendState(browserState: BrowserState) {
    logger.info("[BrowserOrchestrator] Initializing from backend state", {
      activeTab: browserState.active_tab,
    })

    // Синхронизируем activeTab
    if (browserState.active_tab) {
      this.browserActor.send({
        type: "SWITCH_TAB",
        tab: browserState.active_tab,
      })
    }

    // Синхронизируем tabSettings
    if (browserState.tab_settings) {
      Object.entries(browserState.tab_settings).forEach(([tab, settings]) => {
        const browserTab = tab as BrowserTab
        this.syncTabSettings(browserTab, settings)
      })
    }

    // Синхронизируем selectedFiles
    if (browserState.selected_files) {
      Object.entries(browserState.selected_files).forEach(([tab, fileIds]) => {
        const browserTab = tab as BrowserTab
        this.browserActor.send({
          type: "BACKEND_EVENT",
          event: {
            event_type: "AllFilesSelected",
            data: { tab: browserTab, file_ids: fileIds },
          },
        })
      })
    }
  }

  /**
   * Синхронизация настроек таба
   */
  private syncTabSettings(tab: BrowserTab, settings: TabSettings) {
    if (settings.search_query !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SearchQueryChanged",
          data: { tab, query: settings.search_query },
        },
      })
    }

    if (settings.show_favorites_only !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FavoritesToggled",
          data: { tab, show_favorites: settings.show_favorites_only },
        },
      })
    }

    if (settings.sort_by !== undefined && settings.sort_order !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SortChanged",
          data: { tab, sort_by: settings.sort_by, sort_order: settings.sort_order },
        },
      })
    }

    if (settings.group_by !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "GroupByChanged",
          data: { tab, group_by: settings.group_by },
        },
      })
    }

    if (settings.filter_type !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FilterChanged",
          data: { tab, filter_type: settings.filter_type },
        },
      })
    }

    if (settings.view_mode !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "ViewModeChanged",
          data: { tab, view_mode: settings.view_mode },
        },
      })
    }

    if (settings.preview_size_index !== undefined) {
      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "PreviewSizeChanged",
          data: { tab, size_index: settings.preview_size_index },
        },
      })
    }
  }

  // ============================================================================
  // Browser Actions
  // ============================================================================

  /**
   * Переключение таба
   */
  async switchTab(tab: BrowserTab): Promise<void> {
    logger.info("[BrowserOrchestrator] Switching tab", { tab })

    // Оптимистичное обновление
    this.browserActor.send({ type: "SWITCH_TAB", tab })

    try {
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSwitchTab(tab)

      if (result.status === "error") {
        throw new Error(result.error)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to switch tab"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    }
  }

  /**
   * Установка поискового запроса
   */
  async setSearchQuery(query: string, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Setting search query", { query, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSetSearchQuery(query, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SearchQueryChanged",
          data: { tab: targetTab, query },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set search query"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Переключение фильтра избранных
   */
  async toggleFavorites(tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Toggling favorites", { tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserToggleFavorites(tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      const currentSettings = this.getTabSettings(targetTab)
      const newShowFavorites = !currentSettings.show_favorites_only

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FavoritesToggled",
          data: { tab: targetTab, show_favorites: newShowFavorites },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to toggle favorites"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Установка сортировки
   */
  async setSort(sortBy: string, sortOrder: "asc" | "desc", tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Setting sort", { sortBy, sortOrder, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSetSort(sortBy, sortOrder, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "SortChanged",
          data: { tab: targetTab, sort_by: sortBy, sort_order: sortOrder },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set sort"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Установка группировки
   */
  async setGroupBy(groupBy: string, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Setting group by", { groupBy, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSetGroupBy(groupBy, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "GroupByChanged",
          data: { tab: targetTab, group_by: groupBy },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set group by"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Установка фильтра
   */
  async setFilter(filterType: string, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Setting filter", { filterType, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSetFilter(filterType, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FilterChanged",
          data: { tab: targetTab, filter_type: filterType },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set filter"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Установка режима отображения
   */
  async setViewMode(viewMode: ViewMode, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Setting view mode", { viewMode, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSetViewMode(viewMode, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "ViewModeChanged",
          data: { tab: targetTab, view_mode: viewMode },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set view mode"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Установка размера превью
   */
  async setPreviewSize(sizeIndex: number, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Setting preview size", { sizeIndex, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSetPreviewSize(sizeIndex, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "PreviewSizeChanged",
          data: { tab: targetTab, size_index: sizeIndex },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to set preview size"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  /**
   * Сброс настроек таба
   */
  async resetTabSettings(tab: BrowserTab): Promise<void> {
    logger.info("[BrowserOrchestrator] Resetting tab settings", { tab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserResetTabSettings(tab)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      // Сбрасываем все настройки к дефолтным
      this.syncTabSettings(tab, {
        search_query: "",
        show_favorites_only: false,
        sort_by: "name",
        sort_order: "asc",
        group_by: "none",
        filter_type: "all",
        view_mode: "thumbnails",
        preview_size_index: 2,
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to reset tab settings"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  // ============================================================================
  // File Selection Actions
  // ============================================================================

  async selectFile(fileId: string, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Selecting file", { fileId, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSelectFile(fileId, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FileSelected",
          data: { tab: targetTab, file_id: fileId },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to select file"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  async deselectFile(fileId: string, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Deselecting file", { fileId, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserDeselectFile(fileId, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "FileDeselected",
          data: { tab: targetTab, file_id: fileId },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to deselect file"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  async toggleFileSelection(fileId: string, tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    const isSelected = this.isFileSelected(fileId, targetTab)

    if (isSelected) {
      await this.deselectFile(fileId, tab)
    } else {
      await this.selectFile(fileId, tab)
    }
  }

  async selectAllFiles(fileIds: string[], tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Selecting all files", { count: fileIds.length, tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserSelectAllFiles(fileIds, tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "AllFilesSelected",
          data: { tab: targetTab, file_ids: fileIds },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to select all files"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  async deselectAllFiles(tab?: BrowserTab): Promise<void> {
    const targetTab = tab || this.getActiveTab()
    logger.info("[BrowserOrchestrator] Deselecting all files", { tab: targetTab })

    try {
      this.browserActor.send({ type: "SET_LOADING", isLoading: true })
      const { commands } = await import("@/types/generated/tauri-bindings")
      const result = await commands.browserDeselectAllFiles(tab || null)

      if (result.status === "error") {
        throw new Error(result.error)
      }

      this.browserActor.send({
        type: "BACKEND_EVENT",
        event: {
          event_type: "AllFilesDeselected",
          data: { tab: targetTab },
        },
      })
      this.browserActor.send({ type: "CLEAR_ERROR" })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to deselect all files"
      this.browserActor.send({ type: "SET_ERROR", error: errorMsg })
      throw err
    } finally {
      this.browserActor.send({ type: "SET_LOADING", isLoading: false })
    }
  }

  // ============================================================================
  // State Getters
  // ============================================================================

  /**
   * Получение browser actor
   */
  getBrowserActor(): ActorRefFrom<typeof browserMachine> {
    return this.browserActor
  }

  /**
   * Получение текущего состояния
   */
  getSnapshot(): BrowserMachineContext {
    return this.browserActor.getSnapshot().context
  }

  /**
   * Получение активного таба
   */
  getActiveTab(): BrowserTab {
    return this.browserActor.getSnapshot().context.activeTab
  }

  /**
   * Получение настроек таба
   */
  getTabSettings(tab?: BrowserTab): TabSettings {
    const context = this.browserActor.getSnapshot().context
    const targetTab = tab || context.activeTab
    const settings = context.tabSettings[targetTab]

    if (!settings) {
      // Возвращаем дефолтные настройки, если их нет
      return {
        search_query: "",
        show_favorites_only: false,
        sort_by: "name",
        sort_order: "asc",
        group_by: "none",
        filter_type: "all",
        view_mode: "thumbnails",
        preview_size_index: 2,
      }
    }

    return settings
  }

  /**
   * Получение выбранных файлов
   */
  getSelectedFiles(tab?: BrowserTab): string[] {
    const context = this.browserActor.getSnapshot().context
    const targetTab = tab || context.activeTab
    return context.selectedFiles[targetTab] || []
  }

  /**
   * Проверка выбран ли файл
   */
  isFileSelected(fileId: string, tab?: BrowserTab): boolean {
    const selectedFiles = this.getSelectedFiles(tab)
    return selectedFiles.includes(fileId)
  }

  /**
   * Получение состояния загрузки
   */
  isLoading(): boolean {
    return this.browserActor.getSnapshot().context.isLoading
  }

  /**
   * Получение ошибки
   */
  getError(): string | null {
    return this.browserActor.getSnapshot().context.error
  }

  /**
   * Подписка на изменения состояния
   */
  subscribe(callback: (state: any) => void) {
    return this.browserActor.subscribe(callback)
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    logger.info("[Browser Orchestrator] Disposing...")

    if (this.unsubscribeEvents) {
      this.unsubscribeEvents()
      this.unsubscribeEvents = null
    }

    if (this.unsubscribeState) {
      this.unsubscribeState()
      this.unsubscribeState = null
    }

    this.browserActor.stop()
  }
}

// Singleton экземпляр
let orchestratorInstance: BrowserOrchestrator | null = null

/**
 * Получить экземпляр Browser Orchestrator
 */
export function getBrowserOrchestrator(): BrowserOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new BrowserOrchestrator()
  }
  return orchestratorInstance
}

/**
 * Сбросить экземпляр orchestrator (для тестов)
 */
export function resetBrowserOrchestrator() {
  if (orchestratorInstance) {
    orchestratorInstance.dispose()
    orchestratorInstance = null
  }
}
