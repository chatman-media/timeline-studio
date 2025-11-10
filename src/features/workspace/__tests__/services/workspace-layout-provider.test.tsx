/**
 * Tests for Workspace Layout Provider
 */

import { act, renderHook, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import backend-sync mock
import "@/test/mocks/backend-sync"
import { render } from "@/test/test-utils"
import { createMockWidget } from "../../__mocks__/test-data"
import { useWorkspaceLayout, WorkspaceLayoutProvider } from "../../services/workspace-layout-provider"

describe("WorkspaceLayoutProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить дочерние элементы", () => {
    render(
      <WorkspaceLayoutProvider>
        <div data-testid="test-child">Test Content</div>
      </WorkspaceLayoutProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("должен предоставлять начальный контекст", () => {
    const TestComponent = () => {
      const workspace = useWorkspaceLayout()
      return (
        <div>
          <div data-testid="current-preset">{workspace.currentPresetId}</div>
          <div data-testid="active-widgets-count">{workspace.activeWidgets.length}</div>
          <div data-testid="is-dragging">{workspace.isDragging.toString()}</div>
        </div>
      )
    }

    render(
      <WorkspaceLayoutProvider>
        <TestComponent />
      </WorkspaceLayoutProvider>,
    )

    expect(screen.getByTestId("current-preset")).toHaveTextContent("default")
    expect(screen.getByTestId("active-widgets-count")).toHaveTextContent("3")
    expect(screen.getByTestId("is-dragging")).toHaveTextContent("false")
  })

  describe("switchPreset", () => {
    it("должен переключить preset", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        return (
          <div>
            <button onClick={() => workspace.switchPreset("vertical")}>Switch to Vertical</button>
            <div data-testid="current-preset">{workspace.currentPresetId}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Switch to Vertical")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("current-preset")).toHaveTextContent("vertical")
      })
    })
  })

  describe("addWidget", () => {
    it("должен добавить виджет", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const newWidget = createMockWidget("new-1", "ai-chat")

        return (
          <div>
            <button onClick={() => workspace.addWidget(newWidget)}>Add Widget</button>
            <div data-testid="widgets-count">{workspace.activeWidgets.length}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Add Widget")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("widgets-count")).toHaveTextContent("4")
      })
    })
  })

  describe("removeWidget", () => {
    it("должен удалить виджет", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div>
            <button onClick={() => widgetId && workspace.removeWidget(widgetId)}>Remove Widget</button>
            <div data-testid="widgets-count">{workspace.activeWidgets.length}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Remove Widget")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("widgets-count")).toHaveTextContent("2")
      })
    })
  })

  describe("updateWidgetBounds", () => {
    it("должен обновить границы виджета", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widget = workspace.activeWidgets[0]
        const newBounds = { x: 10, y: 20, width: 30, height: 40 }

        return (
          <div>
            <button onClick={() => widget && workspace.updateWidgetBounds(widget.id, newBounds)}>Update Bounds</button>
            <div data-testid="widget-x">{workspace.activeWidgets[0]?.bounds.x}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Update Bounds")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("widget-x")).toHaveTextContent("10")
      })
    })
  })

  describe("minimizeWidget / maximizeWidget", () => {
    it("должен минимизировать и развернуть виджет", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div>
            <button onClick={() => widgetId && workspace.minimizeWidget(widgetId)}>Minimize</button>
            <button onClick={() => widgetId && workspace.maximizeWidget(widgetId)}>Maximize</button>
            <div data-testid="is-minimized">{workspace.activeWidgets[0]?.isMinimized.toString()}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const minimizeBtn = screen.getByText("Minimize")
      const maximizeBtn = screen.getByText("Maximize")

      // Минимизируем
      act(() => {
        minimizeBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-minimized")).toHaveTextContent("true")
      })

      // Разворачиваем
      act(() => {
        maximizeBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-minimized")).toHaveTextContent("false")
      })
    })
  })

  describe("selectWidget", () => {
    it("должен выбрать виджет", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div>
            <button onClick={() => widgetId && workspace.selectWidget(widgetId)}>Select Widget</button>
            <div data-testid="selected-widget">{workspace.selectedWidgetId || "none"}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Select Widget")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("selected-widget")).not.toHaveTextContent("none")
      })
    })
  })

  describe("saveCustomLayout / deleteCustomLayout", () => {
    it("должен сохранить и удалить custom layout", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const layoutId = workspace.customLayouts[0]?.id

        return (
          <div>
            <button onClick={() => workspace.saveCustomLayout("My Layout", "Test description")}>Save Layout</button>
            <button onClick={() => layoutId && workspace.deleteCustomLayout(layoutId)}>Delete Layout</button>
            <div data-testid="layouts-count">{workspace.customLayouts.length}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const saveBtn = screen.getByText("Save Layout")

      // Сохраняем layout
      act(() => {
        saveBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("layouts-count")).toHaveTextContent("1")
      })

      const deleteBtn = screen.getByText("Delete Layout")

      // Удаляем layout
      act(() => {
        deleteBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("layouts-count")).toHaveTextContent("0")
      })
    })
  })

  describe("resetToPreset", () => {
    it("должен сбросить к текущему preset", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widget = workspace.activeWidgets[0]

        return (
          <div>
            <button
              onClick={() => widget && workspace.updateWidgetBounds(widget.id, { x: 99, y: 99, width: 10, height: 10 })}
            >
              Modify Widget
            </button>
            <button onClick={() => workspace.resetToPreset()}>Reset</button>
            <div data-testid="widget-x">{workspace.activeWidgets[0]?.bounds.x}</div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider>
          <TestComponent />
        </WorkspaceLayoutProvider>,
      )

      const modifyBtn = screen.getByText("Modify Widget")
      const resetBtn = screen.getByText("Reset")

      // Модифицируем
      act(() => {
        modifyBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("widget-x")).toHaveTextContent("99")
      })

      // Сбрасываем
      act(() => {
        resetBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("widget-x")).not.toHaveTextContent("99")
      })
    })
  })

  describe("useWorkspaceLayout hook", () => {
    it("должен выбрасывать ошибку если используется вне провайдера", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useWorkspaceLayout())
      }).toThrow("useWorkspaceLayout must be used within WorkspaceLayoutProvider")

      consoleErrorSpy.mockRestore()
    })

    it("должен сохранять состояние между ререндерами", async () => {
      const { result, rerender } = renderHook(() => useWorkspaceLayout(), {
        wrapper: WorkspaceLayoutProvider,
      })

      const widget = createMockWidget("test-1", "ai-chat")

      act(() => {
        result.current.addWidget(widget)
      })

      await waitFor(() => {
        expect(result.current.activeWidgets).toHaveLength(4)
      })

      rerender()

      expect(result.current.activeWidgets).toHaveLength(4)
    })
  })
})
