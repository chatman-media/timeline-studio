import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VectorscopeScope } from "../../components/scopes/vectorscope-scope"

describe("VectorscopeScope", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1)
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render canvas element", () => {
    const { container } = render(<VectorscopeScope width={320} height={240} refreshRate={30} />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("should set canvas dimensions", () => {
    const { container } = render(<VectorscopeScope width={640} height={480} refreshRate={30} />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })

  it("should update dimensions when props change", () => {
    const { container, rerender } = render(<VectorscopeScope width={320} height={240} refreshRate={30} />)

    rerender(<VectorscopeScope width={640} height={480} refreshRate={30} />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })
})
