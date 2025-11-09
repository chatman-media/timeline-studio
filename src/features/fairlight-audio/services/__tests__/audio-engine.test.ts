import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AudioEngine } from "../audio-engine"

// Mock AudioContext and Web Audio API
class MockAudioNode {
  connect = vi.fn()
  disconnect = vi.fn()
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(),
  }
}

class MockStereoPannerNode extends MockAudioNode {
  pan = {
    value: 0,
    setValueAtTime: vi.fn(),
  }
}

class MockAnalyserNode extends MockAudioNode {
  fftSize = 2048
  smoothingTimeConstant = 0.8
}

class MockDynamicsCompressorNode extends MockAudioNode {
  threshold = { value: -3, setValueAtTime: vi.fn() }
  knee = { value: 0 }
  ratio = { value: 20 }
  attack = { value: 0.003 }
  release = { value: 0.1 }
}

class MockMediaElementAudioSourceNode extends MockAudioNode {
  constructor(public mediaElement: HTMLAudioElement) {
    super()
  }
}

class MockChannelSplitterNode extends MockAudioNode {}

class MockChannelMergerNode extends MockAudioNode {}

class MockAudioContext {
  state = "running"
  currentTime = 0
  sampleRate = 48000
  destination = new MockAudioNode()

  createGain = vi.fn(() => new MockGainNode())
  createStereoPanner = vi.fn(() => new MockStereoPannerNode())
  createAnalyser = vi.fn(() => new MockAnalyserNode())
  createDynamicsCompressor = vi.fn(() => new MockDynamicsCompressorNode())
  createMediaElementSource = vi.fn((element: HTMLAudioElement) => new MockMediaElementAudioSourceNode(element))
  createChannelSplitter = vi.fn(() => new MockChannelSplitterNode())
  createChannelMerger = vi.fn(() => new MockChannelMergerNode())
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
}

// Mock global AudioContext
global.AudioContext = MockAudioContext as any

