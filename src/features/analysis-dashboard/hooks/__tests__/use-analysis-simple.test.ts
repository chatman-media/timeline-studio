/**
 * @vitest-environment jsdom
 */

import { invoke } from "@tauri-apps/api/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { QualityMode } from "../../types/analysis"
import { useAnalysis } from "../use-analysis"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const mockInvoke = vi.mocked(invoke)

describe("useAnalysis Hook - Simple Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockConfig = {
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

  it("should initialize with correct structure", async () => {
    mockInvoke.mockResolvedValueOnce([])

    const { result } = renderHook(() => useAnalysis())

    expect(result.current.dashboardData).toHaveProperty("projects")
    expect(result.current.dashboardData).toHaveProperty("recentScenes")
    expect(result.current.dashboardData).toHaveProperty("topMoments")
    expect(typeof result.current.loading).toBe("boolean")
    expect(result.current.error).toBeNull()
  })

  it("should call get_active_analysis_projects on mount", async () => {
    mockInvoke.mockResolvedValueOnce([])

    renderHook(() => useAnalysis())

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_active_analysis_projects")
    })
  })

  it("should get default config", async () => {
    mockInvoke.mockResolvedValueOnce([]) // initial projects
    mockInvoke.mockResolvedValueOnce(mockConfig) // get default config

    const { result } = renderHook(() => useAnalysis())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let config = null
    await act(async () => {
      config = await result.current.getDefaultConfig()
    })

    expect(config).toEqual(mockConfig)
    expect(mockInvoke).toHaveBeenCalledWith("get_default_analysis_config")
  })

  it("should handle API errors gracefully", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("API Error"))

    const { result } = renderHook(() => useAnalysis())

    await waitFor(() => {
      expect(result.current.error).toContain("API Error")
    })
  })

  it("should allow manual error setting", async () => {
    mockInvoke.mockResolvedValueOnce([])

    const { result } = renderHook(() => useAnalysis())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.setError("Manual error")
    })

    expect(result.current.error).toBe("Manual error")

    act(() => {
      result.current.setError(null)
    })

    expect(result.current.error).toBe(null)
  })

  it("should provide all expected methods", async () => {
    mockInvoke.mockResolvedValueOnce([])

    const { result } = renderHook(() => useAnalysis())

    expect(typeof result.current.createProject).toBe("function")
    expect(typeof result.current.getProject).toBe("function")
    expect(typeof result.current.getProgress).toBe("function")
    expect(typeof result.current.startAnalysis).toBe("function")
    expect(typeof result.current.getProjectScenes).toBe("function")
    expect(typeof result.current.getProjectMoments).toBe("function")
    expect(typeof result.current.getProjectStatistics).toBe("function")
    expect(typeof result.current.searchProjectData).toBe("function")
    expect(typeof result.current.getDefaultConfig).toBe("function")
    expect(typeof result.current.getActiveProjects).toBe("function")
    expect(typeof result.current.setError).toBe("function")
  })
})
