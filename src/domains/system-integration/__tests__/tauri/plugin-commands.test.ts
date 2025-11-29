/**
 * Tests for Plugin Tauri Commands
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { sendPluginCommand } from "../../tauri/plugin-commands"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("Plugin Tauri Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("sendPluginCommand", () => {
    it("should invoke send_plugin_command with correct parameters", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        command_id: "cmd-123",
        success: true,
        data: { result: "test" },
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("test-plugin", "testCommand", { param1: "value1" })

      expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
        pluginId: "test-plugin",
        command: "testCommand",
        params: { param1: "value1" },
      })
      expect(result).toEqual(mockResponse)
    })

    it("should send command without parameters", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        command_id: "cmd-124",
        success: true,
        data: null,
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("test-plugin", "simpleCommand")

      expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
        pluginId: "test-plugin",
        command: "simpleCommand",
        params: {},
      })
      expect(result).toEqual(mockResponse)
    })

    it("should handle successful command with data", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockData = {
        status: "active",
        version: "1.0.0",
        capabilities: ["audio", "video"],
      }

      const mockResponse = {
        command_id: "cmd-125",
        success: true,
        data: mockData,
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("media-plugin", "getInfo")

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    it("should handle failed command", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        command_id: "cmd-126",
        success: false,
        error: "Command execution failed",
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand("test-plugin", "failingCommand")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Command execution failed")
    })

    it("should handle complex parameter objects", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const complexParams = {
        nested: {
          value: 123,
          array: [1, 2, 3],
        },
        string: "test",
        boolean: true,
      }

      const mockResponse = {
        command_id: "cmd-127",
        success: true,
        data: { processed: true },
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      await sendPluginCommand("test-plugin", "complexCommand", complexParams)

      expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
        pluginId: "test-plugin",
        command: "complexCommand",
        params: complexParams,
      })
    })

    it("should handle generic type parameter", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      interface CustomData {
        customField: string
        customNumber: number
      }

      const mockResponse = {
        command_id: "cmd-128",
        success: true,
        data: {
          customField: "value",
          customNumber: 42,
        },
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await sendPluginCommand<CustomData>("test-plugin", "typedCommand")

      expect(result.data?.customField).toBe("value")
      expect(result.data?.customNumber).toBe(42)
    })

    it("should throw error on backend failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Plugin not found"))

      await expect(sendPluginCommand("missing-plugin", "test")).rejects.toThrow("Plugin not found")
    })

    it("should handle different plugin IDs", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const plugins = ["audio-plugin", "video-plugin", "effects-plugin", "export-plugin"]

      for (const pluginId of plugins) {
        mockedInvoke.mockResolvedValueOnce({
          command_id: `cmd-${pluginId}`,
          success: true,
        })

        const result = await sendPluginCommand(pluginId, "ping")

        expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
          pluginId,
          command: "ping",
          params: {},
        })
        expect(result.success).toBe(true)
      }
    })

    it("should handle different command names", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const commands = ["init", "start", "stop", "reset", "getState", "updateConfig"]

      for (const command of commands) {
        mockedInvoke.mockResolvedValueOnce({
          command_id: `cmd-${command}`,
          success: true,
        })

        await sendPluginCommand("test-plugin", command)

        expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
          pluginId: "test-plugin",
          command,
          params: {},
        })
      }
    })
  })

  describe("Error Handling", () => {
    it("should handle Tauri IPC errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("IPC communication error"))

      await expect(sendPluginCommand("test-plugin", "command")).rejects.toThrow("IPC communication error")
    })

    it("should handle plugin not loaded errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Plugin not loaded"))

      await expect(sendPluginCommand("unloaded-plugin", "command")).rejects.toThrow("Plugin not loaded")
    })

    it("should handle invalid command errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Unknown command"))

      await expect(sendPluginCommand("test-plugin", "invalidCommand")).rejects.toThrow("Unknown command")
    })

    it("should handle timeout errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Command timeout"))

      await expect(sendPluginCommand("slow-plugin", "slowCommand")).rejects.toThrow("Command timeout")
    })

    it("should handle backend not available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Backend not initialized"))

      await expect(sendPluginCommand("test-plugin", "command")).rejects.toThrow("Backend not initialized")
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty plugin ID", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Invalid plugin ID"))

      await expect(sendPluginCommand("", "command")).rejects.toThrow("Invalid plugin ID")
    })

    it("should handle empty command name", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Invalid command name"))

      await expect(sendPluginCommand("test-plugin", "")).rejects.toThrow("Invalid command name")
    })

    it("should handle null parameters", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        command_id: "cmd-null",
        success: true,
      })

      await sendPluginCommand("test-plugin", "command", null as any)

      expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
        pluginId: "test-plugin",
        command: "command",
        params: null,
      })
    })

    it("should handle very large parameter objects", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const largeParams = {
        data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
      }

      mockedInvoke.mockResolvedValue({
        command_id: "cmd-large",
        success: true,
      })

      await sendPluginCommand("test-plugin", "bulkCommand", largeParams)

      expect(mockedInvoke).toHaveBeenCalledWith("send_plugin_command", {
        pluginId: "test-plugin",
        command: "bulkCommand",
        params: largeParams,
      })
    })

    it("should handle concurrent commands to same plugin", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke
        .mockResolvedValueOnce({ command_id: "cmd-1", success: true })
        .mockResolvedValueOnce({ command_id: "cmd-2", success: true })
        .mockResolvedValueOnce({ command_id: "cmd-3", success: true })

      const [result1, result2, result3] = await Promise.all([
        sendPluginCommand("test-plugin", "command1"),
        sendPluginCommand("test-plugin", "command2"),
        sendPluginCommand("test-plugin", "command3"),
      ])

      expect(result1.command_id).toBe("cmd-1")
      expect(result2.command_id).toBe("cmd-2")
      expect(result3.command_id).toBe("cmd-3")
    })

    it("should handle concurrent commands to different plugins", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke
        .mockResolvedValueOnce({ command_id: "cmd-plugin1", success: true })
        .mockResolvedValueOnce({ command_id: "cmd-plugin2", success: true })
        .mockResolvedValueOnce({ command_id: "cmd-plugin3", success: true })

      const [result1, result2, result3] = await Promise.all([
        sendPluginCommand("plugin-1", "command"),
        sendPluginCommand("plugin-2", "command"),
        sendPluginCommand("plugin-3", "command"),
      ])

      expect(result1.command_id).toBe("cmd-plugin1")
      expect(result2.command_id).toBe("cmd-plugin2")
      expect(result3.command_id).toBe("cmd-plugin3")
    })
  })

  describe("Response Structure", () => {
    it("should return response with command_id", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        command_id: "unique-id-123",
        success: true,
      })

      const result = await sendPluginCommand("test-plugin", "command")

      expect(result.command_id).toBe("unique-id-123")
    })

    it("should return response with success flag", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        command_id: "cmd-1",
        success: true,
      })

      const result = await sendPluginCommand("test-plugin", "command")

      expect(result).toHaveProperty("success")
      expect(result.success).toBe(true)
    })

    it("should handle response with optional data field", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        command_id: "cmd-1",
        success: true,
        data: { result: "test" },
      })

      const result = await sendPluginCommand("test-plugin", "command")

      expect(result.data).toEqual({ result: "test" })
    })

    it("should handle response with optional error field", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        command_id: "cmd-1",
        success: false,
        error: "Something went wrong",
      })

      const result = await sendPluginCommand("test-plugin", "command")

      expect(result.error).toBe("Something went wrong")
    })

    it("should handle response with both data and error fields", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        command_id: "cmd-1",
        success: false,
        data: { partial: "result" },
        error: "Partial failure",
      })

      const result = await sendPluginCommand("test-plugin", "command")

      expect(result.data).toEqual({ partial: "result" })
      expect(result.error).toBe("Partial failure")
    })
  })

  describe("Integration Scenarios", () => {
    it("should handle plugin initialization flow", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      // Check if plugin is loaded
      mockedInvoke.mockResolvedValueOnce({
        command_id: "ping-1",
        success: true,
      })

      await sendPluginCommand("media-plugin", "ping")

      // Initialize plugin
      mockedInvoke.mockResolvedValueOnce({
        command_id: "init-1",
        success: true,
        data: { initialized: true },
      })

      const initResult = await sendPluginCommand("media-plugin", "init", {
        quality: "high",
      })

      expect(initResult.success).toBe(true)
    })

    it("should handle plugin state query", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockState = {
        status: "active",
        version: "1.2.3",
        capabilities: ["encode", "decode"],
      }

      mockedInvoke.mockResolvedValue({
        command_id: "state-1",
        success: true,
        data: mockState,
      })

      const result = await sendPluginCommand("codec-plugin", "getState")

      expect(result.data).toEqual(mockState)
    })

    it("should handle plugin configuration update", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const config = {
        bitrate: 5000000,
        preset: "slow",
        codec: "h264",
      }

      mockedInvoke.mockResolvedValue({
        command_id: "config-1",
        success: true,
        data: { applied: true },
      })

      const result = await sendPluginCommand("encoder-plugin", "updateConfig", config)

      expect(result.success).toBe(true)
      expect(result.data?.applied).toBe(true)
    })
  })
})
