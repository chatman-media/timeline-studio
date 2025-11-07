import { createLogger } from "@/lib/tauri-logger"
import type { NodeProcessor } from "../../types/node-compositing"

const logger = createLogger("MathNodes")

/**
 * Math and Logic Nodes
 */

// Math Operation - Basic math operations
export const mathOperationProcessor: NodeProcessor = {
  type: "math_operation",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "a",
      name: "A",
      type: "number",
      direction: "input",
      required: true,
    },
    {
      id: "b",
      name: "B",
      type: "number",
      direction: "input",
      required: false,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "result",
      name: "Result",
      type: "number",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "operation",
      name: "Operation",
      type: "select",
      value: "add",
      options: [
        { value: "add", label: "Add (A + B)" },
        { value: "subtract", label: "Subtract (A - B)" },
        { value: "multiply", label: "Multiply (A × B)" },
        { value: "divide", label: "Divide (A ÷ B)" },
        { value: "power", label: "Power (A^B)" },
        { value: "modulo", label: "Modulo (A % B)" },
        { value: "min", label: "Minimum" },
        { value: "max", label: "Maximum" },
        { value: "abs", label: "Absolute |A|" },
        { value: "sqrt", label: "Square Root √A" },
        { value: "sin", label: "Sine" },
        { value: "cos", label: "Cosine" },
        { value: "tan", label: "Tangent" },
        { value: "floor", label: "Floor" },
        { value: "ceil", label: "Ceiling" },
        { value: "round", label: "Round" },
      ],
    },
    {
      id: "b_value",
      name: "B Value",
      type: "number",
      value: 1,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
      visible: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const a = inputs.a ?? 0
    const b = inputs.b ?? node.parameters.find((p) => p.id === "b_value")?.value ?? 1
    const operation = node.parameters.find((p) => p.id === "operation")?.value || "add"

    let result = 0
    switch (operation) {
      case "add":
        result = a + b
        break
      case "subtract":
        result = a - b
        break
      case "multiply":
        result = a * b
        break
      case "divide":
        result = b !== 0 ? a / b : 0
        break
      case "power":
        result = a ** b
        break
      case "modulo":
        result = b !== 0 ? a % b : 0
        break
      case "min":
        result = Math.min(a, b)
        break
      case "max":
        result = Math.max(a, b)
        break
      case "abs":
        result = Math.abs(a)
        break
      case "sqrt":
        result = Math.sqrt(Math.abs(a))
        break
      case "sin":
        result = Math.sin(a)
        break
      case "cos":
        result = Math.cos(a)
        break
      case "tan":
        result = Math.tan(a)
        break
      case "floor":
        result = Math.floor(a)
        break
      case "ceil":
        result = Math.ceil(a)
        break
      case "round":
        result = Math.round(a)
        break
      default:
        logger.warn(`Unknown math operation: ${operation}`)
        result = a
    }

    return { result }
  },
}

// Compare - Comparison operations
export const compareProcessor: NodeProcessor = {
  type: "compare",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "a",
      name: "A",
      type: "number",
      direction: "input",
      required: true,
    },
    {
      id: "b",
      name: "B",
      type: "number",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "result",
      name: "Result",
      type: "boolean",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "operation",
      name: "Operation",
      type: "select",
      value: "equal",
      options: [
        { value: "equal", label: "Equal (==)" },
        { value: "not_equal", label: "Not Equal (!=)" },
        { value: "greater", label: "Greater (>)" },
        { value: "greater_equal", label: "Greater or Equal (>=)" },
        { value: "less", label: "Less (<)" },
        { value: "less_equal", label: "Less or Equal (<=)" },
      ],
    },
    {
      id: "tolerance",
      name: "Tolerance",
      type: "number",
      value: 0.0001,
      min: 0,
      max: 1,
      step: 0.0001,
      visible: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const a = inputs.a ?? 0
    const b = inputs.b ?? 0
    const operation = node.parameters.find((p) => p.id === "operation")?.value || "equal"
    const tolerance = node.parameters.find((p) => p.id === "tolerance")?.value || 0.0001

    let result = false
    switch (operation) {
      case "equal":
        result = Math.abs(a - b) < tolerance
        break
      case "not_equal":
        result = Math.abs(a - b) >= tolerance
        break
      case "greater":
        result = a > b
        break
      case "greater_equal":
        result = a >= b
        break
      case "less":
        result = a < b
        break
      case "less_equal":
        result = a <= b
        break
      default:
        logger.warn(`Unknown compare operation: ${operation}`)
        result = false
    }

    return { result }
  },
}

// Logic Gate - Boolean operations
export const logicGateProcessor: NodeProcessor = {
  type: "logic_gate",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "a",
      name: "A",
      type: "boolean",
      direction: "input",
      required: true,
    },
    {
      id: "b",
      name: "B",
      type: "boolean",
      direction: "input",
      required: false,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "result",
      name: "Result",
      type: "boolean",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "operation",
      name: "Operation",
      type: "select",
      value: "and",
      options: [
        { value: "and", label: "AND" },
        { value: "or", label: "OR" },
        { value: "xor", label: "XOR" },
        { value: "nand", label: "NAND" },
        { value: "nor", label: "NOR" },
        { value: "not", label: "NOT (A)" },
      ],
    },
  ],

  process: async (node, inputs, _context) => {
    const a = inputs.a ?? false
    const b = inputs.b ?? false
    const operation = node.parameters.find((p) => p.id === "operation")?.value || "and"

    let result = false
    switch (operation) {
      case "and":
        result = a && b
        break
      case "or":
        result = a || b
        break
      case "xor":
        result = (a || b) && !(a && b)
        break
      case "nand":
        result = !(a && b)
        break
      case "nor":
        result = !(a || b)
        break
      case "not":
        result = !a
        break
      default:
        logger.warn(`Unknown logic operation: ${operation}`)
        result = false
    }

    return { result }
  },
}

