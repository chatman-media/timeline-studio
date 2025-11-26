/**
 * Subtitles Domain
 *
 * Centralized subtitle functionality:
 * - Import subtitle files (SRT, VTT, ASS, SSA)
 * - Audio analysis for subtitle synchronization
 * - Tauri backend operations
 */

// Services
export { SubtitleService, subtitleService } from "./services"

// Tauri Commands (for direct access if needed)
export { analyzeAudioPeaks, readSubtitleFile } from "./tauri"

// Types
export type { AudioAnalysisOptions, AudioPeaksResult, SubtitleImportResult } from "./types"
