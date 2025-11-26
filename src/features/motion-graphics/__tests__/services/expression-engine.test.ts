import { describe, expect, it } from "vitest"
import type { ExpressionContext } from "../../types/keyframe"
import { ExpressionEvaluator, expressionPresets } from "../../services/expression-engine"
import { createKeyframe } from "../../services/keyframe-manager"

describe("ExpressionEngine", () => {
  const createMockContext = (overrides?: Partial<ExpressionContext>): ExpressionContext => ({
    time: 1,
    frame: 30,
    fps: 30,
    value: 50,
    velocity: undefined,
    layer: {
      id: "layer-1",
      name: "Test Layer",
      properties: [],
      enabled: true,
      solo: false,
      locked: false,
      opacity: 1,
      blendMode: "normal",
    },
    property: {
      id: "prop-1",
      name: "Test Property",
      path: "test",
      type: "number",
      keyframes: [createKeyframe(0, 0)],
      enabled: true,
    },
    comp: {
      width: 1920,
      height: 1080,
      duration: 10,
      frameDuration: 1 / 30,
    },
    thisComp: () => null,
    thisLayer: () => null,
    thisProperty: () => null,
    ...overrides,
  })

  describe("ExpressionEvaluator", () => {
    const evaluator = new ExpressionEvaluator()

    describe("evaluate", () => {
      it("evaluates simple math expression", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("10 + 20", context)

        expect(result).toBe(30)
      })

      it("uses time variable", () => {
        const context = createMockContext({ time: 2 })
        const result = evaluator.evaluate("time * 10", context)

        expect(result).toBe(20)
      })

      it("uses value variable", () => {
        const context = createMockContext({ value: 100 })
        const result = evaluator.evaluate("value / 2", context)

        expect(result).toBe(50)
      })

      it("uses frame variable", () => {
        const context = createMockContext({ frame: 60 })
        const result = evaluator.evaluate("frame", context)

        expect(result).toBe(60)
      })

      it("uses fps variable", () => {
        const context = createMockContext({ fps: 30 })
        const result = evaluator.evaluate("fps", context)

        expect(result).toBe(30)
      })

      it("calls built-in math functions", () => {
        const context = createMockContext()

        expect(evaluator.evaluate("sin(0)", context)).toBe(0)
        expect(evaluator.evaluate("cos(0)", context)).toBe(1)
        expect(evaluator.evaluate("abs(-5)", context)).toBe(5)
        expect(evaluator.evaluate("sqrt(16)", context)).toBe(4)
        expect(evaluator.evaluate("pow(2, 3)", context)).toBe(8)
      })

      it("calls interpolation functions", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("linear(0, 100, 0.5)", context)

        expect(result).toBe(50)
      })

      it("calls easing functions", () => {
        const context = createMockContext()

        const easeIn = evaluator.evaluate("easeIn(0.5)", context)
        expect(typeof easeIn).toBe("number")

        const easeOut = evaluator.evaluate("easeOut(0.5)", context)
        expect(typeof easeOut).toBe("number")
      })

      it("calls noise function", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("noise(time)", context)

        expect(typeof result).toBe("number")
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(1)
      })

      it("calls wave functions", () => {
        const context = createMockContext()

        expect(typeof evaluator.evaluate("sawtooth(time)", context)).toBe("number")
        expect(typeof evaluator.evaluate("triangle(time)", context)).toBe("number")
        expect(typeof evaluator.evaluate("square(time)", context)).toBe("number")
      })

      it("calls utility functions", () => {
        const context = createMockContext()

        expect(evaluator.evaluate("clamp(150, 0, 100)", context)).toBe(100)
        expect(evaluator.evaluate("map(5, 0, 10, 0, 100)", context)).toBe(50)
        expect(typeof evaluator.evaluate("smoothstep(0, 1, 0.5)", context)).toBe("number")
      })

      it("creates vectors", () => {
        const context = createMockContext()

        const vec2 = evaluator.evaluate("vec2(10, 20)", context) as [number, number]
        expect(vec2).toEqual([10, 20])

        const vec3 = evaluator.evaluate("vec3(1, 2, 3)", context) as [number, number, number]
        expect(vec3).toEqual([1, 2, 3])
      })

      it("calculates vector length", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("length([3, 4])", context)

        expect(result).toBe(5)
      })

      it("normalizes vectors", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("normalize([3, 4])", context) as number[]

        expect(result[0]).toBeCloseTo(0.6, 1)
        expect(result[1]).toBeCloseTo(0.8, 1)
      })

      it("calculates dot product", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("dot([1, 2], [3, 4])", context)

        expect(result).toBe(11) // 1*3 + 2*4
      })

      it("creates rgb colors", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("rgb(1, 0, 0)", context)

        expect(result).toMatch(/^#[0-9a-f]{6}$/)
      })

      it("creates hsl colors", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("hsl(0, 1, 0.5)", context)

        expect(result).toMatch(/^#[0-9a-f]{6}$/)
      })

      it("calls wiggle function", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("wiggle(2, 50)", context)

        expect(typeof result).toBe("number")
      })

      it("calls loopIn function", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("loopIn('cycle')", context)

        expect(result).toBeDefined()
      })

      it("calls loopOut function", () => {
        const context = createMockContext()
        const result = evaluator.evaluate("loopOut('cycle')", context)

        expect(result).toBeDefined()
      })

      it("returns current value on error", () => {
        const context = createMockContext({ value: 123 })
        const result = evaluator.evaluate("invalid.expression.syntax", context)

        expect(result).toBe(123)
      })

      it("caches compiled expressions", () => {
        const context = createMockContext()
        const expression = "time * 10"

        const result1 = evaluator.evaluate(expression, context)
        const result2 = evaluator.evaluate(expression, context)

        expect(result1).toBe(result2)
      })

      it("accesses comp properties", () => {
        const context = createMockContext({
          comp: {
            width: 1920,
            height: 1080,
            duration: 10,
            frameDuration: 1 / 30,
          },
        })

        expect(evaluator.evaluate("comp.width", context)).toBe(1920)
        expect(evaluator.evaluate("comp.height", context)).toBe(1080)
        expect(evaluator.evaluate("comp.duration", context)).toBe(10)
      })

      it("evaluates complex expressions", () => {
        const context = createMockContext({ time: 2 })
        const result = evaluator.evaluate("value + sin(time * 2 * Math.PI) * 50", context)

        expect(typeof result).toBe("number")
      })
    })

    describe("validateExpression", () => {
      it("validates correct expression", () => {
        const result = evaluator.validateExpression("value * 2")

        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      })

      it("detects invalid expression", () => {
        const result = evaluator.validateExpression("invalid syntax {{")

        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })

      it("validates expression with functions", () => {
        const result = evaluator.validateExpression("sin(time) + cos(time)")

        expect(result.valid).toBe(true)
      })
    })

    describe("getSuggestions", () => {
      it("returns function suggestions", () => {
        const suggestions = evaluator.getSuggestions("si")

        expect(suggestions).toContain("sin")
      })

      it("returns pattern suggestions", () => {
        const suggestions = evaluator.getSuggestions("time")

        expect(suggestions.some((s) => s.includes("time"))).toBe(true)
      })

      it("limits suggestions to 10", () => {
        const suggestions = evaluator.getSuggestions("")

        expect(suggestions.length).toBeLessThanOrEqual(10)
      })

      it("is case insensitive", () => {
        const suggestions = evaluator.getSuggestions("SIN")

        expect(suggestions).toContain("sin")
      })
    })
  })

  describe("expressionPresets", () => {
    it("has wiggle preset", () => {
      expect(expressionPresets.wiggle).toBeDefined()
      expect(expressionPresets.wiggle.name).toBe("Wiggle")
      expect(expressionPresets.wiggle.expression).toBeDefined()
    })

    it("has bounce preset", () => {
      expect(expressionPresets.bounce).toBeDefined()
      expect(expressionPresets.bounce.name).toBe("Bounce")
      expect(expressionPresets.bounce.expression).toBeDefined()
    })

    it("has sine wave preset", () => {
      expect(expressionPresets.sine).toBeDefined()
      expect(expressionPresets.sine.name).toBe("Sine Wave")
      expect(expressionPresets.sine.expression).toBeDefined()
    })

    it("has pulse preset", () => {
      expect(expressionPresets.pulse).toBeDefined()
      expect(expressionPresets.pulse.name).toBe("Pulse")
    })

    it("has fade in preset", () => {
      expect(expressionPresets.fadeIn).toBeDefined()
      expect(expressionPresets.fadeIn.name).toBe("Fade In")
    })

    it("has typewriter preset", () => {
      expect(expressionPresets.typewriter).toBeDefined()
      expect(expressionPresets.typewriter.name).toBe("Typewriter")
    })

    it("has follow mouse preset", () => {
      expect(expressionPresets.followMouse).toBeDefined()
      expect(expressionPresets.followMouse.name).toBe("Follow Mouse")
    })

    it("has pendulum preset", () => {
      expect(expressionPresets.pendulum).toBeDefined()
      expect(expressionPresets.pendulum.name).toBe("Pendulum")
    })

    it("all presets have required properties", () => {
      Object.values(expressionPresets).forEach((preset) => {
        expect(preset.name).toBeDefined()
        expect(preset.expression).toBeDefined()
        expect(preset.description).toBeDefined()
      })
    })
  })

  describe("Expression evaluation with context", () => {
    const evaluator = new ExpressionEvaluator()

    it("evaluates wiggle expression", () => {
      const context = createMockContext({ time: 1, value: 50 })
      const result = evaluator.evaluate(expressionPresets.wiggle.expression, context)

      expect(typeof result).toBe("number")
    })

    it("evaluates sine wave expression", () => {
      const context = createMockContext({ time: 1, value: 50 })
      const result = evaluator.evaluate(expressionPresets.sine.expression, context)

      expect(typeof result).toBe("number")
    })

    it("evaluates pulse expression", () => {
      const context = createMockContext({ time: 1, value: 100 })
      const result = evaluator.evaluate(expressionPresets.pulse.expression, context)

      expect(typeof result).toBe("number")
    })

    it("evaluates fade in expression", () => {
      const context = createMockContext({ time: 0.5, value: 100 })
      const result = evaluator.evaluate(expressionPresets.fadeIn.expression, context)

      expect(typeof result).toBe("number")
      expect(result as number).toBeGreaterThanOrEqual(0)
    })

    it("evaluates typewriter expression", () => {
      const context = createMockContext({ time: 1.5 })
      const result = evaluator.evaluate(expressionPresets.typewriter.expression, context)

      expect(typeof result).toBe("number")
      expect(result).toBe(15) // floor(1.5 * 10)
    })

    it("evaluates pendulum expression", () => {
      const context = createMockContext({ time: 1 })
      const result = evaluator.evaluate(expressionPresets.pendulum.expression, context)

      expect(typeof result).toBe("number")
    })
  })
})
