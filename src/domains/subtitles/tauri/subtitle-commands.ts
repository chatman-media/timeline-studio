/**
 * Subtitles Tauri Commands
 *
 * All subtitle-related Tauri backend operations.
 * This is the only place where invoke() is called for subtitles.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type { AudioAnalysisOptions, AudioPeaksResult, SubtitleImportResult } from "../types"

const logger = createLogger("SubtitleCommands")

/**
 * Read a subtitle file from disk
 *
 * @param filePath - Path to the subtitle file
 * @returns Subtitle file content and metadata
 */
export async function readSubtitleFile(filePath: string): Promise<SubtitleImportResult> {
  logger.debugSync("Reading subtitle file", { filePath })
  try {
    const result = await invoke<SubtitleImportResult>("read_subtitle_file", {
      file_path: filePath,
    })
    logger.debugSync("Subtitle file read successfully", { fileName: result.file_name })
    return result
  } catch (error) {
    logger.errorSync("Failed to read subtitle file", { filePath, error })
    throw error
  }
}

/**
 * Analyze audio file to detect peaks for subtitle synchronization
 *
 * @param audioPath - Path to the audio/video file
 * @param options - Analysis options (window size, hop size, threshold)
 * @returns Audio peaks data for synchronization
 */
export async function analyzeAudioPeaks(
  audioPath: string,
  options: AudioAnalysisOptions = {},
): Promise<AudioPeaksResult> {
  logger.debugSync("Analyzing audio peaks", { audioPath, options })
  try {
    const result = await invoke<AudioPeaksResult>("analyze_audio_peaks", {
      audioPath,
      windowSize: options.windowSize ?? 1024,
      hopSize: options.hopSize ?? 512,
      threshold: options.threshold ?? 0.5,
    })
    logger.debugSync("Audio analysis completed", {
      peaksCount: result.peaks.length,
      duration: result.duration,
    })
    return result
  } catch (error) {
    logger.errorSync("Failed to analyze audio", { audioPath, error })
    throw error
  }
}
