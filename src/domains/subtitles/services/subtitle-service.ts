/**
 * Subtitle Service
 *
 * High-level service for subtitle operations.
 * All Tauri calls go through tauri/subtitle-commands.ts
 */

import { createLogger } from "@/lib/tauri-logger"
import { analyzeAudioPeaks, readSubtitleFile, saveSubtitleFile, updateTimelineSubtitles } from "../tauri"
import type { AudioAnalysisOptions, AudioPeaksResult, SubtitleExportOptions, SubtitleImportResult } from "../types"

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
   * Export subtitle file to disk
   *
   * @param options - Export options (format, content, output path)
   */
  async exportSubtitleFile(options: SubtitleExportOptions): Promise<void> {
    logger.infoSync("Exporting subtitle file", { format: options.format, outputPath: options.output_path })
    return saveSubtitleFile(options)
  }

  /**
   * Update subtitles on timeline track
   *
   * @param trackId - Timeline track ID
   * @param subtitles - Array of subtitle objects
   */
  async updateTimelineSubtitles(trackId: string, subtitles: any[]): Promise<void> {
    logger.infoSync("Updating timeline subtitles", { trackId, subtitlesCount: subtitles.length })
    return updateTimelineSubtitles({ trackId, subtitles })
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
