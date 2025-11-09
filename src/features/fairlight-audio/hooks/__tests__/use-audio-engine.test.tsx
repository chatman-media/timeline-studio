import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Mock AudioEngine using hoisted pattern
const {
  mockDispose,
  mockInitialize,
  mockConnectMediaElement,
  mockUpdateChannelVolume,
  mockUpdateChannelPan,
  mockMuteChannel,
  mockSoloChannel,
  mockUpdateMasterVolume,
  mockEnableLimiter,
  mockSetLimiterThreshold,
  mockCreateChannel,
  mockGetChannelAnalyser,
  mockGetMasterAnalyser,
  mockGetChannels,
  MockAudioEngine,
} = vi.hoisted(() => {
  const mockDispose = vi.fn()
  const mockInitialize = vi.fn().mockResolvedValue(undefined)
  const mockConnectMediaElement = vi.fn()
  const mockUpdateChannelVolume = vi.fn()
  const mockUpdateChannelPan = vi.fn()
  const mockMuteChannel = vi.fn()
  const mockSoloChannel = vi.fn()
  const mockUpdateMasterVolume = vi.fn()
  const mockEnableLimiter = vi.fn()
  const mockSetLimiterThreshold = vi.fn()
  const mockCreateChannel = vi.fn()
  const mockGetChannelAnalyser = vi.fn()
  const mockGetMasterAnalyser = vi.fn()
  const mockGetChannels = vi.fn().mockReturnValue(new Map())

  class MockAudioEngine {
    constructor() {
      // Assign mocks in constructor to ensure they're on the instance
      this.dispose = mockDispose
      this.initialize = mockInitialize
      this.connectMediaElement = mockConnectMediaElement
      this.updateChannelVolume = mockUpdateChannelVolume
      this.updateChannelPan = mockUpdateChannelPan
      this.muteChannel = mockMuteChannel
      this.soloChannel = mockSoloChannel
      this.updateMasterVolume = mockUpdateMasterVolume
      this.enableLimiter = mockEnableLimiter
      this.setLimiterThreshold = mockSetLimiterThreshold
      this.createChannel = mockCreateChannel
      this.getChannelAnalyser = mockGetChannelAnalyser
      this.getMasterAnalyser = mockGetMasterAnalyser
      this.getChannels = mockGetChannels
    }

    dispose!: typeof mockDispose
    initialize!: typeof mockInitialize
    connectMediaElement!: typeof mockConnectMediaElement
    updateChannelVolume!: typeof mockUpdateChannelVolume
    updateChannelPan!: typeof mockUpdateChannelPan
    muteChannel!: typeof mockMuteChannel
    soloChannel!: typeof mockSoloChannel
    updateMasterVolume!: typeof mockUpdateMasterVolume
    enableLimiter!: typeof mockEnableLimiter
    setLimiterThreshold!: typeof mockSetLimiterThreshold
    createChannel!: typeof mockCreateChannel
    getChannelAnalyser!: typeof mockGetChannelAnalyser
    getMasterAnalyser!: typeof mockGetMasterAnalyser
    getChannels!: typeof mockGetChannels
  }

  return {
    mockDispose,
    mockInitialize,
    mockConnectMediaElement,
    mockUpdateChannelVolume,
    mockUpdateChannelPan,
    mockMuteChannel,
    mockSoloChannel,
    mockUpdateMasterVolume,
    mockEnableLimiter,
    mockSetLimiterThreshold,
    mockCreateChannel,
    mockGetChannelAnalyser,
    mockGetMasterAnalyser,
    mockGetChannels,
    MockAudioEngine,
  }
})

vi.mock("../services/audio-engine", () => ({
  AudioEngine: MockAudioEngine,
}))

import { useAudioEngine } from "../use-audio-engine"

