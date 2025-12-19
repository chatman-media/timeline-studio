/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TimelinePreviewStrip, useTimelinePreviewStrip } from "@/features/timeline/components/timeline-preview-strip"

// Mock the frame extraction hook
vi.mock("@/features/video-compiler/hooks/use-frame-extraction", () => ({
  useSmartTimelinePreviews: vi.fn(),
}))

// Mock the frame extraction service
vi.mock("@/domains/video-editing/services/compiler/frame-extraction-service", () => ({
  frameExtractionService: {
    createPreviewElement: vi.fn(),
  },
}))

// Mock Skeleton component
vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className, style }: any) => (
    <div className={className} style={style} data-testid="skeleton" data-oid="5k_i1qu" />
  ),
}))

// Mock cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

describe("TimelinePreviewStrip", () => {
  const mockUseSmartTimelinePreviews = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()

    // Setup default mock return values
    const { useSmartTimelinePreviews } = await import("@/features/video-compiler/hooks/use-frame-extraction")
    vi.mocked(useSmartTimelinePreviews).mockImplementation(mockUseSmartTimelinePreviews)

    mockUseSmartTimelinePreviews.mockReturnValue({
      frames: [],
      isLoading: false,
      error: null,
      progress: 0,
      frameWidth: 80,
    })

    // Mock the frame extraction service
    const { frameExtractionService } = await import(
      "@/domains/video-editing/services/compiler/frame-extraction-service"
    )
    vi.mocked(frameExtractionService.createPreviewElement).mockReturnValue({
      src: "data:image/jpeg;base64,test-frame-data",
      onload: null,
      className: "",
    } as HTMLImageElement)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const defaultProps = {
    videoPath: "/test/video.mp4",
    duration: 10,
    containerWidth: 800,
    scale: 80,
  }

  describe("initial rendering", () => {
    it("should render without error", () => {
      render(<TimelinePreviewStrip {...defaultProps} data-oid=":y0nv_d" />)

      expect(mockUseSmartTimelinePreviews).toHaveBeenCalledWith("/test/video.mp4", 10, 800, {
        cacheResults: true,
        interval: 1.0,
      })
    })

    it("should apply custom height and className", () => {
      const { container } = render(
        <TimelinePreviewStrip {...defaultProps} height={120} className="custom-class" data-oid="satcvkt" />,
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveStyle({ height: "120px" })
      expect(element).toHaveClass("custom-class")
    })

    it("should handle null video path", () => {
      render(<TimelinePreviewStrip {...defaultProps} videoPath={null} data-oid=":642x97" />)

      expect(mockUseSmartTimelinePreviews).toHaveBeenCalledWith(null, 10, 800, {
        cacheResults: true,
        interval: 1.0,
      })
    })
  })

  describe("loading states", () => {
    it("should show skeletons during initial loading", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [],
        isLoading: true,
        error: null,
        progress: 25,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} data-oid="usj5lpa" />)

      const skeletons = screen.getAllByTestId("skeleton")
      expect(skeletons).toHaveLength(10) // Math.min(10, Math.floor(800 / 80))

      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveStyle({ width: "76px", height: "52px" }) // frameWidth - 4, height - 8
      })
    })

    it("should show progress bar during loading", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [{ timestamp: 1, frameData: "test", isKeyframe: false }],
        isLoading: true,
        error: null,
        progress: 75,
        frameWidth: 80,
      })

      const { container } = render(<TimelinePreviewStrip {...defaultProps} data-oid="ii0d:bi" />)

      const progressBar = container.querySelector('[style*="width: 75%"]')
      expect(progressBar).toBeInTheDocument()
    })

    it("should not show progress bar when not loading", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [{ timestamp: 1, frameData: "test", isKeyframe: false }],
        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })

      const { container } = render(<TimelinePreviewStrip {...defaultProps} data-oid="pwlg1-5" />)

      const progressBar = container.querySelector('[style*="width: 100%"]')
      expect(progressBar).not.toBeInTheDocument()
    })
  })

  describe("error handling", () => {
    it("should display error message when loading fails", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [],
        isLoading: false,
        error: new Error("Failed to load frames"),
        progress: 0,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} data-oid="v8x3zmn" />)

      expect(screen.getByText("Ошибка загрузки превью")).toBeInTheDocument()
    })

    it("should apply custom className to error state", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [],
        isLoading: false,
        error: new Error("Failed to load frames"),
        progress: 0,
        frameWidth: 80,
      })

      const { container } = render(
        <TimelinePreviewStrip {...defaultProps} className="error-class" data-oid="d8bz__u" />,
      )

      const errorElement = container.firstChild as HTMLElement
      expect(errorElement).toHaveClass("error-class")
    })
  })

  describe("frame rendering", () => {
    const mockFrames = [
      { timestamp: 1, frameData: "frame1-data", isKeyframe: true },
      { timestamp: 2, frameData: "frame2-data", isKeyframe: false },
      { timestamp: 3, frameData: "frame3-data", isKeyframe: false },
    ]

    beforeEach(() => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: mockFrames,
        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })
    })

    it("should render all frames", () => {
      render(<TimelinePreviewStrip {...defaultProps} data-oid="8mwit2s" />)

      mockFrames.forEach((frame) => {
        expect(screen.getByAltText(`Frame at ${frame.timestamp}s`)).toBeInTheDocument()
      })
    })

    it("should position frames correctly", () => {
      const { container } = render(<TimelinePreviewStrip {...defaultProps} data-oid="_.1:psp" />)

      const frameContainer = container.querySelector('[style*="width: 800px"]') // duration * scale
      expect(frameContainer).toBeInTheDocument()
    })

    it("should handle frame clicks", () => {
      const onFrameClick = vi.fn()
      render(<TimelinePreviewStrip {...defaultProps} onFrameClick={onFrameClick} data-oid="q920fpj" />)

      const firstFrame = screen.getByAltText("Frame at 1s")
      fireEvent.click(firstFrame.closest('[title*="1.00s"]')!)

      expect(onFrameClick).toHaveBeenCalledWith(1)
    })

    it("should show keyframe indicators", () => {
      render(<TimelinePreviewStrip {...defaultProps} data-oid=".upfns:" />)

      const keyframeIndicator = screen.getByText("K")
      expect(keyframeIndicator).toBeInTheDocument()
    })

    it("should show timestamps when enabled", () => {
      render(<TimelinePreviewStrip {...defaultProps} showTimestamps={true} data-oid="::f506v" />)

      expect(screen.getByText("0:01.00")).toBeInTheDocument()
      expect(screen.getByText("0:02.00")).toBeInTheDocument()
      expect(screen.getByText("0:03.00")).toBeInTheDocument()
    })

    it("should not show timestamps when disabled", () => {
      render(<TimelinePreviewStrip {...defaultProps} showTimestamps={false} data-oid="yd9.0rl" />)

      expect(screen.queryByText("0:01.00")).not.toBeInTheDocument()
    })
  })

  describe("scroll handling", () => {
    it("should update visible range based on scroll offset", () => {
      const { rerender } = render(<TimelinePreviewStrip {...defaultProps} scrollOffset={0} data-oid="q_b7_hq" />)

      // Change scroll offset
      rerender(<TimelinePreviewStrip {...defaultProps} scrollOffset={160} data-oid="2i5xntv" />)

      const { container } = render(<TimelinePreviewStrip {...defaultProps} scrollOffset={160} data-oid="ejga_0c" />)

      const frameContainer = container.querySelector('[style*="translateX(-160px)"]')
      expect(frameContainer).toBeInTheDocument()
    })

    it("should render all frames regardless of visible range (current behavior)", () => {
      const allFrames = [
        { timestamp: 0.5, frameData: "frame1", isKeyframe: false },
        { timestamp: 5, frameData: "frame2", isKeyframe: false },
        { timestamp: 15, frameData: "frame3", isKeyframe: false }, // Currently renders all frames
      ]

      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: allFrames,
        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} duration={10} data-oid="aadj4l9" />)

      // Currently renders all frames (TODO: should be optimized to only render visible ones)
      expect(screen.getByAltText("Frame at 0.5s")).toBeInTheDocument()
      expect(screen.getByAltText("Frame at 5s")).toBeInTheDocument()
      expect(screen.getByAltText("Frame at 15s")).toBeInTheDocument()
    })
  })

  describe("PreviewFrame component", () => {
    it("should create preview element on mount", async () => {
      const { frameExtractionService } = await import(
        "@/domains/video-editing/services/compiler/frame-extraction-service"
      )

      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [{ timestamp: 1, frameData: "test-data", isKeyframe: false }],
        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} data-oid="x2doizw" />)

      expect(frameExtractionService.createPreviewElement).toHaveBeenCalledWith("test-data", 1)
    })

    it("should show loading skeleton before image loads", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [{ timestamp: 1, frameData: "test-data", isKeyframe: false }],
        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} data-oid="ycqx85z" />)

      const skeleton = screen.getByTestId("skeleton")
      expect(skeleton).toBeInTheDocument()
    })

    it("should show correct title for keyframes", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [{ timestamp: 1, frameData: "test-data", isKeyframe: true }],
        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} data-oid="13ojz64" />)

      const frame = screen.getByAltText("Frame at 1s").closest('[title*="(Ключевой кадр)"]')
      expect(frame).toBeInTheDocument()
    })
  })

  describe("formatTimestamp function", () => {
    it("should format timestamps correctly", () => {
      mockUseSmartTimelinePreviews.mockReturnValue({
        frames: [
          { timestamp: 0, frameData: "test", isKeyframe: false },
          { timestamp: 65.5, frameData: "test", isKeyframe: false },
          { timestamp: 3661.25, frameData: "test", isKeyframe: false },
        ],

        isLoading: false,
        error: null,
        progress: 100,
        frameWidth: 80,
      })

      render(<TimelinePreviewStrip {...defaultProps} showTimestamps={true} duration={4000} data-oid="bcezsmt" />)

      expect(screen.getByText("0:00.00")).toBeInTheDocument()
      expect(screen.getByText("1:05.50")).toBeInTheDocument()
      expect(screen.getByText("61:01.25")).toBeInTheDocument()
    })
  })
})

