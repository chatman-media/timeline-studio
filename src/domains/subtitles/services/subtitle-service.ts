/**
 * Subtitle Service
 *
 * High-level service for subtitle operations.
 * All Tauri calls go through tauri/subtitle-commands.ts
 */

import { createLogger } from "@/lib/tauri-logger"
import { analyzeAudioPeaks, readSubtitleFile } from "../tauri"
import type { AudioAnalysisOptions, AudioPeaksResult, SubtitleImportResult } from "../types"

const logger = createLogger("SubtitleService")

export class SubtitleService {
  private static instance: SubtitleService | null = null

  static getInstance(): SubtitleService {
    if (!SubtitleService.instance) {
      SubtitleService.instance = new SubtitleService()
    }
    return SubtitleService.instance
  }

  /**
   * Import a subtitle file
   *
   * @param filePath - Path to the subtitle file (SRT, VTT, ASS, SSA)
   * @returns Subtitle content and metadata
   */
  async importSubtitleFile(filePath: string): Promise<SubtitleImportResult> {
    logger.debugSync("Importing subtitle file", { filePath })
    return readSubtitleFile(filePath)
  }

  /**
   * Analyze audio for subtitle synchronization
   *
   * @param audioPath - Path to the audio/video file
   * @param options - Analysis options
   * @returns Audio peaks for sync algorithm
   */
  async analyzeAudioForSync(audioPath: string, options?: AudioAnalysisOptions): Promise<AudioPeaksResult> {
    logger.debugSync("Analyzing audio for sync", { audioPath })
    return analyzeAudioPeaks(audioPath, options)
  }

  /**
   * Get supported subtitle formats
   */
  getSupportedFormats(): string[] {
    return ["srt", "vtt", "ass", "ssa"]
  }
}

// Export singleton instance
export const subtitleService = SubtitleService.getInstance()
