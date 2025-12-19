/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { TimelineClip } from "@/features/timeline/types"
import { JLCutIndicator } from "../jl-cut-indicator"

// Mock getCutType утилиту
vi.mock("../../../types/jl-cuts", () => ({
  getCutType: vi.fn((audioOffset: number) => {
    if (audioOffset > 0) return "j-cut"
    if (audioOffset < 0) return "l-cut"
    return "straight-cut"
  }),
}))

// Создаем mock клипы
const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  mediaId: "media-1",
  trackId: "track-1",
  startTime: 0,
  duration: 10,
  offset: 0,
  mediaFile: {
    id: "media-1",
    name: "test.mp4",
    path: "/test.mp4",
    type: "video" as any,
    duration: 10,
    size: 1000,
    createdAt: new Date(),
  },
  mediaStartTime: 0,
  mediaEndTime: 10,
  volume: 1,
  speed: 1,
  isReversed: false,
  opacity: 1,
  effects: [],
  filters: [],
  transitions: [],
  isSelected: false,
  isLocked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe("JLCutIndicator", () => {
  const defaultProps = {
    videoClip: createMockClip(),
    audioClip: createMockClip({ audioOffset: 0 }),
    pixelsPerSecond: 100,
  }

  it("should not render when audioOffset is 0", () => {
    const { container } = render(<JLCutIndicator {...defaultProps} data-oid=":7y.jo4" />)

    expect(container.firstChild).toBeNull()
  })

  it("should not render when audioOffset is undefined", () => {
    const props = {
      ...defaultProps,
      audioClip: createMockClip({ audioOffset: undefined }),
    }

    const { container } = render(<JLCutIndicator {...props} data-oid="syeiq5e" />)

    expect(container.firstChild).toBeNull()
  })

  describe("J-Cut rendering (positive audioOffset)", () => {
    const jCutProps = {
      ...defaultProps,
      audioClip: createMockClip({ audioOffset: 2 }), // 2 секунды J-Cut
    }

    it("should render J-Cut indicator", () => {
      render(<JLCutIndicator {...jCutProps} data-oid="1xd:z:b" />)

      const indicator = screen.getByText("J")
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass("bg-blue-500/20 text-blue-500")
    })

    it("should calculate correct width for J-Cut", () => {
      const { container } = render(<JLCutIndicator {...jCutProps} data-oid=".4im-xn" />)

      const indicatorDiv = container.firstChild as HTMLElement
      expect(indicatorDiv).toHaveStyle({ width: "200px" }) // 2 * 100 pixels
    })

    it("should position J-Cut on the right side", () => {
      const { container } = render(<JLCutIndicator {...jCutProps} data-oid="netb2qe" />)

      const indicatorDiv = container.firstChild as HTMLElement
      expect(indicatorDiv).toHaveStyle({
        right: "100%",
        borderRight: "2px dashed rgba(59, 130, 246, 0.5)",
      })
    })

    it("should position J label on the right", () => {
      render(<JLCutIndicator {...jCutProps} data-oid="lwrkpw4" />)

      const jLabel = screen.getByText("J")
      expect(jLabel).toHaveClass("right-1")
    })

    it("should render SVG with blue diagonal pattern for J-Cut", () => {
      const { container } = render(<JLCutIndicator {...jCutProps} data-oid="1.m4vmk" />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()

      const pattern = container.querySelector('pattern[id="diagonal-j-cut"]')
      expect(pattern).toBeInTheDocument()

      const patternPath = pattern?.querySelector("path")
      expect(patternPath).toHaveAttribute("stroke", "rgba(59, 130, 246, 0.3)")
    })
  })

  describe("L-Cut rendering (negative audioOffset)", () => {
    const lCutProps = {
      ...defaultProps,
      audioClip: createMockClip({ audioOffset: -1.5 }), // 1.5 секунды L-Cut
    }

    it("should render L-Cut indicator", () => {
      render(<JLCutIndicator {...lCutProps} data-oid="mv6bx-2" />)

      const indicator = screen.getByText("L")
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass("bg-red-500/20 text-red-500")
    })

    it("should calculate correct width for L-Cut", () => {
      const { container } = render(<JLCutIndicator {...lCutProps} data-oid="amwnute" />)

      const indicatorDiv = container.firstChild as HTMLElement
      expect(indicatorDiv).toHaveStyle({ width: "150px" }) // Math.abs(-1.5) * 100 pixels
    })

    it("should position L-Cut on the left side", () => {
      const { container } = render(<JLCutIndicator {...lCutProps} data-oid="09novh." />)

      const indicatorDiv = container.firstChild as HTMLElement
      expect(indicatorDiv).toHaveStyle({
        left: "100%",
        borderLeft: "2px dashed rgba(239, 68, 68, 0.5)",
      })
    })

    it("should position L label on the left", () => {
      render(<JLCutIndicator {...lCutProps} data-oid="mop7he:" />)

      const lLabel = screen.getByText("L")
      expect(lLabel).toHaveClass("left-1")
    })

    it("should render SVG with red diagonal pattern for L-Cut", () => {
      const { container } = render(<JLCutIndicator {...lCutProps} data-oid=".86l1.x" />)

      const svg = container.querySelector("svg")
      expect(svg).toBeInTheDocument()

      const pattern = container.querySelector('pattern[id="diagonal-l-cut"]')
      expect(pattern).toBeInTheDocument()

      const patternPath = pattern?.querySelector("path")
      expect(patternPath).toHaveAttribute("stroke", "rgba(239, 68, 68, 0.3)")
    })

    it("should position SVG rect correctly for L-Cut", () => {
      const { container } = render(<JLCutIndicator {...lCutProps} data-oid="5.p_g3q" />)

      const rect = container.querySelector("rect")
      expect(rect).toHaveAttribute("x", "-150") // offsetPixels = -150
      expect(rect).toHaveAttribute("width", "150")
    })
  })

  describe("Different pixelsPerSecond values", () => {
    it("should scale width with different pixelsPerSecond", () => {
      const props = {
        ...defaultProps,
        audioClip: createMockClip({ audioOffset: 1 }),
        pixelsPerSecond: 50, // Вдвое меньше масштаб
      }

      const { container } = render(<JLCutIndicator {...props} data-oid="wmf8s86" />)

      const indicatorDiv = container.firstChild as HTMLElement
      expect(indicatorDiv).toHaveStyle({ width: "50px" }) // 1 * 50 pixels
    })

    it("should handle high pixelsPerSecond values", () => {
      const props = {
        ...defaultProps,
        audioClip: createMockClip({ audioOffset: 0.5 }),
        pixelsPerSecond: 200,
      }

      const { container } = render(<JLCutIndicator {...props} data-oid="h66nwrv" />)

      const indicatorDiv = container.firstChild as HTMLElement
      expect(indicatorDiv).toHaveStyle({ width: "100px" }) // 0.5 * 200 pixels
    })
  })

  it("should apply custom className", () => {
    const customClass = "custom-indicator-class"
    const props = {
      ...defaultProps,
      audioClip: createMockClip({ audioOffset: 1 }),
      className: customClass,
    }

    const { container } = render(<JLCutIndicator {...props} data-oid="i6o-cr6" />)

    const indicatorDiv = container.firstChild as HTMLElement
    expect(indicatorDiv).toHaveClass(customClass)
  })

  it("should have proper base classes", () => {
    const props = {
      ...defaultProps,
      audioClip: createMockClip({ audioOffset: 1 }),
    }

    const { container } = render(<JLCutIndicator {...props} data-oid="m-04gmv" />)

    const indicatorDiv = container.firstChild as HTMLElement
    expect(indicatorDiv).toHaveClass("absolute top-0 h-full pointer-events-none")
  })

  it("should render SVG with proper overflow style", () => {
    const props = {
      ...defaultProps,
      audioClip: createMockClip({ audioOffset: 1 }),
    }

    const { container } = render(<JLCutIndicator {...props} data-oid="g.0_6tj" />)

    const svg = container.querySelector("svg")
    expect(svg).toHaveClass("absolute inset-0 w-full h-full")
    expect(svg).toHaveStyle({ overflow: "visible" })
  })
})
