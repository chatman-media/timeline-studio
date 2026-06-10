import { invoke } from "@tauri-apps/api/core"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("AppDirectoriesService")

export interface AppDirectories {
  base_dir: string
  media_dir: string
  projects_dir: string
  snapshot_dir: string
  cinematic_dir: string
  output_dir: string
  render_dir: string
  recognition_dir: string
  backup_dir: string
  media_proxy_dir: string
  caches_dir: string
  recorded_dir: string
  audio_dir: string
  cloud_project_dir: string
  upload_dir: string
}

export interface DirectorySizes {
  media: number
  projects: number
  output: number
  render: number
  caches: number
  backup: number
  total: number
}

export class AppDirectoriesService {
  private directories?: AppDirectories

  async getAppDirectories(): Promise<AppDirectories> {
    if (this.directories) {
      return this.directories
    }

    try {
      const directories = await invoke<AppDirectories>("get_app_directories")
      if (!directories) {
        throw new Error("Failed to get app directories: returned undefined")
      }
      this.directories = directories
      return directories
    } catch (error) {
      logger.error("Failed to get app directories:", { error })
      throw error
    }
  }

  async createAppDirectories(): Promise<AppDirectories> {
    try {
      const directories = await invoke<AppDirectories>("create_app_directories")
      if (!directories) {
        throw new Error("Failed to create app directories: returned undefined")
      }
      this.directories = directories
      return directories
    } catch (error) {
      logger.error("Failed to create app directories:", { error })
      throw error
    }
  }

  async getDirectorySizes(): Promise<DirectorySizes> {
    try {
      return await invoke<DirectorySizes>("get_directory_sizes")
    } catch (error) {
      logger.error("Failed to get directory sizes:", { error })
      throw error
    }
  }

  async clearAppCache(): Promise<void> {
    try {
      await invoke("clear_app_cache")
    } catch (error) {
      logger.error("Failed to clear app cache:", { error })
      throw error
    }
  }

  getMediaSubdirectory(
    type: "videos" | "effects" | "transitions" | "images" | "music" | "style_templates" | "subtitles" | "filters",
  ): string {
    if (!this.directories) {
      throw new Error("App directories not initialized")
    }

    const subdirs: Record<string, string> = {
      videos: "Videos",
      effects: "Effects",
      transitions: "Transitions",
      images: "Images",
      music: "Music",
      style_templates: "StyleTemplates",
      subtitles: "Subtitles",
      filters: "Filters",
    }

    return `${this.directories.media_dir}/${subdirs[type]}`
  }

  formatSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }
}

export const appDirectoriesService = new AppDirectoriesService()
