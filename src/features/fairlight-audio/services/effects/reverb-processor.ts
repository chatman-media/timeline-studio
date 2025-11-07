import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("ReverbProcessor")

export interface ReverbConfig {
  roomSize: number // 0 to 100
  decay: number // 0.1 to 10 seconds
  damping: number // 0 to 100
  predelay: number // 0 to 200 ms
  wetLevel: number // 0 to 100 %
  dryLevel: number // 0 to 100 %
  earlyLevel: number // 0 to 100 %
  lateLevel: number // 0 to 100 %
}

export class ReverbProcessor {
  private context: AudioContext
  private input: GainNode
  private output: GainNode
  private dryGain: GainNode
  private wetGain: GainNode
  private predelayNode: DelayNode
  private convolver: ConvolverNode
  private earlyReflections: DelayNode[]
  private earlyGain: GainNode
  private lateGain: GainNode
  private dampingFilter: BiquadFilterNode
  private config: ReverbConfig

  constructor(context: AudioContext, config: ReverbConfig) {
    this.context = context
    this.config = { ...config }

    // Create nodes
    this.input = context.createGain()
    this.output = context.createGain()
    this.dryGain = context.createGain()
    this.wetGain = context.createGain()
    this.predelayNode = context.createDelay(0.2) // Max 200ms predelay
    this.convolver = context.createConvolver()
    this.earlyGain = context.createGain()
    this.lateGain = context.createGain()
    this.dampingFilter = context.createBiquadFilter()

    // Configure damping filter
    this.dampingFilter.type = "lowpass"

    // Create early reflections
    this.earlyReflections = this.createEarlyReflections()

    // Generate initial impulse response
    this.updateImpulseResponse(config.roomSize, config.decay)

    // Connect signal flow
    this.connectNodes()

    // Apply initial settings
    this.applySettings(config)
  }

  private createEarlyReflections(): DelayNode[] {
    // Create 6 early reflections with different delays
    const delays = [0.007, 0.011, 0.017, 0.023, 0.029, 0.037]
    return delays.map((time) => {
      const delay = this.context.createDelay(0.1)
      delay.delayTime.value = time
      return delay
    })
  }

  private connectNodes() {
    // Dry path
    this.input.connect(this.dryGain)
    this.dryGain.connect(this.output)

    // Wet path with predelay
    this.input.connect(this.predelayNode)

    // Early reflections
    this.earlyReflections.forEach((delay) => {
      this.predelayNode.connect(delay)
      delay.connect(this.earlyGain)
    })
    this.earlyGain.connect(this.wetGain)

    // Late reflections (convolution)
    this.predelayNode.connect(this.dampingFilter)
    this.dampingFilter.connect(this.convolver)
    this.convolver.connect(this.lateGain)
    this.lateGain.connect(this.wetGain)

    // Wet to output
    this.wetGain.connect(this.output)
  }

  private updateImpulseResponse(roomSize: number, decay: number) {
    // Generate synthetic impulse response
    const sampleRate = this.context.sampleRate
    const length = sampleRate * decay
    const impulse = this.context.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)

      for (let i = 0; i < length; i++) {
        // Exponential decay
        const n = length - i
        const decay = (1 - 0.9 / n) ** n

        // Add some randomness for diffusion
        let sample = (Math.random() * 2 - 1) * decay

        // Apply room size character
        if (i < length * 0.1) {
          // Early part - more direct
          sample *= 1 - roomSize / 200
        } else {
          // Late part - more diffuse
          sample *= roomSize / 100
        }

        // Stereo spreading
        if (channel === 1) {
          sample *= -0.7 // Phase inversion for width
        }

        channelData[i] = sample
      }
    }

    this.convolver.buffer = impulse
  }

  private applySettings(config: ReverbConfig) {
    const currentTime = this.context.currentTime

    // Update dry/wet mix
    this.dryGain.gain.setValueAtTime(config.dryLevel / 100, currentTime)
    this.wetGain.gain.setValueAtTime(config.wetLevel / 100, currentTime)

    // Update early/late mix
    this.earlyGain.gain.setValueAtTime(config.earlyLevel / 100, currentTime)
    this.lateGain.gain.setValueAtTime(config.lateLevel / 100, currentTime)

    // Update predelay
    this.predelayNode.delayTime.setValueAtTime(config.predelay / 1000, currentTime)

    // Update damping
    const cutoffFreq = 20000 - config.damping * 195 // 20kHz to 500Hz
    this.dampingFilter.frequency.setValueAtTime(cutoffFreq, currentTime)

    // Update impulse response if room size or decay changed
    if (config.roomSize !== this.config.roomSize || config.decay !== this.config.decay) {
      this.updateImpulseResponse(config.roomSize, config.decay)
    }
  }

  updateParameter(param: keyof ReverbConfig, value: number) {
    const oldValue = this.config[param]
    this.config[param] = value

    const currentTime = this.context.currentTime

    switch (param) {
      case "dryLevel":
        this.dryGain.gain.setValueAtTime(value / 100, currentTime)
        break
      case "wetLevel":
        this.wetGain.gain.setValueAtTime(value / 100, currentTime)
        break
      case "earlyLevel":
        this.earlyGain.gain.setValueAtTime(value / 100, currentTime)
        break
      case "lateLevel":
        this.lateGain.gain.setValueAtTime(value / 100, currentTime)
        break
      case "predelay":
        this.predelayNode.delayTime.setValueAtTime(value / 1000, currentTime)
        break
      case "damping": {
        const cutoffFreq = 20000 - value * 195
        this.dampingFilter.frequency.setValueAtTime(cutoffFreq, currentTime)
        break
      }
      case "roomSize":
      case "decay":
        this.updateImpulseResponse(this.config.roomSize, this.config.decay)
        break
      default:
        // No action needed for unknown parameters
        break
    }
  }

  getConfig(): ReverbConfig {
    return { ...this.config }
  }

  bypass(bypassed: boolean) {
    if (bypassed) {
      this.wetGain.gain.value = 0
      this.dryGain.gain.value = 1
    } else {
      this.wetGain.gain.value = this.config.wetLevel / 100
      this.dryGain.gain.value = this.config.dryLevel / 100
    }
  }

  reset() {
    const defaultConfig: ReverbConfig = {
      roomSize: 50,
      decay: 2,
      damping: 50,
      predelay: 20,
      wetLevel: 30,
      dryLevel: 70,
      earlyLevel: 80,
      lateLevel: 80,
    }

    this.config = defaultConfig
    this.applySettings(defaultConfig)
  }

  connect(destination: AudioNode) {
    this.output.connect(destination)
  }

  disconnect() {
    this.output.disconnect()
  }

  getInputNode(): AudioNode {
    return this.input
  }

  getOutputNode(): AudioNode {
    return this.output
  }

  // Load custom impulse response
  async loadImpulseResponse(url: string) {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
      this.convolver.buffer = audioBuffer
    } catch (error) {
      logger.error("Failed to load impulse response:", { error })
      // Fall back to synthetic impulse
      this.updateImpulseResponse(this.config.roomSize, this.config.decay)
    }
  }
}
