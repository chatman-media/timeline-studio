import { getPlatform as getPlatformService } from "@timeline-studio/core/container"
import type { FileStats } from "@timeline-studio/core/ports"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("FileSystemService")

export type { FileStats } from "@timeline-studio/core/ports"

export class FileSystemService {
  async fileExists(path: string): Promise<boolean> {
    try {
      logger.debugSync("Checking file existence", { path })
      return await getPlatformService().exists(path)
    } catch (error) {
      logger.errorSync("Failed to check file existence", { path, error })
      return false
    }
  }

  async getFileStats(path: string): Promise<FileStats | null> {
    try {
      logger.debugSync("Getting file stats", { path })
      return await getPlatformService().getFileStats(path)
    } catch (error) {
      logger.errorSync("Failed to get file stats", { path, error })
      return null
    }
  }

  async getPlatform(): Promise<string> {
    try {
      const platform = await getPlatformService().getPlatform()
      logger.debugSync("Got platform", { platform })
      return platform
    } catch (error) {
      logger.errorSync("Failed to get platform", { error })
      return "unknown"
    }
  }

  async searchFilesByName(directory: string, filename: string, maxDepth = 3): Promise<string[]> {
    try {
      logger.debugSync("Searching for files", { directory, filename, maxDepth })
      const result = await getPlatformService().searchFilesByName(directory, filename, maxDepth)
      logger.debugSync("Found files", { count: result.length })
      return result
    } catch (error) {
      logger.errorSync("Failed to search for files", { directory, filename, error })
      return []
    }
  }

  async getAbsolutePath(path: string): Promise<string | null> {
    try {
      logger.debugSync("Getting absolute path", { path })
      return await getPlatformService().getAbsolutePath(path)
    } catch (error) {
      logger.errorSync("Failed to get absolute path", { path, error })
      return null
    }
  }
}

export const fileSystemService = new FileSystemService()
