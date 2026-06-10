import { vi } from "vitest"

// Mock UpdateService для предотвращения ошибок инициализации
vi.mock("@timeline-studio/domains/system-integration/services/updates/update-service", () => ({
  UpdateService: class MockUpdateService {
    static instance: any = null
    static logger = {
      trace: vi.fn(),
      traceSync: vi.fn(),
      debug: vi.fn(),
      debugSync: vi.fn(),
      info: vi.fn(),
      infoSync: vi.fn(),
      warn: vi.fn(),
      warnSync: vi.fn(),
      error: vi.fn(),
      errorSync: vi.fn(),
    }

    static getInstance() {
      if (!MockUpdateService.instance) {
        MockUpdateService.instance = new MockUpdateService()
      }
      return MockUpdateService.instance
    }

    checkForUpdate = vi.fn().mockResolvedValue({
      available: false,
      version: "1.0.0",
    })

    downloadAndInstallUpdate = vi.fn().mockResolvedValue(undefined)

    onUpdateEvent = vi.fn(() => vi.fn())

    getCurrentVersion = vi.fn().mockResolvedValue("1.0.0")

    enableAutoCheck = vi.fn()

    disableAutoCheck = vi.fn()

    cleanup = vi.fn()
  },
  updateService: {
    checkForUpdates: vi.fn().mockResolvedValue({
      available: false,
      current_version: "1.0.0",
      update_info: undefined,
    }),
    downloadAndInstall: vi.fn().mockResolvedValue(undefined),
    getCurrentVersion: vi.fn().mockResolvedValue("1.0.0"),
    isUpdaterAvailable: vi.fn().mockResolvedValue(true),
    enableAutoCheck: vi.fn(),
    disableAutoCheck: vi.fn(),
    getCurrentStatus: vi.fn().mockReturnValue("idle"),
    subscribe: vi.fn().mockReturnValue(() => {}),
    reset: vi.fn(),
    getAutoCheckSettings: vi.fn().mockReturnValue({ enabled: false, intervalMinutes: 60 }),
    dispose: vi.fn(),
  },
}))
