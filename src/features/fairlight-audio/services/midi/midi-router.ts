/**
 * Advanced MIDI Router
 * Provides flexible routing of MIDI messages between devices, channels, and virtual instruments
 */

import { EventEmitter } from "events"
import { createLogger } from "@/lib/tauri-logger"
import type { MidiMessage } from "./midi-engine"

const logger = createLogger("MidiRouter")

export interface MidiRoute {
  id: string
  name: string
  enabled: boolean
  // Source
  sourceDevice?: string // null means any device
  sourceChannel?: number // null means any channel
  sourceType?: MidiMessage["type"][] // null means any type
  sourceRange?: {
    // For note filtering
    minNote?: number
    maxNote?: number
    // For CC filtering
    controllers?: number[]
  }
  // Destination
  destinations: MidiDestination[]
  // Processing
  processors: MidiProcessor[]
}

export interface MidiDestination {
  id: string
  type: "device" | "channel" | "virtual" | "function"
  // For device output
  deviceId?: string
  // For channel routing
  targetChannel?: number
  // For virtual instruments/plugins
  virtualId?: string
  // For function callbacks
  callback?: (message: MidiMessage) => void
  // Message transformation
  transform?: MidiTransform
}

export interface MidiTransform {
  // Channel remapping
  channelOffset?: number
  channelMap?: Map<number, number>
  // Note transposition
  transpose?: number
  // Velocity scaling
  velocityScale?: number
  velocityOffset?: number
  // CC remapping
  ccMap?: Map<number, number>
  // Value scaling/inversion
  valueScale?: number
  valueInvert?: boolean
}

export interface MidiProcessor {
  id: string
  type: "filter" | "transform" | "split" | "merge" | "script"
  enabled: boolean
  config: any
}

// Processor implementations
export abstract class BaseMidiProcessor {
  constructor(
    public readonly id: string,
    public readonly type: string,
  ) {}
  abstract process(message: MidiMessage, route: MidiRoute): MidiMessage | null
}

export class FilterProcessor extends BaseMidiProcessor {
  constructor(
    id: string,
    private config: {
      noteRange?: { min: number; max: number }
      velocityRange?: { min: number; max: number }
      controllers?: number[]
      channels?: number[]
    },
  ) {
    super(id, "filter")
  }

  process(message: MidiMessage): MidiMessage | null {
    // Channel filter
    if (this.config.channels && !this.config.channels.includes(message.channel)) {
      return null
    }

    // Note messages
    if (message.type === "noteon" || message.type === "noteoff") {
      if (this.config.noteRange) {
        const note = message.data.note || 0
        if (note < this.config.noteRange.min || note > this.config.noteRange.max) {
          return null
        }
      }
      if (this.config.velocityRange) {
        const velocity = message.data.velocity || 0
        if (velocity < this.config.velocityRange.min || velocity > this.config.velocityRange.max) {
          return null
        }
      }
    }

    // CC messages
    if (message.type === "cc" && this.config.controllers) {
      const controller = message.data.controller || 0
      if (!this.config.controllers.includes(controller)) {
        return null
      }
    }

    return message
  }
}

export class TransformProcessor extends BaseMidiProcessor {
  constructor(
    id: string,
    private config: {
      transpose?: number
      velocityCurve?: "linear" | "exponential" | "logarithmic" | "fixed"
      velocityFixed?: number
      channelRemap?: Map<number, number>
    },
  ) {
    super(id, "transform")
  }

  process(message: MidiMessage): MidiMessage | null {
    const processed = { ...message, data: { ...message.data } }

    // Channel remapping
    if (this.config.channelRemap?.has(message.channel)) {
      processed.channel = this.config.channelRemap.get(message.channel)!
    }

    // Note transposition
    if ((message.type === "noteon" || message.type === "noteoff") && this.config.transpose) {
      const note = (message.data.note || 0) + this.config.transpose
      // Keep within MIDI range
      processed.data.note = Math.max(0, Math.min(127, note))
    }

    // Velocity processing
    if ((message.type === "noteon" || message.type === "noteoff") && message.data.velocity !== undefined) {
      if (this.config.velocityFixed !== undefined) {
        processed.data.velocity = this.config.velocityFixed
      } else if (this.config.velocityCurve) {
        let velocity = message.data.velocity / 127
        switch (this.config.velocityCurve) {
          case "exponential":
            velocity *= velocity
            break
          case "logarithmic":
            velocity = Math.log(velocity + 1) / Math.log(2)
            break
          default:
            // No transformation needed
            break
        }
        processed.data.velocity = Math.round(velocity * 127)
      }
    }

    return processed
  }
}

export class SplitProcessor extends BaseMidiProcessor {
  constructor(
    id: string,
    private config: {
      splitPoint: number
      lowerChannel?: number
      upperChannel?: number
    },
  ) {
    super(id, "split")
  }

