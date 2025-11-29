import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ProjectCommand, ProjectEvent, ProjectState } from "@/core/types"
import { TauriBackendService } from "../backend"

// Mock BackendSync
const mockBackendSync = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  executeCommand: vi.fn(),
  getProjectState: vi.fn(),
  getEventHistory: vi.fn(),
  onEvent: vi.fn(),
  onStateChange: vi.fn(),
}

vi.mock("../backend-sync", () => ({
  getBackendSync: () => mockBackendSync,
}))

describe("TauriBackendService", () => {
  let service: TauriBackendService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TauriBackendService()
  })

  describe("connected", () => {
    it("returns backend sync connected state", () => {
      mockBackendSync.connected = true
      expect(service.connected).toBe(true)

      mockBackendSync.connected = false
      expect(service.connected).toBe(false)
    })
  })

  describe("connect", () => {
    it("delegates to backend sync", async () => {
      mockBackendSync.connect.mockResolvedValueOnce(undefined)
      await service.connect()
      expect(mockBackendSync.connect).toHaveBeenCalledTimes(1)
    })
  })

  describe("disconnect", () => {
    it("delegates to backend sync", async () => {
      mockBackendSync.disconnect.mockResolvedValueOnce(undefined)
      await service.disconnect()
      expect(mockBackendSync.disconnect).toHaveBeenCalledTimes(1)
    })
  })

  describe("executeCommand", () => {
    it("delegates to backend sync with command", async () => {
      const command: ProjectCommand = {
        type: "CreateProject",
        payload: { name: "Test" },
      }
      const result = { success: true, version: 1 }

      mockBackendSync.executeCommand.mockResolvedValueOnce(result)

      const response = await service.executeCommand(command)

      expect(mockBackendSync.executeCommand).toHaveBeenCalledWith(command)
      expect(response).toEqual(result)
    })
  })

  describe("getProjectState", () => {
    it("returns project state from backend sync", async () => {
      const state: ProjectState = {
        version: 1,
        project: { name: "Test", timeline: { tracks: [] } },
      } as any

      mockBackendSync.getProjectState.mockResolvedValueOnce(state)

      const response = await service.getProjectState()

      expect(mockBackendSync.getProjectState).toHaveBeenCalledTimes(1)
      expect(response).toEqual(state)
    })

    it("returns null when no state", async () => {
      mockBackendSync.getProjectState.mockResolvedValueOnce(null)

      const response = await service.getProjectState()

      expect(response).toBeNull()
    })
  })

  describe("getEventHistory", () => {
    it("delegates to backend sync without version", async () => {
      const events = [{ event: { type: "ProjectCreated" }, version: 1 }] as any

      mockBackendSync.getEventHistory.mockResolvedValueOnce(events)

      const response = await service.getEventHistory()

      expect(mockBackendSync.getEventHistory).toHaveBeenCalledWith(undefined)
      expect(response).toEqual(events)
    })

    it("delegates to backend sync with version", async () => {
      const events = [{ event: { type: "ProjectCreated" }, version: 2 }] as any

      mockBackendSync.getEventHistory.mockResolvedValueOnce(events)

      const response = await service.getEventHistory(1)

      expect(mockBackendSync.getEventHistory).toHaveBeenCalledWith(1)
      expect(response).toEqual(events)
    })
  })

  describe("onEvent", () => {
    it("subscribes to events through backend sync", () => {
      const handler = vi.fn()
      const unsubscribe = vi.fn()

      mockBackendSync.onEvent.mockReturnValueOnce(unsubscribe)

      const result = service.onEvent(handler)

      expect(mockBackendSync.onEvent).toHaveBeenCalledWith(handler)
      expect(result).toBe(unsubscribe)
    })
  })

  describe("onStateChange", () => {
    it("subscribes to state changes through backend sync", () => {
      const handler = vi.fn()
      const unsubscribe = vi.fn()

      mockBackendSync.onStateChange.mockReturnValueOnce(unsubscribe)

      const result = service.onStateChange(handler)

      expect(mockBackendSync.onStateChange).toHaveBeenCalledWith(handler)
      expect(result).toBe(unsubscribe)
    })
  })

  describe("singleton behavior", () => {
    it("uses same BackendSync instance across multiple service instances", () => {
      const service1 = new TauriBackendService()
      const service2 = new TauriBackendService()

      expect(service1.connected).toBe(service2.connected)
    })
  })
})
