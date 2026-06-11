import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const commandLogger = createLogger("CoreSubtitleCommands")
const serviceLogger = createLogger("CoreSubtitleService")

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

export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass" | "ssa"
  content: string
  output_path: string
}

export interface TimelineSubtitleSegment {
  id?: string
  start_time?: number
  startTime?: number
  end_time?: number
  endTime?: number
  text: string
  style?: unknown
  speaker?: string
  confidence?: number
  language?: string
  [key: string]: unknown
}

export interface UpdateTimelineSubtitlesParams {
  trackId: string
  subtitles: TimelineSubtitleSegment[]
}

export interface UpdateTimelineSubtitlesResult {
  track_id: string
  resource_id: string
  subtitle_count: number
  version: number
}

export async function readSubtitleFile(filePath: string): Promise<SubtitleImportResult> {
  commandLogger.debugSync("Reading subtitle file", { filePath })
  try {
    const result = await invoke<SubtitleImportResult>("read_subtitle_file", {
      file_path: filePath,
    })
    commandLogger.debugSync("Subtitle file read successfully", { fileName: result.file_name })
    return result
  } catch (error) {
    commandLogger.errorSync("Failed to read subtitle file", { filePath, error })
    throw error
  }
}

export async function analyzeAudioPeaks(
  audioPath: string,
  options: AudioAnalysisOptions = {},
): Promise<AudioPeaksResult> {
  commandLogger.debugSync("Analyzing audio peaks", { audioPath, options })
  try {
    const result = await invoke<AudioPeaksResult>("analyze_audio_peaks", {
      audioPath,
      windowSize: options.windowSize ?? 1024,
      hopSize: options.hopSize ?? 512,
      threshold: options.threshold ?? 0.5,
    })
    commandLogger.debugSync("Audio analysis completed", {
      peaksCount: result.peaks.length,
      duration: result.duration,
    })
    return result
  } catch (error) {
    commandLogger.errorSync("Failed to analyze audio", { audioPath, error })
    throw error
  }
}

export async function saveSubtitleFile(options: SubtitleExportOptions): Promise<void> {
  commandLogger.infoSync("Saving subtitle file", {
    format: options.format,
    outputPath: options.output_path,
    contentLength: options.content.length,
  })
  try {
    await invoke("save_subtitle_file", { options })
    commandLogger.infoSync("Subtitle file saved successfully", { outputPath: options.output_path })
  } catch (error) {
    commandLogger.errorSync("Failed to save subtitle file", { error, options })
    throw error
  }
}

export async function updateTimelineSubtitles(
  params: UpdateTimelineSubtitlesParams,
): Promise<UpdateTimelineSubtitlesResult> {
  commandLogger.infoSync("Updating timeline subtitles", {
    trackId: params.trackId,
    subtitlesCount: params.subtitles.length,
  })
  try {
    const result = await invoke<UpdateTimelineSubtitlesResult>("update_timeline_subtitles", {
      trackId: params.trackId,
      subtitles: params.subtitles,
    })
    commandLogger.infoSync("Timeline subtitles updated successfully", { trackId: params.trackId })
    return result
  } catch (error) {
    commandLogger.errorSync("Failed to update timeline subtitles", { error, params })
    throw error
  }
}

export class SubtitleService {
  private static instance: SubtitleService | null = null

  static getInstance(): SubtitleService {
    if (!SubtitleService.instance) {
      SubtitleService.instance = new SubtitleService()
    }
    return SubtitleService.instance
  }

  async importSubtitleFile(filePath: string): Promise<SubtitleImportResult> {
    serviceLogger.debugSync("Importing subtitle file", { filePath })
    return readSubtitleFile(filePath)
  }

  async analyzeAudioForSync(audioPath: string, options?: AudioAnalysisOptions): Promise<AudioPeaksResult> {
    serviceLogger.debugSync("Analyzing audio for sync", { audioPath })
    return analyzeAudioPeaks(audioPath, options)
  }

  async exportSubtitleFile(options: SubtitleExportOptions): Promise<void> {
    serviceLogger.infoSync("Exporting subtitle file", { format: options.format, outputPath: options.output_path })
    return saveSubtitleFile(options)
  }

  async updateTimelineSubtitles(
    trackId: string,
    subtitles: TimelineSubtitleSegment[],
  ): Promise<UpdateTimelineSubtitlesResult> {
    serviceLogger.infoSync("Updating timeline subtitles", { trackId, subtitlesCount: subtitles.length })
    return updateTimelineSubtitles({ trackId, subtitles })
  }

  getSupportedFormats(): string[] {
    return ["srt", "vtt", "ass", "ssa"]
  }
}

export const subtitleService = SubtitleService.getInstance()
