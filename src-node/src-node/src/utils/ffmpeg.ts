import { $ } from "bun"
import { config } from "../config"
import { FFmpegError } from "./errors"
import type { FfprobeData } from "@/domains/media-management/types/ffprobe"

const ffmpegPath = config.FFMPEG_PATH
const ffprobePath = config.FFPROBE_PATH

export class FFmpegUtils {
  static async probe(filePath: string): Promise<FfprobeData> {
    try {
      const result = await $`${ffprobePath} -v quiet -print_format json -show_format -show_streams ${filePath}`.json()
      return result as FfprobeData
    } catch (error) {
      throw new FFmpegError(`Failed to probe file: ${filePath}`, error)
    }
  }

  static async generateThumbnail(
    input: string,
    output: string,
    options: {
      timestamp?: number
      width?: number
      height?: number
      quality?: number
    } = {}
  ): Promise<void> {
    const {
      timestamp = 1,
      width = 320,
      height = 180,
      quality = 85,
    } = options

    try {
      await $`${ffmpegPath} -ss ${timestamp} -i ${input} -vframes 1 -s ${width}x${height} -q:v ${quality} ${output} -y`.quiet()
    } catch (error) {
      throw new FFmpegError(`Failed to generate thumbnail for: ${input}`, error)
    }
  }

  static async generateWaveform(
    input: string,
    output: string,
    width: number = 1920,
    height: number = 200
  ): Promise<void> {
    try {
      await $`${ffmpegPath} -i ${input} -filter_complex "showwavespic=s=${width}x${height}:colors=blue" -frames:v 1 ${output} -y`.quiet()
    } catch (error) {
      throw new FFmpegError(`Failed to generate waveform for: ${input}`, error)
    }
  }

  static async extractAudioWaveformData(
    filePath: string,
    samples: number = 1000
  ): Promise<number[]> {
    try {
      const result = await $`${ffmpegPath} -i ${filePath} -ac 1 -filter:a "aresample=8000,astats=metadata=1:reset=1:length=0.05" -f null -`.text()
      
      // Parse FFmpeg astats output to extract RMS values
      const rmsValues: number[] = []
      const lines = result.split('\n')
      
      for (const line of lines) {
        const match = line.match(/lavfi\.astats\.\d+\.RMS_level=(-?\d+\.?\d*)/)
        if (match) {
          const rms = parseFloat(match[1])
          // Convert dB to normalized 0-1 range (assuming -60dB to 0dB range)
          const normalized = Math.max(0, Math.min(1, (rms + 60) / 60))
          rmsValues.push(normalized)
        }
      }

      // Resample to desired number of samples
      if (rmsValues.length === 0) {
        return Array(samples).fill(0)
      }

      if (rmsValues.length === samples) {
        return rmsValues
      }

      const resampled: number[] = []
      const step = rmsValues.length / samples
      
      for (let i = 0; i < samples; i++) {
        const index = Math.floor(i * step)
        resampled.push(rmsValues[index] || 0)
      }

      return resampled
    } catch (error) {
      throw new FFmpegError(`Failed to extract waveform data for: ${filePath}`, error)
    }
  }

  static async checkAvailability(): Promise<boolean> {
    try {
      await $`${ffmpegPath} -version`.quiet()
      await $`${ffprobePath} -version`.quiet()
      return true
    } catch {
      return false
    }
  }
}
