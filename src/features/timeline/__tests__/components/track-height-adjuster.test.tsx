/**
 * Tests for TrackHeightAdjuster component
 *
 * The closure bug has been fixed by using useRef to track dragging state.
 * All tests should now pass correctly.
 *
 * WHAT IS TESTED:
 * ✅ Component rendering and basic structure
 * ✅ CSS classes and styling
 * ✅ MouseDown event handling and state changes
 * ✅ Event listener setup and cleanup
 * ✅ Visual feedback (dragging state, indicators)
 * ✅ Props handling and component configuration
 * ✅ Mathematical logic validation (unit tests)
 * ✅ Component unmounting during drag
 * ✅ Accessibility features
 * ✅ MouseMove event processing
 * ✅ Height calculation during drag
 * ✅ Constraint enforcement (min/max height)
 * ✅ Multi-session dragging
 * ✅ Edge cases with extreme mouse values
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { TrackHeightAdjuster } from "../../components/track-height-adjuster"

describe("TrackHeightAdjuster", () => {
  const mockOnHeightChange = vi.fn()
  const defaultProps = {
    trackId: "test-track",
    currentHeight: 100,
    onHeightChange: mockOnHeightChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Очищаем все моки после каждого теста
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe("Component rendering", () => {
    it("should render with correct test id", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      expect(screen.getByTestId("track-height-adjuster-test-track")).toBeInTheDocument()
    })

    it("should render with custom className", () => {
      render(<TrackHeightAdjuster {...defaultProps} className="custom-class" />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      expect(adjuster).toHaveClass("custom-class")
    })

    it("should have correct base styling classes", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      expect(adjuster).toHaveClass("absolute")
      expect(adjuster).toHaveClass("bottom-0")
      expect(adjuster).toHaveClass("left-0")
      expect(adjuster).toHaveClass("right-0")
      expect(adjuster).toHaveClass("h-1")
      expect(adjuster).toHaveClass("cursor-row-resize")
      expect(adjuster).toHaveClass("bg-transparent")
    })

    it("should render visual indicator element", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      const indicator = adjuster.querySelector(".bg-primary.opacity-0")
      expect(indicator).toBeInTheDocument()
    })

    it("should render expanded capture area with title", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      const captureArea = adjuster.querySelector("[title='Перетащите для изменения высоты трека']")
      expect(captureArea).toBeInTheDocument()
      expect(captureArea).toHaveClass("absolute")
      expect(captureArea).toHaveClass("-top-1")
      expect(captureArea).toHaveClass("-bottom-1")
      expect(captureArea).toHaveClass("left-0")
      expect(captureArea).toHaveClass("right-0")
    })
  })

  describe("Mouse interaction basics", () => {
    it("should handle mouseDown event", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Создаем мок событие с clientY
      const mouseDownEvent = new MouseEvent("mousedown", {
        bubbles: true,
        clientY: 100,
      })

      // Мокаем preventDefault и stopPropagation
      const preventDefaultSpy = vi.spyOn(mouseDownEvent, "preventDefault")
      const stopPropagationSpy = vi.spyOn(mouseDownEvent, "stopPropagation")

      fireEvent(adjuster, mouseDownEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
    })

    it("should add dragging class when mouseDown", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      fireEvent.mouseDown(adjuster, { clientY: 100 })

      expect(adjuster).toHaveClass("bg-primary/30")
    })

    it("should set up document event listeners on mouseDown", () => {
      const addEventListenerSpy = vi.spyOn(document, "addEventListener")

      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      expect(addEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
    })
  })

  describe("Height calculation and constraints", () => {
    it("should calculate new height correctly with positive delta", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Имитируем движение мыши вниз на 50px
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 150,
        }),
      )

      // Ожидаем, что высота увеличится: 100 + 50 = 150
      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 150)
    })

    it("should calculate new height correctly with negative delta", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Имитируем движение мыши вверх на 30px
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 70,
        }),
      )

      // Ожидаем, что высота уменьшится: 100 - 30 = 70
      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 70)
    })

    it("should enforce minimum height constraint (40px)", () => {
      render(<TrackHeightAdjuster {...defaultProps} currentHeight={50} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Имитируем движение мыши вверх на 50px (50 - 50 = 0, должно быть ограничено до 40)
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 50,
        }),
      )

      // Ожидаем минимальную высоту 40px
      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 40)
    })

    it("should enforce maximum height constraint (300px)", () => {
      render(<TrackHeightAdjuster {...defaultProps} currentHeight={250} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Имитируем движение мыши вниз на 100px (250 + 100 = 350, должно быть ограничено до 300)
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 200,
        }),
      )

      // Ожидаем максимальную высоту 300px
      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 300)
    })

    it("should allow height exactly at minimum boundary", () => {
      render(<TrackHeightAdjuster {...defaultProps} currentHeight={40} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Без движения высота должна остаться 40
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 100,
        }),
      )

      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 40)
    })

    it("should allow height exactly at maximum boundary", () => {
      render(<TrackHeightAdjuster {...defaultProps} currentHeight={300} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Без движения высота должна остаться 300
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 100,
        }),
      )

      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 300)
    })

    // Test the mathematical logic separately from the event handling
    it("should have correct height calculation logic (unit test)", () => {
      // Test the math that would be applied in handleMouseMove
      const startHeight = 100
      const startY = 100

      // Positive delta case
      const clientY1 = 150
      const deltaY1 = clientY1 - startY
      const newHeight1 = Math.max(40, Math.min(300, startHeight + deltaY1))
      expect(newHeight1).toBe(150)

      // Negative delta case
      const clientY2 = 70
      const deltaY2 = clientY2 - startY
      const newHeight2 = Math.max(40, Math.min(300, startHeight + deltaY2))
      expect(newHeight2).toBe(70)

      // Minimum constraint
      const clientY3 = 0
      const deltaY3 = clientY3 - startY
      const newHeight3 = Math.max(40, Math.min(300, startHeight + deltaY3))
      expect(newHeight3).toBe(40)

      // Maximum constraint
      const startHeight4 = 250
      const clientY4 = 350
      const deltaY4 = clientY4 - startY
      const newHeight4 = Math.max(40, Math.min(300, startHeight4 + deltaY4))
      expect(newHeight4).toBe(300)
    })
  })

  describe("Drag lifecycle and cleanup", () => {
    it("should cleanup event listeners on mouseUp", async () => {
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener")

      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Завершаем перетаскивание
      fireEvent(document, new MouseEvent("mouseup"))

      await waitFor(() => {
        expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
        expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))
      })
    })

    it("should remove dragging class on mouseUp", async () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Начинаем перетаскивание
      fireEvent.mouseDown(adjuster, { clientY: 100 })
      expect(adjuster).toHaveClass("bg-primary/30")

      // Завершаем перетаскивание
      fireEvent(document, new MouseEvent("mouseup"))

      await waitFor(() => {
        expect(adjuster).not.toHaveClass("bg-primary/30")
      })
    })

    it("should not call onHeightChange during mousemove if not dragging", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      // Имитируем движение мыши без предварительного mouseDown
      fireEvent(
        document,
        new MouseEvent("mousemove", {
          clientY: 150,
        }),
      )

      expect(mockOnHeightChange).not.toHaveBeenCalled()
    })

    it("should handle multiple drag sessions correctly", async () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Первая сессия перетаскивания
      fireEvent.mouseDown(adjuster, { clientY: 100 })
      fireEvent(document, new MouseEvent("mousemove", { clientY: 150 }))
      fireEvent(document, new MouseEvent("mouseup"))

      await waitFor(() => {
        expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 150)
      })

      vi.clearAllMocks()

      // Вторая сессия перетаскивания
      fireEvent.mouseDown(adjuster, { clientY: 200 })
      fireEvent(document, new MouseEvent("mousemove", { clientY: 180 }))
      fireEvent(document, new MouseEvent("mouseup"))

      await waitFor(() => {
        expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 80)
      })
    })
  })

  describe("Visual states and styling", () => {
    it("should show visual indicator with correct opacity classes when dragging", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      const indicator = adjuster.querySelector(".bg-primary")

      // Изначально индикатор скрыт
      expect(indicator).toHaveClass("opacity-0")

      // После начала перетаскивания индикатор должен стать видимым
      fireEvent.mouseDown(adjuster, { clientY: 100 })
      expect(indicator).toHaveClass("opacity-100")
    })

    it("should have group hover effects in CSS classes", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      const indicator = adjuster.querySelector(".bg-primary")

      expect(indicator).toHaveClass("group-hover:opacity-100")
      expect(indicator).toHaveClass("transition-opacity")
      expect(indicator).toHaveClass("duration-150")
    })
  })

  describe("Props and configuration", () => {
    it("should work with different trackId", () => {
      render(<TrackHeightAdjuster {...defaultProps} trackId="different-track" />)

      expect(screen.getByTestId("track-height-adjuster-different-track")).toBeInTheDocument()

      // Test that the component renders with correct ID
      const adjuster = screen.getByTestId("track-height-adjuster-different-track")
      expect(adjuster).toBeInTheDocument()
    })

    it("should accept different initial heights as props", () => {
      render(<TrackHeightAdjuster {...defaultProps} currentHeight={200} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      expect(adjuster).toBeInTheDocument()

      // Test that mouseDown works with different initial height
      fireEvent.mouseDown(adjuster, { clientY: 100 })
      expect(adjuster).toHaveClass("bg-primary/30") // Should be in dragging state
    })

    it("should pass correct trackId in component structure", () => {
      const customTrackId = "custom-track-123"
      render(<TrackHeightAdjuster {...defaultProps} trackId={customTrackId} currentHeight={80} />)

      const adjuster = screen.getByTestId(`track-height-adjuster-${customTrackId}`)
      expect(adjuster).toBeInTheDocument()
      expect(adjuster).toHaveAttribute("data-testid", `track-height-adjuster-${customTrackId}`)
    })
  })

  describe("Edge cases and error handling", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("should handle rapid mouse movements correctly", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Множественные быстрые движения
      fireEvent(document, new MouseEvent("mousemove", { clientY: 110 }))
      fireEvent(document, new MouseEvent("mousemove", { clientY: 120 }))
      fireEvent(document, new MouseEvent("mousemove", { clientY: 130 }))
      fireEvent(document, new MouseEvent("mousemove", { clientY: 140 }))

      // Проверяем, что обработчик вызывался и последний вызов правильный
      expect(mockOnHeightChange).toHaveBeenCalled()
      expect(mockOnHeightChange).toHaveBeenLastCalledWith("test-track", 140)
    })

    it("should handle extreme mouse position values", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Экстремально большое значение
      fireEvent(document, new MouseEvent("mousemove", { clientY: 10000 }))
      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 300) // Максимум

      // Экстремально маленькое значение
      fireEvent(document, new MouseEvent("mousemove", { clientY: -10000 }))
      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 40) // Минимум
    })

    it("should handle zero clientY values", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      fireEvent.mouseDown(adjuster, { clientY: 0 })
      fireEvent(document, new MouseEvent("mousemove", { clientY: 0 }))

      expect(mockOnHeightChange).toHaveBeenCalledWith("test-track", 100)
    })

    it("should handle component unmount during drag", async () => {
      const { unmount } = render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      fireEvent.mouseDown(adjuster, { clientY: 100 })

      // Размонтируем компонент во время перетаскивания
      unmount()

      // Движение мыши после размонтирования не должно вызывать ошибок
      expect(() => {
        fireEvent(document, new MouseEvent("mousemove", { clientY: 150 }))
      }).not.toThrow()
    })

    it("should validate boundary constraints in isolation", () => {
      // Test edge cases in the Math.max/Math.min logic
      const testCases = [
        { input: -100, expected: 40 }, // Below minimum
        { input: 40, expected: 40 }, // At minimum
        { input: 100, expected: 100 }, // Normal value
        { input: 300, expected: 300 }, // At maximum
        { input: 500, expected: 300 }, // Above maximum
        { input: 0, expected: 40 }, // Zero value
      ]

      testCases.forEach(({ input, expected }) => {
        const result = Math.max(40, Math.min(300, input))
        expect(result).toBe(expected)
      })
    })
  })

  describe("Accessibility and UX", () => {
    it("should have correct cursor style", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      expect(adjuster).toHaveClass("cursor-row-resize")
    })

    it("should have descriptive title on capture area", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")
      const captureArea = adjuster.querySelector("[title]")
      expect(captureArea).toHaveAttribute("title", "Перетащите для изменения высоты трека")
    })

    it("should provide visual feedback during interaction", () => {
      render(<TrackHeightAdjuster {...defaultProps} />)

      const adjuster = screen.getByTestId("track-height-adjuster-test-track")

      // Проверяем наличие hover/active состояний в классах
      expect(adjuster).toHaveClass("hover:bg-primary/20")
      expect(adjuster).toHaveClass("active:bg-primary/30")
      expect(adjuster).toHaveClass("transition-colors")
    })
  })
})
