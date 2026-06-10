import { useCallback, useMemo } from "react"
import { getPlatform } from "../container"

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
    const content = await getPlatform().readTextFile(path)
    return JSON.parse(content)
  }, [])

  const saveProject = useCallback(async (path: string, data: any): Promise<void> => {
    const payload =
      data && typeof data === "object"
        ? {
            ...data,
            meta: {
              ...data.meta,
              lastModified: Date.now(),
            },
          }
        : data

    await getPlatform().writeTextFile(path, JSON.stringify(payload, null, 2))
  }, [])

  return useMemo(
    () => ({
      loadProject,
      saveProject,
    }),
    [loadProject, saveProject],
  )
}
