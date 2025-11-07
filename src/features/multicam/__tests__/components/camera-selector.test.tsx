import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import "@testing-library/jest-dom"
import "@/test/mocks/libraries/lucide-react"
import { CameraSelector } from "../../components/camera-selector"
import type { MulticamAngle } from "../../hooks/use-multicam"

// Создаем моковые данные для углов камер
const createMockAngles = (count: number): MulticamAngle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `angle-${i}`,
    name: `Camera ${i + 1}`,
    clipId: `clip-${i}`,
    clip: {
      id: `clip-${i}`,
      name: `Camera ${i + 1}`,
      trackId: "track-1",
      startTime: 0,
      duration: 10,
      offset: 0,
      mediaId: `media-${i}`,
      type: "video" as const,
      mediaStartTime: 0,
      mediaEndTime: 10,
      speed: 1,
      volume: 1,
      opacity: 1,
      isReversed: false,
      isSelected: false,
      isLocked: false,
      effects: [],
      filters: [],
      transitions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    mediaPath: `/path/to/media${i}.mp4`,
    syncOffset: i === 2 ? 0.5 : 0, // Третья камера имеет смещение
    isActive: i === 0,
  }))
}

describe("CameraSelector", () => {
  const defaultProps = {
    angles: createMockAngles(3),
    activeAngleIndex: 0,
    onSelectAngle: vi.fn(),
  }

  describe("основной рендеринг", () => {
    it("должен возвращать null когда только один угол или меньше", () => {
      const { container } = render(
        <CameraSelector angles={createMockAngles(1)} activeAngleIndex={0} onSelectAngle={vi.fn()} />,
      )

      expect(container.firstChild).toBeNull()
    })

    it("должен отображать кнопку с информацией о текущей камере", () => {
      render(<CameraSelector {...defaultProps} />)

      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()

      // Проверяем иконку камеры
      expect(screen.getByTestId("camera-icon")).toBeInTheDocument()

      // Проверяем отображение номера камеры
      expect(screen.getByText("1/3")).toBeInTheDocument()

      // Проверяем имя камеры
      expect(screen.getByText("Camera 1")).toBeInTheDocument()
    })

    it("должен корректно отображать информацию для разных активных камер", () => {
      const { rerender } = render(<CameraSelector {...defaultProps} activeAngleIndex={1} />)

      expect(screen.getByText("2/3")).toBeInTheDocument()
      expect(screen.getByText("Camera 2")).toBeInTheDocument()

      rerender(<CameraSelector {...defaultProps} activeAngleIndex={2} />)

      expect(screen.getByText("3/3")).toBeInTheDocument()
      expect(screen.getByText("Camera 3")).toBeInTheDocument()
    })
  })

  describe("состояние disabled", () => {
    it("должен отключать кнопку когда disabled=true", () => {
      render(<CameraSelector {...defaultProps} disabled={true} />)

      const button = screen.getByRole("button")
      expect(button).toBeDisabled()
    })

    it("должен быть активным по умолчанию", () => {
      render(<CameraSelector {...defaultProps} />)

      const button = screen.getByRole("button")
      expect(button).not.toBeDisabled()
    })
  })

  describe("выпадающее меню", () => {
    it("должен открывать меню при клике на кнопку", () => {
      render(<CameraSelector {...defaultProps} />)

      // Изначально меню не видно
      expect(screen.queryByText("Выберите камеру")).not.toBeInTheDocument()

      // Кликаем на кнопку
      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Проверяем что меню открылось
      expect(screen.getByText("Выберите камеру")).toBeInTheDocument()
    })

    it("должен отображать все камеры в меню", () => {
      render(<CameraSelector {...defaultProps} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Проверяем что все три камеры отображаются
      const menuItems = screen.getAllByTestId("dropdown-menu-item")
      expect(menuItems).toHaveLength(3)

      defaultProps.angles.forEach((angle, index) => {
        expect(menuItems[index]).toHaveTextContent(angle.name)
        expect(menuItems[index]).toHaveTextContent(`${index + 1}`)
      })
    })

    it("должен показывать галочку рядом с активной камерой", () => {
      render(<CameraSelector {...defaultProps} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Находим иконки Check
      const checkIcons = screen.getAllByTestId("check-icon")
      expect(checkIcons).toHaveLength(1) // Только одна галочка

      // Проверяем что галочка рядом с первой камерой
      const firstMenuItem = screen.getAllByTestId("dropdown-menu-item")[0]
      expect(firstMenuItem).toContainElement(checkIcons[0])
    })

    it("должен отображать смещение синхронизации для камер", () => {
      render(<CameraSelector {...defaultProps} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Третья камера имеет смещение 0.5s
      expect(screen.getByText("+0.5s")).toBeInTheDocument()
    })

    it("должен вызывать onSelectAngle при выборе камеры", () => {
      const onSelectAngle = vi.fn()
      render(<CameraSelector {...defaultProps} onSelectAngle={onSelectAngle} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Кликаем на вторую камеру
      const menuItems = screen.getAllByTestId("dropdown-menu-item")
      fireEvent.click(menuItems[1])

      expect(onSelectAngle).toHaveBeenCalledWith(1)
      expect(onSelectAngle).toHaveBeenCalledTimes(1)
    })

    it("должен вызывать onSelectAngle даже при клике на уже активную камеру", () => {
      const onSelectAngle = vi.fn()
      render(<CameraSelector {...defaultProps} onSelectAngle={onSelectAngle} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Кликаем на первую (активную) камеру
      const menuItems = screen.getAllByTestId("dropdown-menu-item")
      fireEvent.click(menuItems[0])

      // onSelectAngle должен быть вызван даже для активной камеры
      expect(onSelectAngle).toHaveBeenCalledWith(0)
    })
  })

  describe("кастомные классы", () => {
    it("должен применять кастомные классы к кнопке", () => {
      render(<CameraSelector {...defaultProps} className="custom-class-1 custom-class-2" />)

      const button = screen.getByRole("button")
      expect(button).toHaveClass("custom-class-1")
      expect(button).toHaveClass("custom-class-2")
      // Также должны сохраняться базовые классы
      expect(button).toHaveClass("gap-2")
    })
  })

  describe("отображение без имени камеры", () => {
    it("должен корректно работать когда у камеры нет имени", () => {
      const anglesWithoutNames = createMockAngles(2).map((angle) => ({
        ...angle,
        name: "",
      }))

      render(<CameraSelector angles={anglesWithoutNames} activeAngleIndex={0} onSelectAngle={vi.fn()} />)

      const button = screen.getByRole("button")
      expect(button).toBeInTheDocument()
      expect(screen.getByText("1/2")).toBeInTheDocument()
      // Кнопка должна содержать только номер, без имени
      expect(button).toHaveTextContent("1/2")
      // Проверяем что нет элемента с классом text-muted-foreground (где обычно имя)
      const nameElement = button.querySelector(".text-muted-foreground")
      expect(nameElement).toBeNull()
    })
  })

  describe("граничные случаи", () => {
    it("должен корректно обрабатывать большое количество камер", () => {
      const manyAngles = createMockAngles(10)
      render(<CameraSelector angles={manyAngles} activeAngleIndex={9} onSelectAngle={vi.fn()} />)

      expect(screen.getByText("10/10")).toBeInTheDocument()
      expect(screen.getByText("Camera 10")).toBeInTheDocument()
    })

    it("должен корректно отображать отрицательное смещение", () => {
      const anglesWithNegativeOffset = createMockAngles(2)
      anglesWithNegativeOffset[1].syncOffset = -1.5

      render(<CameraSelector angles={anglesWithNegativeOffset} activeAngleIndex={0} onSelectAngle={vi.fn()} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      expect(screen.getByText("-1.5s")).toBeInTheDocument()
    })

    it("не должен отображать смещение если оно равно 0", () => {
      render(<CameraSelector {...defaultProps} />)

      const button = screen.getByRole("button")
      fireEvent.click(button)

      // Первая и вторая камеры имеют смещение 0
      const menuItems = screen.getAllByTestId("dropdown-menu-item")
      expect(menuItems[0]).not.toHaveTextContent("0.0s")
      expect(menuItems[1]).not.toHaveTextContent("0.0s")
    })
  })
})
