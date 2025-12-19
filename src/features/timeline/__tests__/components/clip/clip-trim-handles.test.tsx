/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EditModeProvider } from "@/features/timeline/hooks/editing/use-edit-mode"
import { ClipTrimHandles, RippleHandles, RollHandles } from "../../../components/clip/clip-trim-handles"
import { EDIT_MODES } from "../../../types/edit-modes"

// Mock useEditModeContext возвращаемого контекста
const mockSetEditMode = vi.fn()
const mockIsEditMode = vi.fn()
const mockEditModeContext = {
  editMode: EDIT_MODES.SELECT,
  setEditMode: mockSetEditMode,
  isEditMode: mockIsEditMode,
  cursor: "default",
}

// Мокаем хук editMode
vi.mock("@/features/timeline/hooks/editing/use-edit-mode", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    useEditModeContext: () => mockEditModeContext,
  }
})

// Мокаем cn utility
vi.mock("@/lib/utils", () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(" "),
}))

// Helper для создания дефолтных пропсов
const createDefaultProps = () => ({
  onTrimStart: vi.fn(),
  onTrimMove: vi.fn(),
  onTrimEnd: vi.fn(),
  isSelected: true,
  disabled: false,
})

// Провайдер тестов с EditModeProvider
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <EditModeProvider data-oid="p3biyqc">{children}</EditModeProvider>
}

