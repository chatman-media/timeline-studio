import { z } from "zod"
import { router, publicProcedure } from "../trpc"
import { FFmpegUtils } from "../../utils/ffmpeg"

/**
 * Health check router
 */
export const healthRouter = router({
  /**
   * Basic health check
   */
  check: publicProcedure.query(async () => {
    return {
      status: "ok" as const,
      timestamp: Date.now(),
      uptime: process.uptime(),
    }
  }),

  /**
   * Check FFmpeg availability
   */
  ffmpegCheck: publicProcedure.query(async () => {
    const available = await FFmpegUtils.checkAvailability()

    return {
      available,
      timestamp: Date.now(),
    }
  }),
})
