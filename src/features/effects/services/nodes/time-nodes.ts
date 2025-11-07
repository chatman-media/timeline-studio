import { createLogger } from "@/lib/tauri-logger"
import type { NodeProcessor } from "../../types/node-compositing"

const logger = createLogger("TimeNodes")

/**
 * Time and Animation Nodes
 */

// Time Remap - Control playback speed and direction
export const timeRemapProcessor: NodeProcessor = {
  type: "time_remap",
  category: "time",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "video",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "video",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "speed",
      name: "Speed",
      type: "number",
      value: 1,
      min: -10,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "offset",
      name: "Time Offset",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      step: 1,
      animatable: true,
    },
    {
      id: "loop_mode",
      name: "Loop Mode",
      type: "select",
      value: "none",
      options: [
        { value: "none", label: "None" },
        { value: "loop", label: "Loop" },
        { value: "ping_pong", label: "Ping Pong" },
        { value: "freeze", label: "Freeze" },
      ],
    },
    {
      id: "interpolation",
      name: "Frame Interpolation",
      type: "select",
      value: "none",
      options: [
        { value: "none", label: "None" },
        { value: "linear", label: "Linear" },
        { value: "optical_flow", label: "Optical Flow" },
      ],
    },
  ],

  process: async (node, inputs, context) => {
    const input = inputs.input
    const speed = node.parameters.find((p) => p.id === "speed")?.value || 1
    const offset = node.parameters.find((p) => p.id === "offset")?.value || 0
    const loopMode = node.parameters.find((p) => p.id === "loop_mode")?.value || "none"
    const interpolation = node.parameters.find((p) => p.id === "interpolation")?.value || "none"

    // Calculate remapped frame
    let remappedFrame = context.frameNumber * speed + offset

    // Apply loop mode
    if (loopMode !== "none" && input.duration) {
      const duration = input.duration
      switch (loopMode) {
        case "loop":
          remappedFrame %= duration
          if (remappedFrame < 0) remappedFrame += duration
          break
        case "ping_pong": {
          const cycle = Math.floor(remappedFrame / duration)
          if (cycle % 2 === 1) {
            remappedFrame = duration - (remappedFrame % duration)
          } else {
            remappedFrame %= duration
          }
          break
        }
        case "freeze":
          remappedFrame = Math.max(0, Math.min(duration - 1, remappedFrame))
          break
        default:
          // For "none" or unknown loop modes, do nothing
          break
      }
    }

    return {
      output: {
        ...input,
        timeRemap: {
          frame: remappedFrame,
          speed,
          interpolation,
        },
      },
    }
  },
}

// Echo - Create trailing echoes/ghosts
export const echoProcessor: NodeProcessor = {
  type: "echo",
  category: "time",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "video",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "video",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "echo_count",
      name: "Echo Count",
      type: "number",
      value: 3,
      min: 1,
      max: 10,
      step: 1,
    },
    {
      id: "echo_delay",
      name: "Echo Delay (frames)",
      type: "number",
      value: 5,
      min: 1,
      max: 30,
      step: 1,
      animatable: true,
    },
    {
      id: "echo_decay",
      name: "Echo Decay",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "blend_mode",
      name: "Blend Mode",
      type: "select",
      value: "add",
      options: [
        { value: "add", label: "Add" },
        { value: "screen", label: "Screen" },
        { value: "max", label: "Maximum" },
        { value: "average", label: "Average" },
      ],
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const echoCount = node.parameters.find((p) => p.id === "echo_count")?.value || 3
    const echoDelay = node.parameters.find((p) => p.id === "echo_delay")?.value || 5
    const echoDecay = node.parameters.find((p) => p.id === "echo_decay")?.value || 0.5
    const blendMode = node.parameters.find((p) => p.id === "blend_mode")?.value || "add"

    const echoes = []
    for (let i = 1; i <= echoCount; i++) {
      echoes.push({
        delay: i * echoDelay,
        opacity: echoDecay ** i,
      })
    }

    return {
      output: {
        ...input,
        echo: {
          echoes,
          blendMode,
        },
      },
    }
  },
}

// Frame Hold - Freeze frame
export const frameHoldProcessor: NodeProcessor = {
  type: "frame_hold",
  category: "time",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "video",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "video",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "hold_frame",
      name: "Hold Frame",
      type: "number",
      value: 0,
      min: 0,
      max: 10000,
      step: 1,
      animatable: true,
    },
    {
      id: "hold_type",
      name: "Hold Type",
      type: "select",
      value: "freeze",
      options: [
        { value: "freeze", label: "Freeze" },
        { value: "first", label: "First Frame" },
        { value: "last", label: "Last Frame" },
        { value: "custom", label: "Custom Frame" },
      ],
    },
  ],

  process: async (node, inputs, context) => {
    const input = inputs.input
    const holdFrame = node.parameters.find((p) => p.id === "hold_frame")?.value || 0
    const holdType = node.parameters.find((p) => p.id === "hold_type")?.value || "freeze"

    let targetFrame = holdFrame
    switch (holdType) {
      case "first":
        targetFrame = 0
        break
      case "last":
        targetFrame = input.duration ? input.duration - 1 : 0
        break
      case "custom":
        targetFrame = holdFrame
        break
      case "freeze":
        // Freeze at current frame when parameter changes
        targetFrame = context.frameNumber
        break
      default:
        logger.warn(`Unknown hold type: ${holdType}`)
        targetFrame = holdFrame
    }

    return {
      output: {
        ...input,
        frameHold: targetFrame,
      },
    }
  },
}

