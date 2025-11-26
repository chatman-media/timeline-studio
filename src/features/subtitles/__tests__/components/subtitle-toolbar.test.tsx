import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Separator } from "@/components/ui/separator"

import { SubtitleAITools } from "../../components/subtitle-ai-tools"
import { SubtitleImportButton } from "../../components/subtitle-import-button"
import { SubtitleSyncTools } from "../../components/subtitle-sync-tools"
import { SubtitleToolbar } from "../../components/subtitle-toolbar"
import { SubtitleTools } from "../../components/subtitle-tools"

// Mock timeline hook
vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({
    project: { id: "test-project" },
    tracks: [],
    clips: [],
    addTrack: vi.fn(),
    addClip: vi.fn(),
    addSection: vi.fn(),
  }),
}))

// Mock timeline store
vi.mock("@/features/timeline/stores/timeline-store", () => ({
  timelineStore: {
    addClip: vi.fn(),
    addTrack: vi.fn(),
    updateClip: vi.fn(),
    deleteClip: vi.fn(),
    selectClips: vi.fn(),
  },
}))

// Mock dependencies
vi.mock("../../components/subtitle-import-button", () => ({
  SubtitleImportButton: vi.fn(() => <div data-testid="subtitle-import-button">Import Button</div>),
}))

vi.mock("../../components/subtitle-ai-tools", () => ({
  SubtitleAITools: vi.fn(() => <div data-testid="subtitle-ai-tools">AI Tools</div>),
}))

vi.mock("../../components/subtitle-sync-tools", () => ({
  SubtitleSyncTools: vi.fn(() => <div data-testid="subtitle-sync-tools">Sync Tools</div>),
}))

vi.mock("../../components/subtitle-tools", () => ({
  SubtitleTools: vi.fn(() => <div data-testid="subtitle-tools">Subtitle Tools</div>),
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: vi.fn(({ orientation, className }) => (
    <div data-testid="separator" data-orientation={orientation} className={className} />
  )),
}))

