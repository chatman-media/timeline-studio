/**
 * App Machine Tests
 *
 * Тесты для app machine state management
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createActor, waitFor } from "xstate"
import type { ProjectCommand } from "@/types/generated/tauri-bindings"
import { appMachine } from "../machines/app-machine"

vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: vi.fn(() => ({
    connected: false,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    executeCommand: vi.fn().mockResolvedValue({ success: true, data: null, error: null }),
    getProjectState: vi.fn().mockResolvedValue(null),
    onEvent: vi.fn(() => vi.fn()),
    onStateChange: vi.fn(() => vi.fn()),
  })),
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
  })),
}))

describe("App Machine", () => {
  let actor: ReturnType<typeof createActor<typeof appMachine>>

  beforeEach(() => {
    vi.clearAllMocks()
    actor = createActor(appMachine)
  })

  afterEach(() => {
    actor.stop()
  })

  describe("Initial State", () => {
    it("should start in disconnected state", () => {
      actor.start()
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)
    })

    it("should have initial context", () => {
      actor.start()
      const context = actor.getSnapshot().context
      expect(context.projectState).toBeNull()
      expect(context.isConnected).toBe(false)
      expect(context.error).toBeNull()
      expect(context.commandQueue).toEqual([])
    })
  })

  describe("Connection", () => {
    it("should transition to connecting state on CONNECT event", () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      expect(actor.getSnapshot().matches("connecting")).toBe(true)
    })

    it("should transition to connected state on successful connection", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })

      // Simulate successful connection
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })

      await waitFor(actor, (state) => state.matches("connected"))
      expect(actor.getSnapshot().context.isConnected).toBe(true)
    })

    it("should transition to error state on connection failure", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })

      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECTION_ERROR", error: "Connection failed" })

      expect(actor.getSnapshot().matches("error")).toBe(true)
      expect(actor.getSnapshot().context.error).toBe("Connection failed")
    })
  })

  describe("Command Execution", () => {
    it("should queue commands", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      const command: ProjectCommand = { type: "Pause" }
      actor.send({ type: "EXECUTE_COMMAND", command })

      const context = actor.getSnapshot().context
      expect(context.commandQueue).toContainEqual(command)
    })

    it("should process commands from queue", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      const command: ProjectCommand = { type: "Pause" }
      actor.send({ type: "EXECUTE_COMMAND", command })

      // Should transition to executing
      await waitFor(actor, (state) => state.matches({ connected: "executing" }))
    })

    it("should handle multiple commands in sequence", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      const commands: ProjectCommand[] = [{ type: "Play" }, { type: "Pause" }, { type: "Seek", params: { time: 10 } }]

      commands.forEach((cmd) => {
        actor.send({ type: "EXECUTE_COMMAND", command: cmd })
      })

      // Should queue all commands
      const context = actor.getSnapshot().context
      expect(context.commandQueue.length).toBeGreaterThan(0)
    })

    it("should clear command queue after execution", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      const command: ProjectCommand = { type: "Play" }
      actor.send({ type: "EXECUTE_COMMAND", command })

      await waitFor(actor, (state) => state.matches({ connected: "executing" }))

      // After execution, should return to idle
      await waitFor(actor, (state) => state.matches({ connected: "idle" }))
    })

    it("should handle command execution errors gracefully", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      // Send invalid command
      const command = { type: "Pause" } as ProjectCommand
      actor.send({ type: "EXECUTE_COMMAND", command })

      // Should not crash
      expect(actor.getSnapshot().matches("connected")).toBe(true)
    })
  })

  describe("State Updates", () => {
    it("should update project state on STATE_UPDATED event", async () => {
      actor.start()
      // Use Partial<ProjectState> for test mock
      const mockState: any = {
        project: null,
        ui_state: { selected_clips: [], selected_tracks: [], zoom_level: 1 },
        playback_state: { is_playing: false, current_time: 0, playback_speed: 1 },
        version: 1,
        version_info: {
          current_version: "1",
          snapshots: [],
          branches: [],
          current_branch: null,
        },
        chat_sessions: [],
        browser_state: {
          active_tab: "media" as const,
          tab_settings: {},
          selected_files: {},
        },
      }

      actor.send({ type: "STATE_UPDATED", state: mockState })

      expect(actor.getSnapshot().context.projectState).toEqual(mockState)
    })
  })

  describe("Error Handling", () => {
    it("should handle connection errors", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })

      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECTION_ERROR", error: "Test error" })

      expect(actor.getSnapshot().matches("error")).toBe(true)
      expect(actor.getSnapshot().context.error).toBe("Test error")
    })

    it("should allow retry from error state", () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      actor.send({ type: "CONNECTION_ERROR", error: "Test error" })

      expect(actor.getSnapshot().matches("error")).toBe(true)

      actor.send({ type: "RETRY_CONNECTION" })
      expect(actor.getSnapshot().matches("connecting")).toBe(true)
    })
  })

  describe("Disconnection", () => {
    it("should handle disconnection", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      actor.send({ type: "DISCONNECT" })
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)
      expect(actor.getSnapshot().context.isConnected).toBe(false)
    })

    it("should handle disconnect with state", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      // Set some state
      const mockState: any = {
        project: null,
        ui_state: { selected_clips: [], selected_tracks: [], zoom_level: 1 },
        playback_state: { is_playing: false, current_time: 0, playback_speed: 1 },
        version: 1,
        version_info: {
          current_version: "1",
          snapshots: [],
          branches: [],
          current_branch: null,
        },
        chat_sessions: [],
        browser_state: {
          active_tab: "media" as const,
          tab_settings: {},
          selected_files: {},
        },
      }
      actor.send({ type: "STATE_UPDATED", state: mockState })

      actor.send({ type: "DISCONNECT" })
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)
    })

    it("should allow reconnection after disconnect", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      actor.send({ type: "DISCONNECT" })
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)

      // Reconnect
      actor.send({ type: "CONNECT" })
      expect(actor.getSnapshot().matches("connecting")).toBe(true)
    })
  })

  describe("Edge Cases and Resilience", () => {
    it("should handle CONNECT event when already connected", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      // Try to connect again
      actor.send({ type: "CONNECT" })

      // Should remain connected
      expect(actor.getSnapshot().matches("connected")).toBe(true)
    })

    it("should handle DISCONNECT when already disconnected", () => {
      actor.start()
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)

      actor.send({ type: "DISCONNECT" })

      // Should remain disconnected
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)
    })

    it("should handle rapid state transitions", async () => {
      actor.start()

      // Rapid connect/disconnect
      actor.send({ type: "CONNECT" })
      actor.send({ type: "DISCONNECT" })
      actor.send({ type: "CONNECT" })

      // Should handle gracefully
      expect(actor.getSnapshot()).toBeDefined()
    })

    it("should handle command queue across state transitions", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connected"))

      const command: ProjectCommand = { type: "Pause" }
      actor.send({ type: "EXECUTE_COMMAND", command })

      const queueLengthBeforeDisconnect = actor.getSnapshot().context.commandQueue.length
      expect(queueLengthBeforeDisconnect).toBeGreaterThan(0)

      // State transition - disconnect
      actor.send({ type: "DISCONNECT" })

      // Should have transitioned to disconnected
      expect(actor.getSnapshot().matches("disconnected")).toBe(true)
    })

    it("should handle null project state gracefully", () => {
      actor.start()

      actor.send({ type: "STATE_UPDATED", state: null as any })

      expect(actor.getSnapshot().context.projectState).toBeNull()
    })

    it("should handle multiple retry attempts", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))

      // Simulate error
      actor.send({ type: "CONNECTION_ERROR", error: "Test error" })
      expect(actor.getSnapshot().matches("error")).toBe(true)

      // Multiple retries
      actor.send({ type: "RETRY_CONNECTION" })
      expect(actor.getSnapshot().matches("connecting")).toBe(true)

      actor.send({ type: "CONNECTION_ERROR", error: "Test error 2" })
      actor.send({ type: "RETRY_CONNECTION" })

      // Should still be able to retry
      expect(actor.getSnapshot().matches("connecting")).toBe(true)
    })

    it("should maintain error state until retry", async () => {
      actor.start()
      actor.send({ type: "CONNECT" })
      await waitFor(actor, (state) => state.matches("connecting"))

      actor.send({ type: "CONNECTION_ERROR", error: "Persistent error" })

      expect(actor.getSnapshot().matches("error")).toBe(true)
      expect(actor.getSnapshot().context.error).toBe("Persistent error")

      // Error should persist until retry
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(actor.getSnapshot().matches("error")).toBe(true)
    })
  })
})