describe("useTimelinePreviewStrip hook", () => {
  beforeEach(() => {
    // Mock ResizeObserver as a class
    global.ResizeObserver = class MockResizeObserver {
      private callback: ResizeObserverCallback

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
      }

      observe = vi.fn().mockImplementation((_element: Element) => {
        // Simulate resize observation
        setTimeout(() => {
          this.callback([{ contentRect: { width: 1200 } } as ResizeObserverEntry], this as any)
        }, 0)
      })

      unobserve = vi.fn()
      disconnect = vi.fn()
    } as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return container ref and width", () => {
    const TestComponent = () => {
      const { containerRef, containerWidth } = useTimelinePreviewStrip("/test.mp4", 10)

      return (
        <div data-oid="0nopya0">
          <div ref={containerRef} data-testid="container" data-oid="-lkeu73">
            Container
          </div>
          <span data-testid="width" data-oid="fjvom9m">
            {containerWidth}
          </span>
        </div>
      )
    }

    render(<TestComponent data-oid="h_p7tvu" />)

    const container = screen.getByTestId("container")
    expect(container).toBeInTheDocument()

    const width = screen.getByTestId("width")
    expect(width).toHaveTextContent("0") // Initial width
  })

  it("should update container width on resize", async () => {
    const TestComponent = () => {
      const { containerRef, containerWidth } = useTimelinePreviewStrip("/test.mp4", 10)

      return (
        <div data-oid="8m5c1yj">
          <div ref={containerRef} data-testid="container" data-oid="6yx7pw1">
            Container
          </div>
          <span data-testid="width" data-oid="_lhj-9i">
            {containerWidth}
          </span>
        </div>
      )
    }

    render(<TestComponent data-oid="ez0yr-u" />)

    await waitFor(() => {
      const width = screen.getByTestId("width")
      expect(width).toHaveTextContent("1200")
    })
  })

  it("should disconnect observer on unmount", () => {
    const mockDisconnect = vi.fn()
    global.ResizeObserver = class MockResizeObserver {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = mockDisconnect
    } as any

    const TestComponent = () => {
      const { containerRef } = useTimelinePreviewStrip("/test.mp4", 10)
      return (
        <div ref={containerRef} data-testid="container" data-oid="t7-ysen">
          Container
        </div>
      )
    }

    const { unmount } = render(<TestComponent data-oid="th9a6z." />)

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it("should handle missing container ref", () => {
    const TestComponent = () => {
      const { containerWidth } = useTimelinePreviewStrip("/test.mp4", 10)
      return (
        <span data-testid="width" data-oid="oorj1mu">
          {containerWidth}
        </span>
      )
    }

    render(<TestComponent data-oid="0.x_ne8" />)

    const width = screen.getByTestId("width")
    expect(width).toHaveTextContent("0")
  })
})
