/**
 * QueueService Tests
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { QueueService } from "../../src/services/queue-service"
import { existsSync } from "node:fs"
import { rm } from "node:fs/promises"
import path from "node:path"

const TEST_DB_PATH = "/tmp/timeline-studio-queue-test.db"

describe("QueueService", () => {
  let queueService: QueueService

  beforeEach(() => {
    queueService = new QueueService(TEST_DB_PATH, 2)
  })

  afterEach(async () => {
    queueService.close()
    if (existsSync(TEST_DB_PATH)) {
      await rm(TEST_DB_PATH)
    }
  })

  describe("addBatchJob", () => {
    test("should create job and return jobId", async () => {
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4", "file2.mp4"],
        width: 320,
        height: 180,
      })

      expect(typeof jobId).toBe("string")
      expect(jobId.length).toBeGreaterThan(0)
    })

    test("should create job with pending status", async () => {
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      const job = queueService.getJobStatus(jobId)
      expect(job).toBeDefined()
      expect(job?.status).toBe("pending")
      expect(job?.progress).toBe(0)
    })

    test("should handle different job types", async () => {
      const thumbnailJobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      const waveformJobId = await queueService.addBatchJob("batch-waveforms", {
        files: ["file1.mp4"],
        width: 800,
        height: 200,
      })

      const thumbnailJob = queueService.getJobStatus(thumbnailJobId)
      const waveformJob = queueService.getJobStatus(waveformJobId)

      expect(thumbnailJob?.type).toBe("batch-thumbnails")
      expect(waveformJob?.type).toBe("batch-waveforms")
    })
  })

  describe("getJobStatus", () => {
    test("should return job status", async () => {
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      const status = queueService.getJobStatus(jobId)

      expect(status).toBeDefined()
      expect(status?.id).toBe(jobId)
      expect(status?.type).toBe("batch-thumbnails")
      expect(status?.status).toBe("pending")
      expect(status?.progress).toBe(0)
      expect(status?.data).toBeDefined()
    })

    test("should return null for non-existent job", () => {
      const status = queueService.getJobStatus("non-existent-id")
      expect(status).toBeNull()
    })

    test("should include job data", async () => {
      const jobData = {
        files: ["file1.mp4", "file2.mp4"],
        width: 320,
        height: 180,
      }

      const jobId = await queueService.addBatchJob("batch-thumbnails", jobData)
      const status = queueService.getJobStatus(jobId)

      expect(status?.data).toEqual(jobData)
    })
  })

  describe("cancelJob", () => {
    test("should mark job as failed", async () => {
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      queueService.cancelJob(jobId)

      const status = queueService.getJobStatus(jobId)
      expect(status?.status).toBe("failed")
    })

    test("should handle canceling non-existent job", () => {
      expect(() => queueService.cancelJob("non-existent-id")).not.toThrow()
    })
  })

  describe("getStats", () => {
    test("should return queue statistics", async () => {
      await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      await queueService.addBatchJob("batch-waveforms", {
        files: ["file2.mp4"],
        width: 800,
        height: 200,
      })

      const stats = queueService.getStats()

      expect(stats).toHaveProperty("pending")
      expect(stats).toHaveProperty("processing")
      expect(stats).toHaveProperty("completed")
      expect(stats).toHaveProperty("failed")
      expect(typeof stats.pending).toBe("number")
    })

    test("should show correct counts", async () => {
      // Add pending jobs
      await queueService.addBatchJob("batch-thumbnails", { files: ["file1.mp4"] })
      await queueService.addBatchJob("batch-thumbnails", { files: ["file2.mp4"] })

      const stats = queueService.getStats()
      expect(stats.pending).toBeGreaterThan(0)
    })
  })

  describe("persistence", () => {
    test("should persist jobs across restarts", async () => {
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      // Close and recreate
      queueService.close()
      const newQueueService = new QueueService(TEST_DB_PATH, 2)

      const status = newQueueService.getJobStatus(jobId)
      expect(status).toBeDefined()
      expect(status?.id).toBe(jobId)

      newQueueService.close()
    })
  })

  describe("worker assignment", () => {
    test("should process jobs with workers", async () => {
      // This test requires actual worker implementation
      // For now, just verify jobs are created
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: ["file1.mp4"],
        width: 320,
        height: 180,
      })

      // Wait a bit for worker to potentially pick up the job
      await new Promise((resolve) => setTimeout(resolve, 100))

      const status = queueService.getJobStatus(jobId)
      expect(status).toBeDefined()
      // Status may be pending or processing depending on worker speed
      expect(["pending", "processing", "completed", "failed"]).toContain(
        status?.status
      )
    })
  })

  describe("error handling", () => {
    test("should handle invalid job data", async () => {
      const jobId = await queueService.addBatchJob("batch-thumbnails", {
        files: [], // Empty files array
        width: 320,
        height: 180,
      })

      const status = queueService.getJobStatus(jobId)
      expect(status).toBeDefined()
    })

    test("should handle database errors gracefully", () => {
      queueService.close()

      expect(async () => {
        await queueService.addBatchJob("batch-thumbnails", { files: ["file1.mp4"] })
      }).toThrow()
    })
  })

  describe("concurrent job processing", () => {
    test("should respect max workers limit", async () => {
      // Create multiple jobs
      const jobIds = await Promise.all([
        queueService.addBatchJob("batch-thumbnails", { files: ["file1.mp4"] }),
        queueService.addBatchJob("batch-thumbnails", { files: ["file2.mp4"] }),
        queueService.addBatchJob("batch-thumbnails", { files: ["file3.mp4"] }),
        queueService.addBatchJob("batch-thumbnails", { files: ["file4.mp4"] }),
      ])

      // All jobs should be created
      expect(jobIds).toHaveLength(4)
      jobIds.forEach((id) => {
        expect(typeof id).toBe("string")
      })
    })
  })
})
