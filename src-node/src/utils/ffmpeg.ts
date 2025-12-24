import { $ } from "bun"
import { config } from "../config"

export interface FfprobeData {
  streams: Array<{
    index: number
    codec_type: string
    codec_name?: string
    width?: number
    height?: number
    bit_rate?: string
    r_frame_rate?: string
    sample_rate?: string
    channels?: number
  }>
  format: {
    filename: string
    duration?: string
    size?: string
    bit_rate?: string
    format_name?: string
  }
}

export interface ThumbnailOptions {
  timestamp?: number
  width?: number
  height?: number
  quality?: number
}

export interface WaveformOptions {
  width?: number
  height?: number
  color?: string
}

/**
 * FFmpeg utilities using Bun.$ for shell commands
 */
export class FFmpegUtils {
  /**
   * Get metadata from media file using ffprobe
   */
  static async probe(filePath: string): Promise<FfprobeData> {
    const ffprobePath = config.FFPROBE_PATH

    // Use Bun.$ for shell command with automatic JSON parsing
    const result = (await $`${ffprobePath} -v quiet -print_format json -show_format -show_streams ${filePath}`.json()) as FfprobeData

    return result
  }

  /**
   * Generate a thumbnail from video file
   */
  static async generateThumbnail(
    input: string,
    output: string,
    options: ThumbnailOptions = {}
  ): Promise<void> {
    const {
      timestamp = 1,
      width = 320,
      height = 180,
      quality = config.THUMBNAIL_QUALITY,
    } = options

    const ffmpegPath = config.FFMPEG_PATH

    await $`${ffmpegPath} -ss ${timestamp} -i ${input} -vframes 1 -s ${width}x${height} -q:v ${quality} ${output} -y`.quiet()
  }

  /**
   * Generate waveform visualization from audio file
   */
  static async generateWaveform(
    input: string,
    output: string,
    options: WaveformOptions = {}
  ): Promise<void> {
    const { width = 800, height = 100, color = "0x00ff00" } = options

    const ffmpegPath = config.FFMPEG_PATH

    await $`${ffmpegPath} -i ${input} -filter_complex "showwavespic=s=${width}x${height}:colors=${color}" -frames:v 1 ${output} -y`.quiet()
  }

  /**
   * Check if FFmpeg and ffprobe are available
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      const ffmpegPath = config.FFMPEG_PATH
      const ffprobePath = config.FFPROBE_PATH

      await $`${ffmpegPath} -version`.quiet()
      await $`${ffprobePath} -version`.quiet()

      return true
    } catch {
      return false
    }
  }

  /**
   * Get duration from media file in seconds
   */
  static async getDuration(filePath: string): Promise<number> {
    const data = await this.probe(filePath)
    const duration = parseFloat(data.format.duration || "0")
    return duration
  }
}