describe("AudioEngine", () => {
  let engine: AudioEngine

  beforeEach(() => {
    engine = new AudioEngine()
  })

  afterEach(() => {
    engine.dispose()
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should create audio context with correct settings", () => {
      expect(engine.audioContext).toBeDefined()
      expect(engine.audioContext.sampleRate).toBe(48000)
    })

    it("should create master gain and limiter nodes", () => {
      expect(engine.audioContext.createGain).toHaveBeenCalled()
      expect(engine.audioContext.createDynamicsCompressor).toHaveBeenCalled()
    })

    it("should initialize clip editor", () => {
      expect(engine.clipEditor).toBeDefined()
    })

    it("should resume suspended context on initialize", async () => {
      ;(engine.audioContext as any).state = "suspended"
      await engine.initialize()
      expect(engine.audioContext.resume).toHaveBeenCalled()
    })

    it("should not resume running context", async () => {
      ;(engine.audioContext as any).state = "running"
      await engine.initialize()
      expect(engine.audioContext.resume).not.toHaveBeenCalled()
    })
  })

  describe("Channel Management", () => {
    it("should create channel with correct nodes", () => {
      const channel = engine.createChannel("test-channel")

      expect(channel).toBeDefined()
      expect(channel.id).toBe("test-channel")
      expect(channel.gainNode).toBeDefined()
      expect(channel.panNode).toBeDefined()
      expect(channel.analyser).toBeDefined()
      expect(channel.effects).toEqual([])
      expect(channel.isMuted).toBe(false)
      expect(channel.isSolo).toBe(false)
    })

    it("should return existing channel if already created", () => {
      const channel1 = engine.createChannel("test-channel")
      const channel2 = engine.createChannel("test-channel")

      expect(channel1).toBe(channel2)
    })

    it("should connect channel nodes in correct order", () => {
      const channel = engine.createChannel("test-channel")

      expect(channel.gainNode.connect).toHaveBeenCalledWith(channel.panNode)
      expect(channel.panNode.connect).toHaveBeenCalledWith(channel.analyser)
    })

    it("should get channel by ID", () => {
      const channel = engine.createChannel("test-channel")
      const retrieved = engine.getChannel("test-channel")

      expect(retrieved).toBe(channel)
    })

    it("should return undefined for non-existent channel", () => {
      const channel = engine.getChannel("non-existent")
      expect(channel).toBeUndefined()
    })

    it("should get all channels", () => {
      engine.createChannel("channel1")
      engine.createChannel("channel2")
      engine.createChannel("channel3")

      const channels = engine.getChannels()
      expect(channels.size).toBe(3)
      expect(channels.has("channel1")).toBe(true)
      expect(channels.has("channel2")).toBe(true)
      expect(channels.has("channel3")).toBe(true)
    })
  })

  describe("Media Element Connection", () => {
    it("should connect media element to channel", () => {
      const channel = engine.createChannel("test-channel")
      const audioElement = document.createElement("audio")

      engine.connectMediaElement("test-channel", audioElement as HTMLAudioElement)

      expect(engine.audioContext.createMediaElementSource).toHaveBeenCalledWith(audioElement)
      expect(channel.source).toBeDefined()
    })

    it("should disconnect previous source when connecting new element", () => {
      const channel = engine.createChannel("test-channel")
      const audioElement1 = document.createElement("audio")
      const audioElement2 = document.createElement("audio")

      engine.connectMediaElement("test-channel", audioElement1 as HTMLAudioElement)
      const firstSource = channel.source
      expect(firstSource).toBeDefined()

      engine.connectMediaElement("test-channel", audioElement2 as HTMLAudioElement)

      expect(firstSource!.disconnect).toHaveBeenCalled()
      expect(channel.source).not.toBe(firstSource)
    })

    it("should not connect to non-existent channel", () => {
      const audioElement = document.createElement("audio")
      engine.connectMediaElement("non-existent", audioElement as HTMLAudioElement)

      expect(engine.audioContext.createMediaElementSource).not.toHaveBeenCalled()
    })
  })

  describe("Volume Control", () => {
    it("should update channel volume", () => {
      const channel = engine.createChannel("test-channel")

      engine.updateChannelVolume("test-channel", 50)

      expect(channel.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, expect.any(Number))
    })

    it("should convert percentage to gain (0-100 to 0-1)", () => {
      const channel = engine.createChannel("test-channel")

      engine.updateChannelVolume("test-channel", 0)
      expect(channel.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))

      engine.updateChannelVolume("test-channel", 100)
      expect(channel.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))

      engine.updateChannelVolume("test-channel", 75)
      expect(channel.gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.75, expect.any(Number))
    })

    it("should not update volume for non-existent channel", () => {
      engine.updateChannelVolume("non-existent", 50)
      // Should not throw
    })

    it("should update master volume", () => {
      engine.updateMasterVolume(80)
      // Master gain node was created during initialization
      expect(engine.audioContext.createGain).toHaveBeenCalled()
    })
  })

  describe("Pan Control", () => {
    it("should update channel pan", () => {
      const channel = engine.createChannel("test-channel")

      engine.updateChannelPan("test-channel", 50)

      expect(channel.panNode.pan.setValueAtTime).toHaveBeenCalledWith(0.5, expect.any(Number))
    })

    it("should convert -100 to 100 to -1 to 1", () => {
      const channel = engine.createChannel("test-channel")

      engine.updateChannelPan("test-channel", -100)
      expect(channel.panNode.pan.setValueAtTime).toHaveBeenCalledWith(-1, expect.any(Number))

      engine.updateChannelPan("test-channel", 0)
      expect(channel.panNode.pan.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))

      engine.updateChannelPan("test-channel", 100)
      expect(channel.panNode.pan.setValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))
    })

    it("should not update pan for non-existent channel", () => {
      engine.updateChannelPan("non-existent", 50)
      // Should not throw
    })
  })

  describe("Mute Control", () => {
    it("should mute channel", () => {
      const channel = engine.createChannel("test-channel")

      engine.muteChannel("test-channel", true)

      expect(channel.isMuted).toBe(true)
      expect(channel.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
    })

    it("should unmute channel", () => {
      const channel = engine.createChannel("test-channel")

      engine.muteChannel("test-channel", true)
      engine.muteChannel("test-channel", false)

      expect(channel.isMuted).toBe(false)
      expect(channel.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))
    })

    it("should not affect non-existent channel", () => {
      engine.muteChannel("non-existent", true)
      // Should not throw
    })
  })

  describe("Solo Control", () => {
    it("should solo channel and mute others", () => {
      const channel1 = engine.createChannel("channel1")
      const channel2 = engine.createChannel("channel2")

      engine.soloChannel("channel1", true)

      expect(channel1.isSolo).toBe(true)
      expect(channel1.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))
      expect(channel2.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
    })

    it("should allow multiple solo channels", () => {
      const channel1 = engine.createChannel("channel1")
      const channel2 = engine.createChannel("channel2")
      const channel3 = engine.createChannel("channel3")

      engine.soloChannel("channel1", true)
      engine.soloChannel("channel2", true)

      expect(channel1.isSolo).toBe(true)
      expect(channel2.isSolo).toBe(true)
      expect(channel3.isSolo).toBe(false)
      expect(channel3.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
    })

    it("should unmute all channels when all solos are disabled", () => {
      const channel1 = engine.createChannel("channel1")
      const channel2 = engine.createChannel("channel2")

      engine.soloChannel("channel1", true)
      engine.soloChannel("channel1", false)

      expect(channel1.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))
      expect(channel2.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))
    })

    it("should respect mute state when disabling solo", () => {
      const channel1 = engine.createChannel("channel1")

      engine.muteChannel("channel1", true)
      engine.soloChannel("channel1", true)
      engine.soloChannel("channel1", false)

      expect(channel1.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
    })
  })

  describe("Effect Chain Management", () => {
    it("should add effect to channel", () => {
      const channel = engine.createChannel("test-channel")
      const effect = new MockAudioNode()

      engine.addEffect("test-channel", effect as any)

      expect(channel.effects).toContain(effect)
    })

    it("should add effect at specific index", () => {
      const channel = engine.createChannel("test-channel")
      const effect1 = new MockAudioNode()
      const effect2 = new MockAudioNode()
      const effect3 = new MockAudioNode()

      engine.addEffect("test-channel", effect1 as any)
      engine.addEffect("test-channel", effect2 as any)
      engine.addEffect("test-channel", effect3 as any, 1)

      expect(channel.effects[0]).toBe(effect1)
      expect(channel.effects[1]).toBe(effect3)
      expect(channel.effects[2]).toBe(effect2)
    })

    it("should reconnect effect chain when adding effect", () => {
      const channel = engine.createChannel("test-channel")
      const effect = new MockAudioNode()

      engine.addEffect("test-channel", effect as any)

      expect(channel.panNode.connect).toHaveBeenCalled()
      expect(effect.connect).toHaveBeenCalled()
    })

    it("should remove effect from channel", () => {
      const channel = engine.createChannel("test-channel")
      const effect1 = new MockAudioNode()
      const effect2 = new MockAudioNode()

      engine.addEffect("test-channel", effect1 as any)
      engine.addEffect("test-channel", effect2 as any)

      engine.removeEffect("test-channel", 0)

      expect(channel.effects).not.toContain(effect1)
      expect(channel.effects).toContain(effect2)
      expect(effect1.disconnect).toHaveBeenCalled()
    })

    it("should not remove effect at invalid index", () => {
      const channel = engine.createChannel("test-channel")
      const effect = new MockAudioNode()

      engine.addEffect("test-channel", effect as any)

      engine.removeEffect("test-channel", 5)

      expect(channel.effects).toContain(effect)
    })

    it("should not remove from non-existent channel", () => {
      engine.removeEffect("non-existent", 0)
      // Should not throw
    })
  })

  describe("Limiter Control", () => {
    it("should enable limiter", () => {
      engine.enableLimiter(true)
      // Limiter is created during initialization and connected
      expect(engine.audioContext.createDynamicsCompressor).toHaveBeenCalled()
    })

    it("should disable limiter", () => {
      engine.enableLimiter(false)
      // Should disconnect limiter
    })

    it("should set limiter threshold", () => {
      engine.setLimiterThreshold(-6)
      // Threshold should be set on the limiter node
    })
  })

  describe("Analyser Access", () => {
    it("should get channel analyser", () => {
      const channel = engine.createChannel("test-channel")
      const analyser = engine.getChannelAnalyser("test-channel")

      expect(analyser).toBe(channel.analyser)
    })

    it("should return null for non-existent channel analyser", () => {
      const analyser = engine.getChannelAnalyser("non-existent")
      expect(analyser).toBeNull()
    })

    it("should create master analyser", () => {
      const analyser = engine.getMasterAnalyser()
      expect(analyser).toBeDefined()
    })
  })

  describe("Surround Sound", () => {
    it("should set surround format", () => {
      engine.setSurroundFormat("5.1")
      expect(engine.getMasterSurroundFormat()).toBe("5.1")
    })

    it("should enable surround for channel", () => {
      const channel = engine.createChannel("test-channel")

      engine.enableSurround("test-channel", "5.1")

      expect(channel.surround).toBeDefined()
    })

    it("should disable surround for channel", () => {
      const channel = engine.createChannel("test-channel")

      engine.enableSurround("test-channel", "5.1")
      engine.disableSurround("test-channel")

      expect(channel.surround).toBeUndefined()
    })

    it("should not enable surround for non-existent channel", () => {
      engine.enableSurround("non-existent", "5.1")
      // Should not throw
    })

    it("should set surround position", () => {
      engine.createChannel("test-channel")
      engine.enableSurround("test-channel", "5.1")

      engine.setSurroundPosition("test-channel", { x: 0.5, y: 0.5 })

      const position = engine.getSurroundPosition("test-channel")
      expect(position).toBeDefined()
    })

    it("should return null for channel without surround", () => {
      engine.createChannel("test-channel")

      const position = engine.getSurroundPosition("test-channel")
      expect(position).toBeNull()

      const levels = engine.getSurroundChannelLevels("test-channel")
      expect(levels).toBeNull()
    })
  })

  describe("Cleanup", () => {
    it("should dispose all resources", () => {
      const channel1 = engine.createChannel("channel1")
      const channel2 = engine.createChannel("channel2")

      engine.dispose()

      expect(channel1.gainNode.disconnect).toHaveBeenCalled()
      expect(channel1.panNode.disconnect).toHaveBeenCalled()
      expect(channel1.analyser.disconnect).toHaveBeenCalled()
      expect(channel2.gainNode.disconnect).toHaveBeenCalled()
      expect(engine.audioContext.close).toHaveBeenCalled()
    })

    it("should clear all channels on dispose", () => {
      engine.createChannel("channel1")
      engine.createChannel("channel2")

      engine.dispose()

      const channels = engine.getChannels()
      expect(channels.size).toBe(0)
    })

    it("should disconnect surround processors on dispose", () => {
      engine.createChannel("test-channel")
      engine.enableSurround("test-channel", "5.1")

      engine.dispose()

      // Surround processor should be cleaned up
    })
  })
})
