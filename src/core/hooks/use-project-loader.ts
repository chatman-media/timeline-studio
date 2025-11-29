import { useCallback, useMemo } from "react"
import {
  loadProject as loadProjectFn,
  saveProject as saveProjectFn,
} from "@/domains/project-management/services/project-file-service"

/**
 * Core hook для загрузки и сохранения проектов
 * Wraps project-management domain functions
 *
 * @example
 * ```tsx
 * const { loadProject, saveProject } = useProjectLoader()
 *
 * const handleLoad = async (path: string) => {
 *   const project = await loadProject(path)
 *   console.log("Loaded project:", project)
 * }
 * ```
 */
export function useProjectLoader() {
  const loadProject = useCallback(async (path: string): Promise<any> => {
    return await loadProjectFn(path)
  }, [])

  const saveProject = useCallback(async (path: string, data: any): Promise<void> => {
    return await saveProjectFn(path, data)
  }, [])

  return useMemo(
    () => ({
      loadProject,
      saveProject,
    }),
    [loadProject, saveProject],
  )
}
