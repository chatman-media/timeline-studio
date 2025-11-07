import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock dependencies before importing the component
vi.mock("../channel-strip", () => ({
  ChannelStrip: ({ name, ...props }: any) => (
    <div data-testid="channel-strip" data-name={name} {...props}>
      {name}
    </div>
  ),
}))

vi.mock("../../../hooks/use-channel-audio", () => ({
  useChannelAudio: vi.fn(() => ({
    error: null,
    isLoading: false,
    audioElement: null,
  })),
}))

vi.mock("../../waveform/simple-waveform", () => ({
  SimpleWaveform: ({ audioElement, height, className }: any) => (
    <div
      data-testid="simple-waveform"
      data-audio-element={audioElement ? "present" : "absent"}
      data-height={height}
      className={className}
    >
      Waveform
    </div>
  ),
}))

// Import component after mocks
import { useChannelAudio } from "../../../hooks/use-channel-audio"
import { ChannelWithAudio } from "../channel-with-audio"

const mockedUseChannelAudio = vi.mocked(useChannelAudio)

describe("ChannelWithAudio", () => {
  const defaultProps = {
    channelId: "channel-1",
    name: "Test Channel",
    type: "stereo" as const,
    volume: 0.75,
    pan: 0,
    muted: false,
    solo: false,
    armed: false,
    onVolumeChange: vi.fn(),
    onPanChange: vi.fn(),
    onMute: vi.fn(),
    onSolo: vi.fn(),
    onArm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock return value
    mockedUseChannelAudio.mockReturnValue({
      error: null,
      isLoading: false,
      audioElement: null,
    })
  })

  it("should render channel strip with correct props", () => {
    render(<ChannelWithAudio {...defaultProps} />)

    const channelStrip = screen.getByTestId("channel-strip")
    expect(channelStrip).toBeTruthy()
    expect(channelStrip.getAttribute("data-name")).toBe("Test Channel")
  })

  it("should show loading state in channel name", () => {
    mockedUseChannelAudio.mockReturnValue({
      error: null,
      isLoading: true,
      audioElement: null,
    })

    render(<ChannelWithAudio {...defaultProps} />)

    const channelStrip = screen.getByTestId("channel-strip")
    expect(channelStrip.getAttribute("data-name")).toBe("Test Channel (Loading...)")
  })

  it("should show error state in channel name", () => {
    mockedUseChannelAudio.mockReturnValue({
      error: "Failed to load audio",
      isLoading: false,
      audioElement: null,
    })

    render(<ChannelWithAudio {...defaultProps} />)

    const channelStrip = screen.getByTestId("channel-strip")
    expect(channelStrip.getAttribute("data-name")).toBe("Test Channel (!)")
  })

  it("should not render waveform when trackId is not provided", () => {
    render(<ChannelWithAudio {...defaultProps} />)

    const waveform = screen.queryByTestId("simple-waveform")
    expect(waveform).toBeNull()
  })

  it("should render waveform when trackId is provided", () => {
    const audioElement = document.createElement("audio")
    mockedUseChannelAudio.mockReturnValue({
      error: null,
      isLoading: false,
      audioElement,
    })

    render(<ChannelWithAudio {...defaultProps} trackId="track-1" />)

    const waveform = screen.getByTestId("simple-waveform")
    expect(waveform).toBeTruthy()
    expect(waveform.getAttribute("data-audio-element")).toBe("present")
    expect(waveform.getAttribute("data-height")).toBe("40")
    expect(waveform.className).toContain("w-full")
  })

  it("should call useChannelAudio with correct parameters", () => {
    render(<ChannelWithAudio {...defaultProps} trackId="track-1" />)

    expect(mockedUseChannelAudio).toHaveBeenCalledWith("channel-1", "track-1")
  })

  it("should apply custom className", () => {
    const { container } = render(<ChannelWithAudio {...defaultProps} className="custom-class" />)

    const wrapper = container.firstChild
    expect(wrapper?.className).toContain("custom-class")
    expect(wrapper?.className).toContain("flex")
    expect(wrapper?.className).toContain("flex-col")
  })

  it("should pass all props except trackId and className to ChannelStrip", () => {
    const extraProps = {
      ...defaultProps,
      trackId: "track-1",
      className: "custom-class",
      extraProp: "should-pass-through",
    }

    render(<ChannelWithAudio {...extraProps} />)

    const channelStrip = screen.getByTestId("channel-strip")
    expect(channelStrip.getAttribute("data-name")).toBe("Test Channel")
    expect(channelStrip.getAttribute("extraProp")).toBe("should-pass-through")
    // trackId and className should not be passed
    expect(channelStrip.getAttribute("trackId")).toBeNull()
    expect(channelStrip.className).not.toContain("custom-class")
  })

  it("should render waveform container with correct spacing", () => {
    render(<ChannelWithAudio {...defaultProps} trackId="track-1" />)

    const waveform = screen.getByTestId("simple-waveform")
    const waveformContainer = waveform.parentElement
    expect(waveformContainer?.className).toContain("mb-2")
    expect(waveformContainer?.className).toContain("px-2")
  })

  it("should handle null audioElement correctly", () => {
    mockedUseChannelAudio.mockReturnValue({
      error: null,
      isLoading: false,
      audioElement: null,
    })

    render(<ChannelWithAudio {...defaultProps} trackId="track-1" />)

    const waveform = screen.getByTestId("simple-waveform")
    expect(waveform.getAttribute("data-audio-element")).toBe("absent")
  })

  it("should maintain channel functionality during loading", () => {
    mockedUseChannelAudio.mockReturnValue({
      error: null,
      isLoading: true,
      audioElement: null,
    })

    render(<ChannelWithAudio {...defaultProps} />)

    // All props should still be passed to ChannelStrip
    const channelStrip = screen.getByTestId("channel-strip")
    expect(channelStrip).toBeTruthy()
    // The component should still be functional, just with updated name
    expect(channelStrip.getAttribute("data-name")).toContain("Loading...")
  })

  it("should maintain channel functionality during error", () => {
    mockedUseChannelAudio.mockReturnValue({
      error: "Audio load failed",
      isLoading: false,
      audioElement: null,
    })

    render(<ChannelWithAudio {...defaultProps} />)

    // All props should still be passed to ChannelStrip
    const channelStrip = screen.getByTestId("channel-strip")
    expect(channelStrip).toBeTruthy()
    // The component should still be functional, just with error indicator
    expect(channelStrip.getAttribute("data-name")).toContain("(!)")
  })
})
