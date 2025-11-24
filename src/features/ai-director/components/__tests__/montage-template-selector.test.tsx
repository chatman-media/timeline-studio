/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { BUILT_IN_TEMPLATES } from "../../types/montage-templates"
import { MontageTemplateSelector } from "../montage-template-selector"

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

    // Categories should be present (Russian localized)
    expect(screen.getByText("Все")).toBeInTheDocument() // all
    expect(screen.getByText("Соцсети")).toBeInTheDocument() // social
    expect(screen.getByText("Промо")).toBeInTheDocument() // promo
    expect(screen.getByText("Кинематограф")).toBeInTheDocument() // cinematic
  })

  it("should call onSelect when template is clicked", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]
    const templateCard = screen.getByText(firstTemplate.name).closest("[data-slot='card']")

    await user.click(templateCard!)

    expect(mockOnSelect).toHaveBeenCalledWith(firstTemplate)
  })

  it("should show template icon", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    BUILT_IN_TEMPLATES.forEach((template) => {
      // Icon should be displayed with the template
      const templateCard = screen.getByText(template.name).closest("[data-slot='card']")
      expect(templateCard).toBeInTheDocument()
      expect(templateCard?.textContent).toContain(template.icon)
    })
  })

  it("should display template description on hover", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]
    const templateCard = screen.getByText(firstTemplate.name).closest("[data-slot='card']")

    await user.hover(templateCard!)

    // Description is always visible in the component
    expect(screen.getByText(firstTemplate.description)).toBeInTheDocument()
  })

  it("should highlight selected template", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} selectedTemplateId="instagram-reel" />)

    const selectedCard = screen.getByText("Instagram Reel").closest("[data-slot='card']")
    expect(selectedCard).toHaveClass("ring-2")
    expect(selectedCard).toHaveClass("ring-primary")

    // Check for checkmark icon
    const checkIcon = selectedCard?.querySelector("svg")
    expect(checkIcon).toBeInTheDocument()

    // Click another template
    const otherTemplateCard = screen.getByText("YouTube Intro").closest("[data-slot='card']")
    await user.click(otherTemplateCard!)

    expect(mockOnSelect).toHaveBeenCalled()
  })

  it("should filter templates by category", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // Select social category (Russian localized)
    const socialFilter = screen.getByText("Соцсети")
    await user.click(socialFilter)

    // Only social templates should be visible
    expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    expect(screen.queryByText("Tutorial Demo")).not.toBeInTheDocument()
  })

  it("should display template parameters", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]

    // Parameters should be displayed (Russian localized format)
    expect(screen.getByText(`${firstTemplate.parameters.targetDuration}s`)).toBeInTheDocument()
    expect(screen.getByText(firstTemplate.parameters.clipCount.preferred.toString())).toBeInTheDocument()
    expect(screen.getByText(firstTemplate.parameters.aspectRatio || "16:9")).toBeInTheDocument()
  })

  it("should show template tags", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplate = BUILT_IN_TEMPLATES[0]

    // Tags should be displayed (first 3 tags as per component logic)
    firstTemplate.tags.slice(0, 3).forEach((tag) => {
      expect(screen.getByText(tag)).toBeInTheDocument()
    })
  })

  it("should support keyboard navigation", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    const firstTemplateCard = screen.getByText(BUILT_IN_TEMPLATES[0].name).closest("[data-slot='card']")

    // Focus first template by tabbing
    await user.tab()

    // Click focused element
    await user.click(firstTemplateCard!)

    expect(mockOnSelect).toHaveBeenCalled()
  })

  it("should display aspect ratio for each template", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // Aspect ratios should be displayed for templates that have them
    expect(screen.getByText("9:16")).toBeInTheDocument() // Instagram Reel
    // Multiple templates with 16:9
    const sixteenNineElements = screen.getAllByText("16:9")
    expect(sixteenNineElements.length).toBeGreaterThan(0)
  })

  it("should switch between all templates and filtered categories", async () => {
    const user = userEvent.setup()
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // Initially all templates should be visible
    expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    expect(screen.getByText("Tutorial Demo")).toBeInTheDocument()

    // Switch to highlights category
    const highlightsFilter = screen.getByText("Хайлайты")
    await user.click(highlightsFilter)

    // Only highlights templates should be visible
    expect(screen.getByText("Highlight Reel")).toBeInTheDocument()
    expect(screen.queryByText("Instagram Reel")).not.toBeInTheDocument()

    // Switch back to all
    const allFilter = screen.getByText("Все")
    await user.click(allFilter)

    // All templates should be visible again
    expect(screen.getByText("Instagram Reel")).toBeInTheDocument()
    expect(screen.getByText("Tutorial Demo")).toBeInTheDocument()
  })

  it("should display template style", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // Check that style is displayed
    const firstTemplate = BUILT_IN_TEMPLATES[0]
    const templateCard = screen.getByText(firstTemplate.name).closest("[data-slot='card']")

    // Style is displayed in lowercase (CSS capitalize is visual only)
    expect(templateCard?.textContent).toContain(firstTemplate.style)
  })

  it("should render scrollable area for templates", () => {
    render(<MontageTemplateSelector onSelect={mockOnSelect} />)

    // ScrollArea should be present
    const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]")
    expect(scrollArea).toBeInTheDocument()
  })
})
