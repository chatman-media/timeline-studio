/**
 * Video Compiler Render Service
 *
 * Domain service for video compiler render job operations.
 * Handles all backend calls related to render job management.
 */

import type { ProjectSchema } from "@/domains/video-editing/types/video-compiler"
import { createLogger } from "@/lib/tauri-logger"
import {
  cancelRender as cancelRenderTauri,
  generatePreview as generatePreviewTauri,
  getActiveJobs as getActiveJobsTauri,
  getRenderJob as getRenderJobTauri,
  renderProject as renderProjectTauri,
} from "../tauri/compiler-commands"

const logger = createLogger("VideoCompilerRenderService")

export interface VideoRenderJob {
  id: string
  status: string
  progress: number
  started_at: string
  finished_at?: string
  error?: string
  [key: string]: any
}

/**
 * Video Compiler Render Service
 *
 * Handles render job management operations
 * through Tauri backend commands.
 */
export class VideoCompilerRenderService {
  /**
   * Get list of active render jobs
   *
   * @returns Promise resolving to array of active render jobs
   */
  async getActiveJobs(): Promise<VideoRenderJob[]> {
    try {
      logger.debugSync("Getting active render jobs")
      const jobs = await getActiveJobsTauri()
      logger.debugSync("Active render jobs retrieved successfully", {
        jobsCount: jobs.length,
      })
      return jobs
    } catch (error) {
      logger.errorSync("Failed to get active render jobs", { error })
      throw error
    }
  }

  /**
   * Get a specific render job by ID
   *
   * @param jobId - ID of the render job
   * @returns Promise resolving to render job or null if not found
   */
  async getRenderJob(jobId: string): Promise<VideoRenderJob | null> {
    try {
      logger.debugSync("Getting render job", { jobId })
      const job = await getRenderJobTauri(jobId)
      if (job) {
        logger.debugSync("Render job retrieved successfully", {
          jobId,
          status: job.status,
        })
      } else {
        logger.debugSync("Render job not found", { jobId })
      }
      return job
    } catch (error) {
      logger.errorSync("Failed to get render job", { jobId, error })
      throw error
    }
  }

  /**
   * Cancel a render job
   *
   * @param jobId - ID of the render job to cancel
   * @returns Promise resolving to true if cancellation was successful
   */
  async cancelRender(jobId: string): Promise<boolean> {
    try {
      logger.infoSync("Cancelling render job", { jobId })
      const success = await cancelRenderTauri(jobId)
      if (success) {
        logger.infoSync("Render job cancelled successfully", { jobId })
      } else {
        logger.warnSync("Failed to cancel render job", { jobId })
      }
      return success
    } catch (error) {
      logger.errorSync("Failed to cancel render job", { jobId, error })
      throw error
    }
  }

  /**
   * Start video compilation
   *
   * @param project - Project schema to compile
   * @param outputPath - Output file path
   * @returns Promise resolving to job ID
   */
  async compileVideo(project: ProjectSchema, outputPath: string): Promise<string> {
    try {
      logger.infoSync("Starting video compilation", {
        projectName: project.metadata.name,
        outputPath,
      })
      const jobId = await renderProjectTauri(project, outputPath)
      logger.infoSync("Video compilation started successfully", {
        jobId,
        outputPath,
      })
      return jobId
    } catch (error) {
      logger.errorSync("Failed to start video compilation", { outputPath, error })
      throw error
    }
  }

  /**
   * Generate preview frame from project at specific timestamp
   *
   * @param project - Project schema to generate preview from
   * @param timestamp - Timestamp in seconds for the preview frame
   * @returns Promise resolving to array of JPEG bytes
   */
  async generatePreview(project: ProjectSchema, timestamp: number): Promise<number[]> {
    try {
      logger.debugSync("Generating preview frame", {
        projectName: project.metadata.name,
        timestamp,
      })
      const jpegData = await generatePreviewTauri(project, timestamp)
      logger.debugSync("Preview frame generated successfully", {
        timestamp,
        byteSize: jpegData.length,
      })
      return jpegData
    } catch (error) {
      logger.errorSync("Failed to generate preview frame", { timestamp, error })
      throw error
    }
  }
}

/**
 * Singleton instance of VideoCompilerRenderService
 */
export const videoCompilerRenderService = new VideoCompilerRenderService()
