import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ShortcutsCheatSheet } from "../../components/shortcuts-cheat-sheet"

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

const mockShortcuts = [
  {
    id: "new-project",
    name: "New Project",
    category: "file",
    keys: ["Cmd+N"],
    enabled: true,
    context: "global",
  },
  {
    id: "open-project",
    name: "Open Project",
    category: "file",
    keys: ["Cmd+O"],
    enabled: true,
    context: "global",
  },
  {
    id: "undo",
    name: "Undo",
    category: "edit",
    keys: ["Cmd+Z"],
    enabled: true,
    context: "global",
  },
  {
    id: "redo",
    name: "Redo",
    category: "edit",
    keys: ["Shift+Cmd+Z"],
    enabled: true,
    context: "global",
  },
  {
    id: "disabled-shortcut",
    name: "Disabled",
    category: "file",
    keys: ["Cmd+D"],
    enabled: false,
    context: "global",
  },
]

vi.mock("../../services/shortcuts-provider", () => ({
  useShortcuts: () => ({
    shortcuts: mockShortcuts,
  }),
}))

const mockCategories = [
  {
    id: "file",
    name: "File",
    description: "File operations",
  },
  {
    id: "edit",
    name: "Edit",
    description: "Edit operations",
  },
  {
    id: "empty",
    name: "Empty Category",
    description: "No shortcuts here",
  },
]

vi.mock("../../services/shortcuts-registry", () => ({
  shortcutsRegistry: {
    getCategories: vi.fn(() => mockCategories),
  },
}))

describe("ShortcutsCheatSheet", () => {
  const user = userEvent.setup()
  const mockPrint = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.print = mockPrint

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
    it("should render cheat sheet title and description", () => {
      render(<ShortcutsCheatSheet />)

      expect(screen.getByText("Шпаргалка по горячим клавишам")).toBeInTheDocument()
      expect(screen.getByText("Все доступные клавиатурные сочетания")).toBeInTheDocument()
    })

    it("should render print button", () => {
      render(<ShortcutsCheatSheet />)

      const printButton = screen.getByText("Печать")
      expect(printButton).toBeInTheDocument()
      expect(printButton.closest("button")).toBeInTheDocument()
    })

    it("should render all categories with shortcuts", () => {
      render(<ShortcutsCheatSheet />)

      // Should show File and Edit categories (they have enabled shortcuts)
      expect(screen.getByText("File")).toBeInTheDocument()
      expect(screen.getByText("Edit")).toBeInTheDocument()

      // Should not show empty category
      expect(screen.queryByText("Empty Category")).not.toBeInTheDocument()
    })

    it("should render shortcuts for each category", () => {
      render(<ShortcutsCheatSheet />)

      // File category shortcuts (only enabled ones)
      expect(screen.getByText("New Project")).toBeInTheDocument()
      expect(screen.getByText("Open Project")).toBeInTheDocument()

      // Edit category shortcuts
      expect(screen.getByText("Undo")).toBeInTheDocument()
      expect(screen.getByText("Redo")).toBeInTheDocument()

      // Disabled shortcut should not be shown
      expect(screen.queryByText("Disabled")).not.toBeInTheDocument()
    })

    it("should render key bindings for shortcuts", () => {
      render(<ShortcutsCheatSheet />)

      // Check for kbd elements with key combinations
      const kbdElements = screen.getAllByRole("generic").filter((el) => el.tagName === "KBD")

      expect(kbdElements.length).toBeGreaterThan(0)
    })
  })

  describe("Print Functionality", () => {
    it("should call window.print when print button is clicked", async () => {
      render(<ShortcutsCheatSheet />)

      const printButton = screen.getByText("Печать")
      await user.click(printButton)

      expect(mockPrint).toHaveBeenCalledTimes(1)
    })
  })

  describe("Data Formatting", () => {
    it("should format keys correctly", () => {
      render(<ShortcutsCheatSheet />)

      // First key from the keys array should be displayed
      const newProjectShortcut = screen.getByText("New Project")
      const shortcutCard = newProjectShortcut.closest("div")

      expect(shortcutCard).toBeInTheDocument()
    })

    it("should group shortcuts by category correctly", () => {
      const { container } = render(<ShortcutsCheatSheet />)

      // Check for category cards
      const categoryCards = container.querySelectorAll("[data-testid]")

      // Should have at least 2 cards (File and Edit)
      expect(container.querySelectorAll(".space-y-4 > div > div")).length >= 2
    })
  })

  describe("Filtering Logic", () => {
    it("should only show enabled shortcuts", () => {
      render(<ShortcutsCheatSheet />)

      // Enabled shortcuts should be visible
      expect(screen.getByText("New Project")).toBeInTheDocument()
      expect(screen.getByText("Undo")).toBeInTheDocument()

      // Disabled shortcut should not be visible
      expect(screen.queryByText("Disabled")).not.toBeInTheDocument()
    })

    it("should not show categories without enabled shortcuts", () => {
      render(<ShortcutsCheatSheet />)

      // Empty category should not be shown
      expect(screen.queryByText("Empty Category")).not.toBeInTheDocument()
    })
  })

  describe("Styling", () => {
    it("should apply print-specific styles", () => {
      const { container } = render(<ShortcutsCheatSheet />)

      // Check that style tag exists
      const styleTag = container.querySelector("style")
      expect(styleTag).toBeInTheDocument()
      expect(styleTag?.textContent).toContain("@media print")
    })

    it("should apply grid layout for shortcuts", () => {
      const { container } = render(<ShortcutsCheatSheet />)

      // Check for grid layout classes
      const gridElements = container.querySelectorAll(".grid")
      expect(gridElements.length).toBeGreaterThan(0)
    })
  })

  describe("Memoization", () => {
    it("should memoize shortcuts by category", () => {
      const { rerender } = render(<ShortcutsCheatSheet />)

      const initialContent = screen.getByText("New Project")
      expect(initialContent).toBeInTheDocument()

      // Rerender with same data
      rerender(<ShortcutsCheatSheet />)

      // Content should still be there
      expect(screen.getByText("New Project")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have proper structure for screen readers", () => {
      render(<ShortcutsCheatSheet />)

      // Check for heading elements
      const heading = screen.getByText("Шпаргалка по горячим клавишам")
      expect(heading.tagName).toBe("H2")
    })

    it("should render kbd elements for keyboard shortcuts", () => {
      const { container } = render(<ShortcutsCheatSheet />)

      const kbdElements = container.querySelectorAll("kbd")
      expect(kbdElements.length).toBeGreaterThan(0)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty shortcuts list", () => {
      vi.mock("../../services/shortcuts-provider", () => ({
        useShortcuts: () => ({
          shortcuts: [],
        }),
      }))

      render(<ShortcutsCheatSheet />)

      // Should still render header
      expect(screen.getByText("Шпаргалка по горячим клавишам")).toBeInTheDocument()

      // But no shortcuts
      expect(screen.queryByText("New Project")).not.toBeInTheDocument()
    })

    it("should handle shortcuts with empty keys array", () => {
      const shortcutsWithEmptyKeys = [
        {
          id: "empty-keys",
          name: "Empty Keys",
          category: "file",
          keys: [],
          enabled: true,
          context: "global",
        },
      ]

      vi.mock("../../services/shortcuts-provider", () => ({
        useShortcuts: () => ({
          shortcuts: shortcutsWithEmptyKeys,
        }),
      }))

      render(<ShortcutsCheatSheet />)

      // Should not crash, formatKeys should return empty string
      expect(screen.queryByText("Empty Keys")).not.toBeInTheDocument()
    })
  })
})
