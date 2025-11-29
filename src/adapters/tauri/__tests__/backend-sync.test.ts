import { beforeEach, describe, expect, it, vi } from "vitest"
import { BackendSync } from "../backend-sync"

// Mock Tauri event API
const mockListen = vi.fn()
const mockUnlisten = vi.fn()

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: any[]) => mockListen(...args),
}))

// Mock environment
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn(() => true),
}))

// Mock logger
vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock Tauri commands
const mockExecuteCommand = vi.fn()
const mockGetProjectState = vi.fn()
const mockGetEventHistory = vi.fn()

vi.mock("@/types/generated/tauri-bindings", () => ({
  commands: {
    executeCommand: (...args: any[]) => mockExecuteCommand(...args),
    getProjectState: (...args: any[]) => mockGetProjectState(...args),
    getEventHistory: (...args: any[]) => mockGetEventHistory(...args),
  },
}))

describe("BackendSync", () => {
  let backendSync: BackendSync

  beforeEach(() => {
    vi.clearAllMocks()
    backendSync = new BackendSync()
    mockListen.mockResolvedValue(mockUnlisten)
    mockGetProjectState.mockResolvedValue({ status: "ok", data: null })
  })

  // ============================================================================
  // Connection Management
  // ============================================================================

  describe("Connection Management", () => {
    it("starts disconnected", () => {
      expect(backendSync.connected).toBe(false)
    })

    it("connects successfully", async () => {
      mockGetProjectState.mockResolvedValueOnce({
        status: "ok",
        data: { version: 1, project: {}, dirty: false },
      })

      await backendSync.connect()

      expect(backendSync.connected).toBe(true)
      expect(mockListen).toHaveBeenCalledWith("project:event", expect.any(Function))
      expect(mockGetProjectState).toHaveBeenCalled()
    })

    it("returns immediately if already connected", async () => {
      mockGetProjectState.mockResolvedValue({ status: "ok", data: null })

      await backendSync.connect()
      await backendSync.connect()

      expect(mockListen).toHaveBeenCalledTimes(1)
    })

    it("returns same promise if already connecting", async () => {
      mockGetProjectState.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ status: "ok", data: null }), 100)),
      )

      const promise1 = backendSync.connect()
      const promise2 = backendSync.connect()

      // Both calls should trigger connection only once
      await Promise.all([promise1, promise2])
      expect(backendSync.connected).toBe(true)
      // Should only call listen once, not twice
      expect(mockListen).toHaveBeenCalledTimes(1)
    })

    it("disconnects properly", async () => {
      await backendSync.connect()

      await backendSync.disconnect()

      expect(backendSync.connected).toBe(false)
      expect(mockUnlisten).toHaveBeenCalled()
    })

    it("handles disconnect when not connected", async () => {
      await backendSync.disconnect()
      expect(backendSync.connected).toBe(false)
    })

    it("handles connection error", async () => {
      mockListen.mockRejectedValueOnce(new Error("Connection failed"))

      await expect(backendSync.connect()).rejects.toThrow("Connection failed")
      expect(backendSync.connected).toBe(false)
    })

    it("notifies state change handlers on initial connect", async () => {
      const mockState = { version: 1, project: {}, dirty: false }
      mockGetProjectState.mockResolvedValueOnce({ status: "ok", data: mockState })

      const handler = vi.fn()
      backendSync.onStateChange(handler)

      await backendSync.connect()

      expect(handler).toHaveBeenCalledWith(mockState)
    })
  })

  // ============================================================================
  // Command Execution
  // ============================================================================

  describe("Command Execution", () => {
    it("executes command successfully", async () => {
      const command = { type: "CreateProject", params: { name: "Test" } } as any
      const result = { success: true, data: { project_id: "test-id" } }

      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: result })

      const response = await backendSync.executeCommand(command)

      expect(mockExecuteCommand).toHaveBeenCalledWith(command)
      expect(response).toEqual(result)
    })

    it("handles command error from backend", async () => {
      const command = { type: "CreateProject", params: {} } as any
      mockExecuteCommand.mockResolvedValueOnce({ status: "error", error: "Invalid command" })

      const response = await backendSync.executeCommand(command)

      expect(response.success).toBe(false)
      expect(response.error).toBe("Invalid command")
    })

    it("handles command execution exception", async () => {
      const command = { type: "CreateProject", params: {} } as any
      mockExecuteCommand.mockRejectedValueOnce(new Error("Network error"))

      const response = await backendSync.executeCommand(command)

      expect(response.success).toBe(false)
      expect(response.error).toBe("Network error")
    })
  })

  // ============================================================================
  // State Management
  // ============================================================================

  describe("State Management", () => {
    it("gets project state successfully", async () => {
      const mockState = { version: 1, project: {}, dirty: false }
      mockGetProjectState.mockResolvedValueOnce({ status: "ok", data: mockState })

      const result = await backendSync.getProjectState()

      expect(mockGetProjectState).toHaveBeenCalled()
      expect(result).toEqual(mockState)
    })

    it("returns null when no project state", async () => {
      mockGetProjectState.mockResolvedValueOnce({ status: "ok", data: null })

      const result = await backendSync.getProjectState()

      expect(result).toBeNull()
    })

    it("returns null on error", async () => {
      mockGetProjectState.mockResolvedValueOnce({ status: "error", error: "State error" })

      const result = await backendSync.getProjectState()

      expect(result).toBeNull()
    })

    it("handles getProjectState exception", async () => {
      mockGetProjectState.mockRejectedValueOnce(new Error("Network error"))

      const result = await backendSync.getProjectState()

      expect(result).toBeNull()
    })
  })

  // ============================================================================
  // Event History
  // ============================================================================

  describe("Event History", () => {
    it("gets event history with default version", async () => {
      const mockHistory = [{ version: 1, event: {}, metadata: {} }]
      mockGetEventHistory.mockResolvedValueOnce({ status: "ok", data: mockHistory })

      const result = await backendSync.getEventHistory()

      expect(mockGetEventHistory).toHaveBeenCalledWith(0)
      expect(result).toEqual(mockHistory)
    })

    it("gets event history with specific version", async () => {
      const mockHistory = [{ version: 5, event: {}, metadata: {} }]
      mockGetEventHistory.mockResolvedValueOnce({ status: "ok", data: mockHistory })

      const result = await backendSync.getEventHistory(4)

      expect(mockGetEventHistory).toHaveBeenCalledWith(4)
      expect(result).toEqual(mockHistory)
    })

    it("returns empty array on error", async () => {
      mockGetEventHistory.mockResolvedValueOnce({ status: "error", error: "History error" })

      const result = await backendSync.getEventHistory()

      expect(result).toEqual([])
    })

    it("handles getEventHistory exception", async () => {
      mockGetEventHistory.mockRejectedValueOnce(new Error("Network error"))

      const result = await backendSync.getEventHistory()

      expect(result).toEqual([])
    })
  })

  // ============================================================================
  // Version Control
  // ============================================================================

  describe("Version Control", () => {
    it("creates snapshot with message", async () => {
      mockExecuteCommand.mockResolvedValueOnce({
        status: "ok",
        data: { success: true, data: { snapshot_id: "snap123" } },
      })

      const result = await backendSync.createSnapshot("Test snapshot")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateSnapshot",
        params: { message: "Test snapshot" },
      })
      expect(result.success).toBe(true)
    })

    it("creates snapshot without message", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.createSnapshot()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateSnapshot",
        params: { message: undefined },
      })
    })

    it("restores version", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.restoreVersion("version123")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "RestoreVersion",
        params: { version_id: "version123" },
      })
    })

    it("gets version history with limit", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true, data: [] } })

      await backendSync.getVersionHistory(10)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "GetVersionHistory",
        params: { limit: 10 },
      })
    })

    it("gets version history without limit", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true, data: [] } })

      await backendSync.getVersionHistory()

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "GetVersionHistory",
        params: { limit: null },
      })
    })

    it("compares versions", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true, data: { diff: [] } } })

      await backendSync.compareVersions("v1", "v2")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CompareVersions",
        params: { version_a: "v1", version_b: "v2" },
      })
    })

    it("creates branch from current version", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.createBranch("feature-branch")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateBranch",
        params: { branch_name: "feature-branch", from_version: null },
      })
    })

    it("creates branch from specific version", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.createBranch("feature-branch", "version123")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "CreateBranch",
        params: { branch_name: "feature-branch", from_version: "version123" },
      })
    })

    it("merges branches", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.mergeBranch("feature", "main")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "MergeBranch",
        params: { source_branch: "feature", target_branch: "main" },
      })
    })

    it("switches branch", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.switchBranch("develop")

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SwitchBranch",
        params: { branch_name: "develop" },
      })
    })

    it("sets auto-save interval", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.setAutoSaveInterval(300)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "SetAutoSaveInterval",
        params: { seconds: 300 },
      })
    })

    it("enables auto-save", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.enableAutoSave(true)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "EnableAutoSave",
        params: { enabled: true },
      })
    })

    it("disables auto-save", async () => {
      mockExecuteCommand.mockResolvedValueOnce({ status: "ok", data: { success: true } })

      await backendSync.enableAutoSave(false)

      expect(mockExecuteCommand).toHaveBeenCalledWith({
        type: "EnableAutoSave",
        params: { enabled: false },
      })
    })
  })

  // ============================================================================
  // Event Subscriptions
  // ============================================================================

  describe("Event Subscriptions", () => {
    it("subscribes to events and receives unsubscribe function", () => {
      const handler = vi.fn()
      const unsubscribe = backendSync.onEvent(handler)

      expect(typeof unsubscribe).toBe("function")
    })

    it("unsubscribes from events", () => {
      const handler = vi.fn()
      const unsubscribe = backendSync.onEvent(handler)

      unsubscribe()

      // Handler should not be called after unsubscribe
      const mockEvent = { type: "TestEvent" } as any
      backendSync.handleBackendEvent({ event: mockEvent, metadata: { version: 1 } } as any)

      expect(handler).not.toHaveBeenCalled()
    })

    it("notifies event handlers", () => {
      const handler = vi.fn()
      backendSync.onEvent(handler)

      const mockEvent = { type: "ProjectCreated" } as any
      backendSync.handleBackendEvent({ event: mockEvent, metadata: { version: 1 } } as any)

      expect(handler).toHaveBeenCalledWith(mockEvent)
    })

    it("handles multiple event handlers", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      backendSync.onEvent(handler1)
      backendSync.onEvent(handler2)

      const mockEvent = { type: "ProjectCreated" } as any
      backendSync.handleBackendEvent({ event: mockEvent, metadata: { version: 1 } } as any)

      expect(handler1).toHaveBeenCalledWith(mockEvent)
      expect(handler2).toHaveBeenCalledWith(mockEvent)
    })

    it("subscribes to state changes", () => {
      const handler = vi.fn()
      const unsubscribe = backendSync.onStateChange(handler)

      expect(typeof unsubscribe).toBe("function")
    })

    it("unsubscribes from state changes", () => {
      const handler = vi.fn()
      const unsubscribe = backendSync.onStateChange(handler)

      unsubscribe()

      const mockState = { version: 1, project: {}, dirty: false } as any
      backendSync.notifyStateChange(mockState)

      expect(handler).not.toHaveBeenCalled()
    })

    it("updates last version when receiving events", () => {
      backendSync.handleBackendEvent({ event: { type: "Test" } as any, metadata: { version: 5 } } as any)

      expect(backendSync.lastVersion).toBe(5)
    })

    it("handles handler errors gracefully", () => {
      const throwingHandler = vi.fn(() => {
        throw new Error("Handler error")
      })
      const normalHandler = vi.fn()

      backendSync.onEvent(throwingHandler)
      backendSync.onEvent(normalHandler)

      const mockEvent = { type: "ProjectCreated" } as any
      backendSync.handleBackendEvent({ event: mockEvent, metadata: { version: 1 } } as any)

      expect(throwingHandler).toHaveBeenCalled()
      expect(normalHandler).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Non-Desktop Environment
  // ============================================================================

  describe("Non-Desktop Environment", () => {
    beforeEach(async () => {
      // Reset all mocks
      vi.clearAllMocks()

      // Mock isDesktop to return false
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(false)

      // Create a new instance with non-desktop environment
      backendSync = new BackendSync()
    })

    it("does not connect in non-desktop environment", async () => {
      await backendSync.connect()

      expect(backendSync.connected).toBe(false)
      expect(mockListen).not.toHaveBeenCalled()
    })

    it("returns error for executeCommand in non-desktop", async () => {
      const command = { type: "CreateProject", params: {} } as any
      const result = await backendSync.executeCommand(command)

      expect(result.success).toBe(false)
      expect(result.error).toContain("desktop mode")
      expect(mockExecuteCommand).not.toHaveBeenCalled()
    })

    it("returns null for getProjectState in non-desktop", async () => {
      const result = await backendSync.getProjectState()

      expect(result).toBeNull()
      expect(mockGetProjectState).not.toHaveBeenCalled()
    })

    afterEach(async () => {
      // Reset isDesktop back to true for other tests
      const { isDesktop } = await import("@/lib/environment")
      vi.mocked(isDesktop).mockReturnValue(true)
    })
  })
})
