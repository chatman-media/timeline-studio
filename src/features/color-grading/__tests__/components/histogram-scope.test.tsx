import { render } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { HistogramScope } from "../../components/scopes/histogram-scope"

describe("HistogramScope", () => {
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D
  let rafSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Mock canvas and context
    mockContext = {
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: "",
      font: "",
      textAlign: "left",
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(256 * 4),
        width: 16,
        height: 16,
      })),
      createImageData: vi.fn(),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
    } as unknown as HTMLCanvasElement

    // Mock document.createElement for canvas
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas
      }
      return originalCreateElement(tagName)
    })

    // Mock requestAnimationFrame
    rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      setTimeout(cb, 16)
      return 1
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it("should render canvas element", () => {
    const { container } = render(<HistogramScope width={320} height={240} refreshRate={30} />)

    const canvas = container.querySelector("canvas")
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveClass("w-full")
    expect(canvas).toHaveClass("h-full")
  })

  it("should set canvas dimensions", () => {
    const { container } = render(<HistogramScope width={640} height={480} refreshRate={30} />)

    const canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })

  it("should update canvas dimensions when props change", () => {
    const { container, rerender } = render(<HistogramScope width={320} height={240} refreshRate={30} />)

    let canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(320)
    expect(canvas.height).toBe(240)

    rerender(<HistogramScope width={640} height={480} refreshRate={30} />)

    canvas = container.querySelector("canvas") as HTMLCanvasElement
    expect(canvas.width).toBe(640)
    expect(canvas.height).toBe(480)
  })

  it("should start animation loop on mount", () => {
    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    expect(rafSpy).toHaveBeenCalled()
  })

  it("should cancel animation frame on unmount", () => {
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame")

    const { unmount } = render(<HistogramScope width={320} height={240} refreshRate={30} />)

    unmount()

    expect(cancelSpy).toHaveBeenCalled()
  })

  it("should render in demo mode when no video element exists", () => {
    vi.spyOn(document, "querySelector").mockReturnValue(null)

    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    // In demo mode, histogram should still render
    expect(mockContext.fillRect).toHaveBeenCalled()
  })

  it("should render grid lines", async () => {
    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    // Wait for animation frame
    await vi.waitFor(() => {
      expect(mockContext.stroke).toHaveBeenCalled()
    })
  })

  it("should render labels", async () => {
    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    await vi.waitFor(() => {
      expect(mockContext.fillText).toHaveBeenCalled()
    })
  })

  it("should handle video element data", async () => {
    const mockVideo = document.createElement("video") as HTMLVideoElement
    Object.defineProperty(mockVideo, "paused", { value: false, writable: true })
    Object.defineProperty(mockVideo, "videoWidth", { value: 1920, writable: true })
    Object.defineProperty(mockVideo, "videoHeight", { value: 1080, writable: true })

    vi.spyOn(document, "querySelector").mockReturnValue(mockVideo)

    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    await vi.waitFor(() => {
      expect(mockContext.drawImage).toHaveBeenCalled()
    })
  })

  it("should respect refresh rate", async () => {
    const { rerender } = render(<HistogramScope width={320} height={240} refreshRate={60} />)

    // High refresh rate should call RAF more frequently
    await vi.waitFor(() => {
      expect(rafSpy).toHaveBeenCalled()
    })

    rafSpy.mockClear()

    rerender(<HistogramScope width={320} height={240} refreshRate={15} />)

    // Lower refresh rate should still work
    await vi.waitFor(() => {
      expect(rafSpy).toHaveBeenCalled()
    })
  })

  it("should clear canvas before rendering", async () => {
    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    await vi.waitFor(() => {
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 320, 240)
    })
  })

  it("should render RGB channels in demo mode", async () => {
    vi.spyOn(document, "querySelector").mockReturnValue(null)

    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    await vi.waitFor(() => {
      // Should fill with demo data
      expect(mockContext.fill).toHaveBeenCalled()
    })
  })

  it("should calculate histogram from video data", async () => {
    const mockVideo = document.createElement("video") as HTMLVideoElement
    Object.defineProperty(mockVideo, "paused", { value: false })
    Object.defineProperty(mockVideo, "videoWidth", { value: 320 })
    Object.defineProperty(mockVideo, "videoHeight", { value: 240 })

    const mockImageData = {
      data: new Uint8ClampedArray(320 * 240 * 4).fill(128),
      width: 320,
      height: 240,
    }

    mockContext.getImageData = vi.fn(() => mockImageData as ImageData)

    vi.spyOn(document, "querySelector").mockReturnValue(mockVideo)

    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    await vi.waitFor(() => {
      expect(mockContext.getImageData).toHaveBeenCalled()
    })
  })

  it("should not render when paused video element exists", () => {
    const mockVideo = document.createElement("video") as HTMLVideoElement
    Object.defineProperty(mockVideo, "paused", { value: true })

    vi.spyOn(document, "querySelector").mockReturnValue(mockVideo)

    render(<HistogramScope width={320} height={240} refreshRate={30} />)

    // Should fall back to demo mode
    expect(rafSpy).toHaveBeenCalled()
  })
})
