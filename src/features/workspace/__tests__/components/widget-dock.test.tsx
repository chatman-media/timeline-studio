/**
 * @vitest-environment jsdom
 */
/**
 * Tests for Widget Dock Component
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { WidgetDock } from "../../components/widget-dock"
import * as WorkspaceProvider from "../../services/workspace-layout-provider"

describe("WidgetDock", () => {
  const mockMaximizeWidget = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(WorkspaceProvider, "useWorkspaceLayout")
  })

  it("должен рендерить ничего если нет минимизированных виджетов", () => {
    vi.mocked(WorkspaceProvider.useWorkspaceLayout).mockReturnValue({
      activeWidgets: [
        {
          id: "widget-1",
          type: "timeline",
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          isVisible: true,
          isMinimized: false,
          zIndex: 1,
        },
      ],

      maximizeWidget: mockMaximizeWidget,
    } as any)

    const { container } = render(<WidgetDock data-oid="gnfp2jn" />)
    expect(container.firstChild).toBeNull()
  })

  it("должен рендерить dock с минимизированными виджетами", () => {
    vi.mocked(WorkspaceProvider.useWorkspaceLayout).mockReturnValue({
      activeWidgets: [
        {
          id: "widget-1",
          type: "timeline",
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          isVisible: true,
          isMinimized: true,
          zIndex: 1,
        },
        {
          id: "widget-2",
          type: "player",
          bounds: { x: 0, y: 50, width: 100, height: 50 },
          isVisible: true,
          isMinimized: true,
          zIndex: 2,
        },
      ],

      maximizeWidget: mockMaximizeWidget,
    } as any)

    render(<WidgetDock data-oid="fvrj2_0" />)

    expect(screen.getByText("Minimized:")).toBeInTheDocument()
    expect(screen.getByText("timeline")).toBeInTheDocument()
    expect(screen.getByText("player")).toBeInTheDocument()
  })

  it("должен вызывать maximizeWidget при клике на виджет", async () => {
    const user = userEvent.setup()
    vi.mocked(WorkspaceProvider.useWorkspaceLayout).mockReturnValue({
      activeWidgets: [
        {
          id: "widget-1",
          type: "timeline",
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          isVisible: true,
          isMinimized: true,
          zIndex: 1,
        },
      ],

      maximizeWidget: mockMaximizeWidget,
    } as any)

    render(<WidgetDock data-oid="9c.nlor" />)

    const timelineButton = screen.getByTitle("Restore timeline")
    await user.click(timelineButton)

    expect(mockMaximizeWidget).toHaveBeenCalledWith("widget-1")
  })

  it("должен показывать только минимизированные виджеты", () => {
    vi.mocked(WorkspaceProvider.useWorkspaceLayout).mockReturnValue({
      activeWidgets: [
        {
          id: "widget-1",
          type: "timeline",
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          isVisible: true,
          isMinimized: true,
          zIndex: 1,
        },
        {
          id: "widget-2",
          type: "player",
          bounds: { x: 0, y: 50, width: 100, height: 50 },
          isVisible: true,
          isMinimized: false, // Not minimized
          zIndex: 2,
        },
        {
          id: "widget-3",
          type: "browser",
          bounds: { x: 0, y: 0, width: 50, height: 50 },
          isVisible: true,
          isMinimized: true,
          zIndex: 3,
        },
      ],

      maximizeWidget: mockMaximizeWidget,
    } as any)

    render(<WidgetDock data-oid="pdwj1me" />)

    expect(screen.getByText("timeline")).toBeInTheDocument()
    expect(screen.queryByText("player")).not.toBeInTheDocument()
    expect(screen.getByText("browser")).toBeInTheDocument()
  })

  it("должен иметь корректные атрибуты доступности", () => {
    vi.mocked(WorkspaceProvider.useWorkspaceLayout).mockReturnValue({
      activeWidgets: [
        {
          id: "widget-1",
          type: "ai-chat",
          bounds: { x: 0, y: 0, width: 100, height: 50 },
          isVisible: true,
          isMinimized: true,
          zIndex: 1,
        },
      ],

      maximizeWidget: mockMaximizeWidget,
    } as any)

    render(<WidgetDock data-oid="h.7wy0d" />)

    const button = screen.getByTitle("Restore ai-chat")
    expect(button).toHaveAttribute("title", "Restore ai-chat")
  })
})
