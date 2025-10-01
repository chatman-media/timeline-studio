import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SocialNetworksTab } from "../../../components/tabs/social-networks-tab"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("SocialNetworksTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render correctly with all UI elements", () => {
    render(<SocialNetworksTab />)

    expect(screen.getByText("Социальные сети")).toBeInTheDocument()
    expect(
      screen.getByText("Настройте OAuth подключения для автоматической публикации видео в социальных сетях."),
    ).toBeInTheDocument()

    expect(screen.getByText("Скоро")).toBeInTheDocument()
    expect(
      screen.getByText(
        "OAuth интеграция с социальными сетями будет доступна в следующих обновлениях. Пока API ключи сохраняются в зашифрованном виде.",
      ),
    ).toBeInTheDocument()

    expect(screen.getByText("Текущая реализация")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Система безопасного хранения API ключей готова. OAuth интеграция и UI для социальных сетей находятся в разработке.",
      ),
    ).toBeInTheDocument()
  })

  it("should render all social network buttons in disabled state", () => {
    render(<SocialNetworksTab />)

    const youtubeButton = screen.getByRole("button", { name: "YouTube" })
    const tiktokButton = screen.getByRole("button", { name: "TikTok" })
    const vimeoButton = screen.getByRole("button", { name: "Vimeo" })
    const telegramButton = screen.getByRole("button", { name: "Telegram" })

    expect(youtubeButton).toBeInTheDocument()
    expect(youtubeButton).toBeDisabled()

    expect(tiktokButton).toBeInTheDocument()
    expect(tiktokButton).toBeDisabled()

    expect(vimeoButton).toBeInTheDocument()
    expect(vimeoButton).toBeDisabled()

    expect(telegramButton).toBeInTheDocument()
    expect(telegramButton).toBeDisabled()
  })

  it("should have correct button styles", () => {
    render(<SocialNetworksTab />)

    const buttons = screen.getAllByRole("button")

    buttons.forEach((button) => {
      expect(button).toHaveClass("inline-flex")
      expect(button).toHaveClass("items-center")
      expect(button).toHaveClass("justify-center")
    })
  })

  it("should display separator element", () => {
    render(<SocialNetworksTab />)

    const separator = document.querySelector('[role="none"]')
    expect(separator).toBeInTheDocument()
  })

  it("should render coming soon section with correct layout", () => {
    render(<SocialNetworksTab />)

    const comingSoonSection = screen.getByText("Скоро").parentElement?.parentElement
    expect(comingSoonSection).toHaveClass("flex flex-col items-center justify-center py-12 space-y-4")
  })

  it("should render information box with correct styling", () => {
    render(<SocialNetworksTab />)

    const infoBox = screen.getByText("Текущая реализация").parentElement
    expect(infoBox).toHaveClass("mt-6 p-4 bg-muted/50 rounded-md")
  })

  it("should render buttons container with correct layout", () => {
    render(<SocialNetworksTab />)

    const buttonsContainer = screen.getByRole("button", { name: "YouTube" }).parentElement
    expect(buttonsContainer).toHaveClass("flex flex-wrap gap-2 justify-center")
  })

  it("should have all text content properly styled", () => {
    render(<SocialNetworksTab />)

    const heading = screen.getByText("Социальные сети")
    expect(heading).toHaveClass("text-lg font-semibold")

    const description = screen.getByText(
      "Настройте OAuth подключения для автоматической публикации видео в социальных сетях.",
    )
    expect(description).toHaveClass("text-sm text-muted-foreground")

    const comingSoonHeading = screen.getByText("Скоро")
    expect(comingSoonHeading).toHaveClass("text-lg font-medium text-muted-foreground")

    const comingSoonText = screen.getByText(
      "OAuth интеграция с социальными сетями будет доступна в следующих обновлениях. Пока API ключи сохраняются в зашифрованном виде.",
    )
    expect(comingSoonText).toHaveClass("text-sm text-muted-foreground max-w-md")

    const infoHeading = screen.getByText("Текущая реализация")
    expect(infoHeading).toHaveClass("text-sm font-medium mb-2")

    const infoText = screen.getByText(
      "Система безопасного хранения API ключей готова. OAuth интеграция и UI для социальных сетей находятся в разработке.",
    )
    expect(infoText).toHaveClass("text-xs text-muted-foreground")
  })

  it("should render exactly 4 social network buttons", () => {
    render(<SocialNetworksTab />)

    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(4)
  })

  it("should render content in correct order", () => {
    const { container } = render(<SocialNetworksTab />)

    const sections = container.querySelectorAll(".space-y-6 > *")
    expect(sections).toHaveLength(4)

    expect(sections[0]).toContainElement(screen.getByText("Социальные сети"))
    expect(sections[1].tagName).toBe("DIV")
    expect(sections[1]).toHaveAttribute("role", "none")
    expect(sections[2]).toContainElement(screen.getByText("Скоро"))
    expect(sections[3]).toContainElement(screen.getByText("Текущая реализация"))
  })

  it("should apply correct spacing classes", () => {
    render(<SocialNetworksTab />)

    const mainContainer = screen.getByText("Социальные сети").closest(".space-y-6")
    expect(mainContainer).toBeInTheDocument()

    const headerSection = screen.getByText("Социальные сети").parentElement
    expect(headerSection).toHaveClass("space-y-2")

    const comingSoonTextContainer = screen.getByText("Скоро").parentElement
    expect(comingSoonTextContainer).toHaveClass("space-y-2")
  })
})
