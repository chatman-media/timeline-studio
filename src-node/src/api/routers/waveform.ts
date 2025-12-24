import { z } from "zod"
import { router, publicProcedure } from "../trpc"

/**
 * Waveform operations router
 */
export const waveformRouter = router({
  /**
   * Generate waveform data (array of amplitudes)
   */
  generateData: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .query(async ({ input, ctx }) => {
      const waveform = await ctx.mediaService.generateAudioWaveform(
        input.filePath
      )

      ctx.logger.debug("Waveform data generated", {
        filePath: input.filePath,
      })

      return waveform
    }),

  /**
   * Batch generate waveforms
   */
  batchGenerate: publicProcedure
    .input(
      z.object({
        files: z.array(z.string()),
        width: z.number().default(800),
        height: z.number().default(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const jobId = await ctx.queueService.addBatchJob("batch-waveforms", {
        files: input.files,
        width: input.width,
        height: input.height,
      })

      ctx.logger.info("Batch waveform generation queued", {
        jobId,
        fileCount: input.files.length,
      })

      return { jobId, status: "queued" as const }
    }),
})
