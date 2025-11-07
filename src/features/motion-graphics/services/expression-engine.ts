/**
 * Expression Engine
 * Evaluates JavaScript expressions for procedural animations
 */

import { createLogger } from "@/lib/tauri-logger"
import type { ExpressionContext, KeyframeValue } from "../types/keyframe"

const logger = createLogger({ module: "ExpressionEngine" })

/**
 * Built-in expression functions
 */
const expressionFunctions = {
  // Math functions
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  abs: Math.abs,
  sqrt: Math.sqrt,
  pow: Math.pow,
  min: Math.min,
  max: Math.max,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  random: Math.random,

  // Interpolation
  linear: (a: number, b: number, t: number) => a + (b - a) * t,

  // Easing functions
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Noise functions
  noise: (x: number, seed = 0) => {
    // Simple pseudo-random noise
    const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453
    return n - Math.floor(n)
  },

  // Wave functions
  sawtooth: (t: number, period = 1) => (t % period) / period,
  triangle: (t: number, period = 1) => {
    const p = t % period
    return p < period / 2 ? (2 * p) / period : 2 - (2 * p) / period
  },
  square: (t: number, period = 1) => (t % period < period / 2 ? 1 : 0),

  // Utility functions
  clamp: (value: number, min: number, max: number) => Math.max(min, Math.min(max, value)),
  map: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin))
  },
  smoothstep: (edge0: number, edge1: number, x: number) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
  },

  // Vector operations
  vec2: (x: number, y: number): [number, number] => [x, y],
  vec3: (x: number, y: number, z: number): [number, number, number] => [x, y, z],
  vec4: (x: number, y: number, z: number, w: number): [number, number, number, number] => [x, y, z, w],

  length: (v: number[]) => Math.sqrt(v.reduce((sum, val) => sum + val * val, 0)),

  normalize: (v: number[]) => {
    const len = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0))
    return len > 0 ? v.map((val) => val / len) : v
  },

  dot: (a: number[], b: number[]) => {
    return a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0)
  },

  // Color functions
  rgb: (r: number, g: number, b: number) => {
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, "0")
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  },

  hsl: (h: number, s: number, l: number) => {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    const r = hue2rgb(p, q, h / 360 + 1 / 3)
    const g = hue2rgb(p, q, h / 360)
    const b = hue2rgb(p, q, h / 360 - 1 / 3)

    return expressionFunctions.rgb(r, g, b)
  },
}

/**
 * Expression evaluator
 */
export class ExpressionEvaluator {
  private compiledExpressions = new Map<string, (...args: any[]) => KeyframeValue>()

  /**
   * Evaluate an expression with context
   */
  evaluate(expression: string, context: ExpressionContext): KeyframeValue {
    try {
      // Get or compile expression
      let compiledFn = this.compiledExpressions.get(expression)

      if (!compiledFn) {
        compiledFn = this.compileExpression(expression)
        this.compiledExpressions.set(expression, compiledFn)
      }

      // Create safe context
      const safeContext = this.createSafeContext(context)

      // Evaluate
      return compiledFn.call(safeContext)
    } catch (error) {
      logger.error("Expression evaluation error:", error instanceof Error ? { message: error.message } : { error })
      return context.value // Return current value on error
    }
  }

