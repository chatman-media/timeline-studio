/**
 * Tests for EmptyState component
 */

import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MediaInfo } from "@/domains/media-management/types"
import { EmptyState } from "../empty-state"

describe("EmptyState", () => {
  const mockOnSelectFiles = vi.fn()
  const mockOnStartAnalysis = vi.fn()
  const mockOnSelectionChange = vi.fn()

  // Create a mock media pool with some files
  const createMockMediaPool = (): Map<string, MediaInfo> => {
    const pool = new Map<string, MediaInfo>()
    pool.set("file1", {
      id: "file1",
      path: "/test/video1.mp4",
      name: "video1.mp4",
      type: "Video",
      duration: 120,
    })
    pool.set("file2", {
      id: "file2",
      path: "/test/video2.mp4",
      name: "video2.mp4",
      type: "Video",
      duration: 60,
    })
    return pool
  }

  const emptyMediaPool = new Map<string, MediaInfo>()

  const defaultProps = {
    onSelectFiles: mockOnSelectFiles,
    onStartAnalysis: mockOnStartAnalysis,
    mediaPool: createMockMediaPool(),
    selectedFileIds: new Set<string>(),
    onSelectionChange: mockOnSelectionChange,
    currentSettings: {
      mode: "balanced",
      analyzers: ["audio_quality", "scene_detection"],
    },
    isAnalyzing: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders with files in media pool", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("Выберите файлы для анализа")).toBeInTheDocument()
    expect(screen.getByText(/2 файлов в медиапуле/)).toBeInTheDocument()
  })

  it("renders empty pool message when no files", () => {
    render(<EmptyState {...defaultProps} mediaPool={emptyMediaPool} />)

    expect(screen.getByText(/Медиапул пуст/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Открыть Browser для импорта/ })).toBeInTheDocument()
  })

  it("displays current settings", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("balanced")).toBeInTheDocument()
    // When multiple analyzers selected, shows "X выбрано" instead of list
    expect(screen.getByText("2 выбрано")).toBeInTheDocument()
  })

  it("displays 'не выбраны' when no analyzers selected", () => {
    render(
      <EmptyState
        {...defaultProps}
        currentSettings={{
          mode: "balanced",
          analyzers: [],
        }}
      />,
    )

    expect(screen.getByText("не выбраны")).toBeInTheDocument()
    expect(screen.getByText(/Выберите хотя бы один анализатор в настройках/)).toBeInTheDocument()
  })

  it("calls onSelectFiles when import button is clicked", async () => {
    const user = userEvent.setup()
    render(<EmptyState {...defaultProps} />)

    const button = screen.getByRole("button", { name: /Импорт/ })
    await user.click(button)

    expect(mockOnSelectFiles).toHaveBeenCalledTimes(1)
  })

  it("displays v3 badge", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("v3")).toBeInTheDocument()
  })

  it("shows file list from media pool", () => {
    render(<EmptyState {...defaultProps} />)

    expect(screen.getByText("video1.mp4")).toBeInTheDocument()
    expect(screen.getByText("video2.mp4")).toBeInTheDocument()
  })

  it("enables start analysis button when files selected", () => {
    render(<EmptyState {...defaultProps} selectedFileIds={new Set(["file1"])} />)

    const button = screen.getByRole("button", { name: /Начать анализ/ })
    expect(button).not.toBeDisabled()
  })

  it("disables start analysis button when no files selected", () => {
    render(<EmptyState {...defaultProps} />)

    const button = screen.getByRole("button", { name: /Выберите файлы/ })
    expect(button).toBeDisabled()
  })

  it("calls onStartAnalysis when start button clicked", async () => {
    const user = userEvent.setup()
    const selectedIds = new Set(["file1", "file2"])
    render(<EmptyState {...defaultProps} selectedFileIds={selectedIds} />)

    const button = screen.getByRole("button", { name: /Начать анализ/ })
    await user.click(button)

    expect(mockOnStartAnalysis).toHaveBeenCalledWith(selectedIds)
  })

  it("shows analyzing state", () => {
    render(<EmptyState {...defaultProps} selectedFileIds={new Set(["file1"])} isAnalyzing={true} />)

    expect(screen.getByRole("button", { name: /Анализ\.\.\./ })).toBeInTheDocument()
  })

  it("disables buttons during analysis", () => {
    render(<EmptyState {...defaultProps} selectedFileIds={new Set(["file1"])} isAnalyzing={true} />)

    const startButton = screen.getByRole("button", { name: /Анализ\.\.\./ })
    const importButton = screen.getByRole("button", { name: /Импорт/ })

    expect(startButton).toBeDisabled()
    expect(importButton).toBeDisabled()
  })
})
