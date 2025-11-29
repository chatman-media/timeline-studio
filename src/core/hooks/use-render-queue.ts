import { useCallback, useMemo } from "react"
import {
  cancelRender as cancelRenderFn,
  getActiveJobs as getActiveJobsFn,
  renderProject as renderProjectFn,
} from "@/domains/video-editing"

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
    return await renderProjectFn(schema, outputPath)
  }, [])

  const cancelRender = useCallback(async (jobId: string): Promise<boolean> => {
    return await cancelRenderFn(jobId)
  }, [])

  const getActiveJobs = useCallback(async (): Promise<any[]> => {
    return await getActiveJobsFn()
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
