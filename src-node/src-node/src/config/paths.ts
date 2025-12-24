import path from "node:path"
import { config } from "./index"

export const PATHS = {
  cache: config.CACHE_DIR,
  thumbnails: path.join(config.CACHE_DIR, "thumbnails"),
  waveforms: path.join(config.CACHE_DIR, "waveforms"),
  databases: path.join(config.CACHE_DIR, "databases"),
  temp: path.join(config.CACHE_DIR, "temp"),
}

export async function ensurePaths(): Promise<void> {
  for (const dir of Object.values(PATHS)) {
    try {
      await Bun.write(path.join(dir, ".gitkeep"), "")
    } catch (error) {
      throw new Error(`Failed to create directory: ${dir}`)
    }
  }
}