describe("useAudioEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should create and initialize audio engine on mount", async () => {
      const { result } = renderHook(() => useAudioEngine())

      expect(result.current.engine).toBeDefined()
      expect(mockInitialize).toHaveBeenCalled()

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })
    })

    it("should not be initialized initially", () => {
      const { result } = renderHook(() => useAudioEngine())
      expect(result.current.isInitialized).toBe(false)
    })

    it("should dispose engine on unmount", async () => {
      const { unmount } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(mockInitialize).toHaveBeenCalled()
      })

      unmount()

      expect(mockDispose).toHaveBeenCalled()
    })

    it("should handle initialization errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockInitialize.mockRejectedValueOnce(new Error("Init failed"))

      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(false)
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe("Media Element Connection", () => {
    it("should connect media element when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      const audioElement = document.createElement("audio")
      result.current.connectMediaElement("channel1", audioElement as HTMLAudioElement)

      expect(mockConnectMediaElement).toHaveBeenCalledWith("channel1", audioElement)
    })

    it("should not connect media element when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      const audioElement = document.createElement("audio")
      result.current.connectMediaElement("channel1", audioElement as HTMLAudioElement)

      expect(mockConnectMediaElement).not.toHaveBeenCalled()
    })
  })

  describe("Volume Control", () => {
    it("should update channel volume when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.updateChannelVolume("channel1", 75)

      expect(mockUpdateChannelVolume).toHaveBeenCalledWith("channel1", 75)
    })

    it("should not update volume when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.updateChannelVolume("channel1", 75)

      expect(mockUpdateChannelVolume).not.toHaveBeenCalled()
    })

    it("should update master volume when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.updateMasterVolume(80)

      expect(mockUpdateMasterVolume).toHaveBeenCalledWith(80)
    })

    it("should not update master volume when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.updateMasterVolume(80)

      expect(mockUpdateMasterVolume).not.toHaveBeenCalled()
    })
  })

  describe("Pan Control", () => {
    it("should update channel pan when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.updateChannelPan("channel1", 50)

      expect(mockUpdateChannelPan).toHaveBeenCalledWith("channel1", 50)
    })

    it("should not update pan when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.updateChannelPan("channel1", 50)

      expect(mockUpdateChannelPan).not.toHaveBeenCalled()
    })
  })

  describe("Mute Control", () => {
    it("should mute channel when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.muteChannel("channel1", true)

      expect(mockMuteChannel).toHaveBeenCalledWith("channel1", true)
    })

    it("should not mute when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.muteChannel("channel1", true)

      expect(mockMuteChannel).not.toHaveBeenCalled()
    })
  })

  describe("Solo Control", () => {
    it("should solo channel when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.soloChannel("channel1", true)

      expect(mockSoloChannel).toHaveBeenCalledWith("channel1", true)
    })

    it("should not solo when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.soloChannel("channel1", true)

      expect(mockSoloChannel).not.toHaveBeenCalled()
    })
  })

  describe("Limiter Control", () => {
    it("should enable limiter when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.enableLimiter(true)

      expect(mockEnableLimiter).toHaveBeenCalledWith(true)
    })

    it("should not enable limiter when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.enableLimiter(true)

      expect(mockEnableLimiter).not.toHaveBeenCalled()
    })

    it("should set limiter threshold when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      result.current.setLimiterThreshold(-6)

      expect(mockSetLimiterThreshold).toHaveBeenCalledWith(-6)
    })

    it("should not set threshold when not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      result.current.setLimiterThreshold(-6)

      expect(mockSetLimiterThreshold).not.toHaveBeenCalled()
    })
  })

  describe("Channel Management", () => {
    it("should create channel when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      const mockChannel = { id: "channel1" }
      mockCreateChannel.mockReturnValue(mockChannel)

      const channel = result.current.createChannel("channel1")

      expect(mockCreateChannel).toHaveBeenCalledWith("channel1")
      expect(channel).toBe(mockChannel)
    })

    it("should return null when creating channel while not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      const channel = result.current.createChannel("channel1")

      expect(mockCreateChannel).not.toHaveBeenCalled()
      expect(channel).toBeNull()
    })
  })

  describe("Analyser Access", () => {
    it("should get channel analyser when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      const mockAnalyser = {}
      mockGetChannelAnalyser.mockReturnValue(mockAnalyser)

      const analyser = result.current.getChannelAnalyser("channel1")

      expect(mockGetChannelAnalyser).toHaveBeenCalledWith("channel1")
      expect(analyser).toBe(mockAnalyser)
    })

    it("should return null when getting analyser while not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      const analyser = result.current.getChannelAnalyser("channel1")

      expect(mockGetChannelAnalyser).not.toHaveBeenCalled()
      expect(analyser).toBeNull()
    })

    it("should get master analyser when initialized", async () => {
      const { result } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      const mockAnalyser = {}
      mockGetMasterAnalyser.mockReturnValue(mockAnalyser)

      const analyser = result.current.getMasterAnalyser()

      expect(mockGetMasterAnalyser).toHaveBeenCalled()
      expect(analyser).toBe(mockAnalyser)
    })

    it("should return null when getting master analyser while not initialized", () => {
      const { result } = renderHook(() => useAudioEngine())

      const analyser = result.current.getMasterAnalyser()

      expect(mockGetMasterAnalyser).not.toHaveBeenCalled()
      expect(analyser).toBeNull()
    })
  })

  describe("Cleanup", () => {
    it("should reset initialization state on unmount", async () => {
      const { result, unmount } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      unmount()

      // After unmount, if we render again, it should start uninitialized
      const { result: newResult } = renderHook(() => useAudioEngine())
      expect(newResult.current.isInitialized).toBe(false)
    })

    it("should only create one engine instance per hook", () => {
      const { rerender } = renderHook(() => useAudioEngine())

      const initialCallCount = mockInitialize.mock.calls.length

      rerender()
      rerender()
      rerender()

      expect(mockInitialize.mock.calls.length).toBe(initialCallCount)
    })
  })

  describe("Hook Stability", () => {
    it("should return stable callback references when initialization state does not change", async () => {
      const { result, rerender } = renderHook(() => useAudioEngine())

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })

      const callbacks = {
        connectMediaElement: result.current.connectMediaElement,
        updateChannelVolume: result.current.updateChannelVolume,
        updateChannelPan: result.current.updateChannelPan,
        muteChannel: result.current.muteChannel,
        soloChannel: result.current.soloChannel,
        updateMasterVolume: result.current.updateMasterVolume,
        enableLimiter: result.current.enableLimiter,
        setLimiterThreshold: result.current.setLimiterThreshold,
        createChannel: result.current.createChannel,
        getChannelAnalyser: result.current.getChannelAnalyser,
        getMasterAnalyser: result.current.getMasterAnalyser,
      }

      rerender()

      expect(result.current.connectMediaElement).toBe(callbacks.connectMediaElement)
      expect(result.current.updateChannelVolume).toBe(callbacks.updateChannelVolume)
      expect(result.current.updateChannelPan).toBe(callbacks.updateChannelPan)
      expect(result.current.muteChannel).toBe(callbacks.muteChannel)
      expect(result.current.soloChannel).toBe(callbacks.soloChannel)
      expect(result.current.updateMasterVolume).toBe(callbacks.updateMasterVolume)
      expect(result.current.enableLimiter).toBe(callbacks.enableLimiter)
      expect(result.current.setLimiterThreshold).toBe(callbacks.setLimiterThreshold)
      expect(result.current.createChannel).toBe(callbacks.createChannel)
      expect(result.current.getChannelAnalyser).toBe(callbacks.getChannelAnalyser)
      expect(result.current.getMasterAnalyser).toBe(callbacks.getMasterAnalyser)
    })
  })
})
