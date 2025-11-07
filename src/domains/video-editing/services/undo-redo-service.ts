/**
 * Undo/Redo Service
 *
 * Сервис для управления историей изменений с поддержкой:
 * - Множественной отмены/повтора
 * - Группировки действий
 * - Селективной отмены по типу или сущности
 * - Оптимизации истории
 */

export type ActionPriority = "low" | "medium" | "high" | "critical"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("UndoRedoService")


export type ActionType =
  | "ADD_CLIP"
  | "REMOVE_CLIP"
  | "MOVE_CLIP"
  | "TRIM_CLIP"
  | "SPLIT_CLIP"
  | "UPDATE_CLIP"
  | "ADD_TRACK"
  | "REMOVE_TRACK"
  | "UPDATE_TRACK"
  | "REORDER_TRACKS"
  | "ADD_KEYFRAME"
  | "REMOVE_KEYFRAME"
  | "UPDATE_KEYFRAME"
  | "BATCH_OPERATION"
  | "ADD_EFFECT"
  | "REMOVE_EFFECT"
  | "UPDATE_EFFECT"
  | "ADD_TRANSITION"
  | "REMOVE_TRANSITION"
  | "UPDATE_TRANSITION"

export interface UndoRedoAction {
  id: string
  type: ActionType
  description: string
  timestamp: number
  undoData: any
  redoData: any
  affectedEntities?: {
    clips?: string[]
    tracks?: string[]
    keyframes?: string[]
    effects?: string[]
  }
  groupId?: string
  priority?: ActionPriority
  mergeable?: boolean // Можно ли объединить с предыдущим действием того же типа
}

interface ActionGroup {
  id: string
  description?: string
  actions: UndoRedoAction[]
  startTime: number
  endTime?: number
}

export interface UndoRedoResult {
  success: boolean
  action?: UndoRedoAction
  error?: string
}

export class UndoRedoService {
  private static instance: UndoRedoService | null = null
  private static initializationCounter = 0
  private history: UndoRedoAction[] = []
  private redoStack: UndoRedoAction[] = []
  private currentGroup: ActionGroup | null = null
  private maxHistorySize = 1000
  private mergeTimeout = 500 // ms для объединения похожих действий

  private isInitialized = false

  private constructor() {
    UndoRedoService.initializationCounter++
    logger.info("[UndoRedoService] Initialized (instance #", { data: UndoRedoService.initializationCounter })
    logger.debug("[UndoRedoService] Stack trace:", { data: new Error().stack })
    this.isInitialized = true
  }

  /**
   * Получить единственный экземпляр сервиса (Singleton)
   */
  public static getInstance(): UndoRedoService {
    if (!UndoRedoService.instance) {
      logger.info("[UndoRedoService] Creating new instance")
      UndoRedoService.instance = new UndoRedoService()
    } else {
      logger.info("[UndoRedoService] Returning existing instance")
    }
    return UndoRedoService.instance
  }

  /**
   * Добавить действие в историю
   */
  addAction(action: Omit<UndoRedoAction, "id" | "timestamp">): string {
    const startTime = performance.now()

    const newAction: UndoRedoAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    // Если есть активная группа, добавляем в неё
    if (this.currentGroup) {
      this.currentGroup.actions.push(newAction)
      return newAction.id
    }

    // Проверяем возможность объединения с предыдущим действием
    if (newAction.mergeable && this.history.length > 0) {
      const lastAction = this.history[this.history.length - 1]
      if (
        lastAction.type === newAction.type &&
        lastAction.mergeable &&
        newAction.timestamp - lastAction.timestamp < this.mergeTimeout
      ) {
        // Объединяем действия
        lastAction.redoData = newAction.redoData
        lastAction.timestamp = newAction.timestamp
        return lastAction.id
      }
    }

    // Добавляем новое действие
    this.history.push(newAction)

    // Очищаем redo stack при новом действии
    this.redoStack = []

    // Проверяем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }

    const endTime = performance.now()
    if (endTime - startTime > 16) {
      // Больше 16ms (1 кадр при 60fps)
      logger.warn("[UndoRedoService] addAction slow", { duration: endTime - startTime, type: newAction.type })
    }

    return newAction.id
  }

  /**
   * Отменить последнее действие
   */
  undo(): UndoRedoResult {
    const action = this.history.pop()
    if (!action) {
      return { success: false, error: "No actions to undo" }
    }

    this.redoStack.push(action)
    return { success: true, action }
  }

  /**
   * Повторить отменённое действие
   */
  redo(): UndoRedoResult {
    const action = this.redoStack.pop()
    if (!action) {
      return { success: false, error: "No actions to redo" }
    }

    this.history.push(action)
    return { success: true, action }
  }

  /**
   * Отменить несколько действий
   */
  undoMultiple(count: number): UndoRedoResult[] {
    const results: UndoRedoResult[] = []
    for (let i = 0; i < count && this.canUndo(); i++) {
      results.push(this.undo())
    }
    return results
  }

  /**
   * Повторить несколько действий
   */
  redoMultiple(count: number): UndoRedoResult[] {
    const results: UndoRedoResult[] = []
    for (let i = 0; i < count && this.canRedo(); i++) {
      results.push(this.redo())
    }
    return results
  }

  /**
   * Начать группировку действий
   */
  startGrouping(description?: string): string {
    if (this.currentGroup) {
      logger.warn("[UndoRedoService] Grouping already in progress")
      return this.currentGroup.id
    }

    this.currentGroup = {
      id: `group-${Date.now()}`,
      description,
      actions: [],
      startTime: Date.now(),
    }

    return this.currentGroup.id
  }

