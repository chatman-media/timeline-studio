/**
 * Tests for ProjectLoadingOverlay component
 * Tests loading states, error display, and conditional rendering
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ProjectLoadingOverlay } from "../../components/project-loading-overlay"

// Mock useApp hook
const mockUseApp = vi.fn()

vi.mock("../../services/app-provider", () => ({
  useApp: () => mockUseApp(),
}))

describe("ProjectLoadingOverlay", () => {
  describe("Hidden state", () => {
    it("should not render when not connecting and no error", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      expect(container.firstChild).toBeNull()
    })

    it("should not render when already connected", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: null,
      })

      render(<ProjectLoadingOverlay />)

      expect(screen.queryByText("Загрузка проекта...")).not.toBeInTheDocument()
    })
  })

  describe("Loading state", () => {
    it("should show loading spinner when connecting", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      render(<ProjectLoadingOverlay />)

      expect(screen.getByText("Загрузка проекта...")).toBeInTheDocument()
    })

    it("should have spinner element when connecting", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const spinner = container.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })

    it("should have overlay backdrop when connecting", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const overlay = container.querySelector(".fixed.inset-0")
      expect(overlay).toBeInTheDocument()
    })

    it("should have high z-index for overlay", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const overlay = container.querySelector(".z-50")
      expect(overlay).toBeInTheDocument()
    })
  })

  describe("Error state", () => {
    it("should show error message when connection fails", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "Failed to connect to backend",
      })

      render(<ProjectLoadingOverlay />)

      expect(screen.getByText("Ошибка подключения")).toBeInTheDocument()
      expect(screen.getByText("Failed to connect to backend")).toBeInTheDocument()
    })

    it("should show error without loading spinner", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "Connection timeout",
      })

      const { container } = render(<ProjectLoadingOverlay />)

      expect(screen.queryByText("Загрузка проекта...")).not.toBeInTheDocument()
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument()
    })

    it("should display different error messages", () => {
      const errorMessage = "Custom error message"
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: errorMessage,
      })

      render(<ProjectLoadingOverlay />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it("should have destructive styling for error", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "Error",
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const errorContainer = container.querySelector(".text-destructive")
      expect(errorContainer).toBeInTheDocument()
    })
  })

  describe("Combined states", () => {
    it("should prioritize loading when both connecting and error exist", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: "Previous error",
      })

      render(<ProjectLoadingOverlay />)

      // Should show loading
      expect(screen.getByText("Загрузка проекта...")).toBeInTheDocument()
      // Should also show error
      expect(screen.getByText("Ошибка подключения")).toBeInTheDocument()
    })

    it("should show both loading and error elements when connecting with error", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: "Connection issue",
      })

      const { container } = render(<ProjectLoadingOverlay />)

      expect(container.querySelector(".animate-spin")).toBeInTheDocument()
      expect(screen.getByText("Connection issue")).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have backdrop blur for better visibility", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const backdrop = container.querySelector(".backdrop-blur-sm")
      expect(backdrop).toBeInTheDocument()
    })

    it("should center content vertically and horizontally", () => {
      mockUseApp.mockReturnValue({
        isConnecting: true,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      const centered = container.querySelector(".flex.items-center.justify-center")
      expect(centered).toBeInTheDocument()
    })
  })

  describe("Edge cases", () => {
    it("should handle empty error message", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: "",
      })

      const { container } = render(<ProjectLoadingOverlay />)

      // Empty string is falsy, so should not render
      expect(container.firstChild).toBeNull()
    })

    it("should handle null error explicitly", () => {
      mockUseApp.mockReturnValue({
        isConnecting: false,
        connectionError: null,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      expect(container.firstChild).toBeNull()
    })

    it("should handle undefined from useApp", () => {
      mockUseApp.mockReturnValue({
        isConnecting: undefined,
        connectionError: undefined,
      })

      const { container } = render(<ProjectLoadingOverlay />)

      expect(container.firstChild).toBeNull()
    })
  })
})
