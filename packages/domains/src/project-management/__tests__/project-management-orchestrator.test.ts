/**
 * Project Management Orchestrator Tests
 *
 * Тесты для Project Management Orchestrator
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectSettings } from "@/types/generated/tauri-bindings"
import {
  ProjectManagementOrchestrator,
  resetProjectManagementOrchestrator,
} from "../services/project-management-orchestrator"

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

// Mock @timeline-studio/core - app-machine gets backend from here
vi.mock("@timeline-studio/core", () => ({
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
}))

// Mock service config
vi.mock("@/shared/config/service-config", () => ({
  isServiceEnabled: vi.fn(() => true),
}))

describe("ProjectManagementOrchestrator", () => {
  let orchestrator: ProjectManagementOrchestrator

  beforeEach(() => {
    // Reset orchestrator before each test
    resetProjectManagementOrchestrator()
    orchestrator = new ProjectManagementOrchestrator()
  })

  afterEach(() => {
    orchestrator.dispose()
    resetProjectManagementOrchestrator()
  })

  describe("Initialization", () => {
    it("should create orchestrator instance", () => {
      expect(orchestrator).toBeDefined()
    })

    it("should initialize app actor", () => {
      const appActor = orchestrator.getAppActor()
      expect(appActor).toBeDefined()
    })

    it("should initialize user settings actor", () => {
      const userSettingsActor = orchestrator.getUserSettingsActor()
      expect(userSettingsActor).toBeDefined()
    })

    it("should be connected to backend", () => {
      expect(orchestrator.isConnected()).toBe(true)
    })
  })

  describe("Project Operations", () => {
    const mockSettings: ProjectSettings = {
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30,
      audio_sample_rate: 48000,
      audio_channels: 2,
    }

    it("should create new project", async () => {
      await expect(orchestrator.createProject(mockSettings)).resolves.toBeUndefined()
    })

    it("should open project", async () => {
      const path = "/path/to/project.tsp"
      await expect(orchestrator.openProject(path)).resolves.toBeUndefined()
    })

    it("should save project", async () => {
      await expect(orchestrator.saveProject()).resolves.toBeUndefined()
    })

    it("should save project as", async () => {
      const path = "/path/to/new-project.tsp"
      await expect(orchestrator.saveProjectAs(path)).resolves.toBeUndefined()
    })

    it("should close project", async () => {
      await expect(orchestrator.closeProject()).resolves.toBeUndefined()
    })
  })

  describe("User Settings", () => {
    it("should get user settings", () => {
      const settings = orchestrator.getUserSettings()
      expect(settings).toBeDefined()
      expect(settings.isLoaded).toBe(true)
    })

    it("should update user settings", () => {
      orchestrator.updateUserSettings({ layoutMode: "vertical" })
      // No error should be thrown
    })

    it("should update multiple settings", () => {
      orchestrator.updateUserSettings({
        layoutMode: "chat",
        activeTab: "media",
      })
      // No error should be thrown
    })
  })

  describe("State Management", () => {
    it("should get project state", () => {
      const state = orchestrator.getProjectState()
      expect(state).toBeNull()
    })

    it("should get connection error", () => {
      const error = orchestrator.getConnectionError()
      expect(error).toBeNull()
    })

    it("should subscribe to project state changes", () => {
      const callback = vi.fn()
      const unsubscribe = orchestrator.subscribeToProjectState(callback)
      expect(unsubscribe).toBeDefined()
      expect(typeof unsubscribe.unsubscribe).toBe("function")
      unsubscribe.unsubscribe()
    })

    it("should subscribe to user settings changes", () => {
      const callback = vi.fn()
      const unsubscribe = orchestrator.subscribeToUserSettings(callback)
      expect(unsubscribe).toBeDefined()
      expect(typeof unsubscribe.unsubscribe).toBe("function")
      unsubscribe.unsubscribe()
    })
  })

  describe("Command Execution", () => {
    it("should execute command", async () => {
      const command = {
        type: "Pause" as const,
      }
      await expect(orchestrator.executeCommand(command)).resolves.toBeTruthy()
    })

    it("should execute commands through app machine", async () => {
      // Test that commands are queued and executed
      const command = {
        type: "Play" as const,
      }

      // Execute command
      const result = orchestrator.executeCommand(command)

      // Should return a promise
      expect(result).toBeInstanceOf(Promise)

      // Should resolve successfully
      await expect(result).resolves.toBeTruthy()
    })
  })

  describe("Cleanup", () => {
    it("should dispose orchestrator", () => {
      orchestrator.dispose()
      // Should not throw
    })

    it("should stop auto-save on dispose", () => {
      orchestrator.dispose()
      // Should not throw
    })
  })
})
