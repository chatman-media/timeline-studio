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
  // The bot's workflow job-store file (TIMELINE_BOT_JOB_STORE_FILE), shared
  // read-only so the gateway can report/stream render status (#329).
  TELEGRAM_BOT_JOB_STORE_FILE: z.string().optional(),
  // Default poll interval (ms) for the render-status SSE stream.
  TELEGRAM_RENDER_STREAM_INTERVAL_MS: z.coerce.number().int().min(50).default(1000),
  // Opt-in: deliver the result on edit.approve by publishing via the same bot
  // token. Off by default so the gateway has no external side effects (#329).
  TELEGRAM_GATEWAY_PUBLISH_ON_APPROVE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  // Opt-in AI project editor for edit.revise (#329). Built only when an API key
  // is present; otherwise edit.revise is disabled (no LLM calls from the gateway).
  GATEWAY_AI_EDITOR_API_KEY: z.string().optional(),
  GATEWAY_AI_EDITOR_API_URL: z.string().optional(),
  GATEWAY_AI_EDITOR_PROVIDER: z.string().optional(),
  GATEWAY_AI_EDITOR_MODEL: z.string().optional(),

  // Opt-in LLM script/storyboard generator for idea.submit (#330): turns a fresh
  // idea into a first-cut workflow. Built only when an API key is present;
  // otherwise idea.submit is disabled (the gateway runs no workflows).
  GATEWAY_SCRIPT_GENERATOR_API_KEY: z.string().optional(),
  GATEWAY_SCRIPT_GENERATOR_API_URL: z.string().optional(),
  GATEWAY_SCRIPT_GENERATOR_PROVIDER: z.string().optional(),
  GATEWAY_SCRIPT_GENERATOR_MODEL: z.string().optional(),
  // Use the Rust headless renderer for gateway-run first cuts (else ffmpeg CLI).
  GATEWAY_RUST_RENDER: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  // Concurrency for the gateway's in-process workflow queue (idea.submit).
  GATEWAY_WORKFLOW_CONCURRENCY: z.coerce.number().int().min(1).default(1),

  // Logging
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
})

export type Config = z.infer<typeof ConfigSchema>

// Parse and validate configuration from Bun.env
export const config: Config = ConfigSchema.parse(Bun.env)