describe("ClipTrimHandles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Устанавливаем дефолтное поведение
    mockIsEditMode.mockImplementation((mode: string) => {
      return mode === EDIT_MODES.TRIM
    })
  })

  describe("Рендеринг и видимость", () => {
    it("должен не показывать handles когда не в trim/ripple/roll режиме", () => {
      mockIsEditMode.mockReturnValue(false)
      const props = createDefaultProps()

      const { container } = render(<ClipTrimHandles {...props} data-oid="wylpjvj" />)

      expect(container.firstChild).toBeNull()
    })

    it("должен показывать handles в trim режиме когда клип выбран", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="mglep_e" />)

      expect(screen.getByTestId("trim-handle-start")).toBeInTheDocument()
      expect(screen.getByTestId("trim-handle-end")).toBeInTheDocument()
    })

    it("должен показывать handles в ripple режиме", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.RIPPLE)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="096p:zl" />)

      expect(screen.getByTestId("trim-handle-start")).toBeInTheDocument()
      expect(screen.getByTestId("trim-handle-end")).toBeInTheDocument()
    })

    it("должен показывать handles в roll режиме", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="_ng2r30" />)

      expect(screen.getByTestId("trim-handle-start")).toBeInTheDocument()
      expect(screen.getByTestId("trim-handle-end")).toBeInTheDocument()
    })

    it("должен не показывать handles когда клип не выбран", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = { ...createDefaultProps(), isSelected: false }

      const { container } = render(<ClipTrimHandles {...props} data-oid="q1ivsgp" />)

      expect(container.firstChild).toBeNull()
    })

    it("должен применять кастомный className", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = { ...createDefaultProps(), className: "custom-class" }

      render(<ClipTrimHandles {...props} data-oid="83k19cq" />)

      const startHandle = screen.getByTestId("trim-handle-start")
      expect(startHandle).toHaveClass("custom-class")
    })
  })

  describe("Взаимодействие с handles", () => {
    it("должен вызывать onTrimStart при mousedown на start handle", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="_zg4fyx" />)

      const startHandle = screen.getByTestId("trim-handle-start")
      fireEvent.mouseDown(startHandle, { clientX: 100 })

      expect(props.onTrimStart).toHaveBeenCalledWith("start", 100)
    })

    it("должен вызывать onTrimStart при mousedown на end handle", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="xoez8u-" />)

      const endHandle = screen.getByTestId("trim-handle-end")
      fireEvent.mouseDown(endHandle, { clientX: 200 })

      expect(props.onTrimStart).toHaveBeenCalledWith("end", 200)
    })

    it("должен предотвращать default и stop propagation при mousedown", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="tmy3_lh" />)

      const startHandle = screen.getByTestId("trim-handle-start")

      // Используем реальный Event объект
      const preventDefault = vi.fn()
      const stopPropagation = vi.fn()

      const mouseDownEvent = new MouseEvent("mousedown", {
        clientX: 100,
        bubbles: true,
        cancelable: true,
      })

      // Мокаем методы
      mouseDownEvent.preventDefault = preventDefault
      mouseDownEvent.stopPropagation = stopPropagation

      fireEvent(startHandle, mouseDownEvent)

      expect(preventDefault).toHaveBeenCalled()
      expect(stopPropagation).toHaveBeenCalled()
    })

    it("должен не реагировать на mousedown когда disabled", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = { ...createDefaultProps(), disabled: true }

      render(<ClipTrimHandles {...props} data-oid="of03amy" />)

      const startHandle = screen.getByTestId("trim-handle-start")
      fireEvent.mouseDown(startHandle, { clientX: 100 })

      expect(props.onTrimStart).not.toHaveBeenCalled()
    })
  })

  describe("Drag операции", () => {
    it("должен обрабатывать drag операцию start handle", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="hz_3449" />)

      const startHandle = screen.getByTestId("trim-handle-start")

      // Начинаем drag
      fireEvent.mouseDown(startHandle, { clientX: 100 })

      // Двигаем мышь
      fireEvent.mouseMove(document, { clientX: 150 })
      expect(props.onTrimMove).toHaveBeenCalledWith(50)

      // Отпускаем мышь
      fireEvent.mouseUp(document, { shiftKey: false })
      expect(props.onTrimEnd).toHaveBeenCalledWith(true)
    })

    it("должен обрабатывать drag операцию end handle", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="9puchdg" />)

      const endHandle = screen.getByTestId("trim-handle-end")

      // Начинаем drag
      fireEvent.mouseDown(endHandle, { clientX: 200 })

      // Двигаем мышь
      fireEvent.mouseMove(document, { clientX: 180 })
      expect(props.onTrimMove).toHaveBeenCalledWith(-20)

      // Отпускаем мышь
      fireEvent.mouseUp(document, { shiftKey: false })
      expect(props.onTrimEnd).toHaveBeenCalledWith(true)
    })

    it("должен отменять операцию при Shift+mouseup", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      render(<ClipTrimHandles {...props} data-oid="lqnhub2" />)

      const startHandle = screen.getByTestId("trim-handle-start")

      // Начинаем drag
      fireEvent.mouseDown(startHandle, { clientX: 100 })

      // Двигаем мышь
      fireEvent.mouseMove(document, { clientX: 150 })

      // Отпускаем с Shift (отмена)
      fireEvent.mouseUp(document, { shiftKey: true })
      expect(props.onTrimEnd).toHaveBeenCalledWith(false)
    })

    it("должен показывать visual feedback во время drag", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      const { container } = render(<ClipTrimHandles {...props} data-oid="9zfms70" />)

      const startHandle = screen.getByTestId("trim-handle-start")

      // Начинаем drag
      fireEvent.mouseDown(startHandle, { clientX: 100 })

      // Проверяем что показывается feedback
      const feedback = container.querySelector(".animate-pulse")
      expect(feedback).toBeInTheDocument()

      // Заканчиваем drag
      fireEvent.mouseUp(document, { shiftKey: false })

      // Feedback должен исчезнуть
      expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument()
    })
  })

  describe("Disabled состояние", () => {
    it("должен применять disabled стили", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = { ...createDefaultProps(), disabled: true }

      render(<ClipTrimHandles {...props} data-oid="_wf0ctt" />)

      const startHandle = screen.getByTestId("trim-handle-start")
      const endHandle = screen.getByTestId("trim-handle-end")

      expect(startHandle).toHaveClass("cursor-not-allowed opacity-50")
      expect(endHandle).toHaveClass("cursor-not-allowed opacity-50")
    })
  })

  describe("Cleanup операции", () => {
    it("должен удалять event listeners при unmount", () => {
      mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
      const props = createDefaultProps()

      const addEventListenerSpy = vi.spyOn(document, "addEventListener")
      const removeEventListenerSpy = vi.spyOn(document, "removeEventListener")

      const { unmount } = render(<ClipTrimHandles {...props} data-oid="48l.cai" />)

      const startHandle = screen.getByTestId("trim-handle-start")

      // Начинаем drag (добавляем listeners)
      fireEvent.mouseDown(startHandle, { clientX: 100 })

      expect(addEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))

      // Unmount компонента
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith("mousemove", expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith("mouseup", expect.any(Function))

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })
  })
})

