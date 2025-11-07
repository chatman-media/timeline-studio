/**
 * Noise Reduction Engine
 * Provides multiple noise reduction algorithms including AI-powered denoising
 */

import { EventEmitter } from "events"
import { createLogger } from "@/lib/tauri-logger"
import { FFTProcessor } from "./fft-processor"

const logger = createLogger("NoiseReductionEngine")

export interface NoiseProfile {
  id: string
  name: string
  frequencies: Float32Array // Frequency magnitudes of noise
  timestamp: number
  duration: number // Duration of the analyzed noise sample in seconds
}

export interface NoiseReductionConfig {
  algorithm: "spectral" | "wiener" | "ai" | "adaptive"
  strength: number // 0-100
  preserveVoice: boolean
  attackTime: number // ms
  releaseTime: number // ms
  frequencySmoothing: number // 0-1
  noiseFloor: number // dB
  gateThreshold: number // dB
}

export interface AnalysisResult {
  snr: number // Signal-to-noise ratio in dB
  noiseLevel: number // Average noise level in dB
  dominantFrequencies: number[] // Hz
  voiceDetected: boolean
  confidence: number // 0-1
}

export class NoiseReductionEngine extends EventEmitter {
  private context: AudioContext
  private noiseProfiles = new Map<string, NoiseProfile>()
  private isProcessing = false

  // Algorithm processors
  private spectralProcessor: SpectralNoiseGate | null = null
  private wienerProcessor: WienerFilter | null = null
  private aiProcessor: AIDenoiser | null = null

  constructor(context: AudioContext) {
    super()
    this.context = context
    void this.loadWorklets()
  }

  private async loadWorklets(): Promise<void> {
    try {
      await Promise.all([
        this.context.audioWorklet.addModule(
          "/src/features/fairlight-audio/services/noise-reduction/worklets/spectral-gate-processor.js",
        ),
        this.context.audioWorklet.addModule(
          "/src/features/fairlight-audio/services/noise-reduction/worklets/wiener-filter-processor.js",
        ),
        this.context.audioWorklet.addModule(
          "/src/features/fairlight-audio/services/noise-reduction/worklets/adaptive-noise-processor.js",
        ),
      ])
      this.emit("workletsLoaded")
    } catch (error) {
      logger.error("Failed to load AudioWorklet modules:", { error })
      throw new Error("AudioWorklet is required for noise reduction")
    }
  }

  /**
   * Analyze audio to create a noise profile
   */
  async analyzeNoise(audioBuffer: AudioBuffer): Promise<NoiseProfile> {
    const analyzer = new NoiseAnalyzer(this.context)
    const profile = await analyzer.analyze(audioBuffer)

    this.noiseProfiles.set(profile.id, profile)
    this.emit("profileCreated", profile)

    return profile
  }

  /**
   * Create a real-time noise reduction processor
   */
  createProcessor(config: NoiseReductionConfig): AudioWorkletNode {
    switch (config.algorithm) {
      case "spectral":
        return this.createSpectralProcessor(config)
      case "wiener":
        return this.createWienerProcessor(config)
      case "ai":
        return this.createAIProcessor(config)
      case "adaptive":
        return this.createAdaptiveProcessor(config)
      default:
        throw new Error(`Unknown algorithm: ${config.algorithm}`)
    }
  }

  private createSpectralProcessor(config: NoiseReductionConfig): AudioWorkletNode {
    if (!this.spectralProcessor) {
      this.spectralProcessor = new SpectralNoiseGate(this.context)
    }

    return this.spectralProcessor.createNode({
      strength: config.strength / 100,
      threshold: config.gateThreshold,
      attack: config.attackTime,
      release: config.releaseTime,
      smoothing: config.frequencySmoothing,
      preserveVoice: config.preserveVoice,
    })
  }

  private createWienerProcessor(config: NoiseReductionConfig): AudioWorkletNode {
    if (!this.wienerProcessor) {
      this.wienerProcessor = new WienerFilter(this.context)
    }

    return this.wienerProcessor.createNode({
      strength: config.strength / 100,
      noiseFloor: config.noiseFloor,
      smoothing: config.frequencySmoothing,
    })
  }

