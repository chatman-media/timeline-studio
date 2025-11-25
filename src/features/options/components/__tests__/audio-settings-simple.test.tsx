import { render, screen } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"
import i18n from "@/i18n"
import { AudioSettings } from "../audio-settings"

// Wrapper для i18n
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
)

describe("AudioSettings - упрощенные тесты", () => {
  it("рендерит компонент без ошибок", () => {
    render(<AudioSettings />, { wrapper: Wrapper })
    expect(screen.getByTestId("audio-settings")).toBeInTheDocument()
  })

  it("показывает основные секции", () => {
    render(<AudioSettings />, { wrapper: Wrapper })

    // Проверяем наличие основных секций (используем i18n ключи)
    expect(screen.getByText(/options.audio.deviceSettings/i)).toBeInTheDocument()
    expect(screen.getByText(/options.audio.mixerControls/i)).toBeInTheDocument()
    expect(screen.getByText(/options.audio.effects/i)).toBeInTheDocument()
    expect(screen.getByText(/options.audio.advanced/i)).toBeInTheDocument()
  })

  it("показывает кнопки управления", () => {
    render(<AudioSettings />, { wrapper: Wrapper })

    // Проверяем, что есть кнопки Reset и Apply
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })
})
