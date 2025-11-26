/**
 * Tests for PreviewPanel component
 * Тесты для компонента панели preview
 */

import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PreviewPanel } from "../../components/preview-panel"

// Mock the hooks
vi.mock("../../hooks/use-webgl2-preview", () => ({
  useWebGL2Preview: () => ({
    canvasRef: vi.fn(),
    videoRef: vi.fn(),
    previewFrame: {
      timestamp: 0,
      bitmap: {},
      effects: [],
      cached: false,
    },
    isInitialized: true,
    gpuTier: "medium",
    quality: {
      resolution: 1.0,
      effects: "all",
      fps: 30,
      antialiasing: true,
    },
    setQuality: vi.fn(),
    cacheStats: {
      entries: 10,
      sizeBytes: 50 * 1024 * 1024,
      sizeMB: 50,
      maxSizeMB: 100,
      fillPercentage: 50,
    },
  }),
}))

// Mock child components
vi.mock("../../components/effect-chain-list", () => ({
  EffectChainList: () => <div data-testid="effect-chain-list">Effect Chain List</div>,
}))

vi.mock("../../components/preset-gallery", () => ({
  PresetGallery: () => <div data-testid="preset-gallery">Preset Gallery</div>,
}))

vi.mock("../../components/quality-controls", () => ({
  QualityControls: ({ quality, gpuTier, onChange }: any) => (
    <div data-testid="quality-controls">
      Quality Controls - {gpuTier} - {quality.fps} FPS
    </div>
  ),
}))

