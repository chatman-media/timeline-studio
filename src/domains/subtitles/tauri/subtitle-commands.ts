/**
 * Subtitles Tauri Commands
 *
 * All subtitle-related Tauri backend operations.
 * This is the only place where invoke() is called for subtitles.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"
import type {
  AudioAnalysisOptions,
  AudioPeaksResult,
  SubtitleExportOptions,
  SubtitleImportResult,
  UpdateTimelineSubtitlesParams,
} from "../types"

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

/**
 * Save subtitle file to disk
 *
 * @param options - Export options (format, content, output path)
 */
export async function saveSubtitleFile(options: SubtitleExportOptions): Promise<void> {
  logger.infoSync("Saving subtitle file", {
    format: options.format,
    outputPath: options.output_path,
    contentLength: options.content.length,
  })
  try {
    await invoke("save_subtitle_file", { options })
    logger.infoSync("Subtitle file saved successfully", { outputPath: options.output_path })
  } catch (error) {
    logger.errorSync("Failed to save subtitle file", { error, options })
    throw error
  }
}

/**
 * Update subtitles on timeline track
 *
 * @param params - Track ID and subtitles array
 */
export async function updateTimelineSubtitles(params: UpdateTimelineSubtitlesParams): Promise<void> {
  logger.infoSync("Updating timeline subtitles", {
    trackId: params.trackId,
    subtitlesCount: params.subtitles.length,
  })
  try {
    await invoke("update_timeline_subtitles", {
      trackId: params.trackId,
      subtitles: params.subtitles,
    })
    logger.infoSync("Timeline subtitles updated successfully", { trackId: params.trackId })
  } catch (error) {
    logger.errorSync("Failed to update timeline subtitles", { error, params })
    throw error
  }
}
