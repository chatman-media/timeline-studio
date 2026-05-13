import { z } from "zod"
import { router, publicProcedure } from "../trpc"

/**
 * Thumbnail operations router
 */
export const thumbnailRouter = router({
  /**
   * Generate a thumbnail
   */
  generate: publicProcedure
    .input(
      z.object({
        fileId: z.string().min(1),
        filePath: z.string().min(1),
        width: z.number().positive().optional(),
        height: z.number().positive().optional(),
        timestamp: z.number().nonnegative().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.mediaService.generateThumbnail(
        input.fileId,
        input.filePath,
        {
          width: input.width,
          height: input.height,
          timestamp: input.timestamp,
        }
      )

      ctx.logger.debug("Thumbnail generated", {
        fileId: input.fileId,
        filePath: input.filePath,
      })

      return result
    }),

  /**
   * Check if thumbnail is cached
   */
  hasCached: publicProcedure
    .input(
      z.object({
        fileId: z.string().min(1),
        width: z.number().positive(),
        height: z.number().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      const hasCached = await ctx.mediaService.hasCachedThumbnail(
        input.fileId,
        input.width,
        input.height
      )

      return { hasCached }
    }),

  /**
   * Get cached thumbnail path
   */
  getCachedPath: publicProcedure
    .input(
      z.object({
        fileId: z.string().min(1),
        width: z.number().positive(),
        height: z.number().positive(),
      })
    )
    .query(async ({ input, ctx }) => {
      const path = await ctx.mediaService.getCachedThumbnailPath(
        input.fileId,
        input.width,
        input.height
      )

      return { path }
    }),

  /**
   * Batch generate thumbnails
   */
  batchGenerate: publicProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            fileId: z.string().min(1),
            filePath: z.string().min(1),
          })
        ).min(1),
        width: z.number().positive().default(320),
        height: z.number().positive().default(180),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const jobId = await ctx.queueService.addBatchJob("batch-thumbnails", {
        files: input.files.map((f) => f.filePath),
        width: input.width,
        height: input.height,
      })

      ctx.logger.info("Batch thumbnail generation queued", {
        jobId,
        fileCount: input.files.length,
      })

      return { jobId, status: "queued" as const }
    }),
})
