/**
 * Tests for Workspace Persistence Service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkspaceState } from "../../services/workspace-persistence"
import {
  clearWorkspaceStateLocal,
  isValidWorkspaceState,
  loadWorkspaceStateLocal,
  saveWorkspaceStateLocal,
} from "../../services/workspace-persistence"

describe("WorkspacePersistence", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe("saveWorkspaceStateLocal", () => {
    it("должен сохранить состояние в localStorage", async () => {
      const state: WorkspaceState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      await saveWorkspaceStateLocal(state)

      const saved = localStorage.getItem("timeline-studio-workspace-state")
      expect(saved).toBeTruthy()
      expect(JSON.parse(saved!)).toEqual(state)
    })

    it("должен сохранить состояние с виджетами", async () => {
      const state: WorkspaceState = {
        currentPresetId: "vertical",
        activeWidgets: [
          {
            id: "widget-1",
            type: "timeline",
            bounds: { x: 0, y: 0, width: 50, height: 50 },
            isVisible: true,
            isMinimized: false,
            zIndex: 1,
          },
        ],
        customLayouts: [],
        version: "1.0.0",
      }

      await saveWorkspaceStateLocal(state)

      const saved = localStorage.getItem("timeline-studio-workspace-state")
      const parsed = JSON.parse(saved!)
      expect(parsed.activeWidgets).toHaveLength(1)
      expect(parsed.activeWidgets[0].type).toBe("timeline")
    })
  })

  describe("loadWorkspaceStateLocal", () => {
    it("должен загрузить состояние из localStorage", () => {
      const state: WorkspaceState = {
        currentPresetId: "options",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      localStorage.setItem("timeline-studio-workspace-state", JSON.stringify(state))

      const loaded = loadWorkspaceStateLocal()
      expect(loaded).toEqual(state)
    })

    it("должен вернуть null если нет сохраненного состояния", () => {
      const loaded = loadWorkspaceStateLocal()
      expect(loaded).toBeNull()
    })

    it("должен вернуть null при невалидном JSON", () => {
      localStorage.setItem("timeline-studio-workspace-state", "invalid json")

      const loaded = loadWorkspaceStateLocal()
      expect(loaded).toBeNull()
    })
  })

  describe("clearWorkspaceStateLocal", () => {
    it("должен очистить состояние из localStorage", () => {
      const state: WorkspaceState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      localStorage.setItem("timeline-studio-workspace-state", JSON.stringify(state))
      expect(localStorage.getItem("timeline-studio-workspace-state")).toBeTruthy()

      clearWorkspaceStateLocal()
      expect(localStorage.getItem("timeline-studio-workspace-state")).toBeNull()
    })
  })

  describe("isValidWorkspaceState", () => {
    it("должен вернуть true для валидного состояния", () => {
      const state: WorkspaceState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      expect(isValidWorkspaceState(state)).toBe(true)
    })

    it("должен вернуть false для невалидного состояния", () => {
      expect(isValidWorkspaceState(null as any)).toBe(false)
      expect(isValidWorkspaceState(undefined as any)).toBe(false)
      expect(isValidWorkspaceState({} as any)).toBe(false)
      expect(isValidWorkspaceState({ currentPresetId: "default" } as any)).toBe(false)
      expect(
        isValidWorkspaceState({
          currentPresetId: "default",
          activeWidgets: "not an array",
          customLayouts: [],
          version: "1.0.0",
        } as any),
      ).toBe(false)
    })

    it("должен принимать состояние с виджетами и кастомными layout", () => {
      const state: WorkspaceState = {
        currentPresetId: "custom-123",
        activeWidgets: [
          {
            id: "w1",
            type: "player",
            bounds: { x: 10, y: 10, width: 30, height: 30 },
            isVisible: true,
            isMinimized: false,
            zIndex: 1,
          },
        ],
        customLayouts: [
          {
            id: "custom-1",
            name: "My Layout",
            widgets: [],
          },
        ],
        version: "1.0.0",
      }

      expect(isValidWorkspaceState(state)).toBe(true)
    })
  })

  describe("State Roundtrip", () => {
    it("должен корректно сохранить и загрузить состояние", async () => {
      const originalState: WorkspaceState = {
        currentPresetId: "vertical",
        activeWidgets: [
          {
            id: "timeline-1",
            type: "timeline",
            bounds: { x: 0, y: 80, width: 67, height: 20 },
            isVisible: true,
            isMinimized: false,
            zIndex: 3,
          },
          {
            id: "player-1",
            type: "player",
            bounds: { x: 67, y: 0, width: 33, height: 100 },
            isVisible: true,
            isMinimized: false,
            zIndex: 1,
          },
        ],
        customLayouts: [
          {
            id: "custom-123",
            name: "My Custom Layout",
            description: "Test layout",
            widgets: [],
          },
        ],
        version: "1.0.0",
      }

      await saveWorkspaceStateLocal(originalState)
      const loadedState = loadWorkspaceStateLocal()

      expect(loadedState).toEqual(originalState)
      expect(loadedState?.activeWidgets).toHaveLength(2)
      expect(loadedState?.customLayouts).toHaveLength(1)
    })
  })
})
