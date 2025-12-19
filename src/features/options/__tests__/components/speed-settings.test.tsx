import { describe, expect, it, vi } from "vitest"

import { renderWithProviders, screen } from "@/test/test-utils"

import { SpeedSettings } from "../../components/speed-settings"

// Мокаем ResizeObserver для компонентов со Slider
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe("SpeedSettings", () => {
  it("should render speed settings component", () => {
    renderWithProviders(<SpeedSettings data-oid="s3b47g7" />)

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("speed-settings")).toBeInTheDocument()
  })

  it("should render all speed setting controls", () => {
    renderWithProviders(<SpeedSettings data-oid="lvxznx9" />)

    // Проверяем новые элементы управления согласно обновленному дизайну (по ключам i18n)
    expect(screen.getByText("options.speed.basicSpeed")).toBeInTheDocument()
    expect(screen.getByText("options.speed.speedRamping")).toBeInTheDocument()
    expect(screen.getByText("options.speed.frameInterpolation")).toBeInTheDocument()
    expect(screen.getByText("options.speed.advanced")).toBeInTheDocument()
  })
})
