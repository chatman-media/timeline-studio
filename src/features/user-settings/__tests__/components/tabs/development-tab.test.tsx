/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DevelopmentTab } from "../../../components/tabs/development-tab"
import { useApiKeys } from "../../../hooks/use-api-keys"

vi.mock("../../../hooks/use-api-keys")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))
vi.mock("lucide-react", () => ({
  ExternalLink: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      ExternalLink
    </span>
  ),
  Eye: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Eye
    </span>
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      EyeOff
    </span>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      Loader2
    </span>
  ),
  X: ({ className }: { className?: string }) => (
    <span className={className} role="img" aria-hidden="true">
      X
    </span>
  ),
}))

vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("DevelopmentTab", () => {
  const mockSaveSimpleApiKey = vi.fn()
  const mockGetApiKeyInfo = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock process.env.NODE_ENV
    vi.stubEnv("NODE_ENV", "development")

    vi.mocked(useApiKeys).mockImplementation(() => ({
      getApiKeyStatus: vi.fn().mockReturnValue("not_set"),
      getApiKeyInfo: mockGetApiKeyInfo,
      getValidationError: vi.fn(),
      testApiKey: vi.fn(),
      saveSimpleApiKey: mockSaveSimpleApiKey,
      deleteApiKey: vi.fn(),
      loadApiKeysInfo: vi.fn(),
      validateKeyFormat: vi.fn().mockReturnValue(true),
      saveOAuthCredentials: vi.fn(),
      generateOAuthUrl: vi.fn(),
      exchangeOAuthCode: vi.fn(),
      refreshOAuthToken: vi.fn(),
      getOAuthUserInfo: vi.fn(),
      parseOAuthCallbackUrl: vi.fn(),
      importFromEnv: vi.fn(),
      exportToEnvFormat: vi.fn(),
      apiKeysInfo: {},
      loadingStatuses: {},
    }))
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("should render correctly in development mode", () => {
    render(<DevelopmentTab />)

    expect(screen.getByText("Разработка")).toBeInTheDocument()
    expect(
      screen.getByText("Настройки для инструментов разработки и аналитики. Доступно только в режиме разработки."),
    ).toBeInTheDocument()

    expect(screen.getByText("Codecov Token")).toBeInTheDocument()
    expect(
      screen.getByText("Токен для отправки отчетов покрытия тестами в Codecov. Используется в CI/CD pipeline."),
    ).toBeInTheDocument()

    expect(screen.getByText("Tauri Analytics Key")).toBeInTheDocument()
    expect(
      screen.getByText("Ключ для аналитики Tauri приложения. Используется для сбора метрик производительности."),
    ).toBeInTheDocument()

    expect(screen.getByText("Режим разработки")).toBeInTheDocument()
    expect(
      screen.getByText(
        "Эта вкладка видна только в режиме разработки. В production сборке настройки разработки недоступны.",
      ),
    ).toBeInTheDocument()

    // The inputs are password type initially
    const apiKeyInputs = screen.getAllByPlaceholderText(/your_/)
    expect(apiKeyInputs).toHaveLength(2)

    const linkButtons = screen.getAllByRole("button")
    expect(linkButtons).toHaveLength(2)
  })

  it("should not render in production mode", () => {
    vi.stubEnv("NODE_ENV", "production")
    const { container } = render(<DevelopmentTab />)
    expect(container.firstChild).toBeNull()
  })

  it("should not render in test mode when set to production", () => {
    vi.stubEnv("NODE_ENV", "production")
    const { container } = render(<DevelopmentTab />)
    expect(container.firstChild).toBeNull()
  })

  it("should load existing API keys on mount", () => {
    mockGetApiKeyInfo.mockReturnValueOnce({ has_value: true })
    mockGetApiKeyInfo.mockReturnValueOnce({ has_value: true })

    render(<DevelopmentTab />)

    expect(mockGetApiKeyInfo).toHaveBeenCalledWith("codecov")
    expect(mockGetApiKeyInfo).toHaveBeenCalledWith("tauri_analytics")

    // The inputs are password type, so we need to find them by placeholder
    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")
    const tauriInput = screen.getByPlaceholderText("your_tauri_analytics_key")

    expect(codecovInput).toHaveValue("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    expect(tauriInput).toHaveValue("••••••••••••••••••••••••••••••••••••••••••••••••••••")
  })

  it("should handle Codecov token input changes", async () => {
    render(<DevelopmentTab />)

    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "codecov-test-token" } })
    })

    expect(codecovInput).toHaveValue("codecov-test-token")

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("codecov", "codecov-test-token")
    })
  })

  it("should handle Tauri Analytics key input changes", async () => {
    render(<DevelopmentTab />)

    const tauriInput = screen.getByPlaceholderText("your_tauri_analytics_key")

    act(() => {
      fireEvent.change(tauriInput, { target: { value: "tauri-analytics-key" } })
    })

    expect(tauriInput).toHaveValue("tauri-analytics-key")

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("tauri_analytics", "tauri-analytics-key")
    })
  })

  it("should not save keys with masked characters", () => {
    render(<DevelopmentTab />)

    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "••••••••••••" } })
    })

    expect(mockSaveSimpleApiKey).not.toHaveBeenCalled()
  })

  it("should not save empty keys", () => {
    render(<DevelopmentTab />)

    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "" } })
    })

    expect(mockSaveSimpleApiKey).not.toHaveBeenCalled()
  })

  it("should handle link button clicks to open external URLs", () => {
    const mockWindowOpen = vi.spyOn(window, "open").mockImplementation(() => null)

    render(<DevelopmentTab />)

    const linkButtons = screen.getAllByRole("button")

    act(() => {
      fireEvent.click(linkButtons[0])
    })
    expect(mockWindowOpen).toHaveBeenCalledWith("https://app.codecov.io/settings", "_blank")

    act(() => {
      fireEvent.click(linkButtons[1])
    })
    expect(mockWindowOpen).toHaveBeenCalledWith("https://tauri.app/v1/guides/features/analytics/", "_blank")

    mockWindowOpen.mockRestore()
  })

  it("should render API key inputs without test buttons", () => {
    render(<DevelopmentTab />)

    const testButtons = screen.queryAllByText("Тест")
    expect(testButtons).toHaveLength(0)
  })

  it("should display all separator elements", () => {
    render(<DevelopmentTab />)

    const separators = document.querySelectorAll('[role="none"]')
    expect(separators).toHaveLength(2)
  })

  it("should maintain separate state for each API key input", async () => {
    render(<DevelopmentTab />)

    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")
    const tauriInput = screen.getByPlaceholderText("your_tauri_analytics_key")

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "codecov-key" } })
    })

    act(() => {
      fireEvent.change(tauriInput, { target: { value: "tauri-key" } })
    })

    expect(codecovInput).toHaveValue("codecov-key")
    expect(tauriInput).toHaveValue("tauri-key")

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("codecov", "codecov-key")
      expect(mockSaveSimpleApiKey).toHaveBeenCalledWith("tauri_analytics", "tauri-key")
    })
  })

  it("should load different values for different services", () => {
    mockGetApiKeyInfo.mockReturnValueOnce({ has_value: true }).mockReturnValueOnce({ has_value: false })

    render(<DevelopmentTab />)

    // The inputs are password type, so we need to find them by placeholder
    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")
    const tauriInput = screen.getByPlaceholderText("your_tauri_analytics_key")

    expect(codecovInput).toHaveValue("••••••••••••••••••••••••••••••••••••••••••••••••••••")
    expect(tauriInput).toHaveValue("")
  })

  it("should handle multiple quick changes correctly", async () => {
    render(<DevelopmentTab />)

    const codecovInput = screen.getByPlaceholderText("your_codecov_token_here")

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "test-1" } })
    })

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "test-12" } })
    })

    act(() => {
      fireEvent.change(codecovInput, { target: { value: "test-123" } })
    })

    await waitFor(() => {
      expect(mockSaveSimpleApiKey).toHaveBeenLastCalledWith("codecov", "test-123")
    })
  })

  it("should render development warning box with correct styling", () => {
    render(<DevelopmentTab />)

    const warningBox = screen.getByText("Режим разработки").parentElement
    expect(warningBox).toHaveClass("bg-amber-50")
    expect(warningBox).toHaveClass("border-amber-200")
  })
})
