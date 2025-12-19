/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { VersionControlTab } from "../../../components/tabs/version-control-tab"

vi.mock("@/features/version-control/components/version-control-manager", () => ({
  VersionControlManager: () => (
    <div data-testid="version-control-manager" data-oid="7baoz3p">
      Version Control Manager
    </div>
  ),
}))

describe("VersionControlTab", () => {
  describe("rendering", () => {
    it("should render the component", () => {
      render(<VersionControlTab data-oid="y3cgzih" />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })

    it("should render VersionControlManager component", () => {
      render(<VersionControlTab data-oid="myjal-p" />)

      expect(screen.getByText("Version Control Manager")).toBeInTheDocument()
    })

    it("should have correct container structure", () => {
      const { container } = render(<VersionControlTab data-oid=":uq_x8l" />)

      const mainDiv = container.firstElementChild
      expect(mainDiv).toHaveClass("space-y-6")
    })

    it("should wrap content in a spaced container", () => {
      const { container } = render(<VersionControlTab data-oid="k:3dpc." />)

      expect(container.querySelector(".space-y-6")).toBeInTheDocument()
    })
  })

  describe("component composition", () => {
    it("should include VersionControlManager", () => {
      render(<VersionControlTab data-oid=".au8t3o" />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })

    it("should render only one VersionControlManager", () => {
      render(<VersionControlTab data-oid="6fon_-6" />)

      const managers = screen.getAllByTestId("version-control-manager")
      expect(managers).toHaveLength(1)
    })
  })

  describe("styling", () => {
    it("should apply space-y-6 class for vertical spacing", () => {
      const { container } = render(<VersionControlTab data-oid="57x.y9x" />)

      const wrapper = container.querySelector(".space-y-6")
      expect(wrapper).toBeInTheDocument()
    })

    it("should maintain proper DOM hierarchy", () => {
      const { container } = render(<VersionControlTab data-oid="1vxzi3c" />)

      const wrapper = container.firstElementChild
      expect(wrapper?.tagName).toBe("DIV")
      expect(wrapper).toHaveClass("space-y-6")
    })
  })

  describe("accessibility", () => {
    it("should have accessible content", () => {
      render(<VersionControlTab data-oid="anbids1" />)

      expect(screen.getByText("Version Control Manager")).toBeInTheDocument()
    })

    it("should maintain semantic HTML structure", () => {
      const { container } = render(<VersionControlTab data-oid="w-kjg7o" />)

      const mainDiv = container.firstElementChild
      expect(mainDiv?.tagName).toBe("DIV")
    })
  })

  describe("tab functionality", () => {
    it("should be renderable in a tab context", () => {
      const { container } = render(<VersionControlTab data-oid="x1o2g7:" />)

      expect(container.firstElementChild).toBeInTheDocument()
    })

    it("should contain version control functionality", () => {
      render(<VersionControlTab data-oid="7bfkg8j" />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })
  })

  describe("component lifecycle", () => {
    it("should render without errors", () => {
      expect(() => {
        render(<VersionControlTab data-oid=":3_87s8" />)
      }).not.toThrow()
    })

    it("should handle unmounting gracefully", () => {
      const { unmount } = render(<VersionControlTab data-oid="e7zj_f8" />)

      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })

  describe("integration", () => {
    it("should work as a tab panel content", () => {
      const { container } = render(<VersionControlTab data-oid="y4hu.n7" />)

      const wrapper = container.querySelector(".space-y-6")
      expect(wrapper).toBeInTheDocument()
      expect(wrapper?.querySelector("[data-testid='version-control-manager']")).toBeInTheDocument()
    })

    it("should provide version control manager to users", () => {
      render(<VersionControlTab data-oid="_mn7-f3" />)

      expect(screen.getByTestId("version-control-manager")).toBeInTheDocument()
    })
  })
})
