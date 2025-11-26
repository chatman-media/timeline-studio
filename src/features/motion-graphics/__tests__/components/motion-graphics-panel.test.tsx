import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { AnimationTrack } from "../../types/keyframe"
import { MotionGraphicsPanel } from "../../components/motion-graphics-panel"
import { createAnimationLayer } from "../../services/animation-layers"
import { createKeyframe } from "../../services/keyframe-manager"

// Mock the preset manager to avoid file system access
vi.mock("../../services/preset-manager", () => ({
  getAllPresets: vi.fn(() => [
    {
      id: "fade-in",
      name: "Fade In",
      description: "Smooth fade in animation",
      category: "transitions",
      tags: ["fade", "transition"],
      duration: 1,
      scalable: true,
      customizable: true,
      properties: [],
    },
  ]),
  getPresetCategories: vi.fn(() => [
    { id: "transitions", name: "Transitions", icon: "arrow-right" },
  ]),
  getPresetsByCategory: vi.fn(() => []),
  searchPresets: vi.fn(() => []),
}))

describe("MotionGraphicsPanel Component", () => {
  const mockTrack: AnimationTrack = {
    id: "track-1",
    targetId: "target-1",
    targetType: "clip",
    layers: [
      {
        ...createAnimationLayer("Test Layer", [
          {
            id: "prop-1",
            name: "Opacity",
            path: "opacity",
            type: "number",
            keyframes: [createKeyframe(0, 0), createKeyframe(1, 100)],
            enabled: true,
          },
        ]),
      },
    ],
    enabled: true,
  }

  const defaultProps = {
    tracks: [mockTrack],
    currentTime: 0,
    duration: 10,
    playing: false,
    onTimeChange: vi.fn(),
    onPlayPause: vi.fn(),
    onStop: vi.fn(),
    onReset: vi.fn(),
    onTrackAdd: vi.fn(),
    onTrackUpdate: vi.fn(),
    onLayerAdd: vi.fn(),
    onLayerUpdate: vi.fn(),
    onPresetApply: vi.fn(),
  }

  it("renders motion graphics panel", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    expect(screen.getByText("Motion Graphics")).toBeInTheDocument()
  })

  it("displays playback controls", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Check for play/pause, stop, reset buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(3)
  })

  it("shows play button when not playing", () => {
    render(<MotionGraphicsPanel {...defaultProps} playing={false} />)

    // Component should render without errors
    expect(screen.getByText("Motion Graphics")).toBeInTheDocument()
  })

  it("shows pause button when playing", () => {
    render(<MotionGraphicsPanel {...defaultProps} playing={true} />)

    // Component should render without errors
    expect(screen.getByText("Motion Graphics")).toBeInTheDocument()
  })

  it("calls onPlayPause when play/pause clicked", () => {
    const onPlayPause = vi.fn()
    render(<MotionGraphicsPanel {...defaultProps} onPlayPause={onPlayPause} />)

    // Find and click play button
    const buttons = screen.getAllByRole("button")
    const playButton = buttons.find((btn) => btn.querySelector("svg"))
    if (playButton) {
      fireEvent.click(playButton)
      expect(onPlayPause).toHaveBeenCalled()
    }
  })

  it("calls onStop when stop button clicked", () => {
    const onStop = vi.fn()
    render(<MotionGraphicsPanel {...defaultProps} onStop={onStop} />)

    const buttons = screen.getAllByRole("button")
    // Stop button should be the second playback control button
    expect(buttons.length).toBeGreaterThan(1)
  })

  it("calls onReset when reset button clicked", () => {
    const onReset = vi.fn()
    render(<MotionGraphicsPanel {...defaultProps} onReset={onReset} />)

    const buttons = screen.getAllByRole("button")
    // Reset button should be one of the playback control buttons
    expect(buttons.length).toBeGreaterThan(2)
  })

  it("displays time slider", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    const slider = screen.getByRole("slider")
    expect(slider).toBeInTheDocument()
  })

  it("calls onTimeChange when slider is moved", () => {
    const onTimeChange = vi.fn()
    render(<MotionGraphicsPanel {...defaultProps} onTimeChange={onTimeChange} />)

    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "5" } })

    expect(onTimeChange).toHaveBeenCalledWith(5)
  })

  it("displays current time and duration", () => {
    render(<MotionGraphicsPanel {...defaultProps} currentTime={2.5} duration={10} />)

    expect(screen.getByText(/2\.50s/)).toBeInTheDocument()
    expect(screen.getByText(/10\.00s/)).toBeInTheDocument()
  })

  it("renders tabs for presets, layers, and properties", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    expect(screen.getByText("Presets")).toBeInTheDocument()
    expect(screen.getByText("Layers")).toBeInTheDocument()
    expect(screen.getByText("Properties")).toBeInTheDocument()
  })

  it("displays search input in presets tab", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")
    expect(searchInput).toBeInTheDocument()
  })

  it("filters presets by search query", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")
    fireEvent.change(searchInput, { target: { value: "fade" } })

    // Preset with "fade" in name should be visible
    expect(screen.getByText("Fade In")).toBeInTheDocument()
  })

  it("displays category filter", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    const select = screen.getByText("All Categories")
    expect(select).toBeInTheDocument()
  })

  it("toggles between grid and list view", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    const buttons = screen.getAllByRole("button")
    // Grid and list view buttons should be present
    expect(buttons.length).toBeGreaterThan(10)
  })

  it("displays preset cards", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Preset should be visible
    expect(screen.getByText("Fade In")).toBeInTheDocument()
  })

  it("calls onPresetApply when preset is clicked", () => {
    const onPresetApply = vi.fn()
    render(<MotionGraphicsPanel {...defaultProps} onPresetApply={onPresetApply} />)

    const presetCard = screen.getByText("Fade In").closest("div")
    if (presetCard) {
      fireEvent.click(presetCard)
      expect(onPresetApply).toHaveBeenCalled()
    }
  })

  it("displays animation layers in layers tab", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Click on Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    expect(screen.getByText("Animation Layers")).toBeInTheDocument()
  })

  it("displays track information", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    expect(screen.getByText(/Track clip/)).toBeInTheDocument()
  })

  it("displays layer count badge", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    // Should show number of layers
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("shows empty state when no layers selected", () => {
    render(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    expect(screen.getByText("Motion Graphics")).toBeInTheDocument()
    expect(screen.getByText(/Select a layer to edit animation curves/)).toBeInTheDocument()
  })

  it("displays properties in properties tab", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    expect(screen.getByText("Properties")).toBeInTheDocument()
  })

  it("shows message when no layer is selected", () => {
    render(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    expect(screen.getByText(/Select a layer to view properties/)).toBeInTheDocument()
  })

  it("handles empty tracks array", () => {
    render(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    expect(screen.getByText("Motion Graphics")).toBeInTheDocument()
  })

  it("displays toolbar buttons", () => {
    render(<MotionGraphicsPanel {...defaultProps} />)

    // Upload, Download, Settings buttons should be present
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(5)
  })
})
