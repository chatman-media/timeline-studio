import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { VersionControlTab } from "../../../components/tabs/version-control-tab"

vi.mock("@/features/version-control/components/version-control-manager", () => ({
  VersionControlManager: () => (
    <div data-testid="version-control-manager">Version Control Manager</div>
  ),
}))

describe("VersionControlTab", () => {
  describe("rendering", () => {
    it("should render the component", () => {
      render(<VersionControlTab />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })

    it("should render VersionControlManager component", () => {
      render(<VersionControlTab />)

      expect(screen.getByText("Version Control Manager")).toBeInTheDocument()
    })

    it("should have correct container structure", () => {
      const { container } = render(<VersionControlTab />)

      const mainDiv = container.firstElementChild
      expect(mainDiv).toHaveClass("space-y-6")
    })

    it("should wrap content in a spaced container", () => {
      const { container } = render(<VersionControlTab />)

      expect(container.querySelector(".space-y-6")).toBeInTheDocument()
    })
  })

  describe("component composition", () => {
    it("should include VersionControlManager", () => {
      render(<VersionControlTab />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })

    it("should render only one VersionControlManager", () => {
      render(<VersionControlTab />)

      const managers = screen.getAllByTestId("version-control-manager")
      expect(managers).toHaveLength(1)
    })
  })

  describe("styling", () => {
    it("should apply space-y-6 class for vertical spacing", () => {
      const { container } = render(<VersionControlTab />)

      const wrapper = container.querySelector(".space-y-6")
      expect(wrapper).toBeInTheDocument()
    })

    it("should maintain proper DOM hierarchy", () => {
      const { container } = render(<VersionControlTab />)

      const wrapper = container.firstElementChild
      expect(wrapper?.tagName).toBe("DIV")
      expect(wrapper).toHaveClass("space-y-6")
    })
  })

  describe("accessibility", () => {
    it("should have accessible content", () => {
      render(<VersionControlTab />)

      expect(screen.getByText("Version Control Manager")).toBeInTheDocument()
    })

    it("should maintain semantic HTML structure", () => {
      const { container } = render(<VersionControlTab />)

      const mainDiv = container.firstElementChild
      expect(mainDiv?.tagName).toBe("DIV")
    })
  })

  describe("tab functionality", () => {
    it("should be renderable in a tab context", () => {
      const { container } = render(<VersionControlTab />)

      expect(container.firstElementChild).toBeInTheDocument()
    })

    it("should contain version control functionality", () => {
      render(<VersionControlTab />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })
  })

  describe("component lifecycle", () => {
    it("should render without errors", () => {
      expect(() => {
        render(<VersionControlTab />)
      }).not.toThrow()
    })

    it("should handle unmounting gracefully", () => {
      const { unmount } = render(<VersionControlTab />)

      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })

  describe("integration", () => {
    it("should work as a tab panel content", () => {
      const { container } = render(<VersionControlTab />)

      const wrapper = container.querySelector(".space-y-6")
      expect(wrapper).toBeInTheDocument()
      expect(wrapper?.querySelector("[data-testid='version-control-manager']")).toBeInTheDocument()
    })

    it("should provide version control manager to users", () => {
      render(<VersionControlTab />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })
  })
})
