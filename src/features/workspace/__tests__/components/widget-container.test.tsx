/**
 * @vitest-environment jsdom
 */
/**
 * Tests for WidgetContainer component
 */

import { fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render } from "@/test/test-utils"
import { createMockWidget } from "../../__mocks__/test-data"
import { WidgetContainer } from "../../components/widget-container"

// Mock @dnd-kit/core
vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}))

describe("WidgetContainer", () => {
  const mockWidget = createMockWidget("test-1", "timeline", {
    x: 10,
    y: 20,
    width: 50,
    height: 30,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить дочерние элементы", () => {
    render(
      <WidgetContainer widget={mockWidget} data-oid="56lf-3f">
        <div data-testid="child-content" data-oid="4sqm6pb">
          Child Content
        </div>
      </WidgetContainer>,
    )

    expect(screen.getByTestId("child-content")).toBeInTheDocument()
    expect(screen.getByText("Child Content")).toBeInTheDocument()
  })

  it("должен отображать тип виджета в заголовке", () => {
    render(
      <WidgetContainer widget={mockWidget} data-oid="ghat-ma">
        <div data-oid="ohicm2d">Content</div>
      </WidgetContainer>,
    )

    expect(screen.getByText("timeline")).toBeInTheDocument()
  })

  it("должен применить правильные inline стили для позиционирования", () => {
    render(
      <WidgetContainer widget={mockWidget} data-oid="bmtkf2w">
        <div data-oid="dnytxif">Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement

    expect(widgetElement).toHaveStyle({
      position: "absolute",
      left: "10%",
      top: "20%",
      width: "50%",
      height: "30%",
    })
  })

  it("должен показывать selected состояние", () => {
    const { rerender } = render(
      <WidgetContainer widget={mockWidget} isSelected={false} data-oid="t8waysh">
        <div data-oid="48:1_z1">Content</div>
      </WidgetContainer>,
    )

    let widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).not.toHaveClass("ring-2")

    rerender(
      <WidgetContainer widget={mockWidget} isSelected={true} data-oid=".lja1.z">
        <div data-oid="u-69uqf">Content</div>
      </WidgetContainer>,
    )

    widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveClass("ring-2")
  })

  it("должен вызвать onSelect при клике", () => {
    const onSelect = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onSelect={onSelect} data-oid="-_rkcpr">
        <div data-oid="6itf3d3">Content</div>
      </WidgetContainer>,
    )

    // Находим widget container по классу
    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    fireEvent.click(widgetElement)

    expect(onSelect).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен отображать кнопку минимизации", () => {
    const onMinimize = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onMinimize={onMinimize} data-oid="yi3p.4f">
        <div data-oid="0uxnzv-">Content</div>
      </WidgetContainer>,
    )

    const minimizeBtn = screen.getByTitle("Minimize")
    expect(minimizeBtn).toBeInTheDocument()

    fireEvent.click(minimizeBtn)
    expect(onMinimize).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен отображать кнопку максимизации", () => {
    const onMaximize = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onMaximize={onMaximize} data-oid="elbiq.i">
        <div data-oid="ddxm0ve">Content</div>
      </WidgetContainer>,
    )

    const maximizeBtn = screen.getByTitle("Maximize")
    expect(maximizeBtn).toBeInTheDocument()

    fireEvent.click(maximizeBtn)
    expect(onMaximize).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен отображать кнопку закрытия", () => {
    const onRemove = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onRemove={onRemove} data-oid="6mvxlsv">
        <div data-oid="adf.cpx">Content</div>
      </WidgetContainer>,
    )

    const closeBtn = screen.getByTitle("Close")
    expect(closeBtn).toBeInTheDocument()

    fireEvent.click(closeBtn)
    expect(onRemove).toHaveBeenCalledWith(mockWidget.id)
  })

  it("должен предотвращать всплытие событий на кнопках", () => {
    const onSelect = vi.fn()
    const onMinimize = vi.fn()

    render(
      <WidgetContainer widget={mockWidget} onSelect={onSelect} onMinimize={onMinimize} data-oid="bm44fz3">
        <div data-oid="db022sf">Content</div>
      </WidgetContainer>,
    )

    const minimizeBtn = screen.getByTitle("Minimize")
    fireEvent.click(minimizeBtn)

    // onSelect не должен вызваться при клике на кнопку
    expect(onSelect).not.toHaveBeenCalled()
    expect(onMinimize).toHaveBeenCalledWith(mockWidget.id)
  })

  it("не должен рендериться если виджет минимизирован", () => {
    const minimizedWidget = createMockWidget("test-2", "player", undefined, {
      isMinimized: true,
    })

    render(
      <WidgetContainer widget={minimizedWidget} data-oid="fi-wj2k">
        <div data-oid="kyhrjsb">Content</div>
      </WidgetContainer>,
    )

    // Проверяем что widget container не рендерится
    const widgetElement = document.querySelector(".rounded-lg.border.bg-background")
    expect(widgetElement).toBeNull()
  })

  it("должен применить полупрозрачность для невидимых виджетов", () => {
    const invisibleWidget = createMockWidget("test-3", "browser", undefined, {
      isVisible: false,
    })

    render(
      <WidgetContainer widget={invisibleWidget} data-oid="oz29knn">
        <div data-oid="e2ou60m">Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveStyle({ opacity: "0.3" })
  })

  it("должен блокировать pointer-events для невидимых виджетов", () => {
    const invisibleWidget = createMockWidget("test-4", "options", undefined, {
      isVisible: false,
    })

    render(
      <WidgetContainer widget={invisibleWidget} data-oid="vydyb68">
        <div data-oid="w5ybk3_">Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveStyle({ pointerEvents: "none" })
  })

  it("должен применить правильный z-index", () => {
    const widgetWithZIndex = createMockWidget("test-5", "timeline", undefined, {
      zIndex: 5,
    })

    render(
      <WidgetContainer widget={widgetWithZIndex} data-oid="hdkql1c">
        <div data-oid="v776wdy">Content</div>
      </WidgetContainer>,
    )

    const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
    expect(widgetElement).toHaveStyle({ zIndex: "5" })
  })

  it("не должен отображать кнопки если обработчики не переданы", () => {
    render(
      <WidgetContainer widget={mockWidget} data-oid="dek2vrd">
        <div data-oid="8mb6ykg">Content</div>
      </WidgetContainer>,
    )

    expect(screen.queryByTitle("Minimize")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Maximize")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Close")).not.toBeInTheDocument()
  })

  it("должен отображать drag handle", () => {
    render(
      <WidgetContainer widget={mockWidget} data-oid="h5464pu">
        <div data-oid="vcge-my">Content</div>
      </WidgetContainer>,
    )

    const dragHandle = screen.getByTitle("Drag to move")
    expect(dragHandle).toBeInTheDocument()
  })

  describe("Resize Handles", () => {
    it("должен отображать resize handles когда enableResize=true", () => {
      const { container } = render(
        <WidgetContainer widget={mockWidget} enableResize={true} data-oid="a99szsi">
          <div data-oid="rfzl6qr">Content</div>
        </WidgetContainer>,
      )

      // Corner handles (4 штуки с классом rounded-full)
      const cornerHandles = container.querySelectorAll(".rounded-full")
      expect(cornerHandles).toHaveLength(4)

      // Edge handles (4 штуки)
      const eastHandle = container.querySelector(".cursor-ew-resize.right-0")
      const westHandle = container.querySelector(".cursor-ew-resize.left-0")
      const northHandle = container.querySelector(".cursor-ns-resize.top-0")
      const southHandle = container.querySelector(".cursor-ns-resize.bottom-0")

      expect(eastHandle).toBeInTheDocument()
      expect(westHandle).toBeInTheDocument()
      expect(northHandle).toBeInTheDocument()
      expect(southHandle).toBeInTheDocument()
    })

    it("не должен отображать resize handles когда enableResize=false", () => {
      const { container } = render(
        <WidgetContainer widget={mockWidget} enableResize={false} data-oid="1uorf_a">
          <div data-oid="6ma10cm">Content</div>
        </WidgetContainer>,
      )

      // Corner handles не должны быть
      const cornerHandles = container.querySelectorAll(".rounded-full")
      expect(cornerHandles).toHaveLength(0)

      // Edge handles не должны быть
      const edgeHandles = container.querySelectorAll(".cursor-ew-resize, .cursor-ns-resize")
      expect(edgeHandles).toHaveLength(0)
    })

    it("должен вызывать handleResizeStart при mousedown на east handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="cdhbjg5">
          <div data-oid="67c.932">Content</div>
        </WidgetContainer>,
      )

      const eastHandle = container.querySelector(".cursor-ew-resize.right-0") as HTMLElement
      fireEvent.mouseDown(eastHandle, { clientX: 100, clientY: 100 })

      // Эмулируем движение мыши
      fireEvent.mouseMove(window, { clientX: 150, clientY: 100 })
      fireEvent.mouseUp(window)

      // onResize должен быть вызван
      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на south handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="fc:ppa2">
          <div data-oid="roweqre">Content</div>
        </WidgetContainer>,
      )

      const southHandle = container.querySelector(".cursor-ns-resize.bottom-0") as HTMLElement
      fireEvent.mouseDown(southHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 100, clientY: 150 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на west handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="8yd.bpp">
          <div data-oid="z6u__ih">Content</div>
        </WidgetContainer>,
      )

      const westHandle = container.querySelector(".cursor-ew-resize.left-0") as HTMLElement
      fireEvent.mouseDown(westHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 50, clientY: 100 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на north handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="d-.8:5l">
          <div data-oid=":4uf93v">Content</div>
        </WidgetContainer>,
      )

      const northHandle = container.querySelector(".cursor-ns-resize.top-0") as HTMLElement
      fireEvent.mouseDown(northHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 100, clientY: 50 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на SE corner handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="d_m.8p2">
          <div data-oid="6n6sfvj">Content</div>
        </WidgetContainer>,
      )

      const seHandle = container.querySelector(".cursor-nwse-resize.-bottom-1.-right-1") as HTMLElement
      fireEvent.mouseDown(seHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 150, clientY: 150 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на NE corner handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="obgege8">
          <div data-oid="ug1:ilm">Content</div>
        </WidgetContainer>,
      )

      const neHandle = container.querySelector(".cursor-nesw-resize.-right-1.-top-1") as HTMLElement
      fireEvent.mouseDown(neHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 150, clientY: 50 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на SW corner handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="ge616et">
          <div data-oid="6xikmh8">Content</div>
        </WidgetContainer>,
      )

      const swHandle = container.querySelector(".cursor-nesw-resize.-bottom-1.-left-1") as HTMLElement
      fireEvent.mouseDown(swHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 50, clientY: 150 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен вызывать handleResizeStart при mousedown на NW corner handle", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="5jqnpnw">
          <div data-oid="xv4h724">Content</div>
        </WidgetContainer>,
      )

      const nwHandle = container.querySelector(".cursor-nwse-resize.-left-1.-top-1") as HTMLElement
      fireEvent.mouseDown(nwHandle, { clientX: 100, clientY: 100 })

      fireEvent.mouseMove(window, { clientX: 50, clientY: 50 })
      fireEvent.mouseUp(window)

      expect(onResize).toHaveBeenCalled()
    })

    it("должен предотвращать всплытие событий при resize", () => {
      const onSelect = vi.fn()
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer
          widget={mockWidget}
          onSelect={onSelect}
          onResize={onResize}
          enableResize={true}
          data-oid="afoivlf"
        >
          <div data-oid="13m311.">Content</div>
        </WidgetContainer>,
      )

      const eastHandle = container.querySelector(".cursor-ew-resize.right-0") as HTMLElement
      fireEvent.mouseDown(eastHandle, { clientX: 100, clientY: 100 })

      // onSelect не должен вызываться при resize
      expect(onSelect).not.toHaveBeenCalled()
    })

    it("не должен вызывать onResize если нет movement после mousedown", () => {
      const onResize = vi.fn()
      const { container } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="m:t56rb">
          <div data-oid="gpc7u_m">Content</div>
        </WidgetContainer>,
      )

      const eastHandle = container.querySelector(".cursor-ew-resize.right-0") as HTMLElement
      fireEvent.mouseDown(eastHandle, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(window)

      // onResize не должен быть вызван без движения
      expect(onResize).not.toHaveBeenCalled()
    })

    it("должен удалять event listeners при unmount", () => {
      const onResize = vi.fn()
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

      const { container, unmount } = render(
        <WidgetContainer widget={mockWidget} onResize={onResize} enableResize={true} data-oid="0gh7-1c">
          <div data-oid="0okznd1">Content</div>
        </WidgetContainer>,
      )

      const eastHandle = container.querySelector(".cursor-ew-resize.right-0") as HTMLElement
      fireEvent.mouseDown(eastHandle, { clientX: 100, clientY: 100 })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe("Dragging State", () => {
    // Тесты для dragging требуют изменения mock на уровне модуля
    // Поскольку mock определен статически, проверяем базовое поведение без dragging

    it("не должен иметь opacity-50 класс когда isDragging=false", () => {
      const { container } = render(
        <WidgetContainer widget={mockWidget} data-oid="trclv1-">
          <div data-oid="nbtc:36">Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background")
      expect(widgetElement).not.toHaveClass("opacity-50")
    })

    it("должен иметь z-index равный zIndex виджета когда не dragging", () => {
      const widgetWithZIndex = createMockWidget("test-no-drag", "timeline", undefined, { zIndex: 5 })

      const { container } = render(
        <WidgetContainer widget={widgetWithZIndex} data-oid="glycm-b">
          <div data-oid="5xs.xht">Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      expect(widgetElement).toHaveStyle({ zIndex: "5" })
    })

    it("должен иметь transform: undefined когда нет transform от useDraggable", () => {
      const { container } = render(
        <WidgetContainer widget={mockWidget} data-oid="kg6_4de">
          <div data-oid="ez4nagy">Content</div>
        </WidgetContainer>,
      )

      const widgetElement = container.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      // transform будет undefined или none когда нет transform от useDraggable
      const computedStyle = window.getComputedStyle(widgetElement)
      expect(computedStyle.transform === "none" || computedStyle.transform === "").toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("должен обрабатывать виджет без config", () => {
      const widgetWithoutConfig = createMockWidget("no-config", "player")

      render(
        <WidgetContainer widget={widgetWithoutConfig} data-oid="xsm1dhm">
          <div data-oid="r3ji56t">Content</div>
        </WidgetContainer>,
      )

      expect(screen.getByText("Content")).toBeInTheDocument()
    })

    it("должен корректно отображать все типы виджетов", () => {
      const widgetTypes: Array<"timeline" | "player" | "browser" | "options" | "ai-chat" | "ai-suggestions"> = [
        "timeline",
        "player",
        "browser",
        "options",
        "ai-chat",
        "ai-suggestions",
      ]

      widgetTypes.forEach((type) => {
        const widget = createMockWidget(`widget-${type}`, type)

        const { container, unmount } = render(
          <WidgetContainer widget={widget} data-oid="6rwwb:y">
            <div data-oid="9o-zxp5">{type} content</div>
          </WidgetContainer>,
        )

        expect(screen.getByText(type)).toBeInTheDocument()
        expect(screen.getByText(`${type} content`)).toBeInTheDocument()

        unmount()
      })
    })

    it("должен корректно работать с bounds на границах (0%, 100%)", () => {
      const edgeBoundsWidget = createMockWidget("edge-bounds", "timeline", {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      })

      render(
        <WidgetContainer widget={edgeBoundsWidget} data-oid="v23x.fb">
          <div data-oid="2d.3pcw">Content</div>
        </WidgetContainer>,
      )

      const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement
      expect(widgetElement).toHaveStyle({
        left: "0%",
        top: "0%",
        width: "100%",
        height: "100%",
      })
    })

    it("должен работать без onSelect callback", () => {
      render(
        <WidgetContainer widget={mockWidget} data-oid="9pj:o9a">
          <div data-oid="dvwi9nw">Content</div>
        </WidgetContainer>,
      )

      const widgetElement = document.querySelector(".rounded-lg.border.bg-background") as HTMLElement

      // Не должно выбрасывать ошибку
      expect(() => {
        fireEvent.click(widgetElement)
      }).not.toThrow()
    })

    it("должен работать без onResize callback", () => {
      const { container } = render(
        <WidgetContainer widget={mockWidget} enableResize={true} data-oid="v48vz60">
          <div data-oid="s1-3fp3">Content</div>
        </WidgetContainer>,
      )

      const eastHandle = container.querySelector(".cursor-ew-resize.right-0") as HTMLElement

      // Не должно выбрасывать ошибку
      expect(() => {
        fireEvent.mouseDown(eastHandle, { clientX: 100, clientY: 100 })
        fireEvent.mouseMove(window, { clientX: 150, clientY: 100 })
        fireEvent.mouseUp(window)
      }).not.toThrow()
    })
  })
})
