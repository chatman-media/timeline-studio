/**
 * Subtitles Domain Types
 */

export interface SubtitleImportResult {
  content: string
  format: string
  file_name: string
}

export interface AudioPeaksResult {
  peaks: Array<{ time: number; amplitude: number }>
  sample_rate: number
  duration: number
}

export interface AudioAnalysisOptions {
  windowSize?: number
  hopSize?: number
  threshold?: number
}

/**
 * Subtitle Export Types
 */
export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass" | "ssa"
  content: string
  output_path: string
}

export interface UpdateTimelineSubtitlesParams {
  trackId: string
  subtitles: any[]
}
