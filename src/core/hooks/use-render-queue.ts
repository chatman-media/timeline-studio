import { useCallback, useMemo } from "react"
import { getVideo } from "../container"
import type { RenderJob } from "../types"

const statusMap: Record<string, RenderJob["status"]> = {
  pending: "Pending",
  running: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
}

function normalizeRenderJob(job: any): RenderJob {
  const status = statusMap[job.status] ?? job.status
  const progressValue = typeof job.progress === "number" ? job.progress : (job.progress?.percentage ?? 0)

  return {
    ...job,
    status,
    project_name: job.project_name ?? job.projectName ?? job.outputPath?.split("/").pop() ?? "Render job",
    output_path: job.output_path ?? job.outputPath ?? "",
    created_at: job.created_at ?? job.startedAt ?? new Date().toISOString(),
    error_message: job.error_message ?? job.error,
    progress:
      job.progress && typeof job.progress === "object"
        ? job.progress
        : {
            job_id: job.id,
            stage: status,
            percentage: progressValue,
            current_frame: 0,
            total_frames: 0,
            elapsed_time: 0,
            status,
          },
  }
}

/**
 * Core hook для работы с очередью рендеринга
 * Wraps video-editing domain functions for render operations
 *
 * @example
 * ```tsx
 * const { renderProject, cancelRender, getActiveJobs } = useRenderQueue()
 *
 * const handleExport = async () => {
 *   const jobId = await renderProject(projectSchema, outputPath)
 *   console.log("Render job started:", jobId)
 * }
 * ```
 */
export function useRenderQueue() {
  const renderProject = useCallback(async (schema: any, outputPath: string): Promise<string> => {
    return await getVideo().renderProject(schema, outputPath)
  }, [])

  const cancelRender = useCallback(async (jobId: string): Promise<boolean> => {
    return await getVideo().cancelRender(jobId)
  }, [])

  const getActiveJobs = useCallback(async (): Promise<RenderJob[]> => {
    const jobs = await getVideo().getActiveJobs()
    return jobs.map(normalizeRenderJob)
  }, [])

  return useMemo(
    () => ({
      renderProject,
      cancelRender,
      getActiveJobs,
    }),
    [renderProject, cancelRender, getActiveJobs],
  )
}
