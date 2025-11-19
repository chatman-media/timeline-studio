/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { MontageTemplateSelector } from "../montage-template-selector"
import { BUILT_IN_TEMPLATES } from "../../types/montage-templates"

describe("MontageTemplateSelector", () => {
  const mockOnSelect = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should render all built-in templates", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // Check that all templates are rendered
    BUILT_IN_TEMPLATES.forEach((template) => {
      expect(screen.getByText(template.name)).toBeInTheDocument()
    })
  })

  it("should display template categories", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // Categories should be present
    expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    expect(screen.getByText("YouTube Intro")).toBeInTheDocument()
    expect(screen.getByText("Highlight Reel")).toBeInTheDocument()
  })

  it("should call onSelect when template is clicked", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]
    const templateButton = screen.getByText(firstTemplate.name)

    await user.click(templateButton)

    expect(mockOnSelect).toHaveBeenCalledWith(firstTemplate)
  })

  it("should show template icon", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    BUILT_IN_TEMPLATES.forEach((template) => {
      // Icon should be displayed with the template
      const templateElement = screen.getByText(template.name).closest("button")
      expect(templateElement).toBeInTheDocument()
      expect(templateElement?.textContent).toContain(template.icon)
    })
  })

  it("should display template description on hover", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]
    const templateButton = screen.getByText(firstTemplate.name)

    await user.hover(templateButton)

    // Description should appear
    expect(screen.getByText(firstTemplate.description)).toBeInTheDocument()
  })

  it("should highlight selected template", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} selected="instagram-reel" />)

    const selectedButton = screen.getByText("Instagram Reel").closest("button")
    expect(selectedButton).toHaveClass("selected")

    // Click another template
    const otherTemplate = screen.getByText("YouTube Intro")
    await user.click(otherTemplate)

    expect(mockOnSelect).toHaveBeenCalled()
  })

  it("should filter templates by category", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} showCategoryFilter />)

    // Select social category
    const socialFilter = screen.getByText("Social")
    await user.click(socialFilter)

    // Only social templates should be visible
    expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    expect(screen.queryByText("Tutorial Demo")).not.toBeInTheDocument()
  })

  it("should search templates by name", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} showSearch />)

    const searchInput = screen.getByPlaceholderText("Search templates...")
    await user.type(searchInput, "Highlight")

    expect(screen.getByText("Highlight Reel")).toBeInTheDocument()
    expect(screen.queryByText("Instagram Reel")).not.toBeInTheDocument()
  })

  it("should display template parameters", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} showDetails />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]

    // Parameters should be displayed
    expect(screen.getByText(`Target: ${firstTemplate.parameters.targetDuration}s`)).toBeInTheDocument()
    expect(screen.getByText(firstTemplate.parameters.aspectRatio || "")).toBeInTheDocument()
  })

  it("should group templates by category", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} groupByCategory />)

    // Category headers should be present
    expect(screen.getByText("Social")).toBeInTheDocument()
    expect(screen.getByText("Promo")).toBeInTheDocument()
    expect(screen.getByText("Highlights")).toBeInTheDocument()
  })

  it("should handle empty state when no templates match filter", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} showSearch />)

    const searchInput = screen.getByPlaceholderText("Search templates...")
    await user.type(searchInput, "NonExistentTemplate")

    expect(screen.getByText("No templates found")).toBeInTheDocument()
  })

  it("should show template tags", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} showTags />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]

    // Tags should be displayed
    firstTemplate.tags.forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it("should support keyboard navigation", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplateButton = screen.getByText(BUILT_IN_TEMPLATES[0].name)

    // Focus first template
    firstTemplateButton.focus()
    expect(firstTemplateButton).toHaveFocus()

    // Press Enter to select
    await user.keyboard("{Enter}")

    expect(mockOnSelect).toHaveBeenCalled()
  })

  it("should display aspect ratio icons", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} showAspectRatio />)

    // Aspect ratios should be indicated
    expect(screen.getByText("9:16")).toBeInTheDocument() // Instagram Reel
    expect(screen.getByText("16:9")).toBeInTheDocument() // YouTube Intro
  })
})
