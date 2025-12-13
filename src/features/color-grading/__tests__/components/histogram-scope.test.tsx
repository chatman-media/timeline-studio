/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { HistogramScope } from "../../components/scopes/histogram-scope"

describe("HistogramScope", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1)
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render canvas element", () => {
    const { container } = render(<HistogramScope width={320} height={240} refreshRate={30} />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("should set canvas dimensions", () => {
    const { container } = render(<HistogramScope width={640} height={480} refreshRate={30} />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })

  it("should update dimensions when props change", () => {
    const { container, rerender } = render(<HistogramScope width={320} height={240} refreshRate={30} />)

    rerender(<HistogramScope width={640} height={480} refreshRate={30} />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })
})