  /**
   * Завершить группировку действий
   */
  endGrouping(): void {
    if (!this.currentGroup) {
      logger.warn("[UndoRedoService] No grouping in progress")
      return
    }

    this.currentGroup.endTime = Date.now()

    // Если в группе есть действия, добавляем их в историю как группу
    if (this.currentGroup.actions.length > 0) {
      const groupAction: UndoRedoAction = {
        id: this.currentGroup.id,
        type: "BATCH_OPERATION",
        description: this.currentGroup.description || `Group of ${this.currentGroup.actions.length} actions`,
        timestamp: this.currentGroup.endTime,
        undoData: { actions: this.currentGroup.actions },
        redoData: { actions: this.currentGroup.actions },
        groupId: this.currentGroup.id,
        priority: "high",
        mergeable: false,
      }

      this.history.push(groupAction)
      this.redoStack = []
    }

    this.currentGroup = null
  }

  /**
   * Отменить всю группу действий
   */
  undoGroup(groupId: string): UndoRedoResult {
    const groupIndex = this.history.findIndex((a) => a.groupId === groupId)
    if (groupIndex === -1) {
      return { success: false, error: "Group not found" }
    }

    // Перемещаем все действия группы в redo stack
    const groupActions = this.history.splice(groupIndex).reverse()
    this.redoStack.push(...groupActions)

    return { success: true, action: groupActions[0] }
  }

  /**
   * Отменить до определённого действия
   */
  undoToAction(actionId: string): UndoRedoResult {
    const actionIndex = this.history.findIndex((a) => a.id === actionId)
    if (actionIndex === -1) {
      return { success: false, error: "Action not found" }
    }

    // Отменяем все действия после указанного
    const actionsToUndo = this.history.splice(actionIndex + 1).reverse()
    this.redoStack.push(...actionsToUndo)

    return { success: true }
  }

  /**
   * Отменить действия определённого типа
   */
  undoByType(actionType: ActionType, maxCount: number = 10): UndoRedoResult[] {
    const results: UndoRedoResult[] = []
    let count = 0

    for (let i = this.history.length - 1; i >= 0 && count < maxCount; i--) {
      if (this.history[i].type === actionType) {
        const action = this.history.splice(i, 1)[0]
        this.redoStack.push(action)
        results.push({ success: true, action })
        count++
      }
    }

    return results
  }

  /**
   * Отменить действия для определённых сущностей
   */
  undoByEntity(entityIds: string[], entityType: "clips" | "tracks" | "keyframes"): UndoRedoResult[] {
    const results: UndoRedoResult[] = []

    for (let i = this.history.length - 1; i >= 0; i--) {
      const action = this.history[i]
      const affectedIds = action.affectedEntities?.[entityType] || []

      if (affectedIds.some((id) => entityIds.includes(id))) {
        this.history.splice(i, 1)
        this.redoStack.push(action)
        results.push({ success: true, action })
      }
    }

    return results
  }

  /**
   * Проверка возможности отмены
   */
  canUndo(): boolean {
    return this.history.length > 0
  }

  /**
   * Проверка возможности повтора
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Получить список действий для отмены
   */
  getUndoableActions(limit: number = 10): UndoRedoAction[] {
    return this.history.slice(-limit).reverse()
  }

  /**
   * Получить список действий для повтора
   */
  getRedoableActions(limit: number = 10): UndoRedoAction[] {
    return this.redoStack.slice(-limit).reverse()
  }

  /**
   * Очистить историю
   */
  clearHistory(): void {
    this.history = []
    this.redoStack = []
    this.currentGroup = null
  }

  /**
   * Получить статистику истории
   */
  getHistoryStats() {
    const actionsByType = new Map<ActionType, number>()

    this.history.forEach((action) => {
      actionsByType.set(action.type, (actionsByType.get(action.type) || 0) + 1)
    })

    return {
      totalActions: this.history.length,
      redoableActions: this.redoStack.length,
      actionsByType: Object.fromEntries(actionsByType),
      memoryUsage: JSON.stringify(this.history).length + JSON.stringify(this.redoStack).length,
      maxHistorySize: this.maxHistorySize,
    }
  }

  /**
   * Оптимизировать историю
   */
  optimizeHistory(): void {
    // Удаляем старые действия с низким приоритетом
    const cutoffTime = Date.now() - 30 * 60 * 1000 // 30 минут

    this.history = this.history.filter((action) => {
      if (action.priority === "critical") return true
      if (action.priority === "high" && action.timestamp > cutoffTime) return true
      if (action.priority === "medium" && action.timestamp > cutoffTime / 2) return true
      if (action.timestamp > cutoffTime / 4) return true
      return false
    })
  }

  /**
   * Установить максимальный размер истории
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size

    // Обрезаем историю если нужно
    if (this.history.length > size) {
      this.history = this.history.slice(-size)
    }
  }

  /**
   * Получить статистику инициализации (для дебага)
   */
  getInitializationStats() {
    return {
      totalInitializations: UndoRedoService.initializationCounter,
      isSingletonInitialized: UndoRedoService.instance !== null,
      historyLength: this.history.length,
      redoStackLength: this.redoStack.length,
    }
  }

  /**
   * Экспорт истории (для сохранения в проект)
   */
  exportHistory(): UndoRedoAction[] {
    return [...this.history]
  }

  /**
   * Импорт истории (при загрузке проекта)
   */
  importHistory(history: UndoRedoAction[]): void {
    this.history = [...history]
    this.redoStack = []
  }
}
