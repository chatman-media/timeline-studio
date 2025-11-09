import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock AutomationEngine using hoisted pattern
const {
  mockRegisterParameterCallback,
  mockWriteParameter,
  mockTouchParameter,
  mockReleaseParameter,
  mockSetMode,
  mockStartRecording,
  mockStopRecording,
  mockUpdateTime,
  mockCreateLane,
  mockGetState,
  mockExportAutomation,
  mockImportAutomation,
  MockAutomationEngine,
} = vi.hoisted(() => {
  const mockRegisterParameterCallback = vi.fn()
  const mockWriteParameter = vi.fn()
  const mockTouchParameter = vi.fn()
  const mockReleaseParameter = vi.fn()
  const mockSetMode = vi.fn()
  const mockStartRecording = vi.fn()
  const mockStopRecording = vi.fn()
  const mockUpdateTime = vi.fn()
  const mockCreateLane = vi.fn()
  const mockGetState = vi.fn()
  const mockExportAutomation = vi.fn()
  const mockImportAutomation = vi.fn()

  class MockAutomationEngine {
    constructor() {
      // Assign mocks in constructor to ensure they're on the instance
      this.registerParameterCallback = mockRegisterParameterCallback
      this.writeParameter = mockWriteParameter
      this.touchParameter = mockTouchParameter
      this.releaseParameter = mockReleaseParameter
      this.setMode = mockSetMode
      this.startRecording = mockStartRecording
      this.stopRecording = mockStopRecording
      this.updateTime = mockUpdateTime
      this.createLane = mockCreateLane
      this.getState = mockGetState
      this.exportAutomation = mockExportAutomation
      this.importAutomation = mockImportAutomation
    }

    registerParameterCallback!: typeof mockRegisterParameterCallback
    writeParameter!: typeof mockWriteParameter
    touchParameter!: typeof mockTouchParameter
    releaseParameter!: typeof mockReleaseParameter
    setMode!: typeof mockSetMode
    startRecording!: typeof mockStartRecording
    stopRecording!: typeof mockStopRecording
    updateTime!: typeof mockUpdateTime
    createLane!: typeof mockCreateLane
    getState!: typeof mockGetState
    exportAutomation!: typeof mockExportAutomation
    importAutomation!: typeof mockImportAutomation
  }

  return {
    mockRegisterParameterCallback,
    mockWriteParameter,
    mockTouchParameter,
    mockReleaseParameter,
    mockSetMode,
    mockStartRecording,
    mockStopRecording,
    mockUpdateTime,
    mockCreateLane,
    mockGetState,
    mockExportAutomation,
    mockImportAutomation,
    MockAutomationEngine,
  }
})

vi.mock("../services/automation-engine", () => ({
  AutomationEngine: MockAutomationEngine,
}))

// Mock useAudioEngine
const { mockUpdateChannelVolume, mockUpdateChannelPan, mockMuteChannel, mockSoloChannel, mockGetChannels } = vi.hoisted(() => {
  const mockUpdateChannelVolume = vi.fn()
  const mockUpdateChannelPan = vi.fn()
  const mockMuteChannel = vi.fn()
  const mockSoloChannel = vi.fn()
  const mockGetChannels = vi.fn()

  return {
    mockUpdateChannelVolume,
    mockUpdateChannelPan,
    mockMuteChannel,
    mockSoloChannel,
    mockGetChannels,
  }
})

vi.mock("../use-audio-engine", () => ({
  useAudioEngine: () => ({
    engine: {
      updateChannelVolume: mockUpdateChannelVolume,
      updateChannelPan: mockUpdateChannelPan,
      muteChannel: mockMuteChannel,
      soloChannel: mockSoloChannel,
      getChannels: mockGetChannels,
    },
  }),
}))

import { useAutomation } from "../use-automation"

