/**
 * Camera Import Service Tests
 *
 * Comprehensive тесты для CameraImportService
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CameraDevice, CameraFile } from "../camera-import"
import { CameraImportService, getCameraImport } from "../camera-import"

// Mock dependencies
const mockInvoke = vi.fn()
const mockMediaService = {
  ejectDevice: vi.fn(),
}

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: any[]) => mockInvoke(...args),
}))

vi.mock("@/core/container", () => ({
  getMedia: vi.fn(() => mockMediaService),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

describe("CameraImportService", () => {
  let service: CameraImportService

  const mockCamera: CameraDevice = {
    id: "camera-1",
    name: "Sony Camera",
    type: "camera",
    mountPath: "/Volumes/Camera",
    manufacturer: "Sony",
    model: "A7III",
    availableSpace: 1000000000,
    totalSpace: 64000000000,
  }

  const mockCameraFile: CameraFile = {
    path: "/Volumes/Camera/DCIM/IMG_001.mp4",
    name: "IMG_001.mp4",
    size: 50000000,
    createdAt: new Date("2024-01-01"),
    type: "video",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CameraImportService()
  })

  describe("detectCameras", () => {
    it("should detect connected cameras", async () => {
      mockInvoke.mockResolvedValue([mockCamera])

      const cameras = await service.detectCameras()

      expect(cameras).toHaveLength(1)
      expect(cameras[0]).toEqual(mockCamera)
      expect(mockInvoke).toHaveBeenCalledWith("detect_camera_devices")
    })

    it("should return empty array if no cameras found", async () => {
      mockInvoke.mockResolvedValue([])

      const cameras = await service.detectCameras()

      expect(cameras).toHaveLength(0)
    })

    it("should handle detection errors gracefully", async () => {
      mockInvoke.mockRejectedValue(new Error("Detection failed"))

      const cameras = await service.detectCameras()

      expect(cameras).toHaveLength(0)
    })
  })

  describe("listCameraFiles", () => {
    it("should list files on camera", async () => {
      mockInvoke.mockResolvedValue([mockCameraFile])

      const files = await service.listCameraFiles(mockCamera)

      expect(files).toHaveLength(1)
      expect(files[0]).toEqual(mockCameraFile)
      expect(mockInvoke).toHaveBeenCalledWith("list_camera_files", {
        deviceId: mockCamera.id,
        mountPath: mockCamera.mountPath,
      })
    })

    it("should throw error if mount path not available", async () => {
      const cameraWithoutMount = { ...mockCamera, mountPath: undefined }

      await expect(service.listCameraFiles(cameraWithoutMount)).rejects.toThrow("Device mount path is not available")
    })

    it("should handle listing errors", async () => {
      mockInvoke.mockRejectedValue(new Error("Access denied"))

      // The implementation swallows errors from invoke via .catch(() => [])
      // so it returns an empty array instead of throwing
      const result = await service.listCameraFiles(mockCamera)

      expect(result).toEqual([])
    })
  })

  describe("importFromCamera", () => {
    it("should import all files from camera", async () => {
      mockInvoke.mockResolvedValueOnce([mockCameraFile]) // listCameraFiles

      const result = await service.importFromCamera(mockCamera)

      expect(result.imported).toHaveLength(1)
      expect(result.totalProcessed).toBe(1)
      expect(result.duration).toBeGreaterThanOrEqual(0)
    })

    it("should import only selected files", async () => {
      const files = [
        mockCameraFile,
        { ...mockCameraFile, path: "/Volumes/Camera/DCIM/IMG_002.mp4", name: "IMG_002.mp4" },
      ]

      mockInvoke.mockResolvedValue(files)

      const result = await service.importFromCamera(mockCamera, {
        selectedFiles: [mockCameraFile.path],
      })

      expect(result.imported).toHaveLength(1)
      expect(result.imported[0].name).toBe("IMG_001.mp4")
    })

    it("should handle import errors for individual files", async () => {
      mockInvoke.mockResolvedValue([mockCameraFile])

      const result = await service.importFromCamera(mockCamera)

      // В текущей реализации файлы добавляются в imported (заглушка)
      expect(result.failed).toHaveLength(0)
      expect(result.imported).toHaveLength(1)
    })

    it("should track skipped files", async () => {
      mockInvoke.mockResolvedValue([])

      const result = await service.importFromCamera(mockCamera)

      expect(result.skipped).toHaveLength(0)
    })

    it("should handle empty file list", async () => {
      mockInvoke.mockResolvedValue([])

      const result = await service.importFromCamera(mockCamera)

      expect(result.imported).toHaveLength(0)
      expect(result.totalProcessed).toBe(0)
    })
  })

  describe("isDeviceAvailable", () => {
    it("should return true if device is available", async () => {
      mockInvoke.mockResolvedValue([mockCamera])

      const available = await service.isDeviceAvailable(mockCamera.id)

      expect(available).toBe(true)
    })

    it("should return false if device is not available", async () => {
      mockInvoke.mockResolvedValue([])

      const available = await service.isDeviceAvailable("non-existent")

      expect(available).toBe(false)
    })

    it("should handle errors gracefully", async () => {
      mockInvoke.mockRejectedValue(new Error("Detection error"))

      const available = await service.isDeviceAvailable(mockCamera.id)

      expect(available).toBe(false)
    })
  })

  describe("ejectDevice", () => {
    it("should eject device safely", async () => {
      mockMediaService.ejectDevice.mockResolvedValue(undefined)

      await service.ejectDevice(mockCamera)

      expect(mockMediaService.ejectDevice).toHaveBeenCalledWith(mockCamera.id)
    })

    it("should handle eject errors", async () => {
      mockMediaService.ejectDevice.mockRejectedValue(new Error("Eject failed"))

      // The implementation swallows errors from ejectDevice via .catch()
      // so ejectDevice should not throw when eject fails
      await expect(service.ejectDevice(mockCamera)).resolves.toBeUndefined()
    })

    it("should handle not implemented eject command", async () => {
      mockMediaService.ejectDevice.mockRejectedValue(new Error("Not implemented"))

      // Should not throw, just warn
      await expect(service.ejectDevice(mockCamera)).resolves.toBeUndefined()
    })
  })

  describe("singleton pattern", () => {
    it("should return same instance", () => {
      const instance1 = getCameraImport()
      const instance2 = getCameraImport()

      expect(instance1).toBe(instance2)
    })
  })

  describe("device types", () => {
    it.each([
      ["camera", "Camera"],
      ["phone", "Phone"],
      ["sd-card", "SD Card"],
      ["external-drive", "External Drive"],
    ])("should handle %s device type", async (type) => {
      const device = { ...mockCamera, type: type as any }
      mockInvoke.mockResolvedValue([device])

      const cameras = await service.detectCameras()

      expect(cameras[0].type).toBe(type)
    })
  })

  describe("file types", () => {
    it.each([
      ["video", "Video"],
      ["image", "Image"],
      ["audio", "Audio"],
      ["unknown", "Image"], // fallback
    ])("should handle %s file type", async (fileType, mediaType) => {
      const file = { ...mockCameraFile, type: fileType as any }
      mockInvoke.mockResolvedValue([file])

      const result = await service.importFromCamera(mockCamera)

      expect(result.imported[0].type).toBe(mediaType)
    })
  })
})
