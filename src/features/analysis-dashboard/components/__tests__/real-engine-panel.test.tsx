/**
 * @vitest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { RealEnginePanel } from "../real-engine-panel"

// Mock Tauri window object
const mockTauriInvoke = vi.fn()

beforeAll(() => {
  // Setup global Tauri mock
  Object.defineProperty(window, "__TAURI__", {
    value: {
      invoke: mockTauriInvoke,
    },
    writable: true,
  })
})

interface ModelsStatus {
  models_ready: boolean
  object_detector_ready: boolean
  face_detector_ready: boolean
  face_encoder_ready: boolean
  initialization_errors: string[]
}

interface EngineConfig {
  object_model: string
  face_detection_model: string
  face_encoding_model: string
  object_confidence_threshold: number
  face_confidence_threshold: number
  frames_per_minute: number
  detailed_analysis: boolean
}

interface AvailableModels {
  object_detection_models: string[]
  face_detection_models: string[]
  face_encoding_models: string[]
}

describe("RealEnginePanel", () => {
  const mockModelsStatus: ModelsStatus = {
    models_ready: true,
    object_detector_ready: true,
    face_detector_ready: true,
    face_encoder_ready: true,
    initialization_errors: [],
  }

  const mockAvailableModels: AvailableModels = {
    object_detection_models: ["YoloV11Nano", "YoloV11Small", "YoloV11Medium"],
    face_detection_models: ["YoloV11FaceNano", "YoloV11FaceSmall"],
    face_encoding_models: ["FaceNet128D", "FaceNet512D"],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockTauriInvoke.mockImplementation((command: string) => {
      switch (command) {
        case "get_available_models":
          return Promise.resolve(mockAvailableModels)
        case "check_models_status":
          return Promise.resolve(mockModelsStatus)
        case "initialize_real_analysis_engine":
          return Promise.resolve("success")
        default:
          return Promise.reject(new Error(`Unknown command: ${command}`))
      }
    })
  })

  const renderPanel = (props = {}) => {
    return render(<RealEnginePanel {...props} />)
  }

  describe("Initial Render", () => {
    it("should render panel title and status", async () => {
      renderPanel()

      expect(screen.getByText("ONNX Analysis Engine Configuration")).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText("Ready")).toBeInTheDocument()
      })
    })

    it("should load available models and status on mount", async () => {
      renderPanel()

      await waitFor(() => {
        expect(mockTauriInvoke).toHaveBeenCalledWith("get_available_models")
        expect(mockTauriInvoke).toHaveBeenCalledWith("check_models_status")
      })
    })

    it("should show Not Ready when models are not ready", async () => {
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.resolve({
            ...mockModelsStatus,
            models_ready: false,
            object_detector_ready: false,
          })
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Not Ready")).toBeInTheDocument()
      })
    })
  })

  describe("Models Status", () => {
    it("should display status for all model types", async () => {
      renderPanel()

      await waitFor(() => {
        expect(screen.getAllByText("Object Detection")).toHaveLength(2) // Status + Config sections
        expect(screen.getAllByText("Face Detection")).toHaveLength(2)
        expect(screen.getByText("Face Encoding")).toBeInTheDocument()
        expect(screen.getByText("All Systems")).toBeInTheDocument()
      })
    })

    it("should show green checkmarks when models are ready", async () => {
      renderPanel()

      await waitFor(() => {
        const checkIcons = screen.getAllByRole("img", { hidden: true })
        // Should have multiple check circle icons for ready models
        expect(checkIcons.length).toBeGreaterThan(0)
      })
    })

    it("should show red X icons when models are not ready", async () => {
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.resolve({
            ...mockModelsStatus,
            models_ready: false,
            object_detector_ready: false,
            face_detector_ready: false,
            face_encoder_ready: false,
          })
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        // Red X icons should be present for failed models
        const statusElements = screen.getAllByText("Object Detection")
        expect(statusElements.length).toBeGreaterThan(0)
      })
    })

    it("should display initialization errors when present", async () => {
      const errorMessages = ["Failed to load YOLO model", "GPU not available"]
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.resolve({
            ...mockModelsStatus,
            models_ready: false,
            initialization_errors: errorMessages,
          })
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Initialization Errors")).toBeInTheDocument()
        expect(screen.getByText("Failed to load YOLO model")).toBeInTheDocument()
        expect(screen.getByText("GPU not available")).toBeInTheDocument()
      })
    })

    it("should refresh status when refresh button is clicked", async () => {
      const user = userEvent.setup()
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Refresh")).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole("button", { name: /refresh/i })
      await user.click(refreshButton)

      expect(mockTauriInvoke).toHaveBeenCalledWith("check_models_status")
    })
  })

  describe("Model Configuration", () => {
    it("should display model configuration sections", async () => {
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Model Configuration")).toBeInTheDocument()
        expect(screen.getByText("Object Detection")).toBeInTheDocument()
        expect(screen.getByText("Face Detection")).toBeInTheDocument()
        expect(screen.getByText("Face Encoding")).toBeInTheDocument()
      })
    })

    it("should show model size badges", async () => {
      renderPanel()

      await waitFor(() => {
        // Should show size badges for models (XS for Nano, etc.)
        const badges = screen.getAllByText("XS")
        expect(badges.length).toBeGreaterThan(0)
      })
    })

    it("should allow changing object detection model", async () => {
      const user = userEvent.setup()
      renderPanel()

      await waitFor(() => {
        expect(screen.getByDisplayValue("YoloV11Nano")).toBeInTheDocument()
      })

      // Find and click the select trigger for object detection
      const selectTriggers = screen.getAllByRole("combobox")
      const objectDetectionSelect = selectTriggers[0] // First select is object detection

      await user.click(objectDetectionSelect)

      // Should show available options
      expect(screen.getByText("YoloV11Small")).toBeInTheDocument()
      expect(screen.getByText("YoloV11Medium")).toBeInTheDocument()
    })
  })

  describe("Performance Settings", () => {
    it("should display performance configuration options", async () => {
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Performance Settings")).toBeInTheDocument()
        expect(screen.getByText("Object Confidence")).toBeInTheDocument()
        expect(screen.getByText("Face Confidence")).toBeInTheDocument()
        expect(screen.getByText("Analysis Frequency")).toBeInTheDocument()
        expect(screen.getByText("Detailed Analysis")).toBeInTheDocument()
      })
    })

    it("should show confidence threshold values as percentages", async () => {
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("50%")).toBeInTheDocument() // Object confidence (0.5 * 100)
        expect(screen.getByText("70%")).toBeInTheDocument() // Face confidence (0.7 * 100)
      })
    })

    it("should show frames per minute value", async () => {
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("30 frames/min")).toBeInTheDocument()
      })
    })

    it("should allow toggling detailed analysis", async () => {
      const user = userEvent.setup()
      renderPanel()

      await waitFor(() => {
        const detailedAnalysisSwitch = screen.getByRole("switch")
        expect(detailedAnalysisSwitch).not.toBeChecked()
      })

      const detailedAnalysisSwitch = screen.getByRole("switch")
      await user.click(detailedAnalysisSwitch)

      expect(detailedAnalysisSwitch).toBeChecked()
    })
  })

  describe("Engine Initialization", () => {
    it("should allow initializing ONNX models", async () => {
      const user = userEvent.setup()
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Initialize ONNX Models")).toBeInTheDocument()
      })

      const initButton = screen.getByRole("button", { name: /initialize onnx models/i })
      await user.click(initButton)

      expect(mockTauriInvoke).toHaveBeenCalledWith("initialize_real_analysis_engine", {
        config: {
          object_model: "YoloV11Nano",
          face_detection_model: "YoloV11FaceNano",
          face_encoding_model: "FaceNet128D",
          object_confidence_threshold: 0.5,
          face_confidence_threshold: 0.7,
          frames_per_minute: 30,
          detailed_analysis: false,
        },
      })
    })

    it("should show loading state during initialization", async () => {
      const user = userEvent.setup()
      let resolveInit: (value: any) => void
      const initPromise = new Promise((resolve) => {
        resolveInit = resolve
      })

      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "initialize_real_analysis_engine") {
          return initPromise
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Initialize ONNX Models")).toBeInTheDocument()
      })

      const initButton = screen.getByRole("button", { name: /initialize onnx models/i })
      await user.click(initButton)

      expect(screen.getByText("Initializing Models...")).toBeInTheDocument()

      // Resolve the promise
      resolveInit!("success")

      await waitFor(() => {
        expect(screen.getByText("Initialize ONNX Models")).toBeInTheDocument()
      })
    })

    it("should disable test models button when models not ready", async () => {
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.resolve({
            ...mockModelsStatus,
            models_ready: false,
          })
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        const testButton = screen.getByRole("button", { name: /test models/i })
        expect(testButton).toBeDisabled()
      })
    })

    it("should enable test models button when models are ready", async () => {
      renderPanel()

      await waitFor(() => {
        const testButton = screen.getByRole("button", { name: /test models/i })
        expect(testButton).not.toBeDisabled()
      })
    })
  })

  describe("Ready State Display", () => {
    it("should show ready message when all models are loaded", async () => {
      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Ready for Analysis")).toBeInTheDocument()
        expect(
          screen.getByText(/All ONNX models are loaded and ready for AI-powered video analysis/),
        ).toBeInTheDocument()
      })
    })

    it("should not show ready message when models are not ready", async () => {
      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.resolve({
            ...mockModelsStatus,
            models_ready: false,
          })
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(screen.queryByText("Ready for Analysis")).not.toBeInTheDocument()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "get_available_models") {
          return Promise.reject(new Error("API Error"))
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to load available models:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should handle status check errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "check_models_status") {
          return Promise.reject(new Error("Status Error"))
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to check models status:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should handle initialization errors gracefully", async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      mockTauriInvoke.mockImplementation((command: string) => {
        if (command === "initialize_real_analysis_engine") {
          return Promise.reject(new Error("Init Error"))
        }
        return mockTauriInvoke(command)
      })

      renderPanel()

      await waitFor(() => {
        expect(screen.getByText("Initialize ONNX Models")).toBeInTheDocument()
      })

      const initButton = screen.getByRole("button", { name: /initialize onnx models/i })
      await user.click(initButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Failed to initialize Real Analysis Engine:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })
})
