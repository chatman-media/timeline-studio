/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { CameraCaptureModal } from "../../components/camera-capture-modal"

// Мокируем useToast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

// Мокируем useMediaImport
vi.mock("@/features/media/hooks/use-media-import", () => ({
  useMediaImport: () => ({
    importFile: vi.fn(),
    importFolder: vi.fn(),
    isImporting: false,
    progress: 0,
  }),
}))

// Mock MediaStream
global.MediaStream = vi.fn(() => ({
  getTracks: vi.fn().mockReturnValue([]),
  getAudioTracks: vi.fn().mockReturnValue([]),
  getVideoTracks: vi.fn().mockReturnValue([]),
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
})) as any

// Mock navigator.mediaDevices
beforeEach(() => {
  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn(),
      enumerateDevices: vi.fn(),
      getDisplayMedia: vi.fn(),
    },
    writable: true,
  })
})

// Мокаем хуки
vi.mock("../../hooks", () => ({
  useCameraPermissions: vi.fn(() => ({
    permissionStatus: "granted",
    errorMessage: null,
    requestPermissions: vi.fn(),
  })),
  useCameraStream: vi.fn(() => ({
    isDeviceReady: true,
    setIsDeviceReady: vi.fn(),
    initCamera: vi.fn(),
    streamRef: { current: null },
  })),
  useDeviceCapabilities: vi.fn(() => ({
    availableResolutions: ["1920x1080", "1280x720"],
    supportedResolutions: ["1920x1080", "1280x720"],
    supportedFrameRates: [30, 60],
    isLoadingCapabilities: false,
    getDeviceCapabilities: vi.fn(),
  })),
  useDevices: vi.fn(() => ({
    devices: [{ deviceId: "camera1", label: "Camera 1" }],
    audioDevices: [{ deviceId: "mic1", label: "Mic 1" }],
    selectedDevice: "camera1",
    selectedAudioDevice: "mic1",
    setSelectedDevice: vi.fn(),
    setSelectedAudioDevice: vi.fn(),
    getDevices: vi.fn(),
  })),
  useRecording: vi.fn(() => ({
    isRecording: false,
    recordingTime: 0,
    showCountdown: false,
    countdown: 3,
    setCountdown: vi.fn(),
    startCountdown: vi.fn(),
    stopRecording: vi.fn(),
    formatRecordingTime: vi.fn((time: number) => `00:${time.toString().padStart(2, "0")}`),
  })),
  useScreenCapture: vi.fn(() => ({
    screenStream: null,
    isScreenSharing: false,
    error: null,
    startScreenCapture: vi.fn(),
    stopScreenCapture: vi.fn(),
    getSourceInfo: vi.fn(() => null),
  })),
}))

vi.mock("@/domains/system-integration", () => ({
  useModals: vi.fn(() => ({
    activeModal: "camera-capture",
    modalData: null,
    isModalOpen: true,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    submitModal: vi.fn(),
    openCameraCapture: vi.fn(),
    openVoiceRecording: vi.fn(),
    openExport: vi.fn(),
    openProjectSettings: vi.fn(),
    openUserSettings: vi.fn(),
    openKeyboardShortcuts: vi.fn(),
    openColorGrading: vi.fn(),
    openEffectDetail: vi.fn(),
  })),
  useNotifications: vi.fn(() => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  })),
}))

// ModalProvider is no longer needed - using new modal architecture

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (typeof options === "string") {
        return options // default value
      }

      const translations: Record<string, string> = {
        "cameraCapture.cameraMode": "Camera",
        "cameraCapture.screenMode": "Screen",
        "cameraCapture.screenSettings": "Screen Recording Settings",
        "cameraCapture.screenInfo": "Select a window, tab, or entire screen to record",
        "cameraCapture.microphone": "Microphone",
        "cameraCapture.noAudio": "No Audio",
        "cameraCapture.countdown": "Countdown",
        "cameraCapture.noCountdown": "No countdown",
        "cameraCapture.seconds": "seconds",
        "dialogs.cameraCapture.device": "Camera",
        "dialogs.cameraCapture.quality": "Quality",
        "dialogs.cameraCapture.supportedResolutions": "{{count}} supported resolutions",
        "common.ok": "OK",
      }

      let result = translations[key] || key

      // Handle interpolation
      if (options && typeof options === "object") {
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
      }

      return result
    },
  }),
}))

