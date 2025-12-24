import path from "node:path"
import { config } from "./index"

export const PATHS = {
  cache: config.CACHE_DIR,
  thumbnails: path.join(config.CACHE_DIR, "thumbnails"),
  proxies: path.join(config.CACHE_DIR, "proxies"),
  waveforms: path.join(config.CACHE_DIR, "waveforms"),
  temp: path.join(config.CACHE_DIR, "temp"),
  databases: path.join(config.CACHE_DIR, "db"),
} as const

// Create directories on startup using Bun file API
export async function ensurePaths() {
  await Promise.all(
    Object.values(PATHS).map((dir) => Bun.write(path.join(dir, ".gitkeep"), ""))
  )
}
