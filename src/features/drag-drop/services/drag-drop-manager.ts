/**
 * Глобальный менеджер для управления drag & drop операциями между модулями
 */

import { EventEmitter } from "events"

export type DraggableType =
  | "media"
  | "music"
  | "effect"
  | "filter"
  | "transition"
  | "template"
  | "style-template"
  | "subtitle-style"

export interface DraggableItem {
  type: DraggableType
  data: any
  preview?: {
    url?: string
    width?: number
    height?: number
  }
}

export interface DropTarget {
  id: string
  accepts: DraggableType[]
  element?: HTMLElement
  onDragEnter?: (item: DraggableItem) => void
  onDragOver?: (item: DraggableItem, event: DragEvent) => void
  onDragLeave?: (item: DraggableItem) => void
  onDrop?: (item: DraggableItem, event: DragEvent) => void
}

export interface DragState {
  item: DraggableItem
  startX: number
  startY: number
  currentX: number
  currentY: number
  activeDropTarget?: string
}

export class DragDropManager extends EventEmitter {
  private static instance: DragDropManager

  private currentDrag: DragState | null = null
  private dropTargets = new Map<string, DropTarget>()
  private ghostElement: HTMLElement | null = null

  private constructor() {
    super()
    this.setupGlobalListeners()
  }

  static getInstance(): DragDropManager {
    if (!DragDropManager.instance) {
      DragDropManager.instance = new DragDropManager()
    }
    return DragDropManager.instance
  }

  /**
   * Начать drag операцию
   */
  startDrag(item: DraggableItem, event: DragEvent) {
    this.currentDrag = {
      item,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
    }

    // Создаем ghost image если есть превью
    if (item.preview?.url) {
      this.createGhostImage(item.preview)
      if (this.ghostElement && event.dataTransfer) {
        event.dataTransfer.setDragImage(this.ghostElement, 0, 0)
      }
    }

    // Устанавливаем данные для обратной совместимости
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy"
      event.dataTransfer.setData("application/json", JSON.stringify(item))

      // Также устанавливаем специфичные типы для обратной совместимости
      switch (item.type) {
        case "media":
          event.dataTransfer.setData("mediaFile", JSON.stringify(item.data))
          break
        case "effect":
          event.dataTransfer.setData("effect", JSON.stringify(item.data))
          break
        case "filter":
          event.dataTransfer.setData("filter", JSON.stringify(item.data))
          break
        case "transition":
          event.dataTransfer.setData("transition", JSON.stringify(item.data))
          break
        default:
          // Для остальных типов данные уже установлены через application/json
          break
      }
    }

    // Оповещаем все drop targets
    this.notifyDropTargets("dragstart", item)
    this.emit("dragStart", item)
  }

  /**
   * Обновить позицию drag
   */
  updateDrag(event: DragEvent) {
    if (!this.currentDrag) return

    this.currentDrag.currentX = event.clientX
    this.currentDrag.currentY = event.clientY

    // Находим drop target под курсором
    const dropTarget = this.findDropTargetAtPoint(event.clientX, event.clientY)

    if (dropTarget && dropTarget.id !== this.currentDrag.activeDropTarget) {
      // Покидаем предыдущий target
      if (this.currentDrag.activeDropTarget) {
        const prevTarget = this.dropTargets.get(this.currentDrag.activeDropTarget)
        prevTarget?.onDragLeave?.(this.currentDrag.item)
      }

      // Входим в новый target
      this.currentDrag.activeDropTarget = dropTarget.id
      dropTarget.onDragEnter?.(this.currentDrag.item)
    }

    // Обновляем текущий target
    if (dropTarget) {
      dropTarget.onDragOver?.(this.currentDrag.item, event)
    }

    this.emit("dragMove", this.currentDrag)
  }

  /**
   * Завершить drag операцию
   */
  endDrag(event: DragEvent) {
    if (!this.currentDrag) return

    const dropTarget = this.findDropTargetAtPoint(event.clientX, event.clientY)

    if (dropTarget && dropTarget.accepts.includes(this.currentDrag.item.type)) {
      dropTarget.onDrop?.(this.currentDrag.item, event)
      this.emit("drop", this.currentDrag.item, dropTarget)
    }

    this.cleanup()
  }

  /**
   * Отменить drag операцию
   */
  cancelDrag() {
    if (!this.currentDrag) return

    this.emit("dragCancel", this.currentDrag.item)
    this.cleanup()
  }

  /**
   * Зарегистрировать drop target
   */
  registerDropTarget(target: DropTarget) {
    this.dropTargets.set(target.id, target)
    return () => this.unregisterDropTarget(target.id)
  }

  /**
   * Удалить drop target
   */
  unregisterDropTarget(id: string) {
    this.dropTargets.delete(id)
  }

  /**
   * Получить текущий drag элемент
   */
  getCurrentDrag(): DraggableItem | null {
    return this.currentDrag?.item || null
  }

  /**
   * Проверить может ли target принять текущий элемент
   */
  canDropOnTarget(targetId: string): boolean {
    if (!this.currentDrag) return false

    const target = this.dropTargets.get(targetId)
    if (!target) return false

    return target.accepts.includes(this.currentDrag.item.type)
  }

  private setupGlobalListeners() {
    // Skip setup during SSR when document is not available
    if (typeof document === "undefined") {
      return
    }

    // Глобальные обработчики для отслеживания drag операций
    document.addEventListener("dragover", (e) => {
      e.preventDefault()
      this.updateDrag(e)
    })

    document.addEventListener("drop", (e) => {
      e.preventDefault()
      this.endDrag(e)
    })

    document.addEventListener("dragend", () => {
      this.cleanup()
    })

    // Отмена по Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.currentDrag) {
        this.cancelDrag()
      }
    })
  }

  private notifyDropTargets(event: string, item: DraggableItem) {
    this.dropTargets.forEach((target) => {
      if (target.accepts.includes(item.type)) {
        this.emit(`${event}:${target.id}`, item)
      }
    })
  }

  private findDropTargetAtPoint(x: number, y: number): DropTarget | null {
    if (typeof document === "undefined") return null

    const element = document.elementFromPoint(x, y)
    if (!element) return null

    // Ищем зарегистрированный drop target
    for (const [id, target] of Array.from(this.dropTargets.entries())) {
      if (target.element && target.element.contains(element as Node)) {
        return target
      }
    }

    return null
  }

  private createGhostImage(preview: { url?: string; width?: number; height?: number }) {
    if (typeof document === "undefined") return

    this.ghostElement = document.createElement("div")
    this.ghostElement.style.position = "absolute"
    this.ghostElement.style.top = "-1000px"
    this.ghostElement.style.opacity = "0.8"

    if (preview.url) {
      const img = document.createElement("img")
      img.src = preview.url
      img.style.width = `${preview.width || 100}px`
      img.style.height = `${preview.height || 100}px`
      this.ghostElement.appendChild(img)
    }

    document.body.appendChild(this.ghostElement)
  }

  private cleanup() {
    // Очищаем активный drop target
    if (this.currentDrag?.activeDropTarget) {
      const target = this.dropTargets.get(this.currentDrag.activeDropTarget)
      target?.onDragLeave?.(this.currentDrag.item)
    }

    // Удаляем ghost element
    if (this.ghostElement && typeof document !== "undefined") {
      document.body.removeChild(this.ghostElement)
      this.ghostElement = null
    }

    this.currentDrag = null
    this.emit("dragEnd")
  }
}

// Lazy singleton экспорт для SSR совместимости
export const getDragDropManager = () => DragDropManager.getInstance()
