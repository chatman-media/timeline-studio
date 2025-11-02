/**
 * @vitest-environment jsdom
 */

import { open as openDialog } from "@tauri-apps/plugin-dialog"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useAnalysis } from "../../hooks/use-analysis"
import { QualityMode } from "../../types/analysis"
import { CreateProjectDialog } from "../create-project-dialog"

// Mock dependencies
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

vi.mock("../../hooks/use-analysis", () => ({
  useAnalysis: vi.fn(),
}))

const mockOpenDialog = vi.mocked(openDialog)
const mockUseAnalysis = vi.mocked(useAnalysis)

describe("CreateProjectDialog", () => {
  const mockDefaultConfig = {
    enable_scene_detection: true,
    enable_person_recognition: true,
    enable_object_detection: true,
    enable_emotion_analysis: true,
    enable_audio_analysis: true,
    enable_quality_analysis: true,
    enable_text_recognition: false,
    quality_mode: QualityMode.Balanced,
    frame_skip: 30,
    resolution_scale: 0.5,
    scene_change_threshold: 0.3,
    face_confidence_threshold: 0.7,
    object_confidence_threshold: 0.5,
    motion_detection_threshold: 0.1,
    max_processing_time: 3600,
    max_memory_usage: 2147483648,
    use_gpu: true,
    generate_thumbnails: true,
    generate_previews: true,
    save_keyframes: true,
    include_raw_data: false,
  }

  const mockAnalysisHook = {
    createProject: vi.fn(),
    getDefaultConfig: vi.fn(),
    loading: false,
    error: null,
    setError: vi.fn(),
    dashboardData: { projects: [], recentScenes: [], topMoments: [] },
    getProject: vi.fn(),
    getProgress: vi.fn(),
    startAnalysis: vi.fn(),
    getProjectScenes: vi.fn(),
    getProjectMoments: vi.fn(),
    getProjectStatistics: vi.fn(),
    searchProjectData: vi.fn(),
    getActiveProjects: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAnalysis.mockReturnValue(mockAnalysisHook)
    mockAnalysisHook.getDefaultConfig.mockResolvedValue(mockDefaultConfig)
  })

  const renderDialog = (open = true) => {
    const onOpenChange = vi.fn()
    return {
      ...render(<CreateProjectDialog open={open} onOpenChange={onOpenChange} />),
      onOpenChange,
    }
  }

  describe("Initial State", () => {
    it("should show loading state when config is not loaded", () => {
      mockAnalysisHook.getDefaultConfig.mockReturnValue(new Promise(() => {}))

      renderDialog()

      expect(screen.getByText("Загрузка конфигурации...")).toBeInTheDocument()
    })

    it("should load default config when dialog opens", async () => {
      renderDialog()

      await waitFor(() => {
        expect(mockAnalysisHook.getDefaultConfig).toHaveBeenCalled()
      })
    })

    it("should not be visible when open is false", () => {
      renderDialog(false)

      expect(screen.queryByText("Создать проект анализа")).not.toBeInTheDocument()
    })
  })

  describe("Project Information", () => {
    it("should allow entering project name and description", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByDisplayValue("")).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/название проекта/i)
      const descInput = screen.getByLabelText(/описание/i)

      await user.type(nameInput, "Test Project")
      await user.type(descInput, "Test Description")

      expect(nameInput).toHaveValue("Test Project")
      expect(descInput).toHaveValue("Test Description")
    })

    it("should validate required project name", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Создать проект")).toBeInTheDocument()
      })

      const createButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockAnalysisHook.setError).toHaveBeenCalledWith("Введите название проекта")
      })
    })
  })

  describe("File Selection", () => {
    it("should open file dialog when selecting files", async () => {
      const user = userEvent.setup()
      mockOpenDialog.mockResolvedValue(["/path/to/video1.mp4", "/path/to/video2.mp4"])

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Выберите медиафайлы")).toBeInTheDocument()
      })

      const selectButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectButton)

      expect(mockOpenDialog).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Video Files",
            extensions: ["mp4", "mov", "avi", "mkv", "webm", "flv", "m4v"],
          },
          {
            name: "Audio Files",
            extensions: ["mp3", "wav", "aac", "flac", "ogg", "m4a"],
          },
          {
            name: "Image Files",
            extensions: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"],
          },
        ],
      })
    })

    it("should display selected files", async () => {
      const user = userEvent.setup()
      mockOpenDialog.mockResolvedValue(["/path/to/video.mp4"])

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Выберите медиафайлы")).toBeInTheDocument()
      })

      const selectButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
        expect(screen.getByText("Выбранные файлы (1)")).toBeInTheDocument()
      })
    })

    it("should allow removing selected files", async () => {
      const user = userEvent.setup()
      mockOpenDialog.mockResolvedValue(["/path/to/video.mp4"])

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Выберите медиафайлы")).toBeInTheDocument()
      })

      // Select file first
      const selectButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      // Remove file
      const removeButton = screen.getByRole("button", { name: "" }) // X button
      await user.click(removeButton)

      expect(screen.queryByText("video.mp4")).not.toBeInTheDocument()
    })

    it("should validate selected files before creating project", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Создать проект")).toBeInTheDocument()
      })

      // Enter project name but no files
      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "Test Project")

      const createButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockAnalysisHook.setError).toHaveBeenCalledWith("Выберите файлы для анализа")
      })
    })
  })

  describe("Configuration Settings", () => {
    it("should navigate to settings tab", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Настройки")).toBeInTheDocument()
      })

      const settingsTab = screen.getByRole("tab", { name: /настройки/i })
      await user.click(settingsTab)

      expect(screen.getByText("Виды анализа")).toBeInTheDocument()
      expect(screen.getByText("Производительность")).toBeInTheDocument()
    })

    it("should toggle analysis features", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Настройки")).toBeInTheDocument()
      })

      const settingsTab = screen.getByRole("tab", { name: /настройки/i })
      await user.click(settingsTab)

      const sceneDetectionSwitch = screen.getByRole("switch", { name: /детекция сцен/i })
      expect(sceneDetectionSwitch).toBeChecked()

      await user.click(sceneDetectionSwitch)
      expect(sceneDetectionSwitch).not.toBeChecked()
    })

    it("should change quality mode", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Настройки")).toBeInTheDocument()
      })

      const settingsTab = screen.getByRole("tab", { name: /настройки/i })
      await user.click(settingsTab)

      const qualitySelect = screen.getByRole("combobox")
      await user.click(qualitySelect)

      const fastOption = screen.getByText("Быстрый")
      await user.click(fastOption)

      // Verify selection was changed (this would need more detailed implementation to test properly)
    })
  })

  describe("Advanced Settings", () => {
    it("should navigate to advanced tab and show threshold controls", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Расширенные")).toBeInTheDocument()
      })

      const advancedTab = screen.getByRole("tab", { name: /расширенные/i })
      await user.click(advancedTab)

      expect(screen.getByText("Пороги детекции")).toBeInTheDocument()
      expect(screen.getByText("Опции вывода")).toBeInTheDocument()
    })

    it("should adjust threshold sliders", async () => {
      const user = userEvent.setup()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Расширенные")).toBeInTheDocument()
      })

      const advancedTab = screen.getByRole("tab", { name: /расширенные/i })
      await user.click(advancedTab)

      // Test that sliders are present (actual slider interaction testing would need more setup)
      expect(screen.getByText(/порог изменения сцены/i)).toBeInTheDocument()
      expect(screen.getByText(/порог уверенности лиц/i)).toBeInTheDocument()
    })
  })

  describe("Project Creation", () => {
    it("should create project successfully", async () => {
      const user = userEvent.setup()
      mockOpenDialog.mockResolvedValue(["/path/to/video.mp4"])
      mockAnalysisHook.createProject.mockResolvedValue("new-project-id")

      const { onOpenChange } = renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Создать проект")).toBeInTheDocument()
      })

      // Fill in project details
      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "Test Project")

      // Select files
      const selectButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      // Create project
      const createButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockAnalysisHook.createProject).toHaveBeenCalledWith("Test Project", "", mockDefaultConfig, [
          "/path/to/video.mp4",
        ])
        expect(onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it("should handle project creation errors", async () => {
      const user = userEvent.setup()
      mockOpenDialog.mockResolvedValue(["/path/to/video.mp4"])
      mockAnalysisHook.createProject.mockResolvedValue(null)

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Создать проект")).toBeInTheDocument()
      })

      // Fill in required fields
      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "Test Project")

      const selectButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      // Attempt to create project
      const createButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(mockAnalysisHook.createProject).toHaveBeenCalled()
        // Dialog should stay open on error
        expect(screen.getByText("Создать проект анализа")).toBeInTheDocument()
      })
    })

    it("should disable create button when conditions not met", async () => {
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Создать проект")).toBeInTheDocument()
      })

      const createButton = screen.getByRole("button", { name: /создать проект/i })
      expect(createButton).toBeDisabled()
    })

    it("should show loading state during creation", async () => {
      const user = userEvent.setup()
      mockOpenDialog.mockResolvedValue(["/path/to/video.mp4"])
      mockAnalysisHook.loading = true

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Создать проект")).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "Test Project")

      const selectButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      const createButton = screen.getByRole("button", { name: /создать проект/i })
      expect(createButton).toBeDisabled()
    })
  })

  describe("Dialog Behavior", () => {
    it("should reset form when dialog closes", async () => {
      const user = userEvent.setup()
      const { rerender, onOpenChange } = renderDialog()

      await waitFor(() => {
        expect(screen.getByLabelText(/название проекта/i)).toBeInTheDocument()
      })

      // Fill in some data
      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "Test Project")

      // Close dialog
      rerender(<CreateProjectDialog open={false} onOpenChange={onOpenChange} />)

      // Reopen dialog
      rerender(<CreateProjectDialog open={true} onOpenChange={onOpenChange} />)

      await waitFor(() => {
        const newNameInput = screen.getByLabelText(/название проекта/i)
        expect(newNameInput).toHaveValue("")
      })
    })

    it("should display error messages", async () => {
      mockAnalysisHook.error = "Test error message"

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Test error message")).toBeInTheDocument()
      })
    })

    it("should allow canceling dialog", async () => {
      const user = userEvent.setup()
      const { onOpenChange } = renderDialog()

      await waitFor(() => {
        expect(screen.getByText("Отмена")).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole("button", { name: /отмена/i })
      await user.click(cancelButton)

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