describe("RippleHandles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен рендерить ClipTrimHandles когда не в ripple режиме", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
    const props = createDefaultProps()

    render(<RippleHandles {...props} data-oid="tklkle1" />)

    expect(screen.getByTestId("trim-handle-start")).toBeInTheDocument()
    expect(screen.getByTestId("trim-handle-end")).toBeInTheDocument()
  })

  it("должен рендерить с orange стилями в ripple режиме", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.RIPPLE)
    const props = createDefaultProps()

    const { container } = render(<RippleHandles {...props} data-oid="0_clh2j" />)

    const handles = container.querySelector(".border-orange-500")
    expect(handles).toBeInTheDocument()
  })

  it("должен показывать ripple indicator когда showRippleIndicator=true и клип выбран", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.RIPPLE)
    const props = { ...createDefaultProps(), isSelected: true }

    const { container } = render(<RippleHandles {...props} showRippleIndicator={true} data-oid="0copcic" />)

    const indicator = container.querySelector("svg")
    expect(indicator).toBeInTheDocument()
  })

  it("должен не показывать ripple indicator когда showRippleIndicator=false", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.RIPPLE)
    const props = { ...createDefaultProps(), isSelected: true }

    const { container } = render(<RippleHandles {...props} showRippleIndicator={false} data-oid="ltv-:jy" />)

    const indicator = container.querySelector("svg")
    expect(indicator).not.toBeInTheDocument()
  })

  it("должен не показывать ripple indicator когда клип не выбран", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.RIPPLE)
    const props = { ...createDefaultProps(), isSelected: false }

    const { container } = render(<RippleHandles {...props} showRippleIndicator={true} data-oid="kge1lgn" />)

    const indicator = container.querySelector("svg")
    expect(indicator).not.toBeInTheDocument()
  })
})

describe("RollHandles", () => {
  const createRollProps = () => ({
    leftClipId: "clip-1",
    rightClipId: "clip-2",
    position: 150,
    onRollStart: vi.fn(),
    onRollMove: vi.fn(),
    onRollEnd: vi.fn(),
    isActive: true,
    disabled: false,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен не рендериться когда не в roll режиме", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.TRIM)
    const props = createRollProps()

    const { container } = render(<RollHandles {...props} data-oid="octh-f9" />)

    expect(container.firstChild).toBeNull()
  })

  it("должен не рендериться когда не active", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = { ...createRollProps(), isActive: false }

    const { container } = render(<RollHandles {...props} data-oid="l345cj2" />)

    expect(container.firstChild).toBeNull()
  })

  it("должен рендериться в roll режиме когда active", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = createRollProps()

    const { container } = render(<RollHandles {...props} data-oid="7f.byot" />)

    const handle = container.firstChild as HTMLElement
    expect(handle).toBeInTheDocument()
    expect(handle).toHaveStyle({ left: "150px" })
  })

  it("должен вызывать onRollStart при mousedown", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = createRollProps()

    const { container } = render(<RollHandles {...props} data-oid="mbk.a-j" />)

    const handle = container.firstChild as HTMLElement
    fireEvent.mouseDown(handle, { clientX: 200 })

    expect(props.onRollStart).toHaveBeenCalledWith(200)
  })

  it("должен обрабатывать roll drag операцию", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = createRollProps()

    const { container } = render(<RollHandles {...props} data-oid="k3inbda" />)

    const handle = container.firstChild as HTMLElement

    // Начинаем drag
    fireEvent.mouseDown(handle, { clientX: 200 })

    // Двигаем мышь
    fireEvent.mouseMove(document, { clientX: 250 })
    expect(props.onRollMove).toHaveBeenCalledWith(50)

    // Отпускаем мышь
    fireEvent.mouseUp(document, { shiftKey: false })
    expect(props.onRollEnd).toHaveBeenCalledWith(true)
  })

  it("должен отменять roll операцию при Shift+mouseup", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = createRollProps()

    const { container } = render(<RollHandles {...props} data-oid="se6epb5" />)

    const handle = container.firstChild as HTMLElement

    // Начинаем drag
    fireEvent.mouseDown(handle, { clientX: 200 })

    // Отпускаем с Shift (отмена)
    fireEvent.mouseUp(document, { shiftKey: true })
    expect(props.onRollEnd).toHaveBeenCalledWith(false)
  })

  it("должен не реагировать на mousedown когда disabled", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = { ...createRollProps(), disabled: true }

    const { container } = render(<RollHandles {...props} data-oid="8m4b3mn" />)

    const handle = container.firstChild as HTMLElement
    fireEvent.mouseDown(handle, { clientX: 200 })

    expect(props.onRollStart).not.toHaveBeenCalled()
  })

  it("должен применять disabled стили", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = { ...createRollProps(), disabled: true }

    const { container } = render(<RollHandles {...props} data-oid="p-4kuo3" />)

    const handle = container.firstChild as HTMLElement
    expect(handle).toHaveClass("cursor-not-allowed opacity-50")
  })

  it("должен показывать purple стили для roll handles", () => {
    mockIsEditMode.mockImplementation((mode: string) => mode === EDIT_MODES.ROLL)
    const props = createRollProps()

    const { container } = render(<RollHandles {...props} data-oid="d4tnuwl" />)

    const handle = container.firstChild as HTMLElement
    expect(handle).toHaveClass("bg-purple-500/30")

    const indicator = container.querySelector(".bg-purple-500")
    expect(indicator).toBeInTheDocument()
  })
})