describe("CameraCaptureModal - Screen Recording", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render mode switch buttons", () => {
    render(<CameraCaptureModal data-oid=":ixbcyc" />)

    expect(screen.getByText("Camera")).toBeInTheDocument()
    expect(screen.getByText("Screen")).toBeInTheDocument()
  })

  it("should switch to screen mode when Screen button is clicked", async () => {
    const mockStartScreenCapture = vi.fn()
    const mockStopScreenCapture = vi.fn()

    const { useScreenCapture } = await import("../../hooks")
    vi.mocked(useScreenCapture).mockReturnValue({
      screenStream: null,
      isScreenSharing: false,
      error: null,
      startScreenCapture: mockStartScreenCapture,
      stopScreenCapture: mockStopScreenCapture,
      getSourceInfo: vi.fn(() => null),
    })

    render(<CameraCaptureModal data-oid="b.440h6" />)

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      expect(mockStartScreenCapture).toHaveBeenCalledWith({
        video: true,
        audio: true,
      })
    })
  })

  it("should show screen settings when in screen mode", async () => {
    render(<CameraCaptureModal data-oid="al63ba0" />)

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      expect(screen.getByText("Screen Recording Settings")).toBeInTheDocument()
      expect(screen.getByText("Select a window, tab, or entire screen to record")).toBeInTheDocument()
    })
  })

  it("should hide camera settings when in screen mode", async () => {
    render(<CameraCaptureModal data-oid="1wntj2e" />)

    // Сначала проверяем что настройки камеры видны (ищем элемент по роли)
    expect(screen.getAllByRole("combobox").length).toBeGreaterThan(2) // Камера, микрофон, разрешение и т.д.

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      // В режиме экрана должно быть меньше combobox элементов (только микрофон и обратный отсчет)
      expect(screen.getAllByRole("combobox").length).toBeLessThan(3)
    })
  })

  it("should stop screen capture when switching back to camera", async () => {
    const mockStopScreenCapture = vi.fn()

    const mockScreenStream = {
      getTracks: vi.fn().mockReturnValue([]),
      getAudioTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    } as any

    const { useScreenCapture } = await import("../../hooks")
    vi.mocked(useScreenCapture).mockReturnValue({
      screenStream: mockScreenStream,
      isScreenSharing: true,
      error: null,
      startScreenCapture: vi.fn(),
      stopScreenCapture: mockStopScreenCapture,
      getSourceInfo: vi.fn(() => ({
        width: 1920,
        height: 1080,
        frameRate: 30,
        displaySurface: "monitor",
        cursor: "always",
      })),
    })

    render(<CameraCaptureModal data-oid="ug1z08t" />)

    // Переключаемся на экран
    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    // Переключаемся обратно на камеру
    const cameraButton = screen.getByText("Camera")
    fireEvent.click(cameraButton)

    await waitFor(() => {
      expect(mockStopScreenCapture).toHaveBeenCalled()
    })
  })

  it("should show error message if screen capture fails", async () => {
    const { useScreenCapture } = await import("../../hooks")
    vi.mocked(useScreenCapture).mockReturnValue({
      screenStream: null,
      isScreenSharing: false,
      error: "Permission denied",
      startScreenCapture: vi.fn().mockRejectedValue(new Error("Permission denied")),
      stopScreenCapture: vi.fn(),
      getSourceInfo: vi.fn(() => null),
    })

    render(<CameraCaptureModal data-oid="q1s8rks" />)

    const screenButton = screen.getByText("Screen")
    fireEvent.click(screenButton)

    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument()
    })
  })

  it("should disable mode switch buttons when recording", async () => {
    const { useRecording } = await import("../../hooks")
    vi.mocked(useRecording).mockReturnValue({
      isRecording: true,
      recordingTime: 10,
      showCountdown: false,
      countdown: 3,
      setCountdown: vi.fn(),
      startCountdown: vi.fn(),
      stopRecording: vi.fn(),
      formatRecordingTime: vi.fn((time: number) => `00:${time.toString().padStart(2, "0")}`),
    })

    render(<CameraCaptureModal data-oid="efmdjl1" />)

    const cameraButton = screen.getByText("Camera")
    const screenButton = screen.getByText("Screen")

    expect(cameraButton).toBeDisabled()
    expect(screenButton).toBeDisabled()
  })
})
