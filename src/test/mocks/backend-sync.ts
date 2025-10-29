import { vi } from "vitest"

// Mock implementation of BackendSync
export const mockBackendSync = {
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  isConnected: vi.fn().mockReturnValue(true),
  executeCommand: vi.fn().mockResolvedValue({ success: true, error: null, data: null }),
  getProjectState: vi.fn().mockResolvedValue({
    version: 1,
    version_info: {
      current_version_id: "initial",
      branch_name: "main",
      has_uncommitted_changes: false,
      last_snapshot_time: new Date().toISOString(),
      auto_save_enabled: true,
      auto_save_interval_seconds: 30,
    },
  }),
  createSnapshot: vi.fn().mockResolvedValue({ success: true, error: null, data: { version_id: "test-snap" } }),
  restoreVersion: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  getVersionHistory: vi.fn().mockResolvedValue({ success: true, error: null, data: { versions: [] } }),
  compareVersions: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  createBranch: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  switchBranch: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  setAutoSaveInterval: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  enableAutoSave: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  mergeBranch: vi.fn().mockResolvedValue({ success: true, error: null, data: {} }),
  onEvent: vi.fn(() => () => {}),
  onStateChange: vi.fn(() => () => {}),
  sendCommand: vi.fn(),
}

// Mock getBackendSync to always return the mock instance
export const getBackendSync = vi.fn(() => mockBackendSync)

// Mock BackendSync class constructor
export const BackendSync = vi.fn().mockImplementation(() => mockBackendSync)

// Auto-mock the module
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync,
  BackendSync,
}))
