/**
 * Bun Worker for processing media jobs
 * Runs in separate thread for true parallelism
 */

import { FFmpegUtils } from "../utils/ffmpeg"
import type { JobType } from "../services/queue-service"

// Worker message types
interface ProcessMessage {
  type: "process"
  job: {
    id: string
    type: JobType
    data: unknown
  }
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

  const results = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]

    try {
      const fileId = crypto.randomUUID()
      const outputPath = `/tmp/thumbnails/${fileId}.jpg`

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

  const results = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]

    try {
      const fileId = crypto.randomUUID()
      const outputPath = `/tmp/waveforms/${fileId}.png`

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
 * Process folder scanning
 */
async function processScanFolder(job: {
  id: string
  data: unknown
}): Promise<unknown> {
  const { folderPath } = job.data as {
    folderPath: string
  }

  // Placeholder - implement folder scanning logic
  // This would recursively scan directory and process files
  return {
    folderPath,
    filesProcessed: 0,
  }
}
