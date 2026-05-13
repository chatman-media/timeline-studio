/**
 * Bun Worker for processing media jobs
 * Runs in separate thread for true parallelism
 */

import { FFmpegUtils } from "../utils/ffmpeg"
import type { JobType } from "../services/queue-service"
import { readdir } from "node:fs/promises"
import { extname, join } from "node:path"

// Worker message types
interface ProcessMessage {
  type: "process"
  job: {
    id: string
    type: JobType
    data: unknown
  }
}

const MEDIA_EXTENSIONS = new Set([
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".m4v",
  ".mp3",
  ".wav",
  ".aac",
  ".flac",
  ".ogg",
  ".m4a",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".tiff",
])

function getThumbnailDir(): string {
  const cacheDir = process.env.CACHE_DIR ?? `${process.env.HOME}/.cache/timeline-studio`
  return `${cacheDir}/thumbnails`
}

function getWaveformDir(): string {
  const cacheDir = process.env.CACHE_DIR ?? `${process.env.HOME}/.cache/timeline-studio`
  return `${cacheDir}/waveforms`
}

// Listen for messages from main thread
self.addEventListener("message", async (event: MessageEvent<ProcessMessage>) => {
  const { type, job } = event.data

  if (type === "process") {
    try {
      let result: unknown

      switch (job.type) {
        case "batch-thumbnails":
          result = await processBatchThumbnails(job)
          break
        case "batch-waveforms":
          result = await processBatchWaveforms(job)
          break
        case "scan-folder":
          result = await processScanFolder(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      // Send completion message
      self.postMessage({
        type: "completed",
        jobId: job.id,
        result,
      })
    } catch (error) {
      // Send failure message
      self.postMessage({
        type: "failed",
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
})

/**
 * Process batch thumbnail generation
 */
async function processBatchThumbnails(job: {
  id: string
  data: unknown
}): Promise<unknown> {
  const { files, width, height } = job.data as {
    files: string[]
    width: number
    height: number
  }

  const thumbnailDir = getThumbnailDir()
  const results = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]

    try {
      const fileId = crypto.randomUUID()
      const outputPath = `${thumbnailDir}/${fileId}.jpg`

      await FFmpegUtils.generateThumbnail(filePath, outputPath, {
        width,
        height,
      })

      results.push({
        filePath,
        thumbnail: outputPath,
        success: true,
      })

      // Report progress
      const progress = Math.round(((i + 1) / files.length) * 100)
      self.postMessage({
        type: "progress",
        jobId: job.id,
        progress,
      })
    } catch (error) {
      results.push({
        filePath,
        error: error instanceof Error ? error.message : String(error),
        success: false,
      })
    }
  }

  return results
}

/**
 * Process batch waveform generation
 */
async function processBatchWaveforms(job: {
  id: string
  data: unknown
}): Promise<unknown> {
  const { files, width, height } = job.data as {
    files: string[]
    width: number
    height: number
  }

  const waveformDir = getWaveformDir()
  const results = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]

    try {
      const fileId = crypto.randomUUID()
      const outputPath = `${waveformDir}/${fileId}.png`

      await FFmpegUtils.generateWaveform(filePath, outputPath, {
        width,
        height,
      })

      results.push({
        filePath,
        waveform: outputPath,
        success: true,
      })

      // Report progress
      const progress = Math.round(((i + 1) / files.length) * 100)
      self.postMessage({
        type: "progress",
        jobId: job.id,
        progress,
      })
    } catch (error) {
      results.push({
        filePath,
        error: error instanceof Error ? error.message : String(error),
        success: false,
      })
    }
  }

  return results
}

/**
 * Process folder scanning — recursively finds media files
 */
async function processScanFolder(job: {
  id: string
  data: unknown
}): Promise<unknown> {
  const { folderPath, recursive = false } = job.data as {
    folderPath: string
    recursive?: boolean
  }

  const files: string[] = []

  async function scanDir(dir: string): Promise<void> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (recursive) await scanDir(fullPath)
      } else if (entry.isFile()) {
        if (MEDIA_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
          files.push(fullPath)
        }
      }
    }
  }

  await scanDir(folderPath)

  return {
    folderPath,
    filesProcessed: files.length,
    files,
  }
}
