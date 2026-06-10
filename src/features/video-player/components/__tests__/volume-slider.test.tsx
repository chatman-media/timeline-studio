/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VolumeSlider } from "../volume-slider"

// Мокаем useUserSettings hook
vi.mock("@/features/user-settings/hooks/use-user-settings", () => ({
  useUserSettings: () => ({
    playerVolume: 50,
  }),
}))

// Мокаем компонент Slider из @timeline-studio/ui/components/slider
vi.mock("@timeline-studio/ui/components/slider", () => ({
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
      data-oid="1g-i4tc"
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
    render(<VolumeSlider volume={50} onValueChange={onValueChange} onValueCommit={onValueCommit} data-oid="4s9hzsz" />)

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
    render(<VolumeSlider volume={50} onValueChange={onValueChange} onValueCommit={onValueCommit} data-oid="fdqil4x" />)

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
      <VolumeSlider
        volume={50}
        volumeRef={volumeRef}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
        data-oid="m_2iz_i"
      />,
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
      <VolumeSlider volume={50} onValueChange={onValueChange} onValueCommit={onValueCommit} data-oid="wqsae5n" />,
    )

    // Проверяем начальное значение
    let slider = screen.getByTestId("volume-slider")
    expect(slider).toHaveValue("50")

    // Перерендериваем компонент с новым значением громкости
    rerender(
      <VolumeSlider volume={75} onValueChange={onValueChange} onValueCommit={onValueCommit} data-oid="o-m-qzg" />,
    )

    // Проверяем, что значение слайдера обновилось
    slider = screen.getByTestId("volume-slider")
    expect(slider).toHaveValue("75")
  })
})
