import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GpuEncoder } from "@/domains/video-editing/types"
import { GpuStatus, GpuStatusBadge } from "../../components/gpu-status"
import * as useGpuCapabilitiesModule from "../../hooks/use-gpu-capabilities"

// Мокаем хук useGpuCapabilities
vi.mock("../../hooks/use-gpu-capabilities", () => ({
  useGpuCapabilities: vi.fn(),
  formatGpuMemory: (bytes: number) => `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`,
  formatGpuUtilization: (percent: number) => `${percent}%`,
  getGpuEncoderDisplayName: (encoder: string) => encoder,
  getGpuRecommendations: () => ["Recommendation 1", "Recommendation 2"],
  getGpuStatusColor: () => "text-green-600",
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

describe("GpuStatus", () => {
  const mockGpuCapabilities = {
    hardware_acceleration_supported: true,
    available_encoders: [GpuEncoder.Nvenc, GpuEncoder.QuickSync],
    recommended_encoder: GpuEncoder.Nvenc,
    current_gpu: {
      id: "0",
      name: "NVIDIA GeForce RTX 3080",
      vendor: "NVIDIA",
      driver_version: "535.123.01",
      memory_total: 10737418240, // 10GB
      memory_used: 2147483648, // 2GB
      memory_free: 8589934592, // 8GB
      utilization: 45,
      temperature: 65,
      encoder_type: GpuEncoder.Nvenc,
      supported_codecs: [],
    },
    gpus: [],
  }

  const mockSystemInfo = {
    os: {
      type: "Linux",
      version: "5.15.0",
      architecture: "x86_64",
    },
    cpu: {
      cores: 16,
      arch: "x86_64",
    },
    memory: {
      total_bytes: 34359738368, // 32GB
      total_mb: 32768,
      total_gb: 32,
    },
    runtime: {
      rust_version: "0.25.0",
      tauri_version: "2.0.0",
    },
  }

  const mockCompilerSettings = {
    hardware_acceleration: true,
    preferred_encoder: GpuEncoder.AMF,
    quality: 85,
    max_concurrent_jobs: 2,
    cache_size_mb: 2048,
    temp_directory: "/tmp/timeline-studio",
    preview_quality: 85,
  }

  const mockUseGpuCapabilities = {
    gpuCapabilities: mockGpuCapabilities,
    currentGpu: mockGpuCapabilities.current_gpu,
    systemInfo: mockSystemInfo,
    ffmpegCapabilities: null,
    compilerSettings: mockCompilerSettings,
    isLoading: false,
    error: null,
    refreshCapabilities: vi.fn(),
    updateSettings: vi.fn(),
    checkHardwareAcceleration: vi.fn(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { useGpuCapabilities } = await import("../../hooks/use-gpu-capabilities")
    vi.mocked(useGpuCapabilities).mockReturnValue(mockUseGpuCapabilities)
  })

  it("should render GPU status with acceleration available", () => {
    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.acceleration")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.gpu.accelerationAvailable")).toBeInTheDocument()
    expect(screen.getByText("NVIDIA GeForce RTX 3080")).toBeInTheDocument()
  })

  it("should show loading skeleton when loading", () => {
    vi.mocked(useGpuCapabilitiesModule.useGpuCapabilities).mockReturnValue({
      ...mockUseGpuCapabilities,
      isLoading: true,
    })

    const { container } = render(<GpuStatus />)

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it("should show error state", () => {
    const errorMessage = "Failed to get GPU info"
    vi.mocked(useGpuCapabilitiesModule.useGpuCapabilities).mockReturnValue({
      ...mockUseGpuCapabilities,
      error: errorMessage,
    })

    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.error")).toBeInTheDocument()
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.gpu.retry")).toBeInTheDocument()
  })

  it("should handle retry on error", async () => {
    const errorMessage = "Failed to get GPU info"
    vi.mocked(useGpuCapabilitiesModule.useGpuCapabilities).mockReturnValue({
      ...mockUseGpuCapabilities,
      error: errorMessage,
    })

    render(<GpuStatus />)

    const retryButton = screen.getByText("videoCompiler.gpu.retry")
    fireEvent.click(retryButton)

    expect(mockUseGpuCapabilities.refreshCapabilities).toHaveBeenCalled()
  })

  it("should toggle GPU acceleration", async () => {
    render(<GpuStatus />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toBeChecked()

    fireEvent.click(switchElement)

    await waitFor(() => {
      expect(mockUseGpuCapabilities.updateSettings).toHaveBeenCalledWith({
        ...mockCompilerSettings,
        hardware_acceleration: false,
      })
    })
  })

  it("should disable switch when GPU not available", () => {
    vi.mocked(useGpuCapabilitiesModule.useGpuCapabilities).mockReturnValue({
      ...mockUseGpuCapabilities,
      gpuCapabilities: {
        ...mockGpuCapabilities,
        hardware_acceleration_supported: false,
      },
    })

    render(<GpuStatus />)

    const switchElement = screen.getByRole("switch")
    expect(switchElement).toBeDisabled()
  })

  it("should show GPU memory usage", () => {
    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.videoMemory")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.gpu.memoryUsed")).toBeInTheDocument()
    // Memory values are formatted by utility functions
    expect(screen.getByText(/2\.0 GB.*\/.*10\.0 GB/)).toBeInTheDocument()
  })

  it("should show GPU utilization", () => {
    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.gpuLoad")).toBeInTheDocument()
    expect(screen.getByText("videoCompiler.gpu.usage")).toBeInTheDocument()
    expect(screen.getByText("45%")).toBeInTheDocument()
  })

  it("should show available encoders", () => {
    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.encoders")).toBeInTheDocument()
    expect(screen.getByText("Nvenc")).toBeInTheDocument()
    expect(screen.getByText("QuickSync")).toBeInTheDocument()
  })

  it("should show system info", () => {
    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.system")).toBeInTheDocument()
    expect(screen.getByText(/Linux.*5\.15\.0.*x86_64/)).toBeInTheDocument()
    expect(screen.getByText(/16.*videoCompiler\.gpu\.cores.*x86_64/)).toBeInTheDocument()
  })

  it("should show recommendations", () => {
    render(<GpuStatus />)

    expect(screen.getByText("videoCompiler.gpu.recommendations")).toBeInTheDocument()
  })

  it("should call settings callback when button clicked", () => {
    const mockSettingsClick = vi.fn()

    render(<GpuStatus onSettingsClick={mockSettingsClick} />)

    const settingsButton = screen.getByTestId("settings-icon").closest("button")
    expect(settingsButton).toBeInTheDocument()
    fireEvent.click(settingsButton!)

    expect(mockSettingsClick).toHaveBeenCalled()
  })

  it("should hide details when showDetails is false", () => {
    render(<GpuStatus showDetails={false} />)

    expect(screen.queryByText("videoCompiler.gpu.videoMemory")).not.toBeInTheDocument()
    expect(screen.queryByText("videoCompiler.gpu.system")).not.toBeInTheDocument()
  })
})

describe("GpuStatusBadge", () => {
  const mockUseGpuCapabilities = {
    gpuCapabilities: {
      hardware_acceleration_supported: true,
      available_encoders: [GpuEncoder.Nvenc],
      recommended_encoder: GpuEncoder.Nvenc,
      current_gpu: {
        id: "0",
        name: "NVIDIA GeForce RTX 3080",
        vendor: "NVIDIA",
        driver_version: "535.123.01",
        memory_total: 10737418240, // 10GB
        memory_used: 2147483648, // 2GB
        memory_free: 8589934592, // 8GB
        utilization: 45,
        temperature: 65,
        encoder_type: GpuEncoder.Nvenc,
        supported_codecs: [],
      },
      gpus: [],
    },
    currentGpu: null,
    systemInfo: null,
    ffmpegCapabilities: null,
    compilerSettings: null,
    isLoading: false,
    error: null,
    refreshCapabilities: vi.fn(),
    updateSettings: vi.fn(),
    checkHardwareAcceleration: vi.fn(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { useGpuCapabilities } = await import("../../hooks/use-gpu-capabilities")
    vi.mocked(useGpuCapabilities).mockReturnValue(mockUseGpuCapabilities)
  })

  it("should render badge with GPU encoder", () => {
    render(<GpuStatusBadge />)

    expect(screen.getByText("Nvenc")).toBeInTheDocument()
  })

  it("should show loading skeleton", () => {
    vi.mocked(useGpuCapabilitiesModule.useGpuCapabilities).mockReturnValue({
      ...mockUseGpuCapabilities,
      isLoading: true,
    })

    const { container } = render(<GpuStatusBadge />)

    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it("should show CPU only when no GPU available", () => {
    vi.mocked(useGpuCapabilitiesModule.useGpuCapabilities).mockReturnValue({
      ...mockUseGpuCapabilities,
      gpuCapabilities: {
        hardware_acceleration_supported: false,
        available_encoders: [],
        recommended_encoder: undefined,
        current_gpu: undefined,
      },
    })

    render(<GpuStatusBadge />)

    expect(screen.getByText("videoCompiler.gpu.cpuOnly")).toBeInTheDocument()
  })

  it("should render as tooltip trigger", () => {
    const { container } = render(<GpuStatusBadge />)

    const badge = screen.getByText("Nvenc")
    expect(badge).toBeInTheDocument()

    // Check that the badge is wrapped in tooltip trigger
    const trigger = container.querySelector('[data-slot="tooltip-trigger"]')
    expect(trigger).toBeInTheDocument()
  })
})
