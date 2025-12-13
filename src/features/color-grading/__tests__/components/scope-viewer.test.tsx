/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ScopeViewer } from "../../components/scopes/scope-viewer"

// Mock the scope components
vi.mock("../../components/scopes/histogram-scope", () => ({
  HistogramScope: ({ width, height, refreshRate }: { width: number; height: number; refreshRate: number }) => (
    <div data-testid="histogram-scope" data-width={width} data-height={height} data-refresh-rate={refreshRate}>
      Histogram
    </div>
  ),
}))

vi.mock("../../components/scopes/vectorscope-scope", () => ({
  VectorscopeScope: ({ width, height, refreshRate }: { width: number; height: number; refreshRate: number }) => (
    <div data-testid="vectorscope-scope" data-width={width} data-height={height} data-refresh-rate={refreshRate}>
      Vectorscope
    </div>
  ),
}))

vi.mock("../../components/scopes/waveform-scope", () => ({
  WaveformScope: ({ width, height, refreshRate }: { width: number; height: number; refreshRate: number }) => (
    <div data-testid="waveform-scope" data-width={width} data-height={height} data-refresh-rate={refreshRate}>
      Waveform
    </div>
  ),
}))

describe("ScopeViewer", () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = class ResizeObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }
  })

  describe("Rendering different scope types", () => {
    it("should render waveform scope", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} />)

      expect(screen.getByTestId("waveform-scope")).toBeInTheDocument()
      expect(screen.queryByTestId("vectorscope-scope")).not.toBeInTheDocument()
      expect(screen.queryByTestId("histogram-scope")).not.toBeInTheDocument()
    })

    it("should render vectorscope scope", () => {
      render(<ScopeViewer type="vectorscope" refreshRate={30} />)

      expect(screen.getByTestId("vectorscope-scope")).toBeInTheDocument()
      expect(screen.queryByTestId("waveform-scope")).not.toBeInTheDocument()
      expect(screen.queryByTestId("histogram-scope")).not.toBeInTheDocument()
    })

    it("should render histogram scope", () => {
      render(<ScopeViewer type="histogram" refreshRate={30} />)

      expect(screen.getByTestId("histogram-scope")).toBeInTheDocument()
      expect(screen.queryByTestId("waveform-scope")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vectorscope-scope")).not.toBeInTheDocument()
    })
  })

  describe("Dimensions handling", () => {
    it("should pass dimensions to scope components", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} />)

      const scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-width")).toBeTruthy()
      expect(scope.getAttribute("data-height")).toBeTruthy()
    })

    it("should use minimum width of 320", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} />)

      const scope = screen.getByTestId("waveform-scope")
      const width = Number(scope.getAttribute("data-width"))
      expect(width).toBeGreaterThanOrEqual(320)
    })

    it("should use different height for fullscreen mode", () => {
      const { rerender } = render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={false} />)

      let scope = screen.getByTestId("waveform-scope")
      const normalHeight = Number(scope.getAttribute("data-height"))

      rerender(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} />)

      scope = screen.getByTestId("waveform-scope")
      const fullscreenHeight = Number(scope.getAttribute("data-height"))

      // Fullscreen should use minimum 480 - 60 = 420
      expect(fullscreenHeight).toBeGreaterThanOrEqual(normalHeight)
    })
  })

  describe("Fullscreen mode", () => {
    it("should render close button in fullscreen mode", () => {
      const onClose = vi.fn()
      render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} onClose={onClose} />)

      const closeButton = screen.getByRole("button")
      expect(closeButton).toBeInTheDocument()
    })

    it("should not render close button in normal mode", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={false} />)

      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} onClose={onClose} />)

      const closeButton = screen.getByRole("button")
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledOnce()
    })

    it("should add padding in fullscreen mode", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} />)

      const paddedDiv = container.querySelector(".p-8")
      expect(paddedDiv).toBeInTheDocument()
    })

    it("should not add padding in normal mode", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={false} />)

      const paddedDiv = container.querySelector(".p-8")
      expect(paddedDiv).not.toBeInTheDocument()
    })

    it("should have full width and height classes in fullscreen mode", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("w-full")
      expect(containerDiv).toHaveClass("h-full")
    })
  })

  describe("Refresh rate", () => {
    it("should pass refresh rate to scope components", () => {
      render(<ScopeViewer type="waveform" refreshRate={60} />)

      const scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-refresh-rate")).toBe("60")
    })

    it("should update refresh rate when changed", () => {
      const { rerender } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      let scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-refresh-rate")).toBe("30")

      rerender(<ScopeViewer type="waveform" refreshRate={15} />)

      scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-refresh-rate")).toBe("15")
    })
  })

  describe("ResizeObserver integration", () => {
    it("should observe container element", () => {
      const observeSpy = vi.fn()
      global.ResizeObserver = class ResizeObserver {
        observe = observeSpy
        unobserve = vi.fn()
        disconnect = vi.fn()
      }

      render(<ScopeViewer type="waveform" refreshRate={30} />)

      expect(observeSpy).toHaveBeenCalled()
    })

    it("should disconnect observer on unmount", () => {
      const disconnectSpy = vi.fn()
      global.ResizeObserver = class ResizeObserver {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = disconnectSpy
      }

      const { unmount } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe("Container styling", () => {
    it("should have black background", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("bg-black")
    })

    it("should have rounded corners", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("rounded-lg")
    })

    it("should have overflow hidden", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("overflow-hidden")
    })

    it("should be positioned relatively", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("relative")
    })
  })

  describe("Type switching", () => {
    it("should switch between scope types", () => {
      const { rerender } = render(<ScopeViewer type="waveform" refreshRate={30} />)

      expect(screen.getByTestId("waveform-scope")).toBeInTheDocument()

      rerender(<ScopeViewer type="vectorscope" refreshRate={30} />)

      expect(screen.queryByTestId("waveform-scope")).not.toBeInTheDocument()
      expect(screen.getByTestId("vectorscope-scope")).toBeInTheDocument()

      rerender(<ScopeViewer type="histogram" refreshRate={30} />)

      expect(screen.queryByTestId("vectorscope-scope")).not.toBeInTheDocument()
      expect(screen.getByTestId("histogram-scope")).toBeInTheDocument()
    })
  })
})
