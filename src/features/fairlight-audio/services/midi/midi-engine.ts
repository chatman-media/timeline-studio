/**
 * MIDI Engine Service
 * Handles MIDI input/output and integration with audio channels
 */

import { EventEmitter } from "events"
import { createLogger } from "@/lib/tauri-logger"
import { MidiClock } from "./midi-clock"
import { MidiFile } from "./midi-file"
import type { MidiRouter } from "./midi-router"
import { MidiSequencer } from "./midi-sequencer"

const logger = createLogger({ module: "MidiEngine" })

export interface MidiDevice {
  id: string
  name: string
  manufacturer: string
  type: "input" | "output"
  state: "connected" | "disconnected"
}

export interface MidiMessage {
  type: "noteon" | "noteoff" | "cc" | "pitchbend" | "aftertouch" | "programchange"
  channel: number
  timestamp: number
  data: {
    note?: number
    velocity?: number
    controller?: number
    value?: number
    program?: number
  }
}

export interface MidiMapping {
  id: string
  deviceId: string
  messageType: MidiMessage["type"]
  channel?: number
  controller?: number
  targetParameter: string // e.g. "channel.1.volume", "channel.2.pan"
  min: number
  max: number
  curve: "linear" | "exponential" | "logarithmic"
}

export class MidiEngine extends EventEmitter {
  private midiAccess: MIDIAccess | null = null
  private devices = new Map<string, MidiDevice>()
  private mappings = new Map<string, MidiMapping>()
  private inputHandlers = new Map<string, (event: MIDIMessageEvent) => void>()
  private isInitialized = false
  private learningMode = false
  private learningCallback: ((message: MidiMessage) => void) | null = null

  // Дополнительные компоненты
  public readonly clock: MidiClock
  public readonly sequencer: MidiSequencer
  public router: MidiRouter | null = null

  constructor() {
    super()

    // Инициализируем компоненты
    this.clock = new MidiClock()
    this.sequencer = new MidiSequencer(this.clock)

    // Подключаем обработчики
    this.setupComponentHandlers()
  }

