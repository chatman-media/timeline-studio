import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VolumeSlider } from "../volume-slider"

// Мокаем useUserSettings hook
vi.mock("@/features/user-settings/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 50,
  }),
}))

// Мокаем компонент Slider из @/components/ui/slider
vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, min, max, step, onValueChange, onValueCommit, className }: any) => (
    <input
      type="range"
      value={value[0]}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      onMouseUp={() => onValueCommit()}
      className={className}
      data-testid="volume-slider"
    />
  ),
}))

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "log").mockImplementation(() => {})
})

describe("VolumeSlider", () => {
  it("should render with correct initial volume", () => {
    // Создаем моки для функций обратного вызова
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()

    // Рендерим компонент с начальным значением громкости 50
    render(<VolumeSlider volume={50} onValueChange={onValueChange} onValueCommit={onValueCommit} />)

    // Проверяем, что слайдер отрендерился с правильным значением
    const slider = screen.getByTestId("volume-slider")
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveValue("50")
  })

  it("should call onValueCommit when slider interaction ends", () => {
    // Создаем моки для функций обратного вызова
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()

    // Рендерим компонент
    render(<VolumeSlider volume={50} onValueChange={onValueChange} onValueCommit={onValueCommit} />)

    // Находим слайдер
    const slider = screen.getByTestId("volume-slider")

    // Симулируем завершение взаимодействия со слайдером
    fireEvent.mouseUp(slider)

    // Проверяем, что onValueCommit был вызван
    expect(onValueCommit).toHaveBeenCalled()
  })

  it("should update volumeRef when provided", () => {
    // Создаем моки для функций обратного вызова
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()

    // Создаем ref для громкости
    const volumeRef = { current: 50 }

    // Рендерим компонент с volumeRef
    render(
      <VolumeSlider volume={50} volumeRef={volumeRef} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    )

    // Находим слайдер
    const slider = screen.getByTestId("volume-slider")

    // Изменяем значение слайдера
    fireEvent.change(slider, { target: { value: 75 } })

    // Проверяем, что volumeRef был обновлен
    expect(volumeRef.current).toBe(75)
  })

  it("should update local volume when external volume changes", () => {
    // Создаем моки для функций обратного вызова
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()

    // Рендерим компонент с начальным значением громкости
    const { rerender } = render(
      <VolumeSlider volume={50} onValueChange={onValueChange} onValueCommit={onValueCommit} />,
    )

    // Проверяем начальное значение
    let slider = screen.getByTestId("volume-slider")
    expect(slider).toHaveValue("50")

    // Перерендериваем компонент с новым значением громкости
    rerender(<VolumeSlider volume={75} onValueChange={onValueChange} onValueCommit={onValueCommit} />)

    // Проверяем, что значение слайдера обновилось
    slider = screen.getByTestId("volume-slider")
    expect(slider).toHaveValue("75")
  })
})
