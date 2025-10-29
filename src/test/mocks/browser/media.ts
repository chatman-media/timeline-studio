import { vi } from "vitest"

export class MockHTMLVideoElement {
  public currentTime = 0
  public duration = 100
  public paused = true
  public playbackRate = 1
  public volume = 1
  public muted = false
  public src = ""
  public videoWidth = 1920
  public videoHeight = 1080
  public readyState = 4 // HAVE_ENOUGH_DATA
  public networkState = 2 // NETWORK_LOADED

  public play = vi.fn().mockResolvedValue(undefined)
  public pause = vi.fn()
  public load = vi.fn()
  public canPlayType = vi.fn().mockReturnValue("probably")

  public addEventListener = vi.fn()
  public removeEventListener = vi.fn()
  public dispatchEvent = vi.fn()

  private eventListeners = new Map<string, Array<(...args: any[]) => void>>()

  constructor() {
    this.addEventListener.mockImplementation((event: string, handler: (...args: any[]) => void) => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, [])
      }
      this.eventListeners.get(event)!.push(handler)
    })

    this.removeEventListener.mockImplementation((event: string, handler: (...args: any[]) => void) => {
      const handlers = this.eventListeners.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    })
  }

  // Simulate video events
  public simulateTimeUpdate(time: number) {
    this.currentTime = time
    this.dispatchEvent(new Event("timeupdate"))
    this.triggerEvent("timeupdate")
  }

  public simulateLoadedMetadata(duration = 100, width = 1920, height = 1080) {
    this.duration = duration
    this.videoWidth = width
    this.videoHeight = height
    this.readyState = 1 // HAVE_METADATA
    this.dispatchEvent(new Event("loadedmetadata"))
    this.triggerEvent("loadedmetadata")
  }

  public simulateLoadedData() {
    this.readyState = 2 // HAVE_CURRENT_DATA
    this.dispatchEvent(new Event("loadeddata"))
    this.triggerEvent("loadeddata")
  }

  public simulateCanPlay() {
    this.readyState = 3 // HAVE_FUTURE_DATA
    this.dispatchEvent(new Event("canplay"))
    this.triggerEvent("canplay")
  }

  public simulateCanPlayThrough() {
    this.readyState = 4 // HAVE_ENOUGH_DATA
    this.dispatchEvent(new Event("canplaythrough"))
    this.triggerEvent("canplaythrough")
  }

  public simulatePlay() {
    this.paused = false
    this.dispatchEvent(new Event("play"))
    this.triggerEvent("play")
  }

  public simulatePause() {
    this.paused = true
    this.dispatchEvent(new Event("pause"))
    this.triggerEvent("pause")
  }

  public simulateEnded() {
    this.paused = true
    this.currentTime = this.duration
    this.dispatchEvent(new Event("ended"))
    this.triggerEvent("ended")
  }

  public simulateError(error: any = { code: 4, message: "MEDIA_ELEMENT_ERROR" }) {
    const errorEvent = new Event("error")
    ;(errorEvent as any).error = error
    this.dispatchEvent(errorEvent)
    this.triggerEvent("error", errorEvent)
  }

  private triggerEvent(eventType: string, event?: Event) {
    const handlers = this.eventListeners.get(eventType)
    if (handlers) {
      handlers.forEach((handler) => handler(event || new Event(eventType)))
    }
  }
}

export class MockHTMLAudioElement extends MockHTMLVideoElement {
  constructor() {
    super()
    this.videoWidth = 0
    this.videoHeight = 0
  }
}

export function setupVideoMocks() {
  // Mock HTMLVideoElement
  Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })

  Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
    writable: true,
    value: vi.fn(),
  })

  Object.defineProperty(window.HTMLVideoElement.prototype, "load", {
    writable: true,
    value: vi.fn(),
  })

  // Mock HTMLMediaElement for compatibility
  Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    writable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })

  Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    writable: true,
    value: vi.fn(),
  })

  Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
    writable: true,
    value: vi.fn(),
  })

  // Mock constructor
  global.HTMLVideoElement = MockHTMLVideoElement as any
  global.HTMLAudioElement = MockHTMLAudioElement as any
}

