import { container } from "@timeline-studio/core"
import type { IPlatformService } from "@timeline-studio/core/ports/platform.port"

export interface AudioFile {
  id: string
  path: string
  url: string
  element?: HTMLAudioElement
  isLoaded: boolean
  error?: string
}

export class AudioFileManager {
  private audioFiles = new Map<string, AudioFile>()

  /**
   * Получает platform service
   */
  private getPlatformService(): IPlatformService {
    if (!container.hasPlatform()) {
      throw new Error("Platform service not available")
    }
    return container.getPlatform()
  }

  /**
   * Load audio file and create HTMLAudioElement
   */
  async loadAudioFile(id: string, path: string): Promise<AudioFile> {
    // Check if already loaded
    const existing = this.audioFiles.get(id)
    if (existing?.isLoaded) {
      return existing
    }

    try {
      const platform = this.getPlatformService()
      // Convert Tauri file path to URL
      const url = platform.convertFileSrc(path)

      // Create audio element
      const element = new Audio()
      element.src = url
      element.crossOrigin = "anonymous"
      element.preload = "auto"

      // Wait for metadata to load
      await new Promise<void>((resolve, reject) => {
        element.addEventListener("loadedmetadata", () => resolve(), { once: true })
        element.addEventListener("error", () => reject(new Error("Failed to load audio")), { once: true })
        element.load()
      })

      const audioFile: AudioFile = {
        id,
        path,
        url,
        element,
        isLoaded: true,
      }

      this.audioFiles.set(id, audioFile)
      return audioFile
    } catch (error) {
      const audioFile: AudioFile = {
        id,
        path,
        url: "",
        isLoaded: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }

      this.audioFiles.set(id, audioFile)
      throw error
    }
  }

  /**
   * Get loaded audio file
   */
  getAudioFile(id: string): AudioFile | null {
    return this.audioFiles.get(id) || null
  }

  /**
   * Get audio element for a file
   */
  getAudioElement(id: string): HTMLAudioElement | null {
    const file = this.audioFiles.get(id)
    return file?.element || null
  }

  /**
   * Unload audio file
   */
  unloadAudioFile(id: string) {
    const file = this.audioFiles.get(id)
    if (file?.element) {
      file.element.pause()
      file.element.src = ""
      file.element.load()
    }
    this.audioFiles.delete(id)
  }

  /**
   * Unload all audio files
   */
  unloadAll() {
    this.audioFiles.forEach((_file, id) => {
      this.unloadAudioFile(id)
    })
  }

  /**
   * Get all loaded files
   */
  getAllFiles(): AudioFile[] {
    return Array.from(this.audioFiles.values())
  }
}
