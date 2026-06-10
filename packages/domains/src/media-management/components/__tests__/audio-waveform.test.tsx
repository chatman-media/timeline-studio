/**
 * @vitest-environment jsdom
 */
/**
 * AudioWaveform Component Tests
 *
 * Тесты для компонента AudioWaveform и AudioWaveformCompact
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePeaksWaveform } from "../../hooks/use-peaks-waveform"
import { AudioWaveform, AudioWaveformCompact } from "../audio-waveform"

// Mock peaks waveform hook
vi.mock("../../hooks/use-peaks-waveform", () => ({
  usePeaksWaveform: vi.fn(),
}))

const mockUsePeaksWaveform = vi.mocked(usePeaksWaveform)

describe("AudioWaveform", () => {
  const mockPlay = vi.fn()
  const mockPause = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default mock implementation
    mockUsePeaksWaveform.mockReturnValue({
      peaks: null,
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: null,
      isReady: true,
      addSegment: vi.fn(),
      addPoint: vi.fn(),
      clearSegments: vi.fn(),
      clearPoints: vi.fn(),
      seek: vi.fn(),
      play: mockPlay,
      pause: mockPause,
    })
  })

  it("should render with default props", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" data-oid="jvr04_8" />)

    // Should render without errors
    expect(screen.queryByText("Failed to load waveform")).not.toBeInTheDocument()
  })

  it("should show loading state", () => {
    mockUsePeaksWaveform.mockReturnValue({
      peaks: null,
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: true,
      error: null,
      isReady: false,
      addSegment: vi.fn(),
      addPoint: vi.fn(),
      clearSegments: vi.fn(),
      clearPoints: vi.fn(),
      seek: vi.fn(),
      play: mockPlay,
      pause: mockPause,
    })

    render(<AudioWaveform audioUrl="/test/audio.mp3" data-oid="74emjsj" />)

    expect(screen.getByText("Loading waveform...")).toBeInTheDocument()
  })

  it("should show error state", () => {
    const testError = new Error("Test error")
    mockUsePeaksWaveform.mockReturnValue({
      peaks: null,
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: testError,
      isReady: false,
      addSegment: vi.fn(),
      addPoint: vi.fn(),
      clearSegments: vi.fn(),
      clearPoints: vi.fn(),
      seek: vi.fn(),
      play: mockPlay,
      pause: mockPause,
    })

    render(<AudioWaveform audioUrl="/test/audio.mp3" data-oid="kmrqkz:" />)

    expect(screen.getByText("Failed to load waveform")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("should render overview waveform when showOverview is true", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showOverview={true} data-oid="71.q0c9" />)

    // Should have overview container
    const containers = document.querySelectorAll(".w-full.rounded.border.bg-background")
    expect(containers.length).toBeGreaterThan(0)
  })

  it("should not render overview when showOverview is false", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showOverview={false} showZoomview={true} data-oid="f0rjfp8" />)

    // Should only have one container (zoomview)
    const containers = document.querySelectorAll(".w-full.rounded.border.bg-background")
    expect(containers.length).toBe(1)
  })

  it("should render playback controls when showControls is true", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={true} data-oid="sj.ap_c" />)

    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
  })

  it("should not render controls when showControls is false", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={false} data-oid="75dzcc1" />)

    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
  })

  it("should call play when Play button is clicked", async () => {
    const user = userEvent.setup()

    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={true} data-oid="dbuawi4" />)

    const playButton = screen.getByRole("button", { name: /play/i })
    await user.click(playButton)

    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it("should call pause when Pause button is clicked", async () => {
    const user = userEvent.setup()

    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={true} data-oid="nra_p0p" />)

    const pauseButton = screen.getByRole("button", { name: /pause/i })
    await user.click(pauseButton)

    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it("should apply custom className", () => {
    const { container } = render(
      <AudioWaveform audioUrl="/test/audio.mp3" className="custom-class" data-oid="l8cqj3:" />,
    )

    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })

  it("should call onReady callback when peaks is ready", () => {
    const onReady = vi.fn()

    render(<AudioWaveform audioUrl="/test/audio.mp3" onReady={onReady} data-oid="sdqt:cf" />)

    // Note: The actual callback is passed to usePeaksWaveform
    // This test verifies the prop is passed correctly
    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: "/test/audio.mp3",
        onReady,
      }),
    )
  })

  it("should call onError callback when error occurs", () => {
    const onError = vi.fn()

    render(<AudioWaveform audioUrl="/test/audio.mp3" onError={onError} data-oid="198jjnf" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: "/test/audio.mp3",
        onError,
      }),
    )
  })

  it("should use custom waveform colors", () => {
    render(
      <AudioWaveform
        audioUrl="/test/audio.mp3"
        waveformColor="#ff0000"
        playedWaveformColor="#00ff00"
        data-oid="i.sx5p_"
      />,
    )

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        waveformColor: "#ff0000",
        playedWaveformColor: "#00ff00",
      }),
    )
  })

  it("should use custom heights", () => {
    const { container } = render(
      <AudioWaveform audioUrl="/test/audio.mp3" overviewHeight={100} zoomviewHeight={300} data-oid="1qzwqt8" />,
    )

    const overviewEl = container.querySelector('[style*="height: 100px"]')
    const zoomviewEl = container.querySelector('[style*="height: 300px"]')

    expect(overviewEl).toBeInTheDocument()
    expect(zoomviewEl).toBeInTheDocument()
  })

  it("should show initializing state when not ready", () => {
    mockUsePeaksWaveform.mockReturnValue({
      peaks: null,
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: null,
      isReady: false,
      addSegment: vi.fn(),
      addPoint: vi.fn(),
      clearSegments: vi.fn(),
      clearPoints: vi.fn(),
      seek: vi.fn(),
      play: mockPlay,
      pause: mockPause,
    })

    render(<AudioWaveform audioUrl="/test/audio.mp3" data-oid="gg-r0g7" />)

    expect(screen.getByText("Initializing overview...")).toBeInTheDocument()
    expect(screen.getByText("Initializing waveform...")).toBeInTheDocument()
  })
})

describe("AudioWaveformCompact", () => {
  const mockPlay = vi.fn()
  const mockPause = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset to default mock implementation
    mockUsePeaksWaveform.mockReturnValue({
      peaks: null,
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: null,
      isReady: true,
      addSegment: vi.fn(),
      addPoint: vi.fn(),
      clearSegments: vi.fn(),
      clearPoints: vi.fn(),
      seek: vi.fn(),
      play: mockPlay,
      pause: mockPause,
    })
  })

  it("should render compact version", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" data-oid="2yoygx-" />)

    // Should render without errors
    expect(screen.queryByText("Failed to load waveform")).not.toBeInTheDocument()
  })

  it("should use compact height", () => {
    const { container } = render(<AudioWaveformCompact audioUrl="/test/audio.mp3" height={60} data-oid="f84_-3_" />)

    const heightEl = container.querySelector('[style*="height: 60px"]')
    expect(heightEl).toBeInTheDocument()
  })

  it("should not show zoomview", () => {
    const { container } = render(<AudioWaveformCompact audioUrl="/test/audio.mp3" data-oid=".9mstig" />)

    // Should only have one container (overview)
    const containers = container.querySelectorAll(".w-full.rounded.border.bg-background")
    expect(containers.length).toBe(1)
  })

  it("should not show controls", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" data-oid="c991h6e" />)

    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(
      <AudioWaveformCompact audioUrl="/test/audio.mp3" className="compact-class" data-oid="._f9fep" />,
    )

    expect(container.querySelector(".compact-class")).toBeInTheDocument()
  })

  it("should use custom waveform color", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" waveformColor="#123456" data-oid="fxaghqn" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        waveformColor: "#123456",
      }),
    )
  })

  it("should call onReady callback", () => {
    const onReady = vi.fn()

    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" onReady={onReady} data-oid="nqkyw-r" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        onReady,
      }),
    )
  })

  it("should pass dataUri when provided", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" dataUri="/test/waveform.json" data-oid="_al_7_n" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: "/test/audio.mp3",
        dataUri: "/test/waveform.json",
      }),
    )
  })
})
