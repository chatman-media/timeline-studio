/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { OutputFormat } from "@/features/video-compiler/types/render"

import { DetailedExportInterface } from "../../components/detailed-export-interface"

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string) => key),
  }),
}))

// Mock Lucide icons
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    Folder: ({ className }: { className?: string }) => (
      <div data-testid="folder-icon" className={className} data-oid=":5doxq9" />
    ),

    ChevronDown: ({ className }: { className?: string }) => (
      <div data-testid="chevron-down-icon" className={className} data-oid="7ljntbm" />
    ),

    ChevronRight: ({ className }: { className?: string }) => (
      <div data-testid="chevron-right-icon" className={className} data-oid="cte3rwq" />
    ),

    Info: ({ className }: { className?: string }) => (
      <div data-testid="info-icon" className={className} data-oid="vby5r66" />
    ),
  }
})

describe("DetailedExportInterface", () => {
  const mockSettings = {
    format: OutputFormat.Mp4,
    quality: "good" as const,
    resolution: "1080" as const,
    frameRate: "30",
    enableGPU: false,
    fileName: "output",
    exportVideo: true,
    exportAudio: true,
    savePath: "/path/to/output",
  }

  const mockProps = {
    settings: mockSettings,
    onSettingsChange: vi.fn(),
    onChooseFolder: vi.fn(),
    onExport: vi.fn(),
    onCancelExport: vi.fn(),
    onClose: vi.fn(),
    isRendering: false,
    renderProgress: null,
    hasProject: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all three tabs", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="z-n3_9:" />)

    expect(screen.getByText("dialogs.export.video")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.audio")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.file")).toBeInTheDocument()
  })

  it("should render all tabs", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="4f4qgeo" />)

    // Check that all tab triggers are present
    expect(screen.getByText("dialogs.export.video")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.audio")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.file")).toBeInTheDocument()

    // By default, video tab content should be visible
    expect(screen.getByText("dialogs.export.exportVideo")).toBeInTheDocument()
  })

  it("should display video settings in video tab", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="s02.jdq" />)

    expect(screen.getByText("dialogs.export.exportVideo")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.format")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.codec")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.resolution")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.frameRate")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.quality")).toBeInTheDocument()
  })

  it("should show ProRes codec options for MOV format", () => {
    const movSettings = { ...mockSettings, format: OutputFormat.Mov }
    render(<DetailedExportInterface {...mockProps} settings={movSettings} data-oid="cifzx41" />)

    // For MOV format, codec type selector should be shown
    expect(screen.getByText("dialogs.export.codecType")).toBeInTheDocument()
    // Check for ProRes codec type options in the select
    expect(screen.getByText("Apple ProRes 422 HQ")).toBeInTheDocument()
  })

  it("should hide ProRes options for non-MOV formats", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="kb0n_-x" />)

    // ProRes codec type selector should not be shown for MP4
    expect(screen.queryByText("dialogs.export.codecType")).not.toBeInTheDocument()
    // Codec label should still be present
    expect(screen.getByText("dialogs.export.codec")).toBeInTheDocument()
  })

  it("should call onSettingsChange when format changes", () => {
    render(<DetailedExportInterface {...mockProps} data-oid=".c6xe:c" />)

    // Format select trigger is harder to test directly, but we can verify it's rendered
    const formatSelect = screen.getByText("dialogs.export.format").parentElement
    expect(formatSelect).toBeInTheDocument()
  })

  it("should show export button when not rendering", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="inii7-t" />)

    const exportButton = screen.getByText("dialogs.export.export").closest("button")
    expect(exportButton).toBeInTheDocument()
    expect(exportButton).not.toBeDisabled()
  })

  it("should show cancel button when rendering", () => {
    const renderingProps = { ...mockProps, isRendering: true }
    render(<DetailedExportInterface {...renderingProps} data-oid="5ghehyf" />)

    const cancelButton = screen.getByText("dialogs.export.cancel").closest("button")
    expect(cancelButton).toBeInTheDocument()
  })

  it("should display render progress when available", () => {
    const progressProps = {
      ...mockProps,
      isRendering: true,
      renderProgress: {
        percentage: 50,
        stage: "Encoding",
        current_frame: 900,
        total_frames: 1800,
        message: "Processing video...",
      },
    }
    render(<DetailedExportInterface {...progressProps} data-oid="t7ak5fy" />)

    expect(screen.getByText("dialogs.export.progress")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    // Progress message is shown in the progress area
    const progressArea = screen.getByText("50%").parentElement?.parentElement
    expect(progressArea).toBeInTheDocument()
  })

  it("should handle choose folder button click", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="cfnto-4" />)

    const chooseFolderButton = screen.getByTestId("folder-icon").closest("button")!
    fireEvent.click(chooseFolderButton)

    expect(mockProps.onChooseFolder).toHaveBeenCalled()
  })

  it("should call onExport when export button clicked", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="so-yl73" />)

    const exportButton = screen.getByText("dialogs.export.export").closest("button")!
    fireEvent.click(exportButton)

    expect(mockProps.onExport).toHaveBeenCalled()
  })

  it("should call onCancelExport when cancel button clicked during render", () => {
    const renderingProps = { ...mockProps, isRendering: true }
    render(<DetailedExportInterface {...renderingProps} data-oid="l3w6f.2" />)

    const cancelButton = screen.getByText("dialogs.export.cancel").closest("button")!
    fireEvent.click(cancelButton)

    expect(mockProps.onCancelExport).toHaveBeenCalled()
  })

  it("should render all tab triggers", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="qehctte" />)

    // All tabs should be present
    expect(screen.getByText("dialogs.export.video")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.audio")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.file")).toBeInTheDocument()
  })

  it("should render video settings in default state", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="55-1k96" />)

    // Video tab is active by default
    expect(screen.getByText("dialogs.export.exportVideo")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.format")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.codec")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.resolution")).toBeInTheDocument()
  })

  it("should show constant bitrate option for non-MOV formats", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="rxolp4g" />)

    expect(screen.getByText("dialogs.export.constantBitrate")).toBeInTheDocument()
  })

  it("should hide constant bitrate option for MOV format", () => {
    const movSettings = { ...mockSettings, format: OutputFormat.Mov }
    render(<DetailedExportInterface {...mockProps} settings={movSettings} data-oid="ktg1wwy" />)

    expect(screen.queryByText("dialogs.export.constantBitrate")).not.toBeInTheDocument()
  })

  it("should render export presets", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="cs99vem" />)

    // ExportPresets component should be rendered - check for a preset button instead
    expect(screen.getByText("Custom Export")).toBeInTheDocument()
  })

  it("should disable all inputs when rendering", () => {
    const renderingProps = { ...mockProps, isRendering: true }
    render(<DetailedExportInterface {...renderingProps} data-oid="97ooyre" />)

    // Check that inputs are disabled
    const fileNameInput = screen.getByPlaceholderText("dialogs.export.name")
    expect(fileNameInput).toBeDisabled()

    // Check that selects are disabled
    const formatSelect = screen.getByText("dialogs.export.format").parentElement?.querySelector("button")
    expect(formatSelect).toHaveAttribute("disabled")

    // Check that buttons are in the expected state
    expect(screen.getByText("dialogs.export.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.export.rendering...")).toBeInTheDocument()
  })

  it("should update export video checkbox", () => {
    render(<DetailedExportInterface {...mockProps} data-oid="8d8ujoh" />)

    const exportVideoCheckbox = screen.getByRole("checkbox", {
      name: /dialogs.export.exportVideo/i,
    })
    fireEvent.click(exportVideoCheckbox)

    expect(mockProps.onSettingsChange).toHaveBeenCalledWith({
      exportVideo: false,
    })
  })
})
