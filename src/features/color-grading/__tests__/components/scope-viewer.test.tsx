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
    <div
      data-testid="histogram-scope"
      data-width={width}
      data-height={height}
      data-refresh-rate={refreshRate}
      data-oid="5q0d4d4"
    >
      Histogram
    </div>
  ),
}))

vi.mock("../../components/scopes/vectorscope-scope", () => ({
  VectorscopeScope: ({ width, height, refreshRate }: { width: number; height: number; refreshRate: number }) => (
    <div
      data-testid="vectorscope-scope"
      data-width={width}
      data-height={height}
      data-refresh-rate={refreshRate}
      data-oid="g.l5gcg"
    >
      Vectorscope
    </div>
  ),
}))

vi.mock("../../components/scopes/waveform-scope", () => ({
  WaveformScope: ({ width, height, refreshRate }: { width: number; height: number; refreshRate: number }) => (
    <div
      data-testid="waveform-scope"
      data-width={width}
      data-height={height}
      data-refresh-rate={refreshRate}
      data-oid="gj9nteu"
    >
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
      render(<ScopeViewer type="waveform" refreshRate={30} data-oid="0l:y.00" />)

      expect(screen.getByTestId("waveform-scope")).toBeInTheDocument()
      expect(screen.queryByTestId("vectorscope-scope")).not.toBeInTheDocument()
      expect(screen.queryByTestId("histogram-scope")).not.toBeInTheDocument()
    })

    it("should render vectorscope scope", () => {
      render(<ScopeViewer type="vectorscope" refreshRate={30} data-oid="7yzr7qg" />)

      expect(screen.getByTestId("vectorscope-scope")).toBeInTheDocument()
      expect(screen.queryByTestId("waveform-scope")).not.toBeInTheDocument()
      expect(screen.queryByTestId("histogram-scope")).not.toBeInTheDocument()
    })

    it("should render histogram scope", () => {
      render(<ScopeViewer type="histogram" refreshRate={30} data-oid="fo62b-b" />)

      expect(screen.getByTestId("histogram-scope")).toBeInTheDocument()
      expect(screen.queryByTestId("waveform-scope")).not.toBeInTheDocument()
      expect(screen.queryByTestId("vectorscope-scope")).not.toBeInTheDocument()
    })
  })

  describe("Dimensions handling", () => {
    it("should pass dimensions to scope components", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} data-oid="4ovum:u" />)

      const scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-width")).toBeTruthy()
      expect(scope.getAttribute("data-height")).toBeTruthy()
    })

    it("should use minimum width of 320", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} data-oid="2mf1.-7" />)

      const scope = screen.getByTestId("waveform-scope")
      const width = Number(scope.getAttribute("data-width"))
      expect(width).toBeGreaterThanOrEqual(320)
    })

    it("should use different height for fullscreen mode", () => {
      const { rerender } = render(
        <ScopeViewer type="waveform" refreshRate={30} isFullscreen={false} data-oid="ozx6:xq" />,
      )

      let scope = screen.getByTestId("waveform-scope")
      const normalHeight = Number(scope.getAttribute("data-height"))

      rerender(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} data-oid="vqc75:u" />)

      scope = screen.getByTestId("waveform-scope")
      const fullscreenHeight = Number(scope.getAttribute("data-height"))

      // Fullscreen should use minimum 480 - 60 = 420
      expect(fullscreenHeight).toBeGreaterThanOrEqual(normalHeight)
    })
  })

  describe("Fullscreen mode", () => {
    it("should render close button in fullscreen mode", () => {
      const onClose = vi.fn()
      render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} onClose={onClose} data-oid="uv2-jmr" />)

      const closeButton = screen.getByRole("button")
      expect(closeButton).toBeInTheDocument()
    })

    it("should not render close button in normal mode", () => {
      render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={false} data-oid="t51..hw" />)

      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} onClose={onClose} data-oid="a.x_ie4" />)

      const closeButton = screen.getByRole("button")
      await user.click(closeButton)

      expect(onClose).toHaveBeenCalledOnce()
    })

    it("should add padding in fullscreen mode", () => {
      const { container } = render(
        <ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} data-oid="pv0:n5k" />,
      )

      const paddedDiv = container.querySelector(".p-8")
      expect(paddedDiv).toBeInTheDocument()
    })

    it("should not add padding in normal mode", () => {
      const { container } = render(
        <ScopeViewer type="waveform" refreshRate={30} isFullscreen={false} data-oid="_1nzl91" />,
      )

      const paddedDiv = container.querySelector(".p-8")
      expect(paddedDiv).not.toBeInTheDocument()
    })

    it("should have full width and height classes in fullscreen mode", () => {
      const { container } = render(
        <ScopeViewer type="waveform" refreshRate={30} isFullscreen={true} data-oid="x:3o:90" />,
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("w-full")
      expect(containerDiv).toHaveClass("h-full")
    })
  })

  describe("Refresh rate", () => {
    it("should pass refresh rate to scope components", () => {
      render(<ScopeViewer type="waveform" refreshRate={60} data-oid="zru2y:o" />)

      const scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-refresh-rate")).toBe("60")
    })

    it("should update refresh rate when changed", () => {
      const { rerender } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="ksk1u1c" />)

      let scope = screen.getByTestId("waveform-scope")
      expect(scope.getAttribute("data-refresh-rate")).toBe("30")

      rerender(<ScopeViewer type="waveform" refreshRate={15} data-oid="tb-s118" />)

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

      render(<ScopeViewer type="waveform" refreshRate={30} data-oid="03i3522" />)

      expect(observeSpy).toHaveBeenCalled()
    })

    it("should disconnect observer on unmount", () => {
      const disconnectSpy = vi.fn()
      global.ResizeObserver = class ResizeObserver {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = disconnectSpy
      }

      const { unmount } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="h_.dn-r" />)

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe("Container styling", () => {
    it("should have black background", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="xc1y2l3" />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("bg-black")
    })

    it("should have rounded corners", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="s73za9u" />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("rounded-lg")
    })

    it("should have overflow hidden", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="i:g4ec:" />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("overflow-hidden")
    })

    it("should be positioned relatively", () => {
      const { container } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="khz7lk6" />)

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass("relative")
    })
  })

  describe("Type switching", () => {
    it("should switch between scope types", () => {
      const { rerender } = render(<ScopeViewer type="waveform" refreshRate={30} data-oid="32k:9an" />)

      expect(screen.getByTestId("waveform-scope")).toBeInTheDocument()

      rerender(<ScopeViewer type="vectorscope" refreshRate={30} data-oid=":qrb80r" />)

      expect(screen.queryByTestId("waveform-scope")).not.toBeInTheDocument()
      expect(screen.getByTestId("vectorscope-scope")).toBeInTheDocument()

      rerender(<ScopeViewer type="histogram" refreshRate={30} data-oid="icoww__" />)

      expect(screen.queryByTestId("vectorscope-scope")).not.toBeInTheDocument()
      expect(screen.getByTestId("histogram-scope")).toBeInTheDocument()
    })
  })
})
