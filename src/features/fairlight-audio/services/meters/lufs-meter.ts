/**
 * LUFS Meter Service
 * Реализует измерение громкости по стандарту EBU R128
 */

import { EventEmitter } from "events"

export interface LUFSMeasurement {
  momentary: number // M: -70 LUFS to +5 LUFS, 400ms window
  shortTerm: number // S: -70 LUFS to +5 LUFS, 3s window
  integrated: number // I: -70 LUFS to +5 LUFS, program loudness
  range: number // LRA: 0 to 50 LU, loudness range
  peak: number // True peak in dBTP
}

export interface LUFSConfig {
  sampleRate: number
  channels: number
  updateInterval: number // ms
  enableTruePeak: boolean
}

export class LUFSMeter extends EventEmitter {
  private config: LUFSConfig
  private analyser: AnalyserNode | null = null
  private processor: AudioWorkletNode | null = null
  private context?: AudioContext
  private isRunning = false
  private lastUpdate = 0

  // Фильтры EBU R128
  private preFilter: BiquadFilterNode | null = null
  private revFilter: BiquadFilterNode | null = null

  // Фильтры будут применяться на стороне AudioWorklet

  constructor(config: LUFSConfig) {
    super()
    this.config = config
  }

  async initialize(context: AudioContext): Promise<void> {
    this.context = context

    // Создаём analyser для получения аудиоданных
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.0

    // Создаём фильтры EBU R128
    await this.createFilters(context)

    // Создаём AudioWorklet processor
    await this.initializeWorklet(context)

    // Подключаем цепочку: input -> preFilter -> revFilter -> processor -> output
    if (this.preFilter && this.revFilter && this.processor) {
      this.preFilter.connect(this.revFilter)
      this.revFilter.connect(this.processor)
    }
  }

  private async createFilters(context: AudioContext): Promise<void> {
    // Pre-filter: High-pass filter at ~38Hz (Stage 1)
    this.preFilter = context.createBiquadFilter()
    this.preFilter.type = "highpass"
    this.preFilter.frequency.setValueAtTime(38.13, context.currentTime)
    this.preFilter.Q.setValueAtTime(0.5, context.currentTime)

    // Revisiting filter: High-frequency de-emphasis (Stage 2)
    this.revFilter = context.createBiquadFilter()
    this.revFilter.type = "highshelf"
    this.revFilter.frequency.setValueAtTime(1681.0, context.currentTime)
    this.revFilter.gain.setValueAtTime(-3.99, context.currentTime) // ~4dB attenuation
    this.revFilter.Q.setValueAtTime(1.0, context.currentTime)
  }

  private async initializeWorklet(context: AudioContext): Promise<void> {
    if (!context.audioWorklet) {
      throw new Error("AudioWorklet is not supported in this browser")
    }

    try {
      await context.audioWorklet.addModule(
        "/src/features/fairlight-audio/services/meters/worklets/lufs-meter-worklet.js",
      )
    } catch (error) {
      // Module might already be loaded, continue
    }

    this.processor = new AudioWorkletNode(context, "lufs-meter", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: this.config.channels,
      channelCountMode: "explicit",
      channelInterpretation: "speakers",
    })

    // Send configuration to worklet
    this.processor.port.postMessage({
      type: "config",
      config: {
        sampleRate: context.sampleRate,
        channels: this.config.channels,
        updateInterval: this.config.updateInterval,
        enableTruePeak: this.config.enableTruePeak,
      },
    })

    // Handle measurements from worklet
    this.processor.port.onmessage = (event) => {
      if (event.data.type === "measurement") {
        this.emit("measurement", event.data.data)
      }
    }
  }

  // Processing moved to AudioWorklet

  // All calculation methods moved to AudioWorklet

  // Public API
  start(): void {
    if (!this.processor) {
      throw new Error("LUFS meter not initialized")
    }

    this.isRunning = true
    this.lastUpdate = performance.now()
    this.emit("started")
  }

  stop(): void {
    this.isRunning = false
    this.emit("stopped")
  }

  reset(): void {
    // Send reset command to worklet
    if (this.processor) {
      this.processor.port.postMessage({ type: "reset" })
    }
    this.emit("reset")
  }

  getInputNode(): AudioNode | null {
    return this.preFilter
  }

  getOutputNode(): AudioNode | null {
    return this.processor
  }

  getCurrentMeasurement(): LUFSMeasurement {
    // Request current measurement from worklet
    // Note: This would be async in real implementation
    return {
      momentary: -Number.NEGATIVE_INFINITY,
      shortTerm: -Number.NEGATIVE_INFINITY,
      integrated: -Number.NEGATIVE_INFINITY,
      range: 0,
      peak: -Number.NEGATIVE_INFINITY,
    }
  }

  dispose(): void {
    this.stop()

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.preFilter) {
      this.preFilter.disconnect()
      this.preFilter = null
    }

    if (this.revFilter) {
      this.revFilter.disconnect()
      this.revFilter = null
    }

    this.removeAllListeners()
  }
}
