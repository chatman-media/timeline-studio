/**
 * Hook for accessing the global MIDI Engine instance
 * Provides engine access and device information
 */

import { useEffect, useState } from "react"
import { createLogger } from "@/lib/tauri-logger"
import { type MidiDevice, MidiEngine } from "../services/midi/midi-engine"
import { MidiRouter } from "../services/midi/midi-router"

const logger = createLogger("UseMidiEngine")

// Global instance for the MIDI engine
let globalMidiEngine: MidiEngine | null = null

interface UseMidiEngineReturn {
  engine: MidiEngine | null
  devices: {
    input: MidiDevice[]
    output: MidiDevice[]
  }
  isInitialized: boolean
  error: string | null
}

export function useMidiEngine(): UseMidiEngineReturn {
  const [engine, setEngine] = useState<MidiEngine | null>(null)
  const [devices, setDevices] = useState<{
    input: MidiDevice[]
    output: MidiDevice[]
  }>({
    input: [],
    output: [],
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeEngine = async () => {
      try {
        // Create or reuse the global engine
        if (!globalMidiEngine) {
          globalMidiEngine = new MidiEngine()

          // Add the router to the engine
          if (!globalMidiEngine.router) {
            globalMidiEngine.router = new MidiRouter()

            // Connect router events to MIDI output
            globalMidiEngine.router.on("sendToDevice", ({ deviceId, message }) => {
              const midiData = messageToMidiData(message)
              if (midiData.length > 0) {
                void globalMidiEngine?.sendMessage(deviceId, midiData)
              }
            })

            // Route incoming MIDI messages through the router
            globalMidiEngine.on("midiMessage", ({ deviceId, message }) => {
              globalMidiEngine?.router?.routeMessage(deviceId, message)
            })
          }

          await globalMidiEngine.initialize()
        }

        setEngine(globalMidiEngine)

        // Update devices
        const updateDevices = () => {
          const inputDevices = globalMidiEngine?.getInputDevices() || []
          const outputDevices = globalMidiEngine?.getOutputDevices() || []
          setDevices({ input: inputDevices, output: outputDevices })
        }

        updateDevices()
        globalMidiEngine.on("devicesChanged", updateDevices)
        globalMidiEngine.on("initialized", () => setIsInitialized(true))

        // Check if already initialized
        if (globalMidiEngine.getDevices().length > 0) {
          setIsInitialized(true)
        }

        return () => {
          globalMidiEngine?.off("devicesChanged", updateDevices)
        }
      } catch (err) {
        logger.error("Failed to initialize MIDI engine:", { error: err })
        setError(err instanceof Error ? err.message : "Failed to initialize MIDI")
      }
    }

    void initializeEngine()
  }, [])

  return {
    engine,
    devices,
    isInitialized,
    error,
  }
}

// Helper function to convert MIDI message to raw data
function messageToMidiData(message: any): number[] {
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
