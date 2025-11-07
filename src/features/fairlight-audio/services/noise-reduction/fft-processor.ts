/**
 * FFT Processor for Noise Reduction
 * Handles Fast Fourier Transform operations for spectral processing
 */

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger("FFTProcessor")

export class FFTProcessor {
  private fftSize: number
  private sampleRate: number
  private window: Float32Array
  private overlap: number

  // Buffers
  private inputBuffer: Float32Array
  private outputBuffer: Float32Array
  private overlapBuffer: Float32Array
  private realBuffer: Float32Array
  private imagBuffer: Float32Array

  // Pre-computed values
  private windowSum: number
  private scaleFactor: number

  // Noise profile
  private noiseProfile: Float32Array | null = null

  constructor(fftSize = 2048, sampleRate = 48000, overlap = 0.5) {
    this.fftSize = fftSize
    this.sampleRate = sampleRate
    this.overlap = overlap

    // Initialize buffers
    this.inputBuffer = new Float32Array(fftSize)
    this.outputBuffer = new Float32Array(fftSize)
    this.overlapBuffer = new Float32Array(fftSize * overlap)
    this.realBuffer = new Float32Array(fftSize)
    this.imagBuffer = new Float32Array(fftSize)

    // Create window function (Hann window)
    this.window = this.createHannWindow(fftSize)
    this.windowSum = this.window.reduce((sum, val) => sum + val, 0)
    this.scaleFactor = 1 / (this.windowSum * overlap)
  }

  /**
   * Create Hann window function
   */
  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size)
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1))
    }
    return window
  }

  /**
   * Forward FFT using Cooley-Tukey algorithm
   */
  forward(input: Float32Array): { real: Float32Array; imag: Float32Array } {
    const n = input.length
    const real = new Float32Array(n)
    const imag = new Float32Array(n)

    // Copy input to real part
    real.set(input)

    // Bit-reversal permutation
    const bits = Math.log2(n)
    for (let i = 0; i < n; i++) {
      const j = this.reverseBits(i, bits)
      if (j > i) {
        // Swap real values
        ;[real[i], real[j]] = [real[j], real[i]]
        // Swap imaginary values
        ;[imag[i], imag[j]] = [imag[j], imag[i]]
      }
    }

    // Cooley-Tukey FFT
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2
      const angleStep = (-2 * Math.PI) / size

      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const angle = angleStep * j
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)

          const a = i + j
          const b = a + halfSize

          const tReal = real[b] * cos - imag[b] * sin
          const tImag = real[b] * sin + imag[b] * cos

          real[b] = real[a] - tReal
          imag[b] = imag[a] - tImag
          real[a] += tReal
          imag[a] += tImag
        }
      }
    }

    return { real, imag }
  }

  /**
   * Inverse FFT
   */
  inverse(real: Float32Array, imag: Float32Array): Float32Array {
    const n = real.length
    const output = new Float32Array(n)

    // Conjugate
    for (let i = 0; i < n; i++) {
      imag[i] = -imag[i]
    }

    // Forward FFT
    const result = this.forward(real)

    // Conjugate and scale
    for (let i = 0; i < n; i++) {
      output[i] = result.real[i] / n
    }

    return output
  }

  /**
   * Calculate magnitude spectrum
   */
  getMagnitudeSpectrum(real: Float32Array, imag: Float32Array): Float32Array {
    const n = real.length
    const magnitude = new Float32Array(n / 2)

    for (let i = 0; i < n / 2; i++) {
      magnitude[i] = Math.sqrt(real[i] * real[i] + imag[i] * imag[i])
    }

    return magnitude
  }

  /**
   * Calculate phase spectrum
   */
  getPhaseSpectrum(real: Float32Array, imag: Float32Array): Float32Array {
    const n = real.length
    const phase = new Float32Array(n / 2)

    for (let i = 0; i < n / 2; i++) {
      phase[i] = Math.atan2(imag[i], real[i])
    }

    return phase
  }

  /**
   * Convert magnitude and phase back to complex
   */
  polarToComplex(magnitude: Float32Array, phase: Float32Array): { real: Float32Array; imag: Float32Array } {
    const n = magnitude.length * 2
    const real = new Float32Array(n)
    const imag = new Float32Array(n)

    // First half
    for (let i = 0; i < magnitude.length; i++) {
      real[i] = magnitude[i] * Math.cos(phase[i])
      imag[i] = magnitude[i] * Math.sin(phase[i])
    }

    // Mirror for second half (conjugate symmetry)
    for (let i = 1; i < magnitude.length - 1; i++) {
      real[n - i] = real[i]
      imag[n - i] = -imag[i]
    }

    return { real, imag }
  }

  /**
   * Apply window function
   */
  applyWindow(input: Float32Array): Float32Array {
    const windowed = new Float32Array(input.length)
    for (let i = 0; i < input.length; i++) {
      windowed[i] = input[i] * this.window[i]
    }
    return windowed
  }

  /**
   * Process with overlap-add method
   */
  processOverlapAdd(
    input: Float32Array,
    processCallback: (spectrum: { real: Float32Array; imag: Float32Array }) => void,
  ): Float32Array {
    const hopSize = Math.floor(this.fftSize * (1 - this.overlap))
    const numFrames = Math.ceil((input.length - this.fftSize) / hopSize) + 1
    const output = new Float32Array(input.length + this.fftSize)

    for (let frame = 0; frame < numFrames; frame++) {
      const offset = frame * hopSize

      // Extract frame
      for (let i = 0; i < this.fftSize; i++) {
        this.inputBuffer[i] = offset + i < input.length ? input[offset + i] : 0
      }

      // Apply window
      const windowed = this.applyWindow(this.inputBuffer)

      // Forward FFT
      const spectrum = this.forward(windowed)

      // Process spectrum
      processCallback(spectrum)

      // Inverse FFT
      const processed = this.inverse(spectrum.real, spectrum.imag)

      // Apply window again and overlap-add
      for (let i = 0; i < this.fftSize; i++) {
        output[offset + i] += processed[i] * this.window[i] * this.scaleFactor
      }
    }

    // Trim to original length
    return output.slice(0, input.length)
  }

  /**
   * Frequency bin to Hz conversion
   */
  binToFreq(bin: number): number {
    return (bin * this.sampleRate) / this.fftSize
  }

  /**
   * Hz to frequency bin conversion
   */
  freqToBin(freq: number): number {
    return Math.round((freq * this.fftSize) / this.sampleRate)
  }

  /**
   * Reverse bits for FFT
   */
  private reverseBits(x: number, bits: number): number {
    let result = 0
    for (let i = 0; i < bits; i++) {
      result = (result << 1) | (x & 1)
      x >>= 1
    }
    return result
  }

  /**
   * Get Nyquist frequency
   */
  get nyquistFrequency(): number {
    return this.sampleRate / 2
  }

  /**
   * Get frequency resolution
   */
  get frequencyResolution(): number {
    return this.sampleRate / this.fftSize
  }

  /**
   * Get FFT size
   */
  get size(): number {
    return this.fftSize
  }
}