  private createAIProcessor(config: NoiseReductionConfig): AudioWorkletNode {
    if (!this.aiProcessor) {
      this.aiProcessor = new AIDenoiser(this.context)
    }

    return this.aiProcessor.createNode({
      model: "rnnoise", // или другая модель
      strength: config.strength / 100,
      preserveVoice: config.preserveVoice,
    })
  }

  // Method moved below, removing duplicate declaration

  private createAdaptiveProcessor(config: NoiseReductionConfig): AudioWorkletNode {
    // Комбинирует несколько алгоритмов
    const adaptiveProcessor = new AdaptiveNoiseReduction(this.context)

    return adaptiveProcessor.createNode({
      spectralWeight: 0.5,
      wienerWeight: 0.3,
      aiWeight: 0.2,
      strength: config.strength / 100,
      adaptationRate: 0.1,
    })
  }

  /**
   * Process audio file with noise reduction
   */
  async processFile(
    audioBuffer: AudioBuffer,
    config: NoiseReductionConfig,
    _noiseProfileId?: string,
  ): Promise<AudioBuffer> {
    this.isProcessing = true
    this.emit("processingStarted")

    try {
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate,
      )

      // Create source
      const source = offlineContext.createBufferSource()
      source.buffer = audioBuffer

      // Create processor based on algorithm
      let processor: AudioNode

      if (config.algorithm === "ai") {
        // For AI processing, we might need to use a different approach
        processor = await this.createOfflineAIProcessor(offlineContext, config)
      } else {
        // For other algorithms, create processor directly in offline context
        processor = offlineContext.createGain() // Placeholder for now
      }

      // Connect nodes
      source.connect(processor)
      processor.connect(offlineContext.destination)

      // Start processing
      source.start()
      const resultBuffer = await offlineContext.startRendering()

      this.emit("processingCompleted", {
        inputDuration: audioBuffer.duration,
        outputDuration: resultBuffer.duration,
        algorithm: config.algorithm,
      })

      return resultBuffer
    } catch (error) {
      this.emit("processingError", error)
      throw error
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Analyze audio for noise characteristics
   */
  async analyzeAudio(audioBuffer: AudioBuffer): Promise<AnalysisResult> {
    const analyzer = new AudioAnalyzer(this.context)
    return analyzer.analyze(audioBuffer)
  }

  private async createOfflineAIProcessor(
    context: OfflineAudioContext,
    config: NoiseReductionConfig,
  ): Promise<AudioNode> {
    // For offline processing, we can't use AudioWorklet, so use a gain node as placeholder
    const processor = context.createGain()
    processor.gain.value = 1 - (config.strength / 100) * 0.5 // Simple reduction based on strength
    return processor
  }

  dispose(): void {
    this.spectralProcessor?.dispose()
    this.wienerProcessor?.dispose()
    this.aiProcessor?.dispose()

    this.noiseProfiles.clear()
    this.removeAllListeners()
  }
}

/**
 * Spectral Noise Gate implementation
 */
class SpectralNoiseGate {
  constructor(private context: AudioContext) {}

  createNode(config: any): AudioWorkletNode {
    const node = new AudioWorkletNode(this.context, "spectral-gate-processor")

    // Set initial parameters
    node.parameters.get("threshold")?.setValueAtTime(config.threshold, this.context.currentTime)
    node.parameters.get("strength")?.setValueAtTime(config.strength, this.context.currentTime)
    node.parameters.get("smoothing")?.setValueAtTime(config.smoothing, this.context.currentTime)
    node.parameters.get("attack")?.setValueAtTime(config.attack / 1000, this.context.currentTime)
    node.parameters.get("release")?.setValueAtTime(config.release / 1000, this.context.currentTime)

    // Send additional config through message port
    node.port.postMessage({
      type: "updateParams",
      params: {
        preserveVoice: config.preserveVoice,
      },
    })

    return node
  }

