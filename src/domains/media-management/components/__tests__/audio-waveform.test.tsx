/**
 * AudioWaveform Component Tests
 *
 * Тесты для компонента AudioWaveform и AudioWaveformCompact
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AudioWaveform, AudioWaveformCompact } from "../audio-waveform"
import { usePeaksWaveform } from "../../hooks/use-peaks-waveform"

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
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: null,
      isReady: true,
      play: mockPlay,
      pause: mockPause,
    })
  })

  it("should render with default props", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" />)

    // Should render without errors
    expect(screen.queryByText("Failed to load waveform")).not.toBeInTheDocument()
  })

  it("should show loading state", () => {
    mockUsePeaksWaveform.mockReturnValue({
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: true,
      error: null,
      isReady: false,
      play: mockPlay,
      pause: mockPause,
    })

    render(<AudioWaveform audioUrl="/test/audio.mp3" />)

    expect(screen.getByText("Loading waveform...")).toBeInTheDocument()
  })

  it("should show error state", () => {
    const testError = new Error("Test error")
    mockUsePeaksWaveform.mockReturnValue({
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: testError,
      isReady: false,
      play: mockPlay,
      pause: mockPause,
    })

    render(<AudioWaveform audioUrl="/test/audio.mp3" />)

    expect(screen.getByText("Failed to load waveform")).toBeInTheDocument()
    expect(screen.getByText("Test error")).toBeInTheDocument()
  })

  it("should render overview waveform when showOverview is true", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showOverview={true} />)

    // Should have overview container
    const containers = document.querySelectorAll(".w-full.rounded.border.bg-background")
    expect(containers.length).toBeGreaterThan(0)
  })

  it("should not render overview when showOverview is false", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showOverview={false} showZoomview={true} />)

    // Should only have one container (zoomview)
    const containers = document.querySelectorAll(".w-full.rounded.border.bg-background")
    expect(containers.length).toBe(1)
  })

  it("should render playback controls when showControls is true", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={true} />)

    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument()
  })

  it("should not render controls when showControls is false", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={false} />)

    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
  })

  it("should call play when Play button is clicked", async () => {
    const user = userEvent.setup()

    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={true} />)

    const playButton = screen.getByRole("button", { name: /play/i })
    await user.click(playButton)

    expect(mockPlay).toHaveBeenCalledTimes(1)
  })

  it("should call pause when Pause button is clicked", async () => {
    const user = userEvent.setup()

    render(<AudioWaveform audioUrl="/test/audio.mp3" showControls={true} />)

    const pauseButton = screen.getByRole("button", { name: /pause/i })
    await user.click(pauseButton)

    expect(mockPause).toHaveBeenCalledTimes(1)
  })

  it("should apply custom className", () => {
    const { container } = render(<AudioWaveform audioUrl="/test/audio.mp3" className="custom-class" />)

    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })

  it("should call onReady callback when peaks is ready", () => {
    const onReady = vi.fn()

    render(<AudioWaveform audioUrl="/test/audio.mp3" onReady={onReady} />)

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

    render(<AudioWaveform audioUrl="/test/audio.mp3" onError={onError} />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: "/test/audio.mp3",
        onError,
      }),
    )
  })

  it("should use custom waveform colors", () => {
    render(<AudioWaveform audioUrl="/test/audio.mp3" waveformColor="#ff0000" playedWaveformColor="#00ff00" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        waveformColor: "#ff0000",
        playedWaveformColor: "#00ff00",
      }),
    )
  })

  it("should use custom heights", () => {
    const { container } = render(<AudioWaveform audioUrl="/test/audio.mp3" overviewHeight={100} zoomviewHeight={300} />)

    const overviewEl = container.querySelector('[style*="height: 100px"]')
    const zoomviewEl = container.querySelector('[style*="height: 300px"]')

    expect(overviewEl).toBeInTheDocument()
    expect(zoomviewEl).toBeInTheDocument()
  })

  it("should show initializing state when not ready", () => {
    mockUsePeaksWaveform.mockReturnValue({
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: null,
      isReady: false,
      play: mockPlay,
      pause: mockPause,
    })

    render(<AudioWaveform audioUrl="/test/audio.mp3" />)

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
      overviewRef: { current: null },
      zoomviewRef: { current: null },
      isLoading: false,
      error: null,
      isReady: true,
      play: mockPlay,
      pause: mockPause,
    })
  })

  it("should render compact version", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" />)

    // Should render without errors
    expect(screen.queryByText("Failed to load waveform")).not.toBeInTheDocument()
  })

  it("should use compact height", () => {
    const { container } = render(<AudioWaveformCompact audioUrl="/test/audio.mp3" height={60} />)

    const heightEl = container.querySelector('[style*="height: 60px"]')
    expect(heightEl).toBeInTheDocument()
  })

  it("should not show zoomview", () => {
    const { container } = render(<AudioWaveformCompact audioUrl="/test/audio.mp3" />)

    // Should only have one container (overview)
    const containers = container.querySelectorAll(".w-full.rounded.border.bg-background")
    expect(containers.length).toBe(1)
  })

  it("should not show controls", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" />)

    expect(screen.queryByRole("button", { name: /play/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument()
  })

  it("should apply custom className", () => {
    const { container } = render(<AudioWaveformCompact audioUrl="/test/audio.mp3" className="compact-class" />)

    expect(container.querySelector(".compact-class")).toBeInTheDocument()
  })

  it("should use custom waveform color", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" waveformColor="#123456" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        waveformColor: "#123456",
      }),
    )
  })

  it("should call onReady callback", () => {
    const onReady = vi.fn()

    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" onReady={onReady} />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        onReady,
      }),
    )
  })

  it("should pass dataUri when provided", () => {
    render(<AudioWaveformCompact audioUrl="/test/audio.mp3" dataUri="/test/waveform.json" />)

    expect(mockUsePeaksWaveform).toHaveBeenCalledWith(
      expect.objectContaining({
        audioUrl: "/test/audio.mp3",
        dataUri: "/test/waveform.json",
      }),
    )
  })
})
