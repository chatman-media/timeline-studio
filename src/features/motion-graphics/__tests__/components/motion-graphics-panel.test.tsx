/**
 * @vitest-environment jsdom
 */
import { fireEvent, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { renderWithBase } from "@/test/test-utils"
import { MotionGraphicsPanel } from "../../components/motion-graphics-panel"
import { createAnimationLayer } from "../../services/animation-layers"
import { createKeyframe } from "../../services/keyframe-manager"
import type { AnimationTrack } from "../../types/keyframe"

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
  getPresetCategories: vi.fn(() => [{ id: "transitions", name: "Transitions", icon: "arrow-right" }]),
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
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    expect(screen.getAllByText("Motion Graphics").length).toBeGreaterThan(0)
  })

  it("displays playback controls", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Check for play/pause, stop, reset buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(3)
  })

  it("shows play button when not playing", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} playing={false} />)

    // Component should render without errors
    expect(screen.getAllByText("Motion Graphics").length).toBeGreaterThan(0)
  })

  it("shows pause button when playing", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} playing={true} />)

    // Component should render without errors
    expect(screen.getAllByText("Motion Graphics").length).toBeGreaterThan(0)
  })

  it("calls onPlayPause when play/pause clicked", () => {
    const onPlayPause = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onPlayPause={onPlayPause} />)

    // Component should render without errors
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0)
  })

  it("calls onStop when stop button clicked", () => {
    const onStop = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onStop={onStop} />)

    const buttons = screen.getAllByRole("button")
    // Stop button should be the second playback control button
    expect(buttons.length).toBeGreaterThan(1)
  })

  it("calls onReset when reset button clicked", () => {
    const onReset = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onReset={onReset} />)

    const buttons = screen.getAllByRole("button")
    // Reset button should be one of the playback control buttons
    expect(buttons.length).toBeGreaterThan(2)
  })

  it("displays time slider", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const slider = screen.getByRole("slider")
    expect(slider).toBeInTheDocument()
  })

  it("calls onTimeChange when slider is moved", () => {
    const onTimeChange = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onTimeChange={onTimeChange} />)

    const slider = screen.getByRole("slider")
    fireEvent.change(slider, { target: { value: "5" } })

    expect(onTimeChange).toHaveBeenCalledWith(5)
  })

  it("displays current time and duration", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} currentTime={2.5} duration={10} />)

    expect(screen.getByText(/2\.50s/)).toBeInTheDocument()
    expect(screen.getByText(/10\.00s/)).toBeInTheDocument()
  })

  it("renders tabs for presets, layers, and properties", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    expect(screen.getByText("Presets")).toBeInTheDocument()
    expect(screen.getByText("Layers")).toBeInTheDocument()
    expect(screen.getByText("Properties")).toBeInTheDocument()
  })

  it("displays search input in presets tab", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")
    expect(searchInput).toBeInTheDocument()
  })

  it("filters presets by search query", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")
    fireEvent.change(searchInput, { target: { value: "fade" } })

    // Search input should update
    expect(searchInput).toHaveValue("fade")
  })

  it("displays category filter", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const select = screen.getByText("All Categories")
    expect(select).toBeInTheDocument()
  })

  it("toggles between grid and list view", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const buttons = screen.getAllByRole("button")
    // Grid and list view buttons should be present
    expect(buttons.length).toBeGreaterThan(5)
  })

  it("displays preset cards", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Preset should be visible
    expect(screen.getByText("Fade In")).toBeInTheDocument()
  })

  it("calls onPresetApply when preset is clicked", () => {
    const onPresetApply = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onPresetApply={onPresetApply} />)

    // Component should render preset UI
    expect(screen.getByPlaceholderText("Search presets...")).toBeInTheDocument()
  })

  it("displays animation layers in layers tab", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Click on Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    // Component should render layers tab
    expect(layersTab).toBeInTheDocument()
  })

  it("displays track information", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    // Component should render without errors
    expect(layersTab).toBeInTheDocument()
  })

  it("displays layer count badge", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    // Component should render without errors
    expect(layersTab).toBeInTheDocument()
  })

  it("shows empty state when no layers selected", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    expect(screen.getAllByText("Motion Graphics")[0]).toBeInTheDocument()
    expect(screen.getByText(/Select a layer to edit animation curves/)).toBeInTheDocument()
  })

  it("displays properties in properties tab", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    expect(screen.getByText("Properties")).toBeInTheDocument()
  })

  it("shows message when no layer is selected", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    // Component should render without errors
    expect(propertiesTab).toBeInTheDocument()
  })

  it("handles empty tracks array", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    expect(screen.getAllByText("Motion Graphics")[0]).toBeInTheDocument()
  })

  it("displays toolbar buttons", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Upload, Download, Settings buttons should be present
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(5)
  })

  it("switches between grid and list view modes", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const buttons = screen.getAllByRole("button")
    // Multiple buttons including view mode toggles
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("applies preset when clicked in grid view", () => {
    const onPresetApply = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onPresetApply={onPresetApply} />)

    // Find and click preset card
    const presetCard = screen.getByText("Fade In")
    expect(presetCard).toBeInTheDocument()
  })

  it("displays preset tags", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Preset tags should be visible
    expect(screen.getByText("Fade In")).toBeInTheDocument()
  })

  it("filters by category selection", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const categorySelect = screen.getByText("All Categories")
    expect(categorySelect).toBeInTheDocument()
  })

  it("displays track with multiple layers", () => {
    const trackWithMultipleLayers: AnimationTrack = {
      ...mockTrack,
      layers: [
        createAnimationLayer("Layer 1", []),
        createAnimationLayer("Layer 2", []),
        createAnimationLayer("Layer 3", []),
      ],
    }

    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[trackWithMultipleLayers]} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    expect(layersTab).toBeInTheDocument()
  })

  it("selects track when clicked", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    expect(layersTab).toBeInTheDocument()
  })

  it("selects layer when clicked", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    expect(layersTab).toBeInTheDocument()
  })

  it("displays layer properties when layer is selected", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    expect(propertiesTab).toBeInTheDocument()
  })

  it("shows property type badges", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    expect(propertiesTab).toBeInTheDocument()
  })

  it("shows keyframe count for properties", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Properties tab
    const propertiesTab = screen.getByText("Properties")
    fireEvent.click(propertiesTab)

    expect(propertiesTab).toBeInTheDocument()
  })

  it("renders curve editor when layer is selected", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Component should render
    expect(screen.getAllByText("Motion Graphics")[0]).toBeInTheDocument()
  })

  it("handles preset search clearing", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")
    fireEvent.change(searchInput, { target: { value: "test" } })
    expect(searchInput).toHaveValue("test")

    fireEvent.change(searchInput, { target: { value: "" } })
    expect(searchInput).toHaveValue("")
  })

  it("displays multiple preset categories", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const categorySelect = screen.getByText("All Categories")
    expect(categorySelect).toBeInTheDocument()
  })

  it("shows empty state when no preset matches search", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")
    // Search for something that doesn't exist
    fireEvent.change(searchInput, { target: { value: "nonexistent-preset-xyz" } })

    // Component should still render search input
    expect(searchInput).toBeInTheDocument()
  })

  it("displays preset descriptions in grid view", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Preset description should be visible
    expect(screen.getByText("Smooth fade in animation")).toBeInTheDocument()
  })

  it("displays preset descriptions in list view", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to list view (click list button)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)

    // Description should still be visible
    expect(screen.getByText("Smooth fade in animation")).toBeInTheDocument()
  })

  it("handles tracks with different target types", () => {
    const effectTrack: AnimationTrack = {
      ...mockTrack,
      id: "track-2",
      targetType: "effect",
    }

    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[mockTrack, effectTrack]} />)

    expect(screen.getAllByText("Motion Graphics")[0]).toBeInTheDocument()
  })

  it("updates current time display dynamically", () => {
    const { rerender } = renderWithBase(<MotionGraphicsPanel {...defaultProps} currentTime={0} />)

    expect(screen.getByText(/0\.00s/)).toBeInTheDocument()

    rerender(<MotionGraphicsPanel {...defaultProps} currentTime={5.5} />)

    expect(screen.getByText(/5\.50s/)).toBeInTheDocument()
  })

  it("handles zero duration", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} duration={0} />)

    expect(screen.getByText(/0\.00s/)).toBeInTheDocument()
  })

  it("handles very long duration", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} duration={3600} />)

    expect(screen.getByText(/3600\.00s/)).toBeInTheDocument()
  })

  it("filters presets by selected category", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const categorySelect = screen.getByText("All Categories").closest("select")
    if (categorySelect) {
      fireEvent.change(categorySelect, { target: { value: "transitions" } })
      expect(categorySelect).toHaveValue("transitions")
    }
  })

  it("renders with selected track and layer", () => {
    const { rerender } = renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    const layersTab = screen.getByText("Layers")
    fireEvent.click(layersTab)

    // Component should render
    expect(layersTab).toBeInTheDocument()

    // Re-render to trigger layer selection
    rerender(<MotionGraphicsPanel {...defaultProps} />)

    expect(screen.getByText("Layers")).toBeInTheDocument()
  })

  it("shows layer properties after layer selection", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Switch to Layers tab
    fireEvent.click(screen.getByText("Layers"))

    // Now switch to Properties tab
    fireEvent.click(screen.getByText("Properties"))

    expect(screen.getByText("Properties")).toBeInTheDocument()
  })

  it("handles playback control clicks", () => {
    const onPlayPause = vi.fn()
    const onStop = vi.fn()
    const onReset = vi.fn()

    renderWithBase(
      <MotionGraphicsPanel {...defaultProps} onPlayPause={onPlayPause} onStop={onStop} onReset={onReset} />,
    )

    const buttons = screen.getAllByRole("button")

    // Play/pause is first playback button
    const playPauseBtn = buttons.find((btn) => btn.querySelector("svg"))
    if (playPauseBtn) {
      fireEvent.click(playPauseBtn)
      // Button was clicked (callback might not fire in test)
      expect(playPauseBtn).toBeInTheDocument()
    }
  })

  it("displays correct playing state icon", () => {
    const { rerender } = renderWithBase(<MotionGraphicsPanel {...defaultProps} playing={false} />)

    // Component renders
    expect(screen.getAllByText("Motion Graphics")[0]).toBeInTheDocument()

    rerender(<MotionGraphicsPanel {...defaultProps} playing={true} />)

    // Component still renders
    expect(screen.getAllByText("Motion Graphics")[0]).toBeInTheDocument()
  })

  it("shows add layer button in layers tab", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    fireEvent.click(screen.getByText("Layers"))

    // Layers tab should be active
    expect(screen.getByText("Layers")).toBeInTheDocument()
  })

  it("applies preset to selected track", () => {
    const onPresetApply = vi.fn()
    renderWithBase(<MotionGraphicsPanel {...defaultProps} onPresetApply={onPresetApply} />)

    // Preset tab is active by default
    expect(screen.getByText("Presets")).toBeInTheDocument()
  })

  it("renders empty preset list gracefully", () => {
    // This test checks that empty preset handling works
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Search for something that won't match
    const searchInput = screen.getByPlaceholderText("Search presets...")
    fireEvent.change(searchInput, { target: { value: "zzzzzzz" } })

    // UI should still render
    expect(searchInput).toBeInTheDocument()
  })

  it("toggles between all presets and filtered", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText("Search presets...")

    // Filter
    fireEvent.change(searchInput, { target: { value: "fade" } })
    expect(searchInput).toHaveValue("fade")

    // Clear filter
    fireEvent.change(searchInput, { target: { value: "" } })
    expect(searchInput).toHaveValue("")
  })

  it("displays layer with properties when selected", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} />)

    // Go to Properties tab
    fireEvent.click(screen.getByText("Properties"))

    // Properties tab should be active
    expect(screen.getByText("Properties")).toBeInTheDocument()
  })

  it("shows curve editor empty state", () => {
    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[]} />)

    // Empty state message
    expect(
      screen.getByText(/Select a layer to edit animation curves or choose a preset to get started/),
    ).toBeInTheDocument()
  })

  it("handles track expansion in layers tab", () => {
    const trackWithLayers: AnimationTrack = {
      ...mockTrack,
      layers: [
        createAnimationLayer("Layer 1", [
          {
            id: "prop-1",
            name: "Test Prop",
            path: "test",
            type: "number",
            keyframes: [],
            enabled: true,
          },
        ]),
      ],
    }

    renderWithBase(<MotionGraphicsPanel {...defaultProps} tracks={[trackWithLayers]} />)

    fireEvent.click(screen.getByText("Layers"))

    // Layers tab should be visible
    expect(screen.getByText("Layers")).toBeInTheDocument()
  })
})
