import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ConflictInfo } from "../../services/shortcuts-conflicts"
import { ConflictIndicator } from "../../components/conflict-indicator"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

describe("ConflictIndicator", () => {
  const user = userEvent.setup()

  const mockConflicts: ConflictInfo[] = [
    {
      key: "Cmd+S",
      shortcuts: [
        {
          id: "save-project",
          name: "Save Project",
          category: "file",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
        {
          id: "save-preset",
          name: "Save Preset",
          category: "presets",
          keys: ["Cmd+S"],
          enabled: true,
          context: "global",
        },
      ],
      severity: "error",
      message: "Duplicate key binding",
    },
    {
      key: "Cmd+O",
      shortcuts: [
        {
          id: "open-project",
          name: "Open Project",
          category: "file",
          keys: ["Cmd+O"],
          enabled: true,
          context: "global",
        },
        {
          id: "open-file",
          name: "Open File",
          category: "file",
          keys: ["Cmd+O"],
          enabled: true,
          context: "timeline",
        },
      ],
      severity: "warning",
      message: "Context-specific conflict",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("Component Rendering", () => {
    it("should not render when conflicts array is empty", () => {
      const { container } = render(<ConflictIndicator conflicts={[]} />)

      expect(container.firstChild).toBeNull()
    })

    it("should render warning icon for warning severity", () => {
      render(<ConflictIndicator conflicts={[mockConflicts[1]]} />)

      const icon = screen.getByRole("alert")
      expect(icon).toBeInTheDocument()

      // Check for yellow color class (warning)
      const svg = icon.querySelector("svg")
      expect(svg).toHaveClass("text-yellow-500", "dark:text-yellow-400")
    })

    it("should render error icon for error severity", () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")
      expect(icon).toBeInTheDocument()

      // Check for red color class (error)
      const svg = icon.querySelector("svg")
      expect(svg).toHaveClass("text-red-500", "dark:text-red-400")
    })

    it("should have accessible aria-label", () => {
      render(<ConflictIndicator conflicts={mockConflicts} />)

      const alert = screen.getByRole("alert")
      expect(alert).toHaveAttribute("aria-label", "Обнаружен конфликт")
    })

    it("should apply custom className", () => {
      const { container } = render(<ConflictIndicator conflicts={mockConflicts} className="custom-class" />)

      const indicator = container.querySelector(".custom-class")
      expect(indicator).toBeInTheDocument()
    })
  })

  describe("Tooltip Content", () => {
    it("should show tooltip on hover", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Критический конфликт")).toBeInTheDocument()
      })
    })

    it("should display error severity title", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Критический конфликт")).toBeInTheDocument()
      })
    })

    it("should display warning severity title", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[1]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Потенциальный конфликт")).toBeInTheDocument()
      })
    })

    it("should display conflicting key", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Cmd+S")).toBeInTheDocument()
      })
    })

    it("should display all conflicting shortcuts", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Save Project")).toBeInTheDocument()
        expect(screen.getByText("Save Preset")).toBeInTheDocument()
      })
    })

    it("should display context for non-global shortcuts", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[1]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText(/timeline/)).toBeInTheDocument()
      })
    })

    it("should not display context for global shortcuts", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        const tooltip = screen.getByText("Save Project").closest("div")
        expect(tooltip?.textContent).not.toContain("global")
      })
    })

    it("should display multiple conflicts", async () => {
      render(<ConflictIndicator conflicts={mockConflicts} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        // Should show both conflict keys
        expect(screen.getByText("Cmd+S")).toBeInTheDocument()
        expect(screen.getByText("Cmd+O")).toBeInTheDocument()
      })
    })
  })

  describe("Shortcut Filtering", () => {
    it("should filter conflicts by shortcutId", () => {
      render(<ConflictIndicator conflicts={mockConflicts} shortcutId="save-project" />)

      // Should only show conflicts related to save-project
      const icon = screen.getByRole("alert")
      expect(icon).toBeInTheDocument()
    })

    it("should not render if shortcutId has no conflicts", () => {
      const { container } = render(<ConflictIndicator conflicts={mockConflicts} shortcutId="non-existent" />)

      expect(container.firstChild).toBeNull()
    })

    it("should show all conflicts when no shortcutId is provided", () => {
      render(<ConflictIndicator conflicts={mockConflicts} />)

      const icon = screen.getByRole("alert")
      expect(icon).toBeInTheDocument()
    })
  })

  describe("Severity Determination", () => {
    it("should prioritize error severity when multiple conflicts exist", () => {
      render(<ConflictIndicator conflicts={mockConflicts} />)

      const icon = screen.getByRole("alert")
      const svg = icon.querySelector("svg")

      // Should show red (error) since there's at least one error
      expect(svg).toHaveClass("text-red-500", "dark:text-red-400")
    })

    it("should show warning severity when only warnings exist", () => {
      render(<ConflictIndicator conflicts={[mockConflicts[1]]} />)

      const icon = screen.getByRole("alert")
      const svg = icon.querySelector("svg")

      // Should show yellow (warning)
      expect(svg).toHaveClass("text-yellow-500", "dark:text-yellow-400")
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty shortcuts array in conflict", async () => {
      const conflictWithNoShortcuts: ConflictInfo = {
        key: "Cmd+X",
        shortcuts: [],
        severity: "warning",
        message: "Empty conflict",
      }

      render(<ConflictIndicator conflicts={[conflictWithNoShortcuts]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Cmd+X")).toBeInTheDocument()
      })
    })

    it("should handle shortcuts without context", async () => {
      const conflictWithoutContext: ConflictInfo = {
        key: "Cmd+Y",
        shortcuts: [
          {
            id: "test",
            name: "Test Shortcut",
            category: "test",
            keys: ["Cmd+Y"],
            enabled: true,
            // context is undefined
          } as any,
        ],
        severity: "warning",
        message: "No context",
      }

      render(<ConflictIndicator conflicts={[conflictWithoutContext]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Test Shortcut")).toBeInTheDocument()
      })
    })

    it("should handle very long shortcut names", async () => {
      const conflictWithLongName: ConflictInfo = {
        key: "Cmd+L",
        shortcuts: [
          {
            id: "long",
            name: "This is a very long shortcut name that might overflow",
            category: "test",
            keys: ["Cmd+L"],
            enabled: true,
            context: "global",
          },
        ],
        severity: "warning",
        message: "Long name",
      }

      render(<ConflictIndicator conflicts={[conflictWithLongName]} />)

      const icon = screen.getByRole("alert")
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText(/very long shortcut name/)).toBeInTheDocument()
      })
    })
  })

  describe("Tooltip Behavior", () => {
    it("should hide tooltip when mouse leaves", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      const icon = screen.getByRole("alert")

      // Hover to show tooltip
      await user.hover(icon)

      await waitFor(() => {
        expect(screen.getByText("Критический конфликт")).toBeInTheDocument()
      })

      // Unhover
      await user.unhover(icon)

      await waitFor(() => {
        expect(screen.queryByText("Критический конфликт")).not.toBeInTheDocument()
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ConflictIndicator conflicts={mockConflicts} />)

      const alert = screen.getByRole("alert")
      expect(alert).toHaveAttribute("aria-label")
    })

    it("should be keyboard accessible", async () => {
      render(<ConflictIndicator conflicts={[mockConflicts[0]]} />)

      // Tab to the indicator
      await user.tab()

      // Should show tooltip on focus
      await waitFor(() => {
        expect(screen.getByText("Критический конфликт")).toBeInTheDocument()
      })
    })
  })
})