// Strobe - Strobe/flash effect
export const strobeProcessor: NodeProcessor = {
  type: "strobe",
  category: "time",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "image",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "image",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "frequency",
      name: "Frequency",
      type: "number",
      value: 5,
      min: 0.1,
      max: 60,
      step: 0.1,
      animatable: true,
    },
    {
      id: "duty_cycle",
      name: "Duty Cycle",
      type: "number",
      value: 0.5,
      min: 0.01,
      max: 0.99,
      step: 0.01,
      animatable: true,
    },
    {
      id: "strobe_color",
      name: "Strobe Color",
      type: "color",
      value: "#000000",
    },
    {
      id: "fade",
      name: "Fade",
      type: "number",
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ],

  process: async (node, inputs, context) => {
    const input = inputs.input
    const frequency = node.parameters.find((p) => p.id === "frequency")?.value || 5
    const dutyCycle = node.parameters.find((p) => p.id === "duty_cycle")?.value || 0.5
    const strobeColor = node.parameters.find((p) => p.id === "strobe_color")?.value || "#000000"
    const fade = node.parameters.find((p) => p.id === "fade")?.value || 0

    // Calculate strobe state
    const cycleTime = context.frameRate / frequency
    const frameInCycle = context.frameNumber % cycleTime
    const isOn = frameInCycle / cycleTime < dutyCycle

    // Apply fade
    let opacity = isOn ? 0 : 1
    if (fade > 0) {
      const fadeFrames = cycleTime * fade
      if (!isOn && frameInCycle < fadeFrames) {
        opacity = frameInCycle / fadeFrames
      } else if (isOn && frameInCycle > cycleTime * dutyCycle - fadeFrames) {
        opacity = 1 - (frameInCycle - (cycleTime * dutyCycle - fadeFrames)) / fadeFrames
      }
    }

    return {
      output: {
        ...input,
        strobe: {
          active: !isOn,
          color: strobeColor,
          opacity,
        },
      },
    }
  },
}

// Time Expression - Custom time-based expressions
export const timeExpressionProcessor: NodeProcessor = {
  type: "time_expression",
  category: "time",

  getDefaultInputs: () => [],

  getDefaultOutputs: () => [
    {
      id: "value",
      name: "Value",
      type: "number",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "expression",
      name: "Expression",
      type: "select",
      value: "linear",
      options: [
        { value: "linear", label: "Linear" },
        { value: "sine", label: "Sine Wave" },
        { value: "cosine", label: "Cosine Wave" },
        { value: "sawtooth", label: "Sawtooth" },
        { value: "triangle", label: "Triangle" },
        { value: "square", label: "Square Wave" },
        { value: "noise", label: "Noise" },
        { value: "custom", label: "Custom" },
      ],
    },
    {
      id: "frequency",
      name: "Frequency",
      type: "number",
      value: 1,
      min: 0.01,
      max: 100,
      step: 0.01,
      animatable: true,
    },
    {
      id: "amplitude",
      name: "Amplitude",
      type: "number",
      value: 1,
      min: -10,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "offset",
      name: "Offset",
      type: "number",
      value: 0,
      min: -10,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "phase",
      name: "Phase",
      type: "number",
      value: 0,
      min: 0,
      max: 360,
      step: 1,
      animatable: true,
    },
  ],

  process: async (node, _inputs, context) => {
    const expression = node.parameters.find((p) => p.id === "expression")?.value || "linear"
    const frequency = node.parameters.find((p) => p.id === "frequency")?.value || 1
    const amplitude = node.parameters.find((p) => p.id === "amplitude")?.value || 1
    const offset = node.parameters.find((p) => p.id === "offset")?.value || 0
    const phase = node.parameters.find((p) => p.id === "phase")?.value || 0

    const time = context.time + phase / 360 / frequency
    let value = 0

    switch (expression) {
      case "linear":
        value = time * frequency
        break
      case "sine":
        value = Math.sin(time * frequency * Math.PI * 2)
        break
      case "cosine":
        value = Math.cos(time * frequency * Math.PI * 2)
        break
      case "sawtooth":
        value = ((time * frequency) % 1) * 2 - 1
        break
      case "triangle": {
        const saw = (time * frequency) % 1
        value = saw < 0.5 ? saw * 4 - 1 : 3 - saw * 4
        break
      }
      case "square":
        value = Math.sin(time * frequency * Math.PI * 2) > 0 ? 1 : -1
        break
      case "noise": {
        // Simple pseudo-random noise
        const seed = Math.floor(time * frequency * context.frameRate)
        value = ((Math.sin(seed * 12.9898 + 78.233) * 43758.5453) % 1) * 2 - 1
        break
      }
      default:
        logger.warn(`Unknown expression type: ${expression}`)
        value = time * frequency
    }

    return {
      value: value * amplitude + offset,
    }
  },
}

// Posterize Time - Reduce frame rate
export const posterizeTimeProcessor: NodeProcessor = {
  type: "posterize_time",
  category: "time",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "video",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "video",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "frame_rate",
      name: "Frame Rate",
      type: "number",
      value: 12,
      min: 1,
      max: 60,
      step: 1,
      animatable: true,
    },
    {
      id: "sync_to_timeline",
      name: "Sync to Timeline",
      type: "boolean",
      value: true,
    },
  ],

  process: async (node, inputs, context) => {
    const input = inputs.input
    const targetFps = node.parameters.find((p) => p.id === "frame_rate")?.value || 12
    const syncToTimeline = node.parameters.find((p) => p.id === "sync_to_timeline")?.value ?? true

    // Calculate which frame to hold
    const frameInterval = context.frameRate / targetFps
    const heldFrame = Math.floor(context.frameNumber / frameInterval) * frameInterval

    return {
      output: {
        ...input,
        posterizeTime: {
          frame: syncToTimeline ? heldFrame : Math.floor(context.time * targetFps) / targetFps,
          targetFps,
        },
      },
    }
  },
}
