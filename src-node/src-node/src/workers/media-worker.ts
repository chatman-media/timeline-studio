// Bun Worker for media processing tasks
import { FFmpegUtils } from "../utils/ffmpeg"
import { createLogger } from "../utils/logger"
import path from "node:path"
import { PATHS } from "../config/paths"

const logger = createLogger("MediaWorker")

interface JobMessage {
  type: "process"
  job: {
    id: string
    type: "batch-thumbnails" | "batch-waveforms" | "scan-folder"
    data: unknown
  }
}

self.addEventListener("message", async (event) => {
  const message = event.data as JobMessage

  if (message.type === "process") {
    const { job } = message

    try {
      let result: unknown

      switch (job.type) {
        case "batch-thumbnails":
          result = await processBatchThumbnails(job)
          break
        case "batch-waveforms":
          result = await processBatchWaveforms(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      self.postMessage({
        type: "completed",
        jobId: job.id,
        result,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      logger.error("Job failed", {
        jobId: job.id,
        error: errorMessage,
      })

      self.postMessage({
        type: "failed",
        jobId: job.id,
        error: errorMessage,
      })
    }
  }
})

async function processBatchThumbnails(job: {
  id: string
  data: unknown
}): Promise<unknown> {
  const { files, width, height } = job.data as {
    files: string[]
    width: number
    height: number
  }

  const results: Array<{
    filePath: string
    thumbnail?: string
    success: boolean
    error?: string
  }> = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]

    try {
      const fileId = crypto.randomUUID()
      const outputPath = path.join(PATHS.thumbnails, `${fileId}.jpg`)

      await FFmpegUtils.generateThumbnail(filePath, outputPath, {
        width,
        height,
      })

      results.push({ filePath, thumbnail: outputPath, success: true })

      // Report progress
      self.postMessage({
        type: "progress",
        jobId: job.id,
        progress: Math.round(((i + 1) / files.length) * 100),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      results.push({ filePath, error: errorMessage, success: false })
    }
  }

  return results
}

async function processBatchWaveforms(job: {
  id: string
  data: unknown
}): Promise<unknown> {
  const { files, width, height } = job.data as {
    files: string[]
    width: number
    height: number
  }

  const results: Array<{
    filePath: string
    waveform?: string
    data?: number[]
    success: boolean
    error?: string
  }> = []

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i]

    try {
      const fileId = crypto.randomUUID()
      const outputPath = path.join(PATHS.waveforms, `${fileId}.png`)

      // Generate waveform image
      await FFmpegUtils.generateWaveform(filePath, outputPath, width, height)

      // Extract waveform data
      const data = await FFmpegUtils.extractAudioWaveformData(filePath)

      results.push({
        filePath,
        waveform: outputPath,
        data,
        success: true,
      })

      // Report progress
      self.postMessage({
        type: "progress",
        jobId: job.id,
        progress: Math.round(((i + 1) / files.length) * 100),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      results.push({ filePath, error: errorMessage, success: false })
    }
  }

  return results
}
