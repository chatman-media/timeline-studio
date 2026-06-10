import { emit, listen } from "@tauri-apps/api/event"
import { useEffect } from "react"
import { useMediaImport } from "@timeline-studio/domains/media-management"
import { useCurrentProject } from "@timeline-studio/domains/project-management/hooks/use-current-project"
import { useModals } from "@timeline-studio/domains/system-integration"
import { useTimeline } from "@/features/timeline/hooks/state/use-timeline"
import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "AppMenu" })

/**
 * Хук для обработки событий нативного меню приложения Tauri
 */
export function useAppMenu() {
  const { createProject: createTimelineProject, saveProject } = useTimeline()
  const { openProject, saveProjectAs, currentProject } = useCurrentProject()
  const { selectMediaFiles } = useMediaImport()
  const { openModal } = useModals()

  // Open Project with dialog
  const handleOpenProject = async () => {
    try {
      // Получаем путь к домашней директории и папке проектов
      const { homeDir } = await import("@tauri-apps/api/path")
      const homePath = await homeDir()
      const projectsPath = `${homePath}TimelineStudioProjects`

      // Открываем диалог выбора проекта
      const { open } = await import("@tauri-apps/plugin-dialog")
      const selected = await open({
        multiple: false,
        defaultPath: projectsPath,
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tls"],
          },
        ],
      })

      if (selected) {
        await openProject(selected)
        logger.info("Project opened successfully", { path: selected })
      }
    } catch (error) {
      logger.error("Error opening project", { error, context: "handleOpenProject" })
    }
  }

  useEffect(() => {
    const unlistenPromises: Promise<() => void>[] = []

    // New Project
    unlistenPromises.push(
      listen("menu:new-project", async () => {
        logger.info("[useAppMenu] New Project clicked")
        try {
          await createTimelineProject("Новый проект")
          logger.info("[useAppMenu] New project created")
        } catch (error) {
          logger.error("[useAppMenu] Failed to create new project", { error })
        }
      }),
    )

    // Open Project
    unlistenPromises.push(
      listen("menu:open-project", async () => {
        logger.info("[useAppMenu] Open Project clicked")
        try {
          await handleOpenProject()
          logger.info("[useAppMenu] Project opened")
        } catch (error) {
          logger.error("[useAppMenu] Failed to open project", { error })
        }
      }),
    )

    // Save Project
    unlistenPromises.push(
      listen("menu:save-project", async () => {
        logger.info("[useAppMenu] Save Project clicked")
        try {
          await saveProject()
          logger.info("[useAppMenu] Project saved")
        } catch (error) {
          logger.error("[useAppMenu] Failed to save project", { error })
        }
      }),
    )

    // Save Project As
    unlistenPromises.push(
      listen("menu:save-project-as", async () => {
        logger.info("[useAppMenu] Save Project As clicked")
        try {
          const savedPath = await saveProjectAs()
          if (savedPath) {
            logger.info("[useAppMenu] Project saved as", { path: savedPath })
          } else {
            logger.info("[useAppMenu] Save Project As cancelled by user")
          }
        } catch (error) {
          logger.error("[useAppMenu] Failed to save project as", { error })
        }
      }),
    )

    // Import Media
    unlistenPromises.push(
      listen("menu:import-media", async () => {
        logger.info("[useAppMenu] Import Media clicked")
        try {
          await selectMediaFiles()
          logger.info("[useAppMenu] Media import dialog opened")
        } catch (error) {
          logger.error("[useAppMenu] Failed to open media import dialog", { error })
        }
      }),
    )

    // Export Project
    unlistenPromises.push(
      listen("menu:export-project", () => {
        logger.info("[useAppMenu] Export Project clicked")
        openModal("export")
      }),
    )

    // Preferences
    unlistenPromises.push(
      listen("menu:preferences", () => {
        logger.info("[useAppMenu] Preferences clicked")
        openModal("user-settings")
      }),
    )

    // Edit commands
    unlistenPromises.push(
      listen("menu:undo", () => {
        logger.info("[useAppMenu] Undo clicked")
        document.execCommand("undo")
      }),
    )

    unlistenPromises.push(
      listen("menu:redo", () => {
        logger.info("[useAppMenu] Redo clicked")
        document.execCommand("redo")
      }),
    )

    unlistenPromises.push(
      listen("menu:cut", () => {
        logger.info("[useAppMenu] Cut clicked")
        document.execCommand("cut")
      }),
    )

    unlistenPromises.push(
      listen("menu:copy", () => {
        logger.info("[useAppMenu] Copy clicked")
        document.execCommand("copy")
      }),
    )

    unlistenPromises.push(
      listen("menu:paste", () => {
        logger.info("[useAppMenu] Paste clicked")
        document.execCommand("paste")
      }),
    )

    unlistenPromises.push(
      listen("menu:delete", () => {
        logger.info("[useAppMenu] Delete clicked")
        document.execCommand("delete")
      }),
    )

    unlistenPromises.push(
      listen("menu:select-all", () => {
        logger.info("[useAppMenu] Select All clicked")
        document.execCommand("selectAll")
      }),
    )

    // View commands - используем события для связи с Timeline
    unlistenPromises.push(
      listen("menu:zoom-in", async () => {
        logger.info("[useAppMenu] Zoom In clicked")
        await emit("timeline:zoom-in")
      }),
    )

    unlistenPromises.push(
      listen("menu:zoom-out", async () => {
        logger.info("[useAppMenu] Zoom Out clicked")
        await emit("timeline:zoom-out")
      }),
    )

    unlistenPromises.push(
      listen("menu:zoom-reset", async () => {
        logger.info("[useAppMenu] Zoom Reset clicked")
        await emit("timeline:zoom-reset")
      }),
    )

    // Help commands
    unlistenPromises.push(
      listen("menu:documentation", () => {
        logger.info("[useAppMenu] Documentation clicked")
        window.open("https://github.com/timeline-studio/docs", "_blank")
      }),
    )

    unlistenPromises.push(
      listen("menu:shortcuts", () => {
        logger.info("[useAppMenu] Shortcuts clicked")
        openModal("keyboard-shortcuts")
      }),
    )

    unlistenPromises.push(
      listen("menu:about", () => {
        logger.info("[useAppMenu] About clicked")
        openModal("about")
      }),
    )

    // Cleanup
    return () => {
      void Promise.all(unlistenPromises).then((unlisteners) => {
        unlisteners.forEach((unlisten) => unlisten())
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTimelineProject, openProject, saveProject, saveProjectAs, selectMediaFiles, openModal, currentProject])
}
