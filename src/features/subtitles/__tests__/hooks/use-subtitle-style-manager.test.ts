import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useSubtitleStyleManager, useSubtitleStyles } from "../../hooks/use-subtitle-style-manager"

// Mock subtitles data
const mockSubtitles = [
  {
    id: "basic-white",
    name: "Basic White",
    category: "basic",
    complexity: "basic",
    tags: ["simple"],
    description: { ru: "Описание", en: "Description" },
    labels: { ru: "Белый", en: "White" },
    style: {
      fontFamily: "Arial",
      fontSize: 24,
      color: "#ffffff",
    },
  },
  {
    id: "basic-yellow",
    name: "Basic Yellow",
    category: "basic",
    complexity: "basic",
    tags: ["simple"],
    description: { ru: "Описание", en: "Description" },
    labels: { ru: "Желтый", en: "Yellow" },
    style: {
      fontFamily: "Arial",
      fontSize: 24,
      color: "#ffff00",
    },
  },
]

// Mock the useSubtitles hook
vi.mock("../../hooks/use-subtitle-styles", () => ({
  useSubtitles: () => ({
    subtitles: mockSubtitles,
    loading: false,
    error: null,
    isReady: true,
    reload: vi.fn(),
  }),
  useSubtitleById: vi.fn(),
  useSubtitlesByCategory: vi.fn(),
  useSubtitlesSearch: vi.fn(),
}))

describe("useSubtitleStyleManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return subtitle styles", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    expect(result.current.subtitleStyles).toEqual(mockSubtitles)
    expect(result.current.subtitleStyles.length).toBe(2)
  })

  it("should get style by id", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const style = result.current.getStyleById("basic-white")

    expect(style).toBeDefined()
    expect(style?.id).toBe("basic-white")
    expect(style?.name).toBe("Basic White")
  })

  it("should return undefined for non-existent style id", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const style = result.current.getStyleById("non-existent")

    expect(style).toBeUndefined()
  })

  it("should get default style", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const defaultStyle = result.current.getDefaultStyle()

    expect(defaultStyle).toBeDefined()
    expect(defaultStyle?.id).toBe("basic-white")
  })

  it("should get computed style with overrides", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const computed = result.current.getComputedStyle("basic-white", { fontSize: 32 })

    expect(computed).toBeDefined()
    expect(computed.fontSize).toBe(32)
    expect(computed.color).toBe("#ffffff")
  })

  it("should return default style for non-existent style in getComputedStyle", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const computed = result.current.getComputedStyle("non-existent")

    // When style ID doesn't exist, returns default computed style
    expect(computed).toBeDefined()
    expect(computed.fontFamily).toBeDefined()
    expect(computed.fontSize).toBeGreaterThan(0)
  })

  it("should merge overrides in getComputedStyle", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const computed = result.current.getComputedStyle("basic-white", {
      fontSize: 32,
      fontWeight: "bold",
    })

    expect(computed.fontSize).toBe(32)
    expect(computed.fontWeight).toBe("bold")
    expect(computed.color).toBe("#ffffff") // Original value preserved
    expect(computed.fontFamily).toBe("Arial") // Original value preserved
  })

  it("should provide getBuiltInStyles method", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const builtInStyles = result.current.getBuiltInStyles()

    expect(builtInStyles).toBeDefined()
    expect(builtInStyles.length).toBeGreaterThan(0)
  })

  it("should provide getCustomStyles method", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const customStyles = result.current.getCustomStyles()

    // Currently returns empty array as there are no custom styles
    expect(customStyles).toBeDefined()
    expect(customStyles).toEqual([])
  })

  it("should provide getStyleByName method", () => {
    const { result } = renderHook(() => useSubtitleStyleManager())

    const style = result.current.getStyleByName("Basic White")

    expect(style).toBeDefined()
    expect(style?.id).toBe("basic-white")
  })
})

describe("useSubtitleStyles (alias)", () => {
  it("should be the same as useSubtitleStyleManager", () => {
    const { result: result1 } = renderHook(() => useSubtitleStyleManager())
    const { result: result2 } = renderHook(() => useSubtitleStyles())

    expect(result1.current.subtitleStyles).toEqual(result2.current.subtitleStyles)
    expect(result1.current.getStyleById("basic-white")).toEqual(result2.current.getStyleById("basic-white"))
  })
})
