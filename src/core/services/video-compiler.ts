/**
 * Video compiler service commands used directly by feature UI.
 */

import { invoke } from "@tauri-apps/api/core"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("CoreVideoCompilerService")

export interface PrerenderRequest {
  projectSchema: unknown
  startTime: number
  endTime: number
  outputPath: string
  applyEffects?: boolean
  quality?: number
}

export interface PrerenderResult {
  filePath: string
  duration: number
  fileSize: number
  renderTimeMs: number
}

export interface PrerenderCacheInfo {
  fileCount: number
  totalSize: number
  files: PrerenderCacheFile[]
}

export interface PrerenderCacheFile {
  path: string
  size: number
  created: number
  startTime: number
  endTime: number
}

export async function prerenderSegment(request: PrerenderRequest): Promise<PrerenderResult> {
  try {
    void logger.info("Prerender segment requested", {
      hasProjectSchema: !!request?.projectSchema,
      hasOutputPath: !!request?.outputPath,
      startTime: request?.startTime,
      endTime: request?.endTime,
    })

    if (!request.projectSchema) {
      throw new Error("prerenderSegment requires projectSchema parameter")
    }
    if (!request.outputPath) {
      throw new Error("prerenderSegment requires outputPath parameter")
    }

    return await invoke<PrerenderResult>("prerender_segment", {
      projectSchema: request.projectSchema,
      startTime: request.startTime,
      endTime: request.endTime,
      outputPath: request.outputPath,
    })
  } catch (error) {
    void logger.error("Failed to prerender segment", { error })
    throw error
  }
}

export async function getPrerenderCacheInfo(): Promise<PrerenderCacheInfo> {
  const result = await invoke<any>("get_prerender_cache_info")

  return {
    fileCount: result.file_count || 0,
    totalSize: result.total_size || 0,
    files: (result.files || []).map((file: any) => ({
      path: file.path,
      size: file.size,
      created: file.created,
      startTime: file.start_time,
      endTime: file.end_time,
    })),
  }
}

export async function clearPrerenderCache(): Promise<number> {
  return await invoke<number>("clear_prerender_cache")
}
