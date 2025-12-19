/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { WaveformScope } from "../../components/scopes/waveform-scope"

describe("WaveformScope", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1)
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should render canvas element", () => {
    const { container } = render(<WaveformScope width={320} height={240} refreshRate={30} data-oid="5p8-sw." />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
  })

  it("should set canvas dimensions", () => {
    const { container } = render(<WaveformScope width={640} height={480} refreshRate={30} data-oid="-hnxe.q" />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })

  it("should update dimensions when props change", () => {
    const { container, rerender } = render(
      <WaveformScope width={320} height={240} refreshRate={30} data-oid="scjeog0" />,
    )

    rerender(<WaveformScope width={640} height={480} refreshRate={30} data-oid="6hi5vmq" />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })
})
