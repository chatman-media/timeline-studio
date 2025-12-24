import { z } from "zod"
import path from "node:path"
import os from "node:os"

const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("localhost"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  FFMPEG_PATH: z.string().default("ffmpeg"),
  FFPROBE_PATH: z.string().default("ffprobe"),
  CACHE_DIR: z.string().default(path.join(os.homedir(), ".cache", "timeline-studio")),
  CACHE_SIZE: z.coerce.number().default(1000),
  MAX_CONCURRENT_WORKERS: z.coerce.number().default(4),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error"]).default("info"),
})

export type Config = z.infer<typeof ConfigSchema>

export const config: Config = ConfigSchema.parse({
  PORT: Bun.env.PORT,
  HOST: Bun.env.HOST,
  CORS_ORIGIN: Bun.env.CORS_ORIGIN,
  FFMPEG_PATH: Bun.env.FFMPEG_PATH,
  FFPROBE_PATH: Bun.env.FFPROBE_PATH,
  CACHE_DIR: Bun.env.CACHE_DIR,
  CACHE_SIZE: Bun.env.CACHE_SIZE,
  MAX_CONCURRENT_WORKERS: Bun.env.MAX_CONCURRENT_WORKERS,
  LOG_LEVEL: Bun.env.LOG_LEVEL,
})
