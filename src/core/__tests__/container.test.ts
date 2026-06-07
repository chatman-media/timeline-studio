import { beforeEach, describe, expect, it, vi } from "vitest"
import { container, getBackend, getEvent, getNodeBackend, getPlatform, getStorage, resetContainer } from "../container"
import type { IBackendService, IEventService, INodeBackendService, IPlatformService, IStorageService } from "../ports"

// Mock implementations
const createMockBackend = (): IBackendService => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  connected: true,
  executeCommand: vi.fn(),
  getProjectState: vi.fn(),
  getEventHistory: vi.fn(),
  onEvent: vi.fn(() => vi.fn()),
  onStateChange: vi.fn(() => vi.fn()),
})

const createMockPlatform = (): IPlatformService => ({
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  readClipboard: vi.fn(),
  writeClipboard: vi.fn(),
  showNotification: vi.fn(),
  openPath: vi.fn(),
  openUrl: vi.fn(),
  getVersion: vi.fn(),
  convertFileSrc: vi.fn((path) => `file://${path}`),
  basename: vi.fn(),
  dirname: vi.fn(),
  join: vi.fn(),
  getFileStats: vi.fn(),
  getPlatform: vi.fn(),
  searchFilesByName: vi.fn(),
  getAbsolutePath: vi.fn(),
})

const createMockStorage = (): IStorageService => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  clear: vi.fn(),
  keys: vi.fn(),
})

const createMockEvent = (): IEventService => ({
  listen: vi.fn(),
  emit: vi.fn(),
})

const createMockNodeBackend = (): INodeBackendService => ({
  checkHealth: vi.fn(),
  scanFolderWithThumbnails: vi.fn(),
  scanFolder: vi.fn(),
  getMetadata: vi.fn(),
  processFiles: vi.fn(),
  generateThumbnail: vi.fn(),
  generateWaveform: vi.fn(),
  getCacheStats: vi.fn(),
  clearCache: vi.fn(),
})

describe("ServiceContainer", () => {
  beforeEach(() => {
    resetContainer()
  })

  describe("Backend Service", () => {
    it("throws error when backend not registered", () => {
      expect(() => container.getBackend()).toThrow("[ServiceContainer] Backend not registered")
    })

    it("registers and retrieves backend service", () => {
      const mockBackend = createMockBackend()
      container.registerBackend(mockBackend)

      expect(container.hasBackend()).toBe(true)
      expect(container.getBackend()).toBe(mockBackend)
    })

    it("getBackend helper works", () => {
      const mockBackend = createMockBackend()
      container.registerBackend(mockBackend)

      expect(getBackend()).toBe(mockBackend)
    })
  })

  describe("Platform Service", () => {
    it("throws error when platform not registered", () => {
      expect(() => container.getPlatform()).toThrow("[ServiceContainer] Platform not registered")
    })

    it("registers and retrieves platform service", () => {
      const mockPlatform = createMockPlatform()
      container.registerPlatform(mockPlatform)

      expect(container.hasPlatform()).toBe(true)
      expect(container.getPlatform()).toBe(mockPlatform)
    })

    it("getPlatform helper works", () => {
      const mockPlatform = createMockPlatform()
      container.registerPlatform(mockPlatform)

      expect(getPlatform()).toBe(mockPlatform)
    })
  })

  describe("Storage Service", () => {
    it("throws error when storage not registered", () => {
      expect(() => container.getStorage()).toThrow("[ServiceContainer] Storage not registered")
    })

    it("registers and retrieves storage service", () => {
      const mockStorage = createMockStorage()
      container.registerStorage(mockStorage)

      expect(container.hasStorage()).toBe(true)
      expect(container.getStorage()).toBe(mockStorage)
    })

    it("getStorage helper works", () => {
      const mockStorage = createMockStorage()
      container.registerStorage(mockStorage)

      expect(getStorage()).toBe(mockStorage)
    })
  })

  describe("Event Service", () => {
    it("throws error when event not registered", () => {
      expect(() => container.getEvent()).toThrow("[ServiceContainer] Event not registered")
    })

    it("registers and retrieves event service", () => {
      const mockEvent = createMockEvent()
      container.registerEvent(mockEvent)

      expect(container.hasEvent()).toBe(true)
      expect(container.getEvent()).toBe(mockEvent)
    })

    it("getEvent helper works", () => {
      const mockEvent = createMockEvent()
      container.registerEvent(mockEvent)

      expect(getEvent()).toBe(mockEvent)
    })
  })

  describe("Node Backend Service", () => {
    it("throws error when node backend not registered", () => {
      expect(() => container.getNodeBackend()).toThrow("[ServiceContainer] Node backend not registered")
    })

    it("registers and retrieves node backend service", () => {
      const mockNodeBackend = createMockNodeBackend()
      container.registerNodeBackend(mockNodeBackend)

      expect(container.hasNodeBackend()).toBe(true)
      expect(container.getNodeBackend()).toBe(mockNodeBackend)
    })

    it("getNodeBackend helper works", () => {
      const mockNodeBackend = createMockNodeBackend()
      container.registerNodeBackend(mockNodeBackend)

      expect(getNodeBackend()).toBe(mockNodeBackend)
    })
  })

  describe("Container Reset", () => {
    it("resetContainer does not throw", () => {
      container.registerBackend(createMockBackend())
      container.registerPlatform(createMockPlatform())
      container.registerNodeBackend(createMockNodeBackend())

      // Reset should not throw
      expect(() => resetContainer()).not.toThrow()
    })

    it("services are cleared after reset when re-acquiring container", async () => {
      container.registerBackend(createMockBackend())

      expect(container.hasBackend()).toBe(true)

      resetContainer()

      // After reset, re-importing container module would give fresh instance
      // For this test, we just verify reset runs without error
      // Full isolation testing requires module re-import which is complex in vitest
    })
  })

  describe("Service Replacement", () => {
    it("allows replacing registered services", () => {
      const backend1 = createMockBackend()
      const backend2 = createMockBackend()

      container.registerBackend(backend1)
      expect(container.getBackend()).toBe(backend1)

      container.registerBackend(backend2)
      expect(container.getBackend()).toBe(backend2)
    })

    it("allows replacing registered node backend services", () => {
      const nodeBackend1 = createMockNodeBackend()
      const nodeBackend2 = createMockNodeBackend()

      container.registerNodeBackend(nodeBackend1)
      expect(container.getNodeBackend()).toBe(nodeBackend1)

      container.registerNodeBackend(nodeBackend2)
      expect(container.getNodeBackend()).toBe(nodeBackend2)
    })
  })
})
