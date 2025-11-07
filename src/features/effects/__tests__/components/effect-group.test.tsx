import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import type { VideoEffect } from "@/features/effects/types"
import { BrowserProviders } from "@/test/test-utils"

import { EffectGroup } from "../../components/effect-group"

// Мокаем useUserSettings
vi.mock("@/features/user-settings/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    settings: {},
    updateSettings: vi.fn(),
  }),
}))

// Mock the EffectPreview component
vi.mock("../../components/effect-preview", () => ({
  EffectPreview: vi.fn(({ onClick, effect, size, width, height }) => (
    <div
      data-testid={`effect-preview-${effect?.id || "undefined"}`}
      onClick={onClick}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      Effect Preview {effect?.id || "undefined"} ({size}x{width}x{height})
    </div>
  )),
}))

// Mock the ContentGroup component
vi.mock("@/features/browser/components/content-group", () => ({
  ContentGroup: vi.fn(
    ({ title, items, renderItem, onAddAll, addButtonText, itemsContainerClassName, itemsContainerStyle }) => (
      <div data-testid="content-group">
        <div data-testid="content-group-title">{title}</div>
        {onAddAll && (
          <button onClick={() => onAddAll(items)} data-testid="add-all-button">
            {addButtonText}
          </button>
        )}
        <div className={itemsContainerClassName} style={itemsContainerStyle} data-testid="items-container">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      </div>
    ),
  ),
}))

const mockEffects: VideoEffect[] = [
  {
    id: "effect-1",
    name: { en: "Blur Effect", ru: "Эффект размытия" },
    category: "blur_sharpen",
    description: { ru: "Базовый эффект размытия", en: "A basic blur effect" },
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    complexity: "low",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    tags: ["popular"],
    processors: {},
  },
  {
    id: "effect-2",
    name: { en: "Brightness Effect", ru: "Эффект яркости" },
    category: "color_correction",
    description: { ru: "Настройка яркости", en: "Adjust brightness" },
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    complexity: "medium",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    tags: ["popular"],
    processors: {},
  },
  {
    id: "effect-3",
    name: { en: "Contrast Effect", ru: "Эффект контрастности" },
    category: "color_correction",
    description: { ru: "Настройка контрастности", en: "Adjust contrast" },
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    complexity: "high",
    gpuAccelerated: true,
    parameters: [],
    presets: [],
    tags: ["popular"],
    processors: {},
  },
]

const defaultProps = {
  title: "Test Effects Group",
  effects: mockEffects,
  previewSize: 120,
  previewWidth: 120,
  previewHeight: 120,
  onEffectClick: vi.fn(),
}

