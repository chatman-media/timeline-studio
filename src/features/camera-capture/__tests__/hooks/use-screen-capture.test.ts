import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useScreenCapture } from "../../hooks/use-screen-capture"

// Мок для MediaStream
class MockMediaStream {
  tracks: MediaStreamTrack[] = []

  constructor(tracks: MediaStreamTrack[] = []) {
    this.tracks = tracks
  }

  getTracks() {
    return this.tracks
  }

  getVideoTracks() {
    return this.tracks.filter((t) => t.kind === "video")
  }

  getAudioTracks() {
    return this.tracks.filter((t) => t.kind === "audio")
  }
}

// Мок для MediaStreamTrack
class MockMediaStreamTrack implements Partial<MediaStreamTrack> {
  kind: string
  id: string
  enabled = true
  readyState: MediaStreamTrackState = "live"
  listeners: Record<string, ((event?: Event) => void)[]> = {}
  settings: MediaTrackSettings = {}
  
  // Добавляем недостающие свойства MediaStreamTrack
  contentHint = ""
  label = "mock-track"
  muted = false
  onended: ((this: MediaStreamTrack, ev: Event) => any) | null = null
  onmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null
  onunmute: ((this: MediaStreamTrack, ev: Event) => any) | null = null

  constructor(kind: string, settings: Partial<MediaTrackSettings> = {}) {
    this.kind = kind
    this.id = `${kind}-${Math.random()}`
    this.settings = {
      width: 1920,
      height: 1080,
      frameRate: 30,
      displaySurface: "monitor" as any,
      ...settings,
    } as MediaTrackSettings
  }

  stop = vi.fn(() => {
    this.readyState = "ended"
  })

  addEventListener(event: string, listener: (event?: Event) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
  }

  removeEventListener(event: string, listener: (event?: Event) => void) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((l) => l !== listener)
    }
  }

  dispatchEvent(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener())
    }
  }

  getSettings() {
    return this.settings
  }
}

describe("useScreenCapture", () => {
  let mockGetDisplayMedia: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockGetDisplayMedia = vi.fn()
    global.navigator = {
      mediaDevices: {
        getDisplayMedia: mockGetDisplayMedia,
      },
    } as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useScreenCapture())

    expect(result.current.screenStream).toBeNull()
    expect(result.current.isScreenSharing).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("should start screen capture successfully", async () => {
    const mockVideoTrack = new MockMediaStreamTrack("video")
    const mockStream = new MockMediaStream([mockVideoTrack])
    mockGetDisplayMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useScreenCapture())

    let capturedStream: MediaStream | undefined
    await act(async () => {
      capturedStream = await result.current.startScreenCapture()
    })

    expect(mockGetDisplayMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      preferCurrentTab: undefined,
    })

    expect(result.current.screenStream).toBe(mockStream)
    expect(result.current.isScreenSharing).toBe(true)
    expect(result.current.error).toBeNull()
    expect(capturedStream).toBe(mockStream)
  })

  it("should handle permission denied error", async () => {
    const error = new Error("Permission denied")
    mockGetDisplayMedia.mockRejectedValue(error)

    const { result } = renderHook(() => useScreenCapture())

    await act(async () => {
      try {
        await result.current.startScreenCapture()
      } catch (e) {
        // Expected error
      }
    })

    expect(result.current.error).toBe("Доступ к записи экрана запрещен")
    expect(result.current.isScreenSharing).toBe(false)
  })

  it("should handle user cancellation", async () => {
    const error = new Error("NotAllowedError")
    mockGetDisplayMedia.mockRejectedValue(error)

    const { result } = renderHook(() => useScreenCapture())

    await act(async () => {
      try {
        await result.current.startScreenCapture()
      } catch (e) {
        // Expected error
      }
    })

    expect(result.current.error).toBe("Пользователь отменил выбор экрана")
    expect(result.current.isScreenSharing).toBe(false)
  })

  it("should stop screen capture", async () => {
    const mockVideoTrack = new MockMediaStreamTrack("video")
    const mockAudioTrack = new MockMediaStreamTrack("audio")
    const mockStream = new MockMediaStream([mockVideoTrack, mockAudioTrack])
    mockGetDisplayMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useScreenCapture())

    await act(async () => {
      await result.current.startScreenCapture()
    })

    act(() => {
      result.current.stopScreenCapture()
    })

    expect(mockVideoTrack.stop).toHaveBeenCalled()
    expect(mockAudioTrack.stop).toHaveBeenCalled()
    expect(result.current.screenStream).toBeNull()
    expect(result.current.isScreenSharing).toBe(false)
  })

  it("should handle ended event from video track", async () => {
    const mockVideoTrack = new MockMediaStreamTrack("video")
    const mockStream = new MockMediaStream([mockVideoTrack])
    mockGetDisplayMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useScreenCapture())

    await act(async () => {
      await result.current.startScreenCapture()
    })

    // Симулируем событие ended
    act(() => {
      mockVideoTrack.dispatchEvent("ended")
    })

    expect(result.current.isScreenSharing).toBe(false)
    expect(result.current.screenStream).toBeNull()
  })

  it("should get source info", async () => {
    const mockVideoTrack = new MockMediaStreamTrack("video", {
      width: 2560,
      height: 1440,
      frameRate: 60,
      displaySurface: "window" as any,
    } as Partial<MediaTrackSettings>)
    const mockStream = new MockMediaStream([mockVideoTrack])
    mockGetDisplayMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useScreenCapture())

    await act(async () => {
      await result.current.startScreenCapture()
    })

    const sourceInfo = result.current.getSourceInfo()
    expect(sourceInfo).toEqual({
      width: 2560,
      height: 1440,
      frameRate: 60,
      displaySurface: "window",
    })
  })

  it("should accept custom constraints", async () => {
    const mockVideoTrack = new MockMediaStreamTrack("video")
    const mockStream = new MockMediaStream([mockVideoTrack])
    mockGetDisplayMedia.mockResolvedValue(mockStream)

    const { result } = renderHook(() => useScreenCapture())

    await act(async () => {
      await result.current.startScreenCapture({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
        preferCurrentTab: true,
      })
    })

    expect(mockGetDisplayMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
      preferCurrentTab: true,
    })
  })
})
