/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MediaFile } from "@timeline-studio/domains/media-management"
import { ApplyButton } from "@/features/browser/components/layout/apply-button"

// Mock the logger
const { mockInfoSync, mockErrorSync, mockDebugSync } = vi.hoisted(() => ({
  mockInfoSync: vi.fn(),
  mockErrorSync: vi.fn(),
  mockDebugSync: vi.fn(),
}))

vi.mock("@/lib/tauri-logger", () => ({
  createLogger: () => ({
    infoSync: mockInfoSync,
    errorSync: mockErrorSync,
    debugSync: mockDebugSync,
  }),
}))

// Mock usePlayer hook
const { mockPlayerSetSource, mockPlayerSetMedia, mockSetCurrentVideo, mockPlay } = vi.hoisted(() => ({
  mockPlayerSetSource: vi.fn(),
  mockPlayerSetMedia: vi.fn(),
  mockSetCurrentVideo: vi.fn(),
  mockPlay: vi.fn(),
}))

vi.mock("@/features/video-player", () => ({
  usePlayer: () => ({
    playerSetSource: mockPlayerSetSource,
    playerSetMedia: mockPlayerSetMedia,
    setCurrentVideo: mockSetCurrentVideo,
    play: mockPlay,
  }),
}))

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe("ApplyButton", () => {
  const mockFile: MediaFile = {
    id: "file-1",
    name: "test-video.mp4",
    path: "/path/to/test-video.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 10,
    size: 1024,
  } as MediaFile

  beforeEach(() => {
    vi.clearAllMocks()
    mockPlayerSetSource.mockResolvedValue(undefined)
    mockPlayerSetMedia.mockResolvedValue(undefined)
    mockPlay.mockResolvedValue(undefined)
  })

  it("should render apply button", () => {
    render(<ApplyButton file={mockFile} size={150} hoverTime={null} data-oid="apply-test" />)

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("should send file to player when clicked", async () => {
    const hoverTime = 5.5

    render(<ApplyButton file={mockFile} size={150} hoverTime={hoverTime} data-oid="apply-test" />)

    const button = screen.getByRole("button")
    fireEvent.click(button)

    // Wait for async operations
    await vi.waitFor(() => {
      expect(mockSetCurrentVideo).toHaveBeenCalledWith(mockFile)
      expect(mockPlayerSetSource).toHaveBeenCalledWith("browser")
      expect(mockPlayerSetMedia).toHaveBeenCalledWith("file-1", hoverTime)
      expect(mockPlay).toHaveBeenCalled()
    })
  })

  it("should use 0 as time when hoverTime is null", async () => {
    render(<ApplyButton file={mockFile} size={150} hoverTime={null} data-oid="apply-test" />)

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await vi.waitFor(() => {
      expect(mockPlayerSetMedia).toHaveBeenCalledWith("file-1", 0)
    })
  })

  it("should stop event propagation", async () => {
    const containerClick = vi.fn()

    render(
      <div onClick={containerClick} data-oid="container">
        <ApplyButton file={mockFile} size={150} hoverTime={null} data-oid="apply-test" />
      </div>,
    )

    const button = screen.getByRole("button")
    await fireEvent.click(button)

    expect(containerClick).not.toHaveBeenCalled()
  })

  it("should render Play icon", () => {
    const { container } = render(<ApplyButton file={mockFile} size={150} hoverTime={null} data-oid="apply-test" />)

    const icon = container.querySelector("svg")
    expect(icon).toBeInTheDocument()
  })

  it("should have correct accessibility attributes", () => {
    render(<ApplyButton file={mockFile} size={150} hoverTime={null} data-oid="apply-test" />)

    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "button")
    expect(button).toHaveAttribute("title", "browser.media.applyToPlayer")
  })
})
