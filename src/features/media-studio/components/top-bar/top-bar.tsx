import {
  Brain,
  FilePlus,
  FolderOpen,
  LayoutTemplate,
  MonitorCog,
  PanelBottomClose,
  PanelBottomOpen,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Upload,
  UserCog,
} from "lucide-react"
import { useCallback, useEffect, useId, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useBrowserState } from "@/domains/browser"
import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { LayoutPreviews } from "@/features/media-studio"
import type { ModalType } from "@/features/modals"
import { useModal } from "@/features/modals/services/modal-provider"
import { AnalysisTasksDropdown } from "@/features/montage-planner"
import { PublicationTasksDropdown } from "@/features/publication"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useUserSettings } from "@/features/user-settings"
import { GpuStatusBadge, RenderJobsDropdown } from "@/features/video-compiler"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme/theme-toggle"

const logger = createLogger({ module: "TopBar" })

export const TOP_BAR_BUTTON_CLASS = "hover:bg-[#D1D1D1] dark:hover:bg-[#464747] h-6 w-6 cursor-pointer m-0.5 p-0"

const TopBarComponent = function TopBar() {
  const { t } = useTranslation()
  const { openModal } = useModal()
  const { isBrowserVisible, toggleBrowserVisibility } = useUserSettings()
  const { isTimelineVisible, toggleTimelineVisibility } = useUserSettings()
  const { isOptionsVisible, toggleOptionsVisibility } = useUserSettings()
  const { currentProject, openProject, saveProject, setProjectDirty, createNewProject } = useCurrentProject()
  const { createProject: createTimelineProject } = useTimeline()
  const { clearBrowserState } = useBrowserState()
  const [isEditing, setIsEditing] = useState(false)
  const [projectName, setProjectName] = useState(currentProject?.metadata?.name || "Новый проект")
  const projectNameInputId = useId()

  // Синхронизируем projectName с currentProject.metadata.name
  useEffect(() => {
    setProjectName(currentProject?.metadata?.name || "Новый проект")
  }, [currentProject?.metadata?.name])

  const handleOpenModal = useCallback(
    (modal: string) => {
      logger.info(`Opening modal: ${modal}`)
      openModal(modal as ModalType)
    },
    [openModal],
  )

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProjectName(e.target.value)
      setProjectDirty(true)
    },
    [setProjectDirty],
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false)
    }
  }, [])

  const handleSave = useCallback(() => {
    try {
      // Сохраняем проект
      void saveProject(projectName)
      logger.info("Project saved successfully")
    } catch (error) {
      logger.error("Error saving project", { error, context: "handleSave" })
    }
  }, [saveProject, projectName])

  const handleOpenProject = useCallback(async () => {
    try {
      // Открываем диалог выбора проекта
      const { open } = await import("@tauri-apps/plugin-dialog")
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Timeline Studio Project",
            extensions: ["tsp"],
          },
        ],
      })

      if (selected && typeof selected === "string") {
        // ВАЖНО: Очищаем browser state перед открытием проекта
        clearBrowserState()

        // Открываем выбранный проект
        void openProject(selected)
        logger.info("Project opened successfully", { path: selected })
      }
    } catch (error) {
      logger.error("Error opening project", {
        error,
        context: "handleOpenProject",
      })
    }
  }, [openProject, clearBrowserState])

  const handleCreateNewProject = useCallback(async () => {
    try {
      // Создаем новый проект с настройками по умолчанию
      const projectName = "Untitled Project"

      logger.info("Creating new project - BEFORE clearBrowserState", {
        projectName,
      })

      // ВАЖНО: Сначала очищаем browser state
      clearBrowserState()

      logger.info("Creating new project - AFTER clearBrowserState, BEFORE createNewProject")

      // Создаем проект в app-settings (для управления состоянием приложения)
      await createNewProject(projectName)

      logger.info("Creating new project - AFTER createNewProject, BEFORE createTimelineProject")

      // Создаем timeline проект с теми же настройками
      await createTimelineProject(projectName, {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
        sampleRate: 48000,
        channels: 2,
        bitDepth: 24,
        timeFormat: "timecode",
        snapToGrid: true,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 300,
      })

      logger.info("New project created successfully - COMPLETE")
    } catch (error) {
      logger.error("Error creating new project", {
        error,
        context: "handleCreateNewProject",
      })
    }
  }, [createNewProject, createTimelineProject, clearBrowserState])

  // Мемоизируем заголовки для кнопок
  const buttonTitles = useMemo(
    () => ({
      browser: isBrowserVisible ? t("browser.hide") : t("browser.show"),
      timeline: isTimelineVisible ? t("timeline.hide") : t("timeline.show"),
      layout: t("topBar.layout"),
      userSettings: t("topBar.userSettings"),
      projectSettings: t("topBar.projectSettings"),
      openProject: t("topBar.openProject"),
      newProject: t("topBar.newProject"),
      save: currentProject?.metadata?.is_dirty ? t("topBar.saveChanges") : t("topBar.allChangesSaved"),
      publish: t("topBar.publish"),
      editingTasks: t("topBar.editingTasks"),
      aiDirector: t("topBar.aiDirector"),
      export: t("topBar.export"),
    }),
    [t, isBrowserVisible, isTimelineVisible, currentProject?.metadata?.is_dirty],
  )

  // Мемоизируем CSS классы
  const saveButtonClassName = useMemo(
    () =>
      cn(
        "h-7 w-7 cursor-pointer p-0",
        currentProject?.metadata?.is_dirty ? "hover:bg-accent opacity-100" : "opacity-50 hover:opacity-50",
      ),
    [currentProject?.metadata?.is_dirty],
  )

  const projectNameClassName = useMemo(
    () =>
      cn(
        "group relative ml-1 w-[100px] text-xs",
        isEditing ? "ring-1 ring-teal" : "transition-colors group-hover:ring-1 group-hover:ring-teal",
      ),
    [isEditing],
  )

  return (
    <div className="relative flex w-full items-center bg-[#DDDDDD] px-1 py-0 dark:bg-[#3D3D3D]">
      {/* Используем grid для равномерного распределения групп */}
      <div className="grid w-full grid-cols-5 items-center">
        {/* Группа 1: Переключатель браузера и макет */}
        <div className="flex items-start">
          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            onClick={toggleBrowserVisibility}
            title={buttonTitles.browser}
          >
            {isBrowserVisible ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            onClick={toggleTimelineVisibility}
            title={buttonTitles.timeline}
          >
            {isTimelineVisible ? <PanelBottomClose size={16} /> : <PanelBottomOpen size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            onClick={toggleOptionsVisibility}
            title={buttonTitles.layout}
          >
            {isOptionsVisible ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={TOP_BAR_BUTTON_CLASS}
                variant="ghost"
                size="icon"
                title={buttonTitles.layout}
                data-testid="layout-button"
              >
                <LayoutTemplate className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-3 rounded-none mt-0.5 ml-0" sideOffset={0}>
              <LayoutPreviews />
            </PopoverContent>
          </Popover>
        </div>

        {/* Группа 2: Переключатель темы, настройки пользователя */}
        <div className="flex items-center justify-start ml-[20%]">
          <div data-testid="theme-toggle">
            <ThemeToggle />
          </div>
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.userSettings}
            onClick={() => handleOpenModal("user-settings")}
            data-testid="user-settings-button"
          >
            <UserCog className="h-5 w-5" />
          </Button>
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.projectSettings}
            onClick={() => handleOpenModal("project-settings")}
            data-testid="project-settings-button"
          >
            <MonitorCog className="h-5 w-5" />
          </Button>
        </div>

        {/* Группа 3: Открытие, сохранение и редактирование названия */}
        <div className="flex items-center justify-center">
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.newProject}
            onClick={handleCreateNewProject}
            data-testid="new-project-button"
          >
            <FilePlus className="h-5 w-5" />
          </Button>
          <Button
            className={TOP_BAR_BUTTON_CLASS}
            variant="ghost"
            size="icon"
            title={buttonTitles.openProject}
            onClick={handleOpenProject}
            data-testid="open-project-button"
          >
            <FolderOpen className="h-5 w-5" />
          </Button>

          <Button
            className={saveButtonClassName}
            variant="ghost"
            size="icon"
            title={buttonTitles.save}
            onClick={handleSave}
            disabled={!currentProject?.metadata?.is_dirty}
            data-testid="save-button"
          >
            <Save className="h-5 w-5" />
          </Button>

          <div className={projectNameClassName} onClick={() => setIsEditing(true)}>
            {isEditing ? (
              <input
                id={projectNameInputId}
                type="text"
                value={projectName}
                onChange={handleNameChange}
                onKeyDown={handleKeyDown}
                onBlur={() => setIsEditing(false)}
                className="w-full h-5 bg-transparent pl-[1px] text-xs focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="block truncate pl-[1px] hover:border hover:border-teal hover:pl-[0px]">
                {projectName}
              </span>
            )}
          </div>
        </div>

        {/* Группа 4: Video Toolbox - GPU status */}
        <div className="flex items-center justify-end mr-[30%]">
          <GpuStatusBadge />
        </div>

        {/* Группа 5: Задачи и экспорт */}
        <div className="flex items-center justify-end">
          <AnalysisTasksDropdown />
          <PublicationTasksDropdown />
          <RenderJobsDropdown />

          <Button
            variant="ghost"
            size="icon"
            className={TOP_BAR_BUTTON_CLASS}
            title={buttonTitles.aiDirector}
            onClick={() => handleOpenModal("ai-director")}
            data-testid="ai-director-button"
          >
            <Brain className="h-5 w-5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-6 w-24 cursor-pointer items-center gap-1 border-none rounded-sm bg-teal px-1 text-sm text-black hover:bg-teal hover:text-black dark:bg-teal dark:hover:bg-teal"
            onClick={() => handleOpenModal("export")}
            data-testid="export-button"
          >
            <span className="px-2 text-xs">{buttonTitles.export}</span>
            <Upload className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Мемоизируем компонент для предотвращения лишних перерисовок
export const TopBar = TopBarComponent
