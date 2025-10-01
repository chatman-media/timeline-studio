import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GpuEncoder } from "@/domains/video-editing/types"
import {
  formatGpuMemory,
  formatGpuUtilization,
  getGpuEncoderDisplayName,
  getGpuRecommendations,
  getGpuStatusColor,
  useGpuCapabilities,
} from "../../hooks/use-gpu-capabilities"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params) {
        return `${key} ${JSON.stringify(params)}`
      }
      return key
    },
  }),
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

describe("useGpuCapabilities", () => {
  let mockInvoke: any

  const mockGpuResponse = {
    available_encoders: ["Nvenc", "QuickSync"],
    recommended_encoder: "Nvenc",
    current_gpu: {
      name: "NVIDIA GeForce RTX 3080",
      driver_version: "535.123.01",
      memory_total: 10737418240, // 10GB
      memory_used: 2147483648, // 2GB
      utilization: 45,
      encoder_type: "Nvenc",
      supported_codecs: ["h264", "hevc"],
    },
    hardware_acceleration_supported: true,
  }

  const mockGpuCapabilities = {
    hardware_acceleration_supported: true,
    available_encoders: ["Nvenc", "QuickSync"],
    recommended_encoder: "Nvenc",
    current_gpu: mockGpuResponse.current_gpu,
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

  const mockFfmpegCapabilities = {
    version: "5.1.2",
    available_codecs: ["h264", "hevc", "vp9", "av1"],
    hardware_encoders: ["h264_nvenc", "h264_qsv"],
    path: "/usr/local/bin/ffmpeg",
  }

  const mockCompilerSettings = {
    hardware_acceleration: true,
    max_concurrent_jobs: 2,
    temp_directory: "/tmp/timeline-studio",
    cache_size_mb: 2048,
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    mockInvoke = vi.mocked(invoke)
  })

  it("should load GPU capabilities on mount", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuResponse)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.gpuCapabilities).toEqual(mockGpuCapabilities)
    expect(result.current.currentGpu).toEqual(mockGpuCapabilities.current_gpu)
    expect(result.current.systemInfo).toEqual(mockSystemInfo)
    expect(result.current.ffmpegCapabilities).toEqual(mockFfmpegCapabilities)
    expect(result.current.compilerSettings).toEqual(mockCompilerSettings)
    expect(result.current.error).toBeNull()
  })

  it("should handle error when loading capabilities", async () => {
    const errorMessage = "Failed to get GPU info"
    // Mock all 4 calls - first one fails, others succeed (but won't be reached due to Promise.all)
    mockInvoke
      .mockRejectedValueOnce(new Error(errorMessage))
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.gpuCapabilities).toBeNull()
  })

  it("should refresh capabilities", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuResponse)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Обновляем возможности
    mockInvoke
      .mockResolvedValueOnce({ ...mockGpuResponse, hardware_acceleration_supported: false })
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    await act(async () => {
      await result.current.refreshCapabilities()
    })

    expect(result.current.gpuCapabilities?.hardware_acceleration_supported).toBe(false)
  })

  it("should update compiler settings", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuResponse)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const newSettings = { ...mockCompilerSettings, hardware_acceleration: false }
    mockInvoke.mockResolvedValueOnce(undefined)

    await act(async () => {
      await result.current.updateSettings(newSettings)
    })

    expect(mockInvoke).toHaveBeenCalledWith("set_hardware_acceleration", { enabled: false })
    expect(result.current.compilerSettings).toEqual(newSettings)
  })

  it("should check hardware acceleration", async () => {
    mockInvoke
      .mockResolvedValueOnce(mockGpuResponse)
      .mockResolvedValueOnce(mockSystemInfo)
      .mockResolvedValueOnce(mockFfmpegCapabilities)
      .mockResolvedValueOnce(mockCompilerSettings)

    const { result } = renderHook(() => useGpuCapabilities())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockInvoke.mockResolvedValueOnce(true)

    const hasAcceleration = await result.current.checkHardwareAcceleration()

    expect(mockInvoke).toHaveBeenCalledWith("check_hardware_acceleration_support")
    expect(hasAcceleration).toBe(true)
  })
})

