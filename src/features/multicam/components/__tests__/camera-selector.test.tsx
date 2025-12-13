/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MulticamAngle } from "../../hooks/use-multicam"
import { CameraSelector } from "../camera-selector"

describe("CameraSelector", () => {
  const mockOnSelectAngle = vi.fn()

  const createAngle = (index: number): MulticamAngle => ({
    id: `angle-${index}`,
    name: `Camera ${index + 1}`,
    clipId: `clip${index}`,
    clip: {} as any,
    syncOffset: 0,
    isActive: index === 0,
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("не рендерится, если меньше двух углов", () => {
    const { container } = render(
      <CameraSelector angles={[createAngle(0)]} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it("рендерится, если два и более углов", () => {
    render(
      <CameraSelector
        angles={[createAngle(0), createAngle(1)]}
        activeAngleIndex={0}
        onSelectAngle={mockOnSelectAngle}
      />,
    )

    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("показывает активный угол в кнопке", () => {
    const angles = [createAngle(0), createAngle(1), createAngle(2)]
    render(<CameraSelector angles={angles} activeAngleIndex={1} onSelectAngle={mockOnSelectAngle} />)

    // Проверяем отображение индекса
    expect(screen.getByText("2/3")).toBeInTheDocument()
    // Проверяем отображение имени
    expect(screen.getByText("Camera 2")).toBeInTheDocument()
  })

  it("открывает меню при клике на кнопку", async () => {
    const user = userEvent.setup()
    const angles = [createAngle(0), createAngle(1)]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))

    expect(screen.getByText("Выберите камеру")).toBeInTheDocument()
    expect(screen.getAllByText(/Camera \d/)).toHaveLength(3) // 1 в кнопке + 2 в меню
  })

  it("показывает все углы в меню", async () => {
    const user = userEvent.setup()
    const angles = [createAngle(0), createAngle(1), createAngle(2)]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))

    // Ищем элементы меню по data-testid
    const menuItems = screen.getAllByTestId("dropdown-menu-item")
    expect(menuItems).toHaveLength(3)

    // Проверяем содержимое - используем getAllByText так как есть дубликаты
    const camera1Elements = screen.getAllByText("Camera 1")
    const camera2Elements = screen.getAllByText("Camera 2")
    const camera3Elements = screen.getAllByText("Camera 3")

    expect(camera1Elements.length).toBeGreaterThan(0)
    expect(camera2Elements.length).toBeGreaterThan(0)
    expect(camera3Elements.length).toBeGreaterThan(0)
  })

  it("отмечает активный угол галочкой", async () => {
    const user = userEvent.setup()
    const angles = [createAngle(0), createAngle(1), createAngle(2)]

    render(<CameraSelector angles={angles} activeAngleIndex={1} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))

    // Находим элемент меню для Camera 2
    const menuItems = screen.getAllByTestId("dropdown-menu-item")
    const camera2Item = menuItems[1]
    const checkIcon = camera2Item.querySelector(".text-primary")
    expect(checkIcon).toBeInTheDocument()
  })

  it("вызывает onSelectAngle при выборе камеры", async () => {
    const user = userEvent.setup()
    const angles = [createAngle(0), createAngle(1), createAngle(2)]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))
    const menuItems = screen.getAllByTestId("dropdown-menu-item")
    await user.click(menuItems[2]) // Camera 3

    expect(mockOnSelectAngle).toHaveBeenCalledWith(2)
  })

  it("показывает смещение синхронизации", async () => {
    const user = userEvent.setup()
    const angles = [createAngle(0), { ...createAngle(1), syncOffset: 1.5 }, { ...createAngle(2), syncOffset: -0.5 }]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))

    expect(screen.getByText("+1.5s")).toBeInTheDocument()
    expect(screen.getByText("-0.5s")).toBeInTheDocument()
  })

  it("не показывает нулевое смещение", async () => {
    const user = userEvent.setup()
    const angles = [
      { ...createAngle(0), syncOffset: 0 },
      { ...createAngle(1), syncOffset: 0.001 }, // Очень маленькое значение
    ]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))

    // Не должно быть текста со смещением для первой камеры
    const menuItems = screen.getAllByTestId("dropdown-menu-item")
    expect(menuItems[0].textContent).not.toMatch(/[+-]?\d+\.\d+s/)
  })

  it("отключается, когда disabled=true", () => {
    const angles = [createAngle(0), createAngle(1)]
    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} disabled={true} />)

    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("применяет кастомный className", () => {
    const angles = [createAngle(0), createAngle(1)]
    render(
      <CameraSelector
        angles={angles}
        activeAngleIndex={0}
        onSelectAngle={mockOnSelectAngle}
        className="custom-class"
      />,
    )

    expect(screen.getByRole("button")).toHaveClass("custom-class")
  })

  /**
   * NOTE: Тест пропущен - требуется проверка взаимодействия с Radix UI Popover.
   * TODO: Настроить моки для Radix UI или покрыть через E2E тесты.
   */
  it.skip("закрывает меню после выбора", async () => {
    // Пропускаем - Radix UI dropdown не закрывается в тестах
  })

  it("показывает индексы камер в бейджах", async () => {
    const user = userEvent.setup()
    const angles = [createAngle(0), createAngle(1), createAngle(2)]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    await user.click(screen.getByRole("button"))

    // Проверяем наличие бейджей с номерами
    const badges = screen.getAllByText(/^[123]$/).filter((el) => el.closest(".justify-center") !== null)
    expect(badges).toHaveLength(3)
  })

  it("корректно работает с углами без имени", () => {
    const angles = [
      { ...createAngle(0), name: "" },
      { ...createAngle(1), name: "" },
    ]

    render(<CameraSelector angles={angles} activeAngleIndex={0} onSelectAngle={mockOnSelectAngle} />)

    // Не должно показывать пустое имя
    const button = screen.getByRole("button")
    // Проверяем наличие индекса
    expect(screen.getByText("1/2")).toBeInTheDocument()
    // При пустом имени не должно быть дополнительного span
    const spans = button.querySelectorAll("span")
    expect(spans).toHaveLength(1) // Только span с индексом
  })
})
