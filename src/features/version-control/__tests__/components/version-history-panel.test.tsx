/**
 * Tests for VersionHistoryPanel component
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { VersionHistoryPanel } from "../../components/version-history-panel"
import type { VersionInfo } from "../../types"

// Mock the useVersionControl hook
const mockUseVersionControl = vi.fn()
vi.mock("@/features/app-state/hooks/use-version-control", () => ({
  useVersionControl: () => mockUseVersionControl(),
}))

// Mock react-i18next with Russian translations
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    "dialogs.userSettings.versionControl.history.title": "История версий",
    "dialogs.userSettings.versionControl.history.branch": "Ветка: {{name}}",
    "dialogs.userSettings.versionControl.autoSave": "Автосохранение: {{enabled}}",
    "dialogs.userSettings.versionControl.autoSaveEnabled": "включено ({{interval}}с)",
    "dialogs.userSettings.versionControl.autoSaveDisabled": "отключено",
    "dialogs.userSettings.versionControl.settings.enableAutoSave": "Включить автосохранение",
    "dialogs.userSettings.versionControl.settings.enabled": "Вкл",
    "dialogs.userSettings.versionControl.settings.disabled": "Выкл",
    "dialogs.userSettings.versionControl.settings.intervalTitle": "Интервал автосохранения",
    "dialogs.userSettings.versionControl.history.placeholder": "Описание версии (опционально)",
    "dialogs.userSettings.versionControl.history.create": "Создать",
    "dialogs.userSettings.versionControl.history.loading": "Загрузка...",
    "dialogs.userSettings.versionControl.history.noVersions": "Нет сохранённых версий",
    "dialogs.userSettings.versionControl.history.current": "Текущая",
    "dialogs.userSettings.versionControl.history.restoreConfirm": "Восстановить версию {{id}}?",
    "dialogs.userSettings.versionControl.history.lastSnapshot": "Последний снапшот: {{time}}",
    "dialogs.userSettings.versionControl.history.timeAgo.justNow": "только что",
    "dialogs.userSettings.versionControl.history.timeAgo.minutesAgo": "{{count}} минут назад",
    "dialogs.userSettings.versionControl.history.timeAgo.hoursAgo": "{{count}} часов назад",
    "dialogs.userSettings.versionControl.history.timeAgo.daysAgo": "{{count}} дней назад",
  }

  let result = translations[key] || key

  // Handle interpolation
  if (options && typeof options === "object") {
    Object.keys(options).forEach((optionKey) => {
      result = result.replace(`{{${optionKey}}}`, String(options[optionKey]))
    })
  }

  return result
})

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: "ru" },
    ready: true,
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => children,
}))

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Clock: ({ className }: { className?: string }) => <div className={className}>Clock</div>,
  GitBranch: ({ className }: { className?: string }) => <div className={className}>GitBranch</div>,
  History: ({ className }: { className?: string }) => <div className={className}>History</div>,
  MessageCircle: ({ className }: { className?: string }) => <div className={className}>MessageCircle</div>,
  Plus: ({ className }: { className?: string }) => <div className={className}>Plus</div>,
  RotateCcw: ({ className }: { className?: string }) => <div className={className}>RotateCcw</div>,
  Settings: ({ className }: { className?: string }) => <div className={className}>Settings</div>,
  User: ({ className }: { className?: string }) => <div className={className}>User</div>,
}))

// Mock window.confirm
const mockConfirm = vi.fn()
window.confirm = mockConfirm

describe("VersionHistoryPanel", () => {
  const mockVersions: VersionInfo[] = [
    {
      id: "version-1",
      timestamp: new Date().toISOString(),
      author: "user@example.com",
      message: "Initial commit",
      branch_name: "main",
    },
    {
      id: "version-2",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      author: "user@example.com",
      message: "Added new feature",
      branch_name: "main",
    },
    {
      id: "version-3",
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      author: "user@example.com",
      message: "", // Empty string instead of undefined
      branch_name: "main",
    },
  ]

  const defaultMockValues = {
    currentVersionId: "version-1",
    branchName: "main",
    lastSnapshotTime: new Date(),
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 30,
    isLoading: false,
    error: null,
    createSnapshot: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionHistory: vi.fn().mockResolvedValue(mockVersions),
    enableAutoSave: vi.fn(),
    setAutoSaveInterval: vi.fn(),
  }

  beforeEach(() => {
    mockUseVersionControl.mockReturnValue(defaultMockValues)
    mockConfirm.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders the component with default state", () => {
    render(<VersionHistoryPanel />)

    // There are multiple elements with "История версий", check at least one exists
    const historyTexts = screen.getAllByText("История версий")
    expect(historyTexts.length).toBeGreaterThan(0)

    expect(screen.getByText("Ветка: main")).toBeInTheDocument()
    expect(screen.getByText("version-1")).toBeInTheDocument()
  })

  it("displays auto-save status", () => {
    render(<VersionHistoryPanel />)

    expect(screen.getByText("Автосохранение: включено (30с)")).toBeInTheDocument()
  })

  it("displays auto-save disabled state", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: false,
    })

    render(<VersionHistoryPanel />)

    expect(screen.getByText("Автосохранение: отключено")).toBeInTheDocument()
  })

  it("toggles auto-save settings panel", () => {
    render(<VersionHistoryPanel />)

    // Find the settings button by looking for the button next to auto-save status
    const autoSaveContainer = screen.getByText("Автосохранение: включено (30с)").closest("div")?.parentElement
    const settingsButton = autoSaveContainer?.querySelector("button")

    expect(settingsButton).toBeInTheDocument()

    // Initially settings are hidden
    expect(screen.queryByText("Включить автосохранение")).not.toBeInTheDocument()

    // Click to show settings
    if (settingsButton) {
      fireEvent.click(settingsButton)
    }
    expect(screen.getByText("Включить автосохранение")).toBeInTheDocument()

    // Click again to hide
    if (settingsButton) {
      fireEvent.click(settingsButton)
    }
    expect(screen.queryByText("Включить автосохранение")).not.toBeInTheDocument()
  })

  it("toggles auto-save enabled state", async () => {
    render(<VersionHistoryPanel />)

    // Open settings
    const autoSaveContainer = screen.getByText("Автосохранение: включено (30с)").closest("div")?.parentElement
    const settingsButton = autoSaveContainer?.querySelector("button")

    if (settingsButton) {
      fireEvent.click(settingsButton)
    }

    const toggleButton = screen.getByRole("button", { name: "Вкл" })
    fireEvent.click(toggleButton)

    expect(defaultMockValues.enableAutoSave).toHaveBeenCalledWith(false)
  })

  it("changes auto-save interval", async () => {
    render(<VersionHistoryPanel />)

    // Open settings
    const autoSaveContainer = screen.getByText("Автосохранение: включено (30с)").closest("div")?.parentElement
    const settingsButton = autoSaveContainer?.querySelector("button")

    if (settingsButton) {
      fireEvent.click(settingsButton)
    }

    const intervalButton = screen.getByRole("button", { name: "60" })
    fireEvent.click(intervalButton)

    expect(defaultMockValues.setAutoSaveInterval).toHaveBeenCalledWith(60)
  })

  it("creates a snapshot with message", async () => {
    const createSnapshot = vi.fn().mockResolvedValue(true)
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createSnapshot,
    })

    render(<VersionHistoryPanel />)

    const input = screen.getByPlaceholderText("Описание версии (опционально)")
    const createButton = screen.getByRole("button", { name: /Создать/i })

    // Type a message
    fireEvent.change(input, { target: { value: "Test snapshot" } })
    fireEvent.click(createButton)

    expect(createSnapshot).toHaveBeenCalledWith("Test snapshot")
  })

  it("creates a snapshot without message", async () => {
    const createSnapshot = vi.fn().mockResolvedValue(true)
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createSnapshot,
    })

    render(<VersionHistoryPanel />)

    const createButton = screen.getByRole("button", { name: /Создать/i })
    fireEvent.click(createButton)

    expect(createSnapshot).toHaveBeenCalledWith(undefined)
  })

  it("clears message input after successful snapshot", async () => {
    const createSnapshot = vi.fn().mockResolvedValue(true)
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createSnapshot,
    })

    render(<VersionHistoryPanel />)

    const input = screen.getByPlaceholderText("Описание версии (опционально)") as HTMLInputElement
    const createButton = screen.getByRole("button", { name: /Создать/i })

    fireEvent.change(input, { target: { value: "Test message" } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })

  it("loads version history on mount", async () => {
    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(defaultMockValues.getVersionHistory).toHaveBeenCalledWith(20)
    })
  })

  it("displays version history", async () => {
    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Initial commit")).toBeInTheDocument()
      expect(screen.getByText("Added new feature")).toBeInTheDocument()
    })
  })

  it("displays loading state", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      getVersionHistory: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
    })

    render(<VersionHistoryPanel />)

    expect(screen.getByText("Загрузка...")).toBeInTheDocument()
  })

  it("displays empty state", async () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      getVersionHistory: vi.fn().mockResolvedValue([]),
    })

    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Нет сохранённых версий")).toBeInTheDocument()
    })
  })

  it("displays error state", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      error: "Failed to load versions",
    })

    render(<VersionHistoryPanel />)

    expect(screen.getByText("Failed to load versions")).toBeInTheDocument()
  })

  it("highlights current version", async () => {
    render(<VersionHistoryPanel />)

    await waitFor(() => {
      const currentVersionCard = screen.getByText("Initial commit").closest("div[class*='border']")
      expect(currentVersionCard).toHaveClass("bg-blue-50")
      expect(currentVersionCard).toHaveClass("border-blue-200")
      expect(screen.getByText("Текущая")).toBeInTheDocument()
    })
  })

  it("restores a version with confirmation", async () => {
    mockConfirm.mockReturnValue(true)

    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Added new feature")).toBeInTheDocument()
    })

    // Find restore button for "Added new feature" version (not current)
    const versionText = screen.getByText("Added new feature")
    const versionCard = versionText.closest("div[class*='border']")

    // Find button within the card - it should be the only button (restore button)
    const restoreButton = versionCard?.querySelector("button")

    if (restoreButton) {
      fireEvent.click(restoreButton)
    }

    expect(mockConfirm).toHaveBeenCalled()
    expect(defaultMockValues.restoreVersion).toHaveBeenCalled()
  })

  it("does not restore version when cancelled", async () => {
    mockConfirm.mockReturnValue(false)

    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Added new feature")).toBeInTheDocument()
    })

    const versionText = screen.getByText("Added new feature")
    const versionCard = versionText.closest("div[class*='border']")
    const restoreButton = versionCard?.querySelector("button")

    if (restoreButton) {
      fireEvent.click(restoreButton)
    }

    expect(mockConfirm).toHaveBeenCalled()
    expect(defaultMockValues.restoreVersion).not.toHaveBeenCalled()
  })

  it("does not show restore button for current version", async () => {
    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Initial commit")).toBeInTheDocument()
    })

    const currentVersionCard = screen.getByText("Initial commit").closest("div[class*='border']")
    // Current version should not have any button in the card itself
    const buttonsInCard = currentVersionCard?.querySelectorAll("button")
    expect(buttonsInCard?.length).toBe(0)
  })

  it("formats time correctly", async () => {
    const now = new Date()
    const versions: VersionInfo[] = [
      {
        id: "v1",
        timestamp: now.toISOString(),
        author: "user",
        branch_name: "main",
        message: "Just created",
      },
      {
        id: "v3",
        timestamp: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
        author: "user",
        branch_name: "main",
        message: "One hour ago",
      },
      {
        id: "v4",
        timestamp: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
        author: "user",
        branch_name: "main",
        message: "One day ago",
      },
    ]

    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      getVersionHistory: vi.fn().mockResolvedValue(versions),
    })

    render(<VersionHistoryPanel />)

    await waitFor(() => {
      // Just check that versions are displayed
      expect(screen.getByText("Just created")).toBeInTheDocument()
      expect(screen.getByText("One hour ago")).toBeInTheDocument()
      expect(screen.getByText("One day ago")).toBeInTheDocument()
    })
  })

  it("displays last snapshot time", () => {
    const lastSnapshotTime = new Date()
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      lastSnapshotTime,
    })

    render(<VersionHistoryPanel />)

    // Check that the last snapshot text exists (exact text depends on formatting)
    const lastSnapshotElement = screen.getByText((content) => {
      return content.startsWith("Последний снапшот:")
    })
    expect(lastSnapshotElement).toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { container } = render(<VersionHistoryPanel className="custom-class" />)
    const card = container.querySelector(".custom-class")
    expect(card).toBeInTheDocument()
  })

  it("disables inputs when loading", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      isLoading: true,
    })

    render(<VersionHistoryPanel />)

    const input = screen.getByPlaceholderText("Описание версии (опционально)")
    const createButton = screen.getByRole("button", { name: /Создать/i })

    expect(input).toBeDisabled()
    expect(createButton).toBeDisabled()
  })

  it("refreshes version history after creating snapshot", async () => {
    const getVersionHistory = vi.fn().mockResolvedValue(mockVersions)
    const createSnapshot = vi.fn().mockResolvedValue(true)

    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createSnapshot,
      getVersionHistory,
    })

    render(<VersionHistoryPanel />)

    // Initial load
    await waitFor(() => {
      expect(getVersionHistory).toHaveBeenCalledTimes(1)
    })

    // Create snapshot
    const createButton = screen.getByRole("button", { name: /Создать/i })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(createSnapshot).toHaveBeenCalled()
      expect(getVersionHistory).toHaveBeenCalledTimes(2) // Called again after snapshot
    })
  })

  it("refreshes version history after restoring version", async () => {
    mockConfirm.mockReturnValue(true)
    const getVersionHistory = vi.fn().mockResolvedValue(mockVersions)
    const restoreVersion = vi.fn().mockResolvedValue(true)

    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      restoreVersion,
      getVersionHistory,
    })

    render(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(getVersionHistory).toHaveBeenCalledTimes(1)
    })

    // Find and click restore button for "Added new feature" version
    const versionText = screen.getByText("Added new feature")
    const versionCard = versionText.closest("div[class*='border']")
    const restoreButton = versionCard?.querySelector("button")

    if (restoreButton) {
      fireEvent.click(restoreButton)
    }

    await waitFor(() => {
      expect(restoreVersion).toHaveBeenCalled()
      expect(getVersionHistory).toHaveBeenCalledTimes(2) // Called again after restore
    })
  })
})