// Web Audio API mocks
export function setupAudioMocks() {
  global.AudioContext = vi.fn().mockImplementation(() => ({
    createMediaElementSource: vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createMediaStreamDestination: vi.fn().mockReturnValue({
      stream: new MediaStream(),
    }),
    createGain: vi.fn().mockReturnValue({
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createAnalyser: vi.fn().mockReturnValue({
      frequencyBinCount: 1024,
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
      getFloatFrequencyData: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createDynamicsCompressor: vi.fn().mockReturnValue({
      threshold: { value: -24 },
      knee: { value: 30 },
      ratio: { value: 12 },
      attack: { value: 0.003 },
      release: { value: 0.25 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createBiquadFilter: vi.fn().mockReturnValue({
      type: "lowpass",
      frequency: { value: 350 },
      Q: { value: 1 },
      gain: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createConvolver: vi.fn().mockReturnValue({
      buffer: null,
      normalize: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createDelay: vi.fn().mockReturnValue({
      delayTime: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createOscillator: vi.fn().mockReturnValue({
      type: "sine",
      frequency: { value: 440 },
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    createWaveShaper: vi.fn().mockReturnValue({
      curve: null,
      oversample: "none",
      connect: vi.fn(),
      disconnect: vi.fn(),
    }),
    destination: {},
    close: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    state: "running",
    sampleRate: 44100,
  }))

  // MediaRecorder mock
  const MockMediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    state: "inactive",
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as any

  MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true)
  global.MediaRecorder = MockMediaRecorder

  // MediaStream mock
  global.MediaStream = vi.fn().mockImplementation(() => ({
    getTracks: vi.fn().mockReturnValue([]),
    getAudioTracks: vi.fn().mockReturnValue([]),
    getVideoTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    active: true,
    id: "mock-stream-id",
  }))

  // Mock navigator.mediaDevices for getUserMedia, getDisplayMedia, enumerateDevices
  Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    value: {
      getUserMedia: vi.fn().mockImplementation(() => {
        const stream = {
          getTracks: vi.fn().mockReturnValue([]),
          getAudioTracks: vi.fn().mockReturnValue([]),
          getVideoTracks: vi.fn().mockReturnValue([]),
          addTrack: vi.fn(),
          removeTrack: vi.fn(),
          getTrackById: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          active: true,
          id: "mock-stream-id",
        }
        return Promise.resolve(stream)
      }),
      getDisplayMedia: vi.fn().mockImplementation(() => {
        const stream = {
          getTracks: vi.fn().mockReturnValue([]),
          getAudioTracks: vi.fn().mockReturnValue([]),
          getVideoTracks: vi.fn().mockReturnValue([]),
          addTrack: vi.fn(),
          removeTrack: vi.fn(),
          getTrackById: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          active: true,
          id: "mock-stream-id",
        }
        return Promise.resolve(stream)
      }),
      enumerateDevices: vi.fn().mockResolvedValue([
        {
          deviceId: "default",
          groupId: "group1",
          kind: "audioinput",
          label: "Default - Microphone (Built-in)",
        },
        {
          deviceId: "default",
          groupId: "group2",
          kind: "videoinput",
          label: "Default - Camera (Built-in)",
        },
      ]),
    },
  })
}

// Helper to create a mock video element with specific properties
export function createMockVideo(props: Partial<MockHTMLVideoElement> = {}) {
  const video = new MockHTMLVideoElement()
  Object.assign(video, props)
  return video
}

// Helper to create a mock audio element
export function createMockAudio(props: Partial<MockHTMLAudioElement> = {}) {
  const audio = new MockHTMLAudioElement()
  Object.assign(audio, props)
  return audio
}

// Helper to reset media mocks
export function resetMediaMocks() {
  vi.clearAllMocks()
  setupVideoMocks()
  setupAudioMocks()
}