describe("useAutomation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetChannels.mockReturnValue(
      new Map([
        ["channel1", {}],
        ["channel2", {}],
      ]),
    )
  })

  describe("Initialization", () => {
    it("should create automation engine on mount", () => {
      const { result } = renderHook(() => useAutomation())

      expect(result.current.automationEngine).toBeDefined()
    })

    it("should register parameters for all channels automatically", async () => {
      renderHook(() => useAutomation())

      await waitFor(() => {
        expect(mockRegisterParameterCallback).toHaveBeenCalled()
      })

      // Should register volume, pan, mute, solo for each channel
      const expectedCalls = 2 * 4 // 2 channels * 4 parameters
      expect(mockRegisterParameterCallback.mock.calls.length).toBeGreaterThanOrEqual(expectedCalls)
    })

    it("should register volume callback correctly", async () => {
      renderHook(() => useAutomation())

      await waitFor(() => {
        expect(mockRegisterParameterCallback).toHaveBeenCalled()
      })

      // Find the volume callback registration
      const volumeCall = mockRegisterParameterCallback.mock.calls.find((call) => call[0] === "channel1.volume")
      expect(volumeCall).toBeDefined()

      // Test the callback
      const callback = volumeCall![1]
      callback(75)
      expect(mockUpdateChannelVolume).toHaveBeenCalledWith("channel1", 75)
    })

    it("should register pan callback correctly", async () => {
      renderHook(() => useAutomation())

      await waitFor(() => {
        expect(mockRegisterParameterCallback).toHaveBeenCalled()
      })

      const panCall = mockRegisterParameterCallback.mock.calls.find((call) => call[0] === "channel1.pan")
      expect(panCall).toBeDefined()

      const callback = panCall![1]
      callback(0.75) // 0.75 should convert to 0.5 (center to right)
      expect(mockUpdateChannelPan).toHaveBeenCalledWith("channel1", 0.5)
    })

    it("should register mute callback correctly", async () => {
      renderHook(() => useAutomation())

      await waitFor(() => {
        expect(mockRegisterParameterCallback).toHaveBeenCalled()
      })

      const muteCall = mockRegisterParameterCallback.mock.calls.find((call) => call[0] === "channel1.mute")
      expect(muteCall).toBeDefined()

      const callback = muteCall![1]
      callback(0.6) // > 0.5 should mute
      expect(mockMuteChannel).toHaveBeenCalledWith("channel1", true)

      callback(0.4) // < 0.5 should unmute
      expect(mockMuteChannel).toHaveBeenCalledWith("channel1", false)
    })

    it("should register solo callback correctly", async () => {
      renderHook(() => useAutomation())

      await waitFor(() => {
        expect(mockRegisterParameterCallback).toHaveBeenCalled()
      })

      const soloCall = mockRegisterParameterCallback.mock.calls.find((call) => call[0] === "channel1.solo")
      expect(soloCall).toBeDefined()

      const callback = soloCall![1]
      callback(0.6) // > 0.5 should solo
      expect(mockSoloChannel).toHaveBeenCalledWith("channel1", true)

      callback(0.4) // < 0.5 should unsolo
      expect(mockSoloChannel).toHaveBeenCalledWith("channel1", false)
    })
  })

  describe("Parameter Registration", () => {
    it("should register custom parameter", () => {
      const { result } = renderHook(() => useAutomation())

      const callback = vi.fn()
      result.current.registerParameter("channel1", "customParam", callback)

      expect(mockRegisterParameterCallback).toHaveBeenCalledWith("channel1.customParam", callback)
    })

    it("should handle parameter registration without automation engine", () => {
      const { result } = renderHook(() => useAutomation())

      // Force automationEngine to be null temporarily
      ;(result.current as any).automationEngine = null

      const callback = vi.fn()
      result.current.registerParameter("channel1", "customParam", callback)

      // Should not throw
    })
  })

  describe("Parameter Writing", () => {
    it("should write parameter value", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.writeParameter("channel1", "volume", 80)

      expect(mockWriteParameter).toHaveBeenCalledWith("channel1.volume", 80)
    })

    it("should handle different parameters", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.writeParameter("channel2", "pan", 0.5)
      result.current.writeParameter("channel2", "mute", 1)

      expect(mockWriteParameter).toHaveBeenCalledWith("channel2.pan", 0.5)
      expect(mockWriteParameter).toHaveBeenCalledWith("channel2.mute", 1)
    })
  })

  describe("Touch Control", () => {
    it("should touch parameter", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.touchParameter("channel1", "volume")

      expect(mockTouchParameter).toHaveBeenCalledWith("channel1.volume")
    })

    it("should release parameter", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.releaseParameter("channel1", "volume")

      expect(mockReleaseParameter).toHaveBeenCalledWith("channel1.volume")
    })

    it("should handle touch/release sequence", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.touchParameter("channel1", "pan")
      result.current.writeParameter("channel1", "pan", 0.7)
      result.current.releaseParameter("channel1", "pan")

      expect(mockTouchParameter).toHaveBeenCalledWith("channel1.pan")
      expect(mockWriteParameter).toHaveBeenCalledWith("channel1.pan", 0.7)
      expect(mockReleaseParameter).toHaveBeenCalledWith("channel1.pan")
    })
  })

  describe("Mode Control", () => {
    it("should set automation mode", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.setMode("write")

      expect(mockSetMode).toHaveBeenCalledWith("write")
    })

    it("should handle different modes", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.setMode("read")
      expect(mockSetMode).toHaveBeenCalledWith("read")

      result.current.setMode("touch")
      expect(mockSetMode).toHaveBeenCalledWith("touch")

      result.current.setMode("latch")
      expect(mockSetMode).toHaveBeenCalledWith("latch")
    })
  })

  describe("Recording Control", () => {
    it("should start recording", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.startRecording()

      expect(mockStartRecording).toHaveBeenCalled()
    })

    it("should stop recording", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.stopRecording()

      expect(mockStopRecording).toHaveBeenCalled()
    })

    it("should handle recording session", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.startRecording()
      result.current.writeParameter("channel1", "volume", 75)
      result.current.stopRecording()

      expect(mockStartRecording).toHaveBeenCalled()
      expect(mockWriteParameter).toHaveBeenCalledWith("channel1.volume", 75)
      expect(mockStopRecording).toHaveBeenCalled()
    })
  })

  describe("Time Control", () => {
    it("should update time", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.updateTime(5.5)

      expect(mockUpdateTime).toHaveBeenCalledWith(5.5)
    })

    it("should handle time updates during playback", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.updateTime(0)
      result.current.updateTime(1.5)
      result.current.updateTime(3.0)

      expect(mockUpdateTime).toHaveBeenCalledTimes(3)
      expect(mockUpdateTime).toHaveBeenNthCalledWith(1, 0)
      expect(mockUpdateTime).toHaveBeenNthCalledWith(2, 1.5)
      expect(mockUpdateTime).toHaveBeenNthCalledWith(3, 3.0)
    })
  })

  describe("Lane Management", () => {
    it("should create lane", () => {
      const { result } = renderHook(() => useAutomation())

      const mockLane = { id: "lane1" }
      mockCreateLane.mockReturnValue(mockLane)

      const lane = result.current.createLane("channel1", "volume")

      expect(mockCreateLane).toHaveBeenCalledWith("channel1", "volume", 0.5)
      expect(lane).toBe(mockLane)
    })

    it("should create lane with custom initial value", () => {
      const { result } = renderHook(() => useAutomation())

      result.current.createLane("channel1", "pan", 0.75)

      expect(mockCreateLane).toHaveBeenCalledWith("channel1", "pan", 0.75)
    })

    it("should return undefined when creating lane without engine", () => {
      const { result } = renderHook(() => useAutomation())

      // Force automationEngine to be null
      ;(result.current as any).automationEngine = null

      const lane = result.current.createLane("channel1", "volume")

      expect(lane).toBeUndefined()
    })
  })

  describe("State Access", () => {
    it("should get automation state", () => {
      const { result } = renderHook(() => useAutomation())

      const mockState = { mode: "read", isRecording: false }
      mockGetState.mockReturnValue(mockState)

      const state = result.current.getState()

      expect(mockGetState).toHaveBeenCalled()
      expect(state).toBe(mockState)
    })

    it("should return null when getting state without engine", () => {
      const { result } = renderHook(() => useAutomation())

      // Force automationEngine to be null
      ;(result.current as any).automationEngine = null

      const state = result.current.getState()

      expect(state).toBeNull()
    })
  })

  describe("Export/Import", () => {
    it("should export automation data", () => {
      const { result } = renderHook(() => useAutomation())

      const mockData = { lanes: [], mode: "read" }
      mockExportAutomation.mockReturnValue(mockData)

      const data = result.current.exportAutomation()

      expect(mockExportAutomation).toHaveBeenCalled()
      expect(data).toBe(mockData)
    })

    it("should return null when exporting without engine", () => {
      const { result } = renderHook(() => useAutomation())

      // Force automationEngine to be null
      ;(result.current as any).automationEngine = null

      const data = result.current.exportAutomation()

      expect(data).toBeNull()
    })

    it("should import automation data", () => {
      const { result } = renderHook(() => useAutomation())

      const mockData = { lanes: [], mode: "read" }
      result.current.importAutomation(mockData)

      expect(mockImportAutomation).toHaveBeenCalledWith(mockData)
    })

    it("should handle import without engine", () => {
      const { result } = renderHook(() => useAutomation())

      // Force automationEngine to be null
      ;(result.current as any).automationEngine = null

      const mockData = { lanes: [], mode: "read" }
      result.current.importAutomation(mockData)

      expect(mockImportAutomation).not.toHaveBeenCalled()
    })

    it("should handle export/import round trip", () => {
      const { result } = renderHook(() => useAutomation())

      const mockData = {
        lanes: [{ channelId: "channel1", parameterId: "volume", points: [] }],
        mode: "write" as const,
      }
      mockExportAutomation.mockReturnValue(mockData)

      const exported = result.current.exportAutomation()
      result.current.importAutomation(exported)

      expect(mockExportAutomation).toHaveBeenCalled()
      expect(mockImportAutomation).toHaveBeenCalledWith(mockData)
    })
  })

  describe("Hook Stability", () => {
    it("should return stable callback references", () => {
      const { result, rerender } = renderHook(() => useAutomation())

      const callbacks = {
        registerParameter: result.current.registerParameter,
        writeParameter: result.current.writeParameter,
        touchParameter: result.current.touchParameter,
        releaseParameter: result.current.releaseParameter,
        setMode: result.current.setMode,
        startRecording: result.current.startRecording,
        stopRecording: result.current.stopRecording,
        updateTime: result.current.updateTime,
        createLane: result.current.createLane,
        getState: result.current.getState,
        exportAutomation: result.current.exportAutomation,
        importAutomation: result.current.importAutomation,
      }

      rerender()

      expect(result.current.registerParameter).toBe(callbacks.registerParameter)
      expect(result.current.writeParameter).toBe(callbacks.writeParameter)
      expect(result.current.touchParameter).toBe(callbacks.touchParameter)
      expect(result.current.releaseParameter).toBe(callbacks.releaseParameter)
      expect(result.current.setMode).toBe(callbacks.setMode)
      expect(result.current.startRecording).toBe(callbacks.startRecording)
      expect(result.current.stopRecording).toBe(callbacks.stopRecording)
      expect(result.current.updateTime).toBe(callbacks.updateTime)
      expect(result.current.createLane).toBe(callbacks.createLane)
      expect(result.current.getState).toBe(callbacks.getState)
      expect(result.current.exportAutomation).toBe(callbacks.exportAutomation)
      expect(result.current.importAutomation).toBe(callbacks.importAutomation)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty channel list", () => {
      mockGetChannels.mockReturnValue(new Map())

      renderHook(() => useAutomation())

      // Should not throw, automation engine still created
      expect(mockRegisterParameterCallback).toHaveBeenCalled()
    })

    it("should handle null audio engine", () => {
      vi.mock("../use-audio-engine", () => ({
        useAudioEngine: () => ({
          engine: null,
        }),
      }))

      renderHook(() => useAutomation())

      // Should not throw, automation engine still works independently
    })
  })
})
