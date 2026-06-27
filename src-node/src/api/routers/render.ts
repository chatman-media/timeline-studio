import { z } from "zod"
import { TRPCError } from "@trpc/server"
import type {
  NodeTelegramBotWorkflowJobRecord,
  NodeTelegramBotWorkflowJobStore,
} from "@timeline-studio/adapters/node"
import { router, protectedProcedure } from "../trpc"

/**
 * Gateway render router (#329).
 *
 * Read + stream the caller's render jobs from the bot's shared workflow job
 * store. `events` is an SSE subscription so the Mini App sees render progress
 * live. All endpoints are scoped to the authenticated `userId`.
 */

/** Client-safe projection — artifact paths and source payloads are not exposed. */
function toRenderJobSummary(job: NodeTelegramBotWorkflowJobRecord) {
  return {
    id: job.id,
    status: job.status,
    renderStatus: job.renderJobStatus ?? null,
    hasArtifact: Boolean(job.artifact),
    error: job.error ?? job.reason ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  }
}

type RenderJobSummary = ReturnType<typeof toRenderJobSummary>

function requireJobStore(
  store: NodeTelegramBotWorkflowJobStore | undefined,
): NodeTelegramBotWorkflowJobStore {
  if (!store) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Workflow job store is not configured (TELEGRAM_BOT_JOB_STORE_FILE missing)",
    })
  }
  return store
}

async function listOwnedJobs(
  store: NodeTelegramBotWorkflowJobStore,
  userId: string,
  limit?: number,
): Promise<RenderJobSummary[]> {
  const jobs = await store.listJobs()
  const owned = jobs.filter((job) => job.userId === userId).map(toRenderJobSummary)
  return limit ? owned.slice(0, limit) : owned
}

/** A stable signature of the owned jobs, to emit only on change. */
function jobsSignature(jobs: RenderJobSummary[]): string {
  return JSON.stringify(jobs.map((j) => [j.id, j.status, j.renderStatus]))
}

/** Abortable delay so the stream stops promptly when the client disconnects. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve()
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener("abort", () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

export const renderRouter = router({
  /** List the caller's render jobs, newest first as stored. */
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional() }).optional())
    .query(async ({ ctx, input }) => listOwnedJobs(requireJobStore(ctx.workflowJobStore), ctx.auth.userId, input?.limit)),

  /** Read a single render job by id; only the owner may read it. */
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const store = requireJobStore(ctx.workflowJobStore)
      const job = await store.readJob(input.id)
      if (!job || job.userId !== ctx.auth.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Render job not found" })
      }
      return toRenderJobSummary(job)
    }),

  /**
   * SSE stream of the caller's render jobs. Emits an initial snapshot, then a
   * new snapshot whenever any owned job's status changes, until disconnect.
   */
  events: protectedProcedure
    .input(z.object({ intervalMs: z.number().int().min(50).max(60000).optional() }).optional())
    .subscription(async function* ({ ctx, input, signal }) {
      const store = requireJobStore(ctx.workflowJobStore)
      const interval = input?.intervalMs ?? ctx.renderStreamIntervalMs ?? 1000
      let lastSignature: string | undefined
      while (!signal?.aborted) {
        const jobs = await listOwnedJobs(store, ctx.auth.userId)
        const signature = jobsSignature(jobs)
        if (signature !== lastSignature) {
          lastSignature = signature
          yield { jobs }
        }
        await delay(interval, signal)
      }
    }),
})
