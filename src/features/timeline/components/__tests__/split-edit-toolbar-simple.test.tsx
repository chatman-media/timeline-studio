import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SplitEditToolbar } from "../split-edit-toolbar"

// Минимальный мок хука use-split-edit
vi.mock("../../hooks/editing/use-split-edit", () => ({
  useSplitEdit: () => ({
    config: {
      enabled: true,
      activeEdits: [],
      tool: "razor",
    },
    toolSettings: {
      magneticSnap: false,
      snapDistance: 10,
      autoAlign: false,
      showGuides: false,
      syncTracks: false,
      mode: "normal",
    },
    visualSettings: {
      showPreview: true,
      previewPosition: 0,
      operationType: "L-cut",
      indicatorColor: "#3b82f6",
      indicatorOpacity: 0.5,
    },
    activeSplitEdits: [],
    isEnabled: true,
    toggleSplitEdit: vi.fn(),
    setTool: vi.fn(),
    updateToolSettings: vi.fn(),
    clearAllSplitEdits: vi.fn(),
    createLCut: vi.fn(),
    createJCut: vi.fn(),
    splitAtPlayhead: vi.fn(),
    removeSplitEdit: vi.fn(),
    getSplitEditsForClip: vi.fn(),
    showPreview: vi.fn(),
    hidePreview: vi.fn(),
    updatePreviewPosition: vi.fn(),
    getLinkedClips: vi.fn(),
    getSnapPosition: vi.fn(),
    performOperation: vi.fn(),
    canPerformOperation: vi.fn(),
    syncSplitEdits: vi.fn(),
    validateSplitEdit: vi.fn(),
  }),
}))

describe("SplitEditToolbar - упрощенные тесты", () => {
  it("рендерит компонент без ошибок", () => {
    render(<SplitEditToolbar />)
    expect(screen.getByText("Split Edit")).toBeInTheDocument()
  })

  it("рендерит компонент в компактном режиме", () => {
    const { container } = render(<SplitEditToolbar compact={true} />)
    expect(container.querySelector('[aria-label="Toggle Split Edit"]')).toBeInTheDocument()
  })

  it("применяет кастомный className", () => {
    const { container } = render(<SplitEditToolbar className="custom-class" />)
    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })
})
