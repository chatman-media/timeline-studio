import { MockPlatformService } from "@timeline-studio/adapters/mock/platform"
import { container, resetContainer } from "@timeline-studio/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AudioFileManager } from "../audio-file-manager"

// Mock HTMLAudioElement
class MockAudioElement {
  src = ""
  crossOrigin = ""
  preload = ""
  private listeners = new Map<string, ((event?: any) => void)[]>()

  addEventListener(event: string, callback: (event?: any) => void, _options?: any) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  removeEventListener(event: string, callback: (event?: any) => void) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index !== -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  load() {
    // Trigger loadedmetadata after a short delay
    setTimeout(() => {
      const listeners = this.listeners.get("loadedmetadata") || []
      listeners.forEach((cb) => cb())
    }, 10)
  }

  pause() {}

  // Helper method to simulate error
  simulateError() {
    const listeners = this.listeners.get("error") || []
    listeners.forEach((cb) => cb())
  }
}

global.Audio = MockAudioElement as any

// Setup mock platform
const mockPlatform = new MockPlatformService()

describe("AudioFileManager", () => {
  let manager: AudioFileManager

  beforeEach(() => {
    container.registerPlatform(mockPlatform)
    manager = new AudioFileManager()
  })

  afterEach(() => {
    if (manager) {
      manager.unloadAll()
    }
    vi.clearAllMocks()
    resetContainer()
  })

  describe("Loading Audio Files", () => {
    it("should load audio file successfully", async () => {
      const audioFile = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(audioFile.id).toBe("test-id")
      expect(audioFile.path).toBe("/path/to/audio.mp3")
      expect(audioFile.url).toBe("file:///path/to/audio.mp3") // MockPlatform uses file:// protocol
      expect(audioFile.isLoaded).toBe(true)
      expect(audioFile.element).toBeDefined()
      expect(audioFile.error).toBeUndefined()
    })

    it("should create audio element with correct properties", async () => {
      const audioFile = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(audioFile.element?.src).toBe("file:///path/to/audio.mp3")
      expect(audioFile.element?.crossOrigin).toBe("anonymous")
      expect(audioFile.element?.preload).toBe("auto")
    })

    it("should return existing file if already loaded", async () => {
      const audioFile1 = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      const audioFile2 = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(audioFile1).toBe(audioFile2)
      expect(audioFile1.element).toBe(audioFile2.element)
    })

    it("should handle loading errors", async () => {
      // Mock audio element that fails to load
      const originalAudio = global.Audio
      class ErrorAudioElement extends MockAudioElement {
        load() {
          setTimeout(() => {
            this.simulateError()
          }, 10)
        }
      }
      global.Audio = ErrorAudioElement as any

      await expect(manager.loadAudioFile("error-id", "/path/to/error.mp3")).rejects.toThrow("Failed to load audio")

      const audioFile = manager.getAudioFile("error-id")
      expect(audioFile?.isLoaded).toBe(false)
      expect(audioFile?.error).toBe("Failed to load audio")

      // Restore original Audio
      global.Audio = originalAudio
    })

    it("should store error message on load failure", async () => {
      const originalAudio = global.Audio
      class ErrorAudioElement extends MockAudioElement {
        load() {
          setTimeout(() => {
            this.simulateError()
          }, 10)
        }
      }
      global.Audio = ErrorAudioElement as any

      try {
        await manager.loadAudioFile("error-id", "/path/to/error.mp3")
      } catch {
        // Expected error
      }

      const audioFile = manager.getAudioFile("error-id")
      expect(audioFile?.error).toBeDefined()
      expect(audioFile?.isLoaded).toBe(false)

      global.Audio = originalAudio
    })

    it("should load multiple different files", async () => {
      const file1 = await manager.loadAudioFile("id1", "/path/to/audio1.mp3")
      const file2 = await manager.loadAudioFile("id2", "/path/to/audio2.mp3")
      const file3 = await manager.loadAudioFile("id3", "/path/to/audio3.mp3")

      expect(file1.id).toBe("id1")
      expect(file2.id).toBe("id2")
      expect(file3.id).toBe("id3")
      expect(manager.getAllFiles()).toHaveLength(3)
    })
  })

  describe("Retrieving Audio Files", () => {
    it("should get audio file by ID", async () => {
      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      const audioFile = manager.getAudioFile("test-id")

      expect(audioFile).toBeDefined()
      expect(audioFile?.id).toBe("test-id")
    })

    it("should return null for non-existent file", () => {
      const audioFile = manager.getAudioFile("non-existent")

      expect(audioFile).toBeNull()
    })

    it("should get audio element by ID", async () => {
      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      const element = manager.getAudioElement("test-id")

      expect(element).toBeDefined()
      expect(element).toBeInstanceOf(MockAudioElement)
    })

    it("should return null for non-existent audio element", () => {
      const element = manager.getAudioElement("non-existent")

      expect(element).toBeNull()
    })

    it("should get all loaded files", async () => {
      await manager.loadAudioFile("id1", "/path/to/audio1.mp3")
      await manager.loadAudioFile("id2", "/path/to/audio2.mp3")
      await manager.loadAudioFile("id3", "/path/to/audio3.mp3")

      const allFiles = manager.getAllFiles()

      expect(allFiles).toHaveLength(3)
      expect(allFiles.map((f) => f.id)).toContain("id1")
      expect(allFiles.map((f) => f.id)).toContain("id2")
      expect(allFiles.map((f) => f.id)).toContain("id3")
    })

    it("should return empty array when no files loaded", () => {
      const allFiles = manager.getAllFiles()

      expect(allFiles).toEqual([])
    })
  })

  describe("Unloading Audio Files", () => {
    it("should unload audio file", async () => {
      const audioFile = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      const pauseSpy = vi.spyOn(audioFile.element!, "pause")
      const loadSpy = vi.spyOn(audioFile.element!, "load")

      manager.unloadAudioFile("test-id")

      expect(pauseSpy).toHaveBeenCalled()
      expect(audioFile.element!.src).toBe("")
      expect(loadSpy).toHaveBeenCalled()
      expect(manager.getAudioFile("test-id")).toBeNull()
    })

    it("should handle unloading non-existent file", () => {
      // Should not throw
      manager.unloadAudioFile("non-existent")
    })

    it("should handle unloading file without element", () => {
      // Simulate a file without element (error case)
      const originalAudio = global.Audio
      class ErrorAudioElement extends MockAudioElement {
        load() {
          setTimeout(() => {
            this.simulateError()
          }, 10)
        }
      }
      global.Audio = ErrorAudioElement as any

      // Try to load a file that will fail
      manager.loadAudioFile("error-id", "/path/to/error.mp3").catch(() => {})

      // Wait a bit for the error to occur
      setTimeout(() => {
        // Should not throw even though element might not exist
        manager.unloadAudioFile("error-id")
      }, 50)

      global.Audio = originalAudio
    })

    it("should unload all audio files", async () => {
      const file1 = await manager.loadAudioFile("id1", "/path/to/audio1.mp3")
      const file2 = await manager.loadAudioFile("id2", "/path/to/audio2.mp3")
      const file3 = await manager.loadAudioFile("id3", "/path/to/audio3.mp3")

      const pause1 = vi.spyOn(file1.element!, "pause")
      const pause2 = vi.spyOn(file2.element!, "pause")
      const pause3 = vi.spyOn(file3.element!, "pause")

      manager.unloadAll()

      expect(pause1).toHaveBeenCalled()
      expect(pause2).toHaveBeenCalled()
      expect(pause3).toHaveBeenCalled()
      expect(manager.getAllFiles()).toHaveLength(0)
    })

    it("should allow reloading after unload", async () => {
      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      manager.unloadAudioFile("test-id")

      const audioFile = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(audioFile.isLoaded).toBe(true)
      expect(manager.getAudioFile("test-id")).toBe(audioFile)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty file ID", async () => {
      const audioFile = await manager.loadAudioFile("", "/path/to/audio.mp3")

      expect(audioFile.id).toBe("")
      expect(audioFile.isLoaded).toBe(true)
    })

    it("should handle empty file path", async () => {
      const audioFile = await manager.loadAudioFile("test-id", "")

      expect(audioFile.path).toBe("")
      expect(audioFile.url).toBe("file://")
    })

    it("should handle special characters in path", async () => {
      const specialPath = "/path/to/audio (1) [test].mp3"
      const audioFile = await manager.loadAudioFile("test-id", specialPath)

      expect(audioFile.path).toBe(specialPath)
      expect(audioFile.url).toContain("audio (1) [test].mp3")
    })

    it("should maintain separate files with same path but different IDs", async () => {
      const file1 = await manager.loadAudioFile("id1", "/path/to/audio.mp3")
      const file2 = await manager.loadAudioFile("id2", "/path/to/audio.mp3")

      expect(file1.id).toBe("id1")
      expect(file2.id).toBe("id2")
      expect(file1).not.toBe(file2)
      expect(manager.getAllFiles()).toHaveLength(2)
    })

    it("should handle concurrent loads of same file", async () => {
      const promise1 = manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      const promise2 = manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      const [file1, file2] = await Promise.all([promise1, promise2])

      // Both should succeed and have same ID
      expect(file1.id).toBe("test-id")
      expect(file2.id).toBe("test-id")
      expect(file1.isLoaded).toBe(true)
      expect(file2.isLoaded).toBe(true)
    })

    it("should handle concurrent loads of different files", async () => {
      const promise1 = manager.loadAudioFile("id1", "/path/to/audio1.mp3")
      const promise2 = manager.loadAudioFile("id2", "/path/to/audio2.mp3")
      const promise3 = manager.loadAudioFile("id3", "/path/to/audio3.mp3")

      const files = await Promise.all([promise1, promise2, promise3])

      expect(files).toHaveLength(3)
      expect(manager.getAllFiles()).toHaveLength(3)
    })
  })

  describe("Memory Management", () => {
    it("should clear references on unload", async () => {
      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      manager.unloadAudioFile("test-id")

      expect(manager.getAudioFile("test-id")).toBeNull()
      expect(manager.getAudioElement("test-id")).toBeNull()
    })

    it("should handle multiple unload calls", async () => {
      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      manager.unloadAudioFile("test-id")
      manager.unloadAudioFile("test-id")
      manager.unloadAudioFile("test-id")

      expect(manager.getAudioFile("test-id")).toBeNull()
    })

    it("should clear all files on unloadAll", async () => {
      await manager.loadAudioFile("id1", "/path/to/audio1.mp3")
      await manager.loadAudioFile("id2", "/path/to/audio2.mp3")
      await manager.loadAudioFile("id3", "/path/to/audio3.mp3")

      manager.unloadAll()

      expect(manager.getAllFiles()).toHaveLength(0)
      expect(manager.getAudioFile("id1")).toBeNull()
      expect(manager.getAudioFile("id2")).toBeNull()
      expect(manager.getAudioFile("id3")).toBeNull()
    })

    it("should handle unloadAll with no files", () => {
      manager.unloadAll()
      expect(manager.getAllFiles()).toHaveLength(0)
    })
  })
})