  process(message: MidiMessage): MidiMessage | null {
    if (message.type === "noteon" || message.type === "noteoff") {
      const note = message.data.note || 0
      const processed = { ...message, data: { ...message.data } }

      if (note < this.config.splitPoint && this.config.lowerChannel) {
        processed.channel = this.config.lowerChannel
      } else if (note >= this.config.splitPoint && this.config.upperChannel) {
        processed.channel = this.config.upperChannel
      }

      return processed
    }

    return message
  }
}

export class MidiRouter extends EventEmitter {
  private routes = new Map<string, MidiRoute>()
  private processors = new Map<string, BaseMidiProcessor>()
  private routeOrder: string[] = []
  private enabledRoutes = new Set<string>()

  constructor() {
    super()
    this.setupBuiltinProcessors()
  }

  private setupBuiltinProcessors(): void {
    // Register some common processors
    this.registerProcessor(
      new FilterProcessor("filter-velocity", {
        velocityRange: { min: 0, max: 127 },
      }),
    )

    this.registerProcessor(
      new TransformProcessor("transpose", {
        transpose: 0,
      }),
    )
  }

  // Route management
  createRoute(config: Omit<MidiRoute, "id">): string {
    const id = `route_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const route: MidiRoute = { ...config, id }

    this.routes.set(id, route)
    this.routeOrder.push(id)

    if (route.enabled) {
      this.enabledRoutes.add(id)
    }

    this.emit("routeCreated", route)
    return id
  }

  updateRoute(id: string, updates: Partial<MidiRoute>): void {
    const route = this.routes.get(id)
    if (!route) return

    Object.assign(route, updates)

    // Update enabled state
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.enabledRoutes.add(id)
      } else {
        this.enabledRoutes.delete(id)
      }
    }

    this.emit("routeUpdated", route)
  }

  deleteRoute(id: string): void {
    if (this.routes.delete(id)) {
      this.enabledRoutes.delete(id)
      this.routeOrder = this.routeOrder.filter((rid) => rid !== id)
      this.emit("routeDeleted", id)
    }
  }

  getRoute(id: string): MidiRoute | undefined {
    return this.routes.get(id)
  }

  getRoutes(): MidiRoute[] {
    return this.routeOrder.map((id) => this.routes.get(id)!).filter(Boolean)
  }

  // Processor management
  registerProcessor(processor: BaseMidiProcessor): void {
    this.processors.set(processor.id, processor)
    this.emit("processorRegistered", processor)
  }

  unregisterProcessor(id: string): void {
    if (this.processors.delete(id)) {
      this.emit("processorUnregistered", id)
    }
  }

  // Message routing
  routeMessage(sourceDevice: string, message: MidiMessage): void {
    // Process through each enabled route in order
    for (const routeId of this.routeOrder) {
      if (!this.enabledRoutes.has(routeId)) continue

      const route = this.routes.get(routeId)
      if (!route) continue

      // Check if message matches route criteria
      if (!this.matchesRouteCriteria(sourceDevice, message, route)) continue

      // Process message through processors
      let processedMessage: MidiMessage | null = message
      for (const processorConfig of route.processors) {
        if (!processorConfig.enabled) continue

        const processor = this.processors.get(processorConfig.id)
        if (processor) {
          processedMessage = processor.process(processedMessage, route)
          if (!processedMessage) break // Message filtered out
        }
      }

      if (!processedMessage) continue

      // Send to destinations
      for (const destination of route.destinations) {
        this.sendToDestination(processedMessage, destination)
      }
    }
  }

  private matchesRouteCriteria(sourceDevice: string, message: MidiMessage, route: MidiRoute): boolean {
    // Device filter
    if (route.sourceDevice && route.sourceDevice !== sourceDevice) {
      return false
    }

    // Channel filter
    if (route.sourceChannel && route.sourceChannel !== message.channel) {
      return false
    }

    // Message type filter
    if (route.sourceType && !route.sourceType.includes(message.type)) {
      return false
    }

    // Range filters
    if (route.sourceRange) {
      if (message.type === "noteon" || message.type === "noteoff") {
        const note = message.data.note || 0
        if (route.sourceRange.minNote !== undefined && note < route.sourceRange.minNote) {
          return false
        }
        if (route.sourceRange.maxNote !== undefined && note > route.sourceRange.maxNote) {
          return false
        }
      }

      if (message.type === "cc" && route.sourceRange.controllers) {
        const controller = message.data.controller || 0
        if (!route.sourceRange.controllers.includes(controller)) {
          return false
        }
      }
    }

    return true
  }

  private sendToDestination(message: MidiMessage, destination: MidiDestination): void {
    // Apply destination transform
    let finalMessage = message
    if (destination.transform) {
      finalMessage = this.applyTransform(message, destination.transform)
    }

    // Send based on destination type
    switch (destination.type) {
      case "device":
        if (destination.deviceId) {
          this.emit("sendToDevice", {
            deviceId: destination.deviceId,
            message: finalMessage,
          })
        }
        break

      case "channel":
        if (destination.targetChannel !== undefined) {
          const channelMessage = { ...finalMessage, channel: destination.targetChannel }
          this.emit("sendToChannel", {
            channel: destination.targetChannel,
            message: channelMessage,
          })
        }
        break

      case "virtual":
        if (destination.virtualId) {
          this.emit("sendToVirtual", {
            virtualId: destination.virtualId,
            message: finalMessage,
          })
        }
        break

      case "function":
        if (destination.callback) {
          try {
            destination.callback(finalMessage)
          } catch (error) {
            logger.error("Error in MIDI route callback:", { error })
          }
        }
        break
      default:
        logger.warn("Unknown destination type:", { type: destination.type })
        break
    }
  }

  private applyTransform(message: MidiMessage, transform: MidiTransform): MidiMessage {
    const transformed = { ...message, data: { ...message.data } }

    // Channel transform
    if (transform.channelOffset) {
      transformed.channel = ((message.channel - 1 + transform.channelOffset) % 16) + 1
    } else if (transform.channelMap?.has(message.channel)) {
      transformed.channel = transform.channelMap.get(message.channel)!
    }

    // Note transform
    if ((message.type === "noteon" || message.type === "noteoff") && transform.transpose) {
      const note = (message.data.note || 0) + transform.transpose
      transformed.data.note = Math.max(0, Math.min(127, note))
    }

    // Velocity transform
    if ((message.type === "noteon" || message.type === "noteoff") && message.data.velocity !== undefined) {
      let velocity = message.data.velocity

      if (transform.velocityScale !== undefined) {
        velocity = Math.round(velocity * transform.velocityScale)
      }

      if (transform.velocityOffset !== undefined) {
        velocity += transform.velocityOffset
      }

      transformed.data.velocity = Math.max(0, Math.min(127, velocity))
    }

    // CC transform
    if (message.type === "cc") {
      if (transform.ccMap?.has(message.data.controller || 0)) {
        transformed.data.controller = transform.ccMap.get(message.data.controller || 0)
      }

      if (message.data.value !== undefined) {
        let value = message.data.value

        if (transform.valueScale !== undefined) {
          value = Math.round(value * transform.valueScale)
        }

        if (transform.valueInvert) {
          value = 127 - value
        }

        transformed.data.value = Math.max(0, Math.min(127, value))
      }
    }

    return transformed
  }

  // Utility methods
  reorderRoutes(routeIds: string[]): void {
    // Validate all route IDs exist
    const validIds = routeIds.filter((id) => this.routes.has(id))
    if (validIds.length !== routeIds.length) {
      logger.warn("Some route IDs are invalid")
    }

    this.routeOrder = validIds
    this.emit("routesReordered", this.routeOrder)
  }

  // Create common routing presets
  createKeyboardSplitRoute(
    splitPoint: number,
    lowerDevice: string,
    upperDevice: string,
    lowerChannel = 1,
    upperChannel = 2,
  ): string {
    return this.createRoute({
      name: `Keyboard Split at ${splitPoint}`,
      enabled: true,
      sourceType: ["noteon", "noteoff"],
      destinations: [
        {
          id: "lower",
          type: "device",
          deviceId: lowerDevice,
          transform: { channelOffset: lowerChannel - 1 },
        },
        {
          id: "upper",
          type: "device",
          deviceId: upperDevice,
          transform: { channelOffset: upperChannel - 1 },
        },
      ],
      processors: [
        {
          id: `split_${splitPoint}`,
          type: "split",
          enabled: true,
          config: { splitPoint, lowerChannel, upperChannel },
        },
      ],
    })
  }

  createChannelFilterRoute(sourceChannel: number, targetDevice: string, targetChannel?: number): string {
    return this.createRoute({
      name: `Channel ${sourceChannel} to ${targetDevice}`,
      enabled: true,
      sourceChannel,
      destinations: [
        {
          id: "target",
          type: "device",
          deviceId: targetDevice,
          transform: targetChannel ? { channelMap: new Map([[sourceChannel, targetChannel]]) } : undefined,
        },
      ],
      processors: [],
    })
  }

  createCCRemapRoute(sourceCC: number, targetCC: number, targetDevice?: string): string {
    return this.createRoute({
      name: `Remap CC${sourceCC} to CC${targetCC}`,
      enabled: true,
      sourceType: ["cc"],
      sourceRange: { controllers: [sourceCC] },
      destinations: [
        {
          id: "remapped",
          type: targetDevice ? "device" : "channel",
          deviceId: targetDevice,
          transform: { ccMap: new Map([[sourceCC, targetCC]]) },
        },
      ],
      processors: [],
    })
  }

  // Cleanup
  dispose(): void {
    this.routes.clear()
    this.processors.clear()
    this.routeOrder = []
    this.enabledRoutes.clear()
    this.removeAllListeners()
  }
}
