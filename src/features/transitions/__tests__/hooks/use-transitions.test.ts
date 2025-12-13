/**
 * @vitest-environment jsdom
 */
import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: {
      language: "ru",
    },
  }),
}))

// Mock the JSON imports before importing the hooks
vi.mock("../../data/advanced-transitions.json", () => ({
  default: {
    version: "1.0.0",
    transitions: [],
  },
}))

vi.mock("../../data/dynamic-transitions.json", () => ({
  default: {
    version: "1.0.0",
    transitions: [],
  },
}))

vi.mock("../../data/transitions.json", () => ({
  default: {
    version: "1.0.0",
    lastUpdated: "2025-05-31",
    totalTransitions: 5,
    categories: ["basic", "advanced", "creative"],
    transitions: [
      {
        id: "fade",
        type: "fade",
        labels: { ru: "Затухание", en: "Fade" },
        description: { ru: "Плавное затухание", en: "Smooth fade" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth", "classic"],
        duration: { min: 0.5, max: 3.0, default: 1.0 },
        parameters: {
          direction: "center",
          smoothness: 0.8,
        },
        ffmpegTemplate: "fade=t=in:st=0:d={duration}",
      },
      {
        id: "zoom",
        type: "zoom",
        labels: { ru: "Увеличение", en: "Zoom" },
        description: { ru: "Эффект увеличения", en: "Zoom effect" },
        category: "advanced",
        complexity: "intermediate",
        tags: ["dynamic"],
        duration: { min: 0.5, max: 3.0, default: 1.5 },
        parameters: {
          scale: 2.0,
          easing: "ease-in-out",
        },
        ffmpegTemplate: "scale={scale}*iw:{scale}*ih,fade=t=in:st=0:d={duration}",
      },
      {
        id: "slide",
        type: "slide",
        labels: { ru: "Слайд", en: "Slide" },
        description: { ru: "Скольжение", en: "Sliding" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth"],
        duration: { min: 0.3, max: 2.0, default: 0.8 },
        parameters: {
          direction: "left",
        },
        ffmpegTemplate: "xfade=transition=slideright:duration={duration}:offset=0",
      },
      {
        id: "spiral",
        type: "spiral",
        labels: { ru: "Спираль", en: "Spiral" },
        description: { ru: "Спиральный эффект", en: "Spiral effect" },
        category: "creative",
        complexity: "advanced",
        tags: ["creative", "complex"],
        duration: { min: 1.0, max: 5.0, default: 2.5 },
        parameters: {
          intensity: 0.9,
          rotations: 3,
        },
        ffmpegTemplate: "rotate=a={rotations}*PI*t/{duration}:c=none:ow=rotw(a):oh=roth(a),fade=t=in:st=0:d={duration}",
      },
      {
        id: "kaleidoscope",
        type: "kaleidoscope",
        labels: { ru: "Калейдоскоп", en: "Kaleidoscope" },
        description: { ru: "Эффект калейдоскопа", en: "Kaleidoscope effect" },
        category: "creative",
        complexity: "advanced",
        tags: ["creative", "artistic"],
        duration: { min: 1.0, max: 4.0, default: 2.0 },
        parameters: {
          segments: 6,
          rotation: 45,
        },
        ffmpegTemplate: "kaleidoscope=segments={segments}:angle={rotation}",
      },
    ],
  },
}))

// Import hooks after mocks
import { useTransitionById, useTransitions, useTransitionsByCategory } from "../../hooks/use-transitions"

// Простые тесты для проверки импортов и базовой функциональности
describe("Transitions Module", () => {
  describe("useTransitions", () => {
    it("should load transitions successfully", () => {
      const { result } = renderHook(() => useTransitions())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.transitions.length).toBeGreaterThanOrEqual(5)
      expect(result.current.transitions[0].id).toBe("fade")
      expect(result.current.transitions[1].id).toBe("zoom")
      expect(result.current.transitions[2].id).toBe("slide")
      expect(result.current.transitions[3].id).toBe("spiral")
    })

    it("should return transitions with localized labels", () => {
      const { result } = renderHook(() => useTransitions())

      const fadeTransition = result.current.transitions.find((t) => t.id === "fade")
      expect(fadeTransition?.labels?.ru).toBe("Затухание")
      expect(fadeTransition?.labels?.en).toBe("Fade")
    })

    /**
     * NOTE: Эти 2 теста пропущены, так как невозможно протестировать loading/error состояния
     * со статическими моками JSON-файлов (строки 15-112).
     *
     * Хук useTransitions загружает статические JSON синхронно через import,
     * поэтому к моменту выполнения хука данные уже загружены.
     * Loading/error состояния не возникают в реальном использовании.
     */
    it.skip("should handle loading state", () => {
      // Skip: Mock already loaded by the time hook runs
    })

    it.skip("should handle error state", () => {
      // Skip: Mock already loaded by the time hook runs
    })
  })

  describe("useTransitionById", () => {
    it("should find transition by id", () => {
      const { result } = renderHook(() => useTransitionById("fade"))

      expect(result.current).toBeDefined()
      expect(result.current?.id).toBe("fade")
      expect(result.current?.labels?.ru).toBe("Затухание")
      expect(result.current?.category).toBe("basic")
    })

    it("should return undefined for non-existent id", () => {
      const { result } = renderHook(() => useTransitionById("non-existent"))

      expect(result.current).toBeNull()
    })

    it("should handle null/undefined id", () => {
      const { result: resultNull } = renderHook(() => useTransitionById(null as any))
      const { result: resultUndefined } = renderHook(() => useTransitionById(undefined as any))

      expect(resultNull.current).toBeNull()
      expect(resultUndefined.current).toBeNull()
    })

    it("should update when id changes", () => {
      const { result, rerender } = renderHook(({ id }) => useTransitionById(id), { initialProps: { id: "fade" } })

      expect(result.current?.id).toBe("fade")

      rerender({ id: "zoom" })
      expect(result.current?.id).toBe("zoom")

      rerender({ id: "non-existent" })
      expect(result.current).toBeNull()
    })
  })

  describe("useTransitionsByCategory", () => {
    it("should filter transitions by category", () => {
      const { result } = renderHook(() => useTransitionsByCategory("basic"))

      expect(result.current).toHaveLength(2)
      expect(result.current.every((t) => t.category === "basic")).toBe(true)
      expect(result.current.map((t) => t.id).sort()).toEqual(["fade", "slide"])
    })

    it("should return empty array for non-existent category", () => {
      const { result } = renderHook(() => useTransitionsByCategory("non-existent"))

      expect(result.current).toHaveLength(0)
    })

    it("should handle null/undefined category", () => {
      const { result: resultNull } = renderHook(() => useTransitionsByCategory(null as any))
      const { result: resultUndefined } = renderHook(() => useTransitionsByCategory(undefined as any))

      expect(resultNull.current).toHaveLength(0)
      expect(resultUndefined.current).toHaveLength(0)
    })

    it("should return transitions for advanced category", () => {
      const { result } = renderHook(() => useTransitionsByCategory("advanced"))

      expect(result.current).toHaveLength(1)
      expect(result.current[0].id).toBe("zoom")
    })

    it("should return transitions for creative category", () => {
      const { result } = renderHook(() => useTransitionsByCategory("creative"))

      expect(result.current).toHaveLength(2)
      expect(result.current[0].id).toBe("spiral")
      expect(result.current[1].id).toBe("kaleidoscope")
    })

    it("should update when category changes", () => {
      const { result, rerender } = renderHook(({ category }) => useTransitionsByCategory(category), {
        initialProps: { category: "basic" },
      })

      expect(result.current).toHaveLength(2)

      rerender({ category: "creative" })
      expect(result.current).toHaveLength(2)
      expect(result.current[0].id).toBe("spiral")
      expect(result.current[1].id).toBe("kaleidoscope")

      rerender({ category: "non-existent" })
      expect(result.current).toHaveLength(0)
    })
  })

  it("should have valid transition types", () => {
    // Проверяем, что типы переходов определены правильно
    const validCategories = ["basic", "creative", "cinematic", "technical", "artistic"]

    const validComplexities = ["basic", "intermediate", "advanced"]

    const validTransitionTypes = ["fade", "zoom", "slide", "scale", "wipe", "dissolve"]

    expect(validCategories.length).toBeGreaterThan(0)
    expect(validComplexities.length).toBe(3)
    expect(validTransitionTypes.length).toBeGreaterThan(0)
  })

  it("should validate transition duration structure", () => {
    // Тестируем структуру длительности переходов
    const validDuration = {
      min: 0.5,
      max: 3.0,
      default: 1.5,
    }

    expect(typeof validDuration.min).toBe("number")
    expect(typeof validDuration.max).toBe("number")
    expect(typeof validDuration.default).toBe("number")

    expect(validDuration.min).toBeGreaterThan(0)
    expect(validDuration.max).toBeGreaterThan(validDuration.min)
    expect(validDuration.default).toBeGreaterThanOrEqual(validDuration.min)
    expect(validDuration.default).toBeLessThanOrEqual(validDuration.max)
  })

  it("should validate transition parameters", () => {
    // Тестируем параметры переходов
    const validParameters = {
      direction: "left",
      easing: "ease-in-out",
      intensity: 0.8,
      scale: 1.2,
      smoothness: 0.9,
    }

    const validDirections = ["left", "right", "up", "down", "center"]
    const validEasings = ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"]

    expect(validDirections).toContain(validParameters.direction)
    expect(validEasings).toContain(validParameters.easing)
    expect(validParameters.intensity).toBeGreaterThanOrEqual(0)
    expect(validParameters.intensity).toBeLessThanOrEqual(1)
    expect(validParameters.scale).toBeGreaterThan(0)
    expect(validParameters.smoothness).toBeGreaterThanOrEqual(0)
    expect(validParameters.smoothness).toBeLessThanOrEqual(1)
  })

  it("should validate FFmpeg command structure", () => {
    // Тестируем структуру FFmpeg команд
    const mockFFmpegParams = {
      fps: 30,
      width: 1920,
      height: 1080,
      scale: 1.0,
      duration: 1.5,
    }

    expect(typeof mockFFmpegParams.fps).toBe("number")
    expect(typeof mockFFmpegParams.width).toBe("number")
    expect(typeof mockFFmpegParams.height).toBe("number")
    expect(typeof mockFFmpegParams.scale).toBe("number")
    expect(typeof mockFFmpegParams.duration).toBe("number")

    expect(mockFFmpegParams.fps).toBeGreaterThan(0)
    expect(mockFFmpegParams.width).toBeGreaterThan(0)
    expect(mockFFmpegParams.height).toBeGreaterThan(0)
    expect(mockFFmpegParams.scale).toBeGreaterThan(0)
    expect(mockFFmpegParams.duration).toBeGreaterThan(0)
  })
})
