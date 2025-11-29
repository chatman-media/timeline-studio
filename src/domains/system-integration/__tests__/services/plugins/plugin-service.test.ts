/**
 * Tests for Plugin Service
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { sendPluginCommand, isPluginLoaded } from "../../../services/plugins/plugin-service"

// Mock Tauri plugin commands
vi.mock("../../../tauri/plugin-commands", () => ({
  sendPluginCommand: vi.fn(),
}))

describe("PluginService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("sendPluginCommand", () => {
    it("should send command to plugin via Tauri layer", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      const mockResponse = {
        command_id: "cmd-123",
        success: true,
        data: { result: "test" },
      }

      mockedTauriCommand.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("test-plugin", "testCommand", { param1: "value1" })

      expect(mockedTauriCommand).toHaveBeenCalledWith("test-plugin", "testCommand", { param1: "value1" })
      expect(result).toEqual(mockResponse)
    })

    it("should send command without parameters", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      const mockResponse = {
        command_id: "cmd-124",
        success: true,
        data: null,
      }

      mockedTauriCommand.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("test-plugin", "simpleCommand")

      expect(mockedTauriCommand).toHaveBeenCalledWith("test-plugin", "simpleCommand", {})
      expect(result).toEqual(mockResponse)
    })

    it("should handle plugin command errors", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      mockedTauriCommand.mockRejectedValue(new Error("Plugin not found"))

      await expect(sendPluginCommand("missing-plugin", "test")).rejects.toThrow("Plugin not found")
    })

    it("should handle failed command response", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      const mockResponse = {
        command_id: "cmd-125",
        success: false,
        error: "Command execution failed",
      }

      mockedTauriCommand.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("test-plugin", "failingCommand")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Command execution failed")
    })

    it("should handle complex parameter objects", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      const complexParams = {
        nested: {
          value: 123,
          array: [1, 2, 3],
        },
        string: "test",
        boolean: true,
      }

      const mockResponse = {
        command_id: "cmd-126",
        success: true,
        data: { processed: true },
      }

      mockedTauriCommand.mockResolvedValue(mockResponse)

      await sendPluginCommand("test-plugin", "complexCommand", complexParams)

      expect(mockedTauriCommand).toHaveBeenCalledWith("test-plugin", "complexCommand", complexParams)
    })

    it("should preserve generic type parameter", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      interface CustomResponse {
        customField: string
        customNumber: number
      }

      const mockResponse = {
        command_id: "cmd-127",
        success: true,
        data: {
          customField: "value",
          customNumber: 42,
        },
      }

      mockedTauriCommand.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand<CustomResponse>("test-plugin", "typedCommand")

      expect(result.data?.customField).toBe("value")
      expect(result.data?.customNumber).toBe(42)
    })
  })

  describe("isPluginLoaded", () => {
    it("should return true if plugin responds to ping", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      mockedTauriCommand.mockResolvedValue({
        command_id: "ping-1",
        success: true,
      })

      const result = await isPluginLoaded("test-plugin")

      expect(mockedTauriCommand).toHaveBeenCalledWith("test-plugin", "ping", {})
      expect(result).toBe(true)
    })

    it("should return false if plugin ping fails", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      mockedTauriCommand.mockResolvedValue({
        command_id: "ping-2",
        success: false,
        error: "Plugin not loaded",
      })

      const result = await isPluginLoaded("missing-plugin")

      expect(result).toBe(false)
    })

    it("should return false if ping throws error", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      mockedTauriCommand.mockRejectedValue(new Error("Connection failed"))

      const result = await isPluginLoaded("error-plugin")

      expect(result).toBe(false)
    })

    it("should check multiple plugins independently", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      // First plugin succeeds
      mockedTauriCommand.mockResolvedValueOnce({
        command_id: "ping-3",
        success: true,
      })

      // Second plugin fails
      mockedTauriCommand.mockResolvedValueOnce({
        command_id: "ping-4",
        success: false,
      })

      const result1 = await isPluginLoaded("plugin-1")
      const result2 = await isPluginLoaded("plugin-2")

      expect(result1).toBe(true)
      expect(result2).toBe(false)
    })
  })

  describe("Error Scenarios", () => {
    it("should handle network timeout errors", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      mockedTauriCommand.mockRejectedValue(new Error("Timeout waiting for response"))

      await expect(sendPluginCommand("slow-plugin", "slowCommand")).rejects.toThrow("Timeout waiting for response")
    })

    it("should handle invalid plugin IDs", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      mockedTauriCommand.mockRejectedValue(new Error("Invalid plugin ID"))

      await expect(sendPluginCommand("", "command")).rejects.toThrow("Invalid plugin ID")
    })

    it("should handle malformed responses", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      // Response without command_id or success
      const malformedResponse = {} as any

      mockedTauriCommand.mockResolvedValue(malformedResponse)

      const result = await sendPluginCommand("test-plugin", "command")

      expect(result).toEqual(malformedResponse)
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle plugin state queries", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      const mockState = {
        initialized: true,
        version: "1.0.0",
        capabilities: ["audio", "video"],
      }

      mockedTauriCommand.mockResolvedValue({
        command_id: "state-1",
        success: true,
        data: mockState,
      })

      const result = await sendPluginCommand("media-plugin", "getState")

      expect(result.data).toEqual(mockState)
    })

    it("should handle plugin configuration updates", async () => {
      const { sendPluginCommand: sendPluginCommandTauri } = await import("../../../tauri/plugin-commands")
      const mockedTauriCommand = vi.mocked(sendPluginCommandTauri)

      const config = {
        quality: "high",
        fps: 60,
      }

      mockedTauriCommand.mockResolvedValue({
        command_id: "config-1",
        success: true,
        data: { applied: true },
      })

      const result = await sendPluginCommand("encoder-plugin", "updateConfig", config)

      expect(mockedTauriCommand).toHaveBeenCalledWith("encoder-plugin", "updateConfig", config)
      expect(result.success).toBe(true)
    })
  })
})
