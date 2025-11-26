/**
 * Video Compiler System Service
 *
 * Domain service for video compiler system operations.
 * Handles all backend calls related to GPU capabilities, system info, and hardware acceleration.
 */

import { invoke } from "@tauri-apps/api/core"
import type { CompilerSettings, FfmpegCapabilities, SystemInfo } from "@/domains/video-editing"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("VideoCompilerSystemService")

export interface GpuCapabilitiesResponse {
  available_encoders: string[]
  recommended_encoder: string | null
  current_gpu: any
  hardware_acceleration_supported: boolean
}

/**
 * Video Compiler System Service
 *
 * Handles GPU capabilities, system information, and hardware acceleration
 * through Tauri backend commands.
 */
export class VideoCompilerSystemService {
  /**
   * Get full GPU capabilities
   *
   * @returns Promise resolving to GPU capabilities data
   */
  async getGpuCapabilitiesFull(): Promise<GpuCapabilitiesResponse> {
    try {
      logger.debugSync("Getting GPU capabilities")
      const capabilities = await invoke<GpuCapabilitiesResponse>("get_gpu_capabilities_full")
      logger.debugSync("GPU capabilities retrieved successfully", {
        hardwareSupported: capabilities.hardware_acceleration_supported,
        recommendedEncoder: capabilities.recommended_encoder,
      })
      return capabilities
    } catch (error) {
      logger.errorSync("Failed to get GPU capabilities", { error })
      throw error
    }
  }

  /**
   * Get system information
   *
   * @returns Promise resolving to system info
   */
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      logger.debugSync("Getting system info")
      const systemInfo = await invoke<SystemInfo>("get_system_info")
      logger.debugSync("System info retrieved successfully")
      return systemInfo
    } catch (error) {
      logger.errorSync("Failed to get system info", { error })
      throw error
    }
  }

  /**
   * Check FFmpeg capabilities
   *
   * @returns Promise resolving to FFmpeg capabilities
   */
  async checkFfmpegCapabilities(): Promise<FfmpegCapabilities> {
    try {
      logger.debugSync("Checking FFmpeg capabilities")
      const capabilities = await invoke<FfmpegCapabilities>("check_ffmpeg_capabilities")
      logger.debugSync("FFmpeg capabilities retrieved successfully", {
        version: capabilities.version,
      })
      return capabilities
    } catch (error) {
      logger.errorSync("Failed to check FFmpeg capabilities", { error })
      throw error
    }
  }

  /**
   * Get advanced compiler settings
   *
   * @returns Promise resolving to compiler settings
   */
  async getCompilerSettings(): Promise<CompilerSettings> {
    try {
      logger.debugSync("Getting compiler settings")
      const settings = await invoke<CompilerSettings>("get_compiler_settings_advanced")
      logger.debugSync("Compiler settings retrieved successfully", {
        hardwareAcceleration: settings.hardware_acceleration,
      })
      return settings
    } catch (error) {
      logger.errorSync("Failed to get compiler settings", { error })
      throw error
    }
  }

  /**
   * Set hardware acceleration enabled/disabled
   *
   * @param enabled - Whether hardware acceleration should be enabled
   * @returns Promise resolving when setting is updated
   */
  async setHardwareAcceleration(enabled: boolean): Promise<void> {
    try {
      logger.infoSync("Setting hardware acceleration", { enabled })
      await invoke("set_hardware_acceleration", { enabled })
      logger.infoSync("Hardware acceleration updated successfully")
    } catch (error) {
      logger.errorSync("Failed to set hardware acceleration", { error })
      throw error
    }
  }

  /**
   * Check if hardware acceleration is supported
   *
   * @returns Promise resolving to true if hardware acceleration is supported
   */
  async checkHardwareAccelerationSupport(): Promise<boolean> {
    try {
      logger.debugSync("Checking hardware acceleration support")
      const supported = await invoke<boolean>("check_hardware_acceleration_support")
      logger.debugSync("Hardware acceleration support checked", { supported })
      return supported
    } catch (error) {
      logger.errorSync("Failed to check hardware acceleration support", {
        error,
      })
      throw error
    }
  }
}

/**
 * Singleton instance of VideoCompilerSystemService
 */
export const videoCompilerSystemService = new VideoCompilerSystemService()
