import type { EnhancedMediaService } from "../services/media-service"
import type { CacheService } from "../services/cache-service"
import type { QueueService } from "../services/queue-service"
import type { Logger } from "../utils/logger"
import { createLogger } from "../utils/logger"

/**
 * tRPC request context
 */
export interface Context {
  mediaService: EnhancedMediaService
  cacheService: CacheService
  queueService: QueueService
  logger: Logger
}

// Global services (initialized in main.ts)
let globalServices: Omit<Context, "logger"> | null = null

/**
 * Initialize global services
 */
export function initializeServices(services: Omit<Context, "logger">): void {
  globalServices = services
}

/**
 * Create context for each tRPC request
 */
export async function createContext(): Promise<Context> {
  if (!globalServices) {
    throw new Error("Services not initialized. Call initializeServices first.")
  }

  return {
    ...globalServices,
    logger: createLogger("tRPC"),
  }
}
