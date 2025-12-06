import { resetDialogMocks } from "./dialog"
import { resetEventMocks } from "./event"
import { mockFileSystem } from "./fs"
import { resetPathMocks } from "./path"
import { resetNotificationMocks } from "./plugins/notification"
import { resetStoreMocks } from "./store"

// Import all Tauri mocks to ensure they're initialized
import "./core"

// Tauri API mocks
// export * from './core';
// export * from './dialog';
// export * from './fs';
// export * from './path';
// export * from './store';

// Re-export commonly used mocks for convenience
export { createTauriMock, mockConvertFileSrc, mockInvoke, setupTauriCommand } from "./core"
export { dialogPresets, mockOpen, mockSave, resetDialogMocks } from "./dialog"
export { mockEmit, mockListen, mockOnce, resetEventMocks, setupEventListener, simulateEvent } from "./event"
export { MockFileSystem, mockFileSystem, mockFs } from "./fs"
export { mockPath, pathPresets, resetPathMocks } from "./path"
export {
  isPermissionGranted,
  requestPermission,
  resetNotificationMocks,
  sendNotification,
  setPermissionDenied,
  setPermissionGranted,
} from "./plugins/notification"
export { MockStore, mockStore, resetStoreMocks, storePresets } from "./store"

// Helper to reset all Tauri mocks
export function resetAllTauriMocks() {
  resetDialogMocks()
  resetEventMocks()
  resetPathMocks()
  resetStoreMocks()
  resetNotificationMocks()
  mockFileSystem.reset()
}
