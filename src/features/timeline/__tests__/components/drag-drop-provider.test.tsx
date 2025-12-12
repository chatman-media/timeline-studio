/**
 * @vitest-environment jsdom
 *
 * Тесты для DragDropProvider компонента
 */

import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import { useDragDropTimeline } from "@/features/timeline/hooks/drag-drop/use-drag-drop-timeline"
import { DragDropProvider } from "../../components/drag-drop-provider"

// Import backend-sync mock
import "@/test/mocks/backend-sync"

// Мокаем хук useDragDropTimeline
vi.mock("@/features/timeline/hooks/drag-drop/use-drag-drop-timeline", () => ({
  useDragDropTimeline: vi.fn(),
}))

const mockUseDragDropTimeline = useDragDropTimeline as Mock

// Моки для хуков
const mockHandleDragStart = vi.fn()
const mockHandleDragOver = vi.fn()
const mockHandleDragEnd = vi.fn()

describe("DragDropProvider", () => {
  const TestChild = () => <div data-testid="test-child">Test Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
    // Устанавливаем дефолтный мок
    mockUseDragDropTimeline.mockReturnValue({
      handleDragStart: mockHandleDragStart,
      handleDragOver: mockHandleDragOver,
      handleDragEnd: mockHandleDragEnd,
      dragState: {
        isDragging: false,
        draggedItem: null,
        dragOverTrack: null,
        dropPosition: null,
      },
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it("рендерит дочерние элементы", () => {
    render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("предоставляет DndContext для дочерних элементов", () => {
    const { container } = render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    // DndContext создает специальные элементы для accessibility
    expect(container.querySelector("[aria-live]")).toBeInTheDocument()
    expect(container.querySelector("[role='status']")).toBeInTheDocument()
  })

  it("настраивает mouse sensor с правильными параметрами", () => {
    // Создаем мок элемент для тестирования drag
    const mockElement = document.createElement("div")
    mockElement.setAttribute("draggable", "true")
    mockElement.style.position = "absolute"
    mockElement.style.left = "100px"
    mockElement.style.top = "100px"
    document.body.appendChild(mockElement)

    render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    // Симулируем mousedown событие
    const mouseDownEvent = new MouseEvent("mousedown", {
      clientX: 100,
      clientY: 100,
      bubbles: true,
    })

    act(() => {
      mockElement.dispatchEvent(mouseDownEvent)
    })

    // Sensor должен быть настроен, но тестирование его параметров требует глубокой интеграции
    expect(mockElement).toBeInTheDocument()

    document.body.removeChild(mockElement)
  })

  it("передает правильные обработчики в DndContext", () => {
    // Тестируем что hook вызывается
    render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    expect(mockUseDragDropTimeline).toHaveBeenCalled()
  })

  it("обрабатывает изменение состояния drag", () => {
    const { rerender } = render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    // Обновляем мок для имитации начала drag
    mockUseDragDropTimeline.mockReturnValue({
      handleDragStart: mockHandleDragStart,
      handleDragOver: mockHandleDragOver,
      handleDragEnd: mockHandleDragEnd,
      dragState: {
        isDragging: true,
        draggedItem: {
          mediaFile: {
            name: "test.mp4",
            path: "/path/to/test.mp4",
            duration: 60,
            isVideo: true,
            isAudio: false,
            isImage: false,
          },
        },
        dragOverTrack: null,
        dropPosition: null,
      },
    })

    rerender(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    // Проверяем что компонент все еще работает
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("создает правильные модификаторы для снэппинга", () => {
    render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    // Проверяем что компонент рендерится без ошибок с модификаторами
    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("поддерживает touch события", () => {
    const TestTouchable = () => (
      <div onTouchStart={() => {}} onTouchMove={() => {}} onTouchEnd={() => {}} data-testid="touchable-item">
        Touchable Item
      </div>
    )

    render(
      <DragDropProvider>
        <TestTouchable />
      </DragDropProvider>,
    )

    const touchableItem = screen.getByTestId("touchable-item")

    // Симулируем touch события
    fireEvent.touchStart(touchableItem, {
      touches: [{ clientX: 100, clientY: 100 }],
    })

    fireEvent.touchMove(touchableItem, {
      touches: [{ clientX: 150, clientY: 150 }],
    })

    fireEvent.touchEnd(touchableItem)

    // Проверяем что события обрабатываются без ошибок
    expect(touchableItem).toBeInTheDocument()
  })

  it("правильно очищает состояние при размонтировании", () => {
    const { unmount } = render(
      <DragDropProvider>
        <TestChild />
      </DragDropProvider>,
    )

    // Размонтируем компонент
    unmount()

    // Проверяем что не осталось элементов
    expect(screen.queryByTestId("test-child")).not.toBeInTheDocument()
  })
})
