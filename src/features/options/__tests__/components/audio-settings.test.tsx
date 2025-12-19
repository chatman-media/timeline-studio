import { describe, expect, it, vi } from "vitest"

import { renderWithProviders, screen } from "@/test/test-utils"

import { AudioSettings } from "../../components/audio-settings"

// Мокаем lucide-react иконки
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>()
  return {
    ...actual,
    // Переопределяем только если нужно
  }
})

// Мокаем ResizeObserver для компонентов со Slider
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe("AudioSettings", () => {
  it("should render audio settings component", () => {
    renderWithProviders(<AudioSettings data-oid="sy7qarx" />)

    // Проверяем, что компонент рендерится
    expect(screen.getByTestId("audio-settings")).toBeInTheDocument()
  })

  it("should render all audio setting controls", () => {
    renderWithProviders(<AudioSettings data-oid="410o0:0" />)

    // Проверяем новые элементы управления согласно обновленному дизайну (по ключам i18n)
    expect(screen.getByText("options.audio.deviceSettings")).toBeInTheDocument()
    expect(screen.getByText("options.audio.mixerControls")).toBeInTheDocument()
    expect(screen.getByText("options.audio.effects")).toBeInTheDocument()
    expect(screen.getByText("options.audio.advanced")).toBeInTheDocument()
  })
})