// Clamp - Limit value to range
export const clampProcessor: NodeProcessor = {
  type: "clamp",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "value",
      name: "Value",
      type: "number",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "result",
      name: "Result",
      type: "number",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "min",
      name: "Minimum",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "max",
      name: "Maximum",
      type: "number",
      value: 1,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const value = inputs.value ?? 0
    const min = node.parameters.find((p) => p.id === "min")?.value ?? 0
    const max = node.parameters.find((p) => p.id === "max")?.value ?? 1

    return {
      result: Math.max(min, Math.min(max, value)),
    }
  },
}

// Remap - Map value from one range to another
export const remapProcessor: NodeProcessor = {
  type: "remap",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "value",
      name: "Value",
      type: "number",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "result",
      name: "Result",
      type: "number",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "in_min",
      name: "Input Min",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "in_max",
      name: "Input Max",
      type: "number",
      value: 1,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "out_min",
      name: "Output Min",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "out_max",
      name: "Output Max",
      type: "number",
      value: 100,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "clamp",
      name: "Clamp Output",
      type: "boolean",
      value: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const value = inputs.value ?? 0
    const inMin = node.parameters.find((p) => p.id === "in_min")?.value ?? 0
    const inMax = node.parameters.find((p) => p.id === "in_max")?.value ?? 1
    const outMin = node.parameters.find((p) => p.id === "out_min")?.value ?? 0
    const outMax = node.parameters.find((p) => p.id === "out_max")?.value ?? 100
    const clamp = node.parameters.find((p) => p.id === "clamp")?.value ?? true

    // Normalize to 0-1
    let normalized = (value - inMin) / (inMax - inMin)

    // Clamp if needed
    if (clamp) {
      normalized = Math.max(0, Math.min(1, normalized))
    }

    // Map to output range
    const result = outMin + normalized * (outMax - outMin)

    return { result }
  },
}

// Random - Generate random values
export const randomProcessor: NodeProcessor = {
  type: "random",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "seed",
      name: "Seed",
      type: "number",
      direction: "input",
      required: false,
    },
  ],

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
      id: "min",
      name: "Minimum",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "max",
      name: "Maximum",
      type: "number",
      value: 1,
      min: -1000,
      max: 1000,
      step: 0.1,
      animatable: true,
    },
    {
      id: "type",
      name: "Type",
      type: "select",
      value: "uniform",
      options: [
        { value: "uniform", label: "Uniform" },
        { value: "gaussian", label: "Gaussian" },
        { value: "integer", label: "Integer" },
      ],
    },
    {
      id: "animated",
      name: "Animated",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, inputs, context) => {
    const seed = inputs.seed ?? 0
    const min = node.parameters.find((p) => p.id === "min")?.value ?? 0
    const max = node.parameters.find((p) => p.id === "max")?.value ?? 1
    const type = node.parameters.find((p) => p.id === "type")?.value || "uniform"
    const animated = node.parameters.find((p) => p.id === "animated")?.value || false

    // Use seed + frame for animated random
    const finalSeed = animated ? seed + context.frameNumber : seed

    // Simple pseudo-random based on seed
    const random = () => {
      const x = Math.sin(finalSeed * 12.9898 + 78.233) * 43758.5453
      return x - Math.floor(x)
    }

    let value = 0
    switch (type) {
      case "uniform":
        value = min + random() * (max - min)
        break
      case "gaussian": {
        // Box-Muller transform for gaussian
        const u1 = random()
        const u2 = random()
        const gaussian = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
        value = min + (gaussian * 0.5 + 0.5) * (max - min)
        break
      }
      case "integer":
        value = Math.floor(min + random() * (max - min + 1))
        break
      default:
        logger.warn(`Unknown random type: ${type}`)
        value = min + random() * (max - min)
    }

    return { value }
  },
}

// Switch - Select between inputs
export const switchProcessor: NodeProcessor = {
  type: "switch",
  category: "utility",

  getDefaultInputs: () => [
    {
      id: "input1",
      name: "Input 1",
      type: "data",
      direction: "input",
      required: true,
    },
    {
      id: "input2",
      name: "Input 2",
      type: "data",
      direction: "input",
      required: true,
    },
    {
      id: "condition",
      name: "Condition",
      type: "boolean",
      direction: "input",
      required: false,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "data",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "condition_value",
      name: "Condition",
      type: "boolean",
      value: true,
      visible: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const condition = inputs.condition ?? node.parameters.find((p) => p.id === "condition_value")?.value ?? true

    return {
      output: condition ? inputs.input1 : inputs.input2,
    }
  },
}
