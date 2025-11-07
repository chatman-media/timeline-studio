/**
 * MIDI Clock Service
 * Handles MIDI clock synchronization for tempo sync
 */

import { EventEmitter } from "events"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "MidiClock" })

export interface ClockState {
  isRunning: boolean
  bpm: number
  position: number // Current position in beats
  ppqn: number // Pulses Per Quarter Note (typically 24)
}

export interface ClockSync {
  type: "internal" | "external"
  source?: string // Device ID for external sync
}

export class MidiClock extends EventEmitter {
  private state: ClockState = {
    isRunning: false,
    bpm: 120,
    position: 0,
    ppqn: 24,
  }

  private sync: ClockSync = {
    type: "internal",
  }

  private tickInterval: NodeJS.Timeout | null = null
  private lastTickTime = 0
  private tickAccumulator = 0
  private externalClockBuffer: number[] = []
  private lastExternalTick = 0

  // Internal clock generation
  private startInternalClock(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
    }

    // Calculate tick interval in milliseconds
    const ticksPerMinute = this.state.bpm * this.state.ppqn
    const intervalMs = 60000 / ticksPerMinute

    this.lastTickTime = performance.now()

    this.tickInterval = setInterval(() => {
      const now = performance.now()
      const deltaTime = now - this.lastTickTime
      this.lastTickTime = now

      // Accumulate time to handle timing drift
      this.tickAccumulator += deltaTime

      while (this.tickAccumulator >= intervalMs) {
        this.sendClockTick()
        this.tickAccumulator -= intervalMs
        this.state.position += 1 / this.state.ppqn
      }
    }, intervalMs / 2) // Run at 2x rate for better timing accuracy
  }

  private stopInternalClock(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    this.tickAccumulator = 0
  }

  private sendClockTick(): void {
    this.emit("tick", this.state.position)

    // Send MIDI clock message (0xF8) to all outputs
    this.emit("midiOut", {
      message: [0xf8], // MIDI Clock tick
      timestamp: performance.now(),
    })
  }

  // External clock handling
  handleExternalClock(): void {
    if (this.sync.type !== "external") return

    const now = performance.now()

    // Buffer external ticks for tempo calculation
    this.externalClockBuffer.push(now)

    // Keep only last 96 ticks (4 beats at 24 ppqn)
    if (this.externalClockBuffer.length > 96) {
      this.externalClockBuffer.shift()
    }

    // Calculate tempo from external clock
    if (this.externalClockBuffer.length >= 24) {
      const recentTicks = this.externalClockBuffer.slice(-24)
      const totalTime = recentTicks[recentTicks.length - 1] - recentTicks[0]
      const averageTickTime = totalTime / 23 // 24 ticks = 1 beat
      const bpm = 60000 / (averageTickTime * 24)

      // Smooth BPM changes
      this.state.bpm = this.state.bpm * 0.9 + bpm * 0.1
      this.emit("bpmChange", this.state.bpm)
    }

    // Update position
    if (this.lastExternalTick > 0) {
      const deltaTicks = 1
      this.state.position += deltaTicks / this.state.ppqn
    }
    this.lastExternalTick = now

    this.emit("tick", this.state.position)
  }

  // MIDI System Real-Time message handlers
  handleMidiMessage(message: number[]): void {
    if (message.length === 0) return

    const status = message[0]

    switch (status) {
      case 0xf8: // Clock tick
        this.handleExternalClock()
        break

      case 0xfa: // Start
        this.handleStart()
        break

      case 0xfb: // Continue
        this.handleContinue()
        break

      case 0xfc: // Stop
        this.handleStop()
        break

      case 0xf2: // Song Position Pointer
        if (message.length >= 3) {
          const position = (message[1] | (message[2] << 7)) / 16 // Convert to beats
          this.setPosition(position)
        }
        break

      default:
        // Ignore other MIDI messages
        break
    }
  }

  // Transport control
  start(): void {
    if (this.state.isRunning) return

    this.state.isRunning = true
    this.state.position = 0
    this.externalClockBuffer = []

    if (this.sync.type === "internal") {
      this.startInternalClock()

      // Send MIDI Start message
      this.emit("midiOut", {
        message: [0xfa],
        timestamp: performance.now(),
      })
    }

    this.emit("start")
  }

  continue(): void {
    if (this.state.isRunning) return

    this.state.isRunning = true

    if (this.sync.type === "internal") {
      this.startInternalClock()

      // Send MIDI Continue message
      this.emit("midiOut", {
        message: [0xfb],
        timestamp: performance.now(),
      })
    }

    this.emit("continue")
  }

  stop(): void {
    if (!this.state.isRunning) return

    this.state.isRunning = false

    if (this.sync.type === "internal") {
      this.stopInternalClock()

      // Send MIDI Stop message
      this.emit("midiOut", {
        message: [0xfc],
        timestamp: performance.now(),
      })
    }

    this.emit("stop")
  }

  // External transport handlers
  private handleStart(): void {
    if (this.sync.type === "external") {
      this.state.isRunning = true
      this.state.position = 0
      this.externalClockBuffer = []
      this.emit("start")
    }
  }

  private handleContinue(): void {
    if (this.sync.type === "external") {
      this.state.isRunning = true
      this.emit("continue")
    }
  }

  private handleStop(): void {
    if (this.sync.type === "external") {
      this.state.isRunning = false
      this.emit("stop")
    }
  }

  // Configuration
  setSyncMode(sync: ClockSync): void {
    const wasRunning = this.state.isRunning

    if (wasRunning) {
      this.stop()
    }

    this.sync = sync
    this.externalClockBuffer = []

    if (sync.type === "internal") {
      this.emit("syncModeChange", "internal")
    } else {
      this.emit("syncModeChange", "external", sync.source)
    }

    if (wasRunning && sync.type === "internal") {
      this.start()
    }
  }

  setBPM(bpm: number): void {
    if (this.sync.type !== "internal") {
      logger.warn("Cannot set BPM in external sync mode")
      return
    }

    this.state.bpm = Math.max(20, Math.min(999, bpm))

    // Restart internal clock if running to apply new tempo
    if (this.state.isRunning && this.sync.type === "internal") {
      this.stopInternalClock()
      this.startInternalClock()
    }

    this.emit("bpmChange", this.state.bpm)
  }

  setPosition(position: number): void {
    this.state.position = Math.max(0, position)

    // Send Song Position Pointer
    const sixteenths = Math.floor(position * 16)
    const lsb = sixteenths & 0x7f
    const msb = (sixteenths >> 7) & 0x7f

    this.emit("midiOut", {
      message: [0xf2, lsb, msb],
      timestamp: performance.now(),
    })

    this.emit("positionChange", this.state.position)
  }

  // State getters
  getState(): ClockState {
    return { ...this.state }
  }

  getSyncMode(): ClockSync {
    return { ...this.sync }
  }

  getBPM(): number {
    return this.state.bpm
  }

  getPosition(): number {
    return this.state.position
  }

  isRunning(): boolean {
    return this.state.isRunning
  }

  // Convert between musical time and real time
  beatsToMs(beats: number): number {
    return (beats / this.state.bpm) * 60000
  }

  msToBeats(ms: number): number {
    return (ms / 60000) * this.state.bpm
  }

  // Cleanup
  dispose(): void {
    this.stop()
    this.stopInternalClock()
    this.removeAllListeners()
  }
}
