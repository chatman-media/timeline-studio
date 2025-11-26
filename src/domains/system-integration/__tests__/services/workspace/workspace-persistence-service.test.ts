/**
 * Tests for Workspace Persistence Service
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { WorkspaceState } from "../../../services/workspace"
import {
  clearWorkspaceStateLocal,
  debouncedSave,
  isValidWorkspaceState,
  loadWorkspaceState,
  loadWorkspaceStateBackend,
  loadWorkspaceStateLocal,
  saveWorkspaceStateBackend,
  saveWorkspaceStateLocal,
} from "../../../services/workspace"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

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

  describe("saveWorkspaceStateBackend", () => {
    it("должен вызвать invoke с правильными аргументами", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockResolvedValueOnce(undefined)

      const state: WorkspaceState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      await saveWorkspaceStateBackend(state)

      expect(mockedInvoke).toHaveBeenCalledWith("save_workspace_state", {
        state: JSON.stringify(state),
      })
    })

    it("не должен выбрасывать ошибку при неудаче", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockRejectedValueOnce(new Error("Backend error"))

      const state: WorkspaceState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      // Не должно выбрасывать ошибку
      await expect(saveWorkspaceStateBackend(state)).resolves.toBeUndefined()
    })
  })

  describe("loadWorkspaceStateBackend", () => {
    it("должен вернуть состояние из backend", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const state: WorkspaceState = {
        currentPresetId: "vertical",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      mockedInvoke.mockResolvedValueOnce(JSON.stringify(state))

      const loadedState = await loadWorkspaceStateBackend()

      expect(loadedState).toEqual(state)
      expect(mockedInvoke).toHaveBeenCalledWith("load_workspace_state")
    })

    it("должен вернуть null если backend не возвращает данные", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockResolvedValueOnce(null)

      const loadedState = await loadWorkspaceStateBackend()

      expect(loadedState).toBeNull()
    })

    it("должен вернуть null если backend возвращает пустую строку", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockResolvedValueOnce("")

      const loadedState = await loadWorkspaceStateBackend()

      expect(loadedState).toBeNull()
    })

    it("должен вернуть null при ошибке backend", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockRejectedValueOnce(new Error("Backend unavailable"))

      const loadedState = await loadWorkspaceStateBackend()

      expect(loadedState).toBeNull()
    })
  })

  describe("loadWorkspaceState", () => {
    it("должен вернуть состояние из localStorage если оно есть", async () => {
      const state: WorkspaceState = {
        currentPresetId: "default",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      localStorage.setItem("timeline-studio-workspace-state", JSON.stringify(state))

      const loadedState = await loadWorkspaceState()

      expect(loadedState).toEqual(state)
    })

    it("должен использовать fallback на backend если localStorage пуст", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const backendState: WorkspaceState = {
        currentPresetId: "backend-preset",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      mockedInvoke.mockResolvedValueOnce(JSON.stringify(backendState))

      const loadedState = await loadWorkspaceState()

      expect(loadedState).toEqual(backendState)
    })

    it("должен синхронизировать backend состояние в localStorage", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const backendState: WorkspaceState = {
        currentPresetId: "synced-preset",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      mockedInvoke.mockResolvedValueOnce(JSON.stringify(backendState))

      await loadWorkspaceState()

      // После загрузки из backend, состояние должно быть синхронизировано в localStorage
      const localState = loadWorkspaceStateLocal()
      expect(localState).toEqual(backendState)
    })

    it("должен вернуть null если оба источника пусты", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockResolvedValueOnce(null)

      const loadedState = await loadWorkspaceState()

      expect(loadedState).toBeNull()
    })
  })

  describe("debouncedSave", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("должен сохранить состояние после debounce задержки", async () => {
      const state: WorkspaceState = {
        currentPresetId: "debounced",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      debouncedSave(state)

      // До истечения задержки состояние не должно быть сохранено
      expect(loadWorkspaceStateLocal()).toBeNull()

      // Пропускаем 1000ms (DEBOUNCE_MS)
      vi.advanceTimersByTime(1000)

      // Теперь состояние должно быть сохранено
      expect(loadWorkspaceStateLocal()).toEqual(state)
    })

    it("должен отменять предыдущий сохранение при повторном вызове", async () => {
      const state1: WorkspaceState = {
        currentPresetId: "first",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      const state2: WorkspaceState = {
        currentPresetId: "second",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      debouncedSave(state1)
      vi.advanceTimersByTime(500) // Половина задержки

      debouncedSave(state2) // Должно отменить первый вызов
      vi.advanceTimersByTime(500) // Еще половина - первый бы уже сохранился

      // Состояние не должно быть сохранено (второй вызов сбросил таймер)
      expect(loadWorkspaceStateLocal()).toBeNull()

      vi.advanceTimersByTime(500) // Теперь должно сохраниться state2

      expect(loadWorkspaceStateLocal()).toEqual(state2)
    })

    it("должен вызывать saveWorkspaceStateBackend после debounce", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)
      mockedInvoke.mockResolvedValue(undefined)

      const state: WorkspaceState = {
        currentPresetId: "backend-save",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }

      debouncedSave(state)
      vi.advanceTimersByTime(1000)

      // Даем Promise резолвиться
      await vi.runAllTimersAsync()

      expect(mockedInvoke).toHaveBeenCalledWith("save_workspace_state", {
        state: JSON.stringify(state),
      })
    })
  })

  describe("Error Handling", () => {
    it("saveWorkspaceStateLocal должен выбрасывать ошибку при сбое JSON.stringify", async () => {
      const circularState: any = {
        currentPresetId: "circular",
        activeWidgets: [],
        customLayouts: [],
        version: "1.0.0",
      }
      // Создаём циклическую ссылку
      circularState.self = circularState

      await expect(saveWorkspaceStateLocal(circularState)).rejects.toThrow()
    })

    it("clearWorkspaceStateLocal не должен выбрасывать ошибку", () => {
      // Очистка пустого storage не должна вызывать ошибку
      expect(() => clearWorkspaceStateLocal()).not.toThrow()

      // Очистка после установки значения тоже не должна вызывать ошибку
      localStorage.setItem("timeline-studio-workspace-state", "test")
      expect(() => clearWorkspaceStateLocal()).not.toThrow()
    })
  })

  describe("isValidWorkspaceState Edge Cases", () => {
    it("должен вернуть false для массива", () => {
      expect(isValidWorkspaceState([])).toBe(false)
    })

    it("должен вернуть false для строки", () => {
      expect(isValidWorkspaceState("string")).toBe(false)
    })

    it("должен вернуть false для числа", () => {
      expect(isValidWorkspaceState(123)).toBe(false)
    })

    it("должен вернуть false для boolean", () => {
      expect(isValidWorkspaceState(true)).toBe(false)
    })

    it("должен вернуть false если currentPresetId не строка", () => {
      expect(
        isValidWorkspaceState({
          currentPresetId: 123,
          activeWidgets: [],
          customLayouts: [],
          version: "1.0.0",
        }),
      ).toBe(false)
    })

    it("должен вернуть false если version не строка", () => {
      expect(
        isValidWorkspaceState({
          currentPresetId: "default",
          activeWidgets: [],
          customLayouts: [],
          version: 1,
        }),
      ).toBe(false)
    })

    it("должен вернуть false если customLayouts не массив", () => {
      expect(
        isValidWorkspaceState({
          currentPresetId: "default",
          activeWidgets: [],
          customLayouts: {},
          version: "1.0.0",
        }),
      ).toBe(false)
    })
  })
})
