import type { BotRenderJob, BotRenderJobRequest, BotRenderJobResult, BotRenderJobRunOptions } from "../types"

export interface IRenderJobService {
  run(request: BotRenderJobRequest, options?: BotRenderJobRunOptions): Promise<BotRenderJobResult>
  getJob(jobId: string): Promise<BotRenderJob | null>
  cancelJob(jobId: string): Promise<boolean>
}