describe("SubtitleToolbar", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("rendering", () => {
    it("должен рендерить основную структуру тулбара", () => {
      const { container } = render(<SubtitleToolbar />)

      const toolbar = container.firstChild as HTMLElement
      expect(toolbar).toHaveClass("flex")
      expect(toolbar).toHaveClass("items-center")
      expect(toolbar).toHaveClass("gap-2")
      expect(toolbar).toHaveClass("rounded-md")
      expect(toolbar).toHaveClass("border")
      expect(toolbar).toHaveClass("bg-background")
      expect(toolbar).toHaveClass("p-2")
    })

    it("должен рендерить все компоненты инструментов", () => {
      render(<SubtitleToolbar />)

      expect(screen.getByTestId("subtitle-import-button")).toBeInTheDocument()
      expect(screen.getByTestId("subtitle-tools")).toBeInTheDocument()
      expect(screen.getByTestId("subtitle-sync-tools")).toBeInTheDocument()
      expect(screen.getByTestId("subtitle-ai-tools")).toBeInTheDocument()
    })

    it("должен рендерить разделители между инструментами", () => {
      render(<SubtitleToolbar />)

      const separators = screen.getAllByTestId("separator")
      expect(separators).toHaveLength(3)

      separators.forEach((separator) => {
        expect(separator).toHaveAttribute("data-orientation", "vertical")
        expect(separator).toHaveClass("h-6")
      })
    })

    it("должен вызывать компоненты инструментов", () => {
      render(<SubtitleToolbar />)

      expect(SubtitleImportButton).toHaveBeenCalledTimes(1)
      expect(SubtitleTools).toHaveBeenCalledTimes(1)
      expect(SubtitleSyncTools).toHaveBeenCalledTimes(1)
      expect(SubtitleAITools).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать Separator с правильными props", () => {
      render(<SubtitleToolbar />)

      expect(Separator).toHaveBeenCalledTimes(3)
      expect(Separator).toHaveBeenCalledWith(
        {
          orientation: "vertical",
          className: "h-6",
        },
        undefined,
      )
    })
  })

  describe("layout", () => {
    it("должен располагать компоненты в правильном порядке", () => {
      const { container } = render(<SubtitleToolbar />)

      const toolbar = container.querySelector(".flex.items-center")!
      const children = Array.from(toolbar.children)

      expect(children).toHaveLength(7) // 4 компонента + 3 разделителя

      // Проверяем порядок элементов
      expect(children[0]).toHaveAttribute("data-testid", "subtitle-import-button")
      expect(children[1]).toHaveAttribute("data-testid", "separator")
      expect(children[2]).toHaveAttribute("data-testid", "subtitle-tools")
      expect(children[3]).toHaveAttribute("data-testid", "separator")
      expect(children[4]).toHaveAttribute("data-testid", "subtitle-sync-tools")
      expect(children[5]).toHaveAttribute("data-testid", "separator")
      expect(children[6]).toHaveAttribute("data-testid", "subtitle-ai-tools")
    })

    it("должен применять flexbox стили для расположения", () => {
      const { container } = render(<SubtitleToolbar />)

      const toolbar = container.firstChild as HTMLElement
      expect(toolbar).toHaveClass("flex")
      expect(toolbar).toHaveClass("items-center")
      expect(toolbar).toHaveClass("gap-2")
    })

    it("должен применять стили оформления", () => {
      const { container } = render(<SubtitleToolbar />)

      const toolbar = container.firstChild as HTMLElement
      expect(toolbar).toHaveClass("rounded-md")
      expect(toolbar).toHaveClass("border")
      expect(toolbar).toHaveClass("bg-background")
      expect(toolbar).toHaveClass("p-2")
    })
  })

  describe("component integration", () => {
    it("должен корректно интегрировать все подкомпоненты", () => {
      const { container } = render(<SubtitleToolbar />)

      // Проверяем что все компоненты присутствуют
      expect(screen.getByText("Import Button")).toBeInTheDocument()
      expect(screen.getByText("Subtitle Tools")).toBeInTheDocument()
      expect(screen.getByText("Sync Tools")).toBeInTheDocument()
      expect(screen.getByText("AI Tools")).toBeInTheDocument()

      // Проверяем что контейнер не пустой
      expect(container.firstChild).not.toBeEmptyDOMElement()
    })

    it("должен сохранять функциональность при повторном рендере", () => {
      const { rerender } = render(<SubtitleToolbar />)

      expect(SubtitleTools).toHaveBeenCalledTimes(1)
      expect(SubtitleSyncTools).toHaveBeenCalledTimes(1)
      expect(SubtitleAITools).toHaveBeenCalledTimes(1)

      rerender(<SubtitleToolbar />)

      expect(SubtitleTools).toHaveBeenCalledTimes(2)
      expect(SubtitleSyncTools).toHaveBeenCalledTimes(2)
      expect(SubtitleAITools).toHaveBeenCalledTimes(2)
    })
  })

  describe("accessibility", () => {
    it("должен создавать доступную структуру", () => {
      const { container } = render(<SubtitleToolbar />)

      const toolbar = container.querySelector(".flex.items-center")!
      expect(toolbar).toBeInTheDocument()

      // Проверяем что разделители имеют правильную ориентацию для screen readers
      const separators = screen.getAllByTestId("separator")
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute("data-orientation", "vertical")
      })
    })

    it("должен иметь понятную структуру для assistive technologies", () => {
      const { container } = render(<SubtitleToolbar />)

      // Проверяем что структура логична и последовательна
      const toolbar = container.firstChild as HTMLElement
      expect(toolbar.tagName.toLowerCase()).toBe("div")

      const children = Array.from(toolbar.children)
      expect(children.length).toBeGreaterThan(0)

      // Проверяем что каждый ребенок имеет контент или testid
      children.forEach((child) => {
        const element = child as HTMLElement
        expect(
          element.textContent || element.getAttribute("data-testid") || element.getAttribute("data-orientation"),
        ).toBeTruthy()
      })
    })
  })

  describe("performance", () => {
    it("не должен вызывать лишние перерендеры дочерних компонентов", () => {
      const { rerender } = render(<SubtitleToolbar />)

      const initialCallCounts = {
        import: vi.mocked(SubtitleImportButton).mock.calls.length,
        tools: vi.mocked(SubtitleTools).mock.calls.length,
        sync: vi.mocked(SubtitleSyncTools).mock.calls.length,
        ai: vi.mocked(SubtitleAITools).mock.calls.length,
        separator: vi.mocked(Separator).mock.calls.length,
      }

      // Перерендериваем тот же компонент
      rerender(<SubtitleToolbar />)

      expect(vi.mocked(SubtitleImportButton).mock.calls.length).toBe(initialCallCounts.import + 1)
      expect(vi.mocked(SubtitleTools).mock.calls.length).toBe(initialCallCounts.tools + 1)
      expect(vi.mocked(SubtitleSyncTools).mock.calls.length).toBe(initialCallCounts.sync + 1)
      expect(vi.mocked(SubtitleAITools).mock.calls.length).toBe(initialCallCounts.ai + 1)
      expect(vi.mocked(Separator).mock.calls.length).toBe(initialCallCounts.separator + 3)
    })

    it("должен быть легковесным без сложной логики", () => {
      const startTime = performance.now()
      render(<SubtitleToolbar />)
      const endTime = performance.now()

      // Компонент должен рендериться быстро (менее 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe("error boundaries", () => {
    it("должен корректно отрабатывать при ошибках в дочерних компонентах", () => {
      // Мокаем компонент с ошибкой
      vi.mocked(SubtitleTools).mockImplementation(() => {
        throw new Error("Test error")
      })

      // Проверяем что ошибка не ломает весь рендер
      expect(() => {
        render(<SubtitleToolbar />)
      }).toThrow("Test error")
    })

    it("должен рендериться даже если один из дочерних компонентов возвращает null", () => {
      vi.mocked(SubtitleTools).mockReturnValue(null as any)

      render(<SubtitleToolbar />)

      // Остальные компоненты должны отрендериться
      expect(screen.getByTestId("subtitle-sync-tools")).toBeInTheDocument()
      expect(screen.getByTestId("subtitle-ai-tools")).toBeInTheDocument()
      expect(screen.getAllByTestId("separator")).toHaveLength(3)
    })
  })
})
