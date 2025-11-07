export interface EQBandConfig {
  frequency: number
  gain: number
  q: number
  type: BiquadFilterType
}

export class EqualizerProcessor {
  private context: AudioContext
  private input: GainNode
  private output: GainNode
  private bands: BiquadFilterNode[]
  private bandConfigs: EQBandConfig[]

  constructor(context: AudioContext, bandConfigs: EQBandConfig[]) {
    this.context = context
    this.bandConfigs = bandConfigs

    // Create input/output nodes
    this.input = context.createGain()
    this.output = context.createGain()

    // Create filter bands
    this.bands = bandConfigs.map((config) => {
      const filter = context.createBiquadFilter()
      filter.type = config.type
      filter.frequency.value = config.frequency
      filter.gain.value = config.gain
      filter.Q.value = config.q
      return filter
    })

    // Connect filters in series
    this.connectFilters()
  }

  private connectFilters() {
    let lastNode: AudioNode = this.input

    this.bands.forEach((filter) => {
      lastNode.connect(filter)
      lastNode = filter
    })

    lastNode.connect(this.output)
  }

  updateBand(index: number, config: Partial<EQBandConfig>) {
    if (index < 0 || index >= this.bands.length) return

    const band = this.bands[index]
    const currentTime = this.context.currentTime

    if (config.frequency !== undefined) {
      band.frequency.setValueAtTime(config.frequency, currentTime)
      this.bandConfigs[index].frequency = config.frequency
    }

    if (config.gain !== undefined) {
      band.gain.setValueAtTime(config.gain, currentTime)
      this.bandConfigs[index].gain = config.gain
    }

    if (config.q !== undefined) {
      band.Q.setValueAtTime(config.q, currentTime)
      this.bandConfigs[index].q = config.q
    }

    if (config.type !== undefined) {
      band.type = config.type
      this.bandConfigs[index].type = config.type
    }
  }

  getBandConfig(index: number): EQBandConfig | null {
    if (index < 0 || index >= this.bandConfigs.length) return null
    return { ...this.bandConfigs[index] }
  }

  getAllBandConfigs(): EQBandConfig[] {
    return this.bandConfigs.map((config) => ({ ...config }))
  }

  reset() {
    this.bands.forEach((band, index) => {
      const config = this.bandConfigs[index]
      const currentTime = this.context.currentTime

      band.frequency.setValueAtTime(config.frequency, currentTime)
      band.gain.setValueAtTime(0, currentTime)
      band.Q.setValueAtTime(config.q, currentTime)

      this.bandConfigs[index].gain = 0
    })
  }

  bypass(bypassed: boolean) {
    if (bypassed) {
      // Disconnect filters and connect input directly to output
      this.input.disconnect()
      this.bands.forEach((band) => band.disconnect())
      this.input.connect(this.output)
    } else {
      // Reconnect filters
      this.input.disconnect()
      this.connectFilters()
    }
  }

  getFrequencyResponse(frequencies: Float32Array): {
    magnitude: Float32Array
    phase: Float32Array
  } {
    const magnitude = new Float32Array(frequencies.length)
    const phase = new Float32Array(frequencies.length)

    // Initialize with flat response
    magnitude.fill(1)
    phase.fill(0)

    // Get response from each band and multiply
    this.bands.forEach((band) => {
      const bandMag = new Float32Array(frequencies.length) as Float32Array<ArrayBuffer>
      const bandPhase = new Float32Array(frequencies.length) as Float32Array<ArrayBuffer>

      band.getFrequencyResponse(frequencies as Float32Array<ArrayBuffer>, bandMag, bandPhase)

      // Multiply magnitudes (they're in linear scale)
      for (let i = 0; i < frequencies.length; i++) {
        magnitude[i] *= bandMag[i]
        phase[i] += bandPhase[i]
      }
    })

    return { magnitude, phase }
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
}
