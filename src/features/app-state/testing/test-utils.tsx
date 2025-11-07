/**
 * Test utilities for app-state module
 *
 * Provides helper functions and custom render methods for testing app-state components
 * with proper backend integration mocks.
 */

import { type RenderOptions, type RenderResult, render } from "@testing-library/react"
import type React from "react"
import type { ReactElement } from "react"
import { vi } from "vitest"
import { createLogger } from "@/lib/tauri-logger"
import type { CommandResult, ProjectCommand } from "@/types/generated/tauri-bindings"
import { createTestScenarios, MockBackendProvider, type MockProjectState } from "./mock-backend-provider"

const logger = createLogger({ module: "TestUtils" })

// Re-export will be done later in the file to avoid duplicates

// Mock hook for test components
export function useMockBackend() {
  return {
    executeCommand: vi.fn(),
    getProjectState: vi.fn(),
    getEventHistory: vi.fn(),
  }
}

// Remove duplicate exports - they are defined later in the file

// Mock Tauri API globally for all tests
const mockInvoke = vi.fn()
const mockListen = vi.fn()
const mockEmit = vi.fn()

// Setup global Tauri mocks
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
  emit: mockEmit,
}))

// Extended render options for app-state testing
interface AppStateRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // Mock backend configuration
  mockBackend?: {
    initialState?: Partial<MockProjectState>
    onCommand?: (command: ProjectCommand) => CommandResult | Promise<CommandResult>
  }

  // Additional providers (for integration tests)
  additionalProviders?: React.ComponentType<{ children: React.ReactNode }>[]
}

/**
 * Custom render function for app-state components
 * Automatically wraps components with necessary providers and mocks
 */
export function renderWithAppState(
  ui: ReactElement,
  options: AppStateRenderOptions = {},
): RenderResult & {
  // Additional utilities returned with render result
  mockBackend: {
    executeCommand: ReturnType<typeof vi.fn>
    getProjectState: ReturnType<typeof vi.fn>
    getEventHistory: ReturnType<typeof vi.fn>
  }
} {
  const { mockBackend, additionalProviders = [], ...renderOptions } = options

  // Create wrapper with all necessary providers
  function AllTheProviders({ children }: { children: React.ReactNode }) {
    let wrappedChildren = <MockBackendProvider {...mockBackend}>{children}</MockBackendProvider>

    // Apply additional providers from outside to inside
    for (const Provider of additionalProviders.reverse()) {
      wrappedChildren = <Provider>{wrappedChildren}</Provider>
    }

    return wrappedChildren
  }

  const renderResult = render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  })

  return {
    ...renderResult,
    mockBackend: {
      executeCommand: mockInvoke,
      getProjectState: mockInvoke,
      getEventHistory: mockInvoke,
    },
  }
}

/**
 * Setup function for tests that need specific Tauri command mocks
 */
export function setupTauriMocks(commandMocks: Record<string, any> = {}) {
  // Default mocks for common app-state commands
  const defaultMocks = {
    execute_command: vi.fn().mockResolvedValue({
      status: "ok",
      data: { success: true, message: "Command executed successfully" },
    }),
    get_project_state: vi.fn().mockResolvedValue({
      status: "ok",
      data: createTestScenarios.emptyProject(),
    }),
    get_event_history: vi.fn().mockResolvedValue({
      status: "ok",
      data: [],
    }),
    get_app_version: vi.fn().mockResolvedValue("1.0.0-test"),
    greet: vi.fn().mockResolvedValue("Hello from mock!"),
    ...commandMocks,
  }

  mockInvoke.mockImplementation((command: string, args?: any) => {
    const mock = defaultMocks[command as keyof typeof defaultMocks]
    if (mock) {
      return mock(args)
    }
    logger.warn(`Unmocked Tauri command: ${command}`)
    return Promise.resolve({ status: "error", error: `Unmocked command: ${command}` })
  })

  return {
    mockInvoke,
    mockListen,
    mockEmit,
    resetMocks: () => {
      vi.clearAllMocks()
      setupTauriMocks(commandMocks)
    },
  }
}