  dispose(): void {
    // Cleanup
  }
}

/**
 * Wiener Filter implementation
 */
class WienerFilter {
  constructor(private context: AudioContext) {}

  createNode(config: any): AudioWorkletNode {
    const node = new AudioWorkletNode(this.context, "wiener-filter-processor")

    // Set initial parameters
    node.parameters.get("noiseFloor")?.setValueAtTime(config.noiseFloor, this.context.currentTime)
    node.parameters.get("strength")?.setValueAtTime(config.strength, this.context.currentTime)
    node.parameters.get("smoothing")?.setValueAtTime(config.smoothing, this.context.currentTime)

    return node
  }

  dispose(): void {}
}

/**
 * AI Denoiser using ONNX Runtime
 */
class AIDenoiser {
  constructor(private context: AudioContext) {}

  createNode(_config: any): AudioWorkletNode {
    // This would use AudioWorklet for better performance
    // Placeholder implementation
    const node = this.context.createGain()
    return node as any
  }

  dispose(): void {}
}

/**
 * Adaptive Noise Reduction combining multiple algorithms
 */
class AdaptiveNoiseReduction {
  constructor(private context: AudioContext) {}

  createNode(config: any): AudioWorkletNode {
    const node = new AudioWorkletNode(this.context, "adaptive-noise-processor")

    // Set initial parameters
    node.parameters.get("strength")?.setValueAtTime(config.strength, this.context.currentTime)
    node.parameters.get("spectralWeight")?.setValueAtTime(config.spectralWeight, this.context.currentTime)
    node.parameters.get("wienerWeight")?.setValueAtTime(config.wienerWeight, this.context.currentTime)
    node.parameters.get("adaptationRate")?.setValueAtTime(config.adaptationRate, this.context.currentTime)

    // Send additional config through message port
    node.port.postMessage({
      type: "updateParams",
      params: {
        aiWeight: config.aiWeight,
      },
    })

    return node
  }
}

/**
 * Noise Analyzer for creating noise profiles
 */
class NoiseAnalyzer {
  private fftProcessor: FFTProcessor

  constructor(private context: AudioContext) {
    this.fftProcessor = new FFTProcessor(2048, this.context.sampleRate)
  }

  async analyze(audioBuffer: AudioBuffer): Promise<NoiseProfile> {
    const channelData = audioBuffer.getChannelData(0)

    // Analyze multiple frames for better accuracy
    const frameSize = 2048
    const numFrames = Math.min(10, Math.floor(channelData.length / frameSize))
    const frequencies = new Float32Array(frameSize / 2)

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * frameSize
      const frameData = channelData.slice(start, start + frameSize)

      // Apply window
      const windowed = this.fftProcessor.applyWindow(frameData)

      // Get spectrum
      const spectrum = this.fftProcessor.forward(windowed)
      const magnitude = this.fftProcessor.getMagnitudeSpectrum(spectrum.real, spectrum.imag)

      // Accumulate
      for (let i = 0; i < magnitude.length; i++) {
        frequencies[i] += magnitude[i]
      }
    }

    // Average
    for (const i of frequencies.keys()) {
      frequencies[i] /= numFrames
    }

    return {
      id: `noise_${Date.now()}`,
      name: "Custom Noise Profile",
      frequencies,
      timestamp: Date.now(),
      duration: audioBuffer.duration,
    }
  }
}

/**
 * Audio Analyzer for SNR and voice detection
 */
class AudioAnalyzer {
  async analyze(audioBuffer: AudioBuffer): Promise<AnalysisResult> {
    const channelData = audioBuffer.getChannelData(0)

    // Calculate RMS
    let sum = 0
    for (const sample of channelData) {
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / channelData.length)
    const avgLevel = 20 * Math.log10(rms)

    // Simple voice detection (placeholder)
    const voiceDetected = avgLevel > -40

    return {
      snr: 20, // Placeholder
      noiseLevel: avgLevel - 20,
      dominantFrequencies: [100, 250, 500], // Placeholder
      voiceDetected,
      confidence: voiceDetected ? 0.8 : 0.2,
    }
  }
}
