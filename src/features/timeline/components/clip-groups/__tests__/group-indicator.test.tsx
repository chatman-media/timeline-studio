/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ClipGroup } from "../../../types/clip-groups"
import { GroupIndicator } from "../group-indicator"

// Создаем mock данные
const createMockGroup = (overrides: Partial<ClipGroup> = {}): ClipGroup => ({
  id: "group-1",
  name: "Test Group",
  clips: [
    { clipId: "clip-1", trackId: "track-1" },
    { clipId: "clip-2", trackId: "track-1" },
    { clipId: "clip-3", trackId: "track-2" },
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

describe("GroupIndicator", () => {
  const defaultProps = {
    group: createMockGroup(),
  }

  it("should render group indicator with basic information", () => {
    render(<GroupIndicator {...defaultProps} />)

    expect(screen.getByText("Test Group")).toBeInTheDocument()
    expect(screen.getByText("(3)")).toBeInTheDocument()
    expect(screen.getByTestId("users-icon")).toBeInTheDocument()
  })

  it("should apply group color to styling", () => {
    const { container } = render(<GroupIndicator {...defaultProps} />)

    const indicatorElement = container.firstChild as HTMLElement
    expect(indicatorElement).toHaveStyle({
      backgroundColor: "#3b82f620",
      borderColor: "#3b82f6",
      color: "#3b82f6",
    })
  })

  it("should render with different group colors", () => {
    const redGroup = createMockGroup({ color: "#ef4444" })
    const { container } = render(<GroupIndicator group={redGroup} />)

    const indicatorElement = container.firstChild as HTMLElement
    expect(indicatorElement).toHaveStyle({
      backgroundColor: "#ef444420",
      borderColor: "#ef4444",
      color: "#ef4444",
    })
  })

  describe("Collapse/Expand functionality", () => {
    it("should show chevron right when group is collapsed", () => {
      const collapsedGroup = createMockGroup({ collapsed: true })
      render(<GroupIndicator group={collapsedGroup} onToggleCollapse={vi.fn()} />)

      expect(screen.getByTestId("chevronright-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("chevrondown-icon")).not.toBeInTheDocument()
    })

    it("should show chevron down when group is expanded", () => {
      const expandedGroup = createMockGroup({ collapsed: false })
      render(<GroupIndicator group={expandedGroup} onToggleCollapse={vi.fn()} />)

      expect(screen.getByTestId("chevrondown-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("chevronright-icon")).not.toBeInTheDocument()
    })

    it("should not show collapse button when onToggleCollapse is not provided", () => {
      render(<GroupIndicator {...defaultProps} />)

      expect(screen.queryByTestId("chevrondown-icon")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chevronright-icon")).not.toBeInTheDocument()
    })

    it("should call onToggleCollapse when collapse button is clicked", async () => {
      const onToggleCollapse = vi.fn()
      const user = userEvent.setup()

      render(<GroupIndicator {...defaultProps} onToggleCollapse={onToggleCollapse} />)

      const collapseButton = screen.getByTitle("Collapse group")
      await user.click(collapseButton)

      expect(onToggleCollapse).toHaveBeenCalledOnce()
    })

    it("should show correct tooltip for collapsed state", () => {
      const collapsedGroup = createMockGroup({ collapsed: true })
      render(<GroupIndicator group={collapsedGroup} onToggleCollapse={vi.fn()} />)

      const expandButton = screen.getByTitle("Expand group")
      expect(expandButton).toBeInTheDocument()
      expect(expandButton).toHaveAttribute("title", "Expand group")
    })

    it("should show correct tooltip for expanded state", () => {
      const expandedGroup = createMockGroup({ collapsed: false })
      render(<GroupIndicator group={expandedGroup} onToggleCollapse={vi.fn()} />)

      const collapseButton = screen.getByTitle("Collapse group")
      expect(collapseButton).toBeInTheDocument()
      expect(collapseButton).toHaveAttribute("title", "Collapse group")
    })

    it("should have proper hover styling for collapse button", () => {
      render(<GroupIndicator {...defaultProps} onToggleCollapse={vi.fn()} />)

      const collapseButton = screen.getByTitle("Collapse group")
      expect(collapseButton).toHaveClass("hover:bg-white/20 transition-colors")
    })
  })

  describe("Lock/Unlock functionality", () => {
    it("should show lock icon when group is locked", () => {
      const lockedGroup = createMockGroup({ locked: true })
      render(<GroupIndicator group={lockedGroup} onToggleLock={vi.fn()} />)

      expect(screen.getByTestId("lock-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("unlock-icon")).not.toBeInTheDocument()
    })

    it("should show unlock icon when group is unlocked", () => {
      const unlockedGroup = createMockGroup({ locked: false })
      render(<GroupIndicator group={unlockedGroup} onToggleLock={vi.fn()} />)

      expect(screen.getByTestId("unlock-icon")).toBeInTheDocument()
      expect(screen.queryByTestId("lock-icon")).not.toBeInTheDocument()
    })

    it("should not show lock button when onToggleLock is not provided", () => {
      const lockedGroup = createMockGroup({ locked: true })
      render(<GroupIndicator group={lockedGroup} />)

      expect(screen.queryByTestId("lock-icon")).not.toBeInTheDocument()
      expect(screen.queryByTestId("unlock-icon")).not.toBeInTheDocument()
    })

    it("should call onToggleLock when lock button is clicked", async () => {
      const onToggleLock = vi.fn()
      const user = userEvent.setup()

      render(<GroupIndicator {...defaultProps} onToggleLock={onToggleLock} />)

      const lockButton = screen.getByTitle("Lock group")
      await user.click(lockButton)

      expect(onToggleLock).toHaveBeenCalledOnce()
    })

    it("should show correct tooltip for locked state", () => {
      const lockedGroup = createMockGroup({ locked: true })
      render(<GroupIndicator group={lockedGroup} onToggleLock={vi.fn()} />)

      const unlockButton = screen.getByTitle("Unlock group")
      expect(unlockButton).toBeInTheDocument()
      expect(unlockButton).toHaveAttribute("title", "Unlock group")
    })

    it("should show correct tooltip for unlocked state", () => {
      const unlockedGroup = createMockGroup({ locked: false })
      render(<GroupIndicator group={unlockedGroup} onToggleLock={vi.fn()} />)

      const lockButton = screen.getByTitle("Lock group")
      expect(lockButton).toBeInTheDocument()
      expect(lockButton).toHaveAttribute("title", "Lock group")
    })

    it("should have proper hover styling for lock button", () => {
      render(<GroupIndicator {...defaultProps} onToggleLock={vi.fn()} />)

      const lockButton = screen.getByTitle("Lock group")
      expect(lockButton).toHaveClass("hover:bg-white/20 transition-colors ml-auto")
    })

    it("should show unlock icon with opacity when unlocked", () => {
      const unlockedGroup = createMockGroup({ locked: false })
      render(<GroupIndicator group={unlockedGroup} onToggleLock={vi.fn()} />)

      const unlockIcon = screen.getByTestId("unlock-icon")
      expect(unlockIcon).toHaveClass("opacity-50")
    })
  })

  describe("Group information display", () => {
    it("should truncate long group names", () => {
      const longNameGroup = createMockGroup({
        name: "Very Long Group Name That Should Be Truncated In The UI",
      })

      render(<GroupIndicator group={longNameGroup} />)

      const nameElement = screen.getByText("Very Long Group Name That Should Be Truncated In The UI")
      expect(nameElement).toHaveClass("truncate max-w-[100px]")
    })

    it("should display correct clip count", () => {
      const groupWithManyClips = createMockGroup({
        clips: Array.from({ length: 10 }, (_, i) => ({
          clipId: `clip-${i}`,
          trackId: `track-${i}`,
        })),
      })

      render(<GroupIndicator group={groupWithManyClips} />)

      expect(screen.getByText("(10)")).toBeInTheDocument()
    })

    it("should handle empty clips array", () => {
      const emptyGroup = createMockGroup({ clips: [] })
      render(<GroupIndicator group={emptyGroup} />)

      expect(screen.getByText("(0)")).toBeInTheDocument()
    })

    it("should show opacity on clip count", () => {
      render(<GroupIndicator {...defaultProps} />)

      const clipCountElement = screen.getByText("(3)")
      expect(clipCountElement).toHaveClass("opacity-70")
    })
  })

  describe("Layout and styling", () => {
    it("should apply custom className", () => {
      const customClass = "custom-indicator-class"
      const { container } = render(<GroupIndicator {...defaultProps} className={customClass} />)

      const indicatorElement = container.firstChild as HTMLElement
      expect(indicatorElement).toHaveClass(customClass)
    })

    it("should have proper base styling classes", () => {
      const { container } = render(<GroupIndicator {...defaultProps} />)

      const indicatorElement = container.firstChild as HTMLElement
      expect(indicatorElement).toHaveClass(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-opacity-20 border",
      )
    })

    it("should position lock button with ml-auto when present", () => {
      render(<GroupIndicator {...defaultProps} onToggleLock={vi.fn()} />)

      const lockButton = screen.getByTitle("Lock group")
      expect(lockButton).toHaveClass("ml-auto")
    })
  })

  describe("Interaction combinations", () => {
    it("should render both collapse and lock buttons when both handlers provided", () => {
      render(<GroupIndicator {...defaultProps} onToggleCollapse={vi.fn()} onToggleLock={vi.fn()} />)

      expect(screen.getByTitle("Collapse group")).toBeInTheDocument()
      expect(screen.getByTitle("Lock group")).toBeInTheDocument()
    })

    it("should work with locked collapsed group", () => {
      const lockedCollapsedGroup = createMockGroup({
        locked: true,
        collapsed: true,
      })

      render(<GroupIndicator group={lockedCollapsedGroup} onToggleCollapse={vi.fn()} onToggleLock={vi.fn()} />)

      expect(screen.getByTestId("chevronright-icon")).toBeInTheDocument()
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument()
    })

    it("should handle clicks on buttons independently", async () => {
      const onToggleCollapse = vi.fn()
      const onToggleLock = vi.fn()
      const user = userEvent.setup()

      render(<GroupIndicator {...defaultProps} onToggleCollapse={onToggleCollapse} onToggleLock={onToggleLock} />)

      const collapseButton = screen.getByTitle("Collapse group")
      const lockButton = screen.getByTitle("Lock group")

      await user.click(collapseButton)
      expect(onToggleCollapse).toHaveBeenCalledOnce()
      expect(onToggleLock).not.toHaveBeenCalled()

      await user.click(lockButton)
      expect(onToggleLock).toHaveBeenCalledOnce()
      expect(onToggleCollapse).toHaveBeenCalledOnce() // Остается 1
    })
  })

  describe("Accessibility", () => {
    it("should have accessible button roles", () => {
      render(<GroupIndicator {...defaultProps} onToggleCollapse={vi.fn()} onToggleLock={vi.fn()} />)

      const buttons = screen.getAllByRole("button")
      expect(buttons).toHaveLength(2)

      buttons.forEach((button) => {
        expect(button).toHaveAttribute("title")
      })
    })

    it("should provide meaningful titles for buttons", () => {
      const collapsedGroup = createMockGroup({ collapsed: true, locked: true })
      render(<GroupIndicator group={collapsedGroup} onToggleCollapse={vi.fn()} onToggleLock={vi.fn()} />)

      expect(screen.getByTitle("Expand group")).toBeInTheDocument()
      expect(screen.getByTitle("Unlock group")).toBeInTheDocument()
    })

    it("should be keyboard accessible", async () => {
      const onToggleCollapse = vi.fn()
      const user = userEvent.setup()

      render(<GroupIndicator {...defaultProps} onToggleCollapse={onToggleCollapse} />)

      const collapseButton = screen.getByTitle("Collapse group")

      // Фокус на кнопке
      collapseButton.focus()
      expect(collapseButton).toHaveFocus()

      // Активация через Enter
      await user.keyboard("{Enter}")
      expect(onToggleCollapse).toHaveBeenCalledOnce()
    })
  })
})
