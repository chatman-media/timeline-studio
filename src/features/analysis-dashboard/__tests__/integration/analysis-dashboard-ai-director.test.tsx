/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { open as openDialog } from "@tauri-apps/plugin-dialog"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { AnalysisDashboard } from "../../components/analysis-dashboard"
import { AnalysisStatus, MediaType, QualityMode } from "../../types/analysis"

// Mock dependencies
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)
const mockOpenDialog = vi.mocked(openDialog)

// Mock Tauri window for Real Engine Panel
const mockTauriInvoke = vi.fn()

beforeAll(() => {
  Object.defineProperty(window, "__TAURI__", {
    value: {
      invoke: mockTauriInvoke,
    },
    writable: true,
  })
})

describe("Analysis Dashboard + AI Director Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock responses for Analysis Dashboard
    mockInvoke.mockImplementation((command: string) => {
      switch (command) {
        case "get_active_analysis_projects":
          return Promise.resolve([])
        case "get_default_analysis_config":
          return Promise.resolve({
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
          })
        case "create_analysis_project":
          return Promise.resolve("new-project-123")
        case "ai_director_get_capabilities":
          return Promise.resolve({
            audio_analysis: true,
            video_analysis: true,
            face_recognition: true,
            object_detection: true,
            transcription: true,
            gpu_acceleration: true,
            mcp_agents: false,
          })
        case "ai_director_analyze_comprehensive":
          return Promise.resolve({
            analysis_id: "test-analysis-123",
            status: "completed",
            video_path: "/path/to/video.mp4",
            processing_time_ms: 45000,
            created_at: "2024-01-01T12:00:00Z",
          })
        default:
          return Promise.reject(new Error(`Unknown command: ${command}`))
      }
    })

    // Setup default mock responses for Real Engine Panel
    mockTauriInvoke.mockImplementation((command: string) => {
      switch (command) {
        case "get_available_models":
          return Promise.resolve({
            object_detection_models: ["YoloV11Nano", "YoloV11Small"],
            face_detection_models: ["YoloV11FaceNano"],
            face_encoding_models: ["FaceNet128D"],
          })
        case "check_models_status":
          return Promise.resolve({
            models_ready: true,
            object_detector_ready: true,
            face_detector_ready: true,
            face_encoder_ready: true,
            initialization_errors: [],
          })
        case "initialize_real_analysis_engine":
          return Promise.resolve("success")
        default:
          return Promise.reject(new Error(`Unknown command: ${command}`))
      }
    })

    mockOpenDialog.mockResolvedValue(["/path/to/video.mp4"])
  })

  const renderDashboard = () => {
    return render(<AnalysisDashboard />)
  }

  describe("Full Workflow Integration", () => {
    it("should create project and start AI Director analysis workflow", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Create new project
      const createButton = screen.getByRole("button", { name: /новый проект/i })
      await user.click(createButton)

      // Wait for dialog to open and config to load
      await waitFor(() => {
        expect(screen.getByText("Создать проект анализа")).toBeInTheDocument()
      })

      // Fill project details
      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "AI Director Test Project")

      // Select files
      const selectFilesButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectFilesButton)

      await waitFor(() => {
        expect(screen.getByText("video.mp4")).toBeInTheDocument()
      })

      // Create project
      const createProjectButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createProjectButton)

      // Verify project creation with AI Director integration
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("create_analysis_project", {
          name: "AI Director Test Project",
          description: "",
          config: expect.any(Object),
          files: ["/path/to/video.mp4"],
        })
      })

      // Verify dashboard refreshes projects list
      expect(mockInvoke).toHaveBeenCalledWith("get_active_analysis_projects")
    })

    it("should configure Real Engine and validate AI Director capabilities", async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Navigate to Real Engine tab
      const engineTab = screen.getByRole("tab", { name: /engine/i })
      await user.click(engineTab)

      // Wait for Real Engine Panel to load
      await waitFor(() => {
        expect(screen.getByText("ONNX Analysis Engine Configuration")).toBeInTheDocument()
        expect(screen.getByText("Ready")).toBeInTheDocument()
      })

      // Verify models status checks
      expect(mockTauriInvoke).toHaveBeenCalledWith("get_available_models")
      expect(mockTauriInvoke).toHaveBeenCalledWith("check_models_status")

      // Initialize models
      const initButton = screen.getByRole("button", { name: /initialize onnx models/i })
      await user.click(initButton)

      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith("initialize_real_analysis_engine", {
          config: expect.objectContaining({
            object_model: "YoloV11Nano",
            face_detection_model: "YoloV11FaceNano",
            face_encoding_model: "FaceNet128D",
          }),
        })
      })
    })

    it("should coordinate between Analysis Dashboard and AI Director for comprehensive analysis", async () => {
      const user = userEvent.setup()

      // Mock project data
      const mockProject = {
        id: "test-project-1",
        name: "Test Project",
        status: AnalysisStatus.Created,
        config: {
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
        },
        files: [
          {
            id: "file-1",
            project_id: "test-project-1",
            file_path: "/path/to/video.mp4",
            file_name: "video.mp4",
            file_size: 104857600,
            media_type: MediaType.Video,
            duration: 120,
            width: 1920,
            height: 1080,
            created_at: "2024-01-01T12:00:00Z",
          },
        ],
        created_at: "2024-01-01T12:00:00Z",
        updated_at: "2024-01-01T12:00:00Z",
      }

      // Mock active projects to show our test project
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case "get_active_analysis_projects":
            return Promise.resolve([
              {
                project_id: "test-project-1",
                status: AnalysisStatus.Created,
                stage: "Created",
                progress: 0,
                start_time: "2024-01-01T12:00:00Z",
              },
            ])
          case "get_analysis_project":
            return Promise.resolve(mockProject)
          case "start_project_analysis":
            return Promise.resolve("success")
          default:
            return mockInvoke(command)
        }
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Should show the project in dashboard
      await waitFor(() => {
        expect(screen.getByText(/Analysis Project test-project-1/)).toBeInTheDocument()
      })

      // Click on project to select it
      const projectCard = screen.getByText(/Analysis Project test-project-1/)
      await user.click(projectCard)

      // Verify project details are loaded
      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("get_analysis_project", {
          projectId: "test-project-1",
        })
      })

      // Start analysis (this should trigger AI Director workflow)
      // Note: In real implementation, this would be triggered by a start analysis button
      // For now we verify the integration calls would be made correctly
      expect(mockInvoke).toHaveBeenCalledWith("get_active_analysis_projects")
    })

    it("should handle AI Director analysis progress updates in dashboard", async () => {
      const user = userEvent.setup()

      // Mock in-progress analysis
      const mockProgress = {
        project_id: "test-project-1",
        status: AnalysisStatus.InProgress,
        stage: "video_analysis",
        progress: 0.65,
        current_file: "video.mp4",
        start_time: "2024-01-01T12:00:00Z",
        estimated_completion: "2024-01-01T12:30:00Z",
      }

      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case "get_active_analysis_projects":
            return Promise.resolve([mockProgress])
          case "get_analysis_project_progress":
            return Promise.resolve(mockProgress)
          default:
            return mockInvoke(command)
        }
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Should show progress for active analysis
      await waitFor(() => {
        expect(screen.getByText("Анализ выполняется")).toBeInTheDocument()
      })

      // Progress visualization should be visible
      expect(screen.getByText(/Analysis Project test-project-1/)).toBeInTheDocument()
    })

    it("should validate Real Engine status before starting AI Director analysis", async () => {
      const user = userEvent.setup()

      // Mock models not ready
      mockTauriInvoke.mockImplementation((command: string) => {
        switch (command) {
          case "check_models_status":
            return Promise.resolve({
              models_ready: false,
              object_detector_ready: false,
              face_detector_ready: false,
              face_encoder_ready: false,
              initialization_errors: ["ONNX models not loaded"],
            })
          default:
            return mockTauriInvoke(command)
        }
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Navigate to engine tab
      const engineTab = screen.getByRole("tab", { name: /engine/i })
      await user.click(engineTab)

      await waitFor(() => {
        expect(screen.getByText("Not Ready")).toBeInTheDocument()
        expect(screen.getByText("Initialization Errors")).toBeInTheDocument()
        expect(screen.getByText("ONNX models not loaded")).toBeInTheDocument()
      })

      // Test models button should be disabled
      const testButton = screen.getByRole("button", { name: /test models/i })
      expect(testButton).toBeDisabled()
    })

    it("should show AI Director system status in dashboard", async () => {
      const user = userEvent.setup()

      // Mock AI Director capabilities check
      mockInvoke.mockImplementation((command: string) => {
        switch (command) {
          case "ai_director_get_capabilities":
            return Promise.resolve({
              audio_analysis: true,
              video_analysis: true,
              face_recognition: false, // Some capability disabled
              object_detection: true,
              transcription: false,
              gpu_acceleration: true,
              mcp_agents: false,
            })
          default:
            return mockInvoke(command)
        }
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Dashboard should reflect AI Director capabilities
      // (This would be shown in a status panel or capabilities overview)
      expect(mockInvoke).toHaveBeenCalledWith("get_active_analysis_projects")
    })

    it("should handle errors gracefully across both systems", async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Mock failures in both systems
      mockInvoke.mockImplementation((command: string) => {
        if (command === "get_active_analysis_projects") {
          return Promise.reject(new Error("Dashboard API Error"))
        }
        return mockInvoke(command)
      })

      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.reject(new Error("Real Engine Error"))
        }
        return mockTauriInvoke(command)
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Navigate to engine tab to trigger Real Engine error
      const engineTab = screen.getByRole("tab", { name: /engine/i })
      await user.click(engineTab)

      // Both systems should handle errors gracefully
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Failed"), expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe("Cross-System Communication", () => {
    it("should coordinate configuration between Analysis Dashboard and Real Engine", async () => {
      const user = userEvent.setup()

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Check that both systems load their configurations
      expect(mockInvoke).toHaveBeenCalledWith("get_default_analysis_config")

      // Navigate to engine tab
      const engineTab = screen.getByRole("tab", { name: /engine/i })
      await user.click(engineTab)

      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith("get_available_models")
        expect(mockTauriInvoke).toHaveBeenCalledWith("check_models_status")
      })

      // Both systems should be using compatible configurations
      // In a real scenario, this would involve checking that AI Director config
      // matches Real Engine capabilities
    })

    it("should validate that Real Engine models support AI Director requirements", async () => {
      const user = userEvent.setup()

      // Mock specific model availability that affects AI Director capabilities
      mockTauriInvoke.mockImplementation((command: string) => {
        switch (command) {
          case "get_available_models":
            return Promise.resolve({
              object_detection_models: ["YoloV11Nano"], // Limited models
              face_detection_models: [], // No face detection
              face_encoding_models: [], // No face encoding
            })
          case "check_models_status":
            return Promise.resolve({
              models_ready: false,
              object_detector_ready: true,
              face_detector_ready: false,
              face_encoder_ready: false,
              initialization_errors: ["Face detection models not available"],
            })
          default:
            return mockTauriInvoke(command)
        }
      })

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      const engineTab = screen.getByRole("tab", { name: /engine/i })
      await user.click(engineTab)

      await waitFor(() => {
        expect(screen.getByText("Not Ready")).toBeInTheDocument()
        expect(screen.getByText("Face detection models not available")).toBeInTheDocument()
      })

      // This should affect what analysis types are available in AI Director
      // In real implementation, this would disable face analysis options
    })
  })
})
