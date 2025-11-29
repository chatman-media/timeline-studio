/**
 * Tests for Update Tauri Commands
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { checkForUpdate, downloadAndInstallUpdate } from "../../tauri/update-commands"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("Update Tauri Commands", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("checkForUpdate", () => {
    it("should invoke check_for_update command", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await checkForUpdate()

      expect(mockedInvoke).toHaveBeenCalledWith("check_for_update")
      expect(result).toEqual(mockResponse)
    })

    it("should return update not available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        available: false,
        current_version: "2.1.0",
        update_info: undefined,
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await checkForUpdate()

      expect(result.available).toBe(false)
      expect(result.current_version).toBe("2.1.0")
      expect(result.update_info).toBeUndefined()
    })

    it("should return update available with update info", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const updateInfo = {
        version: "2.0.0",
        pub_date: "2025-01-01",
        notes: "New version available",
        signature: "mock-signature",
        url: "https://example.com/update",
      }

      const mockResponse = {
        available: true,
        current_version: "1.0.0",
        update_info: updateInfo,
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await checkForUpdate()

      expect(result.available).toBe(true)
      expect(result.current_version).toBe("1.0.0")
      expect(result.update_info).toEqual(updateInfo)
    })

    it("should include version number in update info", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const mockResponse = {
        available: true,
        current_version: "1.5.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2025-01-15",
          notes: "Bug fixes and improvements",
          signature: "sig",
          url: "https://example.com/v2.0.0",
        },
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await checkForUpdate()

      expect(result.update_info?.version).toBe("2.0.0")
    })

    it("should include release notes", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const releaseNotes = "New features:\n- Feature 1\n- Feature 2\n\nBug fixes:\n- Fix 1\n- Fix 2"

      const mockResponse = {
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "1.1.0",
          pub_date: "2025-01-01",
          notes: releaseNotes,
          signature: "sig",
          url: "https://example.com/update",
        },
      }

      mockedInvoke.mockResolvedValue(mockResponse)

      const result = await checkForUpdate()

      expect(result.update_info?.notes).toBe(releaseNotes)
    })

    it("should throw error on check failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Network error"))

      await expect(checkForUpdate()).rejects.toThrow("Network error")
    })

    it("should handle timeout errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Request timeout"))

      await expect(checkForUpdate()).rejects.toThrow("Request timeout")
    })

    it("should handle backend not available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Backend not available"))

      await expect(checkForUpdate()).rejects.toThrow("Backend not available")
    })
  })

  describe("downloadAndInstallUpdate", () => {
    it("should invoke download_and_install_update command", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue(undefined)

      await downloadAndInstallUpdate()

      expect(mockedInvoke).toHaveBeenCalledWith("download_and_install_update")
    })

    it("should resolve without return value", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue(undefined)

      const result = await downloadAndInstallUpdate()

      expect(result).toBeUndefined()
    })

    it("should throw error on download failure", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Download failed"))

      await expect(downloadAndInstallUpdate()).rejects.toThrow("Download failed")
    })

    it("should handle network errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Connection lost"))

      await expect(downloadAndInstallUpdate()).rejects.toThrow("Connection lost")
    })

    it("should handle permission errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Permission denied"))

      await expect(downloadAndInstallUpdate()).rejects.toThrow("Permission denied")
    })

    it("should handle disk space errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Insufficient disk space"))

      await expect(downloadAndInstallUpdate()).rejects.toThrow("Insufficient disk space")
    })

    it("should handle installation errors", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Installation failed"))

      await expect(downloadAndInstallUpdate()).rejects.toThrow("Installation failed")
    })
  })

  describe("Update Flow Integration", () => {
    it("should check and download update sequentially", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      // First check for updates
      const updateInfo = {
        version: "2.0.0",
        pub_date: "2025-01-01",
        notes: "Update available",
        signature: "sig",
        url: "https://example.com/update",
      }

      mockedInvoke.mockResolvedValueOnce({
        available: true,
        current_version: "1.0.0",
        update_info: updateInfo,
      })

      const checkResult = await checkForUpdate()

      expect(checkResult.available).toBe(true)

      // Then download and install
      mockedInvoke.mockResolvedValueOnce(undefined)

      await downloadAndInstallUpdate()

      expect(mockedInvoke).toHaveBeenCalledTimes(2)
      expect(mockedInvoke).toHaveBeenNthCalledWith(1, "check_for_update")
      expect(mockedInvoke).toHaveBeenNthCalledWith(2, "download_and_install_update")
    })

    it("should not download if no update available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValueOnce({
        available: false,
        current_version: "2.0.0",
        update_info: undefined,
      })

      const checkResult = await checkForUpdate()

      if (!checkResult.available) {
        // Don't download
        expect(mockedInvoke).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe("Error Handling", () => {
    it("should handle Tauri IPC errors for check", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("IPC communication error"))

      await expect(checkForUpdate()).rejects.toThrow("IPC communication error")
    })

    it("should handle Tauri IPC errors for download", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("IPC communication error"))

      await expect(downloadAndInstallUpdate()).rejects.toThrow("IPC communication error")
    })

    it("should handle updater not available", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockRejectedValue(new Error("Updater not available"))

      await expect(checkForUpdate()).rejects.toThrow("Updater not available")
    })
  })

  describe("Edge Cases", () => {
    it("should handle concurrent check requests", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      const [result1, result2, result3] = await Promise.all([checkForUpdate(), checkForUpdate(), checkForUpdate()])

      expect(result1).toEqual(result2)
      expect(result2).toEqual(result3)
      expect(mockedInvoke).toHaveBeenCalledTimes(3)
    })

    it("should handle update info with all fields populated", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      const completeUpdateInfo = {
        version: "3.0.0-beta.1",
        pub_date: "2025-02-15T14:30:00Z",
        notes: "Full release notes with markdown\n\n## Features\n- Feature 1\n- Feature 2",
        signature: "base64encodedSignature==",
        url: "https://releases.example.com/app-3.0.0-beta.1.tar.gz",
      }

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "2.9.0",
        update_info: completeUpdateInfo,
      })

      const result = await checkForUpdate()

      expect(result.update_info).toEqual(completeUpdateInfo)
    })

    it("should handle pre-release versions", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0-rc.1",
          pub_date: "2025-01-20",
          notes: "Release candidate",
          signature: "sig",
          url: "https://example.com/rc",
        },
      })

      const result = await checkForUpdate()

      expect(result.update_info?.version).toBe("2.0.0-rc.1")
    })

    it("should handle patch versions", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "1.0.1",
          pub_date: "2025-01-05",
          notes: "Bug fix release",
          signature: "sig",
          url: "https://example.com/patch",
        },
      })

      const result = await checkForUpdate()

      expect(result.update_info?.version).toBe("1.0.1")
    })

    it("should handle major version updates", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "1.9.9",
        update_info: {
          version: "2.0.0",
          pub_date: "2025-02-01",
          notes: "Major update with breaking changes",
          signature: "sig",
          url: "https://example.com/v2",
        },
      })

      const result = await checkForUpdate()

      expect(result.update_info?.version).toBe("2.0.0")
    })

    it("should handle malformed update info", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          // Missing other fields
        },
      })

      const result = await checkForUpdate()

      expect(result.update_info?.version).toBe("2.0.0")
      expect(result.update_info?.pub_date).toBeUndefined()
    })
  })

  describe("Response Structure", () => {
    it("should return response with available flag", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: false,
        current_version: "1.0.0",
        update_info: undefined,
      })

      const result = await checkForUpdate()

      expect(result).toHaveProperty("available")
      expect(typeof result.available).toBe("boolean")
    })

    it("should return response with current_version", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: false,
        current_version: "1.2.3",
        update_info: undefined,
      })

      const result = await checkForUpdate()

      expect(result).toHaveProperty("current_version")
      expect(typeof result.current_version).toBe("string")
    })

    it("should return response with optional update_info", async () => {
      const { invoke } = await import("@tauri-apps/api/core")
      const mockedInvoke = vi.mocked(invoke)

      mockedInvoke.mockResolvedValue({
        available: true,
        current_version: "1.0.0",
        update_info: {
          version: "2.0.0",
          pub_date: "2025-01-01",
          notes: "Update",
          signature: "sig",
          url: "https://example.com",
        },
      })

      const result = await checkForUpdate()

      expect(result).toHaveProperty("update_info")
      expect(result.update_info).toBeDefined()
    })
  })
})