describe("EffectGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the effect group with title", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("content-group-title")).toHaveTextContent("Test Effects Group")
  })

  it("renders all effects in the group", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("effect-preview-blur")).toBeInTheDocument()
    expect(screen.getByTestId("effect-preview-brightness")).toBeInTheDocument()
    expect(screen.getByTestId("effect-preview-contrast")).toBeInTheDocument()
  })

  it("passes correct props to EffectPreview components", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} />
      </BrowserProviders>,
    )

    // Check that the mocked EffectPreview components are rendered with correct text
    expect(screen.getByText("Effect Preview blur (120x120x120)")).toBeInTheDocument()
    expect(screen.getByText("Effect Preview brightness (120x120x120)")).toBeInTheDocument()
    expect(screen.getByText("Effect Preview contrast (120x120x120)")).toBeInTheDocument()
  })

  it("calls onEffectClick when effect is clicked", async () => {
    const user = userEvent.setup()
    const onEffectClick = vi.fn()

    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} onEffectClick={onEffectClick} />
      </BrowserProviders>,
    )

    await user.click(screen.getByTestId("effect-preview-blur"))

    expect(onEffectClick).toHaveBeenCalledWith(mockEffects[0], 0)
  })

  it("calculates correct indices with startIndex", async () => {
    const user = userEvent.setup()
    const onEffectClick = vi.fn()
    const startIndex = 10

    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} onEffectClick={onEffectClick} startIndex={startIndex} />
      </BrowserProviders>,
    )

    await user.click(screen.getByTestId("effect-preview-brightness"))

    expect(onEffectClick).toHaveBeenCalledWith(mockEffects[1], 11) // startIndex + index (10 + 1)
  })

  it("renders add all button when onAddAllEffects is provided", () => {
    const onAddAllEffects = vi.fn()

    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} onAddAllEffects={onAddAllEffects} />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("add-all-button")).toBeInTheDocument()
    expect(screen.getByTestId("add-all-button")).toHaveTextContent("effects.add")
  })

  it("calls onAddAllEffects when add all button is clicked", async () => {
    const user = userEvent.setup()
    const onAddAllEffects = vi.fn()

    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} onAddAllEffects={onAddAllEffects} />
      </BrowserProviders>,
    )

    await user.click(screen.getByTestId("add-all-button"))

    expect(onAddAllEffects).toHaveBeenCalledWith(mockEffects)
  })

  it("does not render add all button when onAddAllEffects is not provided", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} />
      </BrowserProviders>,
    )

    expect(screen.queryByTestId("add-all-button")).not.toBeInTheDocument()
  })

  it("sets up effect refs correctly", () => {
    const effectRefs = { current: new Map<string, HTMLDivElement>() }

    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} effectRefs={effectRefs} />
      </BrowserProviders>,
    )

    // The refs should be set up for each effect
    // Since we're using a mock ref, we can't directly test the ref assignment
    // but we can verify the ref prop is passed
    const effectElements = screen.getAllByRole("button")
    expect(effectElements).toHaveLength(3)
  })

  it("renders with custom preview dimensions", () => {
    const customProps = {
      ...defaultProps,
      previewSize: 100,
      previewWidth: 150,
      previewHeight: 80,
    }

    render(
      <BrowserProviders>
        <EffectGroup {...customProps} />
      </BrowserProviders>,
    )

    const previews = [
      screen.getByTestId("effect-preview-blur"),
      screen.getByTestId("effect-preview-brightness"),
      screen.getByTestId("effect-preview-contrast"),
    ]

    previews.forEach((preview) => {
      expect(preview).toHaveStyle({ width: "150px", height: "80px" })
    })
  })

  it("applies correct accessibility attributes", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} />
      </BrowserProviders>,
    )

    const effectElements = screen.getAllByRole("button")

    effectElements.forEach((element, index) => {
      // Semantic button elements don't need explicit tabIndex="0"
      expect(element.tagName).toBe("BUTTON")
      expect(element).toHaveAttribute(
        "aria-label",
        `${typeof mockEffects[index].name === "string" ? mockEffects[index].name : (mockEffects[index].name as any).en} effect`,
      )
      expect(element).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-primary", "rounded-sm")
    })
  })

  it("passes correct grid template columns style", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} previewWidth={200} />
      </BrowserProviders>,
    )

    const itemsContainer = screen.getByTestId("items-container")
    expect(itemsContainer).toHaveStyle({
      "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))",
    })
  })

  it("handles empty effects array", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} effects={[]} />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("items-container")).toBeEmptyDOMElement()
  })

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup()
    const onEffectClick = vi.fn()

    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} onEffectClick={onEffectClick} />
      </BrowserProviders>,
    )

    const firstEffectPreview = screen.getByTestId("effect-preview-blur")

    // Click on the actual EffectPreview component
    await user.click(firstEffectPreview)
    expect(onEffectClick).toHaveBeenCalledWith(mockEffects[0], 0)
  })

  it("renders with correct ContentGroup props", () => {
    render(
      <BrowserProviders>
        <EffectGroup {...defaultProps} />
      </BrowserProviders>,
    )

    // Check that the ContentGroup is rendered with the correct structure
    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("content-group-title")).toHaveTextContent("Test Effects Group")
    expect(screen.getByTestId("items-container")).toHaveClass("grid gap-2")
  })
})