/**
 * Spectral Subtraction for noise reduction
 */
export class SpectralSubtraction {
  private fftProcessor: FFTProcessor
  private noiseProfile: Float32Array | null = null
  private subtractFactor: number
  private spectralFloor: number

  constructor(fftSize = 2048, sampleRate = 48000, subtractFactor = 1.0, spectralFloor = 0.1) {
    this.fftProcessor = new FFTProcessor(fftSize, sampleRate)
    this.subtractFactor = subtractFactor
    this.spectralFloor = spectralFloor
  }

  /**
   * Learn noise profile from a noise sample
   */
  learnNoiseProfile(noiseSample: Float32Array): void {
    const numFrames = 10 // Average over multiple frames
    const hopSize = Math.floor(noiseSample.length / numFrames)

    this.noiseProfile = new Float32Array(this.fftProcessor.size / 2)

    for (let i = 0; i < numFrames; i++) {
      const frame = noiseSample.slice(i * hopSize, i * hopSize + this.fftProcessor.size)
      const windowed = this.fftProcessor.applyWindow(frame)
      const spectrum = this.fftProcessor.forward(windowed)
      const magnitude = this.fftProcessor.getMagnitudeSpectrum(spectrum.real, spectrum.imag)

      // Accumulate magnitude
      for (let j = 0; j < magnitude.length; j++) {
        this.noiseProfile[j] += magnitude[j]
      }
    }

    // Average
    for (let i = 0; i < this.noiseProfile.length; i++) {
      this.noiseProfile[i] /= numFrames
    }
  }

  /**
   * Process audio with spectral subtraction
   */
  process(input: Float32Array): Float32Array {
    if (!this.noiseProfile) {
      logger.warn("No noise profile learned, returning original audio")
      return input
    }

    return this.fftProcessor.processOverlapAdd(input, (spectrum) => {
      const magnitude = this.fftProcessor.getMagnitudeSpectrum(spectrum.real, spectrum.imag)
      const phase = this.fftProcessor.getPhaseSpectrum(spectrum.real, spectrum.imag)

      // Spectral subtraction
      for (let i = 0; i < magnitude.length; i++) {
        magnitude[i] = Math.max(
          magnitude[i] - this.subtractFactor * this.noiseProfile![i],
          this.spectralFloor * magnitude[i],
        )
      }

      // Convert back to complex
      const complex = this.fftProcessor.polarToComplex(magnitude, phase)
      spectrum.real.set(complex.real)
      spectrum.imag.set(complex.imag)
    })
  }

  setSubtractionFactor(factor: number): void {
    this.subtractFactor = Math.max(0, Math.min(3, factor))
  }

  setSpectralFloor(floor: number): void {
    this.spectralFloor = Math.max(0, Math.min(1, floor))
  }
}
