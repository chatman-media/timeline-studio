import { z } from "zod"
import { router, publicProcedure } from "../trpc"

/**
 * Queue job status and management router
 */
export const queueRouter = router({
  /**
   * Get status of a specific job by its ID
   */
  getJobStatus: publicProcedure
    .input(z.object({ jobId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const status = ctx.queueService.getJobStatus(input.jobId)

      ctx.logger.debug("Job status requested", { jobId: input.jobId })

      return status ?? null
    }),

  /**
   * Get overall queue statistics
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    return ctx.queueService.getStats()
  }),
})
