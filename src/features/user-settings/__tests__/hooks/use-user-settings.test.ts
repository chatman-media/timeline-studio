import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUserSettings } from "../../hooks/use-user-settings"

// Мокаем доменный хук, так как адаптер завязан на него
const mockDomain = {
  // значения
  activeTab: "media" as const,
  layoutMode: "default" as const,
  screenshotsPath: "/path/to/screenshots",
  playerScreenshotsPath: "/path/to/player/screenshots",
  playerVolume: 50,
  openAiApiKey: "",
  claudeApiKey: "",
  isBrowserVisible: true,
  isTimelineVisible: true,
  isOptionsVisible: false,

  // GPU/Perf
  gpuAccelerationEnabled: false,
  preferredGpuEncoder: "auto",
  maxConcurrentJobs: 1,
  renderQuality: "medium",
  backgroundRenderingEnabled: false,
  renderDelay: 0,

  // Proxy
  proxyEnabled: false,
  proxyType: "http",
  proxyHost: "",
  proxyPort: "",
  proxyUsername: "",
  proxyPassword: "",

  // Auto-save
  autoSaveEnabled: true,
  autoSaveInterval: 300,

  // методы обновления
  updateLayoutMode: vi.fn(),
  updateActiveTab: vi.fn(),
  updateOpenAiApiKey: vi.fn(),
  updateClaudeApiKey: vi.fn(),
  updateGpuAcceleration: vi.fn(),
  updateAutoSave: vi.fn(),
  updateAutoSaveInterval: vi.fn(),
  updatePlayerVolume: vi.fn(),
  updateScreenshotsPath: vi.fn(),
  updatePlayerScreenshotsPath: vi.fn(),
  updateSettings: vi.fn(),

  // тумблеры
  toggleBrowserVisibility: vi.fn(),
  toggleTimelineVisibility: vi.fn(),
  toggleOptionsVisibility: vi.fn(),
}

vi.mock("@/domains/project-management", () => ({
  useUserSettings: () => mockDomain,
}))

beforeEach(() => {
  // Сбрасываем все вызовы моков перед каждым тестом
  Object.values(mockDomain).forEach((v) => {
    if (typeof v === "function") (v as any).mockClear?.()
  })
})

describe("useUserSettings (adapter)", () => {
  it("возвращает значения из доменного стора без обязательного провайдера", () => {
    const { result } = renderHook(() => useUserSettings())

    expect(result.current.layoutMode).toBe("default")
    expect(result.current.isBrowserVisible).toBe(true)
    expect(result.current.playerVolume).toBe(50)
  })

  it("проксирует toggle*-методы", () => {
    const { result } = renderHook(() => useUserSettings())

    result.current.toggleBrowserVisibility()
    expect(mockDomain.toggleBrowserVisibility).toHaveBeenCalledTimes(1)

    result.current.toggleTimelineVisibility()
    expect(mockDomain.toggleTimelineVisibility).toHaveBeenCalledTimes(1)

    result.current.toggleOptionsVisibility()
    expect(mockDomain.toggleOptionsVisibility).toHaveBeenCalledTimes(1)
  })

  it("маппит handle*-методы на доменные апдейтеры", () => {
    const { result } = renderHook(() => useUserSettings())

    result.current.handleLayoutChange("default")
    expect(mockDomain.updateLayoutMode).toHaveBeenCalledWith("default")

    result.current.handleScreenshotsPathChange("/new")
    expect(mockDomain.updateScreenshotsPath).toHaveBeenCalledWith("/new")

    result.current.handlePlayerVolumeChange(80)
    expect(mockDomain.updatePlayerVolume).toHaveBeenCalledWith(80)

    result.current.handleAiApiKeyChange("k1")
    expect(mockDomain.updateOpenAiApiKey).toHaveBeenCalledWith("k1")
  })

  it("валидирует вкладки браузера в handleTabChange", () => {
    const { result } = renderHook(() => useUserSettings())

    result.current.handleTabChange("media")
    expect(mockDomain.updateActiveTab).toHaveBeenCalledWith("media")

    // Неверное значение не должно вызывать апдейтер второй раз
    result.current.handleTabChange("unknown" as any)
    expect(mockDomain.updateActiveTab).toHaveBeenCalledTimes(1)
  })
})
