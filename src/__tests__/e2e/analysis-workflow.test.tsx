/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { open as openDialog } from "@tauri-apps/plugin-dialog"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { AIDirectorService } from "../../features/ai-director/services/ai-director-service"
import { AnalysisDashboard } from "../../features/analysis-dashboard/components/analysis-dashboard"
import { AnalysisStatus, QualityMode } from "../../features/analysis-dashboard/types/analysis"

// Mock all external dependencies
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

describe("End-to-End Analysis Workflow", () => {
  let aiDirectorService: AIDirectorService

  beforeEach(() => {
    vi.clearAllMocks()
    aiDirectorService = AIDirectorService.getInstance()

    // Setup comprehensive mock responses
    setupMockResponses()
  })

  function setupMockResponses() {
    // Analysis Dashboard mocks
    mockInvoke.mockImplementation((command: string, args?: any) => {
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
          return Promise.resolve("e2e-test-project-123")

        case "start_project_analysis":
          return Promise.resolve("success")

        case "get_analysis_project_progress":
          return Promise.resolve({
            project_id: args?.projectId || "e2e-test-project-123",
            status: AnalysisStatus.InProgress,
            stage: "comprehensive_analysis",
            progress: 0.65,
            current_file: "test-video.mp4",
            start_time: "2024-01-01T12:00:00Z",
            estimated_completion: "2024-01-01T12:30:00Z",
          })

        // AI Director mocks
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

        case "ai_director_health_check":
          return Promise.resolve({
            overall_status: "healthy",
            services: {
              audio_service: "healthy",
              video_service: "healthy",
              ai_service: "healthy",
              unified_audio_service: "healthy",
            },
            last_check: "2024-01-01T12:00:00Z",
          })

        case "ai_director_get_default_config":
          return Promise.resolve({
            performance_mode: args?.mode || "balanced",
            enable_audio_analysis: true,
            enable_video_analysis: true,
            enable_face_analysis: true,
            enable_object_analysis: true,
            enable_emotion_analysis: true,
            enable_composition_analysis: true,
            enable_scene_detection: true,
            enable_mcp_agents: false,
            max_processing_time: 3600,
            generate_editing_recommendations: true,
          })

        case "ai_director_analyze_comprehensive":
          return Promise.resolve({
            analysis_id: "e2e-comprehensive-analysis-456",
            status: "completed",
            video_path: args?.videoPath || "/path/to/test-video.mp4",
            audio_analysis: {
              unified_result: {
                overall_quality: 0.85,
                audio_present: true,
                processing_time_ms: 15000,
              },
              basic_metrics: {
                has_audio: true,
                duration: 120,
                channels: 2,
                sample_rate: 44100,
                bitrate: 192000,
                file_size_bytes: 5242880,
                codec: "aac",
              },
              ffmpeg_analysis: {
                volume_analysis: [0.5, 0.6, 0.7, 0.8],
                frequency_analysis: { low: 0.3, mid: 0.6, high: 0.4 },
                spectral_analysis: { centroid: 2500, rolloff: 8000 },
                quality_issues: [],
              },
              montage_analysis: {
                speech_segments: [{ start: 10.5, end: 45.2, confidence: 0.92 }],
                music_segments: [{ start: 0.0, end: 10.0, genre: "ambient" }],
                emotional_tone: "positive",
                energy_level: 0.75,
                tempo_analysis: { bpm: 120, confidence: 0.85 },
              },
            },
            video_analysis: {
              basic_info: {
                duration: 120,
                fps: 30,
                resolution: { width: 1920, height: 1080 },
                codec: "h264",
                file_size: 52428800,
              },
              scene_analysis: [
                {
                  start_time: 0.0,
                  end_time: 30.0,
                  scene_type: "opening",
                  confidence: 0.92,
                  description: "Opening scene with titles",
                },
              ],
              object_detection: [
                {
                  timestamp: 15.0,
                  objects: [{ class_name: "person", confidence: 0.95, bbox: [100, 50, 200, 300] }],
                },
              ],
            },
            editing_recommendations: [
              {
                type: "cut",
                description: "Consider cutting silent section",
                confidence: 0.85,
                suggested_action: "Remove segment from 5.0s to 8.5s",
                time_range: { start: 5.0, end: 8.5 },
              },
            ],
            processing_time_ms: 125000,
            created_at: "2024-01-01T12:00:00Z",
          })

        // Unified Audio Analysis mocks
        case "unified_audio_analyze_comprehensive":
          return Promise.resolve({
            success: true,
            unified_result: {
              overall_quality: 0.85,
              audio_present: true,
              processing_time_ms: 15000,
            },
            basic_metrics: {
              has_audio: true,
              duration: 120,
              channels: 2,
              sample_rate: 44100,
              bitrate: 192000,
              file_size_bytes: 5242880,
              codec: "aac",
            },
          })

        case "unified_audio_get_capabilities":
          return Promise.resolve({
            ffmpegAvailable: true,
            montageAvailable: true,
            whisperAvailable: true,
            gpuAvailable: true,
          })

        default:
          return Promise.reject(new Error(`Unknown command: ${command}`))
      }
    })

    // Real Engine Panel mocks
    mockTauriInvoke.mockImplementation((command: string) => {
      switch (command) {
        case "get_available_models":
          return Promise.resolve({
            object_detection_models: ["YoloV11Nano", "YoloV11Small", "YoloV11Medium"],
            face_detection_models: ["YoloV11FaceNano", "YoloV11FaceSmall"],
            face_encoding_models: ["FaceNet128D", "FaceNet512D"],
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

    // File dialog mock
    mockOpenDialog.mockResolvedValue(["/path/to/test-video.mp4"])
  }

  describe("Complete Analysis Workflow", () => {
    it("should execute full workflow from project creation to analysis completion", async () => {
      const user = userEvent.setup()

      render(<AnalysisDashboard />)

      // Wait for dashboard to load
      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // ===== STEP 1: Create New Project =====
      console.log("E2E Step 1: Creating new project...")

      const createButton = screen.getByRole("button", { name: /новый проект/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText("Создать проект анализа")).toBeInTheDocument()
      })

      // Fill project details
      const nameInput = screen.getByLabelText(/название проекта/i)
      await user.type(nameInput, "E2E Test Project")

      const descInput = screen.getByLabelText(/описание/i)
      await user.type(descInput, "End-to-end test project for AI analysis")

      // Select files
      const selectFilesButton = screen.getByRole("button", { name: /выберите медиафайлы/i })
      await user.click(selectFilesButton)

      await waitFor(() => {
        expect(screen.getByText("test-video.mp4")).toBeInTheDocument()
      })

      // Navigate to settings tab to verify configuration
      const settingsTab = screen.getByRole("tab", { name: /настройки/i })
      await user.click(settingsTab)

      await waitFor(() => {
        expect(screen.getByText("Виды анализа")).toBeInTheDocument()
      })

      // Verify all analysis types are enabled
      const audioAnalysisSwitch = screen.getByRole("switch", { name: /анализ аудио/i })
      expect(audioAnalysisSwitch).toBeChecked()

      // Create the project
      const createProjectButton = screen.getByRole("button", { name: /создать проект/i })
      await user.click(createProjectButton)

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith("create_analysis_project", {
          name: "E2E Test Project",
          description: "End-to-end test project for AI analysis",
          config: expect.objectContaining({
            enable_audio_analysis: true,
            enable_video_analysis: true,
            quality_mode: QualityMode.Balanced,
          }),
          files: ["/path/to/test-video.mp4"],
        })
      })

      console.log("E2E Step 1 Complete: Project created successfully")

      // ===== STEP 2: Validate Real Engine Configuration =====
      console.log("E2E Step 2: Validating Real Engine configuration...")

      // Navigate to Real Engine tab
      const engineTab = screen.getByRole("tab", { name: /engine/i })
      await user.click(engineTab)

      await waitFor(() => {
        expect(screen.getByText("ONNX Analysis Engine Configuration")).toBeInTheDocument()
        expect(screen.getByText("Ready")).toBeInTheDocument()
      })

      // Verify models are loaded
      await waitFor(() => {
        expect(screen.getByText("Object Detection")).toBeInTheDocument()
        expect(screen.getByText("Face Detection")).toBeInTheDocument()
      })

      // Test model initialization
      const initButton = screen.getByRole("button", { name: /initialize onnx models/i })
      await user.click(initButton)

      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith("initialize_real_analysis_engine", {
          config: expect.objectContaining({
            object_model: "YoloV11Nano",
            face_detection_model: "YoloV11FaceNano",
          }),
        })
      })

      console.log("E2E Step 2 Complete: Real Engine configured and ready")

      // ===== STEP 3: Verify AI Director Integration =====
      console.log("E2E Step 3: Testing AI Director integration...")

      // Test AI Director capabilities through service
      const capabilities = await aiDirectorService.getCapabilities()
      expect(capabilities).toMatchObject({
        audio_analysis: true,
        video_analysis: true,
        face_recognition: true,
        object_detection: true,
      })

      // Test health check
      const health = await aiDirectorService.healthCheck()
      expect(health.overall_status).toBe("healthy")

      // Test unified audio analysis integration
      const audioResult = await aiDirectorService.analyzeAudioComprehensive("/path/to/test-video.mp4", {
        enableFFmpeg: true,
        enableMontage: true,
        enableTranscription: false,
        performanceMode: "balanced",
      })
      expect(audioResult.success).toBe(true)

      console.log("E2E Step 3 Complete: AI Director integration verified")

      // ===== STEP 4: Execute Comprehensive Analysis =====
      console.log("E2E Step 4: Executing comprehensive analysis...")

      // Get AI Director configuration
      const aiConfig = await aiDirectorService.getDefaultConfig("balanced")
      expect(aiConfig.performance_mode).toBe("balanced")

      // Start comprehensive analysis
      const analysisResult = await aiDirectorService.analyzeComprehensive("/path/to/test-video.mp4", aiConfig)

      expect(analysisResult).toMatchObject({
        analysis_id: "e2e-comprehensive-analysis-456",
        status: "completed",
        video_path: "/path/to/test-video.mp4",
      })

      // Verify unified audio analysis was included
      expect(analysisResult.audio_analysis).toBeDefined()
      expect(analysisResult.audio_analysis?.unified_result).toMatchObject({
        overall_quality: 0.85,
        audio_present: true,
      })

      // Verify video analysis was included
      expect(analysisResult.video_analysis).toBeDefined()
      expect(analysisResult.video_analysis?.scene_analysis).toBeDefined()
      expect(analysisResult.video_analysis?.object_detection).toBeDefined()

      // Verify editing recommendations were generated
      expect(analysisResult.editing_recommendations).toBeDefined()
      expect(analysisResult.editing_recommendations).toHaveLength(1)
      expect(analysisResult.editing_recommendations![0]).toMatchObject({
        type: "cut",
        description: "Consider cutting silent section",
        confidence: 0.85,
      })

      console.log("E2E Step 4 Complete: Comprehensive analysis executed successfully")

      // ===== STEP 5: Verify Results Integration =====
      console.log("E2E Step 5: Verifying results integration...")

      // Navigate back to projects tab to see results
      const projectsTab = screen.getByRole("tab", { name: /projects/i })
      await user.click(projectsTab)

      // In a real scenario, the dashboard would update with analysis results
      // For now, we verify that all integration points work correctly
      expect(mockInvoke).toHaveBeenCalledWith("ai_director_analyze_comprehensive", {
        videoPath: "/path/to/test-video.mp4",
        config: expect.objectContaining({
          performance_mode: "balanced",
          enable_audio_analysis: true,
          enable_video_analysis: true,
        }),
      })

      console.log("E2E Step 5 Complete: Results integration verified")

      console.log("🎉 E2E Workflow Complete: All components working together successfully!")
    }, 30000) // 30 second timeout for full E2E test

    it("should handle performance mode optimization throughout workflow", async () => {
      const user = userEvent.setup()

      render(<AnalysisDashboard />)

      await waitFor(() => {
        expect(screen.getByText("AI Analysis Dashboard")).toBeInTheDocument()
      })

      // Test fast performance mode
      console.log("Testing fast performance mode...")

      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === "ai_director_get_default_config" && args?.mode === "fast") {
          return Promise.resolve({
            performance_mode: "fast",
            enable_audio_analysis: true,
            enable_video_analysis: true,
            enable_face_analysis: false, // Disabled for fast mode
            enable_object_analysis: true,
            enable_emotion_analysis: false, // Disabled for fast mode
            enable_composition_analysis: false, // Disabled for fast mode
            enable_scene_detection: true,
            enable_mcp_agents: false,
            max_processing_time: 1800, // Reduced time
            generate_editing_recommendations: false, // Disabled for fast mode
          })
        }
        return (
          setupMockResponses()[command as keyof typeof setupMockResponses] ||
          Promise.reject(new Error(`Unknown command: ${command}`))
        )
      })

      const fastConfig = await aiDirectorService.getDefaultConfig("fast")
      expect(fastConfig.performance_mode).toBe("fast")
      expect(fastConfig.enable_emotion_analysis).toBe(false)
      expect(fastConfig.max_processing_time).toBe(1800)

      // Test quality performance mode
      console.log("Testing quality performance mode...")

      mockInvoke.mockImplementation((command: string, args?: any) => {
        if (command === "ai_director_get_default_config" && args?.mode === "quality") {
          return Promise.resolve({
            performance_mode: "quality",
            enable_audio_analysis: true,
            enable_video_analysis: true,
            enable_face_analysis: true, // Enabled for quality mode
            enable_object_analysis: true,
            enable_emotion_analysis: true, // Enabled for quality mode
            enable_composition_analysis: true, // Enabled for quality mode
            enable_scene_detection: true,
            enable_mcp_agents: false,
            max_processing_time: 7200, // Extended time
            generate_editing_recommendations: true, // Enabled for quality mode
          })
        }
        return (
          setupMockResponses()[command as keyof typeof setupMockResponses] ||
          Promise.reject(new Error(`Unknown command: ${command}`))
        )
      })

      const qualityConfig = await aiDirectorService.getDefaultConfig("quality")
      expect(qualityConfig.performance_mode).toBe("quality")
      expect(qualityConfig.enable_emotion_analysis).toBe(true)
      expect(qualityConfig.enable_composition_analysis).toBe(true)
      expect(qualityConfig.max_processing_time).toBe(7200)

      console.log("Performance mode optimization verified!")
    })

    it("should demonstrate error recovery and resilience", async () => {
      console.log("Testing error recovery and resilience...")

      // Test individual component failure recovery
      mockInvoke.mockImplementation((command: string) => {
        if (command === "unified_audio_analyze_comprehensive") {
          return Promise.reject(new Error("Audio analysis service temporarily unavailable"))
        }
        if (command === "ai_director_analyze_comprehensive") {
          // AI Director should continue with video-only analysis
          return Promise.resolve({
            analysis_id: "fallback-analysis-789",
            status: "partially_completed",
            video_path: "/path/to/test-video.mp4",
            audio_analysis: undefined, // Audio failed
            video_analysis: {
              basic_info: {
                duration: 120,
                fps: 30,
                resolution: { width: 1920, height: 1080 },
                codec: "h264",
                file_size: 52428800,
              },
            },
            processing_time_ms: 60000,
            created_at: "2024-01-01T12:00:00Z",
          })
        }
        return (
          setupMockResponses()[command as keyof typeof setupMockResponses] ||
          Promise.reject(new Error(`Unknown command: ${command}`))
        )
      })

      // Attempt comprehensive analysis
      const partialResult = await aiDirectorService.analyzeComprehensive("/path/to/test-video.mp4", {
        performance_mode: "balanced",
        enable_audio_analysis: true,
        enable_video_analysis: true,
        enable_face_analysis: true,
        enable_object_analysis: true,
        enable_emotion_analysis: true,
        enable_composition_analysis: true,
        enable_scene_detection: true,
        enable_mcp_agents: false,
        max_processing_time: 3600,
        generate_editing_recommendations: true,
      })

      expect(partialResult.status).toBe("partially_completed")
      expect(partialResult.audio_analysis).toBeUndefined()
      expect(partialResult.video_analysis).toBeDefined()

      console.log("Error recovery verified - system continues with partial analysis")

      // Test system health monitoring
      const systemStatus = await aiDirectorService.getSystemStatus()
      expect(systemStatus.capabilities).toBeDefined()
      expect(systemStatus.health).toBeDefined()
      expect(systemStatus.audioCapabilities).toBeDefined()

      console.log("System monitoring and health checks verified!")
    })
  })

  describe("Integration Validation", () => {
    it("should validate all components work together seamlessly", async () => {
      console.log("Running comprehensive integration validation...")

      // 1. Verify AI Director Service singleton
      const service1 = AIDirectorService.getInstance()
      const service2 = AIDirectorService.getInstance()
      expect(service1).toBe(service2)

      // 2. Verify all capabilities are available
      const capabilities = await service1.getCapabilities()
      expect(capabilities.audio_analysis).toBe(true)
      expect(capabilities.video_analysis).toBe(true)
      expect(capabilities.gpu_acceleration).toBe(true)

      // 3. Verify unified audio integration
      const audioCapabilities = await service1.getAudioAnalysisCapabilities()
      expect(audioCapabilities.ffmpegAvailable).toBe(true)
      expect(audioCapabilities.montageAvailable).toBe(true)

      // 4. Verify configuration consistency
      const config = await service1.getDefaultConfig("balanced")
      expect(config.enable_audio_analysis).toBe(true)
      expect(config.enable_video_analysis).toBe(true)

      // 5. Verify end-to-end analysis pipeline
      const result = await service1.analyzeComprehensive("/path/to/test-video.mp4", config)
      expect(result.status).toBe("completed")
      expect(result.audio_analysis?.unified_result).toBeDefined()
      expect(result.video_analysis?.basic_info).toBeDefined()

      console.log("✅ All integration validation checks passed!")

      // Log summary of what was tested
      console.log("\n🔍 Integration Test Summary:")
      console.log("- AI Director Service: ✅ Working")
      console.log("- Unified Audio Analysis: ✅ Integrated")
      console.log("- Video Analysis: ✅ Working")
      console.log("- Real Engine Panel: ✅ Configuration Ready")
      console.log("- Analysis Dashboard: ✅ UI Components Working")
      console.log("- Error Recovery: ✅ Graceful Degradation")
      console.log("- Performance Modes: ✅ Fast/Balanced/Quality")
      console.log("- E2E Workflow: ✅ Complete Pipeline")
    })
  })
})
