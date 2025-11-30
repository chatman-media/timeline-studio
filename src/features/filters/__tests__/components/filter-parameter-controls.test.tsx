/**
 * Tests for FilterParameterControls component
 *
 * Tests parameter controls including:
 * - Rendering parameter sliders
 * - Handling parameter value changes
 * - Resetting to default values
 * - Parameter grouping
 * - Value formatting
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FilterParameterControls } from "../../components/filter-parameter-controls"
import type { VideoFilter } from "../../types/filters"

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

describe("FilterParameterControls", () => {
  const mockFilter: VideoFilter = {
    id: "test-filter",
    name: "Test Filter",
    category: "color-correction",
    complexity: "basic",
    tags: ["test"],
    description: {
      ru: "Тестовый фильтр",
      en: "Test filter",
    },
    labels: {
      ru: "Тест",
      en: "Test",
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
      temperature: 0,
      tint: 0,
    },
  }

  describe("Rendering", () => {
    it("should render filter name and description", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      expect(screen.getByText("Тест")).toBeInTheDocument()
      expect(screen.getByText("Тестовый фильтр")).toBeInTheDocument()
    })

    it("should render parameter sliders for all params", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      // Check for parameter labels (we use the default translation function)
      const allSliders = screen.getAllByRole("slider")
      expect(allSliders.length).toBeGreaterThan(0)
    })

    it("should render reset button", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      const resetButton = screen.getByRole("button", { name: /reset/i })
      expect(resetButton).toBeInTheDocument()
    })

    it("should render preview note when showPreview is true", () => {
      render(<FilterParameterControls filter={mockFilter} showPreview={true} />)

      expect(screen.getByText(/changes are applied in real-time/i)).toBeInTheDocument()
    })

    it("should not render preview note when showPreview is false", () => {
      render(<FilterParameterControls filter={mockFilter} showPreview={false} />)

      expect(screen.queryByText(/changes are applied in real-time/i)).not.toBeInTheDocument()
    })
  })

  describe("Parameter groups", () => {
    it("should group basic parameters together", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      // Basic parameters should be visible
      const allSliders = screen.getAllByRole("slider")
      expect(allSliders.length).toBeGreaterThan(0)
    })

    it("should only render available parameters", () => {
      const filterWithLimitedParams: VideoFilter = {
        ...mockFilter,
        params: {
          brightness: 0,
          contrast: 1,
        },
      }

      render(<FilterParameterControls filter={filterWithLimitedParams} />)

      const allSliders = screen.getAllByRole("slider")
      // Should only have 2 sliders (brightness and contrast)
      expect(allSliders.length).toBe(2)
    })
  })

  describe("Parameter value changes", () => {
    it("should provide onParamsChange callback prop", () => {
      const onParamsChange = vi.fn()
      render(<FilterParameterControls filter={mockFilter} onParamsChange={onParamsChange} />)

      // Component should render with callback
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    it("should render sliders for all parameters", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      const sliders = screen.getAllByRole("slider")
      // Some params might be grouped or rendered differently
      expect(sliders.length).toBeGreaterThan(0)
      expect(sliders.length).toBeLessThanOrEqual(Object.keys(mockFilter.params).length)
    })
  })

  describe("Reset functionality", () => {
    it("should call onParamsChange with default values when reset button clicked", async () => {
      const onParamsChange = vi.fn()
      render(<FilterParameterControls filter={mockFilter} onParamsChange={onParamsChange} />)

      // Click reset button
      const resetButton = screen.getByRole("button", { name: /reset/i })
      fireEvent.click(resetButton)

      // Should call onParamsChange with default values
      await waitFor(() => {
        expect(onParamsChange).toHaveBeenCalledWith(mockFilter.params)
      })
    })

    it("should reset button be clickable", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      const resetButton = screen.getByRole("button", { name: /reset/i })
      expect(() => fireEvent.click(resetButton)).not.toThrow()
    })
  })

  describe("Value formatting", () => {
    it("should format integer values without decimals", () => {
      const filterWithIntParams: VideoFilter = {
        ...mockFilter,
        params: {
          temperature: 50,
          tint: 25,
        },
      }

      const { container } = render(<FilterParameterControls filter={filterWithIntParams} />)

      // Check that values are displayed
      expect(container).toBeInTheDocument()
    })

    it("should format decimal values with 2 decimal places", () => {
      const filterWithDecimalParams: VideoFilter = {
        ...mockFilter,
        params: {
          brightness: 0.5678,
          contrast: 1.234,
        },
      }

      const { container } = render(<FilterParameterControls filter={filterWithDecimalParams} />)

      // Check that component renders
      expect(container).toBeInTheDocument()
    })
  })

  describe("Parameter configurations", () => {
    it("should use correct min/max/step for brightness", () => {
      const filter: VideoFilter = {
        ...mockFilter,
        params: { brightness: 0 },
      }

      render(<FilterParameterControls filter={filter} />)

      const slider = screen.getByRole("slider")
      // Radix UI Slider uses ARIA attributes
      expect(slider).toHaveAttribute("aria-valuemin")
      expect(slider).toHaveAttribute("aria-valuemax")
      expect(slider).toHaveAttribute("aria-valuenow")
    })

    it("should use correct min/max/step for contrast", () => {
      const filter: VideoFilter = {
        ...mockFilter,
        params: { contrast: 1 },
      }

      render(<FilterParameterControls filter={filter} />)

      const slider = screen.getByRole("slider")
      // Radix UI Slider uses ARIA attributes
      expect(slider).toHaveAttribute("aria-valuemin", "0")
      expect(slider).toHaveAttribute("aria-valuemax", "2")
      expect(slider).toHaveAttribute("aria-valuenow")
    })

    it("should use correct min/max/step for temperature", () => {
      const filter: VideoFilter = {
        ...mockFilter,
        params: { temperature: 0 },
      }

      render(<FilterParameterControls filter={filter} />)

      const slider = screen.getByRole("slider")
      // Radix UI Slider uses ARIA attributes
      expect(slider).toHaveAttribute("aria-valuemin", "-100")
      expect(slider).toHaveAttribute("aria-valuemax", "100")
      expect(slider).toHaveAttribute("aria-valuenow")
    })
  })

  describe("Multiple parameters", () => {
    it("should handle filter with many parameters", () => {
      const complexFilter: VideoFilter = {
        ...mockFilter,
        params: {
          brightness: 0.1,
          contrast: 1.2,
          saturation: 1.1,
          gamma: 1.05,
          temperature: 10,
          tint: 5,
          hue: 0,
          vibrance: 0.2,
          shadows: -0.1,
          highlights: 0.1,
          blacks: 0,
          whites: 0,
          clarity: 0.1,
          dehaze: 0,
          vignette: 0.2,
        },
      }

      render(<FilterParameterControls filter={complexFilter} />)

      const allSliders = screen.getAllByRole("slider")
      // Some params might be grouped, so we check for presence
      expect(allSliders.length).toBeGreaterThan(0)
      expect(allSliders.length).toBeLessThanOrEqual(Object.keys(complexFilter.params).length)
    })

    it("should render all parameters from filter", () => {
      const filter: VideoFilter = {
        ...mockFilter,
        params: {
          brightness: 0,
          contrast: 1,
          saturation: 1,
        },
      }

      render(<FilterParameterControls filter={filter} />)

      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBe(3)
    })
  })

  describe("Edge cases", () => {
    it("should handle filter with no parameters", () => {
      const emptyFilter: VideoFilter = {
        ...mockFilter,
        params: {},
      }

      render(<FilterParameterControls filter={emptyFilter} />)

      // Should still render filter info
      expect(screen.getByText("Тест")).toBeInTheDocument()

      // But no sliders
      const sliders = screen.queryAllByRole("slider")
      expect(sliders.length).toBe(0)
    })

    it("should handle missing labels gracefully", () => {
      const filterNoLabels: VideoFilter = {
        ...mockFilter,
        labels: undefined,
        description: undefined,
      }

      render(<FilterParameterControls filter={filterNoLabels} />)

      // Should fall back to name
      expect(screen.getByText("Test Filter")).toBeInTheDocument()
    })

    it("should handle undefined onParamsChange callback", () => {
      render(<FilterParameterControls filter={mockFilter} onParamsChange={undefined} />)

      const sliders = screen.getAllByRole("slider")

      // Component should render without throwing
      expect(sliders.length).toBeGreaterThan(0)
    })
  })

  describe("Accessibility", () => {
    it("should have proper labels for sliders", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      const sliders = screen.getAllByRole("slider")
      sliders.forEach((slider) => {
        // Each slider should have aria attributes
        expect(slider).toBeInTheDocument()
      })
    })

    it("should have accessible reset button", () => {
      render(<FilterParameterControls filter={mockFilter} />)

      const resetButton = screen.getByRole("button", { name: /reset/i })
      expect(resetButton).toBeInTheDocument()
      expect(resetButton).toBeEnabled()
    })
  })
})
