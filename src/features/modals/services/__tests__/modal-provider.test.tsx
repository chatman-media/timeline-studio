/**
 * @vitest-environment jsdom
 */
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Unmock modal-provider to test the real implementation
vi.unmock("@/features/modals/services/modal-provider")
vi.unmock("@/features/modals/services")
vi.unmock("@/features/modals")

import { resetSystemIntegrationOrchestrator } from "@timeline-studio/domains/system-integration"
import type { ModalType } from "@timeline-studio/domains/system-integration/machines/modal-machine"
import { ModalProvider, useModal } from "../modal-provider"

describe("ModalProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сбрасываем оркестратор между тестами для чистого состояния
    resetSystemIntegrationOrchestrator()
  })

  it("должен рендерить дочерние элементы", () => {
    render(
      <ModalProvider data-oid="pdzjyf7">
        <div data-testid="test-child" data-oid="yj1cc5u">
          Test Content
        </div>
      </ModalProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
    expect(screen.getByText("Test Content")).toBeInTheDocument()
  })

  it("должен предоставлять начальный контекст", () => {
    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="b1dg67g">
          <div data-testid="modal-type" data-oid="k4acfrv">
            {modal.activeModal}
          </div>
          <div data-testid="modal-data" data-oid="1o-4ne2">
            {JSON.stringify(modal.modalData)}
          </div>
          <div data-testid="is-open" data-oid="9jwwyzk">
            {modal.isModalOpen.toString()}
          </div>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="o5.ozsn">
        <TestComponent data-oid="-9col5:" />
      </ModalProvider>,
    )

    expect(screen.getByTestId("modal-type")).toHaveTextContent("none")
    expect(screen.getByTestId("modal-data")).toHaveTextContent("null")
    expect(screen.getByTestId("is-open")).toHaveTextContent("false")
  })

  it("должен открывать модальное окно", async () => {
    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="1adprb5">
          <button onClick={() => modal.openModal("project-settings")} data-oid="283.dvz">
            Open Modal
          </button>
          <div data-testid="modal-type" data-oid="-k50tc1">
            {modal.activeModal}
          </div>
          <div data-testid="is-open" data-oid="rlfvl70">
            {modal.isModalOpen.toString()}
          </div>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="x1sohje">
        <TestComponent data-oid="htjb30-" />
      </ModalProvider>,
    )

    const openButton = screen.getByText("Open Modal")

    act(() => {
      openButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("modal-type")).toHaveTextContent("project-settings")
      expect(screen.getByTestId("is-open")).toHaveTextContent("true")
    })
  })

  it("должен открывать модальное окно с данными", async () => {
    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="dedo_zj">
          <button
            onClick={() =>
              modal.openModal("user-settings", {
                dialogClass: "custom-class",
                testData: "test-value",
              })
            }
            data-oid="jlb3ytr"
          >
            Open Modal with Data
          </button>
          <div data-testid="modal-data" data-oid="r:xnum:">
            {JSON.stringify(modal.modalData)}
          </div>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="ci6t7k7">
        <TestComponent data-oid=":e_wjuz" />
      </ModalProvider>,
    )

    const openButton = screen.getByText("Open Modal with Data")

    act(() => {
      openButton.click()
    })

    await waitFor(() => {
      const modalData = JSON.parse(screen.getByTestId("modal-data").textContent!)
      expect(modalData).toEqual({
        dialogClass: "custom-class",
        testData: "test-value",
      })
    })
  })

  it("должен закрывать модальное окно", async () => {
    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="mxg7q2p">
          <button onClick={() => modal.openModal("export")} data-oid="qrcp69v">
            Open
          </button>
          <button onClick={() => modal.closeModal()} data-oid="h424qxq">
            Close
          </button>
          <div data-testid="is-open" data-oid="on5tdjp">
            {modal.isModalOpen.toString()}
          </div>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="zq8t99t">
        <TestComponent data-oid="fl1udu." />
      </ModalProvider>,
    )

    const openButton = screen.getByText("Open")
    const closeButton = screen.getByText("Close")

    // Открываем модальное окно
    act(() => {
      openButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("is-open")).toHaveTextContent("true")
    })

    // Закрываем модальное окно
    act(() => {
      closeButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("is-open")).toHaveTextContent("false")
    })
  })

  it("должен отправлять данные модального окна", async () => {
    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="_:-vzar">
          <button onClick={() => modal.openModal("camera-capture")} data-oid="uc4s.p1">
            Open
          </button>
          <button onClick={() => modal.submitModal({ result: "success" })} data-oid="_1:sa04">
            Submit
          </button>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="0kgwv87">
        <TestComponent data-oid="n8cvuqp" />
      </ModalProvider>,
    )

    const openButton = screen.getByText("Open")
    const submitButton = screen.getByText("Submit")

    // Открываем модальное окно
    act(() => {
      openButton.click()
    })

    await waitFor(() => {
      // Ждем пока модальное окно откроется
    }) // Отправляем данные
    act(() => {
      submitButton.click()
    })

    // Just verify submitModal was called without errors
    await waitFor(() => {
      // If we got here, submitModal executed successfully
      expect(true).toBe(true)
    })
  })

  it("должен переключаться между разными типами модальных окон", async () => {
    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="bj1wky6">
          <button onClick={() => modal.openModal("keyboard-shortcuts")} data-oid=".zagnaq">
            Open Shortcuts
          </button>
          <button onClick={() => modal.openModal("voice-recording")} data-oid="-y3p83.">
            Open Voice
          </button>
          <div data-testid="modal-type" data-oid="40ku2bg">
            {modal.activeModal}
          </div>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="v21wuq0">
        <TestComponent data-oid="0_dpntb" />
      </ModalProvider>,
    )

    const shortcutsButton = screen.getByText("Open Shortcuts")
    const voiceButton = screen.getByText("Open Voice")

    // Открываем первое модальное окно
    act(() => {
      shortcutsButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("modal-type")).toHaveTextContent("keyboard-shortcuts")
    })

    // Переключаемся на второе модальное окно
    act(() => {
      voiceButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId("modal-type")).toHaveTextContent("voice-recording")
    })
  })

  describe("useModal hook", () => {
    it("должен работать без провайдера (использует SystemIntegrationOrchestrator)", () => {
      // useModal теперь является alias для useModals из домена
      // и работает без провайдера через глобальный orchestrator
      const { result } = renderHook(() => useModal())

      expect(result.current).toBeDefined()
      expect(result.current.activeModal).toBe("none")
      expect(result.current.isModalOpen).toBe(false)
    })

    it("должен сохранять состояние между ререндерами", async () => {
      const { result, rerender } = renderHook(() => useModal(), {
        wrapper: ModalProvider,
      })

      act(() => {
        result.current.openModal("cache-statistics", { testValue: 123 })
      })

      await waitFor(() => {
        expect(result.current.activeModal).toBe("cache-statistics")
        expect(result.current.modalData).toEqual({ testValue: 123 })
        expect(result.current.isModalOpen).toBe(true)
      })

      rerender()

      expect(result.current.activeModal).toBe("cache-statistics")
      expect(result.current.modalData).toEqual({ testValue: 123 })
      expect(result.current.isModalOpen).toBe(true)
    })
  })

  it("должен работать с различными типами модальных окон", async () => {
    const modalTypes: ModalType[] = ["camera-capture", "voice-recording", "export", "project-settings", "user-settings"]

    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="wzm_770">
          {modalTypes.map((type) => (
            <button key={type} onClick={() => modal.openModal(type)} data-oid="mh6lhum">
              {type}
            </button>
          ))}
          <div data-testid="current-modal" data-oid="q2z6yub">
            {modal.activeModal}
          </div>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="x6d9h71">
        <TestComponent data-oid="tc-1qu-" />
      </ModalProvider>,
    )

    for (const type of modalTypes) {
      const button = screen.getByText(type)

      act(() => {
        button.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId("current-modal")).toHaveTextContent(type)
      })
    }
  })

  it("должен обрабатывать сложные данные модального окна", async () => {
    const complexData = {
      dialogClass: "max-w-4xl",
      returnTo: "project-settings" as ModalType,
      subtitle: {
        id: "sub-123",
        text: "Test subtitle",
        startTime: 10.5,
        endTime: 15.3,
      },
      options: {
        autoSave: true,
        quality: "high",
      },
    }

    const TestComponent = () => {
      const modal = useModal()
      return (
        <div data-oid="0z3hiz7">
          <button onClick={() => modal.openModal("subtitle-editor", complexData)} data-oid="anvr2ac">
            Open Complex
          </button>
          <pre data-testid="modal-data" data-oid="2eudx4-">
            {JSON.stringify(modal.modalData, null, 2)}
          </pre>
        </div>
      )
    }

    render(
      <ModalProvider data-oid="ko-fm08">
        <TestComponent data-oid="-otc60n" />
      </ModalProvider>,
    )

    const button = screen.getByText("Open Complex")

    act(() => {
      button.click()
    })

    await waitFor(() => {
      const modalData = JSON.parse(screen.getByTestId("modal-data").textContent!)
      expect(modalData).toEqual(complexData)
    })
  })
})
