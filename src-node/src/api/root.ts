import { router } from "./trpc"
import { mediaRouter } from "./routers/media"
import { thumbnailRouter } from "./routers/thumbnail"
import { waveformRouter } from "./routers/waveform"
import { cacheRouter } from "./routers/cache"
import { healthRouter } from "./routers/health"

/**
 * Main tRPC app router
 */
export const appRouter = router({
  media: mediaRouter,
  thumbnail: thumbnailRouter,
  waveform: waveformRouter,
  cache: cacheRouter,
  health: healthRouter,
})

/**
 * Export type definition of API for client
 */
export type AppRouter = typeof appRouter
