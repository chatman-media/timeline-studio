/**
 * SurroundAudioProcessor - Multi-channel surround sound processing
 * Supports stereo, 5.1, and 7.1 surround formats using Web Audio API
 */

export type SurroundFormat = "stereo" | "5.1" | "7.1"

export interface SurroundPosition {
  x: number // 0-100 (left to right)
  y: number // 0-100 (front to back)
}

export interface SurroundChannelMapping {
  stereo: ["L", "R"]
  "5.1": ["L", "R", "C", "LFE", "LS", "RS"]
  "7.1": ["L", "R", "C", "LFE", "LS", "RS", "LR", "RR"]
}

// Speaker angles in degrees for positioning calculations
const SPEAKER_ANGLES = {
  stereo: { L: -30, R: 30 },
  "5.1": { L: -30, R: 30, C: 0, LFE: 0, LS: -110, RS: 110 },
  "7.1": { L: -30, R: 30, C: 0, LFE: 0, LS: -110, RS: 110, LR: -135, RR: 135 },
}

export class SurroundAudioProcessor {
  private context: AudioContext
  private format: SurroundFormat
  private inputNode: GainNode
  private outputNode: ChannelSplitterNode
  private channelGains: Map<string, GainNode>
  private position: SurroundPosition

  constructor(context: AudioContext, format: SurroundFormat = "stereo") {
    this.context = context
    this.format = format
    this.position = { x: 50, y: 50 } // Center position

    // Create audio nodes
    this.inputNode = context.createGain()
    this.outputNode = context.createChannelSplitter(this.getChannelCount())
    this.channelGains = new Map()

    this.setupAudioGraph()
  }

  private getChannelCount(): number {
    switch (this.format) {
      case "stereo":
        return 2
      case "5.1":
        return 6
      case "7.1":
        return 8
      default:
        return 2
    }
  }

  private getChannelNames(): string[] {
    const mapping: SurroundChannelMapping = {
      stereo: ["L", "R"],
      "5.1": ["L", "R", "C", "LFE", "LS", "RS"],
      "7.1": ["L", "R", "C", "LFE", "LS", "RS", "LR", "RR"],
    }
    return mapping[this.format]
  }

  private setupAudioGraph(): void {
    const channels = this.getChannelNames()

    // Create gain node for each channel
    channels.forEach((channel, index) => {
      const gainNode = this.context.createGain()
      gainNode.gain.value = 0

      // Connect input to each channel gain
      this.inputNode.connect(gainNode)

      // Connect channel gain to output splitter
      gainNode.connect(this.outputNode, 0, index)

      this.channelGains.set(channel, gainNode)
    })

    // Initial positioning
    this.updateChannelGains()
  }

  public setPosition(position: SurroundPosition): void {
    this.position = { ...position }
    this.updateChannelGains()
  }

  public getPosition(): SurroundPosition {
    return { ...this.position }
  }

  public setFormat(format: SurroundFormat): void {
    if (format === this.format) return

    // Disconnect existing nodes
    this.disconnect()

    // Update format and rebuild
    this.format = format
    this.outputNode = this.context.createChannelSplitter(this.getChannelCount())
    this.channelGains.clear()

    this.setupAudioGraph()
  }

  private updateChannelGains(): void {
    const channels = this.getChannelNames()
    const angles = SPEAKER_ANGLES[this.format]

    channels.forEach((channel) => {
      const gainNode = this.channelGains.get(channel)
      if (!gainNode) return

      const gain = this.calculateChannelGain(channel, angles[channel as keyof typeof angles])

      // Smooth gain changes to avoid clicks
      gainNode.gain.cancelScheduledValues(this.context.currentTime)
      gainNode.gain.setTargetAtTime(gain, this.context.currentTime, 0.01)
    })
  }

