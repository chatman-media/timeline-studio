/**
 * Subtitles Domain
 *
 * Centralized subtitle functionality:
 * - Import subtitle files (SRT, VTT, ASS, SSA)
 * - Export subtitle files
 * - Audio analysis for subtitle synchronization
 * - Timeline integration
 * - Tauri backend operations
 */

// Services
export { SubtitleService, subtitleService } from "./services"

// Tauri Commands (for direct access if needed)
export { analyzeAudioPeaks, readSubtitleFile, saveSubtitleFile, updateTimelineSubtitles } from "./tauri"

// Types
export type {
  AudioAnalysisOptions,
  AudioPeaksResult,
  SubtitleExportOptions,
  SubtitleImportResult,
  UpdateTimelineSubtitlesParams,
} from "./types"
