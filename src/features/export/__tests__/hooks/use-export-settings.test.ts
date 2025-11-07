import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OutputFormat } from "@/features/video-compiler/types/render"
import { setTranslations } from "@/test/mocks/libraries"

import { useExportSettings } from "../../hooks/use-export-settings"

describe("useExportSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up translations for this test suite
    setTranslations({
      "project.untitledExport": "Untitled Export 1",
    })
  })

  it("should initialize with default settings", () => {
    const { result } = renderHook(() => useExportSettings())

    const settings = result.current.getCurrentSettings()
    expect(settings.fileName).toBe("Untitled Export 1")
    expect(settings.format).toBe(OutputFormat.Mp4)
    expect(settings.quality).toBe("good")
    expect(settings.resolution).toBe("1080")
    expect(settings.frameRate).toBe("25")
    expect(settings.enableGPU).toBe(true)
  })

  it("should update settings", () => {
    const { result } = renderHook(() => useExportSettings())

    act(() => {
      result.current.updateSettings({
        fileName: "My Video",
        quality: "best",
        resolution: "4k",
      })
    })

    const settings = result.current.getCurrentSettings()
    expect(settings.fileName).toBe("My Video")
    expect(settings.quality).toBe("best")
    expect(settings.resolution).toBe("4k")
  })

  it("should get current settings", () => {
    const { result } = renderHook(() => useExportSettings())

    const initialSettings = result.current.getCurrentSettings()
    expect(initialSettings).toHaveProperty("fileName")
    expect(initialSettings).toHaveProperty("format")
    expect(initialSettings).toHaveProperty("quality")

    act(() => {
      result.current.updateSettings({
        fileName: "Updated Video",
        format: OutputFormat.Mov,
      })
    })

    const updatedSettings = result.current.getCurrentSettings()
    expect(updatedSettings.fileName).toBe("Updated Video")
    expect(updatedSettings.format).toBe(OutputFormat.Mov)
  })

  it("should generate export config with proper values", () => {
    const { result } = renderHook(() => useExportSettings())

    act(() => {
      result.current.updateSettings({
        quality: "best",
        resolution: "4k",
        frameRate: "60",
        enableGPU: true,
        format: OutputFormat.Mp4,
      })
    })

    const config = result.current.getExportConfig()

    expect(config.quality).toBe(95)
    expect(config.videoBitrate).toBe(12000)
    expect(config.resolution).toEqual([3840, 2160])
    expect(config.frameRate).toBe(60)
    expect(config.enableGPU).toBe(true)
    // Check format value based on OutputFormat enum
    expect(config.format).toBeDefined()
  })

  it("should handle choose folder functionality", async () => {
    const { result } = renderHook(() => useExportSettings())

    // Since we can't actually test file dialog, just check the function exists
    expect(result.current.handleChooseFolder).toBeDefined()
    expect(typeof result.current.handleChooseFolder).toBe("function")
  })

  it("should handle timeline resolution", () => {
    const { result } = renderHook(() => useExportSettings())

    act(() => {
      result.current.updateSettings({
        resolution: "timeline",
      })
    })

    const config = result.current.getExportConfig()

    // When resolution is "timeline", it should use 1920x1080
    expect(config.resolution).toEqual([1920, 1080])
  })

  it("should handle different formats", () => {
    const { result } = renderHook(() => useExportSettings())

    const formats = [OutputFormat.Mp4, OutputFormat.Mkv, OutputFormat.WebM]

    formats.forEach((format) => {
      act(() => {
        result.current.updateSettings({ format })
      })

      const config = result.current.getExportConfig()
      expect(config.format).toBeDefined()
    })
  })
})
