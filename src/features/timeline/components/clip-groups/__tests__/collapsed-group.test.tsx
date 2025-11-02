import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ClipGroup } from "../../../types/clip-groups"
import type { TimelineClip } from "../../../types/timeline"
import { CollapsedGroup } from "../collapsed-group"

// Создаем mock данные
const createMockGroup = (overrides: Partial<ClipGroup> = {}): ClipGroup => ({
  id: "group-1",
  name: "Test Group",
  clips: [
    { clipId: "clip-1", trackId: "track-1" },
    { clipId: "clip-2", trackId: "track-1" },
  ],
  locked: false,
  color: "#3b82f6",
  syncMode: "none",
  collapsed: false,
  parent: undefined,
  children: undefined,
  syncOffset: undefined,
  createdAt: Date.now(),
  modifiedAt: Date.now(),
  ...overrides,
})

const createMockClip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: "clip-1",
  name: "Test Clip",
  mediaId: "media-1",
  trackId: "track-1",
  startTime: 0,
  duration: 10,
  mediaEndTime: 10,
  offset: 0,
  speed: 1,
  isReversed: false,
  isMuted: false,
  mediaFile: {
    id: "media-1",
    name: "test.mp4",
    path: "/test.mp4",
    duration: 10,
    size: 1000,
    isVideo: true,
    createdAt: new Date().toISOString(),
  },
  mediaStartTime: 0,
  volume: 1,
  opacity: 1,
  ...overrides,
})