  private calculateChannelGain(channel: string, speakerAngle: number): number {
    // Convert position to polar coordinates
    const centerX = 50
    const centerY = 30 // Front is at 30% from top

    const dx = this.position.x - centerX
    const dy = centerY - this.position.y // Invert Y for front/back

    const distance = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dx, dy) * (180 / Math.PI)

    // Calculate angular difference between source and speaker
    let angleDiff = Math.abs(angle - speakerAngle)
    if (angleDiff > 180) angleDiff = 360 - angleDiff

    // Distance-based attenuation (closer speakers get more signal)
    const maxDistance = 70 // Maximum meaningful distance
    const distanceAttenuation = Math.max(0, 1 - distance / maxDistance)

    // Angular-based panning (speakers closer to source angle get more signal)
    const maxAngleDiff = 60 // Speakers within 60 degrees get significant signal
    const angleAttenuation = Math.max(0, 1 - angleDiff / maxAngleDiff)

    // Special handling for specific channels
    let gain = distanceAttenuation * angleAttenuation

    // LFE channel gets constant low-frequency content
    if (channel === "LFE") {
      gain = Math.min(0.3, distanceAttenuation * 0.5)
    }

    // Center channel gets enhanced signal when positioned front-center
    if (channel === "C") {
      const frontCenterBoost = Math.max(0, 1 - Math.abs(dx) / 30) * Math.max(0, 1 - Math.max(0, dy) / 20)
      gain = Math.max(gain, frontCenterBoost * 0.8)
    }

    // Apply gentle curve to make transitions smoother
    gain **= 0.7

    return Math.max(0, Math.min(1, gain))
  }

  public connect(destination: AudioNode): void {
    this.outputNode.connect(destination)
  }

  public disconnect(): void {
    this.inputNode.disconnect()
    this.outputNode.disconnect()
    this.channelGains.forEach((gainNode) => gainNode.disconnect())
  }

  public getInputNode(): AudioNode {
    return this.inputNode
  }

  public getOutputNode(): AudioNode {
    return this.outputNode
  }

  public getChannelOutput(channel: string): AudioNode | null {
    const channelNames = this.getChannelNames()
    const index = channelNames.indexOf(channel)

    if (index === -1) return null

    // Create a gain node connected to the specific output channel
    const channelOutput = this.context.createGain()
    this.outputNode.connect(channelOutput, index)

    return channelOutput
  }

  public getChannelLevels(): Record<string, number> {
    const levels: Record<string, number> = {}

    this.channelGains.forEach((gainNode, channel) => {
      levels[channel] = gainNode.gain.value
    })

    return levels
  }

  /**
   * Create a downmix to stereo for monitoring/preview
   */
  public createStereoDownmix(): AudioNode {
    const stereoMerger = this.context.createChannelMerger(2)
    const leftGain = this.context.createGain()
    const rightGain = this.context.createGain()

    // Downmix matrix for stereo compatibility
    const channels = this.getChannelNames()

    channels.forEach((channel, index) => {
      const channelGain = this.context.createGain()
      this.outputNode.connect(channelGain, index)

      // Simple downmix coefficients
      switch (channel) {
        case "L":
        case "LS":
        case "LR":
          channelGain.gain.value = 1.0
          channelGain.connect(leftGain)
          break
        case "R":
        case "RS":
        case "RR":
          channelGain.gain.value = 1.0
          channelGain.connect(rightGain)
          break
        case "C":
          channelGain.gain.value = Math.SQRT1_2 // -3dB for center
          channelGain.connect(leftGain)
          channelGain.connect(rightGain)
          break
        case "LFE":
          // LFE typically not included in stereo downmix
          channelGain.gain.value = 0
          break
        default:
          // Unknown channel, mute it
          logger.warn(`Unknown surround channel: ${channel}`)
          channelGain.gain.value = 0
          break
      }
    })

    leftGain.connect(stereoMerger, 0, 0)
    rightGain.connect(stereoMerger, 0, 1)

    return stereoMerger
  }
}
