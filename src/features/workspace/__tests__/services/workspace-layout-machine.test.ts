/**
 * Tests for Workspace Layout Machine
 */

import { beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"
import { createMockWidget } from "../../__mocks__/test-data"
import { workspaceLayoutMachine } from "../../services/workspace-layout-machine"

describe("WorkspaceLayoutMachine", () => {
  let actor: ReturnType<typeof createActor<typeof workspaceLayoutMachine>>

  beforeEach(() => {
    actor = createActor(workspaceLayoutMachine)
    actor.start()
  })

  describe("Initial State", () => {
    it("должен иметь корректное начальное состояние", () => {
      const snapshot = actor.getSnapshot()

      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.currentPresetId).toBe("default")
      expect(snapshot.context.activeWidgets).toHaveLength(3)
      expect(snapshot.context.customLayouts).toEqual([])
      expect(snapshot.context.selectedWidgetId).toBeNull()
      expect(snapshot.context.isDragging).toBe(false)
      expect(snapshot.context.dragWidgetId).toBeNull()
    })

    it("должен загружать виджеты из preset по умолчанию", () => {
      const snapshot = actor.getSnapshot()

      expect(snapshot.context.activeWidgets).toHaveLength(3)
      expect(snapshot.context.activeWidgets[0].type).toBe("browser")
      expect(snapshot.context.activeWidgets[1].type).toBe("player")
      expect(snapshot.context.activeWidgets[2].type).toBe("timeline")
    })
  })

  describe("SWITCH_PRESET", () => {
    it("должен переключиться на другой preset", () => {
      actor.send({ type: "SWITCH_PRESET", presetId: "vertical" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.currentPresetId).toBe("vertical")
      expect(snapshot.context.activeWidgets).toHaveLength(4)
    })

    it("должен сбросить выбранный виджет при переключении preset", () => {
      actor.send({ type: "SELECT_WIDGET", widgetId: "browser-1" })
      actor.send({ type: "SWITCH_PRESET", presetId: "options" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedWidgetId).toBeNull()
    })

    it("должен игнорировать несуществующий preset", () => {
      const beforeSnapshot = actor.getSnapshot()

      actor.send({ type: "SWITCH_PRESET", presetId: "non-existent" })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.context.currentPresetId).toBe(beforeSnapshot.context.currentPresetId)
    })
  })

  describe("ADD_WIDGET", () => {
    it("должен добавить новый виджет", () => {
      const newWidget = createMockWidget("test-1", "ai-chat", { x: 10, y: 10, width: 30, height: 30 })

      actor.send({ type: "ADD_WIDGET", widget: newWidget })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.activeWidgets).toHaveLength(4)
      expect(snapshot.context.activeWidgets[3]).toEqual(newWidget)
    })
  })

  describe("REMOVE_WIDGET", () => {
    it("должен удалить виджет", () => {
      const snapshot = actor.getSnapshot()
      const widgetToRemove = snapshot.context.activeWidgets[0]

      actor.send({ type: "REMOVE_WIDGET", widgetId: widgetToRemove.id })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.context.activeWidgets).toHaveLength(2)
      expect(afterSnapshot.context.activeWidgets.find((w) => w.id === widgetToRemove.id)).toBeUndefined()
    })

    it("должен сбросить selectedWidgetId если удаленный виджет был выбран", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "SELECT_WIDGET", widgetId })
      actor.send({ type: "REMOVE_WIDGET", widgetId })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.context.selectedWidgetId).toBeNull()
    })
  })

  describe("UPDATE_WIDGET_BOUNDS", () => {
    it("должен обновить позицию и размер виджета", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]
      const newBounds = { x: 20, y: 30, width: 40, height: 50 }

      actor.send({
        type: "UPDATE_WIDGET_BOUNDS",
        widgetId: widget.id,
        bounds: newBounds,
      })

      const afterSnapshot = actor.getSnapshot()
      const updatedWidget = afterSnapshot.context.activeWidgets.find((w) => w.id === widget.id)

      expect(updatedWidget?.bounds).toEqual(newBounds)
    })
  })

  describe("TOGGLE_WIDGET_VISIBILITY", () => {
    it("должен переключить видимость виджета", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]
      const initialVisibility = widget.isVisible

      actor.send({ type: "TOGGLE_WIDGET_VISIBILITY", widgetId: widget.id })

      const afterSnapshot = actor.getSnapshot()
      const updatedWidget = afterSnapshot.context.activeWidgets.find((w) => w.id === widget.id)

      expect(updatedWidget?.isVisible).toBe(!initialVisibility)
    })
  })

  describe("MINIMIZE_WIDGET", () => {
    it("должен минимизировать виджет", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]

      actor.send({ type: "MINIMIZE_WIDGET", widgetId: widget.id })

      const afterSnapshot = actor.getSnapshot()
      const updatedWidget = afterSnapshot.context.activeWidgets.find((w) => w.id === widget.id)

      expect(updatedWidget?.isMinimized).toBe(true)
    })
  })

  describe("MAXIMIZE_WIDGET", () => {
    it("должен развернуть минимизированный виджет", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]

      // Сначала минимизируем
      actor.send({ type: "MINIMIZE_WIDGET", widgetId: widget.id })

      // Затем разворачиваем
      actor.send({ type: "MAXIMIZE_WIDGET", widgetId: widget.id })

      const afterSnapshot = actor.getSnapshot()
      const updatedWidget = afterSnapshot.context.activeWidgets.find((w) => w.id === widget.id)

      expect(updatedWidget?.isMinimized).toBe(false)
    })
  })

  describe("SELECT_WIDGET", () => {
    it("должен выбрать виджет", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "SELECT_WIDGET", widgetId })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.context.selectedWidgetId).toBe(widgetId)
    })

    it("должен сбросить выбор при передаче null", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "SELECT_WIDGET", widgetId })
      actor.send({ type: "SELECT_WIDGET", widgetId: null })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.context.selectedWidgetId).toBeNull()
    })
  })

  describe("Drag & Drop", () => {
    it("должен начать перетаскивание", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "START_DRAG", widgetId })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.value).toBe("dragging")
      expect(afterSnapshot.context.isDragging).toBe(true)
      expect(afterSnapshot.context.dragWidgetId).toBe(widgetId)
    })

    it("должен завершить перетаскивание", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "START_DRAG", widgetId })
      actor.send({ type: "END_DRAG" })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.value).toBe("idle")
      expect(afterSnapshot.context.isDragging).toBe(false)
      expect(afterSnapshot.context.dragWidgetId).toBeNull()
    })

    it("должен обновлять позицию виджета во время перетаскивания", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]
      const newBounds = { x: 25, y: 35, width: 50, height: 50 }

      actor.send({ type: "START_DRAG", widgetId: widget.id })
      actor.send({
        type: "UPDATE_WIDGET_BOUNDS",
        widgetId: widget.id,
        bounds: newBounds,
      })

      const afterSnapshot = actor.getSnapshot()
      const updatedWidget = afterSnapshot.context.activeWidgets.find((w) => w.id === widget.id)

      expect(updatedWidget?.bounds).toEqual(newBounds)
      expect(afterSnapshot.value).toBe("dragging")
    })
  })

  describe("Custom Layouts", () => {
    it("должен сохранить custom layout", () => {
      const layoutName = "My Custom Layout"
      const layoutDescription = "Custom description"

      actor.send({
        type: "SAVE_CUSTOM_LAYOUT",
        name: layoutName,
        description: layoutDescription,
      })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.customLayouts).toHaveLength(1)
      expect(snapshot.context.customLayouts[0].name).toBe(layoutName)
      expect(snapshot.context.customLayouts[0].description).toBe(layoutDescription)
      expect(snapshot.context.customLayouts[0].id).toMatch(/^custom-\d+$/)
    })

    it("должен удалить custom layout", () => {
      actor.send({ type: "SAVE_CUSTOM_LAYOUT", name: "Test Layout" })

      const afterSave = actor.getSnapshot()
      const layoutId = afterSave.context.customLayouts[0].id

      actor.send({ type: "DELETE_CUSTOM_LAYOUT", layoutId })

      const afterDelete = actor.getSnapshot()
      expect(afterDelete.context.customLayouts).toHaveLength(0)
    })
  })

  describe("RESET_TO_PRESET", () => {
    it("должен сбросить изменения к текущему preset", () => {
      // Модифицируем виджеты
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]

      actor.send({
        type: "UPDATE_WIDGET_BOUNDS",
        widgetId: widget.id,
        bounds: { x: 100, y: 100, width: 10, height: 10 },
      })

      // Сбрасываем к preset
      actor.send({ type: "RESET_TO_PRESET" })

      const afterReset = actor.getSnapshot()
      const resetWidget = afterReset.context.activeWidgets.find((w) => w.id === widget.id)

      // Проверяем, что виджет вернулся к изначальному состоянию
      expect(resetWidget?.bounds).toEqual(widget.bounds)
    })

    it("должен сбросить selectedWidgetId при reset", () => {
      actor.send({ type: "SELECT_WIDGET", widgetId: "browser-1" })
      actor.send({ type: "RESET_TO_PRESET" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedWidgetId).toBeNull()
    })
  })

  describe("Resize", () => {
    it("должен начать resize виджета", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "START_RESIZE", widgetId, handle: "se" })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.value).toBe("resizing")
      expect(afterSnapshot.context.isResizing).toBe(true)
      expect(afterSnapshot.context.resizeWidgetId).toBe(widgetId)
      expect(afterSnapshot.context.resizeHandle).toBe("se")
    })

    it("должен обновлять размер виджета во время resize", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]
      const newBounds = { x: 0, y: 0, width: 60, height: 60 }

      actor.send({ type: "START_RESIZE", widgetId: widget.id, handle: "se" })
      actor.send({
        type: "UPDATE_RESIZE",
        bounds: newBounds,
      })

      const afterSnapshot = actor.getSnapshot()
      const updatedWidget = afterSnapshot.context.activeWidgets.find((w) => w.id === widget.id)

      expect(updatedWidget?.bounds).toEqual(newBounds)
      expect(afterSnapshot.value).toBe("resizing")
    })

    it("должен завершить resize виджета", () => {
      const snapshot = actor.getSnapshot()
      const widgetId = snapshot.context.activeWidgets[0].id

      actor.send({ type: "START_RESIZE", widgetId, handle: "e" })
      actor.send({ type: "END_RESIZE" })

      const afterSnapshot = actor.getSnapshot()
      expect(afterSnapshot.value).toBe("idle")
      expect(afterSnapshot.context.isResizing).toBe(false)
      expect(afterSnapshot.context.resizeWidgetId).toBeNull()
      expect(afterSnapshot.context.resizeHandle).toBeNull()
    })

    it("должен обрабатывать resize с разными handles", () => {
      const snapshot = actor.getSnapshot()
      const widget = snapshot.context.activeWidgets[0]

      const handles: Array<"n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"> = [
        "n",
        "s",
        "e",
        "w",
        "ne",
        "nw",
        "se",
        "sw",
      ]

      handles.forEach((handle) => {
        actor.send({ type: "START_RESIZE", widgetId: widget.id, handle })
        const afterStart = actor.getSnapshot()
        expect(afterStart.context.resizeHandle).toBe(handle)
        actor.send({ type: "END_RESIZE" })
      })
    })
  })

  describe("RESTORE_STATE", () => {
    it("должен восстановить состояние из сохраненного snapshot", () => {
      const savedState = {
        currentPresetId: "vertical",
        activeWidgets: [
          {
            id: "custom-1",
            type: "ai-chat" as const,
            bounds: { x: 10, y: 10, width: 30, height: 30 },
            isVisible: true,
            isMinimized: false,
            zIndex: 1,
          },
        ],
        customLayouts: [
          {
            id: "custom-layout-1",
            name: "Custom Layout",
            widgets: [],
          },
        ],
        version: "1.0.0",
      }

      actor.send({ type: "RESTORE_STATE", state: savedState })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.currentPresetId).toBe("vertical")
      expect(snapshot.context.activeWidgets).toHaveLength(1)
      expect(snapshot.context.activeWidgets[0].type).toBe("ai-chat")
      expect(snapshot.context.customLayouts).toHaveLength(1)
    })

    it("должен сбросить selectedWidgetId при restore", () => {
      actor.send({ type: "SELECT_WIDGET", widgetId: "browser-1" })

      const savedState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      actor.send({ type: "RESTORE_STATE", state: savedState })

      const snapshot = actor.getSnapshot()
      expect(snapshot.context.selectedWidgetId).toBeNull()
    })
  })
})