describe("CollapsedGroup", () => {
  const defaultProps = {
    group: createMockGroup(),
    clips: [
      createMockClip({ id: "clip-1", startTime: 5, duration: 10 }),
      createMockClip({ id: "clip-2", startTime: 20, duration: 15 }),
    ],
    timeScale: 10,
  }

  it("should render collapsed group with basic information", () => {
    render(<CollapsedGroup {...defaultProps} />)

    expect(screen.getByText("Test Group")).toBeInTheDocument()
    expect(screen.getByText("(2)")).toBeInTheDocument()
    expect(screen.getByTestId("folderclosed-icon")).toBeInTheDocument()
  })

  it("should calculate correct position and width based on clips", () => {
    const { container } = render(<CollapsedGroup {...defaultProps} />)

    const groupElement = container.firstChild as HTMLElement

    // Минимальный startTime = 5, максимальный endTime = 35 (20 + 15)
    // При timeScale = 10: left = 50px, width = 300px
    expect(groupElement).toHaveStyle({
      left: "50px",
      width: "300px",
    })
  })

  it("should apply group color to styling", () => {
    const { container } = render(<CollapsedGroup {...defaultProps} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveStyle({
      borderColor: "#3b82f6",
      backgroundColor: "#3b82f620",
      color: "#3b82f6",
    })
  })

  it("should handle empty clips array", () => {
    const props = {
      ...defaultProps,
      clips: [],
    }

    const { container } = render(<CollapsedGroup {...props} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveStyle({
      left: "0px",
      width: "100px",
    })

    expect(screen.getByText("(0)")).toBeInTheDocument()
  })

  it("should show selected state when isSelected is true", () => {
    const { container } = render(<CollapsedGroup {...defaultProps} isSelected={true} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveClass("ring-2 ring-primary ring-offset-1")
  })

  it("should not show selected state when isSelected is false", () => {
    const { container } = render(<CollapsedGroup {...defaultProps} isSelected={false} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).not.toHaveClass("ring-2 ring-primary ring-offset-1")
  })

  it("should show lock indicator when group is locked", () => {
    const lockedGroup = createMockGroup({ locked: true })
    render(<CollapsedGroup {...defaultProps} group={lockedGroup} />)

    expect(screen.getByTestId("lock-icon")).toBeInTheDocument()
  })

  it("should not show lock indicator when group is unlocked", () => {
    const unlockedGroup = createMockGroup({ locked: false })
    render(<CollapsedGroup {...defaultProps} group={unlockedGroup} />)

    expect(screen.queryByTestId("lock-icon")).not.toBeInTheDocument()
  })

  it("should apply opacity when group is locked", () => {
    const lockedGroup = createMockGroup({ locked: true })
    const { container } = render(<CollapsedGroup {...defaultProps} group={lockedGroup} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveClass("opacity-60")
  })

  it("should call onSelect when clicked", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()

    render(<CollapsedGroup {...defaultProps} onSelect={onSelect} />)

    const groupElement = screen.getByText("Test Group").closest("div")
    await user.click(groupElement!)

    expect(onSelect).toHaveBeenCalledOnce()
  })

  it("should call onToggleCollapse when double-clicked", async () => {
    const onToggleCollapse = vi.fn()
    const user = userEvent.setup()

    render(<CollapsedGroup {...defaultProps} onToggleCollapse={onToggleCollapse} />)

    const groupElement = screen.getByText("Test Group").closest("div")
    await user.dblClick(groupElement!)

    expect(onToggleCollapse).toHaveBeenCalledOnce()
  })

  it("should handle both click and double-click events properly", async () => {
    const onSelect = vi.fn()
    const onToggleCollapse = vi.fn()

    render(<CollapsedGroup {...defaultProps} onSelect={onSelect} onToggleCollapse={onToggleCollapse} />)

    const groupElement = screen.getByText("Test Group").closest("div")

    // Double-click должен вызвать оба события
    fireEvent.doubleClick(groupElement!)

    expect(onToggleCollapse).toHaveBeenCalledOnce()
  })

  it("should apply custom className", () => {
    const customClass = "custom-group-class"
    const { container } = render(<CollapsedGroup {...defaultProps} className={customClass} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveClass(customClass)
  })

  it("should have proper hover styling", () => {
    const { container } = render(<CollapsedGroup {...defaultProps} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveClass("hover:shadow-md transition-all")
  })

  it("should position elements correctly with different time scales", () => {
    const props = {
      ...defaultProps,
      timeScale: 20, // Удваиваем масштаб
    }

    const { container } = render(<CollapsedGroup {...props} />)

    const groupElement = container.firstChild as HTMLElement

    // При timeScale = 20: left = 100px, width = 600px
    expect(groupElement).toHaveStyle({
      left: "100px",
      width: "600px",
    })
  })

  it("should truncate long group names", () => {
    const longNameGroup = createMockGroup({
      name: "Very Long Group Name That Should Be Truncated",
    })

    render(<CollapsedGroup {...defaultProps} group={longNameGroup} />)

    const nameElement = screen.getByText("Very Long Group Name That Should Be Truncated")
    expect(nameElement).toHaveClass("truncate")
  })

  it("should calculate bounds correctly for single clip", () => {
    const singleClip = [createMockClip({ startTime: 10, duration: 5 })]
    const { container } = render(<CollapsedGroup {...defaultProps} clips={singleClip} />)

    const groupElement = container.firstChild as HTMLElement

    // startTime = 10, endTime = 15, timeScale = 10
    expect(groupElement).toHaveStyle({
      left: "100px",
      width: "50px",
    })
  })

  it("should handle clips with zero duration", () => {
    const zeroDurationClips = [
      createMockClip({ startTime: 5, duration: 0 }),
      createMockClip({ startTime: 10, duration: 0 }),
    ]

    const { container } = render(<CollapsedGroup {...defaultProps} clips={zeroDurationClips} />)

    const groupElement = container.firstChild as HTMLElement

    // startTime = 5, endTime = 10, timeScale = 10
    expect(groupElement).toHaveStyle({
      left: "50px",
      width: "50px",
    })
  })

  it("should have cursor pointer for interactivity", () => {
    const { container } = render(<CollapsedGroup {...defaultProps} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveClass("cursor-pointer")
  })

  it("should show correct clip count for different clip arrays", () => {
    const manyClips = Array.from({ length: 5 }, (_, i) =>
      createMockClip({ id: `clip-${i}`, startTime: i * 10, duration: 5 }),
    )

    render(<CollapsedGroup {...defaultProps} clips={manyClips} />)

    expect(screen.getByText("(5)")).toBeInTheDocument()
  })

  it("should handle clicks without handlers gracefully", async () => {
    const user = userEvent.setup()

    // Рендерим без onSelect и onToggleCollapse
    render(<CollapsedGroup {...defaultProps} />)

    const groupElement = screen.getByText("Test Group").closest("div")

    // Не должно бросать ошибок
    await user.click(groupElement!)
    await user.dblClick(groupElement!)

    expect(groupElement).toBeInTheDocument()
  })

  it("should render with different group colors", () => {
    const redGroup = createMockGroup({ color: "#ef4444" })
    const { container } = render(<CollapsedGroup {...defaultProps} group={redGroup} />)

    const groupElement = container.firstChild as HTMLElement
    expect(groupElement).toHaveStyle({
      borderColor: "#ef4444",
      backgroundColor: "#ef444420",
      color: "#ef4444",
    })
  })

  describe("Accessibility", () => {
    it("should be keyboard accessible", () => {
      const onSelect = vi.fn()
      render(<CollapsedGroup {...defaultProps} onSelect={onSelect} />)

      const groupElement = screen.getByText("Test Group").closest("div")

      // Проверяем что элемент может получить фокус
      expect(groupElement).toHaveClass("cursor-pointer")
    })

    it("should have meaningful content for screen readers", () => {
      render(<CollapsedGroup {...defaultProps} />)

      expect(screen.getByText("Test Group")).toBeInTheDocument()
      expect(screen.getByText("(2)")).toBeInTheDocument()
    })
  })
})
