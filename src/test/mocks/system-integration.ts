import { vi } from "vitest"

// Mock UpdateService для предотвращения ошибок инициализации
vi.mock("@/domains/system-integration/services/updates/update-service", () => ({
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
}))

// Mock update-machine with proper XState v5 structure
vi.mock("@/domains/system-integration/machines/update-machine", () => ({
  updateMachine: {
    id: "update",
    config: {
      id: "update",
      initial: "idle",
      states: {
        idle: {},
        checking: {},
        available: {},
        downloading: {},
        ready: {},
        error: {},
      },
    },
    // XState v5 требует эти методы
    getInitialSnapshot: vi.fn(() => ({
      value: "idle",
      context: {},
      matches: vi.fn(() => false),
    })),
    transition: vi.fn((state, event) => state),
    resolveState: vi.fn((state) => state),
    getPersistedSnapshot: vi.fn((snapshot) => snapshot),
    restoreSnapshot: vi.fn((snapshot) => snapshot),
  },
  createUpdateActor: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    send: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    getSnapshot: vi.fn(() => ({
      value: "idle",
      context: {},
      matches: vi.fn(() => false),
    })),
  })),
}))