describe("GPU utility functions", () => {
  const mockT = (key: string, params?: any) => {
    if (key === "common.unknown") return "Unknown"
    if (key === "common.gigabytes") return `${params.value} GB`
    if (key === "common.megabytes") return `${params.value} MB`
    if (key === "videoCompiler.gpu.cpuNoAcceleration") return "CPU (No Acceleration)"
    if (key === "videoCompiler.gpu.loadingInfo") return "Loading GPU info..."
    if (key === "videoCompiler.gpu.recommendations.noAcceleration") return "No GPU acceleration available"
    if (key === "videoCompiler.gpu.recommendations.installDrivers") return "Install latest GPU drivers"
    if (key === "videoCompiler.gpu.recommendations.nvenc") return "NVIDIA NVENC detected"
    if (key === "videoCompiler.gpu.recommendations.nvencQuality") return "Use quality 85-90 for best results"
    if (key === "videoCompiler.gpu.recommendations.quicksync") return "Intel QuickSync detected"
    if (key === "videoCompiler.gpu.recommendations.quicksyncQuality") return "Use quality 80-85 for best results"
    if (key === "videoCompiler.gpu.recommendations.videotoolbox") return "Apple VideoToolbox detected"
    if (key === "videoCompiler.gpu.recommendations.videotoolboxCodec") return "Use HEVC for best efficiency"
    if (key === "videoCompiler.gpu.recommendations.lowMemory") return "Low GPU memory detected"
    if (key === "videoCompiler.gpu.recommendations.highMemory") return "High GPU memory available"
    return key
  }

  describe("getGpuEncoderDisplayName", () => {
    it("should return display names for known encoders", () => {
      expect(getGpuEncoderDisplayName("Nvenc", mockT)).toBe("NVIDIA NVENC")
      expect(getGpuEncoderDisplayName("QuickSync", mockT)).toBe("Intel QuickSync")
      expect(getGpuEncoderDisplayName("VideoToolbox", mockT)).toBe("Apple VideoToolbox")
      expect(getGpuEncoderDisplayName("AMF", mockT)).toBe("AMD AMF")
      expect(getGpuEncoderDisplayName("None", mockT)).toBe("CPU (No Acceleration)")
    })

    it("should return original name for unknown encoders", () => {
      expect(getGpuEncoderDisplayName("CustomEncoder", mockT)).toBe("CustomEncoder")
    })
  })

  describe("getGpuStatusColor", () => {
    it("should return correct color classes", () => {
      expect(getGpuStatusColor(true)).toBe("text-green-600 dark:text-green-400")
      expect(getGpuStatusColor(false)).toBe("text-yellow-600 dark:text-yellow-400")
    })
  })

  describe("formatGpuMemory", () => {
    it("should format bytes to GB for large values", () => {
      const gb10 = 10 * 1024 * 1024 * 1024
      expect(formatGpuMemory(gb10, mockT)).toBe("10.0 GB")
    })

    it("should format bytes to MB for small values", () => {
      const mb512 = 512 * 1024 * 1024
      expect(formatGpuMemory(mb512, mockT)).toBe("512 MB")
    })

    it("should handle undefined values", () => {
      expect(formatGpuMemory(undefined as any, mockT)).toBe("Unknown")
    })
  })

  describe("formatGpuUtilization", () => {
    it("should format utilization as percentage", () => {
      expect(formatGpuUtilization(45.6, mockT)).toBe("46%")
      expect(formatGpuUtilization(99.9, mockT)).toBe("100%")
      expect(formatGpuUtilization(0, mockT)).toBe("0%")
    })

    it("should handle undefined values", () => {
      expect(formatGpuUtilization(undefined as any, mockT)).toBe("Unknown")
    })
  })

  describe("getGpuRecommendations", () => {
    it("should return loading message when capabilities are null", () => {
      const recommendations = getGpuRecommendations(null, mockT)
      expect(recommendations).toEqual(["Loading GPU info..."])
    })

    it("should recommend driver installation when no GPU acceleration", () => {
      const capabilities = {
        hardware_acceleration_supported: false,
        available_encoders: [],
        recommended_encoder: undefined,
        current_gpu: undefined,
        gpus: [],
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("No GPU acceleration available")
      expect(recommendations).toContain("Install latest GPU drivers")
    })

    it("should provide NVENC recommendations", () => {
      const capabilities = {
        hardware_acceleration_supported: true,
        available_encoders: [GpuEncoder.Nvenc],
        recommended_encoder: GpuEncoder.Nvenc,
        current_gpu: {
          name: "NVIDIA RTX 3080",
          driver_version: "535.123.01",
          memory_total: 10 * 1024 * 1024 * 1024,
          memory_used: 2147483648,
          utilization: 45,
          encoder_type: GpuEncoder.Nvenc,
          supported_codecs: ["h264", "hevc"],
        },
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("NVIDIA NVENC detected")
      expect(recommendations).toContain("Use quality 85-90 for best results")
      expect(recommendations).toContain("High GPU memory available")
    })

    it("should provide QuickSync recommendations", () => {
      const capabilities = {
        hardware_acceleration_supported: true,
        available_encoders: [GpuEncoder.QuickSync],
        recommended_encoder: GpuEncoder.QuickSync,
        current_gpu: {
          name: "Intel UHD Graphics",
          driver_version: "31.0.101.2125",
          memory_total: 1.5 * 1024 * 1024 * 1024,
          memory_used: 536870912,
          utilization: 30,
          encoder_type: GpuEncoder.QuickSync,
          supported_codecs: ["h264", "hevc"],
        },
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("Intel QuickSync detected")
      expect(recommendations).toContain("Use quality 80-85 for best results")
      expect(recommendations).toContain("Low GPU memory detected")
    })

    it("should provide VideoToolbox recommendations", () => {
      const capabilities = {
        hardware_acceleration_supported: true,
        available_encoders: [GpuEncoder.VideoToolbox],
        recommended_encoder: GpuEncoder.VideoToolbox,
        current_gpu: {
          name: "Apple M1",
          driver_version: "Metal 3.0",
          memory_total: 8 * 1024 * 1024 * 1024,
          memory_used: 2147483648,
          utilization: 25,
          encoder_type: GpuEncoder.VideoToolbox,
          supported_codecs: ["h264", "hevc"],
        },
      }
      const recommendations = getGpuRecommendations(capabilities, mockT)
      expect(recommendations).toContain("Apple VideoToolbox detected")
      expect(recommendations).toContain("Use HEVC for best efficiency")
      expect(recommendations).toContain("High GPU memory available")
    })
  })
})
