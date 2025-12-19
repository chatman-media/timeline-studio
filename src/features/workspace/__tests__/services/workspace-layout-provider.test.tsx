/**
 * @vitest-environment jsdom
 */
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
      <WorkspaceLayoutProvider data-oid="uf0os4e">
        <div data-testid="test-child" data-oid="n4d:8:1">
          Test Content
        </div>
      </WorkspaceLayoutProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("должен предоставлять начальный контекст", () => {
    const TestComponent = () => {
      const workspace = useWorkspaceLayout()
      return (
        <div data-oid="a05i1j6">
          <div data-testid="current-preset" data-oid="4i:ptat">
            {workspace.currentPresetId}
          </div>
          <div data-testid="active-widgets-count" data-oid="hgzwpw0">
            {workspace.activeWidgets.length}
          </div>
          <div data-testid="is-dragging" data-oid="w9ds5kg">
            {workspace.isDragging.toString()}
          </div>
        </div>
      )
    }

    render(
      <WorkspaceLayoutProvider data-oid="7-k55vi">
        <TestComponent data-oid="ke0k9_e" />
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
          <div data-oid="-697dk7">
            <button onClick={() => workspace.switchPreset("vertical")} data-oid="d8u-l2d">
              Switch to Vertical
            </button>
            <div data-testid="current-preset" data-oid="rfl3989">
              {workspace.currentPresetId}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="_hoza50">
          <TestComponent data-oid="sn4-:2-" />
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
          <div data-oid="y_g41oe">
            <button onClick={() => workspace.addWidget(newWidget)} data-oid="q.wzhjk">
              Add Widget
            </button>
            <div data-testid="widgets-count" data-oid="fzlautu">
              {workspace.activeWidgets.length}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="fu_851v">
          <TestComponent data-oid="o1bfppt" />
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
          <div data-oid="hdhvin_">
            <button onClick={() => widgetId && workspace.removeWidget(widgetId)} data-oid="2zwk-np">
              Remove Widget
            </button>
            <div data-testid="widgets-count" data-oid="3kkk.7r">
              {workspace.activeWidgets.length}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="7rp31n-">
          <TestComponent data-oid="ngf-jkk" />
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
          <div data-oid="6ln6p95">
            <button onClick={() => widget && workspace.updateWidgetBounds(widget.id, newBounds)} data-oid="91a6s78">
              Update Bounds
            </button>
            <div data-testid="widget-x" data-oid="kerkhst">
              {workspace.activeWidgets[0]?.bounds.x}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="oo6mim3">
          <TestComponent data-oid="vr1jij5" />
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
          <div data-oid="na9swos">
            <button onClick={() => widgetId && workspace.minimizeWidget(widgetId)} data-oid="p1pr5nv">
              Minimize
            </button>
            <button onClick={() => widgetId && workspace.maximizeWidget(widgetId)} data-oid="8:xx1tj">
              Maximize
            </button>
            <div data-testid="is-minimized" data-oid="n-86:it">
              {workspace.activeWidgets[0]?.isMinimized.toString()}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid=".3y844c">
          <TestComponent data-oid="62_w09n" />
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
          <div data-oid="s7fpzld">
            <button onClick={() => widgetId && workspace.selectWidget(widgetId)} data-oid="5lkthti">
              Select Widget
            </button>
            <div data-testid="selected-widget" data-oid="7sp-4jx">
              {workspace.selectedWidgetId || "none"}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="8gwmsd5">
          <TestComponent data-oid="x-8y22a" />
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
          <div data-oid="jx2tcnk">
            <button onClick={() => workspace.saveCustomLayout("My Layout", "Test description")} data-oid="4pxyopo">
              Save Layout
            </button>
            <button onClick={() => layoutId && workspace.deleteCustomLayout(layoutId)} data-oid="mj6cknr">
              Delete Layout
            </button>
            <div data-testid="layouts-count" data-oid="dthbon2">
              {workspace.customLayouts.length}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="eg2qkxy">
          <TestComponent data-oid="s::cyb0" />
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
          <div data-oid="pfpfnca">
            <button
              onClick={() =>
                widget &&
                workspace.updateWidgetBounds(widget.id, {
                  x: 99,
                  y: 99,
                  width: 10,
                  height: 10,
                })
              }
              data-oid="6kybzr6"
            >
              Modify Widget
            </button>
            <button onClick={() => workspace.resetToPreset()} data-oid="e6j452a">
              Reset
            </button>
            <div data-testid="widget-x" data-oid="jgs5gjt">
              {workspace.activeWidgets[0]?.bounds.x}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="fyyf:xo">
          <TestComponent data-oid="dh1br73" />
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

  describe("toggleWidgetVisibility", () => {
    it("должен переключать видимость виджета", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div data-oid="8f.t:mz">
            <button onClick={() => widgetId && workspace.toggleWidgetVisibility(widgetId)} data-oid="izjx:ls">
              Toggle Visibility
            </button>
            <div data-testid="is-visible" data-oid="j9w_d7_">
              {workspace.activeWidgets[0]?.isVisible.toString()}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="jis:s0y">
          <TestComponent data-oid="bb104ip" />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Toggle Visibility")

      // Изначально visible = true
      expect(screen.getByTestId("is-visible")).toHaveTextContent("true")

      // Переключаем на false
      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-visible")).toHaveTextContent("false")
      })

      // Переключаем обратно на true
      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-visible")).toHaveTextContent("true")
      })
    })
  })

  describe("Resize operations", () => {
    it("должен начать resize виджета", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div data-oid="-addine">
            <button onClick={() => widgetId && workspace.startResize(widgetId, "se")} data-oid="1qflne9">
              Start Resize
            </button>
            <div data-testid="is-resizing" data-oid="eqd7u16">
              {workspace.isResizing.toString()}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="6nm7k5x">
          <TestComponent data-oid="ft6fv7f" />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Start Resize")

      // Изначально isResizing = false
      expect(screen.getByTestId("is-resizing")).toHaveTextContent("false")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-resizing")).toHaveTextContent("true")
      })
    })

    it("должен обновлять размер виджета во время resize", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id
        const newBounds = { x: 5, y: 10, width: 25, height: 35 }

        return (
          <div data-oid="-wy6w-1">
            <button onClick={() => widgetId && workspace.startResize(widgetId, "se")} data-oid="6wsf1up">
              Start Resize
            </button>
            <button onClick={() => workspace.updateResize(newBounds)} data-oid="382n25z">
              Update Resize
            </button>
            <div data-testid="widget-width" data-oid="olvslhm">
              {workspace.activeWidgets[0]?.bounds.width}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="8d_qwrf">
          <TestComponent data-oid="tssta-0" />
        </WorkspaceLayoutProvider>,
      )

      const startBtn = screen.getByText("Start Resize")
      const updateBtn = screen.getByText("Update Resize")

      // Начинаем resize
      act(() => {
        startBtn.click()
      })

      // Обновляем размер
      act(() => {
        updateBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("widget-width")).toHaveTextContent("25")
      })
    })

    it("должен завершать resize виджета", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div data-oid="q9kbrfi">
            <button onClick={() => widgetId && workspace.startResize(widgetId, "e")} data-oid="un.p8xz">
              Start Resize
            </button>
            <button onClick={() => workspace.endResize()} data-oid="-bcaq99">
              End Resize
            </button>
            <div data-testid="is-resizing" data-oid="uib-u34">
              {workspace.isResizing.toString()}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="gzi5e9v">
          <TestComponent data-oid="pxvy2l9" />
        </WorkspaceLayoutProvider>,
      )

      const startBtn = screen.getByText("Start Resize")
      const endBtn = screen.getByText("End Resize")

      // Начинаем resize
      act(() => {
        startBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-resizing")).toHaveTextContent("true")
      })

      // Завершаем resize
      act(() => {
        endBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("is-resizing")).toHaveTextContent("false")
      })
    })

    it("должен поддерживать все типы resize handles", async () => {
      const handles: Array<"n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"> = [
        "n",
        "s",
        "e",
        "w",
        "ne",
        "nw",
        "se",
        "sw",
      ]

      for (const handle of handles) {
        const { result, unmount } = renderHook(() => useWorkspaceLayout(), {
          wrapper: WorkspaceLayoutProvider,
        })

        const widgetId = result.current.activeWidgets[0]?.id

        act(() => {
          if (widgetId) {
            result.current.startResize(widgetId, handle)
          }
        })

        await waitFor(() => {
          expect(result.current.isResizing).toBe(true)
        })

        act(() => {
          result.current.endResize()
        })

        await waitFor(() => {
          expect(result.current.isResizing).toBe(false)
        })

        unmount()
      }
    })
  })

  describe("send function", () => {
    it("должен позволять отправлять raw events", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div data-oid="ya_gwfz">
            <button onClick={() => widgetId && workspace.send({ type: "SELECT_WIDGET", widgetId })} data-oid="z4084f3">
              Send Select Event
            </button>
            <div data-testid="selected-widget" data-oid="pwzsmkj">
              {workspace.selectedWidgetId || "none"}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="ai85::7">
          <TestComponent data-oid="hmo4n9." />
        </WorkspaceLayoutProvider>,
      )

      const button = screen.getByText("Send Select Event")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("selected-widget")).not.toHaveTextContent("none")
      })
    })
  })

  describe("State access", () => {
    it("должен предоставлять доступ к isDragging", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()

        return (
          <div data-oid="_3tihds">
            <div data-testid="is-dragging" data-oid="papqaf3">
              {workspace.isDragging.toString()}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="y445f5:">
          <TestComponent data-oid="9hmtw12" />
        </WorkspaceLayoutProvider>,
      )

      // Изначально isDragging = false
      expect(screen.getByTestId("is-dragging")).toHaveTextContent("false")
    })

    it("должен предоставлять доступ к customLayouts", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()

        return (
          <div data-oid="u__:sr-">
            <button onClick={() => workspace.saveCustomLayout("Test Layout")} data-oid="a8yw7kp">
              Save
            </button>
            <div data-testid="layouts-count" data-oid=":r3yffo">
              {workspace.customLayouts.length}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="t9nnp23">
          <TestComponent data-oid="kpd_.5t" />
        </WorkspaceLayoutProvider>,
      )

      // Изначально customLayouts пуст
      expect(screen.getByTestId("layouts-count")).toHaveTextContent("0")

      const button = screen.getByText("Save")

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("layouts-count")).toHaveTextContent("1")
      })
    })
  })

  describe("selectWidget with null", () => {
    it("должен сбрасывать выбор при передаче null", async () => {
      const TestComponent = () => {
        const workspace = useWorkspaceLayout()
        const widgetId = workspace.activeWidgets[0]?.id

        return (
          <div data-oid="84kvwp8">
            <button onClick={() => widgetId && workspace.selectWidget(widgetId)} data-oid="t5.0ew.">
              Select
            </button>
            <button onClick={() => workspace.selectWidget(null)} data-oid="_-6vxqj">
              Deselect
            </button>
            <div data-testid="selected-widget" data-oid="5ouhb_v">
              {workspace.selectedWidgetId || "none"}
            </div>
          </div>
        )
      }

      render(
        <WorkspaceLayoutProvider data-oid="mb:j9um">
          <TestComponent data-oid="q6p:i1_" />
        </WorkspaceLayoutProvider>,
      )

      const selectBtn = screen.getByText("Select")
      const deselectBtn = screen.getByText("Deselect")

      // Выбираем виджет
      act(() => {
        selectBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("selected-widget")).not.toHaveTextContent("none")
      })

      // Сбрасываем выбор
      act(() => {
        deselectBtn.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("selected-widget")).toHaveTextContent("none")
      })
    })
  })
})