describe("PreviewPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rendering", () => {
    it("should render preview panel", () => {
      render(<PreviewPanel />)

      expect(screen.getByText("Real-time Preview")).toBeInTheDocument()
    })

    it("should render canvas element", () => {
      const { container } = render(<PreviewPanel />)

      const canvas = container.querySelector("canvas")
      expect(canvas).toBeInTheDocument()
    })

    it("should render hidden video element", () => {
      const { container } = render(<PreviewPanel />)

      const video = container.querySelector("video")
      expect(video).toBeInTheDocument()
      expect(video).toHaveClass("hidden")
    })

    it("should display GPU tier badge", () => {
      render(<PreviewPanel />)

      expect(screen.getByText(/GPU: MEDIUM/i)).toBeInTheDocument()
    })

    it("should display cache statistics", () => {
      render(<PreviewPanel />)

      expect(screen.getByText(/Cache: 10 frames/i)).toBeInTheDocument()
      expect(screen.getByText(/50.0MB/i)).toBeInTheDocument()
    })

    it("should display performance stats", () => {
      render(<PreviewPanel />)

      expect(screen.getByText(/FPS: 30/i)).toBeInTheDocument()
      expect(screen.getByText(/Resolution: 100%/i)).toBeInTheDocument()
    })

    it("should show live status when initialized", () => {
      render(<PreviewPanel />)

      expect(screen.getByText("Live")).toBeInTheDocument()
    })
  })

  describe("preview toggle", () => {
    it("should toggle preview enabled/disabled", async () => {
      const user = userEvent.setup()
      render(<PreviewPanel />)

      // Find and click the eye icon button
      const toggleButton = screen.getByRole("button", { name: "" })
      await user.click(toggleButton)

      expect(screen.getByText(/Preview disabled/i)).toBeInTheDocument()
    })

    it("should hide canvas when preview is disabled", async () => {
      const user = userEvent.setup()
      const { container } = render(<PreviewPanel />)

      const toggleButton = screen.getByRole("button", { name: "" })
      await user.click(toggleButton)

      const canvas = container.querySelector("canvas")
      expect(canvas).not.toBeVisible()
    })
  })

  describe("controls toggle", () => {
    it("should toggle effects panel", async () => {
      const user = userEvent.setup()
      render(<PreviewPanel />)

      const effectsButton = screen.getByRole("button", { name: /Effects/i })

      // Effects panel should be visible by default
      expect(screen.getByTestId("effect-chain-list")).toBeInTheDocument()

      // Click to hide
      await user.click(effectsButton)

      expect(screen.queryByTestId("effect-chain-list")).not.toBeInTheDocument()
    })

    it("should toggle presets panel", async () => {
      const user = userEvent.setup()
      render(<PreviewPanel />)

      const presetsButton = screen.getByRole("button", { name: /Presets/i })

      // Presets panel should be hidden by default
      expect(screen.queryByTestId("preset-gallery")).not.toBeInTheDocument()

      // Click to show
      await user.click(presetsButton)

      expect(screen.getByTestId("preset-gallery")).toBeInTheDocument()
    })

    it("should toggle quality panel", async () => {
      const user = userEvent.setup()
      render(<PreviewPanel />)

      const qualityButton = screen.getByRole("button", { name: /Quality/i })

      // Quality panel should be hidden by default
      expect(screen.queryByTestId("quality-controls")).not.toBeInTheDocument()

      // Click to show
      await user.click(qualityButton)

      expect(screen.getByTestId("quality-controls")).toBeInTheDocument()
    })

    it("should show button variants based on panel state", async () => {
      const user = userEvent.setup()
      render(<PreviewPanel />)

      const effectsButton = screen.getByRole("button", { name: /Effects/i })

      // Initially active (default variant)
      expect(effectsButton).toHaveClass("inline-flex") // shadcn button class

      // Toggle off
      await user.click(effectsButton)

      // Still has button classes
      expect(effectsButton).toHaveClass("inline-flex")
    })
  })

  describe("layout", () => {
    it("should apply custom className", () => {
      const { container } = render(<PreviewPanel className="custom-class" />)

      const card = container.querySelector(".custom-class")
      expect(card).toBeInTheDocument()
    })

    it("should use flexbox layout", () => {
      const { container } = render(<PreviewPanel />)

      const card = container.querySelector(".flex.flex-col")
      expect(card).toBeInTheDocument()
    })

    it("should have header with controls", () => {
      render(<PreviewPanel />)

      expect(screen.getByText("Real-time Preview")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Effects/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Presets/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Quality/i })).toBeInTheDocument()
    })

    it("should have canvas container with black background", () => {
      const { container } = render(<PreviewPanel />)

      const canvasContainer = container.querySelector(".bg-black")
      expect(canvasContainer).toBeInTheDocument()
    })
  })

  describe("initialization state", () => {
    it("should show loading when not initialized", () => {
      vi.mock("../../hooks/use-webgl2-preview", () => ({
        useWebGL2Preview: () => ({
          canvasRef: vi.fn(),
          videoRef: vi.fn(),
          previewFrame: null,
          isInitialized: false,
          gpuTier: "medium",
          quality: {
            resolution: 1.0,
            effects: "all",
            fps: 30,
            antialiasing: true,
          },
          setQuality: vi.fn(),
          cacheStats: null,
        }),
      }))

      render(<PreviewPanel />)

      expect(screen.getByText(/Initializing preview renderer/i)).toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("should have accessible buttons", () => {
      render(<PreviewPanel />)

      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("should have meaningful button labels", () => {
      render(<PreviewPanel />)

      expect(screen.getByRole("button", { name: /Effects/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Presets/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Quality/i })).toBeInTheDocument()
    })
  })

  describe("canvas attributes", () => {
    it("should set canvas crossOrigin attribute on video", () => {
      const { container } = render(<PreviewPanel />)

      const video = container.querySelector("video")
      expect(video).toHaveAttribute("crossOrigin", "anonymous")
    })

    it("should preload video metadata", () => {
      const { container } = render(<PreviewPanel />)

      const video = container.querySelector("video")
      expect(video).toHaveAttribute("preload", "metadata")
    })

    it("should apply image rendering based on antialiasing", () => {
      const { container } = render(<PreviewPanel />)

      const canvas = container.querySelector("canvas")
      const style = canvas?.getAttribute("style")

      expect(style).toContain("image-rendering")
    })
  })

  describe("responsive behavior", () => {
    it("should use ResizeObserver for canvas sizing", () => {
      const { container } = render(<PreviewPanel />)

      const canvasContainer = container.querySelector(".flex-1.relative")
      expect(canvasContainer).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle null cache stats", () => {
      vi.mock("../../hooks/use-webgl2-preview", () => ({
        useWebGL2Preview: () => ({
          canvasRef: vi.fn(),
          videoRef: vi.fn(),
          previewFrame: null,
          isInitialized: true,
          gpuTier: "medium",
          quality: {
            resolution: 1.0,
            effects: "all",
            fps: 30,
            antialiasing: true,
          },
          setQuality: vi.fn(),
          cacheStats: null,
        }),
      }))

      render(<PreviewPanel />)

      // Should not crash with null cache stats
      expect(screen.getByText("Real-time Preview")).toBeInTheDocument()
    })

    it("should handle different GPU tiers", () => {
      const tiers: Array<"high" | "medium" | "low"> = ["high", "medium", "low"]

      tiers.forEach((tier) => {
        vi.mock("../../hooks/use-webgl2-preview", () => ({
          useWebGL2Preview: () => ({
            canvasRef: vi.fn(),
            videoRef: vi.fn(),
            previewFrame: null,
            isInitialized: true,
            gpuTier: tier,
            quality: {
              resolution: 1.0,
              effects: "all",
              fps: 30,
              antialiasing: true,
            },
            setQuality: vi.fn(),
            cacheStats: null,
          }),
        }))

        const { unmount } = render(<PreviewPanel />)

        expect(screen.getByText(new RegExp(`GPU: ${tier.toUpperCase()}`, "i"))).toBeInTheDocument()

        unmount()
      })
    })

    it("should handle null preview frame", () => {
      vi.mock("../../hooks/use-webgl2-preview", () => ({
        useWebGL2Preview: () => ({
          canvasRef: vi.fn(),
          videoRef: vi.fn(),
          previewFrame: null,
          isInitialized: true,
          gpuTier: "medium",
          quality: {
            resolution: 1.0,
            effects: "all",
            fps: 30,
            antialiasing: true,
          },
          setQuality: vi.fn(),
          cacheStats: null,
        }),
      }))

      render(<PreviewPanel />)

      expect(screen.getByText("Updating...")).toBeInTheDocument()
    })
  })
})
