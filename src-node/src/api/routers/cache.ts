import { z } from "zod"
import { router, publicProcedure } from "../trpc"

/**
 * Cache management router
 */
export const cacheRouter = router({
  /**
   * Get cache statistics
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    const stats = ctx.cacheService.getStats()
    const queueStats = ctx.queueService.getStats()

    return {
      cache: stats,
      queue: queueStats,
      timestamp: Date.now(),
    }
  }),

  /**
   * Clear all cache
   */
  clear: publicProcedure.mutation(async ({ ctx }) => {
    ctx.cacheService.clear()

    ctx.logger.info("Cache cleared via API")

    return {
      success: true,
      timestamp: Date.now(),
    }
  }),

  /**
   * Delete specific cache key
   */
  delete: publicProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input, ctx }) => {
      ctx.cacheService.delete(input.key)

      ctx.logger.info("Cache key deleted via API", { key: input.key })

      return {
        success: true,
        timestamp: Date.now(),
      }
    }),
})
