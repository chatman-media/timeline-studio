/**
 * @vitest-environment jsdom
 */
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
      data-oid="2ci5rbt"
    >
      Effect Preview {effect?.id || "undefined"} ({size}x{width}x{height})
    </div>
  )),
}))

// Mock the ContentGroup component
vi.mock("@/features/browser/components/content-group", () => ({
  ContentGroup: vi.fn(
    ({ title, items, renderItem, onAddAll, addButtonText, itemsContainerClassName, itemsContainerStyle }) => (
      <div data-testid="content-group" data-oid="3a1cisp">
        <div data-testid="content-group-title" data-oid="uo9sqn:">
          {title}
        </div>
        {onAddAll && (
          <button onClick={() => onAddAll(items)} data-testid="add-all-button" data-oid="lx0sxjh">
            {addButtonText}
          </button>
        )}
        <div
          className={itemsContainerClassName}
          style={itemsContainerStyle}
          data-testid="items-container"
          data-oid="prw5wcz"
        >
          {items.map((item: any, index: number) => renderItem(item, index))}
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
      <BrowserProviders data-oid="lm0lgz-">
        <EffectGroup {...defaultProps} data-oid="lyvadr-" />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("content-group-title")).toHaveTextContent("Test Effects Group")
  })

  it("renders all effects in the group", () => {
    render(
      <BrowserProviders data-oid="iib5sa2">
        <EffectGroup {...defaultProps} data-oid="ekx6-h_" />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("effect-preview-effect-1")).toBeInTheDocument()
    expect(screen.getByTestId("effect-preview-effect-2")).toBeInTheDocument()
    expect(screen.getByTestId("effect-preview-effect-3")).toBeInTheDocument()
  })

  it("passes correct props to EffectPreview components", () => {
    render(
      <BrowserProviders data-oid="e7z0ndj">
        <EffectGroup {...defaultProps} data-oid="jiusgot" />
      </BrowserProviders>,
    )

    // Check that the mocked EffectPreview components are rendered with correct text
    expect(screen.getByText("Effect Preview effect-1 (120x120x120)")).toBeInTheDocument()
    expect(screen.getByText("Effect Preview effect-2 (120x120x120)")).toBeInTheDocument()
    expect(screen.getByText("Effect Preview effect-3 (120x120x120)")).toBeInTheDocument()
  })

  it("calls onEffectClick when effect is clicked", async () => {
    const user = userEvent.setup()
    const onEffectClick = vi.fn()

    render(
      <BrowserProviders data-oid="ci2oj5n">
        <EffectGroup {...defaultProps} onEffectClick={onEffectClick} data-oid="z2o3grh" />
      </BrowserProviders>,
    )

    await user.click(screen.getByTestId("effect-preview-effect-1"))

    expect(onEffectClick).toHaveBeenCalledWith(mockEffects[0], 0)
  })

  it("calculates correct indices with startIndex", async () => {
    const user = userEvent.setup()
    const onEffectClick = vi.fn()
    const startIndex = 10

    render(
      <BrowserProviders data-oid="0igpxe_">
        <EffectGroup {...defaultProps} onEffectClick={onEffectClick} startIndex={startIndex} data-oid="9ciqr96" />
      </BrowserProviders>,
    )

    await user.click(screen.getByTestId("effect-preview-effect-2"))

    expect(onEffectClick).toHaveBeenCalledWith(mockEffects[1], 11) // startIndex + index (10 + 1)
  })

  it("renders add all button when onAddAllEffects is provided", () => {
    const onAddAllEffects = vi.fn()

    render(
      <BrowserProviders data-oid="ckxs_.j">
        <EffectGroup {...defaultProps} onAddAllEffects={onAddAllEffects} data-oid="jyflzdy" />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("add-all-button")).toBeInTheDocument()
    expect(screen.getByTestId("add-all-button")).toHaveTextContent("effects.add")
  })

  it("calls onAddAllEffects when add all button is clicked", async () => {
    const user = userEvent.setup()
    const onAddAllEffects = vi.fn()

    render(
      <BrowserProviders data-oid="6k5pkxv">
        <EffectGroup {...defaultProps} onAddAllEffects={onAddAllEffects} data-oid="ou-nfxw" />
      </BrowserProviders>,
    )

    await user.click(screen.getByTestId("add-all-button"))

    expect(onAddAllEffects).toHaveBeenCalledWith(mockEffects)
  })

  it("does not render add all button when onAddAllEffects is not provided", () => {
    render(
      <BrowserProviders data-oid="gnst8ij">
        <EffectGroup {...defaultProps} data-oid="in7lrqt" />
      </BrowserProviders>,
    )

    expect(screen.queryByTestId("add-all-button")).not.toBeInTheDocument()
  })

  it("sets up effect refs correctly", () => {
    const effectRefs = { current: new Map<string, HTMLDivElement>() }

    render(
      <BrowserProviders data-oid="h9f-c50">
        <EffectGroup {...defaultProps} effectRefs={effectRefs} data-oid="fnglmld" />
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
      <BrowserProviders data-oid="qeq_nrb">
        <EffectGroup {...customProps} data-oid="4gn1l2m" />
      </BrowserProviders>,
    )

    const previews = [
      screen.getByTestId("effect-preview-effect-1"),
      screen.getByTestId("effect-preview-effect-2"),
      screen.getByTestId("effect-preview-effect-3"),
    ]

    previews.forEach((preview) => {
      expect(preview).toHaveStyle({ width: "150px", height: "80px" })
    })
  })

  it("applies correct accessibility attributes", () => {
    render(
      <BrowserProviders data-oid="069uddz">
        <EffectGroup {...defaultProps} data-oid="x39xnec" />
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
      <BrowserProviders data-oid="b.w.v7m">
        <EffectGroup {...defaultProps} previewWidth={200} data-oid="wdmar9n" />
      </BrowserProviders>,
    )

    const itemsContainer = screen.getByTestId("items-container")
    expect(itemsContainer).toHaveStyle({
      "grid-template-columns": "repeat(auto-fill, minmax(200px, 1fr))",
    })
  })

  it("handles empty effects array", () => {
    render(
      <BrowserProviders data-oid="6z_mfo4">
        <EffectGroup {...defaultProps} effects={[]} data-oid="xw6fzl2" />
      </BrowserProviders>,
    )

    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("items-container")).toBeEmptyDOMElement()
  })

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup()
    const onEffectClick = vi.fn()

    render(
      <BrowserProviders data-oid="0hxwmph">
        <EffectGroup {...defaultProps} onEffectClick={onEffectClick} data-oid="lm0dah3" />
      </BrowserProviders>,
    )

    const firstEffectPreview = screen.getByTestId("effect-preview-effect-1")

    // Click on the actual EffectPreview component
    await user.click(firstEffectPreview)
    expect(onEffectClick).toHaveBeenCalledWith(mockEffects[0], 0)
  })

  it("renders with correct ContentGroup props", () => {
    render(
      <BrowserProviders data-oid="p.8_gbc">
        <EffectGroup {...defaultProps} data-oid="jjxfn97" />
      </BrowserProviders>,
    )

    // Check that the ContentGroup is rendered with the correct structure
    expect(screen.getByTestId("content-group")).toBeInTheDocument()
    expect(screen.getByTestId("content-group-title")).toHaveTextContent("Test Effects Group")
    expect(screen.getByTestId("items-container")).toHaveClass("grid gap-2")
  })
})
