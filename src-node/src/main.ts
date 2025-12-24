import { createServer } from "./server"
import { config } from "./config"
import { ensurePaths, PATHS } from "./config/paths"
import { FFmpegUtils } from "./utils/ffmpeg"
import { createLogger } from "./utils/logger"
import { CacheService } from "./services/cache-service"
import { QueueService } from "./services/queue-service"
import { EnhancedMediaService } from "./services/media-service"
import { initializeServices } from "./api/context"
import path from "node:path"

const logger = createLogger("Main")

async function main() {
  logger.info("Starting Timeline Studio Node.js media server...")

  // 1. Check FFmpeg availability
  logger.info("Checking FFmpeg availability...")
  const ffmpegAvailable = await FFmpegUtils.checkAvailability()

  if (!ffmpegAvailable) {
    logger.error("FFmpeg not available. Please install FFmpeg.")
    process.exit(1)
  }

  logger.info("✅ FFmpeg available")

  // 2. Create cache directories
  logger.info("Creating cache directories...")
  try {
    await ensurePaths()
    logger.info("✅ Cache directories created", { paths: PATHS })
  } catch (error) {
    logger.error("Failed to create cache directories", { error })
    process.exit(1)
  }

  // 3. Initialize services
  logger.info("Initializing services...")

  const cacheService = new CacheService(
    path.join(PATHS.databases, "cache.db"),
    config.CACHE_SIZE
  )

  const queueService = new QueueService(
    path.join(PATHS.databases, "queue.db"),
    config.MAX_CONCURRENT_WORKERS
  )

  const mediaService = new EnhancedMediaService(cacheService, queueService)

  // Initialize global services for tRPC context
  initializeServices({
    mediaService,
    cacheService,
    queueService,
  })

  logger.info("✅ Services initialized")

  // 4. Start HTTP server
  logger.info(`Starting server on ${config.HOST}:${config.PORT}...`)
  const server = createServer()

  logger.info("🚀 Node.js media server running")
  logger.info(`   URL: http://${config.HOST}:${config.PORT}`)
  logger.info(`   tRPC: http://${config.HOST}:${config.PORT}/trpc`)
  logger.info(`   Health: http://${config.HOST}:${config.PORT}/health`)
  logger.info("")
  logger.info(`   Environment: ${config.NODE_ENV}`)
  logger.info(`   Log Level: ${config.LOG_LEVEL}`)
  logger.info(`   Workers: ${config.MAX_CONCURRENT_WORKERS}`)
  logger.info(`   Cache Size: ${config.CACHE_SIZE}`)

  // 5. Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down gracefully...")

    try {
      cacheService.close()
      queueService.close()
      server.stop()

      logger.info("✅ Server shut down successfully")
      process.exit(0)
    } catch (error) {
      logger.error("Error during shutdown", { error })
      process.exit(1)
    }
  }

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

// Start the server
main().catch((err) => {
  console.error("Failed to start server:", err)
  process.exit(1)
})
