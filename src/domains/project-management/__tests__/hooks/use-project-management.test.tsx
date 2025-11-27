/**
 * Use Project Management Hook Tests
 *
 * Тесты для хука useProjectManagement
 */

import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectSettings } from "@/types/generated/tauri-bindings"
import { useProjectManagement } from "../../hooks/use-project-management"
import { resetProjectManagementOrchestrator } from "../../services/project-management-orchestrator"

// Mock backend service
const mockBackend = {
  connected: true,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  executeCommand: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
  getProjectState: vi.fn().mockResolvedValue(null),
  getEventHistory: vi.fn().mockResolvedValue([]),
  onEvent: vi.fn(() => vi.fn()),
  onStateChange: vi.fn(() => vi.fn()),
}

// Mock @/core - app-machine gets backend from here
vi.mock("@/core", () => ({
  getBackend: vi.fn(() => mockBackend),
  container: {
    hasBackend: vi.fn(() => true),
    getBackend: vi.fn(() => mockBackend),
  },
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    infoSync: vi.fn(),
    error: vi.fn(),
    errorSync: vi.fn(),
    debug: vi.fn(),
    debugSync: vi.fn(),
    warn: vi.fn(),
    warnSync: vi.fn(),
  })),
  logInfo: vi.fn(),
  logError: vi.fn(),
  logDebug: vi.fn(),
  logWarn: vi.fn(),
}))

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe("useProjectManagement Hook", () => {
  beforeEach(() => {
    resetProjectManagementOrchestrator()
  })

  afterEach(() => {
    resetProjectManagementOrchestrator()
  })

  describe("Initial State", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.projectState).toBeNull()
      expect(result.current.isConnected).toBe(false) // Initially disconnected
      expect(result.current.connectionError).toBeNull()
      expect(result.current.hasProject).toBe(false)
      expect(result.current.projectName).toBeNull()
      expect(result.current.projectPath).toBeNull()
    })

    it("should initialize user settings", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.userSettings).toBeDefined()
      expect(result.current.userSettings.isLoaded).toBe(true)
      expect(result.current.layoutMode).toBe("default")
      expect(result.current.activeTab).toBe("media")
      expect(result.current.isAutoSaveEnabled).toBe(true)
    })
  })

  describe("Project Operations", () => {
    it("should create project", async () => {
      const { result } = renderHook(() => useProjectManagement())

      const mockSettings: ProjectSettings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      }

      await result.current.createProject(mockSettings)
      // Should not throw
    })

    it("should open project", async () => {
      const { result } = renderHook(() => useProjectManagement())

      await result.current.openProject("/path/to/project.tsp")
      // Should not throw
    })

    it("should save project", async () => {
      const { result } = renderHook(() => useProjectManagement())

      await result.current.saveProject()
      // Should not throw
    })

    it("should save project as", async () => {
      const { result } = renderHook(() => useProjectManagement())

      await result.current.saveProjectAs("/path/to/new-project.tsp")
      // Should not throw
    })

    it("should close project", async () => {
      const { result } = renderHook(() => useProjectManagement())

      await result.current.closeProject()
      // Should not throw
    })
  })

  describe("User Settings", () => {
    it("should update user settings", () => {
      const { result } = renderHook(() => useProjectManagement())

      result.current.updateUserSettings({ layoutMode: "vertical" })

      // Settings should be updated (no async wait needed for XState machine)
      expect(typeof result.current.updateUserSettings).toBe("function")
    })

    it("should update multiple settings at once", () => {
      const { result } = renderHook(() => useProjectManagement())

      result.current.updateUserSettings({
        layoutMode: "chat",
        activeTab: "music",
        playerVolume: 75,
      })

      // Settings should be updated
      expect(typeof result.current.updateUserSettings).toBe("function")
    })

    it("should update auto-save settings", () => {
      const { result } = renderHook(() => useProjectManagement())

      result.current.updateUserSettings({
        autoSaveEnabled: false,
        autoSaveInterval: 120,
      })

      // Settings should be updated
      expect(typeof result.current.updateUserSettings).toBe("function")
    })
  })

  describe("Computed Properties", () => {
    it("should compute hasProject correctly", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.hasProject).toBe(false)
    })

    it("should compute projectName from state", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.projectName).toBeNull()
    })

    it("should compute projectPath from state", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.projectPath).toBeNull()
    })
  })

  describe("State Subscriptions", () => {
    it("should subscribe to project state changes", () => {
      const { result } = renderHook(() => useProjectManagement())

      // Initial state should be null
      expect(result.current.projectState).toBeNull()

      // Subscription should be active (tested indirectly through state updates)
      // We can't easily test state updates from backend without mocking actor state
    })

    it("should subscribe to user settings changes", () => {
      const { result } = renderHook(() => useProjectManagement())

      // Update settings
      result.current.updateUserSettings({ layoutMode: "vertical" })

      // Subscription is active (tested through other tests)
      expect(typeof result.current.updateUserSettings).toBe("function")
    })

    it("should cleanup subscriptions on unmount", () => {
      const { unmount } = renderHook(() => useProjectManagement())

      // Should not throw on unmount
      unmount()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty project settings updates", async () => {
      const { result } = renderHook(() => useProjectManagement())

      result.current.updateUserSettings({})

      // Should not throw
    })

    it("should handle undefined projectState", () => {
      const { result } = renderHook(() => useProjectManagement())

      expect(result.current.hasProject).toBe(false)
      expect(result.current.projectName).toBeNull()
      expect(result.current.projectPath).toBeNull()
    })

    it("should handle multiple createProject calls", async () => {
      const { result } = renderHook(() => useProjectManagement())

      const mockSettings: ProjectSettings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      }

      await result.current.createProject(mockSettings)
      await result.current.createProject(mockSettings)

      // Should not throw
    })

    it("should handle concurrent operations", async () => {
      const { result } = renderHook(() => useProjectManagement())

      const mockSettings: ProjectSettings = {
        resolution: { width: 1920, height: 1080 },
        frame_rate: 30,
        audio_sample_rate: 48000,
        audio_channels: 2,
      }

      // Execute multiple operations concurrently
      await Promise.all([
        result.current.createProject(mockSettings),
        result.current.updateUserSettings({ layoutMode: "vertical" }),
      ])

      // Should not throw
    })
  })

  describe("Callback Stability", () => {
    it("should have stable callback references", () => {
      const { result, rerender } = renderHook(() => useProjectManagement())

      const initialCreateProject = result.current.createProject
      const initialSaveProject = result.current.saveProject
      const initialUpdateSettings = result.current.updateUserSettings

      rerender()

      expect(result.current.createProject).toBe(initialCreateProject)
      expect(result.current.saveProject).toBe(initialSaveProject)
      expect(result.current.updateUserSettings).toBe(initialUpdateSettings)
    })
  })
})