  private setupComponentHandlers(): void {
    // Передаем MIDI out сообщения от clock
    this.clock.on("midiOut", (data) => {
      if (data.message) {
        this.sendMessageToAll(data.message)
      }
    })

    // Передаем MIDI out сообщения от sequencer
    this.sequencer.on("midiOut", (data) => {
      if (data.deviceId && data.message) {
        void this.sendMessage(data.deviceId, data.message)
      } else if (data.message) {
        this.sendMessageToAll(data.message)
      }
    })
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Check if Web MIDI API is available
      if (!navigator.requestMIDIAccess) {
        logger.warn("Web MIDI API is not supported in this browser")
        this.emit("initialized") // Still emit initialized but with no devices
        return
      }

      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false })

      // Set up device monitoring
      this.midiAccess.onstatechange = this.handleStateChange.bind(this)

      // Initialize existing devices
      this.scanDevices()

      this.isInitialized = true
      this.emit("initialized")
    } catch (error) {
      logger.error("Failed to initialize MIDI:", error)
      // Don't throw, just log the error and emit initialized
      this.emit("initialized")
    }
  }

  private scanDevices(): void {
    if (!this.midiAccess) return

    // Clear existing devices
    this.devices.clear()

    // Scan inputs
    for (const [id, input] of this.midiAccess.inputs) {
      const device: MidiDevice = {
        id: input.id || id,
        name: input.name || "Unknown Device",
        manufacturer: input.manufacturer || "Unknown",
        type: "input",
        state: input.state as "connected" | "disconnected",
      }
      this.devices.set(device.id, device)

      if (device.state === "connected") {
        this.setupInputHandler(input)
      }
    }

    // Scan outputs
    for (const [id, output] of this.midiAccess.outputs) {
      const device: MidiDevice = {
        id: output.id || id,
        name: output.name || "Unknown Device",
        manufacturer: output.manufacturer || "Unknown",
        type: "output",
        state: output.state as "connected" | "disconnected",
      }
      this.devices.set(device.id, device)
    }

    this.emit("devicesChanged", Array.from(this.devices.values()))
  }

  private handleStateChange(event: MIDIConnectionEvent): void {
    const port = event.port
    if (!port) return // Guard against null port

    const deviceId = port.id || ""

    if (port.type === "input" && port.state === "connected") {
      this.setupInputHandler(port as MIDIInput)
    } else if (port.state === "disconnected") {
      this.removeInputHandler(deviceId)
    }

    // Update device state
    const device = this.devices.get(deviceId)
    if (device) {
      device.state = port.state as "connected" | "disconnected"
    }

    this.scanDevices()
  }

  private setupInputHandler(input: MIDIInput): void {
    const handler = (event: MIDIMessageEvent) => {
      const message = this.parseMidiMessage(event)
      if (message) {
        this.handleMidiMessage(input.id || "", message)
      }
    }

    this.inputHandlers.set(input.id || "", handler)
    input.onmidimessage = handler
  }

  private removeInputHandler(deviceId: string): void {
    const handler = this.inputHandlers.get(deviceId)
    if (handler) {
      this.inputHandlers.delete(deviceId)
    }
  }

  private parseMidiMessage(event: MIDIMessageEvent): MidiMessage | null {
    const data = event.data
    if (!data || data.length < 2) return null

    const status = data[0]
    const channel = (status & 0x0f) + 1
    const messageType = status & 0xf0

    const message: MidiMessage = {
      type: "noteon",
      channel,
      timestamp: event.timeStamp,
      data: {},
    }

    switch (messageType) {
      case 0x90: // Note On
        message.type = "noteon"
        message.data.note = data[1]
        message.data.velocity = data[2]
        break

      case 0x80: // Note Off
        message.type = "noteoff"
        message.data.note = data[1]
        message.data.velocity = data[2]
        break

      case 0xb0: // Control Change
        message.type = "cc"
        message.data.controller = data[1]
        message.data.value = data[2]
        break

      case 0xe0: // Pitch Bend
        message.type = "pitchbend"
        message.data.value = (data[2] << 7) | data[1]
        break

      case 0xd0: // Channel Aftertouch
        message.type = "aftertouch"
        message.data.value = data[1]
        break

      case 0xc0: // Program Change
        message.type = "programchange"
        message.data.program = data[1]
        break

      default:
        return null
    }

    return message
  }

  private handleMidiMessage(deviceId: string, message: MidiMessage): void {
    // Emit raw message event
    this.emit("midiMessage", { deviceId, message })

    // Передаем в clock для синхронизации
    const midiData = this.messageToMidiData(message)
    if (midiData.length > 0) {
      this.clock.handleMidiMessage(midiData)
    }

    // Записываем в sequencer если идет запись
    if (this.sequencer.getState().isRecording) {
      this.sequencer.recordMidiMessage(message)
    }

    // Handle learning mode
    if (this.learningMode && this.learningCallback) {
      this.learningCallback(message)
      return
    }

    // Process mappings
    for (const mapping of this.mappings.values()) {
      if (mapping.deviceId !== deviceId) continue
      if (mapping.messageType !== message.type) continue

      // Check if message matches mapping criteria
      let matches = true

      if (mapping.channel && mapping.channel !== message.channel) {
        matches = false
      }

      if (mapping.messageType === "cc" && mapping.controller !== message.data.controller) {
        matches = false
      }

      if (matches) {
        this.applyMapping(mapping, message)
      }
    }
  }

  private messageToMidiData(message: MidiMessage): number[] {
    const channel = (message.channel - 1) & 0x0f

    switch (message.type) {
      case "noteon":
        return [0x90 | channel, message.data.note || 60, message.data.velocity || 64]
      case "noteoff":
        return [0x80 | channel, message.data.note || 60, message.data.velocity || 0]
      case "cc":
        return [0xb0 | channel, message.data.controller || 0, message.data.value || 0]
      case "pitchbend": {
        const value = message.data.value || 8192
        return [0xe0 | channel, value & 0x7f, (value >> 7) & 0x7f]
      }
      case "programchange":
        return [0xc0 | channel, message.data.program || 0]
      case "aftertouch":
        return [0xd0 | channel, message.data.value || 0]
      default:
        return []
    }
  }

  private applyMapping(mapping: MidiMapping, message: MidiMessage): void {
    let value = 0

    // Extract value based on message type
    switch (message.type) {
      case "noteon":
      case "noteoff":
        value = message.data.velocity || 0
        break
      case "cc":
      case "aftertouch":
      case "pitchbend":
        value = message.data.value || 0
        break
      case "programchange":
        value = message.data.program || 0
        break
      default:
        // Unknown message type, use 0
        value = 0
        break
    }

    // Normalize value (MIDI is 0-127, pitch bend is 0-16383)
    const maxValue = message.type === "pitchbend" ? 16383 : 127
    let normalized = value / maxValue

    // Apply curve
    switch (mapping.curve) {
      case "exponential":
        normalized *= normalized
        break
      case "logarithmic":
        normalized = Math.log(normalized + 1) / Math.log(2)
        break
      default:
        // No transformation needed for linear
        break
    }

    // Scale to target range
    const scaled = mapping.min + (mapping.max - mapping.min) * normalized

    // Emit parameter change event
    this.emit("parameterChange", {
      parameter: mapping.targetParameter,
      value: scaled,
      mapping: mapping.id,
    })
  }

  // Public API

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator
  }

  getDevices(): MidiDevice[] {
    return Array.from(this.devices.values())
  }

  getInputDevices(): MidiDevice[] {
    return this.getDevices().filter((d) => d.type === "input")
  }

  getOutputDevices(): MidiDevice[] {
    return this.getDevices().filter((d) => d.type === "output")
  }

  addMapping(mapping: Omit<MidiMapping, "id">): string {
    const id = `mapping_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const fullMapping: MidiMapping = { ...mapping, id }
    this.mappings.set(id, fullMapping)
    this.emit("mappingAdded", fullMapping)
    return id
  }

  removeMapping(id: string): void {
    if (this.mappings.delete(id)) {
      this.emit("mappingRemoved", id)
    }
  }

  getMappings(): MidiMapping[] {
    return Array.from(this.mappings.values())
  }

  updateMapping(id: string, updates: Partial<MidiMapping>): void {
    const mapping = this.mappings.get(id)
    if (mapping) {
      Object.assign(mapping, updates)
      this.emit("mappingUpdated", mapping)
    }
  }

  // MIDI Learn functionality
  startLearning(callback: (message: MidiMessage) => void): void {
    this.learningMode = true
    this.learningCallback = callback
    this.emit("learningStarted")
  }

  stopLearning(): void {
    this.learningMode = false
    this.learningCallback = null
    this.emit("learningStopped")
  }

  // Send MIDI message
  async sendMessage(deviceId: string, message: number[]): Promise<void> {
    if (!this.midiAccess) {
      logger.warn("MIDI not initialized or not supported")
      return
    }

    const output = this.midiAccess.outputs.get(deviceId)
    if (!output) {
      logger.warn(`MIDI output device ${deviceId} not found`)
      return
    }

    output.send(message)
  }

  // Send MIDI message to all outputs
  private sendMessageToAll(message: number[]): void {
    if (!this.midiAccess) return

    for (const output of this.midiAccess.outputs.values()) {
      try {
        output.send(message)
      } catch (error) {
        logger.error("Failed to send MIDI message to output:", error)
      }
    }
  }

  // MIDI файлы
  async importMidiFile(buffer: ArrayBuffer): Promise<string[]> {
    const midiFile = new MidiFile()
    await midiFile.parse(buffer)

    const tracks = midiFile.toSequencerTracks()
    const trackIds: string[] = []

    for (const track of tracks) {
      const id = this.sequencer.createTrack(track.name, track.channel)
      const sequencerTrack = this.sequencer.getTrack(id)

      if (sequencerTrack) {
        // Копируем события
        sequencerTrack.events = track.events
        trackIds.push(id)
      }
    }

    return trackIds
  }

  exportMidiFile(): ArrayBuffer {
    const tracks = this.sequencer.getTracks()
    return MidiFile.fromSequencerTracks(tracks)
  }

  // Cleanup
  dispose(): void {
    // Останавливаем компоненты
    this.clock.dispose()
    this.sequencer.dispose()

    // Remove all input handlers
    for (const [deviceId] of this.inputHandlers) {
      const input = this.midiAccess?.inputs.get(deviceId)
      if (input) {
        input.onmidimessage = null
      }
    }
    this.inputHandlers.clear()

    // Clear mappings and devices
    this.mappings.clear()
    this.devices.clear()

    // Remove all listeners
    this.removeAllListeners()

    this.isInitialized = false
  }
}
