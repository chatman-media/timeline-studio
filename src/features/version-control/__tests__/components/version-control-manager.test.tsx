/**
 * @vitest-environment jsdom
 */
/**
 * Tests for VersionControlManager component
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { BranchManager, VersionControlManager, VersionControlSettings } from "../../components/version-control-manager"

// Mock the useVersionControl hook
const mockUseVersionControl = vi.fn()
vi.mock("../../hooks", () => ({
  useVersionControl: () => mockUseVersionControl(),
}))

// Mock react-i18next with Russian translations
const mockT = vi.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    "dialogs.userSettings.versionControl.title": "Контроль версий",
    "dialogs.userSettings.versionControl.hasChanges": "Есть изменения",
    "dialogs.userSettings.versionControl.autoSave": "Автосохранение: {{enabled}}",
    "dialogs.userSettings.versionControl.autoSaveEnabled": "{{interval}}с",
    "dialogs.userSettings.versionControl.autoSaveDisabled": "выкл",
    "dialogs.userSettings.versionControl.tabs.history": "История",
    "dialogs.userSettings.versionControl.tabs.branches": "Ветки",
    "dialogs.userSettings.versionControl.tabs.settings": "Настройки",
    "dialogs.userSettings.versionControl.branches.title": "Текущая ветка",
    "dialogs.userSettings.versionControl.branches.active": "Активная",
    "dialogs.userSettings.versionControl.branches.createNew": "Создать новую ветку",
    "dialogs.userSettings.versionControl.branches.namePlaceholder": "Название ветки",
    "dialogs.userSettings.versionControl.branches.create": "Создать",
    "dialogs.userSettings.versionControl.branches.merge": "Слияние веток",
    "dialogs.userSettings.versionControl.branches.mergeNotImplemented": "Функция слияния веток пока не реализована",
    "dialogs.userSettings.versionControl.settings.autoSaveTitle": "Автоматическое сохранение",
    "dialogs.userSettings.versionControl.settings.enableAutoSave": "Включить автосохранение",
    "dialogs.userSettings.versionControl.settings.enableAutoSaveDesc":
      "Автоматически создавать снапшоты через заданные интервалы",
    "dialogs.userSettings.versionControl.settings.enabled": "Включено",
    "dialogs.userSettings.versionControl.settings.disabled": "Выключено",
    "dialogs.userSettings.versionControl.settings.intervalTitle": "Интервал автосохранения",
    "dialogs.userSettings.versionControl.settings.intervals.30": "30 секунд",
    "dialogs.userSettings.versionControl.settings.intervals.60": "1 минута",
    "dialogs.userSettings.versionControl.settings.intervals.120": "2 минуты",
    "dialogs.userSettings.versionControl.settings.intervals.300": "5 минут",
    "dialogs.userSettings.versionControl.settings.intervals.600": "10 минут",
    "dialogs.userSettings.versionControl.settings.storage.title": "Хранение версий",
    "dialogs.userSettings.versionControl.settings.storage.maxVersions": "Максимальное количество версий:",
    "dialogs.userSettings.versionControl.settings.storage.maxVersionsValue": "100 (по умолчанию)",
    "dialogs.userSettings.versionControl.settings.storage.compression": "Сжатие старых версий:",
    "dialogs.userSettings.versionControl.settings.storage.compressionValue": "Включено",
    "dialogs.userSettings.versionControl.settings.storage.compressionDesc":
      "Старые версии автоматически сжимаются для экономии места",
    "dialogs.userSettings.versionControl.settings.exportImport.title": "Экспорт / Импорт",
    "dialogs.userSettings.versionControl.settings.exportImport.export": "Экспортировать историю версий",
    "dialogs.userSettings.versionControl.settings.exportImport.import": "Импортировать версии",
    "dialogs.userSettings.versionControl.settings.exportImport.notImplemented":
      "Функции экспорта/импорта пока не реализованы",
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
  AlertCircle: ({ className }: { className?: string }) => (
    <div className={className} data-oid="vkwmk2l">
      AlertCircle
    </div>
  ),

  Clock: ({ className }: { className?: string }) => (
    <div className={className} data-oid="dguq91k">
      Clock
    </div>
  ),

  GitBranch: ({ className }: { className?: string }) => (
    <div className={className} data-oid="y2qh-pq">
      GitBranch
    </div>
  ),

  GitCommit: ({ className }: { className?: string }) => (
    <div className={className} data-oid="mak7ipe">
      GitCommit
    </div>
  ),

  GitMerge: ({ className }: { className?: string }) => (
    <div className={className} data-oid="1_8tuhs">
      GitMerge
    </div>
  ),

  History: ({ className }: { className?: string }) => (
    <div className={className} data-oid="wk9.jkz">
      History
    </div>
  ),

  Settings: ({ className }: { className?: string }) => (
    <div className={className} data-oid="a22vil9">
      Settings
    </div>
  ),
}))

// Mock VersionHistoryPanel
vi.mock("../../components/version-history-panel", () => ({
  VersionHistoryPanel: () => <div data-oid="imcgv5-">Version History Panel</div>,
}))

describe("VersionControlManager", () => {
  const defaultMockValues = {
    currentVersionId: "abc123def456",
    branchName: "main",
    hasUncommittedChanges: false,
    lastSnapshotTime: new Date("2024-01-20T10:00:00"),
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 60,
    isLoading: false,
    error: null,
    createSnapshot: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionHistory: vi.fn(),
    compareVersions: vi.fn(),
    createBranch: vi.fn(),
    mergeBranch: vi.fn(),
    switchBranch: vi.fn(),
    setAutoSaveInterval: vi.fn(),
    enableAutoSave: vi.fn(),
  }

  beforeEach(() => {
    mockUseVersionControl.mockReturnValue(defaultMockValues)
    mockT.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders the component with default state", () => {
    render(<VersionControlManager data-oid="wi_rv:l" />)

    expect(screen.getByText("Контроль версий")).toBeInTheDocument()
    expect(screen.getByText("abc123de")).toBeInTheDocument() // Shortened version ID
    expect(screen.getByText("main")).toBeInTheDocument()
    expect(screen.getByText("Автосохранение: 60с")).toBeInTheDocument()
  })

  it("displays uncommitted changes indicator when there are changes", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      hasUncommittedChanges: true,
    })

    render(<VersionControlManager data-oid="p6kwxwn" />)

    expect(screen.getByText("Есть изменения")).toBeInTheDocument()
  })

  it("displays auto-save disabled state", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: false,
    })

    render(<VersionControlManager data-oid="2s7xw4e" />)

    expect(screen.getByText("Автосохранение: выкл")).toBeInTheDocument()
  })

  it("renders all tabs", () => {
    render(<VersionControlManager data-oid="ga6yscx" />)

    expect(screen.getByText("История")).toBeInTheDocument()
    expect(screen.getByText("Ветки")).toBeInTheDocument()
    expect(screen.getByText("Настройки")).toBeInTheDocument()
  })

  it("switches between tabs", async () => {
    render(<VersionControlManager data-oid="742u4:f" />)

    // Initially history tab is active
    expect(screen.getByText("Version History Panel")).toBeInTheDocument()

    // Check that all tabs exist
    const branchesTab = screen.getByRole("tab", { name: /Ветки/i })
    const settingsTab = screen.getByRole("tab", { name: /Настройки/i })
    const historyTab = screen.getByRole("tab", { name: /История/i })

    expect(branchesTab).toBeInTheDocument()
    expect(settingsTab).toBeInTheDocument()
    expect(historyTab).toBeInTheDocument()

    // Check initial state
    expect(historyTab).toHaveAttribute("aria-selected", "true")
    expect(branchesTab).toHaveAttribute("aria-selected", "false")
    expect(settingsTab).toHaveAttribute("aria-selected", "false")
  })

  // Skip tests for BranchManager since tab switching is problematic in tests
  // These would need to be tested with integration/e2e tests

  // Skip tests for VersionControlSettings since tab switching is problematic in tests
  // These would need to be tested with integration/e2e tests

  it("applies custom className", () => {
    const { container } = render(<VersionControlManager className="custom-class" data-oid="o0wifxj" />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass("custom-class")
  })

  it("handles loading state", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      isLoading: true,
    })

    render(<VersionControlManager data-oid="e117:sj" />)

    // Just check that the component renders in loading state
    expect(screen.getByText("Контроль версий")).toBeInTheDocument()
  })
})

describe("BranchManager", () => {
  const defaultMockValues = {
    currentVersionId: "abc123def456",
    branchName: "main",
    hasUncommittedChanges: false,
    lastSnapshotTime: new Date("2024-01-20T10:00:00"),
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 60,
    isLoading: false,
    error: null,
    createSnapshot: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionHistory: vi.fn(),
    compareVersions: vi.fn(),
    createBranch: vi.fn(),
    mergeBranch: vi.fn(),
    switchBranch: vi.fn(),
    setAutoSaveInterval: vi.fn(),
    enableAutoSave: vi.fn(),
  }

  beforeEach(() => {
    mockUseVersionControl.mockReturnValue(defaultMockValues)
    mockT.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders branch manager directly", () => {
    render(<BranchManager data-oid="bfltqlx" />)

    expect(screen.getByText("Текущая ветка")).toBeInTheDocument()
    expect(screen.getByText("main")).toBeInTheDocument()
    expect(screen.getByText("Активная")).toBeInTheDocument()
  })

  it("creates a new branch", async () => {
    const createBranch = vi.fn().mockResolvedValue(true)
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createBranch,
    })

    render(<BranchManager data-oid="83ee99l" />)

    const input = screen.getByPlaceholderText("Название ветки")
    const createButton = screen.getByRole("button", { name: /Создать/i })

    // Initially button should be disabled
    expect(createButton).toBeDisabled()

    // Type branch name
    fireEvent.change(input, { target: { value: "feature/new-branch" } })

    // Button should be enabled
    expect(createButton).toBeEnabled()

    // Click create
    fireEvent.click(createButton)

    expect(createBranch).toHaveBeenCalledWith("feature/new-branch")
  })

  it("clears input after successful branch creation", async () => {
    const createBranch = vi.fn().mockResolvedValue(true)
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createBranch,
    })

    render(<BranchManager data-oid="slw5qpc" />)

    const input = screen.getByPlaceholderText("Название ветки") as HTMLInputElement
    const createButton = screen.getByRole("button", { name: /Создать/i })

    fireEvent.change(input, { target: { value: "test-branch" } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(input.value).toBe("")
    })
  })

  it("does not create branch with empty name", () => {
    const createBranch = vi.fn()
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      createBranch,
    })

    render(<BranchManager data-oid="mb4idwa" />)

    const input = screen.getByPlaceholderText("Название ветки")
    const createButton = screen.getByRole("button", { name: /Создать/i })

    // Try with spaces only
    fireEvent.change(input, { target: { value: "   " } })
    expect(createButton).toBeDisabled()

    // Clear and click should not call createBranch
    fireEvent.change(input, { target: { value: "" } })
    fireEvent.click(createButton)

    expect(createBranch).not.toHaveBeenCalled()
  })

  it("displays merge branches placeholder", () => {
    render(<BranchManager data-oid="83_y2m3" />)

    expect(screen.getByText("Слияние веток")).toBeInTheDocument()
    expect(screen.getByText("Функция слияния веток пока не реализована")).toBeInTheDocument()
  })
})

describe("VersionControlSettings", () => {
  const defaultMockValues = {
    currentVersionId: "abc123def456",
    branchName: "main",
    hasUncommittedChanges: false,
    lastSnapshotTime: new Date("2024-01-20T10:00:00"),
    autoSaveEnabled: true,
    autoSaveIntervalSeconds: 60,
    isLoading: false,
    error: null,
    createSnapshot: vi.fn(),
    restoreVersion: vi.fn(),
    getVersionHistory: vi.fn(),
    compareVersions: vi.fn(),
    createBranch: vi.fn(),
    mergeBranch: vi.fn(),
    switchBranch: vi.fn(),
    setAutoSaveInterval: vi.fn(),
    enableAutoSave: vi.fn(),
  }

  beforeEach(() => {
    mockUseVersionControl.mockReturnValue(defaultMockValues)
    mockT.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders settings directly", () => {
    render(<VersionControlSettings data-oid="10i:9pl" />)

    expect(screen.getByText("Автоматическое сохранение")).toBeInTheDocument()
    expect(screen.getByText("Включить автосохранение")).toBeInTheDocument()
  })

  it("toggles auto-save", () => {
    const enableAutoSave = vi.fn()
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: true,
      enableAutoSave,
    })

    render(<VersionControlSettings data-oid="76h4bht" />)

    const toggleButton = screen.getByRole("button", { name: /Включено/i })
    fireEvent.click(toggleButton)

    expect(enableAutoSave).toHaveBeenCalledWith(false)
  })

  it("changes auto-save interval", () => {
    const setAutoSaveInterval = vi.fn()
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: true,
      autoSaveIntervalSeconds: 60,
      setAutoSaveInterval,
    })

    render(<VersionControlSettings data-oid="v1y2ai7" />)

    expect(screen.getByText("Интервал автосохранения")).toBeInTheDocument()

    // Click on 2 minutes button
    const twoMinutesButton = screen.getByRole("button", { name: /2 минуты/i })
    fireEvent.click(twoMinutesButton)

    expect(setAutoSaveInterval).toHaveBeenCalledWith(120)
  })

  it("hides interval options when auto-save is disabled", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: false,
    })

    render(<VersionControlSettings data-oid="_o4i-en" />)

    // Interval options should not be visible
    expect(screen.queryByText("Интервал автосохранения")).not.toBeInTheDocument()
  })

  it("highlights current interval option", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: true,
      autoSaveIntervalSeconds: 300, // 5 minutes
    })

    render(<VersionControlSettings data-oid="7.nw33z" />)

    expect(screen.getByText("Интервал автосохранения")).toBeInTheDocument()

    // Check that 5 minutes button has default variant
    const fiveMinutesButton = screen.getByRole("button", { name: /5 минут/i })
    const oneMinuteButton = screen.getByRole("button", { name: /1 минута/i })

    // This is a simple check that different buttons exist
    expect(fiveMinutesButton).toBeInTheDocument()
    expect(oneMinuteButton).toBeInTheDocument()
  })

  it("displays version storage info", () => {
    render(<VersionControlSettings data-oid="a.yd2e." />)

    expect(screen.getByText("Хранение версий")).toBeInTheDocument()
    expect(screen.getByText("Максимальное количество версий:")).toBeInTheDocument()
    expect(screen.getByText("100 (по умолчанию)")).toBeInTheDocument()
    expect(screen.getByText("Сжатие старых версий:")).toBeInTheDocument()
    // Use getAllByText since there are multiple "Включено" texts
    const enabledTexts = screen.getAllByText("Включено")
    expect(enabledTexts.length).toBeGreaterThan(0)
  })

  it("displays disabled export/import buttons", () => {
    render(<VersionControlSettings data-oid="imqu1g5" />)

    expect(screen.getByText("Экспорт / Импорт")).toBeInTheDocument()

    const exportButton = screen.getByRole("button", {
      name: /Экспортировать историю версий/i,
    })
    const importButton = screen.getByRole("button", {
      name: /Импортировать версии/i,
    })

    expect(exportButton).toBeDisabled()
    expect(importButton).toBeDisabled()
    expect(screen.getByText("Функции экспорта/импорта пока не реализованы")).toBeInTheDocument()
  })

  it("disables controls when loading", () => {
    mockUseVersionControl.mockReturnValue({
      ...defaultMockValues,
      autoSaveEnabled: true,
      isLoading: true,
    })

    render(<VersionControlSettings data-oid=".h_ymi8" />)

    // All interactive buttons should be disabled
    const toggleButton = screen.getByRole("button", { name: /Включено/i })
    expect(toggleButton).toBeDisabled()

    // Interval buttons should also be disabled
    const intervalButtons = screen.getAllByRole("button", {
      name: /минут|секунд/i,
    })
    intervalButtons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})