/**
 * Create mock event listener for Tauri events
 */
export function createMockEventListener(eventName: string, handler: (event: any) => void) {
  const unlisten = vi.fn()

  mockListen.mockImplementation((event: string, callback: (event: any) => void) => {
    if (event === eventName) {
      // Store the callback so we can trigger it in tests
      handler(callback)
    }
    return Promise.resolve(unlisten)
  })

  return {
    unlisten,
    triggerEvent: (payload: any) => {
      // Simulate event trigger
      const mockEvent = {
        event: eventName,
        payload,
        windowLabel: "main",
        id: Date.now(),
      }
      handler(mockEvent)
    },
  }
}

/**
 * Wait for async state updates in tests
 */
export function waitForStateUpdate(_timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0) // Next tick
  })
}

/**
 * Create a mock project state for testing
 */
export function createMockProjectState(overrides: Partial<MockProjectState> = {}): MockProjectState {
  return {
    ...createTestScenarios.emptyProject(),
    ...overrides,
  } as MockProjectState
}

/**
 * Utility to test command execution scenarios
 */
export function createCommandTest(commandType: string, expectedParams?: any, mockResponse?: CommandResult) {
  return {
    command: { type: commandType, params: expectedParams },
    response: mockResponse || { success: true, message: `${commandType} executed` },
    verify: (mockFn: ReturnType<typeof vi.fn>) => {
      expect(mockFn).toHaveBeenCalledWith({
        type: commandType,
        params: expectedParams,
      })
    },
  }
}

/**
 * Test data generators
 */
export const testData = {
  // Generate test project
  project: (id = "test-project") => ({
    id,
    name: `Test Project ${id}`,
    metadata: {
      name: `Test Project ${id}`,
      description: `Generated test project ${id}`,
      created_at: "2025-01-22T12:00:00.000Z",
      modified_at: "2025-01-22T12:00:00.000Z",
      file_path: `/test/${id}.tls`,
      is_dirty: false,
      version: "1.0.0",
    },
  }),

  // Generate test media
  mediaItem: (id = "test-media") => ({
    id,
    name: `Test Media ${id}`,
    path: `/test/media/${id}.mp4`,
    type: "Video" as const,
    duration: 30.0,
    metadata: {
      format: "mp4",
      codec: "h264",
      resolution: { width: 1920, height: 1080 },
      frame_rate: 30.0,
      bitrate: 5000,
      audio_channels: 2,
      sample_rate: 48000,
    },
  }),

  // Generate test clip
  clip: (id = "test-clip") => ({
    id,
    media_id: "test-media",
    track_id: "test-track",
    in_point: 0.0,
    out_point: 10.0,
    start_time: 5.0,
    effects: [],
    transitions: [],
  }),

  // Generate test track
  track: (id = "test-track") => ({
    id,
    name: `Test Track ${id}`,
    track_type: "Video" as const,
    is_visible: true,
    is_muted: false,
    is_locked: false,
    height: 60,
    order: 0,
    clips: [],
  }),
}

/**
 * Common test assertions for app-state
 */
export const assertions = {
  // Verify project state structure
  projectState: (state: any) => {
    expect(state).toHaveProperty("project")
    expect(state).toHaveProperty("ui_state")
    expect(state).toHaveProperty("playback_state")
    expect(state).toHaveProperty("version")
    expect(state).toHaveProperty("version_info")
  },

  // Verify command execution
  commandExecuted: (mockFn: ReturnType<typeof vi.fn>, commandType: string) => {
    expect(mockFn).toHaveBeenCalled()
    const lastCall = mockFn.mock.calls[mockFn.mock.calls.length - 1]
    expect(lastCall[0]).toHaveProperty("type", commandType)
  },

  // Verify event emitted
  eventEmitted: (mockFn: ReturnType<typeof vi.fn>, eventName: string) => {
    expect(mockFn).toHaveBeenCalledWith(expect.stringContaining(eventName), expect.any(Object))
  },
}

// Export commonly used test scenarios
export { createTestScenarios }

// Re-export testing library utilities for convenience
export * from "@testing-library/react"
export { vi } from "vitest"
