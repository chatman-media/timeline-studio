import { createLogger } from "@/lib/tauri-logger"
import { useApp } from "./use-app"

const logger = createLogger("UseCurrentProject")

export function useCurrentProject() {
  const { projectState, executeCommand } = useApp()
  const currentProject = projectState?.project || null

  const createNewProject = async (name: string) => {
    return executeCommand({
      type: "CreateProject",
      params: {
        name,
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  }

  const createTempProject = async () => {
    return executeCommand({
      type: "CreateProject",
      params: {
        name: "Temp Project",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frame_rate: 30,
          audio_sample_rate: 48000,
          audio_channels: 2,
        },
      },
    })
  }

  const loadOrCreateTempProject = async () => {
    return createNewProject("Temporary Project")
  }

  const openProject = async (projectPath: string) => {
    return executeCommand({
      type: "OpenProject",
      params: { path: projectPath },
    })
  }

  const saveProject = async (projectPath?: string) => {
    return executeCommand({
      type: "SaveProject",
      params: { path: projectPath || null },
    })
  }

  const saveProjectAs = async () => {
    try {
      const { homeDir } = await import("@tauri-apps/api/path")
      const homePath = await homeDir()
      const projectsPath = `${homePath}TimelineStudioProjects`
      const fileName = currentProject?.metadata?.name ? `${currentProject.metadata.name}.tls` : "project.tls"
      const fullPath = `${projectsPath}/${fileName}`
      const { save } = await import("@tauri-apps/plugin-dialog")
      const selected = await save({
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tls"],
          },
        ],
        defaultPath: fullPath,
      })

      if (!selected) {
        return null
      }

      const filePath = selected.endsWith(".tls") ? selected : `${selected}.tls`
      await saveProject(filePath)
      logger.info("Project saved as", { path: filePath })
      return filePath
    } catch (error) {
      logger.error("Error in saveProjectAs", { error, context: "saveProjectAs" })
      throw error
    }
  }

  const setProjectDirty = (dirty: boolean) => {
    logger.debug("Project dirty state", { dirty })
  }

  return {
    currentProject,
    createNewProject,
    createTempProject,
    loadOrCreateTempProject,
    openProject,
    saveProject,
    saveProjectAs,
    setProjectDirty,
    isTempProject: false,
  }
}
