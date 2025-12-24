import { Database } from "bun:sqlite"
import { createLogger } from "../utils/logger"
import { QueueError } from "../utils/errors"

const logger = createLogger("QueueService")

export type JobType = "batch-thumbnails" | "batch-waveforms" | "scan-folder"
export type JobStatus = "pending" | "processing" | "completed" | "failed"

export interface MediaJob {
  id: string
  type: JobType
  data: unknown
  status: JobStatus
  progress: number
  result?: unknown
  error?: string
  createdAt: number
}

// Worker type from Bun
type BunWorker = InstanceType<typeof Worker>

/**
 * Queue service using Bun Workers for parallel processing
 * Uses SQLite for persistent job storage (survives restart)
 */
export class QueueService {
  private readonly db: Database
  private readonly workers: BunWorker[] = []
  private readonly maxWorkers: number
  private readonly workerMap: Map<BunWorker, string | null> = new Map() // Worker -> jobId mapping

  constructor(dbPath: string, maxWorkers: number = 4) {
    this.maxWorkers = maxWorkers

    try {
      // Initialize SQLite database
      this.db = new Database(dbPath, { create: true })

      // Create jobs table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          data TEXT NOT NULL,
          status TEXT NOT NULL,
          progress INTEGER DEFAULT 0,
          result TEXT,
          error TEXT,
          created_at INTEGER NOT NULL
        )
      `)

      // Create index on status for faster queries
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status, created_at)
      `)

      // Start worker pool
      this.startWorkers()

      logger.info("Queue service initialized", {
        dbPath,
        maxWorkers,
      })
    } catch (error) {
      throw new QueueError("Failed to initialize queue service", error)
    }
  }

  /**
   * Start worker pool
   */
  private startWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      try {
        const worker = new Worker(
          new URL("../workers/media-worker.ts", import.meta.url).href
        )

        worker.addEventListener("message", (event) => {
          this.handleWorkerMessage(worker, event.data)
        })

        worker.addEventListener("error", (event) => {
          logger.error("Worker error", {
            error: event.message,
            workerId: i,
          })
        })

        this.workers.push(worker)
        this.workerMap.set(worker, null)

        // Try to assign a job immediately
        this.assignJob(worker)

        logger.debug("Worker started", { workerId: i })
      } catch (error) {
        logger.error("Failed to start worker", { workerId: i, error })
      }
    }
  }

  /**
   * Assign next pending job to worker
   */
  private assignJob(worker: BunWorker): void {
    try {
      // Get next pending job
      const row = this.db
        .query("SELECT * FROM jobs WHERE status = ? ORDER BY created_at LIMIT 1")
        .get("pending") as {
          id: string
          type: string
          data: string
          status: string
          progress: number
          created_at: number
        } | null

      if (!row) {
        // No pending jobs, mark worker as idle
        this.workerMap.set(worker, null)
        return
      }

      const job: MediaJob = {
        ...row,
        data: JSON.parse(row.data),
        type: row.type as JobType,
        status: row.status as JobStatus,
        createdAt: row.created_at,
      }

      // Update job status to processing
      this.db.run("UPDATE jobs SET status = ? WHERE id = ?", [
        "processing",
        job.id,
      ])

      // Track which job this worker is processing
      this.workerMap.set(worker, job.id)

      // Send job to worker
      worker.postMessage({
        type: "process",
        job,
      })

      logger.debug("Job assigned to worker", { jobId: job.id, jobType: job.type })
    } catch (error) {
      logger.error("Failed to assign job to worker", { error })
    }
  }

  /**
   * Handle messages from workers
   */
  private handleWorkerMessage(worker: BunWorker, message: unknown): void {
    const msg = message as {
      type: string
      jobId: string
      progress?: number
      result?: unknown
      error?: string
    }

    try {
      switch (msg.type) {
        case "progress":
          this.db.run("UPDATE jobs SET progress = ? WHERE id = ?", [
            msg.progress ?? 0,
            msg.jobId,
          ])

          logger.debug("Job progress", {
            jobId: msg.jobId,
            progress: msg.progress,
          })
          break

        case "completed":
          this.db.run(
            "UPDATE jobs SET status = ?, progress = ?, result = ? WHERE id = ?",
            ["completed", 100, JSON.stringify(msg.result), msg.jobId]
          )

          logger.info("Job completed", { jobId: msg.jobId })

          // Assign next job to this worker
          this.assignJob(worker)
          break

        case "failed":
          this.db.run("UPDATE jobs SET status = ?, error = ? WHERE id = ?", [
            "failed",
            msg.error ?? "Unknown error",
            msg.jobId,
          ])

          logger.error("Job failed", { jobId: msg.jobId, error: msg.error })

          // Assign next job to this worker
          this.assignJob(worker)
          break
      }
    } catch (error) {
      logger.error("Failed to handle worker message", { error })
    }
  }

  /**
   * Add a batch job to the queue
   */
  async addBatchJob(type: JobType, data: unknown): Promise<string> {
    try {
      const id = crypto.randomUUID()
      const job: MediaJob = {
        id,
        type,
        data,
        status: "pending",
        progress: 0,
        createdAt: Date.now(),
      }

      this.db.run(
        "INSERT INTO jobs (id, type, data, status, progress, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [
          job.id,
          job.type,
          JSON.stringify(job.data),
          job.status,
          job.progress,
          job.createdAt,
        ]
      )

      logger.info("Job added to queue", { jobId: id, type })

      // Try to assign to idle worker
      for (const worker of this.workers) {
        if (this.workerMap.get(worker) === null) {
          this.assignJob(worker)
          break
        }
      }

      return id
    } catch (error) {
      logger.error("Failed to add job to queue", { error })
      throw new QueueError("Failed to add job to queue", error)
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): MediaJob | null {
    try {
      const row = this.db
        .query("SELECT * FROM jobs WHERE id = ?")
        .get(jobId) as {
          id: string
          type: string
          data: string
          status: string
          progress: number
          result?: string
          error?: string
          created_at: number
        } | null

      if (!row) {
        return null
      }

      return {
        ...row,
        data: JSON.parse(row.data),
        type: row.type as JobType,
        status: row.status as JobStatus,
        result: row.result ? JSON.parse(row.result) : undefined,
        createdAt: row.created_at,
      }
    } catch (error) {
      logger.error("Failed to get job status", { jobId, error })
      return null
    }
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): void {
    try {
      this.db.run("UPDATE jobs SET status = ? WHERE id = ?", ["failed", jobId])

      logger.info("Job cancelled", { jobId })
    } catch (error) {
      logger.error("Failed to cancel job", { jobId, error })
    }
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    pending: number
    processing: number
    completed: number
    failed: number
  } {
    try {
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      }

      const rows = this.db
        .query("SELECT status, COUNT(*) as count FROM jobs GROUP BY status")
        .all() as { status: string; count: number }[]

      for (const row of rows) {
        if (row.status in stats) {
          stats[row.status as keyof typeof stats] = row.count
        }
      }

      return stats
    } catch (error) {
      logger.error("Failed to get queue stats", { error })
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      }
    }
  }

  /**
   * Close queue service
   */
  close(): void {
    try {
      // Terminate all workers
      for (const worker of this.workers) {
        worker.terminate()
      }

      this.workers.length = 0
      this.workerMap.clear()

      this.db.close()

      logger.info("Queue service closed")
    } catch (error) {
      logger.warn("Error closing queue service", { error })
    }
  }
}