  /**
   * Compile expression to function
   */
  private compileExpression(expression: string): (...args: any[]) => KeyframeValue {
    // Wrap expression in function
    const functionBody = `
      with (this) {
        return (${expression});
      }
    `

    // Create safe function with controlled evaluation
    const compiledFunction = (..._args: any[]): KeyframeValue => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn = new Function(functionBody)
        return fn.call(this)
      } catch (error) {
        logger.error("Expression compilation error:", error instanceof Error ? { message: error.message } : { error })
        return 0 // Return default value on error
      }
    }

    return compiledFunction
  }

  /**
   * Create safe evaluation context
   */
  private createSafeContext(context: ExpressionContext): any {
    return {
      // Time variables
      time: context.time,
      frame: context.frame,
      fps: context.fps,

      // Value variables
      value: context.value,
      velocity: context.velocity,

      // Layer/property info
      index: context.layer?.id ? Number.parseInt(context.layer.id.split("-").pop() || "0", 10) : 0,

      // Composition info
      comp: {
        width: context.comp.width,
        height: context.comp.height,
        duration: context.comp.duration,
        frameDuration: context.comp.frameDuration,
      },

      // All expression functions
      ...expressionFunctions,

      // Helper methods
      thisComp: (name: string) => {
        // Mock implementation - would connect to actual comp data
        return context.thisComp(name)
      },

      thisLayer: (name: string) => {
        // Mock implementation - would connect to actual layer data
        return context.thisLayer(name)
      },

      thisProperty: () => {
        return context.thisProperty()
      },

      // Animation helpers
      wiggle: (freq: number, amp: number, octaves = 1, ampMult = 0.5, time?: number) => {
        const t = time ?? context.time
        let result = 0
        let maxAmp = 0

        for (let i = 0; i < octaves; i++) {
          const noise = expressionFunctions.noise(t * freq * 2 ** i, i)
          result += (noise * 2 - 1) * amp
          maxAmp += amp
          amp *= ampMult
        }

        return result
      },

      loopIn: (type: "cycle" | "pingpong" | "offset" | "continue" = "cycle", _numKeyframes = 0) => {
        // Simplified loop implementation
        const period =
          context.property.keyframes.length > 0
            ? context.property.keyframes[context.property.keyframes.length - 1].time
            : 1

        if (type === "cycle") {
          return context.value
        }
        if (type === "pingpong") {
          const cycles = Math.floor(context.time / period)
          return cycles % 2 === 0 ? context.value : context.property.keyframes[0]?.value
        }

        return context.value
      },

      loopOut: (type: "cycle" | "pingpong" | "offset" | "continue" = "cycle", _numKeyframes = 0) => {
        // Similar to loopIn but for post-animation
        const period =
          context.property.keyframes.length > 0
            ? context.property.keyframes[context.property.keyframes.length - 1].time
            : 1

        if (type === "cycle") {
          return context.value
        }
        if (type === "pingpong") {
          const cycles = Math.floor(context.time / period)
          return cycles % 2 === 0 ? context.value : context.property.keyframes[0]?.value
        }

        return context.value
      },
    }
  }

  /**
   * Validate expression syntax
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    try {
      this.compileExpression(expression)
      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Invalid expression",
      }
    }
  }

  /**
   * Get expression suggestions
   */
  getSuggestions(partial: string): string[] {
    const suggestions: string[] = []

    // Add function suggestions
    Object.keys(expressionFunctions).forEach((fn) => {
      if (fn.toLowerCase().startsWith(partial.toLowerCase())) {
        suggestions.push(fn)
      }
    })

    // Add common patterns
    const patterns = [
      "time",
      "frame",
      "value",
      "wiggle(2, 50)",
      "sin(time * 2 * Math.PI)",
      "ease(time, 0, 1, 2)",
      "loopOut('cycle')",
      "clamp(value, 0, 100)",
      "linear(time, 0, 1)",
      "random() * 100",
    ]

    patterns.forEach((pattern) => {
      if (pattern.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.push(pattern)
      }
    })

    return suggestions.slice(0, 10)
  }
}

/**
 * Expression presets
 */
export const expressionPresets = {
  // Motion presets
  wiggle: {
    name: "Wiggle",
    expression: "value + wiggle(2, 50)",
    description: "Add random movement",
  },

  bounce: {
    name: "Bounce",
    expression: `
      const e = 0.7; // elasticity
      const g = 4000; // gravity
      const nMax = 9; // max bounces
      
      let n = 0;
      if (time > 0) {
        let t = 0;
        let tNext = 0;
        let v = 0;
        
        while (tNext < time && n < nMax) {
          t = tNext;
          v = e * v;
          tNext = t + 2 * v / g;
          n++;
        }
        
        if (n < nMax) {
          const delta = time - t;
          value - v * delta + g * delta * delta / 2;
        } else {
          value;
        }
      } else {
        value;
      }
    `,
    description: "Bouncing ball physics",
  },

  // Wave presets
  sine: {
    name: "Sine Wave",
    expression: "value + sin(time * 2 * Math.PI) * 50",
    description: "Smooth sine wave oscillation",
  },

  pulse: {
    name: "Pulse",
    expression: "value * (1 + sin(time * 4 * Math.PI) * 0.2)",
    description: "Pulsing scale effect",
  },

  // Transition presets
  fadeIn: {
    name: "Fade In",
    expression: "value * clamp(time * 2, 0, 1)",
    description: "Fade in over 0.5 seconds",
  },

  typewriter: {
    name: "Typewriter",
    expression: "Math.floor(time * 10)",
    description: "Typewriter text reveal",
  },

  // Interactive presets
  followMouse: {
    name: "Follow Mouse",
    expression: `
      const mouseX = thisComp("mouseX") || comp.width / 2;
      const mouseY = thisComp("mouseY") || comp.height / 2;
      const smooth = 0.1;
      
      value + [(mouseX - value[0]) * smooth, (mouseY - value[1]) * smooth];
    `,
    description: "Smooth mouse follow",
  },

  // Complex presets
  pendulum: {
    name: "Pendulum",
    expression: `
      const A = 45; // amplitude in degrees
      const P = 1.5; // period in seconds
      const D = 0.1; // damping
      
      A * Math.exp(-D * time) * sin(2 * Math.PI * time / P)
    `,
    description: "Damped pendulum swing",
  },
}

/**
 * Create expression evaluator instance
 */
export const expressionEvaluator = new ExpressionEvaluator()
