import { z } from "zod"
import path from "node:path"
import os from "node:os"

const ConfigSchema = z.object({
  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Server
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("localhost"),

  // FFmpeg paths
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),

  // Cache configuration
  CACHE_DIR: z
    .string()
    .default(path.join(os.homedir(), ".cache", "timeline-studio")),
  CACHE_SIZE: z.coerce.number().default(1000),
  CACHE_TTL: z.coerce.number().default(1800000), // 30 min in ms

  // Processing
  MAX_CONCURRENT_WORKERS: z.coerce.number().default(4),
  THUMBNAIL_QUALITY: z.coerce.number().min(1).max(100).default(85),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Telegram Mini App gateway auth (#329). Token of the same bot the worker uses,
  // for verifying initData. Max-age (seconds) gates replay; 0 disables the check.
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_INIT_DATA_MAX_AGE: z.coerce.number().min(0).default(0),
  // Directory of the bot's edit-session store, shared read-only with the gateway
  // so the Mini App can list/inspect the same sessions the bot writes (#329).
  TELEGRAM_BOT_EDIT_SESSION_DIR: z.string().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
})

export type Config = z.infer<typeof ConfigSchema>

// Parse and validate configuration from Bun.env
export const config: Config = ConfigSchema.parse(Bun.env)
